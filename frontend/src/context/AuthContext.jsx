import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// 🛠️ Detects backend URL. Falls back to localhost if env variable is missing.
const API_BASE_URL = import.meta.env?.VITE_API_URL|| 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`);
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
    if (response.data.success) {
      const { token, user } = response.data;
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return user;
    }
    throw new Error('Login failed');
  };

  const register = async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
    if (response.data.success) {
      const { token, user } = response.data;
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return user;
    }
    throw new Error('Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
