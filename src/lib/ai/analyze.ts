import Anthropic from '@anthropic-ai/sdk'
import { logAIUsage, type AIFeature } from './usage'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Modelos por nível de qualidade necessária. Haiku é ~5x mais barato.
// Use MODEL_QUALITY pra análises críticas (cliente vê, decisão importante).
// Use MODEL_FAST pra classificação simples, sugestões, Q&A curta.
const MODEL_QUALITY = 'claude-sonnet-4-20250514'
const MODEL_FAST = 'claude-haiku-4-5'

/**
 * Wrapper sobre client.messages.create que loga uso quando `meta` é passado.
 * Centraliza captura de tokens + custo sem espalhar `logAIUsage` em cada função.
 * Tipado pra non-streaming (Message). Não usar com stream:true.
 */
async function callClaude(
  params: Anthropic.MessageCreateParamsNonStreaming,
  meta?: { feature: AIFeature; userId: string | null },
): Promise<Anthropic.Message> {
  const start = new Date().getTime()
  const response = await client.messages.create(params)
  if (meta) {
    void logAIUsage({
      userId: meta.userId,
      feature: meta.feature,
      provider: 'anthropic',
      model: typeof params.model === 'string' ? params.model : null,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      durationMs: new Date().getTime() - start,
    })
  }
  return response
}

export type AIUsageMeta = { userId: string | null } | undefined

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

export async function analyzeCandidate(
  input: AnalyzeCandidateInput,
  userId?: string | null,
): Promise<AIAnalysis> {
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

  const message = await callClaude(
    {
      model: MODEL_QUALITY,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    },
    userId ? { feature: 'analyze_candidate', userId } : undefined,
  )

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
  userId?: string | null,
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

  const message = await callClaude(
    {
      model: MODEL_FAST,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    },
    userId ? { feature: 'prefill_submission', userId } : undefined,
  )

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
  userId?: string | null,
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

  const message = await callClaude(
    {
      model: MODEL_FAST,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    },
    userId ? { feature: 'evaluate_hunter', userId } : undefined,
  )

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const assessment: HunterRiskAssessment = JSON.parse(text)
  return assessment
}

export interface JobLanguageRequirement {
  code: string
  name: string
  level: 'básico' | 'intermediário' | 'fluente' | 'nativo'
}

export interface JobFromBrief {
  title: string
  description: string
  seniority: 'Estágio' | 'Júnior' | 'Pleno' | 'Sênior' | 'Especialista' | 'Gerente' | 'Diretor'
  work_model: 'Presencial' | 'Híbrido' | 'Remoto'
  employment_type: 'CLT' | 'PJ' | 'Estágio' | 'Freelance'
  location: string
  salary_min: number | null
  salary_max: number | null
  required_skills: string[]
  desired_skills: string[]
  behavioral_competencies: string[]
  culture_fit: string
  languages: JobLanguageRequirement[]
  certifications: string[]
  benefits: string[]
  interview_questions: string[]
  reasoning: string
}

export interface JobBriefInput {
  brief: string
  companyName?: string
  companyIndustry?: string | null
  companySize?: string | null
}

/**
 * Recebe texto livre descrevendo a vaga e retorna estrutura completa.
 * Empresa fala "Procuro ML eng sênior remoto R$15-18k" — IA monta vaga inteira.
 */
export async function generateJobFromBrief(
  input: JobBriefInput,
  userId?: string | null,
): Promise<JobFromBrief> {
  const companyCtx = [
    input.companyName ? `Empresa: ${input.companyName}` : null,
    input.companyIndustry ? `Setor: ${input.companyIndustry}` : null,
    input.companySize ? `Tamanho: ${input.companySize}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `Você é especialista em recrutamento. Uma empresa vai descrever em texto livre o que precisa contratar. Sua função é extrair e estruturar TODOS os campos de uma vaga formal.

${companyCtx ? `CONTEXTO DA EMPRESA:\n${companyCtx}\n\n` : ''}BRIEF DA EMPRESA:
"""
${input.brief}
"""

Sua função é ESTRUTURAR a vaga em campos separados, não jogar tudo numa descrição.

Estruture em JSON com TODOS os campos abaixo:

- **title**: título profissional, sem jargão (sem "ninja", "rockstar").
- **description**: resumo executivo de 80-120 palavras descrevendo CONTEXTO da vaga, não requisitos. Tom direto, sem floreio. Em português BR. Os requisitos vão em campos separados.
- **seniority**: Estágio | Júnior | Pleno | Sênior | Especialista | Gerente | Diretor.
- **work_model**: Presencial | Híbrido | Remoto. Default Remoto.
- **employment_type**: CLT | PJ | Estágio | Freelance. Default CLT.
- **location**: cidade/estado. Se remoto e brief não falar, "Brasil".
- **salary_min** e **salary_max**: números em reais. Estime range realista se brief não falar (mercado BR 2026).
- **required_skills**: array de strings com skills técnicas OBRIGATÓRIAS (5-8 itens). Ex: ["Python", "AWS", "PostgreSQL"]. Curto, sem frase.
- **desired_skills**: array de strings com skills DESEJÁVEIS (plus, não obrigatórias) (3-6 itens).
- **behavioral_competencies**: array de strings com competências comportamentais (3-5 itens). Ex: ["Liderança técnica", "Comunicação clara", "Autonomia"].
- **culture_fit**: 1-2 frases descrevendo o fit cultural esperado (valores, ambiente de trabalho).
- **languages**: array de objetos { code: string ISO 639-1, name: string em PT, level: "básico"|"intermediário"|"fluente"|"nativo" }. Inclua português nativo por default + outros se mencionado no brief. Ex: [{ "code": "pt", "name": "Português", "level": "nativo" }, { "code": "en", "name": "Inglês", "level": "fluente" }].
- **certifications**: array de strings com certificações úteis pra vaga (0-4 itens). Vazio se não relevante.
- **benefits**: array de strings com pacote típico de benefícios (4-8 itens). Ex: ["VR R$30/dia", "Plano de saúde", "Equipamento", "Stock options"]. Estime se brief não falar.
- **interview_questions**: array de 5-7 perguntas pré-aprovadas pro HR aplicar na entrevista, baseadas nos requisitos. Cobertura: técnica + comportamental + cultural. Sem perguntas óbvias tipo "fale sobre você".
- **reasoning**: 2-3 frases explicando decisões não óbvias (range salarial, requisitos importantes, etc).

Regras duras:
- Nunca invente requisitos que o brief não menciona ou que não sejam clichê esperado da posição.
- Description é resumo de CONTEXTO, não lista de requisitos.
- Skills curtas — palavras ou frases curtas, sem "Conhecimento em X" prefixado.
- Salário sempre inteiro em reais.
- Sem bullshit corporativo: "rockstar", "família", "fast-paced", "dinâmico".

Retorne APENAS JSON válido sem markdown sem backticks:

{
  "title": "",
  "description": "",
  "seniority": "Pleno",
  "work_model": "Remoto",
  "employment_type": "CLT",
  "location": "",
  "salary_min": 0,
  "salary_max": 0,
  "required_skills": [],
  "desired_skills": [],
  "behavioral_competencies": [],
  "culture_fit": "",
  "languages": [],
  "certifications": [],
  "benefits": [],
  "interview_questions": [],
  "reasoning": ""
}`

  const message = await callClaude(
    {
      model: MODEL_QUALITY,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    },
    userId ? { feature: 'generate_job', userId } : undefined,
  )

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const result: JobFromBrief = JSON.parse(text)
  return result
}

export interface CandidatePitch {
  pitch: string
  match_percent: number
  strengths: string[]
  gaps: string[]
  risks: string[]
}

export interface CandidatePitchInput {
  candidateName: string
  candidateTitle: string
  jobTitle: string
  jobDescription: string
  seniority: string
  cvText: string
  hunterScore?: number | null
  hunterRationale?: string | null
  aiSummary?: string | null
  interviewSummary?: string | null
}

/**
 * Gera um one-pager narrativo do candidato pra empresa cliente.
 * Substitui leitura de CV + análise crua por pitch direto e estruturado.
 */
export async function generateCandidatePitch(
  input: CandidatePitchInput,
  userId?: string | null,
): Promise<CandidatePitch> {
  const prompt = `Você é um head hunter sênior apresentando um candidato pra empresa cliente. Sua missão é gerar um pitch direto, honesto e útil pra empresa decidir avançar ou não.

VAGA:
Título: ${input.jobTitle}
Senioridade: ${input.seniority}
Descrição: ${input.jobDescription}

CANDIDATO:
Nome: ${input.candidateName}
Cargo atual: ${input.candidateTitle}

CV (texto extraído):
${input.cvText}

${input.interviewSummary ? `RESUMO DA ENTREVISTA (escrito pelo hunter):\n${input.interviewSummary}\n` : ''}
${input.hunterScore ? `SCORE DO HUNTER: ${input.hunterScore}/10\n` : ''}
${input.hunterRationale ? `JUSTIFICATIVA DO HUNTER: ${input.hunterRationale}\n` : ''}
${input.aiSummary ? `ANÁLISE ANTERIOR DA IA: ${input.aiSummary}\n` : ''}

Gere:

1. **pitch**: 2-3 frases narrativas que vendem o candidato pra essa vaga específica. Mostre o ponto mais forte primeiro. Cite fato concreto do CV. Tom direto, sem clichê de RH. Ex: "Pedro tem 8 anos em ML e liderou time de 6 em scale-up brasileira. Forte em PyTorch e MLOps com 3 publicações. Match alto pros requisitos de recommendation systems."

2. **match_percent**: 0-100. % de requisitos da vaga que o candidato cobre, com base no CV.

3. **strengths**: até 4 strings curtas (1-3 palavras cada). Ex: ["PyTorch", "Liderança técnica", "MLOps"]

4. **gaps**: até 3 strings curtas com lacunas identificadas. Ex: ["GCP", "Kubernetes"]

5. **risks**: até 3 strings curtas com riscos pra empresa considerar. Ex: ["Pretensão acima do orçamento", "Sem fluência em inglês"]

Regras duras:
- Nunca invente experiências que não estão no CV/entrevista
- Tom honesto: se candidato é fraco pra vaga, score baixo + risks claros
- Strings curtas e específicas — não "boa pessoa", "comunicativo"
- Português BR

Retorne APENAS JSON válido sem markdown sem backticks:

{
  "pitch": "",
  "match_percent": 0,
  "strengths": [],
  "gaps": [],
  "risks": []
}`

  const message = await callClaude(
    {
      model: MODEL_QUALITY,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    },
    userId ? { feature: 'candidate_pitch', userId } : undefined,
  )

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const pitch: CandidatePitch = JSON.parse(text)
  return pitch
}

export interface AskCandidateInput {
  question: string
  candidateName: string
  jobTitle: string
  jobDescription: string
  cvText: string
  interviewSummary?: string | null
  aiSummary?: string | null
}

/**
 * Q&A conversacional sobre um candidato específico.
 * Empresa pergunta, IA responde com base no contexto do candidato + vaga.
 */
export async function askAboutCandidate(
  input: AskCandidateInput,
  userId?: string | null,
): Promise<string> {
  const prompt = `Você é um head hunter sênior respondendo perguntas sobre um candidato específico pra ajudar a empresa cliente decidir.

CONTEXTO:
Vaga: ${input.jobTitle}
Descrição: ${input.jobDescription}

Candidato: ${input.candidateName}
CV:
${input.cvText}

${input.interviewSummary ? `Entrevista (escrito pelo hunter):\n${input.interviewSummary}\n` : ''}
${input.aiSummary ? `Análise IA anterior: ${input.aiSummary}\n` : ''}

PERGUNTA DA EMPRESA: "${input.question}"

Responda em português BR com base APENAS no CV + entrevista + análise IA. Se a info não está disponível, diga claramente "não há informação clara sobre isso no CV/entrevista — vale validar diretamente com o candidato".

Tom: direto, técnico, sem floreio. Máximo 4-5 frases. Cite trecho/fato concreto quando possível.

Retorne apenas o texto da resposta (sem markdown, sem prefixos tipo "Resposta:").`

  const message = await callClaude(
    {
      model: MODEL_FAST,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    },
    userId ? { feature: 'ask_candidate', userId } : undefined,
  )

  return message.content[0].type === 'text' ? message.content[0].text.trim() : ''
}

export interface CompareCandidate {
  id: string
  name: string
  currentTitle: string | null
  cvText: string
  interviewSummary: string | null
  aiSummary: string | null
  aiScore: number | null
}

export interface ComparisonDimension {
  label: string
  values: Record<string, string>
}

export interface CandidatesComparison {
  summary: string
  dimensions: ComparisonDimension[]
  recommendation: {
    winner_id: string
    reason: string
  }
}

export interface CompareCandidatesInput {
  jobTitle: string
  jobDescription: string
  seniority: string
  candidates: CompareCandidate[]
}

/**
 * Compara 2-4 candidatos pra uma vaga e gera análise dimensional + recomendação.
 */
export async function compareCandidates(
  input: CompareCandidatesInput,
  userId?: string | null,
): Promise<CandidatesComparison> {
  if (input.candidates.length < 2) {
    throw new Error('Precisa de pelo menos 2 candidatos pra comparar.')
  }
  if (input.candidates.length > 4) {
    throw new Error('Máximo 4 candidatos por comparação.')
  }

  const candidatesBlock = input.candidates
    .map(
      (c, i) => `
═══ CANDIDATO ${i + 1} (id: ${c.id}) ═══
Nome: ${c.name}
Cargo atual: ${c.currentTitle ?? '-'}
${c.aiScore ? `AI score prévio: ${c.aiScore}/100\n` : ''}
${c.aiSummary ? `Análise IA prévia: ${c.aiSummary}\n` : ''}
${c.interviewSummary ? `Resumo da entrevista (hunter): ${c.interviewSummary}\n` : ''}

CV:
${c.cvText.slice(0, 8000)}
`,
    )
    .join('\n\n')

  const prompt = `Você é um head hunter sênior comparando ${input.candidates.length} candidatos pra uma vaga. Sua missão é gerar uma análise comparativa estruturada que ajude a empresa decidir.

VAGA:
Título: ${input.jobTitle}
Senioridade: ${input.seniority}
Descrição: ${input.jobDescription}

${candidatesBlock}

Gere:

1. **summary**: parágrafo de 3-4 frases comparando os candidatos. Quem é mais forte em quê. Tom direto, sem floreio.

2. **dimensions**: array de 5-7 dimensões relevantes pra essa vaga, cada uma com valores curtos por candidato.
   Dimensões obrigatórias quando aplicável:
   - "Experiência total" (anos)
   - "Skills técnicas chave" (com base nos requisitos da vaga)
   - "Senioridade prática" (juniorzão, pleno+, sênior, lead)
   - "Liderança" (sim/não/parcial + contexto)
   - "Match com a vaga" (Alto/Médio/Baixo + razão curta)
   Outras dimensões pertinentes baseadas na vaga (ex: "Cloud", "MLOps", "Inglês", "Disponibilidade").

   Formato de cada value: curto, factual, citando fato concreto. Ex: "8 anos PyTorch, lead time 6 pessoas".

3. **recommendation**: qual candidato avançar e por quê em 1-2 frases. Use o "id" de UM dos candidatos.

Regras duras:
- Nunca invente experiências que não estão no CV
- Comparação honesta: se um é claramente mais fraco, fale
- Português BR
- Values curtos (max ~80 chars cada)

Retorne APENAS JSON válido sem markdown sem backticks. Use os IDs exatos dos candidatos:

{
  "summary": "",
  "dimensions": [
    { "label": "", "values": { "${input.candidates[0].id}": "", "${input.candidates[1].id}": "" } }
  ],
  "recommendation": {
    "winner_id": "${input.candidates[0].id}",
    "reason": ""
  }
}`

  const message = await callClaude(
    {
      model: MODEL_QUALITY,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    },
    userId ? { feature: 'compare_candidates', userId } : undefined,
  )

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const result: CandidatesComparison = JSON.parse(text)
  return result
}

export async function generateJobDescription(
  title: string,
  seniority: string,
  location: string,
  workModel: string,
  requirements: string,
  userId?: string | null,
): Promise<string> {
  const prompt = `Você é um especialista em recrutamento. Crie uma descrição de vaga profissional e atrativa.

Vaga: ${title}
Senioridade: ${seniority}
Local: ${location}
Modelo: ${workModel}
Requisitos informados: ${requirements}

Escreva uma descrição clara, direta e sem jargões corporativos.
Máximo 300 palavras. Retorne apenas o texto da descrição, sem título.`

  const message = await callClaude(
    {
      model: MODEL_FAST,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    },
    userId ? { feature: 'generate_job', userId } : undefined,
  )

  return message.content[0].type === 'text' ? message.content[0].text : ''
}
