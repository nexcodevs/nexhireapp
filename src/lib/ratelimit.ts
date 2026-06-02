import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const forgotPasswordLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '15 m'),
  prefix: 'rl:forgot-pw',
  analytics: true,
})

// Login: 5 tentativas / 5 min por IP (protege contra brute force)
export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '5 m'),
  prefix: 'rl:login',
  analytics: true,
})

// Signup: 3 cadastros / 1h por IP (protege contra criação em massa)
export const signupLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl:signup',
  analytics: true,
})

// AI: 5 requisições / 1 min por user (previne burst; complementa quota diária)
export const aiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'rl:ai',
  analytics: true,
})

// Helper: checa AI rate limit e retorna 429 se exceder; null se OK
export async function enforceAiRateLimit(userId: string): Promise<NextResponse | null> {
  const { success, reset } = await aiLimiter.limit(`user:${userId}`)
  if (success) return null
  const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
  return NextResponse.json(
    { error: `Muitas requisições em pouco tempo. Tente novamente em ${retryAfterSec}s.` },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
  )
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? '127.0.0.1'
}
