import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface AIAnalysis {
  score_geral: number
  resumo: string
  pontos_fortes: string[]
  gaps: string[]
  riscos: string[]
  fit_tecnico: number
  fit_senioridade: number
  fit_comportamental: number
  perguntas_recomendadas: string[]
  recomendacao: 'avancar' | 'revisar' | 'rejeitar'
  justificativa: string
}

export async function analyzeCandidate(
  jobDescription: string,
  jobTitle: string,
  seniority: string,
  interviewSummary: string,
  candidateName: string,
  candidateTitle: string,
): Promise<AIAnalysis> {
  const prompt = `Você é um especialista em recrutamento avaliando aderência entre candidato e vaga.

VAGA:
Título: ${jobTitle}
Senioridade: ${seniority}
Descrição: ${jobDescription}

CANDIDATO:
Nome: ${candidateName}
Cargo atual: ${candidateTitle}
Resumo da entrevista: ${interviewSummary}

Analise a aderência do candidato à vaga com base nas informações acima.

Retorne APENAS um JSON válido, sem texto adicional, sem markdown, sem backticks:

{
  "score_geral": 0,
  "resumo": "",
  "pontos_fortes": [],
  "gaps": [],
  "riscos": [],
  "fit_tecnico": 0,
  "fit_senioridade": 0,
  "fit_comportamental": 0,
  "perguntas_recomendadas": [],
  "recomendacao": "avancar",
  "justificativa": ""
}

Regras:
- score_geral: 0 a 100
- fit_tecnico, fit_senioridade, fit_comportamental: 0 a 100
- recomendacao: apenas "avancar", "revisar" ou "rejeitar"
- Nunca invente informações que não estejam no resumo
- Quando houver dúvida, marque como risco`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const analysis: AIAnalysis = JSON.parse(text)
  return analysis
}

export async function generateJobDescription(
  title: string,
  seniority: string,
  location: string,
  workModel: string,
  requirements: string,
): Promise<string> {
  const prompt = `Você é um especialista em recrutamento. Crie uma descrição de vaga profissional e atrativa.

Vaga: ${title}
Senioridade: ${seniority}
Local: ${location}
Modelo: ${workModel}
Requisitos informados: ${requirements}

Escreva uma descrição clara, direta e sem jargões corporativos.
Máximo 300 palavras. Retorne apenas o texto da descrição, sem título.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}