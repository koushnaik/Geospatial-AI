"""Dedicated training and hyperparameter optimization runner for LightGBM and CatBoost on Apple Silicon."""
import os
import time
from pathlib import Path
import json

# Ensure single-thread OpenMP to prevent Apple Silicon thread contention
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

from src.dataset_manager import get_active_dataset
from src.geospatial_features import ALL_FEATURES
from src.model_training import (
    spatial_split, build_model_pipeline, train_single_model,
    optimize_hyperparameters, WeightedProbabilityEnsemble
)

def run():
    print("="*80)
    print("GEOFLOOD AI — FOCUSED TRAINING: LIGHTGBM & CATBOOST")
    print("Hardware Target: Apple Silicon M4 | OpenMP Mode: Single-Thread Isolated")
    print("="*80)

    df = get_active_dataset()
    tr_idx, te_idx, split_name = spatial_split(df, ALL_FEATURES)
    print(f"\n1. Spatial Partitioning: {split_name}")
    print(f"   Training Observations: {len(tr_idx)} | Validation Test Observations: {len(te_idx)}")

    X_tr, y_tr = df.iloc[tr_idx][ALL_FEATURES], df.iloc[tr_idx]["flood_label"].astype(int)
    X_te, y_te = df.iloc[te_idx][ALL_FEATURES], df.iloc[te_idx]["flood_label"].astype(int)

    artifact_dir = Path("artifacts/models")
    artifact_dir.mkdir(parents=True, exist_ok=True)

    # -------------------------------------------------------------
    # MODEL 5: LIGHTGBM
    # -------------------------------------------------------------
    print("\n" + "-"*80)
    print("2. TRAINING MODEL 5: LIGHTGBM (Histogram Gradient Boosting)")
    print("   Parameters: n_estimators=200, num_leaves=31, max_depth=6, lr=0.05, n_jobs=1")
    t0 = time.perf_counter()
    lgb_pipe, lgb_metrics = train_single_model(
        "LightGBM", X_tr, y_tr, X_te, y_te, ALL_FEATURES, split_name, artifact_dir=str(artifact_dir)
    )
    lgb_duration = time.perf_counter() - t0
    print(f"   Fitting & Serialization complete in {lgb_duration:.3f}s")
    print(f"   Accuracy : {lgb_metrics['accuracy']:.4f}")
    print(f"   Recall   : {lgb_metrics['flood_recall']:.4f}")
    print(f"   Macro F1 : {lgb_metrics['macro_f1']:.4f}")
    print(f"   ROC-AUC  : {lgb_metrics['roc_auc']:.4f}")
    print(f"   Confusion Matrix: TN={lgb_metrics['confusion_matrix'][0][0]}, FP={lgb_metrics['confusion_matrix'][0][1]}, FN={lgb_metrics['confusion_matrix'][1][0]}, TP={lgb_metrics['confusion_matrix'][1][1]}")

    # -------------------------------------------------------------
    # MODEL 6: CATBOOST
    # -------------------------------------------------------------
    print("\n" + "-"*80)
    print("3. TRAINING MODEL 6: CATBOOST (Oblivious Decision Trees)")
    print("   Parameters: iterations=200, depth=6, lr=0.05, thread_count=1")
    t1 = time.perf_counter()
    cb_pipe, cb_metrics = train_single_model(
        "CatBoost", X_tr, y_tr, X_te, y_te, ALL_FEATURES, split_name, artifact_dir=str(artifact_dir)
    )
    cb_duration = time.perf_counter() - t1
    print(f"   Fitting & Serialization complete in {cb_duration:.3f}s")
    print(f"   Accuracy : {cb_metrics['accuracy']:.4f}")
    print(f"   Recall   : {cb_metrics['flood_recall']:.4f}")
    print(f"   Macro F1 : {cb_metrics['macro_f1']:.4f}")
    print(f"   ROC-AUC  : {cb_metrics['roc_auc']:.4f}")
    print(f"   Confusion Matrix: TN={cb_metrics['confusion_matrix'][0][0]}, FP={cb_metrics['confusion_matrix'][0][1]}, FN={cb_metrics['confusion_matrix'][1][0]}, TP={cb_metrics['confusion_matrix'][1][1]}")

    # -------------------------------------------------------------
    # OPTUNA HYPERPARAMETER TUNING FOR BOTH MODELS
    # -------------------------------------------------------------
    print("\n" + "-"*80)
    print("4. RUNNING OPTUNA BAYESIAN HYPERPARAMETER OPTIMIZATION (10 TRIALS EACH)")

    print("   [A] Optimizing LightGBM...")
    lgb_opt = optimize_hyperparameters("LightGBM", df, ALL_FEATURES, n_trials=10, artifact_dir=str(artifact_dir))
    print(f"       Best Parameters: {lgb_opt['best_params']}")
    print(f"       Optimized F1: {lgb_opt['optimized_metrics']['macro_f1']:.4f} (Baseline: {lgb_opt['baseline_metrics']['macro_f1']:.4f})")

    print("   [B] Optimizing CatBoost...")
    cb_opt = optimize_hyperparameters("CatBoost", df, ALL_FEATURES, n_trials=10, artifact_dir=str(artifact_dir))
    print(f"       Best Parameters: {cb_opt['best_params']}")
    print(f"       Optimized F1: {cb_opt['optimized_metrics']['macro_f1']:.4f} (Baseline: {cb_opt['baseline_metrics']['macro_f1']:.4f})")

    # -------------------------------------------------------------
    # SOFT VOTING ENSEMBLE RE-COMPILATION
    # -------------------------------------------------------------
    print("\n" + "-"*80)
    print("5. UPDATING SOFT-VOTING CONSENSUS ENSEMBLE WITH ALL SIX FITTED MODELS")
    all_models = {}
    for p in sorted(artifact_dir.glob("*.joblib")):
        if "_optimized" in p.name or "ensemble" in p.name:
            continue
        try:
            b = joblib.load(p)
            if "pipeline" in b and hasattr(b["pipeline"], "predict_proba"):
                all_models[b["name"]] = b["pipeline"]
        except Exception:
            continue

    print(f"   Ensemble members ({len(all_models)} models): {list(all_models.keys())}")
    ensemble = WeightedProbabilityEnsemble(all_models)
    ens_preds = ensemble.predict(X_te)
    ens_probs = ensemble.predict_proba(X_te)[:, 1]

    ens_acc = accuracy_score(y_te, ens_preds)
    ens_f1 = f1_score(y_te, ens_preds, average="macro", zero_division=0)
    ens_rec = recall_score(y_te, ens_preds, pos_label=1, zero_division=0)
    ens_auc = roc_auc_score(y_te, ens_probs)

    joblib.dump({
        "name": "Soft Voting Ensemble",
        "ensemble": ensemble,
        "features": ALL_FEATURES,
        "metrics": {
            "model": "Soft Voting Ensemble",
            "accuracy": round(ens_acc, 4),
            "macro_f1": round(ens_f1, 4),
            "flood_recall": round(ens_rec, 4),
            "roc_auc": round(ens_auc, 4),
            "member_count": len(all_models)
        },
        "split_method": split_name,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }, artifact_dir / "soft_voting_ensemble.joblib")

    print(f"   Ensemble Accuracy: {ens_acc:.4f} | F1: {ens_f1:.4f} | Recall: {ens_rec:.4f} | ROC-AUC: {ens_auc:.4f}")
    print("="*80)
    print("ALL SIX MODELS & ENSEMBLE READY FOR PREDICTION & FASTAPI EXPOSURE!")
    print("="*80)

if __name__ == "__main__":
    run()
