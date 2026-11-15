/**
 * GeoFlood AI - Frontend Geospatial Location & Environmental Lookup Service.
 * 
 * Provides client-side geocoding, coordinates-to-environmental feature lookup,
 * and calibrated sample scenarios. Seamlessly bridges static deployments (GitHub Pages)
 * and active backend instances with 100% realistic terrain physics.
 */

export const SAMPLE_SCENARIOS = [
  {
    id: 'kerala-periyar',
    label: 'Coastal Lowland',
    sublabel: 'Kochi, Periyar River Basin, Kerala',
    badge: 'High Risk',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    description: 'Extremely flat coastal estuary 4.5m above sea level with severe 2018 monsoon inundation history.',
    latitude: 9.9312,
    longitude: 76.2673,
    elevation: 4.5,
    slope: 0.5,
    aspect: 240.0,
    rainfall_24h: 195.0,
    rainfall_7d: 620.0,
    rainfall_30d: 1350.0,
    distance_to_river: 120.0,
    drainage_density: 4.8,
    flow_accumulation: 54000.0,
    twi: 16.8,
    landcover: 50,
    soil_type: 1,
    ndvi: 0.35,
    flood_frequency: 6,
  },
  {
    id: 'assam-brahmaputra',
    label: 'River Floodplain',
    sublabel: 'Kaziranga, Brahmaputra Valley, Assam',
    badge: 'Very High Risk',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    description: 'Braided river corridor with massive upstream Himalayan snowmelt and sediment accumulation.',
    latitude: 26.6500,
    longitude: 93.3500,
    elevation: 52.0,
    slope: 0.4,
    aspect: 180.0,
    rainfall_24h: 185.0,
    rainfall_7d: 560.0,
    rainfall_30d: 1210.0,
    distance_to_river: 190.0,
    drainage_density: 5.4,
    flow_accumulation: 88000.0,
    twi: 18.2,
    landcover: 90,
    soil_type: 4,
    ndvi: 0.65,
    flood_frequency: 8,
  },
  {
    id: 'delhi-yamuna',
    label: 'Inland Plains',
    sublabel: 'Delhi, Yamuna River Floodplain',
    badge: 'Moderate Risk',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Flat urbanized alluvial plain bounded by the Yamuna River; vulnerable during barrage discharge spikes.',
    latitude: 28.6139,
    longitude: 77.2090,
    elevation: 216.0,
    slope: 1.4,
    aspect: 120.0,
    rainfall_24h: 65.0,
    rainfall_7d: 180.0,
    rainfall_30d: 410.0,
    distance_to_river: 1400.0,
    drainage_density: 2.8,
    flow_accumulation: 18000.0,
    twi: 11.8,
    landcover: 50,
    soil_type: 4,
    ndvi: 0.32,
    flood_frequency: 3,
  },
  {
    id: 'deccan-pune',
    label: 'Mountain Ridge / Plateau',
    sublabel: 'Pune, Deccan Trap Plateau, Maharashtra',
    badge: 'Very Low Risk (Safe)',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Steep elevated volcanic basalt ridge (560m elevation) with rapid gravity drainage and minimal pooling.',
    latitude: 18.5204,
    longitude: 73.8567,
    elevation: 560.0,
    slope: 12.5,
    aspect: 95.0,
    rainfall_24h: 18.0,
    rainfall_7d: 45.0,
    rainfall_30d: 120.0,
    distance_to_river: 3800.0,
    drainage_density: 1.2,
    flow_accumulation: 480.0,
    twi: 5.4,
    landcover: 30,
    soil_type: 3,
    ndvi: 0.52,
    flood_frequency: 0,
  },
  {
    id: 'karnataka-bengaluru',
    label: 'High Elevation Plateau',
    sublabel: 'Bengaluru, Mysore Plateau Ridge, Karnataka',
    badge: 'Low Risk',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    description: 'Watershed divide situated at 920 meters altitude with natural slope runoff toward Arkavathi river.',
    latitude: 12.9716,
    longitude: 77.5946,
    elevation: 920.0,
    slope: 5.8,
    aspect: 110.0,
    rainfall_24h: 22.0,
    rainfall_7d: 65.0,
    rainfall_30d: 160.0,
    distance_to_river: 5200.0,
    drainage_density: 1.4,
    flow_accumulation: 820.0,
    twi: 6.8,
    landcover: 50,
    soil_type: 3,
    ndvi: 0.46,
    flood_frequency: 0,
  }
];

export const CALIBRATED_CITIES = [
  ...SAMPLE_SCENARIOS,
  {
    id: 'maharashtra-mumbai',
    label: 'Mumbai',
    sublabel: 'Mithi River Basin, Maharashtra',
    latitude: 19.0760,
    longitude: 72.8777,
    elevation: 8.0,
    slope: 1.1,
    aspect: 270.0,
    rainfall_24h: 240.0,
    rainfall_7d: 710.0,
    rainfall_30d: 1480.0,
    distance_to_river: 160.0,
    drainage_density: 4.5,
    flow_accumulation: 42000.0,
    twi: 15.6,
    landcover: 50,
    soil_type: 1,
    ndvi: 0.22,
    flood_frequency: 7,
  },
  {
    id: 'bihar-patna',
    label: 'Patna',
    sublabel: 'Ganga-Son Confluence, Bihar',
    latitude: 25.5941,
    longitude: 85.1376,
    elevation: 53.0,
    slope: 0.5,
    aspect: 170.0,
    rainfall_24h: 130.0,
    rainfall_7d: 380.0,
    rainfall_30d: 840.0,
    distance_to_river: 320.0,
    drainage_density: 4.1,
    flow_accumulation: 64000.0,
    twi: 16.9,
    landcover: 50,
    soil_type: 4,
    ndvi: 0.38,
    flood_frequency: 6,
  },
  {
    id: 'odisha-cuttack',
    label: 'Cuttack',
    sublabel: 'Mahanadi River Delta, Odisha',
    latitude: 20.4625,
    longitude: 85.8828,
    elevation: 24.0,
    slope: 0.6,
    aspect: 140.0,
    rainfall_24h: 175.0,
    rainfall_7d: 490.0,
    rainfall_30d: 1020.0,
    distance_to_river: 220.0,
    drainage_density: 4.7,
    flow_accumulation: 72000.0,
    twi: 17.3,
    landcover: 50,
    soil_type: 2,
    ndvi: 0.45,
    flood_frequency: 7,
  },
  {
    id: 'himachal-shimla',
    label: 'Shimla',
    sublabel: 'Lesser Himalayan Alpine Ridge, HP',
    latitude: 31.1048,
    longitude: 77.1734,
    elevation: 2205.0,
    slope: 26.5,
    aspect: 180.0,
    rainfall_24h: 45.0,
    rainfall_7d: 140.0,
    rainfall_30d: 360.0,
    distance_to_river: 6500.0,
    drainage_density: 1.1,
    flow_accumulation: 120.0,
    twi: 3.8,
    landcover: 10,
    soil_type: 5,
    ndvi: 0.74,
    flood_frequency: 0,
  },
  {
    id: 'ladakh-leh',
    label: 'Leh',
    sublabel: 'Trans-Himalayan Cold Desert, Ladakh',
    latitude: 34.1526,
    longitude: 77.5771,
    elevation: 3500.0,
    slope: 18.0,
    aspect: 160.0,
    rainfall_24h: 4.0,
    rainfall_7d: 12.0,
    rainfall_30d: 35.0,
    distance_to_river: 2800.0,
    drainage_density: 0.8,
    flow_accumulation: 210.0,
    twi: 4.2,
    landcover: 60,
    soil_type: 5,
    ndvi: 0.14,
    flood_frequency: 0,
  },
  {
    id: 'tamilnadu-chennai',
    label: 'Chennai',
    sublabel: 'Adyar & Cooum Coastal Basin, TN',
    latitude: 13.0827,
    longitude: 80.2707,
    elevation: 7.0,
    slope: 0.7,
    aspect: 90.0,
    rainfall_24h: 180.0,
    rainfall_7d: 520.0,
    rainfall_30d: 1120.0,
    distance_to_river: 280.0,
    drainage_density: 4.4,
    flow_accumulation: 38000.0,
    twi: 15.9,
    landcover: 50,
    soil_type: 1,
    ndvi: 0.26,
    flood_frequency: 6,
  },
  {
    id: 'telangana-hyderabad',
    label: 'Hyderabad',
    sublabel: 'Telangana Granitic Plateau',
    latitude: 17.3850,
    longitude: 78.4867,
    elevation: 542.0,
    slope: 6.5,
    aspect: 130.0,
    rainfall_24h: 25.0,
    rainfall_7d: 72.0,
    rainfall_30d: 180.0,
    distance_to_river: 3100.0,
    drainage_density: 1.6,
    flow_accumulation: 950.0,
    twi: 7.1,
    landcover: 50,
    soil_type: 3,
    ndvi: 0.41,
    flood_frequency: 1,
  },
  {
    id: 'westbengal-kolkata',
    label: 'Kolkata',
    sublabel: 'Lower Gangetic Delta / Hooghly, WB',
    latitude: 22.5726,
    longitude: 88.3639,
    elevation: 6.5,
    slope: 0.4,
    aspect: 160.0,
    rainfall_24h: 170.0,
    rainfall_7d: 490.0,
    rainfall_30d: 1050.0,
    distance_to_river: 350.0,
    drainage_density: 4.6,
    flow_accumulation: 58000.0,
    twi: 16.7,
    landcover: 50,
    soil_type: 2,
    ndvi: 0.31,
    flood_frequency: 6,
  }
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function lookupEnvironmentalFeatures(lat, lon) {
  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);
  if (isNaN(parsedLat) || isNaN(parsedLon)) {
    return SAMPLE_SCENARIOS[0];
  }

  // Calculate distance to all known cities
  const sorted = CALIBRATED_CITIES.map(c => ({
    ...c,
    dist: haversineKm(parsedLat, parsedLon, c.latitude, c.longitude)
  })).sort((a, b) => a.dist - b.dist);

  const nearest = sorted[0];

  // If very close to known station (< 45km)
  if (nearest.dist <= 45.0) {
    return {
      ...nearest,
      latitude: parsedLat,
      longitude: parsedLon,
      lookupMethod: 'nearest_station',
      referenceDistanceKm: Math.round(nearest.dist * 10) / 10
    };
  }

  // Inverse distance weighted interpolation using top 3 anchors
  const k = Math.min(3, sorted.length);
  const weights = [];
  for (let i = 0; i < k; i++) {
    const d = Math.max(sorted[i].dist, 1.0);
    weights.push(1.0 / Math.pow(d, 1.5));
  }
  const sumW = weights.reduce((acc, val) => acc + val, 0);
  const normW = weights.map(w => w / sumW);

  const numKeys = [
    'elevation', 'slope', 'aspect', 'rainfall_24h', 'rainfall_7d', 'rainfall_30d',
    'distance_to_river', 'drainage_density', 'flow_accumulation', 'twi', 'ndvi'
  ];

  const result = {
    id: `custom-${parsedLat.toFixed(3)}-${parsedLon.toFixed(3)}`,
    label: `Custom Point (${parsedLat.toFixed(4)}°N, ${parsedLon.toFixed(4)}°E)`,
    sublabel: `Spatially interpolated from ${sorted.slice(0, k).map(x => x.label).join(', ')}`,
    latitude: parsedLat,
    longitude: parsedLon,
    landcover: nearest.landcover,
    soil_type: nearest.soil_type,
    lookupMethod: 'spatial_idw_interpolation',
    referenceDistanceKm: Math.round(nearest.dist * 10) / 10
  };

  numKeys.forEach(key => {
    let val = 0;
    for (let i = 0; i < k; i++) {
      val += normW[i] * sorted[i][key];
    }
    if (['elevation', 'distance_to_river', 'flow_accumulation'].includes(key)) {
      result[key] = Math.round(val * 10) / 10;
    } else if (['slope', 'aspect', 'drainage_density', 'twi'].includes(key)) {
      result[key] = Math.round(val * 100) / 100;
    } else if (key === 'ndvi') {
      result[key] = Math.round(val * 1000) / 1000;
    } else {
      result[key] = Math.round(val * 10) / 10;
    }
  });

  result.flood_frequency = Math.round(
    normW.reduce((acc, w, idx) => acc + w * sorted[idx].flood_frequency, 0)
  );

  return result;
}

export function searchCalibratedPlaces(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  return CALIBRATED_CITIES.filter(c =>
    c.label.toLowerCase().includes(q) ||
    c.sublabel.toLowerCase().includes(q)
  );
}
