import { notFound } from 'next/navigation'
import GenericIntegrationSettingsPage from '@/components/integrations/generic-integration-settings-page'
import {
  getGenericIntegrationConfig,
  isGenericIntegrationProvider,
} from '@/lib/integrations/provider-config'

export default async function GenericIntegrationPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  const { provider } = await params

  if (!isGenericIntegrationProvider(provider)) {
    notFound()
  }

  const config = getGenericIntegrationConfig(provider)

  return <GenericIntegrationSettingsPage provider={provider} config={config} />
}
