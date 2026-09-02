-- ==============================================================================
-- SCHEMA SUPABASE: SISTEMA DE GESTÃO DE ESCALAS DE SERVIÇO & EFETIVO (CMM)
-- SEÇÃO DE MANUTENÇÃO DE FROTA - CENTRO DE MOTOMECANIZAÇÃO
-- ==============================================================================

-- 1. TABELA PRINCIPAL DE ESCALAS SEMANAIS
CREATE TABLE IF NOT EXISTS public.escalas_manutencao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    semana INTEGER NOT NULL,
    periodo TEXT NOT NULL,
    dias_datas JSONB NOT NULL DEFAULT '{}'::jsonb,
    grid JSONB NOT NULL DEFAULT '[]'::jsonb,
    afastamentos JSONB NOT NULL DEFAULT '[]'::jsonb,
    observacoes JSONB NOT NULL DEFAULT '[]'::jsonb,
    observacoes_padrao JSONB NOT NULL DEFAULT '[]'::jsonb,
    observacoes_manuais JSONB NOT NULL DEFAULT '[]'::jsonb,
    observacoes_editadas JSONB NOT NULL DEFAULT '{}'::jsonb,
    restricoes JSONB NOT NULL DEFAULT '[]'::jsonb,
    assinaturas JSONB NOT NULL DEFAULT '[]'::jsonb,
    alteracoes JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'EM_ELABORACAO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ano, mes, semana)
);

-- 2. TABELA DE EFETIVO PERMANENTE DE MILITARES
CREATE TABLE IF NOT EXISTS public.militares_manutencao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    re TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    grad TEXT NOT NULL,
    funcao TEXT NOT NULL,
    secao TEXT NOT NULL,
    grupo TEXT NOT NULL,
    equipe TEXT DEFAULT 'SEM_EQUIPE',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE RESTRIÇÕES MÉDICAS OPERACIONAIS
CREATE TABLE IF NOT EXISTS public.militares_restricoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    re TEXT UNIQUE NOT NULL REFERENCES public.militares_manutencao(re) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    ativa BOOLEAN DEFAULT TRUE,
    periodo TEXT,
    codigos TEXT[] DEFAULT '{}',
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE AUDITORIA E ALTERAÇÕES DIÁRIAS
CREATE TABLE IF NOT EXISTS public.alteracoes_escala (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escala_id UUID REFERENCES public.escalas_manutencao(id) ON DELETE CASCADE,
    data_alteracao TEXT NOT NULL,
    num_ord TEXT,
    militar TEXT NOT NULL,
    descricao TEXT NOT NULL,
    transcreveu TEXT NOT NULL,
    status TEXT DEFAULT 'AUTORIZADO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.escalas_manutencao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.militares_manutencao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.militares_restricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alteracoes_escala ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO ANÔNIMO / AUTENTICADO (LEITURA E ESCRITA LIVRE PARA INTRANET CMM)
CREATE POLICY "Permissao Total Escalas" ON public.escalas_manutencao
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permissao Total Militares" ON public.militares_manutencao
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permissao Total Restricoes" ON public.militares_restricoes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permissao Total Alteracoes" ON public.alteracoes_escala
    FOR ALL USING (true) WITH CHECK (true);

-- ÍNDICES PARA ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_escalas_periodo ON public.escalas_manutencao(ano, mes, semana);
CREATE INDEX IF NOT EXISTS idx_militares_re ON public.militares_manutencao(re);
CREATE INDEX IF NOT EXISTS idx_restricoes_re ON public.militares_restricoes(re);
