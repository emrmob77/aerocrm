# AERO CRM Platform - Gereksinimler Dokümantasyonu

## Giriş

AERO CRM, modern satış ekipleri için tasarlanmış kapsamlı bir müşteri ilişkileri yönetimi ve teklif hazırlama platformudur. Platform, satış süreçlerini hızlandırmak, teklif hazırlama süresini %50 azaltmak ve dönüşüm oranlarını artırmak amacıyla geliştirilmiştir.

## Sözlük

- **AERO_System**: Ana CRM ve teklif yönetim platformu
- **User**: Sistemi kullanan satış temsilcisi, yönetici veya takım üyesi
- **Contact**: Potansiyel veya mevcut müşteri kişisi
- **Deal**: Satış fırsatı/anlaşması
- **Proposal**: Müşteriye gönderilen dijital teklif
- **Block**: Teklif editöründe kullanılan içerik bileşeni
- **Template**: Yeniden kullanılabilir teklif şablonu
- **Pipeline**: Satış aşamalarının görsel temsili
- **Spyglass**: Teklif analitik sistemi
- **Webhook**: Dış sistemlere veri gönderme mekanizması
- **Smart_Variable**: Dinamik veri değişkenleri ({{Müşteri_Adı}} gibi)

## Gereksinimler

### Gereksinim 1: Kullanıcı Kimlik Doğrulama ve Yetkilendirme

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, güvenli bir şekilde sisteme giriş yapabilmek ve verilerime erişebilmek istiyorum.

#### Kabul Kriterleri

1. WHEN bir kullanıcı geçerli e-posta ve şifre girer, THE AERO_System SHALL kullanıcıyı sisteme giriş yaptırır
2. WHEN bir kullanıcı yanlış kimlik bilgileri girer, THE AERO_System SHALL hata mesajı gösterir ve girişi engeller
3. WHEN bir kullanıcı "Beni Hatırla" seçeneğini işaretler, THE AERO_System SHALL 30 gün boyunca oturumu açık tutar
4. THE AERO_System SHALL Google OAuth ile sosyal giriş imkanı sağlar
5. WHEN bir kullanıcı şifresini unutur, THE AERO_System SHALL e-posta ile şifre sıfırlama linki gönderir
6. THE AERO_System SHALL yeni kullanıcı kaydı için e-posta doğrulaması gerektirir

### Gereksinim 2: Ana Dashboard ve Genel Bakış

**Kullanıcı Hikayesi:** Bir satış temsilcisi olarak, günlük performansımı ve önemli metrikleri hızlıca görebilmek istiyorum.

#### Kabul Kriterleri

1. WHEN kullanıcı dashboard'a erişir, THE AERO_System SHALL kişiselleştirilmiş karşılama mesajı gösterir
2. THE AERO_System SHALL açık teklifler, aylık kazanç, dönüşüm oranı ve pipeline değeri metriklerini gösterir
3. WHEN metrik kartlarına hover yapılır, THE AERO_System SHALL detaylı bilgi tooltip'i gösterir
4. THE AERO_System SHALL son aktiviteleri zaman sıralı liste halinde gösterir
5. THE AERO_System SHALL hızlı aksiyonlar için büyük butonlar sağlar
6. WHEN gerçek zamanlı veri güncellemesi olur, THE AERO_System SHALL metrikleri otomatik günceller

### Gereksinim 3: CRM - Anlaşma Yönetimi (Kanban)

**Kullanıcı Hikayesi:** Bir satış yöneticisi olarak, tüm satış fırsatlarını görsel olarak takip edebilmek ve aşamalar arası taşıyabilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL anlaşmaları Aday, Teklif Gönderildi, Görüşme, Kazanıldı, Kaybedildi aşamalarında gösterir
2. WHEN kullanıcı bir anlaşma kartını sürükler, THE AERO_System SHALL kartı yeni aşamaya taşır ve veritabanını günceller
3. WHEN anlaşma kartına tıklanır, THE AERO_System SHALL detay sayfasını açar
4. THE AERO_System SHALL her sütunda toplam anlaşma sayısı ve değerini gösterir
5. WHEN yeni anlaşma eklenir, THE AERO_System SHALL kartı uygun aşamada gösterir
6. THE AERO_System SHALL anlaşma kartlarında müşteri adı, değer, son aktivite ve sorumlu kişi bilgilerini gösterir

### Gereksinim 4: Kişi Yönetimi

**Kullanıcı Hikayesi:** Bir satış temsilcisi olarak, müşteri bilgilerini düzenleyebilmek ve hızlıca erişebilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL kişileri tablo formatında listeleme imkanı sağlar
2. WHEN kullanıcı arama yapar, THE AERO_System SHALL isim, e-posta ve şirket bilgilerinde arama yapar
3. THE AERO_System SHALL kişi bilgilerini inline düzenleme imkanı sağlar
4. WHEN e-posta adresine tıklanır, THE AERO_System SHALL e-posta adresini panoya kopyalar
5. WHEN telefon numarasına tıklanır, THE AERO_System SHALL arama başlatma seçeneği sunar
6. THE AERO_System SHALL toplu işlemler için çoklu seçim imkanı sağlar

### Gereksinim 5: Teklif Editörü (Blok Tabanlı)

**Kullanıcı Hikayesi:** Bir satış temsilcisi olarak, profesyonel teklifler oluşturmak için sürükle-bırak editör kullanabilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL sol panelde sürüklenebilir blok paleti sağlar
2. WHEN kullanıcı bir bloğu canvas'a sürükler, THE AERO_System SHALL bloğu belirtilen konuma ekler
3. THE AERO_System SHALL Hero, Metin, Fiyat Tablosu, E-İmza, Video, Galeri bloklarını destekler
4. WHEN blok seçilir, THE AERO_System SHALL sağ panelde özellik düzenleme arayüzü gösterir
5. THE AERO_System SHALL akıllı değişkenler ({{Müşteri_Adı}}, {{Tarih}}) için otomatik tamamlama sağlar
6. WHEN fiyat tablosu bloku eklenir, THE AERO_System SHALL CRM'den ürün bilgilerini otomatik çeker

### Gereksinim 6: Teklif Gönderimi ve Takibi

**Kullanıcı Hikayesi:** Bir satış temsilcisi olarak, hazırladığım teklifi müşteriye gönderebilmek ve takip edebilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL e-posta, WhatsApp, SMS ve link kopyalama gönderim seçenekleri sunar
2. WHEN e-posta seçilir, THE AERO_System SHALL özelleştirilebilir e-posta şablonu gösterir
3. THE AERO_System SHALL teklif geçerlilik süresi belirleme imkanı sağlar
4. WHEN teklif gönderilir, THE AERO_System SHALL benzersiz görüntüleme linki oluşturur
5. THE AERO_System SHALL teklif görüntüleme, süre ve etkileşim verilerini gerçek zamanlı takip eder
6. WHEN müşteri teklifi görüntüler, THE AERO_System SHALL bildirim gönderir

### Gereksinim 7: Müşteri Teklif Görüntüleme

**Kullanıcı Hikayesi:** Bir müşteri olarak, gönderilen teklifi web üzerinden görüntüleyebilmek ve imzalayabilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL teklifleri giriş gerektirmeden görüntüleme imkanı sağlar
2. THE AERO_System SHALL mobil cihazlarda tam uyumlu görüntüleme sağlar
3. WHEN geçerlilik süresi varsa, THE AERO_System SHALL geri sayım sayacı gösterir
4. THE AERO_System SHALL teklif sonunda e-imza alanı sağlar
5. WHEN müşteri imzalar, THE AERO_System SHALL imzayı kaydeder ve onay sayfası gösterir
6. THE AERO_System SHALL imza sonrası PDF indirme linki sağlar

### Gereksinim 8: Spyglass Analytics

**Kullanıcı Hikayesi:** Bir satış yöneticisi olarak, teklif performansını analiz edebilmek ve iyileştirme alanlarını belirleyebilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL gönderilen, görüntülenen ve imzalanan teklif sayılarını gösterir
2. THE AERO_System SHALL dönüşüm hunisi görselleştirmesi sağlar
3. THE AERO_System SHALL blok bazında etkileşim süreleri haritası gösterir
4. THE AERO_System SHALL gerçek zamanlı aktivite akışı sağlar
5. WHEN tarih aralığı değiştirilir, THE AERO_System SHALL verileri filtreler ve günceller
6. THE AERO_System SHALL CSV formatında rapor dışa aktarma imkanı sağlar

### Gereksinim 9: Webhook Entegrasyonları

**Kullanıcı Hikayesi:** Bir sistem yöneticisi olarak, AERO CRM'i diğer sistemlerle entegre edebilmek için webhook yapılandırabilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL webhook URL'leri ekleme ve yönetme arayüzü sağlar
2. THE AERO_System SHALL teklif görüntülendi, imzalandı, anlaşma kazanıldı olayları için webhook tetikleme sağlar
3. WHEN webhook yapılandırılır, THE AERO_System SHALL test gönderimi imkanı sağlar
4. THE AERO_System SHALL webhook gönderim loglarını ve başarı oranlarını gösterir
5. WHEN webhook başarısız olur, THE AERO_System SHALL yeniden deneme mekanizması çalıştırır
6. THE AERO_System SHALL webhook güvenliği için secret key doğrulaması sağlar

### Gereksinim 10: Takım Yönetimi ve İzinler

**Kullanıcı Hikayesi:** Bir takım lideri olarak, ekip üyelerini yönetebilmek ve uygun izinleri verebilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL takım üyelerini davet etme ve rol atama imkanı sağlar
2. THE AERO_System SHALL Admin, Üye ve Görüntüleyici rol seviyelerini destekler
3. WHEN yeni üye davet edilir, THE AERO_System SHALL e-posta daveti gönderir
4. THE AERO_System SHALL anlaşmaları takım üyeleri arasında atama imkanı sağlar
5. THE AERO_System SHALL takım performans metriklerini gösterir
6. WHEN üye rolü değiştirilir, THE AERO_System SHALL izinleri anında günceller

### Gereksinim 11: Ürün Kataloğu Yönetimi

**Kullanıcı Hikayesi:** Bir satış temsilcisi olarak, satılabilir ürünleri yönetebilmek ve tekliflerde kullanabilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL ürün ekleme, düzenleme ve silme imkanı sağlar
2. THE AERO_System SHALL ürünler için isim, açıklama, fiyat ve kategori bilgilerini saklar
3. WHEN teklif oluşturulur, THE AERO_System SHALL ürün kataloğundan seçim imkanı sağlar
4. THE AERO_System SHALL ürünleri kategorilere göre filtreleme imkanı sağlar
5. THE AERO_System SHALL ürün fiyatlarını farklı para birimlerinde gösterir
6. WHEN ürün fiyatı güncellenir, THE AERO_System SHALL aktif teklifleri etkilemez

### Gereksinim 12: Bildirim Sistemi

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, önemli olaylardan haberdar olmak için bildirim alabilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL teklif görüntülendi, imzalandı olayları için gerçek zamanlı bildirim gönderir
2. THE AERO_System SHALL bildirim tercihlerini kullanıcı bazında özelleştirme imkanı sağlar
3. WHEN bildirim gelir, THE AERO_System SHALL header'da bildirim sayacını günceller
4. THE AERO_System SHALL bildirim geçmişini kronolojik sırada gösterir
5. THE AERO_System SHALL e-posta bildirimleri için şablon özelleştirme imkanı sağlar
6. WHEN kullanıcı bildirimi okur, THE AERO_System SHALL okundu olarak işaretler

### Gereksinim 13: Arama ve Filtreleme

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, büyük veri setlerinde hızlıca arama yapabilmek ve filtreleyebilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL global arama (Cmd+K) kısayolu sağlar
2. WHEN kullanıcı arama yapar, THE AERO_System SHALL anlaşmalar, kişiler ve tekliflerde arama yapar
3. THE AERO_System SHALL arama sonuçlarını kategori bazında gruplar
4. THE AERO_System SHALL gelişmiş filtreleme seçenekleri (tarih, değer, durum) sağlar
5. THE AERO_System SHALL son aramaları hatırlar ve önerir
6. WHEN arama sonucu tıklanır, THE AERO_System SHALL ilgili sayfaya yönlendirir

### Gereksinim 14: Veri İçe/Dışa Aktarma

**Kullanıcı Hikayesi:** Bir sistem yöneticisi olarak, mevcut verilerimi sisteme aktarabilmek ve yedek alabilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL CSV formatında kişi verilerini içe aktarma imkanı sağlar
2. THE AERO_System SHALL veri içe aktarımında sütun eşleştirme arayüzü sağlar
3. THE AERO_System SHALL tüm verileri CSV/Excel formatında dışa aktarma imkanı sağlar
4. WHEN veri içe aktarılır, THE AERO_System SHALL hata raporlaması ve başarı oranı gösterir
5. THE AERO_System SHALL büyük veri setleri için toplu işlem desteği sağlar
6. THE AERO_System SHALL veri aktarım geçmişini loglar

### Gereksinim 15: Şablon Yönetimi

**Kullanıcı Hikayesi:** Bir satış temsilcisi olarak, tekrar kullanılabilir teklif şablonları oluşturabilmek ve yönetebilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL şablon galerisi görüntüleme imkanı sağlar
2. THE AERO_System SHALL mevcut tekliflerden şablon oluşturma imkanı sağlar
3. WHEN şablon seçilir, THE AERO_System SHALL şablonu teklif editöründe açar
4. THE AERO_System SHALL şablonları kategorilere göre organize etme imkanı sağlar
5. THE AERO_System SHALL şablon önizleme ve kullanım istatistikleri gösterir
6. THE AERO_System SHALL şablon paylaşımı ve takım şablonları desteği sağlar

### Gereksinim 16: Anlaşma Detay Yönetimi

**Kullanıcı Hikayesi:** Bir satış temsilcisi olarak, anlaşma detaylarını görüntüleyebilmek ve yönetebilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL anlaşma detay sayfasında tüm bilgileri tek ekranda gösterir
2. THE AERO_System SHALL anlaşmaya ait ürünler, teklifler, notlar ve aktivite sekmelerini sağlar
3. WHEN anlaşma aşaması değiştirilir, THE AERO_System SHALL değişikliği anında kaydeder
4. THE AERO_System SHALL anlaşma için dosya ekleme ve yönetme imkanı sağlar
5. THE AERO_System SHALL anlaşma geçmişini zaman çizelgesi formatında gösterir
6. THE AERO_System SHALL anlaşma notları için zengin metin editörü sağlar

### Gereksinim 17: Entegrasyon Hub'ı

**Kullanıcı Hikayesi:** Bir sistem yöneticisi olarak, AERO CRM'i diğer araçlarla entegre edebilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL Gmail, Slack, Google Drive, Zapier entegrasyonları sağlar
2. THE AERO_System SHALL entegrasyon durumlarını ve son senkronizasyon zamanlarını gösterir
3. WHEN entegrasyon bağlanır, THE AERO_System SHALL OAuth akışını güvenli şekilde yönetir
4. THE AERO_System SHALL entegrasyon ayarlarını yapılandırma arayüzü sağlar
5. THE AERO_System SHALL entegrasyon hatalarını loglar ve kullanıcıya bildirir
6. THE AERO_System SHALL API anahtarı yönetimi ve rotasyon imkanı sağlar

### Gereksinim 18: Faturalama ve Abonelik Yönetimi

**Kullanıcı Hikayesi:** Bir hesap sahibi olarak, abonelik planımı yönetebilmek ve fatura geçmişimi görebilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL mevcut plan bilgilerini ve kullanım istatistiklerini gösterir
2. THE AERO_System SHALL plan yükseltme/düşürme imkanı sağlar
3. WHEN plan değiştirilir, THE AERO_System SHALL değişikliği anında uygular
4. THE AERO_System SHALL ödeme yöntemi ekleme ve güncelleme imkanı sağlar
5. THE AERO_System SHALL fatura geçmişini PDF indirme seçeneği ile gösterir
6. THE AERO_System SHALL abonelik iptali için self-servis imkanı sağlar

### Gereksinim 19: Sistem Sağlığı ve Monitoring

**Kullanıcı Hikayesi:** Bir sistem yöneticisi olarak, sistem performansını ve sağlığını izleyebilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL webhook başarı oranlarını ve yanıt sürelerini gösterir
2. THE AERO_System SHALL sistem uptime ve performans metriklerini dashboard'da gösterir
3. THE AERO_System SHALL hata loglarını ve sistem olaylarını kronolojik sırada listeler
4. WHEN sistem hatası oluşur, THE AERO_System SHALL otomatik hata raporlaması yapar
5. THE AERO_System SHALL API kullanım istatistiklerini ve rate limiting bilgilerini gösterir
6. THE AERO_System SHALL sistem sağlığı raporu dışa aktarma imkanı sağlar

### Gereksinim 20: Çoklu Dil Desteği

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, sistemi kendi dilimde kullanabilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL Türkçe ve İngilizce dil seçenekleri sağlar
2. WHEN dil değiştirilir, THE AERO_System SHALL tüm arayüz metinlerini günceller
3. THE AERO_System SHALL tarih ve sayı formatlarını seçilen dile göre ayarlar
4. THE AERO_System SHALL teklif şablonlarında çoklu dil desteği sağlar
5. THE AERO_System SHALL e-posta şablonlarını seçilen dilde gönderir
6. THE AERO_System SHALL kullanıcı dil tercihini profilde saklar

### Gereksinim 21: Gelişmiş Arama ve Filtreler

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, karmaşık arama kriterleri ile veri bulabilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL global arama (Cmd+K) kısayolu ile hızlı arama sağlar
2. THE AERO_System SHALL arama sonuçlarını kategori bazında (Anlaşmalar, Kişiler, Teklifler) gruplar
3. THE AERO_System SHALL gelişmiş filtreler (tarih aralığı, değer, durum, sorumlu) sağlar
4. WHEN filtre uygulanır, THE AERO_System SHALL sonuçları gerçek zamanlı günceller
5. THE AERO_System SHALL kayıtlı arama sorguları ve hızlı filtreler sağlar
6. THE AERO_System SHALL arama geçmişini ve sık kullanılan aramaları önerir

### Gereksinim 22: Mobil Uyumluluk ve PWA

**Kullanıcı Hikayesi:** Bir satış temsilcisi olarak, mobil cihazımdan sisteme erişebilmek ve offline çalışabilmek istiyorum.

#### Kabul Kriterleri

1. THE AERO_System SHALL tüm sayfalarda mobil uyumlu responsive tasarım sağlar
2. THE AERO_System SHALL Progressive Web App (PWA) olarak çalışır
3. THE AERO_System SHALL mobilde dokunmatik etkileşimler için optimize edilmiş arayüz sağlar
4. WHEN mobilde kanban görünümü açılır, THE AERO_System SHALL yatay kaydırma ve snap scroll sağlar
5. THE AERO_System SHALL temel verileri offline erişim için önbelleğe alır
6. THE AERO_System SHALL mobil cihazlara uygulama olarak yüklenebilir