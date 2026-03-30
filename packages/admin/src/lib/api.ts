import axios from 'axios';

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
