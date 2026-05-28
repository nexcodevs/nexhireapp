# ACCESSIBILITY — NEXHIRE

> Acessibilidade não é opcional. Produtos premium são acessíveis por padrão.
> Referência: WCAG 2.1 nível AA (alvo mínimo).

---

## 1. POR QUE ACESSIBILIDADE IMPORTA

### Razões de negócio

- **15% da população mundial** tem alguma deficiência (OMS)
- **No Brasil:** 8.4% têm deficiência grave (IBGE 2019)
- **LGPD/LBI:** Lei Brasileira de Inclusão exige acessibilidade digital
- **SEO:** Google ranqueia melhor sites acessíveis
- **Usabilidade geral:** todo mundo se beneficia (subtítulos em vídeo, contraste alto)

### Razões de qualidade

- Acessibilidade é **proxy de qualidade de código.** Componentes acessíveis tendem a ser bem estruturados.
- **Detecta bugs cedo.** Teste com teclado revela bugs invisíveis.

---

## 2. PRINCÍPIOS WCAG (POUR)

### Perceptible
Conteúdo perceptível por todos os sentidos relevantes.

### Operable
Interface utilizável com qualquer dispositivo (teclado, mouse, voz, switch).

### Understandable
Informação e operação claras.

### Robust
Funciona com tecnologias assistivas (screen readers, etc).

---

## 3. CONTRASTE DE CORES (CRÍTICO)

### Padrões WCAG AA

```
Texto normal (< 18px ou < 14px bold):  4.5:1 mínimo
Texto grande (≥ 18px ou ≥ 14px bold):  3:1 mínimo
Elementos UI (ícones, bordas):         3:1 mínimo
```

### Combinações verificadas no design system

```
✅ --color-text (#052E16) sobre --color-surf (#FFF):     15.8:1
✅ --color-text2 (#374151) sobre --color-surf (#FFF):    9.2:1
✅ --color-muted (#6B7280) sobre --color-surf (#FFF):    4.8:1
✅ --color-subtle (#9CA3AF) sobre --color-surf (#FFF):   2.9:1  ⚠️ NÃO use pra texto importante

✅ #FFF sobre --color-f900 (#052E16):                    15.8:1
✅ --color-neon (#00E676) sobre --color-f900:            6.3:1
✅ --color-m100 (#ECFDF5) sobre --color-f800 (#064E1F):  11.4:1
```

### Regra de uso

- **Texto importante** (headlines, parágrafos): `--color-text` ou `--color-text2`
- **Texto auxiliar** (labels, captions): `--color-muted`
- **Hint/Decorativo** (apenas como apoio visual): `--color-subtle` — NÃO use pra informação crítica

### Validar contraste

Use https://webaim.org/resources/contrastchecker/

---

## 4. NAVEGAÇÃO POR TECLADO

### Princípios

- **Tudo clicável é tabulável.** Tab deve passar por TODOS os elementos interativos.
- **Foco visível.** Sempre. Não esconda outline.
- **Ordem lógica.** Tab segue a leitura natural (top→bottom, left→right).

### Atalhos esperados

```
Tab           Próximo elemento focável
Shift + Tab   Elemento anterior
Enter / Espaço Ativa botão/link
Esc           Fecha modal/dropdown
Setas         Navega em listas, dropdowns, kanban
```

### Implementação

```tsx
// ✅ Use elementos semânticos
<button onClick={...}>Aprovar</button>

// ❌ NÃO use div pra ser botão
<div onClick={...}>Aprovar</div>

// ✅ Se PRECISAR div clicável, faça acessível:
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Aprovar
</div>
```

### Focus styles (já estão em globals.css)

```css
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 2px solid var(--color-neon);
  outline-offset: 2px;
}
```

**Nunca remova** sem substituir.

### Skip links (recomendado)

```tsx
// No topo do layout
<a href="#main-content" className="sr-only focus:not-sr-only">
  Pular para conteúdo principal
</a>

<main id="main-content">...</main>
```

---

## 5. ELEMENTOS SEMÂNTICOS

### Use HTML correto

```tsx
// ✅ Estrutura semântica
<header>
  <nav>
    <ul>
      <li><a href="...">Link</a></li>
    </ul>
  </nav>
</header>

<main>
  <h1>Página</h1>
  <section>
    <h2>Seção</h2>
    <article>...</article>
  </section>
</main>

<footer>...</footer>

// ❌ Apenas divs
<div className="header">
  <div className="nav">
    <div className="item">Link</div>
  </div>
</div>
```

### Hierarquia de headings

- **Um** `<h1>` por página (geralmente no PageHeader)
- `<h2>` pra seções principais
- `<h3>` pra subseções
- **Nunca pule níveis** (h1 → h3 sem h2)

### Botões vs Links

```
<button>    Pra ações (submit, abrir modal, toggle)
<a href>    Pra navegação (URL muda)
```

Erro comum: `<a onClick={...}>` sem href. Use button.

---

## 6. FORMS ACESSÍVEIS

### Labels obrigatórios

```tsx
// ✅ Label associado
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ✅ Label aninhado
<label>
  Email
  <input type="email" />
</label>

// ❌ Sem label
<input type="email" placeholder="Email" />

// ✅ Se realmente sem label visível (raro)
<input type="search" aria-label="Buscar vagas" />
```

### Mensagens de erro associadas

```tsx
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : undefined}
/>
{error && (
  <p id="email-error" role="alert" className="text-red-600">
    {error}
  </p>
)}
```

### Campos obrigatórios

```tsx
// ✅ aria-required + indicação visual
<label htmlFor="name">
  Nome <span aria-hidden="true">*</span>
</label>
<input id="name" required aria-required="true" />
```

### Grouping com fieldset

```tsx
<fieldset>
  <legend>Modelo de trabalho</legend>
  <input type="radio" id="remoto" name="modelo" />
  <label htmlFor="remoto">Remoto</label>

  <input type="radio" id="presencial" name="modelo" />
  <label htmlFor="presencial">Presencial</label>
</fieldset>
```

---

## 7. IMAGENS E ÍCONES

### Alt text

```tsx
// ✅ Imagem informativa
<img src="/avatar.jpg" alt="Foto de perfil de Daniel Moraes" />

// ✅ Imagem decorativa (não adiciona info)
<img src="/decoracao.svg" alt="" />

// ❌ Alt redundante ou inútil
<img src="/avatar.jpg" alt="imagem" />
<img src="/avatar.jpg" alt="image of profile" />
```

### Ícones inline

```tsx
// ✅ Ícone decorativo (texto explica)
<button>
  <CheckIcon aria-hidden="true" />
  Aprovar candidato
</button>

// ✅ Ícone único (sem texto)
<button aria-label="Fechar modal">
  <XIcon aria-hidden="true" />
</button>

// ❌ Ícone sozinho sem aria-label
<button>
  <XIcon />
</button>
```

### Logo

```tsx
<Image
  src="/brand/nexhire-logo.svg"
  alt="Nexhire"
  width={120}
  height={32}
/>
```

---

## 8. ARIA — USE COM PARCIMÔNIA

### Regra de ouro

> **"A primeira regra do ARIA é: não use ARIA."**

Se HTML semântico já comunica, ARIA é redundante. Use ARIA apenas quando HTML não basta.

### Quando usar

```tsx
// ✅ Estado dinâmico não-padrão
<div role="alert">Erro ao salvar</div>
<button aria-expanded={isOpen} aria-controls="menu">Menu</button>

// ✅ Componentes customizados sem equivalente HTML
<div role="tablist">
  <button role="tab" aria-selected={true}>Tab 1</button>
</div>

// ✅ Live regions
<div aria-live="polite">{message}</div>
```

### ARIA roles comuns

```
role="button"           Pra div clicável (raro — prefira <button>)
role="alert"            Pra mensagens de erro/sucesso
role="dialog"           Pra modais (com aria-modal="true")
role="navigation"       Pra navs (se <nav> não é usado)
role="search"           Pra forms de busca
role="status"           Pra updates não-críticos
role="tablist/tab"      Pra abas
role="tooltip"          Pra tooltips
```

### aria-label vs aria-labelledby

```tsx
// aria-label — quando label não está visível
<button aria-label="Fechar">×</button>

// aria-labelledby — quando label existe na página
<h2 id="modal-title">Confirmar exclusão</h2>
<div role="dialog" aria-labelledby="modal-title">
  ...
</div>
```

---

## 9. MODAIS ACESSÍVEIS

### Requisitos

- Foco vai pro modal ao abrir
- Foco fica preso dentro do modal (focus trap)
- Esc fecha o modal
- Foco volta pro elemento que abriu ao fechar
- aria-modal e role="dialog"

### Bibliotecas recomendadas

- **Radix UI Dialog** — acessível por padrão, integra com Tailwind
- **Headless UI** — alternativa

### Exemplo manual (sem lib)

```tsx
function Modal({ open, onClose, children }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      ref={dialogRef}
      tabIndex={-1}
    >
      {children}
    </div>
  )
}
```

---

## 10. CONTRASTE EM ESTADOS ESPECIAIS

### Estados disabled

```css
/* ❌ Disabled sem contraste suficiente */
button:disabled {
  opacity: 0.3;  /* texto fica < 4.5:1 */
}

/* ✅ Disabled legível */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Hover/focus em fundo escuro

Garante que estado focado seja **visível** em fundo escuro:

```css
button:focus-visible {
  outline: 2px solid var(--color-neon);  /* contraste alto */
  outline-offset: 2px;
}
```

---

## 11. MOVIMENTO E ANIMAÇÃO

### Respeite `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

(Já está no globals.css.)

### Evite

- Flash piscando > 3 vezes por segundo (gatilho de epilepsia)
- Animação automática contínua sem pausa
- Movimento como única forma de comunicar (ex: badge que só "treme" sem texto)

---

## 12. CONTEÚDO DINÂMICO (LIVE REGIONS)

Quando conteúdo atualiza sem reload, avise screen readers.

### aria-live

```tsx
// Polite — anuncia quando screen reader estiver livre
<div aria-live="polite">{statusMessage}</div>

// Assertive — anuncia imediatamente (use com parcimônia)
<div aria-live="assertive" role="alert">{errorMessage}</div>
```

### Quando usar

- **polite:** atualizações não-críticas (item salvo, contador)
- **assertive:** erros, alertas urgentes, sessão expirada

### NÃO use pra

- Conteúdo que muda muito frequentemente (timer)
- Conteúdo que o usuário já está olhando

---

## 13. TABLES ACESSÍVEIS

```tsx
<table>
  <caption className="sr-only">Lista de vagas abertas</caption>
  <thead>
    <tr>
      <th scope="col">Vaga</th>
      <th scope="col">Empresa</th>
      <th scope="col">Candidatos</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Engenheiro de Software</th>
      <td>Nexco</td>
      <td>3</td>
    </tr>
  </tbody>
</table>
```

---

## 14. ATALHOS E HELPERS

### Tailwind classes úteis

```
sr-only           Visualmente escondido, mas lido por screen readers
not-sr-only       Reverte sr-only
focus:not-sr-only Mostra ao focar (útil pra skip links)
```

### sr-only manual

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## 15. TESTES DE ACESSIBILIDADE

### Manual

**Checklist por tela:**

```
[ ] Tab passa por TODOS os elementos clicáveis em ordem lógica
[ ] Foco visível em todos
[ ] Enter/Espaço ativa botões
[ ] Esc fecha modais
[ ] Setas funcionam em listas/dropdowns
[ ] Screen reader (VoiceOver no Mac, NVDA no Windows) anuncia tudo
[ ] Zoom 200% — conteúdo não quebra
[ ] Contraste suficiente em todos os textos
[ ] Imagens com alt
[ ] Forms com labels
[ ] Mensagens de erro lidas após submit
```

### Ferramentas automatizadas

```
axe DevTools     Extensão Chrome/Firefox
WAVE             webaim.org/wave
Lighthouse       Chrome DevTools (já vem instalado)
Pa11y            CLI
@axe-core/react  Lib pra dev em React
```

### Lighthouse (mínimo aceitável)

```
Accessibility: 95+
```

---

## 16. SCREEN READERS — TESTE MENSAL

Faça teste mensal com screen reader em fluxos críticos.

### Mac (VoiceOver — grátis)

```
Cmd + F5     Liga/desliga
VO + Right   Próximo elemento
VO + Space   Ativa
```

(VO = Control + Option por padrão)

### Windows (NVDA — grátis)

```
Insert + ↓   Lê de onde está
Insert + ↑   Próximo elemento
Space        Ativa
```

### Teste estes fluxos:

1. Login completo
2. Criar uma vaga
3. Enviar um candidato
4. Aprovar candidato (HR)
5. Navegar dashboard com Tab

---

## 17. ANTIPADRÕES (NUNCA FAÇA)

```
❌ outline: none sem substituir
❌ <div onClick> em vez de <button>
❌ Texto cinza claro em fundo cinza claro
❌ Form sem labels
❌ Imagem sem alt
❌ <h1> dentro de <h3> (hierarquia bagunçada)
❌ Cor como única forma de comunicar (ex: "campos em vermelho são erros")
❌ Texto em imagem (use texto real)
❌ "Clique aqui" como link
❌ Tabela usada pra layout
❌ Modal sem focus trap
❌ Tooltip que só aparece em hover (não funciona com teclado)
❌ Animação contínua sem opção de pausar
❌ Auto-play de vídeo/áudio com som
❌ Botão disabled sem indicação visual ou textual de POR QUÊ
```

---

## 18. CHECKLIST FINAL DE A11Y

```
[ ] Lighthouse Accessibility ≥ 95
[ ] Zero erros no axe DevTools
[ ] Navegação completa por teclado em telas críticas
[ ] Screen reader anuncia ações principais
[ ] Contraste mínimo 4.5:1 em todo texto
[ ] Todas as imagens com alt
[ ] Todos os forms com labels
[ ] Focus visible em todos os interativos
[ ] Mensagens de erro associadas via aria-describedby
[ ] Modais com focus trap e Esc
[ ] Live regions pra updates dinâmicos
[ ] prefers-reduced-motion respeitado
[ ] Sem cor como única forma de comunicar
```

---

## 19. RECURSOS

- **WCAG 2.1 Guidelines:** w3.org/WAI/WCAG21/quickref
- **WebAIM:** webaim.org
- **A11y Project:** a11yproject.com
- **MDN ARIA:** developer.mozilla.org/docs/Web/Accessibility/ARIA
- **Inclusive Components:** inclusive-components.design
