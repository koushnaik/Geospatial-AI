"""Land-cover feature extraction and raster alignment helpers."""
import numpy as np
import pandas as pd

WORLD_COVER = {10:"tree_cover",20:"shrubland",30:"grassland",40:"cropland",50:"built_up",
               60:"bare_sparse",70:"snow_ice",80:"permanent_water",90:"herbaceous_wetland",
               95:"mangroves",100:"moss_lichen"}
VEGETATION = {10,20,30,40,90,95,100}

def add_cover_features(df):
    out = df.copy()
    code = pd.to_numeric(out.landcover, errors="coerce")
    if code.isna().any():
        raise ValueError("Land-cover values must be valid numeric WorldCover class codes")
    valid = set(code.unique())
    unknown = valid - set(WORLD_COVER)
    if unknown: raise ValueError(f"Unknown WorldCover class code(s): {sorted(unknown)}")
    out["landcover"] = code.astype(int)
    out["built_up_pct"] = (code == 50).astype(float) * 100
    out["vegetation_pct"] = code.isin(VEGETATION).astype(float) * 100
    out["water_pct"] = (code == 80).astype(float) * 100
    out["cropland_pct"] = (code == 40).astype(float) * 100
    for cls, name in WORLD_COVER.items():
        out[f"lc_{name}"] = (code == cls).astype(float)
    return out

def sample_cover(world_ds, xs, ys):
    """Sample WorldCover at WGS84 coordinates; outside/NoData remains missing."""
    from rasterio.warp import transform
    tx, ty = transform("EPSG:4326", world_ds.crs, list(xs), list(ys))
    samples = world_ds.sample(zip(tx, ty), indexes=1, masked=True)
    vals = np.array([np.nan if np.ma.is_masked(v[0]) else float(v[0]) for v in samples], dtype=float)
    if world_ds.nodata is not None:
        vals[vals == world_ds.nodata] = np.nan
    return vals

def raster_event_samples(flood_ds, world_ds, flood_band=1, clear_band=None, positive_value=1, max_samples=100000):
    """Extract samples only inside flood raster's valid footprint and clear-observed negatives."""
    if clear_band is None:
        raise ValueError("A clear-observation band is required so zero-flood pixels are not assumed to be observed negatives")
    f = flood_ds.read(flood_band, masked=True)
    fdata = f.astype("float32").filled(np.nan)
    valid = ~np.ma.getmaskarray(f) & np.isfinite(fdata)
    labels = (fdata == float(positive_value))
    if clear_band:
        if clear_band > flood_ds.count: raise ValueError("Clear band index exceeds raster band count")
        clear = flood_ds.read(clear_band, masked=True)
        clear_data = clear.astype("float32").filled(0)
        valid &= ~np.ma.getmaskarray(clear) & (clear_data > 0)
    valid &= np.isfinite(fdata)
    rows, cols = np.where(valid)
    if len(rows) == 0: raise ValueError("No observed flood pixels found; check band indexes and nodata mask")
    if len(rows) > max_samples:
        rng = np.random.default_rng(42)
        # Preserve class representation while bounding memory and training time.
        idx = np.arange(len(rows))
        pos = idx[labels[rows, cols]]; neg = idx[~labels[rows, cols]]
        take = min(max_samples // 2, len(pos)); take_n = max_samples - take
        selected = np.concatenate([rng.choice(pos, take, replace=False) if take else np.array([], int),
                                   rng.choice(neg, min(take_n, len(neg)), replace=False) if len(neg) else np.array([], int)])
        if len(selected) < max_samples and len(pos) > take:
            selected = np.concatenate([selected, rng.choice(np.setdiff1d(pos, selected), min(max_samples-len(selected), len(pos)-take), replace=False)])
        if not len(selected): selected = rng.choice(idx, max_samples, replace=False)
        rows = rows[selected]; cols = cols[selected]
    vals = fdata[rows, cols]
    x, y = rasterio_xy(flood_ds, rows, cols)
    import rasterio.warp
    lon, lat = rasterio.warp.transform(flood_ds.crs, "EPSG:4326", x, y)
    cover = sample_cover(world_ds, lon, lat)
    keep = np.isfinite(cover) & np.isin(cover, list(WORLD_COVER))
    if not keep.any(): raise ValueError("No overlap between observed GFD pixels and valid WorldCover cells")
    out = pd.DataFrame({"latitude": np.asarray(lat)[keep], "longitude": np.asarray(lon)[keep],
                        "landcover": cover[keep].astype(int), "flood_label": (vals == float(positive_value)).astype(int)[keep],
                        "coverage_observed": True})
    return out.drop_duplicates(["latitude", "longitude", "flood_label"])

def rasterio_xy(ds, rows, cols):
    from rasterio.transform import xy
    x, y = xy(ds.transform, rows, cols, offset="center")
    return list(x), list(y)
