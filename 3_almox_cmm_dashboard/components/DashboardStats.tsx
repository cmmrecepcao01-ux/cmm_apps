import React from 'react';
import { Package, BarChart3, TrendingUp, AlertTriangle, Car, Truck, CircleDot, Archive } from 'lucide-react';
import { formatCurrency } from '../utils';

interface StatsGroup {
  count: number;
  qty: number;
  value: number;
}

interface DashboardStatsProps {
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  zeroStockItems: number;
  lowStockItemsCount: number;
  categorizedData: {
    LEVES: StatsGroup;
    MOTOS: StatsGroup;
    PESADOS: StatsGroup;
    GERAL: StatsGroup;
  };
  monthlyStats: {
    monthName: string;
    outputsCount: number;
    outputsValue: number;
    inputsCount: number;
    inputsValue: number;
  }[];
  onNavigateToCatalog: (categoryFilter?: string, vehicleTypeFilter?: string) => void;
  onNavigateToAlerts: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalItems,
  totalQuantity,
  totalValue,
  zeroStockItems,
  lowStockItemsCount,
  categorizedData,
  monthlyStats,
  onNavigateToCatalog,
  onNavigateToAlerts,
}) => {
  // Find highest output value for chart scaling
  const maxOutputVal = Math.max(...monthlyStats.map(s => s.outputsValue), 1000);
  const maxOperationsCount = Math.max(...monthlyStats.map(s => s.outputsCount + s.inputsCount), 10);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 4 Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg hover:border-zinc-700 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Financeiro
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Capital em Estoque</p>
          <p className="text-3xl font-black mt-1 text-white tracking-tight">
            {formatCurrency(totalValue)}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg hover:border-zinc-700 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1 w-full bg-amber-500"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/10 rounded border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <Archive className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              Catálogo
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Tipos de Peças</p>
          <p className="text-3xl font-black mt-1 text-white tracking-tight">
            {totalItems} <span className="text-sm font-medium text-zinc-500">SKUs</span>
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg hover:border-zinc-700 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1 w-full bg-purple-500"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
              Físico
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total em Físico</p>
          <p className="text-3xl font-black mt-1 text-white tracking-tight">
            {totalQuantity.toLocaleString('pt-BR')} <span className="text-sm font-medium text-zinc-500">UN</span>
          </p>
        </div>

        <div 
          onClick={onNavigateToAlerts}
          className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg hover:border-rose-800/80 cursor-pointer transition-colors relative overflow-hidden group"
        >
          <div className={`absolute top-0 left-0 h-1 w-full ${lowStockItemsCount > 0 ? 'bg-rose-600' : 'bg-emerald-500'}`}></div>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded border transition-transform group-hover:scale-110 ${
              lowStockItemsCount > 0 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
              lowStockItemsCount > 0 
                ? 'bg-rose-500/10 text-rose-500' 
                : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {lowStockItemsCount > 0 ? 'Crítico' : 'Estável'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Itens c/ Estoque Baixo</p>
          <p className="text-3xl font-black mt-1 text-white tracking-tight">
            {lowStockItemsCount} <span className="text-sm font-medium text-zinc-500">peças</span>
          </p>
        </div>
      </div>

      {/* Volumetria por Tipo de Veículo (Semelhante à Foto 2) */}
      <div>
        <div className="flex items-center justify-between mb-4 border-l-4 border-amber-500 pl-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-300">
            Volumetria por Tipo de Veículo (Estoque Disponível)
          </h2>
          <span className="text-[10px] text-zinc-500 font-bold uppercase">Clique no card para filtrar a lista</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Card VTR LEVES */}
          <div 
            onClick={() => onNavigateToCatalog(undefined, 'LEVES')}
            className="bg-zinc-900 border border-zinc-800/80 hover:border-emerald-500/50 hover:bg-zinc-900/60 cursor-pointer p-6 rounded-lg transition-all relative group"
          >
            <div className="absolute top-0 left-0 h-full w-1 bg-emerald-500"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">VTR LEVES</span>
              <Car className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-4xl font-black text-white">{categorizedData.LEVES.qty} <span className="text-xs font-normal text-zinc-500">UN</span></p>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800/50 text-[10px] text-zinc-500 font-bold">
              <span>{categorizedData.LEVES.count} TIPOS</span>
              <span className="text-emerald-400">{formatCurrency(categorizedData.LEVES.value)}</span>
            </div>
          </div>

          {/* Card MOTOS */}
          <div 
            onClick={() => onNavigateToCatalog(undefined, 'MOTOS')}
            className="bg-zinc-900 border border-zinc-800/80 hover:border-purple-500/50 hover:bg-zinc-900/60 cursor-pointer p-6 rounded-lg transition-all relative group"
          >
            <div className="absolute top-0 left-0 h-full w-1 bg-purple-500"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">MOTOS</span>
              {/* Moto icon placeholder or standard Lucide icon - Truck with small modifications, we can use CircleDot for moto style wheels or custom inline SVG */}
              <svg className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="5" cy="18" r="3" />
                <circle cx="19" cy="18" r="3" />
                <path d="M12 18V10h3M5 18l3-9 4 1" />
              </svg>
            </div>
            <p className="text-4xl font-black text-white">{categorizedData.MOTOS.qty} <span className="text-xs font-normal text-zinc-500">UN</span></p>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800/50 text-[10px] text-zinc-500 font-bold">
              <span>{categorizedData.MOTOS.count} TIPOS</span>
              <span className="text-purple-400">{formatCurrency(categorizedData.MOTOS.value)}</span>
            </div>
          </div>

          {/* Card PESADOS */}
          <div 
            onClick={() => onNavigateToCatalog(undefined, 'PESADOS')}
            className="bg-zinc-900 border border-zinc-800/80 hover:border-violet-500/50 hover:bg-zinc-900/60 cursor-pointer p-6 rounded-lg transition-all relative group"
          >
            <div className="absolute top-0 left-0 h-full w-1 bg-violet-500"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">PESADOS</span>
              <Truck className="w-5 h-5 text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-4xl font-black text-white">{categorizedData.PESADOS.qty} <span className="text-xs font-normal text-zinc-500">UN</span></p>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800/50 text-[10px] text-zinc-500 font-bold">
              <span>{categorizedData.PESADOS.count} TIPOS</span>
              <span className="text-violet-400">{formatCurrency(categorizedData.PESADOS.value)}</span>
            </div>
          </div>

          {/* Card GERAL */}
          <div 
            onClick={() => onNavigateToCatalog(undefined, 'GERAL')}
            className="bg-zinc-900 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900/60 cursor-pointer p-6 rounded-lg transition-all relative group"
          >
            <div className="absolute top-0 left-0 h-full w-1 bg-zinc-600"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">GERAL / MULTIUSO</span>
              <CircleDot className="w-5 h-5 text-zinc-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-4xl font-black text-white">{categorizedData.GERAL.qty} <span className="text-xs font-normal text-zinc-500">UN</span></p>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800/50 text-[10px] text-zinc-500 font-bold">
              <span>{categorizedData.GERAL.count} TIPOS</span>
              <span className="text-zinc-400">{formatCurrency(categorizedData.GERAL.value)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos / Análise Gráfica Geral (No Estilo do Manfrota) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico 1: Consumo e Lançamentos Mensais (Coluna 1 & 2) */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg lg:col-span-2 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-3">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-black uppercase text-white">Evolução Mensal de Movimentações (2026)</h3>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-4 px-4 py-2">
            {monthlyStats.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
                Sem registros de movimentações neste período
              </div>
            ) : (
              monthlyStats.map((stat, idx) => {
                const totalOps = stat.outputsCount + stat.inputsCount;
                const outputHeight = totalOps > 0 ? (stat.outputsCount / maxOperationsCount) * 100 : 0;
                const inputHeight = totalOps > 0 ? (stat.inputsCount / maxOperationsCount) * 100 : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 bg-zinc-950 border border-zinc-800 rounded p-2 text-[10px] absolute mb-40 transition-opacity z-10 pointer-events-none text-zinc-400 font-mono shadow-2xl">
                      <p className="font-bold text-white uppercase text-center mb-1">{stat.monthName}</p>
                      <p className="text-rose-500">Saídas: {stat.outputsCount} itens ({formatCurrency(stat.outputsValue)})</p>
                      <p className="text-emerald-500">Entradas: {stat.inputsCount} itens ({formatCurrency(stat.inputsValue)})</p>
                    </div>

                    {/* Bars */}
                    <div className="w-full flex gap-1.5 items-end h-[240px] px-1 relative">
                      {/* Saídas Bar (Red) */}
                      <div 
                        style={{ height: `${Math.max(outputHeight, 2)}%` }} 
                        className="flex-1 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-sm hover:from-rose-500 hover:to-rose-300 transition-all cursor-pointer relative"
                      >
                        {stat.outputsCount > 0 && (
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-rose-500 font-mono">
                            {stat.outputsCount}
                          </span>
                        )}
                      </div>
                      {/* Entradas Bar (Green) */}
                      <div 
                        style={{ height: `${Math.max(inputHeight, 2)}%` }} 
                        className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm hover:from-emerald-500 hover:to-emerald-300 transition-all cursor-pointer relative"
                      >
                        {stat.inputsCount > 0 && (
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-500 font-mono">
                            {stat.inputsCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-zinc-500 font-bold uppercase mt-3 tracking-wider">
                      {stat.monthName}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="flex gap-6 mt-4 border-t border-zinc-800/50 pt-4 justify-center text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-rose-500 rounded-sm"></span>
              <span>Saídas (Peças Consumidas)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
              <span>Entradas (Estoque Adicionado)</span>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Distribuição de Capital por Veículo (Donut/Pie Chart de Donas) */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-3">
            <CircleDot className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-black uppercase text-white">Distribuição do Valor do Estoque</h3>
          </div>

          <div className="flex-1 flex items-center justify-center relative">
            {totalValue === 0 ? (
              <span className="text-zinc-600 text-xs font-bold uppercase">Sem valor de estoque</span>
            ) : (
              <div className="w-48 h-48 relative flex items-center justify-center">
                {/* SVG Donut Chart */}
                <svg className="w-full h-full transform -rotate-95" viewBox="0 0 42 42">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#27272a" strokeWidth="4"></circle>
                  
                  {(() => {
                    const lPerc = (categorizedData.LEVES.value / totalValue) * 100;
                    const mPerc = (categorizedData.MOTOS.value / totalValue) * 100;
                    const pPerc = (categorizedData.PESADOS.value / totalValue) * 100;
                    const gPerc = (categorizedData.GERAL.value / totalValue) * 100;

                    let offset = 0;
                    const segments = [
                      { perc: lPerc, color: '#10b981' }, // Leves (Emerald)
                      { segments: 'MOTOS', perc: mPerc, color: '#a855f7' }, // Motos (Purple)
                      { segments: 'PESADOS', perc: pPerc, color: '#8b5cf6' }, // Pesados (Violet)
                      { segments: 'GERAL', perc: gPerc, color: '#71717a' }  // Geral (Zinc)
                    ];

                    return segments.map((seg, i) => {
                      if (seg.perc === 0) return null;
                      const strokeDash = `${seg.perc} ${100 - seg.perc}`;
                      const currentOffset = offset;
                      offset += seg.perc;

                      return (
                        <circle
                          key={i}
                          cx="21"
                          cy="21"
                          r="15.915"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="4.2"
                          strokeDasharray={strokeDash}
                          strokeDashoffset={100 - currentOffset}
                        ></circle>
                      );
                    });
                  })()}
                </svg>
                
                {/* Donut Center */}
                <div className="absolute w-32 h-32 bg-zinc-900 rounded-full border border-zinc-800/80 flex flex-col items-center justify-center text-center p-2">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Total Geral</span>
                  <span className="text-base font-black text-white tracking-tight">{formatCurrency(totalValue)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Legenda */}
          <div className="grid grid-cols-2 gap-3 mt-4 border-t border-zinc-800/50 pt-4 text-[9px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0"></span>
              <span className="truncate">Leves ({Math.round((categorizedData.LEVES.value / (totalValue || 1)) * 100)}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2 h-2 bg-purple-500 rounded-full shrink-0"></span>
              <span className="truncate">Motos ({Math.round((categorizedData.MOTOS.value / (totalValue || 1)) * 100)}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-violet-400">
              <span className="w-2 h-2 bg-violet-500 rounded-full shrink-0"></span>
              <span className="truncate">Pesados ({Math.round((categorizedData.PESADOS.value / (totalValue || 1)) * 100)}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 bg-zinc-500 rounded-full shrink-0"></span>
              <span className="truncate">Geral ({Math.round((categorizedData.GERAL.value / (totalValue || 1)) * 100)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
