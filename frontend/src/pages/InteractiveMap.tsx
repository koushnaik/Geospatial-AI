import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  GeoJSON
} from 'react-leaflet';
import {
  MapPin,
  Filter,
  Layers,
  Info,
  Waves,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Compass
} from 'lucide-react';
import { getGauges, getStates, getBasins, getCatchmentGeoJSON } from '../services/api';
import { GaugeStation } from '../types';

export const InteractiveMap: React.FC = () => {
  const navigate = useNavigate();
  const [gauges, setGauges] = useState<GaugeStation[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [basins, setBasins] = useState<string[]>([]);

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedBasin, setSelectedBasin] = useState<string>('');
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<'all' | 'low' | 'moderate' | 'high'>('all');
  const [loading, setLoading] = useState(true);

  // Tile layer configuration
  const mapboxToken = (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN || '';
  const [baseLayer, setBaseLayer] = useState<'carto_light' | 'osm' | 'mapbox_light' | 'mapbox_sat'>(
    'carto_light'
  );

  // Active catchment shapefile GeoJSON
  const [activeGeoJSON, setActiveGeoJSON] = useState<any>(null);
  const [activeGeoJSONGauge, setActiveGeoJSONGauge] = useState<string | null>(null);
  const [loadingPolygon, setLoadingPolygon] = useState(false);

  useEffect(() => {
    Promise.all([getGauges(), getStates(), getBasins()])
      .then(([gRes, sRes, bRes]) => {
        setGauges(gRes);
        setStates(sRes);
        setBasins(bRes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleFilterChange = (stateVal: string, basinVal: string) => {
    setSelectedState(stateVal);
    setSelectedBasin(basinVal);
    getGauges({ state: stateVal || undefined, basin: basinVal || undefined })
      .then((res) => setGauges(res))
      .catch((err) => console.error(err));
  };

  const handleLoadCatchment = async (gaugeId: string) => {
    setLoadingPolygon(true);
    try {
      const geojson = await getCatchmentGeoJSON(gaugeId);
      setActiveGeoJSON(geojson);
      setActiveGeoJSONGauge(gaugeId);
    } catch (err) {
      console.error('Failed to load catchment boundary:', err);
    } finally {
      setLoadingPolygon(false);
    }
  };

  const getColor = (rate: number) => {
    if (rate > 0.5) return '#ef4444'; // Red (High Severe)
    if (rate > 0.25) return '#f59e0b'; // Amber (Moderate)
    return '#10b981'; // Green (Low Severe)
  };

  // Filter gauges by risk category locally
  const filteredGauges = gauges.filter((g) => {
    if (selectedRiskCategory === 'low') return g.severe_flood_rate < 0.25;
    if (selectedRiskCategory === 'moderate') return g.severe_flood_rate >= 0.25 && g.severe_flood_rate <= 0.5;
    if (selectedRiskCategory === 'high') return g.severe_flood_rate > 0.5;
    return true;
  });

  // Determine active tile layer configuration
  const getTileConfig = () => {
    if (baseLayer === 'osm') {
      return {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      };
    }
    if (baseLayer === 'mapbox_light' && mapboxToken) {
      return {
        url: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
        attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; OpenStreetMap'
      };
    }
    if (baseLayer === 'mapbox_sat' && mapboxToken) {
      return {
        url: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
        attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; OpenStreetMap'
      };
    }
    // Default: CartoDB Positron (Light)
    return {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CartoDB</a> Positron'
    };
  };

  const tileConfig = getTileConfig();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-2">
            <MapPin className="w-4 h-4" />
            Geospatial Network
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Interactive Gauge Station Map
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Spatial distribution of 155 Central Water Commission (CWC) gauging stations across India. Click any marker to view historical flood statistics, navigate to assessment, or render its verified catchment polygon boundary.
          </p>
        </div>

        {/* Legend */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-700 font-medium">&lt;25% Severe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-700 font-medium">25–50%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-700 font-medium">&gt;50% Severe</span>
          </div>
        </div>
      </div>

      {/* Filter and Layer Control Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Filter Markers:
          </span>

          <select
            value={selectedState}
            onChange={(e) => handleFilterChange(e.target.value, selectedBasin)}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All States ({states.length})</option>
            {states.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          <select
            value={selectedBasin}
            onChange={(e) => handleFilterChange(selectedState, e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Basins ({basins.length})</option>
            {basins.map((bs) => (
              <option key={bs} value={bs}>{bs}</option>
            ))}
          </select>

          {/* Risk Category Filter */}
          <select
            value={selectedRiskCategory}
            onChange={(e) => setSelectedRiskCategory(e.target.value as any)}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Severe Rates</option>
            <option value="low">Low Severe (&lt;25%)</option>
            <option value="moderate">Moderate (25–50%)</option>
            <option value="high">High Severe (&gt;50%)</option>
          </select>

          {(selectedState || selectedBasin || selectedRiskCategory !== 'all') && (
            <button
              onClick={() => {
                setSelectedRiskCategory('all');
                handleFilterChange('', '');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium ml-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        {/* Tile Layer Selector */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Base Map:
          </span>
          <select
            value={baseLayer}
            onChange={(e) => setBaseLayer(e.target.value as any)}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="carto_light">CartoDB Positron (Light)</option>
            <option value="osm">OpenStreetMap Standard</option>
            {mapboxToken && (
              <>
                <option value="mapbox_light">Mapbox Light</option>
                <option value="mapbox_sat">Mapbox Satellite</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Map Viewport Card */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-[580px] bg-slate-50 relative">
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-semibold text-slate-600">Loading geospatial stations...</span>
            </div>
          </div>
        )}

        <MapContainer
          center={[22.5, 79.5]}
          zoom={5}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            key={baseLayer}
            attribution={tileConfig.attribution}
            url={tileConfig.url}
          />

          {/* Render active catchment polygon boundary if loaded */}
          {activeGeoJSON && (
            <GeoJSON
              key={activeGeoJSONGauge || 'active'}
              data={activeGeoJSON}
              style={{
                color: '#2563eb',
                weight: 2,
                fillColor: '#3b82f6',
                fillOpacity: 0.2
              }}
            />
          )}

          {/* Render real gauge circle markers */}
          {filteredGauges.map((g) => {
            const color = getColor(g.severe_flood_rate);
            return (
              <CircleMarker
                key={g.gauge_id}
                center={[g.latitude, g.longitude]}
                radius={7}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.9,
                  color: '#ffffff',
                  weight: 1.5
                }}
              >
                <Popup className="font-sans text-xs">
                  <div className="space-y-2 p-1 text-slate-800 min-w-[210px]">
                    <div className="border-b border-slate-200 pb-1.5">
                      <div className="font-bold text-slate-900 text-sm">{g.station}</div>
                      <div className="text-[10px] text-blue-600 font-mono font-medium">{g.gauge_id}</div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div>River: <strong className="text-slate-900">{g.river}</strong></div>
                      <div>Basin: <strong className="text-slate-900">{g.basin}</strong></div>
                      <div>State: <strong className="text-slate-900">{g.state}</strong></div>
                      <div>Coordinates: <strong className="font-mono text-blue-600">{g.latitude.toFixed(2)}°N, {g.longitude.toFixed(2)}°E</strong></div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] flex justify-between items-center">
                      <div>
                        <span className="text-slate-500 block">Total Events</span>
                        <strong className="text-slate-900 font-mono text-xs">{g.total_events}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Severe Events</span>
                        <strong className="text-rose-600 font-mono text-xs">{g.severe_flood_count}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Severe Rate</span>
                        <strong className="font-mono text-xs" style={{ color }}>
                          {(g.severe_flood_rate * 100).toFixed(1)}%
                        </strong>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleLoadCatchment(g.gauge_id)}
                        className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-200 transition"
                      >
                        {loadingPolygon && activeGeoJSONGauge === g.gauge_id ? 'Loading...' : 'Show Boundary'}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/predict')}
                        className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold transition"
                      >
                        Assess Severity
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Methodology Disclaimer */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-900">Spatial Attribution Disclaimer:</strong> Coordinates and catchment boundaries represent verified streamflow monitoring gauge stations established by the Central Water Commission (CWC). A gauge-level prediction reflects hydrological severity at that catchment's outlet and should not be extrapolated uniformly to entire upstream terrain without local hydraulic modeling.
        </p>
      </div>
    </div>
  );
};
