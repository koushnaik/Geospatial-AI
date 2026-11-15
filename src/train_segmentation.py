"""Train U-Net for Flood Water Semantic Segmentation on Apple Silicon M4 CPU."""
import os
import time
from pathlib import Path
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from src.segmentation_module import UNet

class FloodSegmentationDataset(Dataset):
    def __init__(self, img_dir: Path, mask_dir: Path):
        self.img_paths = sorted(list(img_dir.glob("*.png")))
        self.mask_dir = mask_dir
        self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        self.std = np.array([0.229, 0.224, 0.225], dtype=np.float32)

    def __len__(self):
        return len(self.img_paths)

    def __getitem__(self, idx):
        img_path = self.img_paths[idx]
        mask_path = self.mask_dir / img_path.name
        
        img = Image.open(img_path).convert("RGB").resize((256, 256))
        mask = Image.open(mask_path).convert("L").resize((256, 256), Image.Resampling.NEAREST)
        
        img_arr = np.array(img).astype(np.float32) / 255.0
        img_norm = (img_arr - self.mean) / self.std
        tensor_img = torch.from_numpy(img_norm.transpose(2, 0, 1)).float()
        
        mask_arr = (np.array(mask) > 127).astype(np.float32)
        tensor_mask = torch.from_numpy(mask_arr).unsqueeze(0).float()
        
        return tensor_img, tensor_mask


class DiceBCELoss(nn.Module):
    def __init__(self):
        super().__init__()
        self.bce = nn.BCEWithLogitsLoss()

    def forward(self, logits, targets, smooth=1e-5):
        bce_loss = self.bce(logits, targets)
        probs = torch.sigmoid(logits)
        
        probs_flat = probs.view(-1)
        targets_flat = targets.view(-1)
        
        intersection = (probs_flat * targets_flat).sum()
        dice_loss = 1.0 - (2.0 * intersection + smooth) / (probs_flat.sum() + targets_flat.sum() + smooth)
        
        return bce_loss + dice_loss


def train_model(epochs: int = 10, batch_size: int = 4, lr: float = 1e-3):
    train_dir = Path("data/segmentation/train")
    val_dir = Path("data/segmentation/val")
    checkpoint_dir = Path("artifacts/checkpoints")
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = checkpoint_dir / "unet_flood_v1.pth"

    train_ds = FloodSegmentationDataset(train_dir / "images", train_dir / "masks")
    val_ds = FloodSegmentationDataset(val_dir / "images", val_dir / "masks")

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)

    print(f"Loaded {len(train_ds)} train samples and {len(val_ds)} validation samples.")

    device = torch.device("cpu")
    model = UNet(in_channels=3, out_channels=1).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    criterion = DiceBCELoss()

    best_val_dice = 0.0
    best_metrics = {}

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        model.train()
        train_loss = 0.0

        for imgs, masks in train_loader:
            imgs, masks = imgs.to(device), masks.to(device)
            optimizer.zero_grad()
            logits = model(imgs)
            loss = criterion(logits, masks)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        train_loss /= len(train_loader)

        # Validation
        model.eval()
        val_loss = 0.0
        val_inter = 0.0
        val_union = 0.0
        val_tp = 0.0
        val_fp = 0.0
        val_fn = 0.0

        with torch.no_grad():
            for imgs, masks in val_loader:
                imgs, masks = imgs.to(device), masks.to(device)
                logits = model(imgs)
                loss = criterion(logits, masks)
                val_loss += loss.item()

                preds = (torch.sigmoid(logits) >= 0.5).float()
                
                # Metrics
                p_flat = preds.view(-1)
                t_flat = masks.view(-1)

                val_inter += (p_flat * t_flat).sum().item()
                val_union += (p_flat + t_flat).sum().item() - (p_flat * t_flat).sum().item()
                val_tp += (p_flat * t_flat).sum().item()
                val_fp += (p_flat * (1 - t_flat)).sum().item()
                val_fn += ((1 - p_flat) * t_flat).sum().item()

        val_loss /= len(val_loader)
        val_iou = (val_inter + 1e-5) / (val_union + 1e-5)
        val_dice = (2.0 * val_inter + 1e-5) / (2.0 * val_inter + val_fp + val_fn + 1e-5)
        val_prec = (val_tp + 1e-5) / (val_tp + val_fp + 1e-5)
        val_rec = (val_tp + 1e-5) / (val_tp + val_fn + 1e-5)

        elapsed = time.time() - t0
        print(f"Epoch {epoch:02d}/{epochs:02d} [{elapsed:.1f}s] - Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val IoU: {val_iou:.4f} | Val Dice: {val_dice:.4f}")

        if val_dice > best_val_dice:
            best_val_dice = val_dice
            best_metrics = {
                "val_iou": round(val_iou, 4),
                "val_dice": round(val_dice, 4),
                "precision": round(val_prec, 4),
                "recall": round(val_rec, 4),
                "f1_score": round(val_dice, 4),
                "best_epoch": epoch
            }
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "metrics": best_metrics,
                "architecture": "U-Net",
                "training_dataset": "Calibrated Geospatial River Basin Inundation Set"
            }, checkpoint_path)
            print(f"  --> Saved new best checkpoint to {checkpoint_path} (Val Dice: {val_dice:.4f})")

    print("\nTraining completed.")
    print(f"Best Validation Metrics: {best_metrics}")
    return best_metrics

if __name__ == "__main__":
    train_model(epochs=10, batch_size=4, lr=1e-3)
