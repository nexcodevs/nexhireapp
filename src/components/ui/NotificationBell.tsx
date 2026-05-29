'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  title: string
  message: string
  read_at: string | null
  created_at: string
  type: string
}

interface NotificationBellProps {
  userId: string
  variant?: 'icon' | 'wide'
  placement?: 'bottom' | 'top'
}

export default function NotificationBell({
  userId,
  variant = 'icon',
  placement = 'bottom',
}: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const unread = notifications.filter(n => !n.read_at).length

  useEffect(() => {
    async function fetchNotifications() {
      const supabase = createClient()
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      setNotifications(data || [])
      setLoading(false)
    }

    fetchNotifications()

    const supabase = createClient()
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function markAllRead() {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)

    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
  }

  const bellSvg = (
    <svg className="w-5 h-5" style={{ color: 'var(--green-300)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )

  const dropdownPositionStyle: React.CSSProperties =
    placement === 'top'
      ? { bottom: 'calc(100% + 8px)', left: 0 }
      : { top: 'calc(100% + 8px)', right: 0 }

  return (
    <div className="relative" style={variant === 'wide' ? { width: '100%' } : undefined}>
      {variant === 'wide' ? (
        <button
          onClick={() => setOpen(!open)}
          aria-label="Notificações"
          aria-expanded={open}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '9px 12px',
            borderRadius: '10px',
            background: open ? 'rgba(255,255,255,.06)' : 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,.75)',
            fontSize: '13.5px',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            cursor: 'pointer',
            transition: 'background .15s, color .15s',
          }}
          className="nx-notif-wide"
        >
          <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{bellSvg}</span>
          <span style={{ flex: 1, textAlign: 'left' }}>Notificações</span>
          {unread > 0 && (
            <span
              className="mono"
              aria-label={`${unread} não lidas`}
              style={{
                minWidth: '20px',
                height: '18px',
                padding: '0 6px',
                borderRadius: '999px',
                background: 'var(--color-neon)',
                color: 'var(--color-f900)',
                fontSize: '10.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-(--green-800)"
          aria-label={unread > 0 ? `Notificações (${unread} não lidas)` : 'Notificações'}
          aria-expanded={open}
        >
          {bellSvg}
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 text-xs font-bold rounded-full flex items-center justify-center" style={{ background: 'var(--neon)', color: 'var(--text-1)' }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute w-80 rounded-xl border shadow-lg z-50 overflow-hidden"
            style={{ ...dropdownPositionStyle, background: 'var(--bg-elev-1)', borderColor: 'var(--border-2)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-2)' }}>
              <span className="text-sm font-bold text-text">Notificações</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-g600 hover:underline">
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-center text-sm text-subtle">Carregando...</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-subtle">Nenhuma notificação</div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className="px-4 py-3 border-b last:border-0"
                    style={{ borderColor: 'var(--border-2)', background: !n.read_at ? 'var(--accent-bg)' : undefined }}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read_at && (
                        <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--neon)' }} />
                      )}
                      <div className={!n.read_at ? '' : 'pl-4'}>
                        <div className="text-sm font-medium text-text">{n.title}</div>
                        <div className="text-xs text-muted mt-0.5">{n.message}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .nx-notif-wide:hover {
          background: rgba(255,255,255,.06);
          color: var(--text-on-dark);
        }
      `}</style>
    </div>
  )
}
