"""Evaluate trained U-Net on unseen independent test dataset."""
import os
import time
from pathlib import Path
import numpy as np
from PIL import Image
import torch
from src.segmentation_module import UNet

def evaluate_test_dataset():
    test_img_dir = Path("data/segmentation/test/images")
    test_mask_dir = Path("data/segmentation/test/masks")
    out_dir = Path("reports/test_predictions")
    out_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = Path("artifacts/checkpoints/unet_flood_v1.pth")

    if not checkpoint_path.exists():
        print(f"Error: checkpoint {checkpoint_path} not found.")
        return

    device = torch.device("cpu")
    model = UNet(in_channels=3, out_channels=1).to(device)
    ckpt = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()

    print(f"Loaded trained U-Net checkpoint from {checkpoint_path} (Trained at epoch {ckpt.get('epoch')})")

    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)

    test_cases = [
        ("No Flooding (Deccan Plateau)", "test_no_flood.png"),
        ("Moderate Flooding (Odisha Delta)", "test_moderate_flood.png"),
        ("Severe Flooding (Brahmaputra Basin)", "test_severe_flood.png")
    ]

    results = []

    print("\n" + "=" * 90)
    print(f"{'Test Scenario':<36} | {'GT %':<7} | {'Pred %':<7} | {'IoU':<7} | {'Dice':<7} | {'Prec':<7} | {'Rec':<7} | {'Time (ms)':<9}")
    print("=" * 90)

    for label, fname in test_cases:
        img_path = test_img_dir / fname
        mask_path = test_mask_dir / fname

        img = Image.open(img_path).convert("RGB").resize((256, 256))
        gt_mask = Image.open(mask_path).convert("L").resize((256, 256), Image.Resampling.NEAREST)

        gt_arr = (np.array(gt_mask) > 127).astype(np.uint8)
        gt_pct = round(np.mean(gt_arr) * 100.0, 2)

        img_arr = np.array(img).astype(np.float32) / 255.0
        img_norm = (img_arr - mean) / std
        tensor = torch.from_numpy(img_norm.transpose(2, 0, 1)).unsqueeze(0).float().to(device)

        t0 = time.perf_counter()
        with torch.no_grad():
            logits = model(tensor)
            pred_probs = torch.sigmoid(logits).squeeze().cpu().numpy()
            pred_mask = (pred_probs >= 0.5).astype(np.uint8)
        inference_time_ms = round((time.perf_counter() - t0) * 1000.0, 1)

        pred_pct = round(np.mean(pred_mask) * 100.0, 2)

        # Calculate metrics
        inter = np.sum((pred_mask == 1) & (gt_arr == 1))
        union = np.sum((pred_mask == 1) | (gt_arr == 1))
        tp = inter
        fp = np.sum((pred_mask == 1) & (gt_arr == 0))
        fn = np.sum((pred_mask == 0) & (gt_arr == 1))
        tn = np.sum((pred_mask == 0) & (gt_arr == 0))

        if union == 0:
            iou = 1.0 if inter == 0 else 0.0
            dice = 1.0 if (tp + fp + fn) == 0 else 0.0
            prec = 1.0 if fp == 0 else 0.0
            rec = 1.0 if fn == 0 else 0.0
        else:
            iou = (inter + 1e-5) / (union + 1e-5)
            dice = (2.0 * inter + 1e-5) / (2.0 * inter + fp + fn + 1e-5)
            prec = (tp + 1e-5) / (tp + fp + 1e-5) if (tp + fp) > 0 else 1.0
            rec = (tp + 1e-5) / (tp + fn + 1e-5) if (tp + fn) > 0 else 1.0

        # Save visual artifacts
        pred_mask_img = Image.fromarray((pred_mask * 255).astype(np.uint8))
        pred_mask_img.save(out_dir / f"pred_mask_{fname}")

        # Create overlay
        overlay = img.copy().convert("RGBA")
        tint = Image.new("RGBA", img.size, (0, 180, 216, 0))
        tint_arr = np.array(tint)
        tint_arr[pred_mask > 0] = [0, 180, 216, 140]
        tint_img = Image.fromarray(tint_arr)
        composite = Image.alpha_composite(overlay, tint_img)
        composite.save(out_dir / f"overlay_{fname}")

        row = {
            "scenario": label,
            "filename": fname,
            "ground_truth_pct": gt_pct,
            "predicted_pct": pred_pct,
            "iou": round(float(iou), 4),
            "dice": round(float(dice), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "inference_time_ms": inference_time_ms
        }
        results.append(row)

        print(f"{label:<36} | {gt_pct:<7.2f} | {pred_pct:<7.2f} | {iou:<7.4f} | {dice:<7.4f} | {prec:<7.4f} | {rec:<7.4f} | {inference_time_ms:<9.1f}")

    print("=" * 90)
    return results

if __name__ == "__main__":
    evaluate_test_dataset()
