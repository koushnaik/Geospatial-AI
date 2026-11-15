"""Data cleaning, outlier analysis, normalization, and quality validation pipeline."""
from __future__ import annotations
from typing import Dict, List, Tuple, Any, Optional
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler

from .feature_engineering import add_cover_features
from .geospatial_features import ALL_FEATURES, calculate_twi

TARGET = "flood_label"

def validate_and_clean_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Comprehensive data cleaning and validation with quality metrics."""
    if df is None or df.empty:
        raise ValueError("Input dataframe is empty or None")

    raw_count = len(df)
    report = {
        "raw_rows": raw_count,
        "initial_columns": list(df.columns),
        "missing_values": {},
        "outlier_counts": {},
        "duplicates_removed": 0,
        "actions_taken": []
    }

    work_df = df.copy()

    # 1. Target column check
    if TARGET not in work_df.columns:
        raise ValueError(f"Required target column '{TARGET}' not found in dataset")
    work_df[TARGET] = pd.to_numeric(work_df[TARGET], errors="coerce")
    work_df = work_df.dropna(subset=[TARGET])
    work_df = work_df[work_df[TARGET].isin([0, 1])].copy()
    work_df[TARGET] = work_df[TARGET].astype(int)

    # 2. Coordinates check
    if "latitude" not in work_df.columns or "longitude" not in work_df.columns:
        raise ValueError("Dataset must contain 'latitude' and 'longitude' coordinates")
    work_df["latitude"] = pd.to_numeric(work_df["latitude"], errors="coerce")
    work_df["longitude"] = pd.to_numeric(work_df["longitude"], errors="coerce")
    work_df = work_df.dropna(subset=["latitude", "longitude"])
    work_df = work_df[(work_df["latitude"].between(-90, 90)) & (work_df["longitude"].between(-180, 180))]

    # 3. Duplicate removal
    before_dedup = len(work_df)
    work_df = work_df.drop_duplicates(subset=["latitude", "longitude", TARGET]).reset_index(drop=True)
    report["duplicates_removed"] = before_dedup - len(work_df)
    if report["duplicates_removed"] > 0:
        report["actions_taken"].append(f"Removed {report['duplicates_removed']} duplicate spatial observation rows.")

    # 4. Landcover feature extraction
    if "landcover" in work_df.columns:
        work_df["landcover"] = pd.to_numeric(work_df["landcover"], errors="coerce").fillna(40).astype(int)
        work_df = add_cover_features(work_df)

    # 5. Hydrological feature derivation (TWI if missing and slope/flow_accum present)
    if "twi" not in work_df.columns and "flow_accumulation" in work_df.columns and "slope" in work_df.columns:
        work_df["twi"] = calculate_twi(work_df["flow_accumulation"], work_df["slope"])
        report["actions_taken"].append("Derived Topographic Wetness Index (TWI) from flow accumulation and slope.")

    # 6. Missing value audit & median imputation
    numeric_cols = work_df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        n_miss = int(work_df[col].isna().sum())
        if n_miss > 0:
            report["missing_values"][col] = n_miss
            med = work_df[col].median()
            work_df[col] = work_df[col].fillna(med)
            report["actions_taken"].append(f"Imputed {n_miss} missing values in '{col}' using median ({med:.2f}).")

    # 7. IQR outlier analysis
    for col in ["rainfall_24h", "elevation", "slope", "distance_to_river"]:
        if col in work_df.columns:
            q25, q75 = work_df[col].quantile(0.25), work_df[col].quantile(0.75)
            iqr = q75 - q25
            outliers = int(((work_df[col] < (q25 - 2.5 * iqr)) | (work_df[col] > (q75 + 2.5 * iqr))).sum())
            report["outlier_counts"][col] = outliers

    # Final summary stats
    report["final_rows"] = len(work_df)
    report["flood_cases"] = int(work_df[TARGET].sum())
    report["non_flood_cases"] = int((work_df[TARGET] == 0).sum())
    report["flood_rate"] = round(float(work_df[TARGET].mean()), 4)
    report["feature_count"] = len(work_df.columns)

    return work_df, report


def compute_eda_summary(df: pd.DataFrame) -> Dict[str, Any]:
    """Compute detailed exploratory data analysis statistics for the EDA page."""
    numeric_df = df.select_dtypes(include=[np.number])
    stats = {}
    for col in numeric_df.columns:
        if col == "flood_label":
            continue
        vals = numeric_df[col].dropna()
        stats[col] = {
            "mean": round(float(vals.mean()), 2),
            "median": round(float(vals.median()), 2),
            "std": round(float(vals.std()), 2),
            "min": round(float(vals.min()), 2),
            "max": round(float(vals.max()), 2),
            "q25": round(float(vals.quantile(0.25)), 2),
            "q75": round(float(vals.quantile(0.75)), 2),
            "skew": round(float(vals.skew()), 2) if len(vals) > 2 else 0.0
        }

    # Correlation with target
    correlations = {}
    for col in numeric_df.columns:
        if col != TARGET:
            corr = df[col].corr(df[TARGET])
            correlations[col] = round(float(corr) if not np.isnan(corr) else 0.0, 4)

    # Sorted correlations
    sorted_corr = sorted([{"feature": k, "correlation": v} for k, v in correlations.items()], key=lambda x: abs(x["correlation"]), reverse=True)

    # Class balance
    total = len(df)
    floods = int(df[TARGET].sum())
    non_floods = total - floods

    return {
        "total_records": total,
        "flood_records": floods,
        "non_flood_records": non_floods,
        "flood_percentage": round((floods / max(total, 1)) * 100, 2),
        "descriptive_statistics": stats,
        "target_correlations": sorted_corr,
        "features": list(stats.keys())
    }
