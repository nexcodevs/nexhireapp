import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import Image from 'next/image'

export const metadata = {
  title: 'Recuperar senha — Nexhire',
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex" style={{ background: '#FAFAFA' }}>
      {/* Lado esquerdo — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between"
        style={{
          background: '#052E16',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
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
            Recupere o{' '}
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontWeight: 400,
                color: '#00E676',
              }}
            >
              acesso
            </span>{' '}
            em segundos.
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 300,
              lineHeight: 1.6,
            }}
          >
            Enviamos um link seguro para o seu email. Você define uma nova senha e volta ao trabalho.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }} />
      </div>

      {/* Lado direito — formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center" style={{ padding: '32px' }}>
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
                color: '#16A34A',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#00E676',
                }}
              />
              Recuperação de senha
            </div>
            <h2
              style={{
                fontSize: '30px',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                color: '#052E16',
                marginBottom: '6px',
              }}
            >
              Esqueceu a{' '}
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: '#16A34A',
                }}
              >
                senha?
              </span>
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: 300 }}>
              Informe seu email e enviaremos um link para criar uma nova.
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}
