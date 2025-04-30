// services/api.js - getViewableUrl ve getGoogleDocsViewerUrl fonksiyonları düzeltildi

import * as FileSystem from "expo-file-system";
import { shareAsync } from "expo-sharing";
import { mockPresentations } from "../constants/mockData"; // Mock verileri içe aktar
import { getAuthToken, saveAuthData, clearAuthData } from '../utils/authStorage';

// İndirilen dosyaların bilgilerini saklamak için
let downloadedPresentations = {};

// API metodları
export const api = {
  // Tüm sunumları getir
  getPresentations: async () => {
    // API isteği simülasyonu
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockPresentations);
      }, 800); // 800ms gecikme ile yanıt döndür
    });
  },

  // ID'ye göre sunum detaylarını getir
  getPresentationById: async (id) => {
    // API isteği simülasyonu
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const presentation = mockPresentations.find((p) => p.id === id);
        if (presentation) {
          // Eğer bu sunum daha önce indirilmişse, dosya yolu bilgisini ekle
          if (downloadedPresentations[id]) {
            presentation.localFilePath = downloadedPresentations[id].filePath;
          }
          resolve(presentation);
        } else {
          reject(new Error("Sunum bulunamadı"));
        }
      }, 600);
    });
  },

  // Dosyayı indir ve paylaş
  downloadAndShare: async (url, fileName) => {
    try {
      // İndirme klasörü oluştur
      const destFolder = `${FileSystem.documentDirectory}downloads/`;
      const destUri = `${destFolder}${fileName}`;

      const dirInfo = await FileSystem.getInfoAsync(destFolder);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(destFolder, {
          intermediates: true,
        });
      }

      // Dosyayı indir
      const downloadResult = await FileSystem.downloadAsync(url, destUri);
      console.log("İndirme tamamlandı:", downloadResult);

      // Paylaş
      await shareAsync(downloadResult.uri);

      return {
        success: true,
        filePath: downloadResult.uri,
      };
    } catch (error) {
      console.error("İndirme veya paylaşma hatası:", error);
      throw error;
    }
  },

  // Sunumu indir - online bir kaynaktan indirme
  downloadPresentation: async (id) => {
    try {
      // Sunumu bul
      const presentation = mockPresentations.find((p) => p.id === id);
      if (!presentation) {
        throw new Error("Sunum bulunamadı");
      }

      // İndirme klasörü oluştur (eğer yoksa)
      const destFolder = `${FileSystem.documentDirectory}downloads/`;
      const destUri = `${destFolder}${presentation.fileName}`;

      const dirInfo = await FileSystem.getInfoAsync(destFolder);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(destFolder, {
          intermediates: true,
        });
      }

      // Gerçek bir URL'den indirme işlemi
      console.log(`Dosya indiriliyor: ${presentation.downloadUrl}`);
      const downloadResult = await FileSystem.downloadAsync(
        presentation.downloadUrl,
        destUri
      );

      // İndirilen dosya bilgisini kaydet
      downloadedPresentations[id] = {
        filePath: downloadResult.uri,
        fileSize: (await FileSystem.getInfoAsync(downloadResult.uri)).size,
        downloadDate: new Date().toISOString(),
      };

      // Başarılı sonuç döndür
      return {
        success: true,
        fileName: presentation.fileName,
        filePath: downloadResult.uri,
        fileSize: (await FileSystem.getInfoAsync(downloadResult.uri)).size,
      };
    } catch (error) {
      console.error("İndirme hatası:", error);
      throw error;
    }
  },

  // Dosya paylaşımı
  shareFile: async (filePath) => {
    try {
      if (!filePath) {
        throw new Error("Paylaşılacak dosya bulunamadı");
      }

      // Dosyanın var olup olmadığını kontrol et
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error("Paylaşılacak dosya bulunamadı");
      }

      // Dosyayı paylaş
      await shareAsync(filePath);
      return { success: true };
    } catch (error) {
      console.error("Dosya paylaşım hatası:", error);
      throw error;
    }
  },

  // İndirilmiş dosyaların listesini getir
  getDownloadedPresentations: () => {
    return downloadedPresentations;
  },

  studentLogin: async (email, password) => {
    try {
      // Gerçek bir API isteğinin simülasyonu
      // NOT: Gerçek API'ye bağlamak için fetch veya axios kullanılmalı
      console.log('Giriş yapılıyor:', email);
      
      const response = await fetch('http://localhost:3000/api/students/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Giriş yanıtı:', data);
      
      if (!response.ok) {
        throw new Error(data.msg || 'Giriş başarısız');
      }
      
      // Token'ı ve kullanıcı bilgilerini saklama işlemi
      await saveAuthData(data);
      
      return data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  
  // Öğrenci profilini getir
  getStudentProfile: async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Kimlik doğrulama gerekli');
      }
      
      const response = await fetch('http://localhost:3000/api/students/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || 'Profil bilgileri alınamadı');
      }
      
      return data;
    } catch (error) {
      console.error('Get profile API error:', error);
      throw error;
    }
  },
  
  // Öğrenci için sunumları getir
  getStudentPresentations: async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Kimlik doğrulama gerekli');
      }
      
      const response = await fetch('http://localhost:3000/api/students/presentations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      const data = await response.json();
      console.log('Sunumlar:', data);
      
      if (!response.ok) {
        throw new Error(data.msg || 'Sunumlar alınamadı');
      }
      
      return data;
    } catch (error) {
      // Mock veri ile devam edebilmek için hata durumunda mock verileri döndür
      console.warn('Sunumlar alınamadı, mock veriler kullanılıyor:', error);
      return mockPresentations; 
    }
  },
  
  // Kullanım istatistiklerini kaydet
  recordUsage: async (data) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Kimlik doğrulama gerekli');
      }
      
      const response = await fetch('http://localhost:3000/api/students/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.msg || 'Kullanım verisi kaydedilemedi');
      }
      
      return responseData;
    } catch (error) {
      console.error('Record usage API error:', error);
      // Kritik olmayan bir hata, sadece loglama yap
      return { success: false, error: error.message };
    }
  },
  
  // Öğrencinin kendi istatistiklerini getir
  getStudentStats: async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Kimlik doğrulama gerekli');
      }
      
      const response = await fetch('http://localhost:3000/api/students/my-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || 'İstatistikler alınamadı');
      }
      
      return data;
    } catch (error) {
      console.error('Get stats API error:', error);
      throw error;
    }
  },
  
  // Öğrenci çıkış yap
  studentLogout: async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        // Zaten giriş yapılmamış
        return { success: true };
      }
      
      // Sunucuda oturumu sonlandır
      await fetch('http://localhost:3000/api/students/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });
      
      // Yerel depolamadan kimlik bilgilerini temizle
      await clearAuthData();
      
      return { success: true };
    } catch (error) {
      console.error('Logout API error:', error);
      // Hata olsa bile yerel verileri temizle
      await clearAuthData();
      return { success: true }; 
    }
  },

  // Sunum slaytlarını alma
  getSlideImages: async (presentationId) => {
    try {
      // Gerçek uygulamada, sunucudan slayt görüntülerini alacak bir API çağrısı yapılabilir
      // Şimdilik, mock veri ile simüle edelim
      
      // Sunumu bul
      const presentation = mockPresentations.find(p => p.id === presentationId);
      if (!presentation) {
        throw new Error('Sunum bulunamadı');
      }
      
      // Tüm slaytlar için aynı küçük resmi kullanacağız (gerçek uygulamada her slaytın kendi görüntüsü olur)
      const slidesCount = presentation.slides || 10; // Varsayılan olarak 10 slayt
      
      // Her slayt için mock görüntü oluştur
      const slideImages = [];
      for (let i = 0; i < slidesCount; i++) {
        slideImages.push({
          id: i + 1,
          uri: presentation.thumbnail, // Gerçek uygulamada her slayt için farklı bir URI olacak
          title: `Slayt ${i + 1}`
        });
      }
      
      return {
        success: true,
        slideImages,
        totalSlides: slidesCount
      };
    } catch (error) {
      console.error('Slayt görüntüleri alma hatası:', error);
      throw error;
    }
  },
  

  
  // Google Docs Viewer URL'i oluştur
  getGoogleDocsViewerUrl: (fileUrl) => {
    if (!fileUrl) {
      console.error('URL boş veya tanımsız');
      return '';
    }
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  },
  
  // Microsoft Office Online Viewer URL'i oluştur (alternatif)
  getOfficeOnlineViewerUrl: (fileUrl) => {
    if (!fileUrl) {
      console.error('URL boş veya tanımsız');
      return '';
    }
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  },


  getViewableUrl: async (presentationId) => {
    try {
      // ID kontrolü yap
      if (!presentationId || presentationId === 'undefined') {
        console.error('Geçersiz ID:', presentationId);
        throw new Error('Geçerli bir sunum ID gerekli');
      }
      
      console.log(`getViewableUrl için kullanılan ID: ${presentationId}`);
      
      // Kimlik doğrulama token'ını al
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Oturum süresi dolmuş veya giriş yapılmamış');
      }
      
      // API isteği yap
      console.log('API isteği yapılıyor:', `http://localhost:3000/api/students/presentations/${presentationId}/share`);
      
      const response = await fetch(`http://localhost:3000/app/api/students/presentations/${presentationId}/share`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });
      
      // HTTP durum kodunu kontrol et
      console.log('HTTP Status:', response.status);
      
      // Eğer "Not Found" hatası ise, özel olarak işle
      if (response.status === 404) {
        throw new Error('Sunum bulunamadı - ID: ' + presentationId);
      }
      
      // Ham yanıtı al
      const responseText = await response.text();
      console.log('API yanıtı (ham):', responseText);
      
      // Yanıt boşsa veya geçersizse, anlamlı bir hata fırlat
      if (!responseText || responseText.trim() === '') {
        throw new Error('Sunucudan boş yanıt alındı');
      }
      
      // "Not found" düz metin yanıtı için özel işleme
      if (responseText.trim() === 'Not found') {
        throw new Error('Sunum bulunamadı - Sunucu "Not found" yanıtı verdi');
      }
      
      // JSON parse işlemi
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parse hatası:', jsonError);
        throw new Error(`API yanıtı JSON formatında değil: ${responseText}`);
      }
      
      // API hata yanıtı
      if (!response.ok) {
        console.error('API hata yanıtı:', data);
        throw new Error(data.msg || 'Sunum URL alınamadı');
      }
      
      // URL kontrolü
      if (!data || !data.url) {
        console.error('Geçersiz API yanıtı:', data);
        throw new Error('Sunum URL bulunamadı - Geçersiz API yanıtı');
      }
      
      console.log('API başarılı yanıt:', data);
      return data;
      
    } catch (error) {
      console.error('Görüntülenebilir URL alma hatası:', error);
      
      // Geliştirme amaçlı: Örnek bir sunum dosyası URL'si döndür
      // Gerçek uygulamada bu kısmı kaldırın
      console.warn('Örnek sunum URL kullanılıyor!');
      return {
        success: true,
        url: "https://file-examples.com/storage/fe19e15eac6560f8c936fc3/2017/08/file_example_PPT_1MB.ppt",
        fileName: "ornek_sunum.ppt",
        expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 saat sonra
      };
    }
  },
  
  // Kullanım istatistiklerini kaydet
  recordUsage: async (data) => {
    try {
      // presentationId valid mi diye kontrol et
      if (!data.presentationId) {
        console.warn('Geçersiz presentationId ile kayıt isteği');
        return { success: false, error: 'Geçersiz sunum ID' };
      }
      
      console.log('Kaydedilecek kullanım verisi:', data);
      
      const token = await getAuthToken();
      if (!token) {
        console.warn('Kimlik doğrulama bulunamadı');
        return { success: false, error: 'Kimlik doğrulama gerekli' };
      }
      
      // API'nin beklediği parametre isimlerini kullan
      const apiData = {
        presentationId: data.presentationId, // Backend'in beklediği adlandırma
        slidesViewed: data.slidesViewed || 0,
        completionPercentage: data.completionPercentage || 0,
        duration: data.duration || 0
      };
      
      try {
        const response = await fetch('http://localhost:3000/api/students/usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
          },
          body: JSON.stringify(apiData),
        });
  
        const responseData = await response.json();
        
        if (!response.ok) {
          console.warn('API kullanım kaydı hatası:', responseData);
          return { success: false, error: responseData.msg || 'Kullanım verisi kaydedilemedi' };
        }
        
        console.log('Kullanım verisi başarıyla kaydedildi');
        return responseData;
      } catch (apiError) {
        console.warn('API erişim hatası:', apiError);
        // Kritik olmayan bir hata, sadece loglama yap
        return { success: false, error: apiError.message };
      }
    } catch (error) {
      console.error('Record usage API error:', error);
      // Kritik olmayan bir hata, sadece loglama yap
      return { success: false, error: error.message };
    }
  },

  
  // PDF dosyasını indirme
  downloadPdf: async (presentationId) => {
    try {
      // Önce PDF URL'ini al
      const pdfData = await api.getPdfViewableUrl(presentationId);
      
      if (!pdfData.pdfUrl) {
        throw new Error('PDF URL bulunamadı');
      }
      
      // PDF dosya adını hazırla
      const fileName = pdfData.fileName.replace('.pptx', '.pdf');
      
      // İndirme klasörü oluştur (eğer yoksa)
      const destFolder = `${FileSystem.documentDirectory}downloads/`;
      const destUri = `${destFolder}${fileName}`;
  
      const dirInfo = await FileSystem.getInfoAsync(destFolder);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(destFolder, {
          intermediates: true,
        });
      }
  
      // Dosya zaten varsa, önce kontrol et
      const fileInfo = await FileSystem.getInfoAsync(destUri);
      if (fileInfo.exists) {
        console.log('PDF dosyası zaten mevcut:', destUri);
        return {
          success: true,
          fileName: fileName,
          filePath: destUri,
          fileSize: fileInfo.size,
          cached: true,
        };
      }
  
      // Dosyayı indir
      console.log(`PDF indiriliyor: ${pdfData.pdfUrl}`);
      const downloadResult = await FileSystem.downloadAsync(
        pdfData.pdfUrl,
        destUri
      );
  
      console.log('PDF indirme tamamlandı:', downloadResult);
  
      // Başarılı sonuç döndür
      return {
        success: true,
        fileName: fileName,
        filePath: downloadResult.uri,
        fileSize: (await FileSystem.getInfoAsync(downloadResult.uri)).size,
        cached: false,
      };
    } catch (error) {
      console.error('PDF indirme hatası:', error);
      throw error;
    }
  },

  getOfficeOnlineViewerUrl: (fileUrl) => {
    if (!fileUrl) {
      console.error('URL boş veya tanımsız');
      return '';
    }
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  },
  
  // Google Docs Viewer URL'i oluştur (alternatif görüntüleyici)
  getGoogleDocsViewerUrl: (fileUrl) => {
    if (!fileUrl) {
      console.error('URL boş veya tanımsız');
      return '';
    }
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  },


  
};


