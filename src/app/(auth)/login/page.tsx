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
        'Análise IA + curadoria humana em cada candidato',
        'Rede seletiva de hunters especialistas',
        'Match ranqueado por fit técnico, senioridade e comportamental',
      ]}
      rightEyebrow="Acessar plataforma"
      rightTitle={
        <>
          Bem-vindo de{' '}
          <span
            style={{
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
