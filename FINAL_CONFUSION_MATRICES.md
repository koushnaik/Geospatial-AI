# GeoFlood AI — Final Holdout Confusion Matrices (Post-Optimization)

**Evaluation Set:** 1,092 unseen holdout observations from 31 independent gauge catchments (0.0% spatial data leakage).  
**Target Classes:**
- Class 0: `No Flood` (Support: 558)
- Class 1: `Flood` (Support: 357)
- Class 2: `Severe Flood` (Support: 177)

---

## 1. Random Forest Classifier (Selected Best Model)

### Matrix Representation `[True Class x Predicted Class]`
```
                    Predicted No Flood   Predicted Flood   Predicted Severe Flood    Total True
True No Flood:             510                 40                   8                   558
True Flood:                 55                264                  38                   357
True Severe Flood:          69                 71                  37                   177
Total Predicted:           634                375                  83                  1092
```

### Detailed Class Breakdown
- **No Flood (Class 0):** Precision = 80.44%, Recall = 91.40%, F1-score = 85.57%
- **Flood (Class 1):** Precision = 70.40%, Recall = 73.95%, F1-score = 72.13%
- **Severe Flood (Class 2):** Precision = 44.58%, Recall = 20.90%, F1-score = 28.46%
- **Overall Holdout Accuracy:** **74.27%** | **Macro F1:** **0.6205** | **Weighted F1:** **0.7192**
- **Multi-Class ROC-AUC:** **0.8486** | **Multiclass Brier Score:** **0.3708**

---

## 2. XGBoost Classifier (Sample-Weighted for Class 2)

### Matrix Representation `[True Class x Predicted Class]`
```
                    Predicted No Flood   Predicted Flood   Predicted Severe Flood    Total True
True No Flood:             512                 30                  16                   558
True Flood:                 58                204                  95                   357
True Severe Flood:          67                 55                  55                   177
Total Predicted:           637                289                 166                  1092
```

### Detailed Class Breakdown
- **No Flood (Class 0):** Precision = 80.38%, Recall = 91.76%, F1-score = 85.69%
- **Flood (Class 1):** Precision = 70.59%, Recall = 57.14%, F1-score = 63.16%
- **Severe Flood (Class 2):** Precision = 33.13%, Recall = 31.07%, F1-score = 32.07% *(+7.85% improvement from 24.22%)*
- **Overall Holdout Accuracy:** **70.60%** | **Macro F1:** **0.6031** | **Weighted F1:** **0.6963**
- **Multi-Class ROC-AUC:** **0.8310** | **Multiclass Brier Score:** **0.4019**

---

## 3. Support Vector Machine (RBF Kernel, Class-Weighted)

### Matrix Representation `[True Class x Predicted Class]`
```
                    Predicted No Flood   Predicted Flood   Predicted Severe Flood    Total True
True No Flood:             481                 29                  48                   558
True Flood:                 59                252                  46                   357
True Severe Flood:          64                 51                  62                   177
Total Predicted:           604                332                 156                  1092
```

### Detailed Class Breakdown
- **No Flood (Class 0):** Precision = 79.64%, Recall = 86.20%, F1-score = 82.79%
- **Flood (Class 1):** Precision = 75.90%, Recall = 70.59%, F1-score = 73.15%
- **Severe Flood (Class 2):** Precision = 39.74%, Recall = 35.03%, F1-score = 37.24%
- **Overall Holdout Accuracy:** **72.80%** | **Macro F1:** **0.6439** | **Weighted F1:** **0.7225**
- **Multi-Class ROC-AUC:** **0.8067** | **Multiclass Brier Score:** **0.3953**

---

## 4. Decision Tree Classifier (Max Depth = 7, Balanced)

### Matrix Representation `[True Class x Predicted Class]`
```
                    Predicted No Flood   Predicted Flood   Predicted Severe Flood    Total True
True No Flood:             468                 60                  30                   558
True Flood:                 80                169                 108                   357
True Severe Flood:          53                 48                  76                   177
Total Predicted:           601                277                 214                  1092
```

### Detailed Class Breakdown
- **No Flood (Class 0):** Precision = 77.87%, Recall = 83.87%, F1-score = 80.76%
- **Flood (Class 1):** Precision = 61.01%, Recall = 47.34%, F1-score = 53.31%
- **Severe Flood (Class 2):** Precision = 35.51%, Recall = 42.94%, F1-score = 38.87%
- **Overall Holdout Accuracy:** **65.29%** | **Macro F1:** **0.5765** | **Weighted F1:** **0.6500**
- **Multi-Class ROC-AUC:** **0.7778** | **Multiclass Brier Score:** **0.4909**

---

## 5. Logistic Regression (Multinomial, Regularized L2 C=0.01)

### Matrix Representation `[True Class x Predicted Class]`
```
                    Predicted No Flood   Predicted Flood   Predicted Severe Flood    Total True
True No Flood:             471                 73                  14                   558
True Flood:                 53                209                  95                   357
True Severe Flood:          51                 82                  44                   177
Total Predicted:           575                364                 153                  1092
```

### Detailed Class Breakdown
- **No Flood (Class 0):** Precision = 81.91%, Recall = 84.41%, F1-score = 83.14%
- **Flood (Class 1):** Precision = 57.42%, Recall = 58.54%, F1-score = 57.98% *(+46.63% improvement from 11.35%)*
- **Severe Flood (Class 2):** Precision = 28.76%, Recall = 24.86%, F1-score = 26.67%
- **Overall Holdout Accuracy:** **66.30%** | **Macro F1:** **0.5593** | **Weighted F1:** **0.6576**
- **Multi-Class ROC-AUC:** **0.8031** | **Multiclass Brier Score:** **0.4403**

---

## Comparison Summary Table

| Metric | Random Forest (Best) | Support Vector Machine | XGBoost | Logistic Regression | Decision Tree |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Accuracy** | **74.27%** | 72.80% | 70.60% | 66.30% | 65.29% |
| **Macro F1** | 0.6205 | **0.6439** | 0.6031 | 0.5593 | 0.5765 |
| **Weighted F1** | 0.7192 | **0.7225** | 0.6963 | 0.6576 | 0.6500 |
| **F1 (No Flood)** | 0.8557 | 0.8279 | **0.8569** | 0.8314 | 0.8076 |
| **F1 (Flood)** | 0.7213 | **0.7315** | 0.6316 | 0.5798 | 0.5331 |
| **F1 (Severe Flood)** | 0.2846 | 0.3724 | 0.3207 | 0.2667 | **0.3887** |
| **ROC-AUC (OVR)** | **0.8486** | 0.8067 | 0.8310 | 0.8031 | 0.7778 |
| **Brier Score** | **0.3708** | 0.3953 | 0.4019 | 0.4403 | 0.4909 |
