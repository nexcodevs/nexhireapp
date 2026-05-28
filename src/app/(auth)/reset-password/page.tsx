import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import AuthLayout from '@/components/auth/AuthLayout'
import { Suspense } from 'react'

export const metadata = {
  title: 'Criar nova senha — Nexhire',
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      leftTitle={
        <>
          Defina uma nova{' '}
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              color: 'var(--color-neon)',
            }}
          >
            senha
          </span>
          .
        </>
      }
      leftSubtitle="Use uma senha forte com pelo menos 8 caracteres. Você será redirecionado para a plataforma logo em seguida."
      rightEyebrow="Nova senha"
      rightTitle={
        <>
          Quase{' '}
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              color: 'var(--color-g600)',
            }}
          >
            lá
          </span>
        </>
      }
      rightSubtitle="Crie uma nova senha para sua conta."
    >
      <Suspense
        fallback={
          <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>Carregando…</p>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
