type EmailTemplate = {
  subject: string
  text: string
  html: string
}

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

export const buildTeamInviteEmail = (params: { inviter: string; link: string }): EmailTemplate => {
  const subject = 'AERO CRM takım daveti'
  const text = `${params.inviter} sizi AERO CRM takımına davet etti. Katılmak için: ${params.link}`
  const html = baseTemplate({
    title: 'Takım Daveti',
    intro: `${params.inviter} sizi AERO CRM takımına davet etti.`,
    body: 'Katılmak için aşağıdaki bağlantıyı kullanın.',
    actionLabel: 'Daveti Kabul Et',
    actionUrl: params.link,
    footer: 'Bu davet 7 gün boyunca geçerlidir.',
  })
  return { subject, text, html }
}

export const buildProposalDeliveryEmail = (params: {
  subject: string
  message: string
  link?: string
}): EmailTemplate => {
  const text = params.message
  const html = baseTemplate({
    title: params.subject,
    intro: 'AERO CRM üzerinden yeni bir teklif gönderildi.',
    body: params.message,
    actionLabel: params.link ? 'Teklifi Görüntüle' : undefined,
    actionUrl: params.link,
  })
  return { subject: params.subject, text, html }
}
