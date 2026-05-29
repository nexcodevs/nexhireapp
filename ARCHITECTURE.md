# ARQUITETURA — Nexhire AI

Mapa técnico do sistema. Atualizado em **2026-05-29**.

---

## Modelos de dados (Supabase)

### Núcleo

| Tabela | Propósito | RLS habilitada via migration |
|---|---|---|
| `users` | Profile estendido do `auth.users` (full_name, role) | ❓ Verificar Dashboard |
| `companies` | Empresas contratantes (nome, indústria, tamanho, logo) | ❓ Verificar Dashboard |
| `company_users` | Relacionamento user ↔ company (role na empresa) | ❓ Verificar Dashboard |
| `recruiters` | Profile do hunter (status, level, specialties) | ❓ Verificar Dashboard |
| `jobs` | Vagas publicadas pelas empresas | ❓ Verificar Dashboard |
| `submissions` | Hunters enviam candidatos pra vagas | ❓ Verificar Dashboard |
| `candidates` | Pessoas reais que estão sendo apresentadas | ✅ [20260530_candidates_rls_hardening.sql](supabase/migrations/20260530_candidates_rls_hardening.sql) |

> ⚠️ As tabelas marcadas `❓` não têm `enable row level security` em nenhuma migration commitada. Pode ter sido habilitada manualmente no Dashboard — **verificar antes do deploy**. Ver [AUDIT.md §1.1](AUDIT.md).

### Cross-cutting

| Tabela | Propósito | Migration |
|---|---|---|
| `audit_events` | Log imutável de ações sensíveis | [20260529_audit_log.sql](supabase/migrations/20260529_audit_log.sql) |
| `notifications` | Notificações in-app (Realtime habilitado) | [20260530_notifications.sql](supabase/migrations/20260530_notifications.sql) |
| `ai_usage_events` | Tracking de cada chamada IA (tokens, custo) | [20260530_ai_usage.sql](supabase/migrations/20260530_ai_usage.sql) |
| `recruiter_scores` | Score calculado por trigger em `submissions` | [20260530_recruiter_scores.sql](supabase/migrations/20260530_recruiter_scores.sql) |
| `company_blocked_hunters` | Hunters bloqueados por empresa | [20260529_company_blocked_hunters.sql](supabase/migrations/20260529_company_blocked_hunters.sql) |

### Storage buckets

| Bucket | Propósito | Acesso |
|---|---|---|
| `cvs` | PDFs de currículo enviados pelos hunters | Privado. Hunter sobe na própria pasta, HR/Admin leem todos, empresa lê só os enviados pras suas vagas |
| `company_logos` | Logos das empresas | Público. Upload restrito a `company_users` da empresa |

---

## Estados (state machines)

### Submission status

```
submitted
  ↓ (HR roda IA ou aprova direto)
ai_analyzed
  ↓ (HR aprova)
hr_approved
  ↓ (HR envia ao cliente)
sent_to_client
  ↓ (Cliente decide)
client_approved → interview_scheduled → offer → hired
client_rejected
  ↓
not_hired (terminal)
```

Estados que **liberam slot** do hunter (não contam pra limite de 3 envios): `hr_rejected`, `client_rejected`, `not_hired`, `duplicate`.

### Job status

```
draft → pending_hr_review → open_for_hunters → submission_closed
       (HR aprova)         (prazo expira ou
                            limite de envios atingido)
                          ↓
                          in_hr_curation → sent_to_client → interviewing
                          → offer → hired / closed / cancelled
```

### Recruiter status

```
pending → approved → suspended
        → rejected
```

`level` é recomputado pelo trigger em `submissions`: `beginner → specialist → top_hunter`.

---

## Fluxos por papel (happy path)

### Empresa (`company_user`)

```
signup → onboarding (cria company + tos_accepted)
       → /empresa (dashboard)
       → /empresa/configuracoes (upload logo, ajustar dados)
       → /empresa/vagas/nova (cria vaga — pode usar JobFromBriefFlow com IA)
       → vaga vai pra pending_hr_review
       → HR aprova → vaga abre pra hunters
       → /empresa/vagas/[id]/candidatos (vê candidatos curados)
       → aprova / agenda entrevista / contrata
       → /empresa/candidatos (lista global de pendentes)
       → /empresa/hunters-bloqueados (gestão)
```

### Hunter (`recruiter`)

```
signup → escolhe role 'recruiter' → IA avalia auto-aprovação
       → status: pending / approved / rejected
       → /hunter (dashboard)
       → /hunter/vagas (marketplace, busca semântica disponível)
       → /hunter/vagas/[id] (vê detalhe)
       → SubmitCandidateForm: upload CV → IA pré-preenche → dedup check
       → submete (cria candidate + submission)
       → /hunter/submissoes (acompanha status)
       → /hunters/ranking (vê leaderboard pseudonimizado)
```

### HR Manager

```
login → /hr (dashboard com KPIs e insights IA)
      → /hr/vagas (revisa JDs em pending_hr_review, aprova/edita)
      → /hr/submissoes (fila ordenada por AI score)
      → /hr/submissoes/[id] (detalhe: hunter assessment + CV + análise IA + chat IA)
      → aprova/reprova/envia ao cliente
      → /hr/vagas/[id]/shortlist (ranking IA da vaga)
      → /hr/pipeline (kanban global)
      → /hr/hunters (gestão da rede)
```

### Admin

```
login → /admin (KPIs globais)
      → /admin/empresas (todas as empresas)
      → /admin/hunters (todos os hunters + botão "Recalcular scores")
      → /admin/audit (log imutável de ações sensíveis)
      → /admin/ai-usage (consumo IA por feature/user, custo USD+BRL)
```

---

## Endpoints

### `/api/ai/*` — Operações IA (todas autenticadas + `checkDailyAIQuota`)

| Endpoint | Modelo | Propósito |
|---|---|---|
| `POST /analyze` | claude-sonnet-4 | Análise de candidato (score, gaps, riscos, perguntas) |
| `POST /candidate-pitch` | claude-sonnet-4 | Pitch narrativo do candidato (com cache em `submissions.ai_pitch`) |
| `POST /ask-candidate` | claude-haiku-4-5 | Q&A conversacional sobre candidato |
| `POST /compare-candidates` | claude-sonnet-4 | Comparação dimensional 2-4 candidatos |
| `POST /generate-job` | claude-sonnet-4 | Brief livre → vaga estruturada |
| `POST /prefill-submission` | claude-haiku-4-5 | CV + JD → jd_priorities + score + roteiro |
| `POST /transcribe` | whisper-large-v3-turbo (Groq) | Áudio → texto |

### `/api/admin/*` — Admin only

| Endpoint | Propósito |
|---|---|
| `POST /recompute-scores` | Recalcula `recruiter_scores` (chama função SQL) |
| `POST /embeddings-backfill` | Gera embeddings pra vagas que não têm |

### `/api/auth/*`

| Endpoint | Rate limit | Propósito |
|---|---|---|
| `POST /forgot-password` | 3/15min por IP + email | Dispara email de reset via Supabase |
| `POST /rate-limit` | — | Camada pré-`signInWithPassword` / `signUp` (5/5min login, 3/h signup) |

### `/api/notifications/*`

4 endpoints (`new-submission`, `vaga-liberada`, `candidato-enviado-cliente`, `decisao-cliente`). Cada um:
1. Insere em `notifications` (in-app via `notifyUsers`)
2. Envia email via template Resend

> ⚠️ Hoje só checam `auth.getUser()` mas não validam role/ownership. Ver [AUDIT.md §1.3](AUDIT.md).

### `/api/hunter/*`

| Endpoint | Propósito |
|---|---|
| `POST /auto-approve` | IA decide auto_approve / needs_review / reject no signup do hunter |
| `POST /search-jobs` | Busca semântica via embeddings Voyage + pgvector `match_jobs` |

### `/api/candidates/check-duplicate`

Recebe `{ email, phone, linkedin_url, job_id }`. Retorna matches por email exato, telefone normalizado, LinkedIn canônico. Inclui info do último envio (hunter, vaga, ownership).

### `/api/insights`

Gera 3-4 insights por papel (admin/HR/empresa/hunter) com base em snapshot do banco. Sob demanda (botão).

### `/api/assistant/chat`

Chat conversacional contextual. Recebe `pageUrl` + role + `pageData` e responde em PT-BR.

---

## IA — providers e modelos

```ts
// Claude
'claude-sonnet-4-20250514'  // Análises críticas (cliente vê): score, pitch, comparação
'claude-haiku-4-5'          // Rápido/barato: Q&A, prefill, hunter risk, assistente, insights

// Voyage
'voyage-3-large'            // Embeddings 1024 dims (PT/EN), busca semântica de vagas

// Groq
'whisper-large-v3-turbo'    // Transcrição de voice memos (resumo de entrevista)
```

### Wrapper `callClaude` (em `lib/ai/analyze.ts`)

Centraliza chamadas pro Claude. Loga `ai_usage_events` automaticamente quando recebe `meta?: { feature, userId }`. Calcula custo via `PRICING` em `lib/ai/usage.ts`.

### Quota diária por feature (`DAILY_AI_LIMITS`)

```
analyze_candidate: 50
prefill_submission: 30
candidate_pitch: 50
ask_candidate: 30
compare_candidates: 20
generate_job: 10
evaluate_hunter: 5
transcribe: 20
search_jobs_embed: 50
embeddings_backfill: 5
insights: 10
assistant_chat: 100
```

Verificada via `checkDailyAIQuota()` antes de chamar o provider. **Sem rate limit por minuto** — ver [AUDIT.md §1.5](AUDIT.md).

---

## Regras de negócio (não derivam do código sem ler junto)

1. **Cliente nunca fala diretamente com hunter** — toda comunicação passa pelo HR Manager
2. **Ownership do candidato**: 60 dias a partir do primeiro envio válido
3. **Limite padrão**: 3 candidatos por hunter por vaga; prazo de 7 dias por vaga
4. **Aprovação manual de hunter**: novos hunters precisam aprovação HR (ou auto_approve via IA)
5. **IA não decide, IA apoia** — toda análise IA precisa de revisão humana antes de ir pro cliente

Outras decisões em [src/app/(dashboard)/backlog.md](src/app/(dashboard)/backlog.md) seção "Decisões registradas".

---

## Visibilidade de vagas (`jobs.visibility_type`)

| Tipo | Quem vê |
|---|---|
| `open` | Todos os hunters aprovados |
| `specialist_plus` | Especialistas e Top Hunters |
| `top_hunters_only` | Apenas Top Hunters |
| `hybrid` | Lógica mista (combina sinais) |

Filtragem em `lib/visibility.ts::filterJobsByVisibility`.

---

## Fluxo do design system

Tokens em `src/app/globals.css`:

- **Cores**: `--text-1/2/3/4` (texto por hierarquia), `--bg-base/elev-1/elev-2`, `--border-1/2`, `--accent-text/bg/border`, `--danger-*`, `--warning-*`
- **Tipografia**: `--font-sans` (Geist), `--font-serif` (Instrument Serif), `--font-mono` (Geist Mono)
- **Radius**: `--r-sm/md/lg/xl/full`
- **Easing**: `--ease`

Vars antigas `--color-*`, `--radius-*` ainda existem como aliases pra retrocompatibilidade — **mas devem ser migradas**. Ver [AUDIT.md §3.1](AUDIT.md).

---

## Dependências externas

- `@anthropic-ai/sdk` — Claude
- `@supabase/ssr` + `@supabase/supabase-js` — Banco + auth
- `@upstash/ratelimit` + `@upstash/redis` — Rate limit distribuído
- `resend` — Email transacional
- `unpdf` — Parsing de PDF de CV (substituiu `pdf-parse` por causa de bug no Turbopack)
- `next/font` — Geist + Instrument Serif

---

## Observabilidade

- `console.warn/error` em endpoints (logs vão pro Vercel)
- Tabela `audit_events` registra ações sensíveis (`logAudit`)
- Tabela `ai_usage_events` registra cada chamada IA com tokens, custo, duração
- `/admin/ai-usage` mostra agregado

Ainda **não tem**:
- Sentry / error tracking
- Analytics de produto (PostHog ou similar)
- Logger estruturado (Pino) — ainda usa console
- Testes automatizados

---

## Como atualizar este documento

- Quando adicionar tabela nova → atualizar seção "Modelos de dados"
- Quando adicionar endpoint → atualizar seção "Endpoints"
- Quando mudar regra de negócio → atualizar "Regras de negócio"
- Quando feature passar de "Faltante" pra entregue no AUDIT.md → refletir aqui
