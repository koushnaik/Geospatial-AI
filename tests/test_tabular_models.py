"""Comprehensive automated test suite for Tabular ML models and SHAP."""
import unittest
from pathlib import Path
import joblib
import pandas as pd
import numpy as np

from src.prediction import (
    predict_all_models,
    prepare_input_dataframe,
    DEFAULT_STUDY_AREAS
)
from src.explainability import explain_local_prediction, explain_global
from backend.main import get_loaded_models


class TestTabularModels(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.models = get_loaded_models()

    def test_01_all_nine_artifacts_exist_and_load(self):
        """Verify all 9 serialized .joblib pipelines load properly."""
        artifacts_dir = Path("artifacts/models")
        expected_artifacts = [
            "logistic_regression.joblib",
            "random_forest.joblib",
            "support_vector_machine.joblib",
            "xgboost.joblib",
            "lightgbm.joblib",
            "lightgbm_optimized.joblib",
            "catboost.joblib",
            "catboost_optimized.joblib",
            "soft_voting_ensemble.joblib"
        ]
        for name in expected_artifacts:
            p = artifacts_dir / name
            self.assertTrue(p.exists(), f"Artifact {name} is missing")
            obj = joblib.load(p)
            self.assertIsNotNone(obj, f"Failed to deserialize {name}")

    def test_02_feature_ordering_and_preprocessing(self):
        """Verify feature ordering in DataFrame matches model expectation."""
        sample_input = DEFAULT_STUDY_AREAS[0]
        xgb_meta = self.models["XGBoost"]
        features = xgb_meta["features"]
        df = prepare_input_dataframe(sample_input, features)

        self.assertEqual(list(df.columns), features)
        self.assertEqual(len(df), 1)
        self.assertFalse(df.isna().any().any())

    def test_03_prediction_variation_across_extremes(self):
        """Verify that contrasting geographical inputs yield logically divergent susceptibility scores."""
        # Extreme A: Low-elevation, steep rainfall, close to river (High Flood Risk)
        high_risk_input = {
            "latitude": 20.25,
            "longitude": 85.80,
            "elevation": 8.0,
            "slope": 0.8,
            "aspect": 120.0,
            "rainfall_24h": 220.0,
            "rainfall_7d": 450.0,
            "rainfall_30d": 780.0,
            "distance_to_river": 90.0,
            "drainage_density": 2.4,
            "flow_accumulation": 85000.0,
            "twi": 16.5,
            "landcover": 40,
            "soil_type": 1,
            "ndvi": 0.25,
            "flood_frequency": 7
        }

        # Extreme B: High-elevation plateau, dry, far from river (Low Flood Risk)
        low_risk_input = {
            "latitude": 17.40,
            "longitude": 78.50,
            "elevation": 580.0,
            "slope": 12.0,
            "aspect": 200.0,
            "rainfall_24h": 5.0,
            "rainfall_7d": 12.0,
            "rainfall_30d": 25.0,
            "distance_to_river": 5200.0,
            "drainage_density": 0.4,
            "flow_accumulation": 120.0,
            "twi": 4.5,
            "landcover": 30,
            "soil_type": 5,
            "ndvi": 0.65,
            "flood_frequency": 0
        }

        res_high = predict_all_models(self.models, high_risk_input)
        res_low = predict_all_models(self.models, low_risk_input)

        score_high = res_high["ensemble"]["susceptibility_percentage"]
        score_low = res_low["ensemble"]["susceptibility_percentage"]

        self.assertGreater(score_high, score_low)
        self.assertGreater(score_high, 70.0, "High-risk scenario should exceed 70%")
        self.assertLess(score_low, 35.0, "Low-risk scenario should be below 35%")

    def test_04_shap_local_explanations(self):
        """Verify SHAP explainability waterfall generation."""
        xgb_pipe = self.models["XGBoost"]["pipeline"]
        features = self.models["XGBoost"]["features"]
        df = prepare_input_dataframe(DEFAULT_STUDY_AREAS[0], features)

        exp = explain_local_prediction(xgb_pipe, df)
        self.assertIn("dominant_risk_factors", exp)
        self.assertIn("base_value", exp)
        self.assertIn("prediction_value", exp)
        self.assertGreater(len(exp["dominant_risk_factors"]), 0)

        # Check factor structure
        first_factor = exp["waterfall"][0]
        self.assertIn("feature", first_factor)
        self.assertIn("shap_value", first_factor)
        self.assertIn("impact", first_factor)

    def test_05_ensemble_consensus_and_weights(self):
        """Verify Soft-Voting Ensemble consensus and probability aggregation."""
        res = predict_all_models(self.models, DEFAULT_STUDY_AREAS[0])
        self.assertIn("ensemble", res)
        ens = res["ensemble"]
        self.assertIn("susceptibility_percentage", ens)
        self.assertIn("category", ens)
        self.assertIn("tier", ens)
        self.assertTrue(1 <= ens["tier"] <= 5)


if __name__ == "__main__":
    unittest.main()
