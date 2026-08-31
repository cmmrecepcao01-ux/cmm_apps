import React, { useState } from 'react';
import { ServiceRecord, ServiceStatus } from '../types';
import { Car } from 'lucide-react';
import { formatMS } from './utils';

interface ClientConsultViewProps {
  services: ServiceRecord[];
  onBack: () => void;
}

export const ClientConsultView: React.FC<ClientConsultViewProps> = ({ services, onBack }) => {
  const [plate, setPlate] = useState('');
  const [found, setFound] = useState<ServiceRecord | null>(null);

  const handleSearch = () => {
    const srv = services
      .filter((s) => s.plate.toUpperCase() === plate.toUpperCase())
      .sort((a, b) => b.globalStartTime - a.globalStartTime)[0];
    setFound(srv || null);
    if (!srv) alert('Viatura não encontrada ou sem registro ativo.');
  };

  const getStep = (s: ServiceRecord) => {
    if (s.readyForClient) return 4;
    const additionalStatuses = [
      ServiceStatus.RESOLVED,
      ServiceStatus.OUTSOURCED,
      ServiceStatus.SIGNALING,
      ServiceStatus.GRAPHICS,
      ServiceStatus.UNLOADING,
      ServiceStatus.TIRE_SHOP,
      ServiceStatus.WARRANTY,
      ServiceStatus.TECHNICAL,
    ];
    if (additionalStatuses.includes(s.status)) return 3;

    if (
      (s.activeWorkSessions && Object.keys(s.activeWorkSessions).length > 0) ||
      s.logs.length > 1
    )
      return 2;
    return 1;
  };

  const getCarProgress = (s: ServiceRecord) => {
    const currentStep = getStep(s);
    if (currentStep === 4) return 100;

    const startTime = s.globalStartTime;
    const hoursPassed = (Date.now() - startTime) / (1000 * 60 * 60);
    const progressWithinPhase = Math.min((hoursPassed % 240) / 240, 0.85);
    const basePositions = [0, 0, 33, 66, 100];
    const currentBase = basePositions[currentStep];
    const nextBase = basePositions[currentStep + 1] || 100;

    return currentBase + (nextBase - currentBase) * progressWithinPhase;
  };

  const getStatusLabel = (s: ServiceRecord, step: number) => {
    if (step === 2) return `Local: ${s.assignedSection || 'MECÂNICA'}`;
    if (step === 3) {
      const labels: Record<string, string> = {
        [ServiceStatus.OUTSOURCED]: 'Contratação',
        [ServiceStatus.SIGNALING]: 'SINALIZADOR',
        [ServiceStatus.GRAPHICS]: 'Grafismo',
        [ServiceStatus.TIRE_SHOP]: 'Borracharia',
        [ServiceStatus.UNLOADING]: 'Descarga',
        [ServiceStatus.WARRANTY]: 'Garantia',
        [ServiceStatus.TECHNICAL]: 'Setor Técnico',
      };
      return `Encaminhado: ${labels[s.status] || s.status}`;
    }
    return '';
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-12">
      <div className="text-center space-y-4">
        <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Car className="text-black w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter">
          Consultar Veículo
        </h2>
        <p className="text-zinc-500 text-xs uppercase tracking-widest italic">
          Acompanhe o status da sua viatura em tempo real
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="DIGITE A PLACA (EX: ABC1D23)"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          className="flex-1 bg-zinc-900 border border-zinc-800 p-5 text-2xl font-mono text-center focus:border-emerald-500 outline-none rounded-sm"
        />
        <button
          onClick={handleSearch}
          className="bg-white text-black px-10 font-black uppercase text-xs rounded-sm hover:bg-zinc-200 transition-colors"
        >
          Buscar
        </button>
      </div>

      {found && (
        <div className="bg-zinc-950 border border-zinc-900 p-12 rounded-sm animate-in fade-in zoom-in duration-500 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-16">
            {found.readyForClient && !found.releaseToken && (
              <div className="mb-8 p-6 bg-emerald-600/20 border border-emerald-500 rounded-sm animate-bounce">
                <span className="block text-emerald-500 font-black uppercase text-sm mb-1">
                  ✨ Viatura Pronta para Retirada!
                </span>
                <p className="text-[10px] text-white uppercase font-bold leading-tight">
                  A manutenção foi concluída. Dirija-se à recepção para validar
                  a liberação e retirar o veículo.
                </p>
              </div>
            )}
            <span className="text-5xl font-mono font-bold text-white tracking-tighter">
              {found.plate}
            </span>
            <p className="text-zinc-500 text-xs uppercase mt-3 tracking-[0.3em] font-bold">
              {found.brand} {found.model}
            </p>
          </div>

          <div className="relative h-24 flex items-center">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-900 -translate-y-1/2 z-0 rounded-full"></div>

            <div
              className="absolute top-1/2 -translate-y-[130%] transition-all duration-1000 ease-linear z-20 text-2xl"
              style={{ left: `${getCarProgress(found)}%`, marginLeft: '-15px' }}
            >
              🚗
            </div>

            {[
              { id: 1, label: 'Diagnóstico', color: 'bg-rose-600' },
              { id: 2, label: 'Em Serviço', color: 'bg-amber-500' },
              { id: 3, label: 'Serviço Adicional', color: 'bg-amber-500' },
              { id: 4, label: 'Pronto', color: 'bg-emerald-500' },
            ].map((step) => {
              const currentStep = getStep(found);
              const isActive = step.id === currentStep;
              const isDone = step.id < currentStep;
              return (
                <div
                  key={step.id}
                  className="relative z-10 flex-1 flex flex-col items-center"
                >
                  <div
                    className={`w-5 h-5 rounded-full border-4 transition-all duration-700 ${
                      isActive
                        ? `${step.color} border-zinc-800 animate-pulse scale-150`
                        : isDone
                        ? `${step.color} border-zinc-800`
                        : 'bg-zinc-900 border-zinc-800'
                    }`}
                  ></div>

                  <div className="absolute -bottom-8 flex flex-col items-center w-32 text-center">
                    <span
                      className={`text-[9px] font-black uppercase tracking-tighter ${
                        isActive ? 'text-white' : 'text-zinc-600'
                      }`}
                    >
                      {step.label}
                    </span>

                    {isActive && (
                      <span className="text-[7px] text-zinc-400 uppercase font-bold mt-1 leading-tight">
                        {getStatusLabel(found, step.id)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={onBack}
        className="w-full py-4 text-zinc-600 uppercase font-black text-[9px] hover:text-white transition-colors tracking-widest border-t border-zinc-900 mt-10"
      >
        Voltar para Acesso Restrito
      </button>
    </div>
  );
};
