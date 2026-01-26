# AERO CRM + AERO DOCS
## Kapsamlı UI/UX Dokümantasyonu ve Google Stitch Prompt Rehberi

---

# BÖLÜM 1: KURUMSAL KİMLİK VE TASARIM DİLİ

## 1.1 Marka Kimliği

### Marka Adı
**AERO** — Hız, hafiflik ve modernliği çağrıştıran bir isim. "Aerodynamic" kelimesinden türetilmiş, satış süreçlerindeki sürtünmeyi minimize etme vaadini simgeliyor.

### Marka Sloganı
- Primary: *"Satış, Hızla Uçar."*
- Secondary: *"Teklif at, anlaşma kapat."*
- Tagline: *"From Lead to Close, Seamlessly."*

### Marka Kişiliği
| Özellik | Tanım |
|---------|-------|
| **Hızlı** | Gereksiz adımlar yok, 3 tıkla teklif |
| **Güvenilir** | Kurumsal ama samimi |
| **Modern** | Geleneksel CRM'lerin aksine taze |
| **Akıllı** | AI-destekli öneriler |
| **Minimal** | Karmaşıklık değil, basitlik |

---

## 1.2 Renk Paleti

### Primary Colors
```css
:root {
  /* Ana Marka Renkleri */
  --aero-blue-50: #EFF6FF;
  --aero-blue-100: #DBEAFE;
  --aero-blue-200: #BFDBFE;
  --aero-blue-300: #93C5FD;
  --aero-blue-400: #60A5FA;
  --aero-blue-500: #3B82F6;  /* PRIMARY */
  --aero-blue-600: #2563EB;
  --aero-blue-700: #1D4ED8;
  --aero-blue-800: #1E40AF;
  --aero-blue-900: #1E3A8A;
  
  /* Başarı/Dönüşüm Rengi */
  --aero-green-50: #ECFDF5;
  --aero-green-100: #D1FAE5;
  --aero-green-500: #10B981;  /* SUCCESS */
  --aero-green-600: #059669;
  --aero-green-700: #047857;
}
```

### Secondary & Accent Colors
```css
:root {
  /* Uyarı/Urgency */
  --aero-amber-500: #F59E0B;
  --aero-amber-600: #D97706;
  
  /* Hata/Red */
  --aero-red-500: #EF4444;
  --aero-red-600: #DC2626;
  
  /* Nötr Tonlar */
  --aero-slate-50: #F8FAFC;
  --aero-slate-100: #F1F5F9;
  --aero-slate-200: #E2E8F0;
  --aero-slate-300: #CBD5E1;
  --aero-slate-400: #94A3B8;
  --aero-slate-500: #64748B;
  --aero-slate-600: #475569;
  --aero-slate-700: #334155;
  --aero-slate-800: #1E293B;
  --aero-slate-900: #0F172A;
  
  /* Gradient'lar */
  --aero-gradient-primary: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  --aero-gradient-success: linear-gradient(135deg, #10B981 0%, #047857 100%);
  --aero-gradient-hero: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 50%, #60A5FA 100%);
}
```

### Dark Mode Colors
```css
[data-theme="dark"] {
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --bg-tertiary: #334155;
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --border-color: #334155;
}
```

---

## 1.3 Tipografi

### Font Ailesi
```css
:root {
  /* Display/Headlines - Karakteristik ve Modern */
  --font-display: 'Plus Jakarta Sans', 'SF Pro Display', system-ui;
  
  /* Body Text - Okunabilirlik */
  --font-body: 'Plus Jakarta Sans', 'SF Pro Text', system-ui;
  
  /* Monospace - Kod ve Sayılar */
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
}
```

### Type Scale
```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* Letter Spacing */
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
}
```

---

## 1.4 Spacing & Layout

### Spacing Scale
```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
}
```

### Border Radius
```css
:root {
  --radius-sm: 0.25rem;   /* 4px - subtle */
  --radius-md: 0.5rem;    /* 8px - default */
  --radius-lg: 0.75rem;   /* 12px - cards */
  --radius-xl: 1rem;      /* 16px - modals */
  --radius-2xl: 1.5rem;   /* 24px - special */
  --radius-full: 9999px;  /* pills */
}
```

### Shadows
```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-glow-blue: 0 0 20px rgba(59, 130, 246, 0.3);
  --shadow-glow-green: 0 0 20px rgba(16, 185, 129, 0.3);
}
```

---

## 1.5 Tasarım Prensipleri

### 1. "3-Saniye Kuralı"
Kullanıcı herhangi bir sayfada 3 saniye içinde ne yapması gerektiğini anlamalı.

### 2. "Progressive Disclosure"
Karmaşık bilgiler katman katman gösterilir. İlk bakışta basit, derinlemesine keşfedildikçe güçlü.

### 3. "Gestalt Yakınlık"
İlgili öğeler birbirine yakın, farklı gruplar belirgin boşluklarla ayrılır.

### 4. "Tutarlı Geri Bildirim"
Her kullanıcı aksiyonu anında görsel/sesli geri bildirim alır.

### 5. "Mobile-First, Desktop-Enhanced"
Mobilde %100 işlevsel, masaüstünde genişletilmiş deneyim.

---

# BÖLÜM 2: SAYFA ENVANTERİ VE DETAYLARI

## 2.1 Toplam Sayfa Sayısı

| Kategori | Sayfa Sayısı |
|----------|--------------|
| Authentication | 4 |
| Dashboard & CRM | 6 |
| Proposal Engine | 5 |
| Analytics | 2 |
| Settings & Account | 4 |
| Public/Customer-Facing | 3 |
| Modals & Overlays | 12 |
| **TOPLAM** | **36 Sayfa/Bileşen** |

---

## 2.2 Detaylı Sayfa Listesi

### A. Authentication Sayfaları (4)
1. **Login Page** — Giriş ekranı
2. **Register Page** — Kayıt ekranı
3. **Forgot Password** — Şifre sıfırlama
4. **Email Verification** — E-posta doğrulama

### B. Dashboard & CRM Core (6)
5. **Main Dashboard** — Ana kontrol paneli
6. **CRM Kanban (Deals)** — Anlaşma yönetimi
7. **Deal Detail Page** — Tekil anlaşma detayı
8. **Contacts List** — Kişi listesi
9. **Contact Detail** — Kişi profili
10. **Products Catalog** — Ürün/hizmet kataloğu

### C. Proposal Engine (5)
11. **Templates Gallery** — Şablon galerisi
12. **Template Editor** — Şablon düzenleme
13. **Proposal Editor** — Teklif oluşturucu (Blok bazlı)
14. **Proposal Preview** — Teklif önizleme
15. **Proposal Sending Interface** — Gönderim arayüzü

### D. Analytics (2)
16. **Spyglass Dashboard** — Teklif analitiği
17. **CRM Analytics** — Satış performansı

### E. Settings & Account (4)
18. **Account Settings** — Hesap ayarları
19. **Team Management** — Takım yönetimi (Pro)
20. **Integrations Hub** — Entegrasyonlar
21. **Billing & Subscription** — Faturalama

### F. Public/Customer-Facing (3)
22. **Proposal Web Page** — Müşterinin gördüğü teklif
23. **E-Signature Page** — İmza sayfası
24. **Thank You / Confirmation** — Onay sayfası

### G. Modal & Overlay Components (12)
25. New Deal Modal
26. New Contact Modal
27. Template Selection Modal
28. Block Picker Drawer
29. Smart Variables Panel
30. Send Proposal Modal
31. Notification Center Drawer
32. Quick Search Command Palette
33. AI Assistant Panel
34. Image/Media Upload Modal
35. Confirmation Dialogs
36. Onboarding Tour Overlay

---

# BÖLÜM 3: HER SAYFA İÇİN DETAYLI ÖZELLİKLER

## 3.1 Authentication Sayfaları

### SAYFA 1: Login Page

**Amaç:** Mevcut kullanıcıların güvenli girişi

**Bileşenler:**
- Logo (animasyonlu)
- Email input field
- Password input field (show/hide toggle)
- "Beni Hatırla" checkbox
- "Giriş Yap" primary button
- "Şifremi Unuttum" link
- Sosyal login butonları (Google, Microsoft)
- "Hesabın yok mu? Kayıt ol" link
- Background: Subtle animated gradient mesh

**Etkileşimler:**
- Input focus states with glow effect
- Button hover/press animations
- Form validation (inline errors)
- Loading spinner on submit
- Success redirect animation

**Mobil Adaptasyon:**
- Full-screen layout
- Larger touch targets (min 44px)
- Keyboard-aware scrolling

---

### SAYFA 2: Register Page

**Amaç:** Yeni kullanıcı kaydı

**Bileşenler:**
- Logo
- Plan seçimi kartları (Solo/Pro) — mini karşılaştırma
- Full name input
- Email input
- Password input (strength meter)
- "Şartları kabul ediyorum" checkbox
- "Hesap Oluştur" button
- Sosyal signup
- "Zaten hesabın var mı?" link

**Özel Özellikler:**
- Password strength indicator (weak/medium/strong)
- Real-time email availability check
- Plan hover ile özellik tooltip'leri

---

### SAYFA 3: Forgot Password

**Bileşenler:**
- Email input
- "Sıfırlama Linki Gönder" button
- Success state (check email illustration)
- Back to login link

---

### SAYFA 4: Email Verification

**Bileşenler:**
- Success/Pending illustration
- "E-postanı doğrula" message
- Resend email button
- Countdown timer (60 sn)

---

## 3.2 Dashboard & CRM Core

### SAYFA 5: Main Dashboard

**Amaç:** Günlük satış aktivitelerinin özeti, hızlı aksiyonlar

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ HEADER (Logo, Search, Notifications, Profile)           │
├────────┬────────────────────────────────────────────────┤
│        │                                                │
│ SIDEBAR│  WELCOME SECTION                               │
│ (Nav)  │  "Günaydın, [İsim]! Bugün 3 teklif bekliyor." │
│        │                                                │
│ ──────►│ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│        │ │ METRIC 1 │ │ METRIC 2 │ │ METRIC 3 │       │
│ CRM    │ │ Açık     │ │ Bu Ay    │ │ Dönüşüm  │       │
│        │ │ Teklifler│ │ Kazanılan│ │ Oranı    │       │
│ Docs   │ │ 12       │ │ ₺45,000  │ │ %34      │       │
│        │ └──────────┘ └──────────┘ └──────────┘       │
│ Analytics│                                              │
│        │ ┌─────────────────┐ ┌─────────────────┐       │
│ Settings│ │ RECENT ACTIVITY │ │ QUICK ACTIONS   │       │
│        │ │ Timeline        │ │ + Yeni Teklif   │       │
│        │ │ • Teklif açıldı │ │ + Kişi Ekle     │       │
│        │ │ • Deal won      │ │ + Anlaşma       │       │
│        │ └─────────────────┘ └─────────────────┘       │
└────────┴────────────────────────────────────────────────┘
```

**Bileşenler:**
- **Header Bar:** Logo, Global Search (Cmd+K), Notification Bell, Profile Dropdown
- **Sidebar:** Collapsible, Navigation items with icons
- **Welcome Banner:** Personalized greeting, daily summary
- **Metric Cards (3-4):** Açık teklifler, Aylık kazanç, Dönüşüm oranı, Pipeline değeri
- **Recent Activity Feed:** Timeline format, tıklanabilir
- **Quick Actions Grid:** Büyük ikonlu butonlar
- **Upcoming Tasks/Reminders:** Mini takvim veya liste

**Etkileşimler:**
- Metric card hover → Detay tooltip
- Activity item click → İlgili sayfaya yönlendirme
- Sidebar collapse → Icon-only mode
- Real-time updates (Supabase subscription)

---

### SAYFA 6: CRM Kanban (Deals)

**Amaç:** Satış pipeline'ını görsel olarak yönetmek

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ HEADER: Deals | + Yeni Anlaşma | Filter | View Toggle   │
├─────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐│
│ │   LEAD    │ │ PROPOSAL  │ │NEGOTIATION│ │    WON    ││
│ │  (Aday)   │ │   SENT    │ │(Görüşme)  │ │(Kazanıldı)││
│ ├───────────┤ ├───────────┤ ├───────────┤ ├───────────┤│
│ │ ┌───────┐ │ │ ┌───────┐ │ │ ┌───────┐ │ │ ┌───────┐ ││
│ │ │Card 1 │ │ │ │Card 2 │ │ │ │Card 4 │ │ │ │Card 6 │ ││
│ │ │ABC Ltd│ │ │ │XYZ Co │ │ │ │Demo   │ │ │ │Final  │ ││
│ │ │₺5,000 │ │ │ │₺12,000│ │ │ │₺8,500 │ │ │ │₺15,000│ ││
│ │ └───────┘ │ │ └───────┘ │ │ └───────┘ │ │ └───────┘ ││
│ │ ┌───────┐ │ │ ┌───────┐ │ │           │ │           ││
│ │ │Card 2 │ │ │ │Card 3 │ │ │           │ │           ││
│ │ └───────┘ │ │ └───────┘ │ │           │ │           ││
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘│
│ [+ LOST Column - Collapsed]                             │
└─────────────────────────────────────────────────────────┘
```

**Stages (Sütunlar):**
1. Lead (Aday) — Gri header
2. Proposal Sent (Teklif Gönderildi) — Mavi header
3. Negotiation (Görüşme) — Amber header
4. Won (Kazanıldı) — Yeşil header
5. Lost (Kaybedildi) — Kırmızı, collapsed by default

**Deal Card Bileşenleri:**
- Contact/Company name (bold)
- Deal value (₺ formatında)
- Contact avatar (mini)
- Proposal status badge (if exists)
- Last activity indicator (görsel zaman: "2 saat önce")
- Quick action dots menu

**Etkileşimler:**
- **Drag & Drop:** Kartı sürükle, stage değiştir
- **Click:** Deal detail modal/page açılır
- **Hover:** Kart yükselir (elevation), quick actions görünür
- **Stage sum:** Her sütunun üstünde toplam değer

**Filtreler:**
- Tarih aralığı
- Kişi/Şirket
- Değer aralığı
- Atanan kullanıcı (takım için)

---

### SAYFA 7: Deal Detail Page

**Amaç:** Tek bir anlaşmanın tüm detayları ve aksiyonları

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ ← Geri | ABC Şirketi - SEO Projesi          | ⋮ Actions │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌─────────────────────────┐ │
│ │ DEAL INFO               │ │ CONTACT CARD            │ │
│ │ Stage: [Dropdown]       │ │ Avatar + İsim           │ │
│ │ Value: ₺15,000          │ │ Email | Phone           │ │
│ │ Created: 15 Ocak 2025   │ │ → Profili Gör           │ │
│ │ Expected Close: 30 Ocak │ │                         │ │
│ └─────────────────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ [Products] [Proposals] [Notes] [Activity] [Files]       │
├─────────────────────────────────────────────────────────┤
│ TAB CONTENT AREA                                        │
│                                                         │
│ Products Tab:                                           │
│ ┌────────────────────────────────────────────────┐     │
│ │ + Ürün Ekle                                     │     │
│ │ ┌──────────┬───────────┬─────────┬───────────┐ │     │
│ │ │ Ürün     │ Fiyat     │ Miktar  │ Toplam    │ │     │
│ │ ├──────────┼───────────┼─────────┼───────────┤ │     │
│ │ │ SEO Audit│ ₺3,000    │ 1       │ ₺3,000    │ │     │
│ │ │ Backlink │ ₺500/adet │ 20      │ ₺10,000   │ │     │
│ │ └──────────┴───────────┴─────────┴───────────┘ │     │
│ │ TOPLAM: ₺13,000                                │     │
│ └────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🚀 TEKLİF OLUŞTUR                                   │ │
│ │ Bu anlaşma için henüz teklif oluşturulmamış.        │ │
│ │ [Şablon Seç ve Teklif Oluştur]                      │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Tab İçerikleri:**
- **Products:** Anlaşmaya eklenen ürünler, fiyatlar, toplam
- **Proposals:** Bu deal için oluşturulan teklifler (durum, link, tarih)
- **Notes:** Rich text notlar, mentions
- **Activity:** Timeline (tüm değişiklikler, açılan teklifler)
- **Files:** Ekli dosyalar

**Aksiyonlar:**
- Stage değiştirme (inline dropdown)
- Teklif oluştur butonu → Template selection modal
- Quick edit (value, expected close)
- Delete deal (confirmation required)

---

### SAYFA 8: Contacts List

**Amaç:** Tüm kişileri yönetmek

**Layout:**
- **Header:** Başlık, + Yeni Kişi, Arama, Filtre
- **View Toggle:** Liste / Kart görünümü
- **Table/Grid:** 
  - Avatar, İsim, Email, Telefon, Şirket, Toplam Deal Değeri, Son Aktivite
  - Sıralama (her sütun)
  - Bulk selection
- **Pagination:** 25/50/100 per page

**Özel Özellikler:**
- Inline edit (çift tıkla)
- Quick actions: Email gönder, Arama başlat, Deal oluştur
- Custom fields görünürlüğü toggle

---

### SAYFA 9: Contact Detail

**Amaç:** Tek bir kişinin 360° görünümü

**Bileşenler:**
- **Profile Header:** Avatar (büyük), İsim, Şirket, Unvan
- **Contact Info Card:** Email (tıkla → kopyala), Telefon, Adres
- **Custom Fields:** JSONB'den gelen özel alanlar
- **Deals Section:** Bu kişiye ait tüm deal'lar (mini kanban veya liste)
- **Proposals Section:** Gönderilen teklifler
- **Activity Timeline:** Tüm etkileşimler
- **Notes Section:** Kişiye özel notlar

---

### SAYFA 10: Products Catalog

**Amaç:** Satılabilir ürün/hizmetlerin yönetimi

**Layout:**
- **Grid/List View:** Ürün kartları
- **Ürün Kartı:** İsim, Fiyat, Kategori, Kısa açıklama, Edit/Delete
- **Kategoriler:** Sol sidebar filtre
- **Arama:** Ürün adı/açıklama
- **+ Yeni Ürün:** Modal ile ekleme

**Ürün Detayları:**
- Ad, Açıklama (rich text)
- Fiyat (tek seferlik / aylık / yıllık)
- Kategori
- Görsel (opsiyonel)
- Aktif/Pasif durumu

---

## 3.3 Proposal Engine Sayfaları

### SAYFA 11: Templates Gallery

**Amaç:** Hazır ve özel şablonları keşfetmek, yönetmek

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Şablonlarım | + Yeni Şablon | Arama                     │
├─────────────────────────────────────────────────────────┤
│ [Tümü] [Benim] [Hazır Şablonlar] [Favoriler]            │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
│ │   TEMPLATE    │ │   TEMPLATE    │ │   TEMPLATE    │  │
│ │   PREVIEW     │ │   PREVIEW     │ │   PREVIEW     │  │
│ │   (Thumbnail) │ │   (Thumbnail) │ │   (Thumbnail) │  │
│ ├───────────────┤ ├───────────────┤ ├───────────────┤  │
│ │ SEO Teklifi   │ │ Web Tasarım   │ │ Danışmanlık   │  │
│ │ 5 blok        │ │ 7 blok        │ │ 4 blok        │  │
│ │ ★★★★☆        │ │ ★★★★★        │ │ ★★★☆☆        │  │
│ └───────────────┘ └───────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Şablon Kartı:**
- Thumbnail preview (mini rendered görsel)
- Şablon adı
- Blok sayısı
- Kullanım sayısı / Rating
- Hover: "Kullan" ve "Düzenle" butonları

**Aksiyonlar:**
- Şablonu kullan → Proposal editor açılır
- Şablonu düzenle → Template editor açılır
- Şablonu kopyala
- Şablonu sil

---

### SAYFA 12: Template Editor

**Amaç:** Yeniden kullanılabilir şablon oluşturmak

**Layout:** (Proposal Editor ile benzer, ama daha çok "yapı" odaklı)
- Default placeholder'lar ile bloklar
- Smart variable tanımlama arayüzü
- Kaydet & İsimlendir

---

### SAYFA 13: Proposal Editor (ANA SAYFA)

**Amaç:** Blok tabanlı, Notion-style teklif oluşturucu

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Geri | ABC Şirketi Teklifi | [Önizle] [Kaydet] [Gönder]       │
├───────────┬─────────────────────────────────────┬───────────────┤
│           │                                     │               │
│  BLOCKS   │          CANVAS                     │  PROPERTIES   │
│  PALETTE  │       (Live Preview)                │    PANEL      │
│           │                                     │               │
│ ┌───────┐ │  ┌─────────────────────────────┐   │ Hero Block    │
│ │ Hero  │ │  │                             │   │ ────────────  │
│ └───────┘ │  │      HERO SECTION           │   │ Başlık:       │
│ ┌───────┐ │  │   [Görsel + Başlık]         │   │ [___________] │
│ │ Text  │ │  │                             │   │               │
│ └───────┘ │  └─────────────────────────────┘   │ Alt Başlık:   │
│ ┌───────┐ │  ┌─────────────────────────────┐   │ [___________] │
│ │Pricing│ │  │                             │   │               │
│ └───────┘ │  │    PRICING TABLE            │   │ Görsel:       │
│ ┌───────┐ │  │  [Otomatik CRM'den]         │   │ [Upload]      │
│ │ Video │ │  │                             │   │               │
│ └───────┘ │  └─────────────────────────────┘   │ Background:   │
│ ┌───────┐ │  ┌─────────────────────────────┐   │ [Color Pick]  │
│ │Signat.│ │  │                             │   │               │
│ └───────┘ │  │    E-SIGNATURE BLOCK        │   │ ────────────  │
│ ┌───────┐ │  │   [İmza Alanı]              │   │ AI Önerisi:   │
│ │Timeline│ │  │                             │   │ [Urgency Ekle]│
│ └───────┘ │  └─────────────────────────────┘   │               │
│           │                                     │               │
├───────────┴─────────────────────────────────────┴───────────────┤
│ Device Toggle: [Desktop] [Tablet] [Mobile]    Zoom: [100%]      │
└─────────────────────────────────────────────────────────────────┘
```

**Blok Türleri (Sol Palet):**

| Blok | Açıklama |
|------|----------|
| **Hero** | Kapak görseli + başlık + alt başlık |
| **Text/Paragraph** | Rich text içerik |
| **Heading** | H1, H2, H3 başlıklar |
| **Pricing Table** | CRM ürünlerinden otomatik |
| **Video Embed** | YouTube, Loom, Vimeo |
| **Image** | Tek görsel veya galeri |
| **Testimonial** | Müşteri yorumu kartı |
| **Timeline** | Proje aşamaları |
| **FAQ** | Accordion SSS |
| **Team** | Takım üyeleri tanıtımı |
| **CTA Button** | Aksiyon butonu |
| **Divider** | Bölüm ayırıcı |
| **Countdown** | Urgency timer |
| **E-Signature** | İmza bloğu |
| **Terms** | Şartlar ve koşullar |

**Canvas Özellikleri:**
- Drag & drop blok sıralama
- Seçili blok: Mavi outline
- Hover: Hafif highlight
- Responsive preview toggle

**Properties Panel (Sağ):**
- Seçili bloğun ayarları
- Smart Variables: {{ }} autocomplete
- Style overrides (padding, colors)
- AI önerileri (conversion tips)

**Etkileşimler:**
- Blok sürükle → Canvas'a bırak
- Bloka tıkla → Properties panel açılır
- {{ yazınca → Variable autocomplete
- AI butonu → Akıllı öneriler modal

---

### SAYFA 14: Proposal Preview

**Amaç:** Teklifin müşterinin göreceği haliyle tam ekran önizlemesi

**Layout:**
- Full-screen iframe-like render
- Device frame seçimi (iPhone, Desktop, Tablet)
- "Düzenlemeye Dön" ve "Gönder" butonları
- Share URL gösterimi

---

### SAYFA 15: Proposal Sending Interface

**Amaç:** Teklifi müşteriye iletme yöntemini seçmek

**Modal/Sayfa İçeriği:**
- **Gönderim Yöntemi Seçimi:**
  - Email (built-in)
  - WhatsApp (deep link)
  - SMS (Twilio entegrasyonu)
  - Link Kopyala
  - PDF İndir
- **Email Composer:** (Email seçilirse)
  - Konu satırı
  - Mesaj body (şablonlu)
  - Preview
- **Urgency Seçenekleri:**
  - Geçerlilik süresi (24h, 48h, 7 gün, sınırsız)
  - Countdown göster/gizle
- **Gönder Butonu**

---

## 3.4 Analytics Sayfaları

### SAYFA 16: Spyglass Dashboard (Proposal Analytics)

**Amaç:** Teklif performansını derinlemesine analiz etmek

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Spyglass Analytics | Tarih: [Son 30 Gün ▼] | Export    │
├─────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐│
│ │Gönderilen │ │Görüntülenen│ │ İmzalanan │ │ Dönüşüm  ││
│ │   24      │ │    18      │ │     8     │ │   %44    ││
│ │  ↑12%     │ │   ↑8%      │ │    ↑3     │ │   ↑5%    ││
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘│
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │             CONVERSION FUNNEL CHART                 │ │
│ │  Sent → Viewed → Engaged → Signed                   │ │
│ │  [Visual funnel/bar chart]                          │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────────────┐ │
│ │    HEAT MAP         │ │   RECENT ACTIVITY           │ │
│ │   (Blok bazlı)      │ │   • ABC teklifi açıldı      │ │
│ │   [Pricing: 120s]   │ │   • XYZ imzalandı           │ │
│ │   [Hero: 15s]       │ │   • DEF 2. kez görüntülendi │ │
│ │   [Terms: 45s]      │ │                             │ │
│ └─────────────────────┘ └─────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ PROPOSALS TABLE                                     │ │
│ │ Teklif | Müşteri | Gönderim | Görüntülenme | Durum  │ │
│ │ ────────────────────────────────────────────────────│ │
│ │ SEO... | ABC Ltd | 3 gün    | 5 kez        | Signed │ │
│ │ Web... | XYZ Co  | 1 gün    | 2 kez        | Viewed │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Metrikler:**
- Gönderilen teklif sayısı
- Görüntülenme sayısı
- Ortalama görüntülenme süresi
- İmzalanan teklifler
- Dönüşüm oranı
- Blok bazlı engagement süresi

**Grafikler:**
- Funnel chart (dönüşüm hunisi)
- Line chart (zaman serisi)
- Heat map (blok engagement)
- Pie chart (durum dağılımı)

---

### SAYFA 17: CRM Analytics (Sales Performance)

**Amaç:** Genel satış performansı

**Metrikler:**
- Toplam pipeline değeri
- Aylık/Yıllık kazanç
- Win rate
- Average deal size
- Sales velocity
- Stage conversion rates

**Grafikler:**
- Revenue over time
- Deals by stage
- Top performers (takım için)
- Forecast projections

---

## 3.5 Settings Sayfaları

### SAYFA 18: Account Settings

**Bölümler:**
- **Profile:** Avatar, Ad, Email, Şifre değiştirme
- **Notifications:** Email, Push, In-app tercihleri
- **Appearance:** Light/Dark mode, Language
- **Security:** 2FA, Session management

---

### SAYFA 19: Team Management (Pro)

**Bileşenler:**
- Takım üyeleri listesi
- Davet gönderme
- Rol atama (Admin, Member, Viewer)
- Yetki matrisi

---

### SAYFA 20: Integrations Hub

**Entegrasyonlar:**
- **CRM:** Zapier, Webhook
- **Communication:** Gmail, Slack, WhatsApp
- **Payment:** Stripe, PayPal (Future)
- **Storage:** Google Drive, Dropbox
- **Calendar:** Google Calendar, Outlook

Her entegrasyon için:
- Connect/Disconnect butonu
- Status indicator
- Configuration modal

---

### SAYFA 21: Billing & Subscription

**Bölümler:**
- Current Plan kartı
- Usage stats (teklif sayısı, storage)
- Upgrade/Downgrade seçenekleri
- Payment method yönetimi
- Invoice history
- Cancel subscription

---

## 3.6 Public/Customer-Facing Sayfaları

### SAYFA 22: Proposal Web Page (Müşteri Görünümü)

**Amaç:** Müşterinin gördüğü interaktif teklif sayfası

**Layout:**
- Full-width, no navigation
- Scrollable single page
- Bloklar sırayla render
- Sticky CTA bar (mobile'da)
- Urgency countdown (varsa)

**Özellikler:**
- %100 responsive
- Fast loading (lazy load images)
- No login required
- Unique URL with hash
- View tracking (passive)

---

### SAYFA 23: E-Signature Page

**Amaç:** Müşterinin teklifi imzalaması

**Bileşenler:**
- Özet bilgi (teklif başlığı, tutar)
- Terms checkbox
- Signature canvas (parmak/mouse ile imza)
- "İmzayı Temizle" butonu
- "Kabul Et ve İmzala" butonu
- Legal disclaimer

**Teknoloji:**
- HTML5 Canvas for signature
- Base64 encoding
- Touch event support

---

### SAYFA 24: Thank You / Confirmation

**Amaç:** İmza sonrası onay

**Bileşenler:**
- Success animation (confetti/checkmark)
- "Teklifiniz başarıyla imzalandı" mesajı
- PDF indirme linki
- İletişim bilgileri
- Social share (opsiyonel)

---

## 3.7 Modal & Overlay Components

### MODAL 25: New Deal Modal
- Contact seçimi (autocomplete)
- Deal name
- Value
- Stage seçimi
- Products ekleme (multi-select)

### MODAL 26: New Contact Modal
- Full name
- Email, Phone
- Company
- Custom fields (dinamik)

### MODAL 27: Template Selection Modal
- Template grid (thumbnails)
- Quick preview
- "Bu Şablonu Kullan" butonu

### DRAWER 28: Block Picker Drawer
- Kategorize bloklar
- Search/filter
- Drag-to-add

### PANEL 29: Smart Variables Panel
- Available variables listesi
- Copy to clipboard
- Insert at cursor

### MODAL 30: Send Proposal Modal
- Gönderim yöntemi seçimi
- Email composer
- Urgency settings

### DRAWER 31: Notification Center
- Tüm bildirimler (timeline)
- Okundu/Okunmadı
- Filters

### PALETTE 32: Quick Search (Cmd+K)
- Global arama
- Recent items
- Quick actions

### PANEL 33: AI Assistant Panel
- Chat interface
- Öneriler
- Auto-fill actions

### MODAL 34: Media Upload Modal
- Drag & drop zone
- File browser
- URL import
- Recent uploads

### DIALOG 35: Confirmation Dialogs
- Delete confirmation
- Discard changes
- Archive confirmation

### OVERLAY 36: Onboarding Tour
- Step-by-step tooltips
- Feature highlights
- Skip option

---

# BÖLÜM 4: GOOGLE STITCH PROMPTLARI

## 4.1 Genel Tasarım Talimatları (Her Prompt'un Başına Eklenecek)

```
GLOBAL DESIGN SYSTEM:

Brand: AERO CRM - A modern, fast, sales-focused CRM and proposal management platform.

Design Philosophy:
- Clean, minimal, professional
- Speed and efficiency are paramount
- Trust (blue) and Success (green) color psychology
- Mobile-first but powerful on desktop

Color Palette:
- Primary Blue: #3B82F6
- Success Green: #10B981
- Warning Amber: #F59E0B
- Error Red: #EF4444
- Background Light: #F8FAFC
- Background Dark: #0F172A
- Text Primary: #0F172A (light) / #F8FAFC (dark)
- Text Secondary: #64748B
- Border: #E2E8F0 (light) / #334155 (dark)

Typography:
- Font Family: Plus Jakarta Sans (or SF Pro as fallback)
- Headings: Bold, tight tracking
- Body: Regular, 16px base

Spacing:
- Use 8px grid system
- Generous padding (16px-24px)
- Card border-radius: 12px
- Button border-radius: 8px

Shadows:
- Subtle, layered shadows for depth
- Cards: 0 4px 6px rgba(0,0,0,0.05)
- Elevated: 0 10px 15px rgba(0,0,0,0.1)

Interactions:
- Smooth transitions (200-300ms ease)
- Hover states with subtle elevation
- Focus states with blue ring
- Loading states with skeleton screens

Iconography:
- Lucide Icons or Heroicons
- 20px-24px standard size
- Stroke weight: 1.5-2px
```

---

## 4.2 Sayfa Bazlı Google Stitch Promptları

### PROMPT 1: Login Page

```
Design a modern login page for AERO CRM.

Layout:
- Split screen: Left side illustration/branding, Right side form
- On mobile: Single column, logo on top

Left Side (Desktop only):
- Gradient background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)
- Large "AERO" wordmark in white
- Tagline: "Satış, Hızla Uçar."
- Abstract geometric shapes or airplane/speed illustrations
- Floating testimonial card at bottom

Right Side (Form):
- White/light background
- Centered vertically
- Logo (smaller, for mobile recognition)
- Welcome text: "Tekrar Hoş Geldiniz"
- Subtitle: "Hesabınıza giriş yapın"

Form Elements:
- Email input with envelope icon
- Password input with lock icon and show/hide toggle
- "Beni Hatırla" checkbox (small, left aligned)
- "Şifremi Unuttum" link (small, right aligned)
- Primary blue "Giriş Yap" button (full width, 48px height)
- Divider: "veya" with lines
- Google sign-in button (outlined, with Google icon)
- Bottom text: "Hesabınız yok mu? Kayıt Olun" (link)

Styling:
- Input fields: 48px height, light gray border, 8px radius
- Focus state: Blue border, subtle blue shadow
- Button: Blue gradient, white text, subtle shadow on hover
- All text in Plus Jakarta Sans

Animations:
- Form slides in from right on page load
- Input focus has smooth border color transition
- Button has hover lift effect
```

---

### PROMPT 2: Register Page

```
Design a registration page for AERO CRM with plan selection.

Layout:
- Similar to login but with more content
- Plan selection cards above the form

Plan Selection Section:
- Two horizontal cards side by side (stacked on mobile)
- Card 1: "Aero Solo - $29/ay"
  - Checkmarks: Tam CRM, 10 Teklif/ay, Basit İmza
  - Recommended badge (if selected)
- Card 2: "Aero Pro - $49/ay"
  - Checkmarks: Sınırsız Teklif, Custom Domain, White Label
  - "En Popüler" badge
- Selected card has blue border and light blue background
- Unselected has gray border

Form Fields:
- Full Name input (user icon)
- Email input (envelope icon)
- Password input with strength meter below
  - Strength meter: 4 segments, colors from red to green
  - Text below: "Güçlü şifre" / "Orta" / "Zayıf"
- "Şartları ve Gizlilik Politikasını kabul ediyorum" checkbox
- "Hesap Oluştur" primary button
- Google signup option
- "Zaten hesabınız var mı? Giriş Yapın"

Design Notes:
- Plan cards should feel premium
- Smooth selection animation
- Clear visual hierarchy
- Trust badges or security icons at bottom
```

---

### PROMPT 3: Main Dashboard

```
Design the main dashboard for AERO CRM - the first screen users see after login.

Overall Layout:
- Left sidebar (240px, collapsible to 64px icons only)
- Top header bar (64px height)
- Main content area with padding

Sidebar:
- AERO logo at top
- Navigation items with icons:
  - Dashboard (home icon) - ACTIVE
  - CRM / Anlaşmalar (kanban icon)
  - Kişiler (users icon)
  - Ürünler (package icon)
  - Teklifler (document icon)
  - Analitik (chart icon)
  - Ayarlar (gear icon)
- Active item: Blue background, white icon/text
- Hover: Light blue background
- Bottom: User avatar + name, dropdown arrow
- Collapse toggle button

Header:
- Breadcrumb: "Dashboard"
- Global search bar (Cmd+K hint)
- Notification bell with red dot
- User avatar dropdown

Main Content:

Welcome Section:
- "Günaydın, [İsim]!" heading
- Subtitle: "Bugün 3 teklif yanıt bekliyor."
- Optional: Motivational quote or tip

Metric Cards Row (4 cards):
- Card 1: "Açık Teklifler" - Large number "12" - Green arrow up "+3 bu hafta"
- Card 2: "Bu Ay Kazanılan" - "₺45,000" - Trend line mini chart
- Card 3: "Dönüşüm Oranı" - "34%" - Circular progress indicator
- Card 4: "Pipeline Değeri" - "₺120,000" - Blue accent

Cards styling:
- White background, subtle shadow
- 12px border radius
- Icon in top right (muted color)
- Number large (32px), label small (14px), trend small with color

Two Column Section Below:

Left Column (60%):
- "Son Aktivite" section
- Timeline list:
  - Each item: Avatar, "ABC Ltd teklifi görüntüledi", "2 saat önce"
  - Alternating subtle background
  - Click to navigate

Right Column (40%):
- "Hızlı Aksiyonlar" section
- Large icon buttons in 2x2 grid:
  - "Yeni Anlaşma" (plus icon, blue)
  - "Teklif Oluştur" (document icon, green)
  - "Kişi Ekle" (user-plus icon, gray)
  - "Rapor Al" (download icon, gray)

Bottom Section:
- "Yaklaşan Görevler" mini calendar or list
- Shows next 3-5 items with due dates

Design Notes:
- Dashboard should feel alive with subtle data indicators
- Use skeleton loading states
- Real-time updates should have subtle animation
- Mobile: Stack everything vertically, collapsible sections
```

---

### PROMPT 4: CRM Kanban Board

```
Design a Kanban-style deal management board for AERO CRM.

Overall Layout:
- Header with page title, filters, and action buttons
- Horizontal scrollable board with columns

Header Section:
- Title: "Anlaşmalar" (Deals)
- Left side: 
  - Search input (search icon, placeholder "Anlaşma ara...")
  - Filter dropdown (funnel icon): Stage, Value, Date, Owner
- Right side:
  - View toggle: [Kanban] [Liste] (Kanban active)
  - "+ Yeni Anlaşma" primary button

Kanban Board:

Columns (5):
1. "Aday" (Lead) - Gray header accent
2. "Teklif Gönderildi" (Proposal Sent) - Blue header accent
3. "Görüşme" (Negotiation) - Amber header accent
4. "Kazanıldı" (Won) - Green header accent
5. "Kaybedildi" (Lost) - Red header accent, collapsed by default

Column Structure:
- Header: Stage name, Deal count, Total value
- Example: "Teklif Gönderildi (5) - ₺45,000"
- Droppable area for cards
- "+ Ekle" button at bottom (subtle, dashed border)

Deal Card Design (200px width, variable height):
- White background, subtle shadow
- Top: Company/Contact name (bold, 14px)
- Below: Deal title (regular, 13px, gray)
- Value: "₺15,000" (bold, blue or green)
- Bottom row:
  - Contact avatar (24px, circle)
  - Last activity: "2s önce" (small, gray)
  - Quick menu dots (...)
- Hover: Elevate slightly, show quick actions
- Dragging: Rotate 2-3 degrees, increased shadow

Special Indicators on Cards:
- Proposal badge: "📄 Teklif Gönderildi" (small pill)
- Hot deal: Fire emoji or red dot
- Stale deal: Yellow warning if no activity 7+ days

Drag and Drop:
- Smooth animation
- Column highlights when hovering with card
- Drop zone indicator

Column Interactions:
- Click column header to expand/collapse
- Collapsed shows only count
- "Lost" column collapsed by default with red tint

Mobile Adaptation:
- Horizontal scroll with snap
- Each column takes ~85% screen width
- Swipe between stages
- Pull down to add new deal

Empty State:
- Illustration of empty board
- "Henüz anlaşma yok. İlk anlaşmanızı ekleyin!"
- CTA button
```

---

### PROMPT 5: Deal Detail Page

```
Design a comprehensive deal detail page for AERO CRM.

Layout:
- Full width content area
- Back button and breadcrumb at top
- Two-column layout on desktop (60/40 split)

Header Section:
- Back arrow + "Anlaşmalar"
- Deal title large: "ABC Şirketi - SEO Projesi"
- Stage badge (colored pill): "Teklif Gönderildi" (blue)
- Actions dropdown: Edit, Archive, Delete

Left Column (Main Info):

Deal Info Card:
- Stage dropdown (inline editable)
- Value: "₺15,000" (editable with pencil icon)
- Expected close date: "30 Ocak 2025" (date picker)
- Created date: "15 Ocak 2025" (static)
- Owner: Avatar + name (if team feature)

Tabs Section:
- Tab bar: [Ürünler] [Teklifler] [Notlar] [Aktivite] [Dosyalar]
- Active tab has bottom blue border
- Content area below tabs

Tab 1 - Ürünler (Products):
- Table with columns: Ürün, Birim Fiyat, Miktar, Toplam
- Rows of products with inline edit capability
- "+" Add product button
- Total row at bottom (bold, larger)

Tab 2 - Teklifler (Proposals):
- List of proposals for this deal
- Each item: Proposal name, Status badge, Created date, View link
- If no proposals: Empty state with "Teklif Oluştur" button

Tab 3 - Notlar (Notes):
- Rich text area
- Mention support (@teammate)
- Auto-save indicator

Tab 4 - Aktivite (Activity):
- Timeline format
- Icons for different events: created, stage change, proposal sent, viewed, signed
- Each: Icon, Description, Timestamp, User avatar

Tab 5 - Dosyalar (Files):
- Grid of file thumbnails
- Upload drop zone
- File type icons

Right Column (Sidebar):

Contact Card:
- Large avatar
- Contact name (bold)
- Company name
- Email (clickable, copy icon)
- Phone (clickable)
- "Profili Gör" link button

Proposal CTA Card (if no proposal yet):
- Gradient blue background
- Rocket icon
- "Teklif Oluştur"
- Subtitle: "Bu anlaşma için teklif hazırlayın"
- Large button: "Şablon Seç"

Quick Stats Mini Cards:
- Days in pipeline
- Number of touches
- Probability (if implemented)

Mobile Adaptation:
- Single column
- Contact card moves to top (collapsible)
- Tabs become horizontal scrollable
- Sticky bottom bar with main actions
```

---

### PROMPT 6: Contacts List

```
Design a contacts list/directory page for AERO CRM.

Header Section:
- Title: "Kişiler"
- Left: Search input, Filter dropdown
- Right: View toggle [Liste] [Kart], "+ Yeni Kişi" button

List View (Default):

Table Layout:
- Columns: Checkbox, Avatar+Name, Email, Telefon, Şirket, Toplam Değer, Son Aktivite, Actions
- Sortable columns (click header)
- Sticky header on scroll

Row Design:
- 64px height
- Alternating subtle background (optional)
- Avatar (36px) + Name (bold) + Company (small, below)
- Email with copy icon on hover
- Phone with click-to-call
- Total deal value from their deals
- "3 gün önce" relative time
- Three-dot menu: View, Edit, Delete

Bulk Actions:
- Checkbox in header selects all
- When selected: Action bar appears
- Bulk actions: Export, Tag, Delete

Card View (Toggle):
- Grid of contact cards (3-4 per row)
- Card: Avatar large, Name, Company, Email, Phone
- Quick action buttons on hover

Pagination:
- Bottom: "1-25 of 156 kişi"
- Items per page selector
- Page numbers / Next-Prev

Empty State:
- Illustration of address book
- "Henüz kişi eklenmemiş"
- "İlk kişinizi ekleyin" button

Mobile:
- Card view default
- Search sticky at top
- Floating action button for add
```

---

### PROMPT 7: Proposal Editor (MAIN FEATURE PAGE)

```
Design a block-based proposal editor for AERO CRM, inspired by Notion but specialized for sales proposals.

Overall Layout:
- Header bar (fixed)
- Three-panel layout: Left (Blocks), Center (Canvas), Right (Properties)

Header Bar:
- Back arrow + Deal name: "ABC Şirketi Teklifi"
- Center: Document title (editable inline)
- Right: [Önizle] [Kaydet] [Gönder] buttons
- Auto-save indicator: "Kaydedildi ✓"

Left Panel - Block Palette (240px):
- Title: "Bloklar"
- Search blocks input
- Categories with icons:

  "Temel" section:
  - Hero (image icon) - Cover section
  - Metin (text icon) - Paragraph
  - Başlık (heading icon) - H1/H2/H3
  - Görsel (image icon) - Single image
  - Video (play icon) - Embed
  - Ayraç (minus icon) - Divider

  "İçerik" section:
  - Fiyat Tablosu (table icon) - Pricing
  - Timeline (list icon) - Project phases
  - Takım (users icon) - Team members
  - SSS (help icon) - FAQ accordion
  - Referans (quote icon) - Testimonial

  "Aksiyon" section:
  - E-İmza (pen icon) - Signature
  - CTA Butonu (button icon) - Action button
  - Geri Sayım (clock icon) - Countdown timer
  - Şartlar (file icon) - Terms

Each block item:
- Icon + Name
- Draggable (cursor: grab)
- Hover: Light blue background
- Drag: Ghost preview

Center Panel - Canvas (Flexible width):
- White background simulating page
- Page width indicator (Desktop/Tablet/Mobile toggle at bottom)
- Blocks stacked vertically

Canvas Interactions:
- Drop zone between blocks (blue line indicator)
- Selected block: Blue border, resize handles
- Hover block: Light gray border, drag handle appears
- Drag to reorder

Block on Canvas Example:
- Block wrapper with subtle border
- Drag handle (dots icon) on left
- Delete button on right (trash icon, on hover)
- Content area specific to block type

Sample Blocks Rendered:

Hero Block:
- Full width image placeholder
- Overlay text: "{{Müşteri_Adı}} için Özel Teklif"
- Smart variable highlighted in yellow

Pricing Block:
- Auto-pulled from Deal products
- Table: Hizmet | Fiyat | Miktar | Toplam
- Total row bold
- Note: "CRM'den otomatik çekildi" indicator

E-Signature Block:
- Signature line placeholder
- "Bu teklifi kabul ediyorum" checkbox
- Name field auto-filled: {{Müşteri_Adı}}
- Date field: auto

Right Panel - Properties (280px):
- Title: "Özellikler" (or selected block name)
- Collapsible sections:

For Hero Block:
- "Görsel" section: Upload button, URL input
- "Başlık" section: Text input with {{variable}} hint
- "Alt Başlık" section: Text input
- "Hizalama" section: Left/Center/Right toggle
- "Arka Plan" section: Color picker

For Pricing Block:
- "Kaynak" section: "CRM'den Çek" or "Manuel"
- "Sütunlar" section: Checkboxes for which to show
- "Para Birimi" section: Dropdown
- "İndirim" section: Toggle + percentage input

"Akıllı Değişkenler" Accordion:
- List of available variables:
  - {{Müşteri_Adı}} - Click to insert
  - {{Şirket}}
  - {{Proje_Tutarı}}
  - {{Tarih}}
  - {{Geçerlilik_Süresi}}
- Each clickable to insert at cursor

"AI Önerileri" Section:
- Light purple background
- "🤖 Conversion için öneri: Urgency timer ekleyin"
- "Uygula" button

Bottom Bar:
- Device toggle: [Desktop] [Tablet] [Mobile] icons
- Zoom slider: 50% - 100% - 150%
- "Önizle" opens full-screen preview modal

Design Notes:
- Smooth drag and drop with react-beautiful-dnd or similar
- Real-time preview updates
- Auto-save every 30 seconds
- Keyboard shortcuts (Cmd+S save, Cmd+P preview)
- Mobile: Bottom sheet for properties, simplified block picker
```

---

### PROMPT 8: Proposal Preview Page

```
Design a full-screen proposal preview showing exactly what the customer will see.

Layout:
- No sidebar, no navigation (clean view)
- Floating toolbar at bottom

Preview Area:
- White page background
- Centered content (max-width 800px for desktop)
- All blocks rendered as final
- Live responsive based on device toggle

Device Frame (Optional):
- When mobile view selected, show in iPhone frame
- Tablet shows in iPad frame
- Desktop shows without frame

Floating Toolbar (Bottom, centered):
- Pill-shaped, dark background, glass morphism effect
- Left: Device toggles [Desktop] [Tablet] [Mobile]
- Center: Page indicator (if multiple pages in future)
- Right: [Düzenlemeye Dön] [Gönder] buttons

Preview Content Example:
- Hero with full-bleed image, title overlay
- Text sections with clean typography
- Pricing table with professional styling
- Countdown timer (if added)
- E-signature area with placeholder

Link Preview Section:
- At top of page (collapsible banner)
- "Bu teklifin linki: aerocrm.com/p/abc123"
- Copy button
- QR code button (opens QR modal)

Interactions:
- Scroll through entire proposal
- Device switch animates smoothly
- No editing capability in preview mode

Mobile:
- Full screen, no toolbar
- Swipe down to close or back button
- Share button instead of send
```

---

### PROMPT 9: Spyglass Analytics Dashboard

```
Design an analytics dashboard for proposal tracking called "Spyglass" for AERO CRM.

Header:
- Title: "Spyglass 🔍" with eye icon
- Date range picker: [Son 7 Gün ▼] [Son 30 Gün] [Özel]
- Export button: "CSV İndir"

Top Metric Cards (4):
- Gönderilen: "24" with send icon, "+8 vs last period"
- Görüntülenen: "18" with eye icon, "75% open rate"
- İmzalanan: "8" with check icon, "44% conversion"
- Ortalama Süre: "4:32" with clock icon, "viewing time"

Each card:
- White background, subtle border
- Large metric number
- Small label
- Trend indicator with color
- Sparkline mini chart

Conversion Funnel Section:
- Title: "Dönüşüm Hunisi"
- Horizontal funnel visualization
- Stages: Gönderildi → Açıldı → Detaylı İncelendi → İmzalandı
- Numbers and percentages at each stage
- Color gradient from blue to green

Two Column Section:

Left - Heat Map Section:
- Title: "Blok Etkileşim Haritası"
- Vertical bar chart or list showing time spent on each block type
- Example:
  - Fiyat Tablosu: ████████ 120s (red/hot)
  - Hakkımızda: ███ 45s (yellow)
  - Hero: ██ 15s (blue/cool)
- Legend: Hot (>60s), Warm (30-60s), Cool (<30s)

Right - Activity Feed:
- Title: "Son Aktiviteler"
- Real-time feed:
  - "ABC Ltd teklifi açtı" - 2 dk önce - Eye icon
  - "XYZ Co imzaladı! 🎉" - 1 saat önce - Check icon
  - "DEF teklifi 3. kez görüntülendi" - 3 saat önce - Repeat icon
- Each item clickable to view proposal

Proposals Table Section:
- Title: "Tüm Teklifler"
- Sortable table columns:
  - Teklif Adı (with status badge)
  - Müşteri
  - Gönderim Tarihi
  - Görüntülenme (count)
  - Süre (total time)
  - Durum (Sent/Viewed/Signed/Expired)
- Row click opens proposal detail
- Status badges: Gray=Sent, Blue=Viewed, Green=Signed, Red=Expired

Bottom Insights Card (AI-powered suggestion):
- Light gradient background
- "💡 Insight: Fiyat tablosunda ortalama 2 dakika geçiriliyor. Daha detaylı fiyat açıklaması dönüşümü artırabilir."
- "Daha Fazla İpucu" link

Mobile Adaptation:
- Cards stack vertically
- Funnel becomes vertical
- Table becomes card list
- Sticky header with filters
```

---

### PROMPT 10: Proposal Web Page (Customer View)

```
Design the customer-facing proposal web page - this is what clients see when they receive a proposal link from AERO CRM.

Important: This is a PUBLIC page, no app chrome, just the proposal content.

Layout:
- Clean, white background
- No navigation or sidebar
- Content centered (max-width 900px)
- Sticky bottom bar for action

Page Structure:

Top Section:
- Small "Powered by AERO" badge (subtle, top right) - removable for Pro users
- If urgency enabled: Full-width countdown banner
  - "Bu teklif 47 saat 23 dakika sonra geçersiz olacak"
  - Yellow background with animated countdown

Hero Section (Full width):
- Large cover image
- Overlay with gradient
- Main title: "ABC Şirketi için Web Sitesi Teklifi"
- Subtitle: "Özel olarak hazırlandı"
- Logo of sending company (optional)

Content Sections:
- Clean typography
- Generous white space
- Images optimized and lazy-loaded

Pricing Section:
- Professional table design
- Alternating row colors
- Clear totals
- Optional: Discount highlight

Timeline Section (if added):
- Horizontal or vertical timeline
- Project milestones
- Clean iconography

Testimonial Section (if added):
- Quote in large italic
- Customer photo and name
- Company logo

Signature Section:
- Clear heading: "Teklifi Kabul Et"
- Terms checkbox: "Şartları ve koşulları okudum, kabul ediyorum"
- Signature canvas area
  - "İmzanızı buraya çizin" placeholder
  - Touch/mouse drawing support
  - "Temizle" button
- Name field (pre-filled from contact data)
- "Kabul Et ve İmzala" large green button

Sticky Bottom Bar (Mobile):
- Glass morphism background
- Total amount: "Toplam: ₺15,000"
- "İmzala" button
- Appears when scrolled past signature section

Footer:
- "Bu teklif [Company Name] tarafından AERO ile oluşturuldu"
- Contact information
- Privacy policy link

Interactions:
- Smooth scrolling
- Signature drawing with pressure sensitivity (optional)
- Confetti animation on successful signature
- Redirect to thank you page

Mobile Optimization:
- Full responsive
- Large touch targets
- No horizontal scroll
- Image optimization
- Fast loading (< 3 seconds)

Accessibility:
- High contrast text
- Alt text for images
- Keyboard navigation for form elements
```

---

### PROMPT 11: Settings - Integrations Hub

```
Design an integrations management page for AERO CRM where users can connect third-party services.

Header:
- Title: "Entegrasyonlar"
- Subtitle: "Favori araçlarınızı AERO'ya bağlayın"

Search and Filter:
- Search input: "Entegrasyon ara..."
- Filter tabs: [Tümü] [Bağlı] [Önerilen]

Integration Categories:

"İletişim" Section:
- Gmail - Email sync (Connected badge)
- Slack - Notifications (Connect button)
- WhatsApp Business - Messaging (Connect button)
- Zoom - Meetings (Coming soon badge)

"Ödeme" Section:
- Stripe - Online payments (Connect button)
- PayPal - Payments (Connect button)
- iyzico - TR payments (Connect button)

"Depolama" Section:
- Google Drive - File storage (Connected badge)
- Dropbox - File storage (Connect button)

"Otomasyon" Section:
- Zapier - Automation (Connect button)
- Webhook - Custom triggers (Configure button)

"Takvim" Section:
- Google Calendar - Sync (Connect button)
- Outlook Calendar - Sync (Connect button)

Integration Card Design:
- 200px x 120px card
- White background, border
- Top: Service logo (40x40)
- Middle: Service name + short description
- Bottom: Status + Action button

Connected State:
- Green "Bağlı" badge
- Settings gear icon
- Last sync time: "Son senkron: 5 dk önce"
- "Bağlantıyı Kes" button (small, text)

Not Connected State:
- "Bağlan" primary button
- "Daha Fazla" link

Coming Soon State:
- Grayed out
- "Yakında" badge
- "Bana Haber Ver" link

Connection Modal (when clicking Connect):
- Service logo large
- Description of what connecting does
- Required permissions list
- "AERO şunlara erişecek:" list
- OAuth button: "Google ile Bağlan"
- Cancel button

Webhook Configuration Panel:
- List of webhook URLs
- Add new webhook button
- Events to trigger: Checkboxes for proposal_viewed, proposal_signed, deal_won, etc.
- Test webhook button

Mobile:
- Cards stack 2 per row on tablet, 1 on phone
- Bottom sheet for connection modal
```

---

### PROMPT 12: Send Proposal Modal

```
Design a modal for sending a proposal to a customer in AERO CRM.

Modal Size: 600px width, auto height

Header:
- Title: "Teklifi Gönder"
- Subtitle: "ABC Şirketi - Web Sitesi Teklifi"
- Close X button

Sending Method Selection:
- Radio cards (horizontal on desktop, stacked on mobile):
  1. Email - Envelope icon - "E-posta gönder"
  2. WhatsApp - WhatsApp icon - "WhatsApp mesajı"
  3. SMS - Phone icon - "SMS gönder"
  4. Link - Link icon - "Sadece link kopyala"

Email Selected State:
- "Alıcı" field: Pre-filled with contact email, editable
- "Konu" field: Pre-filled "ABC Şirketi için Teklif"
- "Mesaj" rich text area:
  - Pre-filled template:
    "Merhaba {{Müşteri_Adı}},
    
    Görüşmemiz doğrultusunda hazırladığım teklifi ekte bulabilirsiniz.
    
    Teklifi görüntülemek için: [Link otomatik eklenecek]
    
    İyi çalışmalar,
    [Kullanıcı Adı]"
- Preview link toggle: Show/hide link in email

WhatsApp Selected State:
- Phone number field (pre-filled from contact)
- Message preview (shorter version)
- Note: "WhatsApp uygulaması açılacak"

Urgency Settings Section:
- Toggle: "Geçerlilik süresi ekle"
- If enabled:
  - Duration dropdown: 24 saat / 48 saat / 7 gün / 14 gün / 30 gün / Sınırsız
  - Toggle: "Geri sayım göster" (countdown timer on proposal)
  - Warning text: "Süre dolduğunda teklif erişilemez olacak"

PDF Option:
- Toggle: "PDF kopyasını ekle"
- Note: "E-posta boyutu artacaktır"

Footer:
- Left: "Önizle" text button
- Right: "İptal" secondary button, "Gönder" primary button with send icon

Loading State:
- When sending: Button shows spinner
- Success: Green checkmark animation, "Gönderildi!" message
- Auto-close after 2 seconds or "Tamam" button

Post-Send View:
- Success illustration
- "Teklif başarıyla gönderildi!"
- Link display with copy button
- "Spyglass'ta Takip Et" button
- "Başka Teklif Gönder" link

Mobile:
- Full screen modal
- Fixed bottom action buttons
- Collapsible sections
```

---

## 4.3 Component Library Promptları

### Component: Metric Card

```
Design a reusable metric card component for AERO CRM dashboards.

Variants:
1. Basic - Just number and label
2. With Trend - Number, label, and trend indicator
3. With Chart - Number, label, and sparkline

Basic Structure:
- Card container: White bg, 12px radius, subtle shadow
- Padding: 24px
- Icon in top right corner (muted color)
- Large number: 32px, bold, primary color
- Label below: 14px, gray text

With Trend:
- Add trend row below label
- Green arrow up with "+12%" for positive
- Red arrow down with "-5%" for negative
- Neutral dash for no change

With Chart:
- Mini sparkline chart (50px height)
- Last 7 days data points
- Color matches trend (green/red/blue)

Hover State:
- Slight elevation increase
- Optional: Tooltip with more details

Sizes:
- Small: 160px wide (dashboard grid)
- Medium: 200px wide (default)
- Large: Full width (mobile)

Dark Mode:
- Dark background (#1E293B)
- Light text
- Adjusted shadow

Usage: Grid of 4 cards on dashboard, or inline in sections
```

---

### Component: Deal Card (Kanban)

```
Design a deal card component for the Kanban board in AERO CRM.

Card Dimensions:
- Width: 260px (fits column)
- Height: Auto (based on content)
- Padding: 16px

Content Structure:
- Company/Contact name: Bold, 14px, truncate with ellipsis
- Deal title: Regular, 13px, gray, 2-line max
- Value: Bold, 16px, blue color, "₺" prefix
- Divider line (subtle)
- Bottom row: Avatar (24px) + activity text + menu dots

Status Indicators:
- Proposal badge: Small pill "📄 Teklif Gönderildi"
- Hot deal: Fire emoji or red border
- Stale warning: Yellow left border if >7 days no activity

States:
- Default: Subtle shadow
- Hover: Elevated shadow, show quick actions
- Dragging: Rotated 3°, larger shadow, opacity 90%
- Selected: Blue border

Quick Actions (on hover):
- Small icons appear: View, Edit, Add Proposal
- Or three-dot menu opens dropdown

Drag Handle:
- Six dots icon on left side
- Appears on hover
- Cursor: grab / grabbing

Animations:
- Hover elevation: 200ms ease
- Drag rotate: smooth
- Drop: Snap animation

Mobile:
- Full width minus padding
- Swipe actions: Left to archive, Right to promote stage
```

---

### Component: Block (Proposal Editor)

```
Design the block components for AERO CRM's proposal editor.

Block Wrapper (Universal):
- Container with subtle border on hover
- Drag handle on left (6 dots icon)
- Delete button on right (trash, hover only)
- Selected state: Blue border, resize handles if applicable
- Margin bottom: 16px

Individual Blocks:

HERO BLOCK:
- Full width image area (16:9 or custom ratio)
- Gradient overlay (bottom to top, dark)
- Text overlay: Title (H1, white) + Subtitle (H3, white/80%)
- Placeholder: Dashed border, camera icon, "Görsel Yükle"

TEXT BLOCK:
- Rich text area
- Placeholder: "Yazmaya başlayın veya '/' yazarak blok ekleyin"
- Toolbar on select: Bold, Italic, Link, Variable insert

HEADING BLOCK:
- Dropdown for H1/H2/H3
- Large text input
- Variable support highlighted

PRICING BLOCK:
- Table with header row (dark background)
- Columns: Hizmet, Açıklama, Fiyat, Miktar, Toplam
- Rows from products (editable)
- Totals row (bold, larger)
- "CRM'den Senkronize" badge

VIDEO BLOCK:
- URL input at top
- Embedded player preview
- Supported: YouTube, Vimeo, Loom
- Thumbnail with play button

TESTIMONIAL BLOCK:
- Large quote marks icon
- Quote text area (italic)
- Author info: Photo, Name, Title

TIMELINE BLOCK:
- Vertical timeline with dots
- Each milestone: Title, Description, Optional date
- Add milestone button

E-SIGNATURE BLOCK:
- Signature line with "x" mark
- Canvas area for drawing
- Name field below
- Date auto-filled

COUNTDOWN BLOCK:
- Large numbers: Days : Hours : Minutes
- Urgency message text input
- Background color picker (default: amber)

CTA BUTTON BLOCK:
- Button preview (editable text)
- Link/action selector
- Style options: Primary, Secondary, Outline

Responsive Behavior:
- All blocks should look good at different page widths
- Editor shows device preview toggle
```

---

## 4.4 Micro-Interaction Promptları

### Animation: Page Load

```
Design page load animations for AERO CRM.

Dashboard Load:
1. Skeleton screens appear instantly
2. Metric cards load left to right (stagger 50ms each)
3. Numbers count up from 0 to actual value (500ms)
4. Activity feed items fade in from bottom (stagger 100ms)
5. Total animation duration: ~1.5 seconds

Kanban Load:
1. Column headers appear first
2. Cards cascade down each column
3. Stagger: 30ms per card, columns load left to right
4. Cards have slight scale up (0.95 to 1) on appear

Proposal Editor Load:
1. Left panel slides in from left
2. Canvas fades in center
3. Right panel slides in from right
4. Simultaneous but staggered by 100ms

Mobile:
- Simpler animations
- Reduced motion option respected
- Skeleton screens prioritized over complex animations
```

---

### Animation: Drag and Drop

```
Design drag and drop animations for AERO CRM Kanban and Proposal Editor.

Kanban Card Drag:
- Pickup: Scale 1.02, rotate 2°, shadow increase
- Dragging: Cursor grabbing, slight opacity (95%)
- Over dropzone: Zone highlights with blue border
- Drop: Snap animation, scale back, rotate back
- Cards below shift down smoothly (200ms ease)

Block Drag (Proposal Editor):
- Pickup: Blue outline, scale 1.01
- Dragging: Ghost preview follows cursor
- Drop indicator: Blue horizontal line between blocks
- Drop: Smooth insertion, surrounding blocks adjust

Column Drag (if stage reorder allowed):
- Entire column lifts
- Other columns shift horizontally
- Drop zone highlighting

Accessibility:
- Keyboard alternatives for drag (arrow keys)
- Focus indicators
- Screen reader announcements
```

---

### Animation: Notifications & Toasts

```
Design notification and toast animations for AERO CRM.

Toast Notifications:
- Position: Top right (desktop), Top center (mobile)
- Enter: Slide in from right + fade in (300ms ease-out)
- Exit: Slide out right + fade out (200ms ease-in)
- Auto-dismiss: 5 seconds default

Toast Types:
- Success: Green left border, checkmark icon
- Error: Red left border, X icon
- Warning: Amber left border, alert icon
- Info: Blue left border, info icon

Real-time Notification (Proposal viewed):
- Special toast with avatar
- "🔔 ABC Şirketi teklifinizi şu an görüntülüyor!"
- Pulsinganimation on notification bell
- Sound option (muted by default)

Notification Center (Drawer):
- Slides in from right
- Items fade in staggered
- Unread items have blue dot
- Mark as read: Dot fades out

Confetti Animation (Proposal Signed):
- Full screen confetti burst
- Colors: Brand blue, success green, gold
- Duration: 2 seconds
- Celebration sound (optional)
```

---

# BÖLÜM 5: RESPONSIVE BREAKPOINTS

```css
/* Mobile First Approach */

/* Base: Mobile (< 640px) */
:root {
  --sidebar-width: 0;
  --content-padding: 16px;
  --card-columns: 1;
}

/* Small (sm): >= 640px */
@media (min-width: 640px) {
  :root {
    --content-padding: 24px;
    --card-columns: 2;
  }
}

/* Medium (md): >= 768px */
@media (min-width: 768px) {
  :root {
    --sidebar-width: 64px; /* Collapsed sidebar */
    --content-padding: 24px;
  }
}

/* Large (lg): >= 1024px */
@media (min-width: 1024px) {
  :root {
    --sidebar-width: 240px; /* Full sidebar */
    --content-padding: 32px;
    --card-columns: 3;
  }
}

/* Extra Large (xl): >= 1280px */
@media (min-width: 1280px) {
  :root {
    --card-columns: 4;
  }
}

/* 2XL (2xl): >= 1536px */
@media (min-width: 1536px) {
  :root {
    --content-max-width: 1400px;
  }
}
```

---

# BÖLÜM 6: ÖZEL NOTLAR VE SONUÇ

## 6.1 Tasarım Öncelikleri

1. **Hız:** Tüm aksiyonlar 3 tık veya daha az
2. **Netlik:** Her sayfanın amacı belirgin
3. **Tutarlılık:** Tüm sayfalarda aynı pattern'lar
4. **Güven:** Profesyonel, kurumsal görünüm
5. **Sevinç:** Başarı anlarında kutlama (confetti, animasyonlar)

## 6.2 Teknik Gereksinimler

- Next.js 14+ (App Router)
- Tailwind CSS
- Framer Motion (animasyonlar)
- React Beautiful DnD (sürükle-bırak)
- Lucide Icons
- Supabase (backend)
- Vercel (deployment)

## 6.3 Erişilebilirlik

- WCAG 2.1 AA uyumlu
- Keyboard navigation
- Screen reader friendly
- High contrast mode
- Reduced motion support

## 6.4 Sonuç

Bu doküman, AERO CRM + Aero Docs projesinin tüm UI/UX gereksinimlerini kapsamaktadır:

- **36 sayfa/bileşen** tanımlanmıştır
- **12 detaylı Google Stitch prompt'u** hazırlanmıştır
- **Kapsamlı tasarım sistemi** dokümante edilmiştir
- **Responsive tasarım** kuralları belirlenmiştir

Her prompt, Google Stitch veya benzer AI tasarım araçlarıyla doğrudan kullanılabilir formattadır.

---

*Doküman Versiyonu: 1.0*
*Oluşturulma Tarihi: Ocak 2025*
*Aero CRM UI/UX Spesifikasyonu*
