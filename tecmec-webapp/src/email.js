// Módulo gerado a partir do index.html original do TECMEC (CMM PMESP).
// Extraído automaticamente preservando o código original função por função.
import { CONFIG, state } from "./state.js";
import { showToast } from "./utils.js";

export function abrirModalEmailNotificacao(protocolo) {
            const a = state.agendamentos.find(item => item.protocolo === protocolo || String(item.numSolicitacao).padStart(3, '0') === protocolo);
            if (!a) return;

            const solicNum = String(a.numSolicitacao || '001').padStart(3, '0');
            window.emailProtocoloAtual = a.protocolo || solicNum;
            // Sempre o e-mail que o próprio solicitante cadastrou (não um endereço fixo).
            document.getElementById("emailDestinatario").value = a.email || "";
            document.getElementById("emailAssunto").value = `CMM PMESP - ANÁLISE TÉCNICA VIATURA ${a.placa} - SOLICITAÇÃO Nº ${solicNum} (${a.opm})`;
            document.getElementById("emailCorpo").value = `Prezado Oficial Subfrota/Motomec de ${a.opm},

Informamos que a análise técnica referente à solicitação nº ${solicNum} (Viatura Placa: ${a.placa}, Procedimento ${a.tipo_procedimento} - ${a.sindicancia_ipm}) foi concluída e o Parecer técnico somente é liberado via sistema após a retirada do veículo do CMM.

Seguem anexados a este e-mail todos os documentos do procedimento (.PDF).

Atenciosamente,
Centro de Motomecanização - Setor Técnico
Polícia Militar do Estado de São Paulo`;

            document.getElementById("modalEmail").style.display = "flex";
        }

export function fecharModalEmail() {
            document.getElementById("modalEmail").style.display = "none";
        }

export async function dispararEnvioEmailNotificacao() {
            const dest = (document.getElementById("emailDestinatario")?.value || "").trim().toLowerCase();
            const assunto = (document.getElementById("emailAssunto")?.value || "").trim();
            const corpo = (document.getElementById("emailCorpo")?.value || "").trim();

            if (!dest || !dest.endsWith("@policiamilitar.sp.gov.br")) {
                showToast("Informe um e-mail institucional válido (@policiamilitar.sp.gov.br).", "error");
                return;
            }

            const protocolo = window.emailProtocoloAtual;
            const item = state.agendamentos.find(a => a.protocolo === protocolo || String(a.numSolicitacao).padStart(3, '0') === protocolo) || (state.agendamentos && state.agendamentos[0]);

            fecharModalEmail();
            showToast(`Disparando e-mail com anexos para ${dest}...`, "info");

            let appScriptSuccess = false;
            if (CONFIG.API_URL && !CONFIG.API_URL.includes("AKfycbx...")) {
                try {
                    const response = await fetch(CONFIG.API_URL, {
                        method: "POST",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify({
                            action: "ENVIAR_EMAIL",
                            emailDestino: dest,
                            assunto: assunto,
                            corpo: corpo,
                            data: item,
                            docsBase64: state.docsBase64 || window.testDriveFiles || {}
                        })
                    });
                    const resJson = await response.json();
                    if (resJson.status === "SUCCESS") {
                        appScriptSuccess = true;
                        showToast(`E-mail com anexos enviado com sucesso para ${dest}!`, "success");
                    } else {
                        showToast(resJson.message || "Solicitação de e-mail registrada no servidor!", "info");
                    }
                } catch (err) {
                    console.error("Erro no fetch de e-mail:", err);
                }
            }

            if (!appScriptSuccess) {
                const mailtoUrl = `mailto:${dest}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
                window.open(mailtoUrl, '_blank');
                showToast(`Notificação registrada! Cliente de e-mail aberto para ${dest}.`, "success");
            }
        }
