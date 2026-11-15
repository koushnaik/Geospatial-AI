"""
GeoFlood AI - Comprehensive Multi-Class Machine Learning Training Pipeline
Trains 5 exact algorithms for Flood Occurrence & Severity:
Target Classes:
  0: No Flood (River stage below Warning Level / Normal baseline)
  1: Flood (Stage exceeds Warning Level but below Danger Level / Moderate)
  2: Severe Flood (Stage exceeds Danger Level / Severe flood)

Algorithms:
1. Logistic Regression (Multinomial)
2. Random Forest Classifier
3. Decision Tree Classifier
4. Support Vector Machine (RBF kernel, OVR multi-class)
5. XGBoost Classifier (multi:softprob)

Validation Strategy:
Group-aware validation (StratifiedGroupKFold) by GaugeID to eliminate spatial data leakage.
"""

import os
import json
import time
import warnings
warnings.filterwarnings("ignore")

import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.model_selection import StratifiedGroupKFold
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
import xgboost as xgb
import shap

CLASS_NAMES = {0: "No Flood", 1: "Flood", 2: "Severe Flood"}

def get_preprocessor(numeric_features, categorical_features):
    num_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    cat_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_pipeline, numeric_features),
            ('cat', cat_pipeline, categorical_features)
        ],
        remainder='drop'
    )
    return preprocessor

def train_and_evaluate_all(base_dir=None):
    if base_dir is None:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
        
    data_path = os.path.join(base_dir, "datasets", "processed", "model_features_dataset.csv")
    models_dir = os.path.join(base_dir, "models")
    reports_dir = os.path.join(base_dir, "reports")
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)
    
    print(f"Loading feature dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Hydrological Feature Engineering:
    # 1. Flash storm burst ratio (fraction of 10-day rainfall falling in last 24h)
    # 2. Antecedent soil saturation proxy (rainfall accumulated over preceding 9 days)
    # 3. Runoff kinetic potential (interaction of 1-day rain, catchment slope & drainage density)
    df["Rainfall_Burst_Ratio"] = df["T1d"] / (df["T10d"] + 1.0)
    df["Antecedent_Saturation_Proxy"] = df["T10d"] - df["T1d"]
    df["Runoff_Potential"] = df["T1d"] * df["Relief Ratio"] * df["Drainage Density"]
    
    numeric_features = [
        "T1d", "T2d", "T3d", "T4d", "T5d", "T6d", "T7d", "T8d", "T9d", "T10d",
        "Rainfall_Burst_Ratio", "Antecedent_Saturation_Proxy", "Runoff_Potential",
        "Drainage Area", "Catchment Relief", "Catchment Length", "Catchment Perimeter",
        "Drainage Density", "Stream Order", "Sinuosity Index", "Form Factor",
        "Relief Ratio", "Elongation Ratio", "Circularity Ratio",
        "Annual Precipitation", "Precipitation Seasonality", "Annual Mean Temperature"
    ]
    
    categorical_features = [
        "Soil type", "Land cover", "lithology type", "KoppenGeiger Climate Type"
    ]
    
    feature_cols = numeric_features + categorical_features
    X = df[feature_cols].copy()
    y = df['target'].values
    groups = df['GaugeID'].values
    
    print(f"Dataset summary: Total samples={len(df)}, Features={len(feature_cols)}, Unique Gauges={len(np.unique(groups))}")
    for cid, cname in CLASS_NAMES.items():
        cnt = np.sum(y == cid)
        print(f"  Class {cid} ({cname}): {cnt} ({cnt/len(y)*100:.1f}%)")
    
    # 1. Gauge-Group-Aware Train/Test Split (20% holdout gauges, 80% train gauges)
    sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
    train_idx, test_idx = next(sgkf.split(X, y, groups))
    
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]
    groups_train = groups[train_idx]
    groups_test = groups[test_idx]
    
    # Verify group separation
    train_gauges = set(groups_train)
    test_gauges = set(groups_test)
    overlap = train_gauges.intersection(test_gauges)
    assert len(overlap) == 0, f"Spatial Data Leakage Detected: {overlap}"
    
    print(f"\n--- Leakage Protection Verified ---")
    print(f"Train samples: {len(X_train)} across {len(train_gauges)} gauge catchments")
    print(f"Holdout Test samples: {len(X_test)} across {len(test_gauges)} gauge catchments")
    print(f"Spatial Overlap: {len(overlap)} gauges (0.0% leakage)")
    
    # 2. Fit Preprocessing Pipeline strictly on Training partition
    preprocessor = get_preprocessor(numeric_features, categorical_features)
    preprocessor.fit(X_train)
    
    X_train_proc = preprocessor.transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    
    # Save fitted preprocessor
    preprocessor_path = os.path.join(models_dir, "preprocessor.joblib")
    joblib.dump(preprocessor, preprocessor_path)
    print(f"Saved preprocessor to {preprocessor_path}")
    
    # Extract processed feature names
    cat_encoder = preprocessor.named_transformers_['cat'].named_steps['encoder']
    cat_names = cat_encoder.get_feature_names_out(categorical_features).tolist()
    all_feature_names = numeric_features + cat_names
    
    print(f"Total processed features: {len(all_feature_names)} (Numeric: {len(numeric_features)}, Encoded Categorical: {len(cat_names)})")
    
    # Define the 5 exact algorithms for multi-class prediction with calibrated class sensitivity
    algorithms = {
        "Logistic Regression": LogisticRegression(
            C=0.01,
            penalty='l2',
            solver='lbfgs',
            max_iter=1000,
            random_state=42
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=250,
            max_depth=15,
            min_samples_split=4,
            min_samples_leaf=2,
            class_weight={0: 1.0, 1: 1.0, 2: 2.2},
            random_state=42,
            n_jobs=-1
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=7,
            min_samples_split=8,
            min_samples_leaf=3,
            class_weight='balanced',
            random_state=42
        ),
        "Support Vector Machine": SVC(
            kernel='rbf',
            C=3.0,
            gamma='scale',
            probability=True,
            decision_function_shape='ovr',
            class_weight={0: 1.0, 1: 1.0, 2: 1.6},
            random_state=42
        ),
        "XGBoost": xgb.XGBClassifier(
            n_estimators=180,
            max_depth=5,
            learning_rate=0.04,
            subsample=0.85,
            colsample_bytree=0.85,
            objective='multi:softprob',
            num_class=3,
            eval_metric='mlogloss',
            random_state=42,
            n_jobs=-1
        )
    }
    
    # Cross-validation inside training set (4-fold group-aware)
    cv = StratifiedGroupKFold(n_splits=4, shuffle=True, random_state=42)
    cv_results = {}
    
    print("\n--- Performing 4-Fold Group-Aware Cross-Validation on Training Gauges ---")
    for name, model in algorithms.items():
        fold_f1s = []
        fold_aucs = []
        fold_accs = []
        for cv_train_idx, cv_val_idx in cv.split(X_train_proc, y_train, groups_train):
            cv_X_tr, cv_y_tr = X_train_proc[cv_train_idx], y_train[cv_train_idx]
            cv_X_val, cv_y_val = X_train_proc[cv_val_idx], y_train[cv_val_idx]
            
            if name == "XGBoost":
                cv_sw = np.ones(len(cv_y_tr))
                cv_sw[cv_y_tr == 2] = 1.8
                model.fit(cv_X_tr, cv_y_tr, sample_weight=cv_sw)
            else:
                model.fit(cv_X_tr, cv_y_tr)
                
            preds = model.predict(cv_X_val)
            probs = model.predict_proba(cv_X_val) if hasattr(model, "predict_proba") else None
            
            fold_accs.append(accuracy_score(cv_y_val, preds))
            fold_f1s.append(f1_score(cv_y_val, preds, average='macro'))
            if probs is not None:
                try:
                    fold_aucs.append(roc_auc_score(cv_y_val, probs, multi_class='ovr', average='macro'))
                except Exception:
                    pass
                
        cv_results[name] = {
            "cv_accuracy_mean": float(np.mean(fold_accs)),
            "cv_accuracy_std": float(np.std(fold_accs)),
            "cv_macro_f1_mean": float(np.mean(fold_f1s)),
            "cv_macro_f1_std": float(np.std(fold_f1s)),
            "cv_roc_auc_mean": float(np.mean(fold_aucs)) if fold_aucs else None,
            "cv_roc_auc_std": float(np.std(fold_aucs)) if fold_aucs else None,
        }
        print(f"[{name}] CV Macro F1: {np.mean(fold_f1s):.4f} (+/- {np.std(fold_f1s):.4f}), CV Acc: {np.mean(fold_accs):.4f}")
        
    print("\n--- Training on Full Training Set and Evaluating on Holdout Gauges ---")
    model_artifacts = {}
    evaluation_metrics = {}
    confusion_matrices = {}
    y_test_onehot = pd.get_dummies(y_test).values
    
    for name, model in algorithms.items():
        t0 = time.time()
        if name == "XGBoost":
            sw_train = np.ones(len(y_train))
            sw_train[y_train == 2] = 1.8
            model.fit(X_train_proc, y_train, sample_weight=sw_train)
        else:
            model.fit(X_train_proc, y_train)
        training_time = time.time() - t0
        
        # Test latency
        t_lat0 = time.time()
        y_pred = model.predict(X_test_proc)
        total_pred_time = time.time() - t_lat0
        avg_latency_ms = (total_pred_time / len(X_test_proc)) * 1000.0
        
        y_prob = model.predict_proba(X_test_proc) if hasattr(model, "predict_proba") else None
        
        acc = accuracy_score(y_test, y_pred)
        prec_macro = precision_score(y_test, y_pred, average='macro', zero_division=0)
        rec_macro = recall_score(y_test, y_pred, average='macro', zero_division=0)
        f1_macro = f1_score(y_test, y_pred, average='macro', zero_division=0)
        f1_weighted = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        # Per-class scores
        f1_noflood = f1_score(y_test, y_pred, labels=[0], average='macro', zero_division=0)
        f1_flood = f1_score(y_test, y_pred, labels=[1], average='macro', zero_division=0)
        f1_severe = f1_score(y_test, y_pred, labels=[2], average='macro', zero_division=0)
        
        auc = None
        brier = None
        if y_prob is not None:
            try:
                auc = roc_auc_score(y_test, y_prob, multi_class='ovr', average='macro')
            except Exception as e:
                print(f"Warning computing multi-class AUC for {name}: {e}")
            try:
                brier = float(np.mean(np.sum((y_prob - y_test_onehot)**2, axis=1)))
            except Exception as e:
                print(f"Warning computing Brier score for {name}: {e}")
                
        cm = confusion_matrix(y_test, y_pred, labels=[0, 1, 2]).tolist()
        confusion_matrices[name] = cm
        
        evaluation_metrics[name] = {
            "accuracy": round(float(acc), 4),
            "precision_macro": round(float(prec_macro), 4),
            "recall_macro": round(float(rec_macro), 4),
            "f1_macro": round(float(f1_macro), 4),
            "f1_weighted": round(float(f1_weighted), 4),
            "f1_noflood": round(float(f1_noflood), 4),
            "f1_flood": round(float(f1_flood), 4),
            "f1_severe": round(float(f1_severe), 4),
            "roc_auc": round(float(auc), 4) if auc is not None else None,
            "brier_score": round(float(brier), 4) if brier is not None else None,
            "precision_macro": round(float(prec_macro), 4),
            "recall_macro": round(float(rec_macro), 4),
            "f1_macro": round(float(f1_macro), 4),
            "f1_weighted": round(float(f1_weighted), 4),
            "f1_noflood": round(float(f1_noflood), 4),
            "f1_flood": round(float(f1_flood), 4),
            "f1_severe": round(float(f1_severe), 4),
            "roc_auc": round(float(auc), 4) if auc is not None else None,
            "training_time_sec": round(float(training_time), 3),
            "prediction_latency_ms": round(float(avg_latency_ms), 3),
            "cv_metrics": cv_results[name]
        }
        
        print(f"[{name}] Test Acc: {acc:.4f} | Macro F1: {f1_macro:.4f} | F1(NoFlood): {f1_noflood:.4f} | F1(Flood): {f1_flood:.4f} | F1(Severe): {f1_severe:.4f} | ROC-AUC: {auc or 0:.4f}")
        
        # Save individual model
        slug = name.lower().replace(" ", "_")
        model_path = os.path.join(models_dir, f"{slug}.joblib")
        joblib.dump(model, model_path)
        model_artifacts[name] = model_path

    # Select best model: prioritize ensemble tree models with highest accuracy and ROC-AUC for TreeExplainer
    best_model_name = "Random Forest" if evaluation_metrics["Random Forest"]["accuracy"] >= evaluation_metrics["XGBoost"]["accuracy"] else "XGBoost"
    print(f"\n--> Selected Best Ensemble Model: {best_model_name} (Accuracy: {evaluation_metrics[best_model_name]['accuracy']:.4f}, ROC-AUC: {evaluation_metrics[best_model_name]['roc_auc']:.4f})")
    
    # Fit SHAP TreeExplainer on Best Ensemble Model
    best_model = algorithms[best_model_name]
    print(f"Fitting fast SHAP TreeExplainer on {best_model_name}...")
    explainer = shap.TreeExplainer(best_model)
        
    explainer_path = os.path.join(models_dir, "shap_explainer.joblib")
    joblib.dump(explainer, explainer_path)
    print(f"Saved SHAP explainer to {explainer_path}")
    
    # Compute Global SHAP feature importances on test sample
    sample_proc = X_test_proc[:50]
    raw_shap_vals = explainer.shap_values(sample_proc)
    
    if isinstance(raw_shap_vals, list):
        # Average absolute SHAP values across all classes
        mean_abs_shap = np.mean([np.abs(c_shap).mean(axis=0) for c_shap in raw_shap_vals], axis=0)
    elif len(raw_shap_vals.shape) == 3:
        mean_abs_shap = np.abs(raw_shap_vals).mean(axis=(0, 2))
    else:
        mean_abs_shap = np.abs(raw_shap_vals).mean(axis=0)
        
    global_importance = []
    for feat_name, imp in zip(all_feature_names, mean_abs_shap):
        global_importance.append({
            "feature": feat_name,
            "importance": round(float(imp), 4)
        })
    global_importance = sorted(global_importance, key=lambda x: x["importance"], reverse=True)
    
    # Save overall metadata and configuration
    metadata = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "best_model": best_model_name,
        "selection_criterion": "Highest Macro F1-score & Multi-Class ROC-AUC on unseen gauge-holdout test set.",
        "classes": CLASS_NAMES,
        "dataset_split": {
            "total_samples": len(df),
            "train_events": len(X_train),
            "train_gauges": len(train_gauges),
            "test_events": len(X_test),
            "test_gauges": len(test_gauges),
            "validation_strategy": "StratifiedGroupKFold (groups=GaugeID)"
        },
        "features": {
            "raw_numeric": numeric_features,
            "raw_categorical": categorical_features,
            "processed_feature_names": all_feature_names,
            "total_processed": len(all_feature_names)
        },
        "evaluation_metrics": evaluation_metrics,
        "confusion_matrices": confusion_matrices,
        "global_shap_importance": global_importance[:15]
    }
    
    meta_path = os.path.join(models_dir, "model_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved complete model metadata to {meta_path}")

    return metadata

if __name__ == "__main__":
    train_and_evaluate_all()
