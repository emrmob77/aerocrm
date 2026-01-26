# AERO CRM Platform

Modern satış ekipleri için tasarlanmış kapsamlı bir müşteri ilişkileri yönetimi ve teklif hazırlama platformu.

## 🚀 Özellikler

- **Hızlı Teklif Oluşturma**: Blok tabanlı sürükle-bırak editör ile profesyonel teklifler
- **Kanban Yönetimi**: Görsel anlaşma takibi ve aşama yönetimi
- **Gerçek Zamanlı İzleme**: Teklif görüntüleme ve imza takibi
- **Spyglass Analytics**: Detaylı analitik ve performans metrikleri
- **Webhook Entegrasyonları**: Diğer sistemlerle entegrasyon
- **Takım Yönetimi**: Çoklu kullanıcı ve rol yönetimi

## 🛠️ Teknoloji Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time)
- **State Management**: Zustand, TanStack Query
- **UI Components**: Framer Motion, React Beautiful DnD
- **Form Management**: React Hook Form + Zod
- **Analytics**: Recharts

## 📋 Gereksinimler

### Sistem Gereksinimleri

- Node.js 18.x veya üzeri
- npm veya yarn
- Supabase hesabı

### Ortam Değişkenleri

Proje kök dizininde `.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Kurulum

1. Repository'yi klonlayın:
```bash
git clone https://github.com/kullanici/aerocrm.git
cd aerocrm
```

2. Bağımlılıkları yükleyin:
```bash
npm install
# veya
yarn install
```

3. Ortam değişkenlerini ayarlayın (`.env.local` dosyası oluşturun)

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
# veya
yarn dev
```

5. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın

## 📁 Proje Yapısı

```
aerocrm/
├── app/                    # Next.js App Router sayfaları
├── components/             # React bileşenleri
├── lib/                    # Yardımcı fonksiyonlar
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type tanımları
├── store/                  # Zustand state yönetimi
├── desing-folder/          # HTML tasarım dosyaları
├── requirements.md         # Gereksinimler dokümantasyonu
├── design.md               # Tasarım dokümantasyonu
└── tasks.md                # Görev listesi
```

## 📚 Dokümantasyon

- [Gereksinimler Dokümantasyonu](./requirements.md)
- [Tasarım Dokümantasyonu](./design.md)
- [Görev Listesi](./tasks.md)
- [UI/UX Dokümantasyonu](./aero-crm-uiux-documentation.md)

## 🧪 Test

```bash
# Unit testler
npm run test

# Property-based testler
npm run test:property

# E2E testler
npm run test:e2e
```

## 📝 Lisans

Bu proje özel bir projedir.

## 👥 Katkıda Bulunanlar

- Proje sahibi ve geliştirici ekibi

## 📞 İletişim

Sorularınız için issue açabilir veya iletişime geçebilirsiniz.
