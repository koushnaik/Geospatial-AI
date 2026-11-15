"""Input readers with explicit CRS and schema validation."""
from __future__ import annotations
from pathlib import Path
import io
import pandas as pd

REQUIRED_CSV = {"latitude", "longitude", "flood_label", "landcover"}

def read_points(file) -> pd.DataFrame:
    df = pd.read_csv(file)
    missing = REQUIRED_CSV - set(df.columns)
    if missing:
        raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing))}")
    if "coverage_observed" in df:
        observed = df.coverage_observed.astype(str).str.lower().isin({"1", "true", "yes", "observed"})
        df = df.loc[observed].copy()
    if not set(pd.to_numeric(df.flood_label, errors="coerce").dropna().unique()).issubset({0, 1}):
        raise ValueError("flood_label must contain only 0 and 1")
    df["flood_label"] = pd.to_numeric(df.flood_label, errors="coerce")
    df = df.dropna(subset=["latitude", "longitude", "flood_label", "landcover"])
    if not df.latitude.between(-90, 90).all() or not df.longitude.between(-180, 180).all():
        raise ValueError("Coordinates must be WGS84 latitude/longitude values")
    return df.drop_duplicates(subset=["latitude", "longitude", "flood_label"])

def raster_source(file):
    """Copy uploaded bytes into a MemoryFile; caller must close returned objects."""
    try:
        import rasterio
    except ImportError as exc:
        raise RuntimeError("Raster support requires rasterio; install the project requirements.") from exc
    from rasterio.io import MemoryFile
    data = file.getvalue() if hasattr(file, "getvalue") else file.read()
    mem = MemoryFile(data)
    ds = mem.open()
    if ds.crs is None:
        ds.close(); mem.close()
        raise ValueError("Raster has no CRS. Define its CRS before uploading.")
    return mem, ds

def raster_metadata(ds):
    return {"crs": str(ds.crs), "width": ds.width, "height": ds.height,
            "bands": ds.count, "resolution": tuple(abs(x) for x in ds.res),
            "bounds": tuple(ds.bounds), "nodata": ds.nodata}
