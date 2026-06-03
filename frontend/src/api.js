// src/api.js
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');


if (import.meta.env.DEV) {
  console.log('🔧 API Base URL:', API_BASE_URL);
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Important for CORS
  withCredentials: false, // Set to true if you need cookies/session
});

// Helper function to clean and build URLs (prevents double slashes)
const buildUrl = (url) => {
  if (!url) return '';
  

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Remove leading slash from path if it exists
  const cleanPath = url.replace(/^\//, '');
  
  // Combine base URL and path
  return `${API_BASE_URL}/${cleanPath}`;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Clean and validate the URL
    if (config.url) {
      // Fix any double slashes in the URL (except after protocol)
      config.url = config.url.replace(/([^:]\/)\/+/g, '$1');
      
      // If the URL doesn't start with http, ensure it's properly formed
      if (!config.url.startsWith('http')) {
        config.url = buildUrl(config.url);
      }
    }

    // Add authorization token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        headers: config.headers,
      });
    }

    return config;
  },
  (error) => {
    console.error('📛 Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  async (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('🌐 Network Error:', {
        message: error.message,
        config: error.config,
      });
      
      // Show user-friendly message
      const networkError = new Error('Network error. Please check your internet connection.');
      networkError.originalError = error;
      return Promise.reject(networkError);
    }

    // Handle specific HTTP status codes
    const { status, data, config } = error.response;
    const originalRequest = config;

    console.error('❌ API Error:', {
      status,
      url: originalRequest?.url,
      method: originalRequest?.method,
      message: data?.message || data?.error || error.message,
      data: data,
    });

    // Handle 401 Unauthorized (token expired or invalid)
    if (status === 401) {
      // Prevent multiple redirects
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Dispatch custom event for auth state change
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      const authError = new Error('Session expired. Please login again.');
      authError.status = 401;
      return Promise.reject(authError);
    }

    // Handle 403 Forbidden
    if (status === 403) {
      const forbiddenError = new Error(data?.message || 'You do not have permission to perform this action');
      forbiddenError.status = 403;
      return Promise.reject(forbiddenError);
    }

    // Handle 404 Not Found
    if (status === 404) {
      const notFoundError = new Error(data?.message || 'Requested resource not found');
      notFoundError.status = 404;
      return Promise.reject(notFoundError);
    }

    // Handle 422 Validation Error
    if (status === 422) {
      const validationError = new Error(data?.message || 'Validation failed');
      validationError.status = 422;
      validationError.details = data?.errors;
      return Promise.reject(validationError);
    }

    // Handle 500+ Server Errors
    if (status >= 500) {
      const serverError = new Error(data?.message || 'Server error. Please try again later.');
      serverError.status = status;
      return Promise.reject(serverError);
    }

    // Return the error with enhanced information
    const enhancedError = new Error(data?.message || data?.error || error.message);
    enhancedError.status = status;
    enhancedError.data = data;
    enhancedError.originalError = error;
    
    return Promise.reject(enhancedError);
  }
);

// Helper methods for common API operations
export const apiHelpers = {
  // Set auth token globally
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  },

  // Clear auth token
  clearAuthToken: () => {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current auth token
  getAuthToken: () => {
    return localStorage.getItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Optional: Check token expiration if you store expiry
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        apiHelpers.clearAuthToken();
        return false;
      }
    } catch (e) {
      // Invalid token format
      return false;
    }
    
    return true;
  },
};

// Health check function
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('API Health Check Failed:', error);
    return false;
  }
};

// Export the configured axios instance as default
export default api;