import { sendEmail } from '../send'
import { emailTemplate } from '../template'

type NovaSubmissaoParams = {
  hrEmail: string
  hrName?: string
  candidateName: string
  jobTitle: string
  companyName: string
  hunterName: string
  submissionId: string
  appUrl: string
}

export async function notificarNovaSubmissao(params: NovaSubmissaoParams) {
  const {
    hrEmail,
    hrName,
    candidateName,
    jobTitle,
    companyName,
    hunterName,
    submissionId,
    appUrl,
  } = params

  const html = emailTemplate({
    preheader: `${candidateName} foi enviado para ${jobTitle}`,
    title: `Novo candidato para revisar`,
    body: `
      <p style="margin:0 0 12px 0;">${hrName ? `Olá ${hrName.split(' ')[0]},` : 'Olá,'}</p>
      <p style="margin:0 0 16px 0;"><strong>${hunterName}</strong> enviou um novo candidato para curadoria.</p>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F9FAFB;border-radius:8px;padding:16px;margin:16px 0;">
        <tr>
          <td>
            <div style="font-size:13px;color:#6B7280;margin-bottom:4px;">Candidato</div>
            <div style="font-size:15px;color:#111827;font-weight:600;margin-bottom:12px;">${candidateName}</div>

            <div style="font-size:13px;color:#6B7280;margin-bottom:4px;">Vaga</div>
            <div style="font-size:15px;color:#111827;font-weight:600;margin-bottom:4px;">${jobTitle}</div>
            <div style="font-size:13px;color:#6B7280;">${companyName}</div>
          </td>
        </tr>
      </table>

      <p style="margin:16px 0 0 0;color:#6B7280;font-size:14px;">Quanto antes a revisão, mais rápido o cliente recebe a shortlist.</p>
    `,
    ctaText: 'Revisar candidato',
    ctaUrl: `${appUrl}/hr/submissoes/${submissionId}`,
    footer: 'Você recebeu este email porque é HR Manager na Nexhire. Para alterar suas preferências de notificação, acesse seu perfil.',
  })

  return sendEmail({
    to: hrEmail,
    subject: `Novo candidato: ${candidateName} para ${jobTitle}`,
    html,
  })
}