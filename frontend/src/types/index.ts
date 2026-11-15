export interface GaugeStation {
  gauge_id: string;
  station: string;
  river: string;
  basin: string;
  state: string;
  latitude: number;
  longitude: number;
  total_events: number;
  flood_count: number;
  severe_flood_count: number;
  severe_flood_rate: number;
  catchment_attributes?: Record<string, any>;
  rainfall_baseline?: Record<string, number>;
}

export interface ModelPredictionItem {
  algorithm: string;
  predicted_class: 'No Flood' | 'Flood' | 'Severe Flood';
  predicted_class_id: number;
  confidence: number;
  raw_probability: number;
  is_best_model: boolean;
  accuracy: number;
  f1_macro: number;
  roc_auc: number | null;
}

export interface ShapFactor {
  feature: string;
  value: any;
  shap_value: number;
  impact: string;
  magnitude: number;
}

export interface PredictionResult {
  prediction_id: string;
  timestamp: string;
  mode: string;
  gauge_id?: string;
  station_name?: string;
  predicted_class: 'No Flood' | 'Flood' | 'Severe Flood';
  predicted_class_id: number;
  best_model: string;
  confidence: number;
  agreement_count: number;
  total_models: number;
  agreement_percentage: number;
  all_predictions: ModelPredictionItem[];
  explanation: {
    method: string;
    base_value: number;
    top_factors: ShapFactor[];
    summary_text: string;
    global_importance: { feature: string; importance: number }[];
  };
  inputs: Record<string, any>;
}

export interface ModelEvaluationMetrics {
  [algorithm: string]: {
    accuracy: number;
    precision_macro: number;
    recall_macro: number;
    f1_macro: number;
    f1_weighted: number;
    precision_severe: number;
    recall_severe: number;
    f1_severe: number;
    roc_auc: number | null;
    training_time_sec: number;
    prediction_latency_ms: number;
    cv_metrics: {
      cv_accuracy_mean: number;
      cv_accuracy_std: number;
      cv_macro_f1_mean: number;
      cv_macro_f1_std: number;
      cv_roc_auc_mean: number | null;
    };
  };
}

export interface DatasetAudit {
  dataset_name: string;
  description: string;
  raw_sizes: Record<string, { rows: number; cols: number }>;
  final_merged_shape: { events: number; columns: number; unique_gauges: number };
  target_distribution: {
    Flood: number;
    "Severe Flood": number;
    Flood_pct: number;
    Severe_Flood_pct: number;
  };
  features: {
    total_selected: number;
    numeric_count: number;
    categorical_count: number;
    numeric_list: string[];
    categorical_list: string[];
    feature_units: Record<string, string>;
    leakage_excluded_variables: string[];
  };
  data_quality_observations: string[];
}

export interface HistoricalSummary {
  total_events: number;
  total_gauges: number;
  total_states: number;
  total_basins: number;
  year_range: { min: number; max: number };
  flood_count: number;
  severe_flood_count: number;
  severe_flood_percentage: number;
  flood_percentage: number;
}
