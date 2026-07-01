import React from 'react';
import { Search, Bell, User, X, Car } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  syncStatus: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  syncStatus,
}) => {
  return (
    <header className="bg-zinc-950 border-b border-zinc-800 h-16 flex items-center justify-between px-8 shrink-0">
      {/* Abas de Navegação Unificada */}
      <div className="flex items-center gap-1 sm:gap-2">
        <a
          href="https://cmmpaineldebordo.netlify.app/8_produtividade_manfrota/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700 transition-all"
        >
          Manutenção de Frota
        </a>
        <span className="px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded">
          Almoxarifado
        </span>
        <a
          href="https://cmmpaineldebordo.netlify.app/1_painel_bordo_cmm/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700 transition-all"
        >
          Painel de Bordo CMM
        </a>
        <a
          href="https://cmmpaineldebordo.netlify.app/4_garantias_cmm_dashboard/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700 transition-all"
        >
          Garantia
        </a>
        <a
          href="https://cmmpaineldebordo.netlify.app/1_painel_bordo_cmm/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-900/60 rounded hover:border-emerald-800 transition-all flex items-center gap-1.5"
        >
          <Car className="w-3 h-3" />
          Cadê o Carro?
        </a>
      </div>

      {/* Ações do Usuário e Status de Sincronização */}
      <div className="flex items-center gap-6">
        {/* Status de Sincronização */}
        <div className="hidden md:block">
          {syncStatus}
        </div>

        <div className="flex items-center gap-4 pl-6 border-l border-zinc-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black uppercase text-amber-500 tracking-wider">Acesso Chefia</p>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Gestão de Estoque</p>
          </div>
          <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
            <User className="w-5 h-5 text-zinc-400" />
          </div>
        </div>
      </div>
    </header>
  );
};
