# Next Steps

## Frontend completed in current checkout

- Forest-green React/Vite application with Overview, Analyze Image, Flood Map, Analysis History, Reports, and Settings.
- Local image preview and PNG/JPG/JPEG/TIFF extension/size checks.
- No inference simulation, invented map coordinates, seeded analysis records, or fake model metrics.
- Persistent theme and area-unit preferences.
- PDF report generation that explicitly marks unavailable model and geospatial outputs.
- History supports search/status filtering and confirmed deletion; it remains empty until successful real analysis records can be persisted.

## Blocked on backend/data

1. Define a segmentation inference API and connect it to an actual model artifact.
2. Confirm whether the user-provided image/mask corpus exists; add a manifest, six-class mapping, location split, and provenance.
3. Implement and validate RGB preprocessing and inference output/mask georeferencing.
4. Calculate affected area only from a valid mask plus CRS/pixel-area information.
5. Persist successful analysis records and expose history list/detail/delete routes.
6. Provide real model and dataset metadata for Overview and reports.
7. Integrate an actual GIS view only after georeferenced outputs exist.

## Python research pipeline

Separately resolve the documented raster mask, permanent-water, and land-cover support limitations; validate the binary tabular pipeline on real observed event data; preserve split metadata, checkpoints, and logs. Do not describe it as the six-class image segmentation model.

## Verification outstanding

- Frontend production build and local UI checks.
- API tests are unavailable because there is no API.
- Backend training/inference, real mask outputs, area calculations, and GIS rendering await validated data/services.
