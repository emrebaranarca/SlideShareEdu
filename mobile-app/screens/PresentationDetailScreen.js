// screens/PresentationDetailScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const PresentationDetailScreen = ({ route, navigation }) => {
  // Safe area insets kullanımı
  const insets = useSafeAreaInsets();
  
  // Route parametresinden sunum id'sini al
  const { presentation: initialPresentation } = route.params;

  const [presentation, setPresentation] = useState(initialPresentation);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showWebView, setShowWebView] = useState(false);
  const [viewerURL, setViewerURL] = useState(null);
  const [preparingViewer, setPreparingViewer] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const webViewRef = useRef(null);
  
  // Sunum detaylarını getir (API'den daha fazla detay almak için)
  useEffect(() => {
    const fetchPresentationDetails = async () => {
      if (!initialPresentation?.id) return;
      
      try {
        setLoading(true);
        const detailedPresentation = await api.getPresentationById(initialPresentation.id);
        setPresentation(detailedPresentation);
        
        // Sunum açıldığında başlangıç kullanım istatistiklerini kaydet
        await recordUsageStats(detailedPresentation.id, 1, 0, 0);
      } catch (error) {
        console.error('Sunum detayı yüklenirken hata:', error);
        Alert.alert('Hata', 'Sunum detayları yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPresentationDetails();
    
    // Bileşen unmount olduğunda (ekran kapatıldığında) son kullanım istatistiklerini kaydet
    return () => {
      if (presentation?.id) {
        // Görüntülenen slayt sayısı, tamamlanma yüzdesi ve süre verileri gerçek kullanıma göre hesaplanmalı
        const slidesViewed = presentation.slides || 1; // Varsayılan olarak tüm slaytları gördüğünü varsayalım
        const completionPercentage = 100; // %100 tamamlandı varsayalım
        const duration = 60; // 60 saniye geçirildiğini varsayalım - gerçek uygulamada süre ölçümü yapılmalı
        
        recordUsageStats(presentation.id, slidesViewed, completionPercentage, duration)
          .catch(err => console.warn('Sunum kapatılırken istatistik kaydedilemedi:', err));
      }
    };
  }, [initialPresentation?.id]);
  
  // Kullanım istatistiklerini kaydeden yardımcı fonksiyon
  const recordUsageStats = async (presentationId, slidesViewed, completionPercentage, duration) => {
    try {
      if (!presentationId) return;
      
      await api.recordUsage({
        presentationId,
        slidesViewed,
        completionPercentage,
        duration
      });
      console.log('Kullanım istatistikleri kaydedildi:', { presentationId, slidesViewed, completionPercentage, duration });
      return true;
    } catch (error) {
      console.warn('Kullanım istatistiği kayıt hatası:', error);
      // Kritik olmayan hata, UI'de göstermeye gerek yok
      return false;
    }
  };

  const handleViewPresentation = async () => {
    try {
      setPreparingViewer(true);
      const presentationId = presentation._id || presentation.id;
      
      // ID'nin geçirildiğinden emin ol
      if (!presentationId) {
        console.error('Sunum ID bulunamadı:', presentation);
        throw new Error('Sunum bilgisi eksik');
      }
      
      console.log('Görüntülenecek sunum ID:', presentationId);
      
      // Görüntülenebilir URL'i al
      const viewableData = await api.getViewableUrl(presentationId);
      console.log('Görüntülenebilir veri:', viewableData);
      
      if (!viewableData || !viewableData.url) {
        throw new Error('Sunum URL alınamadı');
      }
      
      // Office Online Viewer URL'ini oluştur
      const officeViewerUrl = api.getOfficeOnlineViewerUrl(viewableData.url);
      console.log('Office Viewer URL:', officeViewerUrl);
      
      // URL'i state'e kaydet ve WebView'i göster
      setViewerURL(officeViewerUrl);
      setShowWebView(true);
      
      // Kullanım istatistiklerini kaydet
      await recordUsageStats(presentationId, 1, 0, 0);
    } catch (error) {
      console.error('Sunum hazırlama hatası:', error);
      Alert.alert('Hata', 'Sunum görüntülemek için hazırlanamadı. Lütfen tekrar deneyin.');
    } finally {
      setPreparingViewer(false);
    }
  };
  
  // WebView'i kapatma işlemi
  const handleCloseWebView = () => {
    setShowWebView(false);
    // Kapattığımızda kullanım istatistiklerini güncelle
    if (presentation?.id) {
      const presentationId = presentation._id || presentation.id;
      recordUsageStats(presentationId, presentation.slides || 1, 100, 60);
    }
  };
  
  // İndirme işlemi
  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloadProgress(0);
      
      // İndirme simülasyonu için zamanlayıcı
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          const newProgress = prev + 0.1;
          if (newProgress >= 1) {
            clearInterval(progressInterval);
            return 1;
          }
          return newProgress;
        });
      }, 200);
      
      // İndirme işlemini başlat
      const downloadResult = await api.downloadPresentation(presentation.id);
      
      // İndirme başarıyla tamamlandı - zamanlayıcıyı temizle ve kullanıcıya bildir
      clearInterval(progressInterval);
      setDownloadProgress(1);
      
      Alert.alert(
        'Başarılı',
        `"${presentation.title}" başarıyla indirildi.`,
        [
          {
            text: 'Paylaş',
            onPress: () => shareFile(downloadResult.filePath),
          },
          { 
            text: 'Tamam', 
            onPress: () => setDownloading(false) 
          }
        ]
      );
    } catch (error) {
      console.error('İndirme hatası:', error);
      Alert.alert('Hata', 'Sunum indirilemedi. Lütfen tekrar deneyin.');
      setDownloading(false);
    }
  };

  // Dosya paylaşma fonksiyonu
  const shareFile = async (filePath) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Paylaşım Kullanılamıyor', 'Bu cihazda dosya paylaşımı desteklenmiyor.');
        return;
      }
      
      await Sharing.shareAsync(filePath);
    } catch (error) {
      console.error('Paylaşım hatası:', error);
      Alert.alert('Hata', 'Dosya paylaşılamadı.');
    } finally {
      setDownloading(false);
    }
  };

  // WebView yüklenme ilerlemesini izle
  const handleLoadProgress = ({ nativeEvent }) => {
    setWebViewLoading(nativeEvent.progress < 1);
  };

  // WebView hata durumunda
  const handleLoadError = (error) => {
    console.error('WebView yükleme hatası:', error);
    Alert.alert('Hata', 'Sunum yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    setShowWebView(false);
  };

  // WebView'dan çıkış yaptığında
  const handleWebViewClose = () => {
    setShowWebView(false);
  };

  if (showWebView && viewerURL) {
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
            onPress={handleCloseWebView}
          >
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{presentation.title}</Text>
          <View style={styles.placeholder} />
        </View>
        
        {/* WebView İçeriği */}
        <View style={styles.webViewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: viewerURL }}
            style={styles.webView}
            onLoadProgress={handleLoadProgress}
            onError={handleLoadError}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webviewLoadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Sunum yükleniyor...</Text>
              </View>
            )}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            allowFileAccessFromFileURLs={true}
            mixedContentMode={'always'}
          />
          
          {webViewLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.white} />
              <Text style={styles.loadingOverlayText}>Yükleniyor...</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Üst Başlık ve Geri Butonu - Güvenli alan için dinamik padding */}
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
        <Text style={styles.headerTitle}>Sunum Detayı</Text>
        <View style={styles.placeholder} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color={COLORS.primary} />
          <Text style={styles.loadingText}>Sunum yükleniyor...</Text>
        </View>
      ) : !presentation ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Sunum bulunamadı</Text>
        </View>
      ) : (
        <ScrollView style={styles.contentContainer}>
          {/* Sunum Bilgileri */}
          <View style={styles.presentationHeader}>
            <Image
              source={{ uri: presentation.thumbnail }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.titleContainer}>
              <Text style={styles.presentationTitle}>{presentation.title}</Text>
              <Text style={styles.presentationDate}>{presentation.date}</Text>
              <View style={styles.slidesContainer}>
                <Text style={styles.slidesText}>{presentation.slides} Slayt</Text>
              </View>
            </View>
          </View>
          
          {/* Dosya bilgisi */}
          <View style={styles.fileInfoContainer}>
            <Text style={styles.fileInfoTitle}>Dosya Adı:</Text>
            <Text style={styles.fileInfoText}>{presentation.fileName}</Text>
          </View>
          
          {/* Açıklama */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Açıklama</Text>
            <Text style={styles.descriptionText}>{presentation.description}</Text>
          </View>

          {/* Sunumu Görüntüle Butonu */}
          <TouchableOpacity
            style={[
              styles.viewButton,
              preparingViewer && styles.buttonDisabled
            ]}
            onPress={handleViewPresentation}
            disabled={preparingViewer}
          >
            <Text style={styles.viewButtonText}>
              {preparingViewer ? 'Hazırlanıyor...' : 'Sunumu Görüntüle'}
            </Text>
          </TouchableOpacity>
          
          {preparingViewer && (
            <View style={styles.loadingSpinnerContainer}>
              <LoadingSpinner size={30} color={COLORS.primary} />
            </View>
          )}
          
          {/* İndirme Butonu */}
          <TouchableOpacity
            style={[
              styles.downloadButton,
              downloading && styles.downloadButtonDisabled
            ]}
            onPress={handleDownload}
            disabled={downloading}
          >
            <Text style={styles.downloadButtonText}>
              {downloading ? 'İndiriliyor...' : 'Sunumu İndir'}
            </Text>
          </TouchableOpacity>
          
          {/* İndirme İlerleme Çubuğu */}
          {downloading && (
            <View>
              <View style={styles.progressContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${downloadProgress * 100}%` }
                  ]} 
                />
                <Text style={styles.progressText}>
                  {Math.round(downloadProgress * 100)}%
                </Text>
              </View>
              {downloadProgress < 1 && (
                <View style={styles.loadingSpinnerContainer}>
                  <LoadingSpinner size={30} color={COLORS.secondary} />
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
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
    padding: SIZES.padding,
  },
  presentationHeader: {
    flexDirection: 'row',
    marginBottom: SIZES.margin * 2,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.lightGray,
  },
  titleContainer: {
    flex: 1,
    marginLeft: SIZES.margin,
    justifyContent: 'center',
  },
  presentationTitle: {
    ...FONTS.title,
    color: COLORS.black,
    marginBottom: 4,
  },
  presentationDate: {
    ...FONTS.small,
    color: COLORS.gray,
    marginBottom: 6,
  },
  slidesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slidesText: {
    ...FONTS.tiny,
    color: COLORS.primary,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.margin,
    paddingBottom: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  fileInfoTitle: {
    ...FONTS.body,
    fontWeight: 'bold',
    color: COLORS.black,
    marginRight: 8,
  },
  fileInfoText: {
    ...FONTS.body,
    color: COLORS.gray,
  },
  descriptionContainer: {
    marginBottom: SIZES.margin * 2,
  },
  descriptionTitle: {
    ...FONTS.subtitle,
    color: COLORS.black,
    marginBottom: SIZES.margin,
  },
  descriptionText: {
    ...FONTS.body,
    color: COLORS.black,
    lineHeight: 22,
  },
  viewButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: SIZES.margin * 2,
  },
  viewButtonText: {
    ...FONTS.subtitle,
    color: COLORS.white,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray,
  },
  downloadButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  downloadButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  downloadButtonText: {
    ...FONTS.subtitle,
    color: COLORS.white,
  },
  progressContainer: {
    height: 20,
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    marginVertical: SIZES.margin,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  progressText: {
    ...FONTS.small,
    color: COLORS.black,
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.gray,
    marginTop: SIZES.margin,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...FONTS.body,
    color: 'red',
  },
  loadingSpinnerContainer: {
    alignItems: 'center',
    marginTop: SIZES.margin,
    marginBottom: SIZES.margin,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    ...FONTS.body,
    color: COLORS.white,
    marginTop: SIZES.margin,
  },
});

export default PresentationDetailScreen;