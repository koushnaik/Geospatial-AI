"""
FastAPI REST Endpoints for GeoFlood AI.
"""

import os
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import FileResponse, JSONResponse

from backend.app.schemas.flood import PredictionInputSchema
from backend.app.ml.prediction.predictor import ModelManager
from backend.app.services.historical_service import HistoricalService
from backend.app.services.location_service import LocationService
from backend.app.database.db import get_prediction_by_id, get_recent_predictions
from backend.app.reports.pdf_generator import generate_prediction_pdf

router = APIRouter(prefix="/api")

# 1. Health
@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "GeoFlood AI",
        "version": "1.0.0",
        "model_loaded": True
    }

# 2. Dashboard Overview
@router.get("/dashboard/overview")
def dashboard_overview():
    hist_svc = HistoricalService.get_instance()
    summary = hist_svc.get_summary()
    loc_svc = LocationService.get_instance()
    mod_mgr = ModelManager.get_instance()
    
    recent_preds = get_recent_predictions(limit=5)
    
    return {
        "dataset_name": "INDOFLOODS",
        "total_historical_events": summary["total_events"],
        "total_gauges": summary["total_gauges"],
        "total_states": summary["total_states"],
        "severe_flood_percentage": summary["severe_flood_percentage"],
        "best_algorithm": mod_mgr.best_model_name,
        "best_algorithm_metrics": mod_mgr.evaluation_metrics.get(mod_mgr.best_model_name, {}),
        "recent_predictions": recent_preds,
        "supported_algorithms": list(mod_mgr.models.keys())
    }

# 3. Datasets endpoints
@router.get("/datasets/summary")
def dataset_summary():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
    audit_file = os.path.join(base_dir, "datasets", "processed", "dataset_audit_report.json")
    if not os.path.exists(audit_file):
        raise HTTPException(status_code=404, detail="Audit report not found")
    with open(audit_file, "r") as f:
        data = json.load(f)
    return data

@router.get("/datasets/features")
def dataset_features():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
    dict_file = os.path.join(base_dir, "datasets", "processed", "data_dictionary.json")
    if not os.path.exists(dict_file):
        raise HTTPException(status_code=404, detail="Data dictionary not found")
    with open(dict_file, "r") as f:
        data = json.load(f)
    return data

@router.get("/datasets/quality")
def dataset_quality():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
    audit_file = os.path.join(base_dir, "datasets", "processed", "dataset_audit_report.json")
    with open(audit_file, "r") as f:
        data = json.load(f)
    return {
        "observations": data.get("data_quality_observations", []),
        "joins": data.get("joins", {}),
        "leakage_prevention": {
            "excluded_post_event_variables": data["features"]["leakage_excluded_variables"],
            "rationale": "Warning/Danger levels and post-event discharge/volume/levels define or occur after the flood event, and are strictly excluded from predictive features."
        }
    }

@router.get("/datasets/audit")
def dataset_full_audit():
    return dataset_summary()

# 4. Location endpoints
@router.get("/locations/states")
def get_states():
    loc_svc = LocationService.get_instance()
    return loc_svc.get_states()

@router.get("/locations/basins")
def get_basins():
    loc_svc = LocationService.get_instance()
    return loc_svc.get_basins()

@router.get("/locations/gauges")
def get_gauges(state: Optional[str] = None, basin: Optional[str] = None):
    loc_svc = LocationService.get_instance()
    return loc_svc.get_all_gauges(state=state, basin=basin)

@router.get("/locations/{gauge_id}")
def get_gauge_details(gauge_id: str):
    loc_svc = LocationService.get_instance()
    gauge = loc_svc.get_gauge_by_id(gauge_id)
    if not gauge:
        raise HTTPException(status_code=404, detail=f"Gauge station '{gauge_id}' not found in dataset.")
    return gauge

@router.get("/locations/{gauge_id}/catchment-geojson")
def get_catchment_geojson(gauge_id: str):
    loc_svc = LocationService.get_instance()
    geojson = loc_svc.get_catchment_geojson(gauge_id)
    if not geojson:
        raise HTTPException(status_code=404, detail=f"Shapefile polygon for '{gauge_id}' not available.")
    return geojson

# 5. Model endpoints
@router.get("/models")
def list_models():
    mod_mgr = ModelManager.get_instance()
    return {
        "best_model": mod_mgr.best_model_name,
        "algorithms": list(mod_mgr.models.keys()),
        "validation_strategy": "StratifiedGroupKFold (grouped by GaugeID to prevent spatial leakage)",
        "features_count": len(mod_mgr.all_feature_names)
    }

@router.get("/models/comparison")
@router.get("/models/metrics")
def model_metrics():
    mod_mgr = ModelManager.get_instance()
    return {
        "best_model": mod_mgr.best_model_name,
        "selection_criterion": mod_mgr.metadata.get("selection_criterion"),
        "dataset_split": mod_mgr.metadata.get("dataset_split"),
        "evaluation_metrics": mod_mgr.evaluation_metrics,
        "confusion_matrices": mod_mgr.metadata.get("confusion_matrices"),
        "roc_data": mod_mgr.metadata.get("roc_data"),
        "global_shap_importance": mod_mgr.metadata.get("global_shap_importance", [])
    }

# 6. Prediction endpoints
@router.post("/predictions")
def create_prediction(payload: PredictionInputSchema):
    mod_mgr = ModelManager.get_instance()
    # Convert Pydantic to raw dict with original field names
    raw_data = payload.model_dump(by_alias=True)
    try:
        result = mod_mgr.predict(raw_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/predictions/history")
def list_recent_predictions(limit: int = 25):
    return get_recent_predictions(limit=limit)

@router.get("/predictions/{prediction_id}")
def get_prediction(prediction_id: str):
    record = get_prediction_by_id(prediction_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Prediction with ID '{prediction_id}' not found.")
    return record

@router.get("/predictions/{prediction_id}/explanation")
def get_prediction_explanation(prediction_id: str):
    record = get_prediction_by_id(prediction_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Prediction with ID '{prediction_id}' not found.")
    return record["explanation"]

@router.get("/predictions/{prediction_id}/report")
def get_prediction_report_json(prediction_id: str):
    record = get_prediction_by_id(prediction_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Prediction with ID '{prediction_id}' not found.")
    mod_mgr = ModelManager.get_instance()
    return {
        "prediction": record,
        "metrics_comparison": mod_mgr.evaluation_metrics,
        "metadata": mod_mgr.metadata
    }

@router.get("/reports/{prediction_id}/pdf")
def download_pdf_report(prediction_id: str):
    record = get_prediction_by_id(prediction_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Prediction '{prediction_id}' not found.")
    pdf_path = generate_prediction_pdf(record)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"GeoFlood_Report_{prediction_id[:8]}.pdf"
    )

# 7. Historical analysis endpoints
@router.get("/historical/summary")
def historical_summary():
    hist_svc = HistoricalService.get_instance()
    return hist_svc.get_summary()

@router.get("/historical/distribution")
def historical_distribution(
    state: Optional[str] = None,
    basin: Optional[str] = None,
    year_min: Optional[int] = None,
    year_max: Optional[int] = None
):
    hist_svc = HistoricalService.get_instance()
    return hist_svc.get_distribution_data(state=state, basin=basin, year_min=year_min, year_max=year_max)

@router.get("/historical/events")
def historical_events(
    state: Optional[str] = None,
    basin: Optional[str] = None,
    gauge_id: Optional[str] = None,
    flood_type: Optional[str] = None,
    year: Optional[int] = None,
    limit: int = 50,
    offset: int = 0
):
    hist_svc = HistoricalService.get_instance()
    return hist_svc.get_events(
        state=state, basin=basin, gauge_id=gauge_id,
        flood_type=flood_type, year=year, limit=limit, offset=offset
    )

# 8. Interactive Map endpoints
@router.get("/map/gauges")
def map_gauges():
    loc_svc = LocationService.get_instance()
    return loc_svc.get_all_gauges()
