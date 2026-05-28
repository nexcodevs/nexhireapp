'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

interface SubmitCandidateFormProps {
  jobId: string
  recruiterId: string
  remainingSlots: number
}

export default function SubmitCandidateForm({
  jobId,
  recruiterId,
  remainingSlots,
}: SubmitCandidateFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [candidate, setCandidate] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    current_title: '',
    location: '',
  })

  const [submission, setSubmission] = useState({
    interview_summary: '',
    recruiter_notes: '',
  })

  function handleCandidateChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setCandidate(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmissionChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setSubmission(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Dispara email para HR. Falha de email NÃO bloqueia o fluxo.
  async function notifyHR(submissionId: string) {
    try {
      await fetch('/api/notifications/new-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      })
    } catch (err) {
      console.warn('Falha ao notificar HR (não bloqueante):', err)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    // Verificar duplicidade por email
    if (candidate.email) {
      const { data: existing } = await supabase
        .from('candidates')
        .select('id')
        .eq('email', candidate.email)
        .single()

      if (existing) {
        // Verificar se já foi enviado para esta vaga
        const { data: dupSubmission } = await supabase
          .from('submissions')
          .select('id')
          .eq('job_id', jobId)
          .eq('candidate_id', existing.id)
          .single()

        if (dupSubmission) {
          setError('Este candidato já foi enviado para esta vaga.')
          setLoading(false)
          return
        }

        // Criar submissão com candidato existente
        const ownership = new Date()
        ownership.setDate(ownership.getDate() + 60)

        const { data: newSub, error: subError } = await supabase
          .from('submissions')
          .insert({
            job_id: jobId,
            candidate_id: existing.id,
            recruiter_id: recruiterId,
            interview_summary: submission.interview_summary,
            recruiter_notes: submission.recruiter_notes,
            ownership_expires_at: ownership.toISOString(),
          })
          .select()
          .single()

        if (subError) {
          setError('Erro ao enviar candidato. Tente novamente.')
          setLoading(false)
          return
        }

        if (newSub?.id) await notifyHR(newSub.id)

        setSuccess(true)
        router.refresh()
        return
      }
    }

    // Criar novo candidato
    const { data: newCandidate, error: candError } = await supabase
      .from('candidates')
      .insert({
        full_name: candidate.full_name,
        email: candidate.email || null,
        phone: candidate.phone || null,
        linkedin_url: candidate.linkedin_url || null,
        current_title: candidate.current_title || null,
        location: candidate.location || null,
      })
      .select()
      .single()

    if (candError || !newCandidate) {
      setError('Erro ao cadastrar candidato.')
      setLoading(false)
      return
    }

    // Criar submissão
    const ownership = new Date()
    ownership.setDate(ownership.getDate() + 60)

    const { data: newSub, error: subError } = await supabase
      .from('submissions')
      .insert({
        job_id: jobId,
        candidate_id: newCandidate.id,
        recruiter_id: recruiterId,
        interview_summary: submission.interview_summary,
        recruiter_notes: submission.recruiter_notes,
        ownership_expires_at: ownership.toISOString(),
      })
      .select()
      .single()

    if (subError) {
      setError('Erro ao enviar candidato.')
      setLoading(false)
      return
    }

    if (newSub?.id) await notifyHR(newSub.id)

    setSuccess(true)
    router.refresh()
  }

  if (success) {
    return (
      <Card padding="md" className="border-[#BBF7D0] bg-[#F0FDF4]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-[#052E16]">Candidato enviado com sucesso</div>
            <div className="text-xs text-[#16A34A] mt-0.5">
              {remainingSlots - 1 > 0
                ? `Você ainda pode enviar ${remainingSlots - 1} candidato${remainingSlots - 1 !== 1 ? 's' : ''}.`
                : 'Você atingiu o limite de candidatos para esta vaga.'
              }
            </div>
          </div>
        </div>
        {remainingSlots - 1 > 0 && (
          <button
            onClick={() => { setSuccess(false); setCandidate({ full_name: '', email: '', phone: '', linkedin_url: '', current_title: '', location: '' }); setSubmission({ interview_summary: '', recruiter_notes: '' }) }}
            className="mt-3 text-sm text-[#16A34A] font-medium hover:underline"
          >
            Enviar outro candidato
          </button>
        )}
      </Card>
    )
  }

  const isLastSlot = remainingSlots === 1

  return (
    <Card padding="md">
      <div className="mb-5">
        <h2 className="text-base font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          Enviar candidato
        </h2>
        <div
          className="flex items-start gap-2.5 mt-3 p-3 rounded-lg"
          style={{
            background: isLastSlot ? '#FFFBEB' : 'var(--color-m100)',
            border: `1px solid ${isLastSlot ? '#FDE68A' : 'var(--color-border-g)'}`,
          }}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke={isLastSlot ? '#D97706' : 'var(--color-g600)'}
            strokeWidth={2}
            style={{ flexShrink: 0, marginTop: '2px' }}
          >
            {isLastSlot ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          <div style={{ minWidth: 0 }}>
            <div
              className="text-sm font-medium"
              style={{ color: isLastSlot ? '#92400E' : 'var(--color-f800)' }}
            >
              {isLastSlot
                ? 'Atenção — este é seu último envio'
                : `Você tem ${remainingSlots} envios restantes nesta vaga`}
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: isLastSlot ? '#B45309' : 'var(--color-muted)', lineHeight: 1.5 }}
            >
              {isLastSlot
                ? 'Cada hunter pode enviar no máximo 3 candidatos por vaga. Use este envio com cuidado: candidatos reprovados também contam para o limite.'
                : 'Cada hunter pode enviar no máximo 3 candidatos por vaga. Priorize qualidade sobre quantidade — candidatos reprovados não dão direito a novo envio.'}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Dados do candidato */}
        <div className="flex flex-col gap-3">
          <Input
            label="Nome completo"
            name="full_name"
            value={candidate.full_name}
            onChange={handleCandidateChange}
            placeholder="Nome do candidato"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              name="email"
              type="email"
              value={candidate.email}
              onChange={handleCandidateChange}
              placeholder="email@exemplo.com"
            />
            <Input
              label="Telefone"
              name="phone"
              value={candidate.phone}
              onChange={handleCandidateChange}
              placeholder="+55 11 99999-9999"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cargo atual"
              name="current_title"
              value={candidate.current_title}
              onChange={handleCandidateChange}
              placeholder="Ex: Engenheiro Sênior"
            />
            <Input
              label="Localização"
              name="location"
              value={candidate.location}
              onChange={handleCandidateChange}
              placeholder="Ex: São Paulo, SP"
            />
          </div>
          <Input
            label="LinkedIn"
            name="linkedin_url"
            value={candidate.linkedin_url}
            onChange={handleCandidateChange}
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        {/* Resumo da entrevista */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#374151]">
            Resumo da entrevista <span className="text-[#16A34A]">*</span>
          </label>
          <textarea
            name="interview_summary"
            value={submission.interview_summary}
            onChange={handleSubmissionChange}
            required
            rows={4}
            placeholder="Descreva como foi a conversa com o candidato, pontos fortes, experiências relevantes e por que ele é adequado para esta vaga..."
            className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#052E16] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#16A34A] resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#374151]">
            Notas internas (opcional)
          </label>
          <textarea
            name="recruiter_notes"
            value={submission.recruiter_notes}
            onChange={handleSubmissionChange}
            rows={2}
            placeholder="Observações privadas sobre o candidato..."
            className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#052E16] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#16A34A] resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading}>
          Enviar candidato
        </Button>
      </form>
    </Card>
  )
}