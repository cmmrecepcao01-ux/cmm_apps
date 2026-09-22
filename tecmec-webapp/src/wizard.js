// Módulo gerado a partir do index.html original do TECMEC (CMM PMESP).
// Extraído automaticamente preservando o código original função por função.
import { CONFIG, state } from "./state.js";
import { showToast } from "./utils.js";
import { criarSolicitacaoSupabase, salvarRascunhoSupabase, buscarRascunhoSupabase, apagarRascunhoSupabase } from "./api.js";

export function irParaEtapa(step) {
            if (step === 2) {
                const numSind = (document.getElementById("numSindicancia")?.value || "").trim();
                const numOficio = (document.getElementById("numeroOficio")?.value || "").trim();
                const email = (document.getElementById("militarEmail")?.value || "").trim().toLowerCase();
                const motivo = (document.getElementById("motivoVistoria")?.value || "").trim();

                if (!numSind || numSind.length < 3) {
                    showToast("Informe o número oficial da Sindicância ou IPM para avançar.", "error");
                    return;
                }
                if (!numOficio || numOficio.length < 3) {
                    showToast("Informe o número do Ofício para avançar.", "error");
                    return;
                }
                if (!email.endsWith("@policiamilitar.sp.gov.br")) {
                    showToast("Informe um e-mail institucional válido (@policiamilitar.sp.gov.br).", "error");
                    return;
                }
                if (motivo.length < 20) {
                    showToast("O motivo da análise deve conter no mínimo 20 caracteres.", "error");
                    return;
                }
            }

            for (let i = 1; i <= 5; i++) {
                const card = document.getElementById(`stepCard${i}`);
                const ind = document.getElementById(`stepIndicator${i}`);
                if (card) card.style.display = i === step ? "block" : "none";
                if (ind) {
                    ind.classList.toggle("active", i === step);
                    ind.classList.toggle("completed", i < step);
                }
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

export async function finalizarAgendamento() {
            if (!state.semanaSelecionada) {
                showToast("Selecione uma semana disponível.", "error");
                return;
            }
            const term = document.getElementById("checkFinalTermo");
            if (term && !term.checked) {
                showToast("Marque a declaração final para concluir.", "error");
                return;
            }

            const agendamento = {
                tipo_procedimento: document.getElementById("tipoProcedimento")?.value || "SINDICÂNCIA",
                sindicancia_ipm: (document.getElementById("numSindicancia")?.value || "").trim().toUpperCase(),
                numero_oficio: (document.getElementById("numeroOficio")?.value || "").trim().toUpperCase(),
                posto_grad: document.getElementById("postoGrad")?.value || "CB PM",
                re: (document.getElementById("militarRe")?.value || "").trim(),
                nome: (document.getElementById("militarNome")?.value || "").trim().toUpperCase(),
                telefone: (document.getElementById("militarTelefone")?.value || "").trim(),
                email: (document.getElementById("militarEmail")?.value || "").trim().toLowerCase(),
                opm: (document.getElementById("acessoOpm")?.value || "").trim().toUpperCase() || state.viaturaSelecionada?.opm || "CMM",
                placa: state.viaturaSelecionada?.p || "ABC1234",
                prefixo: state.viaturaSelecionada?.pr || "",
                modelo: state.viaturaSelecionada?.m || "",
                ano: state.viaturaSelecionada?.a || "",
                cor: state.viaturaSelecionada?.cor || "BRANCA (PADRÃO PM)",
                chassi: state.viaturaSelecionada?.ch || "",
                motor: state.viaturaSelecionada?.mot || "",
                patrimonio: state.viaturaSelecionada?.pat || "",
                condicao: document.getElementById("condicaoVeiculo")?.value || "RODANDO POR MEIOS PRÓPRIOS",
                km: (document.getElementById("kmAtual")?.value || "").trim(),
                motivo: (document.getElementById("motivoVistoria")?.value || "").trim().toUpperCase(),
                objetivo: (document.getElementById("objetivoAnalise")?.value || "").trim().toUpperCase(),
                perguntas: (state.perguntas || []).filter(q => q.trim().length > 0),
                semanaKey: state.semanaSelecionada,
                semanaLabel: state.semanaLabel || "SEMANA SELECIONADA",
                dataCalculada: state.dataCalculada || new Date().toLocaleDateString('pt-BR')
            };

            const botao = document.getElementById("btnConfirmarAgendamento");
            if (botao) { botao.disabled = true; botao.textContent = "ENVIANDO..."; }

            try {
                const criado = await criarSolicitacaoSupabase(agendamento, state.docsBase64);
                agendamento.protocolo = criado.protocolo;
                if (criado.documentosComFalha && criado.documentosComFalha.length > 0) {
                    showToast(`Agendamento salvo, mas ${criado.documentosComFalha.length} documento(s) falharam no envio. Tente reanexar depois pelo painel do gestor.`, "warning");
                }
                exibirGuiaOficial(agendamento);
                apagarRascunhoSupabase(state.viaturaSelecionada?.p).catch(() => {});
            } catch (err) {
                console.error("Erro ao criar solicitação no Supabase:", err);
                const detalhe = err?.message || err?.error_description || "";
                showToast(`Não foi possível enviar o agendamento.${detalhe ? " Detalhe: " + detalhe : " Verifique sua conexão e tente novamente."}`, "error");
            } finally {
                if (botao) { botao.disabled = false; botao.innerHTML = '<i class="fa-solid fa-check"></i> CONFIRMAR AGENDAMENTO'; }
            }
        }

export function exibirGuiaOficial(a) {
            for (let i = 1; i <= 5; i++) {
                const c = document.getElementById(`stepCard${i}`);
                if (c) c.style.display = "none";
            }
            const steps = document.querySelector(".wizard-steps");
            if (steps) steps.style.display = "none";

            document.getElementById("receiptProtocolo").textContent = a.protocolo;
            document.getElementById("recDataHora").textContent = `${a.semanaLabel} - DIAS: TER, QUA OU QUI`;

            document.getElementById("stepCardConfirmacao").style.display = "block";
            showToast(`AGENDAMENTO CONFIRMADO! SOLICITAÇÃO Nº ${a.protocolo}`, "success");
        }

const NOMES_MESES = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];
// CMM só atende terça(2), quarta(3) e quinta(4) — Date.getDay().
const DIAS_ATENDIMENTO_CMM = [2, 3, 4];

// Guarda as 4 faixas de semana já calculadas para o mês atualmente exibido,
// para que selecionarSemanaCard saiba as datas reais sem recalcular do zero.
let semanasCalculadas = [];

export function popularMeses() {
            const sel = document.getElementById("selectMesAgendamento");
            if (!sel) return;

            const hoje = new Date();
            let mesAtualIdx = hoje.getMonth();
            let anoAtual = hoje.getFullYear();

            let opcoes = [];
            for (let i = 0; i < 6; i++) {
                let mIdx = (mesAtualIdx + i) % 12;
                let ano = anoAtual + Math.floor((mesAtualIdx + i) / 12);
                let valor = `${ano}-${String(mIdx + 1).padStart(2, '0')}`;
                let label = `${NOMES_MESES[mIdx]} DE ${ano}`;
                opcoes.push(`<option value="${valor}">${label}</option>`);
            }

            sel.innerHTML = opcoes.join("");
            renderizarSemanasMes(sel.value);
        }

// Calcula as 4 faixas de dias do mês (01-07, 08-14, 15-21, 22-fim) e, dentro
// de cada faixa, quais dias caem em terça/quarta/quinta (únicos dias que o
// CMM atende) — para mostrar datas reais em vez de um rótulo genérico.
export function renderizarSemanasMes(mesValor) {
            const grid = document.getElementById("gridSemanasMes");
            if (!grid || !mesValor) return;

            const [anoStr, mesStr] = mesValor.split("-");
            const ano = parseInt(anoStr, 10);
            const mesIdx = parseInt(mesStr, 10) - 1;
            const ultimoDia = new Date(ano, mesIdx + 1, 0).getDate();

            const faixas = [[1, 7], [8, 14], [15, 21], [22, ultimoDia]];
            semanasCalculadas = faixas.map(([ini, fim], idx) => {
                const diasAtendimento = [];
                for (let d = ini; d <= fim; d++) {
                    const data = new Date(ano, mesIdx, d);
                    if (DIAS_ATENDIMENTO_CMM.includes(data.getDay())) {
                        diasAtendimento.push(d);
                    }
                }
                return {
                    id: `SEM${idx + 1}`,
                    tituloFaixa: `SEMANA ${idx + 1} (${String(ini).padStart(2, '0')} A ${String(fim).padStart(2, '0')})`,
                    diasAtendimento
                };
            });

            grid.innerHTML = semanasCalculadas.map((s, idx) => {
                const diasTxt = s.diasAtendimento.length > 0
                    ? s.diasAtendimento.map(d => `${String(d).padStart(2, '0')}/${mesStr}`).join(", ")
                    : "SEM DIA ÚTIL NESTA FAIXA";
                return `
                <div class="week-card" id="cardWeek_${s.id}" onclick="selecionarSemanaCard(${idx}, '${mesValor}')">
                    <strong style="display:block; font-size:13px; color:#fff; margin-bottom:6px;">SEMANA ${idx + 1}</strong>
                    <span style="display:block; font-size:15px; font-weight:800; color:var(--accent-cyan);">${diasTxt}</span>
                </div>
            `;
            }).join("");
        }

export function selecionarSemanaCard(idx, mesValor) {
            const s = semanasCalculadas[idx];
            if (!s) return;

            document.querySelectorAll(".week-card").forEach(c => c.classList.remove("selected"));
            const card = document.getElementById(`cardWeek_${s.id}`);
            if (card) card.classList.add("selected");

            const [anoStr, mesStr] = mesValor.split("-");
            const mesIdx = parseInt(mesStr, 10) - 1;
            const label = `${s.tituloFaixa} DE ${NOMES_MESES[mesIdx]} DE ${anoStr}`;

            state.semanaSelecionada = `${mesValor}_${s.id}`;
            state.semanaLabel = label;
            state.dataCalculada = s.diasAtendimento.length > 0
                ? s.diasAtendimento.map(d => `${String(d).padStart(2, '0')}/${mesStr}/${anoStr}`).join(", ")
                : "A CONFIRMAR (SEM DIA ÚTIL NESTA FAIXA)";

            showToast(`${s.tituloFaixa} selecionada!`, "success");
        }

export function popularOpms() {
            const dl = document.getElementById("opmList");
            if (!dl) return;

            let opmSet = new Set();
            const frota = window.SIPL_FROTA || [];

            frota.forEach(item => {
                if (item && item.opm) {
                    const cleanOpm = item.opm.trim().toUpperCase();
                    if (cleanOpm) opmSet.add(cleanOpm);
                }
            });

            // Lista oficial completa de OPMs da PMESP (frota_data.js) — garante que TODAS
            // as OPMs cadastradas apareçam, mesmo as que ainda não têm viatura na base SIPL.
            const opmsOficiais = window.SIPL_OPMS || [];
            opmsOficiais.forEach(o => { if (o) opmSet.add(String(o).trim().toUpperCase()); });

            // OPMs padrão complementares
            const opmsPadrao = ["1.BPM/M", "2.BPM/M", "3.BPM/M", "4.BPM/M", "5.BPM/M", "9.BPM/M", "16.BPM/M", "18.BPM/M", "23.BPM/M", "RPMON", "CPTRAN", "CMM"];
            opmsPadrao.forEach(o => opmSet.add(o));

            const listaOrdenada = Array.from(opmSet).sort();
            dl.innerHTML = listaOrdenada.map(o => `<option value="${o}">`).join("");
            console.log(`Datalist opmList populado com ${listaOrdenada.length} OPMs únicas da PMESP.`);
        }

export function adicionarNovaPergunta() {
            state.perguntas = state.perguntas || [];
            state.perguntas.push("");
            renderizarListaPerguntasDinamicas();
        }

export function removerPergunta(index) {
            state.perguntas.splice(index, 1);
            renderizarListaPerguntasDinamicas();
        }

export function atualizarTextoPergunta(index, val) {
            if (state.perguntas[index] !== undefined) {
                state.perguntas[index] = val.trim().toUpperCase();
            }
        }

export function renderizarListaPerguntasDinamicas() {
            const container = document.getElementById("listaPerguntasContainer");
            if (!container) return;

            if (!state.perguntas || state.perguntas.length === 0) {
                container.innerHTML = `<div style="color: var(--text-dim); font-size: 11px; padding: 8px;">CLIQUE NO BOTÃO ABAIXO PARA ADICIONAR UMA PERGUNTA DO PRESIDENTE.</div>`;
                return;
            }

            let html = "";
            state.perguntas.forEach((p, idx) => {
                html += `
                    <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
                        <span style="font-weight: 800; color: var(--accent-cyan); font-size: 12px; width: 24px;">#${idx + 1}</span>
                        <input type="text" class="form-control" value="${p}" placeholder="DIGITE A PERGUNTA Nº ${idx + 1} DO PRESIDENTE DO PROCEDIMENTO..." oninput="atualizarTextoPergunta(${idx}, this.value)" style="flex: 1;">
                        <button type="button" onclick="removerPergunta(${idx})" style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #f87171; border-radius: 6px; width: 34px; height: 40px; font-weight: 900; cursor: pointer;">&times;</button>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

export function toggleSecaoPerguntas(show) {
            const sec = document.getElementById("secaoPerguntasDinamicas");
            if (sec) sec.style.display = show ? "block" : "none";
            if (show && (!state.perguntas || state.perguntas.length === 0)) {
                adicionarNovaPergunta();
            }
        }

export function preencherObjetivoExemplo() {
            const obj = document.getElementById("objetivoAnalise");
            if (obj) {
                obj.value = "CONSIDERANDO A NECESSIDADE DE SUBSIDIAR O PROCEDIMENTO APURATÓRIO INSTAURADO, ENCAMINHO O VEÍCULO PARA ANÁLISE TÉCNICA PARA CONSTATAÇÃO DE POSSÍVEL IRREGULARIDADE OU FALHA MECÂNICA/ELETRÔNICA NO SISTEMA DE FREIOS E SEGURANÇA.";
            }
        }

export function atualizarStatusDoc(idx, input) {
            if (!input.files || input.files.length === 0) return;

            const arquivos = Array.from(input.files);
            for (const file of arquivos) {
                if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                    showToast("Selecione apenas arquivos no formato PDF.", "error");
                    input.value = "";
                    return;
                }
            }

            // Item 5 é bulk (multiple): guarda cada arquivo com uma chave própria
            // (doc5_0, doc5_1, ...) em vez de sobrescrever com o último selecionado.
            const promises = arquivos.map(file => new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve({
                    name: file.name,
                    mimeType: file.type || "application/pdf",
                    base64: e.target.result.split(',')[1]
                });
                reader.readAsDataURL(file);
            }));

            Promise.all(promises).then(resultados => {
                if (idx === 5) {
                    resultados.forEach((doc, i) => { state.docsBase64[`doc5_${i}`] = doc; });
                    showToast(`${resultados.length} arquivo(s) anexado(s) em "Demais Comprovantes"!`, "success");
                } else {
                    state.docsBase64[`doc${idx}`] = resultados[0];
                    showToast(`Documento ${idx} (${resultados[0].name}) anexado em PDF!`, "success");
                }

                const card = document.getElementById(`uploadCard${idx}`);
                if (card) card.classList.add("attached");
            });
        }

// ---------------------------------------------------------------------
// RASCUNHO AUTOMÁTICO (salva o preenchimento das Etapas 1-4 por placa,
// para retomar caso a conexão caia ou o navegador feche). Documentos
// anexados (PDFs) NÃO entram no rascunho — precisam ser reanexados.
// ---------------------------------------------------------------------
let debounceRascunho = null;

function coletarDadosRascunho() {
    return {
        tipoProcedimento: document.getElementById("tipoProcedimento")?.value,
        numSindicancia: document.getElementById("numSindicancia")?.value,
        numeroOficio: document.getElementById("numeroOficio")?.value,
        postoGrad: document.getElementById("postoGrad")?.value,
        militarRe: document.getElementById("militarRe")?.value,
        militarNome: document.getElementById("militarNome")?.value,
        militarTelefone: document.getElementById("militarTelefone")?.value,
        militarEmail: document.getElementById("militarEmail")?.value,
        condicaoVeiculo: document.getElementById("condicaoVeiculo")?.value,
        kmAtual: document.getElementById("kmAtual")?.value,
        motivoVistoria: document.getElementById("motivoVistoria")?.value,
        objetivoAnalise: document.getElementById("objetivoAnalise")?.value,
        perguntas: state.perguntas
    };
}

export function agendarSalvamentoRascunho() {
    const placa = state.viaturaSelecionada?.p;
    if (!placa) return;
    clearTimeout(debounceRascunho);
    debounceRascunho = setTimeout(() => {
        salvarRascunhoSupabase(placa, coletarDadosRascunho()).catch(e => console.error("Erro ao salvar rascunho:", e));
    }, 1200);
}

export async function restaurarRascunhoSeExistir(placa) {
    try {
        const rasc = await buscarRascunhoSupabase(placa);
        if (!rasc || !rasc.dados) return;
        const d = rasc.dados;
        const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; };
        setVal("tipoProcedimento", d.tipoProcedimento);
        setVal("numSindicancia", d.numSindicancia);
        setVal("numeroOficio", d.numeroOficio);
        setVal("postoGrad", d.postoGrad);
        setVal("militarRe", d.militarRe);
        setVal("militarNome", d.militarNome);
        setVal("militarTelefone", d.militarTelefone);
        setVal("militarEmail", d.militarEmail);
        setVal("condicaoVeiculo", d.condicaoVeiculo);
        setVal("kmAtual", d.kmAtual);
        setVal("motivoVistoria", d.motivoVistoria);
        setVal("objetivoAnalise", d.objetivoAnalise);
        if (d.perguntas && d.perguntas.length > 0) {
            state.perguntas = d.perguntas;
            toggleSecaoPerguntas(true);
        }
        showToast("Retomando uma solicitação salva anteriormente para esta viatura.", "info");
    } catch (e) {
        console.error("Erro ao restaurar rascunho:", e);
    }
}
