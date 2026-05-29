import Anthropic from '@anthropic-ai/sdk'
import { logAIUsage } from './usage'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5'

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantContext {
  userRole: 'company_user' | 'recruiter' | 'hr_manager' | 'admin' | 'candidate'
  userName: string | null
  pageUrl: string
  pageData?: Record<string, unknown>
}

function buildSystemPrompt(ctx: AssistantContext): string {
  const roleDescription: Record<AssistantContext['userRole'], string> = {
    company_user: 'representante de uma empresa que contrata via Nexhire',
    recruiter: 'recrutador externo (hunter) que envia candidatos pra vagas',
    hr_manager: 'HR Manager da Nexhire que cura vagas e candidatos',
    admin: 'admin master da plataforma Nexhire',
    candidate: 'candidato buscando vagas',
  }

  return `Você é a Nexhire AI, assistente conversacional da plataforma Nexhire (recrutamento IA-Native que combina IA + hunters + curadoria humana).

CONTEXTO DO USUÁRIO:
- Papel: ${roleDescription[ctx.userRole]}
- Nome: ${ctx.userName ?? 'usuário'}
- Página atual: ${ctx.pageUrl}

${
  ctx.pageData && Object.keys(ctx.pageData).length > 0
    ? `DADOS DA PÁGINA ATUAL:\n${JSON.stringify(ctx.pageData, null, 2)}\n\n`
    : ''
}REGRAS:
- Responda em português BR, tom direto e útil, sem floreio
- Máximo 4-5 frases por resposta (resumo executivo, não tese)
- Cite fatos concretos quando tiver dados disponíveis
- Se a info não está disponível, diga claramente "não tenho esse dado aqui — verifique em [seção da plataforma]"
- Use linguagem natural, sem jargão técnico desnecessário
- Quando sugerir ação, seja específico ("vai em /empresa/vagas e clica em X")
- Se a pergunta é fora do escopo Nexhire (clima, esporte, política), redirecione gentilmente pra recrutamento
- Não invente nomes de candidatos, vagas, empresas que não estejam nos dados fornecidos`
}

export async function chatWithAssistant(
  messages: AssistantMessage[],
  context: AssistantContext,
  userId?: string | null,
): Promise<string> {
  if (messages.length === 0) {
    throw new Error('Nenhuma mensagem fornecida.')
  }

  const start = new Date().getTime()
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: buildSystemPrompt(context),
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })

  if (userId) {
    void logAIUsage({
      userId,
      feature: 'assistant_chat',
      provider: 'anthropic',
      model: MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      durationMs: new Date().getTime() - start,
    })
  }

  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}
