/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: SISTEMA DE AGENDAMENTO DE ANÁLISE TÉCNICA - CMM PMESP
 * =========================================================================
 * Centro de Motomecanização - Seção de Manutenção de Frota
 * 
 * Pasta de destino dos PDFs no Google Drive:
 * https://drive.google.com/drive/u/4/folders/1YOR-IJ0Vo4cdKWqa-oo9cO6642N0r3Nu
 * ID da Pasta: 1YOR-IJ0Vo4cdKWqa-oo9cO6642N0r3Nu
 */

var ID_PASTA_DRIVE_DOCUMENTOS = "1YOR-IJ0Vo4cdKWqa-oo9cO6642N0r3Nu";
var EMAIL_NOTIFICACAO_CMM = "cmmmanutfrota@policiamilitar.sp.gov.br";
var CAPACIDADE_MAXIMA_PATIO = 8;

function doGet(e) {
  try {
    var p = e.parameter || {};
    var action = (p.action || "GET_STATUS").toUpperCase();

    if (action === "VERIFICAR_OPM") {
      var opm = (p.opm || "").toUpperCase().trim();
      var bloqueada = verificarOpmBloqueada(opm);
      return jsonResponse({ status: "SUCCESS", opm: opm, bloqueada: bloqueada });
    }

    if (action === "CONSULTA") {
      var query = (p.query || "").toUpperCase().trim();
      var result = searchAgendamento(query);
      return jsonResponse({ status: "SUCCESS", found: !!result, data: result });
    }

    return jsonResponse({ status: "ONLINE", app: "CMM_ANALISE_TECNICA", timestamp: new Date().toISOString() });
  } catch (err) {
    return jsonResponse({ status: "ERROR", message: err.toString() });
  }
}

function doPost(e) {
  try {
    var rawData = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = (rawData.action || "NOVO_AGENDAMENTO").toUpperCase();
    var d = rawData.data || rawData;
    var docsBase64 = rawData.docsBase64 || {};

    // Normalização estrita para MAIÚSCULO no backend
    d = sanitizeUpper(d);

    if (action === "NOVO_AGENDAMENTO" || action === "CRIAR") {
      // 1. VALIDAÇÃO DE SINDICÂNCIA OU IPM (REGRA MANDATÓRIA)
      var sindicancia = (d.sindicancia_ipm || "").trim();
      if (!sindicancia || sindicancia.length < 3) {
        return jsonResponse({
          status: "REJECTED",
          message: "REGISTRO BLOQUEADO: É obrigatório possuir e informar o número oficial de Sindicância ou IPM."
        });
      }

      // 2. TRAVA DE E-MAIL INSTITUCIONAL
      var emailMilitar = (d.email || "").toLowerCase().trim();
      if (!emailMilitar || !emailMilitar.endsWith("@policiamilitar.sp.gov.br")) {
        return jsonResponse({
          status: "REJECTED",
          message: "REGISTRO BLOQUEADO: Apenas e-mails institucionais @policiamilitar.sp.gov.br são aceitos."
        });
      }

      // 3. TRAVA DE OPM: MESMA OPM NÃO PODE AGENDAR SEM DATA DO PARECER ANTERIOR
      var opm = (d.opm || "").toUpperCase().trim();
      if (verificarOpmBloqueada(opm)) {
        return jsonResponse({
          status: "OPM_BLOCKED",
          message: "REGISTRO BLOQUEADO: A OPM " + opm + " já possui viatura aguardando emissão da Data do Parecer Técnico no CMM."
        });
      }

      // 4. TRAVA DE SEMANA: MESMA OPM NÃO PODE ESCOLHER MAIS DE 1 CARRO NA MESMA SEMANA
      if (verificarOpmSemana(opm, d.semanaKey)) {
        return jsonResponse({
          status: "OPM_SEMANA_BLOCKED",
          message: "REGISTRO BLOQUEADO: A OPM " + opm + " já possui viatura agendada para a mesma semana selecionada."
        });
      }

      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = getOrCreateSheet(ss, "AGENDAMENTOS_ANALISE_TECNICA", [
        "DATA_REGISTRO", "PROTOCOLO", "STATUS", "DATA_PARECER", "SINDICANCIA_IPM", "TIPO_PROCEDIMENTO",
        "OPM_SOLICITANTE", "POSTO_GRAD", "RE", "NOME_MILITAR", "TELEFONE", "EMAIL",
        "PLACA", "PREFIXO", "MODELO", "ANO", "COR", "CHASSI", "MOTOR", "PATRIMONIO",
        "CONDICAO_VEICULO", "KM_ATUAL", "SEMANA_AGENDADA", "DATA_PREVISTA", "MOTIVO_AVARIA",
        "OBJETIVO_ANALISE", "PERGUNTAS_PRESIDENTE", "LINKS_DRIVE_PDFS", "OBSERVACOES_PARECER"
      ]);

      var protocolo = d.protocolo || gerarProtocolo();
      var now = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");

      // 5. UPLOAD DE DOCUMENTOS (.PDF) PARA A PASTA DO GOOGLE DRIVE
      var linksDrive = salvarPdfsNoDrive(protocolo, docsBase64);

      var perguntasStr = Array.isArray(d.perguntas) ? d.perguntas.join(" | ") : (d.perguntas || "");

      sheet.appendRow([
        now,
        protocolo,
        "AGENDADO / NO PÁTIO",
        "", // Data do Parecer (vazio até o operador emitir)
        d.sindicancia_ipm,
        d.tipo_procedimento || "SINDICÂNCIA",
        opm,
        d.posto_grad || "",
        d.re || "",
        d.nome || "",
        d.telefone || "",
        emailMilitar,
        d.placa,
        d.prefixo || "",
        d.modelo || "",
        d.ano || "",
        d.cor || "",
        d.chassi || "",
        d.motor || "",
        d.patrimonio || "",
        d.condicao || "RODANDO POR MEIOS PRÓPRIOS",
        d.km || "",
        d.semanaLabel || d.semanaKey || "",
        d.dataCalculada || "",
        d.motivo || "",
        d.objetivo || "",
        perguntasStr,
        linksDrive,
        ""
      ]);

      return jsonResponse({
        status: "SUCCESS",
        protocolo: protocolo,
        message: "Agendamento de análise técnica realizado com sucesso.",
        links_drive: linksDrive
      });
    }

    // AÇÃO 2: REGISTRAR DATA DO PARECER (LIBERA A OPM)
    if (action === "REGISTRAR_PARECER") {
      var proto = (d.protocolo || "").toUpperCase().trim();
      var dataParecer = d.data_parecer || Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd");
      var obs = d.observacoes_parecer || "";

      var updated = registrarParecerTecnico(proto, dataParecer, obs);
      return jsonResponse({ status: updated ? "SUCCESS" : "NOT_FOUND", protocolo: proto, data_parecer: dataParecer });
    }

    // AÇÃO 3: SALVAMENTO DO PARECER TÉCNICO COMPLETO
    if (action === "SALVAR_PARECER_TECNICO") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheetPt = getOrCreateSheet(ss, "PARECERES_TECNICOS_EMITIDOS", [
        "DATA_REGISTRO", "PROTOCOLO", "PLACA", "OPM", "NUM_PARECER", "BOLETIM_INTERNO",
        "RELATOR", "PRESIDENTE", "DATA_PARECER", "CONTEUDO_JSON"
      ]);

      var proto = (d.protocolo || "").toUpperCase().trim();
      var now = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");

      sheetPt.appendRow([
        now,
        proto,
        d.placa || "",
        d.opm || "",
        d.numParecer || "",
        d.boletimInterno || "",
        d.relator || "",
        d.presidente || "",
        d.dataParecer || Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd"),
        JSON.stringify(d)
      ]);

      return jsonResponse({ status: "SUCCESS", protocolo: proto, message: "Parecer técnico gravado com sucesso." });
    }

    return jsonResponse({ status: "INVALID_ACTION" });
  } catch (err) {
    return jsonResponse({ status: "ERROR", message: err.toString() });
  }
}

function sanitizeUpper(obj) {
  if (!obj || typeof obj !== "object") return obj;
  var clean = {};
  for (var key in obj) {
    if (typeof obj[key] === "string") {
      if (key.toLowerCase().includes("email")) {
        clean[key] = obj[key].trim().toLowerCase();
      } else {
        clean[key] = obj[key].trim().toUpperCase();
      }
    } else if (Array.isArray(obj[key])) {
      clean[key] = obj[key].map(function(item) {
        return typeof item === "string" ? item.trim().toUpperCase() : item;
      });
    } else {
      clean[key] = obj[key];
    }
  }
  return clean;
}

function salvarPdfsNoDrive(protocolo, docsBase64) {
  var links = [];
  try {
    var folder = DriveApp.getFolderById(ID_PASTA_DRIVE_DOCUMENTOS);
    var labels = {
      1: "OFICIO_APRESENTACAO",
      2: "PORTARIA_SINDICANCIA_IPM",
      3: "OITIVA_CONDUTOR",
      4: "TRANSCRICAO_COP",
      5: "DEMAIS_COMPROVANTES"
    };

    for (var key in docsBase64) {
      var doc = docsBase64[key];
      if (doc && doc.base64) {
        var base64Data = doc.base64.split(",")[1] || doc.base64;
        var decoded = Utilities.base64Decode(base64Data);
        var blob = Utilities.newBlob(decoded, "application/pdf", protocolo + "_" + (labels[key] || "DOC") + ".pdf");
        var file = folder.createFile(blob);
        links.push(labels[key] + ": " + file.getUrl());
      }
    }
  } catch (e) {
    Logger.log("Erro upload drive: " + e.toString());
  }
  return links.join("\n");
}

function verificarOpmBloqueada(opm) {
  if (!opm) return false;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("AGENDAMENTOS_ANALISE_TECNICA");
  if (!sheet) return false;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var rowStatus = String(data[i][2]).toUpperCase();
    var rowDataParecer = String(data[i][3]).trim();
    var rowOpm = String(data[i][6]).toUpperCase().trim();

    // Se OPM bate e não possui data de parecer e não foi cancelado, bloqueia
    if (rowOpm === opm && rowStatus !== "CANCELADO" && !rowDataParecer) {
      return true;
    }
  }
  return false;
}

function verificarOpmSemana(opm, semanaKey) {
  if (!opm || !semanaKey) return false;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("AGENDAMENTOS_ANALISE_TECNICA");
  if (!sheet) return false;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var rowStatus = String(data[i][2]).toUpperCase();
    var rowOpm = String(data[i][6]).toUpperCase().trim();
    var rowSemana = String(data[i][22]).toUpperCase().trim();

    if (rowOpm === opm && rowSemana.indexOf(semanaKey) >= 0 && rowStatus !== "CANCELADO") {
      return true;
    }
  }
  return false;
}

function registrarParecerTecnico(protocolo, dataParecer, obs) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("AGENDAMENTOS_ANALISE_TECNICA");
  if (!sheet) return false;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).toUpperCase() === protocolo) {
      sheet.getRange(i + 1, 3).setValue("CONCLUÍDO (PARECER EMITIDO)");
      sheet.getRange(i + 1, 4).setValue(dataParecer);
      if (obs) {
        sheet.getRange(i + 1, 29).setValue(obs);
      }
      return true;
    }
  }
  return false;
}

function gerarProtocolo() {
  var d = new Date();
  var ano = Utilities.formatDate(d, "America/Sao_Paulo", "yyyy");
  var rand = Math.floor(100000 + Math.random() * 900000);
  return "CMM-AT-" + ano + "-" + rand;
}

function getOrCreateSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#f8fafc");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
