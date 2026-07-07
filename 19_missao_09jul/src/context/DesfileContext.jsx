import React, { createContext, useContext, useState, useEffect } from "react";

const DesfileContext = createContext();

const HARDCODED_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzP4mc3HboTDIqpompfN0MrH8csn7HyCWEywdx6IbnQKfiqH7Jzrn-8LklxPzqNiI_8BA/exec";

export function createPerfectChecklist() {
  return {
    pintura: "Sim",
    novo_grafismo: "Sim",
    grafismo_geral: "Sim",
    sinais_sonoros: "Sim",
    calota_padrao: "Sim",
    luzes_farois: "Sim",
    mecanica_geral: "Sim"
  };
}

// ----------------------------------------------------
// DADOS OFICIAIS (Dispositivo de 79 viaturas sem Corregedoria, com Defesa Civil)
// ----------------------------------------------------
export const DEFAULT_VECTORS = [
  // 11.1. 03 Mtcl 2° BPChoq - Pel Escolta (Cunha)
  { id: "escorta_1", opm: "2º BPChoq", prefix: "MOTO ESCOLTA 1", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "escorta_2", opm: "2º BPChoq", prefix: "MOTO ESCOLTA 2", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "escorta_3", opm: "2º BPChoq", prefix: "MOTO ESCOLTA 3", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.2. Comandante CMM (Jeep)
  { id: "csm_cmt", opm: "CMM", prefix: "JEEP CMT", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.3. 06 viaturas históricas do CMM
  { id: "hist_1", opm: "CMM", prefix: "HISTÓRICA 1", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "hist_2", opm: "CMM", prefix: "HISTÓRICA 2", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "hist_3", opm: "CMM", prefix: "HISTÓRICA 3", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "hist_4", opm: "CMM", prefix: "HISTÓRICA 4", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "hist_5", opm: "CMM", prefix: "HISTÓRICA 5", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "hist_6", opm: "CMM", prefix: "HISTÓRICA 6", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.4. Sgpt Mtcl ROCAM (6 motos)
  { id: "rocam_1", opm: "2º BPChoq", prefix: "MOTO ROCAM 1 (Cmt)", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "rocam_2", opm: "2º BPChoq", prefix: "MOTO ROCAM 2", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "rocam_3", opm: "2º BPChoq", prefix: "MOTO ROCAM 3", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "rocam_4", opm: "2º BPChoq", prefix: "MOTO ROCAM 4", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "rocam_5", opm: "2º BPChoq", prefix: "MOTO ROCAM 5", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "rocam_6", opm: "2º BPChoq", prefix: "MOTO ROCAM 6", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.4. Sgpt Mtcl CPTRAN (6 motos)
  { id: "cptran_m1", opm: "CPTRAN", prefix: "MOTO CPTRAN 1", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cptran_m2", opm: "CPTRAN", prefix: "MOTO CPTRAN 2", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cptran_m3", opm: "CPTRAN", prefix: "MOTO CPTRAN 3", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cptran_m4", opm: "CPTRAN", prefix: "MOTO CPTRAN 4", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cptran_m5", opm: "CPTRAN", prefix: "MOTO CPTRAN 5", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cptran_m6", opm: "CPTRAN", prefix: "MOTO CPTRAN 6", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.4. Sgpt Mtcl CPRV (6 motos)
  { id: "cprv_m1", opm: "CPRV", prefix: "MOTO CPRV 1", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cprv_m2", opm: "CPRV", prefix: "MOTO CPRV 2", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cprv_m3", opm: "CPRV", prefix: "MOTO CPRV 3", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cprv_m4", opm: "CPRV", prefix: "MOTO CPRV 4", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cprv_m5", opm: "CPRV", prefix: "MOTO CPRV 5", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cprv_m6", opm: "CPRV", prefix: "MOTO CPRV 6", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.4. Sgpt Mtcl CPC (6 motos)
  { id: "cpc_m1", opm: "CPC", prefix: "MOTO CPC 1", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cpc_m2", opm: "CPC", prefix: "MOTO CPC 2", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cpc_m3", opm: "CPC", prefix: "MOTO CPC 3", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cpc_m4", opm: "CPC", prefix: "MOTO CPC 4", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cpc_m5", opm: "CPC", prefix: "MOTO CPC 5", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cpc_m6", opm: "CPC", prefix: "MOTO CPC 6", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.5. Sgpt Radiopatrulhamento CPC (4 carros)
  { id: "cpc_c1", opm: "CPC", prefix: "VTR CPC 1", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cpc_c2", opm: "CPC", prefix: "VTR CPC 2", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cpc_c3", opm: "CPC", prefix: "VTR CPC 3", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cpc_c4", opm: "CPC", prefix: "VTR CPC 4", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.6. Sgpt CPTRAN (4 carros)
  { id: "cptran_c1", opm: "CPTRAN", prefix: "VTR CPTRAN 1", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cptran_c2", opm: "CPTRAN", prefix: "VTR CPTRAN 2", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cptran_c3", opm: "CPTRAN", prefix: "VTR CPTRAN 3", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cptran_c4", opm: "CPTRAN", prefix: "VTR CPTRAN 4", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.7. Sgpt Pol CPRV (4 carros)
  { id: "cprv_c1", opm: "CPRV", prefix: "VTR CPRV 1", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cprv_c2", opm: "CPRV", prefix: "VTR CPRV 2", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cprv_c3", opm: "CPRV", prefix: "VTR CPRV 3", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cprv_c4", opm: "CPRV", prefix: "VTR CPRV 4", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.8. Sgpt Pol CPAmb (4 carros)
  { id: "cpamb_c1", opm: "CPAmb", prefix: "VTR CPAmb 1", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cpamb_c2", opm: "CPAmb", prefix: "VTR CPAmb 2", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cpamb_c3", opm: "CPAmb", prefix: "VTR CPAmb 3", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "cpamb_c4", opm: "CPAmb", prefix: "VTR CPAmb 4", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.9. Sgpt Correg PM (4 carros) - Corregedoria (PDO)
  { id: "correg_1", opm: "Corregedoria", prefix: "VTR PDO 1", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "correg_2", opm: "Corregedoria", prefix: "VTR PDO 2", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "correg_3", opm: "Corregedoria", prefix: "VTR PDO 3", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "correg_4", opm: "Corregedoria", prefix: "VTR PDO 4", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },

  // 11.10. Sgpt 1 BPChoq ROTA (4 carros)
  { id: "rota_1", opm: "1º BPChoq", prefix: "VTR ROTA 1", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "rota_2", opm: "1º BPChoq", prefix: "VTR ROTA 2", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "rota_3", opm: "1º BPChoq", prefix: "VTR ROTA 3", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "rota_4", opm: "1º BPChoq", prefix: "VTR ROTA 4", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.11. Sgpt 3 BPChoq (2 Hilux, 1 VLA, 1 Guardier)
  { id: "chq3_h1", opm: "3º BPChoq", prefix: "HILUX 1", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "chq3_h2", opm: "3º BPChoq", prefix: "HILUX 2", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "chq3_vla", opm: "3º BPChoq", prefix: "VLA", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "chq3_guardier", opm: "3º BPChoq", prefix: "GUARDIER", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.12. Sgpt 4 BPChoq (2 GATE, 2 COE)
  { id: "chq4_gate1", opm: "4º BPChoq", prefix: "VTR GATE 1", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "chq4_gate2", opm: "4º BPChoq", prefix: "VTR GATE 2", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "chq4_coe1", opm: "4º BPChoq", prefix: "VTR COE 1", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "chq4_coe2", opm: "4º BPChoq", prefix: "VTR COE 2", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.13. Sgpt 5 BPChoq (2 cães)
  { id: "chq5_cao1", opm: "5º BPChoq", prefix: "VTR CANIL 1", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "chq5_cao2", opm: "5º BPChoq", prefix: "VTR CANIL 2", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.15. RPMon (1 Jeep Biga)
  { id: "rpmon_biga", opm: "RPMon", prefix: "JEEP BIGA", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // 11.16. Sgpt CCB Bombeiros (2 MOB motos, 10 carros em fila única)
  { id: "ccb_mob1", opm: "CCB", prefix: "MOB 1", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "ccb_mob2", opm: "CCB", prefix: "MOB 2", type: "moto", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "ccb_ac", opm: "CCB", prefix: "AC", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "ccb_ur", opm: "CCB", prefix: "UR", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "ccb_cosicoe", opm: "CCB", prefix: "CO SICOE", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "ccb_absr", opm: "CCB", prefix: "ABSR", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "ccb_ab", opm: "CCB", prefix: "AB", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "ccb_abe", opm: "CCB", prefix: "ABE", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "ccb_ae", opm: "CCB", prefix: "AE", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "ccb_sk", opm: "CCB", prefix: "SK", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "ccb_ase", opm: "CCB", prefix: "ASE", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "ccb_pp", opm: "CCB", prefix: "PP", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  
  // Defesa Civil (2 carros final)
  { id: "dc_1", opm: "Defesa Civil", prefix: "VTR DEFESA CIVIL 1", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() },
  { id: "dc_2", opm: "Defesa Civil", prefix: "VTR DEFESA CIVIL 2", type: "carro", driver: "", encarregado: "", checklist: createPerfectChecklist() }
];

export const DEFAULT_LAYOUT = {
  // 11.1. Escolta (Cunha)
  "2º BPChoq_MOTO ESCOLTA 1": { x: 527, y: 120, rotation: 0 },
  "2º BPChoq_MOTO ESCOLTA 2": { x: 380, y: 180, rotation: 0 },
  "2º BPChoq_MOTO ESCOLTA 3": { x: 670, y: 180, rotation: 0 },
  
  // 11.2. Cmt (Jeep)
  "CMM_JEEP CMT": { x: 527, y: 280, rotation: 0 },
  
  // 11.3. Históricas (Pairs)
  "CMM_HISTÓRICA 1": { x: 380, y: 400, rotation: 0 },
  "CMM_HISTÓRICA 2": { x: 670, y: 400, rotation: 0 },
  "CMM_HISTÓRICA 3": { x: 380, y: 520, rotation: 0 },
  "CMM_HISTÓRICA 4": { x: 670, y: 520, rotation: 0 },
  "CMM_HISTÓRICA 5": { x: 380, y: 640, rotation: 0 },
  "CMM_HISTÓRICA 6": { x: 670, y: 640, rotation: 0 },
  
  // 11.4. ROCAM (Pairs)
  "2º BPChoq_MOTO ROCAM 1 (Cmt)": { x: 380, y: 760, rotation: 0 },
  "2º BPChoq_MOTO ROCAM 2": { x: 670, y: 760, rotation: 0 },
  "2º BPChoq_MOTO ROCAM 3": { x: 380, y: 840, rotation: 0 },
  "2º BPChoq_MOTO ROCAM 4": { x: 670, y: 840, rotation: 0 },
  "2º BPChoq_MOTO ROCAM 5": { x: 380, y: 920, rotation: 0 },
  "2º BPChoq_MOTO ROCAM 6": { x: 670, y: 920, rotation: 0 },
  
  // 11.4. CPTRAN (Pairs)
  "CPTRAN_MOTO CPTRAN 1": { x: 380, y: 1040, rotation: 0 },
  "CPTRAN_MOTO CPTRAN 2": { x: 670, y: 1040, rotation: 0 },
  "CPTRAN_MOTO CPTRAN 3": { x: 380, y: 1120, rotation: 0 },
  "CPTRAN_MOTO CPTRAN 4": { x: 670, y: 1120, rotation: 0 },
  "CPTRAN_MOTO CPTRAN 5": { x: 380, y: 1200, rotation: 0 },
  "CPTRAN_MOTO CPTRAN 6": { x: 670, y: 1200, rotation: 0 },
  
  // 11.4. CPRV (Pairs)
  "CPRV_MOTO CPRV 1": { x: 380, y: 1320, rotation: 0 },
  "CPRV_MOTO CPRV 2": { x: 670, y: 1320, rotation: 0 },
  "CPRV_MOTO CPRV 3": { x: 380, y: 1400, rotation: 0 },
  "CPRV_MOTO CPRV 4": { x: 670, y: 1400, rotation: 0 },
  "CPRV_MOTO CPRV 5": { x: 380, y: 1480, rotation: 0 },
  "CPRV_MOTO CPRV 6": { x: 670, y: 1480, rotation: 0 },
  
  // 11.4. CPC (Pairs)
  "CPC_MOTO CPC 1": { x: 380, y: 1600, rotation: 0 },
  "CPC_MOTO CPC 2": { x: 670, y: 1600, rotation: 0 },
  "CPC_MOTO CPC 3": { x: 380, y: 1680, rotation: 0 },
  "CPC_MOTO CPC 4": { x: 670, y: 1680, rotation: 0 },
  "CPC_MOTO CPC 5": { x: 380, y: 1760, rotation: 0 },
  "CPC_MOTO CPC 6": { x: 670, y: 1760, rotation: 0 },
  
  // 11.5. CPC (Pairs)
  "CPC_VTR CPC 1": { x: 380, y: 1880, rotation: 0 },
  "CPC_VTR CPC 2": { x: 670, y: 1880, rotation: 0 },
  "CPC_VTR CPC 3": { x: 380, y: 2000, rotation: 0 },
  "CPC_VTR CPC 4": { x: 670, y: 2000, rotation: 0 },
  
  // 11.6. CPTRAN (Pairs)
  "CPTRAN_VTR CPTRAN 1": { x: 380, y: 2120, rotation: 0 },
  "CPTRAN_VTR CPTRAN 2": { x: 670, y: 2120, rotation: 0 },
  "CPTRAN_VTR CPTRAN 3": { x: 380, y: 2240, rotation: 0 },
  "CPTRAN_VTR CPTRAN 4": { x: 670, y: 2240, rotation: 0 },
  
  // 11.7. CPRV (Pairs)
  "CPRV_VTR CPRV 1": { x: 380, y: 2360, rotation: 0 },
  "CPRV_VTR CPRV 2": { x: 670, y: 2360, rotation: 0 },
  "CPRV_VTR CPRV 3": { x: 380, y: 2480, rotation: 0 },
  "CPRV_VTR CPRV 4": { x: 670, y: 2480, rotation: 0 },
  
  // 11.8. CPAmb (Pairs)
  "CPAmb_VTR CPAmb 1": { x: 380, y: 2600, rotation: 0 },
  "CPAmb_VTR CPAmb 2": { x: 670, y: 2600, rotation: 0 },
  "CPAmb_VTR CPAmb 3": { x: 380, y: 2720, rotation: 0 },
  "CPAmb_VTR CPAmb 4": { x: 670, y: 2720, rotation: 0 },
  
  // 11.9. Correg PM (PDO) (Pairs)
  "Corregedoria_VTR PDO 1": { x: 380, y: 2840, rotation: 0 },
  "Corregedoria_VTR PDO 2": { x: 670, y: 2840, rotation: 0 },
  "Corregedoria_VTR PDO 3": { x: 380, y: 2960, rotation: 0 },
  "Corregedoria_VTR PDO 4": { x: 670, y: 2960, rotation: 0 },

  // 11.10. ROTA (Pairs)
  "1º BPChoq_VTR ROTA 1": { x: 380, y: 3080, rotation: 0 },
  "1º BPChoq_VTR ROTA 2": { x: 670, y: 3080, rotation: 0 },
  "1º BPChoq_VTR ROTA 3": { x: 380, y: 3200, rotation: 0 },
  "1º BPChoq_VTR ROTA 4": { x: 670, y: 3200, rotation: 0 },
  
  // 11.11. 3 BPChoq
  "3º BPChoq_HILUX 1": { x: 380, y: 3320, rotation: 0 },
  "3º BPChoq_HILUX 2": { x: 670, y: 3320, rotation: 0 },
  "3º BPChoq_VLA": { x: 527, y: 3440, rotation: 0 },
  "3º BPChoq_GUARDIER": { x: 527, y: 3560, rotation: 0 },
  
  // 11.12. 4 BPChoq
  "4º BPChoq_VTR GATE 1": { x: 380, y: 3680, rotation: 0 },
  "4º BPChoq_VTR GATE 2": { x: 670, y: 3680, rotation: 0 },
  "4º BPChoq_VTR COE 1": { x: 380, y: 3800, rotation: 0 },
  "4º BPChoq_VTR COE 2": { x: 670, y: 3800, rotation: 0 },
  
  // 11.13. 5 BPChoq
  "5º BPChoq_VTR CANIL 1": { x: 380, y: 3920, rotation: 0 },
  "5º BPChoq_VTR CANIL 2": { x: 670, y: 3920, rotation: 0 },
  
  // 11.15. RPMon
  "RPMon_JEEP BIGA": { x: 527, y: 4040, rotation: 0 },
  
  // 11.16. CCB Bombeiros (Fila Única no Centro)
  "CCB_MOB 1": { x: 527, y: 4160, rotation: 0 },
  "CCB_MOB 2": { x: 527, y: 4240, rotation: 0 },
  "CCB_AC": { x: 527, y: 4320, rotation: 0 },
  "CCB_UR": { x: 527, y: 4440, rotation: 0 },
  "CCB_CO SICOE": { x: 527, y: 4560, rotation: 0 },
  "CCB_ABSR": { x: 527, y: 4680, rotation: 0 },
  "CCB_AB": { x: 527, y: 4800, rotation: 0 },
  "CCB_ABE": { x: 527, y: 4920, rotation: 0 },
  "CCB_AE": { x: 527, y: 5040, rotation: 0 },
  "CCB_SK": { x: 527, y: 5160, rotation: 0 },
  "CCB_ASE": { x: 527, y: 5280, rotation: 0 },
  "CCB_PP": { x: 527, y: 5400, rotation: 0 },
  
  // Defesa Civil
  "Defesa Civil_VTR DEFESA CIVIL 1": { x: 380, y: 5520, rotation: 0 },
  "Defesa Civil_VTR DEFESA CIVIL 2": { x: 670, y: 5520, rotation: 0 }
};

export const OPM_INDEX_LIST = [
  "2º BPChoq", "CMM", "CPTRAN", "CPRV", "CPC", "CPAmb", "Corregedoria",
  "1º BPChoq", "3º BPChoq", "4º BPChoq", "5º BPChoq", "RPMon", "CCB", "Defesa Civil"
];

export const OPM_COLORS = {
  "2º BPChoq": "#3b82f6",       // Azul Royal
  "CMM": "#10b981",            // Verde Esmeralda
  "CPTRAN": "#f59e0b",         // Amarelo Âmbar
  "CPRV": "#06b6d4",           // Azul Ciano
  "CPC": "#8b5cf6",            // Roxo Violeta
  "CPAmb": "#14b8a6",          // Verde Menta / Teal
  "Corregedoria": "#64748b",   // Cinza Slate (PDO/Corregedoria)
  "1º BPChoq": "#6366f1",      // Índigo
  "3º BPChoq": "#eab308",      // Dourado
  "4º BPChoq": "#f97316",      // Laranja
  "5º BPChoq": "#a855f7",      // Púrpura Claro
  "RPMon": "#84cc16",          // Verde Lima
  "CCB": "#ef4444",            // Vermelho Bombeiros
  "Defesa Civil": "#f59e0b"    // Laranja Defesa Civil
};

export function normalizeOpm(opm) {
  if (!opm) return "";
  let norm = String(opm).trim();
  if (norm === "CSM/MM") return "CMM";
  norm = norm.replace(/BPChq/g, "BPChoq");
  if (norm.toUpperCase() === "CPTRAN") return "CPTRAN";
  if (norm.toUpperCase() === "CPRV") return "CPRV";
  if (norm.toUpperCase() === "CORREG PM" || norm.toUpperCase() === "CORREGEDORIA") return "Corregedoria";
  return norm;
}

export function checkIsMoto(prefix) {
  if (!prefix) return false;
  const lower = String(prefix).toLowerCase();
  return lower.includes("moto") || lower.includes("escolta") || lower.includes("rocam") || lower.includes("mtcl");
}

export function getDesfileGroup(vtr) {
  const opm = vtr.opm;
  const prefix = vtr.prefix.toUpperCase();
  const type = vtr.type;
  
  if (opm === "CMM" && (prefix.includes("JEEP") || prefix.includes("BIGA")) && !prefix.includes("HIST") && !prefix.includes("GUINCHO")) {
    if (prefix.includes("CMM")) {
      return { index: 3, name: "Cmt do Gpt Motorizado - CMM" };
    }
    return { index: 1, name: "Comando da Revolução de 32 - CMM" };
  }
  
  if (opm === "2º BPChoq" && prefix.includes("ESCOLTA")) {
    return { index: 2, name: "Escolta - 2º BPChoq" };
  }
  
  if (opm === "CMM" && (prefix.includes("HISTÓRICA") || prefix.includes("FUSCA") || prefix.includes("KOMBI") || prefix.includes("UNO") || prefix.includes("OPALA") || prefix.includes("VERANEIO") || prefix.includes("IPANEMA") || prefix.includes("GUINCHO"))) {
    return { index: 4, name: "Viaturas Históricas - CMM" };
  }
  
  if (type === "moto") {
    if (opm === "2º BPChoq") return { index: 5, name: "Motos ROCAM - 2º BPChoq" };
    if (opm === "CPTRAN") return { index: 6, name: "Motos - CPTRAN" };
    if (opm === "CPRV") return { index: 7, name: "Motos - CPRV" };
    if (opm === "CPC") return { index: 8, name: "Motos - CPC" };
    if (opm === "CCB") return { index: 19, name: "Motos - CCB Bombeiros" };
  }
  
  if (type === "carro") {
    if (opm === "CPC") return { index: 9, name: "Viaturas - CPC" };
    if (opm === "CPTRAN") return { index: 10, name: "Viaturas - CPTRAN" };
    if (opm === "CPRV") return { index: 11, name: "Viaturas - CPRV" };
    if (opm === "CPAmb") return { index: 12, name: "Viaturas - CPAmb" };
    if (opm === "Corregedoria") return { index: 13, name: "Viaturas - Corregedoria" };
    if (opm === "1º BPChoq") return { index: 14, name: "Viaturas - 1º BPChoq" };
    if (opm === "3º BPChoq") return { index: 15, name: "Viaturas - 3º BPChoq" };
    if (opm === "4º BPChoq") return { index: 16, name: "Viaturas - 4º BPChoq" };
    if (opm === "5º BPChoq") return { index: 17, name: "Viaturas - 5º BPChoq" };
    if (opm === "RPMon") return { index: 18, name: "Jeep Biga - RPMon" };
    if (opm === "CCB") return { index: 20, name: "Viaturas - CCB Bombeiros" };
  }
  
  if (opm === "Defesa Civil") {
    return { index: 21, name: "Defesa Civil" };
  }
  
  return { index: 99, name: "Outros" };
}

export function getOpmColor(opm) {
  if (!opm) return "#9ca3af";
  const opmClean = opm.trim();
  if (OPM_COLORS[opmClean]) return OPM_COLORS[opmClean];
  
  let hash = 0;
  for (let i = 0; i < opmClean.length; i++) {
    hash = opmClean.charCodeAt(i) + ((hash << 5) - hash);
  }
  let h = Math.abs(hash) % 360;
  if (h >= 280 && h <= 340) {
    h = (h + 80) % 360;
  }
  return `hsl(${h}, 75%, 55%)`;
}

export function getOpmGlow(color) {
  if (color.startsWith("#")) {
    return color + "44";
  }
  return color;
}

export function DesfileProvider({ children }) {
  const [viaturas, setViaturas] = useState(() => {
    const cached = localStorage.getItem("cmm_viaturas");
    return cached ? JSON.parse(cached) : [...DEFAULT_VECTORS];
  });

  const [layouts, setLayouts] = useState(() => {
    const cached = localStorage.getItem("cmm_layouts");
    return cached ? JSON.parse(cached) : {...DEFAULT_LAYOUT};
  });

  const [webAppUrl, setWebAppUrl] = useState(() => {
    return localStorage.getItem("cmm_sheets_url") || HARDCODED_WEBAPP_URL;
  });

  const [spreadsheetUrl, setSpreadsheetUrl] = useState(() => {
    return localStorage.getItem("cmm_spreadsheet_url") || "";
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedOpmForVistoria, setSelectedOpmForVistoria] = useState(OPM_INDEX_LIST[0]);
  const [selectedVtrForEdit, setSelectedVtrForEdit] = useState(null);
  const [activeTab, setActiveTab] = useState("layout");

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem("cmm_viaturas", JSON.stringify(viaturas));
  }, [viaturas]);

  useEffect(() => {
    localStorage.setItem("cmm_layouts", JSON.stringify(layouts));
  }, [layouts]);

  const syncWithGoogleSheets = async () => {
    if (!webAppUrl) {
      setIsConnected(false);
      return;
    }
    setIsConnecting(true);
    try {
      const response = await fetch(`${webAppUrl}?action=get_data`);
      const res = await response.json();
      if (res.status === "success") {
        setIsConnected(true);
        if (res.spreadsheetUrl) {
          setSpreadsheetUrl(res.spreadsheetUrl);
          localStorage.setItem("cmm_spreadsheet_url", res.spreadsheetUrl);
        }
        
        const sheetResponses = res.checklist || [];
        const loadedLayout = res.layout || {};
        const vtrMap = {};
        
        const sheetOpms = new Set();
        Object.keys(loadedLayout).forEach(key => {
          const layoutRow = loadedLayout[key];
          if (layoutRow && layoutRow.opm) {
            sheetOpms.add(normalizeOpm(layoutRow.opm));
          }
        });
        
        sheetResponses.forEach(row => {
          const opm = row["OPM (Batalhão / Unidade / Comando)"];
          if (opm) {
            sheetOpms.add(normalizeOpm(opm));
          }
        });
        
        DEFAULT_VECTORS.forEach(vtr => {
          const opmStr = normalizeOpm(vtr.opm);
          if (sheetOpms.has(opmStr)) return;
          
          const prefixStr = String(vtr.prefix).trim();
          const key = opmStr + "_" + prefixStr;
          vtrMap[key] = {
            id: vtr.id,
            opm: opmStr,
            prefix: prefixStr,
            type: vtr.type || "carro",
            driver: vtr.driver || "",
            encarregado: vtr.encarregado || "",
            checklist: {...vtr.checklist},
            status: "Aprovado",
            hasResponse: false
          };
        });
        
        Object.keys(loadedLayout).forEach(key => {
          const layoutRow = loadedLayout[key];
          if (layoutRow && layoutRow.opm && layoutRow.vtr) {
            const opmStr = normalizeOpm(layoutRow.opm);
            const prefixStr = String(layoutRow.vtr).trim();
            const mapKey = opmStr + "_" + prefixStr;
            
            if (!vtrMap[mapKey]) {
              vtrMap[mapKey] = {
                id: "sheet_" + mapKey.replace(/[^a-zA-Z0-9]/g, "_"),
                opm: opmStr,
                prefix: prefixStr,
                type: checkIsMoto(prefixStr) ? "moto" : "carro",
                driver: layoutRow.motorista || "",
                encarregado: layoutRow.encarregado || "",
                checklist: createPerfectChecklist(),
                status: "Aprovado",
                hasResponse: false
              };
            } else {
              if (layoutRow.motorista) vtrMap[mapKey].driver = layoutRow.motorista;
              if (layoutRow.encarregado) vtrMap[mapKey].encarregado = layoutRow.encarregado;
            }
          }
        });
        
        sheetResponses.forEach(row => {
          const opm = row["OPM (Batalhão / Unidade / Comando)"];
          const prefix = row["VTR (Prefixo)"];
          if (opm && prefix) {
            const opmStr = normalizeOpm(opm);
            const prefixStr = String(prefix).trim();
            const mapKey = opmStr + "_" + prefixStr;
            
            if (!vtrMap[mapKey]) {
              vtrMap[mapKey] = {
                id: "sheet_" + mapKey.replace(/[^a-zA-Z0-9]/g, "_"),
                opm: opmStr,
                prefix: prefixStr,
                type: checkIsMoto(prefixStr) ? "moto" : "carro",
                driver: "",
                encarregado: "",
                checklist: createPerfectChecklist(),
                status: "Aprovado",
                hasResponse: true
              };
            } else {
              vtrMap[mapKey].hasResponse = true;
            }
            
            const checklist = {
              pintura: row["Pintura, lataria (funilaria) em perfeito estado?"] || "Sim",
              novo_grafismo: row["Novo grafismo (gestão de governo atual)?"] || "Sim",
              grafismo_geral: row["Grafismo (geral) em perfeito estado?"] || "Sim",
              sinais_sonoros: row["Sinais sonoros e luminosos em perfeito funcionamento?"] || "Sim",
              calota_padrao: row["Calota padrão (padrão de fábrica obrigatório)?"] || "Sim",
              luzes_farois: row["Luzes/lanternas/faróis/freios em perfeito funcionamento?"] || "Sim",
              mecanica_geral: row["Mecânica geral em perfeito funcionamento?"] || "Sim"
            };
            
            vtrMap[mapKey].checklist = checklist;
            const hasFail = Object.values(checklist).includes("Não");
            vtrMap[mapKey].status = hasFail ? "Pendente" : "Aprovado";
          }
        });
        
        const nextViaturas = Object.values(vtrMap);
        setViaturas(nextViaturas);
        
        const newLayouts = {};
        Object.keys(loadedLayout).forEach(key => {
          const layoutRow = loadedLayout[key];
          if (layoutRow) {
            const parts = key.split("_");
            const normOpm = normalizeOpm(parts[0]);
            const prefix = parts.slice(1).join("_");
            const normalizedKey = normOpm + "_" + prefix;
            
            newLayouts[normalizedKey] = {
              x: Number(layoutRow.x) || 527,
              y: Number(layoutRow.y) || 150,
              rotation: Number(layoutRow.rotation || 0)
            };
          }
        });
        
        const opmGroups = {};
        nextViaturas.forEach(vtr => {
          const opmStr = normalizeOpm(vtr.opm);
          const groupKey = opmStr + "_" + vtr.type;
          if (!opmGroups[groupKey]) opmGroups[groupKey] = [];
          opmGroups[groupKey].push(vtr);
        });
        
        Object.keys(opmGroups).forEach(groupKey => {
          const vtrs = opmGroups[groupKey];
          vtrs.sort((a, b) => a.prefix.localeCompare(b.prefix, undefined, { numeric: true }));
          
          vtrs.forEach((vtr, idx) => {
            const key = vtr.opm + "_" + vtr.prefix;
            if (!newLayouts[key]) {
              const defaultOpmVtrs = DEFAULT_VECTORS.filter(v => normalizeOpm(v.opm) === normalizeOpm(vtr.opm) && v.type === vtr.type);
              let targetY = 150 + idx * 120;
              let targetX = 527;
              
              const exactMatch = defaultOpmVtrs.find(v => String(v.prefix).trim().toLowerCase() === String(vtr.prefix).trim().toLowerCase());
              if (exactMatch) {
                const defKey = exactMatch.opm + "_" + exactMatch.prefix;
                const defCoords = DEFAULT_LAYOUT[defKey] || newLayouts[defKey];
                if (defCoords) {
                  targetY = defCoords.y;
                  targetX = defCoords.x;
                }
              } else if (idx < defaultOpmVtrs.length) {
                const defVtr = defaultOpmVtrs[idx];
                const defKey = defVtr.opm + "_" + defVtr.prefix;
                const defCoords = DEFAULT_LAYOUT[defKey] || newLayouts[defKey];
                if (defCoords) {
                  targetY = defCoords.y;
                  targetX = defCoords.x;
                }
              }
              
              newLayouts[key] = { x: targetX, y: targetY, rotation: 0 };
            }
          });
        });
        
        setLayouts(newLayouts);
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      console.error(err);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const saveLayoutToGoogleSheets = async (isSilent = false) => {
    if (!webAppUrl) {
      if (!isSilent) alert("Modo offline. Posições salvas apenas no navegador.");
      return false;
    }
    
    const positions = viaturas.map(vtr => {
      const key = vtr.opm + "_" + vtr.prefix;
      const coords = layouts[key] || DEFAULT_LAYOUT[key] || { x: 527, y: 150, rotation: 0 };
      return {
        opm: vtr.opm,
        vtr: vtr.prefix,
        x: coords.x,
        y: coords.y,
        rotation: coords.rotation,
        motorista: vtr.driver || "",
        encarregado: vtr.encarregado || "",
        tipo: vtr.type || "carro"
      };
    });
    
    try {
      const response = await fetch(webAppUrl, {
        method: "POST",
        mode: "cors",
        body: JSON.stringify({ action: "save_layout", positions })
      });
      const res = await response.json();
      if (res.status === "success") {
        if (!isSilent) alert("Layout salvo com sucesso na planilha!");
        return true;
      }
      if (!isSilent) alert("Erro ao salvar layout: " + res.message);
      return false;
    } catch (err) {
      console.error(err);
      if (!isSilent) alert("Erro de rede ao salvar layout.");
      return false;
    }
  };

  const updateVtrChecklistInGoogleSheets = async (vtr) => {
    if (!webAppUrl) return;
    try {
      const response = await fetch(webAppUrl, {
        method: "POST",
        mode: "cors",
        body: JSON.stringify({
          action: "update_checklist",
          opm: vtr.opm,
          vtr: vtr.prefix,
          ...vtr.checklist
        })
      });
      const res = await response.json();
      if (res.status === "success") {
        syncWithGoogleSheets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addViatura = (opm, prefix, type, driver, encarregado) => {
    const normOpm = normalizeOpm(opm);
    const duplicate = viaturas.find(v => v.opm.toLowerCase() === normOpm.toLowerCase() && v.prefix.toLowerCase() === prefix.toLowerCase());
    if (duplicate) {
      alert(`A VTR com prefixo ${prefix} já está cadastrada na OPM ${normOpm}.`);
      return false;
    }

    const newVtr = {
      id: "custom_" + Date.now(),
      opm: normOpm,
      prefix: prefix,
      type: type,
      driver: driver,
      encarregado: encarregado,
      checklist: createPerfectChecklist(),
      status: "Aprovado",
      hasResponse: false
    };

    const nextViaturas = [...viaturas, newVtr];
    setViaturas(nextViaturas);

    const key = newVtr.opm + "_" + newVtr.prefix;
    const sameOpmVtrs = nextViaturas.filter(v => normalizeOpm(v.opm) === newVtr.opm);
    let maxY = 150;
    sameOpmVtrs.forEach(v => {
      if (v.prefix === newVtr.prefix) return;
      const coords = layouts[v.opm + "_" + v.prefix] || DEFAULT_LAYOUT[v.opm + "_" + v.prefix];
      if (coords && coords.y > maxY) maxY = coords.y;
    });

    setLayouts(prev => ({
      ...prev,
      [key]: { x: 527, y: maxY + 80, rotation: 0 }
    }));

    setTimeout(() => {
      saveLayoutToGoogleSheets(true);
    }, 100);

    return true;
  };

  const editViatura = (id, type, driver, encarregado) => {
    setViaturas(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, type, driver, encarregado };
      }
      return v;
    }));
    
    setTimeout(() => {
      saveLayoutToGoogleSheets(true);
    }, 100);
  };

  const toggleChecklistItem = (vtrId, field) => {
    setViaturas(prev => prev.map(v => {
      if (v.id === vtrId) {
        const nextChecklist = {
          ...v.checklist,
          [field]: v.checklist[field] === "Sim" ? "Não" : "Sim"
        };
        const hasFail = Object.values(nextChecklist).includes("Não");
        const nextVtr = {
          ...v,
          checklist: nextChecklist,
          status: hasFail ? "Pendente" : "Aprovado",
          hasResponse: true
        };
        setTimeout(() => {
          updateVtrChecklistInGoogleSheets(nextVtr);
        }, 50);
        return nextVtr;
      }
      return v;
    }));
  };

  const moveViaturaLayout = (draggedVtr, targetX, targetY, targetVtr = null) => {
    setLayouts(prev => {
      const next = { ...prev };
      const draggedKey = draggedVtr.opm + "_" + draggedVtr.prefix;
      
      if (targetVtr) {
        const targetKey = targetVtr.opm + "_" + targetVtr.prefix;
        const draggedOrig = prev[draggedKey] || DEFAULT_LAYOUT[draggedKey] || { x: 527, y: 150 };
        const targetOrig = prev[targetKey] || DEFAULT_LAYOUT[targetKey] || { x: 527, y: 150 };
        
        next[draggedKey] = { x: targetOrig.x, y: targetOrig.y, rotation: 0 };
        next[targetKey] = { x: draggedOrig.x, y: draggedOrig.y, rotation: 0 };
      } else {
        next[draggedKey] = { x: targetX, y: targetY, rotation: 0 };
      }
      
      localStorage.setItem("cmm_layouts", JSON.stringify(next));
      
      setTimeout(() => {
        saveLayoutToGoogleSheets(true);
      }, 100);
      
      return next;
    });
  };

  const saveSettings = (url, sheetUrl) => {
    setWebAppUrl(url);
    localStorage.setItem("cmm_sheets_url", url);
    setSpreadsheetUrl(sheetUrl);
    localStorage.setItem("cmm_spreadsheet_url", sheetUrl);
  };

  // Sync initially
  useEffect(() => {
    syncWithGoogleSheets();
  }, [webAppUrl]);

  return (
    <DesfileContext.Provider value={{
      viaturas,
      layouts,
      webAppUrl,
      spreadsheetUrl,
      isConnected,
      isConnecting,
      selectedOpmForVistoria,
      setSelectedOpmForVistoria,
      selectedVtrForEdit,
      setSelectedVtrForEdit,
      activeTab,
      setActiveTab,
      syncWithGoogleSheets,
      saveLayoutToGoogleSheets,
      addViatura,
      editViatura,
      toggleChecklistItem,
      moveViaturaLayout,
      saveSettings
    }}>
      {children}
    </DesfileContext.Provider>
  );
}

export function useDesfile() {
  return useContext(DesfileContext);
}
