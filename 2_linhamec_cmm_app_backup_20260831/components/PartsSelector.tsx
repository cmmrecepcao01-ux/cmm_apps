import React, { useState, useEffect } from 'react';
import { UsedPart } from '../types';
import { X } from 'lucide-react';
import { PART_KEYWORDS } from '../constants';

// Função para detectar peças
export const detectPartsFromDiagnosis = (
  diagnosis: string,
  vehicleInfo: string,
  existingParts: UsedPart[]
) => {
  if (!diagnosis) return [];
  const lines = diagnosis
    .toUpperCase()
    .split('\n')
    .filter((l) => l.trim());

  const detected: {
    keyword: string;
    partName: string;
    defaultQty: number;
    detectedFrom: string;
  }[] = [];

  const alreadyDetected = new Set(existingParts.map((p) => p.keyword));
  lines.forEach((line) => {
    PART_KEYWORDS.forEach((pk) => {
      const found = pk.keywords.some((kw) => line.includes(kw.toUpperCase()));
      if (found && !alreadyDetected.has(pk.partName)) {
        alreadyDetected.add(pk.partName);
        detected.push({
          keyword: pk.partName,
          partName: `${pk.partName} (${vehicleInfo})`,
          defaultQty: pk.defaultQty,
          detectedFrom: line.replace(/^[•\-\*]\s*/, '').trim(),
        });
      }
    });
  });

  return detected;
};

// Componente para editar peça
interface PartItemEditorProps {
  part: UsedPart;
  onUpdate: (id: string, updates: Partial<UsedPart>) => void;
  onRemove: (id: string) => void;
}

export const PartItemEditor: React.FC<PartItemEditorProps> = ({
  part,
  onUpdate,
  onRemove,
}) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4 space-y-3">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">
          Detectado de:
        </span>
        <span className="text-[11px] text-amber-500 italic">
          "{part.detectedFrom}"
        </span>
      </div>
      <button
        type="button"
        onClick={() => onRemove(part.id)}
        className="p-1 text-zinc-600 hover:text-rose-500"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 bg-zinc-800 rounded-sm">
        <button
          type="button"
          onClick={() =>
            onUpdate(part.id, { quantity: Math.max(1, part.quantity - 1) })
          }
          className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-700"
        >
          -
        </button>
        <input
          type="number"
          min="1"
          max="99"
          value={part.quantity}
          onChange={(e) =>
            onUpdate(part.id, {
              quantity: Math.min(
                99,
                Math.max(1, parseInt(e.target.value) || 1)
              ),
            })
          }
          className="w-12 bg-transparent text-center text-white font-mono font-bold text-lg focus:outline-none"
        />
        <button
          type="button"
          onClick={() =>
            onUpdate(part.id, { quantity: Math.min(99, part.quantity + 1) })
          }
          className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-700"
        >
          +
        </button>
      </div>
      <input
        type="text"
        value={part.partName}
        onChange={(e) =>
          onUpdate(part.id, { partName: e.target.value.toUpperCase() })
        }
        className="flex-1 bg-zinc-800 border border-zinc-700 text-white px-4 py-2 text-sm font-bold uppercase focus:border-amber-500 focus:outline-none rounded-sm"
      />
    </div>
  </div>
);

// Seletor de peças (Versão com Memória de Exclusão)
interface PartsSelectorProps {
  diagnosis: string;
  vehicleInfo: string;
  parts: UsedPart[];
  onPartsChange: (parts: UsedPart[]) => void;
  mechanicName: string;
}

export const PartsSelector: React.FC<PartsSelectorProps> = ({
  diagnosis,
  vehicleInfo,
  parts,
  onPartsChange,
  mechanicName,
}) => {
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualPartName, setManualPartName] = useState('');
  const [ignoredKeywords, setIgnoredKeywords] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const detected = detectPartsFromDiagnosis(diagnosis, vehicleInfo, parts);
    const trulyNew = detected.filter((d) => !ignoredKeywords.has(d.keyword));

    if (trulyNew.length > 0) {
      const newParts: UsedPart[] = trulyNew.map((d) => ({
        id: crypto.randomUUID(),
        keyword: d.keyword,
        partName: d.partName,
        vehicleInfo,
        quantity: d.defaultQty,
        unit_price: 0, // default unit price
        detectedFrom: d.detectedFrom,
        timestamp: Date.now(),
        mechanicName,
      }));
      onPartsChange([...parts, ...newParts]);
    }
  }, [
    diagnosis,
    vehicleInfo,
    parts,
    onPartsChange,
    mechanicName,
    ignoredKeywords,
  ]);

  const handleUpdatePart = (id: string, updates: Partial<UsedPart>) => {
    onPartsChange(parts.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleRemovePart = (id: string) => {
    const partToRemove = parts.find((p) => p.id === id);
    if (partToRemove && partToRemove.keyword !== 'MANUAL') {
      setIgnoredKeywords((prev) => {
        const next = new Set(prev);
        next.add(partToRemove.keyword);
        return next;
      });
    }
    onPartsChange(parts.filter((p) => p.id !== id));
  };

  const handleAddManualPart = () => {
    if (!manualPartName.trim()) return;
    onPartsChange([
      ...parts,
      {
        id: crypto.randomUUID(),
        keyword: 'MANUAL',
        partName: `${manualPartName.toUpperCase()} (${vehicleInfo})`,
        vehicleInfo,
        quantity: 1,
        unit_price: 0,
        detectedFrom: 'ADICIONADO MANUALMENTE',
        timestamp: Date.now(),
        mechanicName,
      },
    ]);
    setManualPartName('');
    setShowAddManual(false);
  };

  if (parts.length === 0 && !showAddManual) {
    return (
      <div className="bg-zinc-900/50 border border-dashed border-zinc-700 rounded-sm p-6 text-center">
        <p className="text-sm text-zinc-500 italic uppercase mb-4">
          Nenhuma peça detectada
        </p>
        <button
          type="button"
          onClick={() => setShowAddManual(true)}
          className="text-xs font-bold text-amber-500 hover:text-amber-400 uppercase underline"
        >
          + Adicionar peça manualmente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-emerald-500">
          Peças Utilizadas ({parts.length}) • {vehicleInfo}
        </span>
        <button
          type="button"
          onClick={() => setShowAddManual(!showAddManual)}
          className="text-[10px] font-bold text-amber-500 uppercase"
        >
          {showAddManual ? 'Cancelar' : '+ Adicionar'}
        </button>
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {parts.map((part) => (
          <PartItemEditor
            key={part.id}
            part={part}
            onUpdate={handleUpdatePart}
            onRemove={handleRemovePart}
          />
        ))}
      </div>
      {showAddManual && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="NOME DA PEÇA..."
            value={manualPartName}
            onChange={(e) => setManualPartName(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleAddManualPart()}
            className="flex-1 bg-zinc-800 border border-zinc-700 text-white px-4 py-3 text-sm font-bold uppercase focus:border-amber-500 focus:outline-none rounded-sm"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAddManualPart}
            className="px-6 py-3 bg-emerald-600 text-white font-black uppercase text-xs rounded-sm"
          >
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
};
