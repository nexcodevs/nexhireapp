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

export interface AnalyzeCandidateInput {
  jobTitle: string
  jobDescription: string
  seniority: string
  candidateName: string
  candidateTitle: string
  interviewSummary: string
  cvText?: string | null
  jdPriorities?: string | null
  hunterScore?: number | null
  hunterScoreRationale?: string | null
}

export async function analyzeCandidate(input: AnalyzeCandidateInput): Promise<AIAnalysis> {
  const cvSection = input.cvText && input.cvText.trim().length > 0
    ? `\n\nCURRÍCULO (texto extraído do PDF enviado pelo hunter):\n${input.cvText}`
    : '\n\nObservação: o candidato não tem currículo em PDF anexado. Use apenas o resumo da entrevista para avaliar.'

  const hunterAssessment = [
    input.jdPriorities && input.jdPriorities.trim().length > 0
      ? `Pontos do JD priorizados pelo hunter:\n${input.jdPriorities}`
      : null,
    typeof input.hunterScore === 'number'
      ? `Score do hunter para fit candidato↔vaga: ${input.hunterScore}/10`
      : null,
    input.hunterScoreRationale && input.hunterScoreRationale.trim().length > 0
      ? `Justificativa do hunter para o score: ${input.hunterScoreRationale}`
      : null,
  ]
    .filter(Boolean)
    .join('\n\n')

  const hunterSection = hunterAssessment.length > 0
    ? `\n\nAVALIAÇÃO DO HUNTER:\n${hunterAssessment}\n\nUse a avaliação do hunter como input, mas tire suas próprias conclusões. Sinalize discrepâncias relevantes entre a opinião do hunter e o que você observa.`
    : ''

  const prompt = `Você é um especialista em recrutamento avaliando aderência entre candidato e vaga.

VAGA:
Título: ${input.jobTitle}
Senioridade: ${input.seniority}
Descrição: ${input.jobDescription}

CANDIDATO:
Nome: ${input.candidateName}
Cargo atual: ${input.candidateTitle}
Resumo da entrevista (escrito pelo hunter): ${input.interviewSummary}${cvSection}${hunterSection}

Analise a aderência do candidato à vaga com base em TODAS as informações acima.

Quando houver CV anexado, priorize fatos do CV sobre opiniões do resumo da entrevista.

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
- Nunca invente informações que não estejam no CV ou no resumo
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
