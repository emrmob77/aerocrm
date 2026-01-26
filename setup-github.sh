#!/bin/bash

# AERO CRM - GitHub Repository Kurulum Scripti
# Bu script projeyi GitHub'a yüklemek için gerekli adımları yürütür

echo "🚀 AERO CRM GitHub Kurulumu Başlatılıyor..."

# 1. Git repository başlat
echo "📦 Git repository başlatılıyor..."
git init

# 2. Git kullanıcı bilgilerini ayarla (gerekirse değiştirin)
git config user.name "emrmob77"
git config user.email "emrmob77@users.noreply.github.com"

# 3. Tüm dosyaları ekle
echo "📝 Dosyalar stage ediliyor..."
git add .

# 4. İlk commit
echo "💾 İlk commit yapılıyor..."
git commit -m "Initial commit: AERO CRM platform setup with requirements and design docs"

# 5. Main branch oluştur (eğer yoksa)
git branch -M main

# 6. GitHub remote ekle
echo "🔗 GitHub remote ekleniyor..."
git remote add origin https://github.com/emrmob77/aerocrm.git

echo ""
echo "✅ Yerel git repository hazır!"
echo ""
echo "📋 Şimdi yapmanız gerekenler:"
echo "1. GitHub'da yeni bir repository oluşturun:"
echo "   - https://github.com/new adresine gidin"
echo "   - Repository name: aerocrm"
echo "   - Public veya Private seçin"
echo "   - 'Initialize this repository with a README' seçeneğini İŞARETLEMEYİN"
echo "   - 'Create repository' butonuna tıklayın"
echo ""
echo "2. Repository oluşturulduktan sonra şu komutu çalıştırın:"
echo "   git push -u origin main"
echo ""
echo "Veya eğer repository adı farklıysa, remote URL'yi güncelleyin:"
echo "   git remote set-url origin https://github.com/emrmob77/[repository-adi].git"
echo "   git push -u origin main"
