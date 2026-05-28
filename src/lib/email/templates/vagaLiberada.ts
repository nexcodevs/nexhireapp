import { sendEmail } from '../send'
import { emailTemplate } from '../template'

type Params = {
  hunterEmail: string
  hunterName?: string
  jobTitle: string
  companyName: string
  seniority?: string
  location?: string
  workModel?: string
  salaryMin?: number
  salaryMax?: number
  jobId: string
  appUrl: string
}

export async function notificarVagaLiberada(p: Params) {
  const salario = (p.salaryMin && p.salaryMax)
    ? `R$ ${p.salaryMin.toLocaleString('pt-BR')} – R$ ${p.salaryMax.toLocaleString('pt-BR')}`
    : null

  const html = emailTemplate({
    preheader: `Nova vaga: ${p.jobTitle} na ${p.companyName}`,
    title: 'Nova vaga disponível',
    body: `
      <p style="margin:0 0 12px 0;">${p.hunterName ? `Olá ${p.hunterName.split(' ')[0]},` : 'Olá,'}</p>
      <p style="margin:0 0 16px 0;">Uma nova vaga acaba de ser aberta no marketplace.</p>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F9FAFB;border-radius:8px;padding:16px;margin:16px 0;">
        <tr><td>
          <div style="font-size:18px;color:#111827;font-weight:700;margin-bottom:4px;">${p.jobTitle}</div>
          <div style="font-size:14px;color:#6B7280;margin-bottom:14px;">${p.companyName}</div>

          ${[p.seniority, p.location, p.workModel].filter(Boolean).map(t =>
            `<span style="display:inline-block;background-color:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;padding:4px 10px;font-size:12px;color:#374151;margin-right:6px;margin-bottom:6px;">${t}</span>`
          ).join('')}

          ${salario ? `<div style="font-size:14px;color:#15803D;font-weight:600;margin-top:10px;">${salario}</div>` : ''}
        </td></tr>
      </table>

      <p style="margin:16px 0 0 0;color:#6B7280;font-size:14px;">Quem envia primeiro tem maior chance — o ownership do candidato é do primeiro envio válido.</p>
    `,
    ctaText: 'Ver vaga e enviar candidato',
    ctaUrl: `${p.appUrl}/hunter/vagas/${p.jobId}`,
    footer: 'Você recebeu este email porque é hunter aprovado na Nexhire. Para alterar suas preferências, acesse seu perfil.',
  })

  return sendEmail({
    to: p.hunterEmail,
    subject: `Nova vaga: ${p.jobTitle} (${p.companyName})`,
    html,
  })
}