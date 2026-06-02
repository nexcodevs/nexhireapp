import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import { requireCompany } from '@/lib/company'
import { formatDate } from '@/lib/utils'
import BlockHunterForm from './BlockHunterForm'
import UnblockButton from './UnblockButton'

export const metadata = {
  title: 'Hunters bloqueados — Nexhire',
}

interface BlockRow {
  id: string
  recruiter_id: string
  reason: string | null
  created_at: string
  recruiters: {
    id: string
    linkedin_url: string | null
    users: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null
  } | { id: string; linkedin_url: string | null; users: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null }[] | null
}

export default async function EmpresaHuntersBloqueadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const companyId = await requireCompany(supabase, user.id)
  const admin = createAdminClient()

  const { data: blocksRaw } = await admin
    .from('company_blocked_hunters')
    .select(
      'id, recruiter_id, reason, created_at, recruiters(id, linkedin_url, users(full_name, email))',
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  const blocks = (blocksRaw ?? []) as BlockRow[]

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Configurações"
        title="Hunters"
        titleAccent="bloqueados"
        subtitle="Hunters bloqueados não veem suas vagas no marketplace. Útil pra conflitos de interesse ou qualidade ruim de envios."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form de adição */}
        <Card padding="lg">
          <h2
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-1)',
              marginBottom: '12px',
              letterSpacing: '-0.005em',
            }}
          >
            Bloquear novo hunter
          </h2>
          <p
            style={{
              fontSize: '12.5px',
              color: 'var(--text-3)',
              marginBottom: '16px',
              lineHeight: 1.55,
            }}
          >
            Informe o email do hunter. Ele deixa de ver suas vagas a partir de agora. A
            decisão fica registrada — você pode desbloquear depois.
          </p>
          <BlockHunterForm companyId={companyId} userId={user.id} />
        </Card>

        {/* Lista */}
        <Card padding="none">
          <div
            style={{
              padding: '18px 22px 12px',
              borderBottom: '1px solid var(--border-1)',
            }}
          >
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
              Bloqueios ativos ({blocks.length})
            </h2>
          </div>
          {blocks.length === 0 ? (
            <div style={{ padding: '32px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
                Nenhum hunter bloqueado.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-(--border-1)">
              {blocks.map(b => {
                const rRel = Array.isArray(b.recruiters) ? b.recruiters[0] : b.recruiters
                const userRel = rRel?.users
                  ? Array.isArray(rRel.users)
                    ? rRel.users[0]
                    : rRel.users
                  : null
                const name = userRel?.full_name || userRel?.email || 'Hunter'
                return (
                  <div
                    key={b.id}
                    style={{
                      padding: '14px 22px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <Avatar name={name} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-1)' }}>
                        {name}
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--text-4)',
                          marginTop: '2px',
                        }}
                      >
                        {userRel?.email} · Bloqueado em {formatDate(b.created_at)}
                      </div>
                      {b.reason && (
                        <p
                          style={{
                            fontSize: '12.5px',
                            color: 'var(--text-2)',
                            marginTop: '6px',
                            lineHeight: 1.5,
                          }}
                        >
                          {b.reason}
                        </p>
                      )}
                    </div>
                    <UnblockButton blockId={b.id} />
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
