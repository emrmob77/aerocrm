import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type SupabaseTestEnv = {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

const pickEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key]
    if (value) return value
  }
  return ''
}

export const getSupabaseTestEnv = (): SupabaseTestEnv => {
  const url = pickEnv('SUPABASE_TEST_URL', 'VITE_SUPABASE_TEST_URL')
  const anonKey = pickEnv('SUPABASE_TEST_ANON_KEY', 'VITE_SUPABASE_TEST_ANON_KEY')
  const serviceRoleKey = pickEnv('SUPABASE_TEST_SERVICE_ROLE_KEY')

  if (!url || !anonKey) {
    throw new Error(
      'Missing test Supabase env vars. Set SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY (or VITE_* equivalents).'
    )
  }

  return { url, anonKey, serviceRoleKey: serviceRoleKey || undefined }
}

export const createSupabaseTestClient = ({
  useServiceRole = false,
}: {
  useServiceRole?: boolean
} = {}): SupabaseClient<Database> => {
  const env = getSupabaseTestEnv()
  const key = useServiceRole && env.serviceRoleKey ? env.serviceRoleKey : env.anonKey
  return createClient<Database>(env.url, key)
}
