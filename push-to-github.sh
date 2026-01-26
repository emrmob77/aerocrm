#!/bin/bash

# AERO CRM - GitHub'a Push Scripti
# Repository: https://github.com/emrmob77/aerocrm.git

echo "🚀 AERO CRM GitHub'a yükleniyor..."

# Git repository başlat (eğer yoksa)
if [ ! -d ".git" ]; then
    echo "📦 Git repository başlatılıyor..."
    git init
fi

# Git kullanıcı bilgilerini ayarla
git config user.name "emrmob77"
git config user.email "emrmob77@users.noreply.github.com"

# Tüm dosyaları ekle
echo "📝 Dosyalar stage ediliyor..."
git add .

# Commit mesajı
COMMIT_MSG="Initial commit: AERO CRM platform setup

- Added project requirements and design documentation
- Added package.json with dependencies
- Added README.md
- Added HTML design files in desing-folder/
- Added .gitignore
- Added setup scripts"

# İlk commit
echo "💾 Commit yapılıyor..."
git commit -m "$COMMIT_MSG"

# Main branch oluştur
git branch -M main

# Remote kontrolü ve ekleme
if git remote get-url origin > /dev/null 2>&1; then
    echo "🔄 Remote zaten mevcut, güncelleniyor..."
    git remote set-url origin https://github.com/emrmob77/aerocrm.git
else
    echo "🔗 Remote ekleniyor..."
    git remote add origin https://github.com/emrmob77/aerocrm.git
fi

# GitHub'a push
echo "⬆️  GitHub'a push ediliyor..."
echo ""
echo "⚠️  Eğer authentication sorunu yaşarsanız:"
echo "   1. Personal Access Token kullanın: https://github.com/settings/tokens"
echo "   2. Veya SSH kullanın: git remote set-url origin git@github.com:emrmob77/aerocrm.git"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Başarılı! Proje GitHub'a yüklendi:"
    echo "   https://github.com/emrmob77/aerocrm"
else
    echo ""
    echo "❌ Push başarısız oldu. Lütfen authentication ayarlarınızı kontrol edin."
    echo "   Personal Access Token: https://github.com/settings/tokens"
fi
