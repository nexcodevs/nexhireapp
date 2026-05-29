'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/ui/NotificationBell'
import Avatar from '@/components/ui/Avatar'
import NexhireLogo from '@/components/brand/NexhireLogo'
import NexhireAssistant from '@/components/assistant/NexhireAssistant'
import { toggleTheme, useTheme } from '@/components/providers/theme'

const STORAGE_KEY = 'nexhire:sidebar:collapsed'

const listeners = new Set<() => void>()
function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
function notify() {
  listeners.forEach(cb => cb())
}
function getCollapsedSnapshot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
function getServerSnapshot(): boolean {
  return false
}
function setCollapsedStore(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    // ignora
  }
  notify()
}

function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

export interface NavItemDef {
  href: string
  label: string
  icon: 'home' | 'briefcase' | 'users' | 'search' | 'send' | 'inbox' | 'columns' | 'building'
}

interface DashboardShellProps {
  userId: string
  userName: string | null
  userEmail: string
  userRole: string
  roleLabel: string
  items: NavItemDef[]
  children: React.ReactNode
}

function IconSvg({ name }: { name: NavItemDef['icon'] }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      )
    case 'briefcase':
      return (
        <svg {...common}>
          <rect x="2.5" y="7" width="19" height="13" rx="2" />
          <path d="M8 7V5.5A2.5 2.5 0 0110.5 3h3A2.5 2.5 0 0116 5.5V7" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7.5" />
          <path d="m21 21-4.4-4.4" />
        </svg>
      )
    case 'send':
      return (
        <svg {...common}>
          <path d="M22 2 11 13" />
          <path d="M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      )
    case 'inbox':
      return (
        <svg {...common}>
          <path d="M22 12h-6l-2 3h-4l-2-3H2" />
          <path d="M5.45 5.11 2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
        </svg>
      )
    case 'columns':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="5.5" height="18" rx="1.5" />
          <rect x="9.25" y="3" width="5.5" height="18" rx="1.5" />
          <rect x="15.5" y="3" width="5.5" height="18" rx="1.5" />
        </svg>
      )
    case 'building':
      return (
        <svg {...common}>
          <rect x="4" y="2.5" width="16" height="19" rx="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01" />
        </svg>
      )
  }
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{
        transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform .2s var(--ease)',
      }}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

const iconBtnStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '6px',
  background: 'transparent',
  color: 'var(--text-4)',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'background .15s var(--ease), color .15s var(--ease)',
}

function ThemeToggleIcon({ theme }: { theme: 'light' | 'dark' }) {
  if (theme === 'dark') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function DashboardShell({
  userId,
  userName,
  userEmail,
  userRole,
  roleLabel,
  items,
  children,
}: DashboardShellProps) {
  const collapsed = useSyncExternalStore(subscribe, getCollapsedSnapshot, getServerSnapshot)
  const hydrated = useMounted()
  const theme = useTheme()
  const pathname = usePathname()

  const sidebarWidth = collapsed ? 64 : 240
  const mainMargin = sidebarWidth

  return (
    <div style={{ minHeight: '100vh' }}>
      <aside
        aria-label="Navegação principal"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${sidebarWidth}px`,
          background: 'var(--bg-elev-2)',
          borderRight: '1px solid var(--border-1)',
          display: 'flex',
          flexDirection: 'column',
          transition: hydrated ? 'width .22s var(--ease)' : 'none',
          zIndex: 10,
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: '10px',
            padding: collapsed ? '18px 8px 16px' : '22px 18px 18px',
            borderBottom: '1px solid var(--border-1)',
            minHeight: collapsed ? '64px' : 'auto',
          }}
        >
          {collapsed ? (
            <Link
              href={items[0]?.href || '/'}
              aria-label="Nexhire"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '10px',
                textDecoration: 'none',
              }}
            >
              <Image
                src="/brand/nexhire-symbol.svg"
                alt=""
                width={36}
                height={36}
                priority
                style={{ width: '32px', height: '32px', display: 'block' }}
              />
            </Link>
          ) : (
            <Link
              href={items[0]?.href || '/'}
              style={{ display: 'block', flex: 1, minWidth: 0, color: 'var(--text-1)' }}
            >
              <NexhireLogo width={108} />
            </Link>
          )}
        </div>

        {/* Toggle expand/collapse */}
        <button
          type="button"
          onClick={() => setCollapsedStore(!collapsed)}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          className="nx-shell-collapse"
          style={{
            position: 'absolute',
            top: '20px',
            right: '14px',
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            background: 'var(--bg-elev-1)',
            color: 'var(--text-3)',
            border: '1px solid var(--border-1)',
            cursor: 'pointer',
            display: collapsed ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all .15s var(--ease)',
            opacity: 0,
          }}
        >
          <ChevronIcon collapsed={collapsed} />
        </button>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: collapsed ? '14px 10px' : '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            overflow: 'hidden',
          }}
        >
          {!collapsed && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-4)',
                padding: '4px 12px 8px',
              }}
            >
              Principal
            </div>
          )}
          {items.map(item => {
            const matches = pathname === item.href || pathname.startsWith(item.href + '/')
            const moreSpecific = matches && items.some(other =>
              other.href !== item.href &&
              other.href.startsWith(item.href + '/') &&
              (pathname === other.href || pathname.startsWith(other.href + '/'))
            )
            const active = matches && !moreSpecific
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={active ? 'nx-nav-item nx-nav-item--active' : 'nx-nav-item'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: '10px',
                  padding: collapsed ? '10px' : '8px 12px',
                  borderRadius: 'var(--r-sm)',
                  color: active ? 'var(--accent-text)' : 'var(--text-3)',
                  background: active ? 'var(--accent-bg)' : 'transparent',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 500,
                  letterSpacing: '-0.005em',
                  textDecoration: 'none',
                  transition: 'all .15s var(--ease)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <IconSvg name={item.icon} />
                </span>
                {!collapsed && (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Notificações */}
        <div
          style={{
            padding: collapsed ? '10px' : '10px 12px',
            borderTop: '1px solid var(--border-1)',
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'stretch',
          }}
        >
          <NotificationBell
            userId={userId}
            variant={collapsed ? 'icon' : 'wide'}
            placement="top"
          />
        </div>

        {/* User footer */}
        <div
          style={{
            margin: collapsed ? '8px' : '8px 12px 14px',
            padding: collapsed ? '8px' : '10px 12px',
            background: 'var(--bg-elev-1)',
            border: '1px solid var(--border-1)',
            borderRadius: 'var(--r-md)',
            display: 'flex',
            flexDirection: collapsed ? 'column' : 'row',
            alignItems: 'center',
            gap: collapsed ? '6px' : '10px',
          }}
        >
          {collapsed ? (
            <>
              <Avatar name={userName || userEmail} size="sm" status />
              <button
                type="button"
                onClick={() => setCollapsedStore(false)}
                aria-label="Expandir menu"
                title="Expandir menu"
                className="nx-shell-icon-btn"
                style={iconBtnStyle}
              >
                <ChevronIcon collapsed={true} />
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
                className="nx-shell-icon-btn"
                style={iconBtnStyle}
              >
                <ThemeToggleIcon theme={theme} />
              </button>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  aria-label="Sair"
                  title="Sair"
                  className="nx-shell-icon-btn"
                  style={iconBtnStyle}
                >
                  <LogoutIcon />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/perfil"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minWidth: 0,
                  flex: 1,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
                title="Ver perfil"
              >
                <Avatar name={userName || userEmail} size="sm" status />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-1)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {userName?.split(' ')[0] || 'Usuário'}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-4)',
                      marginTop: '1px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {roleLabel}
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
                className="nx-shell-icon-btn"
                style={iconBtnStyle}
              >
                <ThemeToggleIcon theme={theme} />
              </button>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  aria-label="Sair"
                  title="Sair"
                  className="nx-shell-icon-btn"
                  style={iconBtnStyle}
                >
                  <LogoutIcon />
                </button>
              </form>
            </>
          )}
        </div>
      </aside>

      <main
        style={{
          marginLeft: `${mainMargin}px`,
          padding: '32px',
          minHeight: '100vh',
          transition: hydrated ? 'margin-left .22s var(--ease)' : 'none',
        }}
      >
        {children}
      </main>

      <NexhireAssistant userRole={userRole} />

      <style>{`
        .nx-nav-item:hover {
          background: var(--bg-elev-1);
          color: var(--text-1);
        }
        .nx-nav-item--active:hover {
          background: var(--accent-bg);
          color: var(--accent-text);
        }
        aside:hover .nx-shell-collapse {
          opacity: 1;
        }
        .nx-shell-collapse:hover {
          background: var(--accent-bg) !important;
          color: var(--accent-text) !important;
          border-color: var(--accent-border) !important;
        }
        .nx-shell-icon-btn:hover {
          background: var(--bg-elev-2);
          color: var(--text-1);
        }
      `}</style>
    </div>
  )
}
