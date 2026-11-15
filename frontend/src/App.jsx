import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { api } from './services/api';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// 16 Modular Research Pages
import OverviewDashboard from './pages/OverviewDashboard';
import HistoricalFloodExplorer from './pages/HistoricalFloodExplorer';
import DatasetExplorer from './pages/DatasetExplorer';
import DataPreprocessing from './pages/DataPreprocessing';
import ExploratoryDataAnalysis from './pages/ExploratoryDataAnalysis';
import ModelTraining from './pages/ModelTraining';
import HyperparameterOptimization from './pages/HyperparameterOptimization';
import ModelComparison from './pages/ModelComparison';
import FloodPrediction from './pages/FloodPrediction';
import GeospatialRiskMap from './pages/GeospatialRiskMap';
import FloodImageAnalysis from './pages/FloodImageAnalysis';
import ExplainableAI from './pages/ExplainableAI';
import EnsembleAnalysis from './pages/EnsembleAnalysis';
import ExperimentHistory from './pages/ExperimentHistory';
import ReportsDownloads from './pages/ReportsDownloads';
import Settings from './pages/Settings';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('Overview Dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [unit, setUnit] = useState(() => localStorage.getItem('geoflood-unit') || 'Square kilometers');
  const [apiEndpoint, setApiEndpoint] = useState(() => {
    try {
      return localStorage.getItem('geoflood-api-endpoint') || import.meta.env.VITE_GEOFLOOD_API_BASE_URL || 'http://127.0.0.1:8000';
    } catch {
      return 'http://127.0.0.1:8000';
    }
  });
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('geoflood-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isDemo, setIsDemo] = useState(true);

  const { theme, toggleTheme, setTheme, isDark } = useTheme();

  useEffect(() => {
    localStorage.setItem('geoflood-unit', unit);
  }, [unit]);

  useEffect(() => {
    try {
      if (apiEndpoint) {
        localStorage.setItem('geoflood-api-endpoint', apiEndpoint);
      }
    } catch {}
  }, [apiEndpoint]);

  useEffect(() => {
    try {
      localStorage.setItem('geoflood-history', JSON.stringify(history));
    } catch {}
  }, [history]);

  const handleResetDemo = async () => {
    try {
      await api.resetDemo();
      setIsDemo(true);
      alert('Demo project workspace successfully reset! Realistic demonstration sample loaded across Indian river basins.');
    } catch (e) {
      alert(`Reset failed: ${e.message}`);
    }
  };

  const handleSavePredictionToHistory = (item) => {
    setHistory((prev) => [item, ...prev]);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('geoflood-history');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'Overview Dashboard':
        return <OverviewDashboard onNavigate={setCurrentPage} onResetDemo={handleResetDemo} isDemo={isDemo} />;
      case 'Historical Flood Explorer':
        return <HistoricalFloodExplorer />;
      case 'Dataset Explorer':
        return <DatasetExplorer />;
      case 'Data Preprocessing':
        return <DataPreprocessing />;
      case 'Exploratory Data Analysis':
        return <ExploratoryDataAnalysis />;
      case 'Model Training':
        return <ModelTraining />;
      case 'Hyperparameter Optimization':
        return <HyperparameterOptimization />;
      case 'Model Comparison':
        return <ModelComparison />;
      case 'Flood Susceptibility Prediction':
        return <FloodPrediction onSaveHistory={handleSavePredictionToHistory} />;
      case 'Geospatial Risk Map':
        return <GeospatialRiskMap />;
      case 'Flood Image Analysis':
        return <FloodImageAnalysis />;
      case 'Explainable AI':
        return <ExplainableAI />;
      case 'Ensemble Analysis':
        return <EnsembleAnalysis />;
      case 'Experiment History':
        return <ExperimentHistory history={history} onClearHistory={handleClearHistory} />;
      case 'Reports & Downloads':
        return <ReportsDownloads />;
      case 'Settings':
        return (
          <Settings
            unit={unit}
            setUnit={setUnit}
            theme={theme}
            setTheme={setTheme}
            apiEndpoint={apiEndpoint}
            setApiEndpoint={setApiEndpoint}
            onResetDemo={handleResetDemo}
          />
        );
      default:
        return <OverviewDashboard onNavigate={setCurrentPage} onResetDemo={handleResetDemo} isDemo={isDemo} />;
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-navy-950 ${isDark ? 'text-slate-100' : 'text-slate-900'} font-sans selection:bg-cyan-500/25 selection:text-cyan-300 transition-colors duration-200`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onResetDemo={handleResetDemo}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Topbar */}
        <Topbar
          currentPage={currentPage}
          theme={theme}
          onToggleTheme={toggleTheme}
          isDemo={isDemo}
          onNavigate={setCurrentPage}
        />

        {/* Dynamic Page Content with Smooth Scrolling */}
        <main className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          <div className="max-w-[1600px] mx-auto pb-10">
            {renderCurrentPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
