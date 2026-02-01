'use client'

import { useMemo } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

export function useSupabase() {
  const supabase = useMemo(() => getSupabaseClient(), [])
  return supabase
}
