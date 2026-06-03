import { createAdminClient } from '@/lib/supabase/admin'

export type AIFeature =
  | 'analyze_candidate'
  | 'prefill_submission'
  | 'candidate_pitch'
  | 'ask_candidate'
  | 'compare_candidates'
  | 'generate_job'
  | 'evaluate_hunter'
  | 'transcribe'
  | 'search_jobs_embed'
  | 'embeddings_backfill'
  | 'insights'
  | 'assistant_chat'
  | 'assess_candidate'
  | 'enrich_candidate_profile'

export type AIProvider = 'anthropic' | 'groq' | 'voyage'

/**
 * Preços por 1M de tokens em USD. Atualizar conforme provedor.
 * Source: anthropic.com/pricing, console.groq.com/docs/pricing, voyageai.com/pricing
 */
const PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic — USD por 1M tokens
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5': { input: 1.0, output: 5.0 },
  // Voyage — USD por 1M tokens (sem output, embedding)
  'voyage-3-large': { input: 0.18, output: 0 },
  // Groq Whisper — preço por hora de áudio; convertido pra "input tokens"
  // como fallback (1s ≈ 1 token aproximado pra contagem). Custo real:
  // whisper-large-v3-turbo $0.04/h ≈ $0.00001111 / segundo.
  'whisper-large-v3-turbo': { input: 0.04 / 3600 * 1_000_000, output: 0 },
}

export function estimateCostUsd(
  model: string | null,
  inputTokens: number | null,
  outputTokens: number | null,
): number {
  if (!model) return 0
  const price = PRICING[model]
  if (!price) return 0
  const inputCost = ((inputTokens ?? 0) / 1_000_000) * price.input
  const outputCost = ((outputTokens ?? 0) / 1_000_000) * price.output
  return Number((inputCost + outputCost).toFixed(6))
}

export interface LogAIUsageInput {
  userId: string | null
  feature: AIFeature
  provider: AIProvider
  model?: string | null
  inputTokens?: number | null
  outputTokens?: number | null
  durationMs?: number | null
  metadata?: Record<string, unknown>
}

/**
 * Registra um evento de consumo de IA. Não bloqueia o fluxo em caso de erro.
 */
export async function logAIUsage(input: LogAIUsageInput): Promise<void> {
  try {
    const admin = createAdminClient()
    const cost = estimateCostUsd(
      input.model ?? null,
      input.inputTokens ?? null,
      input.outputTokens ?? null,
    )

    const { error } = await admin.from('ai_usage_events').insert({
      user_id: input.userId,
      feature: input.feature,
      provider: input.provider,
      model: input.model ?? null,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      duration_ms: input.durationMs ?? null,
      cost_usd: cost,
      metadata: input.metadata ?? null,
    })

    if (error) {
      console.warn('[ai-usage] insert falhou:', error.message)
    }
  } catch (err) {
    console.warn('[ai-usage] exception:', err)
  }
}

/**
 * Verifica quota diária do user pra uma feature.
 * Retorna { allowed, used, limit }. Conta eventos das últimas 24h.
 */
export async function checkDailyAIQuota(
  userId: string,
  feature: AIFeature,
  limit: number,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  try {
    const admin = createAdminClient()
    const twentyFourHoursAgo = new Date(
      new Date().getTime() - 24 * 60 * 60 * 1000,
    ).toISOString()

    const { count, error } = await admin
      .from('ai_usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('feature', feature)
      .gte('created_at', twentyFourHoursAgo)

    if (error) {
      console.warn('[ai-quota] erro:', error.message)
      // Fail open — não bloqueia em caso de erro do tracker
      return { allowed: true, used: 0, limit }
    }

    const used = count ?? 0
    return { allowed: used < limit, used, limit }
  } catch (err) {
    console.warn('[ai-quota] exception:', err)
    return { allowed: true, used: 0, limit }
  }
}

/**
 * Limites diários por feature por user.
 * Editar aqui pra ajustar quota global.
 */
export const DAILY_AI_LIMITS: Record<AIFeature, number> = {
  analyze_candidate: 50,
  prefill_submission: 30,
  candidate_pitch: 50,
  ask_candidate: 30,
  compare_candidates: 20,
  generate_job: 10,
  evaluate_hunter: 5,
  transcribe: 20,
  search_jobs_embed: 50,
  embeddings_backfill: 5,
  insights: 10,
  assistant_chat: 100,
  assess_candidate: 30,
  enrich_candidate_profile: 10,
}
