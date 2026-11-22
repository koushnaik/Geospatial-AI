#!/bin/bash
# ==============================================================================
# GeoFlood AI: Machine Learning-Based Flood Severity Prediction System
# Master Launcher Script for macOS (Apple Silicon M4 Optimized)
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

VENV_DIR="$PROJECT_DIR/venv"
PYTHON_BIN="$VENV_DIR/bin/python"

if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment at $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
    "$VENV_DIR/bin/pip" install --upgrade pip
    "$VENV_DIR/bin/pip" install -r "$PROJECT_DIR/backend/requirements.txt"
fi

export PYTHONPATH="$PROJECT_DIR:$PYTHONPATH"

# Check if models are trained
if [ ! -f "$PROJECT_DIR/models/xgboost.joblib" ]; then
    echo "Models not found. Training all 5 algorithms on INDOFLOODS dataset..."
    "$PYTHON_BIN" "$PROJECT_DIR/train_models.py"
fi

# Check if frontend is built
if [ ! -d "$PROJECT_DIR/frontend/dist" ]; then
    echo "Frontend build not found. Building React production bundle..."
    cd "$PROJECT_DIR/frontend"
    npm install
    npm run build
    cd "$PROJECT_DIR"
fi

# Choose available port
PORT=${PORT:-8000}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Notice: Port $PORT is occupied. Using port 8080 instead."
    PORT=8080
fi

echo "======================================================================"
echo "  GeoFlood AI Application is running!"
echo "  Local Web Application: http://127.0.0.1:$PORT"
echo "  API Documentation:    http://127.0.0.1:$PORT/docs"
echo "======================================================================"
echo "Press Ctrl+C to stop the server."
echo ""

exec "$PYTHON_BIN" -m uvicorn backend.app.main:app --host 127.0.0.1 --port "$PORT"
