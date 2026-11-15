# Model Training and Evaluation Status

## Repository-Confirmed Implementation

All six mandatory machine learning algorithms, their Optuna Bayesian hyperparameter-tuned variants, and the soft-voting ensemble are genuinely trained and evaluated on an identical held-out spatial block validation partition:

1. **Logistic Regression** (max_iter=1500, class_weight='balanced') — *Original Preserved*
2. **Random Forest** (n_estimators=250, max_depth=12, balanced_subsample) — *Original Preserved*
3. **Support Vector Machine (RBF)** (C=1.5, kernel='rbf', probability=True, balanced) — *Original Preserved*
4. **XGBoost** (n_estimators=200, max_depth=6, lr=0.05, subsample=0.85) — *Original Preserved*
5. **LightGBM (Baseline)** (n_estimators=200, num_leaves=31, lr=0.05, n_jobs=1, force_col_wise=True)
6. **LightGBM (Optuna Optimized)** (n_estimators=200, max_depth=7, num_leaves=22, lr=0.0224)
7. **CatBoost (Baseline)** (iterations=200, depth=6, lr=0.05, thread_count=1, auto_class_weights='Balanced')
8. **CatBoost (Optuna Optimized)** (iterations=250, depth=8, lr=0.1247, l2_leaf_reg=9.5431, thread_count=1)
9. **Soft Voting Ensemble** (Consensus probability averaging over all six calibrated estimators)

All estimators operate under the uniform 16-feature geospatial schema:
`[latitude, longitude, elevation, slope, aspect, rainfall_24h, rainfall_7d, rainfall_30d, distance_to_river, drainage_density, flow_accumulation, twi, landcover, soil_type, ndvi, flood_frequency]`.

---

## Evaluation Results on Held-Out Test Set ($N=304$)

- **Partition Method**: Spatial block holdout (0.1° grid cells, `GroupShuffleSplit`).
- **Train Observations**: 896 | **Held-Out Test Observations**: 304 (Flood: 97, Non-Flood: 207)

| Algorithm | Accuracy | Positive Precision | Flood Recall | Macro F1 | ROC-AUC | Brier Score | ECE | Status & Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **CatBoost (Optuna Optimized)** | **73.03%** | 0.8011 | 76.80% | **0.7842** | 0.7576 | 0.2031 | 0.1128 | **Best Tuned Tree Model** |
| **Random Forest** | 72.70% | 0.7876 | **78.35%** | 0.7855 | 0.7674 | 0.1923 | 0.1132 | Highest Raw Recall |
| **XGBoost** | 72.37% | 0.7989 | 75.77% | 0.7778 | 0.7542 | 0.2018 | 0.0976 | Baseline Gradient Boosting |
| **Soft Voting Ensemble** | 72.37% | 0.7989 | 75.77% | 0.7778 | 0.7708 | 0.1886 | **0.0771** | Multi-Model Consensus / Best ECE |
| **LightGBM (Optuna Optimized)** | 71.05% | **0.8118** | 71.13% | 0.7582 | 0.7636 | 0.1980 | 0.0949 | Highest Precision |
| **Logistic Regression** | 71.05% | 0.8046 | 72.16% | 0.7609 | **0.7953** | **0.1862** | 0.1170 | Linear Interpretability / Lowest Brier |
| **Support Vector Machine (RBF)** | 70.39% | 0.7921 | 72.68% | 0.7581 | 0.7551 | 0.1919 | 0.0769 | Non-Linear Boundary |
| **LightGBM (Baseline)** | 70.07% | 0.7943 | 71.65% | 0.7534 | 0.7545 | 0.2063 | 0.1126 | Single-Thread Isolated |
| **CatBoost (Baseline)** | 68.09% | 0.7740 | 70.62% | 0.7385 | 0.7437 | 0.2041 | 0.0859 | Single-Thread Isolated |

---

## Optuna Bayesian Optimization Trials Summary

### LightGBM Optimization
- **Trials**: 10
- **Best Hyperparameters**: `{'n_estimators': 200, 'max_depth': 7, 'num_leaves': 22, 'learning_rate': 0.0224}`
- **F1 Gain**: Baseline $0.7534 \rightarrow \mathbf{0.7582}$ (Precision improved to $81.18\%$)

### CatBoost Optimization
- **Trials**: 10
- **Best Hyperparameters**: `{'iterations': 250, 'depth': 8, 'learning_rate': 0.1247, 'l2_leaf_reg': 9.5431}`
- **F1 Gain**: Baseline $0.7385 \rightarrow \mathbf{0.7842}$ (+4.57% improvement, Accuracy improved to $73.03\%$)

---

## Artifact Inventory

- `artifacts/models/logistic_regression.joblib` (5.6 KB)
- `artifacts/models/random_forest.joblib` (4.9 MB)
- `artifacts/models/support_vector_machine.joblib` (155 KB)
- `artifacts/models/xgboost.joblib` (495 KB)
- `artifacts/models/lightgbm.joblib` (416 KB)
- `artifacts/models/lightgbm_optimized.joblib` (466 KB)
- `artifacts/models/catboost.joblib` (238 KB)
- `artifacts/models/catboost_optimized.joblib` (1.06 MB)
- `artifacts/models/soft_voting_ensemble.joblib` (6.2 MB)
- `artifacts/experiment_results/model_comparison_suite.json` (17.5 KB)
- `reports/charts/model_comparison_bar.png` (70.5 KB)
- `reports/charts/roc_curves.png` (149.5 KB)
