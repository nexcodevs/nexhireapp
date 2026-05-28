# SECURITY AND LGPD — NEXHIRE

> Segurança e compliance pra produto que lida com dados pessoais de candidatos, hunters e empresas.
> Referências: OWASP Top 10, LGPD (Lei 13.709/2018), Supabase security best practices.

---

## 1. POR QUE SEGURANÇA IMPORTA EM HR TECH

A Nexhire armazena **dados extremamente sensíveis:**
- CPF, RG, email, telefone de candidatos
- Histórico profissional, salário pretendido
- CV e documentos
- Notas privadas de hunters sobre candidatos
- Feedback confidencial entre empresas e HR

Vazamento = **multa LGPD (até 2% do faturamento, máx R$50M)** + dano de reputação irreversível em mercado de confiança.

---

## 2. PRINCÍPIOS DE SEGURANÇA

### Defesa em camadas
Não confie em uma única camada. Frontend valida + Backend valida + DB constrains + RLS protege.

### Princípio do menor privilégio
Cada role/usuário tem **apenas** o acesso que precisa. Nada a mais.

### Trust no one
Frontend NUNCA é fonte de verdade. Toda decisão crítica acontece no servidor.

### Auditabilidade
Toda ação importante deixa rastro (quem, quando, o quê).

---

## 3. AUTENTICAÇÃO

### Supabase Auth (já usado)

Configuração:
- Email + senha obrigatórios
- Senha mínima 8 chars (configurar no dashboard)
- Confirmação de email opcional (recomendado ativar)
- Magic links pra forgot-password

### Boas práticas

**Senha:**
- Mínimo 8 caracteres
- Sugestão: incluir maiúscula + número
- Nunca log/store em plain text (Supabase já faz isso)
- Bcrypt salt rounds ≥ 10 (Supabase faz)

**Tokens:**
- Refresh token ~30 dias
- Access token ~1h
- Sempre via cookie httpOnly (Supabase com `@supabase/ssr` faz)

**Multi-factor authentication (MFA):**
- Não obrigatório no MVP
- Adicionar antes de scale (>100 empresas)
- Supabase Auth suporta nativo

### Login social

**Google OAuth (planejado):**
- Configurar no Supabase Dashboard
- Restringir scopes: apenas email e profile básico
- Captura de dados sensíveis SÓ se usuário consentir

**LinkedIn (futuro):**
- Cuidado com escopos (LinkedIn API é restritiva)
- Não armazene tokens long-lived sem necessidade

### Sessões

```typescript
// middleware.ts — verifica sessão em rotas protegidas
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/empresa')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}
```

---

## 4. AUTORIZAÇÃO (RLS)

### Princípio fundamental

**RLS no Supabase é a ÚNICA fonte de verdade de autorização.**

Frontend pode "esconder" botões, mas se o usuário disparar uma query API que ele não pode, **o banco tem que recusar.**

### Estrutura de policies por tabela

#### `users`
```sql
-- Usuários veem apenas a si mesmos
CREATE POLICY "Users view self" ON users
  FOR SELECT USING (auth.uid() = id);

-- HR e Admin veem todos
CREATE POLICY "HR view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('hr_manager', 'admin'))
  );
```

#### `companies`
```sql
-- Membros da empresa veem a própria
CREATE POLICY "Members view company" ON companies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM company_users cu WHERE cu.company_id = id AND cu.user_id = auth.uid())
  );

-- HR vê todas
CREATE POLICY "HR view all companies" ON companies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('hr_manager', 'admin'))
  );
```

#### `jobs`
```sql
-- Empresa vê próprias vagas
CREATE POLICY "Company view own jobs" ON jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM company_users cu WHERE cu.company_id = jobs.company_id AND cu.user_id = auth.uid())
  );

-- Hunter vê vagas abertas (com filtro de visibilidade aplicado no app)
CREATE POLICY "Recruiters view open jobs" ON jobs
  FOR SELECT USING (
    status IN ('open_for_hunters', 'submission_closed')
    AND EXISTS (SELECT 1 FROM recruiters r WHERE r.user_id = auth.uid() AND r.status = 'approved')
  );

-- HR vê tudo
CREATE POLICY "HR view all jobs" ON jobs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('hr_manager', 'admin'))
  );

-- Empresa cria/edita próprias vagas
CREATE POLICY "Company insert own jobs" ON jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM company_users cu WHERE cu.company_id = jobs.company_id AND cu.user_id = auth.uid())
  );
```

#### `candidates` (DADOS SENSÍVEIS)
```sql
-- Hunter vê apenas candidatos que ele enviou
CREATE POLICY "Recruiters view own candidates" ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions s
      JOIN recruiters r ON r.id = s.recruiter_id
      WHERE s.candidate_id = candidates.id AND r.user_id = auth.uid()
    )
  );

-- Empresa vê candidatos enviados pras vagas dela
CREATE POLICY "Company view own job candidates" ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions s
      JOIN jobs j ON j.id = s.job_id
      JOIN company_users cu ON cu.company_id = j.company_id
      WHERE s.candidate_id = candidates.id AND cu.user_id = auth.uid()
    )
  );

-- HR vê todos
CREATE POLICY "HR view all candidates" ON candidates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('hr_manager', 'admin'))
  );

-- Hunter cria candidatos (com restrição)
CREATE POLICY "Recruiters insert candidates" ON candidates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM recruiters r WHERE r.user_id = auth.uid() AND r.status = 'approved')
  );
```

### Checklist de RLS

```
[ ] Todas as tabelas com RLS ativado
[ ] Policy SELECT pra cada role que pode ler
[ ] Policy INSERT/UPDATE/DELETE com WITH CHECK
[ ] HR/Admin policies usam WHERE EXISTS em users
[ ] Sem policy "FOR ALL" sem restrição
[ ] Testado: usuário A não acessa dados de usuário B
[ ] Testado: hunter não vê candidatos de outro hunter
[ ] Testado: empresa não vê candidatos de outra empresa
```

### Service Role Key

**Tem superpoderes — bypassa RLS.** Use com extremo cuidado.

```typescript
// src/lib/supabase/admin.ts
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // NUNCA expor no client
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

**Use apenas pra:**
- Operações administrativas (criar usuário, listar tudo pra cross-role)
- Cron jobs / background workers
- Notificações cross-role (HR query precisa de dados de hunter + empresa juntos)

**Nunca use pra:**
- Operações comuns do usuário (use cliente normal)
- No client/browser (a key vaza)

---

## 5. INPUTS — VALIDAÇÃO E SANITIZAÇÃO

### Validação no servidor com Zod

```typescript
// src/lib/validators/job.ts
import { z } from 'zod'

export const createJobSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  description: z.string().min(50).max(5000).trim(),
  // ...
})

// API route
export async function POST(req: Request) {
  const body = await req.json()
  const validation = createJobSchema.safeParse(body)

  if (!validation.success) {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  // ... usa validation.data (já tipado e validado)
}
```

### Sanitização de HTML

**Se aceitar HTML do usuário** (raro no MVP, mas comum em rich text):

```typescript
import DOMPurify from 'isomorphic-dompurify'

const clean = DOMPurify.sanitize(userInput)
```

### SQL injection

**Supabase JS já parametriza queries automaticamente.** Não concatene strings:

```typescript
// ❌ NUNCA — vulnerável a injection
const { data } = await supabase.rpc('search', { query: `name LIKE '%${input}%'` })

// ✅ Use filtros do client (parametrizados)
const { data } = await supabase.from('candidates').ilike('full_name', `%${input}%`)
```

### File uploads

```typescript
// Validação no servidor
const ALLOWED_TYPES = ['application/pdf', 'application/msword']
const MAX_SIZE = 5 * 1024 * 1024  // 5MB

if (!ALLOWED_TYPES.includes(file.type)) {
  return { error: 'Tipo de arquivo não permitido' }
}

if (file.size > MAX_SIZE) {
  return { error: 'Arquivo muito grande (máx 5MB)' }
}

// Renomear pra não revelar nome original
const safeName = `${crypto.randomUUID()}.pdf`
```

---

## 6. SEGREDOS E ENV VARS

### Estrutura de env vars

```
.env.local                # local dev (NÃO commitar)
.env.example              # template (commitar)
```

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co       # OK público
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...                    # OK público
SUPABASE_SERVICE_ROLE_KEY=ey...                        # SECRETO

# OpenAI
OPENAI_API_KEY=sk-...                                  # SECRETO

# Resend
RESEND_API_KEY=re_...                                  # SECRETO

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000              # OK público
```

### Regras

- **`NEXT_PUBLIC_*`** — expostas no client, OK pra coisas públicas
- **Sem prefixo** — só server-side, NUNCA exponha no client

### .gitignore (deve ter)

```
.env
.env.local
.env.*.local
```

### Em produção (Vercel)

Configure todas as env vars no dashboard do Vercel. NÃO commite `.env.production`.

### Rotação de secrets

Pelo menos 1x por ano:
- Regenerar API keys (Supabase, OpenAI, Resend)
- Atualizar em Vercel
- Confirmar funcionamento

Em caso de leak:
- Regenerar IMEDIATAMENTE
- Investigar quem teve acesso
- Atualizar todos os ambientes

---

## 7. CSRF E XSS

### CSRF (Cross-Site Request Forgery)

Next.js + Supabase já protege via:
- SameSite cookies (default Lax)
- Validação de origem em Server Actions

### XSS (Cross-Site Scripting)

React já escapa output por padrão:

```tsx
// ✅ React escapa
<div>{userInput}</div>

// ⚠️ CUIDADO — dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // PERIGOSO

// ✅ Se realmente precisar, sanitize antes
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### Content Security Policy (CSP)

Adicione no `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;",
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}
```

---

## 8. RATE LIMITING

### Onde aplicar

- **Login/Signup:** previne brute force
- **Forgot password:** previne spam de email
- **API endpoints sensíveis:** previne abuso

### Como implementar (Vercel Edge)

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),  // 5 reqs/min
})

// api route
export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  // ...
}
```

### Limites recomendados

```
Login:                  5 tentativas/min por IP
Signup:                 3/hora por IP
Forgot password:        3/hora por email
Submit candidate:       10/min por user
AI analyze:             20/hora por user (custo!)
```

---

## 9. UPLOADS DE ARQUIVOS

### Bucket policies (Supabase Storage)

```sql
-- Bucket "cvs" — privado
INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', false);

-- Hunter pode upload pra própria pasta
CREATE POLICY "Recruiters upload own CVs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'cvs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Hunter pode ler próprios CVs
CREATE POLICY "Recruiters read own CVs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cvs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- HR pode ler todos
CREATE POLICY "HR read all CVs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cvs'
    AND EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('hr_manager', 'admin'))
  );

-- Empresa pode ler CVs de candidatos das próprias vagas
-- (mais complexo — fazer via signed URLs)
```

### Signed URLs pra arquivos privados

```typescript
const { data } = await supabase.storage
  .from('cvs')
  .createSignedUrl('path/to/cv.pdf', 60 * 60)  // válido 1h

// data.signedUrl é o link temporário
```

### Validação no upload

```typescript
const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
const MAX_SIZE = 5 * 1024 * 1024

if (!ALLOWED_MIMES.includes(file.type)) {
  throw new Error('Apenas PDF ou Word.')
}

if (file.size > MAX_SIZE) {
  throw new Error('Arquivo muito grande (máx 5MB).')
}
```

### Antivírus
Pra produção séria: integrar ClamAV ou serviço de scan (VirusTotal API). MVP pode pular.

---

## 10. LGPD — LEI GERAL DE PROTEÇÃO DE DADOS

### Princípios LGPD aplicados ao Nexhire

**1. Finalidade**
Coleta apenas dados necessários pra cada finalidade declarada.

**2. Adequação**
Uso dos dados é compatível com a finalidade.

**3. Necessidade**
Não coleta dados desnecessários.

**4. Livre acesso**
Usuário pode acessar seus dados a qualquer momento.

**5. Qualidade dos dados**
Dados corretos, atualizados, claros.

**6. Transparência**
Usuário sabe o que está sendo coletado e por quê.

**7. Segurança**
Medidas técnicas e administrativas pra proteger.

**8. Não discriminação**
Sem discriminação em decisões automatizadas.

**9. Responsabilização**
Empresa demonstra compliance.

### Bases legais aplicáveis

- **Consentimento:** usuário concorda explicitamente (signup)
- **Execução de contrato:** dados necessários pra plataforma funcionar
- **Legítimo interesse:** análise antifraude, segurança
- **Cumprimento de obrigação legal:** ex: dados fiscais

### Documentos obrigatórios

**Política de Privacidade**
- Quem coleta dados (controlador)
- Quais dados coleta
- Finalidades
- Compartilhamento com terceiros
- Direitos do titular
- Período de retenção
- Como exercer direitos
- Contato do DPO (se aplicável)

**Termos de Uso**
- Regras de uso da plataforma
- Direitos e deveres
- Limitação de responsabilidade

**Cookies Policy** (se usar cookies não-essenciais)

### Direitos do titular (artigo 18 LGPD)

Usuário pode pedir:

1. Confirmação de tratamento
2. Acesso aos dados
3. Correção de dados incompletos/inexatos
4. Anonimização, bloqueio ou eliminação
5. Portabilidade
6. Eliminação dos dados (com exceções)
7. Informação sobre compartilhamento
8. Revogação do consentimento

**Implemente:**
- Página "Meus dados" no perfil
- Botão "Solicitar exclusão"
- Email pra `privacidade@nexhire.com`
- Resposta em até 15 dias

### Retenção de dados

Defina prazos por tipo:

```
Conta ativa:                 enquanto usuário usar
Conta inativa > 12 meses:    avisar + eliminar após 60 dias
Candidato não contratado:    24 meses (legítimo interesse pra recontato)
Candidato contratado:        5 anos (contratos)
Logs de segurança:           6 meses
Dados financeiros:           5 anos (obrigação fiscal)
```

### Dados sensíveis (artigo 5 LGPD)

Cuidado extra com:
- Origem racial/étnica
- Convicção religiosa
- Opinião política
- Filiação sindical
- Saúde
- Vida sexual
- Genéticos/biométricos

**Nexhire não deve coletar esses dados.** Se algum CV mencionar, não use pra decisão automatizada.

### Compartilhamento com terceiros

Liste claramente quem recebe dados:

- **Supabase** (hospedagem de banco)
- **Vercel** (hospedagem da aplicação)
- **OpenAI** (análise de CV — ATENÇÃO: dados saem do Brasil)
- **Resend** (envio de email)

Pra cada terceiro: contrato de DPA (Data Processing Agreement).

### LGPD checklist mínimo pra deploy

```
[ ] Política de Privacidade publicada
[ ] Termos de Uso publicados
[ ] Aceite explícito no signup (checkbox)
[ ] Cookie banner se usar cookies não-essenciais
[ ] Email de contato pra exercer direitos (privacidade@nexhire.com)
[ ] Página "Meus dados" no perfil
[ ] Botão "Excluir minha conta"
[ ] Backup com criptografia em repouso
[ ] HTTPS em tudo
[ ] RLS em todas tabelas com dados pessoais
[ ] Logs de acesso a dados sensíveis
[ ] DPO designado (pessoa de contato pra ANPD)
```

---

## 11. LOGS E AUDITORIA

### O que logar

```
✅ LOGE:
- Logins (sucesso e falha)
- Mudanças de role
- Aprovações/rejeições de candidatos
- Acessos a dados de outras empresas/hunters
- Uploads e downloads de arquivos
- Falhas de autorização (RLS bloqueou)
- Exclusões de dados

❌ NÃO LOGUE:
- Senhas (mesmo hash)
- Tokens de auth
- Dados sensíveis em texto plano
- Stack traces com PII em produção
```

### Como logar

```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  event: 'submission.created',
  user_id: user.id,
  resource_id: submission.id,
  // sem dados pessoais
}))
```

### Onde armazenar

- **Curto prazo:** Vercel Logs (free 7 dias)
- **Médio prazo:** Sentry, Datadog, Logtail
- **Longo prazo:** S3/GCS com retenção de 6-12 meses

---

## 12. INCIDENT RESPONSE

### Se houver vazamento de dados

**Em 24h:**
1. Identificar escopo (quem foi afetado, quais dados)
2. Conter (revogar tokens, mudar senhas, fechar buracos)
3. Documentar

**Em 72h (obrigatório LGPD):**
4. Notificar ANPD (gov.br/anpd)
5. Notificar titulares afetados

**Pós-incidente:**
6. Análise de causa raiz
7. Fix permanente
8. Atualizar processos

### Contato ANPD

ANPD (Autoridade Nacional de Proteção de Dados):
gov.br/anpd

---

## 13. CHECKLIST PRÉ-DEPLOY (SEGURANÇA)

```
[ ] HTTPS habilitado (Vercel já força)
[ ] Env vars em vault (Vercel), não em código
[ ] .env.local no .gitignore
[ ] RLS ativado em todas tabelas sensíveis
[ ] Policies testadas com cada role
[ ] Service Role Key NUNCA exposta no client
[ ] Inputs validados com Zod no server
[ ] File uploads validados (tipo, tamanho)
[ ] CSP headers configurados
[ ] X-Frame-Options: DENY
[ ] HSTS habilitado
[ ] Rate limiting em endpoints sensíveis
[ ] Logs configurados (sem PII)
[ ] Política de Privacidade publicada
[ ] Termos de Uso publicados
[ ] Aceite no signup
[ ] Página "Meus dados"
[ ] Opção de excluir conta
[ ] Backups automáticos configurados
[ ] Plano de incident response documentado
[ ] DPO designado
[ ] DPA com OpenAI/Supabase/Vercel/Resend
```

---

## 14. ANTIPADRÕES (NUNCA FAÇA)

```
❌ Service Role Key em código client
❌ Storar senha em plain text
❌ Logar dados pessoais
❌ SQL com string concatenation
❌ dangerouslySetInnerHTML sem sanitização
❌ HTTPS opcional
❌ RLS desativado "temporariamente" em produção
❌ Hardcoded secrets em código
❌ Confiar em validação só do client
❌ Tokens em URL params
❌ CORS aberto pra *
❌ Cookies sem SameSite
❌ Senha mín 4 caracteres
❌ Permitir reuso de senha antiga
❌ Login sem rate limit
❌ Upload sem validação de tipo MIME
❌ Stack trace exposto pro usuário em produção
❌ Coleta de dados sem finalidade clara
❌ Compartilhar dados sem consentimento
❌ Reter dados depois de não ser mais necessário
```

---

## 15. RECURSOS

- **LGPD oficial:** planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- **ANPD:** gov.br/anpd
- **OWASP Top 10:** owasp.org/Top10
- **Supabase Security:** supabase.com/docs/guides/auth
- **Next.js Security:** nextjs.org/docs/app/building-your-application/authentication
