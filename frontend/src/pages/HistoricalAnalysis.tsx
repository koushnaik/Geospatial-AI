import React, { useEffect, useState } from 'react';
import {
  History,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  MapPin,
  TrendingUp,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  getHistoricalSummary,
  getHistoricalDistribution,
  getHistoricalEvents,
  getStates,
  getBasins
} from '../services/api';
import { HistoricalSummary } from '../types';

const COLORS = ['#0d9488', '#ef4444'];

export const HistoricalAnalysis: React.FC = () => {
  const [summary, setSummary] = useState<HistoricalSummary | null>(null);
  const [distribution, setDistribution] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [totalEventsCount, setTotalEventsCount] = useState(0);

  const [states, setStates] = useState<string[]>([]);
  const [basins, setBasins] = useState<string[]>([]);

  // Filter states
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedBasin, setSelectedBasin] = useState<string>('');
  const [selectedFloodType, setSelectedFloodType] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load summary and filter options
  useEffect(() => {
    Promise.all([getHistoricalSummary(), getStates(), getBasins()])
      .then(([sumRes, stRes, bsRes]) => {
        setSummary(sumRes);
        setStates(stRes);
        setBasins(bsRes);
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch distributions & events on filter change
  useEffect(() => {
    setLoading(true);
    const params: any = {};
    if (selectedState) params.state = selectedState;
    if (selectedBasin) params.basin = selectedBasin;
    if (selectedYear) params.year = selectedYear;

    Promise.all([
      getHistoricalDistribution(params),
      getHistoricalEvents({ ...params, flood_type: selectedFloodType || undefined, limit: 25 })
    ])
      .then(([distRes, evtRes]) => {
        setDistribution(distRes);
        setEvents(evtRes.events);
        setTotalEventsCount(evtRes.total);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedState, selectedBasin, selectedFloodType, selectedYear]);

  const resetFilters = () => {
    setSelectedState('');
    setSelectedBasin('');
    setSelectedFloodType('');
    setSelectedYear('');
  };

  const pieData = summary
    ? [
        { name: 'Flood (Warning Exceeded)', value: summary.flood_count },
        { name: 'Severe Flood (Danger Exceeded)', value: summary.severe_flood_count },
      ]
    : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-2">
          <History className="w-4 h-4" />
          National Archive
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          INDOFLOODS Historical Flood Analysis (1965–2020)
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Exploration of 4,548 verified historical flood events across 155 river catchments in India,
          tracking temporal evolutions, rainfall intensity, and severity distributions.
        </p>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Total Events</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {summary.total_events.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">1965 – 2020 (55 yrs)</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Monitored Gauges</span>
            <div className="text-2xl font-bold text-blue-600 font-mono mt-1">
              {summary.total_gauges}
            </div>
            <span className="text-[10px] text-slate-500">Across {summary.total_states} States</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Flood Events</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {summary.flood_count.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">{summary.flood_percentage}% of total</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Severe Floods</span>
            <div className="text-2xl font-bold text-rose-400 font-mono mt-1">
              {summary.severe_flood_count.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">{summary.severe_flood_percentage}% of total</span>
          </div>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Filter Historical Records
          </span>
          <button
            onClick={resetFilters}
            className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 transition"
          >
            <RefreshCw className="w-3 h-3" /> Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-800 outline-none"
            >
              <option value="">All States ({states.length})</option>
              {states.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">River Basin</label>
            <select
              value={selectedBasin}
              onChange={(e) => setSelectedBasin(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-800 outline-none"
            >
              <option value="">All Basins ({basins.length})</option>
              {basins.map((bs) => (
                <option key={bs} value={bs}>{bs}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Severity Category</label>
            <select
              value={selectedFloodType}
              onChange={(e) => setSelectedFloodType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-800 outline-none"
            >
              <option value="">All Categories</option>
              <option value="Flood">Flood (Sub-severe)</option>
              <option value="Severe Flood">Severe Flood</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Filter by Year</label>
            <input
              type="number"
              placeholder="e.g. 2018"
              min="1965"
              max="2020"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-800 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Chart 1: Yearly Flood Trends (1965-2020) */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Historical Flood Events Timeline (1965 – 2020)
          </h2>
          <p className="text-xs text-slate-500">Annual occurrences of Flood vs Severe Flood events</p>
        </div>

        <div className="h-72 w-full pt-2">
          {distribution?.by_year && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={distribution.by_year} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="flood" name="Flood Events" stroke="#0d9488" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="severe_flood" name="Severe Flood" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Grid: State Breakdown & Rainfall Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State Breakdown */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Flood Frequency by State (Top 10)
            </h2>
            <p className="text-xs text-slate-500">Total historical events per state</p>
          </div>

          <div className="h-72 w-full pt-2">
            {distribution?.by_state && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution.by_state.slice(0, 10)} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="state" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="total" name="Total Events" fill="#0284c7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Antecedent Rainfall Trends */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              Antecedent Rainfall Distribution (T1d to T10d)
            </h2>
            <p className="text-xs text-slate-500">Median and 75th percentile precipitation (mm)</p>
          </div>

          <div className="h-72 w-full pt-2">
            {distribution?.rainfall_trends && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution.rainfall_trends} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="median" name="Median (mm)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="p75" name="75th Percentile (mm)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Historical Events Data Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Historical Flood Events Database</h2>
            <p className="text-xs text-slate-500">
              Showing {events.length} of {totalEventsCount} matching records
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-950/60 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Station</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Basin</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">Flood Type</th>
                <th className="py-3 px-4">T1d Rain</th>
                <th className="py-3 px-4">T10d Rain</th>
                <th className="py-3 px-4">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {events.map((e) => (
                <tr key={e.event_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-blue-600">{e.event_id}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{e.station}</td>
                  <td className="py-3 px-4 text-slate-700">{e.state}</td>
                  <td className="py-3 px-4 text-slate-500">{e.basin}</td>
                  <td className="py-3 px-4 text-slate-500">{e.start_date}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        e.flood_type === 'Severe Flood'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {e.flood_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{e.T1d} mm</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{e.T10d} mm</td>
                  <td className="py-3 px-4 text-slate-500">
                    {e.duration_days ? `${e.duration_days} days` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
