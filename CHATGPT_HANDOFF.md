# GeoFlood AI — ChatGPT Handoff

Continue work in `~/Desktop/aiml`. First read `README.md`, `PROJECT_PROGRESS.md`, `DEVELOPMENT_ROADMAP.md`, `MODEL_TRAINING.md`, `DATASET_DOCUMENTATION.md`, `API_DOCUMENTATION.md`, and `NEXT_STEPS.md`.

## Confirmed architecture

- `frontend/` is a React + Vite app with Overview, Analyze Image, Flood Map, Analysis History, Reports, and Settings. Forest-green visual identity.
- Root `app.py` and `src/` are a separate Python Streamlit research app for binary tabular observed-flood susceptibility. Do not assume it is an image segmentation backend.
- No Express app, HTTP routes, database configuration, image inference API, U-Net definition/checkpoint, training logs, segmentation class map, or source imagery/masks were found in the repository tree.
- The prompt's claims of 40,000 RGB/mask pairs, 100 locations, geographic 70/15/15 split, six classes, and a 7.77M-parameter U-Net are unverified user-provided context, not current repository facts.

## Frontend integrity rules

Do not fabricate model predictions, evaluation metrics, areas, map coordinates, or activity records. Do not invent API route names. The current React image workflow validates file extension/size and previews a local browser image; inference remains unavailable until a real API contract and model exist. The PDF report states unavailable items. Preferences persist in localStorage. History must include only actual successful/failed API responses, never uploads or demo examples.

## Run and verify

```bash
cd ~/Desktop/aiml/frontend
npm install
npm run dev
npm run build
```

The Python research app has its separate requirements and startup instructions in README. The model training code does not train the user-described segmentation network.

## Current next steps

1. Obtain/verify dataset manifest and six-class mask mapping.
2. Define and implement a real inference service and explicit request/response contract.
3. Connect upload, mask visualization, class distribution, actual geospatial area, history persistence, and GIS only against validated outputs.
4. Add API and frontend tests, PDF content tests, and accessibility/responsive review.
5. Independently resolve the Python flood-label/raster limitations documented in the roadmap before scientific evaluation.
