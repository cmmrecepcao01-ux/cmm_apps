-- =========================================================================
-- TECMEC — CMM PMESP — Rascunho automático do cadastro (rode DEPOIS do
-- schema principal e das funções RPC).
-- =========================================================================
-- Por quê: com ~200 OPMs usando o formulário, uma queda de conexão no meio
-- do preenchimento não pode obrigar o militar a começar tudo de novo. Esta
-- tabela guarda o progresso da Etapa 1-4 (não os PDFs anexados) por placa da
-- viatura, e é apagada automaticamente quando a solicitação é enviada com
-- sucesso.
-- =========================================================================

create table public.rascunhos_agendamento (
    placa text primary key,
    dados jsonb not null,
    updated_at timestamptz not null default now()
);

comment on table public.rascunhos_agendamento is 'Rascunho automático do cadastro do solicitante, por placa. Apagado ao confirmar o agendamento.';

alter table public.rascunhos_agendamento enable row level security;

-- Mesmo modelo de acesso do cadastro público (formulário sem login):
-- qualquer um pode ler/criar/atualizar/apagar o rascunho da própria placa.
create policy "rascunho: leitura pública"
    on public.rascunhos_agendamento for select
    using (true);

create policy "rascunho: criação pública"
    on public.rascunhos_agendamento for insert
    with check (true);

create policy "rascunho: atualização pública"
    on public.rascunhos_agendamento for update
    using (true);

create policy "rascunho: remoção pública (apagado após confirmar o agendamento)"
    on public.rascunhos_agendamento for delete
    using (true);

-- Fim.
