// screens/PPTXViewerScreen.js

import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Text,
  Alert,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { api } from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PPTXViewerScreen = ({ route, navigation }) => {
  const { presentation } = route.params;
  const [loading, setLoading] = useState(true);
  const [pptxUrl, setPptxUrl] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Sunumun PPTX dosyasını hazırla
  useEffect(() => {
    const preparePptx = async () => {
      try {
        setLoading(true);
        
        // İki olası ID formatını da kontrol et
        const presentationId = presentation._id || presentation.id;
        
        if (!presentationId) {
          console.error('Geçersiz sunum bilgisi:', presentation);
          throw new Error('Geçerli sunum bilgisi bulunamadı');
        }
        
        console.log('PPTX hazırlanıyor, sunum ID:', presentationId);
        
        // Görüntülenebilir URL almak için API çağrısı
        const viewableData = await api.getViewableUrl(presentationId);
        
        if (!viewableData || !viewableData.url) {
          throw new Error('Sunum URL alınamadı');
        }
        
        // Office Online Viewer URL'ini oluştur
        const officeViewerUrl = api.getOfficeOnlineViewerUrl(viewableData.url);
        console.log('Office Viewer URL:', officeViewerUrl);
        
        setPptxUrl(officeViewerUrl);
        
        // Kullanım istatistiklerini kaydet
        recordViewingStats(presentationId);
  
      } catch (error) {
        console.error('PPTX hazırlama hatası:', error);
        setError('Sunum dosyası hazırlanamadı. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };
    
    preparePptx();
    
    // Bileşen unmount olduğunda kullanım istatistiklerini güncelle
    return () => {
      const presentationId = presentation._id || presentation.id;
      if (presentationId) {
        updateFinalStats(presentationId);
      }
    };
  }, [presentation]);
  
  // Görüntüleme başlangıcında kullanım istatistiklerini kaydet
  const recordViewingStats = async (presentationId) => {
    try {
      await api.recordUsage({
        presentationId: presentationId,
        slidesViewed: 1,
        completionPercentage: 0,
        duration: 0
      });
    } catch (err) {
      console.warn('İstatistik kaydı hatası:', err);
    }
  };
  
  // Görüntüleme bitişinde kullanım istatistiklerini güncelle
  const updateFinalStats = async (presentationId) => {
    try {
      await api.recordUsage({
        presentationId: presentationId,
        slidesViewed: presentation.slideCount || 1,
        completionPercentage: 100,
        duration: 60
      });
    } catch (err) {
      console.warn('Son istatistik güncellemesi hatası:', err);
    }
  };

  // WebView yüklenme ilerlemesini izle
  const handleLoadProgress = ({ nativeEvent }) => {
    setProgress(nativeEvent.progress);
  };

  // WebView yükleme tamamlandığında
  const handleLoadComplete = () => {
    setLoading(false);
  };

  // WebView hata durumunda
  const handleLoadError = (error) => {
    console.error('WebView yükleme hatası:', error);
    setError('Sunum dosyası yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Üst Başlık ve Geri Butonu */}
      <View style={[
        styles.header, 
        { paddingTop: Math.max(insets.top, SIZES.padding / 2) }
      ]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{presentation.title}</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Ana İçerik */}
      <View style={styles.contentContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retryButtonText}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Sunum hazırlanıyor...</Text>
            
            {progress > 0 && progress < 1 && (
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${progress * 100}%` }
                  ]}
                />
                <Text style={styles.progressText}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            )}
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: pptxUrl }}
            style={styles.webView}
            onLoadProgress={handleLoadProgress}
            onLoadEnd={handleLoadComplete}
            onError={handleLoadError}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webviewLoadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            allowFileAccessFromFileURLs={true}
            mixedContentMode={'always'}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    zIndex: 10,
  },
  backButton: {
    width: 80,
  },
  backButtonText: {
    ...FONTS.body,
    color: COLORS.primary,
  },
  headerTitle: {
    ...FONTS.subtitle,
    color: COLORS.black,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: SIZES.padding,
  },
  placeholder: {
    width: 80,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.gray,
    marginTop: SIZES.margin,
    marginBottom: SIZES.margin,
  },
  webView: {
    flex: 1,
  },
  webviewLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  errorText: {
    ...FONTS.body,
    color: 'red',
    textAlign: 'center',
    marginBottom: SIZES.margin * 2,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  retryButtonText: {
    ...FONTS.subtitle,
    color: COLORS.white,
  },
  progressContainer: {
    width: '80%',
    height: 20,
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    marginTop: SIZES.margin,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    ...FONTS.small,
    color: COLORS.black,
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PPTXViewerScreen;