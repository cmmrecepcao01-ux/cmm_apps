-- =========================================================================
-- TECMEC — CMM PMESP — Coluna de comissão técnica (rode DEPOIS dos outros 3)
-- =========================================================================
-- Por quê: o campo "condição final da viatura" saiu do formulário (o
-- parecer real, no modelo Word do CMM, não usa esse campo). Em vez disso,
-- o parecer agora guarda os até 3 membros da comissão técnica que assinam
-- o documento (nome, posto/graduação e papel — Membro Técnico/Auxiliar
-- Técnico), como uma lista.
-- =========================================================================

alter table public.parecer_tecnico
    add column if not exists comissao jsonb;

comment on column public.parecer_tecnico.comissao is 'Lista de membros da comissão técnica: [{"nome","postoGrad","papel"}] — usada nas assinaturas do parecer.';

-- Fim.
