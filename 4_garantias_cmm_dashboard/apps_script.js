/**
 * Google Apps Script - SISTEMA INTEGRADO CMM FROTA (GESTÃO E PORTAL DO USUÁRIO)
 *
 * Este arquivo unifica o backend da API do Portal de Garantias com todas as regras
 * de padronização, envio de e-mails, processamento em massa e gatilhos existentes.
 */

// ================================================================
// CONFIGURAÇÕES GERAIS E IDENTIDADE CMM
// ================================================================
const CFG_GARANTIA = {
  SIGNATURE_FILE_ID: "1poglrC062TfgsOtGzPIdTzehB5keotwx",
  DRIVE_FOLDER_ID: "1cJwZkJgYGEhf5Ri7ACOHrWB37ZN_s2Hf"
};

// ================================================================
// GATILHOS EXECUTADOS AUTOMATICAMENTE (TRIGGERS)
// ================================================================

/**
 * Executa automaticamente ao abrir a planilha online.
 * Cria o Menu "📌 CMM Frota" no topo da planilha e verifica veículos pendentes.
 */
function onOpen(e) {
  verificarVeiculosSemBaixa();

  // Criar menu personalizado direto na interface do Google Sheets
  SpreadsheetApp.getUi()
    .createMenu("📌 CMM Frota")
    .addItem("🔄 Sincronizar Documentos do Google Drive", "executarSincronizacaoManualDrive")
    .addSeparator()
    .addItem("🧹 Padronizar Toda a Planilha (Marcas/Modelos/KM)", "padronizarTodaAPlanilha")
    .addItem("✉️ Processar Envio de E-mails", "processarEnviosGarantia")
    .addItem("📲 Baixa em Massa (WhatsApp)", "abrirCaixaBaixaMassa")
    .addToUi();
}

// Executa a sincronização do Drive via menu da planilha exibindo caixas de alertas
function executarSincronizacaoManualDrive() {
  const ui = SpreadsheetApp.getUi();
  try {
    const novos = monitorarPastaDriveEPreencherPlanilha();
    ui.alert("🔄 Sincronização Concluída", "A pasta do Google Drive foi varrida com sucesso.\n\nNovos arquivos importados para a planilha: " + novos, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert("⚠️ Erro na Sincronização", "Ocorreu um erro ao atualizar os arquivos: " + e.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Monitora Coluna R (Checkbox Resolvido) e Coluna S (Data Resolução)
 */
function onEdit(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== "dados_garantia") return;
  const range = e.range;
  const startRow = range.getRow();
  const numRows = range.getNumRows();
  const startCol = range.getColumn();
  const numCols = range.getNumCols();

  if (startRow + numRows - 1 <= 1) return;
  // Processa cada linha alterada na colagem/edição
  for (let r = 0; r < numRows; r++) {
    const row = startRow + r;
    if (row <= 1) continue;
    const cellL = sh.getRange(row, 12);
    const cellM = sh.getRange(row, 13);
    const cellR = sh.getRange(row, 18);
    const cellS = sh.getRange(row, 19);
    // Se a coluna R (Resolvido) foi editada/colada
    if (startCol <= 18 && startCol + numCols - 1 >= 18) {
      const marcado = cellR.getValue();
      if (marcado === true) {
        let dataS = cellS.getValue();
        // SÓ preenche hoje se a data de resolução estiver vazia
        if (!dataS) {
          dataS = new Date();
          dataS.setHours(0,0,0,0);
          cellS.setValue(dataS);
        }
        congelarDias(cellL, cellM, dataS);
      } else if (marcado === false || marcado === "") {
        cellS.clearContent();
        cellM.setFormula('=SE(L' + row + '=""; ""; SEERRO(INT(HOJE()) - INT(L' + row + '); ""))');
      }
    }
    // Se a coluna S (Data Resolução) foi editada/colada
    if (startCol <= 19 && startCol + numCols - 1 >= 19) {
      const dataManual = cellS.getValue();
      if (dataManual instanceof Date) {
        cellR.setValue(true);
        congelarDias(cellL, cellM, dataManual);
      }
    }
  }
}

/**
 * Script Principal para o CMM ALMOX
 * Executa automaticamente a cada novo envio de formulário na Guia 1.
 */
function aoEnviarFormulario(e) {
  var sheet = e.range.getSheet();
  var row = e.range.getRow();
  var values = e.range.getValues()[0];

  var dadosLimpos = limparDados(values);
  sheet.getRange(row, 1, 1, dadosLimpos.length).setValues([dadosLimpos]);

  if (sheet.getName() === "dados_preenchimento") {
    var valorN = "";
    if (values && values.length >= 14) {
      valorN = values[13];
    } else {
      valorN = sheet.getRange(row, 14).getValue();
    }

    if (valorN && valorN.toString().toUpperCase().trim() === "SIM") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var shGarantia = ss.getSheetByName("dados_garantia");
      if (shGarantia) {
        var cellL = shGarantia.getRange(row, 12);
        var cellM = shGarantia.getRange(row, 13);
        var cellR = shGarantia.getRange(row, 18);
        var cellS = shGarantia.getRange(row, 19);

        var hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        cellR.setValue(true);
        cellS.setValue(hoje);

        var dataBaixaVal = cellL.getValue();
        if (dataBaixaVal) {
          congelarDias(cellL, cellM, hoje);
        } else {
          var valA = sheet.getRange(row, 1).getValue();
          if (valA) {
            let dA = null;
            if (valA instanceof Date) {
              dA = new Date(valA.getTime());
            } else {
              dA = new Date(valA);
              if (isNaN(dA.getTime())) {
                let partes = valA.toString().split(" ")[0].split("/");
                if (partes.length === 3) {
                  dA = new Date(partes[2], partes[1] - 1, partes[0]);
                }
              }
            }
            if (dA && !isNaN(dA.getTime())) {
              dA.setHours(0, 0, 0, 0);
              let diff = Math.floor((hoje - dA) / (1000 * 60 * 60 * 24));
              cellM.setValue(diff >= 0 ? diff : 0);
            }
          }
        }
      }
    }
  }
}

// ================================================================
// MÓDULO BACKEND API: PORTAL DO USUÁRIO (WEB APP)
// ================================================================

/**
 * Trata requisições HTTP GET do Dashboard.
 */
function doGet(e) {
  const action = e.parameter.action;

  if (action === "getPlacas") {
    return handleGetPlacas();
  }

  if (action === "getTicketsAtivos") {
    return handleGetTicketsAtivos(e.parameter.opm, e.parameter.placa);
  }

  if (action === "getProvidencias") {
    return handleGetProvidencias();
  }

  if (action === "sincronizarDrive") {
    try {
      const novos = monitorarPastaDriveEPreencherPlanilha();
      return jsonResponse({ success: true, novos: novos });
    } catch (err) {
      return jsonResponse({ error: err.toString() });
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ error: "Ação inválida ou não especificada." }))
                       .setMimeType(ContentService.MimeType.JSON);
}

// Retorna todas as providências administrativas da aba "providencias_adm"
function handleGetProvidencias() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("providencias_adm");
  if (!sheet) {
    return jsonResponse({ error: "Aba 'providencias_adm' não encontrada." });
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse([]);
  }

  function normalizeHeader(str) {
    if (!str) return "";
    return str.toString()
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // remove acentos
              .trim();
  }

  const headers = data[0].map(normalizeHeader);

  const dataIdx = headers.indexOf("data");
  const contratadaIdx = headers.indexOf("contratada");

  // Localizacao flexivel para providencia
  let providenciaIdx = headers.indexOf("providencia (nº documento)");
  if (providenciaIdx === -1) providenciaIdx = headers.indexOf("providencia");
  if (providenciaIdx === -1) {
    providenciaIdx = headers.findIndex(h => h.indexOf("providencia") !== -1 || h.indexOf("documento") !== -1);
  }

  const assuntoIdx = headers.indexOf("assunto");
  const respondidoIdx = headers.findIndex(h => h.indexOf("respondido") !== -1);
  const observacoesIdx = headers.findIndex(h => h.indexOf("observaco") !== -1);

  const providencias = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const contratadaVal = contratadaIdx !== -1 ? row[contratadaIdx] : "";
    const providenciaVal = providenciaIdx !== -1 ? row[providenciaIdx] : "";

    if (!contratadaVal && !providenciaVal) continue;

    let dataFormatada = "";
    if (dataIdx !== -1 && row[dataIdx]) {
      if (row[dataIdx] instanceof Date) {
        dataFormatada = Utilities.formatDate(row[dataIdx], Session.getScriptTimeZone(), "dd/MM/yyyy");
      } else {
        dataFormatada = row[dataIdx].toString().trim();
      }
    }

    providencias.push({
      data: dataFormatada,
      contratada: contratadaVal.toString().trim(),
      providencia: providenciaVal.toString().trim(),
      assunto: assuntoIdx !== -1 ? row[assuntoIdx].toString().trim() : "",
      respondido: respondidoIdx !== -1 ? row[respondidoIdx].toString().trim() : "",
      observacoes: observacoesIdx !== -1 ? row[observacoesIdx].toString().trim() : ""
    });
  }

  return jsonResponse(providencias);
}

/**
 * Trata requisições HTTP POST do Dashboard.
 */
function doPost(e) {
  try {
    let postData;
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        postData = e.parameter;
      }
    } else {
      postData = e.parameter;
    }

    const action = postData ? postData.action : null;

    if (action === "criarAcionamento") {
      return handleCriarAcionamento(postData);
    }

    if (action === "atualizarStatus") {
      return handleAtualizarStatus(postData);
    }

    return jsonResponse({ success: false, error: "Ação POST inválida." });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// Retorna todas as placas e metadados de veículos da aba "banco_dados"
function handleGetPlacas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("banco_dados");
  if (!sheet) {
    return jsonResponse({ error: "Aba 'banco_dados' não encontrada." });
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse([]);
  }

  const headers = data[0].map(h => h.toString().toLowerCase().trim());
  const placaIdx = headers.indexOf("placa");
  const btlIdx = headers.indexOf("btl");
  const marcaModIdx = headers.indexOf("marca/modelo");
  const anoIdx = headers.indexOf("ano");

  if (placaIdx === -1) {
    return jsonResponse({ error: "Coluna 'PLACA' não encontrada na aba banco_dados." });
  }

  const placasObj = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const val = row[placaIdx];
    if (val) {
      const brandModelRaw = marcaModIdx !== -1 ? row[marcaModIdx].toString().trim() : "";
      let brand = "";
      let model = "";
      if (brandModelRaw.includes("/")) {
        const parts = brandModelRaw.split("/");
        brand = parts[0].trim();
        model = parts[1].trim();
      } else {
        brand = brandModelRaw;
      }

      // Normalização de marcas para corresponder aos selects do HTML
      const uBrand = brand.toUpperCase();
      if (uBrand === "GM" || uBrand === "CHEVROLET") {
        brand = "Chevrolet";
      } else if (uBrand === "TOYOTA") {
        brand = "Toyota";
      } else if (uBrand === "RENAULT") {
        brand = "Renault";
      } else if (uBrand === "FORD") {
        brand = "Ford";
      } else if (uBrand === "MITSUBISHI") {
        brand = "Mitsubishi";
      } else if (uBrand === "VOLKSWAGEN" || uBrand === "VW") {
        brand = "Volkswagen";
      } else if (uBrand === "FIAT") {
        brand = "Fiat";
      } else if (uBrand === "HYUNDAI") {
        brand = "Hyundai";
      } else if (uBrand === "IVECO") {
        brand = "Iveco";
      }

      placasObj.push({
        placa: val.toString().toUpperCase().trim(),
        opm: btlIdx !== -1 ? row[btlIdx].toString().trim() : "",
        marca: brand,
        modelo: model,
        ano: anoIdx !== -1 ? row[anoIdx].toString().trim() : ""
      });
    }
  }

  // Ordena por placa
  placasObj.sort((a, b) => a.placa.localeCompare(b.placa));
  return jsonResponse(placasObj);
}

// Retorna os acionamentos pendentes de resolução (aba dados_garantia)
function handleGetTicketsAtivos(opm, placa) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("dados_garantia");
  if (!sheet) {
    return jsonResponse({ error: "Aba 'dados_garantia' não encontrada." });
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse([]);
  }

  const headers = data[0].map(h => h.toString().toLowerCase().trim());

  // Índices importantes
  const placaIdx = headers.findIndex(h => h.includes("placa"));
  const unidadeIdx = headers.findIndex(h => h.includes("unidade") || h.includes("opm"));
  const situacaoIdx = 17; // Coluna R (index 17 em 0-based) como padrão para "Foi resolvido?"

  const tickets = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const ticketPlaca = placaIdx !== -1 ? row[placaIdx].toString().toUpperCase().trim() : "";
    const ticketOpm = unidadeIdx !== -1 ? row[unidadeIdx].toString().trim() : "";

    // Coluna R (resolvido): Se for checkbox, o Sheets lê como true/false
    const resolvido = row[situacaoIdx] === true || String(row[situacaoIdx]).toUpperCase() === "SIM" || String(row[situacaoIdx]).toUpperCase() === "TRUE";

    if (!resolvido && ticketPlaca) {
      // Filtragem opcional no servidor para economizar banda
      if (placa && ticketPlaca !== placa.toUpperCase().trim()) continue;
      if (opm) {
        const normQuery = opm.toUpperCase().replace(/[º°ª]/g, ".").replace(/\s+/g, "").trim();
        const normTicket = ticketOpm.toUpperCase().replace(/[º°ª]/g, ".").replace(/\s+/g, "").trim();
        if (normQuery !== normTicket) continue;
      }

      const ticket = {
        rowNum: i + 1, // Guarda o número físico da linha (1-based)
        data: row[0] ? Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm") : "",
        opm: ticketOpm,
        placa: ticketPlaca,
        marca: headers.findIndex(h => h.includes("marca")) !== -1 ? row[headers.findIndex(h => h.includes("marca"))] : "",
        modelo: headers.findIndex(h => h.includes("modelo")) !== -1 ? row[headers.findIndex(h => h.includes("modelo"))] : "",
        descricao: headers.findIndex(h => h.includes("descri")) !== -1 ? row[headers.findIndex(h => h.includes("descri"))] : ""
      };
      tickets.push(ticket);
    }
  }

  return jsonResponse(tickets);
}

// Encontra a primeira linha física vazia (coluna A vazia) para evitar pular linhas por formatações fantasmas
function getFirstEmptyRow(sheet) {
  const values = sheet.getRange("A:A").getValues();
  for (let i = 0; i < values.length; i++) {
    if (!values[i][0]) {
      return i + 1; // Retorna a linha física (1-based)
    }
  }
  return values.length + 1;
}

// Cria uma nova linha na aba "dados_preenchimento"
function handleCriarAcionamento(postData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("dados_preenchimento");
  if (!sheet) {
    return jsonResponse({ success: false, error: "Aba 'dados_preenchimento' não encontrada." });
  }

  const timestamp = new Date();

  // Monta a linha com os dados básicos e os dados do preenchedor (Colunas P, Q, R)
  const newRow = [
    timestamp,                                   // Col A: Carimbo de data/hora
    postData.opm || "",                          // Col B: Unidade (OPM)
    (postData.placa || "").toUpperCase().trim(), // Col C: Placa do Veículo
    postData.marca || "",                        // Col D: Marca
    postData.modelo || "",                       // Col E: Modelo do Veículo
    postData.ano || "",                          // Col F: Ano de Fabricação
    postData.km ? Number(postData.km) : "",      // Col G: Quilometragem Atual
    postData.razao || "",                        // Col H: Razão do acionamento
    postData.descricao || "",                    // Col I: Descrição Curta
    "",                                          // Col J: FOTO DO PROBLEMA (Removido)
    postData.endereco || "",                     // Col K: Endereço da Concessionária
    postData.baixado || "NÃO",                   // Col L: Veículo permaneceu baixado?
    postData.resolvido || "NÃO",                 // Col M: Foi resolvido?
    postData.negativa === "SIM" ? "SIM (ENVIADO VIA WHATSAPP)" : "NÃO", // Col N: Houve Negativa da Concessionária?
    postData.observacao || "",                   // Col O: Observação
    postData.preenchedorPosto || "",             // Col P: Posto/Graduação
    postData.preenchedorRE || "",                // Col Q: RE
    postData.preenchedorNome ? postData.preenchedorNome.toString().toUpperCase().trim() : "" // Col R: Nome do Preenchedor (Auto uppercase backend)
  ];

  const cleanedRow = limparDados(newRow);
  const targetRow = getFirstEmptyRow(sheet);
  sheet.getRange(targetRow, 1, 1, cleanedRow.length).setValues([cleanedRow]);

  // Se foi marcado como resolvido na criação, atualiza diretamente a aba dados_garantia
  if (postData.resolvido === "SIM") {
    const shGarantia = ss.getSheetByName("dados_garantia");
    if (shGarantia) {
      shGarantia.getRange(targetRow, 18).setValue(true); // Coluna R (Resolvido)
      shGarantia.getRange(targetRow, 19).setValue(timestamp); // Coluna S (Data Resolução)

      const cellL = shGarantia.getRange(targetRow, 12); // Coluna L (data_baixa)
      const cellM = shGarantia.getRange(targetRow, 13); // Coluna M (tempo_baixa)

      // Se houver data de baixa, calcula os dias. Senão, calcula com base no Carimbo (A)
      let dataBaixaVal = cellL.getValue();
      let d1 = dataBaixaVal ? new Date(dataBaixaVal) : timestamp;
      if (isNaN(d1.getTime()) && dataBaixaVal) {
        let partes = dataBaixaVal.toString().split(" ")[0].split("/");
        if (partes.length === 3) {
          d1 = new Date(partes[2], partes[1] - 1, partes[0]);
        }
      }
      d1.setHours(0,0,0,0);
      timestamp.setHours(0,0,0,0);
      let diff = Math.floor((timestamp - d1) / (1000 * 60 * 60 * 24));
      cellM.setValue(diff >= 0 ? diff : 0);
    }
  }

  return jsonResponse({ success: true, message: "Acionamento de garantia cadastrado com sucesso!" });
}

// Atualiza o status na aba "dados_garantia" (Coluna R e S)
function handleAtualizarStatus(postData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("dados_garantia");
  if (!sheet) {
    return jsonResponse({ success: false, error: "Aba 'dados_garantia' não encontrada." });
  }

  const placa = (postData.placa || "").toUpperCase().trim();
  const rowNum = Number(postData.rowNum);
  const dataSolucao = postData.dataSolucao || ""; // Formato "yyyy-MM-dd" vindo do input do HTML

  if (!placa) {
    return jsonResponse({ success: false, error: "Placa não informada." });
  }

  let targetRow = -1;
  const data = sheet.getDataRange().getValues();

  // Se recebemos a linha física recomendada no get, validamos se a placa bate
  if (rowNum && rowNum <= data.length) {
    const headers = data[0].map(h => h.toString().toLowerCase().trim());
    const placaIdx = headers.findIndex(h => h.includes("placa"));
    if (placaIdx !== -1 && data[rowNum - 1][placaIdx].toString().toUpperCase().trim() === placa) {
      targetRow = rowNum;
    }
  }

  // Fallback: Varre a planilha buscando a última ocorrência pendente daquela placa
  if (targetRow === -1) {
    const headers = data[0].map(h => h.toString().toLowerCase().trim());
    const placaIdx = headers.findIndex(h => h.includes("placa"));
    const situacaoIdx = 17; // Coluna R

    if (placaIdx !== -1) {
      for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][placaIdx].toString().toUpperCase().trim() === placa) {
          const resolvido = data[i][situacaoIdx] === true || String(data[i][situacaoIdx]).toUpperCase() === "SIM" || String(data[i][situacaoIdx]).toUpperCase() === "TRUE";
          if (!resolvido) {
            targetRow = i + 1; // Linha física (1-based)
            break;
          }
        }
      }
    }
  }

  if (targetRow === -1) {
    return jsonResponse({ success: false, error: "Nenhum acionamento ativo encontrado para a placa " + placa });
  }

  // Coluna R (18): Marca como RESOLVIDO (true/checkbox)
  sheet.getRange(targetRow, 18).setValue(true);

  let dataFim = new Date();
  if (dataSolucao) {
    // Converte de "yyyy-MM-dd" para objeto Date para que o Sheets reconheça nativamente o calendário
    const partes = dataSolucao.split("-");
    if (partes.length === 3) {
      dataFim = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    }
  }
  dataFim.setHours(0, 0, 0, 0);

  // Coluna S (19): Data de solução
  sheet.getRange(targetRow, 19).setValue(dataFim);

  // Congela os dias de baixa na Coluna M (13) com base nas datas reais
  const cellL = sheet.getRange(targetRow, 12); // Coluna L: data_baixa
  const cellM = sheet.getRange(targetRow, 13); // Coluna M: tempo_baixa
  congelarDias(cellL, cellM, dataFim);

  return jsonResponse({ success: true, message: "Status do veículo atualizado com sucesso!" });
}

// Salva arquivos no Google Drive e retorna a URL pública de visualização
function uploadToDrive(base64Data, filename, mimeType) {
  try {
    const folder = DriveApp.getFolderById(CFG_GARANTIA.DRIVE_FOLDER_ID);
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType, filename);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    throw new Error("Erro ao salvar arquivo no Drive: " + err.toString());
  }
}

// Auxiliar para resposta JSON formatada
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
                       .setMimeType(ContentService.MimeType.JSON);
}

// ================================================================
// LÓGICA E HIGIENIZAÇÃO DE PROCESSAMENTO EXISTENTES (CMM)
// ================================================================

/**
 * Verifica veículos sem data de baixa e preenche os dias na coluna M.
 * Também sincroniza a coluna N da aba de preenchimento.
 */
function verificarVeiculosSemBaixa() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shGarantia = ss.getSheetByName("dados_garantia");
  const shPreenchimento = ss.getSheetByName("dados_preenchimento");
  if (!shGarantia || !shPreenchimento) return;

  const lrGarantia = shGarantia.getLastRow();
  const lrPreenchimento = shPreenchimento.getLastRow();

  const lr = Math.min(lrGarantia, lrPreenchimento);
  if (lr < 2) return;

  const dadosGarantia = shGarantia.getRange(2, 1, lr - 1, 20).getValues();
  const dadosPreenchimento = shPreenchimento.getRange(2, 1, lr - 1, 14).getValues();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  for (let i = 0; i < dadosGarantia.length; i++) {
    const linhaReal = i + 2;

    const valN = dadosPreenchimento[i][13]; // Coluna N
    const valA = dadosGarantia[i][0];   // Coluna A
    const valL = dadosGarantia[i][11];  // Coluna L
    const valM = dadosGarantia[i][12];  // Coluna M
    const valR = dadosGarantia[i][17];  // Coluna R
    const valS = dadosGarantia[i][18];  // Coluna S
    const valT = dadosGarantia[i][19];  // Coluna T

    if (valN && valN.toString().toUpperCase().trim() === "SIM") {
      let alterou = false;

      if (valR !== true) {
        shGarantia.getRange(linhaReal, 18).setValue(true);
        alterou = true;
      }

      if (!valS) {
        let dataResolucao = hoje;
        if (valA) {
          let dA = new Date(valA);
          if (!isNaN(dA.getTime())) {
            dA.setHours(0, 0, 0, 0);
            dataResolucao = dA;
          }
        }
        shGarantia.getRange(linhaReal, 19).setValue(dataResolucao);
        alterou = true;
      }

      if (alterou) {
        const cellL = shGarantia.getRange(linhaReal, 12);
        const cellM = shGarantia.getRange(linhaReal, 13);

        let dataFim = valS || hoje;
        if (dataFim instanceof Date) {
          dataFim.setHours(0, 0, 0, 0);
        } else {
          dataFim = new Date(dataFim);
          if (isNaN(dataFim.getTime())) dataFim = hoje;
          dataFim.setHours(0, 0, 0, 0);
        }

        if (valL) {
          congelarDias(cellL, cellM, dataFim);
        } else {
          let dA = null;
          if (valA instanceof Date) {
            dA = new Date(valA.getTime());
          } else if (valA) {
            dA = new Date(valA);
            if (isNaN(dA.getTime())) {
              let partes = valA.toString().split(" ")[0].split("/");
              if (partes.length === 3) {
                dA = new Date(partes[2], partes[1] - 1, partes[0]);
              }
            }
          }
          if (dA && !isNaN(dA.getTime())) {
            dA.setHours(0, 0, 0, 0);
            let diff = Math.floor((dataFim - dA) / (1000 * 60 * 60 * 24));
            cellM.setValue(diff >= 0 ? diff : 0);
          }
        }
      }
      continue;
    }

    if (valR === true) {
      // Se está resolvido, garante que os dias de baixa estejam corretos
      if (valL && valS) {
        let dL = new Date(valL);
        let dS = new Date(valS);
        if (!isNaN(dL.getTime()) && !isNaN(dS.getTime())) {
          dL.setHours(0,0,0,0);
          dS.setHours(0,0,0,0);
          let diff = Math.floor((dS - dL) / (1000 * 60 * 60 * 24));
          let diasCalculados = diff >= 0 ? diff : 0;
          if (valM !== diasCalculados) {
            shGarantia.getRange(linhaReal, 13).setValue(diasCalculados);
          }
        }
      }
      continue;
    }

    const rDesmarcado = (valR === false || valR === "");
    const sVazio = (valS === "" || valS === null || valS === undefined);
    const mVazio = (valM === "" || valM === null || valM === undefined);
    const tSim = (valT && valT.toString().toUpperCase().trim() === "SIM");

    if (rDesmarcado && sVazio && mVazio && tSim) {
      if (valA) {
        let dA = null;
        if (valA instanceof Date) {
          dA = new Date(valA.getTime());
        } else {
          dA = new Date(valA);
          if (isNaN(dA.getTime())) {
            let partes = valA.toString().split(" ")[0].split("/");
            if (partes.length === 3) {
              dA = new Date(partes[2], partes[1] - 1, partes[0]);
            }
          }
        }

        if (dA && !isNaN(dA.getTime())) {
          dA.setHours(0, 0, 0, 0);
          let diff = Math.floor((hoje - dA) / (1000 * 60 * 60 * 24));
          let diasCalculados = diff >= 0 ? diff : 0;
          shGarantia.getRange(linhaReal, 13).setValue(diasCalculados);
        }
      }
    }
  }
}

// ================================================================
// MÓDULO DE SANITIZAÇÃO E PADRONIZAÇÃO AUTOMÁTICA DE DADOS (CMM)
// ================================================================

// Motos SCRAMBLER 400X: todas são da marca TRIUMPH (na frota aparecem como "TRIUMPH/SCRAMBLER 400X" ou "I/TRIUMPH SCRAMBLER")
function ehScrambler(txt) {
  if (!txt) return false;
  return txt.toString().toUpperCase().indexOf("SCRAMB") !== -1;
}

function normalizarMarca(txt) {
  if (!txt) return "";
  let t = txt.toString().toUpperCase().trim();
  if (t.includes("TRIUMPH") || t.includes("SCRAMB")) return "TRIUMPH";
  if (t.includes("REN") || t.includes("DUST")) return "RENAULT";
  if (t.includes("TOY") || t.includes("CORO")) return "TOYOTA";
  if (t.includes("HYU") || t.includes("CRET")) return "HYUNDAI";
  if (t.includes("CHEV") || t.includes("GM") || t.includes("TRAIL")) return "CHEVROLET";
  if (t.includes("FIAT") || t.includes("SCUD")) return "FIAT";
  if (t.includes("FORD")) return "FORD";
  return t;
}

function normalizarModelo(txt) {
  if (!txt) return "";
  let t = txt.toString().toUpperCase().trim();
  if (t.includes("SCRAMB")) return "SCRAMBLER 400X";
  if (t.includes("DUST") || t.includes("DUTER")) return "DUSTER ZEN 1.6";
  if (t.includes("CORO") || t.includes("CROSS")) return "COROLLA CROSS";
  if (t.includes("CRET")) return "CRETA";
  if (t.includes("TRAIL") || t.includes("BLAZER")) return "TRAILBLAZER";
  if (t.includes("SCUD")) return "SCUDO";
  return t;
}

function normalizarAno(txt) {
  if (!txt) return "";
  let str = txt.toString().replace(/\D/g, '').trim();
  if (!str) return txt;
  let num = parseInt(str, 10);
  if (num >= 2020 && num <= 2030) return num;
  if (num >= 20 && num <= 30) return 2000 + num;
  if (str.length === 4 && str.startsWith("00")) {
    return 2000 + parseInt(str.substring(2), 10);
  }
  return num;
}

function normalizarKM(txt) {
  if (!txt) return "";
  return txt.toString().replace(/\D/g, '').trim();
}

function normalizarPlaca(txt) {
  if (!txt) return "";
  return txt.toString().toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
}

/**
 * Motor de Regras: Padroniza Placa, Marca, Modelo, Ano e KM nos novos envios.
 */
function limparDados(linha) {
  if (linha[2]) linha[2] = normalizarPlaca(linha[2]);  // Coluna C: Placa
  if (linha[3]) linha[3] = normalizarMarca(linha[3]);  // Coluna D: Marca
  if (linha[4]) linha[4] = normalizarModelo(linha[4]); // Coluna E: Modelo
  if (linha[5]) linha[5] = normalizarAno(linha[5]);    // Coluna F: Ano
  if (linha[6]) linha[6] = normalizarKM(linha[6]);     // Coluna G: KM
  if (ehScrambler(linha[4])) linha[3] = "TRIUMPH";     // Coluna D: SCRAMBLER 400X é sempre TRIUMPH (mesmo com marca vazia ou "I")
  return linha;
}

/**
 * FUNÇÃO DE HIGIENIZAÇÃO (RODA APENAS NA ABA 'dados_preenchimento')
 * Higieniza somente a 1ª aba. A aba 'dados_garantia' se atualiza sozinha pelas fórmulas!
 */
function padronizarTodaAPlanilha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName("dados_preenchimento"); // APENAS A PRIMEIRA ABA!
  if (!sh) {
    SpreadsheetApp.getUi().alert('Erro: A aba "dados_preenchimento" não foi encontrada!');
    return;
  }

  const lr = sh.getLastRow();
  if (lr < 2) return;
  // Pega exatamente as colunas C, D, E, F e G da aba dados_preenchimento
  // C: Placa | D: Marca | E: Modelo | F: Ano | G: KM
  const range = sh.getRange(2, 3, lr - 1, 5);
  const vals = range.getValues();
  let totalProcessado = 0;
  for (let i = 0; i < vals.length; i++) {
    vals[i][0] = normalizarPlaca(vals[i][0]);  // C: Placa
    vals[i][1] = normalizarMarca(vals[i][1]);  // D: Marca
    vals[i][2] = normalizarModelo(vals[i][2]); // E: Modelo
    vals[i][3] = normalizarAno(vals[i][3]);    // F: Ano
    vals[i][4] = normalizarKM(vals[i][4]);     // G: KM
    if (ehScrambler(vals[i][2])) vals[i][1] = "TRIUMPH"; // D: SCRAMBLER 400X é sempre TRIUMPH
    totalProcessado++;
  }
  range.setValues(vals);
  SpreadsheetApp.getUi().alert(`✅ Padronização Concluída!\n\n${totalProcessado} linhas da aba 'dados_preenchimento' foram higienizadas com sucesso!\nA aba 'dados_garantia' foi mantida intacta.`);
}

/**
 * Limpa as colunas O (15) e P (16) da guia 'banco_dados'
 */
function limparGuiaBancoDados() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var guiaBanco = ss.getSheetByName("banco_dados");
  if (!guiaBanco) {
    SpreadsheetApp.getUi().alert('Erro: A guia "banco_dados" não foi encontrada!');
    return;
  }
  var ultimaLinha = guiaBanco.getLastRow();
  if (ultimaLinha < 2) return;
  var range = guiaBanco.getRange(2, 15, ultimaLinha - 1, 2);
  var values = range.getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0]) values[i][0] = values[i][0].toString().toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
    if (values[i][1]) values[i][1] = values[i][1].toString().toUpperCase().trim();
  }
  range.setValues(values);
  SpreadsheetApp.getUi().alert('CMM GESTÃO FROTA: Banco de dados padronizado!');
}

/**
 * FUNÇÃO PARA O BOTÃO: PROCESSAR ENVIOS DE GARANTIA CONSOLIDADO
 */
function processarEnviosGarantia() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName("dados_garantia");
  if (!sh) {
    SpreadsheetApp.getUi().alert('Erro: A guia "dados_garantia" não foi encontrada!');
    return;
  }
  const lr = sh.getLastRow();
  if (lr < 2) return;

  const dados = sh.getRange(1, 1, lr, 16).getValues();
  let pacotesDeEnvio = {};
  let totalSelecionado = 0;

  for (let i = 1; i < lr; i++) {
    const rowNum = i + 1;
    if (dados[i][15] === true) {
      const emailDest = dados[i][14] ? dados[i][14].toString().trim() : "";
      if (!emailDest) continue;

      const placa = dados[i][2];
      const chassi = dados[i][3];
      const km = dados[i][7];
      const defeito = dados[i][9];
      const endereco = dados[i][10];

      const dataBaixaRaw = dados[i][11];
      const dataBaixa = dataBaixaRaw instanceof Date ? Utilities.formatDate(dataBaixaRaw, "GMT-3", "dd/MM/yyyy") : dataBaixaRaw;
      const tempoBaixa = dados[i][12];
      const textoEmail = dados[i][13];

      if (!pacotesDeEnvio[emailDest]) {
        pacotesDeEnvio[emailDest] = {
          linhasPlanilha: [],
          viaturas: []
        };
      }

      pacotesDeEnvio[emailDest].linhasPlanilha.push(rowNum);
      pacotesDeEnvio[emailDest].viaturas.push({
        placa: placa, chassi: chassi, km: km, dataBaixa: dataBaixa,
        tempoBaixa: tempoBaixa, defeito: defeito, endereco: endereco, textoEmail: textoEmail
      });

      totalSelecionado++;
    }
  }

  if (totalSelecionado === 0) {
    SpreadsheetApp.getUi().alert('Aviso: Marque os checkboxes na coluna P para enviar.');
    return;
  }

  const blobAssinatura = DriveApp.getFileById(CFG_GARANTIA.SIGNATURE_FILE_ID).getBlob();
  const assunto = "CMM - Solicitação de Manutenção e Garantia de Frota — PMESP";
  const copiaPara = "cmmrecepcao@policiamilitar.sp.gov.br, josemaycon@policiamilitar.sp.gov.br";
  const agora = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");
  let emailsEnviadosContador = 0;

  for (const emailDest in pacotesDeEnvio) {
    const pacote = pacotesDeEnvio[emailDest];

    let corpoHtml = `
      <div style="font-size:16px; font-family:Arial; color: #000; line-height: 1.5;">
        Prezado,<br><br>
        O Centro de Motomecanização (CMM) da PMESP solicita vossa análise, suporte e providências quanto às pendências do(s) veículo(s) listado(s) abaixo (viaturas oficiais da Polícia Militar de São Paulo).<br><br>
        <hr style="border: 0; border-top: 1px solid #ccc; margin-bottom: 20px;">
    `;

    pacote.viaturas.forEach((v, index) => {
      corpoHtml += `
        <div style="margin-bottom: 30px; padding: 15px; background-color: #fcfcfc; border: 1px solid #d3d3d3; border-left: 5px solid #0056b3; border-radius: 4px;">
          <strong style="font-size: 18px; color: #0056b3;">VEÍCULO #${index + 1} — PLACA: ${v.placa}</strong><br><br>

          <b>DADOS DO VEÍCULO:</b><br>
          - <b>Placa:</b> ${v.placa};<br>
          - <b>Chassi:</b> ${v.chassi};<br>
          - <b>KM Atual:</b> ${v.km}.<br><br>

          <b>INFORMAÇÕES DE BAIXA:</b><br>
          - <b>Data da Baixa:</b> ${v.dataBaixa};<br>
          - <b>Tempo Total em Baixa:</b> ${v.tempoBaixa} dias.<br><br>

          <b>ENDEREÇO DA CONCESSIONÁRIA LOCAL:</b><br>
          ${v.endereco || "-"}<br><br>

          <b>DESCRIÇÃO DO PROBLEMA / DEFEITO alegado:</b><br>
          <span style="color: #c00; font-weight: bold;">${v.defeito}</span><br><br>

          <b>MENSAGEM ADICIONAL:</b><br>
          <i>${v.textoEmail || "Sem observações adicionais."}</i>
        </div>
      `;
    });

    corpoHtml += `
        <hr style="border: 0; border-top: 1px solid #ccc; margin-top: 20px;">
        Atenciosamente,<br><br>
        <img src="cid:assinaturaCMM" style="width: 300px;"><br>
        <b>CMM - Centro de Motomecanização</b><br>
        Polícia Militar de São Paulo
      </div>
    `;

    GmailApp.sendEmail(emailDest, assunto, "", {
      htmlBody: corpoHtml,
      inlineImages: { assinaturaCMM: blobAssinatura },
      cc: copiaPara
    });

    pacote.linhasPlanilha.forEach(row => {
      sh.getRange(row, 16).setValue(false);
      sh.getRange(row, 17).setValue(agora);
    });

    emailsEnviadosContador++;
  }

  SpreadsheetApp.getUi().alert(`✅ Processamento Concluído!\n\nViaturas processadas: ${totalSelecionado}\nE-mail(s) unificado(s) disparado(s): ${emailsEnviadosContador}`);
}

function congelarDias(cellL, cellM, dataFim) {
  let dataBaixaVal = cellL.getValue();
  if (!dataBaixaVal) return;
  let d1 = new Date(dataBaixaVal);
  if (isNaN(d1.getTime())) {
    let partes = dataBaixaVal.toString().split(" ")[0].split("/");
    d1 = new Date(partes[2], partes[1] - 1, partes[0]);
  }
  d1.setHours(0,0,0,0);
  dataFim.setHours(0,0,0,0);
  let diff = Math.floor((dataFim - d1) / (1000 * 60 * 60 * 24));
  cellM.setValue(diff >= 0 ? diff : 0);
}

// ==========================================
// MÓDULO: BAIXA EM MASSA VIA TEXTO (WHATSAPP)
// ==========================================

function abrirCaixaBaixaMassa() {
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial; padding: 10px;">
      <p style="font-size: 14px; margin-bottom: 5px;"><strong>Cole o texto do WhatsApp abaixo:</strong></p>
      <p style="font-size: 12px; color: #666; margin-top: 0;">O sistema vai encontrar as placas automaticamente e marcá-las como resolvidas.</p>
      <textarea id="textoPlacas" style="width: 100%; height: 150px; padding: 10px; border-radius: 5px; border: 1px solid #ccc; margin-bottom: 15px; resize: none;"></textarea>
      <button onclick="google.script.run.withSuccessHandler(fechar).processarBaixaEmMassa(document.getElementById('textoPlacas').value)" style="width: 100%; background: #00ff90; color: #000; border: none; padding: 12px; font-weight: bold; border-radius: 5px; cursor: pointer;">
        PROCESSAR E MARCAR RESOLVIDO
      </button>
    </div>
    <script>function fechar(msg) { alert(msg); google.script.host.close(); }</script>
  `)
  .setWidth(400)
  .setHeight(300);

  SpreadsheetApp.getUi().showModalDialog(html, 'CMM - Baixa em Massa de VTRs');
}

function processarBaixaEmMassa(texto) {
  if (!texto || texto.trim() === "") return "Nenhum texto foi inserido.";

  const regexPlaca = /[A-Z]{3}[-\s]?[0-9][A-Z0-9][0-9]{2}/gi;
  let placasEncontradas = texto.match(regexPlaca);
  if (!placasEncontradas) return "Nenhuma placa válida encontrada no texto.";

  placasEncontradas = placasEncontradas.map(p => p.replace(/[^A-Z0-9]/gi, '').toUpperCase());

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName("dados_garantia");
  if (!sh) return "Erro: Aba 'dados_garantia' não encontrada.";

  const ultimaLinha = sh.getLastRow();
  if (ultimaLinha < 2) return "Aba vazia.";

  const dados = sh.getRange(2, 1, ultimaLinha - 1, 19).getValues();
  let contadorSucesso = 0;
  let dataHoje = new Date();
  dataHoje.setHours(0,0,0,0);

  for (let i = 0; i < dados.length; i++) {
    let placaLinha = String(dados[i][2]).replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (placasEncontradas.includes(placaLinha)) {
      let linhaReal = i + 2;

      let dataBaixaVal = dados[i][11];
      let d1 = new Date(dataBaixaVal);

      if (isNaN(d1.getTime()) && dataBaixaVal) {
        let partes = dataBaixaVal.toString().split(" ")[0].split("/");
        d1 = new Date(partes[2], partes[1] - 1, partes[0]);
      }
      d1.setHours(0,0,0,0);

      let diff = 0;
      if (!isNaN(d1.getTime())) {
        diff = Math.floor((dataHoje - d1) / (1000 * 60 * 60 * 24));
        if (diff < 0) diff = 0;
      }

      sh.getRange(linhaReal, 18).setValue(true);
      sh.getRange(linhaReal, 19).setValue(dataHoje);
      sh.getRange(linhaReal, 13).setValue(diff);
      contadorSucesso++;
    }
  }

  const placasUnicas = [...new Set(placasEncontradas)];
  return `Concluído!\n\nPlacas lidas: ${placasUnicas.length}\nVeículos "congelados" e resolvidos: ${contadorSucesso}`;
}

/**
 * Classifica o motivo da baixa em REVISÃO ou GARANTIA.
 * Suporta tanto células individuais quanto intervalos inteiros (ArrayFormula).
 *
 * @param {string|Array} motivo O motivo ou intervalo de motivos da baixa.
 * @return {string|Array} A classificação ("REVISÃO" ou "GARANTIA").
 * @customfunction
 */
function CLASSIFICAR_MOTIVO(motivo) {
  if (!motivo && motivo !== 0) return "";

  // Suporte a ArrayFormula / Intervalos (Passados como matrizes no Google Sheets)
  if (Array.isArray(motivo)) {
    return motivo.map(row => row.map(cell => CLASSIFICAR_MOTIVO(cell)));
  }

  var txt = motivo.toString().toLowerCase().trim();
  if (!txt) return "";

  // 0. Etiquetas padronizadas no início da descrição: [REVISÃO], [GARANTIA] ou as duas juntas
  //    (ex.: "[REVISÃO][GARANTIA] ..." ou "[REVISÃO] [GARANTIA] ..."). Têm prioridade sobre as palavras-chave.
  var etiquetas = txt.match(/^(\s*\[\s*(revis[aã]o|garantia)\s*\])+/);
  if (etiquetas) {
    var temRevisao = /\[\s*revis[aã]o\s*\]/.test(etiquetas[0]);
    var temGarantia = /\[\s*garantia\s*\]/.test(etiquetas[0]);
    if (temRevisao && temGarantia) return "REVISÃO E GARANTIA";
    if (temRevisao) return "REVISÃO";
    if (temGarantia) return "GARANTIA";
  }

  // Termos que determinam classificação como REVISÃO
  var termosRevisao = [
    "revisao", "revisão", "revis", "rev",
    "troca de óleo", "troca de oleo", "troca do óleo", "troca do oleo",
    "troca de filtro", "troca do filtro", "manutencao de 40mil", "manutenção de 40mil",
    "troca de pastilhas de freio"
  ];

  // Termos que anulam a revisão e caracterizam defeitos/problemas (GARANTIA)
  var termosExclusao = [
    "falta de óleo", "falta de oleo", "baixando óleo", "baixando oleo",
    "consumo de óleo", "consumo de oleo", "alto consumo", "vazamento",
    "nível de óleo baixo", "nivel de oleo baixo", "óleo baixo", "oleo baixo", "baixo óleo"
  ];

  // 1. Verifica se contém termos de exclusão (Garantia)
  for (var i = 0; i < termosExclusao.length; i++) {
    if (txt.indexOf(termosExclusao[i]) !== -1) {
      return "GARANTIA";
    }
  }

  // 2. Verifica se contém termos de revisão
  for (var i = 0; i < termosRevisao.length; i++) {
    if (txt.indexOf(termosRevisao[i]) !== -1) {
      return "REVISÃO";
    }
  }

  // 3. Caso padrão (Problemas mecânicos/elétricos em geral)
  return "GARANTIA";
}

// Executar esta função manualmente no editor do Apps Script para conceder acesso de escrita ao Google Drive
function autorizarAcessoGoogleDrive() {
  DriveApp.getRootFolder().getName();
  Logger.log("✓ Acesso ao Google Drive autorizado com sucesso!");
}

// ================================================================
// GESTÃO E MONITORAÇÃO DE DOCUMENTOS NO GOOGLE DRIVE
// ================================================================

function extrairDataNomeArquivo(fileName) {
  var mesesMap = {
    'JAN': '01', 'FEV': '02', 'FEB': '02', 'MAR': '03', 'ABR': '04', 'APR': '04',
    'MAI': '05', 'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08', 'AUG': '08',
    'SET': '09', 'SETEMBRO': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12'
  };

  // Ex: 20AGO26 ou 08JUL26
  var match = fileName.match(/(\d{1,2})([A-Za-z]{3})(\d{2,4})/);
  if (match) {
    var dia = parseInt(match[1], 10);
    var mesStr = match[2].toUpperCase();
    var ano = match[3];
    if (ano.length == 2) ano = "20" + ano;
    var mes = mesesMap[mesStr];
    if (mes) {
      return ("0" + dia).slice(-2) + "/" + mes + "/" + ano;
    }
  }

  // Ex: 10/03/2025 ou 10-03-2025 ou 10.03.2025
  match = fileName.match(/(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/);
  if (match) {
    var dia = parseInt(match[1], 10);
    var mes = parseInt(match[2], 10);
    var ano = match[3];
    if (ano.length == 2) ano = "20" + ano;
    return ("0" + dia).slice(-2) + "/" + ("0" + mes).slice(-2) + "/" + ano;
  }

  return null;
}

function extrairDadosNomeArquivo(fileName) {
  var nameWithoutExt = fileName.replace(/\.[^/.]+$/, "").trim();

  // Remove prefixo de ordem tipo "01) " ou "02.1) " ou "23.2) "
  var cleanName = nameWithoutExt.replace(/^[\d\.\s\)\-_]+/, "").trim();

  // Divide por " - " (espaço hífen espaço)
  var partes = cleanName.split(/\s+-\s+/);

  var providencia = "";
  var contratada = "";
  var assunto = "";

  if (partes.length >= 3) {
    providencia = partes[0].trim();
    contratada = partes[1].trim().toUpperCase();
    assunto = partes[2].trim();
  } else if (partes.length === 2) {
    providencia = partes[0].trim();
    assunto = partes[1].trim();
  } else {
    providencia = cleanName;
    assunto = "Documento Geral";
  }

  // Normaliza e valida a Contratada
  var cUpper = (contratada + " " + fileName).toUpperCase();
  if (cUpper.indexOf("TOYOTA") !== -1) contratada = "TOYOTA";
  else if (cUpper.indexOf("RENAULT") !== -1 || cUpper.indexOf("NRTT") !== -1) contratada = "RENAULT";
  else if (cUpper.indexOf("CHEVROLET") !== -1 || cUpper.indexOf("GM") !== -1 || cUpper.indexOf("TRAILBLAZER") !== -1) contratada = "CHEVROLET";
  else if (cUpper.indexOf("HYUNDAI") !== -1 || cUpper.indexOf("CRETA") !== -1) contratada = "HYUNDAI";
  else if (!contratada) contratada = "OUTROS";

  return {
    contratada: contratada,
    providencia: providencia,
    assunto: assunto
  };
}

function monitorarPastaDriveEPreencherPlanilha() {
  const PASTA_ID = "1XCuR_KFL9xGySxF4pOxlGgVGeOwSwWaK";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("providencias_adm");
  if (!sheet) {
    sheet = ss.insertSheet("providencias_adm");
    sheet.appendRow(["DATA", "CONTRATADA", "PROVIDÊNCIA (Nº DOCUMENTO)", "ASSUNTO", "RESPONDIDO?", "OBSERVAÇÕES"]);
  }

  const data = sheet.getDataRange().getValues();

  // Função de normalização para ignorar acentos e caracteres especiais nos cabeçalhos
  function normalizarHeader(str) {
    if (!str) return "";
    return str.toString()
              .toUpperCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // remove acentos
              .replace(/[^A-Z0-9]/g, "") // remove espaços e caracteres especiais
              .trim();
  }

  let dataIdx = -1;
  let contratadaIdx = -1;
  let providenciaIdx = -1;
  let assuntoIdx = -1;
  let respondidoIdx = -1;
  let observacoesIdx = -1;

  if (data.length > 0 && data[0].length >= 6) {
    const headersNorm = data[0].map(normalizarHeader);

    dataIdx = headersNorm.indexOf("DATA");
    contratadaIdx = headersNorm.indexOf("CONTRATADA");
    providenciaIdx = headersNorm.findIndex(h => h.indexOf("PROVIDENCIA") !== -1 || h.indexOf("DOCUMENTO") !== -1);
    assuntoIdx = headersNorm.indexOf("ASSUNTO");
    respondidoIdx = headersNorm.findIndex(h => h.indexOf("RESPONDIDO") !== -1);
    observacoesIdx = headersNorm.findIndex(h => h.indexOf("OBSERVACO") !== -1);
  }

  // Se algum cabeçalho essencial não foi mapeado, recria a estrutura na planilha e define índices fixos
  if (dataIdx === -1 || contratadaIdx === -1 || providenciaIdx === -1 || assuntoIdx === -1 || respondidoIdx === -1 || observacoesIdx === -1) {
    Logger.log("Aviso: Estrutura de cabeçalhos inválida. Gravando cabeçalhos padrão na primeira linha...");
    sheet.getRange(1, 1, 1, 6).setValues([["DATA", "CONTRATADA", "PROVIDÊNCIA (Nº DOCUMENTO)", "ASSUNTO", "RESPONDIDO?", "OBSERVAÇÕES"]]);

    // Define posições fixas padrão para evitar loop recursivo
    dataIdx = 0;
    contratadaIdx = 1;
    providenciaIdx = 2;
    assuntoIdx = 3;
    respondidoIdx = 4;
    observacoesIdx = 5;
  }

  // Mapeia os IDs de arquivos do Drive já importados
  const importedIds = new Set();
  for (let i = 1; i < data.length; i++) {
    const obsVal = data[i][observacoesIdx] ? data[i][observacoesIdx].toString() : "";
    const matchId = obsVal.match(/\[ID_DRIVE:\s*([^\]]+)\]/);
    if (matchId) {
      importedIds.add(matchId[1].trim());
    }
  }

  let folder;
  try {
    folder = DriveApp.getFolderById(PASTA_ID);
  } catch (e) {
    Logger.log("Erro ao acessar a pasta do Google Drive: " + e.toString());
    return;
  }

  // 1. Mapeia todos os arquivos reais existentes no Drive
  const allFiles = [];
  obterTodosArquivosRecursivo(folder, allFiles);
  Logger.log("Total de arquivos mapeados nas pastas principais: " + allFiles.length);

  const activeValidFilesMap = new Map();
  const activeDriveIds = new Set();

  for (var f = 0; f < allFiles.length; f++) {
    const file = allFiles[f];
    const fileName = file.getName();
    var nomeNormalizado = fileName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Filtro 1: Extensões permitidas (ignora m4a, mp4, ps1, txt, jpeg, png, kmz, pptx)
    var extMatch = fileName.match(/\.([0-9a-z]+)$/i);
    var ext = extMatch ? extMatch[1].toUpperCase() : "";
    var extensoesValidas = ["PDF", "DOCX", "DOC", "XLSX"];
    if (extensoesValidas.indexOf(ext) === -1) {
      continue;
    }

    // Filtro 2: Termos expressamente ignorados (modelos, templates, rascunhos, excluídos, lixeira, backups, segundas vias)
    var termosIgnorados = ["MODELO", "TEMPLATE", "EXCLUIDO", "RASCUNHO", "SEGUNDA VIA", "2A VIA", "2ª VIA", "BKP", "~$", "(1)", "(2)", "(3)"];
    var ehIgnorado = false;
    for (var ig = 0; ig < termosIgnorados.length; ig++) {
      if (nomeNormalizado.indexOf(termosIgnorados[ig]) !== -1) {
        ehIgnorado = true;
        break;
      }
    }
    if (ehIgnorado) {
      continue;
    }

    // Filtro 3: Critério Estrito de Padronização Oficial (Exige padrão ' - ' OU início numerado)
    var ehPadronizado = fileName.indexOf(" - ") !== -1 || /^\d+[\d\.\s\)\-_]+/.test(fileName);
    if (!ehPadronizado) {
      continue;
    }

    // Filtro 4: Aceita apenas documentos que sejam providências oficiais
    var termosPermitidos = ["NOTIFICACAO", "ATA", "MENSAGEM", "MSG", "OFICIO", "RESPOSTA", "DEFESA", "RELATORIO", "TR", "PARTE", "PUBLICACAO", "PLANILHA", "ORCAMENTO", "ORDEM DE SERVICO", "MANUAL", "NORMA", "PORTARIA", "DIVISOR"];
    var ehValido = false;
    for (var t = 0; t < termosPermitidos.length; t++) {
      if (nomeNormalizado.indexOf(termosPermitidos[t]) !== -1) {
        ehValido = true;
        break;
      }
    }

    if (ehValido) {
      activeValidFilesMap.set(file.getId(), file);
      activeDriveIds.add(file.getId());
    }
  }

  // 2. Analisa as linhas existentes na planilha e remove órfãos (arquivos excluídos do Drive)
  const linhasMantidas = [];
  const idsJaProcessados = new Set();
  var orfaosRemovidos = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obsVal = row[observacoesIdx] ? row[observacoesIdx].toString() : "";
    const matchId = obsVal.match(/\[ID_DRIVE:\s*([^\]]+)\]/);

    if (matchId) {
      const driveId = matchId[1].trim();
      if (activeDriveIds.has(driveId)) {
        linhasMantidas.push(row);
        idsJaProcessados.add(driveId);
      } else {
        orfaosRemovidos++;
        Logger.log("🗑 Removendo linha órfã (arquivo apagado do Drive): ID " + driveId);
      }
    } else {
      // Linha manual sem ID do Drive: preserva se houver conteúdo
      if (row.some(cell => cell !== "")) {
        linhasMantidas.push(row);
      }
    }
  }

  // 3. Processa novos arquivos do Drive que ainda não estão na planilha
  var novosArquivos = 0;
  for (const [fileId, file] of activeValidFilesMap.entries()) {
    if (idsJaProcessados.has(fileId)) {
      continue;
    }

    const fileName = file.getName();
    const fileUrl = file.getUrl();
    const dateCreated = file.getDateCreated();

    var dataDoc = extrairDataNomeArquivo(fileName);
    if (!dataDoc) {
      dataDoc = Utilities.formatDate(dateCreated, Session.getScriptTimeZone(), "dd/MM/yyyy");
    }

    var extractions = extrairDadosNomeArquivo(fileName);
    var contratada = extractions.contratada;
    var providencia = extractions.providencia;
    var assunto = extractions.assunto;

    // Regra da coluna RESPONDIDO?: Notificações começam com NÃO, os demais com NÃO SE APLICA
    var statusRespondido = "NÃO SE APLICA";
    var provNorm = (providencia + " " + fileName).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (provNorm.indexOf("NOTIFICACAO") !== -1) {
      statusRespondido = "NÃO";
    }

    const newRow = ["", "", "", "", "", ""];
    newRow[dataIdx] = dataDoc;
    newRow[contratadaIdx] = contratada;
    newRow[providenciaIdx] = providencia;
    newRow[assuntoIdx] = assunto;
    newRow[respondidoIdx] = statusRespondido;
    newRow[observacoesIdx] = "Arquivo importado do Google Drive em " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy") + ". Link: " + fileUrl + " [ID_DRIVE: " + fileId + "]";

    linhasMantidas.push(newRow);
    novosArquivos++;
    Logger.log("✓ Novo documento oficial importado: " + fileName);
  }

  // 4. Sanitiza todas as linhas para garantir que a Contratada seja estritamente válida
  const marcasPermitidas = ["TOYOTA", "RENAULT", "CHEVROLET", "HYUNDAI", "OUTROS"];
  for (let r = 0; r < linhasMantidas.length; r++) {
    var brand = (linhasMantidas[r][contratadaIdx] || "").toString().toUpperCase().trim();
    if (brand.indexOf("TOYOTA") !== -1 || brand.indexOf("COROLLA") !== -1) {
      linhasMantidas[r][contratadaIdx] = "TOYOTA";
    } else if (brand.indexOf("RENAULT") !== -1 || brand.indexOf("NRTT") !== -1 || brand.indexOf("DUSTER") !== -1) {
      linhasMantidas[r][contratadaIdx] = "RENAULT";
    } else if (brand.indexOf("CHEVROLET") !== -1 || brand.indexOf("GM") !== -1 || brand.indexOf("TRAILBLAZER") !== -1) {
      linhasMantidas[r][contratadaIdx] = "CHEVROLET";
    } else if (brand.indexOf("HYUNDAI") !== -1 || brand.indexOf("CRETA") !== -1) {
      linhasMantidas[r][contratadaIdx] = "HYUNDAI";
    } else {
      linhasMantidas[r][contratadaIdx] = "OUTROS";
    }
  }

  // 5. Limpeza total da aba (remove formatações e regras antigas de validação que travavam o Sheets)
  sheet.clear();
  sheet.getRange("A:Z").clearDataValidations();

  const cabecalho = [["DATA", "CONTRATADA", "PROVIDÊNCIA (Nº DOCUMENTO)", "ASSUNTO", "RESPONDIDO?", "OBSERVAÇÕES"]];
  sheet.getRange(1, 1, 1, 6).setValues(cabecalho);

  if (linhasMantidas.length > 0) {
    sheet.getRange(2, 1, linhasMantidas.length, 6).setValues(linhasMantidas);
  }

  // 6. Aplica novas validações de dados (dropdowns) com permissão suave
  const totalRows = sheet.getLastRow();
  if (totalRows >= 2) {
    // Dropdown na coluna B (CONTRATADA)
    const rangeContratada = sheet.getRange(2, 2, totalRows - 1, 1);
    const ruleContratada = SpreadsheetApp.newDataValidation()
                                         .requireValueInList(marcasPermitidas, true)
                                         .setAllowInvalid(true)
                                         .build();
    rangeContratada.setDataValidation(ruleContratada);

    // Dropdown na coluna E (RESPONDIDO?)
    const rangeRespondido = sheet.getRange(2, 5, totalRows - 1, 1);
    const ruleRespondido = SpreadsheetApp.newDataValidation()
                                         .requireValueInList(["SIM", "NÃO", "NÃO SE APLICA"], true)
                                         .setAllowInvalid(true)
                                         .build();
    rangeRespondido.setDataValidation(ruleRespondido);
    Logger.log("✓ Validações de dropdowns atualizadas com sucesso.");
  }

  Logger.log("Sincronização concluída com sucesso! Novos inseridos: " + novosArquivos + " | Órfãos removidos: " + orfaosRemovidos + " | Total ativo: " + linhasMantidas.length);
  return novosArquivos;
}

// Gatilho secundário para teste de monitoramento a cada 10 segundos
function gatilhoMonitoramentoDrive10s() {
  for (var i = 0; i < 6; i++) {
    try {
      monitorarPastaDriveEPreencherPlanilha();
    } catch (e) {
      Logger.log("Erro no monitoramento do Drive: " + e.toString());
    }
    if (i < 5) {
      Utilities.sleep(10000); // aguarda 10 segundos
    }
  }
}

// Configura o gatilho para rodar uma vez por dia, às 08h00 (horário de Brasília)
function criarGatilhoMonitoramentoDrive() {
  removerGatilhoMonitoramentoDrive();

  ScriptApp.newTrigger("monitorarPastaDriveEPreencherPlanilha")
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .nearMinute(0)
    .inTimezone("America/Sao_Paulo")
    .create();

  Logger.log("✓ Gatilho diário de monitoramento do Google Drive configurado para rodar às 08:00h (Horário de Brasília).");
}

// Remove os gatilhos ativos do monitoramento (tanto o diário quanto o de teste rápido de 10s)
function removerGatilhoMonitoramentoDrive() {
  const triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    const handler = triggers[i].getHandlerFunction();
    if (handler === "gatilhoMonitoramentoDrive10s" || handler === "monitorarPastaDriveEPreencherPlanilha") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  Logger.log("✓ Gatilhos de monitoramento do Google Drive desativados.");
}

// Função auxiliar recursiva para coletar arquivos de todas as subpastas (ignorando pastas de modelos/rascunhos)
function obterTodosArquivosRecursivo(folder, list) {
  try {
    const folderName = folder.getName().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Ignora pastas de modelos, rascunhos, lixeiras, fotos e conversas
    var pastasIgnoradas = ["MODELO", "RASCUNHO", "FOTO", "WHATSAPP", "ANTIGRAVITY", ".AGENTS"];
    for (var p = 0; p < pastasIgnoradas.length; p++) {
      if (folderName.indexOf(pastasIgnoradas[p]) !== -1) {
        Logger.log("ℹ Ignorando subpasta: " + folder.getName());
        return;
      }
    }

    const files = folder.getFiles();
    while (files.hasNext()) {
      list.push(files.next());
    }
    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
      obterTodosArquivosRecursivo(subfolders.next(), list);
    }
  } catch (e) {
    Logger.log("Erro ao acessar subpastas: " + e.toString());
  }
}
