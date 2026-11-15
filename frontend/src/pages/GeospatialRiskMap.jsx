import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import RiskMap from '../components/RiskMap';
import {
  Map, Layers, Filter, Compass, Download, ShieldCheck,
  MapPin, CheckCircle2, ArrowUpRight
} from 'lucide-react';

export default function GeospatialRiskMap() {
  const [studyAreas, setStudyAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [filterRisk, setFilterRisk] = useState('All');

  useEffect(() => {
    api.getStudyAreas()
      .then((data) => {
        setStudyAreas(data);
        if (data.length) setSelectedArea(data[0]);
      })
      .catch((e) => console.error(e));
  }, []);

  const filteredPoints = studyAreas.filter((pt) => {
    if (filterRisk === 'All') return true;
    return pt.risk_category === filterRisk || (pt.flood_frequency > 5 ? 'High' : 'Low') === filterRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-cyan-400 font-mono text-xs tracking-wider uppercase font-bold flex items-center gap-2 mb-1">
              <Map size={14} />
              <span>Geospatial Intelligence GIS Terminal</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Geospatial Flood Susceptibility Map</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Interactive multi-layer GIS visualization across monitored river basins with satellite, dark analytics, and street overlays.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-navy-950 px-3 py-1.5 rounded-xl border border-navy-800">
              <Filter size={13} className="text-cyan-400" />
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="bg-transparent text-xs text-slate-300 outline-none font-mono cursor-pointer"
              >
                <option value="All" className="bg-navy-950">All Susceptibility Tiers</option>
                <option value="Very Low" className="bg-navy-950">Very Low (0.00 – 0.20)</option>
                <option value="Low" className="bg-navy-950">Low (0.20 – 0.40)</option>
                <option value="Moderate" className="bg-navy-950">Moderate (0.40 – 0.60)</option>
                <option value="High" className="bg-navy-950">High (0.60 – 0.80)</option>
                <option value="Very High" className="bg-navy-950">Very High (0.80 – 1.00)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Basin Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {studyAreas.map((area) => (
          <button
            key={area.id}
            onClick={() => {
              setSelectedArea(area);
              setSelectedCoords({ latitude: area.latitude, longitude: area.longitude });
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition flex items-center gap-2 border ${
              selectedArea?.id === area.id
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-glow-cyan/20'
                : 'bg-navy-900 border-navy-800 text-slate-400 hover:text-white hover:border-navy-700'
            }`}
          >
            <MapPin size={13} className={selectedArea?.id === area.id ? 'text-cyan-400' : 'text-slate-500'} />
            <span>{area.name.split('–')[0].trim()}</span>
          </button>
        ))}
      </div>

      {/* Main Map Canvas */}
      <div className="space-y-4">
        <RiskMap
          height="620px"
          center={selectedArea ? [selectedArea.latitude, selectedArea.longitude] : [20.5937, 78.9629]}
          zoom={selectedArea ? 8 : 5}
          points={filteredPoints}
          selectedPoint={selectedCoords}
          onSelectCoordinates={(c) => setSelectedCoords(c)}
          interactive={true}
        />
      </div>

      {/* Coordinate Inspector Footnote Card */}
      {selectedCoords && (
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-4 shadow-panel flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Compass size={15} className="text-cyan-400" />
            <span>Selected Geographic Point:</span>
            <strong className="text-cyan-300">{selectedCoords.latitude}°N, {selectedCoords.longitude}°E</strong>
          </div>
          <span className="text-slate-500 text-[11px]">
            Ready for inference under the multi-model consensus pipeline.
          </span>
        </div>
      )}
    </div>
  );
}
