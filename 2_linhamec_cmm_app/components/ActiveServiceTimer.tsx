import React, { useState, useEffect } from 'react';
import { ServiceRecord, ServiceStatus, Mechanic, UsedPart } from '../types';
import { Pause, Save, Clock, ChevronRight, CheckCircle2, FileSpreadsheet, Mic } from 'lucide-react';
import { formatMS, formatServiceList } from './utils';
import { PartsSelector } from './PartsSelector';

const VoiceInput: React.FC<{ onResult: (text: string) => void }> = ({
  onResult,
}) => {
  const [isListening, setIsListening] = useState(false);
  const toggleListen = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Navegador não suporta reconhecimento de voz.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) =>
      onResult(event.results[0][0].transcript);
    if (isListening) recognition.stop();
    else recognition.start();
  };
  return (
    <button
      type="button"
      onClick={toggleListen}
      className={`p-2 rounded-sm transition-all ${
        isListening
          ? 'bg-rose-600 animate-pulse'
          : 'bg-zinc-800 hover:bg-zinc-700'
      }`}
    >
      <Mic className="w-4 h-4 text-white" />
    </button>
  );
};

interface ActiveServiceTimerProps {
  service: ServiceRecord;
  currentMechanic: Mechanic;
  onFinish: (
    id: string,
    diag: string,
    status: ServiceStatus,
    work: string,
    rem: string,
    sessionDur: number,
    parts: UsedPart[]
  ) => void;
  onSaveDraft: (
    id: string,
    work: string,
    rem: string,
    diag: string,
    sessionDur: number
  ) => void;
  onSyncDrafts: (id: string, work: string, rem: string, diag: string) => void;
  onBack: () => void;
}

export const ActiveServiceTimer: React.FC<ActiveServiceTimerProps> = ({
  service,
  currentMechanic,
  onFinish,
  onSaveDraft,
  onSyncDrafts,
  onBack,
}) => {
  const [now, setNow] = useState(Date.now());
  const startTime = service.activeWorkSessions?.[currentMechanic.id] || now;
  const elapsed = now - startTime;
  const accum = (service.individualTimes || {})[currentMechanic.id] || 0;
  const [w, setW] = useState(service.draftWorkDone || '');
  const [d, setD] = useState(service.draftDiagnosis || '');
  const [p, setP] = useState(service.draftRemaining || '');
  const [s, setS] = useState<ServiceStatus>(ServiceStatus.RESOLVED);
  const [showOthers, setShowOthers] = useState(false);
  const [usedParts, setUsedParts] = useState<UsedPart[]>(
    service.usedParts || []
  );
  const isSergeant = currentMechanic.name.startsWith('SGT ');
  const canPause =
    isSergeant || !!service.activeWorkSessions?.[currentMechanic.id];
  const vehicleInfo = `${service.brand}/${service.model} ${service.year}`;

  const otherDestinations = [
    {
      status: ServiceStatus.SIGNALING,
      label: 'Sinalizador',
      color: 'text-blue-500',
    },
    {
      status: ServiceStatus.GRAPHICS,
      label: 'Grafismo',
      color: 'text-purple-500',
    },
    {
      status: ServiceStatus.UNLOADING,
      label: 'Descarga',
      color: 'text-rose-500',
    },
    {
      status: ServiceStatus.TIRE_SHOP,
      label: 'Borracharia',
      color: 'text-orange-500',
    },
    {
      status: ServiceStatus.WARRANTY,
      label: 'Garantia',
      color: 'text-cyan-500',
    },
    {
      status: ServiceStatus.TECHNICAL,
      label: 'Setor Técnico',
      color: 'text-pink-500',
    },
    {
      status: ServiceStatus.HEAVY_MECHANICAL,
      label: 'L. Mec. Pesados',
      color: 'text-emerald-900',
    },
  ];

  const isOtherStatus = otherDestinations.some((dest) => dest.status === s);
  const selectedOther = otherDestinations.find((dest) => dest.status === s);

  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(int);
  }, []);

  const handleVoiceInput = (
    field: 'work' | 'pending' | 'diagnosis',
    text: string
  ) => {
    const newItem = '• ' + text.toUpperCase().trim() + '.';
    if (field === 'work') {
      const updated = w ? w + '\n' + newItem : newItem;
      setW(updated);
      setD(updated);
    } else if (field === 'pending') {
      setP(p ? p + '\n' + newItem : newItem);
    } else {
      setD(d ? d + '\n' + newItem : newItem);
    }
  };

  const handleBlur = (field: 'work' | 'pending' | 'diagnosis') => {
    if (field === 'work') {
      const formatted = formatServiceList(w);
      setW(formatted);
      setD(formatted);
    } else if (field === 'pending') {
      setP(formatServiceList(p));
    } else {
      setD(formatServiceList(d));
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    field: 'work' | 'pending' | 'diagnosis'
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (field === 'work') {
        setW((prev) => prev + '\n• ');
      } else if (field === 'pending') {
        setP((prev) => prev + '\n• ');
      } else {
        setD((prev) => prev + '\n• ');
      }
    }
  };
  const handleSelectOther = (status: ServiceStatus) => {
    setS(status);
    setShowOthers(false);
  };

  const handleFinish = () => {
    const isResolved = s === ServiceStatus.RESOLVED;
    const actionText = isResolved ? 'FINALIZAR O ATENDIMENTO' : 'ENCAMINHAR A VIATURA';
    if (confirm(`Tem certeza que deseja ${actionText} para ${service.plate}?`)) {
      onFinish(service.id, d, s, w, p, elapsed, usedParts);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        {canPause && (
          <button
            onClick={() => onSaveDraft(service.id, w, p, d, elapsed)}
            className="w-full py-6 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl rounded-xl transition-all"
          >
            <Pause className="w-5 h-5" />{' '}
            {isSergeant && !service.activeWorkSessions?.[currentMechanic.id]
              ? 'SGT - Pausar'
              : 'Pausar Sessão'}
          </button>
        )}
        <button
          onClick={() => onSyncDrafts(service.id, w, p, d)}
          className="w-full py-4 bg-zinc-800 text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-all"
        >
          <Save className="w-4 h-4" /> Salvar Rascunho
        </button>
        <div className="bg-zinc-950 border border-zinc-900 p-12 text-center rounded-2xl shadow-xl space-y-6">
          <div>
            <span className="text-[9px] text-white uppercase tracking-widest block mb-4 italic">
              Seu Trabalho Atual
            </span>
            <span className="text-5xl font-mono font-bold text-white block">
              {formatMS(accum + elapsed)}
            </span>
          </div>
          <div className="pt-6 border-t border-zinc-900">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-2 italic">
              Total na Oficina
            </span>
            <span className="text-2xl font-mono font-bold text-amber-500 block">
              {formatMS(Date.now() - service.globalStartTime)}
            </span>
          </div>
        </div>
        <button
          onClick={onBack}
          className="w-full py-5 bg-white text-black border border-white font-black uppercase text-xs rounded-lg shadow-lg active:scale-95 transition-all"
        >
          Voltar
        </button>
      </div>
      <div className="lg:col-span-2 space-y-8 bg-zinc-950 border border-zinc-900 p-10 rounded-2xl shadow-xl">
        <h3 className="text-lg font-black border-b border-zinc-900 pb-6 uppercase italic text-white flex items-center gap-3">
          <Clock className="w-6 h-6 text-amber-500" /> Registro Técnico da
          Sessão
        </h3>
        {service.reportedDefect && (
          <div className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-lg">
            <span className="text-[9px] text-rose-400 uppercase font-black block mb-1">
              ⚠️ Defeito Informado na Entrada:
            </span>
            <span className="text-sm text-white uppercase font-bold">
              {service.reportedDefect}
            </span>
          </div>
        )}
        <div className="bg-zinc-905 border border-zinc-800 p-4 rounded-lg">
          <p className="text-[10px] text-zinc-400 uppercase">
            💡 Pressione <span className="text-white font-bold">ENTER</span>{' '}
            para novo item • Use o{' '}
            <span className="text-white font-bold">microfone</span> para ditar
          </p>
        </div>
        <div className="space-y-10">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-black uppercase text-white">
                Serviços Executados Agora
              </label>
              <VoiceInput onResult={(t) => handleVoiceInput('work', t)} />
            </div>
            <textarea
              value={w}
              onChange={(e) => {
                const v = e.target.value.toUpperCase();
                setW(v);
                setD(v);
              }}
              onBlur={() => handleBlur('work')}
              onKeyDown={(e) => handleKeyDown(e, 'work')}
              placeholder="• TROCA DE ÓLEO.
• SUBSTITUIÇÃO DO FILTRO."
              className="w-full h-32 bg-zinc-900 border border-zinc-800 text-white p-5 focus:border-white focus:outline-none uppercase text-sm rounded-lg leading-relaxed"
            />
          </div>
          {s === ServiceStatus.RESOLVED && (
            <PartsSelector
              diagnosis={d}
              vehicleInfo={vehicleInfo}
              parts={usedParts}
              onPartsChange={setUsedParts}
              mechanicName={currentMechanic.name}
            />
          )}
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-black uppercase text-rose-500">
                Serviços Pendentes
              </label>
              <VoiceInput onResult={(t) => handleVoiceInput('pending', t)} />
            </div>
            <textarea
              value={p}
              onChange={(e) => setP(e.target.value.toUpperCase())}
              onBlur={() => handleBlur('pending')}
              onKeyDown={(e) => handleKeyDown(e, 'pending')}
              placeholder="• AGUARDANDO PEÇA."
              className="w-full h-32 bg-zinc-900 border border-zinc-800 text-white p-5 focus:border-rose-500 focus:outline-none uppercase text-sm rounded-lg leading-relaxed"
            />
          </div>
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-black uppercase text-white">
                Diagnóstico Consolidado
              </label>
              <VoiceInput onResult={(t) => handleVoiceInput('diagnosis', t)} />
            </div>
            <textarea
              value={d}
              onChange={(e) => setD(e.target.value.toUpperCase())}
              onBlur={() => handleBlur('diagnosis')}
              onKeyDown={(e) => handleKeyDown(e, 'diagnosis')}
              placeholder="• TROCA DE ÓLEO REALIZADA."
              className="w-full h-32 bg-zinc-900 border border-zinc-800 text-white p-5 focus:border-white focus:outline-none font-bold uppercase text-sm rounded-lg leading-relaxed"
            />
          </div>
          {/* Seleção de destino */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-zinc-400">
              Destino da Viatura
            </label>
            <div className="flex flex-wrap gap-4">
              <label
                className={`flex items-center gap-3 cursor-pointer font-black text-xs uppercase px-6 py-4 rounded-xl border transition-all ${
                  s === ServiceStatus.RESOLVED
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-emerald-500 hover:border-emerald-500'
                }`}
              >
                <input
                  type="radio"
                  checked={s === ServiceStatus.RESOLVED}
                  onChange={() => setS(ServiceStatus.RESOLVED)}
                  className="hidden"
                />
                <CheckCircle2 className="w-4 h-4" /> Resolvido
              </label>
              <label
                className={`flex items-center gap-3 cursor-pointer font-black text-xs uppercase px-6 py-4 rounded-xl border transition-all ${
                  s === ServiceStatus.OUTSOURCED
                    ? 'bg-amber-600 border-amber-500 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-amber-500 hover:border-amber-500'
                }`}
              >
                <input
                  type="radio"
                  checked={s === ServiceStatus.OUTSOURCED}
                  onChange={() => setS(ServiceStatus.OUTSOURCED)}
                  className="hidden"
                />
                <FileSpreadsheet className="w-4 h-4" /> Contratação
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowOthers(!showOthers)}
                  className={`flex items-center gap-3 font-black text-xs uppercase px-6 py-4 rounded-xl border transition-all ${
                    isOtherStatus
                      ? 'bg-zinc-700 border-zinc-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                  }`}
                >
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      showOthers ? 'rotate-90' : ''
                    }`}
                  />
                  {isOtherStatus ? selectedOther?.label : 'Outros'}
                </button>
                {showOthers && (
                  <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 min-w-[200px] overflow-hidden">
                    {otherDestinations.map((dest) => (
                      <button
                        key={dest.status}
                        type="button"
                        onClick={() => handleSelectOther(dest.status)}
                        className={`w-full text-left px-5 py-4 font-bold text-xs uppercase transition-all flex items-center gap-3 hover:bg-zinc-850 ${dest.color}`}
                      >
                        <div className="w-2 h-2 rounded-full bg-current"></div>
                        {dest.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {isOtherStatus && (
              <div
                className={`flex items-center gap-2 text-xs font-bold uppercase bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 ${selectedOther?.color}`}
              >
                <span className="text-zinc-400">Destino:</span>{' '}
                <span className="text-white">{selectedOther?.label}</span>
              </div>
            )}
          </div>
          <button
            disabled={w.length < 3}
            onClick={handleFinish}
            className={`w-full py-8 disabled:opacity-20 font-black uppercase tracking-widest text-2xl shadow-2xl rounded-xl active:scale-95 transition-all ${
              s === ServiceStatus.RESOLVED
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-blue-700 text-white hover:bg-blue-600'
            }`}
          >
            {s === ServiceStatus.RESOLVED
              ? 'Finalizar Atendimento'
              : 'Encaminhar VTR'}
          </button>
        </div>
      </div>
    </div>
  );
};
