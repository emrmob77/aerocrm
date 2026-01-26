# GitHub Repository Kurulum Rehberi

Bu rehber, AERO CRM projesini GitHub hesabınıza (`emrmob77`) yüklemeniz için adım adım talimatlar içerir.

## 🚀 Hızlı Kurulum

### Adım 1: GitHub'da Repository Oluşturun

1. [GitHub'da yeni repository oluştur](https://github.com/new) sayfasına gidin
2. Repository bilgilerini doldurun:
   - **Repository name**: `aerocrm` (veya istediğiniz isim)
   - **Description**: "Modern satış ekipleri için kapsamlı CRM ve teklif hazırlama platformu"
   - **Visibility**: Public veya Private seçin
   - ⚠️ **ÖNEMLİ**: "Initialize this repository with a README" seçeneğini **İŞARETLEMEYİN**
3. "Create repository" butonuna tıklayın

### Adım 2: Yerel Git Repository'yi Hazırlayın

Terminal'de proje klasörüne gidin ve şu komutları çalıştırın:

```bash
cd /Users/emrah/Desktop/aerocrm

# Git repository başlat
git init

# Git kullanıcı bilgilerini ayarla
git config user.name "emrmob77"
git config user.email "emrmob77@users.noreply.github.com"

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit: AERO CRM platform setup with requirements and design docs"

# Main branch oluştur
git branch -M main

# GitHub remote ekle (repository adınızı kullanın)
git remote add origin https://github.com/emrmob77/aerocrm.git
```

### Adım 3: GitHub'a Push Edin

```bash
# Dosyaları GitHub'a yükle
git push -u origin main
```

Eğer GitHub'da authentication sorunu yaşarsanız:

1. **Personal Access Token kullanın** (önerilen):
   - [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - "Generate new token (classic)" tıklayın
   - `repo` yetkisini seçin
   - Token'ı kopyalayın
   - Push sırasında şifre yerine token'ı kullanın

2. **Veya SSH kullanın**:
   ```bash
   git remote set-url origin git@github.com:emrmob77/aerocrm.git
   git push -u origin main
   ```

## 📋 Otomatik Kurulum Scripti

Alternatif olarak, hazırladığım script'i kullanabilirsiniz:

```bash
# Script'e çalıştırma izni ver
chmod +x setup-github.sh

# Script'i çalıştır
./setup-github.sh
```

Script çalıştıktan sonra, GitHub'da repository oluşturup `git push -u origin main` komutunu çalıştırmanız yeterli.

## ✅ Kontrol

Repository başarıyla yüklendikten sonra:

- Repository URL: `https://github.com/emrmob77/aerocrm`
- README.md dosyası otomatik olarak görünecek
- Tüm dosyalar ve klasörler yüklenecek

## 🔧 Sorun Giderme

### "Repository already exists" hatası
Eğer remote zaten ekliyse:
```bash
git remote remove origin
git remote add origin https://github.com/emrmob77/aerocrm.git
```

### "Authentication failed" hatası
Personal Access Token kullanın veya SSH key'lerinizi yapılandırın.

### "Permission denied" hatası
GitHub hesabınızın repository'ye erişim yetkisi olduğundan emin olun.

## 📝 Sonraki Adımlar

Repository yüklendikten sonra:

1. **GitHub Actions** ile CI/CD kurulumu yapabilirsiniz
2. **Issues** kullanarak görev takibi yapabilirsiniz
3. **Projects** ile proje yönetimi yapabilirsiniz
4. **Wiki** veya **Discussions** ile dokümantasyon paylaşabilirsiniz
