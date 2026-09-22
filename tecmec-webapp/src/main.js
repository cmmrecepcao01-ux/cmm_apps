// Ponto de entrada da aplicação TECMEC (CMM PMESP).
// Importa todos os módulos e expõe no `window` as funções chamadas via onclick/onchange no HTML.
import "./style.css";

import { abrirPortalCapa, abrirAreaSolicitante, abrirPainelOperador, abrirModalAcessoSolicitante, fecharModalAcessoSolicitante, confirmarAcessoSolicitante, abrirModalLogin, fecharModalLogin, confirmarLoginOperador, abrirModalConsulta, fecharModalConsulta, executarBuscaModalConsulta } from "./navigation.js";
import { irParaEtapa, finalizarAgendamento, popularMeses, renderizarSemanasMes, selecionarSemanaCard, popularOpms, adicionarNovaPergunta, removerPergunta, atualizarTextoPergunta, toggleSecaoPerguntas, preencherObjetivoExemplo, atualizarStatusDoc, agendarSalvamentoRascunho } from "./wizard.js";
import { atualizarDataEntrada, atualizarTabelaGestaoOperador } from "./operador.js";
import { abrirFolhaPainel, fecharModalFolhaPainel, baixarPdfFolhaPainel } from "./folhaPainel.js";
import { abrirModalEmailNotificacao, fecharModalEmail, dispararEnvioEmailNotificacao } from "./email.js";
import { abrirParecerSubdashboard, voltarAoPainelGestorFromSubdashboard, processarBulkFotosSubdashboard, toggleFotoEtapaSubdashboard, adicionarNovaEtapaSubdashboard, removerEtapaSubdashboard, adicionarSubitemEtapa, removerSubitemEtapa, inserirFrasePreset, abrirEditorFotoBulk, salvarEEmitirParecerSubdashboard, salvarProgressoParecer, agendarSalvamentoProgressoLocal, atualizarTituloEtapaSubdashboard, atualizarTextoSubitemSubdashboard } from "./parecerSubdashboard.js";
import { baixarPdfPreviewParecer, finalizarEnviarEmailParecer, dispararEnvioEmailNotificacaoWrapper } from "./parecerPdf.js";
import { carregarStorage } from "./storage.js";

// Exposição global — necessária porque o HTML usa onclick="nomeDaFuncao()" (herdado do original).
window.abrirPortalCapa = abrirPortalCapa;
window.abrirAreaSolicitante = abrirAreaSolicitante;
window.abrirPainelOperador = abrirPainelOperador;
window.abrirModalAcessoSolicitante = abrirModalAcessoSolicitante;
window.fecharModalAcessoSolicitante = fecharModalAcessoSolicitante;
window.confirmarAcessoSolicitante = confirmarAcessoSolicitante;
window.abrirModalLogin = abrirModalLogin;
window.fecharModalLogin = fecharModalLogin;
window.confirmarLoginOperador = confirmarLoginOperador;
window.abrirModalConsulta = abrirModalConsulta;
window.fecharModalConsulta = fecharModalConsulta;
window.executarBuscaModalConsulta = executarBuscaModalConsulta;
window.irParaEtapa = irParaEtapa;
window.finalizarAgendamento = finalizarAgendamento;
window.popularMeses = popularMeses;
window.renderizarSemanasMes = renderizarSemanasMes;
window.selecionarSemanaCard = selecionarSemanaCard;
window.popularOpms = popularOpms;
window.adicionarNovaPergunta = adicionarNovaPergunta;
window.removerPergunta = removerPergunta;
window.atualizarTextoPergunta = atualizarTextoPergunta;
window.toggleSecaoPerguntas = toggleSecaoPerguntas;
window.preencherObjetivoExemplo = preencherObjetivoExemplo;
window.atualizarStatusDoc = atualizarStatusDoc;
window.atualizarDataEntrada = atualizarDataEntrada;
window.atualizarTabelaGestaoOperador = atualizarTabelaGestaoOperador;
window.abrirFolhaPainel = abrirFolhaPainel;
window.fecharModalFolhaPainel = fecharModalFolhaPainel;
window.baixarPdfFolhaPainel = baixarPdfFolhaPainel;
window.abrirModalEmailNotificacao = abrirModalEmailNotificacao;
window.fecharModalEmail = fecharModalEmail;
window.dispararEnvioEmailNotificacao = dispararEnvioEmailNotificacao;
window.abrirParecerSubdashboard = abrirParecerSubdashboard;
window.voltarAoPainelGestorFromSubdashboard = voltarAoPainelGestorFromSubdashboard;
window.processarBulkFotosSubdashboard = processarBulkFotosSubdashboard;
window.toggleFotoEtapaSubdashboard = toggleFotoEtapaSubdashboard;
window.adicionarNovaEtapaSubdashboard = adicionarNovaEtapaSubdashboard;
window.removerEtapaSubdashboard = removerEtapaSubdashboard;
window.adicionarSubitemEtapa = adicionarSubitemEtapa;
window.removerSubitemEtapa = removerSubitemEtapa;
window.abrirEditorFotoBulk = abrirEditorFotoBulk;
window.atualizarTituloEtapaSubdashboard = atualizarTituloEtapaSubdashboard;
window.atualizarTextoSubitemSubdashboard = atualizarTextoSubitemSubdashboard;
window.inserirFrasePreset = inserirFrasePreset;
window.salvarEEmitirParecerSubdashboard = salvarEEmitirParecerSubdashboard;
window.salvarProgressoParecer = salvarProgressoParecer;
window.baixarPdfPreviewParecer = baixarPdfPreviewParecer;
window.finalizarEnviarEmailParecer = finalizarEnviarEmailParecer;
window.dispararEnvioEmailNotificacaoWrapper = dispararEnvioEmailNotificacaoWrapper;
window.carregarStorage = carregarStorage;

document.addEventListener("DOMContentLoaded", () => {
    carregarStorage();
    popularOpms();
    popularMeses();

    // Rascunho automático: qualquer alteração nos campos da Etapa 1-4 do
    // solicitante é salva no Supabase (debounced) por placa da viatura.
    const areaSolicitante = document.getElementById("viewSolicitante");
    if (areaSolicitante) {
        areaSolicitante.addEventListener("input", agendarSalvamentoRascunho);
        areaSolicitante.addEventListener("change", agendarSalvamentoRascunho);
    }

    // Rascunho automático do parecer técnico (local, protege contra fechar a
    // aba sem querer). O "SALVAR PROGRESSO" no topo grava isso no Supabase.
    const areaParecer = document.getElementById("viewParecerSubdashboard");
    if (areaParecer) {
        areaParecer.addEventListener("input", agendarSalvamentoProgressoLocal);
        areaParecer.addEventListener("change", agendarSalvamentoProgressoLocal);
    }
});
