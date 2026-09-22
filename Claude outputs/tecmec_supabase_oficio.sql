-- =========================================================================
-- TECMEC — CMM PMESP — Número do Ofício (rode DEPOIS dos demais scripts)
-- =========================================================================
-- Adiciona a coluna numero_oficio em solicitacoes e atualiza a função
-- criar_solicitacao para aceitar e gravar esse campo, vindo do formulário
-- do solicitante (Etapa 1), passando a ficar disponível automaticamente
-- para o operador (técnico) ao montar o parecer.
-- =========================================================================

alter table public.solicitacoes add column if not exists numero_oficio text;

create or replace function public.criar_solicitacao(dados jsonb, perguntas_lista text[])
returns table (id uuid, protocolo text)
language plpgsql
security definer
set search_path = public
as $$
declare
    novo_id uuid;
    novo_protocolo text;
begin
    insert into public.solicitacoes (
        tipo_procedimento, sindicancia_ipm, numero_oficio, opm, posto_grad, re, nome_militar, telefone, email,
        placa, prefixo, modelo, ano, cor, chassi, motor, patrimonio, condicao_veiculo, km_atual,
        semana_agendada, data_prevista, motivo_avaria, objetivo_analise
    ) values (
        coalesce(dados->>'tipo_procedimento', 'SINDICÂNCIA'),
        dados->>'sindicancia_ipm',
        dados->>'numero_oficio',
        dados->>'opm',
        dados->>'posto_grad',
        dados->>'re',
        dados->>'nome_militar',
        dados->>'telefone',
        dados->>'email',
        dados->>'placa',
        dados->>'prefixo',
        dados->>'modelo',
        dados->>'ano',
        dados->>'cor',
        dados->>'chassi',
        dados->>'motor',
        dados->>'patrimonio',
        coalesce(dados->>'condicao_veiculo', 'RODANDO POR MEIOS PRÓPRIOS'),
        dados->>'km_atual',
        dados->>'semana_agendada',
        dados->>'data_prevista',
        dados->>'motivo_avaria',
        dados->>'objetivo_analise'
    )
    returning solicitacoes.id, solicitacoes.protocolo into novo_id, novo_protocolo;

    if perguntas_lista is not null and array_length(perguntas_lista, 1) > 0 then
        insert into public.perguntas (solicitacao_id, ordem, texto)
        select novo_id, ord - 1, p
        from unnest(perguntas_lista) with ordinality as t(p, ord)
        where trim(p) <> '';
    end if;

    return query select novo_id, novo_protocolo;
end;
$$;

grant execute on function public.criar_solicitacao(jsonb, text[]) to anon, authenticated;

-- Fim.
