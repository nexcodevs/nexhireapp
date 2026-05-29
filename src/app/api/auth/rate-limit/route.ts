import { NextResponse } from 'next/server'
import { loginLimiter, signupLimiter, getClientIp } from '@/lib/ratelimit'

/**
 * Camada de rate limit pra login/signup. O cliente chama ANTES de
 * `supabase.auth.signInWithPassword` / `signUp` — se retornar 429, aborta.
 *
 * Nota: usuário malicioso pode pular esse check (e o Supabase Auth aceita).
 * Cobertura completa exige configurar limites nativos no painel do Supabase
 * (Authentication → Rate Limits) — esta camada mitiga abuso casual.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { kind?: 'login' | 'signup'; email?: string }
    const kind = body.kind
    if (kind !== 'login' && kind !== 'signup') {
      return NextResponse.json({ error: 'kind inválido' }, { status: 400 })
    }

    const ip = getClientIp(request)
    const limiter = kind === 'login' ? loginLimiter : signupLimiter

    const ipResult = await limiter.limit(`ip:${ip}`)
    if (!ipResult.success) {
      return NextResponse.json(
        {
          error:
            kind === 'login'
              ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
              : 'Muitos cadastros desse IP. Tente novamente daqui a 1 hora.',
        },
        { status: 429 },
      )
    }

    // Pra signup, também rate-limita por email pra evitar reuso do mesmo
    // endereço em ataques distribuídos.
    if (kind === 'signup' && body.email) {
      const email = body.email.trim().toLowerCase()
      if (email.length > 0) {
        const emailResult = await limiter.limit(`email:${email}`)
        if (!emailResult.success) {
          return NextResponse.json(
            { error: 'Muitas tentativas pra esse email. Tente novamente em alguns minutos.' },
            { status: 429 },
          )
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[auth-rate-limit]', error)
    // Fail open: se Redis tá fora, prefere deixar passar a quebrar auth
    return NextResponse.json({ ok: true })
  }
}
