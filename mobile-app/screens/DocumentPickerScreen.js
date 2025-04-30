// screens/DocumentPickerScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Alert
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DocumentPickerScreen = ({ navigation }) => {
  const [document, setDocument] = useState(null);
  const [viewerUrl, setViewerUrl] = useState(null);
  const insets = useSafeAreaInsets();

  const pickDocument = async () => {
    try {
      // Sadece PPTX formatındaki dosyaları seçmek için
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
          'application/vnd.ms-powerpoint', // PPT
          'application/pdf' // PDF
        ],
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        console.log('Kullanıcı dosya seçmeyi iptal etti');
        return;
      }

      const selectedDocument = result.assets[0];
      console.log('Seçilen dosya:', selectedDocument);
      
      // Seçilen dosyayı sakla
      setDocument(selectedDocument);
      
      // Dosya türüne göre uygun görüntüleyici oluştur
      const fileExt = selectedDocument.name.split('.').pop().toLowerCase();
      
      if (fileExt === 'pdf') {
        // PDF doğrudan WebView'da görüntülenebilir
        setViewerUrl(selectedDocument.uri);
      } else if (fileExt === 'pptx' || fileExt === 'ppt') {
        // PPTX/PPT dosyaları için Office Online Viewer kullan
        // Not: Yerel dosyalar için bu çalışmayabilir, sadece internet üzerinden erişilebilen dosyalar için çalışır
        // Bu durumda dosyanın yüklenip bir URL alınması gerekebilir
        Alert.alert(
          'Bilgi',
          'Yerel PPTX/PPT dosyaları doğrudan görüntülenemeyebilir. Dosyayı önce bir sunucuya yüklemeniz gerekebilir.'
        );
        
        // Gerçek uygulamada, dosyayı sunucuya yükleyip URL alacak bir API çağrısı yapılmalı
        // Örnek: const uploadResult = await api.uploadPresentation(selectedDocument);
        // setViewerUrl(`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(uploadResult.url)}`);
      }
    } catch (err) {
      console.error('Dosya seçme hatası:', err);
      Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Üst Başlık */}
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
        <Text style={styles.headerTitle}>Dosya Seç ve Görüntüle</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Ana İçerik */}
      <View style={styles.content}>
        {!document ? (
          <View style={styles.pickerContainer}>
            <Text style={styles.instructionText}>
              PowerPoint veya PDF dosyalarınızı görüntülemek için aşağıdaki butona tıklayın.
            </Text>
            <TouchableOpacity 
              style={styles.pickButton}
              onPress={pickDocument}
            >
              <Text style={styles.pickButtonText}>Dosya Seç</Text>
            </TouchableOpacity>
          </View>
        ) : viewerUrl ? (
          // Dosya seçildi ve görüntülenebilir
          <View style={styles.viewerContainer}>
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>{document.name}</Text>
              <Text style={styles.documentSize}>{(document.size / 1024 / 1024).toFixed(2)} MB</Text>
            </View>
            
            <WebView
              source={{ uri: viewerUrl }}
              style={styles.webView}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Yükleniyor...</Text>
                </View>
              )}
            />
            
            <TouchableOpacity 
              style={styles.newButton}
              onPress={() => {
                setDocument(null);
                setViewerUrl(null);
              }}
            >
              <Text style={styles.newButtonText}>Yeni Dosya Seç</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Dosya seçildi ama görüntülenemedi
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Seçilen dosya türü doğrudan görüntülenemedi. PDF dosyalarını deneyebilir veya PPTX dosyalarınızı paylaşım için bir URL'e sahip olduğunda görüntüleyebilirsiniz.
            </Text>
            <TouchableOpacity 
              style={styles.newButton}
              onPress={() => {
                setDocument(null);
              }}
            >
              <Text style={styles.newButtonText}>Yeni Dosya Seç</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    flex: 1,
    padding: SIZES.padding,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  instructionText: {
    ...FONTS.body,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.margin * 2,
  },
  pickButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 3,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  pickButtonText: {
    ...FONTS.subtitle,
    color: COLORS.white,
  },
  viewerContainer: {
    flex: 1,
  },
  documentInfo: {
    marginBottom: SIZES.margin,
  },
  documentTitle: {
    ...FONTS.subtitle,
    color: COLORS.black,
  },
  documentSize: {
    ...FONTS.small,
    color: COLORS.gray,
  },
  webView: {
    flex: 1,
    marginVertical: SIZES.margin,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.gray,
  },
  newButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: SIZES.margin,
  },
  newButtonText: {
    ...FONTS.subtitle,
    color: COLORS.white,
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
});

export default DocumentPickerScreen;