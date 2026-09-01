/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: RIV_ELETRONICO_BACKUP & SINCRONIZADOR LINHA MECÂNICA
 * =========================================================================
 * Planilha Host: RIV_ELETRONICO_BACKUP
 * Planilha Origem: CONTROLE LINHA 04 RODAS (ID: 1Ga5eQ_AhuOUkgTut2pfkzaZf_6cRcHHXg2ylLUvVQEs)
 *
 * Instruções:
 * 1. Abra a planilha RIV_ELETRONICO_BACKUP no Google Drive.
 * 2. Acesse 'Extensões' > 'Apps Script'.
 * 3. Substitua todo o código existente por este script.
 * 4. Clique em 'Implantar' > 'Gerenciar Implantações' > Ícone de Lápis (Editar) > Nova Versão > Implantar.
 * 5. Garanta que o acesso esteja definido como: "Qualquer pessoa" (Anyone).
 */

var ID_PLANILHA_ORIGEM = "1Ga5eQ_AhuOUkgTut2pfkzaZf_6cRcHHXg2ylLUvVQEs";

function doGet(e) {
  try {
    var action = e && e.parameter && e.parameter.action ? e.parameter.action : "GET_ALL";
    var records = getLinhaMecanicaRecords();

    return ContentService.createTextOutput(JSON.stringify({
      status: "SUCCESS",
      count: records.length,
      timestamp: new Date().toISOString(),
      data: records
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "ERROR",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = JSON.parse(e.postData.contents);
    var d = payload.data || payload;

    // AÇÃO 1: CONSULTA DE DADOS DA LINHA MECÂNICA
    if (d.action === "GET_LINHA_MECANICA") {
      var records = getLinhaMecanicaRecords();
      return ContentService.createTextOutput(JSON.stringify({
        status: "SUCCESS",
        count: records.length,
        data: records
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // AÇÃO 2: REGISTRO DE LOG DE AUDITORIA (EXCLUSÕES E ALTERAÇÕES)
    if (d.action === "RIV_AUDITORIA" || d.action === "RIV_EXCLUSAO") {
      var sheetAudit = ss.getSheetByName("LOG_AUDITORIA");
      if (!sheetAudit) {
        sheetAudit = ss.insertSheet("LOG_AUDITORIA");
        sheetAudit.appendRow([
          "TIMESTAMP", "AÇÃO", "AUDITOR", "JUSTIFICATIVA", "PLACA", 
          "PREFIXO", "DATA SERVIÇO", "KM", "SERVIÇOS", "VALOR TOTAL", "ID REGISTRO"
        ]);
      }
      sheetAudit.appendRow([
        new Date(),
        d.tipo_acao || 'EXCLUSÃO',
        d.auditor || '',
        d.justificativa || '',
        (d.placa || '').toUpperCase(),
        (d.prefixo || '').toUpperCase(),
        d.data_servico || '',
        d.km || '',
        d.servicos || '',
        d.valor_total || '',
        d.id_registro || ''
      ]);
      var lastAuditRow = sheetAudit.getLastRow();
      sheetAudit.getRange(lastAuditRow, 9).setWrap(true);

      // ENVIO AUTOMÁTICO DE E-MAIL DE ALERTA DE EXCLUSÃO
      if (d.action === "RIV_EXCLUSAO" || d.tipo_acao === "EXCLUSÃO") {
        try {
          var recipientEmail = "cmmmanutfrota@policiamilitar.sp.gov.br";
          var subject = "[ALERTA RIV PMESP] Exclusão de Registro - Vtr " + (d.placa || 'N/A') + " - " + (d.auditor || 'Auditor');
          var htmlBody = '<div style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px; color: #1e293b;">' +
            '<div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">' +
              '<div style="background-color: #b91c1c; color: #ffffff; padding: 16px 20px;">' +
                '<h2 style="margin: 0; font-size: 18px; text-transform: uppercase;">⚠️ ALERTA DE EXCLUSÃO DE REGISTRO - RIV ELETRÔNICO</h2>' +
                '<p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">CENTRO DE MOTOMECANIZAÇÃO - POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</p>' +
              '</div>' +
              '<div style="padding: 20px;">' +
                '<p style="font-size: 14px; margin-top: 0;">Foi confirmada uma <strong>exclusão de registro</strong> no RIV Eletrônico com os seguintes dados de auditoria:</p>' +
                '<table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 15px 0;">' +
                  '<tr style="background-color: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; width: 35%;">DATA / HORA:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">' + Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss") + '</td></tr>' +
                  '<tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">AUDITOR RESPONSÁVEL:</td><td style="padding: 8px; border: 1px solid #e2e8f0; color: #b91c1c; font-weight: bold;">' + (d.auditor || '-') + '</td></tr>' +
                  '<tr style="background-color: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">JUSTIFICATIVA:</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-style: italic;">' + (d.justificativa || '-') + '</td></tr>' +
                  '<tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">VIATURA (PLACA):</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">' + (d.placa || '-') + (d.prefixo ? ' (' + d.prefixo + ')' : '') + '</td></tr>' +
                  '<tr style="background-color: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">DATA DO SERVIÇO:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">' + (d.data_servico || '-') + '</td></tr>' +
                  '<tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">KM REGISTRADO:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">' + (d.km || '-') + ' KM</td></tr>' +
                  '<tr style="background-color: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">SERVIÇOS EXCLUÍDOS:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">' + (d.servicos || '-') + '</td></tr>' +
                  '<tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">VALOR TOTAL:</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">' + (d.valor_total || 'R$ 0,00') + '</td></tr>' +
                  '<tr style="background-color: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">ID DO REGISTRO:</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">' + (d.id_registro || '-') + '</td></tr>' +
                '</table>' +
                '<p style="font-size: 11px; color: #64748b; margin-bottom: 0;">Este é um e-mail automático gerado pelo Sistema RIV Eletrônico do CMM / PMESP para fins de controle e auditoria.</p>' +
              '</div>' +
            '</div>' +
          '</div>';

          MailApp.sendEmail({
            to: recipientEmail,
            subject: subject,
            htmlBody: htmlBody
          });
        } catch (mailErr) {
          Logger.log("Erro ao enviar e-mail de auditoria: " + mailErr.toString());
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "SUCCESS" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // AÇÃO 3: GRAVAR NOVO REGISTRO DO RIV (ABA 1)
    var sheet = ss.getSheetByName("RIV_LANCAMENTOS") || ss.getSheets()[0];
    
    // Se a aba estiver sem cabeçalho, cria
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ID", "DATA", "PLACA", "PREFIXO", "OPM", "KM", "TIPO", "LOCAL",
        "RESPONSÁVEL", "O.S.", "SERVIÇOS EXECUTADOS", "OBSERVAÇÕES", "TIMESTAMP", "CUSTO TOTAL"
      ]);
    }

    sheet.appendRow([
      Utilities.getUuid(),                 // A: ID
      d.data || '',                        // B: DATA (dd/mm/aaaa)
      (d.placa || '').toUpperCase(),       // C: PLACA
      (d.prefixo || '').toUpperCase(),     // D: PREFIXO
      (d.opm || '').toUpperCase(),         // E: OPM
      d.km || '',                          // F: KM
      (d.tipo || '').toUpperCase(),        // G: TIPO
      (d.local || '').toUpperCase(),       // H: LOCAL
      (d.responsavel || '').toUpperCase(), // I: RESPONSÁVEL
      (d.os || '').toUpperCase(),          // J: O.S.
      (d.servicos || '').toUpperCase(),    // K: SERVIÇOS EXECUTADOS
      (d.obs || '').toUpperCase(),         // L: OBSERVAÇÕES
      new Date(),                          // M: TIMESTAMP
      d.custo_total || ''                  // N: CUSTO TOTAL
    ]);

    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 11).setWrap(true);

    return ContentService.createTextOutput(JSON.stringify({ status: "SUCCESS" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "ERROR", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Lê a planilha CONTROLE LINHA 04 RODAS e sincroniza a Aba 2 (ESPELHO_LINHA_04_RODAS)
 */
function getLinhaMecanicaRecords() {
  var ssOrigem = SpreadsheetApp.openById(ID_PLANILHA_ORIGEM);
  var sheetOrigem = ssOrigem.getSheets()[0]; // primeira aba (onde estão os registros)
  var data = sheetOrigem.getDataRange().getValues();

  var records = [];
  
  // Linha 0 é o cabeçalho (OS, PLACA, ANO, MARCA/MODELO, UNIDADE, PREFIXO, DATA ENTRADA, TEMPO PARADA, PROBLEMA RELATADO, DATA SAIDA, DESTINO, KM)
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var os = row[0] ? String(row[0]).trim() : '';
    var placa = row[1] ? String(row[1]).trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    var ano = row[2] ? String(row[2]).trim() : '';
    var modelo = row[3] ? String(row[3]).trim().toUpperCase() : '';
    var unidade = row[4] ? String(row[4]).trim().toUpperCase() : '';
    var prefixo = row[5] ? String(row[5]).trim().toUpperCase() : '';
    var dataEntrada = row[6];
    var tempoParada = row[7] ? String(row[7]).trim() : '';
    var problemaRelatado = row[8] ? String(row[8]).trim() : '';
    var dataSaida = row[9];
    var destino = row[10] ? String(row[10]).trim().toUpperCase() : '';
    var km = row[11] ? String(row[11]).trim() : '';

    if (!placa && !os) continue;

    // Formata datas
    var dataStr = formatDataGoogle(dataSaida) || formatDataGoogle(dataEntrada) || '';

    // Separa as linhas do problema relatado / prontuário consolidado da coluna I
    var servicosArray = [];
    if (problemaRelatado) {
      var lines = String(problemaRelatado).split(/\r?\n/);
      for (var j = 0; j < lines.length; j++) {
        var cleanLine = lines[j].trim().replace(/^[\*\•\-\.]+\s*/, '').trim();
        if (cleanLine.length > 0) {
          servicosArray.push(cleanLine.toUpperCase());
        }
      }
    }

    if (servicosArray.length === 0) {
      servicosArray.push("ATENDIMENTO OFICINA CMM" + (destino ? " - " + destino : ""));
    }

    records.push({
      id: "CMM-OS-" + (os || (placa + "_" + i)),
      origem: "CMM_LINHA_MECANICA",
      plate: placa,
      prefix: prefixo,
      opm: unidade,
      model: modelo,
      year: ano,
      data: dataStr,
      km: km ? km.replace(/[^0-9]/g, '') : '',
      tipo: "OFICINA CMM" + (destino ? " (" + destino + ")" : ""),
      os: os,
      local: "CMM - LINHA MECÂNICA",
      responsavel: "MECÂNICA CMM",
      servicos: servicosArray,
      obs: (destino ? "DESTINO: " + destino : "") + (tempoParada ? " | PARADA: " + tempoParada + " DIAS" : ""),
      valor_pecas: 0,
      valor_mo: 0,
      valor_total: 0
    });
  }

  // Sincroniza em segundo plano para a Aba 2 da planilha RIV_ELETRONICO_BACKUP
  try {
    syncToAba2(records);
  } catch (e) {
    console.warn("Aba 2 sync notice:", e);
  }

  return records;
}

/**
 * Cria ou atualiza a Aba 2 (ESPELHO_LINHA_04_RODAS) na planilha RIV_ELETRONICO_BACKUP
 */
function syncToAba2(records) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba2 = ss.getSheetByName("ESPELHO_LINHA_04_RODAS");
  if (!aba2) {
    aba2 = ss.insertSheet("ESPELHO_LINHA_04_RODAS");
    aba2.appendRow(["OS", "PLACA", "PREFIXO", "OPM", "DATA", "KM", "DESTINO / OBS", "PRONTUÁRIO CONSOLIDADO (SERVIÇOS)", "STATUS"]);
  }

  if (records.length === 0) return;

  var rows = [];
  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    rows.push([
      r.os,
      r.plate,
      r.prefix,
      r.opm,
      r.data,
      r.km,
      r.obs,
      r.servicos.join("\n"),
      "SINCRONIZADO"
    ]);
  }

  // Limpa e atualiza dados
  var lastRow = aba2.getLastRow();
  if (lastRow > 1) {
    aba2.getRange(2, 1, lastRow - 1, 9).clearContent();
  }
  aba2.getRange(2, 1, rows.length, 9).setValues(rows);
  aba2.getRange(2, 8, rows.length, 1).setWrap(true);
}

function formatDataGoogle(d) {
  if (!d) return '';
  if (d instanceof Date) {
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }
  var str = String(d).trim();
  var p = str.split('/');
  if (p.length === 3) {
    var day = ('0' + p[0]).slice(-2);
    var m = ('0' + p[1]).slice(-2);
    var y = p[2].length === 2 ? '20' + p[2] : p[2];
    return y + '-' + m + '-' + day;
  }
  return str;
}
