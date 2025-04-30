// navigation/AppNavigator.js - Sadece PPTX Görüntüleyici ekranı ile

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

// Ekranları içe aktar
import LoginScreen from '../screens/LoginScreen';
import PresentationListScreen from '../screens/PresentationListScreen';
import PresentationDetailScreen from '../screens/PresentationDetailScreen';
import PPTXViewerScreen from '../screens/PPTXViewerScreen'; // Sadece PPTX görüntüleyici
import DocumentPickerScreen from '../screens/DocumentPickerScreen'; // Doküman seçici
import { COLORS } from '../constants/theme';

// Auth Context'i içe aktar
import { useAuth } from '../context/AuthContext';

// Stack navigator oluştur
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isLoggedIn, loading } = useAuth();

  // Kimlik durumu kontrol edilirken yükleme göster
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.white },
        }}
      >
        {isLoggedIn ? (
          // Giriş yapılmışsa, ana ekranları göster
          <>
            <Stack.Screen name="PresentationList" component={PresentationListScreen} />
            <Stack.Screen name="PresentationDetail" component={PresentationDetailScreen} />
            <Stack.Screen name="PPTXViewer" component={PPTXViewerScreen} />
            <Stack.Screen name="DocumentPicker" component={DocumentPickerScreen} />
          </>
        ) : (
          // Giriş yapılmamışsa, giriş ekranını göster
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;