# Backup — geração de PDF via Puppeteer (Netlify Function)

Data: 22/09/2026

Esta pasta guarda a última versão funcional (localmente, via `netlify dev`)
da tentativa de gerar o PDF do parecer técnico rodando um Chrome headless
(Puppeteer) dentro de uma função serverless do Netlify.

## Por que foi abandonada

Em produção (ambiente real de Functions do Netlify), o Chromium empacotado
pelo `@sparticuz/chromium` não conseguia iniciar por falta de bibliotecas de
sistema (`libnspr4.so`, depois `libnss3.so`) — um problema de compatibilidade
conhecido e sem solução confiável documentada, mesmo após:
- corrigir o bundling do esbuild (`external_node_modules`)
- setar `LD_LIBRARY_PATH` manualmente no código
- trocar a variável de ambiente `AWS_LAMBDA_JS_RUNTIME`
- testar duas versões diferentes do `@sparticuz/chromium` (121 e 131)

Funcionava perfeitamente local (`netlify dev`, que usa o Chromium completo
do Windows via `puppeteer` normal), mas nunca funcionou no site publicado.

## O que substituiu

Impressão nativa do navegador (`window.print()` + CSS `@media print` no
`index.html`) — o mesmo esquema usado com sucesso no projeto irmão
`21_manut_escala`. Sem servidor, sem função, sem binário de Chromium.

## Arquivos aqui guardados

- `gerar-pdf-parecer.js.bak` — a função Netlify (Chrome headless) na última
  versão testada.
- `parecerPdf.js.bak` — o módulo do front-end que chamava essa função e
  montava o HTML enviado a ela.

## Como reverter, se um dia quiser tentar de novo

1. Copiar `parecerPdf.js.bak` de volta para `src/parecerPdf.js`.
2. Copiar `gerar-pdf-parecer.js.bak` de volta para
   `netlify/functions/gerar-pdf-parecer.js` (e para a cópia da raiz do
   repositório, `cmm_app/netlify/functions/gerar-pdf-parecer.js`).
3. Reinstalar as dependências no `package.json` (raiz do repo e desta
   pasta): `@sparticuz/chromium`, `puppeteer-core` (produção) e `puppeteer`
   (dev).
4. Conferir se o `netlify.toml` da raiz do repo ainda tem a seção
   `[functions]` com `included_files` e `external_node_modules` cobrindo
   esses três pacotes.
