# BACKLOG — Nexhire AI

Documento vivo de produto. Reúne tudo que está fora do MVP atual e deve ser construído nas próximas iterações.

**Última atualização:** 26/05/2026
**Estado do MVP:** Sprints 1-7 e 9 concluídas. Sprint 8 (Parte 1: emails) concluída. Sprint 10 em andamento.
**URL produção:** https://nexhireapp.vercel.app
**Repositório:** github.com/nexcodevs/nexhire

---

## Como ler este documento

Cada item tem:
- **Prioridade** — P0 (bloqueia produção), P1 (precisa antes de escalar), P2 (importante mas pode esperar), P3 (nice-to-have)
- **Esforço** — em horas estimadas (S = <2h, M = 2-8h, L = 8-24h, XL = >24h)
- **Impacto** — em quem afeta (Empresa, Hunter, HR, Candidato, Operação interna)
- **Origem** — de onde veio (PRD, descoberta no desenvolvimento, conversa)

---

## P0 — Bloqueadores para deploy em produção

Itens obrigatórios antes de mostrar o produto para qualquer cliente real.

### Rodar SQL do bucket `cvs` no Supabase
- **Esforço:** S (5min) · **Impacto:** Hunter, IA
- Arquivo: `supabase/migrations/20260528_cvs_storage.sql`
- Sem isso o upload de CV no `SubmitCandidateForm` falha silenciosamente (RLS bloqueia, mas o erro pode passar despercebido).
- Rodar em SQL Editor: https://supabase.com/dashboard/project/ahbpnufpyqcqdldhbxbl/sql/new

### Template custom de email "Esqueci minha senha" via Resend
- **Esforço:** M (2-3h) · **Impacto:** Todos (UX)
- **Depende:** domínio verificado no Resend (item abaixo).
- Hoje o email de recuperação vem do template padrão do Supabase, sem identidade visual Nexhire.
- Plano:
  1. Configurar SMTP custom no Supabase Auth apontando pro Resend, OU
  2. Substituir o fluxo: `resetPasswordForEmail` direto pra `/api/auth/forgot-password` (route handler nosso) → gera token único + salva em tabela `password_resets` → envia email via Resend com template estilizado → `/reset-password?token=xxx` valida e atualiza senha via service role.
- Opção (2) é mais controle, mais código. Opção (1) é mais simples mas amarra ao limite do Supabase.

### Verificar domínio no Resend
- **Esforço:** S (30min) · **Impacto:** Todos
- Hoje os emails saem de `onboarding@resend.dev` e só chegam em `daniel@nexco.cc` (limitação do plano free Resend).
- Verificar `nexco.cc` (ou `nexhire.com.br`) em https://resend.com/domains
- Trocar `EMAIL_FROM` no `.env.local` e nas variáveis do Vercel para `noreply@nexhire.com.br`

### Variáveis de ambiente em produção (Vercel)
- **Esforço:** S (15min) · **Impacto:** Operação
- Adicionar no Vercel (production + preview):
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
  - `EMAIL_REPLY_TO`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL=https://nexhireapp.vercel.app`

### Reativar RLS na tabela `candidates`
- **Esforço:** S (1h) · **Impacto:** Segurança
- Foi desabilitada na Sprint 4 para destravar inserts dos hunters (`alter table public.candidates disable row level security`).
- Recriar políticas que permitam:
  - Recruiters aprovados inserirem candidatos
  - Recruiters lerem só os candidatos que enviaram
  - HR Managers e Admins lerem todos
  - Companies lerem só candidatos enviados a vagas suas
- Testar todos os fluxos depois de reativar.

### Resolver instabilidade do ISP Brasil → Supabase
- **Esforço:** N/A · **Impacto:** Desenvolvimento
- Ticket aberto no Supabase desde 14/05/2026 sem resolução.
- Workaround atual: Cloudflare WARP ou hotspot do celular durante desenvolvimento.
- Não afeta usuários finais (problema é só do nosso ambiente local).

### Fluxo "Esqueci minha senha"
- **Status:** ✅ Resolvido em 2026-05-28 (Bloco 0)
- Páginas `/forgot-password` e `/reset-password` implementadas. `resetPasswordForEmail` + `updateUser`. Link no `LoginForm`. Componente `AuthLayout` extraído. Standards de design + a11y aplicados.
- Email usa template padrão do Supabase. Trocar pra template Resend customizado é nice-to-have (P3).

### Rate limit reforçado em fluxos sensíveis
- **Prioridade:** P0 · **Esforço:** S (1-2h) · **Impacto:** Segurança
- Supabase Auth já aplica ~4 emails/h por endereço em `resetPasswordForEmail`. Os standards pedem **3/h por email** em `/forgot-password` e **5/min por IP** em login.
- Pra fechar o gap, adicionar camada com Upstash Redis (instalar `@upstash/ratelimit` + `@upstash/redis`) ou KV equivalente na Vercel.
- Aplicar em: `POST /forgot-password` (3/h por email), `POST /login` (5/min por IP), `POST /signup` (3/h por IP).

---

## P1 — Sprint 8 (partes 2 e 3) — Notificações que pulsam o produto

Sem isso o produto fica passivo. Construir antes dos primeiros 5 clientes pagantes.

### Parte 2 — Lembretes de SLA via cron
- **Esforço:** M (2-3h) · **Impacto:** HR, Empresa, Hunter
- **Por que importa:** sem cobrança ativa, candidato morre na fila e cliente perde interesse.
- Implementar:
  - HR notificado se submissão fica >2 dias parada (status `submitted` ou `ai_analyzed`)
  - HR notificado quando candidato é aprovado e ainda não foi enviado ao cliente
  - Empresa notificada se candidato fica >3 dias sem decisão (status `sent_to_client`)
  - Hunter notificado se prazo da vaga termina em <24h e ele ainda tem slots disponíveis
- **Stack sugerida:** Vercel Cron (mais simples) ou Supabase pg_cron (mais robusto)
- **Templates de email:** reaproveitar estrutura de `src/lib/email/templates/` que já existe

### Parte 3 — Google Calendar + agendamento de entrevistas
- **Esforço:** L (8-12h) · **Impacto:** Empresa, Candidato, HR
- **Por que ficou pra depois:** OAuth Google adiciona complexidade alta. Até ter 5+ clientes ativos, agendamento manual via email funciona.
- Implementar:
  - Quando cliente clica "Aprovar para entrevista", abrir modal de agendamento
  - Sugerir horários disponíveis (usar `suggest_time` API)
  - Criar evento no Google Calendar com Google Meet link
  - Mandar convite pra candidato + cliente + HR
  - Sync bidirecional (se evento é cancelado no Calendar, atualizar no Nexhire)
  - Tela do HR com calendário visual de entrevistas agendadas

---

## P1 — Sprint 10 — Ranking de Hunters

**Status:** ✅ Núcleo entregue em 2026-05-29.

- [x] Função SQL `refresh_recruiter_score(p_recruiter_id)` — calcula HR rate (peso 40%), cliente rate (35%), contratações até 5 (20pts) e volume até 30 envios (5pts) → overall_score 0-100. Aplica nível: top_hunter (≥30 envios + score≥80 + ≥5 hires), specialist (≥10 envios + score≥60), beginner. Propaga `level` pra `recruiters`.
- [x] Trigger `trg_submissions_refresh_score` em `submissions` (after insert / after update of status) — score atualiza em tempo real.
- [x] Função `refresh_all_recruiter_scores()` pra rebuild global.
- [x] Endpoint `/api/admin/recompute-scores` (admin only) + botão "Recalcular scores" em `/admin/hunters`.
- [x] Painel do hunter com score, nível, progresso pro próximo nível e comparativo com média (já existia, agora alimentado pela função).
- [x] Filtro de visibilidade na criação/revisão de vaga (já existia: `visibility_type`).
- [x] Leaderboard `/hunters/ranking` (top 20, pseudônimo determinístico "Hunter #ABC", próprio user vê nome real).
- [x] Mecânica de progressão Iniciante → Especialista → Top Hunter (regras na função SQL).
- [ ] **Pendente (P2):** suspensão automática (cron diário ou trigger) se hunter ultrapassar limite de duplicidades ou cair abaixo de score mínimo durante N envios.

---

## P1 — Bugs descobertos durante desenvolvimento

### Contador de envios do hunter está errado
- **Status:** ✅ Resolvido em 2026-05-29
- `activeCount` em `hunter/vagas/[id]/page.tsx` filtra apenas status ativos: `submitted`, `ai_analyzed`, `hr_approved`, `sent_to_client`, `client_approved`, `interview_scheduled`, `offer`, `hired`. Rejeitados/duplicados liberam o slot.

### Pasta de criação de vaga fora do padrão
- **Status:** ✅ Resolvido em 2026-05-28 (Bloco 0)
- Movido `src/app/(dashboard)/empresa/nova-vaga/` para `src/app/(dashboard)/empresa/vagas/nova/`. Pasta duplicada `vagas/_nova/` removida. Links atualizados em `empresa/page.tsx` e `empresa/vagas/page.tsx`.

### Duplicação de pasta de IA
- **Status:** ✅ Resolvido em 2026-05-28 (Bloco 1)
- `src/lib/ai/analyse/` removida. `src/lib/ai/analyze.ts` é o único módulo. Rota ativa: `src/app/api/ai/analyze/route.ts`.

### Reset de senha não acessível pelo painel Supabase
- **Status:** ✅ Resolvido em 2026-05-28 (Bloco 0)
- Páginas `/forgot-password` e `/reset-password` criadas com fluxo `resetPasswordForEmail` + `updateUser`. Link "Esqueci minha senha" adicionado no `LoginForm`.

### Notes do HR e feedback do cliente não estavam salvando
- **Status:** ✅ Resolvido na Sprint 8
- Os campos de texto livre (`hr_notes` em `HRSubmissionActions`, `client_feedback` em `ClientCandidateActions`) eram capturados mas não persistidos no banco. Corrigido com inclusão no payload do `update()` e novas colunas em `submissions`.

---

## P1 — Sprint Visual (pós-deploy do MVP funcional)

Decisão de 2026-05-28: o produto está funcional mas operacionalmente simples. Após Blocos 4-6 e deploy, fazer sprint dedicada de polish visual antes de mostrar pra cliente real.

### Kanban com identidade visual mais forte
- **Esforço:** M (4-6h) · **Impacto:** HR, Empresa (decisão)
- Hoje as colunas são funcionais mas neutras (fundo cream, cards brancos, dots de status).
- Sugestões:
  - Headers de coluna com fundo gradiente sutil por status (mint pra recebidos, dark pra hired)
  - Cards com micro-avatares maiores, mais respiro entre eles
  - Ícones inline em cada coluna (lucide) — recebidos = inbox, hired = check, etc.
  - Animação de transição quando mover (vai junto com drag-drop)
  - Empty states com ilustrações sutis em vez de texto italic

### `/empresa/candidatos/[id]` com gráficos e IA expandida
- **Status parcial:** ✅ Em 2026-05-29 adicionados:
  - Card "Avaliação do hunter" destacado (`jd_priorities` + `hunter_score` em escala /10 + `hunter_score_rationale`)
  - Card "Análise da IA (curadoria interna)" com `ai_score`/100 + `ai_summary` + badges de `ai_gaps` (yellow) e `ai_risks` (red)
  - Link "Abrir PDF" do CV na sidebar de contato (signed URL 10min)
- **Pendente (P3):**
  - Radar chart de `fit_tecnico` / `fit_senioridade` / `fit_comportamental` — exige migration pra persistir esses campos no `analyzeCandidate` (hoje só vivem na resposta IA, não são salvos)
  - Tabs (Visão / IA / Hunter / Histórico) — sem necessidade urgente, layout em colunas dá conta
  - CV PDF inline com pdf-viewer (hoje abre em nova aba via signed URL)
  - Timeline visual com ícones

### Outras telas operacionais com mais densidade visual
- **Esforço:** M (4-6h cada) · **Impacto:** HR, Hunter
- `/hr/submissoes/[id]` com tabs e gráficos similares
- `/hr/submissoes` (fila) hoje é tabela simples — virar lista de cards visuais
- `/hunter/vagas` cards de vaga com mais hierarquia visual (badge premium pra exclusivas, etc.)

---

## P2 — Melhorias de produto

### Upload de CV em PDF/DOCX
- **Status:** ✅ Resolvido (PDF) em 2026-05-28 (Bloco 1)
- Bucket `cvs` privado criado com RLS por role. Componente `CVUpload` em `components/submissions/`. Parse via `pdf-parse` integrado ao `analyzeCandidate`. Link "Ver CV" (signed URL 5min) na página `/hr/submissoes/[id]`.
- Decisão MVP: aceitar **apenas PDF**. Suporte a DOCX (mammoth) fica como nice-to-have P3.
- Visualização para empresa (no `/empresa/vagas/.../candidatos/...`) será adicionada quando aquela página ganhar a sidebar com contato.

### `/empresa/vagas/[id]/page.tsx` está com lógica de hunter (broken)
- **Status:** ✅ Resolvido (verificado em 2026-05-29)
- A página já foi reescrita: `EmpresaVagaDetailPage` consulta `company_users`, exige match de `company_id`, renderiza `PageHeader` + descrição + funil de candidatos (recebidos/aguardando/entrevista/contratado) + sidebar com detalhes (salário, contrato, modalidade, prazo, limite por hunter). Botões "Ver candidatos" e "Ver pipeline" no header. Sem lógica de hunter.

### Refactor do SubmitCandidateForm pra design system completo
- **Prioridade:** P2 · **Esforço:** S (1h) · **Impacto:** Manutenção, a11y
- Form hoje tem várias cores hex hardcoded (`#374151`, `#16A34A`, `#E5E7EB`, `#9CA3AF`, `#FFFBEB`, `#FDE68A`, `#92400E`, etc.) e `<textarea>` estilizado inline em vez de componente do design system.
- Tarefas:
  - Extrair componente `Textarea` em `components/ui/` seguindo padrão do `Input` (label htmlFor, aria-invalid, aria-describedby, asterisco vermelho)
  - Trocar hex por `var(--color-...)` em todo o form
  - Trocar erro inline por `<FormError>`
  - Trocar success card por padrão `role="status"` consistente com outros forms
- Bloco 0/1 deixou intencionalmente pra preservar diff mínimo.
  - Cliente vê botão "Baixar CV" no perfil curado

### Notificações in-app (sino com badge)
- **Status:** ✅ Resolvido em 2026-05-29
- Migration `20260530_notifications.sql` cria tabela com RLS (user lê/atualiza só suas; inserts via service_role) e habilita Realtime.
- Helper `src/lib/notifications.ts` com `notifyUser` e `notifyUsers` (fail-safe).
- 4 endpoints `/api/notifications/*` agora inserem in-app em paralelo ao email (`new_submission`, `job_opened`, `candidate_sent_to_you`, `client_decision`).
- `NotificationBell` virou clicável: cada item é Link pro `notification.link`, marca como lida ao clicar (`markOneRead`), tempo relativo ("há 2h"), realtime via canal `postgres_changes` filtrado por user_id.

### Página de perfil do usuário
- **Status:** ✅ Parcial em 2026-05-29
- `/perfil` permite editar nome e trocar senha (com reauth via senha atual).
- **Pendente (P3):** upload de avatar, telefone na `users` (precisa migration), preferências granulares de notificação.

### Avatar/logo da empresa
- **Status:** ✅ Resolvido em 2026-05-29
- Migration `20260530_company_branding.sql` adiciona coluna `logo_url` em `companies` e cria bucket público `company_logos` (path `{company_id}/logo-{ts}.ext`). Upload restrito a `company_users` da empresa.
- Componentes `LogoUpload` (preview + upload) e `CompanyAvatar` (mostra logo ou iniciais). Página nova `/empresa/configuracoes` edita logo + dados da empresa. Cards de vaga em `/hunter/vagas` exibem `CompanyAvatar`.

### Filtros avançados no marketplace de hunters
- **Esforço:** M (3h) · **Impacto:** Hunter
- Hoje só lista vagas abertas em ordem cronológica.
- Adicionar filtros: área, senioridade, modelo de trabalho, faixa salarial, exclusividade (só vagas pra mim).

### IA: geração de Job Description assistida
- **Status:** Especificada no PRD mas não implementada
- **Esforço:** M (3h) · **Impacto:** Empresa, HR
- Botão "Gerar com IA" no formulário de criação de vaga.
- Empresa preenche cargo, senioridade, área e requisitos brutos → IA gera descrição completa, responsabilidades, diferenciais, perguntas recomendadas.

### IA: sugestão de perguntas para hunter
- **Status:** Especificada no PRD mas não implementada
- **Esforço:** M (2-3h) · **Impacto:** Hunter, HR
- Quando hunter clica em "Enviar candidato", IA sugere roteiro de entrevista personalizado com base na vaga.
- Aumenta qualidade do resumo da entrevista → aumenta qualidade da análise da IA.

### IA: identificação de duplicidade inteligente
- **Status:** ✅ Parcialmente resolvido em 2026-05-29
- `POST /api/candidates/check-duplicate` cruza email (lowercase), phone (só dígitos, sem código país BR), LinkedIn (username canônico) e retorna lista de matches enriquecida com último envio (hunter, vaga, status, ownership_expires_at). `SubmitCandidateForm` faz polling debounced (500ms) e exibe `DuplicateWarning` com 3 tons: bloqueante (mesma vaga), alerta (ownership ativo de outro hunter), informativo (já existe).
- **Pendente (P3):** matching fuzzy de nome (similaridade, ex: pg_trgm) pra capturar "João Silva" vs "Joao da Silva". Hoje cobertura é determinística (email/phone/linkedin) — bom o bastante pra 90%+ dos casos.

### IA: ranking automático de candidatos por vaga
- **Status:** ✅ Resolvido em 2026-05-29
- Página `/hr/vagas/[id]/shortlist` lista candidatos ordenados por `ai_score` desc (nulls last), com badge visual de score (top match ≥75, médio ≥50, fraco <50), ai_summary, gaps (yellow) e risks (red), hunter score, link pra detalhe da submissão. Botão "Ver shortlist IA →" no card de submissões da `/hr/vagas/[id]`. Pendente (P3): ações de aprovar/reprovar em lote.

### Página pública de vagas (`/vagas`)
- **Esforço:** M (3-4h) · **Impacto:** Candidato, Crescimento
- Página pública listando todas as vagas abertas (sem precisar login).
- Candidato pode aplicar direto via formulário simples → vira `candidate` na base + cria submissão atribuída a "hunter interno" (a própria Nexhire).
- Ajuda SEO e captura demanda orgânica.

### Onboarding guiado por papel
- **Status:** ✅ Parcial em 2026-05-29
- `WelcomeCard` aparece no topo dos dashboards de cada papel (empresa, hunter, HR, admin) com 3 passos clicáveis. Dispensável via localStorage (`nx-welcome-dismissed-{userId}`), persistido por usuário no browser.
- **Pendente (P3):** tour interativo com tooltips contextuais (Intro.js ou similar) percorrendo páginas; checklist de "perfil completo" pro hunter.

---

## P2 — Crescimento e operação

### Página de "Como funciona" no site institucional
- **Status:** PRD lista a página mas o site atual (nexhire-mu.vercel.app) não tem.
- **Esforço:** S (2h) · **Impacto:** Empresa, Hunter
- Página visual explicando o fluxo end-to-end com ilustrações ou screenshots reais.

### Página de "Sobre" no site institucional
- **Status:** Existe no site mas precisa de revisão de copy + adição de equipe.

### Página de "Blog"
- **Status:** Existe no site mas vazia.
- **Esforço:** L (depende do volume de conteúdo) · **Impacto:** Crescimento (SEO, autoridade)
- Decidir engine: usar Markdown no próprio Next.js, ou CMS externo (Sanity, Contentful).

### Página de "FAQ"
- **Status:** Existe no site, conteúdo precisa ser revisado conforme o produto evolui.

### Analytics de produto (PostHog ou Mixpanel)
- **Esforço:** M (2-3h) · **Impacto:** Operação
- Hoje não tem rastreamento de funil. Não dá pra responder "quantos hunters viram a vaga e quantos enviaram candidato?"
- Implementar PostHog (free tier generoso, self-hostable).
- Eventos prioritários: signup, view_job, submit_candidate, hr_approve, send_to_client, client_approve, hire.

### Email transacional de boas-vindas
- **Esforço:** S (1h) · **Impacto:** Empresa, Hunter, Candidato
- Quando alguém cria conta, mandar email de boas-vindas explicando próximos passos por papel.

### LGPD — política de privacidade e termos de uso
- **Esforço:** M (consulta jurídica + implementação) · **Impacto:** Compliance
- Páginas `/privacidade` e `/termos` no site.
- Checkbox de aceite no signup.
- Direito ao esquecimento: fluxo do usuário pedir exclusão de dados.

---

## P3 — Funcionalidades avançadas

### Múltiplos usuários por empresa
- **Esforço:** L (8-10h) · **Impacto:** Empresa
- Hoje `company_users` já é tabela separada (preparada), mas não tem fluxo de convite.
- Implementar: empresa convida outros membros via email, define papel (admin, member, viewer).

### Múltiplas empresas por usuário
- **Esforço:** L (6-8h) · **Impacto:** Empresa
- Caso: consultor que atende várias empresas. Switch de empresa no header.

### API pública para empresas
- **Esforço:** XL · **Impacto:** Empresa, Integração
- Empresa abre vaga via API a partir do próprio ATS (Greenhouse, Lever).
- Webhook quando vaga muda de status.

### Marketplace internacional (multi-currency, multi-language)
- **Esforço:** XL · **Impacto:** Crescimento
- Visão de longo prazo (Estratégia geográfica: Brasil → LatAm → Global).
- i18n com next-intl.
- Faixas salariais em múltiplas moedas.
- Pagamentos internacionais via Wise/Deel.

### Programa de afiliados
- **Esforço:** L · **Impacto:** Crescimento
- Hunter ou empresa indica nova empresa e ganha bônus quando ela fechar primeira contratação.

### Sistema de avaliações bidirecionais
- **Esforço:** L · **Impacto:** Confiança
- HR avalia hunter (qualidade dos envios), hunter avalia HR (clareza dos briefings, agilidade), cliente avalia processo geral.
- Influencia score do hunter.

### IA: matching ativo (push de vagas para hunters)
- **Esforço:** L · **Impacto:** Hunter, Empresa
- Hoje hunter precisa abrir a plataforma para ver vagas.
- IA cruza especialidades do hunter com vagas abertas e manda push proativo (email semanal "7 vagas pra você").

### IA: embeddings para matching CV ↔ vaga
- **Status:** Mencionado na arquitetura técnica como visão futura
- **Esforço:** L · **Impacto:** Qualidade da curadoria
- Indexar CVs com embeddings (OpenAI text-embedding-3-small ou similar).
- Quando empresa abre vaga, sistema sugere candidatos já na base (talent pool reaproveitamento).

---

## P3 — Infraestrutura e qualidade de código

### Logs estruturados
- **Esforço:** S (2h) · **Impacto:** Operação
- Substituir `console.log` por Pino com níveis (info, warn, error) e contexto.
- Especialmente nas rotas `/api/notifications/*` e `/api/ai/analyze`.

### Rate limiting nas rotas de API
- **Esforço:** M (2-3h) · **Impacto:** Segurança
- Qualquer usuário logado pode bater nas rotas `/api/notifications/*` sem limite.
- Adicionar rate limiter (Upstash Ratelimit) — máximo X chamadas/minuto por usuário.

### Monitoramento e error tracking
- **Esforço:** S (1h) · **Impacto:** Operação
- Instalar Sentry (free tier).
- Capturar erros do server + client.

### Testes automatizados
- **Esforço:** XL · **Impacto:** Qualidade
- Hoje 0 testes. Aceitável no MVP, problema quando time crescer.
- Prioridade: testes E2E (Playwright) dos fluxos críticos:
  1. Signup → criar vaga → aprovar HR → liberar
  2. Hunter envia candidato → HR aprova → envia ao cliente → cliente aprova
- Depois: unit tests das funções de negócio (cálculo de score, ownership, deduplicação).

### Backup e disaster recovery
- **Esforço:** S (2h) · **Impacto:** Operação
- Configurar backup diário automático do Supabase (já existe no plano Pro, validar).
- Documentar processo de restore.

---

## Polidura visual (fim do MVP)

Decidido na conversa: polir o visual **depois** de todas as sprints, para não retrabalhar.

- [ ] Pass de design em todas as telas do dashboard
- [ ] Padronizar espaçamentos (8px grid)
- [ ] Padronizar hierarquia tipográfica
- [ ] Estados vazios mais ricos (illustrações, CTAs claros)
- [ ] Loading states consistentes (skeletons)
- [ ] Estados de erro consistentes
- [ ] Microinterações (Framer Motion) em ações-chave
- [ ] Modo escuro (P3)
- [ ] Mobile responsivo de verdade (hoje funciona mas não é otimizado)

---

## Decisões registradas

Decisões importantes tomadas no processo que precisam ser lembradas:

1. **Stack:** Next.js (App Router) + Supabase + Vercel + Tailwind + shadcn/ui
2. **Polidura visual fica pro fim** — construir tudo primeiro, polir depois
3. **Resend para emails** — limite do plano free é mandar só pro email da conta (`daniel@nexco.cc`)
4. **Sprint 8 Parte 3 (Google Calendar) adiada** — fazer só com 5+ clientes ativos
5. **Sprint 10 vem antes de polir e antes do Google Calendar** — meritocracia do marketplace é mais importante que agendamento automático
6. **Cliente não fala diretamente com hunter** (regra de negócio do PRD) — toda comunicação passa pelo HR Manager
7. **Ownership do candidato:** 60 dias a partir do primeiro envio válido
8. **Limite padrão:** 3 candidatos por hunter por vaga, prazo de 7 dias
9. **HR Manager precisa aprovar manualmente** novos hunters antes deles enviarem candidatos
10. **Análise de IA precisa ser revisada por humano** — IA não decide, IA apoia