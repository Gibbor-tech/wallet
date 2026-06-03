import axios from 'axios';

// Remove trailing slash to prevent double slashes
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor - FIX THE DOUBLE SLASH ISSUE
api.interceptors.request.use(
  (config) => {
    // Ensure URL doesn't have double slashes
    if (config.url) {
      // Remove any leading slash from the URL path
      let cleanUrl = config.url.replace(/^\//, '');
      
      // Build the full URL without double slashes
      config.url = `${API_BASE_URL}/${cleanUrl}`;
      
      // Fix any double slashes that might have been created
      config.url = config.url.replace(/([^:]\/)\/+/g, '$1');
    }

    // Add authorization token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;