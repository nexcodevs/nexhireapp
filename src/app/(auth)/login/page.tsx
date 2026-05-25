import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Entrar — Nexhire',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Lado esquerdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#052E16] flex-col justify-between p-12">
        <div>
          <span className="text-white font-bold text-xl tracking-tight">nexhire</span>
        </div>
        <div>
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Uma rede inteira trabalhando pela sua próxima contratação.
          </h1>
          <p className="text-[#A7F3D0] text-lg font-light">
            IA + hunters especialistas + curadoria humana.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            'Candidatos curados por IA e HR Manager',
            'Pagamento apenas quando contratar',
            'Rede seletiva de hunters especialistas',
          ].map(item => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#00E676] flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-[#052E16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[#D1FAE5] text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#052E16] mb-1">
              Bem-vindo de volta
            </h2>
            <p className="text-[#6B7280] text-sm">
              Entre na sua conta para continuar
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}