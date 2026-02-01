// Database types
export type { Database, Json } from './database'

// Re-export table types for convenience
import type { Database } from './database'

// User types
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

// Team invite types
export type TeamInvite = Database['public']['Tables']['team_invites']['Row']
export type TeamInviteInsert = Database['public']['Tables']['team_invites']['Insert']
export type TeamInviteUpdate = Database['public']['Tables']['team_invites']['Update']

// Team types
export type Team = Database['public']['Tables']['teams']['Row']
export type TeamInsert = Database['public']['Tables']['teams']['Insert']
export type TeamUpdate = Database['public']['Tables']['teams']['Update']

// Contact types
export type Contact = Database['public']['Tables']['contacts']['Row']
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']
export type ContactUpdate = Database['public']['Tables']['contacts']['Update']

// Product types
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

// Deal types
export type Deal = Database['public']['Tables']['deals']['Row']
export type DealInsert = Database['public']['Tables']['deals']['Insert']
export type DealUpdate = Database['public']['Tables']['deals']['Update']

export type DealStage = 'lead' | 'proposal_sent' | 'negotiation' | 'won' | 'lost'

// Deal Product types
export type DealProduct = Database['public']['Tables']['deal_products']['Row']
export type DealProductInsert = Database['public']['Tables']['deal_products']['Insert']
export type DealProductUpdate = Database['public']['Tables']['deal_products']['Update']

// Proposal types
export type Proposal = Database['public']['Tables']['proposals']['Row']
export type ProposalInsert = Database['public']['Tables']['proposals']['Insert']
export type ProposalUpdate = Database['public']['Tables']['proposals']['Update']

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'expired'

// Proposal View types
export type ProposalView = Database['public']['Tables']['proposal_views']['Row']
export type ProposalViewInsert = Database['public']['Tables']['proposal_views']['Insert']

// Template types
export type Template = Database['public']['Tables']['templates']['Row']
export type TemplateInsert = Database['public']['Tables']['templates']['Insert']
export type TemplateUpdate = Database['public']['Tables']['templates']['Update']

// Webhook types
export type Webhook = Database['public']['Tables']['webhooks']['Row']
export type WebhookInsert = Database['public']['Tables']['webhooks']['Insert']
export type WebhookUpdate = Database['public']['Tables']['webhooks']['Update']
export type WebhookLog = Database['public']['Tables']['webhook_logs']['Row']
export type WebhookLogInsert = Database['public']['Tables']['webhook_logs']['Insert']
export type WebhookLogUpdate = Database['public']['Tables']['webhook_logs']['Update']

// Notification types
export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

// Search types
export type SearchHistory = Database['public']['Tables']['search_history']['Row']
export type SearchHistoryInsert = Database['public']['Tables']['search_history']['Insert']
export type SearchHistoryUpdate = Database['public']['Tables']['search_history']['Update']
export type SavedSearch = Database['public']['Tables']['saved_searches']['Row']
export type SavedSearchInsert = Database['public']['Tables']['saved_searches']['Insert']
export type SavedSearchUpdate = Database['public']['Tables']['saved_searches']['Update']

// Data transfer job types
export type DataImportJob = Database['public']['Tables']['data_import_jobs']['Row']
export type DataImportJobInsert = Database['public']['Tables']['data_import_jobs']['Insert']
export type DataImportJobUpdate = Database['public']['Tables']['data_import_jobs']['Update']
export type DataExportJob = Database['public']['Tables']['data_export_jobs']['Row']
export type DataExportJobInsert = Database['public']['Tables']['data_export_jobs']['Insert']
export type DataExportJobUpdate = Database['public']['Tables']['data_export_jobs']['Update']

// Notification preferences
export type NotificationPreference = Database['public']['Tables']['notification_preferences']['Row']
export type NotificationPreferenceInsert = Database['public']['Tables']['notification_preferences']['Insert']
export type NotificationPreferenceUpdate = Database['public']['Tables']['notification_preferences']['Update']

// Push subscription types
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row']
export type PushSubscriptionInsert = Database['public']['Tables']['push_subscriptions']['Insert']
export type PushSubscriptionUpdate = Database['public']['Tables']['push_subscriptions']['Update']

// Activity types
export type Activity = Database['public']['Tables']['activities']['Row']
export type ActivityInsert = Database['public']['Tables']['activities']['Insert']
export type ActivityUpdate = Database['public']['Tables']['activities']['Update']

// Block types for Proposal Editor
export interface BaseBlock {
  id: string
  type: string
  order: number
  data: Record<string, unknown>
}

export interface HeroBlock extends BaseBlock {
  type: 'hero'
  data: {
    title: string
    subtitle: string
    background_image?: string
    background_color?: string
  }
}

export interface TextBlock extends BaseBlock {
  type: 'text'
  data: {
    content: string
    alignment: 'left' | 'center' | 'right'
    font_size: 'sm' | 'md' | 'lg'
  }
}

export interface PricingBlock extends BaseBlock {
  type: 'pricing'
  data: {
    source: 'crm' | 'manual'
    deal_id?: string
    items: PricingItem[]
    currency: string
    show_total: boolean
  }
}

export interface PricingItem {
  id: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface SignatureBlock extends BaseBlock {
  type: 'signature'
  data: {
    label: string
    required: boolean
  }
}

export type ProposalBlock = HeroBlock | TextBlock | PricingBlock | SignatureBlock

// Dashboard metrics
export interface DashboardMetrics {
  open_proposals: number
  monthly_revenue: number
  conversion_rate: number
  pipeline_value: number
  trends?: {
    proposals: number
    revenue: number
    conversion: number
  }
}

// Auth state
export interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

// Toast notification
export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}
