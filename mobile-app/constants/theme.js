// constants/theme.js
// Uygulama genelinde kullanılacak tema renkleri ve stillerinin tanımlandığı dosya

export const COLORS = {
    primary: '#2979FF',      // Mavi - başlıklar, aktif ikonlar için
    secondary: '#FF6D00',    // Turuncu - butonlar ve önemli aksiyonlar için
    white: '#FFFFFF',        // Arkaplan rengi
    black: '#212121',        // Metin rengi
    success: '#00C853',      // İlerleme çubukları için yeşil
    gray: '#BDBDBD',         // İkincil metin, devre dışı öğeler için
    lightGray: '#F5F5F5',    // Kartlar, ayırıcılar için
    shadow: 'rgba(0, 0, 0, 0.1)', // Gölgeler için
  };
  
  export const SIZES = {
    // Font boyutları
    largeTitle: 24,
    title: 20,
    subtitle: 18,
    body: 16,
    small: 14,
    tiny: 12,
    
    // Kenar boşlukları ve dolgu
    padding: 16,
    margin: 16,
    radius: 8,      // Köşe yuvarlaklığı
    
    // Ekran boyutları - responsive tasarım için kullanılabilir
    screenWidth: null, // Uygulama başlangıcında doldurulacak
    screenHeight: null, // Uygulama başlangıcında doldurulacak
  };
  
  export const FONTS = {
    largeTitle: { fontFamily: 'System', fontSize: SIZES.largeTitle, fontWeight: 'bold' },
    title: { fontFamily: 'System', fontSize: SIZES.title, fontWeight: 'bold' },
    subtitle: { fontFamily: 'System', fontSize: SIZES.subtitle, fontWeight: '600' },
    body: { fontFamily: 'System', fontSize: SIZES.body, fontWeight: 'normal' },
    small: { fontFamily: 'System', fontSize: SIZES.small, fontWeight: 'normal' },
    tiny: { fontFamily: 'System', fontSize: SIZES.tiny, fontWeight: 'normal' },
  };
  
  const appTheme = { COLORS, SIZES, FONTS };
  
  export default appTheme;