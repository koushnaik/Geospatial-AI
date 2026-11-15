"""
SQLite Database interface for GeoFlood AI.
Manages prediction history, model metadata, and application settings.
"""

import os
import sqlite3
import json
import uuid
from datetime import datetime

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../reports/geoflood.db"))

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        prediction_id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        mode TEXT NOT NULL,
        gauge_id TEXT,
        station_name TEXT,
        inputs_json TEXT NOT NULL,
        best_model TEXT NOT NULL,
        predicted_class TEXT NOT NULL,
        predicted_class_id INTEGER NOT NULL,
        confidence REAL NOT NULL,
        agreement_count INTEGER NOT NULL,
        total_models INTEGER NOT NULL,
        all_predictions_json TEXT NOT NULL,
        explanation_json TEXT NOT NULL
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)
    conn.commit()
    conn.close()

def save_prediction(record):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO predictions (
        prediction_id, timestamp, mode, gauge_id, station_name,
        inputs_json, best_model, predicted_class, predicted_class_id,
        confidence, agreement_count, total_models,
        all_predictions_json, explanation_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record["prediction_id"],
        record["timestamp"],
        record["mode"],
        record.get("gauge_id"),
        record.get("station_name"),
        json.dumps(record["inputs"]),
        record["best_model"],
        record["predicted_class"],
        record["predicted_class_id"],
        record["confidence"],
        record["agreement_count"],
        record["total_models"],
        json.dumps(record["all_predictions"]),
        json.dumps(record["explanation"])
    ))
    conn.commit()
    conn.close()

def get_prediction_by_id(prediction_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM predictions WHERE prediction_id = ?", (prediction_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    tot = row["total_models"]
    agr = row["agreement_count"]
    pct = round((agr / tot) * 100.0, 1) if tot > 0 else 0.0
    return {
        "prediction_id": row["prediction_id"],
        "timestamp": row["timestamp"],
        "mode": row["mode"],
        "gauge_id": row["gauge_id"],
        "station_name": row["station_name"],
        "inputs": json.loads(row["inputs_json"]),
        "best_model": row["best_model"],
        "predicted_class": row["predicted_class"],
        "predicted_class_id": row["predicted_class_id"],
        "confidence": row["confidence"],
        "agreement_count": agr,
        "total_models": tot,
        "agreement_percentage": pct,
        "all_predictions": json.loads(row["all_predictions_json"]),
        "explanation": json.loads(row["explanation_json"])
    }

def get_recent_predictions(limit=50):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM predictions ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    results = []
    for row in rows:
        results.append({
            "prediction_id": row["prediction_id"],
            "timestamp": row["timestamp"],
            "mode": row["mode"],
            "station_name": row["station_name"],
            "best_model": row["best_model"],
            "predicted_class": row["predicted_class"],
            "confidence": row["confidence"],
            "agreement_count": row["agreement_count"]
        })
    return results

init_db()
