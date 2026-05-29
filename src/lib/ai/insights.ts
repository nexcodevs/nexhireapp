import Anthropic from '@anthropic-ai/sdk'
import { logAIUsage } from './usage'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5'

export type InsightSeverity = 'positive' | 'attention' | 'neutral'

export interface Insight {
  title: string
  message: string
  severity: InsightSeverity
  cta?: { label: string; href: string }
}

export type InsightRole = 'company_user' | 'recruiter' | 'hr_manager' | 'admin'

export interface InsightsInput {
  role: InsightRole
  userName: string | null
  data: Record<string, unknown>
}

export async function generateInsights(
  input: InsightsInput,
  userId?: string | null,
): Promise<Insight[]> {
  const roleContext: Record<InsightRole, string> = {
    company_user: 'representante de empresa contratante',
    recruiter: 'recrutador externo (hunter)',
    hr_manager: 'HR Manager da Nexhire',
    admin: 'admin master da plataforma',
  }

  const prompt = `Você é um analista de dados observando o uso da plataforma Nexhire por um usuário específico. Sua função é gerar 3-4 insights úteis, factuais e acionáveis baseados nos dados abaixo.

USUÁRIO:
- Nome: ${input.userName ?? 'usuário'}
- Papel: ${roleContext[input.role]}

DADOS:
${JSON.stringify(input.data, null, 2)}

Gere 3 a 4 insights. Cada um tem:

- **title**: frase curta (max 60 chars) com o ponto principal. Sem exclamação.
- **message**: 1-2 frases explicando o insight com fato concreto dos dados acima. Tom direto, sem floreio.
- **severity**:
  - "positive" — algo bom acontecendo (alta taxa, crescimento, etc)
  - "attention" — algo precisa ação (vaga parada, hunter pendente, candidato esperando)
  - "neutral" — fato informativo sem urgência
- **cta** (opcional): { label, href } quando há ação clara que o usuário pode tomar

Caminhos válidos por papel:
- company_user: /empresa, /empresa/vagas, /empresa/vagas/nova, /empresa/candidatos
- recruiter: /hunter, /hunter/vagas, /hunter/submissoes
- hr_manager: /hr, /hr/vagas, /hr/submissoes, /hr/hunters, /hr/pipeline
- admin: /admin, /admin/empresas, /admin/hunters, /admin/audit

Regras duras:
- Nunca invente dados que não estão acima
- Se um número é zero, não invente atividade
- Insights específicos e concretos, NÃO genéricos tipo "continue assim"
- Priorize coisas que requerem ação ou estão fora do normal
- Português BR

Retorne APENAS um JSON array válido (sem markdown, sem backticks):

[
  {
    "title": "",
    "message": "",
    "severity": "neutral",
    "cta": { "label": "", "href": "" }
  }
]`

  const start = new Date().getTime()
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  if (userId) {
    void logAIUsage({
      userId,
      feature: 'insights',
      provider: 'anthropic',
      model: MODEL,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      durationMs: new Date().getTime() - start,
    })
  }

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const insights: Insight[] = JSON.parse(text)
  return insights.slice(0, 4)
}
