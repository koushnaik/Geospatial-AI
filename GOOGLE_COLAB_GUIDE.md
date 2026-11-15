# Google Colab Guide for GeoFlood AI

This guide runs the **existing project modules** in a Colab notebook. It does not create observations or labels. You need a prepared GFD event raster and a WorldCover tile, or a point CSV whose labels and coverage were already verified.

## 1. What Google Colab is and why use it

Google Colab hosts Jupyter notebooks in a browser. It is useful for learning because Python cells run in a managed environment without installing Python locally. A runtime is temporary, so save source data, notebook outputs and model files to Drive. Colab availability and resource limits can vary. [Google Colab FAQ](https://research.google.com/colaboratory/faq.html) · [Google Colab Drive guide](https://colab.research.google.com/notebooks/io.ipynb)

## 2. Open Colab and make a notebook

1. Visit [colab.research.google.com](https://colab.research.google.com/) and sign in.
2. Choose **New notebook**. Rename it `GeoFlood_AI_Training.ipynb`.
3. A code cell runs with the play button at its left. Add cells with **+ Code** and run from top to bottom.
4. Keep a backup in Google Drive. Runtime files under `/content` are temporary.

## 3. Put the project and data in Drive

Create `MyDrive/GeoFloodAI/` and place the existing project folder (including `app.py`, `requirements.txt`, and `src/`) inside `MyDrive/GeoFloodAI/project/`. Place data in `MyDrive/GeoFloodAI/data/`, for example:

```text
MyDrive/GeoFloodAI/
├── project/
│   ├── app.py
│   ├── requirements.txt
│   └── src/
├── data/
│   ├── gfd_event.tif
│   └── worldcover_tile.tif
└── artifacts/
```

You can upload through the Drive website, or Colab's file browser. A GFD export is not created automatically by this code: obtain an event GeoTIFF from the [official GFD Earth Engine collection](https://developers.google.com/earth-engine/datasets/catalog/GLOBAL_FLOOD_DB_MODIS_EVENTS_V1). Include flooded extent and observation-quality bands, and include `jrc_perm_water` so permanent water can be excluded after that rule is implemented/verified. The current raster sampler supports only flooded and a clear-observation band; it does not yet consume the permanent-water band. Do not interpret its outputs as a validated flood dataset until this is fixed.

The catalog describes 913 events from 2000–2018; descriptions refer to 250 m mapping while the band table lists 30 m. Inspect the exported raster transform. [ESA WorldCover](https://esa-worldcover.org/en/data-access) provides 10 m class tiles; use the tile(s) covering the same area. Data have different time periods and pixel support.

## 4. Connect Google Drive

Run this cell and approve access when Google requests it. Mounting Drive allows notebook code to read and write files in Drive, so only run code you understand.

```python
from google.colab import drive
drive.mount("/content/drive")

from pathlib import Path
PROJECT = Path("/content/drive/MyDrive/GeoFloodAI/project")
DATA = Path("/content/drive/MyDrive/GeoFloodAI/data")
ARTIFACTS = Path("/content/drive/MyDrive/GeoFloodAI/artifacts")
ARTIFACTS.mkdir(parents=True, exist_ok=True)
assert (PROJECT / "src" / "model_training.py").exists(), "Copy the project folder to Drive first"
print("Project:", PROJECT)
print("Data files:", [p.name for p in DATA.iterdir()])
```

If your project is not in Drive, upload a ZIP using the left file-browser upload button, unzip it under `/content`, then set `PROJECT` to that extracted directory. Copy any results you want to keep to Drive before the runtime ends.

## 5. Install project libraries

Run from a fresh runtime. This installs the packages listed by the project. It may take a while; restart the runtime if Colab asks.

```python
%pip install -r "/content/drive/MyDrive/GeoFloodAI/project/requirements.txt"
```

Load the project modules:

```python
import os, sys
os.chdir(PROJECT)
sys.path.insert(0, str(PROJECT))

import numpy as np
import pandas as pd
import rasterio
from src.data_loader import read_points
from src.feature_engineering import raster_event_samples
from src.data_preprocessing import prepare_dataset, dataset_stats
from src.model_training import train_all
from src.prediction import predict
print("GeoFlood AI modules loaded")
```

## 6. Inspect files and geospatial metadata

```python
GFD_PATH = DATA / "gfd_event.tif"
WORLDCOVER_PATH = DATA / "worldcover_tile.tif"

for path in [GFD_PATH, WORLDCOVER_PATH]:
    if not path.exists():
        raise FileNotFoundError(f"Place the expected input here: {path}")
    with rasterio.open(path) as ds:
        print("\n", path.name)
        print("CRS:", ds.crs, "bands:", ds.count)
        print("dimensions:", ds.width, "x", ds.height)
        print("transform:", ds.transform)
        print("bounds:", ds.bounds, "nodata:", ds.nodata)
        print("descriptions:", ds.descriptions)
```

Confirm that the GFD bands correspond to the selected event and that the WorldCover tile overlaps the event. Band indexes in Python are **1-based**. Never infer a band from an index alone if descriptions or export metadata are available.

## 7. Preprocess and combine the rasters

This calls the current raster workflow from `src/feature_engineering.py`. It samples WorldCover at GFD pixel centers. It does **not** yet aggregate 10 m classes into true composition percentages or apply the GFD permanent-water mask. The code requires a clear-observation band so zero-flood pixels without clear observations are not used as negatives. Check your raster's actual band descriptions before setting indexes.

```python
FLOODED_BAND = 1       # change to the actual 1-based band index
CLEAR_BAND = 2         # change to clear_views or clear_perc; required by current function
FLOODED_VALUE = 1      # GFD flooded band: 1 means surface water, 0 means no water
MAX_SAMPLES = 100_000  # cap memory use; this is sampling, not a complete census

with rasterio.open(GFD_PATH) as gfd, rasterio.open(WORLDCOVER_PATH) as wc:
    raw = raster_event_samples(
        gfd, wc,
        flood_band=FLOODED_BAND,
        clear_band=CLEAR_BAND,
        positive_value=FLOODED_VALUE,
        max_samples=MAX_SAMPLES,
    )

print(raw.shape)
display(raw.head())
print(raw["flood_label"].value_counts(dropna=False))
```

Only observations in the raster's valid footprint with positive clear support are candidates. However, because permanent water is not yet masked in the current implementation, fix/verify that before treating the resulting labels as flood-only observations or reporting results.

If you already have an audited CSV with columns `latitude`, `longitude`, `flood_label`, and `landcover`, load it instead:

```python
CSV_PATH = DATA / "observed_points.csv"
raw = read_points(CSV_PATH)
display(raw.head())
```

For CSV use, labels must come from observed event coverage. Add `coverage_observed` with true/false values where possible; current code filters false rows but does not require the column. Do not create background zeros outside observed event coverage.

## 8. Create features and training table

```python
dataset, features = prepare_dataset(raw)
print("Rows/features:", len(dataset), features)
print("Stats:", dataset_stats(dataset))
display(dataset.head())
```

The current module derives class indicators from WorldCover codes. Columns named `built_up_pct`, `vegetation_pct`, `water_pct`, and `cropland_pct` are currently 0 or 100 according to the single sampled class; they are **not** measured neighborhood percentages. Rainfall, elevation, slope, river distance and soil are only included if present in the supplied table; no such layers are bundled. Do not fill unavailable data with guessed values.

## 9. Train supported classifiers

The current `train_all` function fits available Logistic Regression, Decision Tree, Random Forest, SVM, KNN, XGBoost, CatBoost, Voting and Stacking models. XGBoost and CatBoost are skipped when imports are unavailable. It uses a 0.1-degree grouped spatial holdout where feasible, otherwise a stratified random fallback, records the split method and saves each fitted pipeline. It may take time, especially for ensemble models.

```python
models, metric_rows, best_model, validation = train_all(
    dataset,
    features,
    artifact_dir=str(ARTIFACTS),
    progress=lambda fraction, name: print(f"{fraction:.0%} {name}"),
)
print("Best model:", best_model)
print("Validation:", validation["split_method"])
```

Spatial grouping by 0.1-degree cells is only a basic leakage reduction. Nearby cells can still be spatially dependent, and this is not a temporal or independent-region validation. If the split lacks both classes, training stops or falls back as indicated by the code; report the actual method.

## 10. Compare models and choose the best

```python
metrics = pd.DataFrame([r for r in metric_rows if "macro_f1" in r])
display(metrics.drop(columns=["confusion_matrix"], errors="ignore").sort_values("macro_f1", ascending=False))
```

The implementation chooses maximum macro F1 and uses flood recall as a tie-break. Examine flood recall, precision, confusion matrices and the split method too. ROC-AUC is unavailable if a model has no probabilities or the evaluated truth has only one class. These values are produced by your run; this guide contains no benchmark or promised score.

```python
for row in metrics.to_dict("records"):
    print(row["model"], "confusion matrix [true rows 0/1, predicted columns 0/1]:", row["confusion_matrix"])
```

## 11. Save, download and load the fitted model

`train_all` writes one `.joblib` file per successfully fitted model into Drive's `artifacts` folder. Each bundle contains the fitted preprocessing/model pipeline, feature names and split method.

```python
import joblib
model_file = ARTIFACTS / (best_model.lower().replace(" ", "_") + ".joblib")
bundle = joblib.load(model_file)
print(model_file, bundle.keys(), bundle["features"])
```

To download it to your computer from Colab:

```python
from google.colab import files
files.download(str(model_file))
```

Or keep it in Drive and point your backend to that artifact. Only load joblib/pickle files from a trusted source; loading an untrusted file can execute code.

## 12. Use the model in a backend or website

The current project has a Streamlit prediction function but no HTTP API. For a Colab demonstration, call the existing prediction helper with **all required features**:

```python
from src.prediction import predict

example_inputs = {
    "latitude": float(dataset.iloc[0]["latitude"]),
    "longitude": float(dataset.iloc[0]["longitude"]),
    "landcover": int(dataset.iloc[0]["landcover"]),
}
# If `features` contains rainfall/elevation/slope/river_distance/soil,
# provide their actual measured values here too. Do not guess them.
result = predict(bundle["pipeline"], example_inputs, bundle["features"])
print(result)
```

For a website/backend, package the trusted joblib bundle with the application, load it once when the service starts, validate the request against `bundle["features"]`, and call `src.prediction.predict`. Implement and test a separate API layer before deployment. Current code does not fetch WorldCover or environmental values from coordinates; the requester must supply measured features. This is geographic susceptibility only, not current-day flood prediction.

## 13. Optional processed data and metrics exports

```python
dataset.to_csv(ARTIFACTS / "processed_dataset.csv", index=False)
metrics.drop(columns=["confusion_matrix"], errors="ignore").to_csv(
    ARTIFACTS / "model_comparison.csv", index=False
)
print("Saved outputs to", ARTIFACTS)
```

## Common beginner questions

- **Where do datasets come from?** They are not included. Obtain an event-specific GFD export and relevant WorldCover tile, or prepare a label-provenance CSV.
- **Can Colab create current-day forecasts?** No. This project has no real-time inputs or forecasting workflow. Current-day assessment needs time-dependent rainfall, water-level, event and other relevant inputs plus temporal validation.
- **Why do results vary?** Different events, areas, labels, class balance, raster bands, spatial splits, package versions and random seeds change the metrics.
- **Can I publish a score from a quick demo?** Only report the actual run, its dataset provenance and its validation split. Do not present it as universal accuracy or an official warning.
