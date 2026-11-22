import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

import { Dashboard } from './pages/Dashboard';
import { PredictionForm } from './pages/PredictionForm';
import { PredictionResults } from './pages/PredictionResults';
import { ModelComparison } from './pages/ModelComparison';
import { HistoricalAnalysis } from './pages/HistoricalAnalysis';
import { InteractiveMap } from './pages/InteractiveMap';
import { DatasetExplorer } from './pages/DatasetExplorer';
import { DataPreprocessing } from './pages/DataPreprocessing';
import { ExplainableAI } from './pages/ExplainableAI';
import { ReportsPage } from './pages/ReportsPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        {/* Persistent White Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/predict" element={<PredictionForm />} />
              <Route path="/results/:predictionId" element={<PredictionResults />} />
              <Route path="/models" element={<ModelComparison />} />
              <Route path="/historical" element={<HistoricalAnalysis />} />
              <Route path="/map" element={<InteractiveMap />} />
              <Route path="/datasets" element={<DatasetExplorer />} />
              <Route path="/preprocessing" element={<DataPreprocessing />} />
              <Route path="/explainability" element={<ExplainableAI />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
