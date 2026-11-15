"""
GeoFlood AI Prediction and Explanation Engine.
Loads saved models, transforms input features, runs multi-model inference,
computes SHAP local explanations, and calculates consensus metrics.
"""

import os
import json
import time
import uuid
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

from backend.app.database.db import save_prediction

class ModelManager:
    _instance = None

    def __init__(self, base_dir=None):
        if base_dir is None:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
        self.base_dir = base_dir
        self.models_dir = os.path.join(base_dir, "models")
        self.processed_dir = os.path.join(base_dir, "datasets", "processed")
        
        # Load metadata
        meta_path = os.path.join(self.models_dir, "model_metadata.json")
        with open(meta_path, "r") as f:
            self.metadata = json.load(f)
            
        self.best_model_name = self.metadata["best_model"]
        self.evaluation_metrics = self.metadata["evaluation_metrics"]
        
        # Load preprocessor
        prep_path = os.path.join(self.models_dir, "preprocessor.joblib")
        self.preprocessor = joblib.load(prep_path)
        
        # Load SHAP explainer
        shap_path = os.path.join(self.models_dir, "shap_explainer.joblib")
        self.shap_explainer = joblib.load(shap_path)
        
        # Load all 5 models
        self.models = {}
        model_files = {
            "Logistic Regression": "logistic_regression.joblib",
            "Random Forest": "random_forest.joblib",
            "Decision Tree": "decision_tree.joblib",
            "Support Vector Machine": "support_vector_machine.joblib",
            "XGBoost": "xgboost.joblib"
        }
        for name, filename in model_files.items():
            path = os.path.join(self.models_dir, filename)
            self.models[name] = joblib.load(path)
            
        # Load feature lists
        self.numeric_features = self.metadata["features"]["raw_numeric"]
        self.categorical_features = self.metadata["features"]["raw_categorical"]
        self.all_feature_names = self.metadata["features"]["processed_feature_names"]
        
        print(f"ModelManager initialized successfully. Best model: {self.best_model_name}")

    @classmethod
    def get_instance(cls, base_dir=None):
        if cls._instance is None:
            cls._instance = ModelManager(base_dir)
        return cls._instance

    def predict(self, input_dict: dict) -> dict:
        prediction_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Hydrological Feature Engineering:
        # Dynamically calculate derived physical indicators if not explicitly provided
        t1d = float(input_dict.get("T1d", 0.0))
        t10d = float(input_dict.get("T10d", 0.0))
        relief_ratio = float(input_dict.get("Relief Ratio", 0.0))
        drainage_density = float(input_dict.get("Drainage Density", 0.0))
        
        computed_features = {
            "Rainfall_Burst_Ratio": t1d / (t10d + 1.0),
            "Antecedent_Saturation_Proxy": t10d - t1d,
            "Runoff_Potential": t1d * relief_ratio * drainage_density
        }
        
        # Build single row dataframe for preprocessing
        row_data = {}
        for feat in self.numeric_features:
            if feat in computed_features and feat not in input_dict:
                row_data[feat] = [float(computed_features[feat])]
            else:
                val = input_dict.get(feat)
                if val is None and feat in computed_features:
                    val = computed_features[feat]
                elif val is None:
                    raise ValueError(f"Missing required numeric feature: {feat}")
                row_data[feat] = [float(val)]
            
        for feat in self.categorical_features:
            val = input_dict.get(feat)
            if val is None:
                raise ValueError(f"Missing required categorical feature: {feat}")
            row_data[feat] = [str(val)]
            
        input_df = pd.DataFrame(row_data)
        
        # Transform features using saved preprocessor
        X_proc = self.preprocessor.transform(input_df)
        
        # Run inference across all 5 models (0: No Flood, 1: Flood, 2: Severe Flood)
        class_names = {0: "No Flood", 1: "Flood", 2: "Severe Flood"}
        all_preds = []
        votes = {0: 0, 1: 0, 2: 0}
        
        for name, model in self.models.items():
            pred_class_id = int(model.predict(X_proc)[0])
            pred_class = class_names[pred_class_id]
            votes[pred_class_id] += 1
            
            # Probability / Confidence
            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(X_proc)[0]
                conf = float(probs[pred_class_id])
                # Probability of any flood (moderate or severe)
                prob_any_flood = float(probs[1] + probs[2]) if len(probs) > 2 else float(probs[-1])
            else:
                conf = 0.85
                prob_any_flood = 0.0 if pred_class_id == 0 else 1.0
                
            eval_data = self.evaluation_metrics.get(name, {})
            all_preds.append({
                "algorithm": name,
                "predicted_class": pred_class,
                "predicted_class_id": pred_class_id,
                "confidence": round(conf, 4),
                "raw_probability": round(prob_any_flood, 4),
                "is_best_model": (name == self.best_model_name),
                "accuracy": eval_data.get("accuracy", 0.0),
                "f1_macro": eval_data.get("f1_macro", 0.0),
                "roc_auc": eval_data.get("roc_auc")
            })
            
        # Best model prediction
        best_pred_item = next(p for p in all_preds if p["is_best_model"])
        final_class = best_pred_item["predicted_class"]
        final_class_id = best_pred_item["predicted_class_id"]
        final_confidence = best_pred_item["confidence"]
        
        # Agreement score
        agreement_count = votes[final_class_id]
        agreement_pct = round((agreement_count / len(all_preds)) * 100.0, 1)
        
        # SHAP Individual Explanation
        explanation = self.generate_shap_explanation(X_proc, input_dict, final_class, final_class_id)
        
        result = {
            "prediction_id": prediction_id,
            "timestamp": timestamp,
            "mode": input_dict.get("mode", "manual"),
            "gauge_id": input_dict.get("gauge_id"),
            "station_name": input_dict.get("station_name"),
            "predicted_class": final_class,
            "predicted_class_id": final_class_id,
            "best_model": self.best_model_name,
            "confidence": final_confidence,
            "agreement_count": agreement_count,
            "total_models": len(all_preds),
            "agreement_percentage": agreement_pct,
            "all_predictions": all_preds,
            "explanation": explanation,
            "inputs": input_dict
        }
        
        # Save to SQLite database
        try:
            save_prediction(result)
        except Exception as e:
            print(f"Warning: Failed to save prediction to database: {e}")
            
        return result

    def generate_shap_explanation(self, X_proc, input_dict, final_class, final_class_id=0):
        try:
            shap_values = self.shap_explainer.shap_values(X_proc)
            
            # Extract SHAP vector for the predicted class
            if isinstance(shap_values, list):
                # List of arrays [class_0, class_1, class_2]
                class_idx = min(final_class_id, len(shap_values) - 1)
                shap_vec = shap_values[class_idx][0]
            elif hasattr(shap_values, "shape") and len(shap_values.shape) == 3:
                # Shape (1, n_features, n_classes)
                class_idx = min(final_class_id, shap_values.shape[2] - 1)
                shap_vec = shap_values[0, :, class_idx]
            elif hasattr(shap_values, "shape") and len(shap_values.shape) == 2:
                shap_vec = shap_values[0]
            else:
                shap_vec = shap_values
                
            factors = []
            for i, feat_name in enumerate(self.all_feature_names):
                sv = float(shap_vec[i])
                raw_val = input_dict.get(feat_name, None)
                
                # Check for derived hydrological features
                if raw_val is None:
                    if feat_name == "Rainfall_Burst_Ratio":
                        t1 = float(input_dict.get("T1d", 0.0))
                        t10 = float(input_dict.get("T10d", 0.0))
                        raw_val = round(t1 / (t10 + 1.0), 3)
                    elif feat_name == "Antecedent_Saturation_Proxy":
                        t1 = float(input_dict.get("T1d", 0.0))
                        t10 = float(input_dict.get("T10d", 0.0))
                        raw_val = round(t10 - t1, 2)
                    elif feat_name == "Runoff_Potential":
                        t1 = float(input_dict.get("T1d", 0.0))
                        rr = float(input_dict.get("Relief Ratio", 0.0))
                        dd = float(input_dict.get("Drainage Density", 0.0))
                        raw_val = round(t1 * rr * dd, 4)
                
                # If dummy categorical, inspect parent category value
                if raw_val is None:
                    for parent_cat in self.categorical_features:
                        if feat_name.startswith(parent_cat) or feat_name.lower().startswith(parent_cat.lower()):
                            cat_val = input_dict.get(parent_cat)
                            raw_val = "Active" if cat_val and str(cat_val) in feat_name else "Inactive"
                            break
                            
                # Contextual impact description based on predicted class
                if final_class == "No Flood":
                    impact_text = "Supports Normal Baseline (No Flood)" if sv > 0 else "Elevates Runoff Risk"
                elif final_class == "Severe Flood":
                    impact_text = "Increases Severe Flood Risk" if sv > 0 else "Mitigates Peak Severity"
                else:
                    impact_text = "Increases Inundation Risk" if sv > 0 else "Tempering Runoff"

                factors.append({
                    "feature": feat_name,
                    "value": raw_val,
                    "shap_value": round(sv, 4),
                    "impact": impact_text,
                    "magnitude": round(abs(sv), 4)
                })
                
            # Sort by absolute SHAP magnitude
            factors_sorted = sorted(factors, key=lambda x: x["magnitude"], reverse=True)
            top_factors = factors_sorted[:10]
            
            # Formulate intuitive plain text synthesis
            top_pos = [f for f in factors_sorted if f["shap_value"] > 0][:3]
            top_neg = [f for f in factors_sorted if f["shap_value"] < 0][:3]
            
            synthesis_parts = []
            if final_class == "No Flood":
                pos_names = ", ".join([f["feature"] for f in top_pos])
                synthesis_parts.append(
                    f"The No Flood prediction is supported by safe baseline hydrology and low runoff signals in {pos_names}."
                )
            elif final_class == "Severe Flood":
                pos_names = ", ".join([f["feature"] for f in top_pos])
                synthesis_parts.append(
                    f"The Severe Flood prediction is primarily driven by heightened precipitation signals in {pos_names}."
                )
            else:
                pos_names = ", ".join([f["feature"] for f in top_pos])
                synthesis_parts.append(
                    f"The Flood prediction indicates moderate inundation conditions driven by {pos_names} exceeding normal baseflow thresholds."
                )
                
            summary_text = " ".join(synthesis_parts)
            
            exp_val = 0.0
            if hasattr(self.shap_explainer, "expected_value"):
                ev = self.shap_explainer.expected_value
                if isinstance(ev, (list, np.ndarray)):
                    exp_val = float(ev[min(final_class_id, len(ev)-1)])
                else:
                    exp_val = float(ev)
            
            return {
                "method": f"SHAP (TreeExplainer on {self.best_model_name})",
                "base_value": round(exp_val, 4),
                "top_factors": top_factors,
                "summary_text": summary_text,
                "global_importance": self.metadata.get("global_shap_importance", [])
            }
        except Exception as e:
            print(f"SHAP explanation generation error: {e}")
            return {
                "method": "Feature Importance Fallback",
                "base_value": 0.0,
                "top_factors": [],
                "summary_text": f"SHAP explanation could not be computed dynamically ({str(e)}).",
                "global_importance": self.metadata.get("global_shap_importance", [])
            }
