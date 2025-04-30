// App.js

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Navigasyon
import AppNavigator from './navigation/AppNavigator';

// Auth Provider
import { AuthProvider } from './context/AuthContext';

// Theme
import { SIZES } from './constants/theme';

export default function App() {
  // Ekran boyutlarını al ve tema değişkenlerine ata
  useEffect(() => {
    const { width, height } = Dimensions.get('window');
    SIZES.screenWidth = width;
    SIZES.screenHeight = height;
  }, []);

  return (
    <SafeAreaProvider style={styles.container}>
      <AuthProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});