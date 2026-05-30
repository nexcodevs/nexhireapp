import SignupForm from '@/components/auth/SignupForm'
import AuthLayout from '@/components/auth/AuthLayout'

export const metadata = {
  title: 'Criar conta — Nexhire',
}

export default function SignupPage() {
  return (
    <AuthLayout
      leftTitle={
        <>
          Recrutamento{' '}
          <span
            style={{
                            fontWeight: 400,
              color: 'var(--color-neon)',
            }}
          >
            inteligente
          </span>{' '}
          em uma só plataforma.
        </>
      }
      leftSubtitle="Empresas, hunters e candidatos conectados por IA + curadoria humana."
      leftBullets={[
        'Empresas: receba candidatos pré-validados pela IA e pelo HR',
        'Hunters: trabalhe em vagas reais com feedback estruturado',
        'Candidatos: entre num pipeline com fit técnico de verdade',
      ]}
      rightEyebrow="Criar conta"
      rightTitle={
        <>
          Comece em{' '}
          <span
            style={{
                            fontWeight: 400,
              color: 'var(--color-g600)',
            }}
          >
            minutos
          </span>
        </>
      }
      rightSubtitle="Cria sua conta e escolhe seu papel na plataforma."
    >
      <SignupForm />
    </AuthLayout>
  )
}
