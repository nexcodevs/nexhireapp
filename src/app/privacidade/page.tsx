import Link from 'next/link'

export const metadata = {
  title: 'Política de Privacidade — Nexhire',
}

export default function PrivacidadePage() {
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
          Política de Privacidade
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
          Versão 2026-05-29 · Conforme LGPD (Lei 13.709/2018)
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
            A Nexhire respeita sua privacidade. Esta política explica que dados coletamos,
            como usamos, e quais são seus direitos.
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
              1. Dados que coletamos
            </h2>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Cadastro: nome, email, senha (hash), papel (empresa / recrutador / candidato).</li>
              <li>Empresa: nome, site, setor, tamanho.</li>
              <li>Candidato: dados pessoais, profissionais e currículo (PDF).</li>
              <li>Uso da plataforma: ações realizadas, logs de acesso, IPs.</li>
            </ul>
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
              2. Finalidade do tratamento
            </h2>
            <p>
              Usamos seus dados para operar a plataforma, fazer match entre candidatos e
              vagas, gerar análises com IA, enviar notificações operacionais, faturar
              serviços e cumprir obrigações legais.
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
              3. Compartilhamento
            </h2>
            <p>
              Dados de candidatos são compartilhados com a empresa contratante quando o HR
              aprova o envio. Não vendemos dados a terceiros. Usamos sub-processadores
              (Supabase, Anthropic, Resend, Upstash, Vercel) com contratos de proteção.
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
              4. Retenção
            </h2>
            <p>
              Dados de candidatos ficam ativos enquanto a conta da empresa está ativa,
              limitado a 24 meses sem atividade no perfil. Após esse período, são anonimizados
              ou excluídos.
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
              5. Seus direitos (LGPD)
            </h2>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Acessar seus dados.</li>
              <li>Corrigir dados incompletos ou desatualizados.</li>
              <li>Solicitar exclusão dos seus dados (direito ao esquecimento).</li>
              <li>Revogar consentimento.</li>
              <li>Saber com quem seus dados foram compartilhados.</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              Para exercer qualquer direito, envie email para <strong>daniel@nexco.cc</strong>{' '}
              com o assunto &ldquo;LGPD&rdquo;. Respondemos em até 15 dias.
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
              6. Segurança
            </h2>
            <p>
              Usamos criptografia em trânsito (HTTPS/TLS), em repouso (Supabase), Row Level
              Security pra isolamento entre empresas, rate limiting em endpoints sensíveis,
              e logs de auditoria.
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
              7. Encarregado pelo tratamento (DPO)
            </h2>
            <p>
              <strong>Daniel Moraes</strong> · daniel@nexco.cc
            </p>
          </section>
        </div>
      </article>
    </main>
  )
}
