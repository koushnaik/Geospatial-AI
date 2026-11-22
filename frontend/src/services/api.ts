import axios from 'axios';
import {
  GaugeStation,
  PredictionResult,
  ModelEvaluationMetrics,
  DatasetAudit,
  HistoricalSummary
} from '../types';

const api = axios.create({
  baseURL: '/api'
});

export const getDashboardOverview = async () => {
  const res = await api.get('/dashboard/overview');
  return res.data;
};

export const getDatasetSummary = async (): Promise<DatasetAudit> => {
  const res = await api.get('/datasets/summary');
  return res.data;
};

export const getDatasetFeatures = async () => {
  const res = await api.get('/datasets/features');
  return res.data;
};

export const getDatasetQuality = async () => {
  const res = await api.get('/datasets/quality');
  return res.data;
};

export const getStates = async (): Promise<string[]> => {
  const res = await api.get('/locations/states');
  return res.data;
};

export const getBasins = async (): Promise<string[]> => {
  const res = await api.get('/locations/basins');
  return res.data;
};

export const getGauges = async (params?: { state?: string; basin?: string }): Promise<GaugeStation[]> => {
  const res = await api.get('/locations/gauges', { params });
  return res.data;
};

export const getGaugeDetails = async (gaugeId: string): Promise<GaugeStation> => {
  const res = await api.get(`/locations/${gaugeId}`);
  return res.data;
};

export const getCatchmentGeoJSON = async (gaugeId: string) => {
  const res = await api.get(`/locations/${gaugeId}/catchment-geojson`);
  return res.data;
};

export const getModelsComparison = async () => {
  const res = await api.get('/models/comparison');
  return res.data;
};

export const createPrediction = async (payload: any): Promise<PredictionResult> => {
  const res = await api.post('/predictions', payload);
  return res.data;
};

export const getPrediction = async (predictionId: string): Promise<PredictionResult> => {
  const res = await api.get(`/predictions/${predictionId}`);
  return res.data;
};

export const getHistoricalSummary = async (): Promise<HistoricalSummary> => {
  const res = await api.get('/historical/summary');
  return res.data;
};

export const getHistoricalDistribution = async (params?: any) => {
  const res = await api.get('/historical/distribution', { params });
  return res.data;
};

export const getHistoricalEvents = async (params?: any) => {
  const res = await api.get('/historical/events', { params });
  return res.data;
};

export const getRecentPredictions = async () => {
  const res = await api.get('/predictions/history');
  return res.data;
};

export const getPdfDownloadUrl = (predictionId: string) => {
  return `/api/reports/${predictionId}/pdf`;
};

export default api;
