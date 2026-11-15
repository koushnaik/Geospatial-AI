# GeoFlood AI – Machine Learning Verification, Model Audit & Testing Report

**Project Title:** GeoFlood AI: Historical Flood Susceptibility Analysis Using Geospatial Data Fusion and Machine Learning  
**Evaluation Target:** Held-Out Spatial Test Partition ($N=304$ samples)  
**System Environment:** Apple Silicon M4 / macOS Sequoia | Python 3.10 | scikit-learn, XGBoost, LightGBM, CatBoost, SHAP, PyTorch  
**Date of Audit:** November 15, 2026  

---

## 1. Executive Summary & Problem Formulation

### 1.1 The Problem We Are Solving
Flood risk assessment in the Indian Subcontinent historically suffers from two major limitations:
1. **Physical hydrodynamic models (e.g., HEC-RAS, MIKE 21)** are computationally expensive, require high-frequency river discharge station telemetry that is frequently unavailable or delayed during flash flooding, and cannot easily scale across un-gauged river sub-basins.
2. **Standard meteorological rain gauges** only measure rainfall volume, ignoring whether that rainfall falls on an elevated, well-drained volcanic ridge (which rapidly sheds runoff) or an alluvial coastal depression (which traps water and ponds for days).

**GeoFlood AI solves this by fusing geospatial environmental covariates with multi-algorithm machine learning** to determine **retrospective and spatial flood susceptibility** (the static topographical and hydrological propensity of a geographic location to experience inundation when exposed to extreme precipitation).

### 1.2 Difference Between Susceptibility, Probability, and Forecasting
It is scientifically critical to differentiate these three concepts:
- **Flood Susceptibility (What our model predicts):** The intrinsic physical propensity of a land unit to be flooded, dictated by its terrain configuration (elevation, slope, aspect, curvature), hydrological convergence (Topographic Wetness Index, drainage density, flow accumulation), distance to riverbeds, soil infiltration rate, and historical frequency.
- **Flood Probability ($P(Y=1 \mid \mathbf{x})$):** The machine learning model's calibrated confidence score ($0.0$ to $1.0$) that a location with feature vector $\mathbf{x}$ belongs to the historically flooded class.
- **Real-Time Flood Forecasting (What our model does NOT do):** Predicting dynamic hourly flood crests, dam release hydrographs, or emergency evacuation warnings over the next 6 to 24 hours.

---

## 2. Complete Data Pipeline & Feature Engineering

### 2.1 Data Provenance & Sources
The ground-truth dataset ($N=1,200$ verified geographic observation points across the Indian Subcontinent) fuses multi-agency open geodetic datasets:

| Data Source | Provider | Resolution | Derived Features |
| :--- | :--- | :--- | :--- |
| **Bhuvan Flood Hazard Layers** | ISRO / NRSC | 30m - 50m | Ground-truth flood occurrence (`flood_label`), historical frequency |
| **Global Flood Database (GFD)** | Dartmouth Flood Obs. / NASA MODIS | 250m | Multi-temporal flood extent masks, permanent water exclusion |
| **SRTM Digital Elevation Model** | NASA / USGS | 30m (1 arc-sec) | Elevation ($m$), Slope ($^\circ$), Aspect ($^\circ$), Catchment Flow Accumulation |
| **ESA WorldCover 2021** | European Space Agency (ESA) | 10m | Land-cover classes (Trees, Grassland, Cropland, Built-up, Wetland) |
| **NASA GPM IMERG** | NASA / JAXA | 0.1° (~10km) | Antecedent rainfall: 24-hour, 7-day cumulative, 30-day seasonal ($mm$) |
| **Hydrological River Networks** | HydroSHEDS / OpenStreetMap | Vector | Euclidean distance to active river channel ($m$), Drainage Density ($km/km^2$) |

### 2.2 Feature Preprocessing Pipeline
Raw data is processed through a strict scikit-learn `ColumnTransformer` to prevent data leakage:
1. **Numerical Pipeline:**
   - Missing value imputation: Median replacement with missingness indicators (`SimpleImputer(strategy='median', add_indicator=True)`).
   - Normalization: Z-score scaling ($\mu=0, \sigma=1$) using `StandardScaler` fitted strictly on training data.
2. **Categorical Pipeline (`landcover`, `soil_type`):**
   - Imputation: Mode replacement (`SimpleImputer(strategy='most_frequent')`).
   - Encoding: `OneHotEncoder(handle_unknown='ignore', sparse_output=False)`.
3. **Derived Hydrological Feature:**
   - **Topographic Wetness Index (TWI):**
     $$\text{TWI} = \ln\left(\frac{\alpha}{\tan \beta + 0.001}\right)$$
     where $\alpha$ is upstream specific catchment area (flow accumulation) and $\beta$ is local slope in radians.

---

## 3. Spatial Partitioning & Prevention of Data Leakage

Standard random $k$-fold cross-validation inflates model accuracy in geospatial applications because nearby points share spatial autocorrelation (Tobler's First Law of Geography). If a point in Kochi is in the train set and a point 100 meters away is in the test set, the model merely memorizes the location.

**GeoFlood AI employs Spatial Block Partitioning:**
- The landscape is segmented into $0.1^\circ \times 0.1^\circ$ spatial grid cells (~11 km $\times$ 11 km).
- Entire geographical blocks are partitioned into training ($75\%$, $N=896$) and held-out testing ($25\%$, $N=304$) sets using `GroupShuffleSplit`.
- Models are tested on geographical areas they have never seen during training or hyperparameter tuning.

---

## 4. Model Verification & Artifact Audit

All 9 trained model pipelines exist in `artifacts/models/` and load into active memory:

| Model Name | Artifact File | File Size | Pipeline Type | Fitted Features | Load Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression** | `logistic_regression.joblib` | 5.6 KB | Scaler + L2-Logistic Regression | 25 features | Verified |
| **Random Forest** | `random_forest.joblib` | 4.9 MB | Scaler + 250 Decision Trees | 25 features | Verified |
| **Support Vector Machine** | `support_vector_machine.joblib` | 155 KB | Scaler + RBF Kernel SVC | 25 features | Verified |
| **XGBoost** | `xgboost.joblib` | 495 KB | Scaler + Gradient Boosted Trees | 25 features | Verified |
| **LightGBM** | `lightgbm.joblib` | 416 KB | Scaler + LightGBM Classifier | 25 features | Verified |
| **CatBoost** | `catboost.joblib` | 238 KB | Scaler + Symmetric Decision Trees | 25 features | Verified |
| **CatBoost (Optuna)** | `catboost_optimized.joblib` | 1.1 MB | Bayesian Tuned CatBoost | 25 features | Verified |
| **LightGBM (Optuna)** | `lightgbm_optimized.joblib` | 467 KB | Bayesian Tuned LightGBM | 25 features | Verified |
| **Soft Voting Ensemble** | `soft_voting_ensemble.joblib` | 6.2 MB | Multi-Model Probability Combiner | 25 features | Verified |

---

## 5. Real Empirical Testing & Accuracy Evaluation

The 9 models were evaluated on the exact held-out spatial test set ($N=304$ samples: 110 Non-Flood / Class 0, 194 Flood / Class 1).

### 5.1 Test Performance Comparison Matrix

| Model | Test Accuracy | Precision | Recall | Macro F1 | ROC-AUC | Brier Score | False Positive Rate (FPR) | False Negative Rate (FNR) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **CatBoost (Optuna)** | **73.03%** | 80.11% | 76.80% | **0.7842** | 0.7576 | 0.2031 | 33.64% | 23.20% |
| **Random Forest** | 72.70% | 78.76% | **78.35%** | **0.7855** | 0.7674 | 0.1923 | 37.27% | **21.65%** |
| **Soft Voting Ensemble** | 72.37% | 79.89% | 75.77% | 0.7778 | 0.7708 | 0.1886 | 33.64% | 24.23% |
| **XGBoost** | 72.37% | 79.89% | 75.77% | 0.7778 | 0.7542 | 0.2018 | 33.64% | 24.23% |
| **Logistic Regression** | 71.05% | 80.46% | 72.16% | 0.7609 | **0.7953** | **0.1862** | 30.91% | 27.84% |
| **LightGBM (Optuna)** | 71.05% | **81.18%** | 71.13% | 0.7582 | 0.7636 | 0.1980 | **29.09%** | 28.87% |
| **Support Vector Machine** | 70.39% | 79.21% | 72.68% | 0.7581 | 0.7551 | 0.1919 | 33.64% | 27.32% |
| **LightGBM (Baseline)** | 70.07% | 79.43% | 71.65% | 0.7534 | 0.7545 | 0.2063 | 32.73% | 28.35% |
| **CatBoost (Baseline)** | 68.09% | 77.40% | 70.62% | 0.7385 | 0.7437 | 0.2041 | 36.36% | 29.38% |

### 5.2 Detailed Confusion Matrices ($N=304$)

$$\begin{array}{c|cc}
\text{Actual} \backslash \text{Pred} & \text{Class 0 (Resilient)} & \text{Class 1 (Susceptible)} \\
\hline
\text{Class 0} & \text{True Negative (TN)} & \text{False Positive (FP)} \\
\text{Class 1} & \text{False Negative (FN)} & \text{True Positive (TP)}
\end{array}$$

- **CatBoost (Optuna Optimized):** $\text{TN}=73, \text{FP}=37, \text{FN}=45, \text{TP}=149$
- **Random Forest:** $\text{TN}=69, \text{FP}=41, \text{FN}=42, \text{TP}=152$
- **Soft Voting Ensemble:** $\text{TN}=73, \text{FP}=37, \text{FN}=47, \text{TP}=147$
- **XGBoost:** $\text{TN}=73, \text{FP}=37, \text{FN}=47, \text{TP}=147$
- **Logistic Regression:** $\text{TN}=76, \text{FP}=34, \text{FN}=54, \text{TP}=140$
- **LightGBM (Optuna Optimized):** $\text{TN}=78, \text{FP}=32, \text{FN}=56, \text{TP}=138$

### 5.3 Best-Performing Model Analysis
1. **Top Single Classifier:** **CatBoost with Optuna Bayesian Tuning** achieved the highest overall test accuracy (**73.03%**) and lowest false negative rate among boosted trees (**23.20%**).
2. **Top Sensitivity / Recall:** **Random Forest** detected the highest proportion of actual flood events (**78.35% recall**, $\text{TP}=152$), making it the safest model for hazard risk aversion.
3. **Probability Calibration:** **Logistic Regression** achieved the best Brier Score (**0.1862**) and ROC-AUC (**0.7953**), confirming that linear combinations of normalized geospatial terrain features provide reliable, un-skewed probability estimates.
4. **Soft Voting Ensemble:** By combining the posterior probability distributions of all classifiers, the ensemble achieved **72.37% accuracy**, an F1 of **0.7778**, and a low Brier Score of **0.1886**, dampening individual algorithm variance.

---

## 6. Actual Test Records & Ground-Truth Verification

Below are 10 real sample rows extracted directly from the held-out spatial test set:

| Row | Latitude | Longitude | Elevation | Slope | 24h Rain | River Dist | Soil Type | Land Cover | Actual Label | Predicted Score | Predicted Class | Verification |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | $10.3238^\circ\text{N}$ | $76.1098^\circ\text{E}$ | $16.7\text{ m}$ | $1.70^\circ$ | $76.8\text{ mm}$ | $757\text{ m}$ | 1 (Clay) | 40 (Crop) | **1 (Flood)** | **0.8063** | **1** | **CORRECT** |
| **2** | $9.5463^\circ\text{N}$ | $76.8569^\circ\text{E}$ | $12.5\text{ m}$ | $10.01^\circ$ | $33.2\text{ mm}$ | $510\text{ m}$ | 2 (Loam) | 40 (Crop) | **0 (Safe)** | **0.5764** | **1** | **FALSE POS** |
| **3** | $10.4379^\circ\text{N}$ | $76.7413^\circ\text{E}$ | $193.5\text{ m}$ | $5.92^\circ$ | $125.4\text{ mm}$ | $571\text{ m}$ | 3 (Sandy) | 30 (Grass) | **0 (Safe)** | **0.3551** | **0** | **CORRECT** |
| **4** | $9.9744^\circ\text{N}$ | $76.4526^\circ\text{E}$ | $32.2\text{ m}$ | $0.48^\circ$ | $87.9\text{ mm}$ | $6295\text{ m}$ | 3 (Sandy) | 30 (Grass) | **0 (Safe)** | **0.1139** | **0** | **CORRECT** |
| **5** | $10.6410^\circ\text{N}$ | $76.3129^\circ\text{E}$ | $5.6\text{ m}$ | $4.85^\circ$ | $39.3\text{ mm}$ | $1162\text{ m}$ | 4 (Silt) | 90 (Wetland) | **1 (Flood)** | **0.7544** | **1** | **CORRECT** |
| **6** | $10.3798^\circ\text{N}$ | $75.9807^\circ\text{E}$ | $19.3\text{ m}$ | $1.61^\circ$ | $97.5\text{ mm}$ | $474\text{ m}$ | 4 (Silt) | 40 (Crop) | **1 (Flood)** | **0.8698** | **1** | **CORRECT** |
| **7** | $9.7140^\circ\text{N}$ | $76.0986^\circ\text{E}$ | $34.1\text{ m}$ | $1.21^\circ$ | $114.4\text{ mm}$ | $6899\text{ m}$ | 1 (Clay) | 40 (Crop) | **0 (Safe)** | **0.1961** | **0** | **CORRECT** |
| **8** | $10.3902^\circ\text{N}$ | $76.1681^\circ\text{E}$ | $140.0\text{ m}$ | $3.54^\circ$ | $169.8\text{ mm}$ | $158\text{ m}$ | 2 (Loam) | 10 (Tree) | **0 (Safe)** | **0.6437** | **1** | **FALSE POS** |
| **9** | $10.2197^\circ\text{N}$ | $76.4825^\circ\text{E}$ | $130.9\text{ m}$ | $2.02^\circ$ | $87.9\text{ mm}$ | $733\text{ m}$ | 2 (Loam) | 80 (Water) | **1 (Flood)** | **0.5090** | **1** | **CORRECT** |
| **10** | $26.1054^\circ\text{N}$ | $93.0810^\circ\text{E}$ | $67.1\text{ m}$ | $3.71^\circ$ | $90.6\text{ mm}$ | $1041\text{ m}$ | 3 (Sandy) | 40 (Crop) | **1 (Flood)** | **0.5386** | **1** | **CORRECT** |

### Key Observations from Test Data:
- **Row 4:** Low elevation ($32.2\text{m}$) but far from river channel ($6.29\text{km}$) with sandy soil correctly classified as **Safe / Non-Flood** ($P=0.1139$).
- **Row 6:** Low elevation ($19.3\text{m}$), flat slope ($1.61^\circ$), and close river distance ($474\text{m}$) correctly predicted as **High Flood Risk** ($P=0.8698$).
- **Row 8 (False Positive):** High rainfall ($169.8\text{mm}$) and proximity to river ($158\text{m}$) caused the model to predict flood risk ($P=0.6437$), but high elevation ($140\text{m}$) protected the site in reality.

---

## 7. Controlled Sensitivity Experiments

To verify that predictions change dynamically and physically without hardcoded biases, controlled experiments were conducted holding all environmental variables fixed while isolating individual features.

### Experiment A: Varying 24h Rainfall (Fixed Elevation = 30m, Slope = 2.0°, Dist to River = 400m)
| 24h Rain | Soft-Voting Score | CatBoost (Optuna) | Random Forest | Risk Category | Physical Mechanism |
| :---: | :---: | :---: | :---: | :--- | :--- |
| **20 mm** | **0.7529** | 0.8246 | 0.7108 | High | Flat river reach has baseline vulnerability even under light rain |
| **60 mm** | **0.8198** | 0.9133 | 0.7763 | Very High | Infiltration thresholds exceeded |
| **120 mm** | **0.8372** | 0.8504 | 0.7706 | Very High | Surface runoff saturation |
| **200 mm** | **0.8557** | 0.8312 | 0.7949 | Very High | Extreme flood stage overtopping |
| **320 mm** | **0.9073** | 0.9309 | 0.7994 | Very High | Monotonic increase with deluge volume |

### Experiment B: Varying Elevation (Fixed Rainfall = 80mm, Slope = 2.0°, Dist to River = 400m)
| Elevation | Soft-Voting Score | CatBoost (Optuna) | Random Forest | Risk Category | Physical Mechanism |
| :---: | :---: | :---: | :---: | :--- | :--- |
| **5.0 m** | **0.8437** | 0.9308 | 0.7496 | Very High | Coastal basin depression acting as sink |
| **25.0 m** | **0.8234** | 0.8917 | 0.7782 | Very High | Low-lying alluvial floodplain |
| **100.0 m** | **0.5174** | 0.5396 | 0.5770 | Moderate | Transition zone |
| **300.0 m** | **0.1921** | 0.1581 | 0.4661 | Very Low | Upland elevation accelerates drainage |
| **800.0 m** | **0.2250** | 0.1581 | 0.4661 | Low | High mountain plateau |

### Experiment C: Varying Distance to Active River Channel (Fixed Rain = 80mm, Elevation = 30m)
| River Distance | Soft-Voting Score | CatBoost (Optuna) | Random Forest | Risk Category | Physical Mechanism |
| :---: | :---: | :---: | :---: | :--- | :--- |
| **50 m** | **0.8456** | 0.9253 | 0.7617 | Very High | Immediate overbank spillway zone |
| **250 m** | **0.8335** | 0.9237 | 0.7724 | Very High | Active meander belt |
| **1,000 m** | **0.7878** | 0.8282 | 0.7488 | High | Secondary floodplain |
| **3,500 m** | **0.5297** | 0.4620 | 0.5669 | Moderate | Buffer zone |
| **8,000 m** | **0.2424** | 0.1599 | 0.4648 | Low | Regional upland unaffected by channel |

---

## 8. Explainability via SHAP (SHapley Additive exPlanations)

Using TreeExplainer on the Random Forest pipeline, feature attributions were calculated for contrasting geographical test sites:

### 8.1 Safe Control Site: Pune / Deccan Upland Ridge ($P=0.122$)
- **Base Expected Value $\mathbb{E}[f(X)]$:** $0.500$
- **Top Contributing Factors:**
  1. `elevation` ($560\text{m}$): $\phi_i = \mathbf{-0.1132}$ (Reduces risk significantly)
  2. `distance_to_river` ($3,800\text{m}$): $\phi_i = \mathbf{-0.0921}$ (Reduces risk significantly)
  3. `slope` ($12.5^\circ$): $\phi_i = \mathbf{-0.0792}$ (Reduces risk significantly)
  4. `twi` ($5.4$): $\phi_i = \mathbf{-0.0400}$ (Reduces risk)
  5. `rainfall_30d` ($120\text{mm}$): $\phi_i = \mathbf{+0.0409}$ (Slight seasonal increase)

### 8.2 Flood-Prone Site: Kochi / Periyar Lowland ($P=0.953$)
- **Base Expected Value $\mathbb{E}[f(X)]$:** $0.500$
- **Top Contributing Factors:**
  1. `distance_to_river` ($120\text{m}$): $\phi_i = \mathbf{+0.0938}$ (Increases risk significantly)
  2. `elevation` ($4.5\text{m}$): $\phi_i = \mathbf{+0.0683}$ (Increases risk significantly)
  3. `twi` ($16.8$): $\phi_i = \mathbf{+0.0654}$ (Increases risk significantly)
  4. `slope` ($0.5^\circ$): $\phi_i = \mathbf{+0.0474}$ (Increases risk)
  5. `rainfall_24h` ($195\text{mm}$): $\phi_i = \mathbf{+0.0338}$ (Increases risk)

---

## 9. Current Limitations & Honest Engineering Assessment

1. **Temporal Rainfall Climatology:** Real-time rainfall values are estimated from regional climatological averages unless manually entered by the user. An operational deployment should query live IMERG or ERA5 APIs with caching.
2. **Soil Data Granularity:** Soil hydrological categories are aggregated into 5 primary groups. Sub-meter soil profiles would further improve local drainage estimates.
3. **Flood Plain Infrastructure:** Man-made flood protection measures (levees, retaining walls, stormwater pumps) are not fully captured in 30m digital elevation models.
4. **Resolution:** Global 30m DEM (SRTM) does not resolve micro-topographical storm drains inside dense urban alleys.

---

## 10. Conclusion

GeoFlood AI has been empirically verified. The machine learning pipelines are fully trained, execute simultaneously in active memory, and deliver **73.03% spatial test accuracy** on held-out test data. The system demonstrates physical responsiveness to terrain, hydrological, and meteorological variables, backed by local SHAP explanations.
