"""
Location & Spatial Service for GeoFlood AI.
Serves 155 real gauge locations, baseline catchment characteristics,
and extracts catchment shapefile polygon boundaries.
"""

import os
import json
import shapefile

class LocationService:
    _instance = None
    
    def __init__(self, base_dir=None):
        if base_dir is None:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
        self.base_dir = base_dir
        self.json_path = os.path.join(base_dir, "datasets", "processed", "gauges_metadata.json")
        self.shapefiles_dir = os.path.join(base_dir, "datasets", "raw", "catchments_shapefiles_indofloods")
        
        with open(self.json_path, "r") as f:
            self.gauges = json.load(f)
            
    @classmethod
    def get_instance(cls, base_dir=None):
        if cls._instance is None:
            cls._instance = LocationService(base_dir)
        return cls._instance

    def get_all_gauges(self, state=None, basin=None):
        results = []
        for g_id, g in self.gauges.items():
            if state and g["state"].lower() != state.lower():
                continue
            if basin and g["basin"].lower() != basin.lower():
                continue
            results.append({
                "gauge_id": g["gauge_id"],
                "station": g["station"],
                "river": g["river"],
                "basin": g["basin"],
                "state": g["state"],
                "latitude": g["latitude"],
                "longitude": g["longitude"],
                "total_events": g["total_events"],
                "flood_count": g["flood_count"],
                "severe_flood_count": g["severe_flood_count"],
                "severe_flood_rate": g["severe_flood_rate"]
            })
        return sorted(results, key=lambda x: x["station"])

    def get_gauge_by_id(self, gauge_id: str):
        return self.gauges.get(gauge_id)

    def get_states(self):
        states = set(g["state"] for g in self.gauges.values())
        return sorted(list(states))

    def get_basins(self):
        basins = set(g["basin"] for g in self.gauges.values())
        return sorted(list(basins))

    def get_catchment_geojson(self, gauge_id: str):
        shp_path = os.path.join(self.shapefiles_dir, f"{gauge_id}.shp")
        if not os.path.exists(shp_path):
            return None
        try:
            sf = shapefile.Reader(shp_path)
            shape = sf.shapes()[0]
            # Convert points to [lat, lng] or GeoJSON [lng, lat]
            # GeoJSON coordinates format: [ [ [lng, lat], ... ] ]
            points = shape.points
            # Downsample if too dense (e.g. max 500 points for smooth Leaflet rendering)
            step = max(1, len(points) // 300)
            coords = [[pt[0], pt[1]] for pt in points[::step]]
            if coords[0] != coords[-1]:
                coords.append(coords[0])
                
            geojson = {
                "type": "Feature",
                "properties": {
                    "gauge_id": gauge_id,
                    "bbox": list(shape.bbox)
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coords]
                }
            }
            return geojson
        except Exception as e:
            print(f"Error parsing shapefile for {gauge_id}: {e}")
            return None
