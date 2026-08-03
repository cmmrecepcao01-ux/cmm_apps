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
    .addItem("🧹 Padronizar Toda a Planilha (Marcas/Modelos/KM)", "padronizarTodaAPlanilha")
    .addItem("✉️ Processar Envio de E-mails", "processarEnviosGarantia")
    .addItem("📲 Baixa em Massa (WhatsApp)", "abrirCaixaBaixaMassa")
    .addToUi();
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
  
  return ContentService.createTextOutput(JSON.stringify({ error: "Ação inválida ou não especificada." }))
                       .setMimeType(ContentService.MimeType.JSON);
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

// Retorna todas as placas da aba "banco_dados"
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
  
  if (placaIdx === -1) {
    return jsonResponse({ error: "Coluna 'Placa' não encontrada na aba banco_dados." });
  }
  
  const placas = [];
  for (let i = 1; i < data.length; i++) {
    const val = data[i][placaIdx];
    if (val) {
      placas.push(val.toString().toUpperCase().trim());
    }
  }
  
  // Retorna ordenado
  placas.sort();
  return jsonResponse(placas);
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
      if (opm && !ticketOpm.toLowerCase().includes(opm.toLowerCase().trim())) continue;
      
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

// Cria uma nova linha na aba "dados_preenchimento"
function handleCriarAcionamento(postData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("dados_preenchimento");
  if (!sheet) {
    return jsonResponse({ success: false, error: "Aba 'dados_preenchimento' não encontrada." });
  }
  
  let fotoUrl = "";
  let negativaUrl = "";
  
  // Trata upload de Foto do problema
  if (postData.fotoFile && postData.fotoFile.base64) {
    fotoUrl = uploadToDrive(postData.fotoFile.base64, postData.fotoFile.filename, postData.fotoFile.mimeType);
  }
  
  // Trata upload de documento de Negativa da concessionária
  if (postData.negativaFile && postData.negativaFile.base64) {
    negativaUrl = uploadToDrive(postData.negativaFile.base64, postData.negativaFile.filename, postData.negativaFile.mimeType);
  }
  
  const timestamp = new Date();
  
  // Monta a linha conforme a estrutura A a O (15 colunas)
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
    fotoUrl,                                     // Col J: FOTO DO PROBLEMA (Drive Link)
    postData.endereco || "",                     // Col K: Endereço da Concessionária
    postData.baixado || "NÃO",                   // Col L: Veículo permaneceu baixado?
    postData.resolvido || "NÃO",                 // Col M: Foi resolvido?
    postData.negativa === "SIM" ? negativaUrl || "SIM" : "NÃO", // Col N: Houve Negativa da Concessionária?
    postData.observacao || ""                    // Col O: Observação
  ];
  
  sheet.appendRow(newRow);
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

function normalizarMarca(txt) {
  if (!txt) return "";
  let t = txt.toString().toUpperCase().trim();
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
  if (linha[4]) inline = normalizarModelo(linha[4]);   // Coluna E: Modelo
  if (linha[5]) linha[5] = normalizarAno(linha[5]);    // Coluna F: Ano
  if (linha[6]) linha[6] = normalizarKM(linha[6]);     // Coluna G: KM
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
