/// <reference types="vite/client" />
import React, { useState, useEffect, useMemo } from 'react';
import {
  Mechanic,
  AppState,
  ServiceRecord,
  ServiceStatus,
  UserRole,
  Vehicle,
  UsedPart,
  Department,
  WorkLog,
} from './types';
import {
  MECHANICS as INITIAL_DATA,
} from './constants';
import {
  Wrench,
  Play,
  Search,
  Clock,
  User,
  FileSpreadsheet,
  CheckCircle2,
  LogOut,
  Eye,
  BarChart3,
  TrendingUp,
  Car,
  Settings,
  ClipboardList,
  Loader2,
  AlertTriangle,
  Database,
  UserCog,
  Power,
  Bell,
  Brush,
  Cpu,
  Truck,
  Package,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// Importação dos Componentes Modulares
import { PreAuthView } from './components/PreAuthView';
import { AuthView } from './components/AuthView';
import { NewServiceForm } from './components/NewServiceForm';
import { ConsultServiceView } from './components/ConsultServiceView';
import { ActiveServiceTimer } from './components/ActiveServiceTimer';
import { ServiceDetailsView } from './components/ServiceDetailsView';
import { ChiefStatsDashboard, RecurrenceExpansion } from './components/ChiefStatsDashboard';
import { ClientConsultView } from './components/ClientConsultView';
import { ImportVehiclesView } from './components/ImportVehiclesView';
import { SearchResultsView } from './components/SearchResultsView';
import { ActiveMechanicsModal } from './components/ActiveMechanicsModal';
import { formatMS } from './components/utils';

// ========== CONFIGURAÇÕES ==========
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const MASTER_PASS_DEFAULT = 'cmm2026';

const MASTER_USER: Mechanic = {
  id: 'master-999',
  name: 'ADMINISTRADOR MASTER',
  role: UserRole.CHIEF,
  department: Department.CHIEFS,
  passwordSet: true,
  hourlyRate: 0,
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const GOOGLE_SHEETS_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL || '';
const GOOGLE_NOTIFY_URL = import.meta.env.VITE_GOOGLE_NOTIFY_URL || '';
const GOOGLE_SHEETS_CONTROLE_URL = import.meta.env.VITE_GOOGLE_SHEETS_CONTROLE_URL || '';

// ========== FUTURA INTEGRAÇÃO DE ASSISTENTE IA ==========
/*
// Para reativar o assistente de IA da frota no futuro:
// 1. Crie uma variável VITE_GEMINI_API_KEY no arquivo .env.local
// 2. Descomente e adeque a função abaixo chamando a API oficial da Google AI.
//
// const handleAiAskFuture = async (prompt: string, yardData: any) => {
//   try {
//     const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + import.meta.env.VITE_GEMINI_API_KEY, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         contents: [{ parts: [{ text: prompt }] }]
//       })
//     });
//     const data = await response.json();
//     return data.candidates[0].content.parts[0].text;
//   } catch(e) {
//     console.error("Erro IA:", e);
//     return "Falha ao conectar com o assistente.";
//   }
// };
*/

// ========== FUNÇÕES AUXILIARES ==========
const getDestinationHistoryText = (logs: WorkLog[]): string => {
  const sections: string[] = [];
  (logs || []).forEach((log) => {
    if (log.destination) {
      sections.push(log.destination);
    }
  });

  const uniqueSections: string[] = [];
  sections.forEach((sec) => {
    if (uniqueSections.length === 0 || uniqueSections[uniqueSections.length - 1] !== sec) {
      uniqueSections.push(sec);
    }
  });

  return uniqueSections.join('\n');
};

const sendToGoogleSheets = async (data: {
  os: string;
  plate: string;
  year: string;
  brand: string;
  model: string;
  opm: string;
  prefix?: string;
  entryDate: string;
  problem?: string;
  exitDate?: string;
  destination?: string;
  km?: string;
}) => {
  try {
    const sheetData = {
      OS: data.os || '',
      PLACA: data.plate || '',
      ANO: data.year || '',
      'MARCA/MODELO': (data.brand || '') + '/' + (data.model || ''),
      UNIDADE: data.opm || '',
      PREFIXO: data.prefix || '',
      'DATA DE ENTRADA NA LINHA': data.entryDate || '',
      'TEMPO PARADA': '',
      'PROBLEMA RELATADO': data.problem || '',
      'DATA DE SAÍDA': data.exitDate || '',
      DESTINO: data.destination || '',
      KM: data.km || '',
    };

    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ data: sheetData }),
    });

    await fetch(GOOGLE_SHEETS_CONTROLE_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ data: sheetData }),
    });

    console.log('Dados enviados para ambas as planilhas com sucesso.');
  } catch (error) {
    console.error('Erro ao enviar para as planilhas:', error);
  }
};

const INITIAL_MECHANICS: Mechanic[] = INITIAL_DATA.map((m) => ({
  ...m,
  passwordSet: false,
}));

// ========== APP PRINCIPAL ==========
const App: React.FC = () => {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [currentMechanic, setCurrentMechanic] = useState<Mechanic | null>(null);
  const [selectedForAuth, setSelectedForAuth] = useState<Mechanic | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  );
  const [view, setView] = useState<AppState>('START_PAGE');
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );
  const [searchPlate, setSearchPlate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showActiveMechanicsModal, setShowActiveMechanicsModal] = useState<
    string | null
  >(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('TODOS');

  const activeServices = services
    .filter((s) => {
      const saiu = s.exit_date || s.exitDate;
      const pronto = s.ready_for_client || s.readyForClient;

      if (saiu || pronto || s.status === ServiceStatus.UNLOADING) return false;

      const setoresInternos = [
        'LINHA MECÂNICA',
        'BORRACHARIA',
        'SINALIZADOR',
        'GRAFISMO',
        'SETOR TÉCNICO',
        'LINHA MECÂNICA PESADOS',
        'ALMOXARIFADO',
      ];

      return setoresInternos.includes(s.assignedSection || '');
    })
    .sort((a, b) => {
      const nameA = `${a.brand || ''} ${a.model || ''}`.toUpperCase();
      const nameB = `${b.brand || ''} ${b.model || ''}`.toUpperCase();
      const isTrailA = nameA.includes('TRAILBLAZER');
      const isTrailB = nameB.includes('TRAILBLAZER');

      if (isTrailA && !isTrailB) return -1;
      if (!isTrailA && isTrailB) return 1;

      const timeA = a.globalStartTime
          ? new Date(a.globalStartTime).getTime()
          : 0;
      const timeB = b.globalStartTime
          ? new Date(b.globalStartTime).getTime()
          : 0;

      return timeB - timeA;
    });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: mechData } = await supabase.from('mechanics').select('*');
        if (!mechData || mechData.length === 0) {
          await supabase.from('mechanics').upsert(INITIAL_MECHANICS);
          setMechanics(INITIAL_MECHANICS);
        } else {
          setMechanics(mechData.sort((a, b) => Number(a.id) - Number(b.id)));
        }
        const { data: servData } = await supabase.from('services').select('*');
        if (servData) setServices(servData);
        const { data: vehiclesData } = await supabase
          .from('vehicles')
          .select('*');
        if (vehiclesData) setVehicles(vehiclesData);
      } catch (e) {
        console.error('Erro ao carregar dados', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const persistService = async (service: ServiceRecord) => {
    try {
      const { error } = await supabase.from('services').upsert(service);
      if (error) {
        console.error('Erro técnico no Supabase:', error);
        alert(
          `ERRO AO SALVAR NO BANCO: ${error.message}\nA viatura não foi finalizada no sistema.`
        );
        return;
      }

      setServices((prev) => {
        const exists = prev.find((s) => s.id === service.id);
        return exists
          ? prev.map((s) => (s.id === service.id ? service : s))
          : [...prev, service];
      });
    } catch (e) {
      console.error(e);
      alert('Erro crítico de conexão ao tentar salvar.');
    }
  };

  const handleGlobalSearch = (query: string) => {
    if (!query.trim()) return;
    setSearchQuery(query.toUpperCase());
    setView('SEARCH_RESULTS' as AppState);
  };

  const persistMechanic = async (mechanic: Mechanic) => {
    await supabase.from('mechanics').upsert(mechanic);
    setMechanics((prev) =>
      prev.map((m) => (m.id === mechanic.id ? mechanic : m))
    );
  };

  const handleAuthSuccess = async (m: Mechanic, newPassword?: string) => {
    let finalMechanic = { ...m };
    if (newPassword) {
      finalMechanic = {
        ...m,
        password: newPassword,
        passwordSet: true,
        resetRequested: false,
      };
      await persistMechanic(finalMechanic);
    }
    setCurrentMechanic(finalMechanic);
    setSelectedServiceId(null);
    
    // REDIRECIONAMENTO DIRETO PARA O APP DO ALMOXARIFADO
    if (finalMechanic.department === Department.STORES) {
      window.location.href = 'https://cmmalmox.netlify.app/';
      return;
    }

    setView('DASHBOARD');
  };

  const handleStartNewService = async (
    os: string,
    plate: string,
    prefix: string,
    clientEmail: string,
    brand: string,
    model: string,
    year: string,
    opm: string,
    km: string,
    defect: string,
    section: string,
    delegatedTo?: string
  ) => {
    if (!currentMechanic) return;
    const existingService = services.find(
      (s) =>
        s.plate.toUpperCase() === plate.toUpperCase() &&
        s.status === ServiceStatus.IN_PROGRESS
    );
    if (existingService) {
      alert(`⚠️ Placa ${plate} já está no pátio!`);
      return;
    }
    const entryTimestamp = Date.now();
    const newService: ServiceRecord = {
      id: crypto.randomUUID(),
      os: os.toUpperCase(),
      plate: plate.toUpperCase(),
      prefix: prefix.toUpperCase(),
      clientEmail: clientEmail.toLowerCase(),
      brand: brand.toUpperCase(),
      model: model.toUpperCase(),
      year: year.toUpperCase(),
      opm: opm.toUpperCase(),
      km,
      reportedDefect: defect.toUpperCase(),
      assignedSection: section,
      status: ServiceStatus.IN_PROGRESS,
      globalStartTime: entryTimestamp,
      entryDate: new Date(entryTimestamp).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      mechanics: [],
      individualTimes: {},
      activeWorkSessions: {},
      logs: [
        {
          mechanicName: currentMechanic.name,
          description: 'VIATURA CADASTRADA NO PÁTIO',
          remainingTasks: '',
          timestamp: entryTimestamp,
          durationInSession: 0,
          destination: section,
        },
      ],
      ...(delegatedTo && {
        delegatedTo,
        delegatedBy: currentMechanic.name,
        delegatedAt: entryTimestamp,
      }),
    };

    await persistService(newService);
    alert(`✅ Viatura ${plate} cadastrada!`);
    setView('DASHBOARD');

    sendToGoogleSheets({
      os: os,
      plate: plate,
      year: year,
      brand: brand,
      model: model,
      opm: opm,
      prefix: prefix,
      entryDate: new Date().toLocaleDateString('pt-BR'),
      problem: defect,
      km: km,
      destination: section,
    });
  };

  const handleContinueService = async (serviceId: string) => {
    const srv = services.find((s) => s.id === serviceId);
    if (!srv) return;
    if (currentMechanic && srv.activeWorkSessions?.[currentMechanic.id]) {
      setActiveServiceId(serviceId);
      setView('ACTIVE_SERVICE');
      return;
    }
    if (currentMechanic) {
      const activeSessions = {
        ...(srv.activeWorkSessions || {}),
        [currentMechanic.id]: Date.now(),
      };
      const updatedSrv: ServiceRecord = {
        ...srv,
        mechanics: srv.mechanics.includes(currentMechanic.name)
          ? srv.mechanics
          : [...srv.mechanics, currentMechanic.name],
        activeWorkSessions: activeSessions,
        logs: [
          ...srv.logs,
          {
            mechanicName: currentMechanic.name,
            description: 'ASSUMIU O SERVIÇO DA VIATURA',
            remainingTasks: srv.draftRemaining || '',
            timestamp: Date.now(),
            durationInSession: 0,
          },
        ],
      };
      await persistService(updatedSrv);
      setActiveServiceId(serviceId);
      setView('ACTIVE_SERVICE');
    } else {
      setSelectedServiceId(serviceId);
      setView('SELECT_MECHANIC');
    }
  };

  const handlePauseService = async (
    id: string,
    work: string,
    rem: string,
    diag: string,
    sessionDuration: number
  ) => {
    const srv = services.find((s) => s.id === id);
    if (srv && currentMechanic) {
      const activeSessions = { ...(srv.activeWorkSessions || {}) };
      delete activeSessions[currentMechanic.id];
      const updated: ServiceRecord = {
        ...srv,
        draftWorkDone: work,
        draftDiagnosis: diag,
        draftRemaining: rem,
        logs: [
          ...srv.logs,
          {
            mechanicName: currentMechanic.name,
            description: work,
            remainingTasks: rem,
            timestamp: Date.now(),
            durationInSession: sessionDuration,
          },
        ],
        individualTimes: {
          ...(srv.individualTimes || {}),
          [currentMechanic.id]:
            ((srv.individualTimes || {})[currentMechanic.id] || 0) +
            sessionDuration,
        },
        activeWorkSessions: activeSessions,
      };
      await persistService(updated);
    }
    setActiveServiceId(null);
    setView('DASHBOARD');
  };

  const handlePauseMechanicInService = async (
    serviceId: string,
    mechanicId: string
  ) => {
    const srv = services.find((s) => s.id === serviceId);
    if (!srv || !srv.activeWorkSessions?.[mechanicId]) return;
    const sessionDuration = Date.now() - (srv.activeWorkSessions[mechanicId] as number);
    const mechanic = mechanics.find((m) => m.id === mechanicId);
    const activeSessions = { ...(srv.activeWorkSessions || {}) };
    delete activeSessions[mechanicId];
    const updated: ServiceRecord = {
      ...srv,
      logs: [
        ...srv.logs,
        {
          mechanicName: mechanic?.name || 'DESCONHECIDO',
          description: `SESSÃO PAUSADA POR ${currentMechanic?.name}`,
          remainingTasks: srv.draftRemaining || '',
          timestamp: Date.now(),
          durationInSession: sessionDuration,
        },
      ],
      individualTimes: {
        ...(srv.individualTimes || {}),
        [mechanicId]:
          ((srv.individualTimes || {})[mechanicId] || 0) + sessionDuration,
      },
      activeWorkSessions: activeSessions,
    };
    await persistService(updated);
    setShowActiveMechanicsModal(null);
    alert(`Trabalho de ${mechanic?.name} pausado!`);
  };

  const handleEndShift = async () => {
    const activeServicesList = services.filter(
      (s) => s.status === ServiceStatus.IN_PROGRESS
    );
    const totalActiveSessions = activeServicesList.reduce(
      (acc, s) => acc + Object.keys(s.activeWorkSessions || {}).length,
      0
    );
    if (totalActiveSessions === 0) {
      alert('Não há mecânicos trabalhando.');
      return;
    }
    if (
      !confirm(
        `Pausar ${totalActiveSessions} sessões em ${activeServicesList.length} viatura(s)?`
      )
    )
      return;
    setIsLoading(true);
    const now = Date.now();
    for (const service of activeServicesList) {
      if (
        !service.activeWorkSessions ||
        Object.keys(service.activeWorkSessions).length === 0
      )
        continue;
      const newLogs = [...service.logs];
      const newIndividualTimes = { ...(service.individualTimes || {}) };
      Object.entries(service.activeWorkSessions).forEach(
        ([mechanicId, startTime]) => {
          const sessionDuration = now - (startTime as number);
          const mechanic = mechanics.find((m) => m.id === mechanicId);
          newIndividualTimes[mechanicId] =
            (newIndividualTimes[mechanicId] || 0) + sessionDuration;
          newLogs.push({
            mechanicName: mechanic?.name || 'DESCONHECIDO',
            description: `EXPEDIENTE ENCERRADO POR ${currentMechanic?.name}`,
            remainingTasks: service.draftRemaining || '',
            timestamp: now,
            durationInSession: sessionDuration,
          });
        }
      );
      await persistService({
        ...service,
        logs: newLogs,
        individualTimes: newIndividualTimes,
        activeWorkSessions: {},
      });
    }
    setIsLoading(false);
    alert('✅ Expediente encerrado!');
  };

  const handleSyncDrafts = async (
    id: string,
    work: string,
    rem: string,
    diag: string
  ) => {
    const srv = services.find((s) => s.id === id);
    if (srv) {
      const previousDiag = srv.draftDiagnosis || '';
      const newDiag = diag ? (previousDiag && previousDiag !== diag ? previousDiag + '\n' + diag : diag) : previousDiag;
      
      await persistService({
        ...srv,
        draftWorkDone: work,
        draftDiagnosis: newDiag,
        draftRemaining: rem,
      });
      alert('Salvo!');
    }
  };

  const handleFinishService = async (
    id: string,
    diagnosis: string,
    status: ServiceStatus,
    lastWork: string,
    remaining: string,
    sessionDuration: number,
    usedParts: UsedPart[] = []
  ) => {
    const srv = services.find((s) => s.id === id);
    if (srv && currentMechanic) {
      const exitTimestamp = Date.now();
      const exitDateFormatted = new Date(exitTimestamp).toLocaleString(
        'pt-BR',
        {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      );
      const destinationMap: Record<string, string> = {
        [ServiceStatus.RESOLVED]: 'LIBERADO',
        [ServiceStatus.OUTSOURCED]: 'CONTRATAÇÃO',
        [ServiceStatus.SIGNALING]: 'SINALIZADOR',
        [ServiceStatus.GRAPHICS]: 'GRAFISMO',
        [ServiceStatus.UNLOADING]: 'DESCARGA',
        [ServiceStatus.TIRE_SHOP]: 'BORRACHARIA',
        [ServiceStatus.WARRANTY]: 'GARANTIA',
        [ServiceStatus.TECHNICAL]: 'SETOR TÉCNICO',
        [ServiceStatus.IN_PROGRESS]: 'EM ANDAMENTO',
        [ServiceStatus.HEAVY_MECHANICAL]: 'LINHA MECÂNICA PESADOS',
      };

      const isResolved = status === ServiceStatus.RESOLVED;
      const previousDiag = srv.draftDiagnosis || srv.finalDiagnosis || '';
      const finalDiag = diagnosis ? (previousDiag && previousDiag !== diagnosis ? previousDiag + '\n' + diagnosis : diagnosis) : previousDiag;
      
      const updated: ServiceRecord = {
        ...srv,
        status,
        assignedSection: destinationMap[status] || srv.assignedSection,
        endTime: isResolved ? exitTimestamp : srv.endTime,
        exitDate: isResolved ? exitDateFormatted : srv.exitDate,
        readyForClient: false,
        finalDiagnosis: finalDiag,
        draftDiagnosis: finalDiag,
        logs: [
          ...srv.logs,
          {
            mechanicName: currentMechanic.name,
            description: lastWork,
            remainingTasks: remaining,
            timestamp: exitTimestamp,
            durationInSession: sessionDuration,
            destination: destinationMap[status],
          },
        ],
        individualTimes: {
          ...(srv.individualTimes || {}),
          [currentMechanic.id]:
            ((srv.individualTimes || {})[currentMechanic.id] || 0) +
            sessionDuration,
        },
        activeWorkSessions: {},
        usedParts: usedParts,
      };

      await persistService(updated);

      const destHistoryText = getDestinationHistoryText(updated.logs);

      sendToGoogleSheets({
        os: srv.os || '',
        plate: srv.plate,
        prefix: srv.prefix,
        year: srv.year,
        brand: srv.brand,
        model: srv.model,
        opm: srv.opm,
        entryDate: new Date(srv.globalStartTime).toLocaleDateString('pt-BR'),
        exitDate: new Date().toLocaleDateString('pt-BR'),
        destination: destHistoryText,
        km: srv.km,
        problem: finalDiag,
      }).catch((err) => console.error('Erro Planilha Saída:', err));
    }

    setActiveServiceId(null);
    setView('DASHBOARD');
  };

  const handleReopenService = async (serviceId: string) => {
    const srv = services.find((s) => s.id === serviceId);
    if (!srv) return alert('Serviço não encontrado.');

    if (
      !confirm(
        `Tem certeza que deseja reabrir o serviço para ${srv.plate}?\n\nIsso permitirá editar o diagnóstico novamente.`
      )
    )
      return;

    let lastSection = 'LINHA MECÂNICA';
    for (let i = srv.logs.length - 1; i >= 0; i--) {
      const dest = srv.logs[i].destination;
      if (dest && dest !== 'LIBERADO' && dest !== 'DESCONHECIDO') {
        lastSection = dest;
        break;
      }
    }

    const exitTimestamp = Date.now();
    const updatedLogs = [
      ...srv.logs,
      {
        mechanicName: currentMechanic?.name || 'RECEPÇÃO',
        description: 'SERVIÇO REABERTO',
        remainingTasks: '',
        timestamp: exitTimestamp,
        durationInSession: 0,
        destination: lastSection,
      }
    ];

    const destHistoryText = getDestinationHistoryText(updatedLogs);

    const updated: ServiceRecord = {
      ...srv,
      status: ServiceStatus.IN_PROGRESS,
      assignedSection: lastSection,
      endTime: null as any,
      exitDate: '',
      readyForClient: false,
      releaseToken: null as any,
      logs: updatedLogs,
    };

    await persistService(updated);

    sendToGoogleSheets({
      os: srv.os || '',
      plate: srv.plate,
      prefix: srv.prefix,
      year: srv.year,
      brand: srv.brand,
      model: srv.model,
      opm: srv.opm,
      entryDate: new Date(srv.globalStartTime).toLocaleDateString('pt-BR'),
      exitDate: '',
      destination: destHistoryText,
      km: srv.km,
      problem: srv.finalDiagnosis || srv.draftDiagnosis || '',
    }).catch((err) => console.error('Erro Planilha Reabertura:', err));

    alert(`✅ Serviço ${srv.plate} reaberto com sucesso!`);
    setView('DASHBOARD');
  };

  // LIBERAÇÃO DIRETA DA VIATURA (Sem exigir token de 6 dígitos)
  const handleReleaseVehicleDirect = async () => {
    if (!selectedServiceId || !currentMechanic) return;
    
    const targetService = services.find((s) => s.id === selectedServiceId);
    if (!targetService) return;

    if (!confirm(`Deseja realmente liberar a saída da viatura ${targetService.plate}?`)) return;

    const exitTimestamp = Date.now();
    const exitDateFormatted = new Date(exitTimestamp).toLocaleString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );

    const updatedLogs = [
      ...targetService.logs,
      {
        mechanicName: currentMechanic.name,
        description: 'SAÍDA AUTORIZADA / LIBERADO',
        remainingTasks: '',
        timestamp: exitTimestamp,
        durationInSession: 0,
        destination: 'LIBERADO',
      }
    ];

    const destHistoryText = getDestinationHistoryText(updatedLogs);

    const updated: ServiceRecord = {
      ...targetService,
      status: ServiceStatus.RESOLVED,
      endTime: exitTimestamp,
      exitDate: exitDateFormatted,
      releaseToken: 'LIBERADO_DIRETO',
      logs: updatedLogs,
    };

    await persistService(updated);

    sendToGoogleSheets({
      os: targetService.os || '',
      plate: targetService.plate,
      prefix: targetService.prefix,
      year: targetService.year,
      brand: targetService.brand,
      model: targetService.model,
      opm: targetService.opm,
      entryDate: new Date(targetService.globalStartTime).toLocaleDateString('pt-BR'),
      exitDate: new Date().toLocaleDateString('pt-BR'),
      destination: destHistoryText,
      km: targetService.km,
      problem: targetService.finalDiagnosis || targetService.draftDiagnosis || '',
    }).catch((err) => console.error('Erro Planilha Saída Direta:', err));

    alert('✅ SAÍDA LIBERADA COM SUCESSO!');
    setSelectedServiceId(null);
    setView('DASHBOARD');
  };

  const handleImportVehicles = async (newVehicles: Vehicle[]) => {
    try {
      await supabase.from('vehicles').delete().neq('plate', '');
      await supabase.from('vehicles').insert(newVehicles);
      setVehicles(newVehicles);
      alert(`✅ ${newVehicles.length} veículos importados!`);
      setView('DASHBOARD');
    } catch (e) {
      alert('Erro ao importar.');
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const detailData = services.map((s) => {
      const vtrLaborCost = Object.entries(s.individualTimes || {}).reduce(
        (acc, [mId, timeMs]) => {
          const mech = mechanics.find((m) => m.id === mId);
          const rate =
            mech?.hourlyRate ||
            INITIAL_DATA.find((me) => me.id === mId)?.hourlyRate ||
            0;
          return acc + (Number(timeMs) / 3600000) * rate;
        },
        0
      );

      return {
        OS: s.os || 'N/A',
        PLACA: s.plate,
        PREFIXO: s.prefix || '',
        'MARCA/MODELO': `${s.brand} ${s.model}`,
        'UNIDADE (OPM)': s.opm,
        KM: s.km || '0',
        'DATA ENTRADA': s.entryDate || '',
        'DATA SAÍDA': s.exitDate || 'EM PÁTIO',
        'TEMPO TOTAL (MS)': (s.endTime || Date.now()) - s.globalStartTime,
        'TEMPO FORMATADO': formatMS(
          (s.endTime || Date.now()) - s.globalStartTime
        ),
        STATUS: s.status,
        'CUSTO MÃO DE OBRA (R$)': vtrLaborCost,
        'DIAGNÓSTICO FINAL': s.finalDiagnosis || s.draftDiagnosis || '',
      };
    });

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(detailData),
      'HISTORICO_GERAL'
    );

    const teamData = stats.mechanicStats.map((m) => {
      const rate = m.hourlyRate || 0;
      return {
        NOME: m.name,
        'POSTO/GRAD': m.role,
        ATENDIMENTOS: m.count,
        'TOTAL HORAS TRABALHADAS': (m.totalTime / 3600000).toFixed(2),
        'VALOR HORA (R$)': rate,
        'VALOR MINUTO (R$)': (rate / 60).toFixed(4),
        'CUSTO MENSAL BASE (156h)': (rate * 156).toFixed(2),
        'CUSTO TOTAL ACUMULADO (R$)': m.totalCost.toFixed(2),
        'MÉDIA CUSTO POR VTR (R$)':
          m.count > 0 ? (m.totalCost / m.count).toFixed(2) : '0.00',
      };
    });

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(teamData),
      'PRODUTIVIDADE_EQUIPE'
    );

    const incidenceData = stats.ranking.map(
      ([plate, data]: any, idx: number) => {
        const plateTotalCost = services
          .filter((s) => s.plate === plate)
          .reduce((acc, s) => {
            const sCost = Object.entries(s.individualTimes || {}).reduce(
              (subAcc, [mId, timeMs]) => {
                const mech = mechanics.find((m) => m.id === mId);
                const rate =
                  mech?.hourlyRate ||
                  INITIAL_DATA.find((me) => me.id === mId)?.hourlyRate ||
                  0;
                return subAcc + (Number(timeMs) / 3600000) * rate;
              },
              0
            );
            return acc + sCost;
          }, 0);

        return {
          RANKING: idx + 1,
          PLACA: plate,
          VEÍCULO: `${data.brand} ${data.model}`,
          UNIDADE: data.opm,
          'QUANTIDADE DE ENTRADAS': data.count,
          'CUSTO ACUMULADO NA OFICINA (R$)': plateTotalCost.toFixed(2),
        };
      }
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(incidenceData),
      'RANKING_VEICULOS'
    );

    const sectionData = stats.sectionRanking.map((sec) => ({
      'SEÇÃO / SETOR': sec.label,
      'TOTAL DE SERVIÇOS': sec.count,
      'REPRESENTAÇÃO (%)': sec.percentage.toFixed(2) + '%',
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(sectionData),
      'ESTATISTICAS_SECOES'
    );

    const destinyData = stats.destinationRanking.map((dest) => ({
      'DESTINO / ENCAMINHAMENTO': dest.label,
      'TOTAL DE VIATURAS': dest.count,
      'REPRESENTAÇÃO (%)': dest.percentage.toFixed(2) + '%',
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(destinyData),
      'RESULTADOS_E_ENCAMINHAMENTOS'
    );

    XLSX.writeFile(
      wb,
      `DADOS_COMPILADOS_CMM_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const stats = useMemo(() => {
    const resolved = services.filter(
      (s) => s.status !== ServiceStatus.IN_PROGRESS
    );

    const validResolved = resolved.filter(
      (s) => s.endTime && s.globalStartTime && s.endTime > s.globalStartTime
    );

    const avgTime =
      validResolved.length > 0
        ? validResolved.reduce(
            (acc, s) => acc + (s.endTime! - s.globalStartTime),
            0
          ) / validResolved.length
        : 0;
    const sectionStats: Record<
      string,
      { count: number; label: string; color: string }
    > = {
      'LINHA MECÂNICA': { count: 0, label: 'Linha Mecânica', color: '#10b981' },
      SINALIZADOR: { count: 0, label: 'Sinalizador', color: '#3b82f6' },
      GRAFISMO: { count: 0, label: 'Grafismo', color: '#a855f7' },
      BORRACHARIA: { count: 0, label: 'Borracharia', color: '#f97316' },
      DESCARGA: { count: 0, label: 'Descarga', color: '#f43f5e' },
      GARANTIA: { count: 0, label: 'Garantia', color: '#06b6d4' },
      'SETOR TÉCNICO': { count: 0, label: 'Setor Técnico', color: '#dc2626' },
      'LINHA MECÂNICA PESADOS': {
        count: 0,
        label: 'L. Mec. Pesados',
        color: '#064e3b',
      },
      ALMOXARIFADO: { count: 0, label: 'Almoxarifado', color: '#71717a' },
      CONTRATAÇÃO: { count: 0, label: 'Contratação', color: '#f59e0b' },
    };
    services.forEach((s) => {
      if (s.assignedSection && sectionStats[s.assignedSection]) {
        sectionStats[s.assignedSection].count++;
      }
    });
    const totalWithSection = services.filter((s) => s.assignedSection).length;
    const sectionRanking = Object.entries(sectionStats)
      .map(([key, data]) => ({
        status: key,
        ...data,
        percentage:
          totalWithSection > 0 ? (data.count / totalWithSection) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
    const destinationStats: Record<
      string,
      { count: number; label: string; color: string }
    > = {
      [ServiceStatus.RESOLVED]: {
        count: 0,
        label: 'Resolvido',
        color: '#10b981',
      },
      [ServiceStatus.OUTSOURCED]: {
        count: 0,
        label: 'Contratação',
        color: '#f59e0b',
      },
      [ServiceStatus.SIGNALING]: {
        count: 0,
        label: 'Sinalizador',
        color: '#3b82f6',
      },
      [ServiceStatus.GRAPHICS]: {
        count: 0,
        label: 'Grafismo',
        color: '#a855f7',
      },
      [ServiceStatus.UNLOADING]: {
        count: 0,
        label: 'Descarga',
        color: '#f43f5e',
      },
      [ServiceStatus.TIRE_SHOP]: {
        count: 0,
        label: 'Borracharia',
        color: '#f97316',
      },
      [ServiceStatus.WARRANTY]: {
        count: 0,
        label: 'Garantia',
        color: '#06b6d4',
      },
      [ServiceStatus.TECHNICAL]: {
        count: 0,
        label: 'Setor Técnico',
        color: '#ec4899',
      },
      [ServiceStatus.HEAVY_MECHANICAL]: {
        count: 0,
        label: 'L. Mec. Pesados',
        color: '#064e3b',
      },
    };
    resolved.forEach((s) => {
      if (destinationStats[s.status]) destinationStats[s.status].count++;
    });
    const totalFinalized = resolved.length;
    const destinationRanking = Object.entries(destinationStats)
      .map(([status, data]) => ({
        status,
        ...data,
        percentage:
          totalFinalized > 0 ? (data.count / totalFinalized) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
    const keywords = [
      'FREIO',
      'ÓLEO',
      'BATERIA',
      'SUSPENSÃO',
      'PNEU',
      'MOTOR',
      'ELÉTRICA',
      'FILTRO',
      'EMBREAGEM',
      'AMORTECEDOR',
      'CORREIA',
      'RADIADOR',
    ];
    const frequency: Record<string, number> = {};
    keywords.forEach((k) => (frequency[k] = 0));
    services.forEach((s) => {
      const diag = (s.finalDiagnosis || s.draftDiagnosis || '').toUpperCase();
      keywords.forEach((k) => {
        if (diag.includes(k)) frequency[k]++;
      });
    });
    const ranking = Object.entries(
      services.reduce((acc: any, s) => {
        acc[s.plate] = acc[s.plate] || {
          count: 0,
          brand: s.brand,
          model: s.model,
          opm: s.opm,
          year: s.year,
          lastServiceId: s.id,
        };
        acc[s.plate].count++;
        acc[s.plate].lastServiceId = s.id;
        return acc;
      }, {})
    )
      .sort((a: any, b: any) => b[1].count - a[1].count)
      .slice(0, 10);

    const mechStats = mechanics.map((m) => {
      const mServices = services.filter(
        (s) =>
          ((s.individualTimes || {})[m.id] || 0) > 0 ||
          s.activeWorkSessions?.[m.id]
      );
      const totalTime = mServices.reduce(
        (acc, s) =>
          acc +
          ((s.individualTimes || {})[m.id] || 0) +
          (s.activeWorkSessions?.[m.id]
            ? Date.now() - (s.activeWorkSessions[m.id] as number)
            : 0),
        0
      );

      const effectiveRate =
        m.hourlyRate ||
        INITIAL_DATA.find((me) => me.id === m.id)?.hourlyRate ||
        0;
      const totalHours = totalTime / 3600000;
      const totalCost = totalHours * effectiveRate;

      return {
        id: m.id,
        name: m.name,
        role: m.role,
        hourlyRate: effectiveRate,
        totalCost,
        resetRequested: m.resetRequested,
        totalTime,
        count: mServices.filter((s) => s.status !== ServiceStatus.IN_PROGRESS)
          .length,
        vtrs: mServices.map((s) => ({
          plate: s.plate,
          model: s.model,
          brand: s.brand,
          status: s.status,
          id: s.id,
          individualTime:
            ((s.individualTimes || {})[m.id] || 0) +
            (s.activeWorkSessions?.[m.id]
              ? Date.now() - (s.activeWorkSessions[m.id] as number)
              : 0),
        })),
      };
    });
    return {
      avgTime,
      ranking,
      mechanicStats: mechStats,
      frequency,
      destinationRanking,
      totalFinalized,
      sectionRanking,
      totalWithSection,
    };
  }, [services, mechanics]);

  const filteredActiveServices = useMemo(() => {
    if (activeSectionFilter === 'TODOS') return activeServices;
    return activeServices.filter((s) => s.assignedSection === activeSectionFilter);
  }, [activeServices, activeSectionFilter]);

  const canEndShift =
    currentMechanic &&
    (currentMechanic.name.startsWith('SGT ') ||
      currentMechanic.role === UserRole.CHIEF ||
      currentMechanic.role === UserRole.SUBCHIEF);

  if (isLoading)
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white italic">
          Carregando...
        </span>
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white pb-12 font-sans">
      <header className="bg-zinc-950 border-b border-zinc-900 p-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <Wrench className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter uppercase">
              CMM{' '}
              <span className="text-zinc-500 font-normal">
                Manutenção de Frota
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
              isOnline 
                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' 
                : 'bg-rose-950/40 text-rose-400 border border-rose-800/30 animate-pulse'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              {isOnline ? 'Online' : 'Offline'}
            </div>
            {currentMechanic && (
              <button
                onClick={() => {
                  setCurrentMechanic(null);
                  setView('SELECT_MECHANIC');
                }}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg h-9 w-9 flex items-center justify-center border border-zinc-800 hover:border-zinc-700"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        {view === 'START_PAGE' && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <img
              src="https://lh3.googleusercontent.com/d/1ar6IpO_6dF2hM9N_-3hRGjAqQ5kG3KRy"
              alt="Logo CMM"
              className="w-48 h-auto mb-8 drop-shadow-2xl"
            />
            <h2 className="text-3xl font-black mb-12 text-center tracking-tighter uppercase italic">
              Bem-vindo ao CMM
            </h2>

            <div className="flex flex-col gap-6 w-full max-w-md">
              <button
                onClick={() => setView('PRE_AUTH')}
                className="w-full py-12 bg-zinc-950 border-4 border-zinc-800 hover:border-white text-white font-black uppercase text-2xl tracking-widest rounded-2xl shadow-2xl transition-all active:scale-95 flex flex-col items-center justify-center gap-2"
              >
                ACESSO CMM
                <span className="text-xs font-bold opacity-60">
                  (USO INTERNO)
                </span>
                <Wrench className="w-8 h-8 mt-2 text-amber-500" />
              </button>

              <button
                onClick={() => setView('CLIENT_CONSULT')}
                className="w-full py-12 bg-zinc-950 border-4 border-zinc-800 hover:border-white text-white font-black uppercase text-2xl tracking-widest rounded-2xl shadow-2xl transition-all active:scale-95 flex flex-col items-center justify-center gap-2"
              >
                CONSULTAR VEÍCULO
                <span className="text-xs font-bold opacity-60">(USUÁRIO)</span>
                <Search className="w-8 h-8 mt-2" />
              </button>
            </div>

            <div className="mt-20 flex justify-center">
              <button
                onClick={() => {
                  const input = prompt(
                    'SISTEMA CMM - ACESSO DE SEGURANÇA\nDIGITE A SENHA MASTER:'
                  );
                  if (input === MASTER_PASS_DEFAULT) {
                    setCurrentMechanic(MASTER_USER);
                    setView('DASHBOARD');
                  } else if (input !== null) {
                    alert('ACESSO NEGADO');
                  }
                }}
                className="text-[10px] text-zinc-800 font-black uppercase tracking-[0.5em] hover:text-zinc-600 transition-colors"
              >
                AJUDA
              </button>
            </div>
          </div>
        )}

        {view === 'PRE_AUTH' && (
          <PreAuthView
            mechanics={mechanics}
            onUpdatePass={async (m, p) => {
              await persistMechanic({ ...m, password: p, passwordSet: true });
            }}
            onSuccess={() => setView('SELECT_MECHANIC')}
          />
        )}

        {view === 'SELECT_MECHANIC' && (
          <div className="flex flex-col items-center justify-center py-20 animate-in slide-in-from-right duration-500">
            <button
              onClick={() => setView('START_PAGE')}
              className="mb-8 px-6 py-3 bg-zinc-800 text-white font-bold uppercase text-[9px] rounded-lg flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Início
            </button>
            <h2 className="text-3xl font-bold mb-12 text-center tracking-tighter uppercase">
              Seções
            </h2>
            {!selectedDepartment ? (
              <div className="flex flex-col gap-4 w-full max-w-md">
                <button
                  onClick={() => setSelectedDepartment('CHEFES')}
                  className="w-full py-8 bg-zinc-700 text-white font-black uppercase text-xl rounded-xl flex items-center justify-center gap-4 active:scale-95 shadow-xl border-2 border-white/20 hover:bg-zinc-600 transition-all"
                >
                  <UserCog className="w-8 h-8 text-amber-500" /> Chefes
                </button>

                <button
                  onClick={() => setSelectedDepartment('RECEPÇÃO')}
                  className="w-full py-8 bg-amber-600 text-white font-black uppercase text-xl rounded-xl flex items-center justify-center gap-4 active:scale-95"
                >
                  <ClipboardList className="w-8 h-8" /> Recepção
                </button>

                <button
                  onClick={() => setSelectedDepartment('LINHA MECÂNICA')}
                  className="w-full py-8 bg-emerald-600 text-white font-black uppercase text-xl rounded-xl flex items-center justify-center gap-4 active:scale-95"
                >
                  <Wrench className="w-8 h-8" /> Linha Mecânica
                </button>

                <button
                  onClick={() => setSelectedDepartment('SINALIZADOR')}
                  className="w-full py-8 bg-blue-600 text-white font-black uppercase text-xl rounded-xl flex items-center justify-center gap-4 active:scale-95"
                >
                  <AlertTriangle className="w-8 h-8" /> SINALIZADOR
                </button>

                <button
                  onClick={() => setSelectedDepartment('GRAFISMO')}
                  className="w-full py-8 bg-purple-600 text-white font-black uppercase text-xl rounded-xl flex items-center justify-center gap-4 active:scale-95"
                >
                  <Brush className="w-8 h-8" /> GRAFISMO
                </button>

                <button
                  onClick={() => setSelectedDepartment('SETOR TÉCNICO')}
                  className="w-full py-8 bg-red-600 text-white font-black uppercase text-xl rounded-xl flex items-center justify-center gap-4 active:scale-95"
                >
                  <Cpu className="w-8 h-8" /> Setor Técnico
                </button>

                <button
                  onClick={() =>
                    setSelectedDepartment('LINHA MECÂNICA PESADOS')
                  }
                  className="w-full py-8 bg-emerald-900 text-white font-black uppercase text-xl rounded-xl flex items-center justify-center gap-4 active:scale-95"
                >
                  <Truck className="w-8 h-8" /> L. Mecânica Pesados
                </button>

                <button
                  onClick={() => setSelectedDepartment('ALMOXARIFADO')}
                  className="w-full py-8 bg-zinc-500 text-white font-black uppercase text-xl rounded-xl flex items-center justify-center gap-4 active:scale-95"
                >
                  <Package className="w-8 h-8" /> Almoxarifado
                </button>
              </div>
            ) : (
              <div className="w-full max-w-4xl">
                <button
                  onClick={() => setSelectedDepartment(null)}
                  className="mb-8 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-xs rounded-lg flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
                <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      selectedDepartment === 'CHEFES'
                        ? 'bg-zinc-400'
                        : selectedDepartment === 'RECEPÇÃO'
                        ? 'bg-amber-500'
                        : selectedDepartment === 'LINHA MECÂNICA'
                        ? 'bg-emerald-500'
                        : selectedDepartment === 'SINALIZADOR'
                        ? 'bg-blue-500'
                        : selectedDepartment === 'GRAFISMO'
                        ? 'bg-purple-500'
                        : selectedDepartment === 'SETOR TÉCNICO'
                        ? 'bg-red-600'
                        : selectedDepartment === 'LINHA MECÂNICA PESADOS'
                        ? 'bg-emerald-900'
                        : 'bg-zinc-500'
                    }`}
                  ></div>

                  <h3
                    className={`text-2xl font-black uppercase tracking-widest ${
                      selectedDepartment === 'CHEFES'
                        ? 'text-zinc-400'
                        : selectedDepartment === 'RECEPÇÃO'
                        ? 'text-amber-500'
                        : selectedDepartment === 'LINHA MECÂNICA'
                        ? 'text-emerald-500'
                        : selectedDepartment === 'SINALIZADOR'
                        ? 'text-blue-500'
                        : selectedDepartment === 'GRAFISMO'
                        ? 'text-purple-500'
                        : selectedDepartment === 'SETOR TÉCNICO'
                        ? 'text-red-600'
                        : selectedDepartment === 'LINHA MECÂNICA PESADOS'
                        ? 'text-emerald-900'
                        : 'text-zinc-500'
                    }`}
                  >
                    {selectedDepartment}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mechanics
                    .filter((m) => m.department === selectedDepartment)
                    .map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedForAuth(m);
                          setView('AUTH');
                        }}
                        className={`bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl flex items-center justify-between group transition-all ${
                          selectedDepartment === 'CHEFES'
                            ? 'hover:bg-zinc-800 hover:border-zinc-500'
                            : selectedDepartment === 'RECEPÇÃO'
                            ? 'hover:bg-amber-900/20 hover:border-amber-600'
                            : selectedDepartment === 'LINHA MECÂNICA'
                            ? 'hover:bg-emerald-900/20 hover:border-emerald-600'
                            : 'hover:bg-blue-900/20 hover:border-blue-600'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                              m.role === UserRole.CHIEF
                                ? 'bg-white text-black border-white'
                                : selectedDepartment === 'RECEPÇÃO'
                                ? 'text-white border-amber-600'
                                : selectedDepartment === 'LINHA MECÂNICA'
                                ? 'text-white border-emerald-600'
                                : 'text-white border-blue-600'
                            }`}
                          >
                            <User className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <span className="block text-base font-bold uppercase text-white">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 uppercase font-bold">
                              {m.role}
                            </span>
                          </div>
                        </div>
                        <Lock
                          className={`w-5 h-5 text-zinc-700 ${
                            selectedDepartment === 'CHEFES'
                              ? 'group-hover:text-zinc-400'
                              : selectedDepartment === 'RECEPÇÃO'
                              ? 'group-hover:text-amber-500'
                              : selectedDepartment === 'LINHA MECÂNICA'
                              ? 'group-hover:text-emerald-500'
                              : 'group-hover:text-blue-500'
                          }`}
                        />
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {view === 'AUTH' && selectedForAuth && (
          <AuthView
            mechanic={selectedForAuth}
            onSuccess={handleAuthSuccess}
            onCancel={() => setView('SELECT_MECHANIC')}
            onRequestReset={() => {
              persistMechanic({ ...selectedForAuth, resetRequested: true });
              alert('Solicitação enviada.');
              setView('SELECT_MECHANIC');
            }}
          />
        )}
        
        {view === 'DASHBOARD' && (
          <div className="space-y-6">
            {canEndShift && (
              <button
                onClick={handleEndShift}
                className="w-full py-6 bg-gradient-to-r from-rose-600 to-orange-600 text-white font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 rounded-xl shadow-2xl hover:from-rose-700 hover:to-orange-700 transition-all"
              >
                <Power className="w-6 h-6" /> ENCERRAR EXPEDIENTE
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setView('NEW_SERVICE')}
                disabled={currentMechanic?.role === UserRole.CHIEF}
                className="bg-white text-black p-10 rounded-2xl flex flex-col items-center justify-center gap-4 active:scale-95 disabled:opacity-30 shadow-2xl transition-all"
              >
                <Play className="w-12 h-12" />
                <span className="text-xl font-black uppercase tracking-tighter">
                  Nova Entrada
                </span>
              </button>
              <button
                onClick={() => setView('CONSULT_SERVICE')}
                className="bg-zinc-900 text-white p-10 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center gap-4 hover:bg-zinc-850 hover:border-zinc-700 shadow-xl transition-all"
              >
                <Search className="w-12 h-12 text-zinc-500" />
                <span className="text-xl font-black uppercase tracking-tighter text-white">
                  SERVIÇOS FINALIZADOS
                </span>
              </button>
            </div>

            {(currentMechanic?.department === 'RECEPÇÃO' ||
              currentMechanic?.role === UserRole.CHIEF) && (
              <button
                onClick={() => setView('READY_VEHICLES')}
                className="w-full bg-emerald-950/20 border border-emerald-500/30 p-6 rounded-xl flex items-center justify-center gap-4 hover:bg-emerald-900/20 hover:border-emerald-500/50 transition-all shadow-xl"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <div className="text-left">
                  <span className="block text-lg font-black uppercase tracking-tighter text-white">
                    Veículos Prontos
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">
                    {
                      services.filter(
                        (s) =>
                          (s.status === ServiceStatus.RESOLVED ||
                            s.status === ServiceStatus.OUTSOURCED ||
                            s.status === ServiceStatus.WARRANTY) &&
                          !s.releaseToken
                      ).length
                    }{' '}
                    Aguardando Liberação / Externos
                  </span>
                </div>
              </button>
            )}

            {currentMechanic?.role === UserRole.CHIEF && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setView('CHIEF_STATS')}
                  className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex items-center justify-center gap-4 hover:border-white shadow-xl transition-all"
                >
                  <BarChart3 className="w-6 h-6 text-white" />
                  <span className="text-sm font-bold uppercase">
                    Gestão Painel CMM
                  </span>
                </button>
                <button
                  onClick={exportToExcel}
                  className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex items-center justify-center gap-4 hover:border-white shadow-xl transition-all"
                >
                  <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
                  <span className="text-sm font-bold uppercase">
                    Relatório Excel
                  </span>
                </button>
                <button
                  onClick={() => setView('IMPORT_VEHICLES')}
                  className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex items-center justify-center gap-4 hover:border-white shadow-xl transition-all"
                >
                  <Database className="w-6 h-6 text-amber-500" />
                  <span className="text-sm font-bold uppercase">
                    Importar Frota
                  </span>
                </button>
              </div>
            )}

            <div className="space-y-6 pt-10 border-t border-zinc-900 mt-10">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Car className="w-4 h-4 text-amber-500" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
                    Pátio Ativo
                  </h4>
                  <span className="bg-amber-500 text-black px-2 py-0.5 rounded-md font-black text-[11px]">
                    {activeServices.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveSectionFilter('TODOS')}
                    className={`px-3 py-2 border rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-tighter transition-all ${
                      activeSectionFilter === 'TODOS'
                        ? 'border-white text-black bg-white'
                        : 'border-zinc-800 text-zinc-400 bg-zinc-950/40 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <span>Todos</span>
                    <span className="text-[10px] font-mono opacity-80">{activeServices.length}</span>
                  </button>
                  {[
                    'LINHA MECÂNICA',
                    'BORRACHARIA',
                    'SINALIZADOR',
                    'GRAFISMO',
                    'SETOR TÉCNICO',
                    'LINHA MECÂNICA PESADOS',
                    'ALMOXARIFADO',
                  ].map((setor) => {
                    const count = activeServices.filter(
                      (s) => s.assignedSection === setor
                    ).length;
                    if (count === 0 && activeSectionFilter !== setor) return null;
                    const colors: Record<string, { active: string, inactive: string }> = {
                      'LINHA MECÂNICA': {
                        active: 'border-emerald-500 text-black bg-emerald-500',
                        inactive: 'border-emerald-950/30 text-emerald-500 bg-emerald-950/10 hover:border-emerald-800'
                      },
                      BORRACHARIA: {
                        active: 'border-orange-500 text-black bg-orange-500',
                        inactive: 'border-orange-950/30 text-orange-500 bg-orange-950/10 hover:border-orange-800'
                      },
                      SINALIZADOR: {
                        active: 'border-blue-500 text-black bg-blue-500',
                        inactive: 'border-blue-950/30 text-blue-500 bg-blue-950/10 hover:border-blue-800'
                      },
                      GRAFISMO: {
                        active: 'border-purple-500 text-black bg-purple-500',
                        inactive: 'border-purple-950/30 text-purple-500 bg-purple-950/10 hover:border-purple-800'
                      },
                      'SETOR TÉCNICO': {
                        active: 'border-red-500 text-black bg-red-500',
                        inactive: 'border-red-950/30 text-red-500 bg-red-950/10 hover:border-red-800'
                      },
                      'LINHA MECÂNICA PESADOS': {
                        active: 'border-amber-500 text-black bg-amber-500',
                        inactive: 'border-amber-950/30 text-amber-500 bg-amber-950/10 hover:border-amber-800'
                      },
                      ALMOXARIFADO: {
                        active: 'border-zinc-400 text-black bg-zinc-400',
                        inactive: 'border-zinc-800 text-zinc-400 bg-zinc-950/10 hover:border-zinc-700'
                      },
                    };
                    const colorStyles = colors[setor] || {
                      active: 'border-zinc-400 text-black bg-zinc-400',
                      inactive: 'border-zinc-800 text-zinc-400 bg-zinc-950/10'
                    };
                    return (
                      <button
                        key={setor}
                        onClick={() => setActiveSectionFilter(setor)}
                        className={`px-3 py-2 border rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-tighter transition-all ${
                          activeSectionFilter === setor ? colorStyles.active : colorStyles.inactive
                        }`}
                      >
                        <span>{setor === 'LINHA MECÂNICA PESADOS' ? 'PESADOS' : setor}</span>
                        <span className="text-[10px] font-mono opacity-80">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3">
                {filteredActiveServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center justify-between gap-4 group hover:border-zinc-700 transition-all shadow-lg"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-mono font-bold text-white uppercase tracking-tighter group-hover:text-amber-500 transition-colors">
                            {service.plate}
                          </span>
                          <span
                            className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${
                              {
                                'LINHA MECÂNICA':
                                  'border-emerald-900 text-emerald-500 bg-emerald-950/20',
                                BORRACHARIA:
                                  'border-orange-900 text-orange-500 bg-orange-950/20',
                                SINALIZADOR:
                                  'border-blue-900 text-blue-500 bg-blue-950/20',
                                GRAFISMO:
                                  'border-purple-900 text-purple-500 bg-purple-950/20',
                                'SETOR TÉCNICO':
                                  'border-red-900 text-red-500 bg-red-950/20',
                                'LINHA MECÂNICA PESADOS':
                                  'border-emerald-955 text-emerald-700 bg-emerald-955/40',
                                ALMOXARIFADO:
                                  'border-zinc-700 text-zinc-400 bg-zinc-900/20',
                              }[service.assignedSection || ''] ||
                              'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {service.assignedSection}
                          </span>
                        </div>
                        <span className="text-white text-[10px] ml-1 uppercase tracking-widest">
                          {service.brand} {service.model}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-zinc-500 uppercase font-black">
                          Tempo Oficina
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-500">
                          {formatMS(
                            ((service.status === ServiceStatus.RESOLVED || service.releaseToken)
                              ? (service.endTime || service.logs[service.logs.length - 1]?.timestamp || Date.now())
                              : Date.now()) - service.globalStartTime
                          )}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedServiceId(service.id);
                            setView('VIEW_DETAILS');
                          }}
                          className="p-3 border border-zinc-800 hover:border-zinc-700 text-white hover:bg-zinc-900 rounded-lg shadow-lg transition-all"
                          title="Visualizar Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {currentMechanic?.role !== UserRole.CHIEF && (
                          <button
                            onClick={() => handleContinueService(service.id)}
                            className="px-5 py-3 bg-white text-black text-[10px] font-black uppercase rounded-lg active:scale-95 shadow-lg hover:bg-zinc-205 transition-all"
                          >
                            Assumir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {activeServices.length === 0 && (
                  <p className="text-center py-10 text-zinc-650 italic uppercase text-[10px] tracking-widest">
                    Pátio Vazio
                  </p>
                )}
                {activeServices.length > 0 && filteredActiveServices.length === 0 && (
                  <p className="text-center py-10 text-zinc-650 italic uppercase text-[10px] tracking-widest">
                    Nenhuma viatura nesta seção
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'CHIEF_STATS' && (
          <ChiefStatsDashboard
            stats={stats}
            services={services}
            mechanics={mechanics}
            onBack={() => setView('DASHBOARD')}
            onViewServiceDetails={(id) => {
              setSelectedServiceId(id);
              setView('VIEW_DETAILS');
            }}
            onResetMechanic={(id) => {
              const m = mechanics.find((x) => x.id === id);
              if (m)
                persistMechanic({
                  ...m,
                  passwordSet: false,
                  resetRequested: false,
                });
              alert('Resetada.');
            }}
            onViewRecurrence={() => setView('RECURRENCE_DETAILS')}
          />
        )}

        {view === 'RECURRENCE_DETAILS' && (
          <RecurrenceExpansion
            stats={stats}
            onBack={() => setView('CHIEF_STATS')}
          />
        )}

        {view === 'NEW_SERVICE' && (
          <NewServiceForm
            allServices={services}
            vehicles={vehicles}
            currentMechanic={currentMechanic}
            mechanics={mechanics}
            onCancel={() => setView('DASHBOARD')}
            onStart={handleStartNewService}
          />
        )}

        {view === 'IMPORT_VEHICLES' && (
          <ImportVehiclesView
            onBack={() => setView('DASHBOARD')}
            onImport={handleImportVehicles}
            currentVehicles={vehicles}
          />
        )}

        {view === 'CONSULT_SERVICE' && (
          <ConsultServiceView
            services={services}
            onBack={() => setView('DASHBOARD')}
            onContinue={handleContinueService}
            onReopen={handleReopenService}
            onViewDetails={(id) => {
              setSelectedServiceId(id);
              setView('VIEW_DETAILS');
            }}
            currentMechanic={currentMechanic}
          />
        )}

        {view === 'ACTIVE_SERVICE' && activeServiceId && (
          <ActiveServiceTimer
            service={services.find((s) => s.id === activeServiceId)!}
            currentMechanic={currentMechanic!}
            onFinish={handleFinishService}
            onSaveDraft={handlePauseService}
            onSyncDrafts={handleSyncDrafts}
            onBack={() => setView('DASHBOARD')}
          />
        )}

        {view === 'VIEW_DETAILS' && selectedServiceId && (
          <ServiceDetailsView
            service={services.find((s) => s.id === selectedServiceId)!}
            allServices={services}
            mechanics={mechanics}
            currentMechanic={currentMechanic!}
            onBack={() => setView('DASHBOARD')}
            onContinue={handleContinueService}
            onRelease={handleReleaseVehicleDirect}
          />
        )}

        {view === 'READY_VEHICLES' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setView('DASHBOARD')}
                className="p-4 bg-white text-black font-black uppercase text-xs rounded-sm flex items-center gap-2 shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <h2 className="text-2xl font-black uppercase text-white italic">
                Aguardando Liberação / Serviços Externos
              </h2>
            </div>

            <div className="grid gap-4">
              {services
                .filter(
                  (s) =>
                    (s.status === ServiceStatus.RESOLVED ||
                      s.status === ServiceStatus.OUTSOURCED ||
                      s.status === ServiceStatus.WARRANTY) &&
                    !s.releaseToken
                )
                .map((s) => (
                  <div
                    key={s.id}
                    className="bg-zinc-950 border border-emerald-500/30 p-6 rounded-sm flex flex-wrap items-center justify-between group hover:border-emerald-500 transition-all shadow-xl"
                  >
                    <div>
                      <span className="text-2xl font-mono font-bold text-white uppercase tracking-tighter">
                        {s.plate}
                      </span>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">
                        {s.brand} {s.model} | {s.opm}
                      </p>

                      <span className="inline-block mt-2 px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase rounded-sm border border-zinc-700">
                        Status: {s.status}
                      </span>

                      {s.readyForClient ? (
                        <span className="inline-block mt-2 ml-2 px-2 py-1 bg-emerald-500 text-black text-[9px] font-black uppercase rounded-sm">
                          Militar Notificado: Viatura Pronta
                        </span>
                      ) : (
                        <span className="inline-block mt-2 ml-2 px-2 py-1 bg-zinc-900 text-rose-500 text-[9px] font-black uppercase rounded-sm border border-rose-900/50">
                          Aguardando Notificação
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!s.readyForClient && (
                        <button
                          onClick={async () => {
                            const { error } = await supabase
                              .from('services')
                              .update({ readyForClient: true })
                              .eq('id', s.id);
                            if (error)
                              return alert('ERRO AO ATUALIZAR NO BANCO.');
                            setServices((prev) =>
                              prev.map((item) =>
                                item.id === s.id
                                  ? { ...item, readyForClient: true }
                                  : item
                              )
                            );
                            if (s.clientEmail) {
                              try {
                                await fetch(GOOGLE_NOTIFY_URL, {
                                  method: 'POST',
                                  mode: 'no-cors',
                                  headers: { 'Content-Type': 'text/plain' },
                                  body: JSON.stringify({
                                    data: {
                                      action: 'ENVIAR_NOTIFICACAO',
                                      email: s.clientEmail,
                                      unidade: s.opm,
                                      prefixo: s.prefix || s.plate,
                                    },
                                  }),
                                });
                                alert(
                                  `NOTIFICAÇÃO ENVIADA E PORTAL ATUALIZADO!`
                                );
                              } catch (err) {
                                alert(
                                  'PORTAL ATUALIZADO, BUT EMAIL SEND FAILED.'
                                );
                              }
                            } else {
                              alert(
                                'PORTAL ATUALIZADO (SEM E-MAIL CADASTRADO).'
                              );
                            }
                          }}
                          className="px-4 py-3 bg-red-700 hover:bg-red-600 text-white font-black text-[9px] uppercase rounded-sm transition-colors flex items-center gap-2 shadow-lg"
                        >
                          <Bell className="w-3 h-3" /> Notificar Pronto
                        </button>
                      )}

                      <button
                        onClick={() => handleReopenService(s.id)}
                        className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase rounded-sm shadow-lg"
                      >
                        Reabrir Serviço
                      </button>

                      <button
                        onClick={() => {
                          setSelectedServiceId(s.id);
                          setView('VIEW_DETAILS');
                        }}
                        className="px-8 py-3 bg-emerald-600 text-white font-black text-xs uppercase rounded-sm hover:bg-emerald-500 shadow-lg"
                      >
                        Liberar Viatura
                      </button>
                    </div>
                  </div>
                ))}

              {services.filter(
                (s) =>
                  (s.status === ServiceStatus.RESOLVED ||
                    s.status === ServiceStatus.OUTSOURCED ||
                    s.status === ServiceStatus.WARRANTY) &&
                  !s.releaseToken
              ).length === 0 && (
                <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-sm">
                  <p className="text-zinc-500 uppercase font-black text-xs italic tracking-widest">
                    Nenhuma viatura pendente de liberação
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'CLIENT_CONSULT' && (
          <ClientConsultView
            services={services}
            onBack={() => setView('START_PAGE')}
          />
        )}

        {view === ( 'SEARCH_RESULTS' as AppState ) && searchQuery && (
          <SearchResultsView
            query={searchQuery}
            services={services}
            onSelect={(id) => {
              setSelectedServiceId(id);
              setView('VIEW_DETAILS');
            }}
            onBack={() => setView('DASHBOARD')}
          />
        )}
      </main>

      {showActiveMechanicsModal && (
        <ActiveMechanicsModal
          service={services.find((s) => s.id === showActiveMechanicsModal)!}
          mechanics={mechanics}
          onClose={() => setShowActiveMechanicsModal(null)}
          onPauseMechanic={handlePauseMechanicInService}
        />
      )}
    </div>
  );
};

// SVG Lock Icon (for matching original custom Lock Component)
const Lock: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default App;
