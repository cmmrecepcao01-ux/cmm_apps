/**
 * Google Apps Script - Ponte de Integração para o Painel do Dispositivo Motorizado (9 de Julho)
 * 
 * Versão: 2.0 (Suporte para aba 'dashboard' e salvamento de tripulação manual)
 */

// Nome das abas da planilha
var SHEET_RESPONSES = "Respostas ao formulário 1";
var SHEET_LAYOUT = "dashboard";

// Cabeçalhos padrão para a aba de respostas
var HEADERS_RESPONSES = [
  "Carimbo de data/hora",
  "OPM (Batalhão / Unidade / Comando)",
  "VTR (Prefixo)",
  "Pintura, lataria (funilaria) em perfeito estado?",
  "Novo grafismo (gestão de governo atual)?",
  "Grafismo (geral) em perfeito estado?",
  "Sinais sonoros e luminosos em perfeito funcionamento?",
  "Calota padrão (padrão de fábrica obrigatório)?",
  "Luzes/lanternas/faróis/freios em perfeito funcionamento?",
  "Mecânica geral em perfeito funcionamento?"
];

// Configuração de CORS para retorno de JSON
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Método GET: Chamado para carregar dados da planilha
 */
function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === "get_data") {
    // 1. Carrega dados de checklist da aba de respostas
    var sheet = ss.getSheetByName(SHEET_RESPONSES);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_RESPONSES);
      sheet.appendRow(HEADERS_RESPONSES);
    }
    
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    var headers = values[0];
    
    var checklistData = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var item = {};
      for (var j = 0; j < headers.length; j++) {
        item[headers[j]] = row[j];
      }
      checklistData.push(item);
    }
    
    // 2. Carrega dados do layout e tripulação manual da aba 'dashboard'
    var layoutSheet = ss.getSheetByName(SHEET_LAYOUT);
    var layoutData = {};
    if (layoutSheet) {
      var lValues = layoutSheet.getDataRange().getValues();
      for (var k = 1; k < lValues.length; k++) {
        var lRow = lValues[k];
        var opm = lRow[0];
        var vtr = lRow[1];
        var key = String(opm || "").trim() + "_" + String(vtr || "").trim();
        layoutData[key] = {
          opm: String(opm || "").trim(),
          vtr: String(vtr || "").trim(),
          x: lRow[2],
          y: lRow[3],
          rotation: lRow[4] || 0,
          motorista: lRow[5] || "",
          encarregado: lRow[6] || "",
          tipo: lRow[7] || "carro"
        };
      }
    }
    
    return jsonResponse({
      status: "success",
      checklist: checklistData,
      layout: layoutData,
      spreadsheetUrl: ss.getUrl()
    });
  }
  
  return jsonResponse({ status: "error", message: "Ação inválida." });
}

/**
 * Método POST: Chamado para atualizar checklist ou salvar layout/equipe
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Aguarda até 30 segundos para liberar concorrência
    lock.waitLock(30000);
  } catch (err) {
    return jsonResponse({ status: "error", message: "Erro de concorrência (Lock Timeout): " + err.toString() });
  }

  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "save_layout") {
      var layoutSheet = ss.getSheetByName(SHEET_LAYOUT);
      if (!layoutSheet) {
        layoutSheet = ss.insertSheet(SHEET_LAYOUT);
      } else {
        layoutSheet.clear();
      }
      
      // Escreve cabeçalhos do layout (Inclui tripulação e tipo)
      layoutSheet.appendRow(["OPM", "VTR", "X", "Y", "Rotation", "Motorista", "Encarregado", "Tipo"]);
      
      var positions = payload.positions || [];
      for (var i = 0; i < positions.length; i++) {
        var p = positions[i];
        layoutSheet.appendRow([
          p.opm, 
          p.vtr, 
          p.x, 
          p.y, 
          p.rotation, 
          p.motorista || "", 
          p.encarregado || "",
          p.tipo || "carro"
        ]);
      }
      
      SpreadsheetApp.flush();
      return jsonResponse({ status: "success", message: "Layout e tripulantes salvos na aba dashboard." });
    }
    
    if (action === "update_checklist") {
      var sheet = ss.getSheetByName(SHEET_RESPONSES);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_RESPONSES);
        sheet.appendRow(HEADERS_RESPONSES);
      }
      
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      var headers = values[0];
      
      var opm = payload.opm;
      var vtr = payload.vtr;
      
      var opmColIdx = headers.indexOf(HEADERS_RESPONSES[1]);
      var vtrColIdx = headers.indexOf(HEADERS_RESPONSES[2]);
      
      var foundRowIdx = -1;
      // Procura de trás para frente para atualizar sempre o registro mais recente em caso de duplicatas
      for (var r = values.length - 1; r >= 1; r--) {
        var sheetOpm = String(values[r][opmColIdx] || "").trim();
        var sheetVtr = String(values[r][vtrColIdx] || "").trim();
        var targetOpm = String(opm || "").trim();
        var targetVtr = String(vtr || "").trim();
        
        if (sheetOpm === targetOpm && sheetVtr === targetVtr) {
          foundRowIdx = r + 1;
          break;
        }
      }
      
      var rowData = [];
      rowData[0] = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
      rowData[1] = opm;
      rowData[2] = vtr;
      rowData[3] = payload.pintura || "Sim";
      rowData[4] = payload.novo_grafismo || "Sim";
      rowData[5] = payload.grafismo_geral || "Sim";
      rowData[6] = payload.sinais_sonoros || "Sim";
      rowData[7] = payload.calota_padrao || "Sim";
      rowData[8] = payload.luzes_farois || "Sim";
      rowData[9] = payload.mecanica_geral || "Sim";
      
      if (foundRowIdx !== -1) {
        sheet.getRange(foundRowIdx, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      
      SpreadsheetApp.flush();
      return jsonResponse({ status: "success", message: "VTR atualizada com sucesso." });
    }
    
    return jsonResponse({ status: "error", message: "Ação POST inválida." });
    
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock(); // Garante a liberação do lock em qualquer cenário
  }
}
