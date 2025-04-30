// context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';
import { isAuthenticated, getUserData, clearAuthData } from '../utils/authStorage';

// Context oluştur
const AuthContext = createContext();

// Context provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Uygulama başlangıcında kimlik durumunu kontrol et
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        if (authenticated) {
          // Kullanıcı bilgilerini al
          const userData = await getUserData();
          setUser(userData);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Giriş fonksiyonu
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.studentLogin(email, password);
      setUser(response.user);
      setIsLoggedIn(true);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Çıkış fonksiyonu
  const logout = async () => {
    setLoading(true);
    try {
      await api.studentLogout();
      setUser(null);
      setIsLoggedIn(false);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Context değeri
  const value = {
    user,
    loading,
    isLoggedIn,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Context hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};