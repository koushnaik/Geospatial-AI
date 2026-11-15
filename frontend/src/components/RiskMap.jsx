import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, MapPin, Compass } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Fix default marker icon issues in bundled Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RISK_COLORS = {
  'Very Low': '#10B981',   // Emerald Green
  'Low': '#06B6D4',       // Cyan
  'Moderate': '#F59E0B',  // Yellow / Amber
  'High': '#F97316',      // Orange
  'Very High': '#EF4444', // Red
};

export default function RiskMap({
  center = [20.5937, 78.9629],
  zoom = 5,
  points = [],
  selectedPoint = null,
  onSelectCoordinates = null,
  height = '500px',
  interactive = true,
}) {
  const { isDark } = useTheme();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);
  const activeMarker = useRef(null);
  const darkLayerRef = useRef(null);
  const lightLayerRef = useRef(null);
  const [cursorCoords, setCursorCoords] = useState(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: false,
      });

      // Official CARTO API Key
      const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY;
      const keyParam = cartoApiKey ? `?key=${encodeURIComponent(cartoApiKey)}` : '';

      // CartoDB Dark Matter tile (Dark Mode)
      const darkTiles = L.tileLayer(
        `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png${keyParam}`,
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        }
      );
      darkLayerRef.current = darkTiles;

      // CartoDB Voyager tile (Light Mode)
      const lightTiles = L.tileLayer(
        `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${keyParam}`,
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        }
      );
      lightLayerRef.current = lightTiles;

      // Esri World Imagery satellite tile
      const satTiles = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          maxZoom: 18,
        }
      );

      // OpenStreetMap standard street tile
      const osmTiles = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }
      );

      // Add appropriate theme layer on mount
      if (isDark) {
        darkTiles.addTo(map);
      } else {
        lightTiles.addTo(map);
      }

      // Custom Zoom Control at top-left
      L.control.zoom({ position: 'topleft' }).addTo(map);

      // Layer Control at top-right
      L.control.layers(
        {
          'Dark GIS Analytics': darkTiles,
          'Light GIS Vector': lightTiles,
          'Satellite Imagery': satTiles,
          'Street Vector': osmTiles,
        },
        null,
        { position: 'topright' }
      ).addTo(map);

      markersLayer.current = L.layerGroup().addTo(map);

      // Mouse move coordinates listener
      map.on('mousemove', (e) => {
        setCursorCoords({
          lat: e.latlng.lat.toFixed(4),
          lng: e.latlng.lng.toFixed(4),
        });
      });

      // Click listener for coordinate selection
      if (interactive && onSelectCoordinates) {
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          onSelectCoordinates({
            latitude: Number(lat.toFixed(4)),
            longitude: Number(lng.toFixed(4)),
          });
        });
      }

      mapInstance.current = map;
    }

    return () => {
      // Graceful cleanup
    };
  }, []);

  // Seamlessly switch basemap when global theme changes
  useEffect(() => {
    if (!mapInstance.current || !darkLayerRef.current || !lightLayerRef.current) return;
    if (isDark) {
      if (mapInstance.current.hasLayer(lightLayerRef.current)) {
        mapInstance.current.removeLayer(lightLayerRef.current);
      }
      if (!mapInstance.current.hasLayer(darkLayerRef.current)) {
        darkLayerRef.current.addTo(mapInstance.current);
      }
    } else {
      if (mapInstance.current.hasLayer(darkLayerRef.current)) {
        mapInstance.current.removeLayer(darkLayerRef.current);
      }
      if (!mapInstance.current.hasLayer(lightLayerRef.current)) {
        lightLayerRef.current.addTo(mapInstance.current);
      }
    }
  }, [isDark]);

  // Update center when prop changes
  useEffect(() => {
    if (mapInstance.current && center) {
      mapInstance.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

  // Update observation markers
  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;
    markersLayer.current.clearLayers();

    const titleColor = isDark ? '#FFFFFF' : '#0F172A';
    const borderColor = isDark ? '#1E2D44' : '#E2E8F0';
    const labelColor = isDark ? '#94A3B8' : '#475569';
    const coordColor = isDark ? '#38BDF8' : '#0284C7';
    const valueColor = isDark ? '#F8FAFC' : '#1E293B';

    points.forEach((pt) => {
      const lat = pt.latitude || pt.lat;
      const lng = pt.longitude || pt.lon || pt.lng;
      if (lat == null || lng == null) return;

      const risk = pt.risk_category || pt.category || (pt.flood_label === 1 ? 'High' : 'Low');
      const color = RISK_COLORS[risk] || '#06B6D4';

      const circle = L.circleMarker([lat, lng], {
        radius: risk === 'Very High' ? 8 : 6,
        fillColor: color,
        color: '#FFFFFF',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.85,
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 11px; line-height: 1.4; min-width: 170px;">
          <div style="font-weight: 800; font-size: 12px; color: ${titleColor}; border-bottom: 1px solid ${borderColor}; padding-bottom: 4px; margin-bottom: 6px;">
            ${pt.name || pt.basin || 'Observation Site'}
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: ${labelColor};">Coordinates:</span>
            <span style="font-family: monospace; color: ${coordColor}; font-weight: 600;">${Number(lat).toFixed(3)}°, ${Number(lng).toFixed(3)}°</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: ${labelColor};">Susceptibility:</span>
            <span style="font-weight: 700; color: ${color};">${risk}</span>
          </div>
          ${pt.score != null ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: ${labelColor};">Probability:</span>
            <span style="font-family: monospace; color: ${valueColor}; font-weight: 600;">${(pt.score * 100).toFixed(1)}%</span>
          </div>` : ''}
          ${pt.elevation != null ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: ${labelColor};">Elevation:</span>
            <span style="font-family: monospace; color: ${valueColor};">${pt.elevation}m</span>
          </div>` : ''}
        </div>
      `;

      circle.bindPopup(popupHtml);
      markersLayer.current.addLayer(circle);
    });
  }, [points, isDark]);

  // Handle active user-selected point
  useEffect(() => {
    if (!mapInstance.current) return;

    if (activeMarker.current) {
      mapInstance.current.removeLayer(activeMarker.current);
      activeMarker.current = null;
    }

    if (selectedPoint && selectedPoint.latitude && selectedPoint.longitude) {
      const { latitude, longitude } = selectedPoint;
      const customIcon = L.divIcon({
        className: 'custom-active-pin',
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(6, 182, 212, 0.4); animation: pulse-ring 2s infinite;"></div>
            <div style="position: absolute; inset: 0; border-radius: 50%; background: #06B6D4; border: 2px solid #FFFFFF; box-shadow: 0 0 10px #06B6D4;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      activeMarker.current = L.marker([latitude, longitude], { icon: customIcon }).addTo(mapInstance.current);
    }
  }, [selectedPoint]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-navy-800 shadow-panel bg-navy-950 transition-colors duration-200" style={{ height }}>
      {/* Leaflet Map Canvas */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Floating Risk Legend (Top-Right under Layer Control) */}
      <div className="absolute bottom-9 left-3 z-[1000] bg-navy-900/95 border border-navy-800 backdrop-blur-md rounded-lg p-2.5 shadow-panel text-[11px] pointer-events-auto transition-colors duration-200">
        <div className="font-bold text-slate-300 uppercase tracking-wider text-[9px] mb-1.5 font-mono flex items-center gap-1.5">
          <Layers size={11} className="text-cyan-400" />
          <span>Susceptibility Tiers</span>
        </div>
        <div className="flex flex-col gap-1 font-medium">
          {Object.entries(RISK_COLORS).map(([tier, color]) => (
            <div key={tier} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color }} />
              <span className="text-slate-300 text-[10px]">{tier}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Click Helper Banner */}
      {interactive && onSelectCoordinates && (
        <div className="absolute top-3 left-14 z-[1000] bg-navy-900/90 border border-navy-800 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm text-[11px] text-slate-300 flex items-center gap-2 pointer-events-none transition-colors duration-200">
          <MapPin size={13} className="text-cyan-400" />
          <span>Click anywhere on the map to sample coordinates</span>
        </div>
      )}

      {/* Bottom Coordinates Bar */}
      <div className="absolute bottom-2 right-2 z-[1000] bg-navy-900/90 border border-navy-800 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-400 flex items-center gap-2 shadow-sm pointer-events-none transition-colors duration-200">
        <Compass size={11} className="text-cyan-400" />
        {cursorCoords ? (
          <span>
            Lat: <strong className="text-cyan-300">{cursorCoords.lat}°</strong> | Lon: <strong className="text-cyan-300">{cursorCoords.lng}°</strong>
          </span>
        ) : (
          <span>Move cursor over map</span>
        )}
      </div>
    </div>
  );
}
