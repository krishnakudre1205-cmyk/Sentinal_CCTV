import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Longer timeout for AI video processing
});

export const apiService = {
  // Health Check
  getHealth: async () => {
    try {
      const response = await apiClient.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        data: { status: 'offline', project: 'SentinelFusion AI' }
      };
    }
  },

  // Cameras API (Module 1)
  getCameras: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/cameras/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.warn('Error fetching cameras:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  getCameraById: async (cameraId) => {
    try {
      const response = await apiClient.get(`/api/cameras/${cameraId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  registerCamera: async (payload) => {
    try {
      const response = await apiClient.post('/api/cameras/', payload);
      return { success: true, data: response.data };
    } catch (error) {
      const detail = error.response?.data?.detail || error.message;
      return { success: false, error: detail };
    }
  },

  uploadVideo: async (formData) => {
    try {
      const response = await apiClient.post('/api/cameras/upload-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      const detail = error.response?.data?.detail || error.message;
      return { success: false, error: detail };
    }
  },

  deleteCamera: async (cameraId) => {
    try {
      const response = await apiClient.delete(`/api/cameras/${cameraId}`);
      return { success: true, data: response.data };
    } catch (error) {
      const detail = error.response?.data?.detail || error.message;
      return { success: false, error: detail };
    }
  },

  // AI Detection Engine API (Module 2)
  startDetection: async (cameraId) => {
    try {
      const response = await apiClient.post(`/api/detection/start/${cameraId}`);
      return { success: true, data: response.data };
    } catch (error) {
      const detail = error.response?.data?.detail || error.message;
      return { success: false, error: detail };
    }
  },

  getDetectionResults: async (cameraId) => {
    try {
      const response = await apiClient.get(`/api/detection/results/${cameraId}`);
      return { success: true, data: response.data };
    } catch (error) {
      const detail = error.response?.data?.detail || error.message;
      return { success: false, error: detail };
    }
  },

  // ANPR & Vehicle Search API (Module 3)
  searchVehiclesByPlate: async (plateQuery) => {
    try {
      const response = await apiClient.get('/api/vehicles/search', {
        params: { plate: plateQuery }
      });
      return { success: true, data: response.data };
    } catch (error) {
      const detail = error.response?.data?.detail || error.message;
      return { success: false, error: detail, data: [] };
    }
  },

  // Vehicle DNA & Tracking API
  getVehicles: async (query = '') => {
    try {
      const response = await apiClient.get('/api/vehicles/', {
        params: query ? { query } : {},
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  // Module 5: Cross-Camera Vehicle Tracking API
  getVehicleJourney: async (identityId) => {
    try {
      const response = await apiClient.get(`/api/vehicles/${encodeURIComponent(identityId)}/journey`);
      return { success: true, data: response.data };
    } catch (error) {
      const detail = error.response?.data?.detail || error.message;
      return { success: false, error: detail, data: null };
    }
  },

  // Watchlist API
  getWatchlist: async () => {
    try {
      const response = await apiClient.get('/api/watchlist/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  // Alerts API
  getAlerts: async () => {
    try {
      const response = await apiClient.get('/api/alerts/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  // Simulate Watchlist Hit (Module 6 Demo)
  simulateAlert: async (plate = 'GJ01AB1234') => {
    try {
      const response = await apiClient.post('/api/alerts/simulate', null, {
        params: { plate }
      });
      return { success: true, data: response.data };
    } catch (error) {
      const detail = error.response?.data?.detail || error.message;
      return { success: false, error: detail };
    }
  },

  // Acknowledge Alert
  acknowledgeAlert: async (alertId) => {
    try {
      const response = await apiClient.patch(`/api/alerts/${alertId}/acknowledge`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default apiService;
