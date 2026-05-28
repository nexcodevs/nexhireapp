# NEXHIRE — STANDARDS LIBRARY

Biblioteca de documentos de referência do produto. Todo dev, designer ou IA que trabalhar no Nexhire deve consultar aqui.

---

## DOCUMENTOS DISPONÍVEIS

### Design e UX
- **[DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md)** — Visual, UI, UX. Tokens, tipografia, espaçamento, componentes, animações.
- **[COPY_AND_TONE.md](./COPY_AND_TONE.md)** — Voz, microcopy, padrões de texto.
- **[ACCESSIBILITY.md](./ACCESSIBILITY.md)** — WCAG, navegação por teclado, screen readers.

### Engenharia
- **[ENGINEERING_STANDARDS.md](./ENGINEERING_STANDARDS.md)** — Padrões de código, arquitetura, TypeScript, React, Next.js.
- **[PERFORMANCE.md](./PERFORMANCE.md)** — Core Web Vitals, otimização, cache, bundle size.

### Qualidade e operação
- **[QA_AND_QUALITY.md](./QA_AND_QUALITY.md)** — Testes, validações, controle de erros, checklists.
- **[SECURITY_AND_LGPD.md](./SECURITY_AND_LGPD.md)** — Segurança, RLS, LGPD compliance.

### Produto (já existentes no projeto)
- `01_PROJECT_CONTEXT.md` — Visão e contexto
- `02_PRODUCT_REQUIREMENTS_PRD.md` — Requisitos
- `03_TECHNICAL_ARCHITECTURE.md` — Stack e arquitetura
- `04_SITE_BRIEF_AND_DESIGN_SYSTEM.md` — Brief do site
- `05_CLAUDE_WORKFLOW_INSTRUCTIONS.md` — Instruções pra IA
- `06_AI_FEATURES_SPEC.md` — Especificação de IA
- `07_BUSINESS_RULES.md` — Regras de negócio
- `08_SPRINT_ROADMAP.md` — Roadmap por sprints
- `09_SUPABASE_SCHEMA_DRAFT.sql` — Schema do banco
- `10_COPY_AND_POSITIONING.md` — Copy de marketing

---

## COMO USAR

### Pra qualquer pessoa trabalhando no projeto

**Antes de codar:**
1. Leia `ENGINEERING_STANDARDS.md` se for sua primeira vez
2. Confira `DESIGN_PRINCIPLES.md` antes de criar componente
3. Use `COPY_AND_TONE.md` ao escrever qualquer texto da UI

**Durante o trabalho:**
1. Consulte o documento relevante quando em dúvida
2. Se discordar, abra discussão antes de quebrar o padrão
3. Atualize o documento se descobrir padrão melhor (com PR/aprovação)

**Ao fechar uma feature:**
1. Rode o checklist do `QA_AND_QUALITY.md`
2. Confira contraste e a11y básica do `ACCESSIBILITY.md`
3. Valide performance com `PERFORMANCE.md`

### Pra Claude Code / IA

Em qualquer prompt longo de trabalho:

```
Consulte os documentos em /docs/standards/ ao tomar decisões:
- DESIGN_PRINCIPLES.md pra UI
- ENGINEERING_STANDARDS.md pra código
- QA_AND_QUALITY.md pra validações
- COPY_AND_TONE.md pra textos
- ACCESSIBILITY.md pra a11y
- PERFORMANCE.md pra otimização
- SECURITY_AND_LGPD.md pra segurança
```

---

## HIERARQUIA DE DECISÃO

Quando dois documentos parecem se contradizer:

1. **Segurança vence tudo.** `SECURITY_AND_LGPD.md` é não-negociável.
2. **Acessibilidade vence design.** Bonito sem a11y não é bonito.
3. **Performance vence experiência ideal.** App lento é app ruim.
4. **Design vence preferência pessoal.** Padrão estabelecido é lei.
5. **Padrão antigo vence inovação não-justificada.** Não invente sem motivo.

---

## VERSIONAMENTO

```
v1.0 — 26/05/2026 — Versão inicial
```

Atualize esta seção quando fizer mudança significativa em qualquer documento.

---

## RESPONSÁVEL

**Daniel Moraes** — CEO/Founder Nexhire
daniel@nexco.cc

---

## CONTRIBUIÇÃO

Pra propor mudança em qualquer documento:

1. Discuta primeiro (não mude direto)
2. Justifique a mudança com argumento + exemplo
3. Considere impacto em outros documentos
4. Atualize o número da versão

---

*"Um produto premium é a soma de mil decisões pequenas tomadas com cuidado.
Esses documentos são pra que essas decisões sejam consistentes."*
