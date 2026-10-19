// Módulo gerado a partir do index.html original do TECMEC (CMM PMESP).
// Extraído automaticamente preservando o código original função por função.
import { jsPDF } from "jspdf";
import { state } from "./state.js";
import { showToast } from "./utils.js";

export function abrirFolhaPainel(protocolo) {
            state.folhaProtocoloAtiva = protocolo;
            const a = state.agendamentos.find(item => item.protocolo === protocolo || String(item.numSolicitacao).padStart(3, '0') === protocolo) || state.agendamentos[0];
            if (!a) return;

            let statusTxt = "EM CONFECÇÃO DE PARECER";
            if (a.status === "PRONTO" || a.dataParecer) statusTxt = "PARECER CONCLUÍDO / PRONTO";
            else if (a.status === "NO PÁTIO") statusTxt = "ENTRADA NO PÁTIO DO CMM";
            else if (a.status === "NA OPM") statusTxt = "VIATURA NA OPM";

            document.getElementById("folhaStatusTxt").textContent = statusTxt;

            // Formatação da Data de Entrada
            let dataEntradaFormatada = new Date().toLocaleDateString('pt-BR');
            if (a.dataEntrada) {
                const parts = a.dataEntrada.split('-');
                if (parts.length === 3) dataEntradaFormatada = `${parts[2]}/${parts[1]}/${parts[0]}`;
                else dataEntradaFormatada = a.dataEntrada;
            } else if (a.timestamp) {
                dataEntradaFormatada = new Date(a.timestamp).toLocaleDateString('pt-BR');
            }

            document.getElementById("folhaDataEntrada").textContent = dataEntradaFormatada;
            document.getElementById("folhaSindIpm").textContent = a.sindicancia_ipm || "N/A";

            document.getElementById("modalFolhaPainel").style.display = "flex";
        }

export function fecharModalFolhaPainel() {
            document.getElementById("modalFolhaPainel").style.display = "none";
        }

// Antes usava html2pdf()/html2canvas (tirar um "print" da tela) — só que a
// lib nunca chegou a ser carregada no projeto (sem <script> nem import
// nenhum), então isso sempre dava erro e caía no fallback window.print(),
// que abre a caixa de impressão do navegador com o cabeçalho/rodapé feio.
// Agora é PDF vetorial direto com jsPDF — mesmo esquema usado no parecer
// técnico (ver src/pdfBuilder.js) — sem servidor, sem screenshot, sem
// depender de nenhuma caixa de diálogo.
export function baixarPdfFolhaPainel() {
            const statusTxt = document.getElementById("folhaStatusTxt")?.textContent || "PARECER EM CONFECÇÃO";
            const dataEntrada = document.getElementById("folhaDataEntrada")?.textContent || "18/09/2026";
            const sindIpm = document.getElementById("folhaSindIpm")?.textContent || "18BPMM-13/70/26";

            try {
                const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
                const pageW = 210, centerX = pageW / 2;

                doc.setFont("helvetica", "bold");
                doc.setFontSize(30);
                const linhasStatus = doc.splitTextToSize(statusTxt.toUpperCase(), 180);
                doc.text(linhasStatus, centerX, 90, { align: "center" });

                doc.setFontSize(24);
                doc.text(`DATA DE ENTRADA: ${dataEntrada}`, centerX, 150, { align: "center", maxWidth: 180 });
                doc.text(`SIND/IPM Nº: ${sindIpm}`, centerX, 175, { align: "center", maxWidth: 180 });

                const cleanName = sindIpm.replace(/[^a-zA-Z0-9]/g, "_");
                doc.save(`Folha_Painel_${cleanName}.pdf`);
                showToast("Download da Folha de Painel concluído!", "success");
            } catch (err) {
                console.error("Erro ao gerar o PDF da Folha de Painel:", err);
                showToast("Erro ao gerar o PDF. Tente novamente.", "error");
            }
        }
