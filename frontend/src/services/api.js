import axios from 'axios';
import { handleMockRequest } from './mockData';

const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT token if available
api.interceptors.request.use(
  (config) => {
    // If on GitHub Pages, directly return mock data for static preview
    if (isGitHubPages) {
      const mockResult = handleMockRequest(config.url || '', config.method || 'GET', config.data);
      config.adapter = async () => ({
        data: mockResult,
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      });
      return config;
    }

    const token = localStorage.getItem('monitoring_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration and offline fallback
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If request failed because backend is offline or returned 404, fallback to mock data
    if (!error.response || error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      console.warn(`[AegisMonitor] Live API unavailable for ${originalRequest.url}. Falling back to simulation engine.`);
      const mockResult = handleMockRequest(originalRequest.url || '', originalRequest.method || 'GET', originalRequest.data);
      return Promise.resolve({
        data: mockResult,
        status: 200,
        statusText: 'OK (Mock Fallback)',
        headers: {},
        config: originalRequest
      });
    }
    
    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('monitoring_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
          if (res.data?.success && res.data?.data?.accessToken) {
            const newAccessToken = res.data.data.accessToken;
            localStorage.setItem('monitoring_access_token', newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('monitoring_access_token');
          localStorage.removeItem('monitoring_refresh_token');
          localStorage.removeItem('monitoring_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
