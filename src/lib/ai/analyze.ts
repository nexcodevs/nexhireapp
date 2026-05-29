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

export interface PrefillSuggestion {
  jd_priorities: string
  hunter_score: number
  hunter_score_rationale: string
  interview_outline: string
}

export interface PrefillSubmissionInput {
  jobTitle: string
  jobDescription: string
  seniority: string
  cvText: string
}

/**
 * Pré-fill IA — analisa CV vs JD e sugere conteúdo pros campos
 * do form de submissão. Hunter revisa e ajusta antes de enviar.
 */
export async function prefillSubmission(
  input: PrefillSubmissionInput,
): Promise<PrefillSuggestion> {
  const prompt = `Você é um especialista em recrutamento ajudando um hunter a preparar a submissão de um candidato. O hunter ainda não entrevistou o candidato — você só tem o CV e a JD.

VAGA:
Título: ${input.jobTitle}
Senioridade: ${input.seniority}
Descrição: ${input.jobDescription}

CV DO CANDIDATO (texto extraído do PDF):
${input.cvText}

Gere sugestões pro hunter revisar:

1. jd_priorities: identifique os 3 requisitos MAIS importantes da JD que o candidato COBRE com evidência do CV. Use exatamente este formato:
"1. [Requisito do JD] — Evidência no CV: [trecho ou descrição curta do que comprova]
2. ...
3. ..."

2. hunter_score: nota de 1 a 10 sobre o fit candidato↔vaga baseado SÓ no CV (sem entrevista). 1 = sem match. 10 = match perfeito documentado.

3. hunter_score_rationale: 1-2 frases justificando o score. Cite força clara + gap visível. Tom direto, sem floreio.

4. interview_outline: 5 pontos curtos que o hunter DEVE validar na conversa pra confirmar/desafiar o CV. Formato bullet:
"- ...
- ...
- ...
- ...
- ..."

Regras:
- Nunca invente experiências que não estão no CV
- Sinalize gaps abertamente — não maquie
- Se o CV está fraco pra vaga, dê score baixo. Não infle

Retorne APENAS JSON válido sem markdown sem backticks:

{
  "jd_priorities": "",
  "hunter_score": 0,
  "hunter_score_rationale": "",
  "interview_outline": ""
}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const suggestion: PrefillSuggestion = JSON.parse(text)
  return suggestion
}

export interface HunterRiskAssessment {
  decision: 'auto_approve' | 'needs_review' | 'reject'
  confidence: number
  reasoning: string
  red_flags: string[]
}

export interface HunterRiskInput {
  fullName: string
  email: string
  linkedinUrl: string
  specialties: string[]
  yearsExperience: number
  bio: string
}

/**
 * Avalia o risco de um novo hunter no signup pra decidir entre
 * auto-aprovar, mandar pra revisão humana, ou rejeitar.
 */
export async function evaluateHunterRisk(
  input: HunterRiskInput,
): Promise<HunterRiskAssessment> {
  const prompt = `Você é um avaliador de cadastros de recrutadores numa plataforma de hire. Sua função é decidir se um novo hunter pode ser auto-aprovado ou se precisa revisão humana.

DADOS DO HUNTER:
- Nome: ${input.fullName}
- Email: ${input.email}
- LinkedIn: ${input.linkedinUrl}
- Anos em recrutamento: ${input.yearsExperience}
- Especialidades declaradas: ${input.specialties.join(', ') || '(não declarou)'}
- Autodescrição: "${input.bio}"

CRITÉRIOS DE AVALIAÇÃO:

Auto-aprovar quando TODOS estes pontos forem verdadeiros:
- Email parece profissional (não temporário, não suspeito)
- LinkedIn URL tem formato válido (linkedin.com/in/...)
- Especialidades são plausíveis e específicas (não genéricas tipo "tudo")
- Anos de experiência é coerente (1-30)
- Bio tem ao menos 40 caracteres, faz sentido em português, descreve experiência real

Mandar pra revisão quando ALGUM destes pontos:
- Bio muito genérica, vazia, ou parece gerada por IA sem contexto pessoal
- Especialidades muito amplas demais
- LinkedIn não está no formato linkedin.com/in/usuario
- Anos de experiência menor que 1 ou maior que 40
- Email parece pessoal mas não profissional (gmail OK, hotmail OK, tempmail NOT OK)

Rejeitar quando QUALQUER um:
- Bio contém spam, claims absurdos, ou linguagem ofensiva
- Email é temporário (tempmail, mailinator, 10minutemail, etc.)
- Dados claramente fraudulentos (nome fake óbvio, etc.)

Retorne APENAS JSON válido sem markdown sem backticks:

{
  "decision": "auto_approve",
  "confidence": 0,
  "reasoning": "",
  "red_flags": []
}

Onde:
- decision: "auto_approve" | "needs_review" | "reject"
- confidence: 0 a 100 (sua certeza na decisão)
- reasoning: 1-2 frases explicando a decisão
- red_flags: array de strings com sinais de alerta encontrados (vazio se nenhum)`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const assessment: HunterRiskAssessment = JSON.parse(text)
  return assessment
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
