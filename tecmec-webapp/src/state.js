// Estado global compartilhado da aplicação (equivalente ao CONFIG/state do index.html original).
// ATENÇÃO: troque API_URL sempre que reimplantar o Google Apps Script (Implantar > Nova implantação).
export const CONFIG = {
    // E-mail (notificação e parecer) continua saindo pelo Google Apps Script/Gmail.
    // Reimplante o Apps Script sempre que o .gs mudar (Implantar > Nova implantação).
    API_URL: "https://script.google.com/macros/s/AKfycbxJkvysgq9goFkk6QBpQKmLbwQGjZyc9ONUtF0eM0obD5JuLj2D8NnZ7ukvxaKGlIVR/exec",
    // Armazenamento (solicitações, documentos, parecer) fica no Supabase.
    SUPABASE_URL: "https://ibcreccbtvpuarkzdddr.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY3JlY2NidHZwdWFya3pkZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMDY0MTksImV4cCI6MjEwNTU4MjQxOX0.zNjMtxiKWnTYFuAELmxM5-DGGgjBCFKLKreqgnTxrcs",
    STORAGE_KEY: "CMM_AGENDAMENTOS_TECMEC_DB",
    OPERATOR_KEY: "CMM_OPERADOR_LOGADO",
    CAPACIDADE_MAXIMA_PATIO: 8
};

export let state = {
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
    agendamentos: [],
    // Sub-dashboard do Parecer Técnico
    subdashFotosBulk: [],
    subdashEtapas: [],
    subdashProtocolo: null,
    activeTextareaId: null
};
