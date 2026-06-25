import React, { useState, useEffect } from 'react';
import { ServiceRecord, Mechanic, UserRole } from '../types';
import { X, User, Pause } from 'lucide-react';
import { formatMS } from './utils';

interface ActiveMechanicsModalProps {
  service: ServiceRecord;
  mechanics: Mechanic[];
  onClose: () => void;
  onPauseMechanic: (serviceId: string, mechanicId: string) => void;
}

export const ActiveMechanicsModal: React.FC<ActiveMechanicsModalProps> = ({
  service,
  mechanics,
  onClose,
  onPauseMechanic,
}) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const activeMechanics = Object.entries(service.activeWorkSessions || {}).map(
    ([mechanicId, startTime]) => {
      const mechanic = mechanics.find((m) => m.id === mechanicId);
      return {
        id: mechanicId,
        name: mechanic?.name || 'DESCONHECIDO',
        role: mechanic?.role || UserRole.MECHANIC,
        elapsed: now - (startTime as number),
        totalTime:
          ((service.individualTimes || {})[mechanicId] || 0) +
          (now - (startTime as number)),
      };
    }
  );

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border border-zinc-800 p-10 rounded-sm max-w-2xl w-full space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-2xl font-black uppercase text-white">
              Mecânicos em Serviço
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              Viatura{' '}
              <span className="font-mono font-bold text-amber-500">
                {service.plate}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-900 rounded-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        {activeMechanics.length === 0 ? (
          <p className="text-center text-zinc-500 py-8 italic uppercase text-xs">
            Nenhum mecânico trabalhando nesta viatura.
          </p>
        ) : (
          <div className="space-y-4">
            {activeMechanics.map((mech) => (
              <div
                key={mech.id}
                className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="block text-lg font-black uppercase text-white">
                      {mech.name}
                    </span>
                    <span className="text-xs text-zinc-400 uppercase">
                      {mech.role}
                    </span>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-zinc-500 uppercase">
                          Sessão:
                        </span>
                        <span className="text-sm font-mono font-bold text-amber-500">
                          {formatMS(mech.elapsed)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-zinc-500 uppercase">
                          Total:
                        </span>
                        <span className="text-sm font-mono font-bold text-emerald-500">
                          {formatMS(mech.totalTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Pausar ${mech.name}?`))
                      onPauseMechanic(service.id, mech.id);
                  }}
                  className="px-6 py-3 bg-rose-600 text-white font-black uppercase text-xs rounded-sm hover:bg-rose-700 flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" /> Pausar
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full py-4 bg-white text-black font-black uppercase text-xs rounded-sm"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
