// ============================================================================
// Geração do PDF do Parecer Técnico 100% CLIENT-SIDE E VETORIAL, com jsPDF.
//
// Por quê: window.print() (impressão nativa do navegador) delega a criação
// do PDF pro Chrome, e o Chrome desenha por cima um cabeçalho/rodapé próprio
// (URL, data/hora, "n/total") que NENHUM CSS da página consegue desligar —
// só o operador desmarcando manualmente a caixinha "Cabeçalhos e rodapés" na
// caixa de diálogo de impressão, em cada computador. Pra não depender disso
// (o sistema roda em várias máquinas diferentes), este módulo monta o PDF
// diretamente em vetor (texto real, não é print nem captura de tela) — sem
// abrir nenhuma caixa de diálogo do navegador, sem servidor, sem Puppeteer.
//
// O conteúdo/estrutura aqui replica fielmente o que construirMioloParecer()
// (em parecerPdf.js) monta em HTML pro preview em tela — só que desenhado
// diretamente em milímetros na página, com quebra de linha, recuo de 1ª
// linha (2cm, igual ao "text-indent" do CSS original) e justificação
// calculados manualmente, já que aqui não tem motor de layout de navegador
// pra fazer isso sozinho.
// ============================================================================
import { jsPDF } from "jspdf";
import { BOLETIM_INTERNO_NOMEACAO, dataExtenso, dataCurta } from "./parecerPdf.js";

const PAGE_W = 210, PAGE_H = 297;
const MARGIN_TOP = 14, MARGIN_BOTTOM = 18, MARGIN_LEFT = 12, MARGIN_RIGHT = 12;
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;
const CONTENT_RIGHT_X = PAGE_W - MARGIN_RIGHT;

const FONTE_CORPO = 10.5;
const ALTURA_LINHA = 5;
const RECUO_1A_LINHA = 20; // mm — igual ao text-indent: 2cm do HTML original

// ---------------------------------------------------------------------------
// Imagens: carregar um <img> e recortar tipo "object-fit: cover" num canvas
// (a moldura da foto no preview em tela é fixa e recorta a imagem original;
// se só esticássemos com addImage() direto, a foto ficaria deformada).
// ---------------------------------------------------------------------------
function carregarImagem(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function imagemCover(src, larguraMm, alturaMm) {
    const img = await carregarImagem(src);
    const PX_POR_MM = 8; // ~200dpi — boa qualidade de impressão sem pesar o PDF
    const outW = Math.max(1, Math.round(larguraMm * PX_POR_MM));
    const outH = Math.max(1, Math.round(alturaMm * PX_POR_MM));
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    const srcRatio = img.naturalWidth / img.naturalHeight;
    const dstRatio = outW / outH;
    let sx, sy, sw, sh;
    if (srcRatio > dstRatio) {
        sh = img.naturalHeight;
        sw = sh * dstRatio;
        sx = (img.naturalWidth - sw) / 2;
        sy = 0;
    } else {
        sw = img.naturalWidth;
        sh = sw / dstRatio;
        sx = 0;
        sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    return canvas.toDataURL("image/jpeg", 0.88);
}

// Lê o formato direto do cabeçalho do data URL (ex.: "data:image/png;base64,"
// -> "PNG") pro modo simples de fallback, quando o recorte "cover" falha.
function formatoDataUrl(dataUrl) {
    const m = /^data:image\/(\w+);base64,/i.exec(String(dataUrl || ""));
    if (!m) return "JPEG";
    const tipo = m[1].toLowerCase();
    return tipo === "jpg" ? "JPEG" : tipo.toUpperCase();
}

// ---------------------------------------------------------------------------
// Paginação manual — antes de desenhar qualquer bloco, garante que ele cabe
// no que sobrou da página; senão, pula pra próxima.
// ---------------------------------------------------------------------------
function novoCursor() {
    return { y: MARGIN_TOP };
}

function garantirEspaco(doc, cursor, alturaNecessaria) {
    if (cursor.y + alturaNecessaria > PAGE_H - MARGIN_BOTTOM) {
        doc.addPage();
        cursor.y = MARGIN_TOP;
    }
}

// ---------------------------------------------------------------------------
// Parágrafo numerado (item "3." ou subitem "3.1."), com rótulo em negrito,
// recuo de 2cm só na 1ª linha e justificação nas linhas do meio (a última
// linha do parágrafo NUNCA é justificada, senão fica esticada/feia).
// ---------------------------------------------------------------------------
function paragrafoItem(doc, cursor, label, texto, opts = {}) {
    const { italic = false, indent = RECUO_1A_LINHA } = opts;
    const textoLimpo = String(texto || "").replace(/\s+/g, " ").trim();

    doc.setFontSize(FONTE_CORPO);
    doc.setFont("times", "bold");
    const rotulo = label ? label + " " : "";
    const larguraRotulo = rotulo ? doc.getTextWidth(rotulo) : 0;
    doc.setFont("times", italic ? "italic" : "normal");

    const larguraPrimeira = Math.max(20, CONTENT_W - indent - larguraRotulo);
    const larguraDemais = CONTENT_W;

    const palavras = textoLimpo.split(" ").filter(Boolean);
    const linhas = [];
    let atual = "";
    let primeira = true;
    palavras.forEach(p => {
        const largura = primeira ? larguraPrimeira : larguraDemais;
        const teste = atual ? atual + " " + p : p;
        if (doc.getTextWidth(teste) > largura && atual) {
            linhas.push(atual);
            atual = p;
            primeira = false;
        } else {
            atual = teste;
        }
    });
    linhas.push(atual);
    const totalLinhas = linhas.length;

    garantirEspaco(doc, cursor, totalLinhas * ALTURA_LINHA + 3);

    linhas.forEach((linha, i) => {
        const ehPrimeira = i === 0;
        const ehUltima = i === totalLinhas - 1;
        const x = MARGIN_LEFT + (ehPrimeira ? indent : 0);
        const largura = ehPrimeira ? larguraPrimeira : larguraDemais;

        doc.setFont("times", italic ? "italic" : "normal");
        let xTexto = x;
        if (ehPrimeira && rotulo) {
            doc.setFont("times", "bold");
            doc.text(rotulo, x, cursor.y);
            doc.setFont("times", italic ? "italic" : "normal");
            xTexto = x + larguraRotulo;
        }
        if (!ehUltima) {
            desenharLinhaJustificada(doc, linha, xTexto, cursor.y, largura - (xTexto - x));
        } else {
            doc.text(linha, xTexto, cursor.y);
        }
        cursor.y += ALTURA_LINHA;
    });
    cursor.y += 3;
}

// Justificação MANUAL, linha a linha (nunca delega pro align:"justify" +
// maxWidth do próprio jsPDF — testado na prática, o motor interno dele
// re-quebra a linha perto do limite de largura em casos de borda e acaba
// empilhando duas linhas no mesmo lugar, corrompendo o texto). Aqui a gente
// mesmo calcula a largura de cada palavra e distribui o espaço sobrando
// igualmente entre elas.
function desenharLinhaJustificada(doc, linha, x, y, larguraAlvo) {
    const palavras = linha.split(" ").filter(Boolean);
    if (palavras.length <= 1) {
        doc.text(linha, x, y);
        return;
    }
    const larguraPalavras = palavras.reduce((soma, p) => soma + doc.getTextWidth(p), 0);
    const espacoNormal = doc.getTextWidth(" ");
    const gaps = palavras.length - 1;
    const sobra = larguraAlvo - larguraPalavras - espacoNormal * gaps;
    const espacoExtra = Math.max(0, sobra / gaps);
    let cx = x;
    palavras.forEach((p, i) => {
        doc.text(p, cx, y);
        cx += doc.getTextWidth(p) + espacoNormal + espacoExtra;
    });
}

function quebrarLinhasSimples(doc, texto, largura) {
    const palavras = String(texto).replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    const linhas = [];
    let atual = "";
    palavras.forEach(p => {
        const teste = atual ? atual + " " + p : p;
        if (doc.getTextWidth(teste) > largura && atual) {
            linhas.push(atual);
            atual = p;
        } else {
            atual = teste;
        }
    });
    if (atual) linhas.push(atual);
    return linhas.length ? linhas : [""];
}

function tituloSecao(doc, cursor, texto) {
    garantirEspaco(doc, cursor, 12);
    cursor.y += 3;
    doc.setFont("times", "bold");
    doc.setFontSize(FONTE_CORPO);
    doc.text(texto, PAGE_W / 2, cursor.y, { align: "center" });
    cursor.y += ALTURA_LINHA + 3;
}

// ---------------------------------------------------------------------------
// Cabeçalho oficial (brasões + títulos), desenhado uma única vez no topo.
// ---------------------------------------------------------------------------
async function desenharCabecalho(doc, cursor, numParecer, baseUrl) {
    const alturaBloco = 34;
    garantirEspaco(doc, cursor, alturaBloco);
    const yTopo = cursor.y;

    try {
        const brasaoSp = await carregarImagem(baseUrl + "brasao_sp.png");
        const wSp = 18, hSp = wSp * (brasaoSp.naturalHeight / brasaoSp.naturalWidth);
        doc.addImage(brasaoSp, "PNG", MARGIN_LEFT + 2, yTopo, wSp, hSp);
    } catch (e) { console.warn("Não foi possível carregar brasao_sp.png no PDF:", e); }

    try {
        const logoCmm = await carregarImagem(baseUrl + "cmmlogo.png");
        const wCmm = 16, hCmm = wCmm * (logoCmm.naturalHeight / logoCmm.naturalWidth);
        doc.addImage(logoCmm, "PNG", CONTENT_RIGHT_X - wCmm - 2, yTopo, wCmm, hCmm);
    } catch (e) { console.warn("Não foi possível carregar cmmlogo.png no PDF:", e); }

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("SECRETARIA DA SEGURANÇA PÚBLICA", PAGE_W / 2, yTopo + 5, { align: "center" });
    doc.text("POLÍCIA MILITAR DO ESTADO DE SÃO PAULO", PAGE_W / 2, yTopo + 10.5, { align: "center" });
    doc.setFontSize(10.5);
    doc.text("CENTRO DE MOTOMECANIZAÇÃO", PAGE_W / 2, yTopo + 16, { align: "center" });

    doc.setFontSize(11);
    const tituloParecer = `PARECER TÉCNICO Nº ${numParecer}`;
    doc.text(tituloParecer, PAGE_W / 2, yTopo + 23, { align: "center" });
    const largTitulo = doc.getTextWidth(tituloParecer);
    doc.setLineWidth(0.25);
    doc.line(PAGE_W / 2 - largTitulo / 2, yTopo + 24, PAGE_W / 2 + largTitulo / 2, yTopo + 24);

    doc.setLineWidth(0.5);
    doc.line(MARGIN_LEFT, yTopo + alturaBloco - 3, CONTENT_RIGHT_X, yTopo + alturaBloco - 3);

    cursor.y = yTopo + alturaBloco;
}

// ---------------------------------------------------------------------------
// Grade de fotos (2 por linha, recortadas tipo "cover", com legenda "Foto NN"
// sequencial — igual ao preview em tela).
// ---------------------------------------------------------------------------
async function desenharFotos(doc, cursor, fotos, contadorFoto) {
    if (!fotos.length) return;
    const gap = 6;
    const porLinha = 2;
    const imgW = (CONTENT_W - gap * (porLinha - 1)) / porLinha;
    const imgH = imgW * (240 / 320);

    for (let i = 0; i < fotos.length; i += porLinha) {
        const linha = fotos.slice(i, i + porLinha);
        garantirEspaco(doc, cursor, imgH + 9);
        const larguraLinha = linha.length * imgW + (linha.length - 1) * gap;
        let x = MARGIN_LEFT + (CONTENT_W - larguraLinha) / 2;
        for (const foto of linha) {
            contadorFoto.n++;
            let desenhada = false;
            try {
                const dataUrl = await imagemCover(foto.base64, imgW, imgH);
                doc.addImage(dataUrl, "JPEG", x, cursor.y, imgW, imgH);
                desenhada = true;
            } catch (e) {
                console.error(`Foto ${contadorFoto.n}: falha ao recortar (cover) — tentando modo simples.`, e);
            }
            // Modo simples de fallback: manda a imagem original direto pro
            // jsPDF, sem passar pelo canvas de recorte. Pode ficar levemente
            // esticada (sem o efeito "cover"), mas garante que a foto
            // apareça em vez de deixar o quadro em branco.
            if (!desenhada) {
                try {
                    doc.addImage(foto.base64, formatoDataUrl(foto.base64), x, cursor.y, imgW, imgH);
                    desenhada = true;
                } catch (e2) {
                    console.error(`Foto ${contadorFoto.n}: falha também no modo simples — foto ficará em branco no PDF.`, e2);
                }
            }
            doc.setDrawColor(150);
            doc.setLineWidth(0.2);
            doc.rect(x, cursor.y, imgW, imgH);
            doc.setFont("times", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(0);
            doc.text(`Foto ${String(contadorFoto.n).padStart(2, "0")}`, x + imgW / 2, cursor.y + imgH + 4.5, { align: "center" });
            x += imgW + gap;
        }
        cursor.y += imgH + 9;
    }
    cursor.y += 2;
}

// ---------------------------------------------------------------------------
// Bloco de assinatura: linha + nome em negrito + posto/graduação e papel.
// ---------------------------------------------------------------------------
function desenharAssinatura(doc, x, y, largura, nome, cargo) {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(x, y, x + largura, y);
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text(nome || "", x + largura / 2, y + 5, { align: "center", maxWidth: largura });
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.text(cargo || "", x + largura / 2, y + 9.5, { align: "center", maxWidth: largura });
}

function desenharConclusaoEAssinaturas(doc, cursor, itemAtual, comissao, militarFallback, dataCurtaTxt) {
    const membroTecnico = comissao.find(m => (m.papel || "").toUpperCase().includes("MEMBRO"));
    const auxiliares = comissao.filter(m => m !== membroTecnico);
    const linhasAux = auxiliares.length > 0 ? Math.ceil(Math.min(auxiliares.length, 2) > 0 ? auxiliares.length / 2 : 0) : 0;
    const alturaEstimativa = 30 + (membroTecnico ? 16 : 0) + linhasAux * 16 + 20;
    garantirEspaco(doc, cursor, Math.min(alturaEstimativa, PAGE_H - MARGIN_TOP - MARGIN_BOTTOM));

    paragrafoItem(doc, cursor, `${itemAtual}.`, "Este é o Parecer.");

    doc.setFont("times", "normal");
    doc.setFontSize(FONTE_CORPO);
    doc.text(`São Paulo, ${dataCurtaTxt}.`, CONTENT_RIGHT_X, cursor.y + 4, { align: "right" });
    cursor.y += 16;

    if (comissao.length > 0) {
        if (membroTecnico) {
            desenharAssinatura(doc, PAGE_W / 2 - 40, cursor.y, 80, membroTecnico.nome, `${membroTecnico.postoGrad || ""} ${membroTecnico.papel || ""}`.trim());
            cursor.y += 24;
        }
        if (auxiliares.length > 0) {
            const cols = Math.min(2, auxiliares.length);
            const gap = 10;
            const largAux = (CONTENT_W - gap * (cols - 1)) / cols;
            let linhaY = cursor.y;
            auxiliares.forEach((m, i) => {
                const col = i % cols;
                if (col === 0 && i > 0) linhaY += 16;
                const x = MARGIN_LEFT + col * (largAux + gap);
                desenharAssinatura(doc, x, linhaY, largAux, m.nome, `${m.postoGrad || ""} ${m.papel || ""}`.trim());
            });
            cursor.y = linhaY + 16;
        }
    } else {
        desenharAssinatura(doc, PAGE_W / 2 - 40, cursor.y, 80, militarFallback || "COMISSÃO TÉCNICA", "");
        cursor.y += 16;
    }

    cursor.y += 8;
    doc.setFont("times", "italic");
    doc.setFontSize(7);
    const lema = "Nós, Policiais Militares sob a proteção de Deus, estamos compromissados com a defesa da Vida, da Integridade Física e da Dignidade da Pessoa Humana.";
    quebrarLinhasSimples(doc, lema, CONTENT_W).forEach(l => {
        doc.text(l, PAGE_W / 2, cursor.y, { align: "center" });
        cursor.y += 3.3;
    });
}

// ---------------------------------------------------------------------------
// Monta o documento inteiro a partir dos dados do agendamento/parecer — a
// MESMA fonte de dados usada em construirMioloParecer() (parecerPdf.js), só
// que desenhada em vetor em vez de virar HTML.
// ---------------------------------------------------------------------------
export async function montarDocumentoParecer(a) {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const numParecer = a.parecerDados?.numParecer || "S/N";
    doc.setProperties({ title: `Parecer Técnico Nº ${numParecer}` });

    const cursor = novoCursor();
    const hoje = new Date();
    const oficio = a.numeroOficio || "S/Nº";
    const procNum = a.sindicancia_ipm || "S/Nº";
    const ehIPM = a.tipo_procedimento === "IPM";
    const procTipo = ehIPM ? "IPM" : "sindicância";
    const veiculoDesc = `${a.modelo || ""}, ano ${a.ano || ""}, VIN ${a.chassi || ""}, placas ${a.placa || ""}, prefixo ${a.prefixo || ""}, patrimônio ${a.patrimonio || ""}`.replace(/\s+/g, " ").trim();
    const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, "");

    await desenharCabecalho(doc, cursor, numParecer, baseUrl);
    cursor.y += 5; // respiro entre a barra do cabeçalho e o item "1."

    paragrafoItem(doc, cursor, "1.", `Ao ${dataExtenso(hoje)}, na Cidade de São Paulo, na sede do Centro de Motomecanização da Polícia Militar do Estado de São Paulo, em conformidade com as I-15-PM, I-16-PM e com o Boletim Interno Nº ${BOLETIM_INTERNO_NOMEACAO}, reuniu-se a Comissão Técnica nomeada para elaborar o presente parecer.`);

    tituloSecao(doc, cursor, "DA MOTIVAÇÃO");
    paragrafoItem(doc, cursor, "2.", `A solicitação tem o intento de subsidiar a ${procTipo} instaurada para apurar os motivos do sinistro envolvendo a viatura ${veiculoDesc}, conforme solicitado por meio do OFÍCIO Nº ${oficio}, referentes ao ${ehIPM ? "IPM" : "processo de sindicância"} nº ${procNum}.`);

    let itemAtual = 2;
    const contadorFoto = { n: 0 };

    if (a.subdashEtapas && a.subdashEtapas.length > 0) {
        tituloSecao(doc, cursor, "ANÁLISE TÉCNICA");
        for (const etapa of a.subdashEtapas) {
            itemAtual++;
            paragrafoItem(doc, cursor, `${itemAtual}.`, etapa.titulo || "");
            const subitens = (etapa.subitens && etapa.subitens.length > 0)
                ? etapa.subitens
                : [{ texto: etapa.texto || "", fotosSelecionadas: etapa.fotosSelecionadas || [] }];
            let si = 0;
            for (const sub of subitens) {
                si++;
                if (sub.texto) {
                    paragrafoItem(doc, cursor, `${itemAtual}.${si}.`, sub.texto);
                }
                const fotos = (sub.fotosSelecionadas || [])
                    .map(n => (a.subdashFotosBulk || [])[n - 1])
                    .filter(f => f && f.base64 && f.mimeType && f.mimeType.startsWith("image"));
                if (fotos.length > 0) {
                    await desenharFotos(doc, cursor, fotos, contadorFoto);
                }
            }
        }
    }

    if (a.perguntas && a.perguntas.length > 0) {
        itemAtual++;
        const itemQuesitos = itemAtual;
        paragrafoItem(doc, cursor, `${itemQuesitos}.`, `Quanto aos quesitos apresentados no OFÍCIO Nº ${oficio}, referentes ao ${ehIPM ? "IPM" : "processo de sindicância"} nº ${procNum}, essa comissão passa a discorrer:`);
        a.perguntas.forEach((q, idx) => {
            const resp = (a.subdashQuesitosResp && a.subdashQuesitosResp[idx]) || "N/A";
            paragrafoItem(doc, cursor, `${itemQuesitos}.${idx + 1}.`, q, { italic: true });
            paragrafoItem(doc, cursor, "", resp, { indent: 0 });
        });
    }

    itemAtual++;
    const comissao = a.parecerDados?.comissao || a.parecer?.comissao || [];
    desenharConclusaoEAssinaturas(doc, cursor, itemAtual, comissao, a.parecerDados?.militar, dataCurta(hoje));

    return doc;
}

function nomeArquivoParecer(a) {
    const num = String(a.parecerDados?.numParecer || "parecer").replace(/[\/\\?%*:|"<>]/g, "-");
    const placa = String(a.placa || "").replace(/[^A-Za-z0-9]/g, "");
    return `Parecer_Tecnico_${num}${placa ? "_" + placa : ""}.pdf`;
}

// Gera e já dispara o download no navegador (sem abrir caixa de diálogo
// nenhuma — é isso que substitui o window.print() antigo).
export async function baixarPdfParecerVetorial(a) {
    const doc = await montarDocumentoParecer(a);
    doc.save(nomeArquivoParecer(a));
}

// Gera e devolve o PDF como base64 (sem baixar) — usado quando o parecer
// precisa ir anexado ao e-mail de notificação.
export async function gerarPdfParecerBase64(a) {
    const doc = await montarDocumentoParecer(a);
    return doc.output("datauristring").split(",")[1];
}
