const DEFAULT_VECTORS = [
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
]