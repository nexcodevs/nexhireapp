'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface LGPDActionsProps {
  deletionRequestedAt: string | null
}

export default function LGPDActions({ deletionRequestedAt }: LGPDActionsProps) {
  const [exporting, setExporting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [requestedAt, setRequestedAt] = useState<string | null>(deletionRequestedAt)

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/user/export-data')
      if (!res.ok) {
        toast.error('Não foi possível exportar agora. Tente de novo em instantes.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'nexhire-meus-dados.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Download iniciado.')
    } catch (err) {
      console.warn('[lgpd:export]', err)
      toast.error('Falha de rede.')
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch('/api/user/request-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(data.error || 'Falha ao registrar o pedido.')
        return
      }
      const data = (await res.json()) as { alreadyRequested?: boolean; requested_at?: string }
      setRequestedAt(data.requested_at ?? new Date().toISOString())
      setConfirmOpen(false)
      toast.success(
        data.alreadyRequested
          ? 'Você já tinha um pedido em análise.'
          : 'Pedido registrado. Vamos processar em até 15 dias úteis.',
      )
    } catch (err) {
      console.warn('[lgpd:delete]', err)
      toast.error('Falha de rede.')
    } finally {
      setDeleting(false)
    }
  }

  return (
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
        Privacidade (LGPD)
      </h2>

      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)', marginBottom: '2px' }}>
              Exportar meus dados
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>
              Baixa um JSON com tudo que a plataforma tem sobre você (perfil,
              submissões, vagas, notificações).
            </div>
          </div>
          <Button variant="secondary" size="md" onClick={handleExport} loading={exporting}>
            Exportar
          </Button>
        </div>

        <div
          style={{
            paddingTop: '14px',
            borderTop: '1px solid var(--border-1)',
          }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)', marginBottom: '2px' }}>
              Excluir minha conta
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>
              {requestedAt
                ? `Pedido em análise desde ${new Date(requestedAt).toLocaleDateString('pt-BR')}. Processamos em até 15 dias úteis.`
                : 'Pedido manual processado em até 15 dias úteis. Você pode cancelar antes via daniel@nexco.cc.'}
            </div>
          </div>
          {!requestedAt && (
            <Button variant="danger" size="md" onClick={() => setConfirmOpen(true)}>
              Solicitar exclusão
            </Button>
          )}
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        title="Confirmar pedido de exclusão"
        subtitle="A conta é desativada e seus dados pessoais são anonimizados em até 15 dias úteis. Submissões e candidatos enviados ficam no histórico de forma anônima."
        maxWidth={520}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-2)',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Motivo (opcional)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Conta o que motivou — ajuda a gente a melhorar."
              maxLength={500}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '13px',
                background: 'var(--bg-elev-1)',
                border: '1px solid var(--border-1)',
                borderRadius: 'var(--r-md)',
                color: 'var(--text-1)',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div
            className="flex items-center justify-between gap-3"
            style={{ paddingTop: '8px', borderTop: '1px solid var(--border-1)' }}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
            >
              Confirmar pedido
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
