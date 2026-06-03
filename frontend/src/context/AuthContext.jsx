import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api'; // Use your API service

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set up axios interceptor to always include token
  useEffect(() => {
    const interceptor = api.interceptors.request.use(
      (config) => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        // Set the token in axios defaults
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Get current user info
        const response = await api.get('/api/auth/me');
        
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          // Token invalid, clear it
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Store token
        localStorage.setItem('token', token);
        setToken(token);
        
        // Set default auth header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(userData);
        return { success: true };
      }
      
      return { success: false, message: 'Login failed' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};