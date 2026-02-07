import type { Locale } from '@/lib/i18n/messages'

type Highlight = {
  title: string
  description: string
}

type Step = {
  title: string
  description: string
}

type PricingPlan = {
  id: string
  name: string
  price: string
  period: string
  description: string
  cta: string
  popular?: boolean
  features: string[]
}

type FaqItem = {
  question: string
  answer: string
}

type ContactChannel = {
  title: string
  description: string
  href: string
  cta: string
}

type IntegrationCard = {
  name: string
  description: string
  status: string
}

type SecurityCard = {
  title: string
  description: string
}

export type MarketingCopy = {
  nav: {
    features: string
    pricing: string
    integrations: string
    security: string
    faq: string
    contact: string
    login: string
    start: string
  }
  footer: {
    product: string
    company: string
    legal: string
    cta: string
    copyright: string
  }
  home: {
    eyebrow: string
    title: string
    subtitle: string
    primaryCta: string
    secondaryCta: string
    socialProof: string
    highlights: Highlight[]
    workflowTitle: string
    workflowSubtitle: string
    workflowSteps: Step[]
    finalTitle: string
    finalSubtitle: string
    finalCta: string
  }
  pricing: {
    eyebrow: string
    title: string
    subtitle: string
    plans: PricingPlan[]
    compareTitle: string
    compareRows: {
      label: string
      solo: string
      pro: string
    }[]
    faqTitle: string
    faqItems: FaqItem[]
  }
  features: {
    eyebrow: string
    title: string
    subtitle: string
    cards: Highlight[]
  }
  integrations: {
    eyebrow: string
    title: string
    subtitle: string
    cards: IntegrationCard[]
    cta: string
  }
  security: {
    eyebrow: string
    title: string
    subtitle: string
    cards: SecurityCard[]
  }
  faq: {
    eyebrow: string
    title: string
    subtitle: string
    items: FaqItem[]
  }
  contact: {
    eyebrow: string
    title: string
    subtitle: string
    channels: ContactChannel[]
  }
  bookDemo: {
    eyebrow: string
    title: string
    subtitle: string
    bullets: string[]
    primaryCta: string
    secondaryCta: string
  }
  checkout: {
    success: {
      title: string
      subtitle: string
      primaryCta: string
      secondaryCta: string
    }
    cancel: {
      title: string
      subtitle: string
      primaryCta: string
      secondaryCta: string
    }
  }
}

const marketingCopy: Record<Locale, MarketingCopy> = {
  tr: {
    nav: {
      features: 'Özellikler',
      pricing: 'Fiyatlandırma',
      integrations: 'Entegrasyonlar',
      security: 'Güvenlik',
      faq: 'SSS',
      contact: 'İletişim',
      login: 'Giriş Yap',
      start: 'Ücretsiz Başla',
    },
    footer: {
      product: 'Ürün',
      company: 'Şirket',
      legal: 'Yasal',
      cta: 'Demo Al',
      copyright: '© 2026 AERO CRM. Tüm hakları saklıdır.',
    },
    home: {
      eyebrow: 'Hızlı tekliften tahsilata uçtan uca satış operasyonu',
      title: 'Teklif sürecini hızlandır, satış döngüsünü kısalt.',
      subtitle:
        'AERO CRM; teklif hazırlama, müşteri takibi, ekip koordinasyonu ve ödeme adımlarını tek panelde birleştirir.',
      primaryCta: 'Planları Gör',
      secondaryCta: 'Canlı Demo',
      socialProof: 'Satış ekipleri teklif hazırlama süresini ortalama %40 azaltıyor.',
      highlights: [
        {
          title: 'Teklifleri dakikalar içinde gönder',
          description: 'Hazır şablonlar ve tekrar kullanılabilir bloklarla hızlıca profesyonel teklif üret.',
        },
        {
          title: 'Gerçek zamanlı görüntüleme takibi',
          description: 'Müşteri teklifi ne zaman açtı, ne kadar inceledi anlık olarak takip et.',
        },
        {
          title: 'Takım iş birliği ve görev dağılımı',
          description: 'Pipeline aşamalarında ekip rolü, notlar ve aktiviteleri tek yerde yönet.',
        },
      ],
      workflowTitle: 'Nasıl çalışır?',
      workflowSubtitle: 'İlk müşteri temasından ödemeye kadar sade bir akış.',
      workflowSteps: [
        {
          title: '1. Müşteri ve fırsat oluştur',
          description: 'Kişi ve anlaşma kaydını aç, satış pipeline aşamasına yerleştir.',
        },
        {
          title: '2. Teklifi hazırla ve gönder',
          description: 'Şablon seç, fiyat detaylarını ekle, e-posta veya paylaşım linki ile ilet.',
        },
        {
          title: '3. Durumu izle ve kapat',
          description: 'Görüntüleme, imza ve ödeme geri bildirimleriyle anlaşmayı hızlıca sonuca bağla.',
        },
      ],
      finalTitle: 'Takımını tek bir satış çalışma alanında birleştir.',
      finalSubtitle: 'Kurulum gerektirmeden bugün başlayabilir, süreçleri haftalar değil saatler içinde standardize edebilirsin.',
      finalCta: 'Hesap Oluştur',
    },
    pricing: {
      eyebrow: 'Şeffaf fiyatlandırma',
      title: 'Ekibine uygun planı seç.',
      subtitle: 'Tüm planlar 14 gün ücretsiz deneme ile başlar. Kredi kartı zorunlu değildir.',
      plans: [
        {
          id: 'solo',
          name: 'Aero Solo',
          price: '$19',
          period: '/kullanıcı/ay',
          description: 'Tek kişilik ekipler ve başlangıç aşaması için.',
          cta: 'Solo ile Başla',
          features: ['10 teklif / ay', 'Temel CRM', 'E-posta bildirimleri', 'Standart destek'],
        },
        {
          id: 'pro',
          name: 'Aero Pro',
          price: '$49',
          period: '/kullanıcı/ay',
          description: 'Büyüyen ekipler için gelişmiş otomasyon ve raporlama.',
          cta: 'Pro ile Başla',
          popular: true,
          features: ['Sınırsız teklif', 'Ekip yönetimi', 'Webhook ve API', 'Öncelikli destek'],
        },
      ],
      compareTitle: 'Plan karşılaştırması',
      compareRows: [
        { label: 'Teklif limiti', solo: '10 / ay', pro: 'Sınırsız' },
        { label: 'Takım üyesi rolleri', solo: 'Yok', pro: 'Var' },
        { label: 'API / Webhook', solo: 'Yok', pro: 'Var' },
        { label: 'Destek seviyesi', solo: 'Standart', pro: 'Öncelikli' },
      ],
      faqTitle: 'Fiyatlandırma ile ilgili sık sorulanlar',
      faqItems: [
        {
          question: 'Planımı sonradan değiştirebilir miyim?',
          answer: 'Evet. İstediğin zaman üst pakete geçebilir veya kullanımına göre düşürebilirsin.',
        },
        {
          question: 'Yıllık ödeme seçeneği var mı?',
          answer: 'Evet. Yıllık ödemede ek indirimler sunulur. Detaylar için satış ekibiyle iletişime geçebilirsin.',
        },
      ],
    },
    features: {
      eyebrow: 'Ürün özellikleri',
      title: 'Satış operasyonunu taşıyan temel modüller.',
      subtitle: 'Teklif üretimi, pipeline yönetimi ve ekip görünürlüğü tek bir platformda.',
      cards: [
        {
          title: 'Akıllı teklif editörü',
          description: 'Blok tabanlı düzenleme ile içerik, fiyat ve sözleşme metinlerini hızlıca oluştur.',
        },
        {
          title: 'Pipeline görünümü',
          description: 'Anlaşmaları aşamalara göre izle, kayıp ve kazanım oranlarını ölç.',
        },
        {
          title: 'Canlı bildirim merkezi',
          description: 'Teklif görüntüleme, imza ve görev değişiklikleri anlık bildirim olarak gelsin.',
        },
        {
          title: 'Takım erişim kontrolleri',
          description: 'Rol bazlı yetkiler ile ekip üyelerinin erişebileceği ekranları belirle.',
        },
        {
          title: 'Raporlama ve dışa aktarım',
          description: 'Teklif performansı, satış trendleri ve ekip aktivitesini dışa aktarılabilir raporlarla incele.',
        },
        {
          title: 'Entegrasyon altyapısı',
          description: 'Stripe, Twilio ve webhook akışları ile iş süreçlerini otomatikleştir.',
        },
      ],
    },
    integrations: {
      eyebrow: 'Platform entegrasyonları',
      title: 'Mevcut araçlarınla uyumlu çalış.',
      subtitle: 'AERO CRM, satış sürecindeki kritik dış servislerle bağlantı kurar.',
      cards: [
        {
          name: 'Stripe',
          description: 'Abonelik ve ödeme süreçlerini takip et, faturalama adımlarını güvenli şekilde yönet.',
          status: 'Hazır',
        },
        {
          name: 'Twilio',
          description: 'SMS ve WhatsApp üzerinden teklif ve takip mesajlarını otomatik gönder.',
          status: 'Hazır',
        },
        {
          name: 'Webhook',
          description: 'Teklif görüntülendi, imzalandı veya durum değiştiğinde dış sistemlerini tetikle.',
          status: 'Hazır',
        },
      ],
      cta: 'Tüm entegrasyonları gör',
    },
    security: {
      eyebrow: 'Güvenlik ve güven',
      title: 'Müşteri verileri için güçlü temel.',
      subtitle: 'Yetkilendirme, kayıt izleme ve erişim kontrolleriyle veri güvenliğini merkezde tutar.',
      cards: [
        {
          title: 'Rol bazlı yetki modeli',
          description: 'Owner, admin ve üye rolleriyle kullanıcı erişimlerini sınırlandır.',
        },
        {
          title: 'Denetim izi ve loglama',
          description: 'Kritik işlemleri izleyebilir, güvenlik olaylarını geçmişe dönük analiz edebilirsin.',
        },
        {
          title: 'Güvenli entegrasyon yönetimi',
          description: 'API anahtarları ve gizli bilgileri sunucu tarafı kontrolleriyle yönet.',
        },
      ],
    },
    faq: {
      eyebrow: 'Sıkça sorulan sorular',
      title: 'Karar sürecini hızlandıran cevaplar.',
      subtitle: 'Kurulum, fiyatlandırma ve ekip kullanımıyla ilgili en yaygın sorular.',
      items: [
        {
          question: 'Kurulum ne kadar sürer?',
          answer: 'Çoğu ekip ilk 30 dakika içinde temel yapılandırmayı tamamlayarak kullanıma başlar.',
        },
        {
          question: 'Verilerimi içe aktarabilir miyim?',
          answer: 'Evet. İçe aktarma modülü ile kişi, anlaşma ve teklif verilerini CSV üzerinden taşıyabilirsin.',
        },
        {
          question: 'Mobil kullanım destekleniyor mu?',
          answer: 'Evet. Dashboard ve public sayfalar mobil uyumlu çalışır.',
        },
        {
          question: 'Destek ekibine nasıl ulaşırım?',
          answer: 'İletişim sayfası üzerinden talep oluşturabilir veya demo görüşmesinde doğrudan ekiple konuşabilirsin.',
        },
      ],
    },
    contact: {
      eyebrow: 'İletişim',
      title: 'Satış ve ürün ekibimizle görüş.',
      subtitle: 'Kullanım senaryonu paylaş, en doğru planı ve geçiş kurgusunu birlikte belirleyelim.',
      channels: [
        {
          title: 'Satış danışmanlığı',
          description: 'Kurulum, paket seçimi ve ekip ölçekleme için birebir görüşme planla.',
          href: '/book-demo',
          cta: 'Demo planla',
        },
        {
          title: 'E-posta',
          description: 'Teknik veya ticari sorular için bize doğrudan e-posta gönder.',
          href: 'mailto:support@aerocrm.com',
          cta: 'E-posta gönder',
        },
        {
          title: 'Yardım merkezi',
          description: 'Sık karşılaşılan konular için adım adım rehberlere göz at.',
          href: '/help',
          cta: 'Yardım merkezine git',
        },
      ],
    },
    bookDemo: {
      eyebrow: 'Demo planla',
      title: 'Ekibin için uygun satış akışını birlikte tasarlayalım.',
      subtitle: '30 dakikalık oturumda mevcut sürecini değerlendirip AERO CRM kurgusunu netleştiriyoruz.',
      bullets: [
        'Mevcut teklif ve satış sürecinin hızlı analizi',
        'Ekip rolü ve erişim yapısı önerisi',
        'Entegrasyon ve geçiş adımlarının planı',
      ],
      primaryCta: 'İletişime geç',
      secondaryCta: 'Fiyatları incele',
    },
    checkout: {
      success: {
        title: 'Ödeme başarılı.',
        subtitle: 'Aboneliğin aktif edildi. Şimdi ekibini davet ederek süreci başlatabilirsin.',
        primaryCta: 'Dashboard\'a git',
        secondaryCta: 'Faturalamayı görüntüle',
      },
      cancel: {
        title: 'Ödeme tamamlanmadı.',
        subtitle: 'İstersen tekrar deneyebilir veya ekibimizle görüşerek doğru planı birlikte seçebilirsin.',
        primaryCta: 'Tekrar dene',
        secondaryCta: 'Satış ekibiyle konuş',
      },
    },
  },
  en: {
    nav: {
      features: 'Features',
      pricing: 'Pricing',
      integrations: 'Integrations',
      security: 'Security',
      faq: 'FAQ',
      contact: 'Contact',
      login: 'Log In',
      start: 'Get Started',
    },
    footer: {
      product: 'Product',
      company: 'Company',
      legal: 'Legal',
      cta: 'Book a Demo',
      copyright: '© 2026 AERO CRM. All rights reserved.',
    },
    home: {
      eyebrow: 'From fast proposals to revenue in one sales workspace',
      title: 'Shorten proposal cycles and close deals faster.',
      subtitle:
        'AERO CRM combines proposal creation, customer tracking, team coordination, and billing handoff in a single platform.',
      primaryCta: 'View Pricing',
      secondaryCta: 'Book Live Demo',
      socialProof: 'Sales teams reduce proposal preparation time by an average of 40%.',
      highlights: [
        {
          title: 'Send proposals in minutes',
          description: 'Use reusable blocks and templates to deliver polished proposals quickly.',
        },
        {
          title: 'Track engagement in real time',
          description: 'See when prospects open proposals and how long they stay on each section.',
        },
        {
          title: 'Coordinate your team in context',
          description: 'Manage roles, stage transitions, and activity updates from one pipeline view.',
        },
      ],
      workflowTitle: 'How it works',
      workflowSubtitle: 'A clear flow from first contact to payment.',
      workflowSteps: [
        {
          title: '1. Create contact and opportunity',
          description: 'Capture the customer record and place the deal into your pipeline stage.',
        },
        {
          title: '2. Build and send the proposal',
          description: 'Select a template, customize pricing blocks, and share via email or secure link.',
        },
        {
          title: '3. Monitor and close',
          description: 'Use view, signature, and payment signals to move deals to a clear outcome faster.',
        },
      ],
      finalTitle: 'Align your sales team around one execution layer.',
      finalSubtitle: 'Start today without heavy setup and standardize your process in hours, not weeks.',
      finalCta: 'Create Account',
    },
    pricing: {
      eyebrow: 'Transparent pricing',
      title: 'Choose the plan that fits your team.',
      subtitle: 'All plans include a 14-day free trial. No credit card required to start.',
      plans: [
        {
          id: 'solo',
          name: 'Aero Solo',
          price: '$19',
          period: '/user/mo',
          description: 'For solo operators and early-stage teams.',
          cta: 'Start Solo',
          features: ['10 proposals / month', 'Core CRM', 'Email alerts', 'Standard support'],
        },
        {
          id: 'pro',
          name: 'Aero Pro',
          price: '$49',
          period: '/user/mo',
          description: 'For growing teams that need automation and visibility.',
          cta: 'Start Pro',
          popular: true,
          features: ['Unlimited proposals', 'Team controls', 'Webhook and API', 'Priority support'],
        },
      ],
      compareTitle: 'Plan comparison',
      compareRows: [
        { label: 'Proposal limit', solo: '10 / month', pro: 'Unlimited' },
        { label: 'Team roles', solo: 'Not included', pro: 'Included' },
        { label: 'API / Webhook', solo: 'Not included', pro: 'Included' },
        { label: 'Support level', solo: 'Standard', pro: 'Priority' },
      ],
      faqTitle: 'Pricing FAQ',
      faqItems: [
        {
          question: 'Can I change my plan later?',
          answer: 'Yes. You can upgrade anytime or switch down based on your usage.',
        },
        {
          question: 'Do you offer annual billing?',
          answer: 'Yes. Annual billing includes additional savings. Contact sales for details.',
        },
      ],
    },
    features: {
      eyebrow: 'Product features',
      title: 'Core modules that run your sales operation.',
      subtitle: 'Proposal generation, pipeline execution, and team visibility in one place.',
      cards: [
        {
          title: 'Smart proposal editor',
          description: 'Create offer content, pricing blocks, and contract sections with a block-based editor.',
        },
        {
          title: 'Pipeline visibility',
          description: 'Track deals by stage and measure win/loss movement with a clear board.',
        },
        {
          title: 'Live notification center',
          description: 'Get real-time updates for proposal views, signatures, and task changes.',
        },
        {
          title: 'Team access controls',
          description: 'Define role-based permissions and screen access for each member.',
        },
        {
          title: 'Reporting and exports',
          description: 'Review proposal and revenue performance through exportable reports.',
        },
        {
          title: 'Integration-ready platform',
          description: 'Connect Stripe, Twilio, and webhooks to automate downstream workflows.',
        },
      ],
    },
    integrations: {
      eyebrow: 'Platform integrations',
      title: 'Work with the tools your team already uses.',
      subtitle: 'AERO CRM connects to critical external services in your sales stack.',
      cards: [
        {
          name: 'Stripe',
          description: 'Manage subscription and payment lifecycle with secure billing handoff.',
          status: 'Available',
        },
        {
          name: 'Twilio',
          description: 'Send proposal and follow-up messages through SMS and WhatsApp channels.',
          status: 'Available',
        },
        {
          name: 'Webhook',
          description: 'Trigger external systems when proposals are viewed, signed, or updated.',
          status: 'Available',
        },
      ],
      cta: 'Explore integrations',
    },
    security: {
      eyebrow: 'Security and trust',
      title: 'Built for controlled access and auditability.',
      subtitle: 'Permission models, activity logs, and secure integrations protect customer data.',
      cards: [
        {
          title: 'Role-based access model',
          description: 'Limit user permissions by owner, admin, and member roles.',
        },
        {
          title: 'Audit trail and logging',
          description: 'Track key actions and investigate critical events with historical logs.',
        },
        {
          title: 'Secure integration controls',
          description: 'Manage API keys and credentials with server-side protection layers.',
        },
      ],
    },
    faq: {
      eyebrow: 'Frequently asked questions',
      title: 'Answers to unblock purchase decisions quickly.',
      subtitle: 'The most common questions around setup, pricing, and team usage.',
      items: [
        {
          question: 'How long does setup take?',
          answer: 'Most teams complete the initial setup in under 30 minutes.',
        },
        {
          question: 'Can I import existing data?',
          answer: 'Yes. Use CSV import to migrate contacts, deals, and proposal records.',
        },
        {
          question: 'Is mobile usage supported?',
          answer: 'Yes. Both dashboard and public pages are responsive for mobile use.',
        },
        {
          question: 'How can I reach support?',
          answer: 'Use the contact page or speak directly with our team during a demo session.',
        },
      ],
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Talk with our sales and product team.',
      subtitle: 'Share your workflow and we will map the right plan and rollout path together.',
      channels: [
        {
          title: 'Sales consultation',
          description: 'Book a 1:1 session for setup guidance, plan selection, and scaling decisions.',
          href: '/book-demo',
          cta: 'Book demo',
        },
        {
          title: 'Email',
          description: 'Send technical or commercial questions directly to our team.',
          href: 'mailto:support@aerocrm.com',
          cta: 'Send email',
        },
        {
          title: 'Help center',
          description: 'Browse quick guides for common product and account actions.',
          href: '/help',
          cta: 'Open help center',
        },
      ],
    },
    bookDemo: {
      eyebrow: 'Book a demo',
      title: 'Design the right sales workflow for your team.',
      subtitle: 'In a 30-minute session, we map your current process and define an AERO CRM rollout plan.',
      bullets: [
        'Quick analysis of your current proposal and sales flow',
        'Role and access model recommendations',
        'Integration and migration rollout checklist',
      ],
      primaryCta: 'Contact sales',
      secondaryCta: 'See pricing',
    },
    checkout: {
      success: {
        title: 'Payment completed successfully.',
        subtitle: 'Your subscription is now active. Invite your team to start using the workspace.',
        primaryCta: 'Go to dashboard',
        secondaryCta: 'Open billing settings',
      },
      cancel: {
        title: 'Payment was not completed.',
        subtitle: 'You can retry checkout or contact our team to select the right plan.',
        primaryCta: 'Try checkout again',
        secondaryCta: 'Talk to sales',
      },
    },
  },
}

export const getMarketingCopy = (locale: Locale) => marketingCopy[locale]
