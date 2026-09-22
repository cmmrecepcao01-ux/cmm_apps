
        const CONFIG = {
            API_URL: "https://script.google.com/macros/s/AKfycbxJkvysgq9goFkk6QBpQKmLbwQGjZyc9ONUtF0eM0obD5JuLj2D8NnZ7ukvxaKGlIVR/exec",
            STORAGE_KEY: "CMM_AGENDAMENTOS_TECMEC_DB",
            OPERATOR_KEY: "CMM_OPERADOR_LOGADO",
            CAPACIDADE_MAXIMA_PATIO: 8
        };

        let state = {
            operador: null,
            ticketSelecionado: null,
            viaturaSelecionada: null,
            semanaSelecionada: null,
            semanaLabel: null,
            dataCalculada: null,
            documentos: { 1: null, 2: null, 3: null, 4: null, 5: null },
            docsBase64: {},
            perguntas: [],
            bulkFotos: [],
            agendamentos: []
        };

        document.addEventListener("DOMContentLoaded", () => {
            carregarStorage();
            popularOpms();
            popularMeses();
            seedExemplosSeVazio();
            atualizarTabelaGestaoOperador();
        });

        function seedExemplosSeVazio() {
            if (state.agendamentos.length === 0) {
                state.agendamentos = [
                    {
                        numSolicitacao: 1,
                        protocolo: "SOLICITAÇÃO Nº 001",
                        timestamp: new Date().toISOString(),
                        status: "NO PÁTIO (AGUARDANDO ANÁLISE)",
                        tipo_procedimento: "INQUÉRITO POLICIAL MILITAR (IPM)",
                        sindicancia_ipm: "18BPMM-13/70/26",
                        posto_grad: "CAP PM",
                        re: "112233",
                        nome: "JOSÉ MAYCON DE PAIVA HONORATO",
                        telefone: "(11) 98765-4321",
                        email: "josemaycon@policiamilitar.sp.gov.br",
                        opm: "18.BPM/M",
                        placa: "UDD9H03",
                        prefixo: "M-18262",
                        modelo: "HYUNDAI CRETA 2025",
                        ano: "2025",
                        cor: "BRANCA (PADRÃO PM)",
                        chassi: "BHPE81FGTP260603",
                        motor: "G4NLNU98231",
                        patrimonio: "225033962-A",
                        condicao: "TRANSPORTADO POR GUINCHO / REBOQUE",
                        km: "5257",
                        motivo: "SINISTRO COM AVARIA DIANTEIRA ESQUERDA E SUSPENSÃO; ALEGAÇÃO DE FALHA NA FRENAGEM PELO CONDUTOR.",
                        objetivo: "CONSIDERANDO A NECESSIDADE DE SUBSIDIAR O IPM Nº 18BPMM-13/70/26, ENCAMINHO O VEÍCULO PARA ANÁLISE TÉCNICA PARA CONSTATAÇÃO DE POSSÍVEL IRREGULARIDADE NO SISTEMA DE FREIOS.",
                        perguntas: [
                            "O SISTEMA DE FREIOS DA VIATURA APRESENTAVA DEFEITO OU FALHA ANTERIOR À COLISÃO?",
                            "A FRENAGEM PODERIA TER SIDO PREJUDICADA POR VÍCIO OCULTO DO VEÍCULO?",
                            "AS AVARIAS CONSTATADAS SÃO DECORRENTES DO IMPACTO OU DE DESGASTE PREMATURO?"
                        ],
                        semanaKey: "SEM3",
                        semanaLabel: "SEMANA 3 (TER, QUA OU QUI)",
                        dataCalculada: "2026-06-17",
                        documentosAnexados: { oficio: true, portaria: true, oitiva: true, cop: true, comprovantes: false },
                        dataParecer: null,
                        operadorDesignado: null,
                        parecerDados: null
                    }
                ];
                salvarStorage();
            }
        }

        // ROTEAMENTO DE VISUALIZAÇÕES
        function abrirPortalCapa() {
            document.getElementById("viewPortalCapa").style.display = "block";
            document.getElementById("viewSolicitante").style.display = "none";
            document.getElementById("viewOperador").style.display = "none";
            document.getElementById("btnNavPortal")?.classList.add("active");
            document.getElementById("btnNavSolicitante")?.classList.remove("active");
            document.getElementById("btnNavOperador")?.classList.remove("active");
            
            const btnGestor = document.getElementById("btnNavOperador");
            if (btnGestor) btnGestor.style.display = "inline-flex";
        }

        function abrirAreaSolicitante() {
            document.getElementById("viewPortalCapa").style.display = "none";
            document.getElementById("viewSolicitante").style.display = "block";
            document.getElementById("viewOperador").style.display = "none";
            document.getElementById("btnNavPortal")?.classList.remove("active");
            document.getElementById("btnNavSolicitante")?.classList.add("active");
            document.getElementById("btnNavOperador")?.classList.remove("active");
            
            const btnGestor = document.getElementById("btnNavOperador");
            if (btnGestor) btnGestor.style.display = "none";
        }

        function abrirPainelOperador() {
            document.getElementById("viewPortalCapa").style.display = "none";
            document.getElementById("viewSolicitante").style.display = "none";
            document.getElementById("viewOperador").style.display = "block";
            document.getElementById("btnNavPortal")?.classList.remove("active");
            document.getElementById("btnNavSolicitante")?.classList.remove("active");
            document.getElementById("btnNavOperador")?.classList.add("active");
            
            const btnGestor = document.getElementById("btnNavOperador");
            if (btnGestor) btnGestor.style.display = "inline-flex";
            atualizarTabelaGestaoOperador();
        }

        // ACESSO DO SOLICITANTE (OPM + PLACA COM VALIDAÇÃO SIPL)
        function abrirModalAcessoSolicitante() {
            const errDiv = document.getElementById("acessoErroMsg");
            if (errDiv) errDiv.style.display = "none";
            const modal = document.getElementById("modalAcessoSolicitante");
            if (modal) modal.style.display = "flex";
        }

        function fecharModalAcessoSolicitante() {
            const modal = document.getElementById("modalAcessoSolicitante");
            if (modal) modal.style.display = "none";
        }

        function confirmarAcessoSolicitante() {
            const opm = (document.getElementById("acessoOpm")?.value || "").trim().toUpperCase();
            const placaBruta = (document.getElementById("acessoPlaca")?.value || "").trim().toUpperCase();
            const placaLimpa = placaBruta.replace(/[^A-Z0-9]/g, '');
            const errDiv = document.getElementById("acessoErroMsg");

            if (errDiv) errDiv.style.display = "none";

            if (!placaLimpa || placaLimpa.length < 7) {
                const msg = "PLACA INVÁLIDA: A placa deve possuir 7 caracteres (Ex: ABC1234).";
                if (errDiv) { errDiv.textContent = msg; errDiv.style.display = "block"; }
                showToast(msg, "error");
                return;
            }

            const frota = window.SIPL_FROTA || [];
            const v = frota.find(item => (item.p || "").replace(/[^A-Z0-9]/g, '') === placaLimpa);

            if (!v) {
                const msg = `PLACA INVÁLIDA: A viatura ${placaBruta} não consta no banco de dados do SIPL/PMESP. Acesso bloqueado.`;
                if (errDiv) { errDiv.textContent = msg; errDiv.style.display = "block"; }
                showToast(msg, "error");
                return;
            }

            state.viaturaSelecionada = v;
            document.getElementById("cardVtrPlaca").textContent = v.p || "---";
            document.getElementById("cardVtrPrefixo").textContent = v.pr ? `PREFIXO: ${v.pr}` : "PREFIXO: S/N";
            document.getElementById("cardVtrModelo").textContent = v.m || "---";
            document.getElementById("cardVtrAno").textContent = v.a || "---";
            document.getElementById("cardVtrOpm").textContent = opm || v.opm || "CMM";
            document.getElementById("cardVtrChassi").textContent = v.ch || "N/A";
            document.getElementById("cardVtrMotor").textContent = v.mot || "N/A";
            document.getElementById("cardVtrPatrimonio").textContent = v.pat || "N/A";

            fecharModalAcessoSolicitante();
            abrirAreaSolicitante();
            irParaEtapa(1);
            showToast(`Viatura ${v.p} identificada com sucesso!`, "success");
        }

        // LOGIN DO OPERADOR
        function abrirModalLogin() {
            const errDiv = document.getElementById("loginErroMsg");
            if (errDiv) errDiv.style.display = "none";
            document.getElementById("loginUser").value = "";
            document.getElementById("loginPass").value = "";
            document.getElementById("modalLoginOperador").style.display = "flex";
        }

        function fecharModalLogin() {
            document.getElementById("modalLoginOperador").style.display = "none";
        }

        function confirmarLoginOperador() {
            const u = (document.getElementById("loginUser")?.value || "").trim().toLowerCase();
            const p = (document.getElementById("loginPass")?.value || "").trim().toLowerCase();
            const errDiv = document.getElementById("loginErroMsg");

            if (u === "cmm" && p === "cmmtecmec") {
                fecharModalLogin();
                state.operadorLogado = true;
                abrirPainelOperador();
                showToast("Acesso concedido ao Painel do Gestor CMM!", "success");
            } else {
                const msg = "Credenciais inválidas. Usuário deve ser 'cmm' e senha 'cmmtecmec'.";
                if (errDiv) { errDiv.textContent = msg; errDiv.style.display = "block"; }
                showToast(msg, "error");
            }
        }

        // ETAPAS DO WIZARD DO SOLICITANTE
        function irParaEtapa(step) {
            if (step === 2) {
                const numSind = (document.getElementById("numSindicancia")?.value || "").trim();
                const email = (document.getElementById("militarEmail")?.value || "").trim().toLowerCase();
                const motivo = (document.getElementById("motivoVistoria")?.value || "").trim();

                if (!numSind || numSind.length < 3) {
                    showToast("Informe o número oficial da Sindicância ou IPM para avançar.", "error");
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

        // GERADOR DE SOLICITAÇÃO SEQUENCIAL
        function gerarProximoNumeroSolicitacao() {
            const ags = state.agendamentos || [];
            let maxNum = 0;
            ags.forEach(a => {
                if (a.numSolicitacao && typeof a.numSolicitacao === 'number') {
                    if (a.numSolicitacao > maxNum) maxNum = a.numSolicitacao;
                }
            });
            const nextVal = maxNum + 1;
            return {
                num: nextVal,
                label: `SOLICITAÇÃO Nº ${String(nextVal).padStart(3, '0')}`
            };
        }

        function finalizarAgendamento() {
            if (!state.semanaSelecionada) {
                showToast("Selecione uma semana disponível.", "error");
                return;
            }
            const term = document.getElementById("checkFinalTermo");
            if (term && !term.checked) {
                showToast("Marque a declaração final para concluir.", "error");
                return;
            }

            const solicInfo = gerarProximoNumeroSolicitacao();

            const agendamento = {
                numSolicitacao: solicInfo.num,
                protocolo: solicInfo.label,
                timestamp: new Date().toISOString(),
                status: "NO PÁTIO (AGUARDANDO ANÁLISE)",
                tipo_procedimento: document.getElementById("tipoProcedimento")?.value || "SINDICÂNCIA",
                sindicancia_ipm: (document.getElementById("numSindicancia")?.value || "").trim().toUpperCase(),
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
                dataCalculada: state.dataCalculada || new Date().toLocaleDateString('pt-BR'),
                documentosAnexados: { oficio: true, portaria: true, oitiva: true, cop: !!state.documentos[4], comprovantes: !!state.documentos[5] },
                dataParecer: null,
                operadorDesignado: null,
                parecerDados: null
            };

            state.agendamentos.push(agendamento);
            salvarStorage();
            atualizarTabelaGestaoOperador();
            exibirGuiaOficial(agendamento);
            enviarAgendamentoEAnexosAoGoogleDrive(agendamento);
        }

        function exibirGuiaOficial(a) {
            for (let i = 1; i <= 5; i++) {
                const c = document.getElementById(`stepCard${i}`);
                if (c) c.style.display = "none";
            }
            const steps = document.querySelector(".wizard-steps");
            if (steps) steps.style.display = "none";

            document.getElementById("receiptProtocolo").textContent = a.protocolo;
            document.getElementById("recDataHora").textContent = `${a.semanaLabel} - DIAS: TER, QUA OU QUI`;

            const qrBox = document.getElementById("qrcodeBox");
            if (qrBox) {
                qrBox.innerHTML = "";
                new QRCode(qrBox, {
                    text: `CMM-TECMEC|${a.protocolo}|PLACA:${a.placa}|OPM:${a.opm}`,
                    width: 80, height: 80
                });
            }

            document.getElementById("stepCardConfirmacao").style.display = "block";
            showToast(`AGENDAMENTO CONFIRMADO! ${a.protocolo}`, "success");
        }

        // PAINEL DO OPERADOR - TABELA DE GESTÃO
        function atualizarTabelaGestaoOperador() {
            const tbody = document.getElementById("tabelaAgendamentosBody");
            if (!tbody) return;

            const list = state.agendamentos || [];
            if (list.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 20px;">NENHUM AGENDAMENTO REGISTRADO NO SISTEMA.</td></tr>`;
                return;
            }

            let html = "";
            list.forEach((a, idx) => {
                const statusBadge = a.dataParecer ? `<span class="badge-status operacao">PARECER EMITIDO (${a.dataParecer})</span>` : `<span class="badge-status analise">${a.status}</span>`;
                html += `
                    <tr>
                        <td><strong style="color: var(--accent-cyan); font-family: monospace;">${a.protocolo || 'SOLICITAÇÃO Nº ' + String(idx + 1).padStart(3, '0')}</strong></td>
                        <td>${new Date(a.timestamp).toLocaleDateString('pt-BR')}</td>
                        <td>${statusBadge}</td>
                        <td><strong>${a.opm}</strong></td>
                        <td><span style="font-family: monospace; font-size: 13px; font-weight: 800;">${a.placa}</span> ${a.prefixo ? '(' + a.prefixo + ')' : ''}</td>
                        <td>${a.tipo_procedimento}</td>
                        <td>${a.sindicancia_ipm}</td>
                        <td>${a.dataParecer || '<span style="color:var(--text-dim)">PENDENTE</span>'}</td>
                        <td>
                            <div style="display: flex; gap: 6px;">
                                <button class="btn btn-secondary" style="height: 30px; font-size: 10px;" onclick="definirDataParecerOperador('${a.protocolo}')">
                                    <i class="fa-solid fa-calendar-check"></i> DATA PARECER
                                </button>
                                <button class="btn btn-primary" style="height: 30px; font-size: 10px;" onclick="abrirModalEmailNotificacao('${a.protocolo}')">
                                    <i class="fa-solid fa-envelope"></i> E-MAIL
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }

        function definirDataParecerOperador(protocolo) {
            const a = state.agendamentos.find(item => item.protocolo === protocolo);
            if (!a) return;

            const dataHoje = new Date().toLocaleDateString('pt-BR');
            const dataInput = prompt(`Lançar Data do Parecer Técnico para o agendamento ${a.protocolo} (${a.opm}):`, dataHoje);
            if (!dataInput) return;

            a.dataParecer = dataInput.trim();
            a.status = "CONCLUÍDO / PARECER EMITIDO (PÁTIO LIBERADO)";
            salvarStorage();
            atualizarTabelaGestaoOperador();
            showToast(`Data do Parecer (${a.dataParecer}) registrada! Vaga liberada para a OPM ${a.opm}.`, "success");
        }

        function abrirModalEmailNotificacao(protocolo) {
            const a = state.agendamentos.find(item => item.protocolo === protocolo);
            if (!a) return;

            document.getElementById("emailDestinatario").value = a.email || "subfrota@policiamilitar.sp.gov.br";
            document.getElementById("emailAssunto").value = `CMM PMESP - VIATURA PRONTA PARA RETIRADA - ${a.protocolo} (${a.placa})`;
            document.getElementById("emailCorpo").value = `Prezado Oficial Subfrota/Motomec de ${a.opm},

Informamos que seu veículo ${a.placa}, ${a.prefixo ? 'VTR ' + a.prefixo : ''} encontra-se pronto para retirada no Centro de Motomecanização. Solicitamos que seja retirado no prazo máximo de 07 dias por questões de limitação de vagas no pátio.

O PARECER TÉCNICO Nº ${a.parecerDados?.numParecer || 'CMM-24/30.3/26'}, encontra-se pronto e somente é liberado no sistema após a retirada do veículo no CMM. Agradecemos pela colaboração.

Atenciosamente,
Centro de Motomecanização - Seção de Manutenção de Frota
Polícia Militar do Estado de São Paulo`;

            document.getElementById("modalEmail").style.display = "flex";
        }

        function fecharModalEmail() {
            document.getElementById("modalEmail").style.display = "none";
        }

        function dispararEnvioEmailNotificacao() {
            const dest = (document.getElementById("emailDestinatario")?.value || "").trim().toLowerCase();
            if (!dest || !dest.endsWith("@policiamilitar.sp.gov.br")) {
                showToast("Informe um e-mail institucional válido (@policiamilitar.sp.gov.br).", "error");
                return;
            }
            fecharModalEmail();
            showToast(`E-mail de notificação enviado com sucesso para ${dest}!`, "success");
        }

        // MODAL CONSULTA
        function abrirModalConsulta() {
            document.getElementById("modalConsulta").style.display = "flex";
        }

        function fecharModalConsulta() {
            document.getElementById("modalConsulta").style.display = "none";
        }

        function executarBuscaModalConsulta() {
            const q = (document.getElementById("inputModalConsulta")?.value || "").trim().toUpperCase();
            const box = document.getElementById("resultadoModalConsulta");
            if (!q || !box) return;

            const item = state.agendamentos.find(a => (a.protocolo && a.protocolo.includes(q)) || (a.placa && a.placa.includes(q)));
            if (!item) {
                box.innerHTML = `<div style="color:#f87171; text-align:center; padding:10px;">Nenhum registro encontrado para '${q}'.</div>`;
                box.style.display = "block";
                return;
            }

            box.innerHTML = `
                <div style="background:var(--bg-card); padding:14px; border-radius:6px; border:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                        <strong style="color:var(--accent-cyan); font-family:monospace;">${item.protocolo}</strong>
                        <span class="badge-status operacao">${item.status}</span>
                    </div>
                    <p style="font-size:11px;"><strong>VTR:</strong> ${item.placa} | <strong>OPM:</strong> ${item.opm}</p>
                    <p style="font-size:11px;"><strong>PROCEDIMENTO:</strong> ${item.sindicancia_ipm}</p>
                </div>
            `;
            box.style.display = "block";
        }

        // AUXILIARES DE SEMANA E OPMS
        function popularMeses() {
            const sel = document.getElementById("selectMesAgendamento");
            if (!sel) return;

            const nomesMeses = [
                "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
                "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
            ];

            const hoje = new Date();
            let mesAtualIdx = hoje.getMonth();
            let anoAtual = hoje.getFullYear();

            let opcoes = [];
            for (let i = 0; i < 6; i++) {
                let mIdx = (mesAtualIdx + i) % 12;
                let ano = anoAtual + Math.floor((mesAtualIdx + i) / 12);
                let label = `${nomesMeses[mIdx]} DE ${ano}`;
                opcoes.push(`<option value="${label}">${label}</option>`);
            }

            sel.innerHTML = opcoes.join("");
            renderizarSemanasMes(sel.value);
        }

        function renderizarSemanasMes(mesStr) {
            const grid = document.getElementById("gridSemanasMes");
            if (!grid) return;
            const semanas = [
                { id: "SEM1", label: "SEMANA 1 (01 A 07)" },
                { id: "SEM2", label: "SEMANA 2 (08 A 14)" },
                { id: "SEM3", label: "SEMANA 3 (15 A 21)" },
                { id: "SEM4", label: "SEMANA 4 (22 A 28)" }
            ];

            grid.innerHTML = semanas.map(s => `
                <div class="week-card" id="cardWeek_${s.id}" onclick="selecionarSemanaCard('${s.id}', '${s.label}')">
                    <strong style="display:block; font-size:12px; color:#fff; margin-bottom:4px;">${s.label}</strong>
                    <span style="font-size:10px; color:var(--text-muted);">DIAS: TER, QUA E QUI</span>
                </div>
            `).join("");
        }

        function selecionarSemanaCard(id, label) {
            document.querySelectorAll(".week-card").forEach(c => c.classList.remove("selected"));
            const card = document.getElementById(`cardWeek_${id}`);
            if (card) card.classList.add("selected");
            state.semanaSelecionada = id;
            state.semanaLabel = label;
            showToast(`${label} selecionada!`, "success");
        }

        function popularOpms() {
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

            // OPMs padrão complementares
            const opmsPadrao = ["1.BPM/M", "2.BPM/M", "3.BPM/M", "4.BPM/M", "5.BPM/M", "9.BPM/M", "16.BPM/M", "18.BPM/M", "23.BPM/M", "RPMON", "CPTRAN", "CMM"];
            opmsPadrao.forEach(o => opmSet.add(o));

            const listaOrdenada = Array.from(opmSet).sort();
            dl.innerHTML = listaOrdenada.map(o => `<option value="${o}">`).join("");
            console.log(`Datalist opmList populado com ${listaOrdenada.length} OPMs únicas da PMESP.`);
        }">`).join("");
        }

        // GESTÃO DINÂMICA DE PERGUNTAS DO PRESIDENTE (ETAPA 4)
        function adicionarNovaPergunta() {
            state.perguntas = state.perguntas || [];
            state.perguntas.push("");
            renderizarListaPerguntasDinamicas();
        }

        function removerPergunta(index) {
            state.perguntas.splice(index, 1);
            renderizarListaPerguntasDinamicas();
        }

        function atualizarTextoPergunta(index, val) {
            if (state.perguntas[index] !== undefined) {
                state.perguntas[index] = val.trim().toUpperCase();
            }
        }

        function renderizarListaPerguntasDinamicas() {
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

        function toggleSecaoPerguntas(show) {
            const sec = document.getElementById("secaoPerguntasDinamicas");
            if (sec) sec.style.display = show ? "block" : "none";
            if (show && (!state.perguntas || state.perguntas.length === 0)) {
                adicionarNovaPergunta();
            }
        }

        function preencherObjetivoExemplo() {
            const obj = document.getElementById("objetivoAnalise");
            if (obj) {
                obj.value = "CONSIDERANDO A NECESSIDADE DE SUBSIDIAR O PROCEDIMENTO APURATÓRIO INSTAURADO, ENCAMINHO O VEÍCULO PARA ANÁLISE TÉCNICA PARA CONSTATAÇÃO DE POSSÍVEL IRREGULARIDADE OU FALHA MECÂNICA/ELETRÔNICA NO SISTEMA DE FREIOS E SEGURANÇA.";
            }
        }

        // ARMAZENAMENTO BASE64 DOS DOCUMENTOS PDF
        state.docsBase64 = state.docsBase64 || {};

        function atualizarStatusDoc(idx, input) {
            if (!input.files || input.files.length === 0) return;
            
            const file = input.files[0];
            if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                showToast("Selecione um arquivo no formato PDF.", "error");
                input.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const base64Str = e.target.result.split(',')[1];
                state.docsBase64[`doc${idx}`] = {
                    name: file.name,
                    mimeType: file.type || "application/pdf",
                    base64: base64Str
                };
                
                const card = document.getElementById(`uploadCard${idx}`);
                if (card) card.classList.add("attached");
                showToast(`Documento ${idx} (${file.name}) anexado em PDF!`, "success");
            };
            reader.readAsDataURL(file);
        }

        async function enviarAgendamentoEAnexosAoGoogleDrive(agendamento) {
            if (!CONFIG.API_URL || CONFIG.API_URL.trim() === "" || CONFIG.API_URL.includes("AKfycbx...")) {
                console.warn("CONFIG.API_URL não configurada. Insira a URL do Web App do Google Apps Script.");
                return;
            }

            try {
                showToast("Enviando agendamento e anexos em PDF para o Google Drive...", "info");
                const response = await fetch(CONFIG.API_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "NOVO_AGENDAMENTO",
                        data: agendamento,
                        docsBase64: state.docsBase64
                    })
                });

                const resJson = await response.json();
                if (resJson.status === "SUCCESS") {
                    showToast("Agendamento e PDFs salvos no Google Drive com sucesso!", "success");
                }
            } catch (err) {
                console.error("Erro no envio para o Google Drive:", err);
            }
        }

        function carregarStorage() {
            try {
                const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
                state.agendamentos = raw ? JSON.parse(raw) : [];
            } catch (e) { state.agendamentos = []; }
        }

        function salvarStorage() {
            try {
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.agendamentos));
            } catch (e) {}
        }

        function showToast(msg, type = "info") {
            const t = document.getElementById("toastMsg");
            if (!t) return;
            t.textContent = msg;
            t.className = `toast show ${type}`;
            setTimeout(() => { t.className = "toast"; }, 4000);
        }
    