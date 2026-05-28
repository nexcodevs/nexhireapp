# QA AND QUALITY — NEXHIRE

> Garantia de qualidade do produto: testes, validações, controle de erros, usabilidade.
> Padrão de saída: zero erros em fluxos críticos, mensagens claras, recuperação graceful.

---

## 1. FILOSOFIA DE QUALIDADE

### Princípios

**1. Erro do usuário é defeito do produto.**
Se o usuário "errou", a UX falhou em prevenir ou guiar. Quase nunca é culpa dele.

**2. Toda falha tem um plano B.**
Email não envia? Avisa e oferece reenvio. Upload falha? Mantém o que já foi preenchido. API caiu? Mostra estado offline gracioso.

**3. Validação é prevenção, não punição.**
Valida pra ajudar usuário a acertar, não pra dizer "errado". Tom: assistente, não policial.

**4. Loading state é parte do design.**
Tela em branco por 3 segundos = produto quebrado. Skeleton + spinner = produto pensando.

**5. Confirmação só pra ações irreversíveis.**
Confirmar "Salvar mudanças?" = friction. Confirmar "Cancelar vaga sem possibilidade de voltar?" = OK.

**6. Teste com olhos de usuário, não de dev.**
Quebrou se um usuário não-técnico tropeça. Não importa se "tecnicamente funciona".

---

## 2. VALIDAÇÃO DE FORMULÁRIOS

### Onde validar

**Cliente:**
- Validação imediata (UX rápida)
- onChange ou onBlur conforme o campo
- Erro mostrado **inline, abaixo do campo**

**Servidor:**
- Sempre re-valida (segurança)
- Retorna erros estruturados pra cliente exibir

**Banco:**
- Constraints como última linha de defesa
- NOT NULL, UNIQUE, CHECK constraints

### Quando mostrar erro

- **Não** durante a digitação (irrita)
- **Sim** no blur do campo (terminou de digitar)
- **Sim** no submit (validação geral)
- **Limpa** assim que usuário começa a corrigir

### Padrão de mensagens de erro de campo

**Padrão de tom:**
- 1ª pessoa, direto, sem desculpa
- Diz O QUE fazer, não SÓ o que está errado
- Sem termos técnicos

```
GOOD                                          BAD
Email é obrigatório                          Por favor, preencha este campo
Use o formato voce@empresa.com               Email inválido
Senha precisa ter no mínimo 8 caracteres     Password too short
Telefone com DDD: (11) 99999-9999            Phone format invalid
Já existe uma conta com esse email           Email already exists
Valor deve ser maior que zero                Number error
Selecione ao menos uma opção                 Required field
Salário máximo deve ser maior que mínimo     Validation failed
```

### Validações por tipo de campo

**Email:**
```typescript
z.string()
  .min(1, 'Email é obrigatório')
  .email('Use o formato voce@empresa.com')
  .toLowerCase()
  .trim()
```

**Senha:**
```typescript
z.string()
  .min(8, 'Senha precisa ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula')
  .regex(/[0-9]/, 'Inclua ao menos um número')
```

**Telefone brasileiro:**
```typescript
z.string()
  .regex(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/, 'Use o formato (11) 99999-9999')
```

**URL:**
```typescript
z.string()
  .url('Use uma URL válida (com https://)')
  .or(z.literal(''))   // permite vazio
```

**Texto livre (descrição):**
```typescript
z.string()
  .min(50, 'Descrição precisa ter no mínimo 50 caracteres pra contexto')
  .max(2000, 'Descrição muito longa. Máximo 2000 caracteres')
  .trim()
```

**Valor monetário:**
```typescript
z.number()
  .positive('Valor deve ser maior que zero')
  .max(1_000_000, 'Valor máximo: R$ 1.000.000')
```

**Datas futuras:**
```typescript
z.date()
  .refine(d => d > new Date(), 'Data deve ser no futuro')
```

### Visualização de erro no campo

```tsx
<div>
  <label>Email *</label>
  <input
    type="email"
    aria-invalid={!!error}
    aria-describedby="email-error"
    className={error ? 'input-error' : ''}
  />
  {error && (
    <p id="email-error" className="text-xs mt-1" style={{ color: '#991B1B' }}>
      {error}
    </p>
  )}
</div>
```

### Indicação de campo obrigatório

- Asterisco vermelho (`*`) no label
- **NÃO** texto "(obrigatório)" — visual ruim
- **NÃO** marcar opcional ("(opcional)") — assume-se obrigatório por padrão se tiver asterisco

### Validação contextual

Alguns campos precisam validar contra dados:

```typescript
// Email já existe?
const { data: existing } = await supabase
  .from('users')
  .select('id')
  .eq('email', email)
  .maybeSingle()  // NÃO .single() — não dá erro se vazio

if (existing) {
  return { error: 'Já existe uma conta com esse email. Tente fazer login.' }
}

// Salário max > min?
if (salary_max && salary_min && salary_max < salary_min) {
  return { error: 'Salário máximo deve ser maior que o mínimo.' }
}
```

---

## 3. ESTADOS DE COMPONENTE

Todo componente que faz fetch tem 5 estados. Implemente os 5.

### 1. Loading (carregando)

```tsx
if (loading) {
  return <SkeletonLoader />
}
```

**NÃO use spinner full-screen.** Use skeleton screens (cards/textos pulsando no formato do conteúdo final).

```tsx
function SkeletonCard() {
  return (
    <Card padding="md">
      <div className="space-y-3">
        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
      </div>
    </Card>
  )
}
```

### 2. Empty (sem dados)

```tsx
if (!data || data.length === 0) {
  return <EmptyState />
}
```

Veja `DESIGN_PRINCIPLES.md` seção 7.

### 3. Error (erro de fetch)

```tsx
if (error) {
  return (
    <Card variant="flat" padding="md" className="text-center">
      <div className="py-6">
        <Icon className="text-red-500 mx-auto mb-2" />
        <p className="text-sm font-medium mb-2">Não foi possível carregar os dados.</p>
        <p className="text-xs text-muted mb-4">{error.message}</p>
        <Button variant="outline" size="sm" onClick={retry}>
          Tentar novamente
        </Button>
      </div>
    </Card>
  )
}
```

### 4. Success (tem dados)
Renderiza normal.

### 5. Refreshing (refetch silencioso)
Indicador sutil — barra fina no topo ou opacidade reduzida.

```tsx
<div style={{ opacity: refreshing ? 0.6 : 1, transition: 'opacity 200ms' }}>
  {/* conteúdo */}
</div>
```

---

## 4. MENSAGENS DE SISTEMA

### Tom geral

- **Confiante** (não pede desculpa toda hora)
- **Específico** (sem genéricos)
- **Construtivo** (diz o que fazer)

### Padrões

**Sucesso:**
```
Vaga criada com sucesso. HR vai revisar em até 24h.
Candidato enviado. Você receberá um email quando for analisado.
Senha alterada. Faça login novamente.
```

**Erro de operação:**
```
Não foi possível salvar a vaga. Verifique sua conexão e tente novamente.
Email inválido ou senha incorreta.
Sua sessão expirou. Faça login novamente.
```

**Aviso (warning):**
```
Você está prestes a usar seu último envio nesta vaga.
Essa vaga fecha em 2 dias. Envie candidatos antes do prazo.
Você ainda não preencheu o perfil completo.
```

**Erro genérico (use apenas como fallback final):**
```
Algo inesperado aconteceu. Atualize a página ou tente novamente em alguns minutos.
```

**Evite:**
```
❌ Oops!
❌ Algo deu errado
❌ Erro 500
❌ Internal server error
❌ "Failed to fetch"
❌ Stack traces no UI
```

### Onde mostrar

- **Inline (preferido)** — perto da ação que causou
- **Topo do form** — pra erros gerais de submit
- **Toast (canto inferior direito)** — pra eventos assíncronos (email enviado, processo concluído em background)
- **Modal** — apenas pra eventos críticos que exigem atenção

---

## 5. CONTROLE DE ERROS POR CAMADA

### Frontend (componente)

```typescript
try {
  setLoading(true)
  setError('')
  await action()
} catch (err) {
  console.error('[create-job]', err)
  setError(err instanceof Error ? err.message : 'Erro inesperado.')
} finally {
  setLoading(false)
}
```

### API Route / Server Action

```typescript
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validation = schema.safeParse(body)

    if (!validation.success) {
      return Response.json(
        { error: 'Dados inválidos', issues: validation.error.flatten() },
        { status: 400 }
      )
    }

    // ... lógica

    return Response.json({ data })

  } catch (err) {
    console.error('[api:create-job]', err)
    return Response.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
```

### Database (Supabase)

```typescript
const { data, error } = await supabase.from('jobs').insert(input).select().single()

if (error) {
  // Distingue tipos de erro
  if (error.code === '23505') {
    return { error: 'Já existe uma vaga com esse título nesta empresa.' }
  }
  if (error.code === '42501') {
    return { error: 'Você não tem permissão pra essa ação.' }
  }

  console.error('[db:create-job]', error)
  return { error: 'Erro ao salvar no banco.' }
}
```

### Codes comuns do PostgreSQL

```
23505 — unique violation (duplicate)
23503 — foreign key violation
23502 — NOT NULL violation
42501 — insufficient privilege (RLS bloqueou)
22P02 — invalid_text_representation
```

---

## 6. TESTES — ESTRATÉGIA

### Pirâmide de testes (do mais rápido pro mais lento)

```
        ╱╲          E2E (poucos)
       ╱  ╲         Playwright: happy paths principais
      ╱────╲
     ╱      ╲       Integration (médio)
    ╱        ╲      Vitest + supabase test client
   ╱──────────╲
  ╱            ╲    Unit (muitos)
 ╱______________╲   Vitest: validators, utils, calculators
```

### Setup

```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
npm i -D @playwright/test
```

### Unit tests — o que testar

**Sempre teste:**
- Validators (Zod schemas com casos válidos e inválidos)
- Utils que fazem cálculo (formatCurrency, calculateScore)
- Helpers de regra de negócio (canSubmitCandidate, getJobVisibility)

**Exemplo:**
```typescript
// src/lib/validators/job.test.ts
import { describe, it, expect } from 'vitest'
import { createJobSchema } from './job'

describe('createJobSchema', () => {
  it('aceita vaga válida', () => {
    const valid = {
      title: 'Engenheiro de Software',
      description: 'a'.repeat(60),
      seniority: 'senior',
    }
    expect(createJobSchema.safeParse(valid).success).toBe(true)
  })

  it('rejeita título curto', () => {
    const invalid = { title: 'Eng', description: 'a'.repeat(60), seniority: 'senior' }
    const result = createJobSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('title')
    }
  })

  it('rejeita salary_max menor que salary_min', () => {
    const invalid = {
      title: 'Engineer', description: 'a'.repeat(60), seniority: 'senior',
      salary_min: 10000, salary_max: 5000,
    }
    expect(createJobSchema.safeParse(invalid).success).toBe(false)
  })
})
```

### Integration tests

Testes que envolvem 2+ camadas (componente + lib, ou API + DB).

```typescript
// Testa server action criando vaga
import { describe, it, expect } from 'vitest'
import { createJob } from '@/app/actions/jobs'

describe('createJob', () => {
  it('cria vaga e retorna id', async () => {
    const result = await createJob({ /* ... */ })
    expect(result.data?.id).toBeDefined()
  })

  it('retorna erro se não autenticado', async () => {
    // mock supabase.auth.getUser pra retornar null
    const result = await createJob({ /* ... */ })
    expect(result.error).toBe('Não autenticado')
  })
})
```

### E2E tests (Playwright)

**Cubra apenas happy paths críticos:**
1. Signup como empresa → criar vaga → ver vaga listada
2. Login como hunter → ver vagas → enviar candidato
3. Login como HR → aprovar candidato → ver enviado pra cliente
4. Login como empresa → ver candidato → aprovar pra entrevista

```typescript
// e2e/empresa-cria-vaga.spec.ts
import { test, expect } from '@playwright/test'

test('empresa consegue criar vaga', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'adm@nexco.cc')
  await page.fill('input[name="password"]', 'senha-teste')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/empresa')
  await page.click('text=Nova vaga')

  await page.fill('input[name="title"]', 'Engenheiro de Software')
  await page.fill('textarea[name="description"]', 'Vaga de teste'.repeat(10))
  // ...

  await page.click('button:has-text("Criar vaga")')
  await expect(page.locator('text=Vaga criada com sucesso')).toBeVisible()
})
```

---

## 7. CHECKLIST DE TELA (QA MANUAL)

Pra cada tela, antes de considerar pronta:

### Funcional
```
[ ] Caminho feliz funciona
[ ] Estado vazio funciona (0 itens)
[ ] Estado cheio funciona (100+ itens, se aplicável)
[ ] Loading state aparece e desaparece
[ ] Error state aparece quando força erro (desliga internet)
[ ] Refresh state aparece em refetch silencioso
[ ] Todos os links funcionam
[ ] Todos os botões funcionam
[ ] Navegação back/forward não quebra
```

### Validação de form (se aplicável)
```
[ ] Campos obrigatórios mostram erro claro
[ ] Validação no blur do campo
[ ] Erro limpa ao corrigir
[ ] Submit desabilitado se inválido
[ ] Mensagem de sucesso após submit
[ ] Form não pode ser submetido duas vezes (botão disabled em loading)
[ ] Refresh da página não perde estado se em meio de fluxo crítico
```

### Permissões
```
[ ] Sem login → redireciona pra /login
[ ] Login com role errada → redireciona ou mostra erro
[ ] Tenta acessar URL de outra role → bloqueado
[ ] Tenta acessar recurso de outra empresa/hunter → bloqueado (RLS)
```

### UX
```
[ ] Funciona com teclado (Tab, Enter, Esc)
[ ] Focus visible em todos os interativos
[ ] Tela usável em mobile (< 768px)
[ ] Tela usável em laptop pequeno (1280x800)
[ ] Sem scroll horizontal indesejado
[ ] Textos legíveis (contraste 4.5:1)
[ ] Imagens com alt
```

### Conteúdo
```
[ ] Sem texto em inglês esquecido
[ ] Sem placeholder "Lorem ipsum"
[ ] Sem TODO no UI
[ ] Datas no formato pt-BR (DD/MM/AAAA)
[ ] Moeda em R$ com separadores corretos
[ ] Textos sem typo
```

### Performance
```
[ ] Carrega em menos de 2s em conexão normal
[ ] Não bloqueia a tela durante fetch
[ ] Imagens otimizadas (Image do Next)
[ ] Sem requests duplicados na aba Network
```

---

## 8. CONTROLE DE QUALIDADE PRÉ-RELEASE

### Checklist antes de cada deploy pra produção

**Banco:**
```
[ ] RLS ativado em todas as tabelas sensíveis
[ ] Policies revisadas pra cada role
[ ] Backups configurados
[ ] Indexes em colunas usadas em WHERE/JOIN
[ ] Migrations testadas em staging
```

**Aplicação:**
```
[ ] Build passa (`npm run build`)
[ ] TypeScript sem erros
[ ] ESLint sem warnings
[ ] Testes passam
[ ] Sem console.log em código de produção
[ ] Sem hardcoded URLs (use env vars)
[ ] Sem secrets em código (.env.local não commitado)
```

**Ambiente:**
```
[ ] Variáveis de ambiente configuradas no Vercel
[ ] Resend domain verificado
[ ] OpenAI API key válida
[ ] Supabase URLs corretas (production vs staging)
[ ] Error tracking ativo (Sentry ou similar)
```

**Smoke tests em produção (manual)**
```
[ ] Login funciona
[ ] Signup funciona
[ ] Criar vaga funciona
[ ] Enviar candidato funciona
[ ] Email é enviado
[ ] IA analisa candidato
[ ] Aprovação flui até cliente
[ ] Logout funciona
```

---

## 9. MONITORING PÓS-DEPLOY

### Ferramentas mínimas

- **Vercel Analytics** — Web Vitals, traffic
- **Supabase Logs** — queries, errors, RLS denials
- **Sentry** (recomendado) — erros JS runtime
- **Resend Dashboard** — email deliverability

### KPIs a monitorar semanalmente

**Técnicos:**
- Error rate < 1% das requests
- P95 latency < 1.5s
- Build success rate 100%
- LCP < 2.5s, INP < 200ms, CLS < 0.1

**Negócio:**
- Signups/dia (empresas, hunters)
- Vagas criadas/dia
- Candidatos enviados/dia
- Taxa de aprovação (HR → cliente)
- Taxa de hire

**Qualidade:**
- Reports de bugs por usuário
- Tickets de suporte
- Tempo médio de resposta de suporte

---

## 10. PROCESSO DE BUG (do report ao fix)

### 1. Report
- Reproduz local
- Documenta passos exatos
- Tira screenshot/vídeo se visual
- Anota em BACKLOG.md com severidade

### 2. Severidade

**P0 — Bloqueador (resolver hoje)**
- Login não funciona
- Dados sumindo
- Vazamento de privacidade
- Segurança comprometida

**P1 — Crítico (resolver essa semana)**
- Fluxo principal quebrado pra algum role
- Email não envia
- Bug que afeta confiança no produto

**P2 — Importante (próximo sprint)**
- UX ruim mas funcional
- Edge case raro
- Estado visual estranho

**P3 — Nice-to-have (backlog)**
- Polidura visual
- Otimização não-crítica

### 3. Fix
- Branch dedicada (se time)
- Reproduz erro em teste antes de corrigir
- Implementa fix
- Confirma que teste passa
- PR/merge

### 4. Pós-fix
- Verifica em produção
- Atualiza release notes
- Comunica usuário afetado se relevante

---

## 11. RECUPERAÇÃO DE FALHAS

### Email não envia
- Loga e mostra avisos no UI ("Confirmação não enviada, mas operação OK")
- Permite reenvio manual
- Não bloqueia fluxo principal

### Upload de arquivo falha
- Mantém form preenchido
- Mostra erro específico (tamanho, tipo, etc)
- Permite retry sem perder dados

### API caiu temporariamente
- Mostra estado offline elegante
- Sugere recarregar em alguns minutos
- Não tenta retry infinito

### Sessão expirada
- Captura no middleware
- Redireciona pra login com return URL
- Após login, volta pra onde estava

---

## 12. ACCESSIBILITY — MÍNIMO ACEITÁVEL

Veja `ACCESSIBILITY.md` pra detalhes. Mínimo:

```
[ ] Todos inputs têm <label>
[ ] Imagens decorativas com alt=""
[ ] Imagens informativas com alt descritivo
[ ] Focus visible em todos os interativos
[ ] Contraste de texto ≥ 4.5:1
[ ] Navegação por teclado completa
[ ] aria-label em botões só com ícone
[ ] role="button" se algo não é <button> mas funciona como
[ ] aria-invalid em campos com erro
[ ] aria-describedby pra mensagens de erro
```

---

## 13. ANTIPADRÕES (NUNCA FAÇA)

```
❌ alert() pra feedback de erro
❌ confirm() em vez de modal customizado
❌ console.error como única forma de log de erro
❌ try/catch sem fazer nada no catch
❌ Engulir erro de fetch silenciosamente
❌ Spinner sem mensagem após 5 segundos
❌ Form submit que duplica request
❌ Botão "Enviar" continua clicável durante loading
❌ Validação só no client (sem revalidar no server)
❌ Mensagem genérica ("Erro!") pro usuário
❌ Stack trace ou debug info no UI
❌ Botão de "Cancelar" levando pra outra página sem confirmar
❌ Estado vazio só com "Sem itens"
```
