import { sendEmail } from '../send'
import { emailTemplate } from '../template'

type Params = {
  hrEmail: string
  hrName?: string
  candidateName: string
  jobTitle: string
  companyName: string
  decision: 'approved' | 'rejected'
  reason?: string
  submissionId: string
  appUrl: string
}

export async function notificarDecisaoCliente(p: Params) {
  const aprovado = p.decision === 'approved'
  const html = emailTemplate({
    preheader: `${p.companyName} ${aprovado ? 'aprovou' : 'reprovou'} ${p.candidateName}`,
    title: aprovado ? 'Cliente aprovou candidato' : 'Cliente reprovou candidato',
    body: `
      <p style="margin:0 0 12px 0;">${p.hrName ? `Olá ${p.hrName.split(' ')[0]},` : 'Olá,'}</p>
      <p style="margin:0 0 16px 0;"><strong>${p.companyName}</strong> ${aprovado ? 'aprovou' : 'reprovou'} um candidato.</p>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F9FAFB;border-radius:8px;padding:16px;margin:16px 0;">
        <tr><td>
          <div style="font-size:13px;color:#6B7280;margin-bottom:4px;">Candidato</div>
          <div style="font-size:15px;color:#111827;font-weight:600;margin-bottom:12px;">${p.candidateName}</div>
          <div style="font-size:13px;color:#6B7280;margin-bottom:4px;">Vaga</div>
          <div style="font-size:15px;color:#111827;font-weight:600;">${p.jobTitle}</div>
        </td></tr>
      </table>

      ${p.reason ? `
        <div style="background-color:${aprovado ? '#F0FDF4' : '#FEF2F2'};border-radius:8px;padding:14px;margin:16px 0;">
          <div style="font-size:13px;color:#6B7280;margin-bottom:4px;">Motivo</div>
          <div style="font-size:14px;color:#111827;">${p.reason}</div>
        </div>
      ` : ''}

      <p style="margin:16px 0 0 0;color:#6B7280;font-size:14px;">
        ${aprovado ? 'Hora de agendar a entrevista.' : 'Considere enviar outro candidato para esta vaga.'}
      </p>
    `,
    ctaText: 'Abrir submissão',
    ctaUrl: `${p.appUrl}/hr/submissoes/${p.submissionId}`,
  })

  return sendEmail({
    to: p.hrEmail,
    subject: `${aprovado ? '✓' : '✗'} ${p.companyName} ${aprovado ? 'aprovou' : 'reprovou'}: ${p.candidateName}`,
    html,
  })
}