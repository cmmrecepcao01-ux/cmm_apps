import React, { useState } from 'react';
import { ServiceRecord, ServiceStatus, Mechanic, UserRole } from '../types';
import { Search, Clock, ArrowLeft } from 'lucide-react';
import { formatMS } from './utils';

interface ConsultServiceViewProps {
  services: ServiceRecord[];
  onBack: () => void;
  onContinue: (id: string) => void;
  onReopen: (id: string) => void;
  onViewDetails: (id: string) => void;
  currentMechanic: Mechanic | null;
}

export const ConsultServiceView: React.FC<ConsultServiceViewProps> = ({
  services,
  onBack,
  onContinue,
  onReopen,
  onViewDetails,
  currentMechanic,
}) => {
  const [searchPlate, setSearchPlate] = useState('');

  const filtered = services.filter(
    (s) =>
      s.plate.toUpperCase().includes(searchPlate) ||
      (s.brand + ' ' + s.model).toUpperCase().includes(searchPlate)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-4 bg-white text-black font-black uppercase text-xs rounded-lg shadow-lg flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="PESQUISAR PLACA OU MODELO..."
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
            className="w-full bg-black border border-zinc-800 text-white pl-10 pr-4 py-4 font-mono text-xl focus:border-white rounded-lg"
          />
        </div>
      </div>
      <div className="grid gap-4">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="bg-zinc-950 border border-zinc-900 p-8 rounded-lg flex flex-wrap items-center justify-between gap-6 hover:border-white transition-all shadow-xl"
          >
            <div>
              <span className="text-3xl font-mono font-bold text-white tracking-tighter uppercase">
                {s.plate}
              </span>
              <p className="text-white text-[10px] font-bold uppercase">
                {s.brand} {s.model}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Clock className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-mono text-zinc-400">
                  Tempo Oficina:{' '}
                  {formatMS((s.endTime || Date.now()) - s.globalStartTime)}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-[9px] text-white uppercase block mb-1">
                  KM
                </span>
                <span className="text-sm font-mono font-bold text-white">
                  {s.km
                    ? `${Number(s.km).toLocaleString('pt-BR')} KM`
                    : 'NÃO INFORMADO'}
                </span>
              </div>
              {s.reportedDefect && (
                <div className="mt-3 p-2 bg-rose-950 border border-rose-800 rounded-lg">
                  <span className="text-[9px] text-rose-400 uppercase">
                    ⚠️ Defeito:{' '}
                  </span>
                  <span className="text-[10px] text-white uppercase">
                    {s.reportedDefect.substring(0, 40)}
                    {s.reportedDefect.length > 40 ? '...' : ''}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onViewDetails(s.id)}
                className="px-6 py-3 border border-zinc-800 text-white font-black text-[9px] rounded-lg hover:bg-zinc-900 transition-all"
              >
                Ver Ficha
              </button>
              {s.status === ServiceStatus.IN_PROGRESS &&
                currentMechanic?.role !== UserRole.CHIEF && (
                  <button
                    onClick={() => onContinue(s.id)}
                    className="px-10 py-3 bg-white text-black font-black text-xs rounded-lg shadow-lg active:scale-95 transition-all"
                  >
                    Retomar Atendimento
                  </button>
                )}
              {(s.status !== ServiceStatus.IN_PROGRESS || s.releaseToken) &&
                (currentMechanic?.department === 'RECEPÇÃO' ||
                  currentMechanic?.role === UserRole.CHIEF ||
                  currentMechanic?.role === UserRole.SUBCHIEF) && (
                  <button
                    onClick={() => onReopen(s.id)}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-[9px] rounded-lg shadow-lg active:scale-95 transition-all uppercase"
                  >
                    Reabrir Serviço
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
