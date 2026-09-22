// Módulo gerado a partir do index.html original do TECMEC (CMM PMESP).
// Extraído automaticamente preservando o código original função por função.
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

export function baixarPdfFolhaPainel() {
            const statusTxt = document.getElementById("folhaStatusTxt")?.textContent || "PARECER EM CONFECÇÃO";
            const dataEntrada = document.getElementById("folhaDataEntrada")?.textContent || "18/09/2026";
            const sindIpm = document.getElementById("folhaSindIpm")?.textContent || "18BPMM-13/70/26";

            // Criar contêiner temporário limpo para renderização A4 sem ruído visual de modal
            const tempDiv = document.createElement("div");
            tempDiv.style.width = "750px";
            tempDiv.style.padding = "60px 40px";
            tempDiv.style.background = "#ffffff";
            tempDiv.style.color = "#000000";
            tempDiv.style.fontFamily = "Arial, sans-serif";
            tempDiv.style.textAlign = "center";
            tempDiv.style.boxSizing = "border-box";
            // Fica dentro da área visível (por trás do modal aberto, z-index -1) em vez de
            // "-9999px": alguns navegadores/versões do html2canvas geram PDF em branco
            // quando o elemento capturado está fora da área de rolagem da página.
            tempDiv.style.position = "fixed";
            tempDiv.style.left = "0";
            tempDiv.style.top = "0";
            tempDiv.style.zIndex = "-1";

            tempDiv.innerHTML = `
                <div style="font-size: 48px; font-weight: 900; margin-bottom: 60px; text-transform: uppercase; line-height: 1.2; color: #000;">${statusTxt}</div>
                <div style="font-size: 44px; font-weight: bold; margin-bottom: 60px; color: #000;">DATA DE ENTRADA: ${dataEntrada}</div>
                <div style="font-size: 44px; font-weight: bold; color: #000;">SIND/IPM Nº: ${sindIpm}</div>
            `;

            document.body.appendChild(tempDiv);

            const cleanName = sindIpm.replace(/[^a-zA-Z0-9]/g, '_');
            const opt = {
                margin: 10,
                filename: `Folha_Painel_${cleanName}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, logging: false, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            showToast("Gerando PDF da Folha de Painel...", "info");
            html2pdf().set(opt).from(tempDiv).save().then(() => {
                document.body.removeChild(tempDiv);
                showToast("Download da Folha de Painel concluído!", "success");
            }).catch(err => {
                console.error("Erro no html2pdf:", err);
                if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
                window.print();
            });
        }
