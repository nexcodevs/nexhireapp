# Nexhire AI

Plataforma de recrutamento IA-Native que combina **IA + hunters externos + curadoria humana**. Empresas publicam vagas, hunters enviam candidatos pré-validados, HR Manager cura a fila e envia os melhores pra cliente, IA analisa fit e gera pitch sob demanda.

**Produção**: https://nexhireapp.vercel.app

---

## Stack

- **Frontend**: Next.js 16 (App Router, Server Components), TypeScript strict, Tailwind v4 CSS-first, design system custom v2.0
- **Backend**: Supabase (Postgres + Auth + Storage + RLS + Realtime), pgvector pra busca semântica
- **IA**: Anthropic Claude (Sonnet 4 e Haiku 4.5), Voyage AI (embeddings), Groq Whisper (transcrição de voz)
- **Infra**: Vercel (deploy), Upstash Redis (rate limit), Resend (email)

## Papéis (`users.role`)

| Role | O que faz |
|---|---|
| `admin` | Visão master da plataforma, controla empresas/hunters, vê consumo IA + audit log |
| `hr_manager` | Cura vagas e candidatos, aprova hunters novos, envia candidatos pro cliente |
| `company_user` | Cria vagas, recebe candidatos curados, decide contratação |
| `recruiter` | Hunter externo: envia candidatos pra vagas abertas no marketplace |
| `candidate` | Candidato buscando vagas (fluxo público minimalista hoje) |

## Como rodar local

```bash
# 1. Clonar e instalar
git clone https://github.com/nexcodevs/nexhireapp.git
cd nexhireapp
npm install

# 2. Variáveis de ambiente
cp .env.example .env.local   # ou pede o .env.local pro Daniel

# 3. Rodar migrations (Supabase Dashboard → SQL Editor)
# Aplicar todos os arquivos em supabase/migrations/ em ordem cronológica

# 4. Subir
npm run dev
# Acessa http://localhost:3000
```

### Variáveis obrigatórias

```
NEXT_PUBLIC_SUPABASE_URL          # URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Chave pública
SUPABASE_SERVICE_ROLE_KEY         # Service role (server-side)
ANTHROPIC_API_KEY                 # Claude (análise, pitch, Q&A, assistente)
GROQ_API_KEY                      # Whisper (transcrição)
VOYAGE_API_KEY                    # Embeddings (busca semântica)
UPSTASH_REDIS_REST_URL            # Rate limit
UPSTASH_REDIS_REST_TOKEN
RESEND_API_KEY                    # Email transacional
EMAIL_FROM                        # noreply@dominio.com
EMAIL_REPLY_TO
NEXT_PUBLIC_APP_URL               # URL pública (pra links em emails)
```

## Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/                   # Login, signup, forgot/reset password
│   ├── (dashboard)/              # Tudo logado
│   │   ├── admin/                # Painel admin
│   │   ├── empresa/              # Painel empresa
│   │   ├── hunter/               # Painel hunter
│   │   ├── hr/                   # Painel HR
│   │   ├── candidato/            # Painel candidato
│   │   ├── hunters/ranking       # Leaderboard público pseudonimizado
│   │   ├── perfil/               # Perfil do user (nome, senha)
│   │   └── layout.tsx            # Sidebar de navegação
│   ├── api/
│   │   ├── ai/                   # 7 endpoints de IA (analyze, pitch, Q&A, etc)
│   │   ├── admin/                # Endpoints admin (recompute scores, etc)
│   │   ├── auth/                 # Forgot password, rate limit auth
│   │   ├── candidates/           # check-duplicate
│   │   ├── hunter/               # auto-approve, search-jobs (busca semântica)
│   │   ├── insights/             # IA gera insights por papel
│   │   ├── assistant/            # Chat conversacional contextual
│   │   └── notifications/        # 4 endpoints (cada um manda email + in-app)
│   ├── privacidade/              # LGPD
│   └── termos/                   # Termos de uso
├── components/
│   ├── auth/                     # LoginForm, SignupForm, AuthLayout
│   ├── dashboard/                # DashboardShell, WelcomeCard, InsightsCards
│   ├── empresa/                  # LogoUpload, CompanyAvatar, CompanyEditForm
│   ├── submissions/              # SubmitCandidateForm, CandidateOnePager, VoiceRecorder, Kanban
│   ├── jobs/                     # JobForm, JobFilters, JobFromBriefFlow, SemanticJobSearch
│   ├── profile/                  # ProfileForm, PasswordForm
│   ├── admin/                    # RecomputeScoresButton
│   ├── assistant/                # NexhireAssistant (chat global)
│   └── ui/                       # Design system primitives (Button, Input, Card, Badge, etc)
├── lib/
│   ├── ai/                       # analyze, usage, insights, assistant, embed, parseCV
│   ├── email/                    # client + templates
│   ├── supabase/                 # client / server / admin
│   ├── notifications.ts          # notifyUser / notifyUsers (in-app)
│   ├── dedup.ts                  # Normalização email/phone/linkedin
│   ├── ratelimit.ts              # Limites por feature
│   ├── audit.ts                  # logAudit
│   ├── visibility.ts             # Filtro de vagas por nível do hunter
│   ├── blocks.ts                 # Hunters bloqueados por empresa
│   └── company.ts                # Helpers de company_users
└── types/
    └── database.ts               # Tipos do schema
```

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Modelos de dados, fluxos por papel, dependências
- [AUDIT.md](./AUDIT.md) — Auditoria com gaps de UX/segurança/tech debt e roadmap (2026-05-29)
- [src/app/(dashboard)/backlog.md](./src/app/(dashboard)/backlog.md) — Backlog vivo de melhorias
- [docs/standards/](./docs/standards/) — Princípios de design, engenharia, segurança, copy, a11y

## Comandos úteis

```bash
npm run dev          # Servidor de desenvolvimento (porta 3000)
npm run build        # Build de produção
npm start            # Servir build local
npx tsc --noEmit     # Type check sem gerar arquivos
npx eslint src/      # Lint
```

## Convenções

- **Idioma**: PT-BR no produto (UI, emails, mensagens). Inglês no código (variáveis, comentários técnicos).
- **Componentes**: Server por padrão. `'use client'` só quando precisa de state/effect/event handler.
- **Banco**: RLS habilitada por padrão. Service role só em endpoints autenticados.
- **Cores e tokens**: Usar variáveis CSS de `globals.css` (`var(--text-1)`, `var(--bg-elev-1)`, etc). Evitar hex hardcoded e Tailwind cores genéricas (`gray-500`, `white`).
- **Auditável**: Toda ação sensível (aprovação, rejeição, etc) chama `logAudit`.

## Autor & contato

- **Daniel Moraes** — CEO/Founder Nexhire — daniel@nexco.cc
- **Repositório**: https://github.com/nexcodevs/nexhireapp
