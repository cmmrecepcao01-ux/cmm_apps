import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  AlertTriangle, 
  ArrowUpDown, 
  Settings, 
  Menu,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';

export type ActiveTab = 'DASHBOARD' | 'CATALOG' | 'ALERTS' | 'STOCK_MANAGER' | 'REPORTS';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  lowStockCount,
}) => {
  const navItems = [
    {
      id: 'DASHBOARD' as ActiveTab,
      label: 'Painel Geral',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'CATALOG' as ActiveTab,
      label: 'Buscar Peças',
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: 'ALERTS' as ActiveTab,
      label: 'Alertas Críticos',
      icon: <AlertTriangle className="w-5 h-5" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      id: 'STOCK_MANAGER' as ActiveTab,
      label: 'Lançar Entr. / Saída',
      icon: <ArrowUpDown className="w-5 h-5" />,
    },
    {
      id: 'REPORTS' as ActiveTab,
      label: 'Relatórios & Export',
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  return (
    <aside 
      className={`${isOpen ? 'w-64' : 'w-20'} bg-zinc-950 border-r border-zinc-800 transition-all duration-300 flex flex-col shrink-0`}
    >
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between border-b border-zinc-900">
        {isOpen ? (
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tighter uppercase text-amber-500">CMM ALMOX</span>
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Controle de Estoque</span>
          </div>
        ) : (
          <span className="font-black text-base text-amber-500">CMM</span>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded transition-colors"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation menu items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-md transition-all relative ${
                isActive 
                  ? 'bg-amber-500 text-black font-black' 
                  : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white font-medium'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {isOpen && <span className="text-xs uppercase tracking-wider">{item.label}</span>}
              
              {item.badge !== undefined && (
                <span className={`absolute ${isOpen ? 'right-4' : 'top-1 right-1'} px-2 py-0.5 rounded-full text-[9px] font-black ${
                  isActive ? 'bg-black text-amber-500' : item.badgeColor
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Version Tag */}
      <div className="p-4 border-t border-zinc-900 text-center">
        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
          {isOpen ? 'CMM Sistema Almox v2.0' : 'v2.0'}
        </p>
      </div>
    </aside>
  );
};
