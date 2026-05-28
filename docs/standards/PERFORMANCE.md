# PERFORMANCE — NEXHIRE

> Performance é feature. Produto lento é produto quebrado.
> Alvo: Lighthouse Performance ≥ 90. Core Web Vitals todos verdes.

---

## 1. POR QUE PERFORMANCE IMPORTA

### Dados de impacto

- **+100ms de latência** = -1% de conversão (Amazon)
- **+1s de carregamento** = -7% conversões (Akamai)
- **53% dos usuários mobile** abandonam se demorar mais de 3s (Google)
- **Google ranqueia** sites mais rápidos no SEO

### Cultura

Produto premium é rápido. Stripe carrega em 800ms. Linear é instantâneo. Vercel é referência. Nexhire tem que estar nesse nível.

---

## 2. CORE WEB VITALS (CWV) — METAS

### LCP — Largest Contentful Paint
**Tempo até o maior elemento visível carregar.**

```
🟢 Bom:       < 2.5s
🟡 Aceitável: 2.5s a 4.0s
🔴 Ruim:      > 4.0s

ALVO NEXHIRE: < 1.8s
```

### INP — Interaction to Next Paint
**Tempo de resposta a interações do usuário.**

```
🟢 Bom:       < 200ms
🟡 Aceitável: 200ms a 500ms
🔴 Ruim:      > 500ms

ALVO NEXHIRE: < 150ms
```

### CLS — Cumulative Layout Shift
**Estabilidade visual (quanto a página "pula").**

```
🟢 Bom:       < 0.1
🟡 Aceitável: 0.1 a 0.25
🔴 Ruim:      > 0.25

ALVO NEXHIRE: < 0.05
```

### Outras métricas relevantes

```
FCP — First Contentful Paint:    < 1.5s
TTFB — Time to First Byte:        < 600ms
TBT — Total Blocking Time:        < 200ms
SI — Speed Index:                 < 2.5s
```

---

## 3. NEXT.JS — APROVEITE OS GANHOS NATIVOS

### Server Components — default

```typescript
// ✅ Server Component (default em App Router)
export default async function Page() {
  const data = await fetchData()  // server-side
  return <div>{data}</div>
}

// 'use client' SÓ quando precisar
```

**Benefícios:**
- HTML chega pronto
- Zero JS no client pra componentes server-only
- Bundle menor

### Streaming com Suspense

```typescript
// app/empresa/page.tsx
export default function Page() {
  return (
    <div>
      <PageHeader />  {/* renderiza imediato */}

      <Suspense fallback={<SkeletonStats />}>
        <Stats />     {/* streaming — não bloqueia */}
      </Suspense>

      <Suspense fallback={<SkeletonList />}>
        <JobList />   {/* streaming separado */}
      </Suspense>
    </div>
  )
}
```

### Parallel Routes — paraleliza fetches

```
empresa/
  layout.tsx
  @stats/page.tsx     ← carrega em paralelo
  @jobs/page.tsx      ← carrega em paralelo
  page.tsx
```

---

## 4. IMAGES

### Sempre use `next/image`

```typescript
import Image from 'next/image'

<Image
  src="/brand/nexhire-logo.svg"
  alt="Nexhire"
  width={120}
  height={32}
  priority  // pra above-the-fold (hero, logo)
/>
```

### Boas práticas

- **`priority`** apenas pro hero/logo above-the-fold
- **`loading="lazy"`** (default) pra imagens below-the-fold
- **`sizes` prop** pra responsive
- **`placeholder="blur"`** pra imagens grandes (gera blur enquanto carrega)

### Formatos

```
SVG     Logos, ícones, ilustrações vetoriais
WebP    Fotos (next/image converte automaticamente)
AVIF    Ainda melhor que WebP (next/image também converte)
PNG     Só quando precisa de transparência sem perda
JPEG    Evite (next gera WebP)
```

### Tamanhos máximos

```
Logo:               5KB SVG
Avatar usuário:     20KB JPG (200x200)
Hero image:         100KB WebP
Foto perfil grande: 200KB WebP
```

### Otimização manual

```bash
# Reduzir SVG
npx svgo input.svg -o output.svg

# Converter pra WebP
cwebp -q 80 input.png -o output.webp

# Comprimir PNG
npx imagemin input.png > output.png
```

---

## 5. FONTS

### Use `next/font` (não @import)

```typescript
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',  // crítico pra LCP
})
```

### Boas práticas

- **`display: 'swap'`** — mostra fallback enquanto carrega (evita FOIT)
- **Apenas weights que usa** — não carregue 100, 200, 300, 400, 500, 600, 700, 800, 900 se usa só 400/500/700
- **Subset latin** — não carregue caracteres chineses se é PT-BR
- **Preload automatic** — Next faz por você

### Self-host quando possível

`next/font` faz isso automaticamente pra Google Fonts. Para fontes customizadas:

```typescript
import localFont from 'next/font/local'

const customFont = localFont({
  src: './my-font.woff2',
  variable: '--font-custom',
  display: 'swap',
})
```

---

## 6. JAVASCRIPT BUNDLE

### Meta de tamanho

```
First Load JS (gzipped):     < 100KB
Per-route JS (gzipped):      < 30KB
Largest chunk:               < 250KB
```

### Como medir

```bash
npm run build

# Output mostra tamanho de cada rota
# Route (app)              Size     First Load JS
# ┌ ○ /                    142 B    87.3 kB
# ├ ○ /empresa             4.21 kB  91.5 kB
```

### Reduzir bundle

**1. Dynamic imports pra componentes pesados**

```typescript
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false,  // se não precisa de SSR
})
```

**2. Tree-shake bibliotecas**

```typescript
// ❌ Importa lib inteira
import _ from 'lodash'
_.debounce(...)

// ✅ Importa só o necessário
import debounce from 'lodash/debounce'
debounce(...)

// Melhor: substituir lodash quando possível
const debounce = (fn, ms) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}
```

**3. Cuidado com ícones**

```typescript
// ✅ Lucide já é tree-shakeable
import { Check, X } from 'lucide-react'

// ❌ Importar tudo
import * as Icons from 'lucide-react'
```

**4. Cuidado com date libs**

```typescript
// ❌ moment.js inteiro (290KB)
import moment from 'moment'

// ✅ date-fns por função (~2KB cada)
import { format, parseISO } from 'date-fns'

// ✅ ou Intl nativo (zero KB)
new Intl.DateTimeFormat('pt-BR').format(new Date())
```

### Análise de bundle

```bash
npm i -D @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({...})

# Rodar
ANALYZE=true npm run build
```

---

## 7. DATA FETCHING

### Paralelizar sempre

```typescript
// ❌ Sequencial — 3s total
const user = await getUser()      // 1s
const jobs = await getJobs()      // 1s
const stats = await getStats()    // 1s

// ✅ Paralelo — 1s total
const [user, jobs, stats] = await Promise.all([
  getUser(),
  getJobs(),
  getStats(),
])
```

### Cache do Next.js

```typescript
// Cache automático em fetch()
await fetch('https://api.example.com', {
  next: { revalidate: 60 }  // revalida a cada 60s
})

// Cache desabilitado quando precisa de dados frescos
await fetch('https://api.example.com', {
  cache: 'no-store'
})
```

### Cache do Supabase

Use `revalidatePath` ou `revalidateTag` após mutações:

```typescript
import { revalidatePath } from 'next/cache'

export async function createJob(input) {
  await supabase.from('jobs').insert(input)
  revalidatePath('/empresa/vagas')
}
```

### Database query optimization

**1. Selecione só o que precisa**

```typescript
// ❌ Pega tudo
const { data } = await supabase.from('jobs').select('*')

// ✅ Só o necessário
const { data } = await supabase
  .from('jobs')
  .select('id, title, status, created_at')
```

**2. Use JOINs em vez de N+1**

```typescript
// ❌ N+1
const { data: jobs } = await supabase.from('jobs').select()
for (const job of jobs) {
  const { data: subs } = await supabase
    .from('submissions')
    .select()
    .eq('job_id', job.id)
}

// ✅ JOIN
const { data } = await supabase
  .from('jobs')
  .select('*, submissions(*)')
```

**3. Pagine listas grandes**

```typescript
// Server Component com paginação
const PAGE_SIZE = 20

const { data } = await supabase
  .from('jobs')
  .select('*')
  .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
```

**4. Indexes em colunas usadas em WHERE/JOIN**

```sql
-- No Supabase SQL
CREATE INDEX idx_submissions_job_id ON submissions(job_id);
CREATE INDEX idx_submissions_recruiter_id ON submissions(recruiter_id);
CREATE INDEX idx_submissions_status ON submissions(status);
```

---

## 8. CSS — TAILWIND PERFORMANCE

### Tailwind v4 já é otimizado

- Tree-shake automático
- CSS-first config (sem JS de runtime)
- Compila apenas classes usadas

### Boas práticas

**1. Use classes em vez de style inline quando possível**

```tsx
// ✅ Class — cacheável, tree-shakeable
<div className="p-4 bg-white rounded-lg">

// ❌ Style inline — não cacheável
<div style={{ padding: '16px', background: 'white', borderRadius: '8px' }}>
```

**Exceção:** valores dinâmicos baseados em props/state.

**2. Evite arbitrary values em demasia**

```tsx
// ❌ Cada um gera CSS único
<div className="p-[17px] mt-[23px] mb-[11px]">

// ✅ Use a escala
<div className="p-4 mt-6 mb-3">
```

**3. Use variantes em vez de duplicar**

```tsx
// ✅ Variant
<div className="hover:bg-gray-100 focus:ring-2">

// ❌ JS pra alternar
const [hover, setHover] = useState(false)
<div style={{ background: hover ? '#f3f4f6' : '#fff' }}>
```

---

## 9. RENDERING — REACT

### Memoização — use quando faz diferença

```typescript
// Memoize componente caro renderizado em listas longas
const JobCard = memo(function JobCard({ job }: Props) {
  return <Card>...</Card>
})

// Memoize cálculo pesado
const sortedJobs = useMemo(
  () => jobs.sort((a, b) => b.score - a.score),
  [jobs]
)

// Memoize callback que vai pra componente memoized
const handleClick = useCallback((id: string) => {
  // ...
}, [])
```

### Não memoize por reflexo

```typescript
// ❌ Memoize de componente simples sem necessidade
const Title = memo(({ text }) => <h1>{text}</h1>)
// Custo de memoize > custo de re-render

// ❌ useMemo pra valor barato
const isAdmin = useMemo(() => user.role === 'admin', [user.role])
// useMemo nesse caso adiciona overhead
```

### Key correto em listas

```typescript
// ✅ ID único
{jobs.map(job => <JobCard key={job.id} job={job} />)}

// ❌ Index (causa re-render desnecessário se ordem muda)
{jobs.map((job, i) => <JobCard key={i} job={job} />)}
```

### Lazy load below the fold

```typescript
import dynamic from 'next/dynamic'

const Kanban = dynamic(() => import('./Kanban'), {
  loading: () => <Skeleton />,
})

// Só carrega quando user clica em "Ver pipeline"
{showKanban && <Kanban />}
```

---

## 10. LAYOUT SHIFT (CLS)

### Causas comuns e fixes

**1. Imagens sem dimensão definida**

```tsx
// ❌ Image sem width/height → layout pula quando carrega
<img src="/avatar.jpg" />

// ✅ Reserva espaço
<Image src="/avatar.jpg" width={48} height={48} alt="..." />
```

**2. Fonts causando FOIT/FOUT**

```typescript
// ✅ display: 'swap' previne FOIT
const inter = Inter({ display: 'swap' })

// Reduzir FOUT: use size-adjust em font-face
```

**3. Conteúdo carregando depois de render inicial**

```tsx
// ❌ Conteúdo aparece e empurra outros elementos
{loaded && <Banner />}

// ✅ Reserve espaço com skeleton
{loaded ? <Banner /> : <BannerSkeleton />}
```

**4. Ads/embeds dinâmicos**
Reserve espaço com min-height fixo.

---

## 11. CACHE STRATEGIES

### Static (default)
Páginas que não dependem de request — Next gera no build, cacheado pra sempre.

```typescript
// app/sobre/page.tsx
export default function Page() {
  return <div>...</div>
}
// Build-time static
```

### ISR — Incremental Static Regeneration
Página estática que revalida periodicamente.

```typescript
export const revalidate = 3600  // revalida a cada 1h
```

### Dynamic
Página re-renderiza a cada request (server component com cookies/headers).

```typescript
// Automaticamente dynamic quando usa cookies()
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  // ...
}
```

### Edge runtime (use quando faz sentido)

```typescript
export const runtime = 'edge'  // mais rápido pra apps globais
```

**Mas:** Edge não tem todas as libs Node. Cuidado com dependências.

---

## 12. SUPABASE PERFORMANCE

### Connection pooling
Supabase já fornece. Use a URL `pooler.supabase.com` em produção.

### Realtime — use com parcimônia
Custoso. Apenas quando precisa de updates instantâneos.

```typescript
// ✅ Use realtime pra notificações
supabase.channel('notifications').on(...)

// ❌ Não use realtime pra dados que mudam pouco
// (use revalidate ou polling com longo intervalo)
```

### Edge Functions vs API routes
- **Edge Functions** (Deno): mais rápido geograficamente, menos features Node
- **API Routes** (Next.js): mais flexível, deploy junto com app

Pra MVP, use Next API Routes.

---

## 13. THIRD-PARTY SCRIPTS

### `next/script` com strategy correta

```tsx
import Script from 'next/script'

<Script
  src="https://analytics.com/script.js"
  strategy="afterInteractive"  // depois de hydrate
/>

<Script
  src="https://chat.com/widget.js"
  strategy="lazyOnload"  // depois de tudo carregar
/>

<Script
  src="https://essential.com/critical.js"
  strategy="beforeInteractive"  // bloqueia render — use só se essencial
/>
```

### Avalie cada script

Pergunta antes de adicionar:
- Esse script trava o thread principal?
- Pode ser carregado depois?
- Existe alternativa server-side?

---

## 14. MONITORAMENTO

### Vercel Analytics (free)

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

<Analytics />
<SpeedInsights />
```

### Web Vitals manualmente

```typescript
// app/_components/WebVitals.tsx
'use client'
import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals(metric => {
    // Envia pra analytics
    console.log(metric)
  })
  return null
}
```

### Lighthouse no CI

```yaml
# .github/workflows/lighthouse.yml
- uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      https://nexhireapp.vercel.app
      https://nexhireapp.vercel.app/login
    budgetPath: ./lighthouse-budget.json
```

---

## 15. CHECKLIST DE PERFORMANCE

### Por rota
```
[ ] Server Component quando possível
[ ] Suspense pra streaming de fetches independentes
[ ] Lighthouse Performance ≥ 90
[ ] LCP < 1.8s
[ ] INP < 150ms
[ ] CLS < 0.05
[ ] Imagens com next/image + width/height
[ ] Fontes com display: 'swap'
[ ] Bundle < 100KB First Load JS
[ ] Queries paralelizadas
[ ] Sem N+1 em DB
```

### Global
```
[ ] Sem dependências pesadas (moment.js, lodash inteiro, etc)
[ ] Ícones tree-shakeable (lucide-react)
[ ] Scripts third-party com strategy correta
[ ] Vercel Analytics + Speed Insights ativos
[ ] Indexes nas colunas certas do DB
[ ] Cache strategies definidas por rota
```

---

## 16. ANTIPADRÕES

```
❌ <img> em vez de <Image>
❌ Fonte sem display: 'swap'
❌ moment.js (use date-fns ou Intl)
❌ lodash inteiro importado
❌ console.log em produção
❌ Realtime pra dados que mudam pouco
❌ N+1 queries no banco
❌ Bundle > 250KB First Load
❌ Layout shift por imagens sem dimensão
❌ FOIT (Flash of Invisible Text) — fonte sem swap
❌ Script third-party com strategy='beforeInteractive' sem motivo
❌ useState pra valores que poderiam ser derived state
❌ Re-render por mudar referência de objeto/função em prop
```

---

## 17. FERRAMENTAS

```
Lighthouse              Chrome DevTools (built-in)
PageSpeed Insights      pagespeed.web.dev
WebPageTest             webpagetest.org
@vercel/analytics       Vercel free analytics
@next/bundle-analyzer   Análise de bundle
Chrome DevTools         Performance tab, Network tab
React DevTools          Profiler tab
```
