import type { TwilioCredentials } from '@/types/database'

export type TwilioMessageResult = {
  success: boolean
  sid?: string
  error?: string
}

export type TwilioTestResult = {
  success: boolean
  accountName?: string
  error?: string
}

/**
 * Get Twilio credentials from DB or fallback to env variables
 */
export function getCredentialsFromEnv(): TwilioCredentials | null {
  const account_sid = process.env.TWILIO_ACCOUNT_SID
  const auth_token = process.env.TWILIO_AUTH_TOKEN

  if (!account_sid || !auth_token) {
    return null
  }

  return {
    account_sid,
    auth_token,
    from_sms: process.env.TWILIO_FROM_SMS,
    from_whatsapp: process.env.TWILIO_FROM_WHATSAPP,
  }
}

/**
 * Build authorization header for Twilio API
 */
function buildAuthHeader(accountSid: string, authToken: string): string {
  return Buffer.from(`${accountSid}:${authToken}`).toString('base64')
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(
  to: string,
  body: string,
  credentials: TwilioCredentials
): Promise<TwilioMessageResult> {
  const { account_sid, auth_token, from_sms } = credentials

  if (!from_sms) {
    return { success: false, error: 'SMS gönderen numarası tanımlı değil.' }
  }

  try {
    const authHeader = buildAuthHeader(account_sid, auth_token)
    const bodyParams = new URLSearchParams({
      To: to,
      From: from_sms,
      Body: body,
    })

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'SMS gönderimi başarısız oldu.'
      }
    }

    return { success: true, sid: data.sid }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMS gönderimi başarısız oldu.'
    }
  }
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsApp(
  to: string,
  body: string,
  credentials: TwilioCredentials
): Promise<TwilioMessageResult> {
  const { account_sid, auth_token, from_whatsapp } = credentials

  if (!from_whatsapp) {
    return { success: false, error: 'WhatsApp gönderen numarası tanımlı değil.' }
  }

  // Ensure WhatsApp prefix
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  const fromNumber = from_whatsapp.startsWith('whatsapp:') ? from_whatsapp : `whatsapp:${from_whatsapp}`

  try {
    const authHeader = buildAuthHeader(account_sid, auth_token)
    const bodyParams = new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: body,
    })

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'WhatsApp mesajı gönderilemedi.'
      }
    }

    return { success: true, sid: data.sid }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'WhatsApp mesajı gönderilemedi.'
    }
  }
}

/**
 * Test Twilio connection by fetching account info
 */
export async function testConnection(
  credentials: TwilioCredentials
): Promise<TwilioTestResult> {
  const { account_sid, auth_token } = credentials

  try {
    const authHeader = buildAuthHeader(account_sid, auth_token)

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${account_sid}.json`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Twilio bağlantısı başarısız.'
      }
    }

    return {
      success: true,
      accountName: data.friendly_name || data.sid
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Twilio bağlantısı başarısız.'
    }
  }
}

/**
 * Send message via Twilio (unified function for SMS and WhatsApp)
 */
export async function sendTwilioMessage(
  method: 'sms' | 'whatsapp',
  to: string,
  body: string,
  credentials: TwilioCredentials
): Promise<TwilioMessageResult> {
  if (method === 'whatsapp') {
    return sendWhatsApp(to, body, credentials)
  }
  return sendSMS(to, body, credentials)
}
