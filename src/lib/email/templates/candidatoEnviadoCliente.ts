import { sendEmail } from '../send'
import { emailTemplate } from '../template'

type Params = {
  clientEmail: string
  clientName?: string
  candidateName: string
  jobTitle: string
  submissionId: string
  appUrl: string
}

export async function notificarCandidatoEnviadoCliente(p: Params) {
  const html = emailTemplate({
    preheader: `${p.candidateName} foi adicionado à sua shortlist para ${p.jobTitle}`,
    title: 'Novo candidato na sua shortlist',
    body: `
      <p style="margin:0 0 12px 0;">${p.clientName ? `Olá ${p.clientName.split(' ')[0]},` : 'Olá,'}</p>
      <p style="margin:0 0 16px 0;">Nosso time de HR curou e aprovou um novo candidato para sua vaga.</p>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F9FAFB;border-radius:8px;padding:16px;margin:16px 0;">
        <tr><td>
          <div style="font-size:13px;color:#6B7280;margin-bottom:4px;">Candidato</div>
          <div style="font-size:15px;color:#111827;font-weight:600;margin-bottom:12px;">${p.candidateName}</div>
          <div style="font-size:13px;color:#6B7280;margin-bottom:4px;">Vaga</div>
          <div style="font-size:15px;color:#111827;font-weight:600;">${p.jobTitle}</div>
        </td></tr>
      </table>

      <p style="margin:16px 0 0 0;color:#6B7280;font-size:14px;">Acesse a plataforma para revisar o perfil e dar feedback.</p>
    `,
    ctaText: 'Ver candidato',
    ctaUrl: `${p.appUrl}/empresa/candidatos/${p.submissionId}`,
    footer: 'Você recebeu este email porque tem uma vaga ativa na Nexhire.',
  })

  return sendEmail({
    to: p.clientEmail,
    subject: `Novo candidato: ${p.candidateName} para ${p.jobTitle}`,
    html,
  })
}