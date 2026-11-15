"""Intelligent multi-model prediction service with simultaneous six-algorithm inference."""
from __future__ import annotations
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np
import joblib
from pathlib import Path

from .geospatial_features import (
    ALL_FEATURES, FEATURE_METADATA, classify_susceptibility, calculate_twi
)
from .feature_engineering import add_cover_features
from .explainability import explain_local_prediction

DEFAULT_STUDY_AREAS = [
    {
        "id": "kerala-periyar",
        "name": "Kerala – Periyar River Basin (2018 Inundation Zone)",
        "latitude": 10.150,
        "longitude": 76.400,
        "elevation": 12.5,
        "slope": 1.2,
        "aspect": 240.0,
        "rainfall_24h": 220.0,
        "rainfall_7d": 680.0,
        "rainfall_30d": 1420.0,
        "distance_to_river": 180.0,
        "drainage_density": 4.8,
        "flow_accumulation": 48000.0,
        "twi": 16.2,
        "landcover": 50,
        "soil_type": 1,
        "ndvi": 0.38,
        "flood_frequency": 6
    },
    {
        "id": "assam-brahmaputra",
        "name": "Assam – Brahmaputra Floodplain (Kaziranga Reach)",
        "latitude": 26.650,
        "longitude": 93.350,
        "elevation": 54.0,
        "slope": 0.8,
        "aspect": 180.0,
        "rainfall_24h": 185.0,
        "rainfall_7d": 540.0,
        "rainfall_30d": 1150.0,
        "distance_to_river": 320.0,
        "drainage_density": 5.2,
        "flow_accumulation": 85000.0,
        "twi": 18.4,
        "landcover": 90,
        "soil_type": 4,
        "ndvi": 0.62,
        "flood_frequency": 8
    },
    {
        "id": "bihar-kosi",
        "name": "Bihar – Kosi Megafan (North Bihar Plains)",
        "latitude": 25.850,
        "longitude": 86.950,
        "elevation": 36.0,
        "slope": 0.4,
        "aspect": 160.0,
        "rainfall_24h": 145.0,
        "rainfall_7d": 410.0,
        "rainfall_30d": 920.0,
        "distance_to_river": 450.0,
        "drainage_density": 3.9,
        "flow_accumulation": 62000.0,
        "twi": 17.1,
        "landcover": 40,
        "soil_type": 4,
        "ndvi": 0.45,
        "flood_frequency": 7
    },
    {
        "id": "odisha-mahanadi",
        "name": "Odisha – Mahanadi River Delta (Coastal Inundation Zone)",
        "latitude": 20.460,
        "longitude": 85.880,
        "elevation": 18.0,
        "slope": 0.6,
        "aspect": 120.0,
        "rainfall_24h": 195.0,
        "rainfall_7d": 510.0,
        "rainfall_30d": 1050.0,
        "distance_to_river": 280.0,
        "drainage_density": 4.6,
        "flow_accumulation": 74000.0,
        "twi": 17.8,
        "landcover": 90,
        "soil_type": 2,
        "ndvi": 0.48,
        "flood_frequency": 7
    },
    {
        "id": "deccan-plateau",
        "name": "Deccan Upland – Low Susceptibility Ridge (Control Site)",
        "latitude": 18.520,
        "longitude": 73.856,
        "elevation": 560.0,
        "slope": 14.5,
        "aspect": 90.0,
        "rainfall_24h": 18.0,
        "rainfall_7d": 45.0,
        "rainfall_30d": 110.0,
        "distance_to_river": 4200.0,
        "drainage_density": 1.2,
        "flow_accumulation": 450.0,
        "twi": 5.2,
        "landcover": 30,
        "soil_type": 3,
        "ndvi": 0.55,
        "flood_frequency": 0
    }
]


def prepare_input_dataframe(values: Dict[str, Any], target_features: List[str]) -> pd.DataFrame:
    """Validate, sanitize, and assemble single-point prediction input row."""
    row = {}
    for feat in ALL_FEATURES:
        meta = FEATURE_METADATA.get(feat, {})
        val = values.get(feat)
        if val is None or val == "":
            val = meta.get("default", 0.0)
        row[feat] = float(val) if feat not in {"landcover", "soil_type", "flood_frequency"} else int(val)

    # Derive TWI if not supplied explicitly
    if "twi" not in values or values["twi"] in (None, ""):
        row["twi"] = float(calculate_twi(row["flow_accumulation"], row["slope"]))

    df = pd.DataFrame([row])
    # Add one-hot / WorldCover indicator columns
    df = add_cover_features(df)
    
    # Reindex to match model features
    for col in target_features:
        if col not in df.columns:
            df[col] = 0.0
            
    return df[target_features]


def predict_all_models(
    models: Dict[str, Any],
    input_values: Dict[str, Any]
) -> Dict[str, Any]:
    """Run all six machine learning models and the ensemble simultaneously on the exact same input."""
    results = {}
    probabilities = []
    classes = []
    
    # Representative feature list from first model
    first_model = next(iter(models.values()))
    features = first_model.get("features", ALL_FEATURES)
    input_df = prepare_input_dataframe(input_values, features)

    best_pipe = None
    best_pipe_name = ""

    for name, bundle in models.items():
        pipe = bundle["pipeline"]
        try:
            # Predict class
            pred_class = int(pipe.predict(input_df)[0])
            # Predict probability
            if hasattr(pipe, "predict_proba"):
                prob = float(pipe.predict_proba(input_df)[0, 1])
            elif hasattr(pipe, "decision_function"):
                df_val = float(pipe.decision_function(input_df)[0])
                prob = float(1.0 / (1.0 + np.exp(-df_val)))
            else:
                prob = 0.5

            susceptibility = classify_susceptibility(prob)
            results[name] = {
                "algorithm": name,
                "predicted_class": pred_class,
                "susceptibility_score": round(prob, 4),
                "probability": round(prob, 4),
                "category": susceptibility["category"],
                "color": susceptibility["color"],
                "hex": susceptibility["hex"]
            }
            probabilities.append(prob)
            classes.append(pred_class)

            if not best_pipe or "Forest" in name or "XGBoost" in name:
                best_pipe = pipe
                best_pipe_name = name

        except Exception as exc:
            results[name] = {
                "algorithm": name,
                "error": str(exc),
                "predicted_class": 0,
                "susceptibility_score": 0.0,
                "probability": 0.0,
                "category": "Error"
            }

    # Ensemble synthesis
    mean_prob = float(np.mean(probabilities)) if probabilities else 0.0
    ensemble_class = int(mean_prob >= 0.5)
    agreement = round(float(np.mean([c == ensemble_class for c in classes])) * 100.0, 1) if classes else 0.0
    ens_classification = classify_susceptibility(mean_prob)

    # SHAP local explanation using the best tree pipeline
    explanation = {}
    if best_pipe is not None:
        explanation = explain_local_prediction(best_pipe, input_df)

    return {
        "status": "success",
        "input_features": {k: input_values.get(k, FEATURE_METADATA.get(k, {}).get("default")) for k in ALL_FEATURES},
        "model_predictions": results,
        "ensemble": {
            "name": "Multi-Model Consensus Ensemble",
            "score": round(mean_prob, 4),
            "probability": round(mean_prob, 4),
            "predicted_class": ensemble_class,
            "category": ens_classification["category"],
            "color": ens_classification["color"],
            "hex": ens_classification["hex"],
            "description": ens_classification["description"],
            "model_agreement_percentage": agreement,
            "total_models": len(results)
        },
        "explanation": explanation
    }
