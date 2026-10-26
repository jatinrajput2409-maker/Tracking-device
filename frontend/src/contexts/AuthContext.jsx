import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('monitoring_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('monitoring_access_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('monitoring_access_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser((prev) => ({
              ...prev,
              ...res.data.data
            }));
          }
        } catch (err) {
          console.warn('Initial session validation error', err);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.success) {
      const data = response.data.data;
      localStorage.setItem('monitoring_access_token', data.accessToken);
      localStorage.setItem('monitoring_refresh_token', data.refreshToken);
      localStorage.setItem('monitoring_user', JSON.stringify(data));
      setToken(data.accessToken);
      setUser(data);
      return data;
    }
    throw new Error(response.data?.message || 'Login failed');
  };

  const register = async (formData) => {
    const response = await api.post('/auth/register', formData);
    if (response.data?.success) {
      const data = response.data.data;
      localStorage.setItem('monitoring_access_token', data.accessToken);
      localStorage.setItem('monitoring_refresh_token', data.refreshToken);
      localStorage.setItem('monitoring_user', JSON.stringify(data));
      setToken(data.accessToken);
      setUser(data);
      return data;
    }
    throw new Error(response.data?.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('monitoring_access_token');
      localStorage.removeItem('monitoring_refresh_token');
      localStorage.removeItem('monitoring_user');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
