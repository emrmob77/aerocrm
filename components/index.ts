// UI Components
export * from './ui'

// Layout Components
export * from './layout'

// Dashboard Components
export {
  ActivityFeed,
  MetricsGrid,
  QuickActions,
  WebhookActivity,
  mapActivityRow,
  formatRelativeTime as formatActivityRelativeTime,
  type DashboardActivity,
} from './dashboard'

// Deals Components
export {
  DealsBoard,
  getStageConfigs,
  normalizeStage,
  getDbStage,
  formatCurrency,
  formatRelativeTime as formatDealRelativeTime,
  type StageId,
} from './deals'

// Contacts Components
export { ContactsDirectory, ContactForm } from './contacts'
