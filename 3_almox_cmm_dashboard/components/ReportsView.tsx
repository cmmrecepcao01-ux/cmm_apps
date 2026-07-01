import React, { useMemo } from 'react';
import { FileSpreadsheet, Printer, Download, BarChart2, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils';
import * as XLSX from 'xlsx';

interface FleetcomItem {
  id: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  vehicleType: 'LEVES' | 'MOTOS' | 'PESADOS' | 'GERAL';
  isLowStock: boolean;
}

interface SupabaseUsedPart {
  id: string;
  keyword: string;
  partName: string;
  quantity: number;
  timestamp: number;
  vehicleInfo?: string;
  detectedFrom?: string;
  mechanicName?: string;
}

interface ServiceRecord {
  id: string;
  exitDate?: string;
  endTime?: number;
  usedParts?: SupabaseUsedPart[] | string;
}

interface ManualTransaction {
  id: string;
  timestamp: number;
  type: 'ENTRADA' | 'SAIDA';
  partId: string;
  partDescription: string;
  quantity: number;
  unitPrice: number;
  responsable: string;
  reason: string;
}

interface ReportsViewProps {
  inventory: FleetcomItem[];
  supabaseServices: ServiceRecord[];
  manualTransactions: ManualTransaction[];
  monthlyStats: {
    monthName: string;
    outputsCount: number;
    outputsValue: number;
    inputsCount: number;
    inputsValue: number;
  }[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  inventory,
  supabaseServices,
  manualTransactions,
  monthlyStats,
}) => {

  // Calculate parts consumption ranking
  const rankingList = useMemo(() => {
    const consumption: Record<string, { quantity: number; value: number; category: string; brand: string }> = {};

    // 1. Supabase automatically logged exits
    supabaseServices.forEach(service => {
      let parts: SupabaseUsedPart[] = [];
      if (typeof service.usedParts === 'string') {
        try { parts = JSON.parse(service.usedParts); } catch (e) {}
      } else if (Array.isArray(service.usedParts)) {
        parts = service.usedParts;
      }
      parts.forEach(p => {
        const name = String(p.partName || p.keyword || '').toUpperCase().split('(')[0].trim();
        const qty = Number(p.quantity) || 1;
        const catalogItem = inventory.find(item => item.description === name || item.description.includes(name));
        const price = catalogItem ? catalogItem.unitPrice : 0;

        if (!consumption[name]) {
          consumption[name] = { 
            quantity: 0, 
            value: 0, 
            category: catalogItem?.category || 'GERAL', 
            brand: catalogItem?.brand || 'N/D' 
          };
        }
        consumption[name].quantity += qty;
        consumption[name].value += qty * price;
      });
    });

    // 2. Manual logged exits
    manualTransactions.filter(t => t.type === 'SAIDA').forEach(t => {
      const name = t.partDescription.toUpperCase();
      if (!consumption[name]) {
        consumption[name] = { quantity: 0, value: 0, category: 'GERAL', brand: 'N/D' };
      }
      const catalogItem = inventory.find(item => item.description === name);
      consumption[name].quantity += t.quantity;
      consumption[name].value += t.quantity * t.unitPrice;
      if (catalogItem) {
        consumption[name].category = catalogItem.category;
        consumption[name].brand = catalogItem.brand;
      }
    });

    return Object.entries(consumption)
      .map(([name, data]) => ({
        name,
        ...data
      }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [supabaseServices, manualTransactions, inventory]);

  // Aggregate stats totals
  const totalValueInStock = inventory.reduce((sum, item) => sum + item.totalValue, 0);
  const totalExitedQty = rankingList.reduce((sum, item) => sum + item.quantity, 0);
  const totalExitedValue = rankingList.reduce((sum, item) => sum + item.value, 0);

  const totalEnteredQty = useMemo(() => {
    return manualTransactions
      .filter(t => t.type === 'ENTRADA')
      .reduce((sum, t) => sum + t.quantity, 0);
  }, [manualTransactions]);

  const totalEnteredValue = useMemo(() => {
    return manualTransactions
      .filter(t => t.type === 'ENTRADA')
      .reduce((sum, t) => sum + (t.quantity * t.unitPrice), 0);
  }, [manualTransactions]);

  // Handle Export to Multi-sheet Excel
  const exportExcel = () => {
    // A. Resumo Financeiro Mensal
    const summaryData = monthlyStats.map(stat => ({
      'Mês/Ano': stat.monthName,
      'Qtd. de Saídas': stat.outputsCount,
      'Valor Consumido (R$)': stat.outputsValue,
      'Qtd. de Entradas': stat.inputsCount,
      'Valor Abastecido (R$)': stat.inputsValue,
    }));

    // B. Ranking de Consumo
    const rankingData = rankingList.map((item, idx) => ({
      'Posição': idx + 1,
      'Nome da Peça': item.name,
      'Grupo / Categoria': item.category,
      'Marca': item.brand,
      'Quantidade Consumida': item.quantity,
      'Valor Gasto (R$)': item.value,
    }));

    // C. Tabela Completa de Movimentações
    const transactionsList: any[] = [];
    manualTransactions.forEach(t => {
      transactionsList.push({
        'Data / Hora': new Date(t.timestamp).toLocaleString('pt-BR'),
        'Tipo': t.type,
        'Nome da Peça': t.partDescription,
        'Quantidade': t.quantity,
        'Preço Unitário (R$)': t.unitPrice,
        'Valor Total (R$)': t.quantity * t.unitPrice,
        'Responsável': t.responsable,
        'Origem / Destino': 'LANÇAMENTO MANUAL',
        'Justificativa / Motivo': t.reason,
      });
    });

    supabaseServices.forEach(service => {
      let parts: SupabaseUsedPart[] = [];
      if (typeof service.usedParts === 'string') {
        try { parts = JSON.parse(service.usedParts); } catch (e) {}
      } else if (Array.isArray(service.usedParts)) {
        parts = service.usedParts;
      }
      parts.forEach(p => {
        const name = String(p.partName || p.keyword || '').toUpperCase();
        const qty = Number(p.quantity) || 1;
        const catalogItem = inventory.find(item => item.description === name.split('(')[0].trim());
        const price = catalogItem ? catalogItem.unitPrice : 0;
        
        transactionsList.push({
          'Data / Hora': service.exitDate || (service.endTime ? new Date(service.endTime).toLocaleString('pt-BR') : 'N/D'),
          'Tipo': 'SAIDA',
          'Nome da Peça': name,
          'Quantidade': qty,
          'Preço Unitário (R$)': price,
          'Valor Total (R$)': qty * price,
          'Responsável': String(p.mechanicName || 'MECÂNICO CMM').toUpperCase(),
          'Origem / Destino': `ORDEM DE SERVIÇO (${p.vehicleInfo || 'N/D'})`,
          'Justificativa / Motivo': `OS DETECTADA: "${p.detectedFrom || 'N/D'}"`,
        });
      });
    });

    const detailedData = transactionsList.sort((a, b) => {
      return b['Data / Hora'].localeCompare(a['Data / Hora']);
    });

    // D. Catálogo Atual com Valorização
    const catalogData = inventory.map(item => ({
      'Código Interno': item.id,
      'Descrição da Peça': item.description,
      'Categoria / Grupo': item.category,
      'Marca Aplicação': item.brand,
      'Modelo Aplicação': item.model,
      'Estoque Disponível': item.quantity,
      'Valor Unitário (R$)': item.unitPrice,
      'Valorização do Estoque (R$)': item.totalValue,
      'Status': item.quantity === 0 ? 'ZERADO' : item.isLowStock ? 'BAIXO ESTOQUE' : 'OK'
    }));

    // Create Sheets
    const wb = XLSX.utils.book_new();
    
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo Financeiro");

    const wsRanking = XLSX.utils.json_to_sheet(rankingData);
    XLSX.utils.book_append_sheet(wb, wsRanking, "Ranking de Consumo");

    const wsDetailed = XLSX.utils.json_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(wb, wsDetailed, "Histórico Completo");

    const wsCatalog = XLSX.utils.json_to_sheet(catalogData);
    XLSX.utils.book_append_sheet(wb, wsCatalog, "Estoque Atual");

    // Write file
    XLSX.writeFile(wb, `Relatorio_Estoque_CMM_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in printable-report">
      {/* Botões de Ações (Ocultados na Impressão) */}
      <div className="flex gap-4 no-print border-b border-zinc-900 pb-5">
        <button
          onClick={exportExcel}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 transition-all shadow"
        >
          <FileSpreadsheet className="w-4 h-4" /> Exportar para Excel (.xlsx)
        </button>
        <button
          onClick={handlePrint}
          className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white rounded text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 transition-all shadow"
        >
          <Printer className="w-4 h-4 text-amber-500" /> Imprimir Relatório Oficial (PDF)
        </button>
      </div>

      {/* Relatório Imprimível / Visualizável */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 space-y-8 print:bg-white print:border-none print:p-0">
        
        {/* Cabeçalho do Relatório (Layout Oficial de Comprovação) */}
        <div className="border-b border-zinc-850 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-black print:pb-4">
          <div>
            <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest print:text-zinc-600">
              MINISTÉRIO DA JUSTIÇA E SEGURANÇA PÚBLICA
            </span>
            <h2 className="text-xl font-black uppercase text-white tracking-tight mt-1 print:text-black">
              RELATÓRIO CONSOLIDADO DO ALMOXARIFADO CMM
            </h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1 print:text-zinc-500">
              Documento de Comprovação e Evolução de Consumo de Peças
            </p>
          </div>
          <div className="text-right font-mono text-[10px] text-zinc-400 print:text-black space-y-0.5">
            <p className="font-bold">DATA GERAÇÃO: {new Date().toLocaleDateString('pt-BR')}</p>
            <p>SISTEMA: CMM FLEET.PRO v2.0</p>
            <p className="text-amber-500 font-bold print:text-black">CONEXÃO: PLANILHA INTEGRADA + SUPABASE</p>
          </div>
        </div>

        {/* Informações de Embasamento Público */}
        <div className="bg-zinc-950/40 border border-zinc-850 p-5 rounded leading-relaxed text-xs text-zinc-400 print:bg-zinc-100 print:border-black print:text-black">
          <p className="font-bold text-white mb-2 print:text-black flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 print:text-black" />
            Declaração de Consistência e Finalidade Pública:
          </p>
          Este documento atesta a rastreabilidade e destinação final de todas as peças registradas no estoque CMM. Os dados consolidados de consumo (Saídas) provêm das ordens de serviço executadas na Linha Mecânica, Borracharia e Setor Técnico integradas eletronicamente via Supabase, bem como de ajustes manuais justificados, servindo de embasamento técnico e financeiro para processos licitatórios, auditorias e solicitações de orçamentos públicos.
        </div>

        {/* Resumo Consolidado (Cards compactados para impressão) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-zinc-950/50 border border-zinc-850 p-4 rounded print:border-black print:bg-white">
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Capital em Estoque Ativo</p>
            <p className="text-xl font-black mt-1 text-white print:text-black">{formatCurrency(totalValueInStock)}</p>
          </div>
          <div className="bg-zinc-950/50 border border-zinc-850 p-4 rounded print:border-black print:bg-white">
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Peças Consumidas (Saídas)</p>
            <p className="text-xl font-black mt-1 text-rose-400 print:text-black">{totalExitedQty} UN</p>
          </div>
          <div className="bg-zinc-950/50 border border-zinc-850 p-4 rounded print:border-black print:bg-white">
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Valor Consumido (Saídas)</p>
            <p className="text-xl font-black mt-1 text-rose-400 print:text-black">{formatCurrency(totalExitedValue)}</p>
          </div>
          <div className="bg-zinc-950/50 border border-zinc-850 p-4 rounded print:border-black print:bg-white">
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Peças Abastecidas (Entradas)</p>
            <p className="text-xl font-black mt-1 text-emerald-400 print:text-black">{totalEnteredQty} UN</p>
          </div>
        </div>

        {/* Evolução de Gastos Mensais */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-white tracking-widest border-b border-zinc-850 pb-1.5 print:text-black print:border-black">
            1. Histórico de Gastos e Movimentação Mensal
          </h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase print:border-black print:text-black">
                <th className="py-2">Mês / Ano</th>
                <th className="py-2 text-right">Saídas (Qtd)</th>
                <th className="py-2 text-right">Valor Gasto Gasto (R$)</th>
                <th className="py-2 text-right">Entradas (Qtd)</th>
                <th className="py-2 text-right">Valor Abastecido (R$)</th>
              </tr>
            </thead>
            <tbody>
              {monthlyStats.map((stat, idx) => (
                <tr key={idx} className="border-b border-zinc-850 hover:bg-zinc-950/20 print:border-zinc-300 print:text-black">
                  <td className="py-2.5 font-bold">{stat.monthName}</td>
                  <td className="py-2.5 text-right font-mono text-rose-400 print:text-black">{stat.outputsCount} UN</td>
                  <td className="py-2.5 text-right font-mono text-rose-400 print:text-black">{formatCurrency(stat.outputsValue)}</td>
                  <td className="py-2.5 text-right font-mono text-emerald-400 print:text-black">{stat.inputsCount} UN</td>
                  <td className="py-2.5 text-right font-mono text-emerald-400 print:text-black">{formatCurrency(stat.inputsValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ranking de Peças Mais Utilizadas (Saídas) */}
        <div className="space-y-4 page-break-before">
          <h3 className="text-xs font-black uppercase text-white tracking-widest border-b border-zinc-850 pb-1.5 print:text-black print:border-black">
            2. Peças Mais Utilizadas (Ranking de Consumo)
          </h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase print:border-black print:text-black">
                <th className="py-2 w-12">Pos.</th>
                <th className="py-2">Descrição da Peça</th>
                <th className="py-2">Grupo / Categoria</th>
                <th className="py-2">Marca</th>
                <th className="py-2 text-right">Qtd Consumida</th>
                <th className="py-2 text-right">Valor Consumido (R$)</th>
              </tr>
            </thead>
            <tbody>
              {rankingList.slice(0, 15).map((item, idx) => (
                <tr key={idx} className="border-b border-zinc-850 hover:bg-zinc-950/20 print:border-zinc-300 print:text-black">
                  <td className="py-2.5 font-mono font-bold text-zinc-500 print:text-black">#{idx + 1}</td>
                  <td className="py-2.5 font-bold uppercase">{item.name}</td>
                  <td className="py-2.5 text-zinc-400 uppercase print:text-black">{item.category}</td>
                  <td className="py-2.5 text-zinc-400 uppercase print:text-black">{item.brand !== 'N/D' ? item.brand : 'GENÉRICA'}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-white print:text-black">{item.quantity} UN</td>
                  <td className="py-2.5 text-right font-mono text-zinc-300 print:text-black">{formatCurrency(item.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Assinaturas Oficiais (Apenas na Impressão) */}
        <div className="hidden print:block pt-16 border-t border-dashed border-zinc-400 mt-16 text-xs text-black">
          <div className="grid grid-cols-2 gap-12 text-center">
            <div className="space-y-1">
              <div className="border-b border-black w-48 mx-auto h-6"></div>
              <p className="font-bold uppercase">Responsável pelo Almoxarifado</p>
              <p className="text-[10px] text-zinc-600">CMM Almoxarifado</p>
            </div>
            <div className="space-y-1">
              <div className="border-b border-black w-48 mx-auto h-6"></div>
              <p className="font-bold uppercase">Chefe do Setor de Transporte / OPM</p>
              <p className="text-[10px] text-zinc-600">Polícia Militar CMM</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
