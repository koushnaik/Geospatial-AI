"""Metrics computed on an untouched holdout split, including calibration metrics."""
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, brier_score_loss
)
from sklearn.calibration import calibration_curve


def compute_ece(y_true, y_prob, n_bins=10) -> float:
    """Compute Expected Calibration Error (ECE) across uniform confidence bins."""
    if y_prob is None or len(y_prob) == 0:
        return 0.0
    y_true = np.asarray(y_true)
    y_prob = np.asarray(y_prob)
    bin_edges = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    total = len(y_true)
    for i in range(n_bins):
        bin_mask = (y_prob > bin_edges[i]) & (y_prob <= bin_edges[i+1])
        if i == 0:
            bin_mask = (y_prob >= bin_edges[i]) & (y_prob <= bin_edges[i+1])
        bin_count = np.sum(bin_mask)
        if bin_count > 0:
            bin_acc = np.mean(y_true[bin_mask])
            bin_conf = np.mean(y_prob[bin_mask])
            ece += (bin_count / total) * np.abs(bin_acc - bin_conf)
    return round(float(ece), 4)


def evaluate_model(name, y_true, y_pred, y_prob=None, fit_seconds=None, prediction_seconds_per_row=None, split_method=""):
    """Compute genuine evaluation metrics including Brier score and ECE."""
    result = {
        "model": name,
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision_macro": round(float(precision_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "recall_macro": round(float(recall_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "macro_f1": round(float(f1_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "flood_recall": round(float(recall_score(y_true, y_pred, pos_label=1, zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=[0, 1]).tolist(),
        "training_seconds": fit_seconds,
        "prediction_seconds_per_row": prediction_seconds_per_row,
        "split_method": split_method
    }
    
    if y_prob is not None:
        try:
            result["roc_auc"] = round(float(roc_auc_score(y_true, y_prob)), 4)
        except ValueError:
            result["roc_auc"] = np.nan
        result["brier_score"] = round(float(brier_score_loss(y_true, y_prob)), 4)
        result["ece"] = compute_ece(y_true, y_prob)
        try:
            prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=10)
            result["calibration_curve"] = [
                {"prob_pred": round(float(p), 4), "prob_true": round(float(t), 4)}
                for t, p in zip(prob_true, prob_pred)
            ]
        except Exception:
            result["calibration_curve"] = []
    else:
        result["roc_auc"] = np.nan
        result["brier_score"] = None
        result["ece"] = None
        result["calibration_curve"] = []

    return result

