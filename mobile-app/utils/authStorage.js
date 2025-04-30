// utils/authStorage.js

import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@auth_token';
const USER_DATA_KEY = '@user_data';

// Token ve kullanıcı verilerini kaydet
export const saveAuthData = async (data) => {
  try {
    const { token, user } = data;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    
    if (user) {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    }
    
    return true;
  } catch (error) {
    console.error('Error saving auth data:', error);
    return false;
  }
};

// Token'ı getir
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Kullanıcı verilerini getir
export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Kullanıcının giriş yapıp yapmadığını kontrol et
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

// Tüm kimlik doğrulama verilerini temizle (çıkış yaparken)
export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};