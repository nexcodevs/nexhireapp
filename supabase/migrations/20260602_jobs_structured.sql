-- ============================================================================
-- Sprint 15 — Vaga estruturada (PRODUCT_VISION)
-- Data: 2026-06-02
--
-- Vaga deixa de ser uma descrição livre e vira objeto estruturado:
-- perfil técnico (obrigatórios + desejáveis), comportamental, idiomas,
-- certificações, benefícios, perguntas pré-aprovadas pro RH.
--
-- Schema é aditivo — `description` continua existindo, mas a IA agora
-- preenche os campos estruturados quando empresa cria a vaga.
-- ============================================================================

alter table public.jobs
  add column if not exists required_skills jsonb default '[]'::jsonb,
  add column if not exists desired_skills jsonb default '[]'::jsonb,
  add column if not exists behavioral_competencies jsonb default '[]'::jsonb,
  add column if not exists culture_fit text,
  add column if not exists languages jsonb default '[]'::jsonb,
  add column if not exists certifications jsonb default '[]'::jsonb,
  add column if not exists benefits jsonb default '[]'::jsonb,
  add column if not exists interview_questions jsonb default '[]'::jsonb;

comment on column public.jobs.required_skills is
  'Array de strings: skills técnicas obrigatórias.';
comment on column public.jobs.desired_skills is
  'Array de strings: skills técnicas desejáveis (plus, não obrigatórias).';
comment on column public.jobs.behavioral_competencies is
  'Array de strings: competências comportamentais (ex: liderança, colaboração).';
comment on column public.jobs.culture_fit is
  'Texto descrevendo o fit cultural esperado (valores, ambiente).';
comment on column public.jobs.languages is
  'Array de objetos: [{ code: "en", level: "fluente" | "intermediário" | "básico" }].';
comment on column public.jobs.certifications is
  'Array de strings: certificações/especializações desejadas.';
comment on column public.jobs.benefits is
  'Array de strings: pacote de benefícios.';
comment on column public.jobs.interview_questions is
  'Array de strings: perguntas pré-aprovadas pelo cliente pro HR usar na entrevista.';

-- Candidatos também ganham campos estruturados extraídos do CV via IA
alter table public.candidates
  add column if not exists skills jsonb default '[]'::jsonb,
  add column if not exists language_proficiency jsonb default '[]'::jsonb,
  add column if not exists certifications jsonb default '[]'::jsonb,
  add column if not exists years_experience smallint,
  add column if not exists cv_extracted_at timestamp with time zone;

comment on column public.candidates.skills is
  'Skills extraídas do CV pela IA. Array de strings.';
comment on column public.candidates.language_proficiency is
  'Idiomas do candidato extraídos do CV. Array de { code, level }.';
comment on column public.candidates.certifications is
  'Certificações listadas no CV.';
comment on column public.candidates.years_experience is
  'Anos de experiência inferidos do CV.';
comment on column public.candidates.cv_extracted_at is
  'Timestamp da última extração estruturada do CV.';
