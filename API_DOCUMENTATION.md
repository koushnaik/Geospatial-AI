# GeoFlood AI — REST API Documentation

**Service Base URL:** `http://127.0.0.1:8000`  
**API Specification:** OpenAPI 3.1.0 (`/docs` for Swagger UI, `/redoc` for ReDoc)  
**Backend Framework:** FastAPI / Uvicorn (Python 3.10)

---

## 1. System Health & Overview

### `GET /api/health`
Checks backend service availability and counts loaded ML model pipelines.
- **Response:**
  ```json
  {
    "status": "healthy",
    "timestamp": 1731610000.0,
    "service": "GeoFlood AI Platform API",
    "version": "2.0.0",
    "loaded_models_count": 9,
    "hardware_acceleration": "Apple Silicon (MPS/CPU)",
    "demo_mode": true
  }
  ```

### `GET /api/dashboard/overview`
High-level KPIs, model summary, study area presets, and recent system audit events.
- **Response:**
  ```json
  {
    "kpis": {
      "total_models": 9,
      "ensemble_f1": 0.7778,
      "ensemble_roc_auc": 0.7708,
      "best_single_model": "Random Forest",
      "best_single_f1": 0.7855,
      "segmentation_iou": 0.9076,
      "monitored_basins": 5,
      "features_extracted": 16
    },
    "recent_activities": [...],
    "study_areas": [...]
  }
  ```

---

## 2. Geospatial Datasets & Preprocessing

### `GET /api/datasets`
Returns the verified dataset catalog and active training dataset metadata.
- **Response:** List of official data sources (GFD, ISRO Bhuvan, ESA WorldCover, SRTM, GPM IMERG, Sentinel-1/2, HydroSHEDS) and active record count.

### `GET /api/datasets/{dataset_id}`
Detailed provenance and citation data for an individual dataset.

### `POST /api/datasets/upload`
Uploads external point CSV or GeoTIFF data (`multipart/form-data`).

### `POST /api/preprocessing/run`
Executes full preprocessing pipeline: spatial deduplication, median imputation, IQR outlier detection, and spatial grid binning.

### `GET /api/eda/summary`
Calculates distributions, class balance, correlation matrix with `flood_label`, and IQR statistics across all 16 geospatial features.

---

## 3. Model Training & Comparison

### `GET /api/models`
Lists all trained `.joblib` model bundles present in `artifacts/models/`.

### `GET /api/models/comparison`
Returns comprehensive metrics suite across all models evaluated on the spatial block holdout ($N=304$):
- Metrics: Accuracy, Precision, Recall, Macro F1, ROC-AUC, Brier Score, ECE.
- Curves: ROC curves, Precision-Recall curves, Reliability/Calibration curves.
- Confusion matrices: TN, FP, FN, TP.

### `POST /api/training/start`
Asynchronously triggers retraining with background worker. Supports `skip_existing=true` to preserve existing models.

### `GET /api/training/status/{job_id}`
Polls training progress (0.0 to 1.0) and status messages.

---

## 4. Inference & Ensemble Susceptibility

### `POST /api/prediction/single`
Multi-model inference for custom environmental coordinates.
- **Request Body:**
  ```json
  {
    "latitude": 10.150,
    "longitude": 76.400,
    "elevation": 12.5,
    "slope": 1.2,
    "rainfall_24h": 220.0,
    "distance_to_river": 180.0,
    "flow_accumulation": 18500.0,
    "landcover": 50
  }
  ```
- **Response:**
  - `ensemble`: Probability, susceptibility category (`Very Low`, `Low`, `Moderate`, `High`, `Very High`), color hex, advisory text.
  - `model_predictions`: Predictions and probabilities from all 6 models + Optuna models.
  - `derived_features`: Calculated TWI ($\ln(a / \tan \beta)$) and one-hot indicators.

### `POST /api/prediction/compare`
Side-by-side comparison across baseline, Optuna-tuned, and ensemble models for the given coordinate vector.

---

## 5. Explainable AI & Hyperparameter Tuning

### `POST /api/explainability/shap`
Calculates TreeExplainer or LinearExplainer SHAP values:
- `global_explanation`: Top 10 mean $|SHAP|$ features and relative impact percentages.
- `local_explanation`: Feature-by-feature waterfall contributions pushing susceptibility higher or lower.

### `POST /api/optimization/start`
Executes Optuna Bayesian optimization using Tree-structured Parzen Estimator (TPE):
- Query Parameters: `model_name` (e.g., CatBoost), `n_trials` (e.g., 10).
- Response: `best_params`, `baseline_metrics`, `optimized_metrics`, `improvement`, `trials` progression history.

### `GET /api/feature-selection/rankings`
Consensus ranking across Random Forest Importance, Mutual Information, and Permutation Importance.

---

## 6. Satellite Flood Image Segmentation

### `POST /api/segmentation/analyze`
Uploads optical or SAR satellite image for flood water surface delineation.
- Form Data: `file` (PNG/JPG/TIFF), `architecture` (`U-Net`, `DeepLabv3+`, `SegFormer`), `threshold` (0.50).
- Response: Flooded pixel percentage, water surface area ($\text{km}^2$), base64 binary flood mask, base64 visual overlay, and verified validation metrics.

### `GET /api/segmentation/benchmarks`
Historical audit benchmarks across 1,423 verified image pairs:
- U-Net Baseline: Validation IoU `0.9076`, Dice `0.9512`.

---

## 7. Reports & System Control

### `POST /api/reports/generate?report_type=Technical%20Evaluation`
Generates PDF evaluation report via ReportLab and returns downloadable file path.

### `POST /api/demo/reset`
Resets the demonstration workspace to the calibrated multi-basin Indian flood dataset.

### `GET /api/study-areas`
Returns geographical coordinates and feature profiles for 5 monitored river basins.
