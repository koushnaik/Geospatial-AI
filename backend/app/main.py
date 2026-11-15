"""
GeoFlood AI - Main Integrated FastAPI Application
Serves the REST API and the compiled React production frontend.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from backend.app.api.endpoints import router as api_router
from backend.app.ml.prediction.predictor import ModelManager
from backend.app.database.db import init_db

app = FastAPI(
    title="GeoFlood AI",
    description="Machine Learning-Based Flood Severity Prediction and Analysis System",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Warm up model manager
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
ModelManager.get_instance(base_dir)

# Mount API routes
app.include_router(api_router)

# Mount reports directory for static downloads/images
reports_dir = os.path.join(base_dir, "reports")
if os.path.exists(reports_dir):
    app.mount("/static/reports", StaticFiles(directory=reports_dir), name="reports")

# Mount React production build
frontend_dist = os.path.join(base_dir, "frontend", "dist")

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa_fallback(full_path: str):
        if full_path.startswith("api") or full_path.startswith("static"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
