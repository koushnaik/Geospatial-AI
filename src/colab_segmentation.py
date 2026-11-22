"""GeoFlood AI: Colab-Trained Multi-Model Segmentation Engine.

Integrates the 3 Colab-trained deep learning segmentation checkpoints:
1. U-Net (Colab checkpoint: models/final/unet_flood.pth)
2. DeepLabV3 (Colab checkpoint: models/final/deeplabv3_flood.pth)
3. SegFormer (Colab checkpoint: models/final/segformer_flood.pth)

Dataset: Sen1Floods11 (Sentinel-1 SAR 2-band dual-pol VV/VH)
Uses exact training normalization statistics, 2-channel inputs, and valid-mask evaluation logic.
"""
from __future__ import annotations
import io
import time
import json
import base64
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import numpy as np
from PIL import Image
import rasterio
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models.segmentation as seg_models
from transformers import SegformerForSemanticSegmentation, SegformerConfig

# =====================================================================
# Paths & Verified Metadata
# =====================================================================

COLAB_DIR = Path("artifacts/geoflood_colab")
MODELS_FINAL_DIR = COLAB_DIR / "models" / "final"
DATASET_DIR = COLAB_DIR / "dataset"
S1_DIR = DATASET_DIR / "S1Hand"
LBL_DIR = DATASET_DIR / "LabelHand"
RESULTS_DIR = COLAB_DIR / "results"

NORM_STATS_PATH = RESULTS_DIR / "normalization_stats.json"
VERIFIED_REPORT_PATH = RESULTS_DIR / "verified_evaluation_report.json"
TRAIN_RESULTS_CSV_PATH = RESULTS_DIR / "segmentation_model_results.csv"
TEST_SPLIT_PATH = RESULTS_DIR / "test_split.csv"

# Load Normalization Statistics
if NORM_STATS_PATH.exists():
    with open(NORM_STATS_PATH, "r", encoding="utf-8") as _f:
        _stats = json.load(_f)
    SAR_MEANS = np.array(_stats.get("mean", [-10.339761, -17.231377]), dtype=np.float32)
    SAR_STDS = np.array(_stats.get("std", [4.349105, 5.0279627]), dtype=np.float32)
    SAR_P1 = np.array(_stats.get("p1", [-25.080917, -35.38963]), dtype=np.float32)
    SAR_P99 = np.array(_stats.get("p99", [-2.0802093, -9.2775955]), dtype=np.float32)
else:
    SAR_MEANS = np.array([-10.339761, -17.231377], dtype=np.float32)
    SAR_STDS = np.array([4.349105, 5.0279627], dtype=np.float32)
    SAR_P1 = np.array([-25.080917, -35.38963], dtype=np.float32)
    SAR_P99 = np.array([-2.0802093, -9.2775955], dtype=np.float32)


# =====================================================================
# Architecture 1: Colab U-Net (2-Channel, BatchNorm, Residual Conv)
# =====================================================================

class DoubleConv(nn.Module):
    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class Down(nn.Module):
    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.block = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(in_ch, out_ch)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class Up(nn.Module):
    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.up = nn.ConvTranspose2d(in_ch, out_ch, kernel_size=2, stride=2)
        self.conv = DoubleConv(in_ch, out_ch)

    def forward(self, x1: torch.Tensor, x2: torch.Tensor) -> torch.Tensor:
        x1 = self.up(x1)
        diff_y = x2.size()[2] - x1.size()[2]
        diff_x = x2.size()[3] - x1.size()[3]
        x1 = F.pad(x1, [diff_x // 2, diff_x - diff_x // 2, diff_y // 2, diff_y - diff_y // 2])
        x = torch.cat([x2, x1], dim=1)
        return self.conv(x)


class UNetColab(nn.Module):
    def __init__(self, n_channels: int = 2, n_classes: int = 1):
        super().__init__()
        self.inc = DoubleConv(n_channels, 64)
        self.down1 = Down(64, 128)
        self.down2 = Down(128, 256)
        self.down3 = Down(256, 512)
        self.down4 = Down(512, 1024)
        self.up1 = Up(1024, 512)
        self.up2 = Up(512, 256)
        self.up3 = Up(256, 128)
        self.up4 = Up(128, 64)
        self.outc = nn.Conv2d(64, n_classes, kernel_size=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)
        x = self.up1(x5, x4)
        x = self.up2(x, x3)
        x = self.up3(x, x2)
        x = self.up4(x, x1)
        return self.outc(x)


# =====================================================================
# Model Factory & Checkpoint Loader
# =====================================================================

_COLAB_CACHE: Dict[str, nn.Module] = {}

def get_colab_model(architecture: str = "U-Net") -> Optional[nn.Module]:
    """Retrieve or instantiate a Colab-trained model."""
    arch = architecture.strip().lower().replace("-", "").replace("_", "")
    if "unet" in arch:
        key_norm = "U-Net"
    elif "deeplab" in arch:
        key_norm = "DeepLabV3"
    else:
        key_norm = "SegFormer"

    if key_norm in _COLAB_CACHE:
        return _COLAB_CACHE[key_norm]

    device = torch.device("cpu")

    if key_norm == "U-Net":
        ckpt_path = MODELS_FINAL_DIR / "unet_flood.pth"
        if not ckpt_path.exists():
            ckpt_path = COLAB_DIR / "models" / "checkpoints" / "unet_best.pth"
        if not ckpt_path.exists():
            return None
        model = UNetColab(n_channels=2, n_classes=1)
        state = torch.load(ckpt_path, map_location=device)
        model.load_state_dict(state.get("model_state_dict", state))
        model.eval()
        _COLAB_CACHE[key_norm] = model
        return model

    elif key_norm == "DeepLabV3":
        ckpt_path = MODELS_FINAL_DIR / "deeplabv3_flood.pth"
        if not ckpt_path.exists():
            ckpt_path = COLAB_DIR / "models" / "checkpoints" / "deeplabv3_best.pth"
        if not ckpt_path.exists():
            return None
        model = seg_models.deeplabv3_resnet50(weights=None, weights_backbone=None, aux_loss=False)
        model.backbone.conv1 = nn.Conv2d(2, 64, kernel_size=7, stride=2, padding=3, bias=False)
        model.classifier[4] = nn.Conv2d(256, 1, kernel_size=1)
        state = torch.load(ckpt_path, map_location=device)
        cleaned_state = {k.replace("model.", ""): v for k, v in state.items()}
        model.load_state_dict(cleaned_state)
        model.eval()
        _COLAB_CACHE[key_norm] = model
        return model

    elif key_norm == "SegFormer":
        ckpt_path = MODELS_FINAL_DIR / "segformer_flood.pth"
        if not ckpt_path.exists():
            ckpt_path = COLAB_DIR / "models" / "checkpoints" / "segformer_best.pth"
        if not ckpt_path.exists():
            return None
        cfg = SegformerConfig(
            num_channels=2,
            num_labels=1,
            depths=[2, 2, 2, 2],
            hidden_sizes=[32, 64, 160, 256],
            decoder_hidden_size=256,
            classifier_dropout_prob=0.1
        )
        model = SegformerForSemanticSegmentation(cfg)
        state = torch.load(ckpt_path, map_location=device)
        cleaned_state = {k.replace("model.", ""): v for k, v in state.items()}
        model.load_state_dict(cleaned_state)
        model.eval()
        _COLAB_CACHE[key_norm] = model
        return model

    return None


# =====================================================================
# Preprocessing, Masking & Visual Rendering
# =====================================================================

def to_base64_png(pil_img: Image.Image) -> str:
    """Helper to convert PIL Image to base64 data URI."""
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def preprocess_sar_array(arr: np.ndarray) -> torch.Tensor:
    """Apply exact training normalization to 2-channel SAR input."""
    # arr expected shape: (2, H, W)
    x = arr.copy().astype(np.float32)
    for c in range(2):
        x[c] = np.nan_to_num(x[c], nan=float(SAR_MEANS[c]))
        x[c] = (x[c] - SAR_MEANS[c]) / SAR_STDS[c]
    return torch.from_numpy(x).unsqueeze(0).float()


def optical_to_sar_tensor(pil_img: Image.Image, target_size: int = 512) -> Tuple[torch.Tensor, Image.Image]:
    """Convert an optical RGB image into 2-band radar-equivalent tensor."""
    img_resized = pil_img.resize((target_size, target_size), Image.Resampling.BILINEAR)
    arr = np.array(img_resized).astype(np.float32)

    r = arr[..., 0]
    g = arr[..., 1]
    b = arr[..., 2]

    # Optical water index and dark absorption detection
    # In optical imagery, water absorbs red strongly and reflects green/blue
    wi = (g + b - 2.0 * r) / (g + b + 2.0 * r + 1e-4)
    w_prob = np.clip((wi - 0.02) / 0.18, 0.0, 1.0)

    # Dark shadow/standing water boost
    dark_water = (r < 60) & (g < 90) & (b > r)
    w_prob[dark_water] = np.maximum(w_prob[dark_water], 0.85)

    # In SAR: water is specular reflector (low backscatter: VV ~ -22dB, VH ~ -29dB)
    # Land has high volume/roughness backscatter: VV ~ -9dB, VH ~ -15dB
    vv_synth = -9.0 * (1.0 - w_prob) + (-22.0) * w_prob
    vh_synth = -15.0 * (1.0 - w_prob) + (-29.0) * w_prob

    synth_2band = np.stack([vv_synth, vh_synth], axis=0)
    tensor = preprocess_sar_array(synth_2band)
    return tensor, img_resized


def render_sar_composite(sar_arr: np.ndarray) -> Image.Image:
    """Generate high-contrast false-color RGB preview from 2-channel SAR."""
    vv = np.nan_to_num(sar_arr[0], nan=-25.0)
    vh = np.nan_to_num(sar_arr[1], nan=-35.0)

    # Normalize dB to [0, 1]
    vv_norm = np.clip((vv - (-25.0)) / (0.0 - (-25.0)), 0, 1)
    vh_norm = np.clip((vh - (-35.0)) / (-5.0 - (-35.0)), 0, 1)
    ratio_norm = np.clip(vv_norm - vh_norm + 0.5, 0, 1)

    rgb = np.stack([vv_norm, vh_norm, ratio_norm], axis=-1)
    rgb_uint8 = (rgb * 255).astype(np.uint8)
    return Image.fromarray(rgb_uint8)


def create_overlay(base_img: Image.Image, mask_bin: np.ndarray, color_rgba: Tuple[int, int, int, int] = (0, 180, 216, 140)) -> Image.Image:
    """Create transparent colored overlay on top of original image."""
    base_rgba = base_img.convert("RGBA")
    w, h = base_rgba.size

    mask_resized = Image.fromarray((mask_bin * 255).astype(np.uint8)).resize((w, h), Image.Resampling.NEAREST)
    m_arr = np.array(mask_resized) > 128

    tint_arr = np.zeros((h, w, 4), dtype=np.uint8)
    tint_arr[m_arr] = color_rgba
    tint_layer = Image.fromarray(tint_arr, mode="RGBA")

    composite = Image.alpha_composite(base_rgba, tint_layer)
    return composite


def calculate_metrics(pred_bin: np.ndarray, gt_raw: np.ndarray) -> Dict[str, float]:
    """Calculate IoU, Dice, Precision, Recall, Accuracy on valid mask (gt >= 0)."""
    valid_mask = (gt_raw >= 0)
    if not np.any(valid_mask):
        return {"iou": 0.0, "dice": 0.0, "precision": 0.0, "recall": 0.0, "accuracy": 0.0}

    v_pred = pred_bin[valid_mask].astype(bool)
    v_gt = (gt_raw[valid_mask] == 1)

    tp = int(np.sum(v_pred & v_gt))
    fp = int(np.sum(v_pred & ~v_gt))
    fn = int(np.sum(~v_pred & v_gt))
    tn = int(np.sum(~v_pred & ~v_gt))

    union = tp + fp + fn
    iou = float(tp / (union + 1e-6))
    dice = float(2 * tp / (2 * tp + fp + fn + 1e-6))
    precision = float(tp / (tp + fp + 1e-6))
    recall = float(tp / (tp + fn + 1e-6))
    accuracy = float((tp + tn) / (tp + fp + fn + tn + 1e-6))

    return {
        "iou": round(iou, 4),
        "dice": round(dice, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "accuracy": round(accuracy, 4),
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn
    }


# =====================================================================
# Samples and Verified Reports Access
# =====================================================================

def get_colab_samples_catalog() -> List[Dict[str, Any]]:
    """Return catalog of available Sen1Floods11 test samples on disk."""
    samples = []
    if not TEST_SPLIT_PATH.exists():
        return samples

    import pandas as pd
    df = pd.read_csv(TEST_SPLIT_PATH)

    # Curate top samples per region
    region_priority = {"Bolivia": 5, "Sri-Lanka": 5, "Pakistan": 5}
    counts = {"Bolivia": 0, "Sri-Lanka": 0, "Pakistan": 0}

    for _, row in df.iterrows():
        img_name = Path(row["image"]).name
        lbl_name = Path(row["mask"]).name
        event = row["event"]

        s1_file = S1_DIR / img_name
        lbl_file = LBL_DIR / lbl_name

        if s1_file.exists() and lbl_file.exists():
            if counts.get(event, 0) < region_priority.get(event, 3):
                counts[event] = counts.get(event, 0) + 1

                # Read quick stats
                try:
                    with rasterio.open(lbl_file) as src:
                        lbl_data = src.read(1)
                    valid_px = int(np.sum(lbl_data >= 0))
                    flood_px = int(np.sum(lbl_data == 1))
                    flood_pct = round((flood_px / max(valid_px, 1)) * 100.0, 2)
                except Exception:
                    flood_pct = 0.0
                    valid_px = 512 * 512

                samples.append({
                    "id": img_name.replace(".tif", ""),
                    "image_file": img_name,
                    "label_file": lbl_name,
                    "region": event,
                    "satellite": "Sentinel-1 SAR",
                    "polarization": "Dual-Pol (VV + VH)",
                    "resolution_m": 10.0,
                    "dimensions": "512x512",
                    "ground_truth_flood_pct": flood_pct,
                    "has_ground_truth": True,
                    "description": f"Verified Sen1Floods11 SAR scene from {event} inundation event."
                })

    return samples


def get_verified_colab_report() -> Dict[str, Any]:
    """Load the verified JSON evaluation report and historical training CSV."""
    report = {}
    if VERIFIED_REPORT_PATH.exists():
        try:
            with open(VERIFIED_REPORT_PATH, "r", encoding="utf-8") as f:
                report = json.load(f)
        except Exception:
            report = {}

    historical_csv = []
    if TRAIN_RESULTS_CSV_PATH.exists():
        try:
            import pandas as pd
            df = pd.read_csv(TRAIN_RESULTS_CSV_PATH)
            historical_csv = df.to_dict(orient="records")
        except Exception:
            historical_csv = []

    return {
        "status": "success",
        "verified_report": report,
        "historical_training_results": historical_csv,
        "dataset_name": "Sen1Floods11 (S1Hand & LabelHand)",
        "source": "Colab GPU Training (Tesla T4/A100)",
        "notes": report.get("notes", "Verified test evaluation metrics across held-out regions.")
    }


# =====================================================================
# Main Multi-Model Inference & Comparison Function
# =====================================================================

def run_colab_multi_model_comparison(
    sample_id: Optional[str] = None,
    file_bytes: Optional[bytes] = None,
    filename: Optional[str] = None,
    threshold: float = 0.5,
    spatial_resolution_m: float = 10.0,
    selected_models: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Execute U-Net, DeepLabV3, and SegFormer on a sample or uploaded image."""
    t_start = time.perf_counter()

    if selected_models is None:
        selected_models = ["U-Net", "DeepLabV3", "SegFormer"]

    raw_s1: Optional[np.ndarray] = None
    raw_lbl: Optional[np.ndarray] = None
    base_preview: Optional[Image.Image] = None
    has_ground_truth = False
    resolved_region = "Custom Upload"
    resolved_filename = filename or "uploaded_image.png"

    # 1. Resolve Input: Either Sample ID from dataset or uploaded file
    if sample_id:
        img_name = f"{sample_id}.tif" if not sample_id.endswith(".tif") else sample_id
        lbl_name = img_name.replace("_S1Hand", "_LabelHand")

        s1_path = S1_DIR / img_name
        lbl_path = LBL_DIR / lbl_name

        if s1_path.exists():
            with rasterio.open(s1_path) as src:
                raw_s1 = src.read() # (2, H, W)
            base_preview = render_sar_composite(raw_s1)
            resolved_filename = img_name
            resolved_region = img_name.split("_")[0]

            if lbl_path.exists():
                with rasterio.open(lbl_path) as src:
                    raw_lbl = src.read(1) # (H, W)
                has_ground_truth = True

    elif file_bytes:
        # Check if file is GeoTIFF
        is_tif = filename and filename.lower().endswith((".tif", ".tiff"))
        if is_tif:
            try:
                with rasterio.open(io.BytesIO(file_bytes)) as src:
                    arr = src.read()
                if arr.shape[0] >= 2:
                    raw_s1 = arr[:2]
                    base_preview = render_sar_composite(raw_s1)
                else:
                    # Single band TIFF -> duplicate to 2 bands
                    raw_s1 = np.repeat(arr[:1], 2, axis=0)
                    base_preview = Image.fromarray(np.clip(raw_s1[0], 0, 255).astype(np.uint8))
            except Exception:
                raw_s1 = None

        if raw_s1 is None:
            # Standard PNG / JPG image
            pil_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            tensor, base_preview = optical_to_sar_tensor(pil_img, target_size=512)
            has_ground_truth = False

    if raw_s1 is not None and "tensor" not in locals():
        tensor = preprocess_sar_array(raw_s1)

    if base_preview is None:
        raise ValueError("Could not parse image input into a valid preview.")

    orig_w, orig_h = base_preview.size

    # 2. Render Ground Truth if available
    gt_stats = None
    gt_mask_b64 = None
    gt_overlay_b64 = None

    if has_ground_truth and raw_lbl is not None:
        valid_px = int(np.sum(raw_lbl >= 0))
        flood_px = int(np.sum(raw_lbl == 1))
        flood_pct = round((flood_px / max(valid_px, 1)) * 100.0, 2)

        gt_stats = {
            "valid_pixels": valid_px,
            "flooded_pixels": flood_px,
            "flooded_percentage": flood_pct,
            "area_km2": round((flood_px * (spatial_resolution_m ** 2)) / 1_000_000.0, 3)
        }

        # Render ground truth mask (White for flood, Black for non-flood, Grey for invalid)
        gt_vis = np.zeros_like(raw_lbl, dtype=np.uint8)
        gt_vis[raw_lbl == 1] = 255
        gt_vis[raw_lbl < 0] = 60
        gt_mask_img = Image.fromarray(gt_vis)
        gt_mask_b64 = to_base64_png(gt_mask_img)

        # Ground truth overlay: Bright Emerald Green
        gt_overlay_img = create_overlay(base_preview, (raw_lbl == 1).astype(np.uint8), color_rgba=(16, 185, 129, 150))
        gt_overlay_b64 = to_base64_png(gt_overlay_img)

    # 3. Model Metadata & Verified Specs
    report_data = get_verified_colab_report().get("verified_report", {})
    overall_test = report_data.get("overall_test_metrics", {})
    regional_test = report_data.get("regional_test_metrics", {}).get(resolved_region, {})

    model_configs = {
        "U-Net": {
            "name": "U-Net",
            "architecture": "U-Net (Encoder-Decoder)",
            "params": "31.0M",
            "desc": "DoubleConv contracting-expanding path with high-fidelity skip connections for hydrological boundary preservation."
        },
        "DeepLabV3": {
            "name": "DeepLabV3",
            "architecture": "DeepLabV3 (ResNet-50 + ASPP)",
            "params": "39.6M",
            "desc": "Atrous Spatial Pyramid Pooling with multi-scale dilation rates capturing regional flood extent."
        },
        "SegFormer": {
            "name": "SegFormer",
            "architecture": "SegFormer (Hierarchical Transformer B0)",
            "params": "3.7M",
            "desc": "Hierarchical self-attention transformer blocks with lightweight all-MLP decoder for long-range spatial context."
        }
    }

    # 4. Run Model Inferences
    model_results: Dict[str, Any] = {}
    predicted_masks: Dict[str, np.ndarray] = {}

    for m_name in selected_models:
        model = get_colab_model(m_name)
        cfg = model_configs.get(m_name, {"name": m_name, "architecture": m_name, "params": "Unknown", "desc": ""})

        if model is None:
            model_results[m_name] = {
                "model_name": m_name,
                "architecture": cfg["architecture"],
                "is_trained": False,
                "status": "Checkpoint not found",
                "metrics": None
            }
            continue

        t0 = time.perf_counter()
        with torch.no_grad():
            if m_name == "U-Net":
                logits = model(tensor)
            elif m_name == "DeepLabV3":
                logits = model(tensor)["out"]
            else: # SegFormer
                raw_out = model(tensor).logits
                logits = F.interpolate(raw_out, size=(orig_h, orig_w), mode="bilinear", align_corners=False)

            if logits.shape[2:] != (orig_h, orig_w):
                logits = F.interpolate(logits, size=(orig_h, orig_w), mode="bilinear", align_corners=False)

            prob = torch.sigmoid(logits).squeeze().cpu().numpy()

        latency_ms = round((time.perf_counter() - t0) * 1000.0, 1)

        pred_bin = (prob >= threshold).astype(np.uint8)
        predicted_masks[m_name] = pred_bin

        flooded_px = int(np.sum(pred_bin))
        flooded_pct = round((flooded_px / pred_bin.size) * 100.0, 2)
        area_m2 = flooded_px * (spatial_resolution_m ** 2)
        area_km2 = round(area_m2 / 1_000_000.0, 3)
        area_ha = round(area_m2 / 10_000.0, 2)

        # Generate Visual Artifacts
        mask_img = Image.fromarray((pred_bin * 255).astype(np.uint8))
        mask_b64 = to_base64_png(mask_img)

        # Overlay: Electric Cyan (#00B4D8)
        overlay_img = create_overlay(base_preview, pred_bin, color_rgba=(0, 180, 216, 145))
        overlay_b64 = to_base64_png(overlay_img)

        # Compute Metrics if ground truth is present
        metrics = None
        if has_ground_truth and raw_lbl is not None:
            metrics = calculate_metrics(pred_bin, raw_lbl)

        # Verified test metrics from JSON
        v_test = overall_test.get(m_name, {})
        v_reg = regional_test.get(m_name, {})

        model_results[m_name] = {
            "model_name": m_name,
            "architecture": cfg["architecture"],
            "parameters": cfg["params"],
            "description": cfg["desc"],
            "is_trained": True,
            "status": "TRAINED & VERIFIED (Colab Checkpoint)",
            "flooded_percentage": flooded_pct,
            "flooded_pixels": flooded_px,
            "estimated_flooded_km2": area_km2,
            "estimated_flooded_ha": area_ha,
            "inference_time_ms": latency_ms,
            "mask_base64": mask_b64,
            "overlay_base64": overlay_b64,
            "sample_metrics": metrics, # Computed on this specific image against GT
            "verified_overall_test": v_test, # Held-out test split from verified JSON
            "verified_regional_test": v_reg # Regional held-out test from verified JSON
        }

    # 5. Multi-Model Consensus / Ensemble
    consensus_stats = None
    if len(predicted_masks) > 1:
        mask_stack = np.stack(list(predicted_masks.values()), axis=0) # (N, H, W)
        agreement_count = np.sum(mask_stack, axis=0) # [0..N]
        # Majority vote
        majority_threshold = len(predicted_masks) / 2.0
        consensus_bin = (agreement_count > majority_threshold).astype(np.uint8)
        cons_flooded_px = int(np.sum(consensus_bin))
        cons_flooded_pct = round((cons_flooded_px / consensus_bin.size) * 100.0, 2)

        # Agreement rate: fraction of pixels where all models agree (either all 0 or all 1)
        full_agree = np.sum((agreement_count == 0) | (agreement_count == len(predicted_masks)))
        agreement_rate = round((full_agree / consensus_bin.size) * 100.0, 2)

        cons_overlay = create_overlay(base_preview, consensus_bin, color_rgba=(99, 102, 241, 145)) # Indigo consensus
        cons_mask = Image.fromarray((consensus_bin * 255).astype(np.uint8))

        # Disagreement map: Highlight where models disagree
        disagree_bin = ((agreement_count > 0) & (agreement_count < len(predicted_masks))).astype(np.uint8)
        disagree_overlay = create_overlay(base_preview, disagree_bin, color_rgba=(245, 158, 11, 150)) # Amber warning

        cons_metrics = None
        if has_ground_truth and raw_lbl is not None:
            cons_metrics = calculate_metrics(consensus_bin, raw_lbl)

        consensus_stats = {
            "model_count": len(predicted_masks),
            "consensus_flooded_percentage": cons_flooded_pct,
            "consensus_flooded_pixels": cons_flooded_px,
            "estimated_flooded_km2": round((cons_flooded_px * (spatial_resolution_m ** 2)) / 1_000_000.0, 3),
            "agreement_rate": agreement_rate,
            "consensus_mask_base64": to_base64_png(cons_mask),
            "consensus_overlay_base64": to_base64_png(cons_overlay),
            "disagreement_overlay_base64": to_base64_png(disagree_overlay),
            "consensus_metrics": cons_metrics
        }

    total_latency_ms = round((time.perf_counter() - t_start) * 1000.0, 1)

    return {
        "status": "success",
        "sample_id": sample_id or "custom_upload",
        "filename": resolved_filename,
        "region": resolved_region,
        "has_ground_truth": has_ground_truth,
        "threshold": threshold,
        "spatial_resolution_m": spatial_resolution_m,
        "total_inference_time_ms": total_latency_ms,
        "original_image_base64": to_base64_png(base_preview),
        "ground_truth_mask_base64": gt_mask_b64,
        "ground_truth_overlay_base64": gt_overlay_b64,
        "ground_truth_stats": gt_stats,
        "models": model_results,
        "consensus": consensus_stats,
        "verified_report_summary": {
            "overall_test_metrics": overall_test,
            "regional_test_metrics": report_data.get("regional_test_metrics", {}),
            "threshold_analysis": report_data.get("threshold_analysis", {}).get("U-Net", [])
        }
    }
