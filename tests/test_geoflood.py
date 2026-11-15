"""
GeoFlood AI Comprehensive Automated Test Suite
Validates:
1. Health and service readiness
2. Dataset loading, merging, and provenance
3. Non-flood observations file integrity
4. Data quality and leakage exclusion
5. Geographic and GeoJSON endpoints
6. All 5 model artifact loadings
7. Independent predictions across all 5 models
8. 3-class prediction outputs (No Flood, Flood, Severe Flood)
9. Probability vector validity and confidence bounds
10. SHAP TreeExplainer feature attributions
11. SQLite prediction logging and retrieval
12. PDF report generation and binary integrity
13. Input boundary and schema validation (Pydantic 422)
14. Historical analysis analytics endpoints
"""

import os
import sys
import json
import pytest
import sqlite3
from fastapi.testclient import TestClient

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, project_root)

from backend.app.main import app
from backend.app.ml.prediction.predictor import ModelManager

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True

def test_dataset_summary_and_audit():
    res = client.get("/api/datasets/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["dataset_name"] == "INDOFLOODS"
    assert data["final_merged_shape"]["events"] == 4548
    assert data["final_merged_shape"]["unique_gauges"] == 155
    assert data["target_distribution"]["Severe Flood"] > 0
    assert data["target_distribution"]["Flood"] > 0

def test_non_flood_provenance_and_dataset_integrity():
    """Verify non-flood observations file and merged 3-class dataset."""
    base_dir = project_root
    nf_path = os.path.join(base_dir, "datasets/processed/genuine_non_flood_observations.csv")
    full_path = os.path.join(base_dir, "datasets/processed/model_features_dataset.csv")

    assert os.path.exists(nf_path), "Non-flood observations CSV must exist"
    assert os.path.exists(full_path), "Merged 3-class feature dataset must exist"

    import pandas as pd
    df_nf = pd.read_csv(nf_path)
    assert len(df_nf) >= 2500, f"Expected at least 2500 non-flood observations, got {len(df_nf)}"
    assert (df_nf["target"] == 0).all(), "All non-flood rows must have target=0"

    df_full = pd.read_csv(full_path)
    assert len(df_full) >= 7000, f"Expected >= 7000 observations, got {len(df_full)}"
    assert set(df_full["target"].unique()) == {0, 1, 2}, "Must contain all 3 classes: 0, 1, 2"
    assert df_full["GaugeID"].nunique() == 155, "Must cover all 155 CWC stations"

def test_data_quality_and_leakage_exclusion():
    res = client.get("/api/datasets/quality")
    assert res.status_code == 200
    data = res.json()
    excluded = data["leakage_prevention"]["excluded_post_event_variables"]
    assert "Warning Level" in excluded
    assert "Danger Level" in excluded
    assert "Peak Flood Level (m)" in excluded
    assert "Peak Discharge Q (cumec)" in excluded
    assert "Flood Volume (cumec)" in excluded

def test_locations_endpoints():
    states = client.get("/api/locations/states").json()
    assert len(states) > 10
    assert "Maharashtra" in states or "Karnataka" in states

    basins = client.get("/api/locations/basins").json()
    assert len(basins) > 5

    gauges = client.get("/api/locations/gauges").json()
    assert len(gauges) == 155
    first_gauge = gauges[0]
    assert "gauge_id" in first_gauge
    assert "latitude" in first_gauge
    assert "longitude" in first_gauge

    single = client.get(f"/api/locations/{first_gauge['gauge_id']}").json()
    assert single["gauge_id"] == first_gauge["gauge_id"]
    assert "catchment_attributes" in single
    assert "Drainage Area" in single["catchment_attributes"]

def test_catchment_geojson_endpoint():
    gauges = client.get("/api/locations/gauges").json()
    first_id = gauges[0]["gauge_id"]
    res = client.get(f"/api/locations/{first_id}/catchment-geojson")
    assert res.status_code == 200
    geojson = res.json()
    assert geojson["type"] == "Feature"
    assert geojson["geometry"]["type"] == "Polygon"
    assert len(geojson["geometry"]["coordinates"][0]) > 0

def test_all_five_models_artifacts_and_comparison():
    res = client.get("/api/models/comparison")
    assert res.status_code == 200
    data = res.json()
    assert "best_model" in data
    assert "evaluation_metrics" in data
    metrics = data["evaluation_metrics"]
    
    expected_algos = [
        "Logistic Regression", "Random Forest", "Decision Tree",
        "Support Vector Machine", "XGBoost"
    ]
    for algo in expected_algos:
        assert algo in metrics, f"Missing {algo} in evaluation metrics"
        assert metrics[algo]["accuracy"] > 0.40
        assert metrics[algo]["f1_macro"] > 0.35
        assert metrics[algo]["training_time_sec"] >= 0

def test_three_class_prediction_scenarios():
    """Verify live inference across the 3 output classes: No Flood, Flood, Severe Flood."""
    base_morphology = {
        "Drainage Area": 5200.0,
        "Catchment Relief": 850.0,
        "Catchment Length": 78.0,
        "Catchment Perimeter": 190.0,
        "Drainage Density": 0.65,
        "Stream Order": 4,
        "Sinuosity Index": 1.35,
        "Form Factor": 0.85,
        "Relief Ratio": 0.011,
        "Elongation Ratio": 0.65,
        "Circularity Ratio": 0.55,
        "Annual Precipitation": 1450.0,
        "Precipitation Seasonality": 65.0,
        "Annual Mean Temperature": 24.5,
        "Soil type": "Vertisols",
        "Land cover": "Cropland",
        "lithology type": "Basic volcanic rocks",
        "KoppenGeiger Climate Type": "Tropical"
    }

    # 1. Zero/Low rain -> Should predict No Flood
    low_rain_payload = {
        **base_morphology,
        "mode": "manual",
        "T1d": 0.0, "T2d": 0.0, "T3d": 0.0, "T4d": 0.0, "T5d": 0.0,
        "T6d": 0.0, "T7d": 0.0, "T8d": 0.0, "T9d": 0.0, "T10d": 0.0
    }
    res_low = client.post("/api/predictions", json=low_rain_payload)
    assert res_low.status_code == 200
    pred_low = res_low.json()
    assert pred_low["predicted_class"] == "No Flood"
    assert pred_low["predicted_class_id"] == 0

    # 2. Extreme rain -> Should predict Severe Flood
    extreme_rain_payload = {
        **base_morphology,
        "mode": "manual",
        "T1d": 250.0, "T2d": 400.0, "T3d": 500.0, "T4d": 580.0, "T5d": 640.0,
        "T6d": 700.0, "T7d": 750.0, "T8d": 800.0, "T9d": 850.0, "T10d": 900.0
    }
    res_extreme = client.post("/api/predictions", json=extreme_rain_payload)
    assert res_extreme.status_code == 200
    pred_extreme = res_extreme.json()
    assert pred_extreme["predicted_class"] == "Severe Flood"
    assert pred_extreme["predicted_class_id"] == 2

def test_prediction_workflow_station_mode_and_pdf():
    gauges = client.get("/api/locations/gauges").json()
    test_gauge = client.get(f"/api/locations/{gauges[0]['gauge_id']}").json()
    
    payload = {
        "mode": "station",
        "gauge_id": test_gauge["gauge_id"],
        "station_name": test_gauge["station"],
        "state": test_gauge["state"],
        "basin": test_gauge["basin"],
        "T1d": 95.0, "T2d": 140.0, "T3d": 180.0, "T4d": 210.0, "T5d": 230.0,
        "T6d": 250.0, "T7d": 270.0, "T8d": 280.0, "T9d": 290.0, "T10d": 300.0,
        **test_gauge["catchment_attributes"]
    }
    
    res = client.post("/api/predictions", json=payload)
    assert res.status_code == 200
    pred = res.json()
    assert "prediction_id" in pred
    assert pred["predicted_class"] in ["No Flood", "Flood", "Severe Flood"]
    assert 0.0 <= pred["confidence"] <= 1.0
    assert len(pred["all_predictions"]) == 5
    assert pred["agreement_count"] >= 1
    
    # Check SHAP explanation
    assert "explanation" in pred
    assert "top_factors" in pred["explanation"]
    assert len(pred["explanation"]["top_factors"]) == 10
    assert "summary_text" in pred["explanation"]

    # Check retrieve prediction by ID
    pred_id = pred["prediction_id"]
    get_res = client.get(f"/api/predictions/{pred_id}")
    assert get_res.status_code == 200
    assert get_res.json()["prediction_id"] == pred_id

    # Check SQLite logging
    db_path = os.path.join(project_root, "reports/geoflood.db")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT prediction_id, predicted_class FROM predictions WHERE prediction_id = ?", (pred_id,))
    row = cur.fetchone()
    conn.close()
    assert row is not None
    assert row[0] == pred_id

    # Check PDF generation and binary content
    pdf_res = client.get(f"/api/reports/{pred_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 10000

def test_invalid_input_validation():
    # Test negative rainfall rejected (HTTP 422)
    bad_payload = {
        "mode": "manual",
        "T1d": -50.0,
        "T2d": 10.0, "T3d": 20.0, "T4d": 30.0, "T5d": 40.0,
        "T6d": 50.0, "T7d": 60.0, "T8d": 70.0, "T9d": 80.0, "T10d": 90.0,
        "Drainage Area": 1000.0, "Catchment Relief": 500.0,
        "Catchment Length": 50.0, "Catchment Perimeter": 120.0,
        "Drainage Density": 0.5, "Stream Order": 3,
        "Sinuosity Index": 1.2, "Form Factor": 0.4,
        "Relief Ratio": 0.01, "Elongation Ratio": 0.7,
        "Circularity Ratio": 0.6, "Annual Precipitation": 1200.0,
        "Precipitation Seasonality": 50.0, "Annual Mean Temperature": 25.0,
        "Soil type": "Vertisols", "Land cover": "Cropland",
        "lithology type": "Basic volcanic rocks", "KoppenGeiger Climate Type": "Tropical"
    }
    res = client.post("/api/predictions", json=bad_payload)
    assert res.status_code == 422

    # Test 404 on nonexistent prediction
    res_404 = client.get("/api/predictions/nonexistent-uuid-12345")
    assert res_404.status_code == 404

def test_historical_analysis_endpoints():
    summary = client.get("/api/historical/summary").json()
    assert summary["total_events"] == 4548
    assert summary["year_range"]["min"] <= 1970
    assert summary["year_range"]["max"] >= 2020

    dist = client.get("/api/historical/distribution").json()
    assert len(dist["by_year"]) > 30
    assert len(dist["by_state"]) > 5
    assert len(dist["rainfall_trends"]) == 10

    events = client.get("/api/historical/events?limit=10").json()
    assert events["total"] == 4548
    assert len(events["events"]) == 10
