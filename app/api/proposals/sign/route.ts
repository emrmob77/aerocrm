import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type SignPayload = {
  slug?: string
  signature?: string
  name?: string
}

type SignatureBlock = {
  id: string
  type: 'signature'
  data: {
    label?: string
    required?: boolean
    signatureImage?: string
    signedName?: string
    signedAt?: string
  }
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as SignPayload | null
  const slug = payload?.slug?.trim()
  const signature = payload?.signature?.trim()
  const name = payload?.name?.trim()

  if (!slug || !signature || !name) {
    return NextResponse.json({ error: 'Eksik imza bilgisi.' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('id, blocks, status, public_url')
    .like('public_url', `%/p/${slug}`)
    .maybeSingle()

  if (error || !proposal?.id) {
    return NextResponse.json({ error: 'Teklif bulunamadı.' }, { status: 404 })
  }

  const signedAt = new Date().toISOString()
  const blocks = Array.isArray(proposal.blocks) ? proposal.blocks : []
  const nextBlocks = blocks.map((block) => {
    if (block?.type === 'signature') {
      return {
        ...block,
        data: {
          ...(block as SignatureBlock).data,
          signatureImage: signature,
          signedName: name,
          signedAt,
        },
      }
    }
    return block
  })

  const { error: updateError } = await supabase
    .from('proposals')
    .update({ blocks: nextBlocks, status: 'signed' })
    .eq('id', proposal.id)

  if (updateError) {
    return NextResponse.json({ error: 'İmza kaydedilemedi.' }, { status: 400 })
  }

  return NextResponse.json({ success: true, signedAt })
}
