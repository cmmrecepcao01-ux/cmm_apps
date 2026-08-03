// PAINEL DO GESTOR CMM - SCRIPT (REFINE INDICADORES DUPLOS)

// Configurações Globais
let GAS_API_URL = localStorage.getItem("cmm_gas_url") || "";
let tasks = [];
let subsections = [];
let deleteTarget = null; 

// Mock Inicial para o Panorama Geral (Com Rótulos e Valores Duplos)
const MOCK_PANORAMA = [
    { row: 2, title: "LINHA 2 RODAS", lbl1: "MOTOS NA LINHA", val1: "3", lbl2: "MAIOR TEMPO PARADA", val2: "5 DIAS", status: "NORMAL", alert: "REVISÕES PERIÓDICAS SOB CONTROLE.", link: "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/" },
    { row: 3, title: "LINHA 4 RODAS", lbl1: "CARROS NA LINHA", val1: "8", lbl2: "MAIOR TEMPO PARADO", val2: "15 DIAS", status: "ALERTA", alert: "AGUARDANDO PEÇAS DA TRAILBLAZER (REIS).", link: "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/" },
    { row: 4, title: "LINHA PESADOS", lbl1: "VEÍCULOS NA LINHA", val1: "1", lbl2: "MAIOR TEMPO PARADO", val2: "1 DIA", status: "NORMAL", alert: "VTR TRUCK COM PREVISÃO DE SAÍDA HOJE.", link: "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/" },
    { row: 5, title: "SINALIZADORES", lbl1: "SINALIZ. EM MANUT.", val1: "15", lbl2: "AGUARD. INSTALAÇÃO", val2: "6", status: "NORMAL", alert: "INSTALAÇÕES ELÉTRICAS DENTRO DO PRAZO.", link: "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/" },
    { row: 6, title: "GRAFISMO", lbl1: "AGUARD. PLOTAGEM", val1: "2", lbl2: "PRAZO MÉDIO", val2: "3 DIAS", status: "NORMAL", alert: "PLOTAGENS OPERACIONAIS CONCLUÍDAS.", link: "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/" },
    { row: 7, title: "TÉCNICA", lbl1: "LAUDOS PENDENTES", val1: "2", lbl2: "TRS EM ELABORAÇÃO", val2: "1", status: "ALERTA", alert: "NECESSÁRIO REVISÃO TÉCNICA DE CONTRATOS.", link: "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/" },
    { row: 8, title: "BORRACHARIA", lbl1: "CONSUMO PNEUS/SEM", val1: "24", lbl2: "VULCANIZAÇÃO PEND.", val2: "5", status: "CRÍTICO", alert: "MAQUINÁRIO DE VULCANIZAÇÃO FORA DE SERVIÇO.", link: "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/" },
    { row: 9, title: "ALMOXARIFADO", lbl1: "ITENS EM FALTA", val1: "12", lbl2: "ITEM MAIS URGENTE", val2: "AMORTECEDOR TRAILBLAZER", status: "NORMAL", alert: "ESTOQUE CRÍTICO MONITORADO.", link: "https://cmmpaineldebordo.netlify.app/3_almox_cmm_dashboard/dist/" },
    { row: 10, title: "GARANTIA", lbl1: "GARANTIAS ATIVAS", val1: "2", lbl2: "MARCA C/ MAIS PROB", val2: "CHEVROLET (3 VTRS)", status: "ALERTA", alert: "AGUARDANDO LAUDO TÉCNICO DA CONCESSIONÁRIA.", link: "https://cmmpaineldebordo.netlify.app/4_garantias_cmm_dashboard/" },
    { row: 11, title: "PRODUTIVIDADE", lbl1: "EFICIÊNCIA FROTA", val1: "94.5%", lbl2: "META MENSAL", val2: "90%", status: "NORMAL", alert: "META DE PRODUTIVIDADE SUPERADA.", link: "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/" },
    { row: 12, title: "PEDIDOS DE AGENDAMENTO", lbl1: "AGENDAM. PENDENTES", val1: "4", lbl2: "PRÓXIMO CRÍTICO", val2: "REVISÃO BLINDAGEM 28/JUL", status: "NORMAL", alert: "AGUARDANDO LIBERAÇÃO DO DIRETOR.", link: "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/" }
];

// Mock Inicial para as Missões e Rotinas
const MOCK_TASKS = [
    { sheet: "Junho", row: 8, data: "2025-06-13", qru: "TRAIL BLAZER CEL CARLOS MARQUES", anotacoes: "REVISAR E LIBERAR ATÉ 15H // ESTÁ COM AMORTECEDOR ESQ. DIANT. QUEBRADO", providencias: "TROCAR OS DOIS LADOS CONJUNTO TODO // PREVISÃO PARA QUINTA-FEIRA", situacao: "RETIRADA - QRV" },
    { sheet: "julho", row: 20, data: "2025-07-11", qru: "RELATORIO 09JUL", anotacoes: "CONFECCIONAR CONFORME MODELO", providencias: "EM ANDAMENTO", situacao: "FINALIZADO E ENVIADO" },
    { sheet: "AGOSTO", row: 20, data: "2025-08-06", qru: "PREGÃO DE PEÇAS", anotacoes: "AVISAR CEL DEMETRIUS PARA ASSINAR O DFD NO COMPRASGOV", providencias: "VERIFICAR DOCUMENTOS DA CONTRATAÇÃO", situacao: "PENDENTE" }
];

// Elementos DOM
const elements = {
    // Abas / Navegação
    tabPanoramaBtn: document.getElementById("tab-panorama-btn"),
    tabTasksBtn: document.getElementById("tab-tasks-btn"),
    tabConfigBtn: document.getElementById("tab-config-btn"),
    viewPanorama: document.getElementById("view-panorama"),
    viewTasks: document.getElementById("view-tasks"),
    viewConfig: document.getElementById("view-config"),
    pageTitle: document.getElementById("page-title"),
    pageSubtitle: document.getElementById("page-subtitle"),
    syncStatus: document.getElementById("sync-status"),

    // Panorama Geral
    subsectionsContainer: document.getElementById("subsections-container"),
    editSubModal: document.getElementById("edit-sub-modal"),
    editSubForm: document.getElementById("edit-sub-form"),
    editSubIndex: document.getElementById("edit-sub-index"),
    editSubTitle: document.getElementById("edit-sub-title"),
    editSubLbl1: document.getElementById("edit-sub-lbl1"),
    editSubVal1: document.getElementById("edit-sub-val1"),
    editSubLbl2: document.getElementById("edit-sub-lbl2"),
    editSubVal2: document.getElementById("edit-sub-val2"),
    editSubStatus: document.getElementById("edit-sub-status"),
    editSubAlert: document.getElementById("edit-sub-alert"),
    editSubLink: document.getElementById("edit-sub-link"),
    btnEditSubCancel: document.getElementById("btn-edit-sub-cancel"),

    // Missões e Rotinas
    tbody: document.getElementById("tasks-tbody"),
    form: document.getElementById("task-form"),
    formTitle: document.getElementById("form-title"),
    taskIndex: document.getElementById("task-index"),
    taskSheet: document.getElementById("task-sheet"),
    taskDate: document.getElementById("task-date"),
    taskQru: document.getElementById("task-qru"),
    taskNotes: document.getElementById("task-notes"),
    taskActions: document.getElementById("task-actions"),
    taskStatus: document.getElementById("task-status"),
    btnSubmit: document.getElementById("btn-submit"),
    btnCancel: document.getElementById("btn-cancel"),
    btnRefresh: document.getElementById("btn-refresh"),
    searchInput: document.getElementById("search-input"),
    filterMonth: document.getElementById("filter-month"),
    filterStatus: document.getElementById("filter-status"),
    
    // Configurações
    configGasUrl: document.getElementById("config-gas-url"),
    btnSaveConfig: document.getElementById("btn-save-config"),
    btnTestConfig: document.getElementById("btn-test-config"),

    // Modais e Toasts
    deleteModal: document.getElementById("delete-modal"),
    btnDeleteConfirm: document.getElementById("btn-delete-confirm"),
    btnDeleteCancel: document.getElementById("btn-delete-cancel"),
    toast: document.getElementById("toast-notification"),
    toastIcon: document.getElementById("toast-icon"),
    toastMessage: document.getElementById("toast-message"),
    
    // Métricas
    metricTotal: document.getElementById("metric-total"),
    metricDone: document.getElementById("metric-done"),
    metricProgress: document.getElementById("metric-progress"),
    metricPending: document.getElementById("metric-pending")
};

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupEventListeners();
    
    elements.configGasUrl.value = GAS_API_URL;

    const today = new Date().toISOString().split('T')[0];
    elements.taskDate.value = today;

    loadAllData();
});

// Configuração da Navegação
function setupNavigation() {
    const tabs = [
        { btn: elements.tabPanoramaBtn, view: elements.viewPanorama, title: "Panorama Geral", subtitle: "Visão unificada das subseções e indicadores em tempo real" },
        { btn: elements.tabTasksBtn, view: elements.viewTasks, title: "Missões e Rotinas", subtitle: "Anotador oficial de prazos, providências e controle de missões" },
        { btn: elements.tabConfigBtn, view: elements.viewConfig, title: "Configurações", subtitle: "Gerenciamento da conexão com as planilhas do Google Drive" }
    ];

    tabs.forEach(tab => {
        tab.btn.addEventListener("click", () => {
            tabs.forEach(t => {
                t.btn.classList.remove("active");
                t.view.classList.remove("active");
            });

            tab.btn.classList.add("active");
            tab.view.classList.add("active");

            elements.pageTitle.textContent = tab.title;
            elements.pageSubtitle.textContent = tab.subtitle;
        });
    });
}

// Configuração de Eventos Gerais
function setupEventListeners() {
    elements.btnSaveConfig.addEventListener("click", saveConfiguration);
    elements.btnTestConfig.addEventListener("click", testConnection);

    elements.form.addEventListener("submit", handleTaskFormSubmit);
    elements.btnCancel.addEventListener("click", resetTaskForm);

    elements.btnRefresh.addEventListener("click", () => {
        if (!GAS_API_URL) {
            showToast("Configure a URL do Google Sheets primeiro!", "error");
        } else {
            fetchDataFromSheets();
        }
    });

    elements.searchInput.addEventListener("input", renderTasks);
    elements.filterMonth.addEventListener("change", renderTasks);
    elements.filterStatus.addEventListener("change", renderTasks);

    elements.btnDeleteCancel.addEventListener("click", () => {
        elements.deleteModal.classList.remove("active");
        deleteTarget = null;
    });
    elements.btnDeleteConfirm.addEventListener("click", executeTaskDelete);

    elements.btnEditSubCancel.addEventListener("click", () => {
        elements.editSubModal.classList.remove("active");
    });
    elements.editSubForm.addEventListener("submit", handleSubFormSubmit);
}

// Carregar Dados Gerais
function loadAllData() {
    updateSyncIndicator();

    const localPanorama = localStorage.getItem("cmm_panorama_local");
    if (localPanorama) {
        subsections = JSON.parse(localPanorama);
        if (subsections.length > 0 && subsections[0].val1 === undefined) {
            subsections = [...MOCK_PANORAMA];
            localStorage.setItem("cmm_panorama_local", JSON.stringify(subsections));
        }
    } else {
        subsections = [...MOCK_PANORAMA];
        localStorage.setItem("cmm_panorama_local", JSON.stringify(subsections));
    }
    renderSubsections();

    const localTasks = localStorage.getItem("cmm_tasks_local");
    if (localTasks) {
        tasks = JSON.parse(localTasks);
    } else {
        tasks = [...MOCK_TASKS];
        localStorage.setItem("cmm_tasks_local", JSON.stringify(tasks));
    }
    renderTasks();

    if (GAS_API_URL) {
        fetchDataFromSheets();
    } else {
        showToast("Modo de armazenamento local ativado (Offline)", "info");
    }
}

// Busca dados via Google Apps Script (GET)
async function fetchDataFromSheets() {
    setLoadingState(true);
    try {
        const response = await fetch(GAS_API_URL);
        const data = await response.json();

        if (data.success) {
            tasks = data.tasks;
            subsections = data.panorama || subsections;
            
            localStorage.setItem("cmm_tasks_local", JSON.stringify(tasks));
            localStorage.setItem("cmm_panorama_local", JSON.stringify(subsections));
            
            renderSubsections();
            renderTasks();
            
            showToast("Dados sincronizados com o Google Sheets!", "success");
        } else {
            throw new Error(data.error || "Estrutura inválida.");
        }
    } catch (error) {
        console.error("Erro na busca de dados:", error);
        showToast("Sincronização indisponível. Carregando dados locais.", "error");
        renderSubsections();
        renderTasks();
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(isLoading) {
    if (isLoading) {
        elements.tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="spinner-wrapper">
                        <div class="spinner"></div>
                        <p>Sincronizando tarefas com a planilha...</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function updateSyncIndicator() {
    if (GAS_API_URL) {
        elements.syncStatus.innerHTML = `<i class="fa-solid fa-circle-dot online fa-fade"></i> Conectado`;
    } else {
        elements.syncStatus.innerHTML = `<i class="fa-solid fa-circle-dot offline"></i> Local`;
    }
}

function saveConfiguration() {
    const url = elements.configGasUrl.value.trim();
    GAS_API_URL = url;
    localStorage.setItem("cmm_gas_url", url);
    updateSyncIndicator();

    if (url) {
        showToast("URL da API configurada! Iniciando sincronização...", "success");
        fetchDataFromSheets();
    } else {
        showToast("Removido URL. Usando modo de simulação local.", "info");
        loadAllData();
    }
}

async function testConnection() {
    const url = elements.configGasUrl.value.trim();
    if (!url) {
        showToast("Por favor, insira uma URL primeiro.", "error");
        return;
    }

    showToast("Testando conexão...", "info");
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.success) {
            showToast("Conexão estabelecida com sucesso! Planilha respondendo.", "success");
        } else {
            showToast("Script conectado, mas retornou erro: " + data.error, "error");
        }
    } catch (e) {
        showToast("Falha de conexão. Verifique a URL ou o CORS do Apps Script.", "error");
    }
}

function showToast(message, type = "info") {
    elements.toast.className = `toast active ${type}`;
    elements.toastMessage.textContent = message;

    if (type === "success") {
        elements.toastIcon.className = "fa-solid fa-circle-check";
        elements.toastIcon.style.color = "var(--color-green)";
    } else if (type === "error") {
        elements.toastIcon.className = "fa-solid fa-circle-xmark";
        elements.toastIcon.style.color = "var(--color-red)";
    } else {
        elements.toastIcon.className = "fa-solid fa-circle-info";
        elements.toastIcon.style.color = "var(--color-blue)";
    }

    setTimeout(() => {
        elements.toast.classList.remove("active");
    }, 4000);
}

// Renderiza Subseções com Indicadores Duplos
function renderSubsections() {
    if (subsections.length === 0) {
        elements.subsectionsContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fa-solid fa-folder-open"></i>
                <p>Nenhuma subseção cadastrada.</p>
            </div>
        `;
        return;
    }

    elements.subsectionsContainer.innerHTML = subsections.map((sub, idx) => {
        const statusClass = sub.status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
        
        let alertIcon = "fa-info-circle";
        if (sub.status.includes("ALERTA")) alertIcon = "fa-exclamation-triangle";
        if (sub.status.includes("CRÍTICO")) alertIcon = "fa-radiation";

        return `
            <div class="sub-card">
                <div class="sub-card-header">
                    <span class="sub-card-title" title="${sub.title}">${sub.title}</span>
                    <span class="status-dot ${statusClass}" title="Status: ${sub.status}"></span>
                </div>
                <div class="sub-card-body">
                    <a href="${sub.link}" target="_blank" class="indicator-link" title="Clique para acessar o painel de produtividade">
                        
                        <div class="indicator-group-container">
                            <div class="indicator-group">
                                <span class="indicator-value ${statusClass}" title="${sub.val1}">${sub.val1}</span>
                                <span class="indicator-label" title="${sub.lbl1}">${sub.lbl1}</span>
                            </div>
                            <div class="indicator-separator"></div>
                            <div class="indicator-group">
                                <span class="indicator-value ${statusClass}" title="${sub.val2}">${sub.val2}</span>
                                <span class="indicator-label" title="${sub.lbl2}">${sub.lbl2}</span>
                            </div>
                        </div>
                        
                        <span class="access-label">Acessar Seção <i class="fa-solid fa-external-link-alt"></i></span>
                    </a>
                </div>
                <div class="sub-card-alert ${statusClass}">
                    <i class="fa-solid ${alertIcon}"></i>
                    <span>${sub.alert}</span>
                </div>
                <div class="sub-card-footer">
                    <button class="btn-card-edit" onclick="editSubsection(${idx})">
                        <i class="fa-solid fa-pencil"></i> Editar Indicadores
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

// Abrir Edição de Subseção (Carregar os 4 campos de indicador)
window.editSubsection = function(idx) {
    const sub = subsections[idx];
    if (!sub) return;

    elements.editSubIndex.value = idx;
    elements.editSubTitle.value = sub.title;
    elements.editSubLbl1.value = sub.lbl1 || "";
    elements.editSubVal1.value = sub.val1 || "";
    elements.editSubLbl2.value = sub.lbl2 || "";
    elements.editSubVal2.value = sub.val2 || "";
    elements.editSubStatus.value = sub.status;
    elements.editSubAlert.value = sub.alert;
    elements.editSubLink.value = sub.link;

    elements.editSubModal.classList.add("active");
};

// Grava Edição da Subseção
async function handleSubFormSubmit(e) {
    e.preventDefault();

    const idx = parseInt(elements.editSubIndex.value);
    const sub = subsections[idx];
    if (!sub) return;

    const updatedData = {
        lbl1: elements.editSubLbl1.value.trim().toUpperCase(),
        val1: elements.editSubVal1.value.trim().toUpperCase(),
        lbl2: elements.editSubLbl2.value.trim().toUpperCase(),
        val2: elements.editSubVal2.value.trim().toUpperCase(),
        status: elements.editSubStatus.value.toUpperCase(),
        alert: elements.editSubAlert.value.trim().toUpperCase(),
        link: elements.editSubLink.value.trim()
    };

    if (GAS_API_URL) {
        elements.editSubModal.classList.remove("active");
        setLoadingState(true);
        try {
            const response = await fetch(GAS_API_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "update_sub",
                    row: sub.row,
                    ...updatedData
                })
            });
            const data = await response.json();
            if (data.success) {
                showToast(data.message || "Panorama atualizado!", "success");
                await fetchDataFromSheets();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error("Erro ao atualizar panorama:", error);
            showToast("Erro ao salvar no Sheets. Gravando localmente.", "error");
            
            subsections[idx] = { ...sub, ...updatedData };
            localStorage.setItem("cmm_panorama_local", JSON.stringify(subsections));
            renderSubsections();
        } finally {
            setLoadingState(false);
        }
    } else {
        subsections[idx] = { ...sub, ...updatedData };
        localStorage.setItem("cmm_panorama_local", JSON.stringify(subsections));
        elements.editSubModal.classList.remove("active");
        renderSubsections();
        showToast("Panorama atualizado localmente!", "success");
    }
}

// ==========================================
// SEÇÃO: MISSÕES E ROTINAS
// ==========================================

function updateTaskMetrics() {
    elements.metricTotal.textContent = tasks.length;
    
    const done = tasks.filter(t => t.situacao.includes("QRV") || t.situacao.includes("FINALIZADO")).length;
    const progress = tasks.filter(t => t.situacao.includes("ANDAMENTO")).length;
    const pending = tasks.filter(t => t.situacao.includes("PENDENTE")).length;

    elements.metricDone.textContent = done;
    elements.metricProgress.textContent = progress;
    elements.metricPending.textContent = pending;
}

function renderTasks() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const monthFilter = elements.filterMonth.value;
    const statusFilter = elements.filterStatus.value;

    const filtered = tasks.filter(t => {
        const matchesSearch = 
            t.qru.toLowerCase().includes(searchTerm) || 
            t.anotacoes.toLowerCase().includes(searchTerm) || 
            t.providencias.toLowerCase().includes(searchTerm);
            
        const matchesMonth = !monthFilter || (t.sheet && t.sheet.toLowerCase() === monthFilter.toLowerCase());
        
        let matchesStatus = true;
        if (statusFilter === "PENDENTE") {
            matchesStatus = t.situacao.includes("PENDENTE");
        } else if (statusFilter === "EM ANDAMENTO") {
            matchesStatus = t.situacao.includes("ANDAMENTO");
        } else if (statusFilter === "QRV") {
            matchesStatus = t.situacao.includes("QRV") || t.situacao.includes("FINALIZADO");
        }

        return matchesSearch && matchesMonth && matchesStatus;
    });

    updateTaskMetrics();

    if (filtered.length === 0) {
        elements.tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fa-solid fa-folder-open"></i>
                        <p>Nenhuma missão cadastrada.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    elements.tbody.innerHTML = filtered.map(t => {
        let dateDisplay = "N/A";
        if (t.data) {
            const parts = t.data.split('-');
            if (parts.length === 3) {
                dateDisplay = `${parts[2]}/${parts[1]}/${parts[0]}`;
            } else {
                dateDisplay = t.data;
            }
        }

        let badgeClass = "badge-neutral";
        if (t.situacao.includes("QRV") || t.situacao.includes("FINALIZADO")) {
            badgeClass = "badge-done";
        } else if (t.situacao.includes("ANDAMENTO")) {
            badgeClass = "badge-progress";
        } else if (t.situacao.includes("PENDENTE")) {
            badgeClass = "badge-pending";
        }

        const uniqueId = JSON.stringify({ sheet: t.sheet, row: t.row, localIndex: tasks.indexOf(t) });

        return `
            <tr>
                <td class="col-date">${dateDisplay}</td>
                <td class="col-qru">${t.qru}</td>
                <td class="col-notes">${replaceNewlines(t.anotacoes)}</td>
                <td class="col-actions">${replaceNewlines(t.providencias)}</td>
                <td class="col-status">
                    <span class="badge ${badgeClass}">${t.situacao}</span>
                </td>
                <td class="col-opts">
                    <div class="row-actions">
                        <button class="btn-icon edit" onclick='editTask(${uniqueId})' title="Editar">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="btn-icon delete" onclick='confirmTaskDelete(${uniqueId})' title="Excluir">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function replaceNewlines(text) {
    if (!text) return "";
    return text.replace(/\n/g, "<br>");
}

async function handleTaskFormSubmit(e) {
    e.preventDefault();

    const localIndex = elements.taskIndex.value;
    const origSheet = elements.taskSheet.value;
    
    const taskData = {
        data: elements.taskDate.value,
        qru: elements.taskQru.value.trim().toUpperCase(),
        anotacoes: elements.taskNotes.value.trim().toUpperCase(),
        providencias: elements.taskActions.value.trim().toUpperCase(),
        situacao: elements.taskStatus.value
    };

    if (GAS_API_URL) {
        setLoadingState(true);
        try {
            let payload = {};
            if (localIndex === "") {
                payload = { action: "create", ...taskData };
            } else {
                const origTask = tasks[parseInt(localIndex)];
                payload = { 
                    action: "update", 
                    sheet: origSheet || origTask.sheet,
                    row: origTask.row,
                    ...taskData 
                };
            }

            const response = await fetch(GAS_API_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (data.success) {
                showToast(data.message || "Salvo com sucesso!", "success");
                resetTaskForm();
                await fetchDataFromSheets();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error("Erro ao salvar missão:", error);
            showToast("Erro ao gravar dados no Sheets.", "error");
            setLoadingState(false);
        }
    } else {
        if (localIndex === "") {
            const dateObj = new Date(taskData.data + "T12:00:00");
            const monthNamesMapping = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "Junho", "julho", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
            const sheetName = monthNamesMapping[dateObj.getMonth()];

            tasks.push({
                sheet: sheetName,
                row: tasks.length + 1,
                ...taskData
            });
            showToast("Missão registrada localmente!", "success");
        } else {
            const idx = parseInt(localIndex);
            const dateObj = new Date(taskData.data + "T12:00:00");
            const monthNamesMapping = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "Junho", "julho", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
            const sheetName = monthNamesMapping[dateObj.getMonth()];

            tasks[idx] = {
                ...tasks[idx],
                ...taskData,
                sheet: sheetName
            };
            showToast("Missão editada localmente!", "success");
        }
        localStorage.setItem("cmm_tasks_local", JSON.stringify(tasks));
        resetTaskForm();
        renderTasks();
    }
}

window.editTask = function(target) {
    const t = tasks[target.localIndex];
    if (!t) return;

    elements.formTitle.innerHTML = `<i class="fa-solid fa-pencil"></i> Editar Missão`;
    elements.taskIndex.value = target.localIndex;
    elements.taskSheet.value = target.sheet || t.sheet;
    
    elements.taskDate.value = t.data;
    elements.taskQru.value = t.qru;
    elements.taskNotes.value = t.anotacoes;
    elements.taskActions.value = t.providencias;
    elements.taskStatus.value = t.situacao;

    elements.btnSubmit.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Atualizar`;
    elements.btnCancel.style.display = "block";
    
    elements.form.scrollIntoView({ behavior: 'smooth' });
};

function resetTaskForm() {
    elements.formTitle.innerHTML = `<i class="fa-solid fa-plus"></i> Nova Missão / Rotina`;
    elements.taskIndex.value = "";
    elements.taskSheet.value = "";
    elements.form.reset();
    
    const today = new Date().toISOString().split('T')[0];
    elements.taskDate.value = today;
    
    elements.btnSubmit.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salvar`;
    elements.btnCancel.style.display = "none";
}

window.confirmTaskDelete = function(target) {
    deleteTarget = target;
    elements.deleteModal.classList.add("active");
};

async function executeTaskDelete() {
    if (!deleteTarget) return;

    elements.deleteModal.classList.remove("active");

    if (GAS_API_URL) {
        setLoadingState(true);
        try {
            const response = await fetch(GAS_API_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "delete",
                    sheet: deleteTarget.sheet,
                    row: deleteTarget.row
                })
            });
            const data = await response.json();
            if (data.success) {
                showToast(data.message || "Missão excluída!", "success");
                await fetchDataFromSheets();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error("Erro ao excluir:", error);
            showToast("Falha ao excluir registro no Sheets.", "error");
            setLoadingState(false);
        }
    } else {
        tasks.splice(deleteTarget.localIndex, 1);
        tasks.forEach((t, i) => { t.row = i + 1; });
        localStorage.setItem("cmm_tasks_local", JSON.stringify(tasks));
        showToast("Missão removida localmente!", "success");
        renderTasks();
    }
    deleteTarget = null;
}
