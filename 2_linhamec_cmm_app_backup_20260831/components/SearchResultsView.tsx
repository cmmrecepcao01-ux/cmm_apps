import React from 'react';
import { ServiceRecord } from '../types';

interface SearchResultsViewProps {
  query: string;
  services: ServiceRecord[];
  onSelect: (id: string) => void;
  onBack: () => void;
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  query,
  services,
  onSelect,
  onBack,
}) => {
  const results = services.filter((s) =>
    Object.values(s).some((val) => String(val).toUpperCase().includes(query))
  );
  return (
    <div className="p-6 bg-black min-h-screen text-white animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8 border-b border-zinc-900 pb-4">
        <div>
          <h2 className="text-xl font-black uppercase italic tracking-tighter">
            Resultados da Busca
          </h2>
          <p className="text-[9px] text-zinc-500 font-mono">
            TERMO: "{query}" • {results.length} ENCONTRADOS
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-[9px] font-black uppercase bg-zinc-900 px-4 py-2 border border-zinc-800 rounded-sm"
        >
          Voltar
        </button>
      </div>

      <div className="space-y-3">
        {results.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="bg-zinc-900/40 p-4 border-l-2 border-white hover:bg-zinc-800 cursor-pointer transition-all"
          >
            <div className="flex justify-between items-center">
              <span className="text-lg font-black font-mono">{s.plate}</span>
              <span className="text-[8px] px-2 py-1 bg-white text-black font-black uppercase">
                {s.status}
              </span>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase">
              {s.model} — {s.opm}
            </p>
          </div>
        ))}
        {results.length === 0 && (
          <p className="text-center text-zinc-700 py-10 font-black uppercase text-xs">
            Nada encontrado.
          </p>
        )}
      </div>
    </div>
  );
};
