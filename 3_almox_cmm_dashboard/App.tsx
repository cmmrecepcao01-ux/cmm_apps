import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';
import { getVehicleType, VehicleType } from './utils';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardStats } from './components/DashboardStats';
import { InventoryList } from './components/InventoryList';
import { LowStockAlerts } from './components/LowStockAlerts';
import { StockManager, ManualTransaction } from './components/StockManager';
import { EssentialAlertModal } from './components/EssentialAlertModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Clock, RefreshCw, AlertTriangle, FileSpreadsheet } from 'lucide-react';

interface FleetcomItem {
  id: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  vehicleType: VehicleType;
  isLowStock: boolean;
}

interface SupabaseUsedPart {
  id: string;
  keyword: string;
  partName: string;
  quantity: number;
  timestamp: number;
  vehicleInfo?: string;
  detectedFrom?: string;
  mechanicName?: string;
}

interface ServiceRecord {
  id: string;
  exitDate?: string;
  endTime?: number;
  usedParts?: SupabaseUsedPart[] | string;
}

const GOOGLE_DRIVE_URL = "https://docs.google.com/spreadsheets/d/1eMSJT2nq2Vk12uBcK_Tcph0qLJjRbD1Q/export?format=xlsx";

const App: React.FC = () => {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<ActiveTab>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Data States
  const [sheetInventory, setSheetInventory] = useState<FleetcomItem[]>([]);
  const [supabaseServices, setSupabaseServices] = useState<ServiceRecord[]>([]);
  const [manualTransactions, setManualTransactions] = useState<ManualTransaction[]>([]);
  
  // Loading & Sync States
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Quick Action State (abrir formulário de movimentação com peça pré-selecionada)
  const [quickActionPart, setQuickActionPart] = useState<FleetcomItem | null>(null);

  // Alerta de peças essenciais para Spin, Trailblazer e S10
  const [showEssentialAlert, setShowEssentialAlert] = useState(true);

  // 1. Carregar dados do localStorage ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem('almox_manual_transactions');
    if (saved) {
      try {
        setManualTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao ler transações manuais do localStorage", e);
      }
    }
  }, []);

  // 2. Buscar dados da planilha do Google Drive (inventário atual)
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch(GOOGLE_DRIVE_URL);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const rows = XLSX.utils.sheet_to_json<any>(firstSheet, { range: 1 });

      const mappedData: FleetcomItem[] = rows
        .filter((row: any) => {
          // Filtra linhas de sumário no fim da planilha
          return (
            row['Descrição'] &&
            typeof row['Descrição'] === 'string' &&
            typeof row['Unidade'] === 'string' &&
            row['Local'] !== undefined
          );
        }) 
        .map((row: any) => {
          const qty = Number(row['Qt Atual']) || 0;
          const totalValue = Number(row['Saldo Valor']) || 0;
          const description = String(row['Descrição']).toUpperCase().trim();
          const brand = String(row['Marca Apl.'] || 'N/D').toUpperCase().trim();
          const model = String(row['Modelo Apl.'] || 'N/D').toUpperCase().trim();
          const category = String(row['Gr. Veicular'] || 'GERAL').toUpperCase().trim();

          const vehicleType = getVehicleType(brand, model, category, description);

          // Limites para alertas individuais
          let isLowStock = false;
          if (description.includes('PNEU')) {
            isLowStock = qty < 5;
          } else if (description.includes('BATERIA')) {
            isLowStock = qty < 3;
          } else if (description.includes('PASTILHA')) {
            isLowStock = qty < 5;
          } else {
            isLowStock = qty < 2;
          }

          return {
            id: String(row['Cód. Interno'] || Math.random().toString(36).substring(2, 9)),
            description,
            category,
            brand,
            model,
            quantity: qty,
            totalValue: totalValue,
            unitPrice: qty > 0 ? totalValue / qty : 0,
            vehicleType,
            isLowStock
          };
        });

      setSheetInventory(mappedData);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Erro ao carregar inventário da planilha:", error);
      alert("Erro ao conectar com a folha de cálculo. Usando cache local.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Buscar dados de serviços do Supabase (para saídas históricas)
  const fetchSupabaseData = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, exitDate, endTime, usedParts');

      if (error) {
        console.error("Erro ao buscar serviços no Supabase:", error);
        return;
      }

      setSupabaseServices(data || []);
    } catch (e) {
      console.error("Erro de conexão com Supabase:", e);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchSupabaseData();
  }, []);

  // 4. Integrar movimentações manuais locais com as quantidades da planilha
  const inventory = useMemo(() => {
    // Clona inventário original
    const currentInv = sheetInventory.map(item => ({ ...item }));

    // Aplica transações manuais
    manualTransactions.forEach(t => {
      const item = currentInv.find(p => p.id === t.partId);
      if (item) {
        if (t.type === 'ENTRADA') {
          item.quantity += t.quantity;
        } else {
          item.quantity = Math.max(0, item.quantity - t.quantity);
        }
        item.totalValue = item.quantity * item.unitPrice;
        
        // Reavalia baixo estoque individual
        if (item.description.includes('PNEU')) {
          item.isLowStock = item.quantity < 5;
        } else if (item.description.includes('BATERIA')) {
          item.isLowStock = item.quantity < 3;
        } else if (item.description.includes('PASTILHA')) {
          item.isLowStock = item.quantity < 5;
        } else {
          item.isLowStock = item.quantity < 2;
        }
      }
    });

    return currentInv;
  }, [sheetInventory, manualTransactions]);

  // 5. Totalizadores de Estoque
  const totalItems = inventory.length;
  const totalValue = inventory.reduce((acc, item) => acc + item.totalValue, 0);
  const totalQuantity = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const zeroStockItems = inventory.filter(i => i.quantity === 0).length;

  // 6. Alertas Globais Específicos (Pneus, Baterias, Pastilhas)
  const tiresTotal = useMemo(() => {
    return inventory
      .filter(item => item.description.includes('PNEU'))
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [inventory]);

  const batteriesTotal = useMemo(() => {
    return inventory
      .filter(item => item.description.includes('BATERIA'))
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [inventory]);

  const brakePadsTotal = useMemo(() => {
    return inventory
      .filter(item => item.description.includes('PASTILHA') || (item.category === 'FREIO' && item.description.includes('LONA')))
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [inventory]);

  // Contagem de itens com estoque baixo individual
  const lowStockItemsCount = useMemo(() => {
    return inventory.filter(item => item.isLowStock).length;
  }, [inventory]);

  // 6.5. Peças essenciais críticas para Trailblazer, Spin e S10 (baterias, discos, pastilhas, arrefecimento, óleo, pneus)
  const essentialCriticalItems = useMemo(() => {
    const ESSENTIAL_WORDS = ['BATERIA', 'DISCO', 'PASTILHA', 'ARREFECIMENTO', 'OLEO', 'ÓLEO', 'PNEU', 'ADITIVO', 'RADIADOR', 'TERMOSTATICA'];
    const CRITICAL_VEHICLES = ['TRAILBLAZER', 'TRAIL BLAZER', 'SPIN', 'S10', 'S-10'];

    return inventory.filter(item => {
      if (!item) return false;
      const descUpper = (item.description || '').toUpperCase();
      const modelUpper = (item.model || '').toUpperCase();
      const categoryUpper = (item.category || '').toUpperCase();

      const isEssential = ESSENTIAL_WORDS.some(word => descUpper.includes(word) || categoryUpper.includes(word));
      const isCriticalVehicle = CRITICAL_VEHICLES.some(v => modelUpper.includes(v) || descUpper.includes(v));

      if (!isEssential || !isCriticalVehicle) return false;

      // Alerta se estoque for menor que o limite correspondente
      const qty = item.quantity || 0;
      if (descUpper.includes('PNEU')) {
        return qty < 5;
      } else if (descUpper.includes('BATERIA')) {
        return qty < 3;
      } else if (descUpper.includes('PASTILHA') || descUpper.includes('DISCO')) {
        return qty < 5;
      } else {
        return qty < 5; // Óleo / arrefecimento / etc.
      }
    });
  }, [inventory]);

  // 7. Estatísticas por Tipo de Veículo
  const categorizedData = useMemo(() => {
    const stats = {
      LEVES: { count: 0, qty: 0, value: 0 },
      MOTOS: { count: 0, qty: 0, value: 0 },
      PESADOS: { count: 0, qty: 0, value: 0 },
      GERAL: { count: 0, qty: 0, value: 0 }
    };

    inventory.forEach(item => {
      const type = item.vehicleType;
      stats[type].count++;
      stats[type].qty += item.quantity;
      stats[type].value += item.totalValue;
    });

    return stats;
  }, [inventory]);

  // 8. Agrupamento histórico mensal de Entradas (locais) e Saídas (Supabase + locais)
  const monthlyStats = useMemo(() => {
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const currentYear = new Date().getFullYear();
    
    // Inicializa estrutura para os últimos 6 meses (ex: FEV a JUL)
    const statsMap: Record<string, { monthIdx: number, outputsCount: number, outputsValue: number, inputsCount: number, inputsValue: number }> = {};
    
    // Pegar os últimos 6 meses incluindo o atual
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mName = `${months[d.getMonth()]}/${String(d.getFullYear()).substring(2)}`;
      statsMap[mName] = {
        monthIdx: d.getMonth(),
        outputsCount: 0,
        outputsValue: 0,
        inputsCount: 0,
        inputsValue: 0
      };
    }

    // A. Processar Saídas Automáticas do Supabase (UsedParts em ordens de serviço finalizadas)
    supabaseServices.forEach(service => {
      let parts: SupabaseUsedPart[] = [];
      if (typeof service.usedParts === 'string') {
        try {
          parts = JSON.parse(service.usedParts);
        } catch (e) {}
      } else if (Array.isArray(service.usedParts)) {
        parts = service.usedParts;
      }

      if (parts.length === 0) return;

      // Determinar mês/ano do serviço
      let serviceMonth = -1;
      let serviceYear = currentYear;

      if (service.exitDate) {
        // Formato esperado: "10/03/2026, 16:14"
        const match = service.exitDate.match(/\/(\d{2})\/(\d{4})/);
        if (match) {
          serviceMonth = parseInt(match[1]) - 1;
          serviceYear = parseInt(match[2]);
        }
      } else if (service.endTime) {
        const d = new Date(service.endTime);
        serviceMonth = d.getMonth();
        serviceYear = d.getFullYear();
      }

      if (serviceMonth !== -1) {
        const mKey = `${months[serviceMonth]}/${String(serviceYear).substring(2)}`;
        if (statsMap[mKey]) {
          parts.forEach(part => {
            const qty = Number(part.quantity) || 1;
            
            // Tentamos bater o preço unitário do catálogo, senão 0
            const catalogItem = sheetInventory.find(item => 
              item.description === part.partName.toUpperCase().split('(')[0].trim() ||
              item.description.includes(part.keyword.toUpperCase())
            );
            const price = catalogItem ? catalogItem.unitPrice : 0;

            statsMap[mKey].outputsCount += qty;
            statsMap[mKey].outputsValue += qty * price;
          });
        }
      }
    });

    // B. Processar Lançamentos Manuais Locais
    manualTransactions.forEach(t => {
      const d = new Date(t.timestamp);
      const mKey = `${months[d.getMonth()]}/${String(d.getFullYear()).substring(2)}`;
      
      if (statsMap[mKey]) {
        if (t.type === 'ENTRADA') {
          statsMap[mKey].inputsCount += t.quantity;
          statsMap[mKey].inputsValue += t.quantity * t.unitPrice;
        } else {
          statsMap[mKey].outputsCount += t.quantity;
          statsMap[mKey].outputsValue += t.quantity * t.unitPrice;
        }
      }
    });

    // Converte para lista ordenada
    return Object.entries(statsMap).map(([monthName, values]) => ({
      monthName,
      ...values
    }));
  }, [supabaseServices, manualTransactions, sheetInventory]);

  // 9. Handlers para Lançamentos Manuais
  const handleAddTransaction = (newTx: Omit<ManualTransaction, 'id' | 'timestamp'>) => {
    const transaction: ManualTransaction = {
      ...newTx,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    const updated = [transaction, ...manualTransactions];
    setManualTransactions(updated);
    localStorage.setItem('almox_manual_transactions', JSON.stringify(updated));
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = manualTransactions.filter(t => t.id !== id);
    setManualTransactions(updated);
    localStorage.setItem('almox_manual_transactions', JSON.stringify(updated));
  };

  const handleClearTransactions = () => {
    setManualTransactions([]);
    localStorage.removeItem('almox_manual_transactions');
  };

  // Quick Action Handler (Lançar saída rápida para uma peça)
  const handleQuickAction = (item: FleetcomItem) => {
    setQuickActionPart(item);
    setActiveTab('STOCK_MANAGER');
  };

  return (
    <div className="min-h-screen bg-black text-white flex font-sans overflow-hidden">
      {/* Sidebar Lateral */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        lowStockCount={zeroStockItems + (tiresTotal < 50 ? 1 : 0) + (batteriesTotal < 30 ? 1 : 0) + (brakePadsTotal < 60 ? 1 : 0)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Superior */}
        <Header 
          searchQuery="" 
          setSearchQuery={() => {}}
          syncStatus={
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                {lastSyncTime ? `Última sinc: ${lastSyncTime.toLocaleTimeString()}` : 'Não sincronizado'}
              </span>
              <button 
                onClick={() => {
                  fetchInventory();
                  fetchSupabaseData();
                }}
                disabled={loading}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors text-amber-500 disabled:opacity-50"
                title="Sincronizar Planilha e Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          }
        />

        {/* Corpo Principal da Aplicação */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header da Aba Corrente */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
                  {activeTab === 'DASHBOARD' && 'Painel Geral de Controle'}
                  {activeTab === 'CATALOG' && 'Catálogo de Peças'}
                  {activeTab === 'ALERTS' && 'Alertas e Estoque Mínimo'}
                  {activeTab === 'STOCK_MANAGER' && 'Controle de Movimentação'}
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-1">
                  {activeTab === 'DASHBOARD' && 'Dados consolidados da frota e estoque físico'}
                  {activeTab === 'CATALOG' && 'Pesquise e consulte a quantidade de peças'}
                  {activeTab === 'ALERTS' && 'Itens com estoque zerado ou abaixo dos limites operacionais'}
                  {activeTab === 'STOCK_MANAGER' && 'Lançamento manual de entradas e saídas físicas'}
                </p>
              </div>

              {/* Botão de Atalho para o Google Sheets Original */}
              <a
                href="https://docs.google.com/spreadsheets/d/1eMSJT2nq2Vk12uBcK_Tcph0qLJjRbD1Q/edit"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-bold uppercase tracking-wide rounded text-zinc-400 hover:text-white transition-all flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                Planilha Fleetcom
              </a>
            </div>

            {/* Renderização Condicional de Conteúdo */}
            <ErrorBoundary>
              {activeTab === 'DASHBOARD' && (
                <DashboardStats 
                  totalItems={totalItems}
                  totalQuantity={totalQuantity}
                  totalValue={totalValue}
                  zeroStockItems={zeroStockItems}
                  lowStockItemsCount={lowStockItemsCount}
                  categorizedData={categorizedData}
                  monthlyStats={monthlyStats}
                  onNavigateToCatalog={(cat, type) => {
                    setActiveTab('CATALOG');
                  }}
                  onNavigateToAlerts={() => {
                    // Se houver peças críticas essenciais, abre o popup explicativo
                    if (essentialCriticalItems.length > 0) {
                      setShowEssentialAlert(true);
                    } else {
                      setActiveTab('ALERTS');
                    }
                  }}
                />
              )}

              {activeTab === 'CATALOG' && (
                <InventoryList 
                  inventory={inventory}
                  loading={loading}
                  onOpenTransactionModal={handleQuickAction}
                />
              )}

              {activeTab === 'ALERTS' && (
                <LowStockAlerts 
                  inventory={inventory}
                  tiresTotal={tiresTotal}
                  batteriesTotal={batteriesTotal}
                  brakePadsTotal={brakePadsTotal}
                  onOpenTransactionModal={handleQuickAction}
                />
              )}

              {activeTab === 'STOCK_MANAGER' && (
                <StockManager 
                  inventory={inventory}
                  manualTransactions={manualTransactions}
                  onAddTransaction={handleAddTransaction}
                  onClearTransactions={handleClearTransactions}
                  onDeleteTransaction={handleDeleteTransaction}
                  selectedPartForQuickAction={quickActionPart}
                  clearQuickActionPart={() => setQuickActionPart(null)}
                />
              )}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Pop up de alerta para peças essenciais operacionais */}
      <EssentialAlertModal 
        isOpen={showEssentialAlert}
        onClose={() => setShowEssentialAlert(false)}
        criticalItems={essentialCriticalItems}
        onOpenTransactionModal={handleQuickAction}
      />
    </div>
  );
};

export default App;