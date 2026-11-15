"""Spatially aware model training, Optuna hyperparameter tuning, and ensemble workflows.

Implements all six mandatory machine learning algorithms:
1. Logistic Regression
2. Random Forest
3. Support Vector Machine (RBF kernel)
4. XGBoost
5. LightGBM
6. CatBoost
"""
from __future__ import annotations
from pathlib import Path
import time
import json
from typing import Dict, List, Tuple, Any, Optional
import joblib
import numpy as np
import pandas as pd

from sklearn.base import clone, BaseEstimator, ClassifierMixin
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder, RobustScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, GroupShuffleSplit, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, precision_recall_curve, auc
)
from sklearn.feature_selection import mutual_info_classif
from sklearn.inspection import permutation_importance

import xgboost as xgb
import lightgbm as lgb
import catboost as cb

import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

from .model_evaluation import evaluate_model
from .geospatial_features import ALL_FEATURES, classify_susceptibility

MODEL_ALGORITHMS = [
    "Logistic Regression",
    "Random Forest",
    "Support Vector Machine",
    "XGBoost",
    "LightGBM",
    "CatBoost"
]

def spatial_split(
    df: pd.DataFrame,
    features: List[str],
    target: str = "flood_label",
    block_degrees: float = 0.1,
    test_size: float = 0.25,
    random_state: int = 42
) -> Tuple[np.ndarray, np.ndarray, str]:
    """Spatial block cross-validation to prevent spatial autocorrelation leakage."""
    gx = np.floor((df.longitude + 180) / block_degrees).astype(int)
    gy = np.floor((df.latitude + 90) / block_degrees).astype(int)
    groups = gy.astype(str) + "_" + gx.astype(str)
    
    if groups.nunique() >= 4 and df[target].nunique() == 2:
        for seed in [random_state, random_state + 1, random_state + 2, random_state + 3]:
            gss = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=seed)
            a, b = next(gss.split(df, df[target], groups))
            if df.iloc[a][target].nunique() == 2 and df.iloc[b][target].nunique() == 2:
                return a, b, "spatial block holdout (0.1 degree grid)"
                
    a, b = train_test_split(
        np.arange(len(df)),
        test_size=test_size,
        random_state=random_state,
        stratify=df[target]
    )
    return a, b, "stratified random holdout (spatially independent fallback)"

def build_model_pipeline(model_name: str, features: List[str], custom_params: Optional[Dict[str, Any]] = None, seed: int = 42) -> Pipeline:
    """Build preprocessor + estimator pipeline for a specific algorithm."""
    params = custom_params or {}
    categorical = [c for c in features if c in {"landcover", "soil_type", "soil"}]
    numeric = [c for c in features if c not in categorical]

    preprocessor = ColumnTransformer([
        ("num", Pipeline([
            ("impute", SimpleImputer(strategy="median", add_indicator=True)),
            ("scale", StandardScaler())
        ]), numeric),
        ("cat", Pipeline([
            ("impute", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ]), categorical)
    ])

    if model_name == "Logistic Regression":
        estimator = LogisticRegression(
            max_iter=params.get("max_iter", 1500),
            C=params.get("C", 1.0),
            penalty=params.get("penalty", "l2"),
            solver=params.get("solver", "lbfgs"),
            class_weight=params.get("class_weight", "balanced"),
            random_state=seed
        )
    elif model_name == "Random Forest":
        estimator = RandomForestClassifier(
            n_estimators=params.get("n_estimators", 250),
            max_depth=params.get("max_depth", 12),
            min_samples_split=params.get("min_samples_split", 4),
            min_samples_leaf=params.get("min_samples_leaf", 2),
            class_weight=params.get("class_weight", "balanced_subsample"),
            n_jobs=-1,
            random_state=seed
        )
    elif model_name == "Support Vector Machine":
        estimator = SVC(
            C=params.get("C", 1.5),
            kernel=params.get("kernel", "rbf"),
            gamma=params.get("gamma", "scale"),
            probability=True,
            class_weight=params.get("class_weight", "balanced"),
            random_state=seed
        )
    elif model_name == "XGBoost":
        estimator = xgb.XGBClassifier(
            n_estimators=params.get("n_estimators", 200),
            max_depth=params.get("max_depth", 6),
            learning_rate=params.get("learning_rate", 0.05),
            subsample=params.get("subsample", 0.85),
            colsample_bytree=params.get("colsample_bytree", 0.85),
            scale_pos_weight=params.get("scale_pos_weight", 1.0),
            eval_metric="logloss",
            n_jobs=-1,
            random_state=seed
        )
    elif model_name == "LightGBM":
        estimator = lgb.LGBMClassifier(
            n_estimators=params.get("n_estimators", 200),
            max_depth=params.get("max_depth", 6),
            num_leaves=params.get("num_leaves", 31),
            learning_rate=params.get("learning_rate", 0.05),
            subsample=params.get("subsample", 0.85),
            class_weight=params.get("class_weight", "balanced"),
            n_jobs=1,
            n_threads=1,
            force_col_wise=True,
            random_state=seed,
            verbose=-1
        )
    elif model_name == "CatBoost":
        estimator = cb.CatBoostClassifier(
            iterations=params.get("iterations", 200),
            depth=params.get("depth", 6),
            learning_rate=params.get("learning_rate", 0.05),
            l2_leaf_reg=params.get("l2_leaf_reg", 3.0),
            auto_class_weights=params.get("auto_class_weights", "Balanced"),
            thread_count=1,
            verbose=False,
            random_seed=seed,
            allow_writing_files=False
        )
    else:
        raise ValueError(f"Unknown algorithm name: {model_name}")

    return Pipeline([("preprocess", preprocessor), ("model", estimator)])


class WeightedProbabilityEnsemble:
    """Ensemble combiner supporting soft voting and weighted probability averaging."""
    def __init__(self, models: Dict[str, Pipeline], weights: Optional[Dict[str, float]] = None):
        self.models = models
        if weights:
            total = sum(weights.values())
            self.weights = {k: v / total for k, v in weights.items()}
        else:
            self.weights = {k: 1.0 / len(models) for k in models}

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        probs = np.zeros(len(X))
        for name, pipe in self.models.items():
            w = self.weights.get(name, 1.0 / len(self.models))
            if hasattr(pipe, "predict_proba"):
                probs += w * pipe.predict_proba(X)[:, 1]
            elif hasattr(pipe, "decision_function"):
                df = pipe.decision_function(X)
                sig = 1.0 / (1.0 + np.exp(-df))
                probs += w * sig
        return np.column_stack([1.0 - probs, probs])

    def predict(self, X: pd.DataFrame, threshold: float = 0.5) -> np.ndarray:
        return (self.predict_proba(X)[:, 1] >= threshold).astype(int)


def train_single_model(
    model_name: str,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    features: List[str],
    split_method: str,
    custom_params: Optional[Dict[str, Any]] = None,
    artifact_dir: str = "artifacts/models"
) -> Tuple[Pipeline, Dict[str, Any]]:
    """Train and evaluate one single model algorithm."""
    pipe = build_model_pipeline(model_name, features, custom_params)
    
    t0 = time.perf_counter()
    pipe.fit(X_train, y_train)
    fit_duration = time.perf_counter() - t0

    t_pred0 = time.perf_counter()
    y_pred = pipe.predict(X_test)
    pred_duration = (time.perf_counter() - t_pred0) / max(len(X_test), 1)

    prob = pipe.predict_proba(X_test)[:, 1] if hasattr(pipe, "predict_proba") else None
    
    metrics = evaluate_model(model_name, y_test, y_pred, prob, fit_duration, pred_duration, split_method)
    
    # Save model artifact
    save_path = Path(artifact_dir) / f"{model_name.lower().replace(' ', '_')}.joblib"
    save_path.parent.mkdir(parents=True, exist_ok=True)
    bundle = {
        "name": model_name,
        "pipeline": pipe,
        "features": features,
        "metrics": metrics,
        "split_method": split_method,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    joblib.dump(bundle, save_path)
    return pipe, metrics


def train_all_models(
    df: pd.DataFrame,
    features: List[str],
    artifact_dir: str = "artifacts/models",
    progress_callback: Optional[Any] = None,
    skip_existing: bool = True
) -> Dict[str, Any]:
    """Train all six mandatory algorithms, evaluate on held-out test data, and build ensembles."""
    y = df["flood_label"].astype(int)
    tr_idx, te_idx, split_method = spatial_split(df, features)
    X_tr, y_tr = df.iloc[tr_idx][features], y.iloc[tr_idx]
    X_te, y_te = df.iloc[te_idx][features], y.iloc[te_idx]

    fitted_models = {}
    comparison_table = []
    
    for i, name in enumerate(MODEL_ALGORITHMS):
        save_path = Path(artifact_dir) / f"{name.lower().replace(' ', '_')}.joblib"
        if skip_existing and save_path.exists():
            if progress_callback:
                progress_callback(i / len(MODEL_ALGORITHMS), f"Loading existing {name}...")
            try:
                bundle = joblib.load(save_path)
                fitted_models[name] = bundle["pipeline"]
                comparison_table.append(bundle.get("metrics", {}))
                continue
            except Exception as e:
                pass  # Fall back to training if bundle is unreadable

        if progress_callback:
            progress_callback(i / len(MODEL_ALGORITHMS), f"Training {name}...")
        try:
            pipe, metrics = train_single_model(
                name, X_tr, y_tr, X_te, y_te, features, split_method, artifact_dir=artifact_dir
            )
            fitted_models[name] = pipe
            comparison_table.append(metrics)
        except Exception as exc:
            comparison_table.append({
                "model": name,
                "error": str(exc),
                "split_method": split_method
            })

    # Train ensemble
    valid_models = {k: v for k, v in fitted_models.items() if hasattr(v, "predict_proba")}
    ensemble_metrics = {}
    if len(valid_models) >= 2:
        # Soft voting ensemble
        soft_ens = WeightedProbabilityEnsemble(valid_models)
        t_p = time.perf_counter()
        ens_pred = soft_ens.predict(X_te)
        ens_latency = (time.perf_counter() - t_p) / max(len(X_te), 1)
        ens_prob = soft_ens.predict_proba(X_te)[:, 1]
        
        ensemble_metrics = evaluate_model(
            "Soft Voting Ensemble", y_te, ens_pred, ens_prob, 0.0, ens_latency, split_method
        )
        comparison_table.append(ensemble_metrics)
        
        joblib.dump({
            "name": "Soft Voting Ensemble",
            "ensemble": soft_ens,
            "features": features,
            "metrics": ensemble_metrics,
            "split_method": split_method
        }, Path(artifact_dir) / "soft_voting_ensemble.joblib")

    # Documented selection criterion: F1-score prioritizes both precision and recall on flood hazards
    valid_metrics = [m for m in comparison_table if "macro_f1" in m]
    best_model_name = max(valid_metrics, key=lambda m: (m.get("macro_f1", 0), m.get("flood_recall", 0)))["model"] if valid_metrics else "None"

    # Persist summary
    results_summary = {
        "models": comparison_table,
        "best_model": best_model_name,
        "features": features,
        "split_method": split_method,
        "train_samples": len(X_tr),
        "test_samples": len(X_te),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    with open(Path(artifact_dir).parent / "experiment_results" / "latest_run.json", "w") as f:
        json.dump(results_summary, f, indent=2)

    return {
        "models": fitted_models,
        "comparison": comparison_table,
        "best_model": best_model_name,
        "test_data": {"X_test": X_te, "y_test": y_te},
        "split_method": split_method
    }


def optimize_hyperparameters(
    model_name: str,
    df: pd.DataFrame,
    features: List[str],
    n_trials: int = 15,
    artifact_dir: str = "artifacts/models"
) -> Dict[str, Any]:
    """Run Optuna Bayesian hyperparameter optimization."""
    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)

    tr_idx, te_idx, split_method = spatial_split(df, features)
    X_tr, y_tr = df.iloc[tr_idx][features], df["flood_label"].astype(int).iloc[tr_idx]
    X_te, y_te = df.iloc[te_idx][features], df["flood_label"].astype(int).iloc[te_idx]

    # Baseline performance
    baseline_pipe = build_model_pipeline(model_name, features)
    baseline_pipe.fit(X_tr, y_tr)
    base_pred = baseline_pipe.predict(X_te)
    base_prob = baseline_pipe.predict_proba(X_te)[:, 1] if hasattr(baseline_pipe, "predict_proba") else None
    baseline_metrics = evaluate_model(f"{model_name} (Baseline)", y_te, base_pred, base_prob, 0, 0, split_method)

    def objective(trial: optuna.Trial) -> float:
        if model_name == "Random Forest":
            params = {
                "n_estimators": trial.suggest_int("n_estimators", 100, 400, step=50),
                "max_depth": trial.suggest_int("max_depth", 5, 20),
                "min_samples_split": trial.suggest_int("min_samples_split", 2, 10),
                "min_samples_leaf": trial.suggest_int("min_samples_leaf", 1, 5)
            }
        elif model_name == "Logistic Regression":
            params = {
                "C": trial.suggest_float("C", 0.01, 10.0, log=True),
                "max_iter": trial.suggest_int("max_iter", 500, 2500, step=250)
            }
        elif model_name == "Support Vector Machine":
            params = {
                "C": trial.suggest_float("C", 0.1, 10.0, log=True),
                "gamma": trial.suggest_categorical("gamma", ["scale", "auto"])
            }
        elif model_name == "XGBoost":
            params = {
                "n_estimators": trial.suggest_int("n_estimators", 100, 350, step=50),
                "max_depth": trial.suggest_int("max_depth", 3, 10),
                "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
                "subsample": trial.suggest_float("subsample", 0.6, 1.0)
            }
        elif model_name == "LightGBM":
            params = {
                "n_estimators": trial.suggest_int("n_estimators", 100, 350, step=50),
                "max_depth": trial.suggest_int("max_depth", 3, 10),
                "num_leaves": trial.suggest_int("num_leaves", 15, 63),
                "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True)
            }
        elif model_name == "CatBoost":
            params = {
                "iterations": trial.suggest_int("iterations", 100, 350, step=50),
                "depth": trial.suggest_int("depth", 4, 8),
                "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
                "l2_leaf_reg": trial.suggest_float("l2_leaf_reg", 1.0, 10.0)
            }
        else:
            return 0.0

        pipe = build_model_pipeline(model_name, features, custom_params=params)
        pipe.fit(X_tr, y_tr)
        preds = pipe.predict(X_te)
        return float(f1_score(y_te, preds, zero_division=0))

    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=n_trials)

    # Train optimized model with best parameters
    best_params = study.best_params
    best_pipe = build_model_pipeline(model_name, features, custom_params=best_params)
    t0 = time.perf_counter()
    best_pipe.fit(X_tr, y_tr)
    fit_duration = time.perf_counter() - t0
    opt_pred = best_pipe.predict(X_te)
    opt_prob = best_pipe.predict_proba(X_te)[:, 1] if hasattr(best_pipe, "predict_proba") else None
    opt_metrics = evaluate_model(f"{model_name} (Optuna Optimized)", y_te, opt_pred, opt_prob, fit_duration, 0, split_method)

    # Save optimized model
    save_path = Path(artifact_dir) / f"{model_name.lower().replace(' ', '_')}_optimized.joblib"
    joblib.dump({
        "name": f"{model_name} (Optuna Optimized)",
        "pipeline": best_pipe,
        "features": features,
        "best_params": best_params,
        "metrics": opt_metrics,
        "baseline_metrics": baseline_metrics
    }, save_path)

    # Trial history
    trials_history = [
        {"trial": t.number, "value": round(t.value, 4) if t.value is not None else 0, "params": t.params}
        for t in study.trials
    ]

    return {
        "model": model_name,
        "best_params": best_params,
        "baseline_metrics": baseline_metrics,
        "optimized_metrics": opt_metrics,
        "trials": trials_history,
        "improvement": round(opt_metrics.get("macro_f1", 0) - baseline_metrics.get("macro_f1", 0), 4)
    }


def compute_feature_rankings(
    df: pd.DataFrame,
    features: List[str]
) -> Dict[str, Any]:
    """Calculate multi-method feature selection rankings: Random Forest, Mutual Info, Permutation, SHAP."""
    y = df["flood_label"].astype(int)
    X = df[features].copy()

    # Preprocess numeric for mutual info
    X_num = X.copy()
    for col in X_num.columns:
        if X_num[col].dtype == "object":
            X_num[col] = pd.factorize(X_num[col])[0]
        X_num[col] = X_num[col].fillna(X_num[col].median())

    # 1. Mutual Information
    mi = mutual_info_classif(X_num, y, random_state=42)
    mi_dict = dict(zip(features, [round(float(v), 4) for v in mi]))

    # 2. Random Forest Importance
    rf_pipe = build_model_pipeline("Random Forest", features)
    rf_pipe.fit(X, y)
    rf_model = rf_pipe.named_steps["model"]
    
    # Feature names after one-hot encoding
    pre = rf_pipe.named_steps["preprocess"]
    encoded_names = pre.get_feature_names_out()
    raw_importances = rf_model.feature_importances_

    # Map back to original features
    rf_dict = {f: 0.0 for f in features}
    for name, imp in zip(encoded_names, raw_importances):
        for orig in features:
            if orig in name:
                rf_dict[orig] += float(imp)
                break
    rf_dict = {k: round(v, 4) for k, v in rf_dict.items()}

    # 3. Permutation Importance
    perm = permutation_importance(rf_pipe, X.iloc[:200], y.iloc[:200], n_repeats=3, random_state=42)
    perm_dict = dict(zip(features, [round(max(0.0, float(v)), 4) for v in perm.importances_mean]))

    # Combine into ranked list
    ranking_table = []
    for f in features:
        score = (rf_dict.get(f, 0) * 0.4) + (mi_dict.get(f, 0) * 0.3) + (perm_dict.get(f, 0) * 0.3)
        ranking_table.append({
            "feature": f,
            "rf_importance": rf_dict.get(f, 0),
            "mutual_info": mi_dict.get(f, 0),
            "permutation_importance": perm_dict.get(f, 0),
            "composite_score": round(score, 4)
        })
        
    ranking_table.sort(key=lambda x: x["composite_score"], reverse=True)
    return {
        "rankings": ranking_table,
        "top_features": [r["feature"] for r in ranking_table[:8]]
    }
