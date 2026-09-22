-- =========================================================================
-- TECMEC — CMM PMESP — Subitens dentro de cada etapa do parecer
-- =========================================================================
-- Cada item numerado da Análise Técnica (etapa) agora pode ter vários
-- subitens (X.1, X.2, X.3...), criados sob demanda pelo operador. Guarda a
-- lista inteira como jsonb; a coluna "texto" continua preenchida (com o
-- texto do primeiro subitem) só por compatibilidade com telas antigas.
-- =========================================================================

alter table public.parecer_etapas add column if not exists subitens jsonb;

-- Fim.
