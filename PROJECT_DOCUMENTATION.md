# GeoFlood AI: Comprehensive Project Architecture & Technical Documentation

## Executive Overview
GeoFlood AI is an operational machine learning decision-support platform designed to predict **Flood Severity** (`Flood` vs `Severe Flood`) across river catchments in India using the peer-reviewed **INDOFLOODS** database (1965–2020).

---

## 1. System Architecture

```
                    ┌──────────────────────────────────────────┐
                    │               User Client                │
                    │   (React 18 + Vite + Tailwind + Leaflet) │
                    └─────────────────────┬────────────────────┘
                                          │ HTTP / REST
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │             FastAPI Backend              │
                    │             (Port 8000)                  │
                    ├──────────────────────────────────────────┤
                    │ • /api/predictions   • /api/locations    │
                    │ • /api/models        • /api/historical   │
                    │ • /api/reports/pdf   • /api/datasets     │
                    └──────┬──────────────────────┬────────────┘
                           │                      │
            ┌──────────────▼──────┐        ┌──────▼───────────────────┐
            │   Prediction Engine │        │    Historical & Spatial  │
            ├─────────────────────┤        ├──────────────────────────┤
            │ • ColumnTransformer │        │ • 4,548 Cleaned Events   │
            │ • 5 ML Algorithms   │        │ • 155 Gauge Stations     │
            │ • SHAP Explainer    │        │ • Shapefile Polygons     │
            │ • SQLite Audit Log  │        │ • ReportLab PDF Service  │
            └─────────────────────┘        └──────────────────────────┘
```

---

## 2. Machine Learning Pipeline Details

### 2.1 Preprocessing Pipeline
- **Numerical Pipeline:** Missing value imputation using feature medians, followed by `StandardScaler` centering to $\mu = 0$ and variance scaling to $\sigma = 1$:
  $$z = \frac{x - \mu}{\sigma}$$
- **Categorical Pipeline:** Missing value imputation using the modal class, followed by `OneHotEncoder(handle_unknown='ignore', sparse_output=False)` producing binary dummy indicator vectors.

### 2.2 Class Imbalance Handling
The training set contains 64.2% Flood and 35.8% Severe Flood events. To prevent majority class bias:
- Tree algorithms (XGBoost, Random Forest, Decision Tree) employ inverse frequency weighting:
  $$\text{scale\_pos\_weight} = \frac{N_{\text{negative}}}{N_{\text{positive}}}$$
- SVM and Logistic Regression employ balanced class weights inversely proportional to class frequencies.

### 2.3 Group-Aware Validation Formulations
Let $G_i$ represent the unique gauge station associated with flood event $i$. The assignment of events into train $D_{\text{train}}$ and test $D_{\text{test}}$ partitions satisfies:
$$G(D_{\text{train}}) \cap G(D_{\text{test}}) = \emptyset$$
This guarantees that models cannot memorize static catchment morphology (e.g. elevation, drainage area, soil) as a proxy for station identity.

---

## 3. The Five Machine Learning Algorithms

### 3.1 XGBoost Classifier (Best Model)
- **Architecture:** Gradient boosted ensemble of regression trees minimizing regularized cross-entropy loss:
  $$\mathcal{L} = \sum_{i=1}^n l(y_i, \hat{y}_i) + \sum_{k=1}^K \left( \gamma T_k + \frac{1}{2}\lambda \sum_{j=1}^{T_k} w_{jk}^2 \right)$$
- **Hyperparameters:** `n_estimators=150`, `max_depth=5`, `learning_rate=0.05`, `subsample=0.8`, `colsample_bytree=0.8`.
- **Holdout Evaluation:** Macro F1 = 68.32%, Accuracy = 68.34%, ROC-AUC = 0.7124.

### 3.2 Random Forest Classifier
- **Architecture:** Bagging ensemble of 200 de-correlated decision trees with bootstrap aggregation.
- **Hyperparameters:** `n_estimators=200`, `max_depth=12`, `min_samples_split=5`, `min_samples_leaf=2`.
- **Holdout Evaluation:** Macro F1 = 66.59%, Accuracy = 66.80%, ROC-AUC = 0.7156.

### 3.3 Support Vector Machine (RBF Kernel)
- **Architecture:** Non-linear margin maximizer mapping input features into an infinite-dimensional reproducing kernel Hilbert space (RKHS):
  $$K(x, x') = \exp\left(-\gamma \|x - x'\|^2\right)$$
- **Hyperparameters:** `C=2.0`, `gamma='scale'`, `probability=True`.
- **Holdout Evaluation:** Macro F1 = 67.53%, Accuracy = 67.57%, ROC-AUC = 0.7332.

### 3.4 Decision Tree Classifier
- **Architecture:** Single CART binary recursive splitting tree optimizing Gini impurity:
  $$I_G(p) = 1 - \sum_{i=1}^C p_i^2$$
- **Hyperparameters:** `max_depth=8`, `min_samples_split=10`, `min_samples_leaf=4`.
- **Holdout Evaluation:** Macro F1 = 61.66%, Accuracy = 61.78%, ROC-AUC = 0.6675.

### 3.5 Logistic Regression (Baseline)
- **Architecture:** Linear generalized linear model with L2 Tikhonov regularization.
- **Holdout Evaluation:** Macro F1 = 39.31%, Accuracy = 43.37%, ROC-AUC = 0.5026.
- **Academic Insight:** Linear models perform poorly because runoff generation is a non-linear threshold mechanism.

---

## 4. Explainable AI: SHAP Mathematical Formulation

GeoFlood AI uses SHAP (SHapley Additive exPlanations) via `TreeExplainer` on the XGBoost model. For each input feature $i$, the attribution $\phi_i$ is defined by:
$$\phi_i = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \left[ f(S \cup \{i\}) - f(S) \right]$$

### Key Feature Drivers Identified:
1. **$T1d$ (1-day antecedent rainfall):** Rapid surge driver providing immediate hydraulic head.
2. **Catchment Relief ($m$):** High slope generates high flow velocity and steep hydrographs.
3. **Annual Precipitation ($mm$):** Regional baseline conditioning normal soil moisture profiles.
4. **Drainage Density ($km/km^2$):** Efficient channel network accelerating catchment drainage into mainstreams.

---

## 5. Verification & Automated Test Results

The automated test suite (`tests/test_geoflood.py`) verifies all 9 core functional contracts:
```
tests/test_geoflood.py::test_health_endpoint PASSED
tests/test_geoflood.py::test_dataset_summary_and_audit PASSED
tests/test_geoflood.py::test_data_quality_and_leakage_exclusion PASSED
tests/test_geoflood.py::test_locations_endpoints PASSED
tests/test_geoflood.py::test_catchment_geojson_endpoint PASSED
tests/test_geoflood.py::test_models_metrics_and_comparison PASSED
tests/test_geoflood.py::test_prediction_workflow_station_mode PASSED
tests/test_geoflood.py::test_invalid_input_validation PASSED
tests/test_geoflood.py::test_historical_analysis_endpoints PASSED
```

---

## 6. How to Run & Demonstrate to Faculty

1. **Launch Server:**
   ```bash
   cd ~/Desktop/GeoFloodAI_Final
   ./run.sh
   ```
2. **Open Browser:** `http://127.0.0.1:8000`
3. **Demonstration Walkthrough:**
   - **Step 1 (Dashboard):** Show live KPIs (4,548 events across 155 gauges).
   - **Step 2 (Map):** Click a gauge station in Maharashtra or Kerala; show its coordinates, historical event counts, and click "Show Boundary" to display the actual watershed shapefile.
   - **Step 3 (Severity Prediction):** Select that gauge station (Mode A), demonstrate how catchment attributes automatically populate, and click "Predict Flood Severity".
   - **Step 4 (Results Page):** Inspect the predicted class, observe all 5 algorithms in the comparison table, review the Recharts benchmark, and examine the SHAP risk attribution factors.
   - **Step 5 (PDF Download):** Click "Download PDF Report" to download the formal publication report with embedded tables and charts.
   - **Step 6 (Leakage & Methodology):** Navigate to the Data Preprocessing page to explain why warning/danger levels and peak discharge were excluded.
