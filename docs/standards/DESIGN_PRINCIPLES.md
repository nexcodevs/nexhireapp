# DESIGN PRINCIPLES — NEXHIRE

> Diretrizes de design, UI e UX. Toda decisão visual no produto passa por aqui.
> Inspirações de referência: Stripe, Linear, Vercel, Cursor, Notion, Ashby, Greenhouse.

---

## 1. FILOSOFIA DE DESIGN

### Princípios não-negociáveis

**1. Calma e confiança vencem entusiasmo.**
Produto premium não grita. Use whitespace generoso, hierarquia clara, tipografia confiante. Se a interface está "vibrando", está errado.

**2. Densidade de informação inversamente proporcional à importância visual.**
Tela de operação (HR Manager fazendo curadoria) pode ser densa. Página de marketing tem que respirar. Decisão de densidade segue o usuário, não a estética.

**3. Cada pixel justifica sua existência.**
Antes de adicionar elemento, pergunte: "Se eu tirar isso, alguém vai sentir falta?" Se não, fora.

**4. Movimento serve à comunicação, nunca à decoração.**
Animação aceitável: feedback de ação, transição de contexto, indicação de estado. Inaceitável: chamar atenção sem motivo, efeitos por efeito.

**5. Consistência > Criatividade pontual.**
Se o sistema tem 7 variants de Button, use os 7. Não invente o 8º porque "ficaria mais bonito aqui". Quebra do padrão = bug.

**6. O usuário não deveria perceber que está usando um produto.**
Friction zero. Estado zero ambíguo. Erro zero confuso. Se ele precisa pensar onde clicar, o design falhou.

---

## 2. SISTEMA DE TOKENS

Todos os tokens vivem em `src/app/globals.css` como CSS Custom Properties. **Nunca use cores hardcoded** em componentes.

### Cores

```
Brand greens (escuros, autoritativos):
  --color-f950: #041B0B   /* quase preto, pouco uso */
  --color-f900: #052E16   /* sidebar, headers escuros, botão primary */
  --color-f800: #064E1F   /* hover de primary */
  --color-f700: #0F6B35

Brand greens (vibrantes, ação):
  --color-g600: #16A34A   /* texto verde, eyebrow, links */
  --color-g500: #22C55E
  --color-g400: #4ADE80
  --color-neon: #00E676   /* highlight, hover, acento neon */

Soft greens (fundos):
  --color-m100: #ECFDF5   /* hover sutil de items */
  --color-m200: #D1FAE5   /* badges, AI pills */
  --color-m300: #A7F3D0
  --color-border-g: #BBF7D0

Neutros:
  --color-bg-app: #FAFAFA   /* fundo geral */
  --color-surf: #FFFFFF     /* cards */
  --color-cream: #F7F6F2    /* fundos secundários */

Texto:
  --color-text: #052E16     /* primário */
  --color-text2: #374151    /* corpo */
  --color-muted: #6B7280    /* secundário */
  --color-subtle: #9CA3AF   /* hint, labels */

Bordas:
  --color-border: #E5E7EB
  --color-border2: #D1D5DB
```

### Quando usar qual cor

- **Primary CTA** (Salvar, Aprovar, Enviar): `--color-f900` (botão dark)
- **Destaque/Ação especial** (highlights, badges premium): `--color-neon`
- **Texto crítico** (headlines): `--color-text`
- **Texto de apoio** (parágrafos, labels): `--color-muted`
- **Hint/Placeholder** (texto auxiliar): `--color-subtle`
- **Estado positivo**: `--color-g600`, `--color-m100`
- **Hover sutil** em items de lista: `--color-m100`

### Estados semânticos (NÃO tem variável, use direto)

```
Erro:      #FEF2F2 (bg) + #991B1B (text) + #FECACA (border)
Warning:   #FFFBEB (bg) + #92400E (text) + #FDE68A (border)
Info:      #EFF6FF (bg) + #1E40AF (text) + #DBEAFE (border)
```

---

## 3. TIPOGRAFIA

### Famílias

```
--font-sans: Inter           (corpo, UI, números regulares)
--font-serif: Instrument Serif (destaques editoriais, números grandes em italic)
--font-mono: JetBrains Mono    (códigos, IDs, métricas técnicas, eyebrows)
```

### Escala tipográfica (sem invenção, use estes)

**Headlines de página:**
- 32px / weight 700 / letter-spacing -0.025em / line-height 1.15
- Use componente `<PageHeader>` sempre

**Sub-headlines (seções dentro de página):**
- 18px / weight 600 / line-height 1.3

**Card titles:**
- 14px / weight 600 / letter-spacing -0.01em

**Body principal:**
- 13.5px / weight 400 / line-height 1.65 / color `--color-text2`

**Body secundário:**
- 12.5px / weight 400 / line-height 1.5 / color `--color-muted`

**Labels e meta:**
- 11px-12px / weight 500 / color `--color-subtle`

**Eyebrow (acima de headline):**
- 10.5px / weight 600 / letter-spacing 0.18em / text-transform uppercase / color `--color-g600`
- Sempre acompanhado de bolinha `--color-neon` à esquerda

**Números grandes (KPIs, scores):**
- Use Instrument Serif italic (classe `.it`)
- 28-38px / weight 400 (serif não precisa de bold) / letter-spacing -0.02em
- Cor segue contexto (verde pra positivo, preto pra neutro, neon pra destaque máximo)

**Código/Mono:**
- 11-13px / weight 400 ou 500
- Use pra: AI scores, IDs, valores monetários, version numbers, dates específicas

### Headlines editoriais (estilo Nexhire)

Padrão "Texto regular + accent italic" assinatura do produto:

```tsx
<h1>
  Olá, <span className="it" style={{ color: 'var(--color-g600)' }}>
    Daniel
  </span>
</h1>
```

A parte italic deve ser sempre **um substantivo ou verbo de impacto**, não um conector. Bons exemplos:
- "Vagas *disponíveis*"
- "Candidatos *curados*"
- "Olá, *Mariana*"
- "Sua *performance*"

Maus exemplos (evite):
- "Vagas *para* hunters" (a italic está num conector)
- "Olá *e* bem-vindo" (italic genérica)

---

## 4. ESPAÇAMENTO E LAYOUT

### Escala de espaçamento (use múltiplos de 4)

```
xs: 4px    sm: 8px    md: 16px    lg: 24px    xl: 32px    2xl: 48px    3xl: 64px
```

**Regra de ouro:**
- Espaço **dentro** de componente: 8-16px (sm-md)
- Espaço **entre** componentes irmãos: 16-24px (md-lg)
- Espaço **entre seções** de uma página: 32-48px (xl-2xl)
- Padding **vertical** de página: 40px no top, 64px no bottom

### Containers e largura

```
max-w-4xl: 768px    (formulários, conteúdo focado)
max-w-5xl: 1024px   (dashboards, listas)
max-w-6xl: 1152px   (kanbans, dados extensos)
```

**Padding lateral do main:** 40-48px no desktop.
**Padding em mobile:** 16-24px.

### Grid

Use CSS Grid pra layouts de página. Flex pra alinhamento interno de componentes.

Padrões mais comuns:
- 2 colunas iguais: `grid-cols-2` com gap 16-24px
- Dashboard com 4 stats: `grid-cols-2 lg:grid-cols-4` gap 16px
- Conteúdo + sidebar: `grid-cols-[1fr_320px]` gap 24px

### Border radius (consistência crítica)

```
4-6px:   tags muito pequenas
8-10px:  inputs, pequenos badges (badges são pill: 999px)
12px:    elementos secundários
16-20px: cards de stats, items menores
24px:    cards principais (default Card)
28-32px: hero cards, CTAs grandes, modais
999px:   pills, botões, badges
```

**Nunca use mais de 3 raios diferentes na mesma tela.** Se a tela tem cards de 24px, badges de 999px e inputs de 12px, está bom. Adicionar um quarto raio = ruído.

---

## 5. COMPONENTES (USAR, NÃO REINVENTAR)

Todos em `src/components/ui/`.

### Card
4 variants disponíveis. Sempre use `<Card>`, nunca `<div>` simulando card.
- `default` — branco com sombra suave
- `mint` — gradiente verde claro (use pra destaque positivo)
- `dark` — fundo `--color-f900` (use pra CTAs escuros)
- `flat` — bege/cream (use pra fundos secundários)

### Button
7 variants. Tamanhos: sm (36px), md (42px), lg (50px).
- `primary` / `dark` — verde escuro, CTA principal
- `neon` — verde neon, ações de destaque máximo (poucos usos)
- `secondary` — branco com borda
- `outline` — transparente com borda
- `ghost` — sem fundo nem borda
- `danger` — vermelho claro
- Loading state nativo via prop `loading`

### Badge
7 variants: green / yellow / red / blue / gray / dark / neon. 2 tamanhos: sm, md.

### PageHeader
**Use em toda página nova.** Padrão obrigatório do produto.

### Input
Único componente de form. Tem label, placeholder, validação visual.

### Regra absoluta
**Se você está prestes a estilizar manualmente um botão/card/badge, está errado.** Use o componente do design system. Se realmente não atende, **adicione variant ao componente existente** (em ui/) em vez de criar inline.

---

## 6. INTERAÇÃO E MOVIMENTO

### Transições

```css
transition: all 0.18s cubic-bezier(.16, 1, .3, 1);  /* default — easing premium */
```

**Duração por contexto:**
- Micro-interactions (hover, focus): 150-200ms
- Estado de componente (collapse, expand): 200-300ms
- Mudança de contexto (page transition, modal): 250-400ms

**Nunca:**
- Durações abaixo de 100ms (parece bug)
- Acima de 500ms (parece travado)
- `linear` easing (parece mecânico)

### Hover states

Todo elemento clicável tem hover state. Sem exceção.
- Botões: leve translate up + sombra mais intensa
- Cards clicáveis: border vira `--color-border-g` + sombra s2
- Items de lista: background `--color-m100`
- Links de texto: underline aparece

### Active/Pressed states

`transform: scale(0.97)` em botões. Feedback tátil mesmo no clique do mouse.

### Focus states (acessibilidade!)

```css
outline: 2px solid var(--color-neon);
outline-offset: 2px;
```

**Nunca remova outline sem substituir.** Já está no globals.css.

### Loading states

Use spinner do componente Button (prop `loading`). Pra páginas inteiras, use skeleton screens (Card vazios pulsando).

**Nunca use spinner sozinho centralizado na tela** — parece amador.

---

## 7. ESTADOS VAZIOS (EMPTY STATES)

Estado vazio é uma oportunidade de UX, não erro. Todo empty state tem:

1. **Ícone ou ilustração** (sutil, verde claro, círculo de 48-64px)
2. **Headline curta** ("Sem candidatos ainda")
3. **Explicação curta** (1 linha, explica o porquê)
4. **CTA quando aplicável** ("Criar primeira vaga")

Exemplo do padrão (use como referência):

```tsx
<Card padding="lg" className="text-center">
  <div className="py-12">
    <div style={{
      width: '48px', height: '48px', borderRadius: '50%',
      background: 'var(--color-m100)', margin: '0 auto 16px',
      display: 'grid', placeItems: 'center'
    }}>
      <Icon />
    </div>
    <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
      Sem candidatos ainda
    </p>
    <p style={{ fontSize: '12px', color: 'var(--color-subtle)', marginBottom: '20px' }}>
      Quando hunters enviarem candidatos pra essa vaga, eles aparecem aqui.
    </p>
    <Button variant="dark" size="sm">Ver hunters disponíveis</Button>
  </div>
</Card>
```

**Nunca:**
- "No data found" / "Nothing here" / "Vazio" — preguiça
- Spinner permanente onde devia ter empty state
- Tela completamente branca

---

## 8. FEEDBACK VISUAL (sucesso, erro, info, warning)

### Princípio

Feedback aparece **onde a ação aconteceu**, não em popup global.

### Toast/notificações global
Use apenas pra eventos assíncronos (email enviado, processo terminou). Posição: bottom-right, autodismiss 4-5s.

### Feedback inline (preferido)
Após submeter form, o feedback aparece logo abaixo do botão ou no topo do card. Cor e ícone semânticos.

### Modal de confirmação
Use **apenas pra ações destrutivas/irreversíveis** (deletar, cancelar vaga, rejeitar candidato em massa). Senão, é fricção desnecessária.

---

## 9. DENSIDADE DE INFORMAÇÃO

**Tela de operador** (HR Manager curando, kanban, listas longas):
- Mais densa, mais informação por scroll
- Padding interno menor em cards
- Font-size 12-13px no corpo
- Botões `size="sm"`

**Tela de cliente** (empresa avaliando candidato):
- Menos densa, foco em decisão
- Padding mais generoso
- Font-size 14-15px no corpo
- Botões `size="md"` ou `lg`

**Tela de marketing/onboarding** (login, signup, landing):
- Whitespace generoso
- Headlines grandes (40-60px)
- Padding generoso
- Botões `size="lg"`

---

## 10. RESPONSIVE

### Breakpoints
```
sm: 640px     (smartphones grandes / phablets)
md: 768px     (tablets)
lg: 1024px    (laptops pequenos) — desktop começa aqui
xl: 1280px    (desktop padrão)
2xl: 1536px   (telas grandes)
```

### Princípios

- **Mobile-first em telas públicas** (login, signup, landing)
- **Desktop-first em telas operacionais** (dashboards, kanban) — operação real acontece em desktop
- **Sidebar vira drawer (hamburger)** em telas < lg
- **Tabelas viram cards verticais** em mobile (nunca scroll horizontal infinito)
- **Touch targets ≥ 44px** em mobile (mãos, não cursor)

---

## 11. MICROCOPY VISUAL (textos que viram parte do design)

### Labels de campo
- Curtos, sem ponto final, sem "obrigatório" (use asterisco)
- Bom: "Nome completo", "Email"
- Ruim: "Por favor, digite seu nome completo:"

### Placeholders
- Mostram FORMATO esperado, não repetem label
- Bom: "Ex: João da Silva", "voce@empresa.com"
- Ruim: "Digite seu nome", "Digite seu email"

### Mensagens de sistema
- Confiantes e diretas, sem desculpas
- Bom: "Email já cadastrado. Faça login ou recupere sua senha."
- Ruim: "Desculpe, parece que esse email já existe em nosso sistema. Tente outro ou..."

### CTAs (botões)
- Verbo + objeto. Sempre. Sem genéricos.
- Bom: "Aprovar candidato", "Criar vaga", "Enviar candidato"
- Ruim: "OK", "Confirmar", "Enviar" sozinho, "Clique aqui"

Veja `COPY_AND_TONE.md` pra mais sobre voz e tom.

---

## 12. ICONOGRAFIA

Use **lucide-react** exclusivamente. Não misture biblioteca.

### Tamanhos padrão
- 14px em botões pequenos e badges
- 16px em buttons médios e inline
- 18-20px em headers e ícones de menu
- 24px em hero areas
- 48px em empty states

### Cor
- Default: herda do contexto (currentColor)
- Em fundos claros: `--color-muted` ou `--color-text`
- Em fundos escuros: branco ou `--color-neon`
- Stroke width: 1.8 ou 2 (consistente na tela inteira)

### Quando NÃO usar ícone
- Em texto inline aleatório (parece spam)
- Em labels de form (label tem texto, basta)
- Decorando coisas sem ação (mero enfeite = ruído)

---

## 13. ARTIFACTS DE MARCA

### Logo
- SVG sempre que possível
- `nexhire-logo.svg` em headers, login, emails
- `nexhire-symbol.svg` em avatares, favicon, OG image

### Eyebrow (assinatura do produto)

Bolinha neon + texto verde uppercase letter-spaced. Padrão Nexhire. Use em toda PageHeader.

```tsx
<div className="page-eye">
  <span className="dot" /> CURADORIA
</div>
```

### Cards com gradient mint
Reservado pra **destaque positivo** (cards de performance, success messages, cards de IA). Nunca em CTAs normais.

### Tom escuro (`--color-f900`)
Reservado pra **CTAs principais e sidebar**. Não use em cards aleatórios, fica pesado.

---

## 14. CHECKLIST ANTES DE COMMITAR UMA TELA

```
[ ] Page tem <PageHeader> com eyebrow + título com italic accent
[ ] Cores usadas estão todas no design system (var(--color-...))
[ ] Espaçamentos seguem múltiplos de 4
[ ] Border radius consistente (no máx 3 raios na mesma tela)
[ ] Todos os elementos clicáveis têm hover state
[ ] Empty state implementado se a lista pode estar vazia
[ ] Loading state implementado se fetch demora >300ms
[ ] Error state implementado se a operação pode falhar
[ ] Textos seguem regras de microcopy (labels curtos, CTAs verbo+objeto)
[ ] Sem emojis no produto
[ ] Sem texto em CAPS exceto eyebrows e badges
[ ] Mobile responsivo testado em < 768px
[ ] Focus visible funcionando (teste com Tab)
[ ] Sem cores hardcoded fora de globals.css
[ ] Components base reutilizados (Card, Badge, Button, etc)
```

---

## 15. ANTIPADRÕES (NUNCA FAÇA)

- ❌ Cor primary diferente em telas diferentes
- ❌ Mais de 2 níveis de hierarquia tipográfica na mesma seção
- ❌ Texto cinza claro em fundo cinza claro (contraste < 4.5:1)
- ❌ Componente novo onde tem componente do design system equivalente
- ❌ Padding inconsistente (ex: 17px num lugar, 23px noutro)
- ❌ Border-radius "uns mais arredondados que outros"
- ❌ Ícones de bibliotecas diferentes na mesma tela
- ❌ Animação sem motivo funcional
- ❌ Spinner full-screen genérico
- ❌ Modal de "OK" sem ação
- ❌ Texto "Loading...", "Please wait" (use skeleton)
- ❌ Mensagem de erro genérica ("Something went wrong")
- ❌ Botões disabled sem feedback de POR QUÊ está disabled

---

## INSPIRAÇÕES PRA REVISAR REGULARMENTE

- **Linear** (linear.app) — densidade premium, motion sutil
- **Stripe Dashboard** (dashboard.stripe.com) — padrão ouro de produto financeiro
- **Vercel** (vercel.com) — tipografia, hierarquia, calma
- **Ashby** (ashbyhq.com) — referência do nosso vertical (recruitment)
- **Cursor** (cursor.com) — produto técnico com identidade forte
- **Notion** (notion.so) — densidade variável, microcopy excelente
