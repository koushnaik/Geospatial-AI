import React, { useState, useRef, useEffect } from 'react';
import { Info, HelpCircle } from 'lucide-react';

export const EXPLANATIONS = {
  elevation: {
    title: 'Elevation Above Sea Level',
    simple: 'How high the ground is above sea level (in meters).',
    whyItMatters: 'Water naturally flows downhill. Low-elevation regions (under 25m) act as drainage sinks and retain floodwaters, whereas elevated hills and plateaus shed water rapidly.',
    typicalRange: '-2m to 3,500m+'
  },
  slope: {
    title: 'Terrain Slope / Steepness',
    simple: 'The steepness of the terrain in degrees (0° = flat, 90° = vertical cliff).',
    whyItMatters: 'Flat land (slope < 2°) cannot drain runoff quickly, leading to water accumulation and pooling. Steep slopes (> 10°) shed water quickly, creating rapid runoff.',
    typicalRange: '0.2° (flat river plains) to 30°+ (mountains)'
  },
  rainfall_24h: {
    title: '24-Hour Precipitation Volume',
    simple: 'Rainfall accumulated in a single 24-hour period (in millimeters).',
    whyItMatters: 'Intense short-term rainfall (> 150mm/day) overwhelms local storm drains, rivers, and natural drainage channels, causing flash flooding and sudden river overflow.',
    typicalRange: '0mm to 300mm+ during extreme monsoons'
  },
  rainfall_7d: {
    title: '7-Day Cumulative Rainfall',
    simple: 'Total rainfall over the past 7 days (in millimeters).',
    whyItMatters: 'Indicates intermediate soil saturation. When ground is already soaked from a week of rain, subsequent rainfall has nowhere to soak in and turns 100% into surface runoff.',
    typicalRange: '10mm (dry) to 700mm+ (monsoon surge)'
  },
  rainfall_30d: {
    title: '30-Day Seasonal Monsoon Rainfall',
    simple: 'Monthly cumulative rainfall volume (in millimeters).',
    whyItMatters: 'Governs regional groundwater table elevation and reservoir levels. When river basins absorb a month of heavy rain, riverbeds remain swollen and prone to sustained inundation.',
    typicalRange: '50mm (plateaus) to 1,500mm+ (coastal Western Ghats / Assam)'
  },
  distance_to_river: {
    title: 'Proximity to Active River Channel',
    simple: 'Shortest horizontal distance to the nearest major river or waterbody (in meters).',
    whyItMatters: 'Areas within 500 meters of riverbanks face direct bank overtopping during high discharge, while sites several kilometers away are only affected by extreme regional inundation.',
    typicalRange: '50m to 10,000m+'
  },
  drainage_density: {
    title: 'Basin Drainage Density',
    simple: 'Total stream length per square kilometer of drainage basin area (km/km²).',
    whyItMatters: 'High drainage density indicates a well-connected network of channels that rapidly channels surface runoff toward the main river channel, increasing flood peaks.',
    typicalRange: '0.5 to 6.0 km/km²'
  },
  flow_accumulation: {
    title: 'Upstream Flow Accumulation',
    simple: 'Number of upstream terrain cells that drain into this specific point.',
    whyItMatters: 'Points with massive upstream catchment areas (thousands of cells) sit directly on natural water corridors and valley floors, making them natural flood collectors.',
    typicalRange: '100 cells (ridges) to 100,000+ cells (riverbeds)'
  },
  twi: {
    title: 'Topographic Wetness Index (TWI)',
    simple: 'Physical index combining upstream drainage area and local slope: ln(a / tan(b)).',
    whyItMatters: 'Calculates soil wetness tendency. High TWI values (> 14) represent flat, saturated valley bottoms; low values (< 6) represent dry, well-drained steep ridges.',
    typicalRange: '3.0 (dry ridges) to 20.0 (marshlands & valley floors)'
  },
  susceptibility_score: {
    title: 'Flood Susceptibility Index (0.0 to 1.0)',
    simple: 'The AI model\'s calculated long-term probability of an area being prone to flood inundation.',
    whyItMatters: 'Synthesizes terrain, hydrology, and historical disaster records. NOTE: This is a static physical vulnerability metric, NOT an hourly weather alert.',
    typicalRange: '0.00 - 0.20 (Very Low) to 0.80 - 1.00 (Very High)'
  },
  model_consensus: {
    title: 'Multi-Algorithm Consensus Agreement',
    simple: 'Percentage of the 8 distinct machine learning algorithms that agree on this risk classification.',
    whyItMatters: 'High consensus (80%-100%) means independent models (Random Forest, XGBoost, CatBoost, SVM, LightGBM, Logistic Regression) all arrive at the same conclusion, giving high scientific confidence.',
    typicalRange: '60% to 100%'
  },
  shap_explanation: {
    title: 'SHAP Feature Attribution (Why the model gave this result)',
    simple: 'Scientific breakdown showing how much each individual physical factor pulled the risk up or down.',
    whyItMatters: 'Prevents black-box AI. Shows whether low elevation (+), heavy rain (+), or high slope (-) was the primary driver for this particular geographic point.',
    typicalRange: 'Positive bars increase flood risk; negative bars decrease flood risk.'
  },
  soil_type: {
    title: 'Soil Hydrological Type',
    simple: 'Geological soil classification and water infiltration capacity.',
    whyItMatters: 'Hydromorphic coastal clay and river alluvium have low infiltration, causing pooling; well-drained sandy loam or basaltic regur allows faster water penetration.',
    typicalRange: '1: Coastal Alluvium, 2: Deltaic Clay, 3: Regur/Red Soil, 4: Gangetic Silt, 5: Mountain Loam'
  },
  landcover: {
    title: 'ESA WorldCover Land Classification',
    simple: 'What is covering the land surface (vegetation, water, built-up concrete, bare soil).',
    whyItMatters: 'Urban concrete and asphalt prevent water absorption, creating 80%+ immediate surface runoff. Dense forests and wetlands regulate water flow and mitigate flash floods.',
    typicalRange: '10: Trees, 30: Grassland, 40: Cropland, 50: Built-up, 60: Bare, 90: Wetland'
  }
};

export default function InfoTooltip({ term, size = 14, className = '', align = 'left' }) {
  const [open, setOpen] = useState(false);
  const info = EXPLANATIONS[term];
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  if (!info) return null;

  return (
    <span className={`inline-flex items-center relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        className="text-slate-400 hover:text-cyan-400 focus:outline-none transition p-0.5 rounded cursor-pointer"
        title={info.title}
        aria-label={`Information about ${info.title}`}
      >
        <HelpCircle size={size} className="opacity-80 hover:opacity-100" />
      </button>

      {open && (
        <div
          className={`absolute z-50 top-full mt-2 w-72 md:w-80 p-3.5 rounded-xl bg-navy-900/95 dark:bg-navy-900/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md text-left transition-all ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ minWidth: '260px' }}
        >
          <div className="flex items-start justify-between gap-2 border-b border-navy-800 pb-2 mb-2">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                Key Concept
              </span>
              <h4 className="text-xs font-bold text-white leading-tight">
                {info.title}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase font-mono block">In Simple Terms:</span>
              <p className="text-slate-200 leading-snug">{info.simple}</p>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase font-mono block">Why It Matters for Flooding:</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">{info.whyItMatters}</p>
            </div>

            {info.typicalRange && (
              <div className="pt-1.5 border-t border-navy-800/80 flex items-center justify-between text-[10px] font-mono text-cyan-300">
                <span className="text-slate-400">Typical Range:</span>
                <span>{info.typicalRange}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </span>
  );
}
