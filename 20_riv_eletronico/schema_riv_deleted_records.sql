-- =========================================================================
-- TABELA DEDICADA DE AUDITORIA DE EXCLUSÕES DO RIV ELETRÔNICO (PMESP / CMM)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.riv_deleted_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id TEXT,
    plate VARCHAR(10) NOT NULL,
    prefix VARCHAR(50),
    opm VARCHAR(100),
    data_servico VARCHAR(50),
    km VARCHAR(20),
    servicos JSONB DEFAULT '[]'::jsonb,
    valor_total NUMERIC(10, 2) DEFAULT 0.00,
    auditor_posto VARCHAR(50) NOT NULL,
    auditor_nome VARCHAR(100) NOT NULL,
    auditor_re VARCHAR(20) NOT NULL,
    justificativa TEXT NOT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    raw_payload JSONB DEFAULT '{}'::jsonb
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.riv_deleted_records ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Permitir insercao de logs de exclusao para anon"
    ON public.riv_deleted_records
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Permitir leitura de logs de exclusao para anon"
    ON public.riv_deleted_records
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Índices de Otimização de Busca
CREATE INDEX IF NOT EXISTS idx_riv_deleted_plate ON public.riv_deleted_records (plate);
CREATE INDEX IF NOT EXISTS idx_riv_deleted_at ON public.riv_deleted_records (deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_riv_deleted_auditor_re ON public.riv_deleted_records (auditor_re);
