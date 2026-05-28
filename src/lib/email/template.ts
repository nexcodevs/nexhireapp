interface EmailTemplateProps {
  preheader?: string
  title: string
  body: string
  ctaText?: string
  ctaUrl?: string
  footer?: string
}

const LOGO_URL = `${process.env.NEXT_PUBLIC_APP_URL || 'https://nexhireapp.vercel.app'}/brand/nexhire-logo.svg`

export function emailTemplate({
  preheader = '',
  title,
  body,
  ctaText,
  ctaUrl,
  footer = 'Nexhire — Contrate melhor com IA + especialistas humanos.',
}: EmailTemplateProps): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#052E16;">
${preheader ? `<div style="display:none;font-size:1px;color:#FAFAFA;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAFAFA;">
  <tr>
    <td align="center" style="padding:40px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:#052E16;padding:28px 32px;">
            <img src="${LOGO_URL}" alt="Nexhire" width="120" style="display:block;height:auto;max-width:120px;">
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px 24px;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.3;letter-spacing:-0.02em;color:#052E16;">${title}</h1>
            <div style="font-size:15px;line-height:1.65;color:#374151;font-weight:400;">${body}</div>
            ${ctaText && ctaUrl ? `
            <div style="margin-top:28px;">
              <a href="${ctaUrl}" style="display:inline-block;background:#052E16;color:#FFFFFF;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:500;font-size:14px;letter-spacing:-0.01em;">${ctaText}</a>
            </div>` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 28px;border-top:1px solid #E5E7EB;background:#FAFAFA;">
            <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.6;">${footer}</p>
            <p style="margin:8px 0 0;font-size:11px;color:#9CA3AF;">Você está recebendo este e-mail porque tem uma conta na Nexhire.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}
