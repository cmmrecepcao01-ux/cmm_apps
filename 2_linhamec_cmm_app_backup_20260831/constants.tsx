import { Mechanic, UserRole, PartKeyword, Department } from './types';

export const MECHANICS: Mechanic[] = [
  { id: '1', name: 'CAP MAYCON', role: UserRole.CHIEF, department: Department.CHIEFS, passwordSet: false, hourlyRate: 95.00 },
  { id: '2', name: 'TEN MESNARIC', role: UserRole.SUBCHIEF, department: Department.MECHANICAL, passwordSet: false, hourlyRate: 85.00 },
  { id: '3', name: 'SGT REIS', role: UserRole.MECHANIC, department: Department.MECHANICAL, passwordSet: false, hourlyRate: 57.42 },
  { id: '4', name: 'SGT LUCIANO', role: UserRole.MECHANIC, department: Department.MECHANICAL, passwordSet: false, hourlyRate: 57.42 },
  { id: '5', name: 'CB GASPAR', role: UserRole.MECHANIC, department: Department.MECHANICAL, passwordSet: false, hourlyRate: 49.45 },
  { id: '6', name: 'CB GALVÃO', role: UserRole.MECHANIC, department: Department.MECHANICAL, passwordSet: false, hourlyRate: 49.45 },
  { id: '7', name: 'CB AIRON', role: UserRole.MECHANIC, department: Department.MECHANICAL, passwordSet: false, hourlyRate: 49.45 },
  { id: '8', name: 'CB EDUARDO', role: UserRole.MECHANIC, department: Department.MECHANICAL, passwordSet: false, hourlyRate: 49.45 },
  { id: '11', name: 'SD WILLIAM', role: UserRole.MECHANIC, department: Department.MECHANICAL, passwordSet: false, hourlyRate: 41.84 },
  { id: '12', name: 'SD RONALDO', role: UserRole.MECHANIC, department: Department.MECHANICAL, passwordSet: false, hourlyRate: 41.84 },
  { id: '31', name: 'SD R. OLIVEIRA', role: UserRole.MECHANIC, department: Department.MECHANICAL, passwordSet: false, hourlyRate: 41.84 },
    
  // LINHA MECÂNICA PESADOS (Transferidos)
  { id: '9', name: 'CB GARCIA', role: UserRole.MECHANIC, department: Department.HEAVY_MECHANICAL, passwordSet: false, hourlyRate: 49.45 },
  { id: '10', name: 'CB ALEXANDRE', role: UserRole.MECHANIC, department: Department.HEAVY_MECHANICAL, passwordSet: false, hourlyRate: 49.45 },

  // RECEPÇÃO
  { id: '15', name: 'CB FAUSTINO', role: UserRole.MECHANIC, department: Department.RECEPTION, passwordSet: false, hourlyRate: 49.45 },
  { id: '16', name: 'CB THIAGO', role: UserRole.MECHANIC, department: Department.RECEPTION, passwordSet: false, hourlyRate: 49.45 },
  { id: '17', name: 'CB SANTOS', role: UserRole.MECHANIC, department: Department.RECEPTION, passwordSet: false, hourlyRate: 49.45 },
  
  // SINALIZADOR
  { id: '13', name: 'CB MOURA', role: UserRole.MECHANIC, department: Department.SIGNALING, passwordSet: false, hourlyRate: 49.45 },
  { id: '14', name: 'CB DANTAS', role: UserRole.MECHANIC, department: Department.SIGNALING, passwordSet: false, hourlyRate: 49.45 },

  // GRAFISMO (Novos)
  { id: '20', name: 'CB BAZONI', role: UserRole.MECHANIC, department: Department.GRAPHICS, passwordSet: false, hourlyRate: 49.45 },
  { id: '21', name: 'CB TIBÚRCIO', role: UserRole.MECHANIC, department: Department.GRAPHICS, passwordSet: false, hourlyRate: 49.45 },
  { id: '22', name: 'CB ZULEICA', role: UserRole.MECHANIC, department: Department.GRAPHICS, passwordSet: false, hourlyRate: 49.45 },
  { id: '23', name: 'CB TORQUATO', role: UserRole.MECHANIC, department: Department.GRAPHICS, passwordSet: false, hourlyRate: 49.45 },
  { id: '32', name: 'SD LEONARDO', role: UserRole.MECHANIC, department: Department.GRAPHICS, passwordSet: false, hourlyRate: 49.45 },

  // SETOR TÉCNICO (Novos)
  { id: '24', name: 'SGT BRITO', role: UserRole.MECHANIC, department: Department.TECHNICAL, passwordSet: false, hourlyRate: 57.42 },
  { id: '25', name: 'CB SANTIAGO', role: UserRole.MECHANIC, department: Department.TECHNICAL, passwordSet: false, hourlyRate: 49.45 },
  { id: '26', name: 'CB BARONE', role: UserRole.MECHANIC, department: Department.TECHNICAL, passwordSet: false, hourlyRate: 49.45 },

  // ALMOXARIFADO (Novos)
  { id: '27', name: 'SGT AUGUSTO', role: UserRole.MECHANIC, department: Department.STORES, passwordSet: false, hourlyRate: 57.42 },
  { id: '28', name: 'CB ANDREA LIMA', role: UserRole.MECHANIC, department: Department.STORES, passwordSet: false, hourlyRate: 49.45 },
  { id: '29', name: 'CB JULIANA', role: UserRole.MECHANIC, department: Department.STORES, passwordSet: false, hourlyRate: 49.45 },
  { id: '30', name: 'CB CLEBER', role: UserRole.MECHANIC, department: Department.STORES, passwordSet: false, hourlyRate: 49.45 },

  // CHEFIA ADICIONAL
  { id: '18', name: 'TC MOMBERG', role: UserRole.CHIEF, department: Department.CHIEFS, passwordSet: false, hourlyRate: 110.00 },
  { id: '19', name: 'MAJ ANDRADE', role: UserRole.CHIEF, department: Department.CHIEFS, passwordSet: false, hourlyRate: 105.00 },
];

// ✅ NOVO: Mapeamento de palavras-chave para peças
export const PART_KEYWORDS: PartKeyword[] = [
  // FREIOS
  {
    keywords: ['PASTILHA', 'PASTILHAS DE FREIO', 'FREIO DIANTEIRO'],
    partName: 'PASTILHA DE FREIO DIANTEIRA',
    category: 'FREIOS',
    defaultQty: 1,
  },
  {
    keywords: ['LONA', 'LONAS DE FREIO', 'FREIO TRASEIRO', 'LONA TRASEIRA'],
    partName: 'LONA DE FREIO TRASEIRA',
    category: 'FREIOS',
    defaultQty: 1,
  },
  {
    keywords: ['DISCO DE FREIO', 'DISCO DIANTEIRO'],
    partName: 'DISCO DE FREIO DIANTEIRO',
    category: 'FREIOS',
    defaultQty: 2,
  },
  {
    keywords: ['TAMBOR', 'TAMBOR DE FREIO'],
    partName: 'TAMBOR DE FREIO',
    category: 'FREIOS',
    defaultQty: 2,
  },
  {
    keywords: ['FLUIDO DE FREIO', 'FLUIDO DOT'],
    partName: 'FLUIDO DE FREIO DOT 4',
    category: 'FREIOS',
    defaultQty: 1,
  },
  {
    keywords: ['CILINDRO MESTRE', 'CILINDRO DE FREIO'],
    partName: 'CILINDRO MESTRE DE FREIO',
    category: 'FREIOS',
    defaultQty: 1,
  },
  {
    keywords: ['PINÇA', 'PINÇA DE FREIO'],
    partName: 'PINÇA DE FREIO',
    category: 'FREIOS',
    defaultQty: 1,
  },
  {
    keywords: ['FLEXÍVEL', 'MANGUEIRA DE FREIO'],
    partName: 'FLEXÍVEL DE FREIO',
    category: 'FREIOS',
    defaultQty: 1,
  },

  // MOTOR / LUBRIFICAÇÃO
  {
    keywords: ['ÓLEO', 'TROCA DE ÓLEO', 'ÓLEO MOTOR', 'ÓLEO DO MOTOR'],
    partName: 'ÓLEO LUBRIFICANTE MOTOR',
    category: 'MOTOR',
    defaultQty: 4,
  },
  {
    keywords: ['FILTRO DE ÓLEO', 'FILTRO LUBRIFICANTE'],
    partName: 'FILTRO DE ÓLEO',
    category: 'MOTOR',
    defaultQty: 1,
  },
  {
    keywords: ['FILTRO DE AR', 'FILTRO AR MOTOR'],
    partName: 'FILTRO DE AR DO MOTOR',
    category: 'MOTOR',
    defaultQty: 1,
  },
  {
    keywords: [
      'FILTRO DE COMBUSTÍVEL',
      'FILTRO COMBUSTÍVEL',
      'FILTRO DIESEL',
      'FILTRO GASOLINA',
    ],
    partName: 'FILTRO DE COMBUSTÍVEL',
    category: 'MOTOR',
    defaultQty: 1,
  },
  {
    keywords: ['FILTRO DE CABINE', 'FILTRO AR CONDICIONADO', 'FILTRO CABINE'],
    partName: 'FILTRO DE AR DA CABINE',
    category: 'MOTOR',
    defaultQty: 1,
  },
  {
    keywords: ['VELA', 'VELAS DE IGNIÇÃO', 'VELA IGNIÇÃO'],
    partName: 'VELA DE IGNIÇÃO',
    category: 'MOTOR',
    defaultQty: 4,
  },
  {
    keywords: ['BOBINA', 'BOBINA DE IGNIÇÃO'],
    partName: 'BOBINA DE IGNIÇÃO',
    category: 'MOTOR',
    defaultQty: 1,
  },
  {
    keywords: ['CORREIA DENTADA', 'CORREIA DO MOTOR'],
    partName: 'CORREIA DENTADA',
    category: 'MOTOR',
    defaultQty: 1,
  },
  {
    keywords: ['CORREIA ALTERNADOR', 'CORREIA POLY V', 'CORREIA ACESSÓRIOS'],
    partName: 'CORREIA DO ALTERNADOR',
    category: 'MOTOR',
    defaultQty: 1,
  },
  {
    keywords: ['TENSOR', 'TENSOR DA CORREIA'],
    partName: 'TENSOR DA CORREIA',
    category: 'MOTOR',
    defaultQty: 1,
  },
  {
    keywords: ["BOMBA D'ÁGUA", 'BOMBA DAGUA', 'BOMBA DE ÁGUA'],
    partName: "BOMBA D'ÁGUA",
    category: 'MOTOR',
    defaultQty: 1,
  },
  {
    keywords: ['BOMBA DE COMBUSTÍVEL', 'BOMBA COMBUSTÍVEL'],
    partName: 'BOMBA DE COMBUSTÍVEL',
    category: 'MOTOR',
    defaultQty: 1,
  },
  {
    keywords: ['JUNTA DO CABEÇOTE', 'JUNTA CABEÇOTE'],
    partName: 'JUNTA DO CABEÇOTE',
    category: 'MOTOR',
    defaultQty: 1,
  },
  {
    keywords: ['RADIADOR'],
    partName: 'RADIADOR',
    category: 'MOTOR',
    defaultQty: 1,
  },
  {
    keywords: ['VÁLVULA TERMOSTÁTICA', 'TERMOSTATO', 'TERMOSTÁTICA'],
    partName: 'VÁLVULA TERMOSTÁTICA',
    category: 'MOTOR',
    defaultQty: 1,
  },
  {
    keywords: ['ADITIVO', 'LÍQUIDO DE ARREFECIMENTO', 'ARREFECIMENTO'],
    partName: 'ADITIVO DE ARREFECIMENTO',
    category: 'MOTOR',
    defaultQty: 1,
  },

  // SUSPENSÃO
  {
    keywords: ['AMORTECEDOR DIANTEIRO', 'AMORTECEDOR DIANT'],
    partName: 'AMORTECEDOR DIANTEIRO',
    category: 'SUSPENSÃO',
    defaultQty: 2,
  },
  {
    keywords: ['AMORTECEDOR TRASEIRO', 'AMORTECEDOR TRAS'],
    partName: 'AMORTECEDOR TRASEIRO',
    category: 'SUSPENSÃO',
    defaultQty: 2,
  },
  {
    keywords: ['AMORTECEDOR'],
    partName: 'AMORTECEDOR',
    category: 'SUSPENSÃO',
    defaultQty: 1,
  },
  {
    keywords: ['MOLA', 'MOLA HELICOIDAL', 'MOLA SUSPENSÃO'],
    partName: 'MOLA DE SUSPENSÃO',
    category: 'SUSPENSÃO',
    defaultQty: 1,
  },
  {
    keywords: ['BATENTE', 'BATENTE DO AMORTECEDOR'],
    partName: 'BATENTE DO AMORTECEDOR',
    category: 'SUSPENSÃO',
    defaultQty: 2,
  },
  {
    keywords: ['COIFA', 'COIFA DO AMORTECEDOR'],
    partName: 'COIFA DO AMORTECEDOR',
    category: 'SUSPENSÃO',
    defaultQty: 2,
  },
  {
    keywords: ['PIVÔ', 'PIVÔ DE SUSPENSÃO', 'PIVO'],
    partName: 'PIVÔ DE SUSPENSÃO',
    category: 'SUSPENSÃO',
    defaultQty: 1,
  },
  {
    keywords: ['BUCHA', 'BUCHA DE SUSPENSÃO', 'BUCHA BANDEJA'],
    partName: 'BUCHA DE SUSPENSÃO',
    category: 'SUSPENSÃO',
    defaultQty: 2,
  },
  {
    keywords: ['BANDEJA', 'BANDEJA DE SUSPENSÃO'],
    partName: 'BANDEJA DE SUSPENSÃO',
    category: 'SUSPENSÃO',
    defaultQty: 1,
  },
  {
    keywords: ['BARRA ESTABILIZADORA', 'BIELETA'],
    partName: 'BIELETA DA BARRA ESTABILIZADORA',
    category: 'SUSPENSÃO',
    defaultQty: 2,
  },
  {
    keywords: ['ROLAMENTO DE RODA', 'ROLAMENTO RODA'],
    partName: 'ROLAMENTO DE RODA',
    category: 'SUSPENSÃO',
    defaultQty: 1,
  },
  {
    keywords: ['CUBO DE RODA', 'CUBO'],
    partName: 'CUBO DE RODA',
    category: 'SUSPENSÃO',
    defaultQty: 1,
  },

  // DIREÇÃO
  {
    keywords: ['TERMINAL', 'TERMINAL DE DIREÇÃO'],
    partName: 'TERMINAL DE DIREÇÃO',
    category: 'DIREÇÃO',
    defaultQty: 2,
  },
  {
    keywords: ['CAIXA DE DIREÇÃO', 'CAIXA DIREÇÃO'],
    partName: 'CAIXA DE DIREÇÃO',
    category: 'DIREÇÃO',
    defaultQty: 1,
  },
  {
    keywords: ['BOMBA DE DIREÇÃO', 'BOMBA DIREÇÃO HIDRÁULICA'],
    partName: 'BOMBA DE DIREÇÃO HIDRÁULICA',
    category: 'DIREÇÃO',
    defaultQty: 1,
  },
  {
    keywords: ['ÓLEO DE DIREÇÃO', 'FLUIDO DIREÇÃO'],
    partName: 'ÓLEO DE DIREÇÃO HIDRÁULICA',
    category: 'DIREÇÃO',
    defaultQty: 1,
  },
  {
    keywords: ['HOMOCINÉTICA', 'JUNTA HOMOCINÉTICA'],
    partName: 'JUNTA HOMOCINÉTICA',
    category: 'DIREÇÃO',
    defaultQty: 1,
  },
  {
    keywords: ['SEMIEIXO', 'SEMI-EIXO'],
    partName: 'SEMIEIXO',
    category: 'DIREÇÃO',
    defaultQty: 1,
  },

  // PNEUS / RODAS
  {
    keywords: ['PNEU', 'TROCA DE PNEU', 'PNEUS'],
    partName: 'PNEU',
    category: 'PNEUS',
    defaultQty: 1,
  },
  {
    keywords: ['CÂMARA DE AR', 'CÂMARA PNEU'],
    partName: 'CÂMARA DE AR',
    category: 'PNEUS',
    defaultQty: 1,
  },
  {
    keywords: ['BICO DE PNEU', 'VÁLVULA PNEU'],
    partName: 'BICO DE PNEU',
    category: 'PNEUS',
    defaultQty: 4,
  },
  {
    keywords: ['PARAFUSO DE RODA', 'PARAFUSO RODA'],
    partName: 'PARAFUSO DE RODA',
    category: 'PNEUS',
    defaultQty: 1,
  },
  {
    keywords: ['CALOTA'],
    partName: 'CALOTA',
    category: 'PNEUS',
    defaultQty: 1,
  },

  // ELÉTRICA
  {
    keywords: ['BATERIA'],
    partName: 'BATERIA',
    category: 'ELÉTRICA',
    defaultQty: 1,
  },
  {
    keywords: ['ALTERNADOR'],
    partName: 'ALTERNADOR',
    category: 'ELÉTRICA',
    defaultQty: 1,
  },
  {
    keywords: ['MOTOR DE ARRANQUE', 'MOTOR ARRANQUE', 'ARRANQUE'],
    partName: 'MOTOR DE ARRANQUE',
    category: 'ELÉTRICA',
    defaultQty: 1,
  },
  {
    keywords: ['FAROL', 'FARÓIS'],
    partName: 'FAROL',
    category: 'ELÉTRICA',
    defaultQty: 1,
  },
  {
    keywords: ['LÂMPADA', 'LAMPADA'],
    partName: 'LÂMPADA',
    category: 'ELÉTRICA',
    defaultQty: 1,
  },
  {
    keywords: ['LANTERNA'],
    partName: 'LANTERNA',
    category: 'ELÉTRICA',
    defaultQty: 1,
  },
  {
    keywords: ['FUSÍVEL', 'FUSIVEL'],
    partName: 'FUSÍVEL',
    category: 'ELÉTRICA',
    defaultQty: 1,
  },
  {
    keywords: ['RELÉ', 'RELE'],
    partName: 'RELÉ',
    category: 'ELÉTRICA',
    defaultQty: 1,
  },
  {
    keywords: ['SENSOR'],
    partName: 'SENSOR',
    category: 'ELÉTRICA',
    defaultQty: 1,
  },
  {
    keywords: ['MÓDULO', 'MODULO'],
    partName: 'MÓDULO ELETRÔNICO',
    category: 'ELÉTRICA',
    defaultQty: 1,
  },

  // TRANSMISSÃO / EMBREAGEM
  {
    keywords: ['EMBREAGEM', 'KIT EMBREAGEM', 'DISCO DE EMBREAGEM'],
    partName: 'KIT DE EMBREAGEM',
    category: 'TRANSMISSÃO',
    defaultQty: 1,
  },
  {
    keywords: ['CABO DE EMBREAGEM', 'CABO EMBREAGEM'],
    partName: 'CABO DE EMBREAGEM',
    category: 'TRANSMISSÃO',
    defaultQty: 1,
  },
  {
    keywords: ['ÓLEO DE CÂMBIO', 'ÓLEO CÂMBIO', 'ÓLEO TRANSMISSÃO'],
    partName: 'ÓLEO DE CÂMBIO',
    category: 'TRANSMISSÃO',
    defaultQty: 2,
  },
  {
    keywords: ['CRUZETA', 'CRUZETA CARDAN'],
    partName: 'CRUZETA DO CARDAN',
    category: 'TRANSMISSÃO',
    defaultQty: 1,
  },

  // AR CONDICIONADO
  {
    keywords: ['GÁS AR', 'GÁS AR CONDICIONADO', 'RECARGA AR', 'R134'],
    partName: 'GÁS REFRIGERANTE R134A',
    category: 'AR CONDICIONADO',
    defaultQty: 1,
  },
  {
    keywords: ['COMPRESSOR AR', 'COMPRESSOR AR CONDICIONADO'],
    partName: 'COMPRESSOR DO AR CONDICIONADO',
    category: 'AR CONDICIONADO',
    defaultQty: 1,
  },
  {
    keywords: ['CONDENSADOR', 'CONDENSADOR AR'],
    partName: 'CONDENSADOR DO AR CONDICIONADO',
    category: 'AR CONDICIONADO',
    defaultQty: 1,
  },
  {
    keywords: ['EVAPORADOR'],
    partName: 'EVAPORADOR DO AR CONDICIONADO',
    category: 'AR CONDICIONADO',
    defaultQty: 1,
  },

  // ESCAPAMENTO
  {
    keywords: ['ESCAPAMENTO', 'SILENCIOSO'],
    partName: 'SILENCIOSO',
    category: 'ESCAPAMENTO',
    defaultQty: 1,
  },
  {
    keywords: ['CATALISADOR'],
    partName: 'CATALISADOR',
    category: 'ESCAPAMENTO',
    defaultQty: 1,
  },
  {
    keywords: ['FLEXÍVEL ESCAPAMENTO', 'SANFONA'],
    partName: 'FLEXÍVEL DO ESCAPAMENTO',
    category: 'ESCAPAMENTO',
    defaultQty: 1,
  },
  {
    keywords: ['ABRAÇADEIRA ESCAPAMENTO'],
    partName: 'ABRAÇADEIRA DO ESCAPAMENTO',
    category: 'ESCAPAMENTO',
    defaultQty: 1,
  },

  // LIMPADORES
  {
    keywords: ['PALHETA', 'LIMPADOR PARABRISA', 'PALHETA LIMPADOR'],
    partName: 'PALHETA DO LIMPADOR',
    category: 'LIMPADORES',
    defaultQty: 2,
  },
  {
    keywords: ['MOTOR LIMPADOR', 'MOTOR DO LIMPADOR'],
    partName: 'MOTOR DO LIMPADOR',
    category: 'LIMPADORES',
    defaultQty: 1,
  },
  {
    keywords: ['RESERVATÓRIO ÁGUA', 'RESERVATÓRIO LIMPADOR'],
    partName: 'RESERVATÓRIO DO LIMPADOR',
    category: 'LIMPADORES',
    defaultQty: 1,
  },
  {
    keywords: ['BOMBA LIMPADOR', 'BOMBA ÁGUA PARABRISA'],
    partName: 'BOMBA DO LIMPADOR',
    category: 'LIMPADORES',
    defaultQty: 1,
  },

  // OUTROS
  {
    keywords: ['RETROVISOR'],
    partName: 'ESPELHO RETROVISOR',
    category: 'OUTROS',
    defaultQty: 1,
  },
  {
    keywords: ['PARABRISA', 'VIDRO DIANTEIRO'],
    partName: 'PARABRISA',
    category: 'OUTROS',
    defaultQty: 1,
  },
  {
    keywords: ['VIDRO TRASEIRO'],
    partName: 'VIDRO TRASEIRO',
    category: 'OUTROS',
    defaultQty: 1,
  },
  {
    keywords: ['MAÇANETA', 'MACANETA'],
    partName: 'MAÇANETA',
    category: 'OUTROS',
    defaultQty: 1,
  },
  {
    keywords: ['FECHADURA'],
    partName: 'FECHADURA',
    category: 'OUTROS',
    defaultQty: 1,
  },
];

export const APP_THEME = {
  primary: 'bg-zinc-800 hover:bg-zinc-700',
  secondary: 'bg-zinc-900 hover:bg-zinc-800',
  accent: 'text-zinc-400',
  success: 'bg-emerald-700 hover:bg-emerald-600',
  danger: 'bg-rose-700 hover:bg-rose-600',
  card: 'bg-zinc-900 border border-zinc-800 shadow-none',
};

// ✅ NOVO: Cores por categoria de peças
export const PART_CATEGORY_COLORS: Record<string, string> = {
  FREIOS: '#ef4444',
  MOTOR: '#f59e0b',
  SUSPENSÃO: '#10b981',
  DIREÇÃO: '#3b82f6',
  PNEUS: '#6366f1',
  ELÉTRICA: '#8b5cf6',
  TRANSMISSÃO: '#ec4899',
  'AR CONDICIONADO': '#06b6d4',
  ESCAPAMENTO: '#84cc16',
  LIMPADORES: '#14b8a6',
  OUTROS: '#64748b',
};
