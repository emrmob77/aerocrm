import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ContactForm } from '@/components/contacts'

export const dynamic = 'force-dynamic'

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .single()

  const teamId = profile?.team_id ?? null

  let contactQuery = supabase
    .from('contacts')
    .select('id, full_name, email, phone, company, position, address, user_id, team_id')
    .eq('id', params.id)

  if (teamId) {
    contactQuery = contactQuery.eq('team_id', teamId)
  } else {
    contactQuery = contactQuery.eq('user_id', user.id)
  }

  const { data: contact } = await contactQuery.single()

  if (!contact) {
    notFound()
  }

  return (
    <ContactForm
      mode="edit"
      contactId={contact.id}
      initialData={{
        full_name: contact.full_name,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        company: contact.company ?? '',
        position: contact.position ?? '',
        address: contact.address ?? '',
      }}
    />
  )
}
