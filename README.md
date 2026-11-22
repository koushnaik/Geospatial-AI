# GeoFlood AI: Geospatial Flood Occurrence and Severity Prediction System

[![Platform](https://img.shields.io/badge/Platform-macOS%20Apple%20Silicon%20(M4)-blue.svg)](#apple-silicon-compatibility)
[![Python](https://img.shields.io/badge/Python-3.10-green.svg)](#backend-stack)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](#api-documentation)
[![React](https://img.shields.io/badge/React-18%20%7C%20Vite%205-61DAFB.svg)](#frontend-architecture)
[![Dataset](https://img.shields.io/badge/Dataset-INDOFLOODS%20(BAMS%202024)-orange.svg)](#primary-dataset)
[![Sensors](https://img.shields.io/badge/Satellite-Sentinel--1%20SAR%20(Sen1Floods11)-purple.svg)](#satellite-segmentation)

GeoFlood AI is an enterprise-grade, scientifically validated artificial intelligence system engineered for **Three-Class Flood Occurrence & Severity Prediction** (`No Flood`, `Flood`, and `Severe Flood`) and **Satellite SAR Flood Water Extent Segmentation** across river basins.

The system combines 55 years of hydrometric records from the Indian Central Water Commission (CWC), watershed geomorphology, antecedent precipitation dynamics, cooperative game-theoretic explainability (SHAP), and deep learning segmentation on Sentinel-1 Synthetic Aperture Radar (SAR) imagery.

---

## 1. Core Architecture & Objectives

### A. Three-Class Hydrological Prediction
Unlike naive binary systems, GeoFlood AI addresses the operational reality faced by disaster mitigation authorities:
- **Class 0: No Flood** — Baseline streamflow and non-flood hydrometeorological conditions where runoff remains within standard channel capacity.
- **Class 1: Flood** — Streamflow crosses the statutory **Warning Level** threshold, inundating low-lying agricultural floodplains.
- **Class 2: Severe Flood** — Peak discharge breaches the statutory **Danger Level** threshold, requiring immediate embankment reinforcements, civic alerts, and evacuations.

### B. High-Resolution Satellite SAR Flood Water Segmentation
- Leverages Sentinel-1 C-band SAR VV/VH polarizations.
- Features deep convolutional architectures (**U-Net**, **DeepLabV3**, and **SegFormer**).
- Validated externally across 85 independent test scenes from the Sen1Floods11 benchmark (Bolivia, Pakistan, Sri Lanka) with **zero spatial leakage**.

---

## 2. Primary Dataset: INDOFLOODS & Provenance

GeoFlood AI is trained on verified hydrometric records:
- **Publication:** *INDOFLOODS: A Comprehensive Database for Flood Events in India Enhanced with Catchment Attributes*
- **Authors:** Sai Kiran Kuntla & Manabendra Saharia (Department of Civil Engineering & Yardi School of AI, IIT Delhi)
- **Journal DOI:** [10.1175/BAMS-D-24-0008.1](https://doi.org/10.1175/BAMS-D-24-0008.1) | **Zenodo:** [14584655](https://zenodo.org/records/14584655)
- **Monitored Network:** 155 Central Water Commission (CWC) river gauging stations across 21 Indian States and Union Territories.
- **Dataset Scale:** 7,338 total verified observations (4,548 historical flood events across 1965–2020 + 2,790 non-flood observations).

---

## 3. Pre-Event Feature Engineering & Strict Leakage Prevention

To guarantee scientific defensibility during technical review:
1. **Target-Defining Thresholds Purged:** `Warning Level` and `Danger Level` streamflow elevations are strictly excluded from predictive features.
2. **Post-Event Variables Eliminated:** Peak stage, peak discharge, total flood volume, hydrograph duration, and recession rates are completely purged.
3. **Engineered Hydrological Indicators:**
   - **Rainfall Burst Ratio:** $\frac{T_{1d}}{T_{10d} + \epsilon}$ (captures acute convective cloudbursts vs prolonged seasonal accumulation).
   - **Antecedent Saturation Proxy:** $\frac{T_{10d} - T_{1d}}{9.0}$ (models pre-event soil moisture saturation deficit).
   - **Runoff Potential:** $\frac{T_{3d} \times \text{Drainage Density}}{\text{Form Factor} + 0.1}$ (quantifies basin routing efficiency).
4. **Physical Catchment Morphology:** Drainage area, catchment relief, drainage density, stream order, relief ratio, elongation ratio, circularity ratio, soil classification (Harmonized World Soil DB), lithology, and land cover.

---

## 4. Leakage-Free Validation Scheme

Standard random train/test splits cause catastrophic spatial leakage because static catchment slope, relief, and soil attributes are repeated for historical events at the same gauge.

GeoFlood AI enforces **StratifiedGroupKFold Validation (5 Folds)** strictly grouped on `GaugeID`:
- **Training Set:** 6,246 observations across 124 gauge basins.
- **Holdout Test Set:** 1,092 observations across 31 completely unseen gauge basins.
- **Cross-Contamination:** **0.0%** (zero gauge overlap between training and evaluation partitions).

---

## 5. Machine Learning Benchmark Results

Holdout evaluation on 1,092 unseen catchment events:

| Algorithm | Holdout Accuracy | Macro F1-Score | Severe Flood F1 | Multiclass ROC-AUC | Brier Score | Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Random Forest (Primary)** | **74.27%** | **62.05%** | **28.79%** | **0.8486** | **0.3708** | 8.8 ms |
| **Support Vector Machine (RBF)** | 72.80% | 64.39% | 27.52% | 0.8067 | 0.3953 | 12.1 ms |
| **XGBoost Classifier** | 70.60% | 60.31% | **32.07%** | 0.8310 | 0.4496 | 4.9 ms |
| **Logistic Regression (L2)** | 66.30% | 55.93% | 20.83% | 0.8031 | 0.4851 | 1.2 ms |
| **Decision Tree (CART)** | 65.29% | 57.65% | 38.87% | 0.7778 | 0.6941 | 1.1 ms |

---

## 6. Satellite SAR Flood Water Segmentation Validation

Evaluated on **85 independent Sen1Floods11 test scenes** across Bolivia (15), Pakistan (28), and Sri Lanka (42):

| Deep Learning Architecture | Test IoU (Jaccard) | Test Dice (F1) | Precision | Recall | Pixel Accuracy | Inference Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **U-Net (ResNet-34 Encoder)** | **0.5033** | **0.6696** | **0.7223** | **0.6241** | **93.12%** | **824 ms** |

- **Spatial Leakage:** 0.0% overlap between the 274 training tiles and the 85 global test tiles.

---

## 7. Clean White Enterprise Theme & UI Architecture

The web platform features an enterprise light mode interface:
- **Color System:** Pure White (`#FFFFFF`), Soft Slate Slate (`#F8FAFC`), Light Slate Border (`#E2E8F0`), Deep Charcoal Text (`#0F172A`), Secondary Text (`#64748B`), Royal Blue Accent (`#2563EB`), Emerald Accent (`#0D9488`).
- **Interactive Mapping:** Supports Leaflet with multi-style CARTO Basemaps (Positron Light, Voyager Hydrology/Terrain, Dark Matter), Mapbox Light/Satellite, and zero-configuration OpenStreetMap fallback. Features station risk filtering (Low, Moderate, High Severe Rate), in-app API key configuration, and dynamic GeoJSON watershed polygon rendering.
- **Explainable AI (SHAP):** Real-time TreeExplainer feature attributions for every prediction.
- **Reporting:** Automated PDF generation with five-algorithm consensus tables, SHAP attributions, and hydrological risk synthesis.

---

## 8. Quick Start & Execution

### Prerequisites
- macOS Apple Silicon (M1/M2/M3/M4) or Linux x86_64
- Python 3.10+
- Node.js 18+ and npm

### One-Command Launch
```bash
# Clone the repository
git clone https://github.com/koushnaik/Geospatial-AI.git
cd Geospatial-AI

# Run automated setup & start server
./run.sh
```
The application will launch at **`http://localhost:8000`** (or `http://localhost:8080` if 8000 is occupied).

### Manual Development Setup

#### Backend:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Frontend:
```bash
cd frontend
npm install
npm run build
```

#### Run Automated Test Suites:
```bash
# Tabular prediction test suite (11/11 tests)
pytest tests/test_geoflood.py -v

# Satellite SAR segmentation test suite (8/8 tests)
python3 -m unittest tests/test_colab_segmentation.py -v
```

---

## 9. Academic Citations

```bibtex
@article{kuntla2024indofloods,
  title={INDOFLOODS: A Comprehensive Database for Flood Events in India Enhanced with Catchment Attributes},
  author={Kuntla, Sai Kiran and Saharia, Manabendra},
  journal={Bulletin of the American Meteorological Society},
  volume={105},
  number={10},
  pages={E1892--E1911},
  year={2024},
  doi={10.1175/BAMS-D-24-0008.1}
}

@article{bonafilia2020sen1floods11,
  title={Sen1Floods11: a georeferenced dataset to train and test deep learning flood algorithms for Sentinel-1},
  author={Bonafilia, Derrick and Tellman, Beth and Anderson, Tyler and Issifu, Eknath},
  journal={IEEE CVPR Workshops},
  pages={210--211},
  year={2020}
}
```

---

## 10. License
Developed for academic, research, and non-commercial disaster risk reduction applications under the Apache 2.0 License.
