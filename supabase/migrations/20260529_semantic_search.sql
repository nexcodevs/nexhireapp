-- Busca semântica de vagas via pgvector + Voyage AI embeddings (1024 dims).
-- Roda no Supabase SQL Editor.

create extension if not exists vector;

alter table public.jobs
  add column if not exists embedding vector(1024);

-- Index pra cosine similarity (ivfflat funciona bem pra <10k registros)
create index if not exists idx_jobs_embedding
  on public.jobs using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- RPC pra match semântico: hunter envia query embedding, recebe vagas ranqueadas
create or replace function public.match_jobs(
  query_embedding vector(1024),
  match_count int default 10
)
returns table (id uuid, similarity float)
language sql stable
security definer
set search_path = public
as $$
  select
    jobs.id,
    1 - (jobs.embedding <=> query_embedding) as similarity
  from jobs
  where jobs.embedding is not null
    and jobs.status = 'open_for_hunters'
  order by jobs.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_jobs(vector(1024), int) to authenticated;

comment on column public.jobs.embedding is
  'Embedding vetorial (Voyage AI voyage-3-large, 1024 dims) do título + descrição. Usado pra busca semântica.';
