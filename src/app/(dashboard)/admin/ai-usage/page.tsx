import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/ui/PageHeader'
import KPICard from '@/components/ui/KPICard'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export const metadata = {
  title: 'Consumo IA — Admin Nexhire',
}

interface UsageRow {
  id: string
  user_id: string | null
  feature: string
  provider: string
  model: string | null
  input_tokens: number | null
  output_tokens: number | null
  duration_ms: number | null
  cost_usd: number | null
  created_at: string
}

interface UserNameRow {
  id: string
  full_name: string | null
  email: string
}

const featureLabels: Record<string, string> = {
  analyze_candidate: 'Análise de candidato',
  prefill_submission: 'Pré-fill submissão',
  candidate_pitch: 'Pitch do candidato',
  ask_candidate: 'Perguntas sobre candidato',
  compare_candidates: 'Comparação',
  generate_job: 'Geração de vaga',
  evaluate_hunter: 'Avaliação de hunter',
  transcribe: 'Transcrição de áudio',
  search_jobs_embed: 'Busca semântica',
  embeddings_backfill: 'Backfill embeddings',
  insights: 'Insights',
  assistant_chat: 'Assistente conversacional',
}

const providerBadge: Record<string, 'blue' | 'purple' | 'green' | 'gray'> = {
  anthropic: 'purple',
  groq: 'blue',
  voyage: 'green',
}

// Cotação aproximada USD→BRL (atualizar se variar muito)
const USD_TO_BRL = 5.0

function formatBRL(usd: number): string {
  const brl = usd * USD_TO_BRL
  return brl.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: brl < 1 ? 4 : 2,
  })
}

function formatUSD(usd: number): string {
  return `$${usd.toLocaleString('en-US', {
    minimumFractionDigits: usd < 0.01 ? 4 : 2,
    maximumFractionDigits: usd < 0.01 ? 6 : 4,
  })}`
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminAIUsagePage() {
  const supabase = createAdminClient()

  const now = new Date()
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [allEvents, last100, last24hEvents] = await Promise.all([
    supabase
      .from('ai_usage_events')
      .select('id, user_id, feature, provider, model, input_tokens, output_tokens, duration_ms, cost_usd, created_at')
      .gte('created_at', since30d)
      .returns<UsageRow[]>(),
    supabase
      .from('ai_usage_events')
      .select('id, user_id, feature, provider, model, input_tokens, output_tokens, duration_ms, cost_usd, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<UsageRow[]>(),
    supabase
      .from('ai_usage_events')
      .select('id, user_id, feature, provider, model, input_tokens, output_tokens, duration_ms, cost_usd, created_at')
      .gte('created_at', since24h)
      .returns<UsageRow[]>(),
  ])

  const events30d = allEvents.data ?? []
  const events24h = last24hEvents.data ?? []
  const recent = last100.data ?? []

  // Métricas globais 30d
  const total30d = events30d.length
  const cost30d = events30d.reduce((sum, e) => sum + (e.cost_usd ?? 0), 0)
  const inputTokens30d = events30d.reduce((sum, e) => sum + (e.input_tokens ?? 0), 0)
  const outputTokens30d = events30d.reduce((sum, e) => sum + (e.output_tokens ?? 0), 0)

  // Métricas 24h
  const total24h = events24h.length
  const cost24h = events24h.reduce((sum, e) => sum + (e.cost_usd ?? 0), 0)

  // Por feature (30d)
  const featureStats = new Map<
    string,
    { count: number; cost: number; inputTokens: number; outputTokens: number }
  >()
  for (const e of events30d) {
    const cur = featureStats.get(e.feature) ?? {
      count: 0,
      cost: 0,
      inputTokens: 0,
      outputTokens: 0,
    }
    cur.count += 1
    cur.cost += e.cost_usd ?? 0
    cur.inputTokens += e.input_tokens ?? 0
    cur.outputTokens += e.output_tokens ?? 0
    featureStats.set(e.feature, cur)
  }
  const byFeature = [...featureStats.entries()]
    .map(([feature, s]) => ({ feature, ...s }))
    .sort((a, b) => b.cost - a.cost)

  // Por user (30d) — top 10
  const userStats = new Map<string, { count: number; cost: number }>()
  for (const e of events30d) {
    if (!e.user_id) continue
    const cur = userStats.get(e.user_id) ?? { count: 0, cost: 0 }
    cur.count += 1
    cur.cost += e.cost_usd ?? 0
    userStats.set(e.user_id, cur)
  }
  const topUserIds = [...userStats.entries()]
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 10)
    .map(([id]) => id)

  const userNamesMap = new Map<string, { name: string; email: string }>()
  if (topUserIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', topUserIds)
      .returns<UserNameRow[]>()
    for (const u of users ?? []) {
      userNamesMap.set(u.id, { name: u.full_name ?? u.email, email: u.email })
    }
  }

  const topUsers = topUserIds.map(id => {
    const stat = userStats.get(id)!
    const info = userNamesMap.get(id)
    return {
      id,
      name: info?.name ?? 'Usuário desconhecido',
      email: info?.email ?? '',
      count: stat.count,
      cost: stat.cost,
    }
  })

  // Top empresas por consumo de IA (via company_users)
  interface CompanyUserLink {
    user_id: string
    company_id: string
    companies: { name: string | null } | { name: string | null }[] | null
  }
  const usersWithCost = [...userStats.entries()].filter(([, s]) => s.cost > 0).map(([id]) => id)
  const companyConsumptionMap = new Map<string, { name: string; cost: number; count: number }>()
  if (usersWithCost.length > 0) {
    const { data: companyLinks } = await supabase
      .from('company_users')
      .select('user_id, company_id, companies(name)')
      .in('user_id', usersWithCost)
      .overrideTypes<CompanyUserLink[]>()
    for (const link of companyLinks ?? []) {
      const stat = userStats.get(link.user_id)
      if (!stat) continue
      const rel = link.companies
      const cname = (Array.isArray(rel) ? rel[0]?.name : rel?.name) ?? 'Empresa'
      const cur = companyConsumptionMap.get(link.company_id) ?? { name: cname, cost: 0, count: 0 }
      cur.cost += stat.cost
      cur.count += stat.count
      companyConsumptionMap.set(link.company_id, cur)
    }
  }
  const topCompanies = [...companyConsumptionMap.values()]
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10)

  // Por dia (30d) — pra sparkline
  const dayMap = new Map<string, number>()
  for (const e of events30d) {
    const day = e.created_at.slice(0, 10)
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1)
  }
  const last14 = [...Array(14)].map((_, i) => {
    const d = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  })
  const sparkValues = last14.map(d => dayMap.get(d) ?? 0)
  const maxSpark = Math.max(...sparkValues, 1)
  const sparkNorm = sparkValues.map(v => (v / maxSpark) * 100)

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Admin Nexhire"
        title="Consumo de"
        titleAccent="IA"
        subtitle="Tokens, custo estimado em USD/BRL e quem está consumindo. Janela: últimas 24h e 30d."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Eventos 24h"
          value={total24h}
          footer={`Custo estimado: ${formatUSD(cost24h)} · ${formatBRL(cost24h)}`}
        />
        <KPICard
          label="Eventos 30d"
          value={total30d}
          spark={{ values: sparkNorm, color: 'purple' }}
          footer={`14d trend`}
        />
        <KPICard
          label="Custo 30d (USD)"
          value={formatUSD(cost30d)}
          numSize="sm"
          footer={`Equivale a ${formatBRL(cost30d)}`}
        />
        <KPICard
          label="Tokens 30d"
          value={(inputTokens30d + outputTokens30d).toLocaleString('pt-BR')}
          numSize="sm"
          footer={`In: ${inputTokens30d.toLocaleString('pt-BR')} · Out: ${outputTokens30d.toLocaleString('pt-BR')}`}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Por feature */}
        <Card padding="none">
          <div
            style={{ padding: '18px 22px 12px', borderBottom: '1px solid var(--border-1)' }}
          >
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
              Por feature (30d)
            </h2>
          </div>
          {byFeature.length === 0 ? (
            <div style={{ padding: '32px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
                Nenhum evento registrado.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-(--border-1)">
              {byFeature.map(f => (
                <div
                  key={f.feature}
                  style={{
                    padding: '12px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}
                    >
                      {featureLabels[f.feature] ?? f.feature}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: '10.5px',
                        color: 'var(--text-4)',
                        marginTop: '2px',
                      }}
                    >
                      {f.count} eventos · {(f.inputTokens + f.outputTokens).toLocaleString('pt-BR')} tokens
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}
                    >
                      {formatUSD(f.cost)}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: '10.5px',
                        color: 'var(--text-4)',
                        marginTop: '2px',
                      }}
                    >
                      {formatBRL(f.cost)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top users */}
        <Card padding="none">
          <div
            style={{ padding: '18px 22px 12px', borderBottom: '1px solid var(--border-1)' }}
          >
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
              Top consumidores (30d)
            </h2>
          </div>
          {topUsers.length === 0 ? (
            <div style={{ padding: '32px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
                Nenhum usuário consumiu IA ainda.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-(--border-1)">
              {topUsers.map(u => (
                <div
                  key={u.id}
                  style={{
                    padding: '12px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-1)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {u.name}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: '10.5px',
                        color: 'var(--text-4)',
                        marginTop: '2px',
                      }}
                    >
                      {u.email} · {u.count} eventos
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}
                    >
                      {formatUSD(u.cost)}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: '10.5px',
                        color: 'var(--text-4)',
                        marginTop: '2px',
                      }}
                    >
                      {formatBRL(u.cost)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Top empresas por consumo */}
      <Card padding="none" className="mb-6">
        <div
          style={{ padding: '18px 22px 12px', borderBottom: topCompanies.length > 0 ? '1px solid var(--border-1)' : 'none' }}
        >
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
            Top empresas por consumo (30d)
          </h2>
          <p style={{ fontSize: '11.5px', color: 'var(--text-4)', marginTop: '4px' }}>
            Agregação por empresa via membros (company_users). Base pra billing futuro.
          </p>
        </div>
        {topCompanies.length === 0 ? (
          <div style={{ padding: '24px 22px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
              Nenhuma empresa consumiu IA ainda.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-(--border-1)">
            {topCompanies.map((c, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-1)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--text-4)',
                      marginTop: '2px',
                    }}
                  >
                    {c.count} eventos
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}
                  >
                    {formatUSD(c.cost)}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--text-4)',
                      marginTop: '2px',
                    }}
                  >
                    {formatBRL(c.cost)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Eventos recentes */}
      <Card padding="none">
        <div
          style={{ padding: '18px 22px 12px', borderBottom: '1px solid var(--border-1)' }}
        >
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
            Últimos eventos
          </h2>
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: '32px 22px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
              Nenhum evento ainda. Vai aparecendo conforme a IA é usada na plataforma.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-(--border-1)">
            {recent.map(e => (
              <div
                key={e.id}
                style={{
                  padding: '12px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Badge variant={providerBadge[e.provider] ?? 'gray'} size="sm">
                  {e.provider}
                </Badge>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--text-1)',
                    }}
                  >
                    {featureLabels[e.feature] ?? e.feature}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--text-4)',
                      marginTop: '2px',
                    }}
                  >
                    {e.model ?? '—'} · in {e.input_tokens ?? 0} / out {e.output_tokens ?? 0} · {e.duration_ms ?? 0}ms
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--text-1)',
                    }}
                  >
                    {formatUSD(e.cost_usd ?? 0)}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--text-4)',
                      marginTop: '2px',
                    }}
                  >
                    {formatTimestamp(e.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
