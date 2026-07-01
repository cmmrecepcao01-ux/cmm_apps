import React, { useState } from 'react';
import { AlertTriangle, Package, CircleAlert, Sparkles, Ban } from 'lucide-react';
import { formatCurrency } from '../utils';

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

interface LowStockAlertsProps {
  inventory: FleetcomItem[];
  tiresTotal: number;
  batteriesTotal: number;
  brakePadsTotal: number;
  onOpenTransactionModal: (item: FleetcomItem) => void;
}

export const LowStockAlerts: React.FC<LowStockAlertsProps> = ({
  inventory,
  tiresTotal,
  batteriesTotal,
  brakePadsTotal,
  onOpenTransactionModal,
}) => {
  const [activeTab, setActiveTab] = useState<'ZERO' | 'LOW'>('ZERO');

  // Aggregated thresholds
  const TIRES_LIMIT = 50;
  const BATTERIES_LIMIT = 30;
  const BRAKE_PADS_LIMIT = 60;

  const isTiresLow = tiresTotal < TIRES_LIMIT;
  const isBatteriesLow = batteriesTotal < BATTERIES_LIMIT;
  const isBrakePadsLow = brakePadsTotal < BRAKE_PADS_LIMIT;

  // Filter individual pieces
  const zeroStockItems = inventory.filter(item => item.quantity === 0);
  const lowStockItems = inventory.filter(item => item.quantity > 0 && item.isLowStock);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Seção de Alertas Agregados (Regras do Negócio) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
        <div className="border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Alertas de Estoque Mínimo Agregados
          </h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
            Limites críticos globais definidos para pneus, baterias e pastilhas de freio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Alerta Pneus */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 p-5 rounded-lg flex flex-col justify-between relative overflow-hidden">
            <div className={`absolute top-0 left-0 h-1 w-full ${isTiresLow ? 'bg-rose-600' : 'bg-emerald-500'}`}></div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">PNEUS EM GERAL</span>
                <p className="text-2xl font-black mt-1 text-white">{tiresTotal} UN</p>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                isTiresLow ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {isTiresLow ? 'Estoque Baixo' : 'Estoque Saudável'}
              </span>
            </div>
            
            <div className="space-y-1.5 mt-2">
              <div className="flex justify-between text-[9px] font-bold text-zinc-400">
                <span>PROGRESSO ATÉ O MÍNIMO ({TIRES_LIMIT} UN)</span>
                <span>{Math.min(Math.round((tiresTotal / TIRES_LIMIT) * 100), 100)}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  style={{ width: `${Math.min((tiresTotal / TIRES_LIMIT) * 100), 100}%` }}
                  className={`h-full rounded-full transition-all ${isTiresLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                ></div>
              </div>
            </div>
          </div>

          {/* Card Alerta Baterias */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 p-5 rounded-lg flex flex-col justify-between relative overflow-hidden">
            <div className={`absolute top-0 left-0 h-1 w-full ${isBatteriesLow ? 'bg-rose-600' : 'bg-emerald-500'}`}></div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">BATERIAS EM GERAL</span>
                <p className="text-2xl font-black mt-1 text-white">{batteriesTotal} UN</p>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                isBatteriesLow ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {isBatteriesLow ? 'Estoque Baixo' : 'Estoque Saudável'}
              </span>
            </div>

            <div className="space-y-1.5 mt-2">
              <div className="flex justify-between text-[9px] font-bold text-zinc-400">
                <span>PROGRESSO ATÉ O MÍNIMO ({BATTERIES_LIMIT} UN)</span>
                <span>{Math.min(Math.round((batteriesTotal / BATTERIES_LIMIT) * 100), 100)}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  style={{ width: `${Math.min((batteriesTotal / BATTERIES_LIMIT) * 100), 100}%` }}
                  className={`h-full rounded-full transition-all ${isBatteriesLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                ></div>
              </div>
            </div>
          </div>

          {/* Card Alerta Pastilhas */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 p-5 rounded-lg flex flex-col justify-between relative overflow-hidden">
            <div className={`absolute top-0 left-0 h-1 w-full ${isBrakePadsLow ? 'bg-rose-600' : 'bg-emerald-500'}`}></div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">PASTILHAS DE FREIO</span>
                <p className="text-2xl font-black mt-1 text-white">{brakePadsTotal} UN</p>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                isBrakePadsLow ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {isBrakePadsLow ? 'Estoque Baixo' : 'Estoque Saudável'}
              </span>
            </div>

            <div className="space-y-1.5 mt-2">
              <div className="flex justify-between text-[9px] font-bold text-zinc-400">
                <span>PROGRESSO ATÉ O MÍNIMO ({BRAKE_PADS_LIMIT} UN)</span>
                <span>{Math.min(Math.round((brakePadsTotal / BRAKE_PADS_LIMIT) * 100), 100)}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  style={{ width: `${Math.min((brakePadsTotal / BRAKE_PADS_LIMIT) * 100), 100}%` }}
                  className={`h-full rounded-full transition-all ${isBrakePadsLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Seção de Alertas Individuais (Listagem de Peças Críticas/Zeradas) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col h-[500px]">
        <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <CircleAlert className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-black uppercase text-white">Alertas Individuais de Peças</h3>
          </div>
          <div className="flex bg-zinc-950 p-1 border border-zinc-800 rounded gap-1">
            <button
              onClick={() => setActiveTab('ZERO')}
              className={`px-3 py-1 text-[10px] font-black uppercase rounded transition-all ${
                activeTab === 'ZERO' ? 'bg-rose-600 text-white shadow' : 'text-zinc-500 hover:text-white'
              }`}
            >
              Zeradas ({zeroStockItems.length})
            </button>
            <button
              onClick={() => setActiveTab('LOW')}
              className={`px-3 py-1 text-[10px] font-black uppercase rounded transition-all ${
                activeTab === 'LOW' ? 'bg-amber-500 text-black shadow' : 'text-zinc-500 hover:text-white'
              }`}
            >
              Baixo Estoque ({lowStockItems.length})
            </button>
          </div>
        </div>

        {/* Listagem */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
          {activeTab === 'ZERO' ? (
            zeroStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
                <Sparkles className="w-10 h-10 text-emerald-500" />
                <p className="text-xs uppercase font-black tracking-widest text-emerald-500">
                  Parabéns! Nenhuma peça com estoque zerado no momento.
                </p>
              </div>
            ) : (
              zeroStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-900 rounded hover:border-rose-900/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-rose-950/20 text-rose-500 border border-rose-900/30 flex items-center justify-center shrink-0">
                      <Ban className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-white group-hover:text-amber-500 transition-colors">
                        {item.description}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                        {item.category} • {item.brand !== 'N/D' ? item.brand : 'Genérico'} {item.model !== 'N/D' ? `• ${item.model}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="block text-sm font-mono font-black text-rose-500">0 UN</span>
                      <span className="text-[8px] font-mono text-zinc-600 uppercase">UN: {formatCurrency(item.unitPrice)}</span>
                    </div>
                    <button
                      onClick={() => onOpenTransactionModal(item)}
                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-rose-600 hover:text-white border border-zinc-800 text-[9px] font-black uppercase text-zinc-400 rounded transition-all"
                    >
                      + Abastecer
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
                <Sparkles className="w-10 h-10 text-emerald-500" />
                <p className="text-xs uppercase font-black tracking-widest text-emerald-500">
                  Tudo certo! Nenhuma peça individual com estoque baixo.
                </p>
              </div>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-900 rounded hover:border-amber-900/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-amber-950/20 text-amber-500 border border-amber-900/30 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-white group-hover:text-amber-500 transition-colors">
                        {item.description}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                        {item.category} • {item.brand !== 'N/D' ? item.brand : 'Genérico'} {item.model !== 'N/D' ? `• ${item.model}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="block text-sm font-mono font-black text-amber-500">{item.quantity} UN</span>
                      <span className="text-[8px] font-mono text-zinc-600 uppercase">UN: {formatCurrency(item.unitPrice)}</span>
                    </div>
                    <button
                      onClick={() => onOpenTransactionModal(item)}
                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-amber-500 hover:text-black border border-zinc-800 text-[9px] font-black uppercase text-zinc-400 rounded transition-all"
                    >
                      + Abastecer
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
