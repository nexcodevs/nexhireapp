/**
 * Gera embeddings via Voyage AI.
 * Model voyage-3-large: 1024 dims, multilingue (forte em PT/EN).
 */
import { logAIUsage, type AIFeature } from './usage'

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-3-large'

export type EmbedInputType = 'query' | 'document'

interface VoyageResponse {
  data: Array<{ embedding: number[]; index: number }>
  model: string
  usage: { total_tokens: number }
}

/**
 * Gera embedding de um texto. `input_type` ajuda o modelo a otimizar:
 * - 'document' pra textos indexados (vagas, perfis)
 * - 'query' pra texto de busca do usuário
 */
export async function embedText(
  text: string,
  inputType: EmbedInputType = 'document',
  meta?: { feature: AIFeature; userId: string | null },
): Promise<number[]> {
  const start = new Date().getTime()
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY ausente.')
  }

  const cleaned = text.trim().slice(0, 30000)
  if (cleaned.length === 0) {
    throw new Error('Texto vazio.')
  }

  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [cleaned],
      input_type: inputType,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Voyage error ${res.status}: ${errText}`)
  }

  const data = (await res.json()) as VoyageResponse
  const embedding = data.data[0]?.embedding
  if (!embedding || embedding.length === 0) {
    throw new Error('Voyage não retornou embedding válido.')
  }

  if (meta) {
    void logAIUsage({
      userId: meta.userId,
      feature: meta.feature,
      provider: 'voyage',
      model: VOYAGE_MODEL,
      inputTokens: data.usage?.total_tokens ?? null,
      outputTokens: 0,
      durationMs: new Date().getTime() - start,
    })
  }

  return embedding
}
