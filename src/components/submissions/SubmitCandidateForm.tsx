'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Card from '@/components/ui/Card'
import FormError from '@/components/ui/FormError'
import CVUpload from '@/components/submissions/CVUpload'
import VoiceRecorder from '@/components/submissions/VoiceRecorder'

interface DuplicateMatch {
  candidate_id: string
  full_name: string | null
  email: string | null
  matched_on: ('email' | 'phone' | 'linkedin')[]
  latest_submission: {
    job_id: string
    job_title: string | null
    recruiter_name: string | null
    status: string
    submitted_at: string
    ownership_active: boolean
    ownership_expires_at: string | null
    same_job: boolean
  } | null
}

interface SubmitCandidateFormProps {
  jobId: string
  recruiterId?: string
  remainingSlots: number
}

const INTERVIEW_PLACEHOLDER = `Experiência relevante para a vaga:
-

Skills validadas na conversa:
-

Motivação do candidato pela posição:
-

Pretensão salarial e disponibilidade:
-

Pontos a validar / riscos:
- `

const JD_PRIORITIES_PLACEHOLDER = `1.
2.
3. `

export default function SubmitCandidateForm({
  jobId,
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
    jd_priorities: '',
    hunter_score_rationale: '',
  })

  const [hunterScore, setHunterScore] = useState<number | null>(null)
  const [cvPath, setCvPath] = useState<string | null>(null)

  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([])
  const [checkingDup, setCheckingDup] = useState(false)
  const dupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Pré-fill IA: estado da chamada + flag por campo (true = sugestão IA pendente de revisão)
  const [prefilling, setPrefilling] = useState(false)
  const [prefillError, setPrefillError] = useState('')
  const [aiHints, setAiHints] = useState<{
    jd_priorities?: boolean
    hunter_score?: boolean
    hunter_score_rationale?: boolean
  }>({})
  const [interviewOutline, setInterviewOutline] = useState('')

  // Estrutura extraída do CV (skills, idiomas, certs, anos exp) pra persistir em candidates
  const [extractedProfile, setExtractedProfile] = useState<{
    skills: string[]
    languages: { code: string; name: string; level: string }[]
    certifications: string[]
    years_experience: number | null
  } | null>(null)

  async function requestPrefill(path: string) {
    setPrefilling(true)
    setPrefillError('')
    try {
      const res = await fetch('/api/ai/prefill-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, cvPath: path }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setPrefillError(data.error || 'IA não conseguiu analisar este CV — preencha manualmente.')
        return
      }
      const data = (await res.json()) as {
        suggestion: {
          profile?: {
            full_name?: string
            email?: string
            phone?: string
            linkedin_url?: string
            current_title?: string
            location?: string
            skills?: string[]
            languages?: { code: string; name: string; level: string }[]
            certifications?: string[]
            years_experience?: number | null
          }
          jd_priorities: string
          hunter_score: number
          hunter_score_rationale: string
          interview_outline: string
        }
      }

      // Auto-preenche TODOS os campos pessoais (Daniel: "todos os campos poderiam ser preenchidos")
      const p = data.suggestion.profile
      if (p) {
        setCandidate(prev => ({
          full_name: p.full_name?.trim() || prev.full_name,
          email: p.email?.trim() || prev.email,
          phone: p.phone?.trim() || prev.phone,
          linkedin_url: p.linkedin_url?.trim() || prev.linkedin_url,
          current_title: p.current_title?.trim() || prev.current_title,
          location: p.location?.trim() || prev.location,
        }))
        setExtractedProfile({
          skills: p.skills ?? [],
          languages: p.languages ?? [],
          certifications: p.certifications ?? [],
          years_experience: p.years_experience ?? null,
        })
      }

      setSubmission(prev => ({
        ...prev,
        jd_priorities: data.suggestion.jd_priorities || prev.jd_priorities,
        hunter_score_rationale: data.suggestion.hunter_score_rationale || prev.hunter_score_rationale,
      }))
      if (typeof data.suggestion.hunter_score === 'number') {
        setHunterScore(data.suggestion.hunter_score)
      }
      setInterviewOutline(data.suggestion.interview_outline || '')
      setAiHints({
        jd_priorities: !!data.suggestion.jd_priorities,
        hunter_score: typeof data.suggestion.hunter_score === 'number',
        hunter_score_rationale: !!data.suggestion.hunter_score_rationale,
      })
    } catch (err) {
      console.warn('[prefill] erro:', err)
      setPrefillError('Falha ao chamar a IA. Preencha manualmente.')
    } finally {
      setPrefilling(false)
    }
  }

  function handleCvUploaded(path: string) {
    setCvPath(path)
    requestPrefill(path)
  }

  function dismissHint(field: keyof typeof aiHints) {
    setAiHints(prev => ({ ...prev, [field]: false }))
  }

  function handleCandidateChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setCandidate(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Dispara checagem de duplicidade ao mudar email/phone/linkedin (com debounce)
  useEffect(() => {
    const email = candidate.email.trim()
    const phone = candidate.phone.trim()
    const linkedin = candidate.linkedin_url.trim()

    if (dupTimer.current) clearTimeout(dupTimer.current)
    dupTimer.current = setTimeout(async () => {
      if (!email && !phone && !linkedin) {
        setDuplicateMatches([])
        setCheckingDup(false)
        return
      }
      setCheckingDup(true)
      try {
        const res = await fetch('/api/candidates/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            phone,
            linkedin_url: linkedin,
            job_id: jobId,
          }),
        })
        if (res.ok) {
          const data = (await res.json()) as { matches: DuplicateMatch[] }
          setDuplicateMatches(data.matches ?? [])
        }
      } catch (err) {
        console.warn('[check-duplicate]', err)
      } finally {
        setCheckingDup(false)
      }
    }, 500)

    return () => {
      if (dupTimer.current) clearTimeout(dupTimer.current)
    }
  }, [candidate.email, candidate.phone, candidate.linkedin_url, jobId])

  function handleSubmissionChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const { name, value } = e.target
    setSubmission(prev => ({ ...prev, [name]: value }))
    if (name === 'jd_priorities' && aiHints.jd_priorities) dismissHint('jd_priorities')
    if (name === 'hunter_score_rationale' && aiHints.hunter_score_rationale)
      dismissHint('hunter_score_rationale')
  }

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

  function validate(): string | null {
    if (!cvPath) return 'Anexe o currículo em PDF antes de enviar.'
    if (submission.jd_priorities.trim().length < 20)
      return 'Liste os 3 pontos da vaga que você priorizou na conversa.'
    if (hunterScore === null) return 'Selecione seu score de fit (1-10) para este candidato.'
    if (submission.hunter_score_rationale.trim().length < 20)
      return 'Justifique seu score em ao menos 1 frase.'
    if (submission.interview_summary.trim().length < 30)
      return 'O resumo da entrevista precisa de mais detalhes.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    const res = await fetch('/api/hunter/submit-candidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        cvPath,
        candidate: {
          full_name: candidate.full_name,
          email: candidate.email || undefined,
          phone: candidate.phone || undefined,
          linkedin_url: candidate.linkedin_url || undefined,
          current_title: candidate.current_title || undefined,
          location: candidate.location || undefined,
        },
        submission: {
          interview_summary: submission.interview_summary,
          jd_priorities: submission.jd_priorities,
          hunter_score: hunterScore,
          hunter_score_rationale: submission.hunter_score_rationale,
        },
        extractedProfile,
      }),
    })

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      console.error('[submit-candidate]', data?.error)
      setError(data?.error || 'Não foi possível enviar o candidato.')
      setLoading(false)
      return
    }

    const { submissionId } = (await res.json()) as { submissionId: string }
    await notifyHR(submissionId)

    setSuccess(true)
    router.refresh()
  }

  if (success) {
    return (
      <Card padding="md" role="status" style={{ background: 'var(--color-m100)', borderColor: 'var(--color-border-g)' }}>
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--color-g600)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-on-dark)" strokeWidth={3} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
              Candidato enviado.
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--color-text2)', marginTop: '2px' }}>
              {remainingSlots - 1 > 0
                ? `Você ainda pode enviar ${remainingSlots - 1} candidato${remainingSlots - 1 !== 1 ? 's' : ''} nesta vaga.`
                : 'Você atingiu o limite de 3 candidatos para esta vaga.'}
            </div>
          </div>
        </div>
        {remainingSlots - 1 > 0 && (
          <button
            type="button"
            onClick={() => {
              setSuccess(false)
              setCandidate({ full_name: '', email: '', phone: '', linkedin_url: '', current_title: '', location: '' })
              setSubmission({ interview_summary: '', jd_priorities: '', hunter_score_rationale: '' })
              setHunterScore(null)
              setCvPath(null)
            }}
            style={{
              marginTop: '12px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-g600)',
              cursor: 'pointer',
            }}
            className="hover:underline"
          >
            Enviar outro candidato →
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
            background: isLastSlot ? 'var(--warning-bg)' : 'var(--color-m100)',
            border: `1px solid ${isLastSlot ? 'var(--warning-border)' : 'var(--color-border-g)'}`,
          }}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke={isLastSlot ? 'var(--warning-text)' : 'var(--color-g600)'}
            strokeWidth={2}
            style={{ flexShrink: 0, marginTop: '2px' }}
            aria-hidden="true"
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
              style={{ color: isLastSlot ? 'var(--warning-text)' : 'var(--color-f800)' }}
            >
              {isLastSlot
                ? 'Atenção — este é seu último envio'
                : `Você tem ${remainingSlots} envios restantes nesta vaga`}
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: isLastSlot ? 'var(--warning-text)' : 'var(--color-muted)', lineHeight: 1.5 }}
            >
              {isLastSlot
                ? 'Cada hunter pode enviar no máximo 3 candidatos por vaga. Candidatos reprovados também contam.'
                : 'Cada hunter pode enviar no máximo 3 candidatos por vaga. Priorize qualidade — reprovados não dão direito a novo envio.'}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <FieldGroup title="Dados do candidato">
          <Input
            label="Nome completo"
            name="full_name"
            value={candidate.full_name}
            onChange={handleCandidateChange}
            placeholder="Ex: Pedro Henrique"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              name="email"
              type="email"
              value={candidate.email}
              onChange={handleCandidateChange}
              placeholder="voce@empresa.com"
            />
            <Input
              label="Telefone"
              name="phone"
              value={candidate.phone}
              onChange={handleCandidateChange}
              placeholder="(11) 99999-9999"
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
              placeholder="São Paulo, SP"
            />
          </div>
          <Input
            label="LinkedIn"
            name="linkedin_url"
            value={candidate.linkedin_url}
            onChange={handleCandidateChange}
            placeholder="linkedin.com/in/seu-perfil"
          />
          <CVUpload
            value={cvPath}
            onUploaded={handleCvUploaded}
            onRemoved={() => setCvPath(null)}
            disabled={loading || prefilling}
            required
          />
          {checkingDup && duplicateMatches.length === 0 && (
            <div
              className="mono"
              style={{
                fontSize: '11px',
                color: 'var(--text-4)',
                letterSpacing: '0.04em',
              }}
            >
              Verificando duplicidade…
            </div>
          )}
          {duplicateMatches.length > 0 && (
            <DuplicateWarning matches={duplicateMatches} />
          )}
          {prefilling && <AIHintBanner mode="loading" />}
          {prefillError && !prefilling && (
            <AIHintBanner mode="error" message={prefillError} />
          )}
          {extractedProfile && !prefilling && (
            <ExtractedProfilePreview profile={extractedProfile} />
          )}
        </FieldGroup>

        <FieldGroup
          title="Validações do envio"
          description="Garantem que você de fato entrevistou o candidato e conhece a vaga."
        >
          {aiHints.jd_priorities && (
            <AIHintBanner mode="suggested" onDismiss={() => dismissHint('jd_priorities')} />
          )}
          <Textarea
            label="3 pontos da vaga que você priorizou na entrevista"
            name="jd_priorities"
            value={submission.jd_priorities}
            onChange={handleSubmissionChange}
            placeholder={JD_PRIORITIES_PLACEHOLDER}
            required
            rows={5}
            hint="Liste os 3 pontos da descrição da vaga que você abordou diretamente."
          />

          {aiHints.hunter_score && (
            <AIHintBanner mode="suggested" onDismiss={() => dismissHint('hunter_score')} />
          )}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="hunter-score"
              style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text2)' }}
            >
              Seu score de fit (1 = baixo, 10 = excelente)
              <span aria-hidden="true" style={{ color: 'var(--danger-text)', marginLeft: '4px' }}>
                *
              </span>
            </label>
            <div
              id="hunter-score"
              role="radiogroup"
              aria-label="Score de fit do candidato"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
                gap: '6px',
              }}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
                const selected = hunterScore === n
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setHunterScore(n)
                      if (aiHints.hunter_score) dismissHint('hunter_score')
                    }}
                    className="hunter-score-pill"
                    style={{
                      height: '38px',
                      borderRadius: '10px',
                      border: `1px solid ${selected ? 'var(--color-f900)' : 'var(--color-border)'}`,
                      background: selected ? 'var(--color-f900)' : 'var(--color-surf)',
                      color: selected ? 'var(--color-neon)' : 'var(--color-text2)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          </div>

          {aiHints.hunter_score_rationale && (
            <AIHintBanner mode="suggested" onDismiss={() => dismissHint('hunter_score_rationale')} />
          )}
          <Textarea
            label="Por que esse score?"
            name="hunter_score_rationale"
            value={submission.hunter_score_rationale}
            onChange={handleSubmissionChange}
            placeholder="Ex: senioridade compatível, gaps de conhecimento em X que podem ser tratados no onboarding..."
            required
            rows={3}
            hint="Em 1-2 frases. Aparece pro HR como sua avaliação inicial."
          />
        </FieldGroup>

        <FieldGroup title="Conversa com o candidato">
          {interviewOutline && <InterviewOutlineCard outline={interviewOutline} />}
          <VoiceRecorder
            disabled={loading}
            onTranscribed={text => {
              setSubmission(prev => ({
                ...prev,
                interview_summary: prev.interview_summary
                  ? `${prev.interview_summary}\n\n${text}`
                  : text,
              }))
            }}
          />
          <Textarea
            label="Resumo da entrevista"
            name="interview_summary"
            value={submission.interview_summary}
            onChange={handleSubmissionChange}
            placeholder={INTERVIEW_PLACEHOLDER}
            required
            rows={10}
            hint="Use o placeholder como guia. Grave voice memo acima (até 5min) e a IA transcreve pra você."
          />
        </FieldGroup>

        {error && <FormError>{error}</FormError>}

        <Button type="submit" loading={loading}>
          Enviar candidato
        </Button>
      </form>
    </Card>
  )
}

interface FieldGroupProps {
  title: string
  description?: string
  children: React.ReactNode
}

function FieldGroup({ title, description, children }: FieldGroupProps) {
  return (
    <fieldset
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: 'none',
        padding: 0,
        margin: 0,
      }}
    >
      <legend
        style={{
          fontSize: '10.5px',
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-subtle)',
          marginBottom: '2px',
          padding: 0,
        }}
      >
        {title}
      </legend>
      {description && (
        <p
          style={{
            fontSize: '12px',
            color: 'var(--color-muted)',
            marginTop: '-6px',
            marginBottom: '4px',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {children}
    </fieldset>
  )
}

function DuplicateWarning({ matches }: { matches: DuplicateMatch[] }) {
  const matchLabel: Record<DuplicateMatch['matched_on'][number], string> = {
    email: 'mesmo email',
    phone: 'mesmo telefone',
    linkedin: 'mesmo LinkedIn',
  }

  const sameJob = matches.find(m => m.latest_submission?.same_job)
  const ownershipActive = matches.find(
    m => m.latest_submission?.ownership_active && !m.latest_submission.same_job,
  )

  const tone: 'block' | 'warn' = sameJob ? 'block' : 'warn'
  const palette =
    tone === 'block'
      ? { bg: 'var(--danger-bg)', border: 'var(--danger-border)', color: 'var(--danger-text)' }
      : { bg: 'var(--warning-bg)', border: 'var(--warning-border)', color: 'var(--warning-text)' }

  const headline = sameJob
    ? 'Este candidato já foi enviado pra essa vaga'
    : ownershipActive
      ? 'Outro hunter tem ownership ativo desse candidato'
      : 'Candidato já existe na base'

  return (
    <div
      role="alert"
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 'var(--r-md)',
        padding: '12px 14px',
        color: palette.color,
        fontSize: '12.5px',
        lineHeight: 1.55,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '6px' }}>{headline}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {matches.slice(0, 3).map(m => {
          const sub = m.latest_submission
          const ownsExpires = sub?.ownership_expires_at
            ? new Date(sub.ownership_expires_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            : null
          return (
            <div key={m.candidate_id}>
              <div style={{ fontWeight: 500 }}>
                {m.full_name || 'Candidato sem nome'}
                <span style={{ opacity: 0.7, fontWeight: 400 }}>
                  {' '}
                  · match por {m.matched_on.map(k => matchLabel[k]).join(' + ')}
                </span>
              </div>
              {sub && (
                <div style={{ opacity: 0.85, marginTop: '2px' }}>
                  Último envio:{' '}
                  {sub.same_job ? (
                    <strong>esta mesma vaga</strong>
                  ) : (
                    <>vaga {sub.job_title || '(removida)'}</>
                  )}
                  {sub.recruiter_name && ` · por ${sub.recruiter_name}`}
                  {sub.ownership_active && ownsExpires && (
                    <> · ownership até {ownsExpires}</>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {tone === 'block' ? (
        <div style={{ marginTop: '8px', fontWeight: 500 }}>
          Você não pode reenviar o mesmo candidato nessa vaga.
        </div>
      ) : (
        <div style={{ marginTop: '8px', opacity: 0.85 }}>
          {ownershipActive
            ? 'Você pode enviar mesmo assim — o HR decide se há conflito de ownership.'
            : 'Confirme se é a mesma pessoa antes de prosseguir.'}
        </div>
      )}
    </div>
  )
}

interface ExtractedProfile {
  skills: string[]
  languages: { code: string; name: string; level: string }[]
  certifications: string[]
  years_experience: number | null
}

function ExtractedProfilePreview({ profile }: { profile: ExtractedProfile }) {
  const hasAny =
    profile.skills.length > 0 ||
    profile.languages.length > 0 ||
    profile.certifications.length > 0 ||
    profile.years_experience !== null

  if (!hasAny) return null

  return (
    <div
      role="status"
      style={{
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '10px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--accent-text)',
          fontWeight: 600,
        }}
      >
        <span aria-hidden>✨</span>
        IA extraiu do CV
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
        {profile.years_experience !== null && (
          <div>
            <span style={{ color: 'var(--text-4)' }}>Experiência:</span>{' '}
            <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>
              {profile.years_experience} ano{profile.years_experience === 1 ? '' : 's'}
            </span>
          </div>
        )}
        {profile.skills.length > 0 && (
          <div>
            <div style={{ color: 'var(--text-4)', marginBottom: '4px' }}>Skills:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {profile.skills.slice(0, 12).map((s, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    background: 'var(--bg-elev-2)',
                    color: 'var(--text-2)',
                    border: '1px solid var(--border-1)',
                    borderRadius: 'var(--r-sm)',
                  }}
                >
                  {s}
                </span>
              ))}
              {profile.skills.length > 12 && (
                <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>
                  +{profile.skills.length - 12}
                </span>
              )}
            </div>
          </div>
        )}
        {profile.languages.length > 0 && (
          <div>
            <span style={{ color: 'var(--text-4)' }}>Idiomas:</span>{' '}
            <span style={{ color: 'var(--text-2)' }}>
              {profile.languages.map(l => `${l.name} (${l.level})`).join(' · ')}
            </span>
          </div>
        )}
        {profile.certifications.length > 0 && (
          <div>
            <span style={{ color: 'var(--text-4)' }}>Certificações:</span>{' '}
            <span style={{ color: 'var(--text-2)' }}>{profile.certifications.join(' · ')}</span>
          </div>
        )}
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '10px', lineHeight: 1.4 }}>
        Dados salvos junto com o candidato — você não precisa redigitar.
      </p>
    </div>
  )
}

function InterviewOutlineCard({ outline }: { outline: string }) {
  const [copied, setCopied] = useState(false)
  const bullets = outline
    .split('\n')
    .map(l => l.replace(/^[\s•·\-*]+/, '').trim())
    .filter(l => l.length > 0)

  async function copy() {
    try {
      await navigator.clipboard.writeText(outline)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.warn('[copy] falhou:', err)
    }
  }

  if (bullets.length === 0) return null

  return (
    <div
      style={{
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
        padding: '14px 16px',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent-text)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          </svg>
          Roteiro IA — pontos a validar na conversa
        </div>
        <button
          type="button"
          onClick={copy}
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--accent-text)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          {copied ? 'copiado' : 'copiar'}
        </button>
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: '16px',
          fontSize: '12.5px',
          color: 'var(--text-2)',
          lineHeight: 1.6,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
  )
}

type AIHintMode = 'loading' | 'error' | 'suggested' | 'tip'

interface AIHintBannerProps {
  mode: AIHintMode
  message?: string
  onDismiss?: () => void
}

function AIHintBanner({ mode, message, onDismiss }: AIHintBannerProps) {
  const palette = (() => {
    switch (mode) {
      case 'loading':
        return { bg: 'var(--accent-bg)', border: 'var(--accent-border)', color: 'var(--accent-text)' }
      case 'error':
        return { bg: 'var(--warning-bg)', border: 'var(--warning-border)', color: 'var(--warning-text)' }
      case 'suggested':
      case 'tip':
      default:
        return { bg: 'var(--accent-bg)', border: 'var(--accent-border)', color: 'var(--accent-text)' }
    }
  })()

  return (
    <div
      role={mode === 'error' ? 'alert' : 'status'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: 'var(--r-md)',
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.color,
        fontSize: '12px',
        fontWeight: 500,
        letterSpacing: '-0.005em',
      }}
    >
      <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center' }}>
        {mode === 'loading' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : mode === 'error' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          </svg>
        )}
      </span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>
        {mode === 'loading' && 'IA analisando o currículo… preenchendo sugestões abaixo'}
        {mode === 'error' && (message || 'IA não conseguiu analisar. Preencha manualmente.')}
        {mode === 'suggested' && (message || 'Sugerido pela IA — revise e ajuste se quiser')}
        {mode === 'tip' && message}
      </span>
      {mode === 'suggested' && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: palette.color,
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
            opacity: 0.7,
          }}
        >
          revisei
        </button>
      )}
    </div>
  )
}
