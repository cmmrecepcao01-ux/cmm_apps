// Painel do gestor: lista as solicitações a partir do Supabase (fonte
// única de verdade — visível em qualquer computador, não só no navegador
// de quem cadastrou).
import { state } from "./state.js";
import { showToast } from "./utils.js";
import { carregarSolicitacoesSupabase, atualizarDataEntradaSupabase } from "./api.js";

function mapearSolicitacao(row) {
    return {
        id: row.id,
        numSolicitacao: row.numero_solicitacao,
        protocolo: row.protocolo,
        timestamp: row.data_registro,
        status: row.status,
        tipo_procedimento: row.tipo_procedimento,
        sindicancia_ipm: row.sindicancia_ipm,
        numeroOficio: row.numero_oficio,
        opm: row.opm,
        placa: row.placa,
        prefixo: row.prefixo,
        modelo: row.modelo,
        ano: row.ano,
        cor: row.cor,
        chassi: row.chassi,
        motor: row.motor,
        patrimonio: row.patrimonio,
        dataEntrada: row.data_entrada,
        dataParecer: row.data_parecer,
        perguntas: (row.perguntas || []).sort((a, b) => a.ordem - b.ordem).map(p => p.texto),
        perguntasIds: (row.perguntas || []).sort((a, b) => a.ordem - b.ordem).map(p => p.id),
        subdashQuesitosResp: (row.perguntas || []).sort((a, b) => a.ordem - b.ordem).map(p => p.resposta || ""),
        parecer: (row.parecer_tecnico && row.parecer_tecnico[0]) || null,
        parecerId: (row.parecer_tecnico && row.parecer_tecnico[0] && row.parecer_tecnico[0].id) || null
    };
}

export async function carregarEAtualizarPainelGestor() {
    const tbody = document.getElementById("tabelaAgendamentosBody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-dim); padding: 30px;">CARREGANDO SOLICITAÇÕES...</td></tr>`;
    }
    try {
        const linhas = await carregarSolicitacoesSupabase();
        state.agendamentos = linhas.map(mapearSolicitacao);
    } catch (err) {
        console.error("Erro ao carregar solicitações do Supabase:", err);
        showToast("Não foi possível carregar as solicitações. Verifique sua conexão.", "error");
        state.agendamentos = state.agendamentos || [];
    }
    atualizarTabelaGestaoOperador();
}

export async function atualizarDataEntrada(protocolo, novaData) {
    const a = state.agendamentos.find(item => item.protocolo === protocolo || String(item.numSolicitacao).padStart(3, '0') === protocolo);
    if (!a) return;
    const anterior = a.dataEntrada;
    a.dataEntrada = novaData;
    try {
        await atualizarDataEntradaSupabase(a.id, novaData);
        showToast(`Data de Entrada atualizada para ${novaData} (Solicitação Nº ${a.protocolo})`, "success");
    } catch (err) {
        console.error("Erro ao atualizar data de entrada:", err);
        a.dataEntrada = anterior;
        showToast("Não foi possível salvar a Data de Entrada.", "error");
        atualizarTabelaGestaoOperador();
    }
}

export function atualizarTabelaGestaoOperador() {
            const tbody = document.getElementById("tabelaAgendamentosBody");
            if (!tbody) return;

            const searchQ = (document.getElementById("gestorSearchInput")?.value || "").trim().toUpperCase();
            const filterSt = document.getElementById("gestorFilterStatus")?.value || "TODOS";

            const list = (state.agendamentos || []).filter(a => {
                const matchSearch = !searchQ ||
                    (a.protocolo && a.protocolo.toUpperCase().includes(searchQ)) ||
                    (a.opm && a.opm.toUpperCase().includes(searchQ)) ||
                    (a.placa && a.placa.toUpperCase().includes(searchQ)) ||
                    (a.prefixo && a.prefixo.toUpperCase().includes(searchQ)) ||
                    (a.sindicancia_ipm && a.sindicancia_ipm.toUpperCase().includes(searchQ));

                let matchStatus = true;
                if (filterSt === "EM CONFECÇÃO") matchStatus = a.status === "EM CONFECÇÃO" || a.status === "EM ANÁLISE";
                if (filterSt === "NO PÁTIO") matchStatus = a.status === "NO PÁTIO";
                if (filterSt === "PRONTO") matchStatus = a.status === "PRONTO" || !!a.dataParecer;
                if (filterSt === "NA OPM") matchStatus = a.status === "NA OPM";

                return matchSearch && matchStatus;
            });

            // Atualizar KPIs
            const total = state.agendamentos.length;
            const emitidos = state.agendamentos.filter(a => a.status === 'PRONTO' || !!a.dataParecer).length;
            const patio = state.agendamentos.filter(a => a.status === 'NO PÁTIO' || a.status === 'EM CONFECÇÃO' || a.status === 'EM ANÁLISE').length;
            const vagas = Math.max(0, 8 - patio);

            if (document.getElementById("gestorStatTotal")) document.getElementById("gestorStatTotal").textContent = total;
            if (document.getElementById("gestorStatAguardando")) document.getElementById("gestorStatAguardando").textContent = patio;
            if (document.getElementById("gestorStatEmitidos")) document.getElementById("gestorStatEmitidos").textContent = emitidos;
            if (document.getElementById("gestorStatPatio")) document.getElementById("gestorStatPatio").textContent = `${vagas} / 8 VAGAS`;

            if (list.length === 0) {
                tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-dim); padding: 30px; font-weight: 700;">NENHUMA SOLICITAÇÃO ENCONTRADA COM OS FILTROS SELECIONADOS.</td></tr>`;
                return;
            }

            let html = "";
            list.forEach((a, idx) => {
                const solicNum = String(a.numSolicitacao || (idx + 1)).padStart(3, '0');
                const procCurto = (a.tipo_procedimento || 'SINDICÂNCIA').includes('IPM') ? 'IPM' : 'SINDICÂNCIA';

                let statusShort = 'EM CONFECÇÃO';
                if (a.status === 'PRONTO' || a.dataParecer) statusShort = 'PRONTO';
                else if (a.status === 'NO PÁTIO' || a.status === 'NO PÁTIO (CMM)') statusShort = 'NO PÁTIO';
                else if (a.status === 'NA OPM') statusShort = 'NA OPM';
                else if (a.status === 'EM CONFECÇÃO' || a.status === 'EM ANÁLISE') statusShort = 'EM CONFECÇÃO';

                let statusBadge = `<span class="badge-status analise">EM CONFECÇÃO</span>`;
                if (statusShort === 'PRONTO') {
                    statusBadge = `<span class="badge-status operacao">PRONTO</span>`;
                } else if (statusShort === 'NO PÁTIO') {
                    statusBadge = `<span class="badge-status" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b;">NO PÁTIO</span>`;
                } else if (statusShort === 'NA OPM') {
                    statusBadge = `<span class="badge-status" style="background: rgba(148, 163, 184, 0.2); color: #cbd5e1; border: 1px solid #cbd5e1;">NA OPM</span>`;
                } else if (statusShort === 'EM CONFECÇÃO') {
                    statusBadge = `<span class="badge-status" style="background: rgba(6, 182, 212, 0.2); color: #38bdf8; border: 1px solid #38bdf8;">EM CONFECÇÃO</span>`;
                }

                // Data de Entrada valor ISO AAAA-MM-DD para o input de data
                const rawEntrada = a.dataEntrada || (a.timestamp ? a.timestamp.split('T')[0] : '2026-09-18');

                html += `
                    <tr>
                        <td><strong style="color: var(--accent-cyan); font-family: monospace; font-size: 13px;">${solicNum}</strong></td>
                        <td>${a.timestamp ? new Date(a.timestamp).toLocaleDateString('pt-BR') : '18/09/2026'}</td>
                        <td>
                            <input type="date" class="form-control" style="height: 28px; padding: 0 4px; font-size: 11px; width: 125px; background: var(--bg-input); border: 1px solid var(--border); color: #ffffff;" value="${rawEntrada}" onchange="atualizarDataEntrada('${a.protocolo || solicNum}', this.value)">
                        </td>
                        <td>${statusBadge}</td>
                        <td><strong>${a.opm}</strong></td>
                        <td><span style="font-family: monospace; font-size: 13px; font-weight: 800; color: #ffffff;">${a.placa}</span></td>
                        <td><strong>${procCurto}</strong></td>
                        <td>${a.sindicancia_ipm || 'N/A'}</td>
                        <td>${a.dataParecer ? `<span style="color:var(--accent-green); font-weight:800;">${a.dataParecer}</span>` : '<span style="color:var(--text-dim)">PENDENTE</span>'}</td>
                        <td style="text-align: center;">
                            <div style="display: flex; gap: 6px; justify-content: center;">
                                <button class="btn btn-secondary" style="height: 32px; font-size: 11px; padding: 0 10px; font-weight: 700;" onclick="abrirParecerSubdashboard('${a.protocolo || solicNum}')" title="Sub-Dashboard de Parecer Técnico">
                                    <i class="fa-solid fa-file-signature"></i> ${a.parecerId ? 'EDITAR PARECER' : 'FAZER PARECER'}
                                </button>
                                <button class="btn btn-primary" style="height: 32px; font-size: 11px; padding: 0 10px; font-weight: 700;" onclick="abrirModalEmailNotificacao('${a.protocolo || solicNum}')" title="Disparar e-mail com anexos">
                                    <i class="fa-solid fa-paper-plane"></i> E-MAIL
                                </button>
                                <button class="btn btn-success" style="height: 32px; font-size: 11px; padding: 0 10px; font-weight: 700;" onclick="abrirFolhaPainel('${a.protocolo || solicNum}')" title="Folha de Painel A4">
                                    <i class="fa-solid fa-id-card"></i> PAINEL
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
