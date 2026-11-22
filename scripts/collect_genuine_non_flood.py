"""
Collect Genuine Non-Flood Meteorological Observations for GeoFlood AI
Source: Copernicus ERA5-Land Daily Reanalysis via Open-Meteo Historical Archive API
Catchment Characteristics: INDOFLOODS Official Catchment Database (IIT Delhi)
"""

import os
import sys
import time
import json
import urllib.request
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    meta_path = os.path.join(base_dir, "datasets/raw/metadata_indofloods.csv")
    catch_path = os.path.join(base_dir, "datasets/raw/catchment_characteristics_indofloods.csv")
    events_path = os.path.join(base_dir, "datasets/raw/floodevents_indofloods.csv")
    output_path = os.path.join(base_dir, "datasets/processed/genuine_non_flood_observations.csv")

    meta = pd.read_csv(meta_path)
    catch = pd.read_csv(catch_path)
    events = pd.read_csv(events_path)

    # Valid gauges with both metadata and catchment characteristics
    valid_gauges = sorted(list(set(catch['GaugeID']).intersection(set(meta['GaugeID']))))
    print(f"Total stations to collect genuine non-flood observations for: {len(valid_gauges)}")

    # Pre-parse flood intervals per gauge
    events['start_dt'] = pd.to_datetime(events['Start Date'], errors='coerce')
    events['end_dt'] = pd.to_datetime(events['End Date'], errors='coerce')
    gauge_flood_windows = {}
    for gid in valid_gauges:
        g_ev = events[events['EventID'].str.startswith(gid)]
        windows = []
        for _, row in g_ev.iterrows():
            if pd.notna(row['start_dt']) and pd.notna(row['end_dt']):
                windows.append((row['start_dt'] - timedelta(days=15), row['end_dt'] + timedelta(days=15)))
        gauge_flood_windows[gid] = windows

    # We query 2017-01-01 to 2019-12-31 (3 full calendar years = 1095 days)
    start_str = "2017-01-01"
    end_str = "2019-12-31"

    non_flood_records = []
    success_count = 0

    t_start = time.time()
    for idx, gid in enumerate(valid_gauges, 1):
        g_meta = meta[meta['GaugeID'] == gid].iloc[0]
        lat = round(float(g_meta['Latitude']), 4)
        lon = round(float(g_meta['Longitude']), 4)
        station_name = g_meta['Station']

        url = (
            f"https://archive-api.open-meteo.com/v1/archive?"
            f"latitude={lat}&longitude={lon}&start_date={start_str}&end_date={end_str}&daily=precipitation_sum&timezone=auto"
        )

        retries = 3
        data = None
        while retries > 0:
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'GeoFloodAI-Audit/1.0'})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                break
            except Exception as e:
                retries -= 1
                time.sleep(1.0)

        if not data or 'daily' not in data:
            print(f"[{idx}/{len(valid_gauges)}] Warning: Failed to fetch {gid} ({station_name})")
            continue

        dates = data['daily']['time']
        precip = data['daily']['precipitation_sum']

        # Filter out days that fall within any flood window for this gauge
        flood_wins = gauge_flood_windows.get(gid, [])
        valid_indices = []
        for d_idx in range(12, len(dates)):  # need at least 10 prior days
            dt = datetime.strptime(dates[d_idx], "%Y-%m-%d")
            # Check if dt overlaps with any flood window
            is_flood_period = any(w_start <= dt <= w_end for w_start, w_end in flood_wins)
            if not is_flood_period and precip[d_idx] is not None:
                valid_indices.append(d_idx)

        # Pick 18 well-spaced observation dates across seasons
        if len(valid_indices) >= 18:
            step = len(valid_indices) // 18
            sampled_indices = [valid_indices[i * step] for i in range(18)]
        else:
            sampled_indices = valid_indices

        # Extract antecedent rainfall features T1d to T10d
        for s_idx in sampled_indices:
            obs_date = dates[s_idx]
            # Prior 10 days rainfall: t-1 to t-10
            prior_10 = [precip[s_idx - k] if precip[s_idx - k] is not None else 0.0 for k in range(1, 11)]
            cum_rain = np.cumsum(prior_10)

            rec = {
                "EventID": f"{gid}-NF-{obs_date}",
                "GaugeID": gid,
                "target": 0,  # 0: No Flood
                "Flood Type": "No Flood",
                "Observation Date": obs_date,
                "T1d": round(float(cum_rain[0]), 2),
                "T2d": round(float(cum_rain[1]), 2),
                "T3d": round(float(cum_rain[2]), 2),
                "T4d": round(float(cum_rain[3]), 2),
                "T5d": round(float(cum_rain[4]), 2),
                "T6d": round(float(cum_rain[5]), 2),
                "T7d": round(float(cum_rain[6]), 2),
                "T8d": round(float(cum_rain[7]), 2),
                "T9d": round(float(cum_rain[8]), 2),
                "T10d": round(float(cum_rain[9]), 2)
            }
            non_flood_records.append(rec)

        success_count += 1
        if idx % 25 == 0 or idx == len(valid_gauges):
            print(f"[{idx}/{len(valid_gauges)}] Processed {gid} ({station_name}) - Total NF samples: {len(non_flood_records)} ({time.time()-t_start:.1f}s)")
        
        # Courteous pacing for API
        time.sleep(0.1)

    df_nf = pd.DataFrame(non_flood_records)
    print(f"\nCompleted collection: {len(df_nf)} genuine non-flood observations across {success_count} stations.")
    
    # Save to disk
    df_nf.to_csv(output_path, index=False)
    print(f"Saved genuine non-flood observations to: {output_path}")

if __name__ == "__main__":
    main()
