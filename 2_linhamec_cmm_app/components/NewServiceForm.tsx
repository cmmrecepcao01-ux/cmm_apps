import React, { useState, useEffect } from 'react';
import { ServiceRecord, ServiceStatus, Vehicle, Mechanic, UserRole } from '../types';
import { ArrowLeft } from 'lucide-react';

interface NewServiceFormProps {
  allServices: ServiceRecord[];
  vehicles: Vehicle[];
  currentMechanic: Mechanic | null;
  mechanics: Mechanic[];
  onCancel: () => void;
  onStart: (
    os: string,
    p: string,
    p_prefix: string,
    c_email: string,
    b: string,
    m: string,
    y: string,
    o: string,
    km: string,
    defect: string,
    section: string,
    delegatedTo?: string
  ) => void;
}

export const NewServiceForm: React.FC<NewServiceFormProps> = ({
  allServices,
  vehicles,
  currentMechanic,
  mechanics,
  onCancel,
  onStart,
}) => {
  const [os, setOs] = useState('');
  const [prefix, setPrefix] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [p, setP] = useState('');
  const [b, setB] = useState('');
  const [m, setM] = useState('');
  const [y, setY] = useState('');
  const [o, setO] = useState('');
  const [km, setKm] = useState('');
  const [defect, setDefect] = useState('');
  const [delegateTo, setDelegateTo] = useState<string>('');
  const [section, setSection] = useState<string>('LINHA MECÂNICA');

  const sectionOptions = [
    {
      value: 'LINHA MECÂNICA',
      label: 'Linha Mecânica',
      color: 'bg-emerald-600',
      textColor: 'text-emerald-500',
      icon: '🔧',
    },
    {
      value: 'SINALIZADOR',
      label: 'Sinalizador',
      color: 'bg-blue-600',
      textColor: 'text-blue-500',
      icon: '🚨',
    },
    {
      value: 'GRAFISMO',
      label: 'Grafismo',
      color: 'bg-purple-600',
      textColor: 'text-purple-500',
      icon: '🖌️',
    },
    {
      value: 'BORRACHARIA',
      label: 'Borracharia',
      color: 'bg-orange-600',
      textColor: 'text-orange-500',
      icon: '✇',
    },
    {
      value: ServiceStatus.HEAVY_MECHANICAL,
      label: 'PESADOS - LINHA MECÂNICA',
      icon: '🚛',
      color: '#f59e0b',
      textColor: 'text-amber-500',
    },
    {
      value: 'DESCARGA',
      label: 'Descarga',
      color: 'bg-rose-600',
      textColor: 'text-rose-500',
      icon: '📉',
    },
    {
      value: 'GARANTIA',
      label: 'Garantia',
      color: 'bg-cyan-600',
      textColor: 'text-cyan-500',
      icon: '🛡️',
    },
    {
      value: 'SETOR TÉCNICO',
      label: 'Setor Técnico',
      color: 'bg-red-600',
      textColor: 'text-pink-500',
      icon: '📋',
    },
    {
      value: 'CONTRATAÇÃO',
      label: 'Contratação',
      color: 'bg-amber-600',
      textColor: 'text-amber-500',
      icon: '📝',
    },
  ];

  const isSergeant = currentMechanic?.name.startsWith('SGT ');
  
  useEffect(() => {
    if (p.length >= 7) {
      const vehicle = vehicles.find(
        (v) => v.plate.toUpperCase() === p.toUpperCase()
      );
      if (vehicle) {
        setB(vehicle.brand);
        setM(vehicle.model);
        setY(vehicle.year);
        setO(vehicle.opm);
        return;
      }
      const prev = allServices.find(
        (s) => s.plate.toUpperCase() === p.toUpperCase()
      );
      if (prev) {
        setB(prev.brand);
        setM(prev.model);
        setY(prev.year);
        setO(prev.opm);
      }
    }
  }, [p, allServices, vehicles]);

  const handleStart = () => {
    if (!os?.trim()) {
      alert('OS é obrigatória!');
      return;
    }
    if (!km?.trim()) {
      alert('KM é obrigatório!');
      return;
    }
    if (!defect?.trim()) {
      alert('Defeito informado é obrigatório!');
      return;
    }
    onStart(
      os,
      p,
      prefix,
      clientEmail,
      b,
      m,
      y,
      o,
      km,
      defect,
      section,
      delegateTo || undefined
    );
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 bg-zinc-950 p-10 border border-zinc-900 rounded-2xl shadow-2xl">
      <button
        onClick={onCancel}
        className="p-4 bg-white text-black font-black uppercase text-xs flex items-center gap-2 rounded-lg shadow-lg active:scale-95 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <div className="space-y-2">
        <label className="text-xs font-black uppercase text-amber-400">
          Ordem de Serviço (OS) *
        </label>
        <input
          type="text"
          value={os}
          onChange={(e) => setOs(e.target.value.toUpperCase())}
          placeholder="EX: 001/2025"
          className="w-full bg-zinc-900 border border-amber-600 text-white p-4 text-2xl font-mono text-center focus:border-amber-400 uppercase rounded-lg"
          autoFocus
        />
      </div>
      <input
        type="text"
        value={p}
        onChange={(e) => setP(e.target.value.toUpperCase())}
        placeholder="PLACA *"
        className="w-full bg-zinc-900 border border-zinc-800 text-white p-5 text-4xl font-mono text-center focus:border-white uppercase rounded-lg"
      />
      <input
        type="text"
        value={prefix}
        onChange={(e) => setPrefix(e.target.value.toUpperCase())}
        placeholder="PREFIXO (Ex: VTR-01)"
        className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 uppercase font-bold rounded-lg"
      />
      <input
        type="email"
        value={clientEmail}
        onChange={(e) => setClientEmail(e.target.value.toLowerCase())}
        placeholder="E-MAIL PARA NOTIFICAÇÃO (OPCIONAL)"
        className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 font-bold rounded-lg"
      />
      {isSergeant && (
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-amber-400">
            Delegar para:
          </label>
          <select
            value={delegateTo}
            onChange={(e) => setDelegateTo(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 rounded-lg focus:outline-none focus:border-white"
          >
            <option value="">— Executar eu mesmo —</option>
            {mechanics
              .filter(
                (m) =>
                  m.role === UserRole.MECHANIC && !m.name.startsWith('SGT ')
              )
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </div>
      )}
      <input
        type="text"
        value={o}
        onChange={(e) => setO(e.target.value.toUpperCase())}
        placeholder="OPM / UNIDADE"
        className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 uppercase font-bold rounded-lg"
      />
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          value={b}
          onChange={(e) => setB(e.target.value.toUpperCase())}
          placeholder="MARCA"
          className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 uppercase font-bold rounded-lg"
        />
        <input
          type="text"
          value={m}
          onChange={(e) => setM(e.target.value.toUpperCase())}
          placeholder="MODELO"
          className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 uppercase font-bold rounded-lg"
        />
      </div>
      <input
        type="text"
        value={y}
        onChange={(e) => setY(e.target.value.toUpperCase())}
        placeholder="ANO"
        className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 uppercase font-bold rounded-lg"
      />
      <input
        type="text"
        value={km}
        onChange={(e) => setKm(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder="KM (SOMENTE NÚMEROS) *"
        className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 font-bold rounded-lg font-mono text-center text-xl"
        inputMode="numeric"
      />
      <div className="space-y-2">
        <label className="text-xs font-black uppercase text-emerald-400">
          📍 Destino / Seção *
        </label>
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 rounded-lg font-bold uppercase focus:outline-none focus:border-white"
        >
          {sectionOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.icon} {opt.label}
            </option>
          ))}
        </select>
        {section && (
          <div className="flex items-center gap-2 mt-2">
            <div
              className={`w-3 h-3 rounded-full ${
                sectionOptions.find((o) => o.value === section)?.color || 'bg-zinc-500'
              }`}
              style={{
                backgroundColor: !sectionOptions.find((o) => o.value === section)?.color.startsWith('bg-')
                  ? (sectionOptions.find((o) => o.value === section)?.color || '#71717a')
                  : undefined
              }}
            ></div>
            <span
              className={`text-xs font-black uppercase ${
                sectionOptions.find((o) => o.value === section)?.textColor || 'text-zinc-400'
              }`}
            >
              {sectionOptions.find((o) => o.value === section)?.icon}{' '}
              {sectionOptions.find((o) => o.value === section)?.label}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-xs font-black uppercase text-rose-400">
          ⚠️ Defeito Informado *
        </label>
        <textarea
          value={defect}
          onChange={(e) => setDefect(e.target.value.toUpperCase())}
          placeholder="EX: VEÍCULO NÃO LIGA, BARULHO NO MOTOR, FREIO FALHANDO, LUZ DO PAINEL ACESA..."
          className="w-full h-24 bg-zinc-900 border border-rose-600 text-white p-4 text-sm focus:border-rose-400 uppercase rounded-lg resize-none"
        />
      </div>
      <button
        onClick={handleStart}
        disabled={p.length < 7 || !km || !os || !defect}
        className="w-full py-6 bg-white text-black font-black uppercase tracking-widest shadow-xl rounded-lg disabled:opacity-30 active:scale-95 transition-all"
      >
        {isSergeant && delegateTo ? 'Delegar Viatura' : 'Autorizar Entrada'}
      </button>
    </div>
  );
};
