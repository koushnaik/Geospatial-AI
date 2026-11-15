"""Comprehensive automated test suite for Colab-trained Segmentation Models."""
import unittest
from pathlib import Path
import numpy as np
import torch
from PIL import Image

from src.colab_segmentation import (
    get_colab_model,
    get_colab_samples_catalog,
    get_verified_colab_report,
    run_colab_multi_model_comparison,
    preprocess_sar_array,
    optical_to_sar_tensor,
    calculate_metrics
)


class TestColabSegmentation(unittest.TestCase):
    def test_01_checkpoints_exist(self):
        """Verify all three final Colab model checkpoint files exist."""
        base = Path("artifacts/geoflood_colab/models/final")
        for ckpt in ["unet_flood.pth", "deeplabv3_flood.pth", "segformer_flood.pth"]:
            p = base / ckpt
            self.assertTrue(p.exists(), f"Checkpoint {p} does not exist")
            self.assertGreater(p.stat().st_size, 10_000_000, f"Checkpoint {p} too small")

    def test_02_model_loading(self):
        """Verify that U-Net, DeepLabV3, and SegFormer instantiate and load weights cleanly."""
        for name in ["U-Net", "DeepLabV3", "SegFormer"]:
            m = get_colab_model(name)
            self.assertIsNotNone(m, f"Failed to instantiate and load {name}")
            # Run dummy forward pass
            dummy = torch.randn(1, 2, 256, 256)
            with torch.no_grad():
                if name == "U-Net":
                    out = m(dummy)
                elif name == "DeepLabV3":
                    out = m(dummy)["out"]
                else:
                    out = m(dummy).logits
            self.assertIsNotNone(out)

    def test_03_normalization_and_preprocessing(self):
        """Verify 2-channel SAR normalization logic and NaN handling."""
        raw = np.array([
            [[-10.0, np.nan], [-25.0, -5.0]],
            [[-15.0, -20.0], [np.nan, -35.0]]
        ], dtype=np.float32)
        tensor = preprocess_sar_array(raw)
        self.assertEqual(tensor.shape, (1, 2, 2, 2))
        self.assertFalse(torch.isnan(tensor).any(), "NaN values were not imputed")

    def test_04_optical_to_sar_conversion(self):
        """Verify conversion of optical RGB image into valid 2-channel SAR tensor."""
        pil_img = Image.new("RGB", (256, 256), color=(30, 80, 150))
        tensor, resized = optical_to_sar_tensor(pil_img, target_size=256)
        self.assertEqual(tensor.shape, (1, 2, 256, 256))
        self.assertEqual(resized.size, (256, 256))
        self.assertFalse(torch.isnan(tensor).any())

    def test_05_metrics_calculation(self):
        """Verify IoU, Dice, Precision, Recall, and NoData (-1) exclusion."""
        pred = np.array([[1, 0], [1, 0]], dtype=np.uint8)
        gt = np.array([[1, 0], [-1, 1]], dtype=np.int16) # Note: (1,0) is -1 NoData

        # Valid mask: (0,0)->TP=1, (0,1)->TN=1, (1,1)->FN=1
        m = calculate_metrics(pred, gt)
        self.assertIn("iou", m)
        self.assertIn("dice", m)
        self.assertEqual(m["tp"], 1)
        self.assertEqual(m["fp"], 0)
        self.assertEqual(m["fn"], 1)
        self.assertEqual(m["tn"], 1)
        self.assertAlmostEqual(m["iou"], 0.5, places=2)

    def test_06_samples_catalog(self):
        """Verify catalog of Sen1Floods11 samples."""
        catalog = get_colab_samples_catalog()
        self.assertGreater(len(catalog), 0)
        first = catalog[0]
        self.assertIn("id", first)
        self.assertIn("region", first)
        self.assertTrue(first["has_ground_truth"])

    def test_07_verified_report_loading(self):
        """Verify verified evaluation JSON report and training CSV loading."""
        rep = get_verified_colab_report()
        self.assertEqual(rep["status"], "success")
        self.assertIn("verified_report", rep)
        self.assertIn("overall_test_metrics", rep["verified_report"])
        for name in ["U-Net", "DeepLabV3", "SegFormer"]:
            self.assertIn(name, rep["verified_report"]["overall_test_metrics"])

    def test_08_multi_model_inference_pipeline(self):
        """Verify multi-model comparison on real dataset sample."""
        catalog = get_colab_samples_catalog()
        sample_id = catalog[0]["id"]
        res = run_colab_multi_model_comparison(sample_id=sample_id, threshold=0.5)
        self.assertEqual(res["status"], "success")
        self.assertTrue(res["has_ground_truth"])
        self.assertIn("U-Net", res["models"])
        self.assertIn("DeepLabV3", res["models"])
        self.assertIn("SegFormer", res["models"])
        self.assertIsNotNone(res["consensus"])
        self.assertIn("original_image_base64", res)
        self.assertIn("ground_truth_mask_base64", res)


if __name__ == "__main__":
    unittest.main()
