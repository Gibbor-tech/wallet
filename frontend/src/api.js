// src/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Set default baseURL for relative requests
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 30000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Rewrite local backend URLs in outgoing requests so deployed frontend does not call localhost.
axios.interceptors.request.use(
  (config) => {
    const originalUrl = config.url || '';
    if (originalUrl.startsWith('http://localhost:5000')) {
      config.url = originalUrl.replace('http://localhost:5000', API_BASE_URL);
    }
    if (originalUrl.startsWith('http://localhost:3000')) {
      config.url = originalUrl.replace('http://localhost:3000', API_BASE_URL);
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const api = axios;

// Response interceptor: handle common errors
api.interceptors.response.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Log error for debugging (remove in production)
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
    });
    
    return Promise.reject(error);
  }
);

export default api;