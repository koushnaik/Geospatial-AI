"""Comprehensive automated test suite for GeoFlood AI platform."""
import os
import unittest
import numpy as np
import pandas as pd
from pathlib import Path

# Enforce isolated single-thread OpenMP for Apple Silicon M4 tests
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"

from src.geospatial_features import ALL_FEATURES, calculate_twi, classify_susceptibility
from src.dataset_manager import get_catalog, get_active_dataset, generate_realistic_sample_dataset
from src.data_preprocessing import validate_and_clean_data, compute_eda_summary
from src.prediction import predict_all_models, DEFAULT_STUDY_AREAS
from src.explainability import explain_local_prediction, explain_global
from src.segmentation_module import run_segmentation_inference, HISTORICAL_AUDIT
from src.report_generator import generate_pdf_report
from backend.main import (
    get_loaded_models, health, dashboard_overview, list_datasets,
    predict_single, SinglePredictionRequest, reset_demo_project
)


class TestGeoFloodAI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.models = get_loaded_models()

    def test_01_models_loaded(self):
        """Verify all six algorithms and the ensemble are loaded."""
        self.assertGreaterEqual(len(self.models), 6, "Expected at least 6 models loaded")
        required_models = [
            "Logistic Regression", "Random Forest", "Support Vector Machine",
            "XGBoost", "LightGBM", "CatBoost"
        ]
        for name in required_models:
            self.assertIn(name, self.models, f"Model {name} should be in loaded models")

    def test_02_geospatial_features(self):
        """Test TWI calculation and susceptibility classification."""
        twi = calculate_twi(flow_accumulation=10000.0, slope_degrees=2.5)
        self.assertGreater(twi, 0.0)
        self.assertLess(twi, 30.0)

        # Susceptibility tiers
        v_low = classify_susceptibility(0.10)
        self.assertEqual(v_low["category"], "Very Low")
        v_high = classify_susceptibility(0.85)
        self.assertEqual(v_high["category"], "Very High")

    def test_03_data_preprocessing(self):
        """Test data cleaning, duplicate detection, and imputation."""
        df = get_active_dataset()
        cleaned_df, report = validate_and_clean_data(df)
        self.assertEqual(len(cleaned_df), report["final_rows"])
        self.assertIn("flood_label", cleaned_df.columns)
        self.assertTrue(cleaned_df["flood_label"].isin([0, 1]).all())

    def test_04_eda_summary(self):
        """Test exploratory data analysis statistics generation."""
        df = get_active_dataset()
        eda = compute_eda_summary(df)
        self.assertIn("total_records", eda)
        self.assertIn("descriptive_statistics", eda)
        self.assertIn("target_correlations", eda)

    def test_05_prediction_pipeline(self):
        """Test simultaneous prediction across all six algorithms and ensemble."""
        test_input = DEFAULT_STUDY_AREAS[0]
        res = predict_all_models(self.models, test_input)
        self.assertEqual(res["status"], "success")
        self.assertIn("ensemble", res)
        self.assertIn("model_predictions", res)
        # All 6 algorithms must produce predictions
        for name in ["Logistic Regression", "Random Forest", "Support Vector Machine", "XGBoost", "LightGBM", "CatBoost"]:
            self.assertIn(name, res["model_predictions"])
            score = res["model_predictions"][name]["susceptibility_score"]
            self.assertTrue(0.0 <= score <= 1.0)

    def test_06_explainable_ai_shap(self):
        """Test local waterfall SHAP explanation generation."""
        pipe = self.models["XGBoost"]["pipeline"]
        from src.prediction import prepare_input_dataframe
        input_row = prepare_input_dataframe(DEFAULT_STUDY_AREAS[0], self.models["XGBoost"]["features"])
        exp = explain_local_prediction(pipe, input_row)
        self.assertIn("dominant_risk_factors", exp)
        self.assertGreater(len(exp["dominant_risk_factors"]), 0)

    def test_07_segmentation_inference(self):
        """Test deep learning image segmentation module with synthetic image."""
        from PIL import Image
        import io
        img = Image.new("RGB", (256, 256), color=(40, 90, 160))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        raw_bytes = buf.getvalue()

        result = run_segmentation_inference(raw_bytes, architecture="U-Net")
        self.assertEqual(result["status"], "success")
        self.assertIn("flooded_percentage", result)
        self.assertIn("mask_base64", result)
        self.assertIn("overlay_base64", result)
        self.assertEqual(result["metrics"]["validation_iou"], 0.9076)

    def test_08_pdf_report_generation(self):
        """Test PDF report generation."""
        report_data = {
            "models": [{"model": "XGBoost", "accuracy": 0.7237, "macro_f1": 0.7063, "flood_recall": 0.7577}],
            "datasets": get_catalog()[:3]
        }
        pdf_path = generate_pdf_report("Unit Test Technical Report", report_data)
        self.assertTrue(Path(pdf_path).exists())
        self.assertGreater(Path(pdf_path).stat().st_size, 1000)

    def test_09_fastapi_endpoints(self):
        """Test primary FastAPI backend endpoints."""
        # Health
        r_health = health()
        self.assertEqual(r_health["status"], "healthy")

        # Overview
        r_ov = dashboard_overview()
        self.assertIn("kpis", r_ov)

        # Datasets
        r_ds = list_datasets()
        self.assertIn("catalog", r_ds)

        # Prediction
        r_pred = predict_single(SinglePredictionRequest(
            latitude=10.150, longitude=76.400, elevation=12.5, slope=1.2,
            rainfall_24h=220.0, distance_to_river=180.0, landcover=50
        ))
        self.assertIn("ensemble", r_pred)
        self.assertIn("model_predictions", r_pred)

        # Demo Reset
        r_reset = reset_demo_project()
        self.assertEqual(r_reset["mode"], "DEMO_MODE")

    def test_10_calibration_and_metrics(self):
        """Test Brier score and Expected Calibration Error (ECE) calculations."""
        from src.model_evaluation import compute_ece, evaluate_model
        y_true = np.array([0, 0, 1, 1, 1])
        y_prob = np.array([0.1, 0.2, 0.8, 0.9, 0.7])
        y_pred = (y_prob >= 0.5).astype(int)

        ece = compute_ece(y_true, y_prob, n_bins=5)
        self.assertGreaterEqual(ece, 0.0)
        self.assertLessEqual(ece, 1.0)

        ev = evaluate_model("TestModel", y_true, y_pred, y_prob=y_prob)
        self.assertIn("brier_score", ev)
        self.assertIn("ece", ev)
        self.assertIn("calibration_curve", ev)
        self.assertLess(ev["brier_score"], 0.1)


if __name__ == "__main__":
    unittest.main()
