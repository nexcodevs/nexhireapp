# AUDITORIA — Nexhire AI

**Data:** 2026-05-29
**Escopo:** UX/fluxo, tech debt, segurança/LGPD, funcionalidades faltantes
**Método:** 3 varreduras automatizadas paralelas + revisão manual dos achados críticos

---

## Sumário executivo

| Categoria | Críticos | Altos | Médios | Baixos |
|---|---|---|---|---|
| **Segurança** | 2 | 2 | 4 | 0 |
| **UX/Fluxo** | 0 | 7 | 11 | 2 |
| **Tech Debt** | 0 | 1 | 4 | 2 |
| **Features faltantes** | 0 | 3 | 6 | 5 |

### O que eu recomendo atacar primeiro (próximas 2 sprints)

**Sprint 11 — Segurança e UX crítico (semana)**
1. 🔴 Habilitar RLS em `submissions`, `jobs`, `users`, `recruiters`, `companies`, `company_users` (sem isso, qualquer user vê dado de qualquer empresa)
2. 🔴 `/api/test-email` exposto — **já removido nesta auditoria**
3. 🟠 Notificações: validar role/ownership antes de admin client
4. 🟠 Toast global de sucesso/erro (resolve 8 items de UX em uma feature)
5. 🟠 Indicador de página ativa no sidebar + breadcrumb em telas profundas
6. 🟠 Console.log em produção (limpar 7 ocorrências)

**Sprint 12 — Cron SLA + fluxos polidos (semana)**
7. 🟠 Cron SLA (lembretes quando algo trava — Daniel já pediu antes)
8. 🟠 Fluxo do hunter pós-signup (pendente/aprovado/rejeitado mais claro)
9. 🟠 Empresa: separar visualmente "Candidatos pendentes (sidebar)" vs "Candidatos da vaga"
10. 🟡 Migrar top 5 arquivos de CSS legacy `--color-*` para tokens v2 (`--text-*`, `--bg-*`)

---

## 🔴 BLOCO 1 — SEGURANÇA & CONFORMIDADE

### 1.1 [CRÍTICO] RLS não aparece em migrations para tabelas centrais

Apenas 6 tabelas têm `enable row level security` em migration: `candidates`, `notifications`, `audit_events`, `ai_usage_events`, `recruiter_scores`, `company_blocked_hunters`.

**Não há migration habilitando RLS em**: `submissions`, `jobs`, `users`, `recruiters`, `companies`, `company_users`.

**Risco**: Se essas tabelas não tiveram RLS habilitada manualmente no Dashboard Supabase, qualquer usuário autenticado pode ler/escrever dados de outras empresas, hunters e candidatos.

**Como verificar**: rodar no Supabase SQL Editor:
```sql
select tablename, rowsecurity from pg_tables
where schemaname = 'public'
  and tablename in ('submissions','jobs','users','recruiters','companies','company_users');
```
Tabelas com `rowsecurity = false` precisam de migration urgente.

**Ação**: Criar `20260601_core_tables_rls.sql` com `enable row level security` + policies por papel.

---

### 1.2 [CRÍTICO] `/api/test-email` exposto sem auth — RESOLVIDO

Endpoint GET público que disparava email via Resend, sem auth check. Removido em commit desta auditoria.

---

### 1.3 [ALTO] Notificações sem validação de role/ownership

Os 4 endpoints `/api/notifications/*` chamam `auth.getUser()` mas depois usam `createAdminClient()` sem verificar se o user é HR/admin ou dono da entidade. Qualquer user autenticado pode disparar notificações de submissões alheias.

**Onde**: `src/app/api/notifications/{new-submission,candidato-enviado-cliente,decisao-cliente,vaga-liberada}/route.ts`

**Ação**: Após `getUser()`, validar `userData.role in ['hr_manager','admin']` (ou ownership específico) antes de chamar admin client.

---

### 1.4 [ALTO] LGPD parcial

- Páginas `/privacidade` e `/termos` existem
- Onboarding empresa tem checkbox de aceite de termos com `tos_accepted_at` ✅
- **Falta**: endpoint `/api/user/export-data`, endpoint `/api/user/request-deletion`, audit log de "quem viu qual candidato"
- **Falta**: signup de hunter/candidato não tem checkbox de termos (só empresa tem)

**Ação**: Implementar export, deletion, audit de acesso a PII e estender consent flow.

---

### 1.5 [MÉDIO] Rate limit em IA é só diário

`checkDailyAIQuota` cobre limite/dia mas não previne burst. Um user pode fazer 20 req/seg até bater quota diária.

**Ação**: Adicionar `Ratelimit.slidingWindow(5, '1 m')` por user em todos `/api/ai/*`.

---

### 1.6 [MÉDIO] Logs expõem PII

`console.log('[notify] user logado:', user?.email)` em `/api/notifications/new-submission/route.ts`. Outros endpoints loggam email/IP.

**Ação**: Remover ou trocar por logger estruturado sem PII.

---

### 1.7 [MÉDIO] `.single()` sem tratamento de erro

56 ocorrências de `.single()` que ignoram o `error` retornado pelo Supabase. Em muitos endpoints, só checa `if (!data)` — quando o erro é de RLS/permissão, o user recebe 404 confuso.

**Ação**: Pattern consistente: `if (error) { console.warn(...); return ... }`

---

### 1.8 [MÉDIO] Casts duplos `as unknown as string` em embeddings

3 ocorrências em `/api/hunter/search-jobs` e `/api/admin/embeddings-backfill`. Sinal de tipos errados na fonte.

**Ação**: Tipar corretamente o retorno de `embedText()` e a coluna `embedding` (vector).

---

## 🟠 BLOCO 2 — UX & FLUXO

### Padrões globais

#### 2.1 [ALTO] Falta toast/confirmação após ações
Cliente aprova candidato, HR aprova submissão, hunter envia candidato — nenhum desses tem feedback visual claro de sucesso. Usuário fica em dúvida se ação foi salva, especialmente quando o `router.refresh()` demora.

**Ação**: Implementar sistema de toast global (sonner ou similar). Cada ação crítica dispara: "Candidato aprovado ✓", "Submissão enviada ao cliente ✓", etc.

#### 2.2 [ALTO] Sidebar sem indicador de página ativa
`/empresa/vagas/123` — sidebar não destaca que "Minhas vagas" é a seção atual.

**Ação**: Highlight no item ativo via `usePathname()` + `aria-current="page"` no `DashboardShell`.

#### 2.3 [ALTO] Sem breadcrumb em telas profundas
`/empresa/vagas/123/candidatos/456` — só tem link "Voltar". Confuso saber pra onde voltar.

**Ação**: Componente `<Breadcrumb>` reutilizável (já tem padrão de back link, agora estender).

#### 2.4 [ALTO] Loading states inconsistentes
Botões mostram `loading` state mas algumas operações async (signup → onboarding) redirecionam sem feedback intermediário.

**Ação**: Skeleton de transição em redirecionamentos lentos + spinner inline em todos forms.

---

### Empresa (company_user)

#### 2.5 [ALTO] Sidebar promete "Candidatos" — mas é uma coisa diferente das "Candidatos da vaga"
Sidebar tem `/empresa/candidatos` (lista global de submissões pendentes). Mas dentro de cada vaga há `/empresa/vagas/[id]/candidatos`. Mesma palavra, contextos diferentes. Usuário confunde.

**Ação**: Renomear sidebar pra "Para avaliar" ou "Submissões pendentes". Mantém "Candidatos" só no contexto da vaga.

#### 2.6 [MÉDIO] Empty state em "Candidatos da vaga" não explica que HR está curando
Empresa abre vaga, ainda não tem candidatos. Mensagem genérica "Aguardando primeiros candidatos" — devia dizer "HR está curando 5 candidatos enviados por hunters" se houver submissões em status anterior.

#### 2.7 [MÉDIO] Onboarding sem feedback de erro
Se a criação da empresa falhar (network, RLS), user fica no form sem feedback claro do que aconteceu.

#### 2.8 [MÉDIO] `ClientCandidateActions` confunde "review" e "schedule"
Componente tem dois modos mas UI quase idêntica. Campo "Motivo (opcional)" não diz se é motivo de rejeição ou observação geral.

---

### Hunter (recruiter)

#### 2.9 [ALTO] Pós-signup do hunter é dead-end
Após signup, hunter recebe tela com status (auto_approve / needs_review / reject) mas:
- Se aprovado, botão vai pra `/hunter` mas não diz "Pronto, pode enviar candidatos agora"
- Se "needs_review", link manda pra login (não pra dashboard)
- Se rejected, sem orientação clara

**Ação**: 3 telas de saída diferentes com CTA claro pra cada caso.

#### 2.9b [ALTO] Limite de envios não é avisado antes
Hunter só descobre `2/3 slots` ao abrir a vaga. Lista de vagas (`/hunter/vagas`) não mostra ocupação.

**Ação**: Badge no card da vaga: "1 slot disponível" ou "Limite atingido".

#### 2.10 [MÉDIO] Empty state em vagas não explica restrição de nível
Hunter "Beginner" não vê vagas "specialist+". UI fala "Nenhuma vaga disponível" — não diz "Suba pra Especialista pra desbloquear mais 12 vagas".

#### 2.11 [MÉDIO] Sem feedback claro após envio do candidato
Submissão é salva, página re-renderiza, mas não há toast confirmando + sem CTA pra "Acompanhar em Minhas submissões".

---

### HR Manager

#### 2.12 [ALTO] Ordem "Vagas → Submissões" no sidebar não é óbvia
HR vê "Vagas" (revisar JDs antes de abrir) e "Submissões" (curar candidatos). Quem é primeiro? Quem depende de quem?

**Ação**: Renomear: "Aprovar vagas" e "Curar candidatos" (verbos + ordem).

#### 2.13 [ALTO] CTA "Analisar com IA" pequeno demais
Card de IA na detalhe da submissão é tímido. HR pode passar batido e aprovar sem rodar IA.

**Ação**: Hero do card quando status é `submitted`. Mostrar histórico de re-análises.

#### 2.14 [MÉDIO] Status labels diferentes entre /hr/vagas e /hr/submissoes
Vagas: `pending_hr_review`, `open_for_hunters`. Submissões: `submitted`, `hr_approved`. Labels não conversam.

#### 2.15 [MÉDIO] /hr/clientes existe no sidebar mas rota provavelmente não existe
Sidebar promete, rota não criada (verificar).

---

### Admin

#### 2.16 [MÉDIO] Sidebar tem "Curadoria (HR)" apontando pra `/hr/vagas`
Confuso — é rota de HR, não admin.

**Ação**: Remover ou renomear pra "Revisar como HR".

#### 2.17 [BAIXO] Empty states em empresas/hunters recentes não educam
"Nenhuma empresa cadastrada" — admin não sabe se precisa convidar, esperar signup, etc.

#### 2.18 [BAIXO] Consumo de IA sem snapshot no dashboard
Admin tem `/admin/ai-usage` mas dashboard `/admin` não mostra "consumo último 30d".

---

### Candidate

#### 2.19 [MÉDIO] "Complete seu perfil" não justifica
Card pedindo CV não diz por que (matching, ranking, visibilidade).

#### 2.20 [BAIXO] Grid 2-col quebra em mobile
`/candidato/page.tsx` grid de vagas fica apertado em telas pequenas.

---

## 🟡 BLOCO 3 — TECH DEBT

### 3.1 [ALTO] 300+ usos de CSS legacy `--color-*` em 19 arquivos
Design system v2.0 introduziu `--text-1/2/3/4`, `--bg-*`, `--border-*`, `--accent-*`. Mas vários arquivos ainda usam `--color-text`, `--color-muted`, `--color-cream`, `--color-m100`, `--radius-md`.

**Top ofensores:**
1. `src/app/(dashboard)/hr/submissoes/[id]/page.tsx` — 51 ocorrências
2. `src/app/(dashboard)/empresa/vagas/page.tsx` — 18
3. `src/components/jobs/JobFilters.tsx` — 17
4. `src/components/submissions/SubmitCandidateForm.tsx` — 16
5. `src/app/(dashboard)/empresa/page.tsx` — 14

**Ação**: Migração em lotes. O `globals.css` mantém os aliases (var antiga aponta pra nova), então o app não quebra — mas dificulta consistência.

### 3.2 [MÉDIO] 7 `console.log` em produção
6 em `/api/notifications/new-submission/route.ts` + 1 em `lib/email/send.ts`.

**Ação**: Remover ou trocar por logger estruturado (Pino).

### 3.3 [MÉDIO] 6 `text-red-500` hardcoded
Em `AIAnalyzeButton`, `ClientCandidateActions`, `HRSubmissionActions`, `HRJobActions`.

**Ação**: Trocar por `var(--danger-text)` ou componente `<FormError>`.

### 3.4 [MÉDIO] `.single()` sem tratamento (56 ocorrências)
Já listado em segurança 1.7.

### 3.5 [BAIXO] README.md é template do Next.js
Sem info sobre o projeto, stack, como rodar.
**Ação**: Reescrever nesta sessão.

### 3.6 [BAIXO] Sem testes automatizados
0 testes (já reconhecido no backlog). Aceitável no MVP. Quando time crescer, vira blocker.

---

## 🟢 BLOCO 4 — FUNCIONALIDADES FALTANTES

### 4.1 [ALTO] Cron SLA (lembretes automáticos)
Sem isso, candidato morre na fila e ninguém é avisado. Daniel já pediu pra fazer depois.

### 4.2 [ALTO] Suspensão automática de hunter
Sprint 10 pendente: cron diário que suspende hunter abaixo do score mínimo ou com duplicidades excessivas.

### 4.3 [ALTO] Template de email custom (depende de domínio Resend verificado)
Hoje emails vêm sem identidade visual Nexhire — afeta confiança.

### 4.4 [MÉDIO] Filtros avançados pra hunter no marketplace
Área, salário mín/máx, prazo restante, exclusividade. Hoje só lista cronológica + busca semântica.

### 4.5 [MÉDIO] Página pública de vagas `/vagas`
Candidato aplica direto sem login (capta demanda orgânica + SEO).

### 4.6 [MÉDIO] Geração de JD assistida (IA)
"Gerar com IA" no form de criar vaga. Já existe `generateJobFromBrief` no backend — falta integrar no JobForm (existe `JobFromBriefFlow.tsx` — verificar se está plugado).

### 4.7 [MÉDIO] Ranking de candidatos por vaga IA — segundo nível
Já existe shortlist (`/hr/vagas/[id]/shortlist`). Falta UI de "aprovar/reprovar em lote" + comparação ao vivo.

### 4.8 [MÉDIO] Onboarding tour interativo (não só WelcomeCard)
Tooltips contextuais percorrendo a UI no primeiro acesso (Intro.js ou Driver.js).

### 4.9 [MÉDIO] Avatares de candidato e empresa
Logo da empresa pronto. Falta: avatar do user (perfil), avatar de candidato (gerado por nome ou upload).

### 4.10 [MÉDIO] Notificações: preferências por tipo
Permitir desligar tipos específicos de email/in-app.

### 4.11 [BAIXO] Analytics PostHog
Sem isso não dá pra responder "quantos hunters viram a vaga vs enviaram candidato".

### 4.12 [BAIXO] Email de boas-vindas
Primeiro contato após signup.

### 4.13 [BAIXO] Avaliações bidirecionais
HR avalia hunter, hunter avalia HR, cliente avalia processo.

### 4.14 [BAIXO] Programa de afiliados
Empresa/hunter indica → ganha bônus em primeira contratação.

### 4.15 [BAIXO] Matching ativo (push de vagas pro hunter)
Email semanal personalizado pelas especialidades do hunter.

---

## Próximos passos

1. **Daniel valida este documento** e prioriza
2. Sprint 11 (1 semana): segurança crítica + UX globais (toasts, sidebar ativo, breadcrumb)
3. Sprint 12 (1 semana): Cron SLA + fluxos polidos por papel
4. Releases seguintes seguem prioridades acima

### Como manter este documento

- Atualizar quando feature é entregue → mover de "Faltantes" pra changelog
- Adicionar quando descobrir novo problema durante uso
- Versão é a data no topo
