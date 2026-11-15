# GeoFlood AI: Historical Flood Susceptibility Analysis Using Geospatial Data Fusion and Machine Learning

**Academic AIML Mini-Project & Research Platform**  
*System Target: Apple Silicon M4 / macOS Sequoia & Linux/Colab Compatible*

---

## 1. Project Overview & Objective

**GeoFlood AI** is an intelligent, research-grade geospatial intelligence and machine learning platform designed to analyze historical flood susceptibility. By fusing multi-source earth observation datasets—including high-resolution satellite imagery, digital elevation models, gridded precipitation products, and land-cover maps—the platform classifies geographic terrains into five interpretable susceptibility categories:

- **Very Low** ($0.00 - 0.20$ score) — *Dark Green*
- **Low** ($0.20 - 0.40$ score) — *Light Green*
- **Moderate** ($0.40 - 0.60$ score) — *Yellow*
- **High** ($0.60 - 0.80$ score) — *Orange*
- **Very High** ($0.80 - 1.00$ score) — *Red*

> **Scientific Scope & Disclaimer:**  
> This platform computes **retrospective static and antecedent environmental susceptibility**. It models the physical hazard propensity of terrain based on topography, hydrological convergence, and historical precipitation patterns. It is **not an operational real-time hydrodynamic forecast or an official disaster alert service**.

---

## 2. System Architecture

```
                                  [ User Interface ]
                        React.js + Vite + Tailwind CSS + Leaflet (16 Pages)
                                         │
                                         ▼ (REST / JSON)
                                [ FastAPI Backend ]
                             backend/main.py (Port 8000)
                                         │
       ┌──────────────────┬──────────────┴────────────────┬──────────────────┐
       ▼                  ▼                               ▼                  ▼
[ Dataset Manager ]  [ Preprocessor ]            [ Model Registry ]   [ Deep Segmentation ]
- ISRO Bhuvan        - Spatial Dedup             - Logistic Reg       - U-Net (PyTorch)
- Global Flood DB    - Median Imputation         - Random Forest      - DeepLabv3+
- ESA WorldCover     - TWI Derivation            - SVM (RBF)          - SegFormer
- NASA SRTM          - Scaler & OneHot           - XGBoost            - 1,423 Verified Pairs
- NASA GPM IMERG     - Spatial Block Split       - LightGBM (Optuna)
                                                 - CatBoost (Optuna)
                                                 - Soft Voting Ensemble
```

---

## 3. Mandatory Six Machine Learning Algorithms

All six algorithms are independently implemented, calibrated, and evaluated against the identical held-out spatial block validation partition ($N=304$ samples across 5 Indian river basins):

1. **Logistic Regression**  
   - *Mathematical Formulation:* $P(Y=1|X) = \frac{1}{1 + e^{-(\beta_0 + \sum \beta_i x_i)}}$  
   - Baseline linear interpretable classifier with balanced class weighting. Lowest Brier score ($0.1862$).
2. **Random Forest Classifier**  
   - Ensemble of 250 decorrelated decision trees minimizing Gini impurity with sub-sampling. Achieved the highest raw flood recall ($78.35\%$).
3. **Support Vector Machine (RBF Kernel)**  
   - Non-linear maximum-margin hyperplane in RKHS with radial basis kernel: $K(x, x') = \exp(-\gamma ||x - x'||^2)$. Calibrated with Platt probability scaling.
4. **XGBoost (Extreme Gradient Boosting)**  
   - Regularized second-order Taylor expansion gradient tree booster. Strong balanced performance (Macro F1: $0.7778$).
5. **LightGBM (Histogram-based Boosting)**  
   - Gradient-based One-Side Sampling (GOSS) and Exclusive Feature Bundling (EFB). Configured with single-threaded isolated execution (`n_jobs=1`, `force_col_wise=True`) on Apple Silicon M4. Tuned via Optuna to **$81.18\%$ Precision**.
6. **CatBoost (Categorical Boosting)**  
   - Symmetric oblivious decision trees with ordered target encoding regularization. Configured with `thread_count=1`. Tuned via Optuna to **$78.42\%$ F1** and **$73.03\%$ Accuracy**.
7. **Soft-Voting Consensus Ensemble**  
   - Soft probability averaging: $\bar{P}(Y=1|X) = \frac{1}{6} \sum_{i=1}^6 P(Y=1|X, M_i)$. Superior probability calibration (ECE: **$0.0771$**, ROC-AUC: **$0.7708$**).

---

## 4. Evaluated Performance Benchmarks ($N=304$ Held-Out Test Set)

| Model | Accuracy | Positive Precision | Flood Recall | Macro F1 | ROC-AUC | Brier Score | ECE | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **CatBoost (Optuna)** | **73.03%** | 80.11% | 76.80% | **0.7842** | 0.7576 | 0.2031 | 0.1128 | *Best Tuned Tree Model* |
| **Random Forest** | 72.70% | 78.76% | **78.35%** | 0.7855 | 0.7674 | 0.1923 | 0.1132 | *Highest Raw Recall* |
| **Soft Voting Ensemble**| 72.37% | 79.89% | 75.77% | 0.7778 | 0.7708 | 0.1886 | **0.0771** | *Best ECE / Consensus* |
| **XGBoost** | 72.37% | 79.89% | 75.77% | 0.7778 | 0.7542 | 0.2018 | 0.0976 | *Baseline Gradient Booster* |
| **LightGBM (Optuna)** | 71.05% | **81.18%** | 71.13% | 0.7582 | 0.7636 | 0.1980 | 0.0949 | *Highest Precision* |
| **Logistic Regression**| 71.05% | 80.46% | 72.16% | 0.7609 | **0.7953** | **0.1862** | 0.1170 | *Linear Baseline / Lowest Brier* |
| **SVM (RBF)** | 70.39% | 79.21% | 72.68% | 0.7581 | 0.7551 | 0.1919 | 0.0769 | *Non-Linear Boundary* |
| **LightGBM (Baseline)**| 70.07% | 79.43% | 71.65% | 0.7534 | 0.7545 | 0.2063 | 0.1126 | *Single-Thread Isolated* |
| **CatBoost (Baseline)**| 68.09% | 77.40% | 70.62% | 0.7385 | 0.7437 | 0.2041 | 0.0859 | *Single-Thread Isolated* |

---

## 5. Geospatial Feature Engineering & Topographic Wetness Index (TWI)

The system extracts and normalizes 16 physical terrain and environmental features:
- **Topographic Wetness Index (TWI):** Computed via $TWI = \ln\left(\frac{a}{\tan \beta}\right)$, where $a$ is the specific upslope catchment area per unit contour length (derived from D8 flow accumulation) and $\beta$ is the terrain slope gradient in radians.
- **ESA WorldCover 10m Classes:** Tree cover (10), Shrubland (20), Grassland (30), Cropland (40), Built-up (50), Permanent Water (80), Herbaceous Wetland (90), Mangroves (95).
- **Antecedent Precipitation Index:** 24-hour, 7-day, and 30-day cumulative precipitation from NASA GPM IMERG.

---

## 6. Image-Based Flood Segmentation Module

- **Architectures Supported:**
  1. **U-Net** (Encoder-Decoder with skip connections, 7.77M parameters)
  2. **DeepLabv3+** (Atrous Spatial Pyramid Pooling with multi-scale dilated convolutions)
  3. **SegFormer** (Hierarchical Transformer representation with lightweight MLP decoder)
- **Verified Dataset Audit:**
  - AIFloodSense: 470 pairs (376 train, 94 test)
  - Flood Area Segmentation: 290 pairs
  - Flood Semantic Segmentation (Sen1Floods11): 663 pairs (600 train, 63 val)
  - **Total Verified Pairs:** **1,423**
- **Historical Baseline Validation Result:**
  - **Validation IoU:** **0.9076**
  - **Validation Dice:** **0.9512** (Epoch 14/15, 480 train / 120 val samples)

---

## 7. Explainable AI (SHAP) & Optuna Bayesian Optimization

- **TreeExplainer & LinearExplainer:** Global mean absolute SHAP feature importance rankings.
- **Local Waterfall Breakdown:** Decomposes single-point predictions into positive hazard drivers (e.g. low elevation, high TWI, high 24h rain) and negative protection buffers (e.g. steep slope, high drainage density).
- **Optuna Hyperparameter Optimization:** Tree-structured Parzen Estimator (TPE) Bayesian search over regularization, depth, and learning rates with trial history progression curves.

---

## 8. Installation & Execution Guide (macOS Apple Silicon)

### Prerequisites
- macOS Apple Silicon (M1/M2/M3/M4) or Linux x86_64
- Python 3.10+
- Node.js 18+ and npm

### Step 1: Python Virtual Environment & Backend Setup
```bash
cd ~/Desktop/aiml

# Activate virtual environment
source .venv/bin/activate

# Launch the FastAPI Backend with Apple Silicon safe threading
OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 PYTHONPATH=. uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The interactive API documentation is available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### Step 2: React Frontend Setup
```bash
cd ~/Desktop/aiml/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
The React GIS analytics platform will open at: [http://127.0.0.1:5173](http://127.0.0.1:5173).

### Step 3: Run Automated Test Suites
```bash
cd ~/Desktop/aiml

# Run unit test suite (10 tests)
PYTHONPATH=. ./.venv/bin/python tests/test_geoflood.py

# Run comprehensive E2E system verification suite (41 tests)
PYTHONPATH=. ./.venv/bin/python scripts/verify_full_system.py
```

---

## 9. Academic Project Directory Structure

```
aiml/
├── backend/
│   └── main.py                  # 27 FastAPI REST endpoints
├── frontend/
│   ├── src/
│   │   ├── components/          # RiskMap (Leaflet GIS), Sidebar
│   │   ├── pages/               # 16 React Research Pages
│   │   ├── services/api.js      # Axios API Client
│   │   └── App.jsx              # Main App router
│   ├── dist/                    # Compiled production bundle
│   └── package.json
├── src/
│   ├── geospatial_features.py   # 16-feature schema & TWI formula
│   ├── dataset_manager.py       # Catalog, real sources & Demo mode
│   ├── data_preprocessing.py    # Imputation, deduplication, EDA
│   ├── model_training.py        # 6 ML algorithms, spatial split, Optuna
│   ├── model_evaluation.py      # Brier score, ECE, calibration curves
│   ├── prediction.py            # Simultaneous 9-model inference
│   ├── explainability.py        # SHAP global & waterfall breakdown
│   ├── segmentation_module.py   # U-Net, DeepLabv3+, SegFormer
│   ├── evaluation_charts.py     # ROC, bar chart, and calibration curves
│   └── report_generator.py      # ReportLab PDF generator
├── artifacts/
│   ├── models/                  # 9 .joblib bundles (preserved baseline + tuned)
│   └── experiment_results/      # JSON metrics, curves, and confusion matrices
├── reports/
│   └── charts/                  # Matplotlib PNG evaluation figures
├── data/
│   └── demo/                    # Calibrated multi-basin demonstration dataset
├── scripts/
│   └── verify_full_system.py    # 41-check E2E automated verification suite
├── tests/
│   └── test_geoflood.py         # Automated unit test suite (10 tests)
├── README.md                    # Master technical guide
├── MODEL_TRAINING.md            # Detailed algorithm metrics & Optuna logs
├── PROJECT_PROGRESS.md          # Implementation progress tracking
├── API_DOCUMENTATION.md         # 27 REST endpoint specifications
└── DATASET_DOCUMENTATION.md     # Official datasets & 16-feature metadata
```
