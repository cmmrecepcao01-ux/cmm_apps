import React, { useMemo } from 'react';
import { ServiceRecord, ServiceStatus, Mechanic, UserRole } from '../types';
import { History, Clock, ClipboardList, CheckCircle2, ArrowLeft } from 'lucide-react';
import { formatMS } from './utils';
import { MECHANICS as INITIAL_DATA } from '../constants';

interface ServiceDetailsViewProps {
  service: ServiceRecord;
  allServices: ServiceRecord[];
  mechanics: Mechanic[];
  currentMechanic: Mechanic | null;
  onBack: () => void;
  onContinue: (id: string) => void;
  onRelease: () => void;
}

export const ServiceDetailsView: React.FC<ServiceDetailsViewProps> = ({
  service,
  allServices,
  mechanics,
  onBack,
  onContinue,
  currentMechanic,
  onRelease,
}) => {
  const history = useMemo(
    () =>
      allServices
        .filter((s) => s.plate === service.plate)
        .sort((a, b) => b.globalStartTime - a.globalStartTime),
    [allServices, service.plate]
  );

  const totalLaborCost = useMemo(() => {
    const times = service?.individualTimes || {};
    return Object.entries(times).reduce((acc, [mId, timeMs]) => {
      const mech = mechanics.find((m) => m.id === mId);
      const rate =
        mech?.hourlyRate ||
        INITIAL_DATA.find((me) => me.id === mId)?.hourlyRate ||
        0;
      return acc + ((Number(timeMs) || 0) / 3600000) * rate;
    }, 0);
  }, [service?.individualTimes, mechanics]);

  const totalPartsCost = useMemo(() => {
    const parts = service?.usedParts || [];
    return parts.reduce((acc, p) => {
      const price = Number(p.unit_price) || 0;
      const qty = Number(p.quantity) || 1;
      return acc + price * qty;
    }, 0);
  }, [service?.usedParts]);

  const statusColor =
    service.status === ServiceStatus.RESOLVED
      ? 'text-emerald-500'
      : service.status === ServiceStatus.OUTSOURCED
      ? 'text-amber-500'
      : service.status === ServiceStatus.SIGNALING
      ? 'text-blue-500'
      : service.status === ServiceStatus.GRAPHICS
      ? 'text-purple-500'
      : service.status === ServiceStatus.UNLOADING
      ? 'text-rose-500'
      : service.status === ServiceStatus.TIRE_SHOP
      ? 'text-orange-500'
      : service.status === ServiceStatus.WARRANTY
      ? 'text-cyan-500'
      : service.status === ServiceStatus.TECHNICAL
      ? 'text-red-600'
      : service.status === ServiceStatus.HEAVY_MECHANICAL
      ? 'text-emerald-900'
      : service.status === ServiceStatus.STORES
      ? 'text-zinc-500'
      : 'text-zinc-400';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-right duration-500">
      <div className="space-y-4">
        {service.status === ServiceStatus.IN_PROGRESS &&
          currentMechanic?.role !== UserRole.CHIEF && (
            <button
              onClick={() => onContinue(service.id)}
              className="w-full py-6 bg-white text-black font-black uppercase text-xs tracking-widest active:scale-95 shadow-2xl rounded-lg transition-all"
            >
              Assumir Viatura
            </button>
          )}
        
        {currentMechanic?.department === 'RECEPÇÃO' &&
          (service.status === ServiceStatus.RESOLVED ||
            service.status === ServiceStatus.OUTSOURCED ||
            service.status === ServiceStatus.WARRANTY) && (
            <div className="space-y-4">
              {!service.releaseToken ? (
                <button
                  onClick={onRelease}
                  className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest active:scale-95 shadow-2xl rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" /> Liberar Viatura
                </button>
              ) : (
                <div className="w-full py-6 bg-zinc-900 border border-emerald-500 text-emerald-500 font-black uppercase text-xs tracking-widest rounded-lg text-center flex flex-col items-center gap-2">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> SAÍDA AUTORIZADA
                  </span>
                </div>
              )}
            </div>
          )}

        <div className="bg-zinc-950 border border-zinc-900 p-10 text-center rounded-2xl shadow-xl space-y-8">
          <History className="w-12 h-12 text-white mx-auto" />
          {service.os && (
            <div className="bg-amber-600/20 border border-amber-600 p-4 rounded-lg">
              <span className="text-[9px] text-amber-400 uppercase block mb-1">
                Ordem de Serviço
              </span>
              <span className="text-2xl font-mono font-black text-amber-500">
                {service.os}
              </span>
            </div>
          )}
          <span className="text-4xl font-mono font-bold text-amber-500 uppercase block">
            {service.plate}
          </span>
          {service.reportedDefect && (
            <div className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-lg text-left">
              <span className="text-[9px] text-rose-400 uppercase block mb-2 font-black">
                ⚠️ Defeito Informado na Entrada
              </span>
              <span className="text-sm font-bold text-white uppercase leading-relaxed">
                {service.reportedDefect}
              </span>
            </div>
          )}
          <div className="text-left space-y-4 pt-6 border-t border-zinc-900">
            <div>
              <span className="text-[9px] text-white uppercase block mb-1">
                Status Final
              </span>
              <span className={`text-sm font-black uppercase ${statusColor}`}>
                {service.status}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-white uppercase block mb-1">
                Data de Entrada
              </span>
              <span className="text-sm font-mono font-bold text-white">
                {service.entryDate || 'NÃO REGISTRADA'}
              </span>
            </div>
            {service.exitDate && (
              <div>
                <span className="text-[9px] text-white uppercase block mb-1">
                  Data de Saída
                </span>
                <span className="text-sm font-mono font-bold text-emerald-500">
                  {service.exitDate}
                </span>
              </div>
            )}
            <div>
              <span className="text-[9px] text-white uppercase block mb-1">
                Permanência Total
              </span>
              <span className="text-sm font-mono font-bold text-amber-500">
                {formatMS(
                  ((service.status === ServiceStatus.RESOLVED || service.releaseToken)
                    ? (service.endTime || service.logs[service.logs.length - 1]?.timestamp || Date.now())
                    : Date.now()) - service.globalStartTime
                )}
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-900">
              <span className="text-[9px] text-emerald-500 uppercase block mb-1 font-black">
                Custo Mão de Obra (Acumulado)
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {totalLaborCost.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>

            <div>
              <span className="text-[9px] text-white uppercase block mb-1">
                Unidade
              </span>
              <span className="text-xs font-bold text-white uppercase italic">
                {service.opm}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-white uppercase block mb-1">
                KM
              </span>
              <span className="text-sm font-mono font-bold text-white">
                {service.km
                  ? `${Number(service.km).toLocaleString('pt-BR')} KM`
                  : 'NÃO INFORMADO'}
              </span>
            </div>
            {service.delegatedBy && (
              <div>
                <span className="text-[9px] text-white uppercase block mb-1">
                  Delegado por
                </span>
                <span className="text-sm font-mono font-bold text-amber-400 uppercase italic">
                  {service.delegatedBy}
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onBack}
          className="w-full py-5 bg-white text-black border border-white font-black uppercase text-xs rounded-lg shadow-lg active:scale-95 transition-all"
        >
          Voltar
        </button>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-2xl shadow-xl">
          <h3 className="text-lg font-black border-b border-zinc-900 pb-6 uppercase italic text-white flex items-center justify-between">
            <span>Prontuário Consolidado</span>
            {service.os && (
              <span className="text-sm font-mono text-amber-500">
                OS: {service.os}
              </span>
            )}
          </h3>
          <div className="mt-8 bg-black border border-zinc-800 p-8 text-sm text-white uppercase font-bold italic shadow-inner rounded-lg min-h-[100px] leading-relaxed">
            {service.finalDiagnosis ||
              service.draftDiagnosis ||
              'VIATURA EM DIAGNÓSTICO.'}
          </div>
        </div>
        {service.usedParts && service.usedParts.length > 0 && (
          <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-2xl shadow-xl">
            <h3 className="text-lg font-black border-b border-zinc-900 pb-6 uppercase italic text-white flex items-center gap-3">
              <ClipboardList className="w-6 h-6 text-emerald-500" /> Peças
              Utilizadas ({service.usedParts.length})
            </h3>
            <div className="mt-6 space-y-3">
              {service.usedParts.map((part, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-lg"
                >
                  <div>
                    <span className="block text-sm font-bold uppercase text-white">
                      {part.partName}
                    </span>
                    <span className="text-[9px] text-zinc-500">
                      Por: {part.mechanicName} •{' '}
                      {new Date(part.timestamp).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <span className="text-xl font-mono font-bold text-emerald-500">
                    {part.quantity}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase text-white tracking-widest ml-2">
            Histórico Técnico
          </h4>
          <div className="space-y-4">
            {history
              .flatMap((s) =>
                s.logs.map((log) => ({ ...log, serviceOs: s.os }))
              )
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((log, i) => (
                <div
                  key={i}
                  className="bg-zinc-950 border border-zinc-900 p-6 border-l-4 border-l-white rounded-xl shadow-md"
                >
                  <div className="flex justify-between mb-2">
                    <div className="flex flex-col">
                      <span className="font-black text-xs text-white uppercase italic">
                        {log.mechanicName}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {log.serviceOs && (
                      <span className="text-[9px] font-mono text-amber-500">
                        OS: {log.serviceOs}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white uppercase bg-zinc-900 p-4 rounded-lg">
                    {log.description}
                  </p>
                  {log.remainingTasks && (
                    <p className="text-[10px] text-rose-500 uppercase italic mt-2">
                      Pendência: {log.remainingTasks}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
