import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, ArrowUpDown, ChevronDown, CheckCircle, AlertTriangle, X, Package } from 'lucide-react';
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

interface InventoryListProps {
  inventory: FleetcomItem[];
  loading: boolean;
  onOpenTransactionModal: (item: FleetcomItem) => void;
  initialVehicleTypeFilter?: string;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  inventory,
  loading,
  onOpenTransactionModal,
  initialVehicleTypeFilter = 'TODOS',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>(initialVehicleTypeFilter);
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [selectedBrand, setSelectedBrand] = useState('TODAS');
  const [selectedStockStatus, setSelectedStockStatus] = useState('TODOS');
  const [sortBy, setSortBy] = useState<'qty-desc' | 'qty-asc' | 'alpha' | 'val-desc'>('qty-desc');

  // Dynamic filter values
  const categories = useMemo(() => {
    const list = new Set<string>();
    inventory.forEach(item => {
      if (item.category) list.add(item.category);
    });
    return ['TODAS', ...Array.from(list).sort()];
  }, [inventory]);

  const brands = useMemo(() => {
    const list = new Set<string>();
    inventory.forEach(item => {
      if (item.brand && item.brand !== 'N/D') list.add(item.brand);
    });
    return ['TODAS', ...Array.from(list).sort()];
  }, [inventory]);

  // Filter implementation
  const filteredItems = useMemo(() => {
    let items = inventory.filter(item => {
      if (!item) return false;
      
      // 1. Text Search
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !searchLower ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.id && item.id.toLowerCase().includes(searchLower)) ||
        (item.brand && item.brand.toLowerCase().includes(searchLower)) ||
        (item.model && item.model.toLowerCase().includes(searchLower)) ||
        (item.category && item.category.toLowerCase().includes(searchLower));

      // 2. Vehicle Type Filter
      const matchesVehicle = 
        vehicleTypeFilter === 'TODOS' || 
        item.vehicleType === vehicleTypeFilter;

      // 3. Category Filter
      const matchesCategory = 
        selectedCategory === 'TODAS' || 
        item.category === selectedCategory;

      // 4. Brand Filter
      const matchesBrand = 
        selectedBrand === 'TODAS' || 
        item.brand === selectedBrand;

      // 5. Stock Status
      let matchesStock = true;
      if (selectedStockStatus === 'EM_ESTOQUE') {
        matchesStock = item.quantity > 0;
      } else if (selectedStockStatus === 'ZERADO') {
        matchesStock = item.quantity === 0;
      } else if (selectedStockStatus === 'BAIXO') {
        matchesStock = item.isLowStock;
      }

      return matchesSearch && matchesVehicle && matchesCategory && matchesBrand && matchesStock;
    });

    // Sort implementation
    return items.sort((a, b) => {
      if (!a || !b) return 0;
      if (sortBy === 'qty-desc') return (b.quantity || 0) - (a.quantity || 0);
      if (sortBy === 'qty-asc') return (a.quantity || 0) - (b.quantity || 0);
      if (sortBy === 'val-desc') return (b.totalValue || 0) - (a.totalValue || 0);
      const descA = a.description || '';
      const descB = b.description || '';
      return descA.localeCompare(descB);
    });
  }, [inventory, searchQuery, vehicleTypeFilter, selectedCategory, selectedBrand, selectedStockStatus, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setVehicleTypeFilter('TODOS');
    setSelectedCategory('TODAS');
    setSelectedBrand('TODAS');
    setSelectedStockStatus('TODOS');
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6 animate-fade-in">
      {/* Header com totalizadores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-black uppercase text-white tracking-tight">Catálogo Geral de Peças</h3>
          <p className="text-xs text-zinc-500 font-bold uppercase mt-1">
            Pesquise quais e quantas peças existem e filtre por veículos
          </p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded">
          {filteredItems.length} de {inventory.length} SKUs listados
        </span>
      </div>

      {/* Controles de Filtros e Busca */}
      <div className="space-y-4 bg-zinc-950/40 p-4 border border-zinc-800/60 rounded">
        {/* Barra de Busca por Texto */}
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-3 bg-zinc-950 px-4 py-2.5 rounded border border-zinc-800 focus-within:border-amber-500 transition-colors">
            <Search className="w-4 h-4 text-zinc-500 shrink-0" />
            <input
              type="text"
              placeholder="DIGITE O NOME, CÓDIGO DA PEÇA, VEÍCULO OU MARCA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full uppercase placeholder:text-zinc-600 text-white font-bold"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white shrink-0">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {(searchQuery || vehicleTypeFilter !== 'TODOS' || selectedCategory !== 'TODAS' || selectedBrand !== 'TODAS' || selectedStockStatus !== 'TODOS') && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-[10px] font-black uppercase rounded text-zinc-400 hover:text-white transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Abas Rápidas de Tipo de Veículo (Função Primordial) */}
        <div>
          <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-2">
            Filtrar por Veículo (Função Primordial):
          </span>
          <div className="flex flex-wrap gap-2">
            {['TODOS', 'LEVES', 'MOTOS', 'PESADOS', 'GERAL'].map(type => (
              <button
                key={type}
                onClick={() => setVehicleTypeFilter(type)}
                className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest border transition-all ${
                  vehicleTypeFilter === type
                    ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/10'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {type === 'TODOS' ? 'TODOS OS VEÍCULOS' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns Adicionais (Categoria, Marca, Status e Ordenação) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          {/* Categoria */}
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Categoria (Grupo):</span>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-2 text-[10px] font-bold uppercase rounded focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Marca */}
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Marca Aplicação:</span>
            <div className="relative">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-2 text-[10px] font-bold uppercase rounded focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
              >
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Status Estoque */}
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Status Estoque:</span>
            <div className="relative">
              <select
                value={selectedStockStatus}
                onChange={(e) => setSelectedStockStatus(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-2 text-[10px] font-bold uppercase rounded focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
              >
                <option value="TODOS">TODOS</option>
                <option value="EM_ESTOQUE">DISPONÍVEL (&gt;0)</option>
                <option value="ZERADO">ESGOTADO (=0)</option>
                <option value="BAIXO">ESTOQUE BAIXO</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Ordenar Por */}
          <div className="flex flex-col col-span-1 md:col-span-2">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Ordenar por:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-2 text-[10px] font-bold uppercase rounded focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
              >
                <option value="qty-desc">MAIOR ESTOQUE → MENOR (Padrão)</option>
                <option value="qty-asc">MENOR ESTOQUE → MAIOR</option>
                <option value="val-desc">MAIOR VALOR ATIVO (Financeiro)</option>
                <option value="alpha">ORDEM ALFABÉTICA (A-Z)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Peças */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500 space-y-4">
            <svg className="w-10 h-10 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18.2" />
            </svg>
            <p className="text-xs uppercase font-black tracking-widest animate-pulse">Sincronizando Banco de Dados...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-600 space-y-3 border border-dashed border-zinc-800 rounded">
            <AlertTriangle className="w-10 h-10" />
            <p className="text-xs uppercase font-black tracking-widest">Nenhuma peça atende aos filtros definidos.</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const hasStock = item.quantity > 0;
            
            // Color scheme based on stock status
            let badgeStyle = 'bg-rose-950/60 border-rose-900 text-rose-400';
            if (hasStock) {
              badgeStyle = item.isLowStock 
                ? 'bg-amber-950/40 border-amber-900/60 text-amber-400' 
                : 'bg-emerald-950/60 border-emerald-900 text-emerald-400';
            }

            // Vehicle type badge colors
            const vTypeColor = 
              item.vehicleType === 'LEVES' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              item.vehicleType === 'MOTOS' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
              item.vehicleType === 'PESADOS' ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' :
              'bg-zinc-800/40 border-zinc-800 text-zinc-400';

            return (
              <div 
                key={item.id} 
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded hover:border-zinc-700 hover:bg-zinc-950 transition-all group gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 border transition-all ${
                    hasStock 
                      ? item.isLowStock ? 'bg-amber-950/30 border-amber-900/40 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-emerald-500'
                      : 'bg-rose-950/30 border-rose-900/40 text-rose-500'
                  }`}>
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold uppercase text-white group-hover:text-amber-500 transition-colors">
                        {item.description}
                      </p>
                      <span className={`px-2 py-0.5 border rounded text-[8px] font-black uppercase tracking-wider ${vTypeColor}`}>
                        {item.vehicleType}
                      </span>
                      {item.isLowStock && hasStock && (
                        <span className="flex items-center gap-1 text-[8px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-2.5 h-2.5" /> Baixo Estoque
                        </span>
                      )}
                      {!hasStock && (
                        <span className="flex items-center gap-1 text-[8px] font-black uppercase text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-2.5 h-2.5" /> Esgotado
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-wide">
                      Código: <span className="text-zinc-400 font-mono">{item.id}</span> • Grupo: <span className="text-zinc-400">{item.category}</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">
                      Aplicação: <span className="text-zinc-300">{item.brand !== 'N/D' ? item.brand : 'GENÉRICO'}</span> {item.model !== 'N/D' ? `• ${item.model}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6 border-t md:border-t-0 border-zinc-900 pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className={`block text-xl font-mono font-black ${hasStock ? 'text-white' : 'text-rose-500'}`}>
                      {item.quantity} UN
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      UN: {formatCurrency(item.unitPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden lg:block">
                      <span className="block text-xs font-mono text-zinc-400 font-bold">
                        {formatCurrency(item.totalValue)}
                      </span>
                      <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider block">Saldo Ativo</span>
                    </div>

                    <button
                      onClick={() => onOpenTransactionModal(item)}
                      className="px-3 py-2 bg-zinc-900 border border-zinc-800 hover:bg-amber-500 hover:border-amber-500 hover:text-black text-white rounded transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider"
                    >
                      <Plus className="w-3.5 h-3.5" /> Lançar Mov.
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
