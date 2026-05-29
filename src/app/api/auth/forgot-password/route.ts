import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { forgotPasswordLimiter, getClientIp } from '@/lib/ratelimit'
import { logAudit } from '@/lib/audit'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown; redirectTo?: unknown }
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
    const redirectTo = typeof body.redirectTo === 'string' ? body.redirectTo : undefined

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const ip = getClientIp(request)

    const [ipLimit, emailLimit] = await Promise.all([
      forgotPasswordLimiter.limit(`ip:${ip}`),
      forgotPasswordLimiter.limit(`email:${email}`),
    ])

    if (!ipLimit.success || !emailLimit.success) {
      const reset = Math.min(ipLimit.reset, emailLimit.reset)
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        {
          status: 429,
          headers: { 'Retry-After': retryAfter.toString() },
        },
      )
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) {
      console.error('[forgot-password] supabase error:', error.message)
    }

    await logAudit({
      actorId: null,
      actorRole: null,
      action: 'auth.password_reset_requested',
      targetType: 'user',
      payload: { email },
      ip,
      userAgent: request.headers.get('user-agent'),
    })

    // Anti-enumeração: sempre retornar sucesso, independente do email existir
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[forgot-password] exception:', err)
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
