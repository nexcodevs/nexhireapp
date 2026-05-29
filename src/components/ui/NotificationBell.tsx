'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  title: string
  message: string
  read_at: string | null
  created_at: string
  type: string
  link: string | null
}

function relativeTime(iso: string): string {
  const now = new Date().getTime()
  const then = new Date(iso).getTime()
  const diffSec = Math.max(0, Math.floor((now - then) / 1000))
  if (diffSec < 60) return 'agora'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `há ${diffMin}min`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `há ${diffHour}h`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return `há ${diffDay}d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
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

  async function markOneRead(id: string) {
    const supabase = createClient()
    const ts = new Date().toISOString()
    await supabase
      .from('notifications')
      .update({ read_at: ts })
      .eq('id', id)
      .is('read_at', null)
    setNotifications(prev =>
      prev.map(n => (n.id === id && !n.read_at ? { ...n, read_at: ts } : n)),
    )
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
                notifications.map(n => {
                  const unread = !n.read_at
                  const content = (
                    <div className="flex items-start gap-2">
                      {unread && (
                        <div
                          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                          style={{ background: 'var(--neon)' }}
                          aria-hidden
                        />
                      )}
                      <div className={unread ? '' : 'pl-4'} style={{ minWidth: 0, flex: 1 }}>
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="text-sm font-medium text-text" style={{ minWidth: 0 }}>
                            {n.title}
                          </div>
                          <span
                            className="mono shrink-0"
                            style={{ fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.04em' }}
                          >
                            {relativeTime(n.created_at)}
                          </span>
                        </div>
                        <div
                          className="text-xs text-muted mt-0.5"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {n.message}
                        </div>
                      </div>
                    </div>
                  )

                  const baseStyle: React.CSSProperties = {
                    borderColor: 'var(--border-2)',
                    background: unread ? 'var(--accent-bg)' : undefined,
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                  }

                  if (n.link) {
                    return (
                      <Link
                        key={n.id}
                        href={n.link}
                        prefetch={false}
                        onClick={() => {
                          if (unread) void markOneRead(n.id)
                          setOpen(false)
                        }}
                        className="px-4 py-3 border-b last:border-0 nx-notif-item"
                        style={baseStyle}
                      >
                        {content}
                      </Link>
                    )
                  }

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        if (unread) void markOneRead(n.id)
                      }}
                      className="px-4 py-3 border-b last:border-0 w-full text-left nx-notif-item"
                      style={{ ...baseStyle, border: 'none', borderBottom: '1px solid var(--border-2)', cursor: 'pointer' }}
                    >
                      {content}
                    </button>
                  )
                })
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
        .nx-notif-item:hover {
          background: var(--bg-elev-2) !important;
        }
      `}</style>
    </div>
  )
}
