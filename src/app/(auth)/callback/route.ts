import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = userData?.role || 'candidate'
        const redirectMap: Record<string, string> = {
          admin: '/hr',
          hr_manager: '/hr',
          company_user: '/empresa',
          recruiter: '/hunter',
          candidate: '/candidato',
        }

        return NextResponse.redirect(
          new URL(redirectMap[role] || '/candidato', origin)
        )
      }
    }
  }

  return NextResponse.redirect(new URL('/login?error=callback', origin))
}