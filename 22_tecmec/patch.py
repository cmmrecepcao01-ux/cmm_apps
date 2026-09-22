import re

def patch_backend():
    file_path = "google_apps_script_agendamento.js"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Modify the email format in `enviarEmailDiretoComAnexos`
    new_email_logic = """
  var rawEmail = emailDestino || d.email || "";
  var recipient = EMAIL_NOTIFICACAO_CMM; // fallback
  if (rawEmail) {
      rawEmail = rawEmail.split('@')[0];
      recipient = rawEmail + "@policiamilitar.sp.gov.br";
  }
"""
    content = re.sub(
        r'var recipient = emailDestino \|\| d\.email \|\| EMAIL_NOTIFICACAO_CMM;',
        new_email_logic,
        content
    )

    # Allow processing the 'parecerPdfBase64'
    new_attachments_logic = """
  for (var key in docsBase64) {
    var doc = docsBase64[key];
    if (doc && doc.base64) {
      var base64Data = doc.base64.split(",")[1] || doc.base64;
      var decoded = Utilities.base64Decode(base64Data);
      var filename = (d.protocolo || "SOLICITACAO") + "_" + (labels[key] || ("DOC_" + key)) + ".pdf";
      var blob = Utilities.newBlob(decoded, "application/pdf", filename);
      attachments.push(blob);
    }
  }
  
  if (d.parecerPdfBase64) {
      try {
          var pBase64Data = d.parecerPdfBase64.split(",")[1] || d.parecerPdfBase64;
          var pDecoded = Utilities.base64Decode(pBase64Data);
          var pBlob = Utilities.newBlob(pDecoded, "application/pdf", "PARECER_TECNICO_" + (d.protocolo || "000") + ".pdf");
          attachments.push(pBlob);
      } catch(ep) {}
  }
"""
    content = re.sub(
        r'for \(var key in docsBase64\) \{[\s\S]*?\}\s*\}',
        new_attachments_logic,
        content
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

def patch_frontend():
    file_path = "index.html"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Add folhaProtocoloAtiva
    content = content.replace('function abrirFolhaPainel(protocolo) {', 'function abrirFolhaPainel(protocolo) {\n            state.folhaProtocoloAtiva = protocolo;')
    
    # Replace baixarPdfFolhaPainel
    new_baixar_pdf = """
        function baixarPdfFolhaPainel() {
            const a = state.agendamentos.find(item => item.protocolo === state.folhaProtocoloAtiva || String(item.numSolicitacao).padStart(3, '0') === state.folhaProtocoloAtiva);
            if (!a) {
                showToast("Erro ao encontrar solicita\u00e7\u00e3o ativa", "error");
                return;
            }

            let statusTxt = "EM CONFEC\u00c7\u00c3O DE PARECER";
            if (a.status === "PRONTO" || a.dataParecer) statusTxt = "PARECER CONCLU\u00cdDO / PRONTO";
            else if (a.status === "NO P\u00c1TIO") statusTxt = "NO P\u00c1TIO (CMM)";
            else if (a.status === "NA OPM") statusTxt = "NA OPM";
            else if (a.status === "EM AN\u00c1LISE") statusTxt = "EM AN\u00c1LISE";

            let dataEntradaFormatada = new Date().toLocaleDateString('pt-BR');
            if (a.dataEntrada) {
                const parts = a.dataEntrada.split('-');
                if (parts.length === 3) dataEntradaFormatada = `${parts[2]}/${parts[1]}/${parts[0]}`;
                else dataEntradaFormatada = a.dataEntrada;
            }

            let dataRegistro = a.dataRegistro || dataEntradaFormatada;
            let procedimento = a.tipo_procedimento || "SINDIC\u00c2NCIA";
            if (procedimento.includes("INQU\u00c9RITO")) procedimento = "IPM";

            const tempDiv = document.createElement("div");
            tempDiv.style.width = "750px";
            tempDiv.style.padding = "60px 40px";
            tempDiv.style.background = "#ffffff";
            tempDiv.style.color = "#000000";
            tempDiv.style.fontFamily = "Arial, sans-serif";
            tempDiv.style.boxSizing = "border-box";
            tempDiv.style.position = "absolute";
            tempDiv.style.left = "-9999px";
            tempDiv.style.top = "-9999px";

            tempDiv.innerHTML = `
                <div style="font-size: 48px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; line-height: 1.5; color: #000; display:flex; flex-direction:column; gap:20px;">
                    <div>SOLICITA\u00c7\u00c3O: ${a.protocolo || String(a.numSolicitacao).padStart(3, '0')}</div>
                    <div>DATA REGISTRO: ${dataRegistro}</div>
                    <div>STATUS: ${statusTxt}</div>
                    <div>OPM: ${a.opm || "N/A"}</div>
                    <div>VTR: ${a.placa || "N/A"}</div>
                    <div>PROCEDIMENTO: ${procedimento}</div>
                    <div>DATA ENTRADA: ${dataEntradaFormatada}</div>
                </div>
            `;

            document.body.appendChild(tempDiv);

            const opt = {
                margin: 10,
                filename: `Folha_Painel_${a.protocolo}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(tempDiv).save().then(() => {
                document.body.removeChild(tempDiv);
                showToast("Download da Folha de Painel conclu\u00eddo!", "success");
            }).catch(err => {
                if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
            });
        }
"""
    content = re.sub(
        r'function baixarPdfFolhaPainel\(\) \{[\s\S]*?\}\s*// FAZER PARECER',
        new_baixar_pdf + '\n        // FAZER PARECER',
        content
    )

    # Intercept "salvarEEmitirParecerSubdashboard"
    content = content.replace('voltarAoPainelGestorFromSubdashboard();\n            showToast(`PARECER T\u00c9CNICO OFICIAL EMITIDO EM ${dataFormatada}! Viatura PRONTA.`, "success");', 
    """// Inicia Preview ao inv\u00e9s de fechar direto
            gerarEPreverParecerPdf(a);""")

    # Add HTML Modal for Preview
    modal_preview_html = """
    <!-- MODAL PREVIEW PARECER -->
    <div class="modal-overlay" id="modalPreviewParecer" style="display: none; z-index: 99999;">
        <div class="modal-container" style="max-width: 800px; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
                <h3 style="font-size: 16px; font-weight: 800; color: #ffffff;">
                    <i class="fa-solid fa-eye" style="color: var(--accent-cyan);"></i> PR\u00c9VIA DO PARECER T\u00c9CNICO
                </h3>
            </div>
            <div id="previewParecerContainer" style="background: #fff; color: #000; padding: 20px; height: 500px; overflow-y: auto; font-family: Arial, sans-serif; font-size: 12px; border: 1px solid #ccc;">
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="document.getElementById('modalPreviewParecer').style.display='none'">VOLTAR/EDITAR</button>
                <button class="btn btn-success" onclick="baixarPdfPreviewParecer()"><i class="fa-solid fa-file-pdf"></i> DOWNLOAD PDF</button>
                <button class="btn btn-primary" onclick="finalizarEnviarEmailParecer()"><i class="fa-solid fa-envelope"></i> CONCLUIR E ENVIAR E-MAIL</button>
            </div>
        </div>
    </div>
"""
    content = content.replace('<!-- MODALS SECUND\u00c1RIOS -->', modal_preview_html + '\n    <!-- MODALS SECUND\u00c1RIOS -->')

    functions_preview = """
        let parecerTempDivParaPdf = null;
        let parecerAtual = null;

        function gerarEPreverParecerPdf(a) {
            parecerAtual = a;
            const tempDiv = document.createElement("div");
            tempDiv.style.width = "750px";
            tempDiv.style.padding = "40px";
            tempDiv.style.background = "#ffffff";
            tempDiv.style.color = "#000000";
            tempDiv.style.fontFamily = "Arial, sans-serif";
            tempDiv.style.boxSizing = "border-box";

            let html = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">POL\u00cdCIA MILITAR DO ESTADO DE S\u00c3O PAULO</h2>
                    <h3 style="font-size: 16px; margin-bottom: 5px;">CENTRO DE MOTOMECANIZA\u00c7\u00c3O - CMM</h3>
                    <h4 style="font-size: 14px; font-weight: normal;">PARECER T\u00c9CNICO N\u00ba ${a.parecerDados?.numParecer || 'S/N'}</h4>
                </div>
                <div style="margin-bottom: 20px; line-height: 1.6;">
                    <strong>SOLICITA\u00c7\u00c3O:</strong> ${a.protocolo || ''}<br>
                    <strong>OPM:</strong> ${a.opm || ''}<br>
                    <strong>VIATURA:</strong> ${a.placa || ''} - ${a.prefixo || ''}<br>
                    <strong>PROCEDIMENTO:</strong> ${a.tipo_procedimento || ''} - ${a.sindicancia_ipm || ''}<br>
                    <strong>DATA PARECER:</strong> ${a.dataParecer || ''}<br>
                    <strong>CONDI\u00c7\u00c3O:</strong> ${a.parecerDados?.condicao || ''}
                </div>
                <div style="margin-bottom: 20px;">
                    <strong>OBJETIVO DA AVALIA\u00c7\u00c3O:</strong><br>
                    ${a.subdashObjResposta || 'N/A'}
                </div>
            `;

            if (a.subdashEtapas && a.subdashEtapas.length > 0) {
                html += `<div style="margin-top: 20px;"><strong>ACHADOS T\u00c9CNICOS:</strong></div>`;
                a.subdashEtapas.forEach(etapa => {
                    html += `<div style="margin-top: 15px;"><strong>${etapa.titulo}</strong></div>`;
                    html += `<div>${etapa.texto}</div>`;
                });
            }

            html += `
                <div style="margin-top: 50px; text-align: center;">
                    <hr style="width: 50%; border: 1px solid #000; margin: 0 auto 10px auto;">
                    <strong>${a.parecerDados?.militar || 'COMISS\u00c3O T\u00c9CNICA'}</strong>
                </div>
            `;

            tempDiv.innerHTML = html;
            parecerTempDivParaPdf = tempDiv;
            
            document.getElementById("previewParecerContainer").innerHTML = tempDiv.outerHTML;
            document.getElementById("modalPreviewParecer").style.display = "flex";
        }

        function baixarPdfPreviewParecer() {
            if (!parecerTempDivParaPdf || !parecerAtual) return;
            const opt = {
                margin: 10,
                filename: `Parecer_Tecnico_${parecerAtual.protocolo}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(parecerTempDivParaPdf).save().then(() => {
                showToast("Parecer baixado!", "success");
            });
        }

        async function finalizarEnviarEmailParecer() {
            if (!parecerTempDivParaPdf || !parecerAtual) return;
            showToast("Gerando anexo e enviando e-mail...", "info");
            
            const opt = {
                margin: 10,
                filename: `Parecer_Tecnico_${parecerAtual.protocolo}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            let base64Pdf = "";
            try {
                base64Pdf = await html2pdf().set(opt).from(parecerTempDivParaPdf).outputPdf('datauristring');
            } catch(e) {
                console.error("Erro gerando base64 do parecer", e);
            }

            parecerAtual.parecerPdfBase64 = base64Pdf;
            
            document.getElementById("modalPreviewParecer").style.display = "none";
            voltarAoPainelGestorFromSubdashboard();
            showToast(`PARECER T\u00c9CNICO OFICIAL EMITIDO! Viatura PRONTA.`, "success");

            if (window.dispararEnvioEmailNotificacaoWrapper) {
                window.dispararEnvioEmailNotificacaoWrapper(parecerAtual.protocolo, base64Pdf);
            }
        }

        async function dispararEnvioEmailNotificacaoWrapper(protocolo, parecerBase64) {
             const a = state.agendamentos.find(item => item.protocolo === protocolo || String(item.numSolicitacao).padStart(3, '0') === protocolo);
             if (!a) return;
             
             let payload = Object.assign({}, a);
             if (parecerBase64) {
                 payload.parecerPdfBase64 = parecerBase64;
             }
             payload.action = "ENVIAR_EMAIL";

             try {
                 const res = await fetch(SCRIPT_URL, {
                     method: "POST",
                     headers: { "Content-Type": "text/plain;charset=utf-8" },
                     body: JSON.stringify(payload)
                 });
                 const json = await res.json();
                 if (json.status === "SUCCESS") {
                     showToast("E-mail com Parecer enviado com sucesso!", "success");
                 } else {
                     showToast("Erro ao enviar e-mail: " + json.message, "error");
                 }
             } catch(e) {
                 showToast("Erro na requisi\u00e7\u00e3o de e-mail.", "error");
             }
        }
"""
    content = content.replace('function salvarEEmitirParecerSubdashboard() {', functions_preview + '\n        function salvarEEmitirParecerSubdashboard() {')

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    patch_backend()
    patch_frontend()
