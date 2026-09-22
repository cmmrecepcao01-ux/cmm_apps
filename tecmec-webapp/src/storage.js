// Módulo gerado a partir do index.html original do TECMEC (CMM PMESP).
// Extraído automaticamente preservando o código original função por função.
import { CONFIG, state } from "./state.js";

export function carregarStorage() {
            try {
                const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
                state.agendamentos = raw ? JSON.parse(raw) : [];
            } catch (e) { state.agendamentos = []; }
        }

export function salvarStorage() {
            try {
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.agendamentos));
            } catch (e) {}
        }
