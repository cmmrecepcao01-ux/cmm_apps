-- =========================================================================
-- TECMEC — CMM PMESP — Schema Supabase
-- =========================================================================
-- Como usar:
-- 1. Crie o projeto no supabase.com com o e-mail institucional.
-- 2. Vá em SQL Editor > New query, cole este arquivo inteiro e rode (RUN).
-- 3. Depois, em Project Settings > API, copie a "Project URL" e a
--    "anon public key" — são elas que entram no código do app (src/state.js).
-- 4. Crie as contas de operador/gestor em Authentication > Users > Add user
--    (e-mail + senha). Não use o cadastro público para isso.
-- =========================================================================

-- Extensão para gerar UUID
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- TABELA: perfis (operadores/gestores do painel — vinculados ao Auth)
-- -------------------------------------------------------------------------
create table public.perfis (
    id uuid primary key references auth.users(id) on delete cascade,
    nome_guerra text not null,
    posto_grad text not null,
    re text,
    papel text not null default 'OPERADOR' check (papel in ('OPERADOR', 'GESTOR')),
    created_at timestamptz not null default now()
);

comment on table public.perfis is 'Um registro por conta de operador/gestor logado (auth.users).';

-- -------------------------------------------------------------------------
-- TABELA: solicitacoes (equivalente à antiga aba AGENDAMENTOS_ANALISE_TECNICA)
-- -------------------------------------------------------------------------
create table public.solicitacoes (
    id uuid primary key default gen_random_uuid(),
    numero_solicitacao bigint generated always as identity,
    protocolo text generated always as (lpad(numero_solicitacao::text, 3, '0')) stored,

    status text not null default 'NA OPM'
        check (status in ('NA OPM', 'NO PÁTIO', 'EM CONFECÇÃO', 'PRONTO')),

    tipo_procedimento text not null default 'SINDICÂNCIA'
        check (tipo_procedimento in ('SINDICÂNCIA', 'IPM')),
    sindicancia_ipm text not null,

    -- Solicitante / OPM
    opm text not null,
    posto_grad text,
    re text,
    nome_militar text,
    telefone text,
    email text not null check (email ~* '^[a-z0-9._%+-]+@policiamilitar\.sp\.gov\.br$'),

    -- Viatura
    placa text not null,
    prefixo text,
    modelo text,
    ano text,
    cor text,
    chassi text,
    motor text,
    patrimonio text,
    condicao_veiculo text default 'RODANDO POR MEIOS PRÓPRIOS',
    km_atual text,

    -- Agendamento
    semana_agendada text,
    data_prevista text,
    motivo_avaria text,
    objetivo_analise text,

    -- Datas de controle
    data_registro timestamptz not null default now(),
    data_entrada date,
    data_parecer date,

    -- Parecer (resumo — o parecer completo mora em parecer_tecnico)
    observacoes_parecer text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.solicitacoes is 'Uma linha por solicitação de análise técnica (era a planilha AGENDAMENTOS_ANALISE_TECNICA).';

create index idx_solicitacoes_opm on public.solicitacoes (opm);
create index idx_solicitacoes_placa on public.solicitacoes (placa);
create index idx_solicitacoes_status on public.solicitacoes (status);

-- -------------------------------------------------------------------------
-- TABELA: perguntas (quesitos do solicitante, etapa 4 do cadastro)
-- -------------------------------------------------------------------------
create table public.perguntas (
    id uuid primary key default gen_random_uuid(),
    solicitacao_id uuid not null references public.solicitacoes(id) on delete cascade,
    ordem int not null default 0,
    texto text not null,
    resposta text,
    created_at timestamptz not null default now()
);

create index idx_perguntas_solicitacao on public.perguntas (solicitacao_id);

-- -------------------------------------------------------------------------
-- TABELA: parecer_tecnico (emitido pelo operador/gestor)
-- -------------------------------------------------------------------------
create table public.parecer_tecnico (
    id uuid primary key default gen_random_uuid(),
    solicitacao_id uuid not null references public.solicitacoes(id) on delete cascade,
    numero_parecer text,
    militar_responsavel text,
    condicao_final text
        check (condicao_final in ('RECUPERÁVEL (APTA PARA USO)', 'REPARO TÉCNICO EM OFICINA', 'IRRECUPERÁVEL (PERDA TOTAL)', 'SUCATA')),
    laudo_texto text,
    objetivo_resposta text,
    data_conclusao date,
    pdf_storage_path text,
    emitido_por uuid references public.perfis(id),
    created_at timestamptz not null default now()
);

create index idx_parecer_solicitacao on public.parecer_tecnico (solicitacao_id);

-- -------------------------------------------------------------------------
-- TABELA: parecer_etapas (achados técnicos do parecer, sub-dashboard)
-- -------------------------------------------------------------------------
create table public.parecer_etapas (
    id uuid primary key default gen_random_uuid(),
    parecer_id uuid not null references public.parecer_tecnico(id) on delete cascade,
    ordem int not null default 0,
    titulo text not null,
    texto text,
    created_at timestamptz not null default now()
);

create index idx_etapas_parecer on public.parecer_etapas (parecer_id);

-- -------------------------------------------------------------------------
-- TABELA: documentos (arquivos — tanto do cadastro do solicitante quanto
-- do parecer do operador — os bytes ficam no Storage, aqui só a referência)
-- -------------------------------------------------------------------------
create table public.documentos (
    id uuid primary key default gen_random_uuid(),
    solicitacao_id uuid not null references public.solicitacoes(id) on delete cascade,
    parecer_id uuid references public.parecer_tecnico(id) on delete cascade,
    etapa_id uuid references public.parecer_etapas(id) on delete set null,

    tipo text not null check (tipo in (
        'OFICIO_APRESENTACAO', 'PORTARIA_SINDICANCIA_IPM', 'OITIVA_CONDUTOR',
        'TRANSCRICAO_COP', 'DEMAIS_COMPROVANTES', 'FOTO_PARECER', 'PARECER_PDF_FINAL'
    )),
    enviado_por text not null check (enviado_por in ('SOLICITANTE', 'OPERADOR')),

    storage_bucket text not null,
    storage_path text not null,
    nome_arquivo text not null,
    mime_type text,
    tamanho_bytes bigint,

    created_at timestamptz not null default now()
);

create index idx_documentos_solicitacao on public.documentos (solicitacao_id);
create index idx_documentos_parecer on public.documentos (parecer_id);

-- -------------------------------------------------------------------------
-- updated_at automático em solicitacoes
-- -------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_solicitacoes_updated_at
    before update on public.solicitacoes
    for each row execute function public.set_updated_at();

-- =========================================================================
-- STORAGE — buckets
-- =========================================================================
insert into storage.buckets (id, name, public)
values
    ('documentos-solicitacao', 'documentos-solicitacao', false),
    ('documentos-parecer', 'documentos-parecer', false)
on conflict (id) do nothing;

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================
-- Modelo de acesso:
--   - Qualquer pessoa (anônimo) pode CRIAR uma solicitação, suas perguntas e
--     enviar os documentos do cadastro (é o formulário público do solicitante,
--     sem login — igual ao app hoje).
--   - Só operador/gestor autenticado (linha em "perfis") pode LER, EDITAR e
--     ver a lista completa (painel do gestor), e enviar/ler documentos do parecer.

alter table public.perfis enable row level security;
alter table public.solicitacoes enable row level security;
alter table public.perguntas enable row level security;
alter table public.parecer_tecnico enable row level security;
alter table public.parecer_etapas enable row level security;
alter table public.documentos enable row level security;

-- perfis: cada usuário só enxerga o próprio perfil
create policy "perfis: usuário vê o próprio perfil"
    on public.perfis for select
    using (auth.uid() = id);

-- solicitacoes: inserção pública (cadastro do solicitante), leitura/edição só autenticado
create policy "solicitacoes: qualquer um pode cadastrar"
    on public.solicitacoes for insert
    with check (true);

create policy "solicitacoes: operador autenticado lê tudo"
    on public.solicitacoes for select
    using (auth.role() = 'authenticated');

create policy "solicitacoes: operador autenticado edita"
    on public.solicitacoes for update
    using (auth.role() = 'authenticated');

-- perguntas: mesmo modelo (inserção junto do cadastro, leitura/edição autenticada)
create policy "perguntas: qualquer um pode cadastrar"
    on public.perguntas for insert
    with check (true);

create policy "perguntas: operador autenticado lê"
    on public.perguntas for select
    using (auth.role() = 'authenticated');

create policy "perguntas: operador autenticado edita (resposta do parecer)"
    on public.perguntas for update
    using (auth.role() = 'authenticated');

-- parecer_tecnico / parecer_etapas: só operador autenticado (criado no painel do gestor)
create policy "parecer: operador autenticado gerencia"
    on public.parecer_tecnico for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

create policy "parecer_etapas: operador autenticado gerencia"
    on public.parecer_etapas for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

-- documentos: inserção pública só para os tipos do cadastro do solicitante;
-- tudo que é do parecer (FOTO_PARECER / PARECER_PDF_FINAL) exige login.
create policy "documentos: solicitante anexa docs do cadastro"
    on public.documentos for insert
    with check (
        enviado_por = 'SOLICITANTE'
        and tipo in ('OFICIO_APRESENTACAO','PORTARIA_SINDICANCIA_IPM','OITIVA_CONDUTOR','TRANSCRICAO_COP','DEMAIS_COMPROVANTES')
    );

create policy "documentos: operador autenticado anexa docs do parecer"
    on public.documentos for insert
    with check (auth.role() = 'authenticated' and enviado_por = 'OPERADOR');

create policy "documentos: operador autenticado lê tudo"
    on public.documentos for select
    using (auth.role() = 'authenticated');

-- =========================================================================
-- STORAGE — policies (storage.objects)
-- =========================================================================
-- Upload público permitido só no bucket do cadastro do solicitante:
create policy "upload público em documentos-solicitacao"
    on storage.objects for insert
    with check (bucket_id = 'documentos-solicitacao');

-- Upload do parecer exige login:
create policy "upload autenticado em documentos-parecer"
    on storage.objects for insert
    with check (bucket_id = 'documentos-parecer' and auth.role() = 'authenticated');

-- Leitura/download dos dois buckets só para autenticado (operador/gestor):
create policy "leitura autenticada dos documentos"
    on storage.objects for select
    using (
        bucket_id in ('documentos-solicitacao', 'documentos-parecer')
        and auth.role() = 'authenticated'
    );

-- =========================================================================
-- Fim do schema.
-- =========================================================================
