type EmailTemplate = {
  subject: string
  text: string
  html: string
}

type Locale = 'tr' | 'en'

const toHtmlLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('<br />')

const baseTemplate = (params: {
  title: string
  intro: string
  body: string
  actionLabel?: string
  actionUrl?: string
  footer?: string
}): string => {
  return `
    <div style="font-family:Arial, sans-serif; line-height:1.6; color:#0f172a;">
      <h2 style="margin-bottom:12px;">${params.title}</h2>
      <p>${params.intro}</p>
      <p>${toHtmlLines(params.body)}</p>
      ${
        params.actionLabel && params.actionUrl
          ? `<p style="margin:24px 0;">
              <a href="${params.actionUrl}" style="background:#2563eb; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none; display:inline-block;">
                ${params.actionLabel}
              </a>
            </p>`
          : ''
      }
      ${
        params.footer
          ? `<p style="margin-top:24px; font-size:12px; color:#64748b;">${params.footer}</p>`
          : ''
      }
    </div>
  `
}

const emailCopy: Record<Locale, Record<string, string>> = {
  tr: {
    inviteSubject: 'AERO CRM takım daveti',
    inviteSubjectRenewed: 'AERO CRM takım daveti (yenilendi)',
    inviteTitle: 'Takım Daveti',
    inviteIntro: '{inviter} sizi AERO CRM takımına davet etti.',
    inviteIntroRenewed: '{inviter} sizi AERO CRM takımına tekrar davet etti.',
    inviteBody: 'Katılmak için aşağıdaki bağlantıyı kullanın.',
    inviteAction: 'Daveti Kabul Et',
    inviteFooter: 'Bu davet 7 gün boyunca geçerlidir.',
    proposalIntro: 'AERO CRM üzerinden yeni bir teklif gönderildi.',
    proposalAction: 'Teklifi Görüntüle',
    proposalAnchor: 'Teklifi görüntülemek için:',
    proposalDefaultSubject: '{client} için Teklif',
    proposalDefaultMessage:
      'Merhaba {client},\n\nTeklifinizi paylaşmak istedim.\n\nTeklifi görüntülemek için:\n\nİyi çalışmalar,\nAERO CRM',
  },
  en: {
    inviteSubject: 'AERO CRM team invitation',
    inviteSubjectRenewed: 'AERO CRM team invitation (renewed)',
    inviteTitle: 'Team Invitation',
    inviteIntro: '{inviter} invited you to the AERO CRM team.',
    inviteIntroRenewed: '{inviter} invited you again to the AERO CRM team.',
    inviteBody: 'Use the link below to join.',
    inviteAction: 'Accept Invite',
    inviteFooter: 'This invite is valid for 7 days.',
    proposalIntro: 'A new proposal was sent via AERO CRM.',
    proposalAction: 'View Proposal',
    proposalAnchor: 'To view the proposal:',
    proposalDefaultSubject: 'Proposal for {client}',
    proposalDefaultMessage:
      'Hello {client},\n\nI wanted to share your proposal.\n\nTo view the proposal:\n\nBest regards,\nAERO CRM',
  },
}

const interpolate = (template: string, vars?: Record<string, string>) =>
  vars ? template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`) : template

const getCopy = (locale?: Locale) => emailCopy[locale === 'en' ? 'en' : 'tr']

export const getProposalDefaults = (params: { locale?: Locale; client: string }) => {
  const copy = getCopy(params.locale)
  return {
    subject: interpolate(copy.proposalDefaultSubject, { client: params.client }),
    message: interpolate(copy.proposalDefaultMessage, { client: params.client }),
    anchor: copy.proposalAnchor,
  }
}

export const buildTeamInviteEmail = (params: {
  inviter: string
  link: string
  locale?: Locale
  variant?: 'initial' | 'renewed'
}): EmailTemplate => {
  const copy = getCopy(params.locale)
  const intro =
    params.variant === 'renewed'
      ? interpolate(copy.inviteIntroRenewed, { inviter: params.inviter })
      : interpolate(copy.inviteIntro, { inviter: params.inviter })

  const subject = params.variant === 'renewed' ? copy.inviteSubjectRenewed : copy.inviteSubject
  const text = `${intro} ${copy.inviteBody} ${params.link}`
  const html = baseTemplate({
    title: copy.inviteTitle,
    intro,
    body: copy.inviteBody,
    actionLabel: copy.inviteAction,
    actionUrl: params.link,
    footer: copy.inviteFooter,
  })
  return { subject, text, html }
}

export const buildProposalDeliveryEmail = (params: {
  subject: string
  message: string
  link?: string
  locale?: Locale
}): EmailTemplate => {
  const text = params.message
  const copy = getCopy(params.locale)
  const html = baseTemplate({
    title: params.subject,
    intro: copy.proposalIntro,
    body: params.message,
    actionLabel: params.link ? copy.proposalAction : undefined,
    actionUrl: params.link,
  })
  return { subject: params.subject, text, html }
}
