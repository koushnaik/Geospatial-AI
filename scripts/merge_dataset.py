"""
Merge Genuine Non-Flood Observations with Existing INDOFLOODS Flood Events
Creates the 3-Class Flood Occurrence & Severity Dataset:
0: No Flood
1: Flood
2: Severe Flood
"""

import os
import shutil
import pandas as pd
import numpy as np

def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    proc_dir = os.path.join(base_dir, "datasets/processed")
    raw_dir = os.path.join(base_dir, "datasets/raw")

    nf_path = os.path.join(proc_dir, "genuine_non_flood_observations.csv")
    catch_path = os.path.join(raw_dir, "catchment_characteristics_indofloods.csv")
    old_model_data_path = os.path.join(proc_dir, "model_features_dataset.csv")
    backup_path = os.path.join(proc_dir, "model_features_dataset_v1_backup.csv")

    if not os.path.exists(nf_path):
        print(f"Error: {nf_path} does not exist yet. Please wait for collection to finish.")
        return

    # Backup existing v1 dataset if not already backed up
    if not os.path.exists(backup_path):
        shutil.copyfile(old_model_data_path, backup_path)
        print(f"Backed up v1 dataset to: {backup_path}")

    # 1. Load genuine non-flood observations
    df_nf = pd.read_csv(nf_path)
    print(f"Loaded {len(df_nf)} genuine non-flood observations.")

    # 2. Load catchment characteristics
    catch = pd.read_csv(catch_path)
    
    # Feature columns matching v1
    numeric_catchment = [
        "Drainage Area", "Catchment Relief", "Catchment Length", "Catchment Perimeter",
        "Drainage Density", "Stream Order", "Sinuosity Index", "Form Factor",
        "Relief Ratio", "Elongation Ratio", "Circularity Ratio",
        "Annual Precipitation", "Precipitation Seasonality", "Annual Mean Temperature"
    ]
    categorical_features = [
        "Soil type", "Land cover", "lithology type", "KoppenGeiger Climate Type"
    ]
    
    catch_subset = catch[["GaugeID"] + numeric_catchment + categorical_features].drop_duplicates(subset=["GaugeID"])

    # Merge catchment attributes onto non-flood records
    df_nf_full = df_nf.merge(catch_subset, on="GaugeID", how="left")
    print(f"Merged catchment attributes for non-flood: {df_nf_full.shape}")

    # 3. Load existing flood records
    df_flood = pd.read_csv(backup_path)
    print(f"Loaded {len(df_flood)} existing flood event records.")

    # Remap flood target from [0, 1] to [1, 2]
    # Old: 0 = Flood, 1 = Severe Flood
    # New: 0 = No Flood, 1 = Flood, 2 = Severe Flood
    df_flood["target"] = df_flood["target"].map({0: 1, 1: 2})
    df_flood["Flood Type"] = df_flood["target"].map({1: "Flood", 2: "Severe Flood"})

    # Ensure identical column structure
    common_cols = [
        "EventID", "GaugeID", "target", "Flood Type",
        "T1d", "T2d", "T3d", "T4d", "T5d", "T6d", "T7d", "T8d", "T9d", "T10d"
    ] + numeric_catchment + categorical_features

    df_nf_ready = df_nf_full[common_cols].copy()
    df_flood_ready = df_flood[common_cols].copy()

    # Combine into unified dataset
    df_combined = pd.concat([df_nf_ready, df_flood_ready], ignore_index=True)
    
    # Sort for cleanliness
    df_combined = df_combined.sort_values(by=["GaugeID", "target"]).reset_index(drop=True)

    print("\n--- COMBINED DATASET SUMMARY ---")
    print(f"Total observations: {len(df_combined)}")
    print(f"Target distribution:\n{df_combined['target'].value_counts().sort_index()}")
    print(f"Flood Type distribution:\n{df_combined['Flood Type'].value_counts()}")
    print(f"Unique gauges: {df_combined['GaugeID'].nunique()}")

    # Save to model_features_dataset.csv
    df_combined.to_csv(old_model_data_path, index=False)
    print(f"\nSaved combined 3-class dataset to: {old_model_data_path}")

if __name__ == "__main__":
    main()
