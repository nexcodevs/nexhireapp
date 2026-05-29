import Link from 'next/link'

export const metadata = {
  title: 'Termos de Uso — Nexhire',
}

export default function TermosPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        padding: '64px 24px',
      }}
    >
      <article style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent-text)',
            textDecoration: 'none',
          }}
        >
          ← Voltar
        </Link>

        <h1
          style={{
            fontSize: '40px',
            fontWeight: 500,
            letterSpacing: '-0.03em',
            color: 'var(--text-1)',
            marginTop: '24px',
            marginBottom: '8px',
          }}
        >
          Termos de Uso
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-4)',
            marginBottom: '48px',
          }}
        >
          Versão 2026-05-29
        </p>

        <div
          style={{
            fontSize: '14.5px',
            color: 'var(--text-2)',
            lineHeight: 1.7,
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <p>
            Estes Termos de Uso regem a utilização da plataforma Nexhire por empresas,
            recrutadores e candidatos. Ao criar uma conta, você concorda com as condições
            abaixo.
          </p>

          <section>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-1)',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
              }}
            >
              1. Sobre a plataforma
            </h2>
            <p>
              A Nexhire é uma plataforma de recrutamento que combina inteligência artificial
              com curadoria humana e uma rede de recrutadores especialistas. Conectamos
              empresas a candidatos qualificados via processo guiado por IA.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-1)',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
              }}
            >
              2. Cadastro e responsabilidades
            </h2>
            <p>
              Você se responsabiliza pela veracidade das informações fornecidas. Empresas
              devem manter dados atualizados sobre vagas e processos seletivos.
              Recrutadores se comprometem a enviar apenas candidatos previamente
              entrevistados.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-1)',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
              }}
            >
              3. Cobrança e remuneração
            </h2>
            <p>
              O modelo comercial inclui assinatura mensal da plataforma com créditos
              inclusos, créditos adicionais via pay-as-you-go, e taxa fixa por contratação
              efetivada. Detalhes da fatura ficam disponíveis na área da empresa.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-1)',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
              }}
            >
              4. Uso de IA
            </h2>
            <p>
              A Nexhire utiliza modelos de IA para análise de currículos, ranqueamento de
              candidatos, sugestões de descrição de vagas e outras funcionalidades. As
              decisões finais de contratação são sempre da empresa contratante. A IA é
              ferramenta de apoio, não substitui avaliação humana.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-1)',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
              }}
            >
              5. Dados pessoais e LGPD
            </h2>
            <p>
              O tratamento de dados pessoais segue a{' '}
              <Link
                href="/privacidade"
                style={{ color: 'var(--accent-text)', fontWeight: 500 }}
              >
                Política de Privacidade
              </Link>{' '}
              da Nexhire, em conformidade com a Lei Geral de Proteção de Dados (LGPD —
              Lei 13.709/2018).
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-1)',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
              }}
            >
              6. Encerramento de conta
            </h2>
            <p>
              Você pode encerrar sua conta a qualquer momento. A Nexhire pode encerrar
              contas que violem estes termos, com aviso prévio quando aplicável.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-1)',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
              }}
            >
              7. Contato
            </h2>
            <p>
              Dúvidas sobre estes termos: <strong>daniel@nexco.cc</strong>.
            </p>
          </section>
        </div>
      </article>
    </main>
  )
}
