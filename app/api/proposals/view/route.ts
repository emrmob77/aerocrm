import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type ViewPayload = {
  slug?: string
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as ViewPayload | null
  const slug = payload?.slug?.trim()

  if (!slug) {
    return NextResponse.json({ error: 'Slug zorunludur.' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, status, public_url')
    .like('public_url', `%/p/${slug}`)
    .maybeSingle()

  if (!proposal?.id) {
    return NextResponse.json({ tracked: false })
  }

  if (proposal.status !== 'signed' && proposal.status !== 'draft') {
    await supabase.from('proposals').update({ status: 'viewed' }).eq('id', proposal.id)
  }

  return NextResponse.json({ tracked: true })
}
