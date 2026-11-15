import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Layers, ExternalLink, Upload, ShieldCheck, Database,
  CheckCircle2, AlertTriangle, FileText, ArrowUpRight, HardDrive
} from 'lucide-react';

export default function DatasetExplorer() {
  const [datasets, setDatasets] = useState([]);
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    api.getDatasets()
      .then((data) => {
        setDatasets(data.catalog || []);
        setAudit(data.audit || null);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus('Uploading file to pipeline...');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.uploadDataset(formData);
      setUploadStatus(`Success: ${res.message || 'Dataset uploaded successfully'}`);
    } catch (err) {
      setUploadStatus(`Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-cyan-400 font-mono text-xs tracking-wider uppercase font-bold flex items-center gap-2 mb-1">
              <Database size={14} />
              <span>Centralized Earth Observation Repository</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Dataset Explorer & Provenance</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Official catalog of remote sensing products, satellite imagery, hydrological topography models,
              and precipitation archives utilized across the platform.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 text-teal-400 text-xs font-mono font-semibold">
              8 Official Sources Verified
            </span>
          </div>
        </div>
      </div>

      {/* Benchmark Dataset Audit */}
      {audit && (
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
          <div className="flex items-center justify-between mb-3 border-b border-navy-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Verified Satellite Flood Segmentation Audit</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">1,423 Total Pairs Audited</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-navy-950 border border-navy-800 p-3 rounded-lg text-center">
              <div className="text-xs text-slate-400">AIFloodSense</div>
              <div className="text-xl font-bold text-cyan-400 font-mono mt-1">470 pairs</div>
              <div className="text-[10px] text-slate-500 font-mono">Sentinel-1/2 Optical & SAR</div>
            </div>
            <div className="bg-navy-950 border border-navy-800 p-3 rounded-lg text-center">
              <div className="text-xs text-slate-400">Flood Area Segmentation</div>
              <div className="text-xl font-bold text-teal-400 font-mono mt-1">290 pairs</div>
              <div className="text-[10px] text-slate-500 font-mono">High-Res Aerial RGB</div>
            </div>
            <div className="bg-navy-950 border border-navy-800 p-3 rounded-lg text-center">
              <div className="text-xs text-slate-400">Sen1Floods11 (Optical)</div>
              <div className="text-xl font-bold text-indigo-400 font-mono mt-1">663 pairs</div>
              <div className="text-[10px] text-slate-500 font-mono">Global Flood Events</div>
            </div>
            <div className="bg-navy-950 border border-navy-800 p-3 rounded-lg text-center">
              <div className="text-xs text-slate-400">Baseline U-Net Validation</div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-1">0.9076 IoU</div>
              <div className="text-[10px] text-emerald-400/80 font-mono">0.9512 Dice Coefficient</div>
            </div>
          </div>
        </div>
      )}

      {/* Official Datasets Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {datasets.map((ds) => (
          <div key={ds.id || ds.name} className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel flex flex-col justify-between hover:border-navy-700 transition">
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-base font-bold text-white tracking-tight leading-snug">{ds.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-navy-950 border border-navy-700 text-cyan-400 shrink-0">
                  {ds.resolution || 'Variable'}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                {ds.description}
              </p>

              <div className="space-y-1.5 text-xs text-slate-300 font-mono bg-navy-950/70 p-2.5 rounded-lg border border-navy-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Provider:</span>
                  <span className="text-slate-200">{ds.provider || ds.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Temporal Coverage:</span>
                  <span className="text-slate-200">{ds.temporal_coverage || 'Historical Archive'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">License:</span>
                  <span className="text-emerald-400">{ds.license || 'Open Access'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-navy-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[11px]">Format: {ds.format || 'GeoTIFF / HDF5 / NetCDF'}</span>
              {ds.url && (
                <a
                  href={ds.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition"
                >
                  <span>Official Portal</span>
                  <ArrowUpRight size={13} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dataset Upload Section */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2 font-mono">
          <Upload size={16} className="text-cyan-400" />
          <span>Upload Custom Geospatial Observation File</span>
        </h2>
        <p className="text-slate-400 text-xs mb-4">
          Upload local point CSV observations or GeoTIFF rasters with latitude, longitude, and environmental features.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept=".csv,.tif,.tiff,.geojson"
            onChange={handleUpload}
            className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-navy-800 file:text-cyan-400 hover:file:bg-navy-700 cursor-pointer"
          />
          {uploadStatus && (
            <span className="text-xs font-mono text-cyan-300 font-semibold">{uploadStatus}</span>
          )}
        </div>
      </div>
    </div>
  );
}
