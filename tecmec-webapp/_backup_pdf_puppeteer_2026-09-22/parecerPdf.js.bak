// Módulo gerado a partir do index.html original do TECMEC (CMM PMESP).
// Geração do PDF do parecer técnico.
//
// A geração deixou de usar html2pdf.js/html2canvas (tirar um "print" da tela
// e montar páginas em cima disso) — essa abordagem é frágil por natureza:
// qualquer mudança de conteúdo podia cortar página ou esmagar foto. Agora o
// MESMO HTML do preview é mandado para uma função Netlify (netlify/functions/
// gerar-pdf-parecer.js) que roda um Chrome headless (Puppeteer) de verdade e
// usa a função de impressão nativa dele — paginação, fotos e nitidez saem
// corretas porque é um PDF nativo, não uma foto da tela.
import { CONFIG, state } from "./state.js";
import { showToast } from "./utils.js";
import { voltarAoPainelGestorFromSubdashboard } from "./parecerSubdashboard.js";
import { salvarPdfParecerSupabase } from "./api.js";

let parecerAtual = null;

// Nº do Boletim Interno que nomeia a Comissão Técnica — é sempre o mesmo,
// por isso fica como constante fácil de editar (não varia por parecer).
const BOLETIM_INTERNO_NOMEACAO = "CMM-08/24";

// ---------------------------------------------------------------------
// Data por extenso (ex.: "vigésimo quarto dia do mês de junho do ano de
// dois mil e vinte e seis") — usada na abertura do parecer, item 1.
// ---------------------------------------------------------------------
const ORDINAIS_DIA = {
    1: "primeiro", 2: "segundo", 3: "terceiro", 4: "quarto", 5: "quinto", 6: "sexto", 7: "sétimo", 8: "oitavo", 9: "nono", 10: "décimo",
    11: "décimo primeiro", 12: "décimo segundo", 13: "décimo terceiro", 14: "décimo quarto", 15: "décimo quinto", 16: "décimo sexto", 17: "décimo sétimo", 18: "décimo oitavo", 19: "décimo nono", 20: "vigésimo",
    21: "vigésimo primeiro", 22: "vigésimo segundo", 23: "vigésimo terceiro", 24: "vigésimo quarto", 25: "vigésimo quinto", 26: "vigésimo sexto", 27: "vigésimo sétimo", 28: "vigésimo oitavo", 29: "vigésimo nono", 30: "trigésimo", 31: "trigésimo primeiro"
};
const MESES_EXTENSO = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const UNIDADES = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const DEZ_A_DEZENOVE = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function extensoAte999(n) {
    if (n === 0) return "";
    if (n === 100) return "cem";
    const c = Math.floor(n / 100), r = n % 100;
    const partes = [];
    if (c > 0) partes.push(CENTENAS[c]);
    if (r > 0) {
        if (r < 10) partes.push(UNIDADES[r]);
        else if (r < 20) partes.push(DEZ_A_DEZENOVE[r - 10]);
        else {
            const d = Math.floor(r / 10), u = r % 10;
            partes.push(u > 0 ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d]);
        }
    }
    return partes.join(" e ");
}

function numeroPorExtenso(n) {
    if (n === 0) return "zero";
    if (n < 1000) return extensoAte999(n);
    const milhar = Math.floor(n / 1000), resto = n % 1000;
    const parteMilhar = milhar === 1 ? "mil" : `${extensoAte999(milhar)} mil`;
    return resto === 0 ? parteMilhar : `${parteMilhar} e ${extensoAte999(resto)}`;
}

function dataExtenso(d) {
    const dia = ORDINAIS_DIA[d.getDate()] || d.getDate();
    const mes = MESES_EXTENSO[d.getMonth()];
    const ano = numeroPorExtenso(d.getFullYear());
    return `${dia} dia do mês de ${mes} do ano de ${ano}`;
}

function dataCurta(d) {
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = MESES_EXTENSO[d.getMonth()];
    return `${dia} de ${mes} de ${d.getFullYear()}`;
}

// Parágrafo numerado (item ou subitem) com recuo de primeira linha de 2cm,
// fiel ao template Word — usado tanto para os itens 1./2. quanto para os
// subitens X.1, X.2... dentro de cada etapa da análise técnica. "break-inside:
// avoid" evita que o PDF corte o parágrafo no meio entre duas páginas (o
// Chrome headless respeita isso de verdade, ao contrário do html2canvas).
function pItem(label, textoHtml) {
    return `<p style="margin: 0 0 10px 0; text-align: justify; text-indent: 2cm; line-height: 1.5; font-size: 12px; page-break-inside: avoid; break-inside: avoid;"><strong>${label}</strong> ${textoHtml}</p>`;
}

// Monta o MIOLO do parecer (cabeçalho, itens, análise técnica, quesitos,
// conclusão + assinaturas) — usado tanto no preview em tela quanto no
// documento final mandado para a função de PDF, então nunca ficam
// desincronizados entre si.
function construirMioloParecer(a) {
    const hoje = new Date();
    const numParecer = a.parecerDados?.numParecer || 'S/N';
    const oficio = a.numeroOficio || 'S/Nº';
    const procNum = a.sindicancia_ipm || 'S/Nº';
    const procTipo = a.tipo_procedimento === 'IPM' ? 'IPM' : 'sindicância';
    const veiculoDesc = `${a.modelo || ''}, ano ${a.ano || ''}, VIN ${a.chassi || ''}, placas ${a.placa || ''}, prefixo ${a.prefixo || ''}, patrimônio ${a.patrimonio || ''}`.replace(/\s+/g, ' ').trim();
    let fotoContador = 0;
    // URL absoluta até a PASTA onde o app está publicado (funciona tanto na
    // raiz local — http://localhost:8888/ — quanto em qualquer subcaminho
    // de produção — ex.: https://cmmpaineldebordo.netlify.app/tecmec-webapp/
    // — sem precisar hardcodar o nome da pasta). Necessário porque este
    // HTML também é renderizado fora da página (na função de PDF, pelo
    // Puppeteer), onde um caminho relativo "/imagem.png" não resolveria.
    const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, "");

    let html = "";

    // Cabeçalho: brasão de SP à esquerda, brasão do CMM à direita, títulos
    // centralizados entre os dois — igual ao modelo Word.
    html += `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; page-break-inside: avoid; break-inside: avoid;">
            <div style="width: 120px; text-align: center; font-size: 7px; line-height: 1.4; flex-shrink: 0;">
                <img src="${baseUrl}brasao_sp.png" style="width: 68px; height: auto; margin-bottom: 4px;">
                <div>www.policiamilitar.sp.gov.br</div>
                <div>cmmtecmec@policiamilitar.sp.gov.br</div>
            </div>
            <div style="flex: 1; text-align: center;">
                <div style="font-size: 14px; font-weight: bold;">SECRETARIA DA SEGURANÇA PÚBLICA</div>
                <div style="font-size: 14px; font-weight: bold;">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</div>
                <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">CENTRO DE MOTOMECANIZAÇÃO</div>
                <div style="font-size: 13px; font-weight: bold; text-decoration: underline;">PARECER TÉCNICO Nº ${numParecer}</div>
            </div>
            <div style="width: 120px; text-align: center; flex-shrink: 0;">
                <img src="${baseUrl}cmmlogo.png" style="width: 62px; height: auto;">
            </div>
        </div>
    `;

    // Item 1 — abertura
    html += pItem("1.", `Ao ${dataExtenso(hoje)}, na Cidade de São Paulo, na sede do Centro de Motomecanização da Polícia Militar do Estado de São Paulo, em conformidade com as I-15-PM, I-16-PM e com o Boletim Interno Nº ${BOLETIM_INTERNO_NOMEACAO}, reuniu-se a Comissão Técnica nomeada para elaborar o presente parecer.`);

    // Item 2 — DA MOTIVAÇÃO
    html += `<p style="margin: 16px 0 8px 0; text-align: center; font-weight: bold;">DA MOTIVAÇÃO</p>`;
    html += pItem("2.", `A solicitação tem o intento de subsidiar a ${procTipo} instaurada para apurar os motivos do sinistro envolvendo a viatura ${veiculoDesc}, conforme solicitado por meio do OFÍCIO Nº ${oficio}, referentes ao ${a.tipo_procedimento === 'IPM' ? 'IPM' : 'processo de sindicância'} nº ${procNum}.`);

    // ANÁLISE TÉCNICA — itens 3 em diante, com subitens X.1, X.2... criados
    // pelo operador, e fotos grandes e centralizadas com legenda automática
    // (sempre "Foto NN" sequencial, independente do nome do arquivo original).
    let itemAtual = 2;
    if (a.subdashEtapas && a.subdashEtapas.length > 0) {
        html += `<p style="margin: 16px 0 8px 0; text-align: center; font-weight: bold;">ANÁLISE TÉCNICA</p>`;
        a.subdashEtapas.forEach(etapa => {
            itemAtual++;
            html += pItem(`${itemAtual}.`, etapa.titulo || '');
            const subitens = (etapa.subitens && etapa.subitens.length > 0) ? etapa.subitens : [{ texto: etapa.texto || '', fotosSelecionadas: etapa.fotosSelecionadas || [] }];
            subitens.forEach((sub, si) => {
                if (sub.texto) {
                    html += pItem(`${itemAtual}.${si + 1}.`, sub.texto);
                }
                const fotos = (sub.fotosSelecionadas || []).map(n => (a.subdashFotosBulk || [])[n - 1]).filter(f => f && f.base64 && f.mimeType && f.mimeType.startsWith('image'));
                if (fotos.length > 0) {
                    html += `<div style="display:flex; justify-content:center; gap:16px; margin: 6px 0 16px 0; flex-wrap:wrap; page-break-inside: avoid; break-inside: avoid;">`;
                    fotos.forEach(f => {
                        fotoContador++;
                        html += `
                            <div style="text-align:center;">
                                <img src="${f.base64}" style="width:320px; max-width:100%; height:240px; object-fit:cover; border:1px solid #999;">
                                <div style="font-size:11px; font-weight:bold; margin-top:5px;">Foto ${String(fotoContador).padStart(2, '0')}</div>
                            </div>
                        `;
                    });
                    html += `</div>`;
                }
            });
        });
    }

    // Quesitos do solicitante
    if (a.perguntas && a.perguntas.length > 0) {
        itemAtual++;
        const itemQuesitos = itemAtual;
        html += pItem(`${itemQuesitos}.`, `Quanto aos quesitos apresentados no OFÍCIO Nº ${oficio}, referentes ao ${a.tipo_procedimento === 'IPM' ? 'IPM' : 'processo de sindicância'} nº ${procNum}, essa comissão passa a discorrer:`);
        a.perguntas.forEach((q, idx) => {
            const resp = (a.subdashQuesitosResp && a.subdashQuesitosResp[idx]) || 'N/A';
            html += pItem(`${itemQuesitos}.${idx + 1}.`, `<em>${q}</em><br>${resp}`);
        });
    }

    // Item final — conclusão + data + assinaturas + lema. Tudo dentro de UM
    // único bloco "page-break-inside: avoid", para as assinaturas nunca
    // ficarem separadas do nome/posto na quebra de página.
    const comissao = a.parecerDados?.comissao || a.parecer?.comissao || [];
    const membroTecnico = comissao.find(m => (m.papel || '').toUpperCase().includes('MEMBRO'));
    const auxiliares = comissao.filter(m => m !== membroTecnico);

    const blocoAssinatura = (m) => `
        <div style="text-align: center; min-width: 200px; page-break-inside: avoid; break-inside: avoid;">
            <hr style="border: 1px solid #000; margin: 0 0 6px 0;">
            <strong>${m.nome}</strong><br>
            <span>${m.postoGrad} ${m.papel}</span>
        </div>
    `;

    itemAtual++;
    html += `<div style="page-break-inside: avoid; break-inside: avoid;">`;
    html += pItem(`${itemAtual}.`, "Este é o Parecer.");
    html += `<p style="margin: 0 0 30px 0; text-align: right; font-size: 12px;">São Paulo, ${dataCurta(hoje)}.</p>`;

    if (comissao.length > 0) {
        if (membroTecnico) {
            html += `<div style="display:flex; justify-content:center; margin-top: 20px;">${blocoAssinatura(membroTecnico)}</div>`;
        }
        if (auxiliares.length > 0) {
            html += `<div style="display:flex; justify-content:space-around; flex-wrap:wrap; gap:20px; margin-top: 24px;">`;
            auxiliares.forEach(m => { html += blocoAssinatura(m); });
            html += `</div>`;
        }
    } else {
        html += `
            <div style="margin-top: 20px; text-align: center;">
                <hr style="width: 50%; border: 1px solid #000; margin: 0 auto 10px auto;">
                <strong>${a.parecerDados?.militar || 'COMISSÃO TÉCNICA'}</strong>
            </div>
        `;
    }

    // O lema oficial aparece só aqui, uma vez, abaixo das assinaturas — nas
    // demais páginas o rodapé (gerado pelo Puppeteer via footerTemplate) traz
    // apenas o número do parecer.
    html += `
        <p style="text-align: center; font-style: italic; font-size: 7px; margin: 40px 0 0 0;">
            Nós, Policiais Militares sob a proteção de Deus, estamos compromissados com a defesa da Vida, da Integridade Física e da Dignidade da Pessoa Humana.
        </p>
    `;
    html += `</div>`;

    return { html, numParecer };
}

export function gerarEPreverParecerPdf(a) {
    parecerAtual = a;
    const { html: miolo } = construirMioloParecer(a);

    const html = `
        <style>
            /* O CSS global do app força TUDO para caixa alta (text-transform:
               uppercase em *). O parecer é um documento oficial e precisa
               respeitar a caixa digitada — esta regra, mais específica
               (#id *), sobrepõe a global só dentro do preview do parecer. */
            #previewParecerContainer, #previewParecerContainer * { text-transform: none !important; }
        </style>
        <div style="width: 780px; max-width: 100%; padding: 25px; background: #ffffff; color: #000000; font-family: 'Times New Roman', Times, serif; box-sizing: border-box; margin: 0 auto; line-height: 1.5; font-size: 12px;">
            ${miolo}
        </div>
    `;

    const container = document.getElementById("previewParecerContainer");
    container.innerHTML = html;

    document.getElementById("modalPreviewParecer").style.display = "flex";
}

// Monta o documento HTML completo e independente (doctype próprio) mandado
// para a função Netlify — o Chrome headless não tem a página do app aberta,
// então esse HTML precisa trazer tudo que precisa (fonte, tamanho, cores).
function montarDocumentoParaPdf(a) {
    const { html: miolo } = construirMioloParecer(a);
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #ffffff; color: #000000; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12px; line-height: 1.5; }
    img { max-width: 100%; }
</style>
</head>
<body>
${miolo}
</body>
</html>`;
}

// Chama a função Netlify que roda o Chrome headless (Puppeteer) e devolve o
// PDF pronto em base64. Ver netlify/functions/gerar-pdf-parecer.js.
async function gerarPdfViaFuncaoNetlify(a) {
    const numParecer = a.parecerDados?.numParecer || 'S/N';
    const html = montarDocumentoParaPdf(a);

    const res = await fetch("/.netlify/functions/gerar-pdf-parecer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, numParecer })
    });

    if (!res.ok) {
        let detalhe = "";
        try { detalhe = (await res.json())?.error || ""; } catch (_e) { /* ignora */ }
        throw new Error(`Falha ao gerar PDF (${res.status}). ${detalhe}`);
    }

    const { pdfBase64 } = await res.json();
    if (!pdfBase64) throw new Error("A função de PDF não devolveu o arquivo.");
    return pdfBase64;
}

function base64ParaBlobPdf(base64) {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: "application/pdf" });
}

export async function baixarPdfPreviewParecer() {
    if (!parecerAtual) return;
    showToast("Gerando PDF...", "info");
    try {
        const pdfBase64 = await gerarPdfViaFuncaoNetlify(parecerAtual);
        const blob = base64ParaBlobPdf(pdfBase64);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Parecer_Tecnico_${parecerAtual.protocolo}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast("Parecer baixado!", "success");
    } catch (e) {
        console.error("Erro ao gerar PDF do parecer:", e);
        showToast("Não foi possível gerar o PDF do parecer.", "error");
    }
}

export async function finalizarEnviarEmailParecer() {
    if (!parecerAtual) return;
    showToast("Gerando anexo e enviando e-mail...", "info");

    let base64Pdf = "";
    try {
        const pdfBase64 = await gerarPdfViaFuncaoNetlify(parecerAtual);
        base64Pdf = `data:application/pdf;base64,${pdfBase64}`;
    } catch (e) {
        console.error("Erro gerando base64 do parecer", e);
        showToast("Não foi possível gerar o PDF do parecer.", "error");
    }

    parecerAtual.parecerPdfBase64 = base64Pdf;

    if (base64Pdf && parecerAtual.parecerId && parecerAtual.id) {
        try {
            await salvarPdfParecerSupabase(
                parecerAtual.parecerId,
                parecerAtual.id,
                base64Pdf,
                `Parecer_Tecnico_${parecerAtual.protocolo}.pdf`
            );
        } catch (e) {
            console.error("Erro ao salvar PDF do parecer no Supabase:", e);
            showToast("Parecer emitido, mas houve falha ao salvar o PDF no Supabase.", "warning");
        }
    }

    document.getElementById("modalPreviewParecer").style.display = "none";
    voltarAoPainelGestorFromSubdashboard();
    showToast(`PARECER TÉCNICO OFICIAL EMITIDO! Viatura PRONTA.`, "success");

    if (window.dispararEnvioEmailNotificacaoWrapper) {
        window.dispararEnvioEmailNotificacaoWrapper(parecerAtual.protocolo, base64Pdf);
    }
}

export async function dispararEnvioEmailNotificacaoWrapper(protocolo, parecerBase64) {
     const a = state.agendamentos.find(item => item.protocolo === protocolo || String(item.numSolicitacao).padStart(3, '0') === protocolo);
     if (!a) return;

     let payload = Object.assign({}, a);
     if (parecerBase64) {
         payload.parecerPdfBase64 = parecerBase64;
     }
     payload.action = "ENVIAR_EMAIL";

     try {
         const res = await fetch(CONFIG.API_URL, {
             method: "POST",
             headers: { "Content-Type": "text/plain;charset=utf-8" },
             body: JSON.stringify({ action: "ENVIAR_EMAIL", emailDestino: a.email, data: payload, docsBase64: {} })
         });
         const json = await res.json();
         if (json.status === "SUCCESS") {
             showToast("E-mail com Parecer enviado com sucesso!", "success");
         } else {
             showToast("Erro ao enviar e-mail: " + json.message, "error");
         }
     } catch(e) {
         showToast("Erro na requisição de e-mail.", "error");
     }
}
