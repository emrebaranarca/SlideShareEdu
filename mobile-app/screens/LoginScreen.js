// screens/LoginScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';


const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();


  const handleLogin = async () => {
    // Basit doğrulama
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta ve şifre giriniz.');
      return;
    }

    try {
      setLoading(true);
      const result = await login(email, password);
      
      if (!result.success) {
        Alert.alert('Giriş Hatası', result.error || 'Giriş yapılamadı.');
      }
      // Başarılı giriş durumunda navigator otomatik olarak PresentationList'e yönlendirecek
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Giriş Hatası', 
        error.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyiniz.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.content}>
            {/* Logo ve Başlık */}
            <View style={styles.headerContainer}>
              <Image 
                source={require('../assets/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>TiklaOgren</Text>
              <Text style={styles.subtitle}>PowerPoint Öğrenme Platformu</Text>
            </View>

            {/* Giriş Formu */}
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Öğrenci Girişi</Text>

              {/* E-posta Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>E-posta</Text>
                <TextInput
                  style={styles.input}
                  placeholder="E-posta adresinizi giriniz"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Şifre Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Şifre</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Şifrenizi giriniz"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    style={styles.passwordVisibilityBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.passwordVisibilityBtnText}>
                      {showPassword ? 'Gizle' : 'Göster'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Giriş Butonu */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size={24} color={COLORS.white} />
                ) : (
                  <Text style={styles.loginButtonText}>Giriş Yap</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SIZES.padding * 2,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SIZES.margin * 3,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: SIZES.margin,
  },
  title: {
    ...FONTS.largeTitle,
    color: COLORS.primary,
    marginBottom: SIZES.margin / 2,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.gray,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    ...FONTS.title,
    color: COLORS.black,
    marginBottom: SIZES.margin * 2,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: SIZES.margin * 1.5,
  },
  inputLabel: {
    ...FONTS.body,
    color: COLORS.black,
    marginBottom: SIZES.margin / 2,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius / 2,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    fontSize: SIZES.body,
    color: COLORS.black,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius / 2,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    fontSize: SIZES.body,
    color: COLORS.black,
  },
  passwordVisibilityBtn: {
    paddingHorizontal: SIZES.padding,
  },
  passwordVisibilityBtnText: {
    ...FONTS.small,
    color: COLORS.primary,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius / 2,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.margin,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  loginButtonText: {
    ...FONTS.subtitle,
    color: COLORS.white,
  },
});

export default LoginScreen;