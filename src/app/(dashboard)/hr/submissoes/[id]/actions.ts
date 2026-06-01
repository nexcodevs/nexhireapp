'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function revisarSubmissao(formData: FormData) {
  const submissionId = formData.get('submission_id') as string
  const action = formData.get('action') as 'approve' | 'reject'
  const hrNotes = (formData.get('hr_notes') as string) || null

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'hr_manager' && profile?.role !== 'admin') {
    throw new Error('Sem permissão')
  }

  const novoStatus = action === 'approve' ? 'hr_approved' : 'hr_rejected'

  const { error } = await admin
    .from('submissions')
    .update({
      status: novoStatus,
      hr_notes: hrNotes,
      hr_reviewed_at: new Date().toISOString(),
      hr_reviewed_by: user.id,
    })
    .eq('id', submissionId)

  if (error) {
    console.error('Erro ao atualizar submissão:', error)
    throw new Error('Erro ao salvar decisão')
  }

  revalidatePath('/hr/submissoes')
  revalidatePath(`/hr/submissoes/${submissionId}`)
  redirect('/hr/submissoes')
}