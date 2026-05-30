# DIRECIONAMENTO ESTRATÉGICO DE PRODUTO
GERAL
Na tela de login, cadastro e recuperação de senha, não é necessário exibir o texto "Sistema Operacional NexHire". Deixar apenas o logo.
A organização do menu lateral ainda está confusa.
Na versão Light, o texto das notificações (com fundo cinza) não aparece, pois a fonte permanece branca.
Ainda não estou confortável com a composição das fontes (principalmente a serifada). Inicialmente ela é bonita, mas com o passar do tempo incomoda e cansa a leitura.
O produto está evoluindo bem, mas ainda parece um sistema "simples". Precisamos deixar a experiência mais enterprise, nível unicórnio.
O badge de primeiro acesso com orientações não ficou bom visualmente. Ocupa uma parte grande e importante da tela e aparece em todos os logins para todos os usuários.
Sinto falta de uma página de perfil do usuário para configurações como:
Idioma
Dados pessoais
Preferências
Dark Mode / Light Mode
A opção de ocultar/reduzir o menu lateral ajudaria na visualização. Implementar.
O sistema de notificações não está notificando nada.
Ao clicar para sair do sistema (logout), a tela entra em loop e não conclui a saída.
No login, assim como no cadastro do recrutador, seria interessante coletar mais informações dos candidatos e das empresas. Talvez não durante o login, mas antes do primeiro acesso, por meio de um formulário complementar. Algumas plataformas fazem isso através de um questionário inicial.
O login com LinkedIn pode ser interessante para capturar dados do usuário (principalmente recrutadores e profissionais). Essas informações já poderiam alimentar automaticamente o perfil desses usuários.

FEATURES

Match Profile: Sempre que uma vaga for aberta, a empresa deve informar:

Perfil comportamental
Conhecimentos técnicos desejados
Fluência em idiomas
Certificações e especializações

Essas informações serão importantes para o recrutador avaliar o candidato e para o sistema gerar perguntas que validem esses requisitos.

Avaliação comportamental e técnica.
Perguntas para o RH: O sistema, com base nas informações da vaga, deve gerar perguntas pré-aprovadas por quem abriu a vaga para serem feitas ao candidato. O sistema deve garantir que essas informações sejam coletadas durante o processo.
Agenda integrada com Google Calendar, permitindo agendamento com base nos horários disponibilizados pelo entrevistador.

Sistema próprio de videochamada com:

Transcrição automática
Real-time notes
Interview questions para o recrutador

Caso não seja possível desenvolver uma solução própria, sugerir integrações ou ferramentas capazes de coletar dados da reunião e registrar essas informações automaticamente na plataforma ao final da entrevista.

ADMIN
Sinto falta de gráficos na tela principal.
No bloco de "Submissões Recentes" da página principal, os status estão com erro (ex.: client_reject, interview_schedule, entre outros).
Na listagem de empresas, o administrador possui apenas a opção de visualizar vagas. Falta uma filtragem simples nessa página. Também não faz muito sentido existir um CTA de "Ver Vagas", já que o usuário poderia clicar diretamente no item da lista. A página pode ser melhorada.
A listagem de hunters apenas exibe registros, sem ações adicionais. Não é possível visualizar informações mais detalhadas enviadas durante o cadastro.
Na tela de Audit Log:
A listagem pode ser mais condensada.
Os detalhes podem ser exibidos apenas sob demanda.
Não faz muito sentido ela estar junto das funcionalidades mais utilizadas da plataforma. Poderia ficar acima de Notificações ou em outro local.
A tela de consumo de IA está boa. Senti falta apenas de visualizar as empresas que mais consomem créditos.

A tela de Curadoria de RH me deixa confuso. Ela deveria aparecer para administradores? Não seria uma funcionalidade exclusiva do perfil HR Manager?

Além disso:

A listagem é muito extensa.
Há excesso de espaçamento.
Gostaria de sugestões de melhoria.
Essa página parece misturar responsabilidades de Admin e HR Manager, tornando a navegação confusa. Não estou confortável com esse módulo.
RH
Sinto falta de gráficos nesta tela. O dashboard está muito simples, apresentando apenas informações em blocos e números dentro de caixas brancas. Precisamos de uma aparência mais executiva e high-level.

A listagem de vagas não mostra:

Quantidade de submissões
Tempo de abertura
Outros KPIs importantes

Essa listagem pode melhorar bastante.

Na tela de detalhes da vaga:
A descrição está simples e com texto corrido.
O salário está isolado no topo direito.
A página precisa apresentar mais informações e melhor organização visual.
O pipeline de vagas está visualmente bom. Não tenho melhorias visuais imediatas para sugerir, mas, caso identifique oportunidades, apresente sugestões.
A listagem de hunters não trouxe registros.
O menu Clientes não possui tela funcional (gera página de erro). Sugiro remover ou implementar uma solução.
HUNTER

O dashboard está bom, mas dá destaque excessivo ao bloco "Sua Performance".

Além disso, os KPIs parecem incorretos. A lógica de avaliação dos recrutadores pode não estar funcionando corretamente.

Exemplo:

A usuária mari@mari.com já realizou 8 envios.
O bloco "Sua Performance" exibe apenas 3 envios.

Revisar essa lógica.

A listagem de vagas está boa, mas pode melhorar a arquitetura da informação.

A Busca com IA parece dispensável nesse contexto para evitar consumo de créditos. Sugiro:

Manter apenas filtros tradicionais; ou
Implementar uma busca sem consumo de tokens.

Na tela de detalhes da vaga:

As informações continuam muito corridas.
Falta arquitetura visual mais refinada.
A página precisa apresentar mais detalhes.

Sobre o formulário de envio de candidatos:

O formato atual está estranho.
Talvez uma modal ou pop-up funcione melhor.
Ao subir um currículo em PDF, os campos deveriam ser preenchidos automaticamente com o máximo de informações possível.
Os campos obrigatórios de resumo da entrevista, transcrição da entrevista e justificativa de score estão confusos.
O campo "Notas Internas" parece desnecessário.

Com base nisso, sugiro propor um novo fluxo de submissão de candidatos.

A página:

https://nexhireapp.vercel.app/hunter/submissoes

Não carrega conteúdo. Além disso, não me parece fazer sentido existir como uma página separada.

O ranking de hunters não faz sentido para o próprio hunter.

O usuário deveria visualizar:

Resumo geral do perfil
KPIs
Informações gerais
Evolução
Posição geral
EMPRESA
O dashboard está bom, mas ainda precisa de mais gráficos e elementos visuais.
A listagem "Minhas Vagas", assim como as demais listagens da plataforma, precisa melhorar. As informações estão confusas.
A lista de hunters bloqueados não parece fazer sentido neste módulo. A ideia é que a empresa não saiba quem são os recrutadores; ela deveria apenas receber perfis de candidatos.

O menu Configurações pode ficar acima ou abaixo de Notificações, dentro de uma seção de sistema.

Além disso, o menu precisa ser reorganizado para todos os perfis:

No topo: gestão de vagas, currículos e fluxo de contratação.
Na parte inferior: funcionalidades de sistema.

Ao preencher uma vaga com a ferramenta de IA, o sistema não valida corretamente os requisitos obrigatórios e desejáveis, colocando praticamente tudo dentro do campo de descrição.

Problemas observados:

Informações ficam desorganizadas.
Não há validação de perfil comportamental.
Não há validação de benefícios.
Não há validação de outras informações importantes.

O usuário precisa preencher o máximo de informações possível para apoiar os recrutadores.

Em resumo: o formulário atual está muito básico.

## Evolução do NexHire para uma Plataforma Enterprise de Recrutamento Assistida por IA

### Contexto

As observações anteriores representam problemas encontrados durante uma navegação exploratória do produto.

Porém, o objetivo não é apenas corrigir bugs, ajustar telas ou reorganizar menus.

O objetivo é elevar o NexHire para uma categoria superior de produto, aproximando a experiência de plataformas modernas de recrutamento e gestão de talentos utilizadas por empresas de alto crescimento.

Durante todas as decisões de produto, UX, UI e arquitetura, considere os princípios abaixo.

---

# VISÃO DE PRODUTO

O NexHire não deve ser percebido apenas como um ATS (Applicant Tracking System).

A visão deve evoluir para:

> "Sistema Operacional de Contratação Assistida por IA"

A plataforma deve ajudar empresas a:

* Criar vagas melhores
* Atrair candidatos melhores
* Tomar decisões mais rápidas
* Reduzir vieses
* Melhorar a qualidade das contratações
* Gerenciar fornecedores de recrutamento
* Operar recrutamento em escala

---

# REFERÊNCIAS DE MERCADO

Utilize como benchmark:

### ATS

* Greenhouse
* Lever
* Ashby
* Workable
* SmartRecruiters

### UX Enterprise

* Rippling
* Deel
* Linear
* Notion
* Stripe Dashboard

### IA Aplicada

* LinkedIn Recruiter
* Ashby AI
* Metaview
* HireEZ
* SeekOut

Não copiar interfaces.

Utilizar apenas como referência de:

* Fluxos
* Arquitetura de informação
* Dashboards
* Organização de dados
* Experiência do usuário

---

# PRINCÍPIOS DE DESIGN

## 1. Densidade Inteligente

O sistema possui excesso de espaços vazios.

Objetivo:

Exibir mais informação sem poluir a interface.

Referência:

* Linear
* Stripe
* Ashby

---

## 2. Menos Telas, Mais Contexto

Hoje existem diversas páginas com pouco valor.

Pergunta obrigatória:

> Esta tela realmente precisa existir?

Sempre que possível:

* Consolidar funcionalidades
* Evitar navegação desnecessária
* Reduzir quantidade de cliques

---

## 3. Informação Primeiro

O sistema deve priorizar informação útil.

Evitar:

* Cards decorativos
* Espaços vazios excessivos
* Blocos sem contexto

Priorizar:

* KPIs
* Tendências
* Insights
* Status
* Próximas ações

---

## 4. Hierarquia Visual

Todo usuário deve conseguir identificar em menos de 5 segundos:

* O que precisa de atenção
* O que está funcionando
* O que exige ação

---

# PRINCÍPIOS DE IA

A IA não deve ser uma funcionalidade isolada.

Ela deve estar presente em todo o sistema.

---

## Criação de Vagas

A IA deve:

* Estruturar requisitos
* Sugerir competências
* Identificar lacunas
* Organizar informações

Nunca apenas gerar texto.

---

## Triagem

A IA deve:

* Classificar candidatos
* Gerar scores
* Explicar decisões
* Identificar riscos

---

## Entrevistas

A IA deve:

* Gerar perguntas
* Criar roteiros
* Produzir resumos
* Gerar avaliações

---

## Analytics

A IA deve responder perguntas como:

* Qual vaga está com maior risco?
* Qual hunter entrega melhores candidatos?
* Qual empresa mais consome recursos?
* Quais vagas possuem baixa atratividade?

---

# EXPERIÊNCIA POR PERFIL

Cada perfil deve enxergar apenas o que é relevante.

---

## Admin

Objetivo:

Controlar a plataforma.

Deve enxergar:

* Empresas
* Hunters
* Consumo
* Receita
* Saúde operacional

Não deve operar recrutamento.

---

## RH Manager

Objetivo:

Contratar.

Deve enxergar:

* Vagas
* Pipeline
* Hunters
* Candidatos
* Métricas de contratação

---

## Hunter

Objetivo:

Encontrar candidatos.

Deve enxergar:

* Vagas
* Submissões
* Performance
* Ganhos
* Oportunidades

---

## Empresa

Objetivo:

Acompanhar contratações.

Deve enxergar:

* Vagas
* Pipeline
* Candidatos
* Entrevistas
* Indicadores

Não deve enxergar hunters.

---

# DASHBOARDS

Atualmente os dashboards apresentam muitos números e poucos insights.

Todo dashboard deve responder:

### O que aconteceu?

Indicadores históricos.

### O que está acontecendo?

Indicadores atuais.

### O que exige atenção?

Alertas.

### O que devo fazer?

Próximas ações.

---

# VAGAS

A vaga deve se tornar o centro do sistema.

Ela não pode ser apenas uma descrição.

Cada vaga deve possuir:

### Perfil Técnico

* Obrigatórios
* Desejáveis

### Perfil Comportamental

* Competências
* Cultura

### Idiomas

### Certificações

### Benefícios

### Senioridade

### Faixa Salarial

### Score de Matching

---

# CANDIDATOS

O candidato deve possuir um perfil rico.

Objetivo:

Transformar currículo em dados estruturados.

A IA deve extrair:

* Skills
* Idiomas
* Certificações
* Experiência
* Formação

E gerar:

* Resumo executivo
* Matching
* Recomendações

---

# ENTREVISTAS

Toda entrevista deve gerar conhecimento para a plataforma.

Ao final de cada entrevista:

* Resumo
* Transcrição
* Score
* Pontos fortes
* Pontos de atenção
* Próximos passos

---

# EXPERIÊNCIA PREMIUM

Pergunta obrigatória para qualquer alteração:

> Isso aproxima o NexHire de um produto utilizado por uma empresa de 5.000 colaboradores?

Se a resposta for não:

Revisar a solução proposta.

---

# RESULTADO ESPERADO

Ao final das melhorias:

* Menos telas
* Mais informação útil
* Mais automação
* Mais IA aplicada
* Melhor arquitetura de informação
* Melhor experiência visual
* Dashboards executivos
* Fluxos mais rápidos
* Menos esforço operacional

O usuário deve sentir que o sistema trabalha para ele, e não que ele trabalha para o sistema.
