import axios from 'axios';

const DEFAULT_API_URL = import.meta.env.VITE_GEOFLOOD_API_BASE_URL || 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 45000,
});

// Dynamically use user-configured endpoint from Settings if available
client.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('geoflood-api-endpoint');
    if (saved && saved.trim()) {
      config.baseURL = saved.trim().replace(/\/+$/, '');
    }
  }
  return config;
});

export const api = {
  getHealth: () => client.get('/api/health').then(r => r.data),
  checkHealth: () => client.get('/api/health').then(r => r.data),
  getOverview: () => client.get('/api/dashboard/overview').then(r => r.data),
  getDatasets: () => client.get('/api/datasets').then(r => r.data),
  getDatasetDetails: (id) => client.get(`/api/datasets/${id}`).then(r => r.data),
  uploadDataset: (formData) => client.post('/api/datasets/upload', formData).then(r => r.data),
  runPreprocessing: () => client.post('/api/preprocessing/run').then(r => r.data),
  getEdaSummary: () => client.get('/api/eda/summary').then(r => r.data),
  getModels: () => client.get('/api/models').then(r => r.data),
  getModelsComparison: () => client.get('/api/models/comparison').then(r => r.data),
  startTraining: (skipExisting = false) => client.post(`/api/training/start?skip_existing=${skipExisting}`).then(r => r.data),
  getTrainingStatus: (jobId) => client.get(`/api/training/status/${jobId}`).then(r => r.data),
  predictSingle: (data) => client.post('/api/prediction/single', data).then(r => r.data),
  predictCompare: (data) => client.post('/api/prediction/compare', data).then(r => r.data),
  getShapExplanation: (data) => client.post('/api/explainability/shap', data).then(r => r.data),
  runOptimization: (modelName = 'CatBoost', trials = 10) => client.post(`/api/optimization/start?model_name=${modelName}&n_trials=${trials}`).then(r => r.data),
  getFeatureRankings: () => client.get('/api/feature-selection/rankings').then(r => r.data),
  analyzeSegmentation: (formData) => client.post('/api/segmentation/analyze', formData).then(r => r.data),
  getSegmentationBenchmarks: () => client.get('/api/segmentation/benchmarks').then(r => r.data),
  generateReport: (reportType) => client.post(`/api/reports/generate?report_type=${encodeURIComponent(reportType)}`).then(r => r.data),
  resetDemo: () => client.post('/api/demo/reset').then(r => r.data),
  getStudyAreas: () => client.get('/api/study-areas').then(r => r.data),
  getCalibratedLocations: () => client.get('/api/geospatial/locations').then(r => r.data),
  searchLocations: (query) => client.get(`/api/geospatial/search?query=${encodeURIComponent(query)}`).then(r => r.data),
  lookupCoordinates: (lat, lon) => client.get(`/api/geospatial/location-lookup?latitude=${lat}&longitude=${lon}`).then(r => r.data),
};

export default api;
