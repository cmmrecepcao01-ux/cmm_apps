export enum ServiceStatus {
  IN_PROGRESS = 'EM_ANDAMENTO',
  RESOLVED = 'RESOLVIDO',
  OUTSOURCED = 'CONTRATAÇÃO',
  SIGNALING = 'SINALIZADOR',
  GRAPHICS = 'GRAFISMO',
  UNLOADING = 'DESCARGA',
  TIRE_SHOP = 'BORRACHARIA',
  WARRANTY = 'GARANTIA',
  TECHNICAL = 'SETOR TÉCNICO',
  HEAVY_MECHANICAL = 'LINHA MECÂNICA PESADOS', // Novo
  STORES = 'ALMOXARIFADO' // Novo
}

export enum UserRole {
  CHIEF = 'CHEFE',
  SUBCHIEF = 'SUBCHEFE',
  MECHANIC = 'MECANICO'
}

export enum Department {
  RECEPTION = 'RECEPÇÃO',
  MECHANICAL = 'LINHA MECÂNICA',
  SIGNALING = 'SINALIZADOR',
  CHIEFS = 'CHEFES',
  GRAPHICS = 'GRAFISMO', // Novo
  TECHNICAL = 'SETOR TÉCNICO', // Novo
  HEAVY_MECHANICAL = 'LINHA MECÂNICA PESADOS', // Novo
  STORES = 'ALMOXARIFADO' // Novo
}

export interface ReopenRequest {
  requesterName: string;
  reason: string;
  timestamp: number;
}

export interface WorkLog {
  mechanicName: string;
  description: string;
  remainingTasks: string;
  timestamp: number;
  durationInSession: number;
  destination?: string; // NOVO: Guarda a seção/destino dessa etapa do histórico
}

export interface UsedPart {
  id: string;
  keyword: string;
  partName: string;
  vehicleInfo: string;
  quantity: number;
  unit_price: number; // ADICIONADO: O cérebro vai ler este valor
  detectedFrom: string;
  timestamp: number;
  mechanicName: string;
}

export interface PartKeyword {
  keywords: string[];
  partName: string;
  category: string;
  defaultQty: number;
}

export interface Mechanic {
  id: string;
  name: string;
  role: UserRole;
  department?: Department;
  password?: string;
  passwordSet: boolean;
  resetRequested?: boolean;
  hourlyRate: number; // <--- ADICIONE ESTA LINHA
}

export interface Vehicle {
  plate: string;
  brand: string;
  model: string;
  year: string;
  opm: string;
}

export interface ServiceRecord {
  id: string;
  os?: string;
  plate: string;
  prefix?: string; // <--- ADICIONE ESTA LINHA AQUI
  brand: string;
  model: string;
  year: string;
  opm: string;
  km?: string;
  reportedDefect?: string;
  clientEmail?: string; // <--- ADICIONE ESTA LINHA AQUI
  readyForClient?: boolean; // <-- ADICIONE ESTA LINHA
  status: ServiceStatus;
  globalStartTime: number;
  endTime?: number;
  entryDate?: string;
  exitDate?: string;
  
  individualTimes: Record<string, number>;
  activeWorkSessions?: Record<string, number>;
  
  finalDiagnosis?: string;
  mechanics: string[];
  logs: WorkLog[];
  
  reopenRequest?: ReopenRequest;
  
  draftWorkDone?: string;
  draftRemaining?: string;
  draftDiagnosis?: string;
  
  delegatedTo?: string;
  delegatedBy?: string;
  delegatedAt?: number;
  
  usedParts?: UsedPart[];
  assignedSection?: string;
  
  releaseToken?: string; // NOVO: Token usado para liberar o veículo
}

export type AppState = 
  | 'START_PAGE'      // Tela de entrada (Uso Interno ou Usuário)
  | 'PRE_AUTH'        // Tela de identificação/cadastro inicial
  | 'SELECT_MECHANIC' 
  | 'AUTH' 
  | 'DASHBOARD' 
  | 'NEW_SERVICE' 
  | 'ACTIVE_SERVICE' 
  | 'CONSULT_SERVICE' 
  | 'VIEW_DETAILS' 
  | 'CHIEF_STATS' 
  | 'MY_STATS' 
  | 'RECURRENCE_DETAILS'
  | 'IMPORT_VEHICLES'
  | 'PARTS_STATS'
  | 'READY_VEHICLES' 
  | 'CLIENT_CONSULT';

  export interface PartCatalog {
    id?: string;
    code?: string;
    description: string;
    category?: string;
    brand?: string;
    vehicle_model?: string;
    price: number;
    stock_quantity: number;
  }
  
  export interface PartUsage {
    id?: string;
    service_id: string;
    part_id: string;
    part_description: string;
    category: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    used_at?: string;
  }