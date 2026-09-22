// Módulo gerado a partir do index.html original do TECMEC (CMM PMESP).
// Extraído automaticamente preservando o código original função por função.
import { CONFIG, state } from "./state.js";
import { showToast } from "./utils.js";
import { carregarEAtualizarPainelGestor } from "./operador.js";
import { irParaEtapa, restaurarRascunhoSeExistir } from "./wizard.js";
import { supabase } from "./supabaseClient.js";
import { consultarSolicitacaoSupabase } from "./api.js";

export function abrirPortalCapa() {
            document.getElementById("viewPortalCapa").style.display = "block";
            document.getElementById("viewSolicitante").style.display = "none";
            document.getElementById("viewOperador").style.display = "none";
            document.getElementById("btnNavPortal")?.classList.add("active");
            document.getElementById("btnNavSolicitante")?.classList.remove("active");
            document.getElementById("btnNavOperador")?.classList.remove("active");
            
            const btnGestor = document.getElementById("btnNavOperador");
            if (btnGestor) btnGestor.style.display = "inline-flex";
        }

export function abrirAreaSolicitante() {
            document.getElementById("viewPortalCapa").style.display = "none";
            document.getElementById("viewSolicitante").style.display = "block";
            document.getElementById("viewOperador").style.display = "none";
            document.getElementById("btnNavPortal")?.classList.remove("active");
            document.getElementById("btnNavSolicitante")?.classList.add("active");
            document.getElementById("btnNavOperador")?.classList.remove("active");
            
            const btnGestor = document.getElementById("btnNavOperador");
            if (btnGestor) btnGestor.style.display = "none";
        }

export function abrirPainelOperador() {
            document.getElementById("viewPortalCapa").style.display = "none";
            document.getElementById("viewSolicitante").style.display = "none";
            document.getElementById("viewOperador").style.display = "block";
            document.getElementById("btnNavPortal")?.classList.remove("active");
            document.getElementById("btnNavSolicitante")?.classList.remove("active");
            document.getElementById("btnNavOperador")?.classList.add("active");
            
            const btnGestor = document.getElementById("btnNavOperador");
            if (btnGestor) btnGestor.style.display = "inline-flex";
            carregarEAtualizarPainelGestor();
        }

export function abrirModalAcessoSolicitante() {
            const errDiv = document.getElementById("acessoErroMsg");
            if (errDiv) errDiv.style.display = "none";
            const modal = document.getElementById("modalAcessoSolicitante");
            if (modal) modal.style.display = "flex";
        }

export function fecharModalAcessoSolicitante() {
            const modal = document.getElementById("modalAcessoSolicitante");
            if (modal) modal.style.display = "none";
        }

export function confirmarAcessoSolicitante() {
            const opm = (document.getElementById("acessoOpm")?.value || "").trim().toUpperCase();
            const placaBruta = (document.getElementById("acessoPlaca")?.value || "").trim().toUpperCase();
            const placaLimpa = placaBruta.replace(/[^A-Z0-9]/g, '');
            const errDiv = document.getElementById("acessoErroMsg");

            if (errDiv) errDiv.style.display = "none";

            if (!placaLimpa || placaLimpa.length < 7) {
                const msg = "PLACA INVÁLIDA: A placa deve possuir 7 caracteres (Ex: ABC1234).";
                if (errDiv) { errDiv.textContent = msg; errDiv.style.display = "block"; }
                showToast(msg, "error");
                return;
            }

            const frota = window.SIPL_FROTA || [];
            const v = frota.find(item => (item.p || "").replace(/[^A-Z0-9]/g, '') === placaLimpa);

            if (!v) {
                const msg = `PLACA INVÁLIDA: A viatura ${placaBruta} não consta no banco de dados do SIPL/PMESP. Acesso bloqueado.`;
                if (errDiv) { errDiv.textContent = msg; errDiv.style.display = "block"; }
                showToast(msg, "error");
                return;
            }

            state.viaturaSelecionada = v;
            document.getElementById("cardVtrPlaca").textContent = v.p || "---";
            document.getElementById("cardVtrPrefixo").textContent = v.pr ? `PREFIXO: ${v.pr}` : "PREFIXO: S/N";
            document.getElementById("cardVtrModelo").textContent = v.m || "---";
            document.getElementById("cardVtrAno").textContent = v.a || "---";
            document.getElementById("cardVtrOpm").textContent = opm || v.opm || "CMM";
            document.getElementById("cardVtrChassi").textContent = v.ch || "N/A";
            document.getElementById("cardVtrMotor").textContent = v.mot || "N/A";
            document.getElementById("cardVtrPatrimonio").textContent = v.pat || "N/A";

            fecharModalAcessoSolicitante();
            abrirAreaSolicitante();
            irParaEtapa(1);
            showToast(`Viatura ${v.p} identificada com sucesso!`, "success");
            restaurarRascunhoSeExistir(v.p);
        }

export function abrirModalLogin() {
            const errDiv = document.getElementById("loginErroMsg");
            if (errDiv) errDiv.style.display = "none";
            document.getElementById("loginUser").value = "";
            document.getElementById("loginPass").value = "";
            document.getElementById("modalLoginOperador").style.display = "flex";
        }

export function fecharModalLogin() {
            document.getElementById("modalLoginOperador").style.display = "none";
        }

export async function confirmarLoginOperador() {
            const u = (document.getElementById("loginUser")?.value || "").trim().toLowerCase();
            const p = document.getElementById("loginPass")?.value || "";
            const errDiv = document.getElementById("loginErroMsg");
            if (errDiv) errDiv.style.display = "none";

            if (!u || !p) {
                const msg = "Informe usuário e senha.";
                if (errDiv) { errDiv.textContent = msg; errDiv.style.display = "block"; }
                showToast(msg, "error");
                return;
            }

            // Login de operador via Supabase Auth. O usuário é mapeado para um
            // e-mail sintético (ex.: "cmm" -> "cmm@cmm.local") — a conta
            // correspondente deve ser criada no painel do Supabase (Authentication > Users).
            const emailSintetico = `${u}@cmm.local`;
            const { error } = await supabase.auth.signInWithPassword({ email: emailSintetico, password: p });

            if (!error) {
                fecharModalLogin();
                state.operadorLogado = true;
                abrirPainelOperador();
                showToast("Acesso concedido ao Painel do Gestor CMM!", "success");
            } else {
                const msg = "Credenciais inválidas.";
                if (errDiv) { errDiv.textContent = msg; errDiv.style.display = "block"; }
                showToast(msg, "error");
            }
        }

export function abrirModalConsulta() {
            document.getElementById("modalConsulta").style.display = "flex";
        }

export function fecharModalConsulta() {
            document.getElementById("modalConsulta").style.display = "none";
        }

export async function executarBuscaModalConsulta() {
            const q = (document.getElementById("inputModalConsulta")?.value || "").trim().toUpperCase();
            const box = document.getElementById("resultadoModalConsulta");
            if (!q || !box) return;

            box.innerHTML = `<div style="text-align:center; padding:10px; color:var(--text-dim);">BUSCANDO...</div>`;
            box.style.display = "block";

            let item = null;
            try {
                item = await consultarSolicitacaoSupabase(q);
            } catch (e) {
                console.error("Erro na consulta pública:", e);
            }

            if (!item) {
                box.innerHTML = `<div style="color:#f87171; text-align:center; padding:10px;">Nenhum registro encontrado para '${q}'.</div>`;
                return;
            }

            box.innerHTML = `
                <div style="background:var(--bg-card); padding:14px; border-radius:6px; border:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                        <strong style="color:var(--accent-cyan); font-family:monospace;">${item.protocolo}</strong>
                        <span class="badge-status operacao">${item.status}</span>
                    </div>
                    <p style="font-size:11px;"><strong>VTR:</strong> ${item.placa} | <strong>OPM:</strong> ${item.opm}</p>
                    <p style="font-size:11px;"><strong>PROCEDIMENTO:</strong> ${item.tipo_procedimento || ''} - ${item.sindicancia_ipm || ''}</p>
                    <p style="font-size:11px;"><strong>DATA PARECER:</strong> ${item.data_parecer || 'PENDENTE'}</p>
                </div>
            `;
        }
