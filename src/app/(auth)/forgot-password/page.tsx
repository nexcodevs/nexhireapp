import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import AuthLayout from '@/components/auth/AuthLayout'

export const metadata = {
  title: 'Recuperar senha — Nexhire',
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      leftTitle={
        <>
          Recupere o{' '}
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              color: 'var(--color-neon)',
            }}
          >
            acesso
          </span>{' '}
          em segundos.
        </>
      }
      leftSubtitle="Enviamos um link seguro para o seu email. Você define uma nova senha e volta ao trabalho."
      rightEyebrow="Recuperação de senha"
      rightTitle={
        <>
          Esqueceu a{' '}
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              color: 'var(--color-g600)',
            }}
          >
            senha?
          </span>
        </>
      }
      rightSubtitle="Informe seu email e enviaremos um link para criar uma nova."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
