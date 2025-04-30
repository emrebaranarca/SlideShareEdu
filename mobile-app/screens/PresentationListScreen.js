// screens/PresentationListScreen.js
// PowerPoint sunumlarının listelendiği ana ekran

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar as RNStatusBar,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const PresentationListScreen = ({ navigation }) => {
  // Safe area insets kullanımı
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();

  
  // State tanımları
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      // AuthContext zaten navigasyonu güncelleyecek
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Sunumları API'den getiren fonksiyon
  const fetchPresentations = async () => {
    try {
      setLoading(true);
      // API isteği - öğrenci sunumlarını almak için doğru fonksiyonu kullanıyoruz
      const data = await api.getStudentPresentations();
      
      // Backend'den gelen API yanıtını doğru şekilde işle
      console.log('Gelen sunum verileri:', data);
      
      // Eğer veri bir dizi değilse ve presentations özelliği varsa, o diziyi al
      const presentationsData = Array.isArray(data) ? data : 
                               (data && data.presentations ? data.presentations : []);
      
      // Verileri state'e kaydet
      setPresentations(presentationsData);
      
      // Hata durumunu temizle
      setError(null);
    } catch (err) {
      console.error('Sunumlar yüklenirken hata oluştu:', err);
      setError('Sunumlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      // Yükleme durumunu güncelle
      setLoading(false);
      setRefreshing(false);
    }
  };
  

  // Sayfa ilk yüklendiğinde sunumları getir
  useEffect(() => {
    fetchPresentations();
  }, []);

  // Aşağı çekerek yenileme fonksiyonu
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPresentations();
  };

  // Detay sayfasına gitme fonksiyonu
  const handlePresentationPress = (item) => {
    navigation.navigate('PresentationDetail', { presentation: item });
  };

  // Tek bir sunum öğesini render eden fonksiyon
  const renderPresentationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.presentationItem}
      onPress={() => handlePresentationPress({
        ...item,
        id:item._id
      })}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.presentationInfo}>
        <Text style={styles.presentationTitle}>{item.title}</Text>
        <Text style={styles.presentationDate}>{item.date}</Text>
        <View style={styles.slidesContainer}>
          <Text style={styles.slidesText}>{item.slides} Slayt</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Boş liste durumunda gösterilecek bileşen
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Henüz sunum bulunmamaktadır.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Başlık - Güvenli alan için dinamik padding ve ortalama stillerle */}
      <View style={[
        styles.header, 
        { 
          paddingTop: Math.max(insets.top, SIZES.padding),
        }
      ]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Sunumlar</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Çıkış</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Hoş geldin, {user?.name || 'Öğrenci'}</Text>
      </View>
      
      {/* Ana içerik */}
      {loading && !refreshing ? (
        // Yükleme durumu
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color={COLORS.primary} />
          <Text style={styles.loadingText}>Sunumlar yükleniyor...</Text>
        </View>
      ) : error ? (
        // Hata durumu
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchPresentations}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Sunum listesi
        <FlatList
          data={presentations}
          keyExtractor={(item) => item.id}
          renderItem={renderPresentationItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
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
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    alignItems: 'center', // Metni ortala
    paddingBottom: SIZES.padding,
  },
  headerTitle: {
    ...FONTS.largeTitle,
    color: COLORS.primary,
    marginBottom: 4,
    textAlign: 'center', // Metni ortala
  },
  headerSubtitle: {
    ...FONTS.small,
    color: COLORS.gray,
    textAlign: 'center', // Metni ortala
  },
  listContainer: {
    padding: SIZES.padding,
    flexGrow: 1, // FlatList için önemli
  },
  presentationItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.margin,
    padding: SIZES.padding,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius / 2,
    backgroundColor: COLORS.lightGray,
  },
  presentationInfo: {
    flex: 1,
    marginLeft: SIZES.margin,
    justifyContent: 'center',
  },
  presentationTitle: {
    ...FONTS.subtitle,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 3,
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.gray,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    ...FONTS.body,
    color: COLORS.secondary,
  }
});

export default PresentationListScreen;