-- =========================================================================
-- TECMEC — CMM PMESP — Funções RPC (rode DEPOIS do schema principal)
-- =========================================================================
-- Por quê: a tabela `solicitacoes` não libera SELECT para visitante anônimo
-- (dados de militares não podem ficar públicos). Só que o solicitante
-- PRECISA saber o número da solicitação (protocolo) gerado pelo banco assim
-- que cadastra, e a busca pública ("CONSULTAR SOLICITAÇÃO/PLACA") também
-- precisa devolver um resultado sem expor nome/RE/telefone/e-mail de
-- ninguém. As duas funções abaixo resolvem isso: rodam com privilégio
-- elevado (SECURITY DEFINER) e devolvem só o que é seguro devolver.
-- =========================================================================

-- Cria a solicitação + as perguntas, devolve id e protocolo gerados.
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
        tipo_procedimento, sindicancia_ipm, opm, posto_grad, re, nome_militar, telefone, email,
        placa, prefixo, modelo, ano, cor, chassi, motor, patrimonio, condicao_veiculo, km_atual,
        semana_agendada, data_prevista, motivo_avaria, objetivo_analise
    ) values (
        coalesce(dados->>'tipo_procedimento', 'SINDICÂNCIA'),
        dados->>'sindicancia_ipm',
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

-- Busca pública por protocolo ou placa — só devolve campos não-sensíveis
-- (nada de nome, RE, telefone ou e-mail do militar).
create or replace function public.consultar_solicitacao(termo text)
returns table (
    protocolo text,
    status text,
    opm text,
    placa text,
    tipo_procedimento text,
    sindicancia_ipm text,
    data_parecer date
)
language sql
security definer
set search_path = public
as $$
    select protocolo, status, opm, placa, tipo_procedimento, sindicancia_ipm, data_parecer
    from public.solicitacoes
    where protocolo = upper(trim(termo))
       or placa = upper(trim(termo))
    order by data_registro desc
    limit 1;
$$;

grant execute on function public.consultar_solicitacao(text) to anon, authenticated;

-- Fim.
