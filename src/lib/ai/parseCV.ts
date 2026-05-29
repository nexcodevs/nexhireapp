import { extractText, getDocumentProxy } from 'unpdf'

const MAX_CHARS = 15_000

/**
 * Extrai texto de um PDF (CV). Usa unpdf — lib moderna sem
 * dependência de worker, funciona em runtime serverless e Turbopack.
 */
export async function parseCV(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer)
  const pdf = await getDocumentProxy(data)
  const { text } = await extractText(pdf, { mergePages: true })

  const clean = (Array.isArray(text) ? text.join('\n') : text).trim()

  if (clean.length <= MAX_CHARS) return clean
  return clean.slice(0, MAX_CHARS) + '\n\n[…texto truncado para análise]'
}
