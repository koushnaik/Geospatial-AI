"""Generate evaluation charts, ROC curves, confusion matrices, and metrics artifacts."""
from __future__ import annotations
import json
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import roc_curve, precision_recall_curve, confusion_matrix, auc, brier_score_loss
from sklearn.calibration import calibration_curve

from .dataset_manager import get_active_dataset
from .geospatial_features import ALL_FEATURES
from .model_training import spatial_split
from .model_evaluation import compute_ece

RESULTS_DIR = Path("artifacts/experiment_results")
CHARTS_DIR = Path("reports/charts")


def generate_evaluation_suite():
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    CHARTS_DIR.mkdir(parents=True, exist_ok=True)

    df = get_active_dataset()
    tr_idx, te_idx, split_name = spatial_split(df, ALL_FEATURES)
    X_te = df.iloc[te_idx][ALL_FEATURES]
    y_te = df.iloc[te_idx]["flood_label"].astype(int)

    models_dir = Path("artifacts/models")
    loaded_models = {}
    for p in sorted(models_dir.glob("*.joblib")):
        try:
            b = joblib.load(p)
            if "pipeline" in b:
                loaded_models[b["name"]] = b["pipeline"]
            elif "ensemble" in b:
                loaded_models[b["name"]] = b["ensemble"]
        except Exception:
            continue

    comparison_rows = []
    roc_data = {}
    pr_data = {}
    calibration_data = {}
    confusion_matrices = {}

    for name, model in loaded_models.items():
        preds = model.predict(X_te)
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X_te)[:, 1]
        elif hasattr(model, "decision_function"):
            df_vals = model.decision_function(X_te)
            probs = 1.0 / (1.0 + np.exp(-df_vals))
        else:
            probs = preds.astype(float)

        # ROC Curve
        fpr, tpr, roc_thresh = roc_curve(y_te, probs)
        roc_auc_val = float(auc(fpr, tpr))
        roc_data[name] = {
            "fpr": [round(float(x), 4) for x in fpr[::max(1, len(fpr)//25)]],
            "tpr": [round(float(y), 4) for y in tpr[::max(1, len(tpr)//25)]],
            "auc": round(roc_auc_val, 4)
        }

        # Precision-Recall Curve
        prec, rec, _ = precision_recall_curve(y_te, probs)
        pr_data[name] = {
            "precision": [round(float(p), 4) for p in prec[::max(1, len(prec)//25)]],
            "recall": [round(float(r), 4) for r in rec[::max(1, len(rec)//25)]],
            "pr_auc": round(float(auc(rec, prec)), 4)
        }

        # Calibration Curve & Brier / ECE
        brier = round(float(brier_score_loss(y_te, probs)), 4)
        ece = compute_ece(y_te, probs)
        try:
            prob_true, prob_pred = calibration_curve(y_te, probs, n_bins=8)
            calibration_data[name] = {
                "prob_pred": [round(float(p), 4) for p in prob_pred],
                "prob_true": [round(float(t), 4) for t in prob_true],
                "brier_score": brier,
                "ece": ece
            }
        except Exception:
            calibration_data[name] = {"prob_pred": [], "prob_true": [], "brier_score": brier, "ece": ece}

        # Confusion Matrix
        cm = confusion_matrix(y_te, preds, labels=[0, 1]).tolist()
        confusion_matrices[name] = {
            "matrix": cm,
            "tn": cm[0][0], "fp": cm[0][1],
            "fn": cm[1][0], "tp": cm[1][1]
        }

        # Metrics
        acc = float(np.mean(preds == y_te))
        tp = cm[1][1]
        fp = cm[0][1]
        fn = cm[1][0]
        precision_pos = tp / max(tp + fp, 1)
        recall_pos = tp / max(tp + fn, 1)
        f1_pos = 2 * (precision_pos * recall_pos) / max(precision_pos + recall_pos, 1e-6)

        comparison_rows.append({
            "model": name,
            "accuracy": round(acc, 4),
            "precision": round(precision_pos, 4),
            "recall": round(recall_pos, 4),
            "macro_f1": round(f1_pos, 4),
            "roc_auc": round(roc_auc_val, 4),
            "brier_score": brier,
            "ece": ece,
            "confusion_matrix": cm,
            "split_method": split_name
        })

    # Save to JSON for the API and frontend
    comparison_payload = {
        "models": comparison_rows,
        "roc_curves": roc_data,
        "pr_curves": pr_data,
        "calibration_curves": calibration_data,
        "confusion_matrices": confusion_matrices,
        "test_sample_count": len(y_te),
        "flood_sample_count": int(y_te.sum()),
        "non_flood_sample_count": int((y_te == 0).sum()),
        "split_method": split_name
    }

    results_file = RESULTS_DIR / "model_comparison_suite.json"
    with open(results_file, "w") as f:
        json.dump(comparison_payload, f, indent=2)

    # Generate Matplotlib comparison figures as PNG artifacts
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        # 1. Performance Bar Chart
        fig, ax = plt.subplots(figsize=(10, 5), dpi=150)
        models = [r["model"] for r in comparison_rows]
        x = np.arange(len(models))
        w = 0.18
        ax.bar(x - 1.5*w, [r["accuracy"] for r in comparison_rows], w, label="Accuracy", color="#1E40AF")
        ax.bar(x - 0.5*w, [r["precision"] for r in comparison_rows], w, label="Precision", color="#0D9488")
        ax.bar(x + 0.5*w, [r["recall"] for r in comparison_rows], w, label="Recall", color="#F59E0B")
        ax.bar(x + 1.5*w, [r["macro_f1"] for r in comparison_rows], w, label="F1-Score", color="#DC2626")
        ax.set_xticks(x)
        ax.set_xticklabels(models, rotation=25, ha="right", fontsize=8)
        ax.set_ylabel("Score (0.0 - 1.0)")
        ax.set_title("Multi-Algorithm Flood Susceptibility Performance Comparison", fontweight="bold")
        ax.set_ylim(0.5, 0.9)
        ax.grid(axis="y", linestyle="--", alpha=0.5)
        ax.legend(loc="lower right")
        plt.tight_layout()
        fig.savefig(CHARTS_DIR / "model_comparison_bar.png")
        plt.close(fig)

        # 2. ROC Curves Plot
        fig, ax = plt.subplots(figsize=(8, 6), dpi=150)
        for name, data in roc_data.items():
            ax.plot(data["fpr"], data["tpr"], label=f"{name} (AUC={data['auc']:.3f})", lw=1.8)
        ax.plot([0, 1], [0, 1], "k--", alpha=0.5)
        ax.set_xlabel("False Positive Rate")
        ax.set_ylabel("True Positive Rate")
        ax.set_title("Receiver Operating Characteristic (ROC) Curves", fontweight="bold")
        ax.legend(loc="lower right", fontsize=8)
        ax.grid(True, linestyle="--", alpha=0.5)
        plt.tight_layout()
        fig.savefig(CHARTS_DIR / "roc_curves.png")
        plt.close(fig)

        # 3. Calibration Curves Plot
        fig, ax = plt.subplots(figsize=(8, 6), dpi=150)
        for name, data in calibration_data.items():
            if len(data.get("prob_pred", [])) > 0:
                ax.plot(
                    data["prob_pred"], data["prob_true"],
                    marker="o", markersize=4,
                    label=f"{name} (Brier={data['brier_score']:.3f}, ECE={data['ece']:.3f})",
                    lw=1.6
                )
        ax.plot([0, 1], [0, 1], "k--", alpha=0.6, label="Perfectly Calibrated")
        ax.set_xlabel("Mean Predicted Probability")
        ax.set_ylabel("Empirical Flood Fraction")
        ax.set_title("Reliability Diagram / Probability Calibration Curves", fontweight="bold")
        ax.legend(loc="lower right", fontsize=7)
        ax.grid(True, linestyle="--", alpha=0.5)
        plt.tight_layout()
        fig.savefig(CHARTS_DIR / "calibration_curves.png")
        plt.close(fig)

    except Exception as e:
        print(f"Chart render warning: {e}")

    return comparison_payload



if __name__ == "__main__":
    res = generate_evaluation_suite()
    print(f"Successfully generated comparison suite with {len(res['models'])} models.")
