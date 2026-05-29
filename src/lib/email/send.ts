import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from './client'

type SendEmailParams = {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY ausente; pulando envio (mock).')
    return { success: true, mocked: true }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo: replyTo || EMAIL_REPLY_TO,
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      return { success: false, error }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('Exceção ao enviar email:', err)
    return { success: false, error: err }
  }
}