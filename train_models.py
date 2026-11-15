#!/usr/bin/env python3
"""
GeoFlood AI - Master Model Training Script
Executes the data pipeline and trains all 5 algorithms using gauge-group-aware validation.
"""

import sys
import os

project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from backend.app.ml.preprocessing.data_pipeline import run_data_pipeline
from backend.app.ml.training.trainer import train_and_evaluate_all

def main():
    print("="*60)
    print("GeoFlood AI: Starting Full ML Pipeline Execution")
    print("="*60)
    
    print("\n[Step 1/2] Running Data Engineering & Quality Pipeline...")
    run_data_pipeline(base_dir=project_root)
    
    print("\n[Step 2/2] Training & Evaluating 5 ML Algorithms...")
    metadata = train_and_evaluate_all(base_dir=project_root)
    
    print("\n" + "="*60)
    print("GeoFlood AI Training Pipeline Successfully Completed!")
    print(f"Best Model: {metadata['best_model']}")
    print("="*60)

if __name__ == "__main__":
    main()
