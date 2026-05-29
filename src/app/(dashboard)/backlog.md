# BACKLOG — Nexhire AI

**Última atualização:** 2026-05-29
**Estado do MVP:** Deploy em produção (https://nexhireapp.vercel.app) com Sprint B (IA-native) + Sprint 10 (ranking de hunters) + hardening pré-deploy entregues.

Esse documento é **histórico curto** e **lista de itens vivos** que não estão na auditoria. Pra ver gaps atuais por prioridade, vai pra [AUDIT.md](../../../AUDIT.md).

---

## Estado atual (o que está funcionando em produção)

### Auth & Onboarding
- Login/signup com escolha de papel (empresa, hunter, candidato)
- Forgot/reset password via Supabase (template padrão, sem branding ainda)
- Onboarding de empresa com aceite de TOS
- Rate limit em login (5/5min), signup (3/h), forgot-password (3/15min)

### Empresa
- Dashboard com KPIs + WelcomeCard primeiro acesso + InsightsCards IA on-demand
- Criar vaga (form padrão ou IA assistida via `JobFromBriefFlow`)
- Configurações da empresa: logo + dados (`/empresa/configuracoes`)
- Vagas listadas em `/empresa/vagas`, detalhe `/empresa/vagas/[id]`
- Candidatos da vaga com funil + ranking IA: `/empresa/vagas/[id]/candidatos`
- Detalhe do candidato: pitch IA on-demand + chat IA + hunter assessment + CV inline (`/empresa/candidatos/[id]`)
- Comparação de 2-4 candidatos (`/empresa/vagas/[id]/candidatos/comparar`)
- Bloqueio de hunters por empresa (`/empresa/hunters-bloqueados`)

### Hunter
- Signup com IA auto-approve (auto / needs_review / reject)
- Marketplace de vagas (`/hunter/vagas`) com filtros e busca semântica
- Detalhe da vaga + envio de candidato com:
  - Upload de CV (PDF)
  - Pré-fill IA do form (jd_priorities + score + roteiro de entrevista)
  - Voice recorder → transcrição Groq Whisper
  - Detecção de duplicidade (email/phone/linkedin)
- Painel com score, nível, progresso, comparativo com rede
- Leaderboard pseudonimizado (`/hunters/ranking`)

### HR
- Dashboard com KPIs
- Aprovação de vagas (`/hr/vagas`)
- Curadoria de submissões ordenada por AI score (`/hr/submissoes`)
- Análise IA da submissão (gera ai_score, ai_summary, ai_gaps, ai_risks)
- Shortlist por vaga (`/hr/vagas/[id]/shortlist`)
- Kanban de pipeline (`/hr/pipeline`)
- Gestão de hunters (`/hr/hunters`)

### Admin
- Visão da plataforma com KPIs globais
- Empresas e hunters (com botão "Recalcular scores")
- Audit log de ações sensíveis (`/admin/audit`)
- Consumo IA com custo USD+BRL (`/admin/ai-usage`)

### Cross-cutting
- Notificações in-app (sino com badge, dropdown, marca como lida, link clicável, Realtime)
- 4 templates de email (nova submissão, vaga liberada, candidato enviado, decisão cliente)
- Página `/perfil` (nome + senha)
- Tema claro/escuro
- Sidebar retrátil

---

## Próximas sprints

Ver [AUDIT.md](../../../AUDIT.md) → seção "Sumário executivo" pra priorização.

Resumo:

- **Sprint 11**: segurança crítica (RLS, notificações com ownership), UX globais (toast, sidebar ativo, breadcrumb), console.log
- **Sprint 12**: Cron SLA + polish nos fluxos por papel (hunter pós-signup, empresa "candidatos" vs "candidatos da vaga", HR menu ordering)
- **Sprint 13+**: features faltantes prioridade média (filtros marketplace, página pública /vagas, suspensão automática hunter, template email Resend custom, analytics PostHog, LGPD completo)

---

## Decisões registradas

Decisões importantes tomadas no processo que precisam ser lembradas:

1. **Stack**: Next.js (App Router) + Supabase + Vercel + Tailwind v4 + design system custom v2.0
2. **Polish visual depois de feature** — construir tudo primeiro, polir depois
3. **Resend para emails** — limite do plano free é mandar só pro email da conta (`daniel@nexco.cc`) até verificar domínio
4. **Sprint 8 Parte 3 (Google Calendar) adiada** — só com 5+ clientes ativos
5. **Sprint 10 (ranking) vem antes de polish visual e antes de Google Calendar** — meritocracia do marketplace é mais importante
6. **Cliente não fala diretamente com hunter** (regra do PRD) — toda comunicação passa pelo HR Manager
7. **Ownership do candidato**: 60 dias a partir do primeiro envio válido
8. **Limite padrão**: 3 candidatos por hunter por vaga, prazo de 7 dias
9. **HR Manager precisa aprovar manualmente** novos hunters (ou IA auto-aprovar se sinais fortes)
10. **Análise de IA precisa ser revisada por humano** — IA não decide, IA apoia
11. **Reset password**: fluxo tradicional via email link (não magic link)
12. **CV**: apenas PDF no MVP (PR pra DOCX é P3)
13. **Kanban estático** primeiro, drag-drop depois
14. **Google OAuth**: implementar quando chegar no momento (não em paralelo)
15. **Pré-deploy**: 7 migrations aplicadas em 2026-05-29 (ai_pitch_cache, ai_usage, notifications, company_branding, recruiter_scores, candidates_rls_hardening, semantic_search)

---

## Sprints concluídas

- **Sprint 0** — Setup inicial
- **Sprint 0.5** — Redução de fricção UX
- **Sprint 1-6** — Fluxo end-to-end funcionando
- **Sprint 7** — IA análise de candidatos
- **Sprint 8** — Notificações por email
- **Sprint 9** — Analytics e KPIs reais
- **Sprint A** — Portal admin + audit log
- **Sprint B (Big Bang IA-Native)** — 9 features de IA: pitch, comparação, Q&A, transcrição, busca semântica, prefill, geração de vaga, insights, assistente
- **Sprint 10** — Ranking de hunters
- **Pré-deploy** — RLS hardening, rate limit auth, deploy de produção, copy e visual de auth atualizados

---

## Como manter esse documento

- **Quando entregar feature nova**: move da seção "Próximas sprints" pra "Estado atual"
- **Quando registrar decisão de negócio**: adiciona em "Decisões registradas"
- **Quando descobrir gap durante uso**: registra em [AUDIT.md](../../../AUDIT.md), não aqui
- **Gaps/melhorias detalhados**: ficam em AUDIT.md (atualizado por sprint)
- **Mapa técnico**: fica em [ARCHITECTURE.md](../../../ARCHITECTURE.md)
