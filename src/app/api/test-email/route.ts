import { NextResponse } from 'next/server'
import { notificarNovaSubmissao } from '@/lib/email/templates/novaSubmissao'

export async function GET() {
  const result = await notificarNovaSubmissao({
    hrEmail: process.env.EMAIL_REPLY_TO || 'daniel@devgo.digital',
    hrName: 'Daniel',
    candidateName: 'Pedro Henrique',
    jobTitle: 'Engenheiro de Software',
    companyName: 'Nexco',
    hunterName: 'Mariana Silva',
    submissionId: '35be0f2f-cdcf-4184-b950-eb8a0d8dcd9b',
    appUrl: 'http://localhost:3000',
  })

  return NextResponse.json(result)
}