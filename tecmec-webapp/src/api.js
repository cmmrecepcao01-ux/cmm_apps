// Camada de acesso a dados: cria/lê solicitações, envia documentos e o
// parecer para o Supabase (banco + storage). O e-mail continua sendo
// tratado à parte, em email.js/parecerPdf.js (Google Apps Script).
import { supabase } from "./supabaseClient.js";

const LABELS_DOC_CADASTRO = {
    doc1: "OFICIO_APRESENTACAO",
    doc2: "PORTARIA_SINDICANCIA_IPM",
    doc3: "OITIVA_CONDUTOR",
    doc4: "TRANSCRICAO_COP",
    doc5: "DEMAIS_COMPROVANTES"
};

function base64ParaBlob(dataUrlOuBase64, mimeType) {
    const base64 = dataUrlOuBase64.includes(",") ? dataUrlOuBase64.split(",")[1] : dataUrlOuBase64;
    const binStr = atob(base64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    return new Blob([bytes], { type: mimeType || "application/octet-stream" });
}

async function uploadArquivoStorage(bucket, caminho, doc) {
    const blob = base64ParaBlob(doc.base64, doc.mimeType);
    const { error } = await supabase.storage.from(bucket).upload(caminho, blob, {
        contentType: doc.mimeType || "application/octet-stream",
        upsert: true
    });
    if (error) throw error;
}

// ---------------------------------------------------------------------
// CADASTRO DO SOLICITANTE (etapa 5 do wizard)
// ---------------------------------------------------------------------
export async function criarSolicitacaoSupabase(agendamento, docsBase64) {
    const { data, error } = await supabase.rpc("criar_solicitacao", {
        dados: {
            tipo_procedimento: agendamento.tipo_procedimento,
            sindicancia_ipm: agendamento.sindicancia_ipm,
            numero_oficio: agendamento.numero_oficio,
            opm: agendamento.opm,
            posto_grad: agendamento.posto_grad,
            re: agendamento.re,
            nome_militar: agendamento.nome,
            telefone: agendamento.telefone,
            email: agendamento.email,
            placa: agendamento.placa,
            prefixo: agendamento.prefixo,
            modelo: agendamento.modelo,
            ano: agendamento.ano,
            cor: agendamento.cor,
            chassi: agendamento.chassi,
            motor: agendamento.motor,
            patrimonio: agendamento.patrimonio,
            condicao_veiculo: agendamento.condicao,
            km_atual: agendamento.km,
            semana_agendada: agendamento.semanaLabel || agendamento.semanaKey,
            data_prevista: agendamento.dataCalculada,
            motivo_avaria: agendamento.motivo,
            objetivo_analise: agendamento.objetivo
        },
        perguntas_lista: agendamento.perguntas || []
    });

    if (error) throw error;
    const linha = Array.isArray(data) ? data[0] : data;
    if (!linha || !linha.protocolo) throw new Error("Supabase não devolveu o protocolo da solicitação.");

    // Upload dos documentos do cadastro. Falha em um arquivo não desfaz o
    // registro já criado — só avisa (o registro em si é o que importa).
    const falhas = [];
    for (const [chave, doc] of Object.entries(docsBase64 || {})) {
        if (!doc || !doc.base64) continue;
        try {
            const chaveBase = chave.split("_")[0];
            const tipo = LABELS_DOC_CADASTRO[chaveBase] || "DEMAIS_COMPROVANTES";
            const caminho = `${linha.protocolo}/${chave}_${(doc.name || "arquivo.pdf").replace(/[^\w.\-]/g, "_")}`;
            await uploadArquivoStorage("documentos-solicitacao", caminho, doc);
            const { error: errDoc } = await supabase.from("documentos").insert({
                solicitacao_id: linha.id,
                tipo,
                enviado_por: "SOLICITANTE",
                storage_bucket: "documentos-solicitacao",
                storage_path: caminho,
                nome_arquivo: doc.name || chave,
                mime_type: doc.mimeType || "application/pdf"
            });
            if (errDoc) throw errDoc;
        } catch (e) {
            console.error("Falha ao enviar documento " + chave, e);
            falhas.push(chave);
        }
    }

    return { ...linha, documentosComFalha: falhas };
}

// ---------------------------------------------------------------------
// PAINEL DO GESTOR
// ---------------------------------------------------------------------
export async function carregarSolicitacoesSupabase() {
    const { data, error } = await supabase
        .from("solicitacoes")
        .select("*, perguntas(*), parecer_tecnico(*, parecer_etapas(*))")
        .order("numero_solicitacao", { ascending: true });
    if (error) throw error;
    return data || [];
}

export async function salvarRespostasQuesitosSupabase(perguntasIds, respostas) {
    if (!perguntasIds || perguntasIds.length === 0) return;
    const updates = perguntasIds
        .map((id, idx) => ({ id, resposta: (respostas && respostas[idx]) || "" }))
        .filter(u => u.id);
    for (const u of updates) {
        const { error } = await supabase.from("perguntas").update({ resposta: u.resposta }).eq("id", u.id);
        if (error) console.error("Erro ao salvar resposta do quesito:", error);
    }
}

export async function atualizarDataEntradaSupabase(solicitacaoId, novaDataIso) {
    const { error } = await supabase
        .from("solicitacoes")
        .update({ data_entrada: novaDataIso })
        .eq("id", solicitacaoId);
    if (error) throw error;
}

// ---------------------------------------------------------------------
// CONSULTA PÚBLICA (protocolo ou placa — sem login, sem dados pessoais)
// ---------------------------------------------------------------------
export async function consultarSolicitacaoSupabase(termo) {
    const { data, error } = await supabase.rpc("consultar_solicitacao", { termo });
    if (error) throw error;
    return Array.isArray(data) ? data[0] || null : data || null;
}

// ---------------------------------------------------------------------
// RASCUNHO AUTOMÁTICO DO CADASTRO (por placa — permite retomar solicitação
// se a conexão cair no meio do preenchimento). Ver tecmec_supabase_rascunho.sql.
// ---------------------------------------------------------------------
export async function salvarRascunhoSupabase(placa, dados) {
    const { error } = await supabase
        .from("rascunhos_agendamento")
        .upsert({ placa: (placa || "").toUpperCase(), dados, updated_at: new Date().toISOString() });
    if (error) throw error;
}

export async function buscarRascunhoSupabase(placa) {
    const { data, error } = await supabase
        .from("rascunhos_agendamento")
        .select("*")
        .eq("placa", (placa || "").toUpperCase())
        .maybeSingle();
    if (error) { console.error("Erro ao buscar rascunho:", error); return null; }
    return data;
}

export async function apagarRascunhoSupabase(placa) {
    if (!placa) return;
    await supabase.from("rascunhos_agendamento").delete().eq("placa", placa.toUpperCase());
}

// ---------------------------------------------------------------------
// PARECER TÉCNICO (sub-dashboard do operador)
// ---------------------------------------------------------------------
export async function salvarParecerSupabase({ parecerId, solicitacaoId, parecer, etapas, fotosBulk }) {
    const camposParecer = {
        solicitacao_id: solicitacaoId,
        numero_parecer: parecer.numParecer,
        militar_responsavel: parecer.militar,
        comissao: parecer.comissao || [],
        laudo_texto: parecer.laudo,
        objetivo_resposta: parecer.objetivoResposta,
        data_conclusao: parecer.dataConclusaoIso
    };

    let parecerRow;
    if (parecerId) {
        // Já existe um parecer para esta solicitação (reabriu para editar) —
        // atualiza em vez de criar outro registro duplicado.
        const { data, error } = await supabase
            .from("parecer_tecnico")
            .update(camposParecer)
            .eq("id", parecerId)
            .select()
            .single();
        if (error) throw error;
        parecerRow = data;
        // Limpa as etapas antigas antes de regravar as atuais (evita duplicar).
        await supabase.from("parecer_etapas").delete().eq("parecer_id", parecerId);
    } else {
        const { data, error } = await supabase
            .from("parecer_tecnico")
            .insert(camposParecer)
            .select()
            .single();
        if (error) throw error;
        parecerRow = data;
    }

    if (etapas && etapas.length > 0) {
        const linhasEtapas = etapas.map((et, idx) => ({
            parecer_id: parecerRow.id,
            ordem: idx,
            titulo: et.titulo,
            texto: (et.subitens && et.subitens[0]?.texto) || et.texto || '',
            subitens: et.subitens || []
        }));
        const { error: errEtapas } = await supabase.from("parecer_etapas").insert(linhasEtapas);
        if (errEtapas) throw errEtapas;
    }

    // Fotos em bulk do parecer, uma a uma (falha isolada não derruba o resto).
    // Fotos que já foram salvas antes (jaSalva=true, recarregadas do Storage
    // ao reabrir o parecer) NÃO são reenviadas — só as novas ou as reeditadas
    // (anotadas de novo), senão duplica registros em "documentos" a cada
    // clique em "Salvar Progresso".
    const falhas = [];
    for (const [idx, foto] of (fotosBulk || []).entries()) {
        if (!foto || !foto.base64 || foto.jaSalva) continue;
        try {
            const nomeSeguro = (foto.name || "foto.jpg").replace(/[^\w.\-]/g, "_");
            // Sufixo com timestamp: se a mesma foto for reenviada (reeditada com
            // anotações), o caminho no Storage muda por completo, em vez de
            // sobrescrever o arquivo anterior no mesmo caminho. Sobrescrever com
            // upsert funciona no banco, mas a URL assinada às vezes ainda serve a
            // versão antiga (cache do CDN de Storage) — por isso as anotações
            // "somiam" ao recarregar a página mesmo depois de salvar.
            const caminho = `${parecerRow.id}/foto_${idx + 1}_${Date.now()}_${nomeSeguro}`;
            await uploadArquivoStorage("documentos-parecer", caminho, foto);

            // Remove o registro (e o arquivo antigo, se houver) desta mesma foto
            // — evita duplicar linha em "documentos" e não deixa lixo no Storage.
            if (foto.storagePath) {
                await supabase.storage.from("documentos-parecer").remove([foto.storagePath]);
                await supabase.from("documentos").delete().eq("parecer_id", parecerRow.id).eq("storage_path", foto.storagePath);
            } else {
                await supabase.from("documentos").delete().eq("parecer_id", parecerRow.id).eq("storage_path", caminho);
            }

            const { error: errDoc } = await supabase.from("documentos").insert({
                solicitacao_id: solicitacaoId,
                parecer_id: parecerRow.id,
                tipo: "FOTO_PARECER",
                enviado_por: "OPERADOR",
                storage_bucket: "documentos-parecer",
                storage_path: caminho,
                nome_arquivo: foto.name || `foto_${idx + 1}`,
                mime_type: foto.mimeType || "image/jpeg"
            });
            if (errDoc) throw errDoc;

            // Atualiza o objeto em memória (mesma referência de state.subdashFotosBulk)
            // para não reenviar de novo em um próximo "Salvar Progresso" nesta mesma
            // sessão, e para saber qual caminho antigo apagar numa próxima reedição.
            foto.storagePath = caminho;
            foto.jaSalva = true;
        } catch (e) {
            console.error("Falha ao enviar foto do parecer " + idx, e);
            falhas.push(idx);
        }
    }

    return { ...parecerRow, documentosComFalha: falhas };
}

// Recarrega as fotos do bulk já salvas no Storage (usado ao reabrir um
// parecer existente) — sem isso, as fotos "somem" ao atualizar a página,
// mesmo já tendo sido enviadas com sucesso antes.
export async function buscarFotosParecerSupabase(parecerId) {
    if (!parecerId) return [];
    const { data, error } = await supabase
        .from("documentos")
        .select("*")
        .eq("parecer_id", parecerId)
        .eq("tipo", "FOTO_PARECER");
    if (error) throw error;

    const comOrdem = (data || []).map(doc => {
        const m = (doc.storage_path || "").match(/foto_(\d+)_/);
        return { doc, ordem: m ? parseInt(m[1], 10) : 9999 };
    }).sort((a, b) => a.ordem - b.ordem);

    const resultados = [];
    for (const { doc } of comOrdem) {
        const { data: assinada } = await supabase.storage
            .from(doc.storage_bucket || "documentos-parecer")
            .createSignedUrl(doc.storage_path, 3600);
        resultados.push({
            name: doc.nome_arquivo,
            mimeType: doc.mime_type,
            base64: assinada?.signedUrl || "",
            jaSalva: true,
            storagePath: doc.storage_path
        });
    }
    return resultados;
}

export async function salvarPdfParecerSupabase(parecerId, solicitacaoId, dataUrlPdf, nomeArquivo) {
    const caminho = `${parecerId}/${nomeArquivo}`;
    await uploadArquivoStorage("documentos-parecer", caminho, { base64: dataUrlPdf, mimeType: "application/pdf" });
    const { error: errDoc } = await supabase.from("documentos").insert({
        solicitacao_id: solicitacaoId,
        parecer_id: parecerId,
        tipo: "PARECER_PDF_FINAL",
        enviado_por: "OPERADOR",
        storage_bucket: "documentos-parecer",
        storage_path: caminho,
        nome_arquivo: nomeArquivo,
        mime_type: "application/pdf"
    });
    if (errDoc) throw errDoc;

    await supabase.from("parecer_tecnico").update({ pdf_storage_path: caminho }).eq("id", parecerId);
    await supabase.from("solicitacoes").update({ status: "PRONTO" }).eq("id", solicitacaoId);
}

// Marca a solicitação como concluída (viatura PRONTA) sem precisar de um PDF
// em bytes — usado desde que o PDF passou a ser gerado por impressão nativa
// do navegador (window.print()), onde o JavaScript não tem acesso ao arquivo
// gerado (o próprio navegador cuida de salvar, por segurança). O
// salvarPdfParecerSupabase acima fica mantido caso algum dia se volte a ter
// os bytes do PDF disponíveis no cliente.
export async function marcarParecerConcluidoSupabase(parecerId, solicitacaoId) {
    const { error } = await supabase.from("solicitacoes").update({ status: "PRONTO" }).eq("id", solicitacaoId);
    if (error) throw error;
}
