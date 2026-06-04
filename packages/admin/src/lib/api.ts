import axios from 'axios';
import { GYM_ID } from '../brand';

const API_BASE = import.meta.env.VITE_API_URL || 'https://backend-production-3469.up.railway.app/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // The backend's TenantMiddleware requires X-Gym-Id on every non-auth route.
  // This portal manages a single gym (Karuna by default), so scope every
  // request to it.
  config.headers['X-Gym-Id'] = GYM_ID;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = import.meta.env.BASE_URL + 'login';
    }
    return Promise.reject(error);
  },
);

export default api;
