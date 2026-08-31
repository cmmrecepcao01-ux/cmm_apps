import React, { useState, useMemo, useRef } from 'react';
import { ServiceRecord, ServiceStatus, Mechanic } from '../types';
import {
  ArrowLeft,
  CheckSquare,
  Square,
  Search,
  Filter,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

interface BulkReleaseVehiclesViewProps {
  services: ServiceRecord[];
  currentMechanic: Mechanic | null;
  onBack: () => void;
  onBulkRelease: (selectedIds: string[]) => Promise<void>;
}

export const BulkReleaseVehiclesView: React.FC<BulkReleaseVehiclesViewProps> = ({
  services,
  currentMechanic,
  onBack,
  onBulkRelease,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('TODOS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');

  const lastSelectedIndexRef = useRef<number | null>(null);

  // Lista de viaturas pendentes de liberação (status RESOLVIDO, CONTRATAÇÃO, GARANTIA sem releaseToken)
  const pendingServices = useMemo(() => {
    return services.filter(
      (s) =>
        (s.status === ServiceStatus.RESOLVED ||
          s.status === ServiceStatus.OUTSOURCED ||
          s.status === ServiceStatus.WARRANTY) &&
        !s.releaseToken
    );
  }, [services]);

  // Lista de setores únicos presentes nas viaturas pendentes
  const availableSections = useMemo(() => {
    const sections = new Set<string>();
    pendingServices.forEach((s) => {
      if (s.assignedSection) sections.add(s.assignedSection);
    });
    return ['TODOS', ...Array.from(sections).sort()];
  }, [pendingServices]);

  // Filtragem dos serviços
  const filteredServices = useMemo(() => {
    return pendingServices.filter((s) => {
      // Filtro de texto (Placa, Prefixo, Marca, Modelo, OPM)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toUpperCase();
        const matchPlate = s.plate?.toUpperCase().includes(query);
        const matchPrefix = s.prefix?.toUpperCase().includes(query);
        const matchModel = `${s.brand || ''} ${s.model || ''}`.toUpperCase().includes(query);
        const matchOpm = s.opm?.toUpperCase().includes(query);
        const matchOs = s.os?.toUpperCase().includes(query);
        if (!matchPlate && !matchPrefix && !matchModel && !matchOpm && !matchOs) {
          return false;
        }
      }

      // Filtro por setor
      if (selectedSection !== 'TODOS') {
        if ((s.assignedSection || '').toUpperCase() !== selectedSection.toUpperCase()) {
          return false;
        }
      }

      // Filtro por Data de Entrada
      if (startDate || endDate) {
        let entryTime = s.globalStartTime;
        if (!entryTime && s.entryDate) {
          const parts = s.entryDate.split(/[/ -]/);
          if (parts.length >= 3) {
            entryTime = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
          }
        }

        if (entryTime) {
          const entryDateObj = new Date(entryTime);
          entryDateObj.setHours(0, 0, 0, 0);

          if (startDate) {
            const startObj = new Date(startDate);
            startObj.setHours(0, 0, 0, 0);
            if (entryDateObj < startObj) return false;
          }

          if (endDate) {
            const endObj = new Date(endDate);
            endObj.setHours(23, 59, 59, 999);
            if (entryDateObj > endObj) return false;
          }
        }
      }

      return true;
    });
  }, [pendingServices, searchQuery, selectedSection, startDate, endDate]);

  // Seleção / Deseleção com suporte a Shift + Click
  const handleItemClick = (serviceId: string, index: number, event: React.MouseEvent) => {
    const newSelected = new Set(selectedIds);

    if (event.shiftKey && lastSelectedIndexRef.current !== null) {
      const start = Math.min(lastSelectedIndexRef.current, index);
      const end = Math.max(lastSelectedIndexRef.current, index);

      for (let i = start; i <= end; i++) {
        const item = filteredServices[i];
        if (item) {
          newSelected.add(item.id);
        }
      }
    } else {
      if (newSelected.has(serviceId)) {
        newSelected.delete(serviceId);
      } else {
        newSelected.add(serviceId);
      }
      lastSelectedIndexRef.current = index;
    }

    setSelectedIds(newSelected);
  };

  const handleSelectAllFiltered = () => {
    const newSelected = new Set(selectedIds);
    filteredServices.forEach((s) => newSelected.add(s.id));
    setSelectedIds(newSelected);
  };

  const handleDeselectAllFiltered = () => {
    const newSelected = new Set(selectedIds);
    filteredServices.forEach((s) => newSelected.delete(s.id));
    setSelectedIds(newSelected);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    lastSelectedIndexRef.current = null;
  };

  const handleExecuteBulkRelease = async () => {
    const idsToRelease = Array.from(selectedIds);
    if (idsToRelease.length === 0) {
      alert('Nenhuma viatura selecionada para liberação.');
      return;
    }

    const confirmMsg = `ATENÇÃO: Deseja realmente LIBERAR EM MASSA ${idsToRelease.length} viatura(s)?\n\nEssa ação irá gravar a saída definitiva no sistema e nos relatórios.`;
    if (!confirm(confirmMsg)) return;

    setIsProcessing(true);
    setProgressText(`Liberando ${idsToRelease.length} viatura(s)...`);

    try {
      await onBulkRelease(idsToRelease);
      handleClearSelection();
    } catch (err) {
      console.error('Erro no Bulk Release:', err);
      alert('Ocorreu um erro ao processar a liberação em massa.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-4 bg-white text-black font-black uppercase text-xs rounded-sm flex items-center gap-2 shadow-lg hover:bg-zinc-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div>
            <h2 className="text-2xl font-black uppercase text-white italic tracking-tight flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              Liberação em Massa (Bulk Liberar VTR)
            </h2>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
              Painel de Limpeza e Liberação Rápida | {pendingServices.length} pendentes no total
            </p>
          </div>
        </div>

        {/* CONTADOR E BOTÃO DE AÇÃO */}
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-sm text-right">
            <span className="text-[9px] text-zinc-400 uppercase font-black block">Selecionadas</span>
            <span className="text-xl font-mono font-bold text-emerald-400">
              {selectedIds.size} <span className="text-xs text-zinc-500 font-normal">/ {filteredServices.length}</span>
            </span>
          </div>

          <button
            onClick={handleExecuteBulkRelease}
            disabled={selectedIds.size === 0 || isProcessing}
            className={`px-8 py-4 font-black uppercase text-xs rounded-sm shadow-2xl flex items-center gap-3 transition-all ${
              selectedIds.size > 0 && !isProcessing
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            {isProcessing ? progressText : `Liberar ${selectedIds.size} Viatura(s)`}
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* BUSCA TEXTUAL */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="BUSCAR POR PLACA, PREFIXO, MODELO OU OPM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              className="w-full bg-black border border-zinc-800 text-white pl-10 pr-4 py-3 font-mono text-xs focus:border-emerald-500 rounded-sm outline-none uppercase"
            />
          </div>

          {/* FILTRO POR SETOR */}
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-[9px] text-zinc-400 font-bold uppercase">
              <Filter className="w-3 h-3 text-emerald-500" /> Setor
            </div>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-black border border-zinc-800 text-white px-3 py-2.5 font-mono text-xs focus:border-emerald-500 rounded-sm outline-none uppercase"
            >
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* FILTRO POR DATA DE ENTRADA */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[8px] text-zinc-400 font-bold uppercase block mb-1">De:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white px-2 py-1.5 font-mono text-xs focus:border-emerald-500 rounded-sm outline-none"
              />
            </div>
            <div>
              <span className="text-[8px] text-zinc-400 font-bold uppercase block mb-1">Até:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white px-2 py-1.5 font-mono text-xs focus:border-emerald-500 rounded-sm outline-none"
              />
            </div>
          </div>
        </div>

        {/* BARRA DE ATALHOS DE SELEÇÃO */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-900 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllFiltered}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[9px] uppercase rounded-sm border border-zinc-700 flex items-center gap-1.5 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              Selecionar Todos Filtrados ({filteredServices.length})
            </button>
            <button
              onClick={handleDeselectAllFiltered}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-[9px] uppercase rounded-sm border border-zinc-800 flex items-center gap-1.5 transition-colors"
            >
              <Square className="w-3.5 h-3.5 text-zinc-500" />
              Desmarcar Filtrados
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={handleClearSelection}
                className="px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 font-bold text-[9px] uppercase rounded-sm border border-rose-900/50 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Limpar Seleção Geral
              </button>
            )}
          </div>

          <div className="text-[10px] text-zinc-400 font-mono italic">
            Dica: Segure <span className="px-1.5 py-0.5 bg-zinc-800 text-white font-bold rounded">SHIFT</span> e clique para selecionar um intervalo.
          </div>
        </div>
      </div>

      {/* LISTA DE VIATURAS */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-sm overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-900/80 sticky top-0 z-10 text-[9px] font-black uppercase text-zinc-400 tracking-wider border-b border-zinc-800">
              <tr>
                <th className="p-4 w-12 text-center">
                  <span className="sr-only">Seleção</span>
                </th>
                <th className="p-4">Placa / Prefixo</th>
                <th className="p-4">Veículo</th>
                <th className="p-4">OPM (Unidade)</th>
                <th className="p-4">Setor</th>
                <th className="p-4">Entrada</th>
                <th className="p-4">Status</th>
                <th className="p-4">Defeito Informado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono">
              {filteredServices.map((s, index) => {
                const isSelected = selectedIds.has(s.id);
                return (
                  <tr
                    key={s.id}
                    onClick={(e) => handleItemClick(s.id, index, e)}
                    className={`cursor-pointer transition-colors select-none ${
                      isSelected
                        ? 'bg-emerald-950/30 border-l-4 border-emerald-500 hover:bg-emerald-950/40 text-white'
                        : 'hover:bg-zinc-900/50 text-zinc-300'
                    }`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Tratado no tr onClick
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-base text-white block tracking-tighter">
                        {s.plate}
                      </span>
                      {s.prefix && (
                        <span className="text-[10px] text-zinc-400 font-normal">
                          Pref: {s.prefix}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-zinc-200 block uppercase">
                        {s.brand} {s.model}
                      </span>
                      <span className="text-[9px] text-zinc-500">{s.year || ''}</span>
                    </td>
                    <td className="p-4 uppercase font-bold text-zinc-300">
                      {s.opm || 'N/I'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] font-bold text-amber-400 uppercase">
                        {s.assignedSection || 'GERAL'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 text-[11px]">
                      {s.entryDate ||
                        (s.globalStartTime
                          ? new Date(s.globalStartTime).toLocaleDateString('pt-BR')
                          : '-')}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900/60 rounded text-[9px] font-bold uppercase">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 text-[10px] max-w-xs truncate uppercase font-sans">
                      {s.reportedDefect || s.draftDiagnosis || s.finalDiagnosis || '-'}
                    </td>
                  </tr>
                );
              })}

              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-500 font-black uppercase text-xs tracking-widest">
                    Nenhuma viatura pendente encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
