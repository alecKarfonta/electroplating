import axios from 'axios';
import {
  FileUploadResponse,
  SessionInfo,
  MeshInfo,
  MeshStatistics,
  ValidationResult,
  ResinCostRequest,
  ResinCostEstimate,
  ScaleRequest,
  TranslateRequest,
  ExportRequest,
  APIResponse,
  ElectroplatingRequest,
  ElectroplatingEstimate,
  ElectroplatingRecommendationRequest,
  ElectroplatingRecommendations,
} from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadSTLFile = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<FileUploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const listSessions = async (): Promise<Record<string, SessionInfo>> => {
  const response = await api.get<Record<string, SessionInfo>>('/sessions');
  return response.data;
};

export const getSessionInfo = async (sessionId: string): Promise<SessionInfo> => {
  const response = await api.get<SessionInfo>(`/sessions/${sessionId}`);
  return response.data;
};

export const deleteSession = async (sessionId: string): Promise<APIResponse> => {
  const response = await api.delete<APIResponse>(`/sessions/${sessionId}`);
  return response.data;
};

export const getMeshInfo = async (sessionId: string): Promise<MeshInfo> => {
  const response = await api.get<MeshInfo>(`/sessions/${sessionId}/info`);
  return response.data;
};

export const getMeshStatistics = async (sessionId: string): Promise<MeshStatistics> => {
  const response = await api.get<MeshStatistics>(`/sessions/${sessionId}/analysis`);
  return response.data;
};

export const getSTLData = async (sessionId: string): Promise<ArrayBuffer> => {
  const response = await api.get(`/sessions/${sessionId}/stl`, {
    responseType: 'arraybuffer',
  });
  return response.data;
};

export const validateMesh = async (sessionId: string): Promise<ValidationResult> => {
  const response = await api.get<ValidationResult>(`/sessions/${sessionId}/validation`);
  return response.data;
};

export const estimateResinCost = async (
  sessionId: string,
  costRequest: ResinCostRequest
): Promise<ResinCostEstimate> => {
  const response = await api.post<ResinCostEstimate>(
    `/sessions/${sessionId}/cost`,
    costRequest
  );
  return response.data;
};

export const scaleMesh = async (
  sessionId: string,
  scaleRequest: ScaleRequest
): Promise<APIResponse> => {
  const response = await api.post<APIResponse>(
    `/sessions/${sessionId}/scale`,
    scaleRequest
  );
  return response.data;
};

export const resetMesh = async (sessionId: string): Promise<APIResponse> => {
  const response = await api.post<APIResponse>(
    `/sessions/${sessionId}/reset`
  );
  return response.data;
};

export const translateMesh = async (
  sessionId: string,
  translateRequest: TranslateRequest
): Promise<APIResponse> => {
  const response = await api.post<APIResponse>(
    `/sessions/${sessionId}/translate`,
    translateRequest
  );
  return response.data;
};

export const exportStatistics = async (
  sessionId: string,
  exportRequest: ExportRequest
): Promise<Blob> => {
  const response = await api.post(
    `/sessions/${sessionId}/export`,
    exportRequest,
    {
      responseType: 'blob',
    }
  );
  return response.data;
};

export const getConvexHullVolume = async (sessionId: string): Promise<APIResponse> => {
  const response = await api.get<APIResponse>(`/sessions/${sessionId}/convex-hull-volume`);
  return response.data;
};

export const getApiStats = async (): Promise<Record<string, any>> => {
  const response = await api.get<Record<string, any>>('/stats');
  return response.data;
};

export const calculateElectroplatingParameters = async (
  sessionId: string,
  platingRequest: ElectroplatingRequest
): Promise<ElectroplatingEstimate> => {
  const response = await api.post<ElectroplatingEstimate>(
    `/sessions/${sessionId}/electroplating`,
    platingRequest
  );
  return response.data;
};

export const getElectroplatingRecommendations = async (
  sessionId: string,
  recommendationRequest: ElectroplatingRecommendationRequest
): Promise<ElectroplatingRecommendations> => {
  const response = await api.post<ElectroplatingRecommendations>(
    `/sessions/${sessionId}/electroplating/recommendations`,
    recommendationRequest
  );
  return response.data;
};

export default api; 