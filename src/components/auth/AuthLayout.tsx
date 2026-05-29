import Image from 'next/image'
import { ReactNode } from 'react'
import NexhireLogo from '@/components/brand/NexhireLogo'

interface AuthQuote {
  text: ReactNode
  authorName: string
  authorRole: string
  authorInitials?: string
}

interface AuthLayoutProps {
  /** Variant: bullets (feature list) ou quote (testimonial). Default = bullets. */
  leftVariant?: 'bullets' | 'quote'
  leftTitle?: ReactNode
  leftSubtitle?: string
  leftBullets?: string[]
  leftQuote?: AuthQuote
  rightEyebrow: string
  rightTitle: ReactNode
  rightSubtitle: string
  children: ReactNode
}

export default function AuthLayout({
  leftVariant = 'bullets',
  leftTitle,
  leftSubtitle,
  leftBullets,
  leftQuote,
  rightEyebrow,
  rightTitle,
  rightSubtitle,
  children,
}: AuthLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-base)',
      }}
    >
      {/* Side visual — escondida em mobile */}
      <div
        className="hidden lg:flex"
        style={{
          width: '50%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px',
          background: 'linear-gradient(135deg, var(--green-850) 0%, var(--green-950) 100%)',
          color: 'var(--text-on-dark)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-30%',
            right: '-30%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(0,230,118,.18) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-20%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(139,92,246,.12) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, color: 'var(--text-on-dark)' }}>
          <NexhireLogo width={128} />
          <div
            style={{
              marginTop: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--neon)',
            }}
          >
            <span
              aria-hidden
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'var(--neon)',
                boxShadow: '0 0 6px var(--neon)',
              }}
            />
            Sistema operacional · Nexhire
          </div>
        </div>

        {leftVariant === 'quote' && leftQuote ? (
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '520px' }}>
            <blockquote
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '40px',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                color: 'var(--text-on-dark)',
                marginBottom: '32px',
                margin: 0,
              }}
            >
              {leftQuote.text}
            </blockquote>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingTop: '32px',
                marginTop: '32px',
                borderTop: '1px solid rgba(255,255,255,.1)',
              }}
            >
              <div
                aria-hidden
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--neon), var(--green-600))',
                  color: 'var(--green-950)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                {leftQuote.authorInitials ??
                  leftQuote.authorName
                    .split(' ')
                    .map(n => n.charAt(0))
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 600 }}>{leftQuote.authorName}</div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.7)',
                    marginTop: '2px',
                  }}
                >
                  {leftQuote.authorRole}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '460px' }}>
            {leftTitle && (
              <h1
                style={{
                  fontSize: '40px',
                  fontWeight: 500,
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  color: 'var(--text-on-dark)',
                  marginBottom: '20px',
                }}
              >
                {leftTitle}
              </h1>
            )}
            {leftSubtitle && (
              <p
                style={{
                  fontSize: '15px',
                  color: 'rgba(255,255,255,.7)',
                  fontWeight: 300,
                  lineHeight: 1.55,
                  marginBottom: leftBullets && leftBullets.length > 0 ? '32px' : 0,
                }}
              >
                {leftSubtitle}
              </p>
            )}
            {leftBullets && leftBullets.length > 0 && (
              <ul
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                {leftBullets.map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      aria-hidden
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'var(--neon)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="11"
                        height="11"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        style={{ stroke: 'var(--green-950)' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--green-200)', fontWeight: 400 }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div style={{ position: 'relative', zIndex: 1 }} />
      </div>

      {/* Form side */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center"
        style={{ padding: '32px' }}
      >
        <div className="w-full" style={{ maxWidth: '400px' }}>
          <div className="lg:hidden" style={{ marginBottom: '32px' }}>
            <Image
              src="/brand/nexhire-symbol.svg"
              alt="Nexhire"
              width={132}
              height={132}
              priority
              style={{ width: '44px', height: '44px', display: 'block' }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--accent-text)',
                marginBottom: '12px',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'var(--neon)',
                  boxShadow: '0 0 6px var(--neon)',
                }}
              />
              {rightEyebrow}
            </div>
            <h2
              style={{
                fontSize: '32px',
                fontWeight: 500,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                color: 'var(--text-1)',
                marginBottom: '8px',
              }}
            >
              {rightTitle}
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-3)', lineHeight: 1.55 }}>
              {rightSubtitle}
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
