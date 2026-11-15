"""Geospatial feature definitions, schemas, and derivation utilities."""
from __future__ import annotations
from typing import Dict, List, Any
import numpy as np
import pandas as pd

WORLD_COVER_CLASSES = {
    10: "Tree cover",
    20: "Shrubland",
    30: "Grassland",
    40: "Cropland",
    50: "Built-up",
    60: "Bare / sparse vegetation",
    70: "Snow and ice",
    80: "Permanent water bodies",
    90: "Herbaceous wetland",
    95: "Mangroves",
    100: "Moss and lichen",
}

SOIL_TYPES = {
    1: "Clay",
    2: "Clay Loam",
    3: "Sandy Loam",
    4: "Silt Loam",
    5: "Peat / Organic",
}

SUSCEPTIBILITY_CATEGORIES = [
    {"name": "Very Low", "min": 0.0, "max": 0.2, "color": "#1b5e20", "hex": "#1b5e20", "label": "Very Low"},
    {"name": "Low", "min": 0.2, "max": 0.4, "color": "#4caf50", "hex": "#4caf50", "label": "Low"},
    {"name": "Moderate", "min": 0.4, "max": 0.6, "color": "#fbc02d", "hex": "#fbc02d", "label": "Moderate"},
    {"name": "High", "min": 0.6, "max": 0.8, "color": "#f57c00", "hex": "#f57c00", "label": "High"},
    {"name": "Very High", "min": 0.8, "max": 1.0, "color": "#d32f2f", "hex": "#d32f2f", "label": "Very High"},
]

FEATURE_METADATA: Dict[str, Dict[str, Any]] = {
    "latitude": {"label": "Latitude", "unit": "°N", "type": "measured", "min": -90.0, "max": 90.0, "default": 10.8505},
    "longitude": {"label": "Longitude", "unit": "°E", "type": "measured", "min": -180.0, "max": 180.0, "default": 76.2711},
    "elevation": {"label": "Elevation", "unit": "m", "type": "derived (NASA SRTM / Copernicus)", "min": -10.0, "max": 8848.0, "default": 24.5},
    "slope": {"label": "Slope", "unit": "°", "type": "derived (DEM gradient)", "min": 0.0, "max": 90.0, "default": 2.1},
    "aspect": {"label": "Aspect", "unit": "°", "type": "derived (DEM azimuth)", "min": 0.0, "max": 360.0, "default": 135.0},
    "rainfall_24h": {"label": "24h Rainfall", "unit": "mm", "type": "measured (NASA GPM / IMD)", "min": 0.0, "max": 1000.0, "default": 128.5},
    "rainfall_7d": {"label": "7-day Cumulative Rainfall", "unit": "mm", "type": "measured (NASA GPM / IMD)", "min": 0.0, "max": 3000.0, "default": 412.0},
    "rainfall_30d": {"label": "30-day Cumulative Rainfall", "unit": "mm", "type": "measured (NASA GPM / IMD)", "min": 0.0, "max": 6000.0, "default": 850.0},
    "distance_to_river": {"label": "Distance to Nearest River", "unit": "m", "type": "derived (HydroSHEDS / OSM)", "min": 0.0, "max": 50000.0, "default": 350.0},
    "drainage_density": {"label": "Drainage Density", "unit": "km/km²", "type": "derived (Stream length per unit area)", "min": 0.0, "max": 15.0, "default": 3.8},
    "flow_accumulation": {"label": "Flow Accumulation", "unit": "cells", "type": "derived (D8 Flow Routing)", "min": 0.0, "max": 500000.0, "default": 14200.0},
    "twi": {"label": "Topographic Wetness Index (TWI)", "unit": "ln(a/tan β)", "type": "derived (ln(flow_accum / tan(slope)))", "min": 0.0, "max": 30.0, "default": 11.4},
    "landcover": {"label": "Land-Cover Category", "unit": "WorldCover code", "type": "measured (ESA WorldCover 10m)", "min": 10, "max": 100, "default": 40},
    "soil_type": {"label": "Soil Category", "unit": "Soil code", "type": "estimated (FAO / ICAR Soil Grids)", "min": 1, "max": 5, "default": 1},
    "ndvi": {"label": "NDVI", "unit": "index (-1 to 1)", "type": "measured (Sentinel-2 / MODIS)", "min": -1.0, "max": 1.0, "default": 0.42},
    "flood_frequency": {"label": "Historical Flood Frequency", "unit": "events / decade", "type": "measured (Global Flood DB / ISRO)", "min": 0, "max": 20, "default": 4},
}

ALL_FEATURES = list(FEATURE_METADATA.keys())

def calculate_twi(flow_accumulation: float | np.ndarray, slope_degrees: float | np.ndarray, cell_size: float = 30.0) -> float | np.ndarray:
    """Compute Topographic Wetness Index: TWI = ln(a / tan(beta))."""
    slope_rad = np.radians(np.clip(slope_degrees, 0.05, 89.9))
    tan_slope = np.tan(slope_rad)
    specific_catchment = (flow_accumulation + 1.0) * cell_size
    twi = np.log(np.clip(specific_catchment / tan_slope, 1e-4, 1e9))
    return np.clip(twi, 0.0, 30.0)

def classify_susceptibility(probability: float) -> Dict[str, Any]:
    """Map probability [0, 1] to one of the five susceptibility categories."""
    p = float(np.clip(probability, 0.0, 1.0))
    for idx, cat in enumerate(SUSCEPTIBILITY_CATEGORIES, 1):
        if cat["min"] <= p < cat["max"]:
            return {
                "category": cat["name"],
                "tier": idx,
                "score": round(p, 4),
                "susceptibility_percentage": round(p * 100, 2),
                "color": cat["color"],
                "hex": cat["hex"],
                "description": f"{cat['name']} susceptibility to historical flood conditions based on environmental and terrain covariates."
            }
    last = SUSCEPTIBILITY_CATEGORIES[-1]
    return {
        "category": last["name"],
        "tier": len(SUSCEPTIBILITY_CATEGORIES),
        "score": round(p, 4),
        "susceptibility_percentage": round(p * 100, 2),
        "color": last["color"],
        "hex": last["hex"],
        "description": f"{last['name']} susceptibility to historical flood conditions based on environmental and terrain covariates."
    }
