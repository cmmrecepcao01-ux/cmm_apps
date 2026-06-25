import React, { useState, useMemo } from 'react';
import { ServiceRecord, ServiceStatus, Mechanic, UserRole, UsedPart } from '../types';
import {
  ArrowLeft,
  Car,
  Settings,
  User,
  ChevronRight,
  ClipboardList,
  TrendingUp,
  Package,
} from 'lucide-react';
import { formatMS } from './utils';
import { DestinationPieChart } from './DestinationPieChart';
import { PART_KEYWORDS, PART_CATEGORY_COLORS } from '../constants';

// ========== CARD ESTATÍSTICAS SEÇÕES ==========
interface SectionStatsCardProps {
  sectionRanking: Array<{
    status: string;
    label: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  totalWithSection: number;
}

export const SectionStatsCard: React.FC<SectionStatsCardProps> = ({
  sectionRanking,
  totalWithSection,
}) => (
  <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-sm shadow-xl space-y-8">
    <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-3">
        <ClipboardList className="w-5 h-5 text-emerald-500" /> Porta de Entrada
        (Decisão da Recepção)
      </h3>
      <span className="text-sm font-mono text-zinc-400">
        {totalWithSection} viaturas recebidas
      </span>
    </div>
    <DestinationPieChart data={sectionRanking} />
    <div className="border-t border-zinc-900 pt-6">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">
        Ranking de Encaminhamento Inicial
      </h4>
      <div className="space-y-3">
        {sectionRanking.map((dest, idx) => (
          <div key={dest.status} className="flex items-center gap-4">
            <span className="text-lg font-black italic text-zinc-700 w-8">
              #{idx + 1}
            </span>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: dest.color }}
            ></div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold uppercase text-white">
                  {dest.label}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-mono font-bold"
                    style={{ color: dest.color }}
                  >
                    {dest.count}x
                  </span>
                  <span className="text-xs font-mono text-zinc-500">
                    ({dest.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${dest.percentage}%`,
                    backgroundColor: dest.color,
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ========== CARD ESTATÍSTICAS DESTINOS ==========
interface DestinationStatsCardProps {
  destinationRanking: Array<{
    status: string;
    label: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  totalFinalized: number;
}

export const DestinationStatsCard: React.FC<DestinationStatsCardProps> = ({
  destinationRanking,
  totalFinalized,
}) => (
  <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-sm shadow-xl space-y-8">
    <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-3">
        <TrendingUp className="w-5 h-5 text-amber-500" /> Porta de Saída
        (Resultados da Oficina)
      </h3>
      <span className="text-sm font-mono text-zinc-400">
        {totalFinalized} fichas encerradas
      </span>
    </div>
    <DestinationPieChart data={destinationRanking} />
    <div className="border-t border-zinc-900 pt-6">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">
        Ranking de Resultados Finais / Transferências
      </h4>
      <div className="space-y-3">
        {destinationRanking.map((dest, idx) => (
          <div key={dest.status} className="flex items-center gap-4">
            <span className="text-lg font-black italic text-zinc-700 w-8">
              #{idx + 1}
            </span>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: dest.color }}
            ></div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold uppercase text-white">
                  {dest.label}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-mono font-bold"
                    style={{ color: dest.color }}
                  >
                    {dest.count}x
                  </span>
                  <span className="text-xs font-mono text-zinc-500">
                    ({dest.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${dest.percentage}%`,
                    backgroundColor: dest.color,
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ========== CARD ESTATÍSTICAS PEÇAS ==========
export const PartsStatsCard: React.FC<{ services: ServiceRecord[] }> = ({
  services,
}) => {
  const partsStats = useMemo(() => {
    const allParts: UsedPart[] = [];
    services.forEach((s) => {
      if (s.usedParts) allParts.push(...s.usedParts);
    });
    const grouped: Record<
      string,
      {
        partName: string;
        totalQty: number;
        byVehicle: Record<string, number>;
        category: string;
      }
    > = {};
    allParts.forEach((part) => {
      const baseName = part.partName.split('(')[0].trim();
      if (!grouped[baseName]) {
        const pkMatch = PART_KEYWORDS.find(
          (pk) => pk.partName === part.keyword
        );
        grouped[baseName] = {
          partName: baseName,
          totalQty: 0,
          byVehicle: {},
          category: pkMatch?.category || 'OUTROS',
        };
      }
      grouped[baseName].totalQty += part.quantity;
      grouped[baseName].byVehicle[part.vehicleInfo] =
        (grouped[baseName].byVehicle[part.vehicleInfo] || 0) + part.quantity;
    });
    const ranking = Object.values(grouped).sort(
      (a, b) => b.totalQty - a.totalQty
    );
    const totalParts = ranking.reduce((acc, p) => acc + p.totalQty, 0);
    const categoryStats: Record<string, number> = {};
    ranking.forEach((p) => {
      categoryStats[p.category] = (categoryStats[p.category] || 0) + p.totalQty;
    });
    return { ranking, totalParts, categoryStats };
  }, [services]);

  if (partsStats.totalParts === 0) {
    return (
      <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-sm shadow-xl">
        <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-3 mb-6">
          <ClipboardList className="w-5 h-5 text-amber-500" /> Controle de Peças
        </h3>
        <p className="text-center py-10 text-zinc-600 italic uppercase text-[10px]">
          Nenhuma peça registrada ainda
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-sm shadow-xl space-y-8">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-amber-500" /> Controle de Peças
        </h3>
        <span className="text-sm font-mono text-zinc-400">
          {partsStats.totalParts} peças utilizadas
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(partsStats.categoryStats)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .slice(0, 8)
          .map(([category, qty]) => (
            <div
              key={category}
              className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm text-center"
              style={{
                borderLeftColor: PART_CATEGORY_COLORS[category] || '#64748b',
                borderLeftWidth: '3px',
              }}
            >
              <span className="block text-2xl font-mono font-bold text-white">
                {qty}
              </span>
              <span className="block text-[9px] text-zinc-400 uppercase font-bold mt-1">
                {category}
              </span>
            </div>
          ))}
      </div>
      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Top 10 Peças Mais Utilizadas
        </h4>
        <div className="space-y-2">
          {partsStats.ranking.slice(0, 10).map((part, idx) => (
            <div
              key={part.partName}
              className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-sm"
            >
              <span className="text-lg font-black italic text-zinc-700 w-8">
                #{idx + 1}
              </span>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    PART_CATEGORY_COLORS[part.category] || '#64748b',
                }}
              ></div>
              <div className="flex-1">
                <span className="block text-sm font-bold uppercase text-white">
                  {part.partName}
                </span>
                <span className="text-[9px] text-zinc-500 uppercase">
                  {part.category}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xl font-mono font-bold text-amber-500">
                  {part.totalQty}x
                </span>
                <span className="text-[9px] text-zinc-500">
                  {((part.totalQty / partsStats.totalParts) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ========== RECURRENCE EXPANSION ==========
interface RecurrenceExpansionProps {
  stats: any;
  onBack: () => void;
}

export const RecurrenceExpansion: React.FC<RecurrenceExpansionProps> = ({
  stats,
  onBack,
}) => (
  <div className="space-y-8 animate-in slide-in-from-right duration-500">
    <div className="flex items-center gap-4">
      <button
        onClick={onBack}
        className="p-4 bg-white text-black font-black uppercase text-xs rounded-sm hover:bg-zinc-200 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <h2 className="text-2xl font-black uppercase tracking-widest italic">
        Análise de Recorrência Técnica
      </h2>
    </div>
    <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
        {Object.entries(stats.frequency || {})
          .sort((a: any, b: any) => b[1] - a[1])
          .map(([label, value]: any) => (
            <div
              key={label}
              className="space-y-2 border-b border-zinc-900 pb-4"
            >
              <div className="flex justify-between text-[11px] font-black uppercase italic tracking-wider">
                <span className={value > 0 ? 'text-white' : 'text-zinc-400'}>
                  {label}
                </span>
                <span
                  className={value > 0 ? 'text-amber-500' : 'text-zinc-600'}
                >
                  {value}
                </span>
              </div>
              <div className="h-0.5 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white"
                  style={{
                    width: `${Math.min(
                      100,
                      (value / (stats.mechanicStats?.[0]?.vtrs?.length || 1)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
      </div>
    </div>
  </div>
);

// ========== CHIEF STATS DASHBOARD ==========
interface ChiefStatsDashboardProps {
  stats: any;
  services: ServiceRecord[];
  mechanics: Mechanic[];
  onBack: () => void;
  onViewServiceDetails: (id: string) => void;
  onResetMechanic: (id: string) => void;
  onViewRecurrence: () => void;
}

export const ChiefStatsDashboard: React.FC<ChiefStatsDashboardProps> = ({
  stats,
  services,
  mechanics,
  onBack,
  onViewServiceDetails,
  onResetMechanic,
  onViewRecurrence,
}) => {
  const [tab, setTab] = useState<'OFICINA' | 'EQUIPE'>('OFICINA');
  const [selectedMechanicId, setSelectedMechanicId] = useState<string | null>(null);

  const selectedMech = stats.mechanicStats.find(
    (m: any) => m.id === selectedMechanicId
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={selectedMechanicId ? () => setSelectedMechanicId(null) : onBack}
          className="px-6 py-4 bg-white text-black font-black uppercase text-xs rounded-sm hover:bg-zinc-200 flex items-center gap-2 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex bg-zinc-900 p-1 rounded-sm border border-zinc-800 shadow-lg">
          <button
            onClick={() => {
              setTab('OFICINA');
              setSelectedMechanicId(null);
            }}
            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'OFICINA'
                ? 'bg-white text-black'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Oficina
          </button>
          <button
            onClick={() => {
              setTab('EQUIPE');
              setSelectedMechanicId(null);
            }}
            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'EQUIPE'
                ? 'bg-white text-black'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Equipe
          </button>
          
          {/* --- BOTÃO EXTERNO PARA O ALMOXARIFADO --- */}
          <button
            onClick={() => window.open('https://cmmalmox.netlify.app/', '_blank')}
            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all text-amber-500 hover:text-amber-400 hover:bg-zinc-800 flex items-center gap-2 rounded-sm ml-2 border-l border-zinc-800 pl-4"
          >
            <Package className="w-3 h-3" /> Almox
          </button>
        </div>
      </div>
      {tab === 'OFICINA' ? (
        <div className="space-y-10">
          <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-sm shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-zinc-900 pb-4 text-white">
              <Car className="w-4 h-4 text-amber-500" /> Viaturas em Atendimento no Pátio
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {services.filter(s => s.status === ServiceStatus.IN_PROGRESS).map((s) => (
                <button
                  key={s.id}
                  onClick={() => onViewServiceDetails(s.id)}
                  className="bg-zinc-900 border border-zinc-800 p-4 text-center hover:border-white transition-all group rounded-sm"
                >
                  <span className="block font-mono font-bold text-white text-lg group-hover:text-amber-500">
                    {s.plate}
                  </span>
                  <span className="block text-[9px] text-zinc-400 uppercase font-black mt-1">
                    {s.opm}
                  </span>
                  {s.delegatedTo && (
                    <span className="block text-[7px] text-amber-400 uppercase font-bold mt-1">
                      Delegado
                    </span>
                  )}
                </button>
              ))}
              {services.filter(s => s.status === ServiceStatus.IN_PROGRESS).length === 0 && (
                <p className="col-span-full text-center py-6 text-zinc-600 italic uppercase text-[10px]">
                  Pátio Vazio
                </p>
              )}
            </div>
          </div>
          <DestinationStatsCard
            destinationRanking={stats.destinationRanking}
            totalFinalized={stats.totalFinalized}
          />
          <SectionStatsCard
            sectionRanking={stats.sectionRanking}
            totalWithSection={stats.totalWithSection}
          />
          <PartsStatsCard services={services} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* CARD DE TEMPO MÉDIO (MTTR) */}
            <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-sm shadow-xl flex flex-col justify-center">
              <h3 className="text-[10px] font-black uppercase text-zinc-400 mb-4 tracking-widest">
                Tempo Médio de Resolução
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-mono font-black text-amber-500">
                  {stats.avgTime > 0 ? Math.floor(stats.avgTime / (1000 * 60 * 60 * 24)) : 0}
                </span>
                <span className="text-xs text-zinc-500 font-bold uppercase mr-2">Dias</span>
                
                <span className="text-4xl font-mono font-black text-amber-500">
                  {stats.avgTime > 0 ? Math.floor((stats.avgTime / (1000 * 60 * 60)) % 24) : 0}
                </span>
                <span className="text-xs text-zinc-500 font-bold uppercase">Horas</span>
              </div>
              <p className="text-[9px] text-zinc-600 uppercase mt-6 italic border-t border-zinc-900 pt-4">
                Média desde a entrada até a finalização do serviço
              </p>
            </div>

            <button
              onClick={onViewRecurrence}
              className="bg-zinc-950 border border-zinc-900 p-8 rounded-sm text-left hover:border-white transition-all group shadow-xl"
            >
              <Settings className="w-8 h-8 text-zinc-400 mb-4 group-hover:text-amber-500" />
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">
                Recorrência Técnica
              </h3>
            </button>
          </div>
          <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-sm shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest mb-8 border-b border-zinc-900 pb-4 text-white">
              Ranking de Incidência (Placas Repetidas)
            </h3>
            <div className="space-y-4">
              {stats.ranking?.map(([plate, data]: any, idx: number) => (
                <div
                  key={plate}
                  onClick={() => onViewServiceDetails(data.lastServiceId)}
                  className="flex justify-between items-center p-6 bg-zinc-900/40 border border-zinc-800 hover:border-white transition-colors rounded-sm cursor-pointer group"
                >
                  <div className="flex items-center gap-6">
                    <span className="text-2xl font-black italic text-zinc-800 group-hover:text-zinc-600">
                      #{idx + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-2xl text-white tracking-tighter group-hover:text-amber-500">
                        {plate}
                      </span>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                        {data.brand} {data.model} | {data.opm}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-mono font-bold text-amber-500">
                      {data.count}x
                    </span>
                    <span className="block text-[8px] text-white uppercase font-black">
                      Entradas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : selectedMechanicId && selectedMech ? (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
          <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-sm shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-white">
                  {selectedMech.name}
                </h3>
                <p className="text-xs text-zinc-400 font-bold uppercase">
                  {selectedMech.role}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 uppercase font-black mb-1">
                Mão de Obra Acumulada
              </p>
              <p className="text-3xl font-mono font-bold text-emerald-500">
                {formatMS(selectedMech.totalTime)}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white ml-2">
              Viaturas Atendidas
            </h4>
            <div className="grid gap-3">
              {selectedMech.vtrs.map((v: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm flex items-center justify-between group hover:border-white transition-all"
                >
                  <div>
                    <span className="block font-mono font-bold text-2xl text-white tracking-tighter uppercase">
                      {v.plate}
                    </span>
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">
                      {v.brand} {v.model}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] text-emerald-500 uppercase font-black mb-1">
                      Mão de Obra Sessão
                    </span>
                    <span className="text-xl font-mono font-bold text-white">
                      {formatMS(v.individualTime)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.mechanicStats.map((m: any) => (
              <button
                key={m.id}
                onClick={() => setSelectedMechanicId(m.id)}
                className={`bg-zinc-950 border p-8 space-y-4 rounded-sm shadow-xl text-left hover:border-white transition-all group ${
                  m.resetRequested
                    ? 'border-rose-500 animate-pulse'
                    : 'border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-white group-hover:text-black transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-sm font-black uppercase text-white">
                        {m.name}
                      </span>
                      <span className="text-[9px] text-zinc-400 uppercase font-bold">
                        {m.role}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-white" />
                </div>
                <div className="pt-4 border-t border-zinc-900 grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[8px] text-zinc-500 uppercase font-black mb-1">
                      Tempo Total
                    </span>
                    <span className="text-emerald-500 font-mono text-lg font-bold">
                      {Math.floor(m.totalTime / 3600000)}h
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-amber-500 uppercase font-black mb-1">
                      Custo de Mão de Obra
                    </span>
                    <span className="text-white font-mono text-lg font-bold">
                      {m.totalCost.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-zinc-900/50 flex justify-between items-center">
                  <span className="text-[7px] text-zinc-500 uppercase font-bold">
                    Produtividade: {m.count} vtrs
                  </span>
                  <span className="text-[7px] text-zinc-600 uppercase font-black italic">
                    Custo Hora:{' '}
                    {m.hourlyRate.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
                {m.resetRequested && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResetMechanic(m.id);
                    }}
                    className="w-full py-2 bg-rose-600 text-white font-black uppercase text-[10px] rounded-sm mt-4"
                  >
                    Autorizar Reset
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
