# COPY AND TONE — NEXHIRE

> Voz, microcopy e tom de comunicação. Como o produto fala com o usuário.
> Referências: Stripe Docs, Linear, Notion, Mailchimp Voice Guide.

---

## 1. PRINCÍPIOS DE VOZ

### Quem somos quando falamos

A Nexhire é um **especialista calmo, confiante e direto.** Como um consultor sênior que respeita o tempo do cliente.

**Somos:**
- Diretos sem ser secos
- Confiantes sem ser arrogantes
- Cuidadosos sem ser paternalistas
- Modernos sem ser informais demais
- Brasileiros sem ser regionais demais

**Não somos:**
- Animados ("Ebaa! Você conseguiu!!! 🎉")
- Subservientes ("Por favor, desculpe-nos o transtorno...")
- Genéricos ("Algo deu errado")
- Técnicos ("Erro 500: internal server error")
- Casuais demais ("opa, beleza?")

### Comparação rápida

```
SITUAÇÃO              VOZ ERRADA                      VOZ NEXHIRE
─────────────────────────────────────────────────────────────────────────
Vaga criada          "🎉 Sucesso! Sua vaga foi       "Vaga criada. HR vai
                     criada com sucesso!"            revisar em até 24h."

Email já existe      "Ops! Parece que esse email     "Email já cadastrado.
                     já está em uso, sorry!"         Faça login ou recupere
                                                     sua senha."

Erro de servidor     "Oh não! Algo deu errado.       "Não foi possível salvar.
                     Tente novamente mais tarde."    Tente novamente em
                                                     alguns minutos."

Carregando           "Aguarde, estamos               (skeleton screen + sem
                     trabalhando nisso..."           texto desnecessário)

Confirmação          "Tem certeza absoluta?          "Cancelar vaga? Você
                     Essa ação não pode ser          não poderá reverter."
                     desfeita!"
```

---

## 2. REGRAS DE OURO

### 1. Use a 2ª pessoa do singular

"Sua vaga foi enviada" / "Você tem 3 envios restantes".
Trate o usuário como indivíduo, não como "você(s) plural" formal.

### 2. Voz ativa, sempre que possível

```
RUIM (passivo):  "A vaga foi enviada com sucesso."
BOM (ativo):     "Vaga enviada."

RUIM:            "Sua sessão foi expirada pelo sistema."
BOM:             "Sua sessão expirou."
```

### 3. Verbos no presente quando for ação completa

```
RUIM:    "Sua vaga foi criada e está sendo enviada para revisão."
BOM:     "Vaga criada. Em revisão pelo HR."
```

### 4. Curto > Longo (sempre)

```
RUIM:    "Por favor, preencha todos os campos obrigatórios marcados com asterisco antes de prosseguir com o envio."
BOM:     "Preencha os campos obrigatórios."
MELHOR:  (já está implícito pelo asterisco visual)
```

### 5. Específico > Genérico

```
RUIM:    "Houve um problema."
BOM:     "Email já cadastrado."

RUIM:    "Operação realizada."
BOM:     "Candidato enviado pro HR."
```

### 6. Diga O QUE FAZER, não SÓ o que está errado

```
RUIM:    "Email inválido."
BOM:     "Use o formato voce@empresa.com"

RUIM:    "Você não tem permissão."
BOM:     "Apenas o HR Manager pode aprovar vagas. Fale com seu time."
```

---

## 7. TIPOS DE TEXTO E PADRÕES

### 7.1 Botões (CTAs)

**Verbo + objeto.** Sem genéricos.

```
GOOD                          BAD
Criar vaga                    Salvar
Enviar candidato              Confirmar
Aprovar candidato             OK
Recuperar senha               Continuar
Voltar para vagas             Voltar
Excluir vaga                  Confirmar
Conectar conta Google         Conectar
```

**Exceções aceitáveis:**
- "Salvar" como CTA de form de edição
- "Cancelar" como botão secundário de modal
- "Fechar" pra modais informativos

### 7.2 Headlines de página

Estrutura padrão: **substantivo + accent italic ou verbo no infinitivo**

```
GOOD                          BAD
Olá, Daniel                   Bem-vindo ao seu dashboard!
Suas contratações             Dashboard
Vagas disponíveis             Vagas
Candidatos curados            Lista de candidatos
Curadoria                     Avaliação de submissões
```

### 7.3 Subtítulos (subhead em PageHeader)

Uma linha que **explica o porquê** ou **dá contexto**.

```
GOOD                                                BAD
"Acompanhe vagas e candidatos da Nexco."           "Página de gerenciamento"
"3 vagas no total · 1 aguardando revisão"          "Lista"
"Revise candidatos enviados pelos hunters."        "Submissões"
```

### 7.4 Labels de form

**Curto, sem ponto final, sem "obrigatório".**

```
GOOD                BAD
Nome completo       Por favor, digite seu nome completo:
Email               E-mail (obrigatório):
Telefone            Número de telefone com DDD
Cargo atual         Qual seu cargo atual?
```

### 7.5 Placeholders

**Mostram FORMATO esperado**, não repetem o label.

```
LABEL               PLACEHOLDER (BOM)            PLACEHOLDER (RUIM)
Email               voce@empresa.com             Digite seu email
Telefone            (11) 99999-9999              Digite telefone
LinkedIn            linkedin.com/in/seu-perfil   URL do LinkedIn
Salário mínimo      R$ 5.000                     Valor mínimo
Descrição           Ex: Estamos procurando...    Descrição da vaga
```

### 7.6 Mensagens de sucesso

**Curto + próximo passo (quando relevante).**

```
Vaga criada. HR vai revisar em até 24h.
Candidato enviado. Você receberá um email quando for analisado.
Senha alterada. Faça login novamente.
Email confirmado. Acesse seu dashboard.
```

### 7.7 Mensagens de erro de campo

Veja `QA_AND_QUALITY.md` seção 2.

### 7.8 Mensagens de erro de sistema

```
GOOD                                                          BAD
Não foi possível salvar. Verifique sua conexão.              Erro 500
Email ou senha incorretos.                                    Invalid credentials
Sua sessão expirou. Faça login novamente.                    401 Unauthorized
Você não tem permissão pra essa ação.                        Forbidden
Vaga não encontrada. Pode ter sido removida.                 Not found
```

### 7.9 Estados vazios

Padrão: **headline + contexto + CTA quando aplicável.**

```
Headline:   "Sem candidatos ainda"
Contexto:   "Quando hunters enviarem candidatos pra essa vaga, eles aparecem aqui."
CTA:        "Ver outras vagas →"
```

### 7.10 Confirmações destrutivas

**Diz o que vai acontecer + consequência.**

```
"Cancelar vaga?
Não será possível reativá-la. Candidatos enviados serão notificados."

"Excluir candidato?
Ele será removido do pipeline desta vaga. Outros hunters poderão enviá-lo."

"Sair da sua conta?
Você precisará fazer login novamente pra acessar."
```

---

## 8. TONALIDADE POR CONTEXTO

### Onboarding (signup, login, primeiras telas)

**Tom:** acolhedor, claro, profissional. Inspira confiança.

```
"Bem-vindo de volta"
"Crie sua conta em 30 segundos."
"Sua empresa em uma rede de recrutadores especialistas."
```

### Dashboards operacionais (HR, hunter)

**Tom:** direto, eficiente, informativo. Sem floreio.

```
"Curadoria"
"Candidatos para revisar"
"3 vagas no total · 1 aguardando revisão"
```

### Notificações (email, in-app)

**Tom:** informativo, com clareza sobre próximo passo.

```
Assunto: "Novo candidato na vaga Engenheiro de Software"
Corpo: "Mariana Pianta enviou Pedro Henrique pra revisão.
        AI Score: 65. Risco identificado: experiência gerencial.
        [Revisar candidato →]"
```

### Comunicação com cliente (empresa)

**Tom:** premium, consultivo. A Nexhire é "a especialista".

```
"Sua shortlist está pronta — 3 candidatos curados pela nossa equipe."
"Indicadores acompanhados na plataforma"
"A Nexhire não garante contratação. A IA apoia a decisão. A curadoria final é sempre humana."
```

### Erros e bloqueios

**Tom:** calmo, prestativo, sem desculpas excessivas.

```
"Você atingiu o limite de 3 envios pra essa vaga."
"Email já cadastrado. Faça login ou recupere sua senha."
"Apenas hunters aprovados podem enviar candidatos."
```

---

## 9. PALAVRAS A USAR / EVITAR

### Use

```
Vaga / Posição          (não "oportunidade")
Hunter / Recrutador     (não "headhunter")
Candidato               (não "applicant")
Curadoria               (não "moderação")
Empresa                 (não "cliente" quando falando pra empresa)
Cliente                 (apenas internamente, em conversas HR↔hunter)
AI Score                (não "nota IA")
Plataforma              (não "sistema", "app", "ferramenta")
Você                    (não "o usuário", "vocês")
```

### Evite

```
"Ops!" / "Oops"          → vazio, infantil
"Por favor"              → use só quando realmente necessário
"Desculpe"               → não peça desculpa por padrão
"Atenção!"               → use ícone, não palavra
"Importante:"            → idem
"Clique aqui"            → seja específico ("Ver candidato")
"Saiba mais"             → "Ver detalhes da vaga"
"Olá, [nome]!"           → "Olá, Daniel" (sem !)
"Bem-vindo(a)"           → "Bem-vindo" (sem o(a))
"Obrigado!"              → use apenas em telas de gratidão real
"Sucesso!"               → seja específico ("Vaga criada")
"Carregando..."          → use skeleton em vez de texto
```

---

## 10. PONTUAÇÃO E ESTILO

### Maiúsculas

- **Sentence case** em quase tudo (frases começam com maiúscula, resto minúsculo)
- **CAPS apenas em:** eyebrows, badges, tags
- **Nunca**: TÍTULOS INTEIROS em CAPS

### Pontuação

- Frases curtas (≤15 palavras) podem ficar sem ponto final em UI
- Listas e bullets sem ponto final (a menos que sejam frases completas)
- Não use `!` exceto em casos muito específicos (parabéns por hire, raros)
- Evite `?` redundante ("Sair da sua conta?" só em modal de confirmação)

### Números

- 1 a 9 por extenso em prosa: "três candidatos", "sete dias"
- 10+ em algarismo: "23 vagas"
- Em UI compacta, sempre algarismo: "3 candidatos", "5 dias"
- Datas em pt-BR: "26/05/2026" (não "May 26, 2026")
- Moeda: "R$ 5.000" (não "R$5000" nem "R$5.000,00" em UI compacta)

### Símbolos

- Use `—` (em dash) pra pausa longa, separar conceitos
- Use `→` em CTAs e links de "ver mais"
- Use `·` (middle dot) pra separar metadados ("São Paulo · Híbrido · CLT")
- Nunca use `--` em vez de `—`
- Nunca use `>` em CTAs (use `→`)

---

## 11. COPY DE PRODUTO ESPECÍFICO

### Tagline principal

"Contrate melhor com IA + especialistas humanos."

**Não use:**
- "Contrate mais rápido" (mais rápido ≠ melhor)
- "AI-powered recruitment" (em inglês, gringo demais)
- "Melhor plataforma de recrutamento" (vazio, todo mundo diz)

### Subheadline

"A Nexhire conecta empresas a uma rede de recrutadores especialistas e usa IA pra acelerar triagem, ranking e fechamento de vagas — sem perder o fator humano."

### Frases assinaturas (use em rodapés, banners, marketing)

```
"Indicadores acompanhados na plataforma"
"A IA apoia a decisão. A curadoria final é sempre humana."
"A Nexhire não garante contratação."
"Tecnologia para escalar. Humanos para decidir melhor."
"Recrutamento inteligente, sem perder o toque humano."
```

### Frases a evitar

```
❌ "Os melhores candidatos do mercado"
❌ "Contratação garantida em X dias"
❌ "Encontre talentos rápido e barato"
❌ "Substitua seu RH"
❌ "Recrutamento sem esforço"
```

---

## 12. EMAILS TRANSACIONAIS

### Estrutura padrão

```
Assunto: [específico, direto]
Preheader: [continuação do assunto, contexto adicional]

[Logo Nexhire]

[Título — frase clara do que aconteceu]

[Parágrafo 1 — contexto/explicação curta]

[Parágrafo 2 — se necessário]

[CTA principal]

[Footer com link de unsubscribe se for nurture]
```

### Exemplos por tipo

**Nova submissão (pra HR):**
```
Assunto: Novo candidato na vaga Engenheiro de Software
Preheader: Mariana Pianta enviou Pedro Henrique. AI Score: 65.

Olá, Daniel

Mariana Pianta enviou um candidato pra revisão na vaga
Engenheiro de Software.

Pedro Henrique — Software Engineer, São Paulo
AI Score: 65 · Risco identificado: experiência gerencial

[Revisar candidato →]
```

**Candidato enviado ao cliente:**
```
Assunto: Novo candidato pra avaliação — Engenheiro de Software
Preheader: Sua shortlist tem 1 novo perfil.

Olá

Um novo candidato foi adicionado à sua shortlist na
vaga Engenheiro de Software.

Pedro Henrique — Software Engineer, São Paulo
AI Score: 65

A análise completa da IA, currículo e resumo da entrevista
estão disponíveis na plataforma.

[Ver candidato →]
```

### Tom em emails

- Sempre 2ª pessoa singular ("você")
- Sem "Caro(a)", "Prezado(a)" — direto pelo nome se disponível
- Sem "Atenciosamente" no final — desnecessário em transacional
- Footer com info mínima, não verboso

---

## 13. INTERNACIONALIZAÇÃO

### Português Brasileiro (única língua no MVP)

- Use português brasileiro, **não europeu**
- Use grafias brasileiras: "ônibus" (não "autocarro"), "celular" (não "telemóvel")
- Acentos corretos: "você", "está", "êxito"
- Sem inglês desnecessário: "Salvar" (não "Save"), "Buscar" (não "Search")

### Inglês aceitável

Termos técnicos consagrados em PT-BR:
- "Email" (sim, sem acento ou variação)
- "Login" / "Logout"
- "Dashboard"
- "Kanban"
- "AI Score" (assinatura da plataforma)
- "Skills"

### Termos a aportuguesar

- "Onboarding" → use "primeiros passos" quando possível
- "Workflow" → "fluxo"
- "Pipeline" → manter "pipeline" se específico (ok contexto recrutamento)
- "Customer" → "cliente" / "empresa"

---

## 14. CHECKLIST DE COPY

Antes de finalizar qualquer texto da UI:

```
[ ] Em português brasileiro
[ ] Sem emojis
[ ] Sem exclamações desnecessárias
[ ] Sem "Por favor" / "Desculpe" gratuitos
[ ] Frase ativa, não passiva
[ ] CTA com verbo + objeto
[ ] Mensagem específica, não genérica
[ ] Curto (≤15 palavras quando possível)
[ ] Diz o próximo passo se aplicável
[ ] Sem termos técnicos (Erro 500, Failed, etc)
[ ] Sentence case (não TUDO MAIÚSCULO)
[ ] Datas em formato DD/MM/AAAA
[ ] Moeda em R$ com pontos como separador de milhares
```

---

## 15. ANTIPADRÕES (NUNCA ESCREVA)

```
❌ "Estamos com problemas técnicos. Tente novamente mais tarde."
❌ "Algo deu errado!"
❌ "Oops! Houve um erro."
❌ "Por favor, aguarde enquanto processamos..."
❌ "Parabéns! 🎉 Sua vaga foi criada com sucesso!"
❌ "Atenção: Esta ação é irreversível!!!"
❌ "Clique aqui para continuar"
❌ "Olá usuário(a)"
❌ "Caro candidato,"
❌ "Atenciosamente, Equipe Nexhire"
❌ "Você está prestes a deletar este item permanentemente. Tem certeza absoluta?"
❌ "Carregando dados, por favor aguarde..."
❌ "Erro: undefined is not a function"
```

---

## 16. CONSULTE

Quando em dúvida sobre tom específico:
- **Stripe** (stripe.com/docs) — referência de copy técnico premium
- **Linear** (linear.app) — copy curto, direto, confiante
- **Mailchimp Voice Guide** — biblia de microcopy
- **Outros docs do Nexhire:**
  - `DESIGN_PRINCIPLES.md` (microcopy visual)
  - `QA_AND_QUALITY.md` (mensagens de erro)
