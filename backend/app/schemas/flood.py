"""
Pydantic Schemas for GeoFlood AI API
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict

class PredictionInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    mode: str = Field(default="station", description="'station' or 'manual'")
    gauge_id: Optional[str] = Field(default=None, description="GaugeID for station selection mode")
    station_name: Optional[str] = None
    state: Optional[str] = None
    basin: Optional[str] = None
    
    # 10 Rainfall variables (mm)
    T1d: float = Field(..., ge=0, description="1-day accumulated rainfall (mm)")
    T2d: float = Field(..., ge=0, description="2-day accumulated rainfall (mm)")
    T3d: float = Field(..., ge=0, description="3-day accumulated rainfall (mm)")
    T4d: float = Field(..., ge=0, description="4-day accumulated rainfall (mm)")
    T5d: float = Field(..., ge=0, description="5-day accumulated rainfall (mm)")
    T6d: float = Field(..., ge=0, description="6-day accumulated rainfall (mm)")
    T7d: float = Field(..., ge=0, description="7-day accumulated rainfall (mm)")
    T8d: float = Field(..., ge=0, description="8-day accumulated rainfall (mm)")
    T9d: float = Field(..., ge=0, description="9-day accumulated rainfall (mm)")
    T10d: float = Field(..., ge=0, description="10-day accumulated rainfall (mm)")
    
    # Catchment Characteristics
    drainage_area: float = Field(..., ge=0, alias="Drainage Area", description="Drainage Area (km²)")
    catchment_relief: float = Field(..., ge=0, alias="Catchment Relief", description="Catchment Relief (m)")
    catchment_length: float = Field(..., ge=0, alias="Catchment Length", description="Catchment Length (km)")
    catchment_perimeter: float = Field(..., ge=0, alias="Catchment Perimeter", description="Catchment Perimeter (km)")
    drainage_density: float = Field(..., ge=0, alias="Drainage Density", description="Drainage Density (km/km²)")
    stream_order: int = Field(..., ge=1, le=10, alias="Stream Order", description="Strahler Stream Order")
    sinuosity_index: float = Field(..., ge=0, alias="Sinuosity Index", description="Sinuosity Index")
    form_factor: float = Field(..., ge=0, alias="Form Factor", description="Form Factor")
    relief_ratio: float = Field(..., ge=0, alias="Relief Ratio", description="Relief Ratio")
    elongation_ratio: float = Field(..., ge=0, alias="Elongation Ratio", description="Elongation Ratio")
    circularity_ratio: float = Field(..., ge=0, alias="Circularity Ratio", description="Circularity Ratio")
    annual_precipitation: float = Field(..., ge=0, alias="Annual Precipitation", description="Annual Precipitation (mm)")
    precipitation_seasonality: float = Field(..., ge=0, alias="Precipitation Seasonality", description="Precipitation Seasonality (%)")
    annual_mean_temperature: float = Field(..., alias="Annual Mean Temperature", description="Annual Mean Temperature (°C)")
    
    # Categorical
    soil_type: str = Field(..., alias="Soil type", description="Soil Type")
    land_cover: str = Field(..., alias="Land cover", description="Land Cover")
    lithology_type: str = Field(..., alias="lithology type", description="Lithology Type")
    koppen_climate_type: str = Field(..., alias="KoppenGeiger Climate Type", description="Koppen Geiger Climate Type")

class ModelPredictionItem(BaseModel):
    algorithm: str
    predicted_class: str
    predicted_class_id: int
    confidence: float
    raw_probability: float
    is_best_model: bool
    accuracy: float
    f1_macro: float
    roc_auc: Optional[float]

class ShapFactor(BaseModel):
    feature: str
    value: Any
    shap_value: float
    impact: str
    magnitude: float

class PredictionResultSchema(BaseModel):
    prediction_id: str
    timestamp: str
    mode: str
    gauge_id: Optional[str]
    station_name: Optional[str]
    predicted_class: str
    predicted_class_id: int
    best_model: str
    confidence: float
    agreement_count: int
    total_models: int
    agreement_percentage: float
    all_predictions: List[ModelPredictionItem]
    explanation: Dict[str, Any]
    inputs: Dict[str, Any]
