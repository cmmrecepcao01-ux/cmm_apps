// Função Netlify (roda como AWS Lambda em produção) que recebe o HTML já
// pronto do parecer técnico e devolve um PDF de verdade, gerado por um Chrome
// headless (Puppeteer) — não é mais uma "foto" da tela (html2canvas): é a
// própria função de impressão do Chrome, então paginação, fotos e nitidez
// saem corretas de forma nativa.
//
// Dois Chromiums diferentes, dependendo de onde a função está rodando:
// - Em produção (Netlify/Lambda, Linux): @sparticuz/chromium + puppeteer-core
//   — binário do Chromium compilado especificamente para esse Linux.
// - Rodando local (`netlify dev`, Windows/Mac): esse mesmo binário NÃO
//   funciona (é só para Linux de servidor) — usamos o pacote "puppeteer"
//   completo, que baixa um Chromium de verdade para o sistema operacional
//   local no `npm install`.
// O Netlify CLI seta NETLIFY_DEV=true quando roda `netlify dev` — é assim
// que a função sabe qual dos dois usar.
const RODANDO_LOCAL = process.env.NETLIFY_DEV === "true" || process.env.CONTEXT === "dev";

async function abrirNavegador() {
    if (RODANDO_LOCAL) {
        const puppeteerCompleto = require("puppeteer");
        return puppeteerCompleto.launch({ headless: true });
    }
    const path = require("path");
    const chromium = require("@sparticuz/chromium");
    const puppeteer = require("puppeteer-core");

    const executablePath = await chromium.executablePath();

    // Erro conhecido do Node 22 em ambientes Lambda/serverless (Netlify,
    // Vercel etc.) com @sparticuz/chromium: o binário do Chrome não acha
    // as próprias bibliotecas (.so) que vêm junto dele, porque a pasta
    // onde elas ficam não está no caminho de busca do sistema — dá erro
    // "libnspr4.so: cannot open shared object file". Setar o
    // LD_LIBRARY_PATH pra pasta do próprio executável resolve, porque é
    // ali que essas bibliotecas ficam extraídas junto com o Chrome.
    process.env.LD_LIBRARY_PATH = path.dirname(executablePath);

    // Evita travamentos relacionados a aceleração gráfica em ambiente
    // serverless (sem GPU de verdade) — só chama se a função existir
    // nessa versão do pacote.
    if (typeof chromium.setGraphicsMode === "function") {
        try { chromium.setGraphicsMode(false); } catch (_e) { /* ignora */ }
    } else if ("graphicsMode" in chromium) {
        try { chromium.graphicsMode = false; } catch (_e) { /* ignora */ }
    }

    return puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless
    });
}

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: JSON.stringify({ error: "Método não permitido." }) };
    }

    let corpo;
    try {
        corpo = JSON.parse(event.body || "{}");
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido." }) };
    }

    const { html, numParecer } = corpo;
    if (!html) {
        return { statusCode: 400, body: JSON.stringify({ error: "HTML do parecer não informado." }) };
    }

    let browser;
    try {
        browser = await abrirNavegador();

        const page = await browser.newPage();
        // "networkidle0" espera as imagens (brasões + fotos do Supabase, que
        // vêm de URL assinada) terminarem de carregar antes de gerar o PDF —
        // era exatamente essa espera que, no html2canvas antigo, precisava
        // ser feita manualmente e mesmo assim falhava às vezes.
        await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });

        const numeroSeguro = String(numParecer || "S/N").replace(/[<>&]/g, "");
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "14mm", bottom: "18mm", left: "12mm", right: "12mm" },
            displayHeaderFooter: true,
            headerTemplate: "<span></span>",
            // Rodapé oficial em todas as páginas — só o número do parecer,
            // 7px, sem caixa alta (o lema aparece uma única vez, no corpo,
            // abaixo das assinaturas — já embutido no HTML recebido).
            footerTemplate: `
                <div style="width:100%; font-size:7px; text-align:center; color:#3c3c3c; font-family: 'Times New Roman', Times, serif;">
                    PARECER TÉCNICO Nº ${numeroSeguro}
                </div>
            `
        });

        await browser.close();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdfBase64: pdfBuffer.toString("base64") })
        };
    } catch (e) {
        if (browser) { try { await browser.close(); } catch (_e) { /* ignora */ } }
        console.error("Erro ao gerar PDF do parecer:", e);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Falha ao gerar o PDF do parecer.", detalhe: String(e && e.message || e) })
        };
    }
};
