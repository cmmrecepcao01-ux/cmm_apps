import React from 'react';
import { AlertOctagon, X, Package, ShieldAlert, Wrench } from 'lucide-react';
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

interface EssentialAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  criticalItems: FleetcomItem[];
  onOpenTransactionModal: (item: FleetcomItem) => void;
}

export const EssentialAlertModal: React.FC<EssentialAlertModalProps> = ({
  isOpen,
  onClose,
  criticalItems,
  onOpenTransactionModal,
}) => {
  if (!isOpen || criticalItems.length === 0) return null;

  // Group critical items by vehicle model for cleaner display
  const groupedItems = criticalItems.reduce((groups, item) => {
    let groupName = 'GERAL / MULTIUSO';
    const modelUpper = item.model.toUpperCase();
    const descUpper = item.description.toUpperCase();

    if (modelUpper.includes('SPIN') || descUpper.includes('SPIN')) {
      groupName = 'GM SPIN';
    } else if (modelUpper.includes('TRAILBLAZER') || descUpper.includes('TRAILBLAZER') || modelUpper.includes('TRAIL BLAZER')) {
      groupName = 'GM TRAILBLAZER';
    } else if (modelUpper.includes('S10') || modelUpper.includes('S-10') || descUpper.includes('S10') || descUpper.includes('S-10')) {
      groupName = 'GM S10';
    } else {
      groupName = 'VIATURAS (OUTRAS)';
    }

    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(item);
    return groups;
  }, {} as Record<string, FleetcomItem[]>);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-zinc-900 border border-rose-900/50 rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl shadow-rose-950/20 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-rose-950/30 border-b border-rose-900/40 p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded text-rose-500">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase text-white tracking-wider">Atenção: Estoque Crítico Viatura</h2>
              <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mt-0.5">
                Peças operacionais essenciais estão abaixo do limite!
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800 rounded hover:border-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          <div className="bg-rose-950/10 border border-rose-900/20 rounded p-4 text-xs font-bold text-rose-300 leading-relaxed">
            Abaixo estão listadas as peças essenciais (Baterias, Discos, Pastilhas, Arrefecimento, Óleo e Pneus) para os veículos <strong>Trailblazer, Spin e S10</strong> que se encontram em níveis baixos de estoque.
          </div>

          <div className="space-y-6">
            {Object.entries(groupedItems).map(([group, items]) => (
              <div key={group} className="space-y-2">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black uppercase text-white tracking-widest">{group}</span>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase ml-auto">({items.length} itens)</span>
                </div>
                
                <div className="space-y-1.5">
                  {items.map(item => {
                    const isZero = item.quantity === 0;
                    return (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-zinc-950/60 border border-zinc-900 rounded hover:border-zinc-800 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <Package className={`w-4 h-4 shrink-0 ${isZero ? 'text-rose-500' : 'text-amber-500'}`} />
                          <div>
                            <p className="text-xs font-bold uppercase text-white group-hover:text-amber-500 transition-colors">
                              {item.description}
                            </p>
                            <p className="text-[9px] text-zinc-500 uppercase font-bold mt-0.5">
                              CÓD: <span className="font-mono text-zinc-400">{item.id}</span> {item.brand !== 'N/D' ? `• Marca: ${item.brand}` : ''} {item.model !== 'N/D' ? `• Aplicação: ${item.model}` : ''}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className={`text-xs font-mono font-black ${isZero ? 'text-rose-500' : 'text-amber-500'}`}>
                            {item.quantity} UN
                          </span>
                          <button
                            onClick={() => {
                              onOpenTransactionModal(item);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 bg-zinc-900 hover:bg-amber-500 hover:text-black border border-zinc-800 text-[8px] font-black uppercase text-zinc-400 rounded transition-all flex items-center gap-1"
                          >
                            <Wrench className="w-3 h-3" /> Abastecer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-950 border-t border-zinc-850 p-6 flex justify-end shrink-0 gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs font-black uppercase text-white tracking-widest transition-all"
          >
            Fechar Alerta
          </button>
        </div>
      </div>
    </div>
  );
};
