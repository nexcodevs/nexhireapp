'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ChipsInput from '@/components/ui/ChipsInput'
import CVUpload from '@/components/submissions/CVUpload'

interface LanguageProf {
  language: string
  level: string
}

interface ProfileState {
  full_name: string
  email: string
  phone: string
  linkedin_url: string
  current_title: string
  location: string
  years_experience: number | null
  skills: string[]
  language_proficiency: LanguageProf[]
  certifications: string[]
  cv_url: string | null
}

interface CandidateProfileFormProps {
  initial: ProfileState
}

const LEVELS: LanguageProf['level'][] = ['básico', 'intermediário', 'fluente', 'nativo']

function completeness(p: ProfileState): number {
  const checks = [
    !!p.full_name.trim(),
    !!p.current_title.trim(),
    !!p.location.trim(),
    !!p.linkedin_url.trim(),
    !!p.cv_url,
    typeof p.years_experience === 'number',
    p.skills.length >= 3,
    p.language_proficiency.length >= 1,
  ]
  const done = checks.filter(Boolean).length
  return Math.round((done / checks.length) * 100)
}

export default function CandidateProfileForm({ initial }: CandidateProfileFormProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileState>(initial)
  const [enriching, setEnriching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const pct = completeness(profile)

  function update<K extends keyof ProfileState>(key: K, val: ProfileState[K]) {
    setProfile(prev => ({ ...prev, [key]: val }))
  }

  async function handleCvUploaded(storagePath: string) {
    update('cv_url', storagePath)
    setEnriching(true)
    setError('')
    try {
      const res = await fetch('/api/candidate/enrich-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(data.error || 'Não foi possível extrair dados do CV.')
        return
      }
      const { extraction } = (await res.json()) as {
        extraction: {
          current_title: string | null
          location: string | null
          linkedin_url: string | null
          years_experience: number | null
          skills: string[]
          language_proficiency: LanguageProf[]
          certifications: string[]
          summary: string
        }
      }
      // Merge inteligente: só substitui campos vazios; preserva edições do usuário
      setProfile(prev => ({
        ...prev,
        current_title: prev.current_title || extraction.current_title || '',
        location: prev.location || extraction.location || '',
        linkedin_url: prev.linkedin_url || extraction.linkedin_url || '',
        years_experience:
          prev.years_experience ?? extraction.years_experience ?? null,
        skills: prev.skills.length > 0 ? prev.skills : extraction.skills ?? [],
        language_proficiency:
          prev.language_proficiency.length > 0
            ? prev.language_proficiency
            : extraction.language_proficiency ?? [],
        certifications:
          prev.certifications.length > 0
            ? prev.certifications
            : extraction.certifications ?? [],
      }))
      toast.success('IA preencheu os dados. Revise abaixo antes de salvar.')
    } catch (err) {
      console.warn('[enrich]', err)
      toast.error('Falha de rede ao extrair dados.')
    } finally {
      setEnriching(false)
    }
  }

  async function handleSave() {
    if (!profile.full_name.trim()) {
      setError('Nome completo é obrigatório.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/candidate/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(data.error || 'Não foi possível salvar o perfil.')
        setError(data.error || 'Falha ao salvar.')
        return
      }
      toast.success('Perfil salvo.')
      router.refresh()
    } catch (err) {
      console.warn('[save-profile]', err)
      toast.error('Falha de rede.')
    } finally {
      setSaving(false)
    }
  }

  function addLanguage() {
    update('language_proficiency', [
      ...profile.language_proficiency,
      { language: '', level: 'intermediário' },
    ])
  }

  function updateLanguage(i: number, patch: Partial<LanguageProf>) {
    update(
      'language_proficiency',
      profile.language_proficiency.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
    )
  }

  function removeLanguage(i: number) {
    update(
      'language_proficiency',
      profile.language_proficiency.filter((_, idx) => idx !== i),
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Indicador de completude */}
      <Card padding="md" style={{ background: 'var(--bg-elev-1)' }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>
              Perfil {pct}% completo
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
              {pct >= 75
                ? 'Quase lá — perfis completos têm muito mais matches.'
                : pct >= 40
                  ? 'Bom começo. Suba um CV pra IA acelerar o preenchimento.'
                  : 'Comece subindo um CV — a IA preenche tudo pra você.'}
            </div>
          </div>
          <div
            style={{
              width: '120px',
              height: '6px',
              background: 'var(--bg-elev-2)',
              borderRadius: '4px',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: 'var(--accent-text)',
                transition: 'width .2s var(--ease)',
              }}
            />
          </div>
        </div>
      </Card>

      {/* CV upload */}
      <Card padding="lg">
        <h2
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-4)',
            marginBottom: '12px',
          }}
        >
          Currículo
        </h2>
        <CVUpload
          value={profile.cv_url}
          onUploaded={handleCvUploaded}
          onRemoved={() => update('cv_url', null)}
          endpoint="/api/candidate/upload-cv"
          label="Upload do CV (PDF)"
        />
        {enriching && (
          <p style={{ fontSize: '12.5px', color: 'var(--accent-text)', marginTop: '10px' }}>
            Extraindo dados do CV com IA…
          </p>
        )}
      </Card>

      {/* Dados básicos */}
      <Card padding="lg">
        <h2
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-4)',
            marginBottom: '14px',
          }}
        >
          Dados básicos
        </h2>
        <div className="flex flex-col gap-4">
          <Input
            label="Nome completo"
            value={profile.full_name}
            onChange={e => update('full_name', e.target.value)}
            required
          />
          <Input
            label="Email"
            value={profile.email}
            disabled
            hint="Não é editável aqui. Pra trocar, use as configurações da conta."
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Cargo atual"
              placeholder="Ex: Desenvolvedor Backend Sênior"
              value={profile.current_title}
              onChange={e => update('current_title', e.target.value)}
            />
            <Input
              label="Localização"
              placeholder="Ex: São Paulo / SP"
              value={profile.location}
              onChange={e => update('location', e.target.value)}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="LinkedIn"
              type="url"
              placeholder="https://linkedin.com/in/seu-perfil"
              value={profile.linkedin_url}
              onChange={e => update('linkedin_url', e.target.value)}
            />
            <Input
              label="Telefone"
              type="tel"
              placeholder="(11) 90000-0000"
              value={profile.phone}
              onChange={e => update('phone', e.target.value)}
            />
          </div>
          <Input
            label="Anos de experiência"
            type="number"
            min={0}
            max={60}
            value={profile.years_experience ?? ''}
            onChange={e => {
              const v = e.target.value
              update('years_experience', v === '' ? null : parseInt(v, 10))
            }}
          />
        </div>
      </Card>

      {/* Skills */}
      <Card padding="lg">
        <ChipsInput
          label="Skills técnicas"
          hint="Digite e pressione Enter. Ex: React, Postgres, AWS, Liderança de squad."
          value={profile.skills}
          onChange={v => update('skills', v)}
          tone="accent"
          max={30}
        />
      </Card>

      {/* Idiomas */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-3">
          <h2
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
            }}
          >
            Idiomas
          </h2>
          <button
            type="button"
            onClick={addLanguage}
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--accent-text)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            className="hover:underline"
          >
            + Adicionar idioma
          </button>
        </div>
        {profile.language_proficiency.length === 0 ? (
          <p style={{ fontSize: '12.5px', color: 'var(--text-4)' }}>
            Nenhum idioma adicionado.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {profile.language_proficiency.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                <input
                  type="text"
                  placeholder="Idioma (ex: Inglês)"
                  value={l.language}
                  onChange={e => updateLanguage(i, { language: e.target.value })}
                  style={{
                    padding: '8px 10px',
                    fontSize: '13px',
                    background: 'var(--bg-elev-1)',
                    border: '1px solid var(--border-1)',
                    borderRadius: 'var(--r-md)',
                    color: 'var(--text-1)',
                    outline: 'none',
                  }}
                />
                <select
                  value={l.level}
                  onChange={e => updateLanguage(i, { level: e.target.value })}
                  style={{
                    padding: '8px 10px',
                    fontSize: '13px',
                    background: 'var(--bg-elev-1)',
                    border: '1px solid var(--border-1)',
                    borderRadius: 'var(--r-md)',
                    color: 'var(--text-1)',
                  }}
                >
                  {LEVELS.map(lv => (
                    <option key={lv} value={lv}>
                      {lv}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeLanguage(i)}
                  aria-label="Remover idioma"
                  style={{
                    color: 'var(--text-4)',
                    background: 'transparent',
                    border: 'none',
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Certificações */}
      <Card padding="lg">
        <ChipsInput
          label="Certificações (opcional)"
          hint="Ex: AWS Solutions Architect, Scrum Master PSM I."
          value={profile.certifications}
          onChange={v => update('certifications', v)}
          tone="neutral"
          max={15}
        />
      </Card>

      {error && (
        <p
          role="alert"
          style={{
            fontSize: '13px',
            color: 'var(--danger-text)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            padding: '10px 14px',
            borderRadius: 'var(--r-md)',
          }}
        >
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg">
          Salvar perfil
        </Button>
      </div>
    </div>
  )
}
