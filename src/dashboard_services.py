"""Stable dashboard-facing adapters around the existing data and ML modules.

Keep Streamlit concerns out of this module. Each function is intentionally thin
so the validated geospatial/ML implementations can evolve independently.
"""
from __future__ import annotations

from pathlib import Path

class DatasetService:
    @staticmethod
    def load_points(*args, **kwargs):
        from .data_loader import read_points
        return read_points(*args, **kwargs)

    @staticmethod
    def open_raster(*args, **kwargs):
        from .data_loader import raster_source
        return raster_source(*args, **kwargs)

    @staticmethod
    def raster_metadata(*args, **kwargs):
        from .data_loader import raster_metadata
        return raster_metadata(*args, **kwargs)

    @staticmethod
    def sample_rasters(*args, **kwargs):
        from .feature_engineering import raster_event_samples
        return raster_event_samples(*args, **kwargs)


class PreprocessingService:
    @staticmethod
    def prepare(*args, **kwargs):
        from .data_preprocessing import prepare_dataset
        return prepare_dataset(*args, **kwargs)

    @staticmethod
    def stats(*args, **kwargs):
        from .data_preprocessing import dataset_stats
        return dataset_stats(*args, **kwargs)


class TrainingService:
    @staticmethod
    def train(*args, **kwargs):
        from .model_training import train_all
        return train_all(*args, **kwargs)


class EvaluationService:
    @staticmethod
    def evaluate(*args, **kwargs):
        from .model_evaluation import evaluate_model
        return evaluate_model(*args, **kwargs)


class PredictionService:
    @staticmethod
    def predict(*args, **kwargs):
        from .prediction import predict
        return predict(*args, **kwargs)


class ExplainabilityService:
    @staticmethod
    def explain(*args, **kwargs):
        from .explainability import explain_model
        return explain_model(*args, **kwargs)

    @staticmethod
    def importance_table(*args, **kwargs):
        from .explainability import importance_table
        return importance_table(*args, **kwargs)


class ReportService:
    @staticmethod
    def evaluation_pdf(*args, **kwargs):
        from .report_generator import evaluation_pdf
        return evaluation_pdf(*args, **kwargs)


class ModelArtifactService:
    """Discover and load fitted model bundles created by the backend pipeline."""
    @staticmethod
    def available(directory):
        folder = Path(directory)
        return sorted(folder.glob("*.joblib"), key=lambda path: path.name.lower()) if folder.exists() else []

    @staticmethod
    def load(path):
        import joblib
        bundle = joblib.load(path)
        if not isinstance(bundle, dict) or "pipeline" not in bundle or "features" not in bundle:
            raise ValueError(f"{Path(path).name} is not a supported model bundle; expected pipeline and features.")
        return {"name": Path(path).stem, "pipeline": bundle["pipeline"], "features": list(bundle["features"])}


class EnsemblePredictionService:
    """Combine fitted model probabilities into one soft-vote result."""
    @staticmethod
    def predict(models, values, features, threshold=0.5):
        import numpy as np
        from .prediction import build_prediction_row

        if len(models) < 2:
            raise ValueError("Select at least two fitted models to combine.")
        row = build_prediction_row(values, features)
        probabilities = []
        for model in models:
            pipeline = model["pipeline"]
            if not hasattr(pipeline, "predict_proba"):
                raise ValueError(f"{model['name']} does not support probability output and cannot join a soft vote.")
            probabilities.append(float(pipeline.predict_proba(row)[0, 1]))
        mean_probability = float(np.mean(probabilities))
        return {"prediction": int(mean_probability >= threshold),
                "flood_probability": mean_probability,
                "model_count": len(models),
                "combination": "soft_vote_mean_probability",
                "threshold": float(threshold),
                "inputs": values}


def prediction_map(*args, **kwargs):
    from .mapping import prediction_map as render_map
    return render_map(*args, **kwargs)


__all__ = ["DatasetService", "PreprocessingService", "TrainingService",
           "EvaluationService", "PredictionService", "ExplainabilityService",
           "ReportService", "ModelArtifactService", "EnsemblePredictionService",
           "prediction_map"]
