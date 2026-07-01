import React, { useState } from 'react';
import { PlusCircle, MinusCircle, History, User, Trash2, Calendar, FileText } from 'lucide-react';
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

export interface ManualTransaction {
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

interface StockManagerProps {
  inventory: FleetcomItem[];
  manualTransactions: ManualTransaction[];
  onAddTransaction: (transaction: Omit<ManualTransaction, 'id' | 'timestamp'>) => void;
  onClearTransactions: () => void;
  onDeleteTransaction: (id: string) => void;
  selectedPartForQuickAction?: FleetcomItem | null;
  clearQuickActionPart?: () => void;
}

export const StockManager: React.FC<StockManagerProps> = ({
  inventory,
  manualTransactions,
  onAddTransaction,
  onClearTransactions,
  onDeleteTransaction,
  selectedPartForQuickAction = null,
  clearQuickActionPart,
}) => {
  const [type, setType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [partId, setPartId] = useState(selectedPartForQuickAction?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [responsable, setResponsable] = useState('');
  const [reason, setReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-selected part helper
  const selectedPart = inventory.find(p => p.id === partId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partId || quantity <= 0 || !responsable.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (!selectedPart) {
      alert("Peça inválida ou não selecionada.");
      return;
    }

    // Double check exits
    if (type === 'SAIDA' && selectedPart.quantity < quantity) {
      const confirmForce = window.confirm(`Atenção: A quantidade de saída (${quantity} UN) é maior que o estoque atual (${selectedPart.quantity} UN). Deseja continuar com estoque negativo local?`);
      if (!confirmForce) return;
    }

    onAddTransaction({
      type,
      partId,
      partDescription: selectedPart.description,
      quantity,
      unitPrice: selectedPart.unitPrice,
      responsable: responsable.toUpperCase().trim(),
      reason: reason.toUpperCase().trim() || (type === 'ENTRADA' ? 'ABASTECIMENTO MANUAL' : 'CONSUMO MANUAL'),
    });

    // Reset Form
    setQuantity(1);
    setReason('');
    setSuccessMsg(`Lançamento de ${type} registrado com sucesso!`);
    setTimeout(() => setSuccessMsg(''), 3000);

    if (clearQuickActionPart) {
      clearQuickActionPart();
    }
  };

  const handleSelectQuickPart = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPartId(e.target.value);
    if (clearQuickActionPart) clearQuickActionPart();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Formulário de Lançamento (Col 1) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="border-b border-zinc-850 pb-3">
            <h3 className="text-sm font-black uppercase text-white tracking-wider">Registrar Movimentação</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
              Adicione estoque ou registre saídas manuais
            </p>
          </div>

          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-400 p-3 rounded text-xs font-bold text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Toggle Tipo */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('ENTRADA')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded text-[10px] font-black uppercase tracking-wider border transition-all ${
                  type === 'ENTRADA'
                    ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" /> Entrada / Abastecer
              </button>
              <button
                type="button"
                onClick={() => setType('SAIDA')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded text-[10px] font-black uppercase tracking-wider border transition-all ${
                  type === 'SAIDA'
                    ? 'bg-rose-600 border-rose-600 text-white font-bold'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-white'
                }`}
              >
                <MinusCircle className="w-4 h-4" /> Saída / Consumo
              </button>
            </div>

            {/* Peça */}
            <div className="flex flex-col">
              <label className="text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Selecionar Peça*</label>
              <select
                value={partId}
                onChange={handleSelectQuickPart}
                className="w-full bg-zinc-950 border border-zinc-850 text-white px-3 py-2.5 text-xs font-bold uppercase rounded focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
                required
              >
                <option value="">-- SELECIONE UMA PEÇA DO CATÁLOGO --</option>
                {inventory.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.description} ({p.brand !== 'N/D' ? p.brand : 'GENÉRICA'}) - STOCK: {p.quantity} UN
                  </option>
                ))}
              </select>
            </div>

            {/* Preview Detalhes Peça Selecionada */}
            {selectedPart && (
              <div className="bg-zinc-950/40 border border-zinc-850 rounded p-3 text-[10px] text-zinc-400 space-y-1">
                <p><span className="font-bold text-zinc-500">CÓDIGO:</span> <span className="font-mono text-zinc-300">{selectedPart.id}</span></p>
                <p><span className="font-bold text-zinc-500">ESTOQUE ATUAL:</span> <span className="font-bold text-white">{selectedPart.quantity} UN</span></p>
                <p><span className="font-bold text-zinc-500">PREÇO UNITÁRIO:</span> <span className="text-zinc-300">{formatCurrency(selectedPart.unitPrice)}</span></p>
                <p><span className="font-bold text-zinc-500 font-sans">VALOR TOTAL DO ITEM:</span> <span className="text-zinc-300">{formatCurrency(selectedPart.totalValue)}</span></p>
              </div>
            )}

            {/* Quantidade */}
            <div className="flex flex-col">
              <label className="text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Quantidade*</label>
              <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-850 rounded">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 text-lg font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-transparent text-center text-white font-mono font-bold text-sm focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Responsável */}
            <div className="flex flex-col">
              <label className="text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Responsável (Nome/Patente)*</label>
              <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2.5 border border-zinc-850 rounded focus-within:border-amber-500">
                <User className="w-4 h-4 text-zinc-600 shrink-0" />
                <input
                  type="text"
                  placeholder="EX: SGT REIS, MEC. CARLOS"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full uppercase placeholder:text-zinc-700 text-white font-bold"
                  required
                />
              </div>
            </div>

            {/* Motivo / Descrição */}
            <div className="flex flex-col">
              <label className="text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Motivo / Descrição / Observação</label>
              <div className="flex items-start gap-2 bg-zinc-950 px-3 py-2.5 border border-zinc-850 rounded focus-within:border-amber-500">
                <FileText className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                <textarea
                  placeholder="EX: COMPRA NF 98234, DESCARTE DE PEÇA DANIFICADA"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="bg-transparent border-none outline-none text-xs w-full uppercase placeholder:text-zinc-700 text-white font-bold resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 mt-4 text-[10px] font-black uppercase tracking-widest text-black rounded transition-all shadow-md ${
                type === 'ENTRADA' 
                  ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-950/20' 
                  : 'bg-rose-500 hover:bg-rose-400 shadow-rose-950/20'
              }`}
            >
              Registrar {type}
            </button>
          </form>
        </div>
      </div>

      {/* Histórico de Lançamentos Manuais (Col 2 & 3) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 lg:col-span-2 flex flex-col h-[520px]">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-black uppercase text-white">Lançamentos Manuais Recentes</h3>
          </div>
          {manualTransactions.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Atenção: Isso irá apagar todos os lançamentos manuais salvos localmente e restaurar os estoques originais da planilha. Deseja prosseguir?")) {
                  onClearTransactions();
                }
              }}
              className="text-[9px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-wider"
            >
              Apagar Histórico
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
          {manualTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-3">
              <History className="w-10 h-10 text-zinc-750" />
              <p className="text-xs uppercase font-black tracking-widest">Nenhuma movimentação manual registrada localmente.</p>
            </div>
          ) : (
            manualTransactions.map(stat => {
              const totalVal = stat.quantity * stat.unitPrice;
              const isEntrada = stat.type === 'ENTRADA';

              return (
                <div 
                  key={stat.id} 
                  className="p-3 bg-zinc-950/40 border border-zinc-900 rounded hover:border-zinc-800 transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3">
                    {/* Badge tipo */}
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase shrink-0 ${
                      isEntrada 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {stat.type}
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase text-white">
                        {stat.partDescription}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 text-[9px] text-zinc-500 font-bold mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-zinc-600" /> {stat.responsable}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-zinc-600" /> {new Date(stat.timestamp).toLocaleString('pt-BR')}
                        </span>
                        <span>•</span>
                        <span className="text-zinc-400 italic">"{stat.reason}"</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className={`block text-xs font-mono font-black ${isEntrada ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isEntrada ? '+' : '-'}{stat.quantity} UN
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 block">
                        {formatCurrency(totalVal)}
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteTransaction(stat.id)}
                      className="p-1.5 text-zinc-700 hover:text-rose-500 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="Excluir Lançamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
