# 📚 SlideShareEdu - Eğitimde Teknoloji, Öğretmende Kolaylık

SlideShareEdu, öğretmenlerin öğrencileriyle PowerPoint sunumlarını kolay ve etkin bir şekilde paylaşabilmeleri için geliştirilmiş açık kaynaklı bir eğitim platformudur. Bu platform, öğretmenlere sunumlarını yönetebilecekleri bir web paneli ve öğrencilere bu sunumlara erişebilecekleri bir mobil uygulama sunmaktadır.

---

## 🎯 Amaç ve Hedefler

- **Öğretmenlere** sunumlarını merkezi bir sistemde yönetme imkanı sağlamak  
- **Öğrencilere** zaman ve mekan kısıtlaması olmadan ders materyallerine erişim sunmak  
- **Öğrenci katılımını ve çalışma alışkanlıklarını takip etmek**  
- Açık kaynak kodlu ve özgürce kullanılabilir bir eğitim aracı sunmak  

---

## 🏗️ Proje Mimarisi

SlideShareEdu üç ana bileşenden oluşmaktadır:

### 1. Backend Sunucu (`Express.js & MongoDB`)

Backend, tüm sistemin omurgasını oluşturur ve aşağıdaki görevleri yerine getirir:
- Kullanıcı kimlik doğrulama ve yetkilendirme  
- Sunum dosyalarını depolama ve yönetme  
- Kullanım istatistiklerini toplama ve raporlama  
- Admin paneli ve mobil uygulama için API sunma  

### 2. Web Yönetim Paneli (`React.js`)

Öğretmenler ve yöneticiler için geliştirilmiş web arayüzü:
- PowerPoint sunumlarını yükleme ve yönetme  
- Öğrenci hesaplarını oluşturma ve yönetme  
- Kullanım istatistiklerini ve raporları görüntüleme  
- Sistem ayarlarını yapılandırma  

### 3. Mobil Uygulama (`React Native`)

Öğrenciler için geliştirilmiş kullanıcı dostu mobil uygulama:
- Öğrenci hesabı ile giriş yapma  
- Sunumları görüntüleme ve indirme  
- Slaytlar arasında ileri-geri gezinme  
- Kişisel kullanım istatistiklerini görüntüleme  

---

## 🚀 Kurulum

### Backend Kurulumu

```bash
# Projeyi klonlayın
git clone https://github.com/kullaniciadi/SlideShareEdu.git
cd SlideShareEdu/backend

# Bağımlılıkları yükleyin
npm install

# .env dosyasını oluşturun (örnek dosyadan)
cp .env.example .env

# .env dosyasını düzenleyin ve gerekli değişkenleri ayarlayın
# MongoDB bağlantı bilgileri, JWT anahtarı vb.

# Sunucuyu başlatın
npm start

````

### Web Panel Kurulumu
```bash

# Web panel dizinine geçin
cd ../admin-panel

# Bağımlılıkları yükleyin
npm install

# .env dosyasını oluşturun ve API URL'ini ayarlayın
echo "REACT_APP_API_URL=http://localhost:3000/api" > .env

# Geliştirme sunucusunu başlatın
npm start

# Veya üretim için build alın
npm run build
````
### Mobil Uygulama Kurulumu
```bash

# Mobil uygulama dizinine geçin
cd ../mobile-app

# Bağımlılıkları yükleyin
npm install

# API URL'ini ayarlayın (mobile-app/constants/config.js dosyasını düzenleyin)

# Uygulamayı başlatın
npx expo start
````
## 📱 Mobil Uygulama Özellikleri

- **Kimlik Doğrulama**: Güvenli öğrenci girişi
- **Sunum Listeleme**: Öğrenciye atanmış tüm sunumları görüntüleme
- **Sunum Görüntüleme**: PowerPoint dosyalarını doğrudan uygulama içinde açma
- **Slayt Gezinme**: Dokunmatik kontroller ile slaytlar arası gezinme
- **Çevrimdışı Erişim**: Sunumları indirme ve internet bağlantısı olmadan erişim
- **Kullanım İstatistikleri**: Görüntülenen slayt sayısı, geçirilen süre gibi verileri otomatik olarak toplama

## 💻 Web Panel Özellikleri

- **Dashboard**: Genel kullanım istatistikleri ve sistem durumu
- **Sunum Yönetimi**: PowerPoint dosyalarını yükleme, düzenleme ve silme
- **Öğrenci Yönetimi**: Öğrenci hesaplarını oluşturma, düzenleme ve silme
- **İstatistikler**: Detaylı kullanım raporları ve grafikler
- **Ayarlar**: Sistem yapılandırması ve tercihler

## 🔧 Teknik Detaylar

### Backend Teknolojileri

- **Node.js & Express**: API sunucusu
- **MongoDB**: Veritabanı
- **JWT**: Kimlik doğrulama
- **bcrypt**: Şifre hashleme
- **Multer**: Dosya yükleme

### Web Panel Teknolojileri

- **React.js**: Kullanıcı arayüzü
- **React Router**: Sayfa yönlendirmeleri
- **Axios**: API istekleri
- **CSS3**: Stil ve düzen

### Mobil Uygulama Teknolojileri

- **React Native**: Çapraz platform mobil geliştirme
- **Expo**: Geliştirme ve dağıtım araçları
- **React Navigation**: Ekran yönlendirmeleri
- **Async Storage**: Yerel depolama
- **FileSystem**: Dosya işlemleri

## 📊 Veri Yapısı

### Kullanıcılar (Users)

- **Admin**: Sunumları yönetir ve öğrenci hesaplarını oluşturur
- **Öğrenci**: Sunumları görüntüler ve kullanım verileri toplanır

### Sunumlar (Presentations)

- Başlık, açıklama, dosya yolu, yüklenme tarihi gibi bilgiler
- Slayt sayısı ve diğer meta veriler

### Kullanım İstatistikleri (UsageStats)

- Hangi öğrenci, hangi sunumu, ne kadar süre görüntüledi
- Tamamlama yüzdesi ve görüntülenen slayt sayısı

## 🚀 Katkıda Bulunma

SlideShareEdu açık kaynaklı bir projedir ve katkılarınıza açıktır. Katkıda bulunmak için:

1. Projeyi forklayın
2. Yeni bir branch oluşturun (`git checkout -b ozellik/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik: Açıklama'`)
4. Branch'inizi push edin (`git push origin ozellik/yeni-ozellik`)
5. Pull Request açın

## 📝 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır. Detaylar için lisans dosyasını inceleyebilirsiniz.

## 📷 Ekran Görüntüleri

### Web Yönetim Paneli

#### Dashboard
![](./screenshots/web/Ekran%20Resmi%202025-04-25%2016.46.37.png)
![](./screenshots/web/Ekran%20Resmi%202025-04-25%2016.47.03.png)
![](./screenshots/web/Ekran%20Resmi%202025-04-25%2016.47.17.png)
![](./screenshots/web/Ekran%20Resmi%202025-04-25%2016.47.24.png)
![](./screenshots/web/Ekran%20Resmi%202025-04-25%2016.47.33.png)
![](./screenshots/web/Ekran%20Resmi%202025-04-25%2016.47.43.png)

### Mobil Uygulama Ekranları

<p align="center">
  <img src="./screenshots/mobil/IMG_2748.PNG" width="200" alt="Giriş Ekranı">
  <img src="./screenshots/mobil/IMG_2749.PNG" width="200" alt="Ana Ekran">
  <img src="./screenshots/mobil/IMG_2750.PNG" width="200" alt="Sunum Detayı">
    <img src="./screenshots/mobil/IMG_2751.PNG" width="200" alt="Sunum Detayı">
</p>



## 📞 İletişim

Sorularınız veya önerileriniz için lütfen GitHub üzerinden issue açın veya pull request gönderin.


