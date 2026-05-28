import Image from 'next/image'
import { ReactNode } from 'react'

interface AuthLayoutProps {
  leftTitle: ReactNode
  leftSubtitle: string
  leftBullets?: string[]
  rightEyebrow: string
  rightTitle: ReactNode
  rightSubtitle: string
  children: ReactNode
}

export default function AuthLayout({
  leftTitle,
  leftSubtitle,
  leftBullets,
  rightEyebrow,
  rightTitle,
  rightSubtitle,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg-app)' }}>
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between"
        style={{
          background: 'var(--color-f900)',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(0,230,118,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Image
            src="/brand/nexhire-logo.svg"
            alt="Nexhire"
            width={872}
            height={180}
            priority
            style={{ width: '140px', height: 'auto', display: 'block' }}
          />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '460px' }}>
          <h1
            style={{
              fontSize: '40px',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
              marginBottom: '20px',
            }}
          >
            {leftTitle}
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 300,
              lineHeight: 1.6,
            }}
          >
            {leftSubtitle}
          </p>
        </div>

        {leftBullets && leftBullets.length > 0 ? (
          <ul
            style={{
              position: 'relative',
              zIndex: 1,
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
                  aria-hidden="true"
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--color-neon)',
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
                    style={{ stroke: 'var(--color-f900)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span style={{ fontSize: '14px', color: 'var(--color-m200)', fontWeight: 400 }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ position: 'relative', zIndex: 1 }} />
        )}
      </div>

      <div
        className="w-full lg:w-1/2 flex items-center justify-center"
        style={{ padding: '32px' }}
      >
        <div className="w-full" style={{ maxWidth: '380px' }}>
          <div className="lg:hidden mb-8">
            <Image
              src="/brand/nexhire-symbol.svg"
              alt="Nexhire"
              width={132}
              height={132}
              priority
              style={{ width: '44px', height: '44px', display: 'block', marginBottom: '12px' }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '10.5px',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--color-g600)',
                marginBottom: '10px',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'var(--color-neon)',
                }}
              />
              {rightEyebrow}
            </div>
            <h2
              style={{
                fontSize: '30px',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                color: 'var(--color-text)',
                marginBottom: '6px',
              }}
            >
              {rightTitle}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', fontWeight: 300 }}>
              {rightSubtitle}
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
