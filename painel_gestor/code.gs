/**
 * GOOGLE APPS SCRIPT - CONECTOR PAINEL DO GESTOR CMM (DADOS DINÂMICOS DAS FONTES)
 * 
 * Este script deve ser implantado como Web App na planilha do gestor.
 * Ele calcula automaticamente os mostradores numéricos lendo os dados das
 * planilhas originais de Manutenção, Garantia e Almoxarifado.
 */

const MONTH_NAMES = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "Junho", "julho", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];

// IDs das Planilhas Fontes Oficiais
const SHEET_IDS = {
  MANUTENCAO: "1Ga5eQ_AhuOUkgTut2pfkzaZf_6cRcHHXg2ylLUvVQEs",
  GARANTIA: "1r53K1aiaV1ShKcxatov1R3Mu_LfS1tWbtWvCS5NPCDY",
  ALMOXARIFADO: "1eMSJT2nq2Vk12uBcK_Tcph0qLJjRbD1Q"
};

// Mapeamento padrão inicial para criação da aba PANORAMA (8 colunas)
const DEFAULT_SUBSECTIONS = [
  ["LINHA 2 RODAS", "MOTOS NA LINHA", "0", "MAIOR TEMPO PARADA", "0 DIAS", "NORMAL", "REVISÕES PERIÓDICAS SOB CONTROLE.", "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/"],
  ["LINHA 4 RODAS", "CARROS NA LINHA", "0", "MAIOR TEMPO PARADO", "0 DIAS", "NORMAL", "SEM NOVIDADES.", "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/"],
  ["LINHA PESADOS", "VEÍCULOS NA LINHA", "0", "MAIOR TEMPO PARADO", "0 DIAS", "NORMAL", "SEM NOVIDADES.", "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/"],
  ["SINALIZADORES", "SINALIZ. EM MANUT.", "0", "AGUARD. INSTALAÇÃO", "0", "NORMAL", "INSTALAÇÕES DENTRO DO PRAZO.", "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/"],
  ["GRAFISMO", "AGUARD. PLOTAGEM", "0", "PRAZO MÉDIO", "0 DIAS", "NORMAL", "PLOTAGENS CONCLUÍDAS.", "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/"],
  ["TÉCNICA", "LAUDOS PENDENTES", "0", "TRS EM ELABORAÇÃO", "0", "NORMAL", "SEM NOVIDADES.", "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/"],
  ["BORRACHARIA", "CONSUMO PNEUS/SEM", "0", "VULCANIZAÇÃO PEND.", "0", "NORMAL", "SEM NOVIDADES.", "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/"],
  ["ALMOXARIFADO", "ITENS EM FALTA", "0", "ITEM MAIS URGENTE", "NENHUM", "NORMAL", "ESTOQUE SOB CONTROLE.", "https://cmmpaineldebordo.netlify.app/3_almox_cmm_dashboard/dist/"],
  ["GARANTIA", "GARANTIAS ATIVAS", "0", "MARCA C/ MAIS PROB", "NENHUMA", "NORMAL", "SEM NOVIDADES.", "https://cmmpaineldebordo.netlify.app/4_garantias_cmm_dashboard/"],
  ["PRODUTIVIDADE", "EFICIÊNCIA FROTA", "100%", "META MENSAL", "90%", "NORMAL", "PRODUTIVIDADE GERAL DA FROTA.", "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/"],
  ["PEDIDOS DE AGENDAMENTO", "AGENDAM. PENDENTES", "0", "PRÓXIMO CRÍTICO", "NENHUM", "NORMAL", "SEM AGENDAMENTOS PENDENTES.", "https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/"]
];

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET: Retorna as tarefas e os indicadores das subseções calculados dinamicamente
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Busca os dados dinâmicos em tempo real das outras planilhas
    const liveMetrics = getLiveSubsectionsData();
    
    // 2. Garante a existência da aba PANORAMA
    let panoramaSheet = ss.getSheetByName("PANORAMA");
    if (!panoramaSheet) {
      panoramaSheet = ss.insertSheet("PANORAMA");
      panoramaSheet.appendRow(["Subseção", "Indicador 1 (Legenda)", "Indicador 1 (Valor)", "Indicador 2 (Legenda)", "Indicador 2 (Valor)", "Status", "Alerta/Detalhes", "Link"]);
      panoramaSheet.getRange("A1:H1").setFontWeight("bold").setBackground("#0f151b").setFontColor("#f8fafc");
      DEFAULT_SUBSECTIONS.forEach(sub => {
        panoramaSheet.appendRow(sub);
      });
    }
    
    const panoramaValues = panoramaSheet.getDataRange().getValues();
    const panoramaData = [];
    
    // Varre e atualiza a aba PANORAMA com as métricas dinâmicas obtidas
    for (let i = 1; i < panoramaValues.length; i++) {
      const row = panoramaValues[i];
      if (row[0]) {
        const subTitle = String(row[0]).toUpperCase();
        let val1 = String(row[2]);
        let val2 = String(row[4]);
        
        // Se houver cálculo em tempo real para esta subseção, atualiza na memória e na planilha
        if (liveMetrics[subTitle]) {
          val1 = liveMetrics[subTitle].val1;
          val2 = liveMetrics[subTitle].val2;
          
          panoramaSheet.getRange(i + 1, 3).setValue(val1); // Atualiza coluna C (Valor 1)
          panoramaSheet.getRange(i + 1, 5).setValue(val2); // Atualiza coluna E (Valor 2)
        }
        
        panoramaData.push({
          row: i + 1,
          title: subTitle,
          lbl1: String(row[1]).toUpperCase(),
          val1: val1.toUpperCase(),
          lbl2: String(row[3]).toUpperCase(),
          val2: val2.toUpperCase(),
          status: String(row[5]).toUpperCase(),
          alert: String(row[6]).toUpperCase(),
          link: String(row[7])
        });
      }
    }

    // 3. Lê tarefas das abas mensais
    const sheets = ss.getSheets();
    const allTasks = [];
    
    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      const isMonthSheet = MONTH_NAMES.some(m => m.toLowerCase() === sheetName.toLowerCase());
      if (!isMonthSheet) return;
      
      const values = sheet.getDataRange().getValues();
      if (values.length < 2) return;
      
      let headerRowIndex = -1;
      for (let i = 0; i < values.length; i++) {
        const rowStr = values[i].map(c => String(c).toLowerCase());
        if (rowStr.includes("data") && rowStr.includes("qru")) {
          headerRowIndex = i;
          break;
        }
      }
      
      const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;
      
      for (let i = startRow; i < values.length; i++) {
        const row = values[i];
        const dateVal = row[0];
        const qruVal = row[1];
        
        if (!qruVal || String(qruVal).trim() === "") continue;
        
        let formattedDate = "";
        if (dateVal instanceof Date) {
          formattedDate = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else if (dateVal) {
          formattedDate = String(dateVal).split("T")[0];
        }
        
        allTasks.push({
          sheet: sheetName,
          row: i + 1,
          data: formattedDate,
          qru: row[1] || "",
          anotacoes: row[2] || "",
          providencias: row[3] || "",
          situacao: row[4] || "PENDENTE"
        });
      }
    });
    
    return createJsonResponse({ 
      success: true, 
      tasks: allTasks,
      panorama: panoramaData
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// Executa cálculos em tempo real cruzando dados das planilhas fontes externas
function getLiveSubsectionsData() {
  const live = {};
  
  // ============================================================
  // 1. DADOS DE MANUTENÇÃO (Linha 2R, 4R, Pesados, etc.)
  // ============================================================
  try {
    const manSS = SpreadsheetApp.openById(SHEET_IDS.MANUTENCAO);
    const sheet = manSS.getSheetByName("VTR AGUARDANDO VISTORIA") || manSS.getSheets()[0];
    const rows = sheet.getDataRange().getValues();
    
    let activeVtrs = [];
    let resolvedCount = 0;
    
    // Mapeia colunas baseado nos headers conhecidos
    // 3: MARCA/MODELO, 6: DATA DE ENTRADA NA LINHA, 7: TEMPO PARADA, 8: PROBLEMA RELATADO, 9: DATA DE SAÍDA
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const model = String(row[3] || "").toUpperCase();
      const entryDateVal = row[6];
      const timeStopped = parseFloat(row[7]) || 0;
      const problem = String(row[8] || "").toUpperCase();
      const exitDate = String(row[9] || "").trim();
      
      const isResolved = exitDate !== "";
      if (isResolved) {
        resolvedCount++;
      }
      
      // Classifica se viatura está na linha (sem data de saída e sem LIBERADO no problema)
      if (!isResolved && !problem.includes("LIBERADO")) {
        // Classifica o tipo de veículo
        let type = "LEVE";
        if (/(LANDER|HONDA|YAMAHA|BMW|TRIUMPH|XRE|MOTO)/.test(model)) type = "MOTO";
        else if (/(IVECO|BUS|TRUCK|CAMINHÃO|SPRINTER|MICRO|ONIBUS|ÔNIBUS)/.test(model)) type = "PESADO";
        
        // Classifica o serviço
        const text = problem;
        const services = [];
        if (/\b(MEC|MECÂNICA|MECANICA|MECÃNICA|MECÂNICO|MECANICO|VIDRAÇARIA|VIDRACARIA)\b/.test(text) || text.includes('EM ATENDIMENTO')) {
          services.push(type === "PESADO" ? "LINHA MECÂNICA PESADOS" : "LINHA MECÂNICA");
        }
        if (/\b(TEC|TEC MEC|SET TEC|ST TÉCNICO|SETOR TÉCNICO|PERÍCIA|PERICIA)\b/.test(text)) services.push("SETOR TÉCNICO");
        if (/\b(BOR|BORR|BORRACHARIA)\b/.test(text)) services.push("BORRACHARIA");
        if (/\b(SIN|SINAL|SINALIZ|SINALIZADOR)\b/.test(text)) services.push("SINALIZADORES");
        if (/\b(GRAF|GRA|GRAFIS|GRAFISMO)\b/.test(text)) services.push("GRAFISMO");
        
        if (services.length === 0) {
          services.push(type === "PESADO" ? "LINHA MECÂNICA PESADOS" : "LINHA MECÂNICA");
        }
        
        activeVtrs.push({
          type: type,
          services: services,
          days: timeStopped
        });
      }
    }
    
    // Funções auxiliares para calcular o total e o maior tempo parado
    const getStats = (typeFilter, serviceFilter) => {
      const filtered = activeVtrs.filter(v => {
        const matchType = !typeFilter || v.type === typeFilter;
        const matchService = !serviceFilter || v.services.includes(serviceFilter);
        return matchType && matchService;
      });
      const maxDays = filtered.reduce((max, v) => v.days > max ? v.days : max, 0);
      return {
        val1: String(filtered.length),
        val2: maxDays > 0 ? String(Math.round(maxDays)) + " DIAS" : "0 DIAS"
      };
    };
    
    live["LINHA 2 RODAS"] = getStats("MOTO", null);
    live["LINHA 4 RODAS"] = getStats("LEVE", "LINHA MECÂNICA");
    live["LINHA PESADOS"] = getStats("PESADO", "LINHA MECÂNICA PESADOS");
    live["SINALIZADORES"] = getStats(null, "SINALIZADORES");
    live["GRAFISMO"] = getStats(null, "GRAFISMO");
    live["TÉCNICA"] = getStats(null, "SETOR TÉCNICO");
    live["BORRACHARIA"] = getStats(null, "BORRACHARIA");
    
    // Produtividade: Porcentagem de resolvidos
    const totalVtrs = rows.length - 1;
    const eff = totalVtrs > 0 ? ((resolvedCount / totalVtrs) * 100).toFixed(1) : "100";
    live["PRODUTIVIDADE"] = {
      val1: eff + "%",
      val2: "90% META"
    };

    // Pedidos de Agendamento (Motos/Carros aguardando vistoria/agendados)
    // Vamos estimar baseando-nos nos que têm legenda de agendamento ou data futura
    const agendamentos = activeVtrs.filter(v => v.days < 0).length; // tempo de parada negativo indica data futura (agendada)
    live["PEDIDOS DE AGENDAMENTO"] = {
      val1: String(agendamentos) + " SOLIC.",
      val2: agendamentos > 0 ? "REVISAR PEDIDOS" : "SEM PENDÊNCIAS"
    };

  } catch (err) {
    Logger.log("Erro de conexão na planilha de manutenção: " + err.message);
  }
  
  // ============================================================
  // 2. DADOS DE GARANTIA (Garantias pendentes e marca crítica)
  // ============================================================
  try {
    const garSS = SpreadsheetApp.openById(SHEET_IDS.GARANTIA);
    const sheet = garSS.getSheets()[0];
    const rows = sheet.getDataRange().getValues();
    
    let pendingCount = 0;
    const brandCounts = {};
    
    // Mapeamento colunas: 3: Marca, 6: situacao
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const brand = String(row[3] || "").trim().toUpperCase();
      const status = String(row[6] || "").trim().toLowerCase();
      
      if (status !== "true") {
        pendingCount++;
        if (brand && brand !== "N/D") {
          brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        }
      }
    }
    
    let topBrand = "NENHUMA";
    let maxProb = 0;
    for (let b in brandCounts) {
      if (brandCounts[b] > maxProb) {
        maxProb = brandCounts[b];
        topBrand = b;
      }
    }
    
    live["GARANTIA"] = {
      val1: String(pendingCount) + " PENDENTES",
      val2: topBrand + " (" + maxProb + " VTR)"
    };
  } catch (err) {
    Logger.log("Erro de conexão na planilha de garantias: " + err.message);
  }

  // ============================================================
  // 3. DADOS DO ALMOXARIFADO (Peças em falta e item mais urgente)
  // ============================================================
  try {
    const almSS = SpreadsheetApp.openById(SHEET_IDS.ALMOXARIFADO);
    const sheet = almSS.getSheets()[0];
    const rows = sheet.getDataRange().getValues();
    
    let missingCount = 0;
    let urgentItem = "NENHUM";
    
    // Mapeamento colunas: 1: Descrição, 5: Qt Atual, 6: Saldo Valor
    // Começa na linha 3 (index 2) pois a linha 1 é título e linha 2 são cabeçalhos
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      const desc = String(row[1] || "").toUpperCase();
      const qty = parseFloat(row[5]) || 0;
      
      if (qty <= 0) {
        missingCount++;
        if (desc.includes("TRAILBLAZER") || desc.includes("AMORTECEDOR") || desc.includes("BIELA")) {
          urgentItem = desc.split(" - ")[0].substring(0, 20); // Pega parte do nome da peça
        }
      }
    }
    
    if (urgentItem === "NENHUM" && missingCount > 0) {
      urgentItem = "PECAS REPOSICAO";
    }
    
    live["ALMOXARIFADO"] = {
      val1: String(missingCount) + " ZERADOS",
      val2: urgentItem
    };
  } catch (err) {
    Logger.log("Erro de conexão na planilha de almoxarifado: " + err.message);
  }

  return live;
}

// POST: Processa ações de gravação
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "update_sub") {
      const rowNum = parseInt(postData.row);
      const lbl1 = String(postData.lbl1).toUpperCase();
      const val1 = String(postData.val1).toUpperCase();
      const lbl2 = String(postData.lbl2).toUpperCase();
      const val2 = String(postData.val2).toUpperCase();
      const status = String(postData.status).toUpperCase();
      const alert = String(postData.alert).toUpperCase();
      const link = String(postData.link);
      
      const sheet = ss.getSheetByName("PANORAMA");
      if (!sheet) throw new Error("Aba PANORAMA não encontrada.");
      
      sheet.getRange(rowNum, 2).setValue(lbl1);
      sheet.getRange(rowNum, 3).setValue(val1);
      sheet.getRange(rowNum, 4).setValue(lbl2);
      sheet.getRange(rowNum, 5).setValue(val2);
      sheet.getRange(rowNum, 6).setValue(status);
      sheet.getRange(rowNum, 7).setValue(alert);
      sheet.getRange(rowNum, 8).setValue(link);
      
      return createJsonResponse({ success: true, message: "Panorama atualizado com sucesso!" });
      
    } else if (action === "create") {
      const data = postData.data;
      const qru = String(postData.qru).toUpperCase();
      const anotacoes = String(postData.anotacoes).toUpperCase();
      const providencias = String(postData.providencias).toUpperCase();
      const situacao = String(postData.situacao).toUpperCase();
      
      const sheet = getOrCreateSheetForDate(data, ss);
      sheet.appendRow([data, qru, anotacoes, providencias, situacao]);
      
      return createJsonResponse({ success: true, message: "Missão registrada com sucesso!" });
      
    } else if (action === "update") {
      const origSheetName = postData.sheet;
      const rowNum = parseInt(postData.row);
      const data = postData.data;
      const qru = String(postData.qru).toUpperCase();
      const anotacoes = String(postData.anotacoes).toUpperCase();
      const providencias = String(postData.providencias).toUpperCase();
      const situacao = String(postData.situacao).toUpperCase();
      
      const targetSheet = getOrCreateSheetForDate(data, ss);
      const targetSheetName = targetSheet.getName();
      
      if (origSheetName && origSheetName !== targetSheetName) {
        const origSheet = ss.getSheetByName(origSheetName);
        if (origSheet && rowNum <= origSheet.getLastRow()) {
          origSheet.deleteRow(rowNum);
        }
        targetSheet.appendRow([data, qru, anotacoes, providencias, situacao]);
      } else {
        const sheet = ss.getSheetByName(origSheetName);
        if (!sheet) throw new Error("Aba não encontrada: " + origSheetName);
        sheet.getRange(rowNum, 1, 1, 5).setValues([[data, qru, anotacoes, providencias, situacao]]);
      }
      
      return createJsonResponse({ success: true, message: "Missão atualizada com sucesso!" });
      
    } else if (action === "delete") {
      const origSheetName = postData.sheet;
      const rowNum = parseInt(postData.row);
      
      const sheet = ss.getSheetByName(origSheetName);
      if (sheet && rowNum <= sheet.getLastRow()) {
        sheet.deleteRow(rowNum);
        return createJsonResponse({ success: true, message: "Missão excluída!" });
      } else {
        throw new Error("Linha ou aba inválida.");
      }
    }
    
    return createJsonResponse({ success: false, error: "Ação não reconhecida." });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function getOrCreateSheetForDate(dateStr, ss) {
  let date = new Date(dateStr + "T12:00:00");
  if (isNaN(date.getTime())) {
    date = new Date();
  }
  
  const monthNamesMapping = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "Junho", "julho", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
  const targetName = monthNamesMapping[date.getMonth()];
  
  let sheet = null;
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().toLowerCase() === targetName.toLowerCase()) {
      sheet = sheets[i];
      break;
    }
  }
  
  if (!sheet) {
    sheet = ss.insertSheet(targetName);
    sheet.appendRow(["data", "QRU", "Anotações", "providências", "SITUAÇÃO FINAL"]);
    sheet.getRange("A1:E1").setFontWeight("bold").setBackground("#0f151b").setFontColor("#f8fafc");
  }
  
  return sheet;
}
