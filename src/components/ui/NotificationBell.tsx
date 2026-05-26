'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  message: string
  read_at: string | null
  created_at: string
  type: string
}

export default function NotificationBell({ userId }: { userId: string }) {
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

    // Realtime
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

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#064E1F] transition-colors"
        aria-label="Notificações"
      >
        <svg className="w-5 h-5 text-[#A7F3D0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00E676] text-[#052E16] text-xs font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-80 bg-white rounded-xl border border-[#E5E7EB] shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
              <span className="text-sm font-bold text-[#052E16]">Notificações</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-[#16A34A] hover:underline">
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-center text-sm text-[#9CA3AF]">Carregando...</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[#9CA3AF]">Nenhuma notificação</div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-[#F3F4F6] last:border-0 ${!n.read_at ? 'bg-[#F0FDF4]' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read_at && (
                        <div className="w-2 h-2 rounded-full bg-[#00E676] flex-shrink-0 mt-1.5" />
                      )}
                      <div className={!n.read_at ? '' : 'pl-4'}>
                        <div className="text-sm font-medium text-[#052E16]">{n.title}</div>
                        <div className="text-xs text-[#6B7280] mt-0.5">{n.message}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}