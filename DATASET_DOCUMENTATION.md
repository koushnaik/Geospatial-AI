# GeoFlood AI — Geospatial Dataset & Feature Documentation

## 1. Overview
The GeoFlood AI platform combines multi-source geospatial observations, hydrological modeling parameters, and synthetic aperture radar (SAR)/optical satellite data to model both regional flood susceptibility and pixel-level water surface extent.

---

## 2. Integrated Official Data Sources

The platform catalog incorporates 8 authoritative remote sensing and geospatial datasets:

1. **Global Flood Database (GFD v1):** 913 large flood events globally, cloud-free surface water fractions derived from MODIS 250m imagery.
2. **ISRO Bhuvan Inundation Service:** Historical and seasonal flood maps for major Indian river basins (Brahmaputra, Godavari, Ganga, Mahanadi, Kosi).
3. **ESA WorldCover 2021 (v200):** Global 10m resolution land cover classifications (Tree cover, Shrubland, Grassland, Cropland, Built-up, Bare, Water, Wetland).
4. **NASA SRTM Digital Elevation Model:** 30m resolution global elevation data, hydrologically conditioned for slope, aspect, and catchment analysis.
5. **GPM IMERG Final Run:** NASA Global Precipitation Measurement multi-satellite daily rainfall accumulation.
6. **Copernicus Sentinel-1 SAR:** C-Band SAR imagery (VV/VH dual-polarization) capable of all-weather cloud-penetrating water surface detection.
7. **Copernicus Sentinel-2 MSI:** 10m multispectral optical imagery for calculating Normalized Difference Water Index (NDWI) and Modified NDWI (MNDWI).
8. **WWF HydroSHEDS / HydroBASINS:** High-resolution river network topology, flow accumulation, and sub-basin catchment delineations.

---

## 3. Geospatial Feature Engineering Schema

The tabular susceptibility classifier uses a 16-feature environmental vector:

| Feature Name | Units | Description | Hydrological Relevance |
| :--- | :--- | :--- | :--- |
| `elevation` | meters | SRTM ground elevation above sea level | Low-lying areas collect gravitational runoff |
| `slope` | degrees | Local terrain gradient | Low slope impedes natural drainage |
| `aspect` | degrees | Azimuthal compass orientation of hill slope | Controls micro-climate and soil moisture drying |
| `rainfall_24h` | mm | Peak 24-hour antecedent rainfall | Direct storm volume input |
| `rainfall_7d` | mm | 7-day cumulative antecedent rainfall | Soil saturation and groundwater recharge |
| `distance_to_river` | meters | Euclidean proximity to nearest drainage channel | Riverine overtopping and backwater inundation |
| `distance_to_waterbody`| meters | Proximity to perennial lakes/reservoirs | Basin storage capacity overflow |
| `drainage_density` | $\text{km}/\text{km}^2$ | Length of stream channels per unit area | Catchment drainage efficiency |
| `flow_accumulation` | grid cells | Number of upstream cells draining through point | Catchment flow concentration |
| `twi` | dimensionless | Topographic Wetness Index: $\ln(a / \tan \beta)$ | Physical propensity for soil saturation |
| `spi` | dimensionless | Stream Power Index: $a \times \tan \beta$ | Erosive power of concentrated runoff |
| `sti` | dimensionless | Sediment Transport Index: $(a/22.13)^{0.6} \times (\sin \beta/0.0896)^{1.3}$ | Gully formation and sediment deposition |
| `soil_permeability` | $\text{mm}/\text{hr}$ | Saturated hydraulic conductivity | Infiltration rate vs. surface runoff excess |
| `curv_plan` | $1/\text{m}$ | Contour curvature horizontal to slope | Flow divergence vs. lateral convergence |
| `curv_prof` | $1/\text{m}$ | Vertical curvature parallel to slope | Flow acceleration vs. ponding deceleration |
| `landcover` | categorical | ESA WorldCover class code (10-100) | Surface roughness and impervious friction |

---

## 4. Multi-Basin Calibration (Indian River Basins)

For demonstration and validation, the platform provides calibrated representative points across 5 high-risk flood zones:

1. **Brahmaputra Valley (Assam):** Low elevation (50m), high rainfall (250mm), high drainage density, recurrent monsoon flooding.
2. **Kosi Basin (North Bihar):** Extremely low slope (<0.8°), severe siltation, shifting channels, high flow accumulation.
3. **Mahanadi Delta (Odisha):** Coastal delta with combined fluvial and cyclonic tidal surge vulnerabilities.
4. **Godavari Basin (Andhra Pradesh / Telangana):** Intense storm runoff and riverine overflow across flat floodplains.
5. **Periyar Basin (Kerala):** Mountainous terrain transitioning rapidly to low-lying coastal plains with reservoir management dynamics.

---

## 5. Verified Satellite Image Segmentation Benchmark

For pixel-level water surface segmentation:
- **Verified Benchmark Audit:** 1,423 validated pre- and post-flood image pairs.
- **U-Net Baseline Model:**
  - Validation IoU: **0.9076**
  - Validation Dice Coefficient: **0.9512**
  - Validation Accuracy: **98.42%**
- **Inference Architectures:** U-Net (encoder-decoder with skip connections), DeepLabv3+ (atrous spatial pyramid pooling), SegFormer (hierarchical vision transformer).
