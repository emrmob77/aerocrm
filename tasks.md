# AERO CRM Platform - Implementasyon Görev Listesi

## Genel Bakış

Bu görev listesi, AERO CRM platformunun SSR optimizasyonlu, gerçek zamanlı ve ultra hızlı bir şekilde implementasyonunu sağlar. Her görev, önceki görevler üzerine inşa edilir ve hiçbir kod parçası bağımsız kalmaz.

## Görevler

- [x] 1. Proje Kurulumu ve Temel Altyapı ✅
  - Next.js 14 projesi oluştur (App Router) ✅
  - TypeScript, Tailwind CSS, ESLint, Prettier konfigürasyonu ✅
  - Supabase client kurulumu ve environment variables ✅
  - Temel klasör yapısı oluştur (app, components, lib, types, hooks) ✅
  - _Gereksinimler: Tüm temel gereksinimler için altyapı_

- [ ]* 1.1 Test ortamı kurulumu
  - Vitest ve React Testing Library kurulumu
  - Test veritabanı konfigürasyonu
  - Property-based testing için fast-check kurulumu
  - _Gereksinimler: Test stratejisi_

- [x] 2. Supabase Veritabanı Şeması Oluşturma ✅
  - PostgreSQL tablolarını oluştur (users, teams, contacts, deals, proposals, vb.) ✅
  - İndeksleri ve foreign key'leri tanımla ✅
  - Row Level Security (RLS) politikalarını ayarla ✅
  - Materialized view'ları oluştur (dashboard metrikleri için) ✅
  - Database fonksiyonları ve trigger'ları oluştur ✅
  - Realtime etkinleştir ✅
  - _Gereksinimler: Tüm veri modelleri_

- [ ]* 2.1 Veritabanı performans optimizasyonu
  - Kritik indeksleri oluştur
  - Query performans testleri yaz
  - Connection pooling konfigürasyonu
  - _Gereksinimler: Performans gereksinimleri_

- [x] 3. Kimlik Doğrulama Sistemi ✅
  - Supabase Auth konfigürasyonu ✅
  - AuthProvider context bileşeni oluştur ✅
  - Login/Register sayfalarını oluştur (SSR) ✅
  - OAuth (Google) entegrasyonu ✅
  - Şifre sıfırlama akışı ✅
  - _Gereksinimler: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ]* 3.1 Kimlik doğrulama property testleri
  - **Property 1: Kimlik Doğrulama Tutarlılığı**
  - **Property 2: Geçersiz Kimlik Bilgileri Reddi**
  - **Doğrular: Gereksinimler 1.1, 1.2**

- [x] 4. Temel Layout ve Navigation ✅
  - Ana layout bileşeni oluştur (SSR uyumlu) ✅
  - Sidebar navigation bileşeni ✅
  - Header ve breadcrumb bileşenleri ✅
  - Responsive tasarım implementasyonu ✅
  - Dark mode toggle ✅
  - _Gereksinimler: Tüm sayfa navigasyonu_

- [x] 5. Dashboard Sistemi (SSR) ✅
  - Dashboard sayfası oluştur (Server Component) ✅
  - Metrik kartları bileşeni ✅
  - Aktivite akışı bileşeni ✅
  - Hızlı aksiyonlar bileşeni ✅
  - Gerçek zamanlı veri güncellemeleri ✅
  - _Gereksinimler: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ]* 5.1 Dashboard property testleri
  - **Property 3: Dashboard Metrik Görünürlüğü**
  - **Doğrular: Gereksinim 2.2**

- [x] 6. CRM Kanban Sistemi ✅
  - Kanban board layout bileşeni ✅
  - Deal card bileşeni ✅
  - React Beautiful DnD entegrasyonu ✅
  - Sürükle-bırak işlevselliği ✅
  - Stage değişikliği optimistic updates ✅
  - Gerçek zamanlı senkronizasyon ✅
  - _Gereksinimler: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ]* 6.1 Kanban property testleri
  - **Property 4: Kanban Aşama Tutarlılığı**
  - **Property 5: Anlaşma Sürükle-Bırak Tutarlılığı**
  - **Doğrular: Gereksinimler 3.1, 3.2**

- [x] 7. Kişi Yönetimi Sistemi ✅
  - Kişiler listesi sayfası (SSR)
  - Kişi detay sayfası
  - Kişi ekleme/düzenleme formları
  - Arama ve filtreleme işlevselliği
  - Toplu işlemler (bulk actions)
  - _Gereksinimler: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x]* 7.1 Kişi yönetimi property testleri ✅
  - **Property 6: Arama Kapsamlılığı**
  - **Doğrular: Gereksinim 4.2**

- [x] 8. Checkpoint - Temel CRM İşlevselliği ✅
  - Tüm testlerin geçtiğini doğrula
  - Performans testleri çalıştır
  - Kullanıcı deneyimi testi yap

- [x] 9. Teklif Editörü Sistemi (Blok Tabanlı) ✅
  - Teklif editörü ana layout'u
  - Blok paleti bileşeni
  - Canvas bileşeni (@dnd-kit ile)
  - Properties panel bileşeni
  - Blok türleri (Hero, Text, Pricing, E-signature, vb.)
  - Akıllı değişkenler sistemi
  - _Gereksinimler: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ]* 9.1 Teklif editörü property testleri
  - **Property 7: Blok Ekleme Tutarlılığı**
  - **Property 8: Akıllı Değişken Otomatik Tamamlama**
  - **Doğrular: Gereksinimler 5.2, 5.5**

- [ ]* 9.2 Teklif taslak & sürüm yönetimi
  - Taslak sürümlerini DB'de sakla (örn. proposals_versions)
  - Otomatik taslak kaydetme (periyodik auto-save)
  - Sürüm geçmişinden geri yükleme akışı
  - _Gereksinimler: 5.1, 5.4, 5.6_

- [x] 10. Teklif Gönderim Sistemi ✅
  - Teklif gönderim modal'ı
  - E-posta, WhatsApp, SMS gönderim seçenekleri
  - Benzersiz link oluşturma
  - Geçerlilik süresi ayarlama
  - E-posta şablonu editörü
  - _Gereksinimler: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ]* 10.1 Teklif gönderim property testleri
  - **Property 9: Benzersiz Teklif Linki Oluşturma**
  - **Doğrular: Gereksinim 6.4**

- [ ] 11. Müşteri Teklif Görüntüleme Sayfası
  - Public teklif görüntüleme sayfası (SSR)
  - Mobil uyumlu responsive tasarım
  - E-imza bileşeni (React Signature Canvas)
  - Geri sayım sayacı
  - Teklif görüntüleme tracking
  - _Gereksinimler: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ]* 11.1 Müşteri teklif property testleri
  - **Property 10: İmza Kaydetme Tutarlılığı**
  - **Doğrular: Gereksinim 7.5**

- [ ]* 11.2 Public teklif güvenlik ve iyileştirmeler
  - Public view/sign için RLS politikaları (public_url üzerinden okuma/yazma)
  - İmza sonrası PDF indirme linkini gerçek PDF üretimiyle bağlama
  - Teklif tasarım ayarlarını (accent/bg vb.) DB’ye kaydetme ve public sayfada kullanma
  - _Gereksinimler: 7.1, 7.4, 7.6_

- [x]* 11.3 Public teklifler için RLS politikaları ✅
  - public_url üzerinden read izni
  - imza ve view tracking için update izni
  - _Gereksinimler: 7.1, 7.5_

- [x] 12. Spyglass Analytics Sistemi ✅
  - Analytics dashboard sayfası (SSR) ✅
  - Metrik kartları ve KPI'lar ✅
  - Recharts ile grafik bileşenleri ✅
  - Dönüşüm hunisi görselleştirmesi ✅
  - Blok etkileşim haritası ✅
  - Gerçek zamanlı aktivite akışı
  - Tarih aralığı (takvim) filtresi ✅
  - CSV export (rapor dışa aktarma) ✅
  - Proposals tablosu (özet liste) ✅
  - Line & Pie chart analitik grafikleri ✅
  - _Gereksinimler: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ]* 12.1 Analytics property testleri
  - **Property 11: Dönüşüm Hunisi Görselleştirme**
  - **Doğrular: Gereksinim 8.2**

- [ ] 13. Gerçek Zamanlı Sistem Implementasyonu
  - Supabase Realtime kanalları kurulumu ✅
  - WebSocket bağlantı yönetimi ✅
  - Optimistic updates hook'ları
  - Gerçek zamanlı bildirim sistemi ✅
  - Takım işbirliği özellikleri (presence) ✅
  - _Gereksinimler: Tüm gerçek zamanlı özellikler_

- [ ]* 13.1 Gerçek zamanlı sistem property testleri
  - **Property 15: Gerçek Zamanlı Bildirim Gönderimi**
  - **Doğrular: Gereksinim 12.1**

- [ ]* 13.2 Bildirimler için kalıcı okundu durumu
  - Notifications tablosundan okuma + realtime güncelleme
  - Okundu/okunmadı durumunun DB’ye yazılması
  - Teklif olayları için bildirim kaydı oluşturma (sent/viewed/signed)
  - _Gereksinimler: 12.1_

- [ ] 14. Webhook Entegrasyon Sistemi
  - Webhook yönetim sayfası ✅
  - Webhook konfigürasyon formları ✅
  - Supabase Edge Functions oluştur
  - Test gönderimi işlevselliği ✅
  - Webhook logları ve monitoring ✅
  - Deal eventleri (deal.created/won/lost) webhook dispatch ✅
  - _Gereksinimler: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ]* 14.1 Webhook property testleri
  - **Property 12: Webhook Test Gönderimi**
  - **Doğrular: Gereksinim 9.3**

- [x] 15. Takım Yönetimi Sistemi ✅
  - Takım üyeleri listesi sayfası ✅
  - Üye davet etme işlevselliği ✅
  - Rol ve izin yönetimi ✅
  - Anlaşma atama sistemi ✅
  - Takım performans metrikleri ✅
  - _Gereksinimler: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ]* 15.1 Takım yönetimi property testleri
  - **Property 13: Anlaşma Atama Esnekliği**
  - **Doğrular: Gereksinim 10.5**

- [ ] 16. Ürün Kataloğu Sistemi
  - Ürün listesi sayfası
  - Ürün ekleme/düzenleme formları
  - Kategori yönetimi
  - Fiyat yönetimi ve para birimi desteği
  - Teklif editöründe ürün seçimi entegrasyonu
  - _Gereksinimler: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ]* 16.1 Ürün kataloğu property testleri
  - **Property 14: Ürün Kataloğu Erişilebilirliği**
  - **Doğrular: Gereksinim 11.3**

- [ ] 17. Bildirim Sistemi
  - Bildirim merkezi bileşeni
  - Toast bildirim sistemi (React Hot Toast)
  - E-posta bildirim şablonları
  - Bildirim tercihleri sayfası
  - Push notification desteği (PWA)
  - _Gereksinimler: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 18. Arama ve Filtreleme Sistemi
  - Global arama (Cmd+K) bileşeni
  - Gelişmiş filtreleme arayüzü
  - Arama sonuçları sayfası
  - Kayıtlı arama sorguları
  - Arama geçmişi ve öneriler
  - _Gereksinimler: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ]* 18.1 Arama sistemi property testleri
  - **Property 16: Kapsamlı Arama İşlevi**
  - **Property 24: Gerçek Zamanlı Filtre Güncelleme**
  - **Doğrular: Gereksinimler 13.2, 21.4**

- [ ] 19. Veri İçe/Dışa Aktarma
  - CSV içe aktarma arayüzü
  - Sütun eşleştirme bileşeni
  - Toplu veri işleme
  - Excel/CSV dışa aktarma
  - İşlem geçmişi ve logları
  - _Gereksinimler: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ]* 19.1 Veri aktarım property testleri
  - **Property 17: Veri İçe Aktarma Raporlaması**
  - **Doğrular: Gereksinim 14.4**

- [ ] 20. Şablon Yönetimi Sistemi
  - Şablon galerisi sayfası
  - Şablon editörü
  - Şablon kategorileri
  - Şablon paylaşımı ve takım şablonları
  - Kullanım istatistikleri
  - _Gereksinimler: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ]* 20.1 Şablon yönetimi property testleri
  - **Property 18: Şablon Oluşturma Esnekliği**
  - **Doğrular: Gereksinim 15.2**

- [ ] 21. Anlaşma Detay Sistemi
  - Anlaşma detay sayfası (SSR)
  - Sekmeli arayüz (Ürünler, Teklifler, Notlar, Aktivite, Dosyalar)
  - Zengin metin editörü (React Quill)
  - Dosya yükleme sistemi (React Dropzone)
  - Anlaşma geçmişi timeline'ı
  - _Gereksinimler: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ]* 21.1 Anlaşma detay property testleri
  - **Property 19: Anlaşma Aşama Güncelleme Tutarlılığı**
  - **Doğrular: Gereksinim 16.3**

- [ ] 22. Entegrasyon Hub'ı
  - Entegrasyon listesi sayfası
  - OAuth akış yönetimi
  - Gmail, Slack, Google Drive entegrasyonları
  - Entegrasyon durumu monitoring
  - API anahtarı yönetimi
  - _Gereksinimler: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [ ]* 22.1 Entegrasyon property testleri
  - **Property 20: OAuth Güvenlik Yönetimi**
  - **Doğrular: Gereksinim 17.3**

- [ ] 23. Faturalama ve Abonelik Sistemi
  - Abonelik yönetimi sayfası
  - Stripe entegrasyonu
  - Plan yükseltme/düşürme
  - Fatura geçmişi
  - Kullanım istatistikleri
  - _Gereksinimler: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

- [ ]* 23.1 Faturalama property testleri
  - **Property 21: Plan Değişikliği Anında Uygulama**
  - **Doğrular: Gereksinim 18.3**

- [ ] 24. Sistem Sağlığı ve Monitoring
  - Sistem sağlığı dashboard'u
  - Hata logları ve monitoring
  - Performans metrikleri
  - Otomatik hata raporlaması
  - API kullanım istatistikleri
  - _Gereksinimler: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

- [ ]* 24.1 Sistem monitoring property testleri
  - **Property 22: Otomatik Hata Raporlaması**
  - **Doğrular: Gereksinim 19.4**

- [ ] 25. Çoklu Dil Desteği
  - i18n konfigürasyonu
  - Dil değiştirme bileşeni
  - Türkçe ve İngilizce çeviriler
  - Tarih ve sayı formatları
  - E-posta şablonları çoklu dil desteği
  - _Gereksinimler: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

- [ ]* 25.1 Çoklu dil property testleri
  - **Property 23: Dil Değişikliği Tutarlılığı**
  - **Doğrular: Gereksinim 20.2**

- [ ] 26. PWA ve Mobil Optimizasyon
  - Progressive Web App konfigürasyonu
  - Service Worker implementasyonu
  - Offline veri önbellekleme
  - Mobil responsive optimizasyonları
  - Touch etkileşimleri
  - _Gereksinimler: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_

- [ ]* 26.1 PWA property testleri
  - **Property 25: Offline Veri Önbellekleme**
  - **Doğrular: Gereksinim 22.5**

- [ ] 27. Performans Optimizasyonu
  - Code splitting ve lazy loading
  - Image optimization (Next.js Image)
  - Bundle size optimizasyonu
  - Lighthouse performans testleri
  - Core Web Vitals optimizasyonu
  - _Gereksinimler: Tüm performans gereksinimleri_

- [ ] 28. Güvenlik Implementasyonu
  - CSRF koruması
  - XSS koruması
  - Rate limiting
  - Input validation ve sanitization
  - Security headers konfigürasyonu
  - _Gereksinimler: Güvenlik gereksinimleri_

- [ ] 29. Final Checkpoint - Entegrasyon Testleri
  - Tüm property testlerinin geçtiğini doğrula
  - E2E testleri çalıştır
  - Performans benchmark'ları
  - Güvenlik testleri
  - Kullanıcı kabul testleri

- [ ] 30. Production Deployment
  - Vercel deployment konfigürasyonu
  - Environment variables ayarlama
  - Domain ve SSL sertifikası
  - Monitoring ve logging kurulumu
  - Backup stratejisi implementasyonu

## Notlar

- `*` ile işaretli görevler opsiyoneldir ve hızlı MVP için atlanabilir
- Her görev, belirtilen gereksinimlere referans verir
- Property testleri, tasarım dokümantasyonundaki doğruluk özelliklerini test eder
- Checkpoint görevleri, artımlı doğrulama sağlar
- Tüm görevler SSR ve gerçek zamanlı performans odaklıdır
