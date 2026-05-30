import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Deriva origin do request (mais robusto que env var, que pode estar desatualizada).
  // 303 força GET no redirect (correto pra POST → GET de form submission).
  const origin = new URL(request.url).origin
  return NextResponse.redirect(new URL('/login', origin), { status: 303 })
}
