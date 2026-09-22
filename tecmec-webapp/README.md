# TECMEC — CMM PMESP

Sistema de Agendamento de Análise Técnica do Centro de Motomecanização.
Reescrita modular do `22_tecmec/index.html` original, com os mesmos recursos e as
correções já aplicadas (PDF do parecer, e-mail, upload ao Drive, lista de OPMs).

## Estrutura

```
index.html              esqueleto HTML (telas e modais) — sem CSS/JS inline
src/style.css            todo o CSS
src/state.js              CONFIG + estado global da aplicação
src/storage.js             localStorage (persistência local dos agendamentos)
src/utils.js                showToast()
src/navigation.js       navegação entre telas/portais e modais de acesso
src/wizard.js              assistente de 5 etapas do solicitante
src/operador.js           painel do gestor / tabela de solicitações
src/folhaPainel.js         folha de painel A4 (download em PDF)
src/email.js                modal de notificação por e-mail
src/api.js                   chamadas ao Google Apps Script (Drive, testes)
src/parecerSubdashboard.js sub-dashboard de emissão do parecer técnico
src/parecerPdf.js            geração/preview/download/envio do PDF do parecer
src/main.js                 ponto de entrada: importa tudo e liga aos onclick do HTML
public/                     imagens e frota_data.js (base SIPL/OPMs)
gas/google_apps_script_agendamento.js   código do backend (Google Apps Script)
```

Cada arquivo cuida de **um** pedaço do sistema. Para corrigir algo específico
(ex.: "o e-mail não está indo"), normalmente só um desses arquivos precisa mudar.

## Rodar localmente

```
npm install
npm run dev       # http://localhost:5173
```

## Build de produção

```
npm run build      # gera a pasta dist/
npm run preview    # testa o build localmente
```

## Deploy

- **GitHub**: suba esta pasta inteira como repositório.
- **Netlify**: conecte o repositório. O `netlify.toml` já define:
  - comando de build: `npm run build`
  - pasta publicada: `dist`

## Backend (Google Apps Script)

O arquivo `gas/google_apps_script_agendamento.js` **não** faz parte do build do
Netlify — ele é colado manualmente no editor do Google Apps Script (apps
Script vinculado à planilha/Drive do CMM).

Depois de qualquer alteração nesse arquivo:
1. Cole o conteúdo atualizado no editor do Apps Script.
2. **Implantar → Gerenciar implantações → editar (lápis) → Nova versão → Implantar.**
   (Só salvar não é suficiente — sem uma nova implantação a versão publicada
   continua sendo a antiga. Isso explica boa parte das correções "que não
   pegaram" nas sessões anteriores.)
3. Se a URL do Web App mudar, atualize `API_URL` em `src/state.js`.

### Remetente do e-mail (cmmrecepcao01@gmail.com)

Para os e-mails saírem de `cmmrecepcao01@gmail.com`, o Apps Script precisa
estar implantado por essa conta Google, **ou** essa conta precisa estar
configurada como um alias "Enviar e-mail como" na conta Gmail que efetivamente
executa o script (Gmail → Configurações → Contas). Isso é configuração do
Google, não do código.

## O que foi removido nesta reescrita

Dois modais estavam mortos no código original (nada os abria, e alguns de
seus botões chamavam funções que nem existiam): o modal antigo de "Fazer
Parecer" de campo único (`modalParecerTecnico`) e o modal de "Identificar
Operador" (`modalIdentificarOperadorParecer`). Foram removidos — o fluxo real
de emissão de parecer é o sub-dashboard completo (`abrirParecerSubdashboard`).
