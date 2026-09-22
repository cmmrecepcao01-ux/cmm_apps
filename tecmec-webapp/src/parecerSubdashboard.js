// Módulo gerado a partir do index.html original do TECMEC (CMM PMESP).
// Extraído automaticamente preservando o código original função por função.
import { state } from "./state.js";
import { showToast } from "./utils.js";
import { atualizarTabelaGestaoOperador } from "./operador.js";
import { gerarEPreverParecerPdf } from "./parecerPdf.js";
import { salvarStorage } from "./storage.js";
import { salvarParecerSupabase, salvarRespostasQuesitosSupabase, buscarFotosParecerSupabase } from "./api.js";

const POSTOS_GRAD_COMISSAO = ["CEL PM", "TEN CEL PM", "MAJ PM", "CAP PM", "1º TEN PM", "2º TEN PM", "SUBTEN PM", "1º SGT PM", "2º SGT PM", "3º SGT PM", "CB PM", "SD PM"];
const PAPEIS_COMISSAO = ["MEMBRO TÉCNICO", "AUXILIAR TÉCNICO"];

// Os RÓTULOS dos botões ficam em caixa alta (é só a etiqueta do botão, segue
// o padrão visual do painel). O TEXTO inserido no parecer fica em caixa
// normal — é o que vai para o PDF/Word, e o relatório não pode sair em
// caixa alta.
const FRASES_PRESET = [
    { label: "⚡ FREIOS REGULARES", texto: "Sistema de freios em condição regular, sem anomalias ou vazamentos." },
    { label: "⚡ SCANNER OK", texto: "Varredura eletrônica com scanner Rasther III S não apontou defeitos no motor." },
    { label: "⚡ FALHAS ABS/CAN", texto: "Falhas eletrônicas detectadas ligadas ao assistente de ponto cego e frenagem automática." },
    { label: "⚡ SEM TESTE DINÂMICO", texto: "Não foi possível realizar teste dinâmico e/ou estático devido às avarias no veículo." },
    { label: "⚡ SEM R.I.V.", texto: "Não foi apresentado o Registro Individual de Viatura (R.I.V.)." }
];

let debounceProgressoLocal = null;

export async function abrirParecerSubdashboard(protocolo) {
            const a = state.agendamentos.find(item => item.protocolo === protocolo || String(item.numSolicitacao).padStart(3, '0') === protocolo) || state.agendamentos[0];
            if (!a) return;

            state.subdashProtocolo = a.protocolo || String(a.numSolicitacao).padStart(3, '0');

            // Fotos do bulk: se já estão neste objeto (mesma aba, sem recarregar a
            // página) usa direto; senão, se este parecer já foi salvo antes, busca
            // as fotos de volta do Storage — SEM ISSO as fotos "somem" ao atualizar
            // a página, mesmo já tendo sido enviadas com sucesso.
            if (a.subdashFotosBulk && a.subdashFotosBulk.length > 0) {
                state.subdashFotosBulk = a.subdashFotosBulk;
            } else if (a.parecerId) {
                state.subdashFotosBulk = [];
                try {
                    state.subdashFotosBulk = await buscarFotosParecerSupabase(a.parecerId);
                    a.subdashFotosBulk = state.subdashFotosBulk;
                } catch (e) {
                    console.error("Erro ao recarregar fotos já salvas do parecer:", e);
                    showToast("Não foi possível recarregar as fotos já salvas deste parecer.", "warning");
                }
            } else {
                state.subdashFotosBulk = [];
            }

            document.getElementById("viewPortalCapa").style.display = "none";
            document.getElementById("viewSolicitante").style.display = "none";
            document.getElementById("viewOperador").style.display = "none";
            document.getElementById("viewParecerSubdashboard").style.display = "block";
            window.scrollTo({ top: 0, behavior: 'smooth' });

            const solicNum = String(a.numSolicitacao || '001').padStart(3, '0');
            document.getElementById("subdashSolicNum").textContent = solicNum;
            document.getElementById("subdashOpm").textContent = a.opm || "CMM";
            document.getElementById("subdashPlaca").textContent = a.placa || "N/I";
            document.getElementById("subdashPrefixoModelo").textContent = `${a.prefixo || 'S/N'} (${a.modelo || 'N/I'})`;
            document.getElementById("subdashSindIpm").textContent = a.sindicancia_ipm || "N/A";

            // Dados existentes: primeiro tenta o que já foi salvo no Supabase
            // (a.parecer — vale quando está EDITANDO um parecer já emitido antes),
            // senão o que ficou só localmente nesta aba (a.parecerDados/a.dataParecerIso).
            const parecerExistente = a.parecer || null;
            const dataHojeIso = new Date().toISOString().split('T')[0];

            document.getElementById("subdashDataComissao").value = parecerExistente?.data_conclusao || a.dataParecerIso || dataHojeIso;
            document.getElementById("subdashNumParecer").value = parecerExistente?.numero_parecer || a.parecerDados?.numParecer || `CMM-24/30.3/${new Date().getFullYear().toString().substring(2)}`;

            const comissaoExistente = parecerExistente?.comissao || a.parecerDados?.comissao || [];
            renderizarComissaoTecnica(comissaoExistente);

            renderizarGaleriaBulkSubdashboard();
            carregarQuesitosSubdashboard(a);

            if (a.subdashEtapas && a.subdashEtapas.length > 0) {
                state.subdashEtapas = a.subdashEtapas.map(normalizarEtapaParaSubitens);
            } else if (parecerExistente?.parecer_etapas && parecerExistente.parecer_etapas.length > 0) {
                state.subdashEtapas = [...parecerExistente.parecer_etapas]
                    .sort((x, y) => x.ordem - y.ordem)
                    .map(et => normalizarEtapaParaSubitens({ titulo: et.titulo, texto: et.texto, subitens: et.subitens }));
            } else {
                state.subdashEtapas = [
                    {
                        titulo: "Etapa 1: Análise visual externa e estrutural da viatura",
                        subitens: [{ texto: "Constatadas avarias na parte dianteira da viatura, com deformação do para-choque e capô.", fotosSelecionadas: [1, 2] }]
                    },
                    {
                        titulo: "Etapa 2: Inspeção do sistema de freios e suspensão",
                        subitens: [{ texto: "Sistema de freios em condições regulares de funcionamento. Discos e pastilhas com desgaste compatível com o uso.", fotosSelecionadas: [3, 4] }]
                    },
                    {
                        titulo: "Etapa 3: Varredura eletrônica com scanner Rasther III S",
                        subitens: [{ texto: "Rastreamento eletrônico não apontou códigos de falha ativos no módulo de injeção e ABS.", fotosSelecionadas: [5] }]
                    }
                ];
            }
            renderizarEtapasSubdashboard();
        }

// Compatibilidade: pareceres antigos gravaram só "texto"/"fotosSelecionadas"
// direto na etapa (1 bloco). Agora cada etapa vira uma lista de subitens
// (X.1, X.2...), criados automaticamente conforme o operador adiciona.
function normalizarEtapaParaSubitens(etapa) {
    if (etapa.subitens && etapa.subitens.length > 0) {
        return { titulo: etapa.titulo, subitens: etapa.subitens };
    }
    return {
        titulo: etapa.titulo,
        subitens: [{ texto: etapa.texto || '', fotosSelecionadas: etapa.fotosSelecionadas || [] }]
    };
}

export function voltarAoPainelGestorFromSubdashboard() {
            document.getElementById("viewParecerSubdashboard").style.display = "none";
            document.getElementById("viewOperador").style.display = "block";
            atualizarTabelaGestaoOperador();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

export function processarBulkFotosSubdashboard(inputElement) {
            if (!inputElement.files || inputElement.files.length === 0) return;
            const files = Array.from(inputElement.files);

            showToast(`Processando ${files.length} foto(s)...`, "info");
            const promises = files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        const mimeType = file.type || "image/jpeg";
                        let base64 = e.target.result;
                        // Fotos de celular vêm em resolução muito alta (4000px+) — sem
                        // limitar aqui, isso já foi o que travou/esmagou a geração do
                        // PDF (o html2canvas/jsPDF não aguenta tantas imagens pesadas).
                        if (mimeType.startsWith('image')) {
                            base64 = await redimensionarImagemDataUrl(base64);
                        }
                        resolve({ name: file.name, mimeType, base64 });
                    };
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(promises).then(results => {
                state.subdashFotosBulk = state.subdashFotosBulk.concat(results);
                renderizarGaleriaBulkSubdashboard();
                renderizarEtapasSubdashboard();
                showToast(`${results.length} foto(s) adicionada(s) à galeria em bulk! Total: ${state.subdashFotosBulk.length}`, "success");
                agendarSalvamentoProgressoLocal();
            });
        }

export function renderizarGaleriaBulkSubdashboard() {
            const container = document.getElementById("subdashBulkGallery");
            if (!container) return;

            if (!state.subdashFotosBulk || state.subdashFotosBulk.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: span 6; text-align: center; color: var(--text-dim); padding: 20px; font-size: 12px; font-weight: 700;">
                        NENHUMA FOTO NO BULK. CLIQUE NO BOTÃO ACIMA PARA CARREGAR TODAS AS FOTOS DA ANÁLISE DE UMA SÓ VEZ.
                    </div>
                `;
                return;
            }

            let html = "";
            state.subdashFotosBulk.forEach((foto, idx) => {
                const isPdf = foto.mimeType && foto.mimeType.includes("pdf");
                const num = idx + 1;
                html += `
                    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px; text-align: center; position: relative;">
                        <span style="position: absolute; top: 4px; left: 4px; background: var(--accent-cyan); color: #000; font-weight: 900; font-size: 10px; padding: 2px 6px; border-radius: 4px;">#${num}</span>
                        ${isPdf ? `
                            <div style="height: 80px; display: flex; align-items: center; justify-content: center; background: #1e293b; color: #ef4444; font-size: 24px;">
                                <i class="fa-solid fa-file-pdf"></i>
                            </div>
                        ` : `
                            <img src="${foto.base64}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px;">
                            <button type="button" onclick="abrirEditorFotoBulk(${idx})" title="Editar foto (setas, círculos, texto)" style="position: absolute; bottom: 20px; right: 8px; background: rgba(2,132,199,0.92); border: none; color: #fff; width: 22px; height: 22px; border-radius: 5px; font-size: 10px; cursor: pointer; display:flex; align-items:center; justify-content:center;">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                        `}
                        <div title="${foto.name || ''}" style="font-size: 9px; color: var(--text-muted); margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${foto.name || `FOTO ${num}`}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

// Redimensiona uma imagem (dataURL) para no máximo "maxDim" px no maior lado,
// reexportando em JPEG. Usada após anotar a foto: o marker.js2 em
// renderAtNaturalSize pode devolver uma imagem enorme (4000px+ de câmera de
// celular), e isso sozinho já derrubou a geração do PDF (fotos esmagadas,
// páginas cortadas) — o html2canvas/jsPDF não aguenta imagens tão pesadas.
// 2000px mantém nitidez de sobra para o PDF (fotos saem com 320px de largura)
// sem pesar o suficiente para quebrar a geração.
function redimensionarImagemDataUrl(dataUrl, maxDim = 2000, quality = 0.9) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            if (width <= maxDim && height <= maxDim) {
                resolve(dataUrl);
                return;
            }
            const escala = maxDim / Math.max(width, height);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(width * escala);
            canvas.height = Math.round(height * escala);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

// Editor de anotações sobre a foto (setas, círculos, retângulos, texto) —
// usa a biblioteca marker.js 2, que já traz sua própria interface de edição
// em tela cheia. Ao salvar, a imagem anotada SUBSTITUI a original no bulk.
export function abrirEditorFotoBulk(idx) {
            const foto = state.subdashFotosBulk?.[idx];
            if (!foto || !foto.base64 || !foto.mimeType || !foto.mimeType.startsWith('image')) {
                showToast("Esta foto não pode ser editada.", "warning");
                return;
            }
            if (typeof markerjs2 === 'undefined') {
                showToast("Editor de fotos indisponível no momento.", "error");
                return;
            }

            const imgEl = document.createElement('img');
            imgEl.crossOrigin = 'anonymous';
            imgEl.style.cssText = 'position:fixed; top:-9999px; left:-9999px; max-width:1200px;';
            document.body.appendChild(imgEl);

            const abrirEditor = () => {
                const markerArea = new markerjs2.MarkerArea(imgEl);
                markerArea.settings.displayMode = 'popup';
                // Sem isto, o marker.js2 exporta a imagem anotada no tamanho de
                // TELA do <img> (aqui limitado a 1200px de largura), não na
                // resolução real da foto — daí a baixa qualidade/serrilhado.
                // Com renderAtNaturalSize, o resultado sai na resolução original.
                markerArea.renderAtNaturalSize = true;
                markerArea.renderImageQuality = 1;
                markerArea.addEventListener('render', async (event) => {
                    // Limita o tamanho final (ver redimensionarImagemDataUrl) — a
                    // imagem em resolução total travava/quebrava a geração do PDF.
                    const dataUrlFinal = await redimensionarImagemDataUrl(event.dataUrl);
                    state.subdashFotosBulk[idx].base64 = dataUrlFinal;
                    // Marca para reenviar ao Storage no próximo "Salvar Progresso"
                    // (senão a versão anotada nunca seria gravada de fato).
                    state.subdashFotosBulk[idx].jaSalva = false;
                    renderizarGaleriaBulkSubdashboard();
                    renderizarEtapasSubdashboard();
                    agendarSalvamentoProgressoLocal();
                    showToast("Anotações salvas na foto! Clique em SALVAR PROGRESSO para gravar de vez.", "success");
                });
                markerArea.addEventListener('close', () => {
                    if (imgEl.parentNode) imgEl.parentNode.removeChild(imgEl);
                });
                markerArea.show();
            };

            if (imgEl.complete && imgEl.naturalWidth > 0) {
                abrirEditor();
            } else {
                imgEl.onload = abrirEditor;
                imgEl.onerror = () => {
                    showToast("Não foi possível carregar a foto para edição.", "error");
                    if (imgEl.parentNode) imgEl.parentNode.removeChild(imgEl);
                };
                imgEl.src = foto.base64;
            }
        }

export function carregarQuesitosSubdashboard(solicitation) {
            const container = document.getElementById("subdashQuesitosContainer");
            if (!container) return;

            const perguntas = solicitation.perguntas || [];
            if (perguntas.length === 0) {
                container.innerHTML = `
                    <div style="padding: 14px; background: rgba(15,23,42,0.6); border-radius: 6px;">
                        <label style="display:block; font-size:11px; font-weight:800; color:var(--text-muted); margin-bottom:6px;">OBJETIVO DA ANÁLISE (SOLICITANTE):</label>
                        <p style="font-size:12px; color:#fff; margin-bottom:10px;">${solicitation.objetivo || 'NÃO ESPECIFICADO'}</p>
                        <label style="display:block; font-size:11px; font-weight:800; color:var(--text-muted); margin-bottom:6px;">RESPOSTA TÉCNICA DA COMISSÃO:</label>
                        <textarea class="form-control" id="subdashObjResposta" rows="3" placeholder="DIGITE A RESPOSTA TÉCNICA OFICIAL PARA O OBJETIVO...">${solicitation.subdashObjResposta || ''}</textarea>
                    </div>
                `;
                return;
            }

            let html = "";
            perguntas.forEach((q, idx) => {
                const respExistente = (solicitation.subdashQuesitosResp && solicitation.subdashQuesitosResp[idx]) || "";
                html += `
                    <div style="padding: 12px; background: rgba(15,23,42,0.6); border-radius: 6px; margin-bottom: 12px; border: 1px solid var(--border);">
                        <strong style="color: var(--accent-amber); font-size: 11px;">QUESITO #${idx + 1}: ${q}</strong>
                        <textarea class="form-control subdash-quesito-resp" data-idx="${idx}" rows="2" style="margin-top: 8px; font-size: 12px;" placeholder="DIGITE A RESPOSTA TÉCNICA PARA O QUESITO #${idx + 1}...">${respExistente}</textarea>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

// Comissão técnica: 3 linhas fixas (nome + posto/grad + papel), editáveis.
export function renderizarComissaoTecnica(membros) {
            const container = document.getElementById("subdashComissaoContainer");
            if (!container) return;

            const dados = (membros && membros.length > 0 ? [...membros] : []);
            while (dados.length < 3) dados.push({});

            container.innerHTML = dados.slice(0, 3).map((m, idx) => `
                <div style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap:10px;">
                    <input type="text" id="subdashComissaoNome_${idx}" class="form-control" placeholder="NOME COMPLETO DO MEMBRO ${idx + 1}" value="${m.nome || ''}" style="text-transform:uppercase;">
                    <select id="subdashComissaoPosto_${idx}" class="form-control">
                        <option value="">POSTO/GRADUAÇÃO</option>
                        ${POSTOS_GRAD_COMISSAO.map(p => `<option value="${p}" ${m.postoGrad === p ? 'selected' : ''}>${p}</option>`).join("")}
                    </select>
                    <select id="subdashComissaoPapel_${idx}" class="form-control">
                        <option value="">FUNÇÃO</option>
                        ${PAPEIS_COMISSAO.map(p => `<option value="${p}" ${m.papel === p ? 'selected' : ''}>${p}</option>`).join("")}
                    </select>
                </div>
            `).join("");
        }

function coletarComissaoTecnica() {
    const membros = [];
    for (let i = 0; i < 3; i++) {
        const nome = (document.getElementById(`subdashComissaoNome_${i}`)?.value || "").trim().toUpperCase();
        if (!nome) continue;
        membros.push({
            nome,
            postoGrad: document.getElementById(`subdashComissaoPosto_${i}`)?.value || "",
            papel: document.getElementById(`subdashComissaoPapel_${i}`)?.value || ""
        });
    }
    return membros;
}

export function renderizarEtapasSubdashboard() {
            const container = document.getElementById("subdashEtapasContainer");
            if (!container) return;

            if (!state.subdashEtapas || state.subdashEtapas.length === 0) {
                container.innerHTML = `<div style="color: var(--text-dim); padding: 14px; text-align: center;">NENHUMA ETAPA CADASTRADA. CLIQUE EM "+ ADICIONAR NOVA ETAPA" ACIMA.</div>`;
                return;
            }

            let html = "";
            const totalFotos = (state.subdashFotosBulk || []).length;

            function fotosCheckboxesHtml(etapaIdx, subIdx, fotosSelecionadas) {
                if (totalFotos === 0) {
                    return `<span style="font-size:10px; color:var(--text-muted);">CARREGUE FOTOS NO BULK (TOPO) PARA VINCULAR.</span>`;
                }
                let out = "";
                for (let f = 1; f <= totalFotos; f++) {
                    const checked = (fotosSelecionadas || []).includes(f) ? "checked" : "";
                    const foto = state.subdashFotosBulk[f - 1];
                    const isPdf = foto && foto.mimeType && foto.mimeType.includes("pdf");
                    const miniatura = foto
                        ? (isPdf
                            ? `<span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; background:#1e293b; color:#ef4444; border-radius:3px; font-size:11px;"><i class="fa-solid fa-file-pdf"></i></span>`
                            : `<img src="${foto.base64}" style="width:22px; height:22px; object-fit:cover; border-radius:3px; vertical-align:middle;">`)
                        : "";
                    const nomeFoto = foto?.name || `FOTO #${f}`;
                    out += `
                        <label title="${nomeFoto}" style="display:inline-flex; align-items:center; gap:5px; font-size:10px; background:var(--bg-input); padding:3px 8px; border-radius:4px; border:1px solid var(--border); cursor:pointer; max-width:180px;">
                            <input type="checkbox" onchange="toggleFotoEtapaSubdashboard(${etapaIdx}, ${subIdx}, ${f}, this.checked)" ${checked}> ${miniatura} <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">#${f} ${nomeFoto}</span>
                        </label>
                    `;
                }
                return out;
            }

            state.subdashEtapas.forEach((etapa, idx) => {
                const subitens = etapa.subitens || [];

                const presets = FRASES_PRESET.map(p =>
                    `<button type="button" class="btn btn-secondary" style="height: 24px; font-size: 9px; padding: 0 7px;" onclick="inserirFrasePreset(${idx}, SUBIDX, '${p.texto.replace(/'/g, "\\'")}')">${p.label}</button>`
                ).join("");

                let subitensHtml = "";
                subitens.forEach((sub, si) => {
                    const areaId = `subdashEtapaTxt_${idx}_${si}`;
                    const presetsSub = presets.replaceAll("SUBIDX", si);
                    subitensHtml += `
                        <div style="background: rgba(15,23,42,0.5); border: 1px dashed var(--border); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 10px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                <strong style="font-size:10px; color:var(--accent-amber);">SUBITEM ${idx + 1}.${si + 1}</strong>
                                ${subitens.length > 1 ? `<button type="button" onclick="removerSubitemEtapa(${idx}, ${si})" style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #f87171; border-radius: 5px; padding: 2px 8px; font-size: 10px; font-weight: 800; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>` : ""}
                            </div>
                            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom: 8px;">${presetsSub}</div>
                            <div style="margin-bottom: 10px;">
                                <textarea id="${areaId}" class="form-control" rows="2" oninput="atualizarTextoSubitemSubdashboard(${idx}, ${si}, this.value)" placeholder="Descreva os achados técnicos deste subitem...">${sub.texto || ''}</textarea>
                            </div>
                            <div>
                                <label style="display:block; font-size:10px; font-weight:800; color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">FOTOS DESTE SUBITEM:</label>
                                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                    ${fotosCheckboxesHtml(idx, si, sub.fotosSelecionadas)}
                                </div>
                            </div>
                        </div>
                    `;
                });

                html += `
                    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; margin-bottom: 14px;">
                        <label style="display:block; font-size:9px; font-weight:800; color:var(--text-muted); margin-bottom:4px;">TÍTULO DO ITEM ${idx + 1} (CLIQUE PARA EDITAR LIVREMENTE):</label>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 10px;">
                            <input type="text" class="form-control" value="${etapa.titulo || `Etapa ${idx + 1}`}" oninput="atualizarTituloEtapaSubdashboard(${idx}, this.value)" placeholder="Digite o título deste item da análise técnica..." style="font-weight: 800; color: var(--accent-cyan); width: 80%;">
                            <button type="button" onclick="removerEtapaSubdashboard(${idx})" style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #f87171; border-radius: 6px; padding: 4px 10px; font-weight: 800; cursor: pointer; white-space: nowrap;">
                                <i class="fa-solid fa-trash"></i> REMOVER ETAPA
                            </button>
                        </div>
                        ${subitensHtml}
                        <button type="button" class="btn btn-secondary" style="font-size: 11px; font-weight: 800;" onclick="adicionarSubitemEtapa(${idx})">
                            <i class="fa-solid fa-plus"></i> ADICIONAR SUBITEM ${idx + 1}.${subitens.length + 1}
                        </button>
                    </div>
                `;
            });

            container.innerHTML = html;
        }

// oninput dos campos de título/texto chamam estas funções em vez de mexer
// direto em "state.X" no atributo HTML — "state" é só um import de módulo,
// não existe no escopo global do onclick/oninput, então "state.algo = valor"
// no HTML falhava em silêncio (o campo parecia editável, mas o valor nunca
// era gravado, e por isso não saía nem na prévia nem no PDF baixado).
export function atualizarTituloEtapaSubdashboard(idx, valor) {
    if (!state.subdashEtapas?.[idx]) return;
    state.subdashEtapas[idx].titulo = valor;
    agendarSalvamentoProgressoLocal();
}

export function atualizarTextoSubitemSubdashboard(idx, si, valor) {
    if (!state.subdashEtapas?.[idx]?.subitens?.[si]) return;
    state.subdashEtapas[idx].subitens[si].texto = valor;
    agendarSalvamentoProgressoLocal();
}

export function toggleFotoEtapaSubdashboard(etapaIdx, subIdx, fotoNum, isChecked) {
            const sub = state.subdashEtapas?.[etapaIdx]?.subitens?.[subIdx];
            if (!sub) return;
            sub.fotosSelecionadas = sub.fotosSelecionadas || [];

            if (isChecked) {
                if (!sub.fotosSelecionadas.includes(fotoNum)) {
                    if (sub.fotosSelecionadas.length >= 4) {
                        showToast("Cada subitem suporta no máximo 4 fotos vinculadas.", "warning");
                    }
                    sub.fotosSelecionadas.push(fotoNum);
                }
            } else {
                sub.fotosSelecionadas = sub.fotosSelecionadas.filter(f => f !== fotoNum);
            }
            agendarSalvamentoProgressoLocal();
        }

export function adicionarNovaEtapaSubdashboard() {
            state.subdashEtapas = state.subdashEtapas || [];
            const num = state.subdashEtapas.length + 1;
            state.subdashEtapas.push({
                titulo: `Etapa ${num}: nova etapa da análise técnica`,
                subitens: [{ texto: "", fotosSelecionadas: [] }]
            });
            renderizarEtapasSubdashboard();
        }

export function removerEtapaSubdashboard(idx) {
            state.subdashEtapas.splice(idx, 1);
            renderizarEtapasSubdashboard();
        }

// Cada item (etapa) da análise técnica é numerado (3., 4., 5. ...) e pode
// receber vários subitens (3.1, 3.2, 3.3...), criados sob demanda.
export function adicionarSubitemEtapa(etapaIdx) {
            const etapa = state.subdashEtapas?.[etapaIdx];
            if (!etapa) return;
            etapa.subitens = etapa.subitens || [];
            etapa.subitens.push({ texto: "", fotosSelecionadas: [] });
            renderizarEtapasSubdashboard();
        }

export function removerSubitemEtapa(etapaIdx, subIdx) {
            const etapa = state.subdashEtapas?.[etapaIdx];
            if (!etapa || !etapa.subitens || etapa.subitens.length <= 1) return;
            etapa.subitens.splice(subIdx, 1);
            renderizarEtapasSubdashboard();
        }

// Cada subitem tem seu próprio conjunto de botões de frase pronta (evita o bug de
// inserir sempre na última caixa) — insere direto no subitem "idx.subIdx", nunca em outro.
export function inserirFrasePreset(idx, subIdx, txt) {
            const targetEl = document.getElementById(`subdashEtapaTxt_${idx}_${subIdx}`);
            if (!targetEl) return;
            const actualVal = targetEl.value;
            targetEl.value = actualVal ? `${actualVal} ${txt}` : txt;
            targetEl.dispatchEvent(new Event('input'));
            showToast("Frase pré-programada inserida com sucesso!", "success");
        }

// ---------------------------------------------------------------------
// SALVAMENTO — local (a cada campo, protege contra fechar a aba sem
// querer) e no Supabase (explícito, via botão "SALVAR PROGRESSO" no topo
// ou ao concluir o parecer).
// ---------------------------------------------------------------------
export function agendarSalvamentoProgressoLocal() {
    const protocolo = state.subdashProtocolo;
    if (!protocolo) return;
    clearTimeout(debounceProgressoLocal);
    debounceProgressoLocal = setTimeout(() => {
        const a = state.agendamentos.find(item => item.protocolo === protocolo || String(item.numSolicitacao).padStart(3, '0') === protocolo);
        if (!a) return;
        a.subdashFotosBulk = state.subdashFotosBulk;
        a.subdashEtapas = state.subdashEtapas;
        const quesitosResp = [];
        document.querySelectorAll(".subdash-quesito-resp").forEach(el => quesitosResp.push(el.value));
        if (quesitosResp.length > 0) a.subdashQuesitosResp = quesitosResp;
        a.subdashObjResposta = document.getElementById("subdashObjResposta")?.value || a.subdashObjResposta;
        a.parecerDados = {
            ...(a.parecerDados || {}),
            numParecer: document.getElementById("subdashNumParecer")?.value || a.parecerDados?.numParecer,
            comissao: coletarComissaoTecnica()
        };
        a.dataParecerIso = document.getElementById("subdashDataComissao")?.value || a.dataParecerIso;
        salvarStorage();
    }, 1000);
}

async function persistirParecerNoSupabase(a) {
    const dataComissao = document.getElementById("subdashDataComissao")?.value;
    if (!dataComissao) {
        showToast("Informe a Data da Reunião da Comissão.", "error");
        return null;
    }

    const partesData = dataComissao.split('-');
    const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}/${partesData[0]}` : dataComissao;

    const quesitosResp = [];
    document.querySelectorAll(".subdash-quesito-resp").forEach(el => {
        quesitosResp.push(el.value.trim());
    });
    const objResp = document.getElementById("subdashObjResposta")?.value || "";
    const comissao = coletarComissaoTecnica();

    a.dataParecer = dataFormatada;
    a.dataParecerIso = dataComissao;
    a.subdashFotosBulk = state.subdashFotosBulk;
    a.subdashEtapas = state.subdashEtapas;
    a.subdashQuesitosResp = quesitosResp;
    a.subdashObjResposta = objResp;
    a.parecerDados = {
        numParecer: (document.getElementById("subdashNumParecer")?.value || "").trim().toUpperCase(),
        comissao,
        militar: comissao.length > 0 ? comissao.map(m => `${m.nome} (${m.postoGrad} ${m.papel})`).join("; ") : "COMISSÃO TÉCNICA CMM",
        laudo: "PARECER TÉCNICO ELABORADO CONFORME SUB-DASHBOARD OFICIAL DO CMM.",
        fotosCount: (state.subdashFotosBulk || []).length
    };

    salvarStorage();

    const parecerRow = await salvarParecerSupabase({
        parecerId: a.parecerId || null,
        solicitacaoId: a.id,
        parecer: {
            numParecer: a.parecerDados.numParecer,
            militar: a.parecerDados.militar,
            comissao,
            laudo: a.parecerDados.laudo,
            objetivoResposta: objResp,
            dataConclusaoIso: dataComissao
        },
        etapas: state.subdashEtapas,
        fotosBulk: state.subdashFotosBulk
    });
    a.parecerId = parecerRow.id;

    if (a.perguntasIds && a.perguntasIds.length > 0) {
        try {
            await salvarRespostasQuesitosSupabase(a.perguntasIds, quesitosResp);
        } catch (e) {
            console.error("Erro ao salvar respostas dos quesitos:", e);
        }
    }

    return parecerRow;
}

export async function salvarProgressoParecer() {
    const a = state.agendamentos.find(item => item.protocolo === state.subdashProtocolo || String(item.numSolicitacao).padStart(3, '0') === state.subdashProtocolo);
    if (!a) return;

    const btn = document.getElementById("btnSalvarProgressoParecer");
    if (btn) btn.disabled = true;
    showToast("Salvando progresso...", "info");
    try {
        await persistirParecerNoSupabase(a);
        showToast("Progresso salvo com sucesso!", "success");
    } catch (err) {
        console.error("Erro ao salvar progresso do parecer:", err);
        showToast("Não foi possível salvar o progresso. Tente novamente.", "error");
    } finally {
        if (btn) btn.disabled = false;
    }
}

export async function salvarEEmitirParecerSubdashboard() {
            const a = state.agendamentos.find(item => item.protocolo === state.subdashProtocolo || String(item.numSolicitacao).padStart(3, '0') === state.subdashProtocolo);
            if (!a) return;

            const btnSalvar = document.getElementById("btnSalvarEmitirParecer");
            if (btnSalvar) btnSalvar.disabled = true;
            showToast("Salvando parecer técnico...", "info");

            let parecerRow;
            try {
                parecerRow = await persistirParecerNoSupabase(a);
                if (!parecerRow) { if (btnSalvar) btnSalvar.disabled = false; return; }
                a.status = "PRONTO";
                if (parecerRow.documentosComFalha && parecerRow.documentosComFalha.length > 0) {
                    showToast(`Parecer salvo, mas ${parecerRow.documentosComFalha.length} foto(s) falharam no upload.`, "warning");
                } else {
                    showToast("PARECER TÉCNICO CONCLUÍDO E SALVO COM SUCESSO!", "success");
                }
            } catch (err) {
                console.error("Erro ao salvar parecer no Supabase:", err);
                showToast("Erro ao salvar o parecer. Tente novamente.", "error");
                if (btnSalvar) btnSalvar.disabled = false;
                return;
            }
            if (btnSalvar) btnSalvar.disabled = false;

            // Inicia Preview ao invés de fechar direto
            gerarEPreverParecerPdf(a);
        }
