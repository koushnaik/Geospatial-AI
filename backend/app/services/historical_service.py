"""
Historical Flood Analysis Service.
Queries and aggregates authentic INDOFLOODS historical flood records (1965-2020).
"""

import os
import pandas as pd
import numpy as np

class HistoricalService:
    _instance = None
    
    def __init__(self, base_dir=None):
        if base_dir is None:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
        self.base_dir = base_dir
        data_path = os.path.join(base_dir, "datasets", "processed", "indofloods_cleaned_merged.csv")
        self.df = pd.read_csv(data_path)
        if "Start Date" in self.df.columns:
            self.df["Start Date"] = pd.to_datetime(self.df["Start Date"])
            self.df["Year"] = self.df["Start Date"].dt.year
            
    @classmethod
    def get_instance(cls, base_dir=None):
        if cls._instance is None:
            cls._instance = HistoricalService(base_dir)
        return cls._instance

    def get_summary(self):
        total_events = len(self.df)
        total_gauges = self.df["GaugeID"].nunique()
        total_states = self.df["State"].nunique()
        total_basins = self.df["Basin"].nunique()
        
        severe_count = int((self.df["Flood Type"] == "Severe Flood").sum())
        flood_count = int((self.df["Flood Type"] == "Flood").sum())
        
        year_min = int(self.df["Year"].min()) if "Year" in self.df.columns else 1965
        year_max = int(self.df["Year"].max()) if "Year" in self.df.columns else 2020
        
        return {
            "total_events": total_events,
            "total_gauges": total_gauges,
            "total_states": total_states,
            "total_basins": total_basins,
            "year_range": {"min": year_min, "max": year_max},
            "flood_count": flood_count,
            "severe_flood_count": severe_count,
            "severe_flood_percentage": round((severe_count / total_events) * 100.0, 2),
            "flood_percentage": round((flood_count / total_events) * 100.0, 2)
        }

    def get_distribution_data(self, state=None, basin=None, year_min=None, year_max=None):
        sub = self.df.copy()
        if state:
            sub = sub[sub["State"] == state]
        if basin:
            sub = sub[sub["Basin"] == basin]
        if year_min:
            sub = sub[sub["Year"] >= int(year_min)]
        if year_max:
            sub = sub[sub["Year"] <= int(year_max)]
            
        # By Year
        year_dist = []
        if "Year" in sub.columns:
            for yr, grp in sub.groupby("Year"):
                tot = len(grp)
                sev = int((grp["Flood Type"] == "Severe Flood").sum())
                fld = int((grp["Flood Type"] == "Flood").sum())
                year_dist.append({
                    "year": int(yr),
                    "total": tot,
                    "flood": fld,
                    "severe_flood": sev,
                    "severe_rate": round(sev / tot, 3) if tot > 0 else 0
                })
        year_dist = sorted(year_dist, key=lambda x: x["year"])
        
        # By State
        state_dist = []
        for st, grp in sub.groupby("State"):
            tot = len(grp)
            sev = int((grp["Flood Type"] == "Severe Flood").sum())
            fld = int((grp["Flood Type"] == "Flood").sum())
            state_dist.append({
                "state": st,
                "total": tot,
                "flood": fld,
                "severe_flood": sev,
                "severe_rate": round(sev / tot, 3) if tot > 0 else 0
            })
        state_dist = sorted(state_dist, key=lambda x: x["total"], reverse=True)
        
        # By Basin
        basin_dist = []
        for bs, grp in sub.groupby("Basin"):
            tot = len(grp)
            sev = int((grp["Flood Type"] == "Severe Flood").sum())
            fld = int((grp["Flood Type"] == "Flood").sum())
            basin_dist.append({
                "basin": bs,
                "total": tot,
                "flood": fld,
                "severe_flood": sev,
                "severe_rate": round(sev / tot, 3) if tot > 0 else 0
            })
        basin_dist = sorted(basin_dist, key=lambda x: x["total"], reverse=True)
        
        # Rainfall stats (T1d to T10d)
        rainfall_summary = []
        for i in range(1, 11):
            col = f"T{i}d"
            if col in sub.columns:
                rainfall_summary.append({
                    "day": f"T{i}d",
                    "mean": round(float(sub[col].mean()), 1),
                    "median": round(float(sub[col].median()), 1),
                    "p75": round(float(sub[col].quantile(0.75)), 1),
                    "p90": round(float(sub[col].quantile(0.90)), 1),
                    "max": round(float(sub[col].max()), 1),
                })
                
        # Duration distribution (days)
        duration_dist = []
        if "Event Duration (days)" in sub.columns:
            durations = sub["Event Duration (days)"].dropna()
            bins = [0, 2, 5, 10, 20, 50, 100]
            labels = ["1-2 days", "3-5 days", "6-10 days", "11-20 days", "21-50 days", "50+ days"]
            cats = pd.cut(durations, bins=bins, labels=labels)
            counts = cats.value_counts().to_dict()
            for lbl in labels:
                duration_dist.append({
                    "range": lbl,
                    "count": int(counts.get(lbl, 0))
                })

        return {
            "filtered_events_count": len(sub),
            "by_year": year_dist,
            "by_state": state_dist[:15],
            "by_basin": basin_dist[:12],
            "rainfall_trends": rainfall_summary,
            "duration_distribution": duration_dist
        }

    def get_events(self, state=None, basin=None, gauge_id=None, flood_type=None, year=None, limit=100, offset=0):
        sub = self.df.copy()
        if state:
            sub = sub[sub["State"] == state]
        if basin:
            sub = sub[sub["Basin"] == basin]
        if gauge_id:
            sub = sub[sub["GaugeID"] == gauge_id]
        if flood_type:
            sub = sub[sub["Flood Type"] == flood_type]
        if year:
            sub = sub[sub["Year"] == int(year)]
            
        total_matched = len(sub)
        page = sub.iloc[offset:offset+limit]
        
        results = []
        for _, row in page.iterrows():
            results.append({
                "event_id": row["EventID"],
                "gauge_id": row["GaugeID"],
                "station": row["Station"],
                "river": row.get("River", "N/A"),
                "basin": row["Basin"],
                "state": row["State"],
                "start_date": str(row["Start Date"])[:10],
                "end_date": str(row["End Date"])[:10],
                "year": int(row["Year"]) if "Year" in row else None,
                "flood_type": row["Flood Type"],
                "T1d": round(float(row["T1d"]), 1),
                "T3d": round(float(row["T3d"]), 1),
                "T7d": round(float(row["T7d"]), 1),
                "T10d": round(float(row["T10d"]), 1),
                "duration_days": int(row["Event Duration (days)"]) if not pd.isna(row.get("Event Duration (days)")) else None
            })
            
        return {
            "total": total_matched,
            "limit": limit,
            "offset": offset,
            "events": results
        }
