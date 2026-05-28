import LoginForm from '@/components/auth/LoginForm'
import AuthLayout from '@/components/auth/AuthLayout'

export const metadata = {
  title: 'Entrar — Nexhire',
}

export default function LoginPage() {
  return (
    <AuthLayout
      leftTitle={
        <>
          Uma rede inteira{' '}
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              color: 'var(--color-neon)',
            }}
          >
            trabalhando
          </span>{' '}
          pela sua próxima contratação.
        </>
      }
      leftSubtitle="IA + hunters especialistas + curadoria humana."
      leftBullets={[
        'Candidatos curados por IA e HR Manager',
        'Pagamento apenas quando contratar',
        'Rede seletiva de hunters especialistas',
      ]}
      rightEyebrow="Acessar plataforma"
      rightTitle={
        <>
          Bem-vindo de{' '}
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              color: 'var(--color-g600)',
            }}
          >
            volta
          </span>
        </>
      }
      rightSubtitle="Entre na sua conta para continuar."
    >
      <LoginForm />
    </AuthLayout>
  )
}
