export const genericIntegrationProviders = [
  'gmail',
  'slack',
  'zoom',
  'paypal',
  'iyzico',
  'gdrive',
  'dropbox',
  'zapier',
] as const

export type GenericIntegrationProvider = (typeof genericIntegrationProviders)[number]

export type IntegrationFieldType = 'text' | 'password' | 'url' | 'email' | 'select' | 'textarea'

export type IntegrationFieldOption = {
  value: string
  labelKey: string
}

export type IntegrationFieldConfig = {
  key: string
  labelKey: string
  placeholderKey?: string
  type?: IntegrationFieldType
  required?: boolean
  sensitive?: boolean
  options?: IntegrationFieldOption[]
}

export type GenericIntegrationConfig = {
  provider: GenericIntegrationProvider
  name: string
  descriptionKey: string
  icon: string
  iconColor: string
  iconBg: string
  fields: IntegrationFieldConfig[]
}

const genericIntegrationConfigMap: Record<GenericIntegrationProvider, GenericIntegrationConfig> = {
  gmail: {
    provider: 'gmail',
    name: 'Gmail',
    descriptionKey: 'integrations.gmailDescription',
    icon: 'mail',
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    fields: [
      {
        key: 'client_id',
        labelKey: 'integrationsGeneric.fields.clientId',
        placeholderKey: 'integrationsGeneric.placeholders.clientId',
        required: true,
      },
      {
        key: 'client_secret',
        labelKey: 'integrationsGeneric.fields.clientSecret',
        placeholderKey: 'integrationsGeneric.placeholders.clientSecret',
        type: 'password',
        required: true,
        sensitive: true,
      },
      {
        key: 'refresh_token',
        labelKey: 'integrationsGeneric.fields.refreshToken',
        placeholderKey: 'integrationsGeneric.placeholders.refreshToken',
        type: 'password',
        required: true,
        sensitive: true,
      },
      {
        key: 'sender_email',
        labelKey: 'integrationsGeneric.fields.senderEmail',
        placeholderKey: 'integrationsGeneric.placeholders.senderEmail',
        type: 'email',
        required: true,
      },
    ],
  },
  slack: {
    provider: 'slack',
    name: 'Slack',
    descriptionKey: 'integrations.slackDescription',
    icon: 'forum',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    fields: [
      {
        key: 'bot_token',
        labelKey: 'integrationsGeneric.fields.botToken',
        placeholderKey: 'integrationsGeneric.placeholders.botToken',
        type: 'password',
        required: true,
        sensitive: true,
      },
      {
        key: 'signing_secret',
        labelKey: 'integrationsGeneric.fields.signingSecret',
        placeholderKey: 'integrationsGeneric.placeholders.signingSecret',
        type: 'password',
        required: true,
        sensitive: true,
      },
      {
        key: 'default_channel',
        labelKey: 'integrationsGeneric.fields.defaultChannel',
        placeholderKey: 'integrationsGeneric.placeholders.defaultChannel',
      },
    ],
  },
  zoom: {
    provider: 'zoom',
    name: 'Zoom',
    descriptionKey: 'integrations.zoomDescription',
    icon: 'videocam',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    fields: [
      {
        key: 'account_id',
        labelKey: 'integrationsGeneric.fields.accountId',
        placeholderKey: 'integrationsGeneric.placeholders.accountId',
        required: true,
      },
      {
        key: 'client_id',
        labelKey: 'integrationsGeneric.fields.clientId',
        placeholderKey: 'integrationsGeneric.placeholders.clientId',
        required: true,
      },
      {
        key: 'client_secret',
        labelKey: 'integrationsGeneric.fields.clientSecret',
        placeholderKey: 'integrationsGeneric.placeholders.clientSecret',
        type: 'password',
        required: true,
        sensitive: true,
      },
    ],
  },
  paypal: {
    provider: 'paypal',
    name: 'PayPal',
    descriptionKey: 'integrations.paypalDescription',
    icon: 'account_balance_wallet',
    iconColor: 'text-sky-700',
    iconBg: 'bg-sky-50 dark:bg-sky-900/20',
    fields: [
      {
        key: 'client_id',
        labelKey: 'integrationsGeneric.fields.clientId',
        placeholderKey: 'integrationsGeneric.placeholders.clientId',
        required: true,
      },
      {
        key: 'client_secret',
        labelKey: 'integrationsGeneric.fields.clientSecret',
        placeholderKey: 'integrationsGeneric.placeholders.clientSecret',
        type: 'password',
        required: true,
        sensitive: true,
      },
      {
        key: 'mode',
        labelKey: 'integrationsGeneric.fields.mode',
        type: 'select',
        required: true,
        options: [
          { value: 'sandbox', labelKey: 'integrationsGeneric.options.modeSandbox' },
          { value: 'live', labelKey: 'integrationsGeneric.options.modeLive' },
        ],
      },
    ],
  },
  iyzico: {
    provider: 'iyzico',
    name: 'iyzico',
    descriptionKey: 'integrations.iyzicoDescription',
    icon: 'credit_card',
    iconColor: 'text-blue-800',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    fields: [
      {
        key: 'api_key',
        labelKey: 'integrationsGeneric.fields.apiKey',
        placeholderKey: 'integrationsGeneric.placeholders.apiKey',
        required: true,
      },
      {
        key: 'secret_key',
        labelKey: 'integrationsGeneric.fields.secretKey',
        placeholderKey: 'integrationsGeneric.placeholders.secretKey',
        type: 'password',
        required: true,
        sensitive: true,
      },
      {
        key: 'base_url',
        labelKey: 'integrationsGeneric.fields.baseUrl',
        placeholderKey: 'integrationsGeneric.placeholders.baseUrl',
        type: 'url',
        required: true,
      },
    ],
  },
  gdrive: {
    provider: 'gdrive',
    name: 'Google Drive',
    descriptionKey: 'integrations.gdriveDescription',
    icon: 'cloud',
    iconColor: 'text-yellow-600',
    iconBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    fields: [
      {
        key: 'service_account_email',
        labelKey: 'integrationsGeneric.fields.serviceAccountEmail',
        placeholderKey: 'integrationsGeneric.placeholders.serviceAccountEmail',
        type: 'email',
        required: true,
      },
      {
        key: 'private_key',
        labelKey: 'integrationsGeneric.fields.privateKey',
        placeholderKey: 'integrationsGeneric.placeholders.privateKey',
        type: 'textarea',
        required: true,
        sensitive: true,
      },
      {
        key: 'folder_id',
        labelKey: 'integrationsGeneric.fields.folderId',
        placeholderKey: 'integrationsGeneric.placeholders.folderId',
      },
    ],
  },
  dropbox: {
    provider: 'dropbox',
    name: 'Dropbox',
    descriptionKey: 'integrations.dropboxDescription',
    icon: 'folder_shared',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    fields: [
      {
        key: 'access_token',
        labelKey: 'integrationsGeneric.fields.accessToken',
        placeholderKey: 'integrationsGeneric.placeholders.accessToken',
        type: 'password',
        required: true,
        sensitive: true,
      },
      {
        key: 'root_path',
        labelKey: 'integrationsGeneric.fields.rootPath',
        placeholderKey: 'integrationsGeneric.placeholders.rootPath',
      },
    ],
  },
  zapier: {
    provider: 'zapier',
    name: 'Zapier',
    descriptionKey: 'integrations.zapierDescription',
    icon: 'bolt',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50 dark:bg-orange-900/20',
    fields: [
      {
        key: 'webhook_url',
        labelKey: 'integrationsGeneric.fields.webhookUrl',
        placeholderKey: 'integrationsGeneric.placeholders.webhookUrl',
        type: 'url',
        required: true,
      },
      {
        key: 'api_key',
        labelKey: 'integrationsGeneric.fields.apiKey',
        placeholderKey: 'integrationsGeneric.placeholders.apiKey',
        type: 'password',
        sensitive: true,
      },
    ],
  },
}

export const getGenericIntegrationConfig = (provider: GenericIntegrationProvider) =>
  genericIntegrationConfigMap[provider]

export const isGenericIntegrationProvider = (value: string): value is GenericIntegrationProvider =>
  value in genericIntegrationConfigMap
