import React, { useState } from 'react';
import RiskMap from '../components/RiskMap';
import {
  History, Calendar, MapPin, AlertCircle, ArrowUpRight,
  Waves, CloudRain, Droplets, Mountain, Filter
} from 'lucide-react';

const HISTORICAL_EVENTS = [
  {
    id: 'kerala-2018',
    title: 'Kerala Extreme Monsoon Floods (August 2018)',
    basin: 'Periyar & Pamba Basins',
    dates: 'August 8 – August 19, 2018',
    peak_rainfall: '310 mm in 24 hours (810 mm in 7 days)',
    affected_districts: 'Ernakulam, Thrissur, Alappuzha, Idukki',
    inundation_area: '1,450 km²',
    coordinates: [10.150, 76.400],
    risk_tier: 'Very High',
    elevation: '14m',
    description: 'Catastrophic overtopping driven by antecedent reservoir releases and sustained heavy rainfall exceeding 164% of seasonal averages.'
  },
  {
    id: 'assam-2020',
    title: 'Assam Brahmaputra Valley Inundation (July 2020)',
    basin: 'Brahmaputra River Corridor',
    dates: 'June 22 – July 28, 2020',
    peak_rainfall: '240 mm in 24 hours (640 mm in 7 days)',
    affected_districts: 'Barpeta, Dhemaji, Morigaon, Kaziranga',
    inundation_area: '3,800 km²',
    coordinates: [26.650, 93.350],
    risk_tier: 'Very High',
    elevation: '54m',
    description: 'Extensive seasonal overbank flooding affecting over 85% of Kaziranga National Park with heavy siltation from Himalayan tributaries.'
  },
  {
    id: 'bihar-2019',
    title: 'North Bihar Flash & Riverine Floods (July 2019)',
    basin: 'Kosi, Bagmati & Gandak Basins',
    dates: 'July 11 – July 26, 2019',
    peak_rainfall: '190 mm in 24 hours (480 mm in 7 days)',
    affected_districts: 'Sitamarhi, Madhubani, Araria, Kishanganj',
    inundation_area: '2,900 km²',
    coordinates: [25.850, 86.950],
    risk_tier: 'Very High',
    elevation: '36m',
    description: 'Intense precipitation in the Nepal catchment generated rapid peak hydrographs across low-gradient alluvial megafans.'
  },
  {
    id: 'odisha-2020',
    title: 'Mahanadi Coastal Delta Floods (August 2020)',
    basin: 'Mahanadi River Basin',
    dates: 'August 24 – September 1, 2020',
    peak_rainfall: '210 mm in 24 hours (530 mm in 7 days)',
    affected_districts: 'Cuttack, Puri, Kendrapara, Jagatsinghpur',
    inundation_area: '2,150 km²',
    coordinates: [20.460, 85.880],
    risk_tier: 'High',
    elevation: '18m',
    description: 'Monsoon depression over the Bay of Bengal combined with heavy Hirakud dam reservoir discharges caused acute deltaic flooding.'
  },
  {
    id: 'narmada-2020',
    title: 'Central India Narmada Flash Flood (August 2020)',
    basin: 'Narmada River Basin',
    dates: 'August 28 – September 2, 2020',
    peak_rainfall: '280 mm in 24 hours',
    affected_districts: 'Hoshangabad, Sehore, Bharuch',
    inundation_area: '1,120 km²',
    coordinates: [21.850, 73.550],
    risk_tier: 'High',
    elevation: '42m',
    description: 'Record water levels driven by extreme rainfall over the Satpura and Vindhya ranges triggering emergency reservoir gate operations.'
  }
];

export default function HistoricalFloodExplorer() {
  const [activeEvent, setActiveEvent] = useState(HISTORICAL_EVENTS[0]);

  const mapPoints = HISTORICAL_EVENTS.map((e) => ({
    name: e.title,
    latitude: e.coordinates[0],
    longitude: e.coordinates[1],
    risk_category: e.risk_tier,
    elevation: parseInt(e.elevation) || 20,
    score: e.risk_tier === 'Very High' ? 0.95 : 0.75
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-cyan-400 font-mono text-xs tracking-wider uppercase font-bold flex items-center gap-2 mb-1">
              <History size={14} />
              <span>Retrospective Geospatial Archive</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Historical Flood Explorer</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl">
              Catalogue of major documented historical flood events across the Indian Subcontinent with observed inundation areas, peak precipitation, and terrain characteristics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 text-cyan-400 text-xs font-mono font-semibold">
              5 Documented Flood Episodes
            </span>
          </div>
        </div>
      </div>

      {/* Main Split: Left Event Cards, Right Interactive GIS Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Event List (5 Columns) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono uppercase tracking-wider font-bold">
            <span>Select Recorded Event</span>
            <span>2018 – 2020</span>
          </div>

          {HISTORICAL_EVENTS.map((ev) => {
            const isSelected = activeEvent.id === ev.id;
            return (
              <div
                key={ev.id}
                onClick={() => setActiveEvent(ev)}
                className={`p-4 rounded-xl border transition cursor-pointer shadow-panel ${
                  isSelected
                    ? 'bg-navy-850 border-cyan-500/80 shadow-glow-cyan/20 ring-1 ring-cyan-500/40'
                    : 'bg-navy-900 border-navy-800 hover:border-navy-700 hover:bg-navy-850/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-sm font-bold text-white leading-snug">{ev.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                      ev.risk_tier === 'Very High'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {ev.risk_tier}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-cyan-400 mb-2">
                  <MapPin size={12} />
                  <span>{ev.basin}</span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {ev.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-navy-950/70 p-2 rounded-lg border border-navy-800/80">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Inundation</span>
                    <span className="text-slate-200 font-bold">{ev.inundation_area}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Peak 24h Rain</span>
                    <span className="text-teal-400 font-bold">{ev.peak_rainfall.split(' ')[0]} mm</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Event Deep-Dive + Map (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Event Metrics Banner */}
          <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
            <div className="flex items-center justify-between border-b border-navy-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  Active Geospatial Focus
                </span>
                <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                  {activeEvent.title}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-navy-950 px-2.5 py-1 rounded border border-navy-800">
                <Calendar size={13} className="text-cyan-400" />
                <span>{activeEvent.dates}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-navy-950 p-3 rounded-lg border border-navy-800 text-center">
                <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-mono">Inundated Area</span>
                <span className="text-base font-bold text-white font-mono">{activeEvent.inundation_area}</span>
              </div>
              <div className="bg-navy-950 p-3 rounded-lg border border-navy-800 text-center">
                <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-mono">Max 24h Rainfall</span>
                <span className="text-base font-bold text-teal-400 font-mono">{activeEvent.peak_rainfall.split('(')[0]}</span>
              </div>
              <div className="bg-navy-950 p-3 rounded-lg border border-navy-800 text-center">
                <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-mono">Elevation</span>
                <span className="text-base font-bold text-cyan-400 font-mono">{activeEvent.elevation}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-navy-950/50 p-3 rounded-lg border border-navy-800/80">
              <strong className="text-slate-100">Meteorological & Hydrological Context: </strong>
              {activeEvent.description}
            </p>
          </div>

          {/* Interactive Event Map */}
          <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin size={15} className="text-cyan-400" />
                <span>Event Location & Basin Topography</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Lat: {activeEvent.coordinates[0]}°, Lon: {activeEvent.coordinates[1]}°
              </span>
            </div>

            <RiskMap
              center={activeEvent.coordinates}
              zoom={7}
              points={mapPoints}
              selectedPoint={{ latitude: activeEvent.coordinates[0], longitude: activeEvent.coordinates[1] }}
              height="380px"
              interactive={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
