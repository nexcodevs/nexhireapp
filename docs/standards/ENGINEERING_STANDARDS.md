# ENGINEERING STANDARDS — NEXHIRE

> Padrões de código, arquitetura e práticas de engenharia. Toda contribuição segue este documento.
> Referências: Vercel engineering, Linear, Stripe, Next.js best practices.

---

## 1. FILOSOFIA DE ENGENHARIA

### Princípios não-negociáveis

**1. Código é lido 10x mais do que escrito.**
Otimize pra leitura. Variáveis nomeadas claramente, funções com uma responsabilidade, comentários explicando "por quê" (não "o quê").

**2. Simples é melhor que clever.**
Solução clever que economiza 3 linhas mas custa 10 minutos pra entender = código ruim.

**3. Não construa pra o futuro hipotético.**
YAGNI (You Aren't Gonna Need It). Construa pra o caso atual. Refatore quando o caso real aparecer.

**4. Erros são parte do design, não exceção.**
Todo fetch pode falhar. Todo input pode ser inválido. Todo usuário pode estar deslogado. Trate sempre.

**5. Tipos são documentação executável.**
Use TypeScript pra valer. Tipos fracos (`any`, `as any`) são bug em formação.

**6. Performance é uma feature.**
Lazy-load, parallel fetch, cache inteligente. Usuário que espera é usuário que sai.

**7. Segurança não é opcional.**
RLS, validação no servidor, sanitização. Frontend nunca é fonte de verdade.

---

## 2. STACK E DECISÕES TÉCNICAS

### Stack atual (decisões já tomadas — não questionar sem motivo forte)

```
Frontend:
  Next.js 16 (App Router, Server Components first)
  React 19
  TypeScript 5
  Tailwind CSS v4 (CSS-first config, @theme inline)

Backend:
  Supabase (Postgres + Auth + Storage + RLS)
  Server Actions / Route Handlers do Next.js
  Service role key apenas em código server-side, nunca exposto

Infraestrutura:
  Vercel (deploy automático via git push)
  Resend (email transacional)
  OpenAI API (análise de IA)
  GitHub (versionamento)

Estilo de código:
  TypeScript strict habilitado
  Sem ESLint warnings (zero tolerância)
  Prettier com config padrão
```

### Princípio de Server Components

**Default: Server Component.**
Use `'use client'` **apenas quando precisar de:**
- Estado local (`useState`)
- Efeitos (`useEffect`)
- Event handlers (`onClick`, `onChange`)
- Hooks de cliente (`useRouter`, `useSupabaseClient`)
- Browser-only APIs

**Antipadrão comum:** todo arquivo virar `'use client'` por preguiça. Cada `'use client'` aumenta o bundle.

**Padrão certo:** página é server component, formulários e botões interativos são client components isolados.

---

## 3. ESTRUTURA DE PASTAS

```
src/
  app/                          (rotas — App Router)
    (auth)/                     (rotas de autenticação, sem layout dashboard)
    (dashboard)/                (rotas autenticadas com sidebar)
      layout.tsx                (sidebar + autenticação)
      empresa/                  (rotas da role company_user)
      hunter/                   (rotas da role recruiter)
      hr/                       (rotas da role hr_manager + admin)
      candidato/                (rotas da role candidate)
    api/                        (route handlers)
      notifications/            (endpoints de email)
      auth/                     (login, logout, callbacks)

  components/
    ui/                         (design system — não dependem de domínio)
      Card.tsx
      Button.tsx
      Badge.tsx
      PageHeader.tsx
    auth/                       (componentes de autenticação)
    jobs/                       (componentes de vaga)
    submissions/                (componentes de submissão)
    candidates/                 (componentes de candidato)

  lib/
    supabase/
      client.ts                 (browser supabase client)
      server.ts                 (server supabase client com cookies)
      admin.ts                  (service role — bypassa RLS)
    ai/                         (lógica de IA, prompts, parsing)
    email/                      (Resend client + templates)
    validators/                 (Zod schemas)
    utils.ts                    (helpers: formatDate, formatCurrency, etc)
    visibility.ts               (regras de visibilidade de vagas)

  types/
    database.ts                 (tipos do Supabase, gerados ou manuais)
    domain.ts                   (tipos de domínio: Job, Submission, etc)

  middleware.ts                 (auth middleware + redirecionamento)
```

### Regras de organização

- **Uma responsabilidade por arquivo.** Se o componente tem >300 linhas, divida.
- **Componentes de domínio em `components/<dominio>/`**, não na raiz.
- **Componentes de UI em `components/ui/`** — sem dependência de domínio.
- **Lógica de negócio em `lib/`**, nunca dentro do componente.
- **Tipos compartilhados em `types/`**, não duplique em vários arquivos.

---

## 4. CONVENÇÕES DE NOMES

### Arquivos

```
PageComponent:   page.tsx (App Router)
Component:       PascalCase: JobCard.tsx
Hook:            camelCase prefixo "use": useJobFilter.ts
Helper:          camelCase: formatSalary.ts
Type:            PascalCase: Job.ts (ou em types/domain.ts)
Constants:       camelCase ou ALL_CAPS por arquivo
Test:            <name>.test.ts ou <name>.spec.ts
```

### Variáveis

```
const         para tudo que não muta (default)
let           apenas quando precisa mutar
var           NUNCA
function      pra funções nomeadas
const fn = () apenas quando precisa de closure ou inline em JSX
```

### Nomes semânticos

```
GOOD:                          BAD:
const isApproved               const flag1
const recruiterLevel           const lvl
const jobsByStatus             const obj
const handleApprove            const handler
function calculateScore()      function calc()
```

### Componentes

```
GOOD:                          BAD:
<JobCard />                    <Card type="job" />
<SubmissionList />             <List />
<HRApprovalActions />          <Actions />
```

---

## 5. TYPESCRIPT — REGRAS DURAS

### Strict mode obrigatório

`tsconfig.json` tem `"strict": true`. Não desabilite.

### Proibido

```typescript
// ❌ any explícito
function process(data: any) { ... }

// ❌ as any pra calar erro
const x = something as any

// ❌ // @ts-ignore pra burlar
// @ts-ignore
const broken = doStuff()

// ❌ any implícito (parameter without type)
function fn(x) { ... }   // x é any implícito
```

### Permitido com justificativa

```typescript
// OK em integrações com lib externa sem tipos
const result = (untypedLib as { data: User[] }).data

// OK quando você JÁ validou em runtime (Zod, etc)
const validated = userSchema.parse(input) as User
```

### Use Discriminated Unions pra estados

```typescript
// GOOD — type-safe
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

// BAD — propenso a bugs
type FetchState<T> = {
  loading: boolean
  data?: T
  error?: string
}
```

### Tipos de domínio centralizados

```typescript
// src/types/domain.ts
export type SubmissionStatus =
  | 'submitted'
  | 'ai_analyzed'
  | 'hr_approved'
  | 'hr_rejected'
  | 'sent_to_client'
  | 'client_approved'
  | 'client_rejected'
  | 'interview_scheduled'
  | 'offer'
  | 'hired'
  | 'not_hired'
  | 'duplicate'

export type Submission = {
  id: string
  job_id: string
  candidate_id: string
  recruiter_id: string
  status: SubmissionStatus
  ai_score?: number
  // ...
}
```

Nunca redeclare esses tipos em componentes.

---

## 6. PADRÕES DE COMPONENTES

### Estrutura padrão

```typescript
'use client'  // só se necessário

import { ... } from 'react'
import { ... } from 'next/navigation'
import { ... } from '@/components/...'
import { ... } from '@/lib/...'
import type { ... } from '@/types/domain'

interface Props {
  jobId: string
  onApprove?: () => void
}

export default function ApprovalCard({ jobId, onApprove }: Props) {
  // 1. Hooks (useState, useEffect, useRouter, etc)
  const [loading, setLoading] = useState(false)

  // 2. Derived state (computed values)
  const isReady = !loading

  // 3. Event handlers
  async function handleClick() { ... }

  // 4. Early returns (loading, error, empty)
  if (!jobId) return null

  // 5. Render
  return (
    <Card>...</Card>
  )
}
```

### Composição > Props infinitas

```typescript
// ❌ BAD — props explodem
<Card
  title="..."
  subtitle="..."
  icon="..."
  action={...}
  variant="..."
  showBadge
  badgeText="..."
  onCardClick={...}
/>

// ✅ GOOD — composição
<Card variant="mint">
  <Card.Header
    title="..."
    eyebrow="..."
    action={<Button>Aprovar</Button>}
  />
  <Card.Body>
    ...
  </Card.Body>
</Card>
```

### Componente que NÃO precisa ser re-renderizado: memoize

```typescript
// Pra listas grandes, componentes caros
const JobCard = memo(function JobCard({ job }: Props) {
  return ...
})
```

Mas **não memoize tudo por reflexo**. Custo de memoização > custo de re-render em componentes pequenos.

### Server Components — passar dados, não funções

```typescript
// ❌ Não dá pra serializar funções entre server e client
<JobList onJobClick={() => ...} />

// ✅ Use links ou client components no nível certo
<JobList jobs={jobs} />
// JobList usa <Link> ou client component interno
```

---

## 7. DATA FETCHING

### Server Components — fetch direto

```typescript
// ✅ Em Server Component
export default async function Page() {
  const supabase = await createClient()
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, companies(name)')
    .eq('status', 'open_for_hunters')

  return <JobList jobs={jobs ?? []} />
}
```

### Client Components — use libs apropriadas

Pra mutações: Server Actions ou Route Handlers.
Pra reads em client component: prefira passar via props do server component pai.

### Sempre paralelize quando independente

```typescript
// ❌ Sequencial — lento
const { data: jobs } = await supabase.from('jobs').select()
const { data: candidates } = await supabase.from('candidates').select()

// ✅ Paralelo — rápido
const [{ data: jobs }, { data: candidates }] = await Promise.all([
  supabase.from('jobs').select(),
  supabase.from('candidates').select(),
])
```

### Tratamento de erro padrão

```typescript
const { data, error } = await supabase.from('jobs').select()

if (error) {
  console.error('[jobs:fetch]', error)  // Logging consistente com prefix
  return <ErrorState message="Não foi possível carregar as vagas." />
}

if (!data || data.length === 0) {
  return <EmptyState />
}
```

### N+1 — sempre evite

```typescript
// ❌ N+1 — 1 query por job
for (const job of jobs) {
  const submissions = await supabase
    .from('submissions')
    .select()
    .eq('job_id', job.id)
}

// ✅ JOIN ou IN — 1 query
const { data } = await supabase
  .from('jobs')
  .select('*, submissions(*)')
```

---

## 8. VALIDAÇÃO E FORMULÁRIOS

### Use Zod pra validação

```typescript
// src/lib/validators/job.ts
import { z } from 'zod'

export const createJobSchema = z.object({
  title: z.string().min(3, 'Título precisa ter pelo menos 3 caracteres'),
  description: z.string().min(50, 'Descrição muito curta'),
  seniority: z.enum(['junior', 'mid', 'senior', 'lead']),
  salary_min: z.number().positive().optional(),
  salary_max: z.number().positive().optional(),
}).refine(
  data => !data.salary_min || !data.salary_max || data.salary_max >= data.salary_min,
  { message: 'Salário máximo deve ser maior que o mínimo', path: ['salary_max'] }
)

export type CreateJobInput = z.infer<typeof createJobSchema>
```

### Validação no client + server (NUNCA só no client)

```typescript
// Client (UX rápida)
const validation = createJobSchema.safeParse(formData)
if (!validation.success) {
  setErrors(validation.error.flatten())
  return
}

// Server (segurança real)
export async function POST(req: Request) {
  const body = await req.json()
  const validation = createJobSchema.safeParse(body)
  if (!validation.success) {
    return Response.json({ errors: validation.error.flatten() }, { status: 400 })
  }
  // ... prossegue com data validado
}
```

Veja `QA_AND_QUALITY.md` pra padrão de mensagens de erro.

---

## 9. ERROR HANDLING

### Princípios

- **Capture, não engula.** Toda exceção logada.
- **Mostre algo útil ao usuário.** Nunca "Something went wrong".
- **Falhe rápido.** Quanto antes o erro aparecer, melhor.

### Padrão pra fetch em client

```typescript
async function handleSubmit() {
  setLoading(true)
  setError('')

  try {
    const res = await fetch('/api/jobs', { method: 'POST', body: ... })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.message || 'Erro ao criar vaga')
    }

    const job = await res.json()
    router.push(`/empresa/vagas/${job.id}`)
  } catch (err) {
    console.error('[create-job]', err)
    setError(err instanceof Error ? err.message : 'Erro inesperado.')
  } finally {
    setLoading(false)
  }
}
```

### Padrão pra Server Actions

```typescript
'use server'

export async function createJob(input: CreateJobInput) {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase.from('jobs').insert(input).select().single()

  if (error) {
    console.error('[create-job:db]', error)
    return { error: 'Não foi possível criar a vaga.' }
  }

  return { data }
}
```

### Error Boundary

Cada rota deve ter `error.tsx`:

```typescript
'use client'
// src/app/(dashboard)/empresa/error.tsx
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <PageHeader title="Algo deu errado" subtitle="..." />
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  )
}
```

---

## 10. PERFORMANCE

### Server Components agressivos
Quanto mais lógica no server, menor o bundle do client.

### Image optimization sempre
```typescript
import Image from 'next/image'

<Image
  src="/brand/nexhire-logo.svg"
  alt="Nexhire"
  width={120}
  height={32}
  priority   // pra above-the-fold
/>
```

### Code-splitting de pesos grandes
```typescript
// Componentes pesados só carregam quando precisa
import dynamic from 'next/dynamic'
const Kanban = dynamic(() => import('@/components/kanban/Kanban'), {
  loading: () => <Skeleton />,
})
```

### Cache do Supabase
```typescript
// Supabase JS já tem cache de queries iguais
// Para revalidação, use revalidateTag ou revalidatePath
import { revalidatePath } from 'next/cache'

revalidatePath('/empresa/vagas')
```

### Não rebuild o que não mudou
React render escapeia: use `key` correto em listas, `memo` em componentes caros.

Veja `PERFORMANCE.md` pra mais.

---

## 11. SEGURANÇA

### RLS é a única verdade
Frontend NUNCA é fonte de verdade. RLS no Supabase protege os dados.

### Service role só em server
```typescript
// ❌ NUNCA no client
const supabase = createClient(url, SERVICE_ROLE_KEY)

// ✅ Apenas em server actions / route handlers
// src/lib/supabase/admin.ts
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
                       process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
```

### Inputs sanitizados antes de salvar
Zod valida estrutura. Pra HTML/SQL injection, Supabase já escapa parâmetros — não concatene strings em queries.

### Secrets em env vars
Nunca commite `.env.local`. Veja `SECURITY_AND_LGPD.md`.

---

## 12. TESTES

### Estratégia
- **Unit tests** pra utils críticos (`formatSalary`, `calculateScore`, validators)
- **Integration tests** pra fluxos críticos (envio de candidato, aprovação)
- **E2E tests** pra happy paths principais (signup, criar vaga, enviar candidato)

### Ferramentas
- Vitest pra unit/integration
- Playwright pra E2E

Veja `QA_AND_QUALITY.md` pra mais detalhe.

### O que NÃO testar
- Componentes visuais simples (Card, Badge)
- Tipos do TypeScript (ele já garante)
- Coisas óbvias (`expect(1 + 1).toBe(2)`)

---

## 13. GIT E COMMITS

### Conventional Commits

```
feat: adiciona kanban de candidatos
fix: corrige contador de envios por vaga
refactor: extrai helper de visibilidade de vagas
docs: atualiza README com instruções de deploy
style: ajusta espaçamento da sidebar
perf: paraleliza queries do dashboard HR
chore: atualiza dependências
test: adiciona testes pro fluxo de envio
```

### Mensagens

```
GOOD:
  feat: implementa upload de CV no envio do candidato
  fix: corrige RLS de candidates pra empresa ler corretamente

BAD:
  update
  WIP
  ajustes
  fix bug
```

### Branches

Pra trabalho em time:
- `main` — produção (deploy automático)
- `develop` — staging (se necessário)
- `feat/upload-cv` — features
- `fix/contador-envios` — bugfixes

Pro solo: tudo em `main` está ok no MVP, mas use branches quando algo arriscado.

---

## 14. CODE REVIEW (mesmo solo)

Antes de commitar, perguntas:

```
[ ] Outro dev entenderia esse código em 30 segundos?
[ ] Tem tipo TypeScript em todos os parâmetros?
[ ] Tratamento de erro implementado?
[ ] Loading state implementado?
[ ] Empty state implementado?
[ ] Testei com dados vazios? Dados grandes?
[ ] Testei com usuário não autenticado?
[ ] Testei com usuário com role errado?
[ ] Sem cor hardcoded?
[ ] Sem `console.log` deixado pra trás?
[ ] Sem `// TODO` sem prazo?
[ ] Re-uso de componentes do design system?
[ ] Funciona em mobile?
```

---

## 15. ANTIPADRÕES COMUNS (NUNCA FAÇA)

### Lógica de negócio no componente

```typescript
// ❌ Componente com 200 linhas de lógica
function JobCard({ job }: Props) {
  const score = job.submissions.reduce(...) * 0.7 + ...
  // ... 50 linhas de cálculo

  return <Card>...</Card>
}

// ✅ Lógica extraída
import { calculateJobScore } from '@/lib/jobs/scoring'

function JobCard({ job }: Props) {
  const score = calculateJobScore(job)
  return <Card>...</Card>
}
```

### Estado duplicado

```typescript
// ❌ State sincronizado manualmente
const [jobs, setJobs] = useState(initialJobs)
const [count, setCount] = useState(initialJobs.length)

// ✅ Derived state
const [jobs, setJobs] = useState(initialJobs)
const count = jobs.length  // derived
```

### Fetch dentro de loop

```typescript
// ❌ N+1
for (const job of jobs) {
  const data = await fetch(`/api/jobs/${job.id}/details`)
}

// ✅ Batch ou JOIN
const data = await fetch(`/api/jobs/details?ids=${jobs.map(j => j.id).join(',')}`)
```

### Mutação direta de props/state

```typescript
// ❌ Muta array
jobs.push(newJob)
setJobs(jobs)  // não dispara re-render!

// ✅ Cria novo array
setJobs([...jobs, newJob])
```

### Magic numbers / magic strings

```typescript
// ❌
if (user.role === 'company_user') ...
if (job.submissions.length > 3) ...

// ✅
const COMPANY_ROLE = 'company_user' as const
const MAX_SUBMISSIONS_PER_HUNTER = 3

if (user.role === COMPANY_ROLE) ...
if (job.submissions.length > MAX_SUBMISSIONS_PER_HUNTER) ...
```

### Comentários explicando "o quê"

```typescript
// ❌ Comentário redundante
// Filtra jobs com status 'open'
const openJobs = jobs.filter(j => j.status === 'open')

// ✅ Comentário explicando "porquê"
// Filtramos manualmente porque Supabase OR com IN não filtra corretamente
// quando combinado com .eq() em colunas com NULL
const openJobs = jobs.filter(j => j.status === 'open' || j.status === null)
```

---

## 16. CHECKLIST DE PR

Antes de mergear (mesmo solo):

```
[ ] TypeScript sem erros
[ ] ESLint sem warnings
[ ] Build passa (`npm run build`)
[ ] Testes existentes passam
[ ] Sem console.log deixado
[ ] Variáveis sensíveis em .env (nunca hardcoded)
[ ] RLS testada se mexeu em queries
[ ] Funciona com 0 dados (empty state)
[ ] Funciona com muitos dados (lista de 100+)
[ ] Funciona em mobile
[ ] Loading e error states implementados
[ ] Acessibilidade básica (keyboard nav, labels)
[ ] Mensagens em português
[ ] Commit segue Conventional Commits
```
