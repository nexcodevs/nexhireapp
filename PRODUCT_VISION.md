# Visão de produto — Nexhire AI

**Última atualização:** 2026-05-29
**Autor da diretriz:** Daniel Moraes (CEO)
**Status do documento:** vivo — deve guiar todas as decisões de produto, UX, UI e arquitetura daqui pra frente.

---

## Visão (norte do produto)

Nexhire não é um ATS. É um **Sistema Operacional de Contratação Assistida por IA**.

A plataforma ajuda empresas a:

- Criar vagas melhores
- Atrair candidatos melhores
- Tomar decisões mais rápidas
- Reduzir vieses
- Melhorar a qualidade das contratações
- Gerenciar fornecedores de recrutamento
- Operar recrutamento em escala

> Pergunta que tem que ser respondida em cada PR: **"Isso aproxima o NexHire de um produto utilizado por uma empresa de 5.000 colaboradores?"** Se não → revisar.

## Referências de mercado (benchmarks, não modelos pra copiar)

| Categoria | Referências |
|---|---|
| ATS | Greenhouse, Lever, Ashby, Workable, SmartRecruiters |
| UX Enterprise | Rippling, Deel, Linear, Notion, Stripe Dashboard |
| IA aplicada | LinkedIn Recruiter, Ashby AI, Metaview, HireEZ, SeekOut |

Usar como referência de fluxos, arquitetura de informação, dashboards, organização de dados, experiência do usuário. **Não copiar interface.**

---

## Princípios de design

### 1. Densidade inteligente
Hoje há excesso de espaços vazios. **Mais informação útil sem poluir.** Referências: Linear, Stripe, Ashby.

### 2. Menos telas, mais contexto
Pergunta obrigatória: *"Esta tela realmente precisa existir?"* Consolidar funcionalidades, evitar navegação desnecessária, reduzir cliques.

### 3. Informação primeiro
Evitar cards decorativos, espaços vazios excessivos, blocos sem contexto. Priorizar KPIs, tendências, insights, status, próximas ações.

### 4. Hierarquia visual
Todo usuário deve identificar em <5s: o que precisa de atenção, o que está funcionando, o que exige ação.

---

## Princípios de IA

A IA não é uma funcionalidade isolada. **Está presente em todo o sistema.**

| Área | IA faz |
|---|---|
| Criação de vagas | Estrutura requisitos, sugere competências, identifica lacunas, organiza informações. Nunca apenas gerar texto. |
| Triagem | Classifica candidatos, gera scores, explica decisões, identifica riscos. |
| Entrevistas | Gera perguntas, cria roteiros, produz resumos, gera avaliações. |
| Analytics | Responde perguntas: qual vaga tem maior risco? Qual hunter entrega melhor? Qual empresa mais consome? Quais vagas têm baixa atratividade? |

---

## Experiência por perfil

Cada perfil vê **só o que é relevante**. Sem mistura.

### Admin — Controla a plataforma
- Empresas, hunters, consumo, receita, saúde operacional
- **Não opera recrutamento**

### RH Manager — Contrata
- Vagas, pipeline, hunters, candidatos, métricas de contratação

### Hunter — Encontra candidatos
- Vagas, submissões, performance, ganhos, oportunidades

### Empresa — Acompanha contratações
- Vagas, pipeline, candidatos, entrevistas, indicadores
- **Não enxerga hunters** (não sabe quem são os recrutadores; só recebe perfis)

---

## Dashboards (todos seguem este modelo)

Todo dashboard responde 4 perguntas:

1. **O que aconteceu?** — indicadores históricos
2. **O que está acontecendo?** — indicadores atuais
3. **O que exige atenção?** — alertas
4. **O que devo fazer?** — próximas ações

Hoje os dashboards têm muito número e pouco insight. Isso muda.

---

## Vaga (centro do sistema)

Vaga deixa de ser "uma descrição" e vira **objeto estruturado**:

- **Perfil técnico**: obrigatórios + desejáveis
- **Perfil comportamental**: competências + cultura
- **Idiomas**
- **Certificações**
- **Benefícios**
- **Senioridade**
- **Faixa salarial**
- **Score de matching** (por candidato)

A IA na criação da vaga **estrutura cada campo**, não joga tudo num textão.

---

## Candidato (perfil rico, não currículo)

Objetivo: transformar currículo em dados estruturados.

### IA extrai do CV:
- Skills
- Idiomas
- Certificações
- Experiência
- Formação

### IA gera:
- Resumo executivo
- Matching com vagas
- Recomendações

---

## Entrevistas (cada uma gera conhecimento)

Ao final de cada entrevista, plataforma armazena:
- Resumo
- Transcrição
- Score
- Pontos fortes
- Pontos de atenção
- Próximos passos

Esses dados alimentam o ranking do hunter, o histórico do candidato e o aprendizado da IA.

---

## Resultado esperado das próximas iterações

- Menos telas
- Mais informação útil
- Mais automação
- Mais IA aplicada
- Melhor arquitetura de informação
- Melhor experiência visual
- Dashboards executivos
- Fluxos mais rápidos
- Menos esforço operacional

> **O usuário deve sentir que o sistema trabalha para ele, e não que ele trabalha para o sistema.**

---

## Apontamentos da exploração (2026-05-29)

Bugs e gaps encontrados durante navegação exploratória. Detalhamento em [AUDIT.md](AUDIT.md) e backlog priorizado em [src/app/(dashboard)/backlog.md](src/app/(dashboard)/backlog.md).

### Geral
1. Tirar "Sistema operacional Nexhire" da auth (login/cadastro/recuperação). Só logo.
2. Reorganizar menu lateral (item gestão no topo, sistema embaixo)
3. Light mode: texto de notificação invisível (fonte branca em fundo cinza)
4. Tipografia serif está cansativa com o tempo — revisar
5. Visual ainda parece "simples" — precisa elevar pra nível enterprise/unicórnio
6. WelcomeCard ocupa muita tela e aparece a cada login — comprimir/dispensar inteligente
7. Página `/perfil` ampliada: idioma, dados, preferências (incluir dark mode aqui)
8. Menu retrátil (já tem, validar UX)
9. Notificações não estão notificando — verificar (provavelmente RLS nova bloqueando)
10. **Logout em loop** — bug crítico, fluxo de saída quebrado
11. Form complementar após primeiro acesso (questionário pra capturar mais dados)
12. Login com LinkedIn (puxa dados pra preencher perfil de hunter/profissional)

### Features estratégicas
1. **Match profile** na criação da vaga (perfil comportamental, técnico, idiomas, certs, etc)
2. **Avaliação comportamental e técnica** dos candidatos
3. **Perguntas pré-aprovadas pro RH** geradas pela IA conforme requisitos da vaga
4. **Agenda Google integrada** com slots do entrevistador
5. **Vídeo chamada própria com transcrição** (real-time test + interview questions). Se não der, integração externa.

### Admin
1. Falta gráficos no dashboard
2. Status mal formatados nos cards de submissões recentes (`client_reject`, `interview schedule` cru)
3. `/admin/empresas`: tirar CTA "ver vagas" (clique no card já leva). Adicionar filtro simples.
4. `/admin/hunters`: ver mais dados do recrutador (especialidades, bio, anos exp). Hoje só lista.
5. Audit log: condensar (expandir on demand). Mover pra um "menu de sistema", longe de itens operacionais.
6. Consumo IA bom — falta **Top empresas que consomem créditos**
7. Curadoria HR no menu admin é confuso — não deveria estar aqui (é fluxo do HR Manager)
8. Admin mistura funções de admin com HR — separar rigorosamente

### RH
1. Dashboard precisa **gráficos** + KPIs high-level (não só números em caixas brancas)
2. Listagem de vagas sem #submissões, tempo de abertura, KPIs por vaga
3. Detalhe da vaga: descrição corrida + salário solto no topo. Precisa estrutura.
4. Pipeline (kanban): visualmente OK. Sem sugestão urgente.
5. `/hr/hunters` vazio (não carrega registros)
6. `/hr/clientes` 404 (remover do menu)

### Hunter
1. Bloco "Sua performance" no dashboard ocupa demais + **KPIs errados** (mari@mari.com mostrou 3 envios sendo que tem 8)
2. Busca com IA na listagem de vagas: **remover** (consome tokens). Manter só filtros ou busca textual local.
3. Detalhe da vaga: informação corrida, sem estrutura. Form de envio estranho, deveria ser **modal/pop-up**. Parse do CV poderia preencher TODOS os campos. "Notas internas" é desnecessário. Campos obrigatórios resumo/justificativa confusos.
4. `/hunter/submissoes` não carrega nada — **fazer carregar** ou remover do menu
5. Ranking de hunters **não faz sentido pro hunter** ver. Substituir por dashboard pessoal (KPIs, posição geral, próximas ações).

### Empresa
1. Dashboard precisa gráficos visuais
2. Listagem "Minhas vagas" — info confusa, melhorar AI de info
3. **Tirar "Hunters bloqueados"** do menu da empresa (empresa não deve saber quem são os recrutadores)
4. Reorganizar menu: gestão (vagas, CV, contratação) no topo, sistema (config, notificações) embaixo
5. IA na criação de vaga **não estrutura** (joga tudo na descrição). Precisa preencher: obrigatórios, desejáveis, comportamental, benefícios, etc. **Form atual é muito básico.**

---

## Como esse documento é usado

- **Antes de planejar feature/refactor**: reler princípios + experiência por perfil
- **Antes de criar tela nova**: aplicar "menos telas, mais contexto"
- **Em PRs grandes**: pergunta obrigatória "isso aproxima o produto de uma empresa de 5.000 colaboradores?"
- **Quando IA é envolvida**: confirmar que ela **estrutura**, não só gera texto
