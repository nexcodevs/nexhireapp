import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY não configurada. Emails não serão enviados.')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const EMAIL_FROM = process.env.EMAIL_FROM || 'Nexhire <onboarding@resend.dev>'
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || undefined