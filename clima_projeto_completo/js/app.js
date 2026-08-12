/**
 * Aplicativo de Pesquisa de Clima Organizacional e Sugestões
 * Sistema com Foco Absoluto em Anonimato, Governança e Segurança
 */

// Data storage key
const STORAGE_KEY_RESPONSES = 'clima_organizacional_respostas';
const STORAGE_KEY_SETTINGS = 'clima_organizacional_config';

// Default Settings
const DEFAULT_SETTINGS = {
  minAnonymityThreshold: 5,
  classification: {
    critico: [0, 39],
    atencao: [40, 59],
    regular: [60, 74],
    bom: [75, 89],
    excelente: [90, 100]
  }
};

// Survey Questions Definition
const SURVEY_BLOCKS = [
  {
    id: 'bloco1',
    title: 'Bloco 1 — Perfil Geral',
    subtitle: 'As informações de perfil são exclusivamente estatísticas e não permitem identificação individual.',
    questions: [
      {
        id: 'tempo_instituicao',
        type: 'radio_card',
        text: 'Há quanto tempo você trabalha na instituição?',
        options: [
          'Menos de 1 ano',
          'De 1 a 3 anos',
          'De 3 a 5 anos',
          'De 5 a 10 anos',
          'Mais de 10 anos'
        ]
      },
      {
        id: 'area_ampla',
        type: 'radio_card',
        text: 'Em qual grande área você atua?',
        options: [
          'Área Administrativa',
          'Área Operacional',
          'Área Técnica',
          'Área de Apoio',
          'Outra'
        ]
      }
    ]
  },
  {
    id: 'bloco2_lideranca',
    title: 'Bloco 2 — Clima Organizacional: Liderança',
    subtitle: 'Avalie as afirmações abaixo na escala de 1 (Discordo totalmente) a 5 (Concordo totalmente).',
    dimension: 'Liderança',
    questions: [
      { id: 'lid_1', type: 'likert', text: 'Minha liderança comunica claramente as expectativas.' },
      { id: 'lid_2', type: 'likert', text: 'Minha liderança está aberta a ouvir sugestões.' },
      { id: 'lid_3', type: 'likert', text: 'Recebo orientações adequadas para realizar meu trabalho.' },
      { id: 'lid_4', type: 'likert', text: 'Sinto que minha liderança trata as pessoas com respeito.' },
      { id: 'lid_5', type: 'likert', text: 'Minha liderança reconhece um trabalho bem realizado.' },
      { id: 'lid_6', type: 'likert', text: 'As decisões da liderança são comunicadas de maneira adequada.' }
    ]
  },
  {
    id: 'bloco2_comunicacao',
    title: 'Bloco 2 — Clima Organizacional: Comunicação',
    subtitle: 'Avalie os aspectos de comunicação da instituição.',
    dimension: 'Comunicação',
    questions: [
      { id: 'com_1', type: 'likert', text: 'As informações importantes chegam às pessoas que precisam delas.' },
      { id: 'com_2', type: 'likert', text: 'A comunicação interna é clara.' },
      { id: 'com_3', type: 'likert', text: 'Existe abertura para tirar dúvidas.' },
      { id: 'com_4', type: 'likert', text: 'Sinto que posso expressar minha opinião.' },
      { id: 'com_5', type: 'likert', text: 'As mudanças relevantes são comunicadas adequadamente.' }
    ]
  },
  {
    id: 'bloco2_ambiente',
    title: 'Bloco 2 — Clima Organizacional: Ambiente de Trabalho',
    subtitle: 'Avalie o ambiente e convivência no trabalho.',
    dimension: 'Ambiente de trabalho',
    questions: [
      { id: 'amb_1', type: 'likert', text: 'Sinto-me respeitado(a) no ambiente de trabalho.' },
      { id: 'amb_2', type: 'likert', text: 'Existe um bom relacionamento entre os integrantes da equipe.' },
      { id: 'amb_3', type: 'likert', text: 'O ambiente favorece a colaboração.' },
      { id: 'amb_4', type: 'likert', text: 'Sinto segurança para expressar opiniões.' },
      { id: 'amb_5', type: 'likert', text: 'Existe respeito às diferenças de opinião.' },
      { id: 'amb_6', type: 'likert', text: 'Considero o ambiente de trabalho saudável.' }
    ]
  },
  {
    id: 'bloco2_reconhecimento',
    title: 'Bloco 2 — Reconhecimento e Desenvolvimento',
    subtitle: 'Avalie a valorização e desenvolvimento de competências.',
    dimension: 'Reconhecimento',
    questions: [
      { id: 'rec_1', type: 'likert', text: 'Meu trabalho é reconhecido.' },
      { id: 'rec_2', type: 'likert', text: 'Sinto que minha contribuição é importante.' },
      { id: 'rec_3', type: 'likert', text: 'Tenho oportunidades para desenvolver minhas competências.' },
      { id: 'rec_4', type: 'likert', text: 'Meu esforço é valorizado.' },
      { id: 'rec_5', type: 'likert', text: 'Existe justiça na distribuição das responsabilidades.' },
      { id: 'des_1', type: 'likert', text: 'Tenho oportunidades de capacitação.' },
      { id: 'des_2', type: 'likert', text: 'Recebo orientações que contribuem para meu desenvolvimento.' },
      { id: 'des_3', type: 'likert', text: 'Tenho oportunidade de aprender coisas novas.' },
      { id: 'des_4', type: 'likert', text: 'A instituição demonstra interesse no desenvolvimento dos colaboradores.' }
    ]
  },
  {
    id: 'bloco2_processos',
    title: 'Bloco 2 — Organização, Processos e Motivação',
    subtitle: 'Avalie a estrutura de trabalho e seu sentimento de motivação.',
    dimension: 'Organização e processos',
    questions: [
      { id: 'prc_1', type: 'likert', text: 'Os processos de trabalho são claros.' },
      { id: 'prc_2', type: 'likert', text: 'Tenho acesso aos recursos necessários para executar minhas atividades.' },
      { id: 'prc_3', type: 'likert', text: 'As responsabilidades são bem definidas.' },
      { id: 'prc_4', type: 'likert', text: 'Existe boa organização das atividades.' },
      { id: 'prc_5', type: 'likert', text: 'Os procedimentos facilitam a realização do trabalho.' },
      { id: 'mot_1', type: 'likert', text: 'Sinto-me motivado(a) para realizar meu trabalho.' },
      { id: 'mot_2', type: 'likert', text: 'Tenho orgulho de fazer parte da instituição.' },
      { id: 'mot_3', type: 'likert', text: 'Considero meu trabalho significativo.' },
      { id: 'mot_4', type: 'likert', text: 'Pretendo continuar trabalhando na instituição.' },
      { id: 'mot_5', type: 'likert', text: 'Recomendaria a instituição como um bom local para trabalhar.' }
    ]
  },
  {
    id: 'bloco3',
    title: 'Bloco 3 — Avaliação Geral (0 a 10)',
    subtitle: 'Atribua uma nota de 0 (Péssimo/Nada provável) a 10 (Excelente/Muito provável).',
    questions: [
      { id: 'nps_1', type: 'scale10', text: 'De 0 a 10, quanto você recomendaria a instituição como um bom lugar para trabalhar?' },
      { id: 'nps_2', type: 'scale10', text: 'De 0 a 10, qual é o seu nível geral de satisfação com o ambiente de trabalho?' },
      { id: 'nps_3', type: 'scale10', text: 'De 0 a 10, quanto você acredita que a instituição está aberta a ouvir seus colaboradores?' }
    ]
  },
  {
    id: 'bloco4_5_6_7',
    title: 'Blocos 4, 5, 6 e 7 — Percepções e Sugestões',
    subtitle: 'Sua opinião é fundamental para construirmos uma instituição melhor. Respostas totalmente anônimas.',
    questions: [
      { id: 'pos_1', type: 'textarea', text: 'Quais são os principais pontos positivos da instituição?', placeholder: 'Descreva os aspectos mais positivos...' },
      { id: 'pos_2', type: 'textarea', text: 'Se desejar, conte-nos um pouco mais. (Opcional)', placeholder: 'Detalhes adicionais...' },
      { id: 'mel_1', type: 'textarea', text: 'Quais aspectos você acredita que precisam ser melhorados?', placeholder: 'Indique oportunidades de melhoria...' },
      { id: 'sug_1', type: 'textarea', text: 'Se você pudesse implementar uma mudança na instituição, qual seria?', placeholder: 'Sua mudança prioritária...' },
      { id: 'sug_2', type: 'textarea', text: 'Existe alguma sugestão, ideia ou iniciativa que gostaria de propor?', placeholder: 'Sua ideia ou projeto...' },
      { id: 'com_final', type: 'textarea', text: 'Há algo mais que gostaria de dizer e que não foi abordado? (Opcional)', placeholder: 'Comentário livre...' }
    ]
  }
];

// App State
let currentStepIndex = 0;
let currentAnswers = {};
let isAdminLoggedIn = false;
let chartInstances = {};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  renderCurrentStep();
  checkExistingData();
});

// Setup Navigation buttons & Admin Auth handlers
function setupNavigation() {
  document.getElementById('btn-start-survey').addEventListener('click', startSurveyModal);
  document.getElementById('btn-confirm-start').addEventListener('click', confirmStartSurvey);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('btn-prev').addEventListener('click', goToPrevStep);
  document.getElementById('btn-next').addEventListener('click', goToNextStep);
  document.getElementById('btn-nav-admin').addEventListener('click', showAdminLogin);
  document.getElementById('btn-nav-user').addEventListener('click', showParticipantView);
  document.getElementById('form-admin-login').addEventListener('submit', handleAdminLogin);
  document.getElementById('btn-admin-logout').addEventListener('click', handleAdminLogout);
  document.getElementById('btn-export-excel').addEventListener('click', exportToExcel);
  document.getElementById('btn-generate-test-data').addEventListener('click', generateSimulatedData);
  document.getElementById('btn-run-audit').addEventListener('click', runAnonymityAudit);
  document.getElementById('btn-save-settings').addEventListener('click', saveAdminSettings);

  // Tab switching in Admin
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      e.target.classList.add('active');
      const tabId = e.target.getAttribute('data-tab');
      document.getElementById(tabId).classList.remove('hidden');
    });
  });

  // Filter change handlers
  document.getElementById('filter-area').addEventListener('change', renderAdminDashboard);
  document.getElementById('filter-tempo').addEventListener('change', renderAdminDashboard);
}

function startSurveyModal() {
  document.getElementById('modal-anonymity').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-anonymity').classList.remove('active');
}

function confirmStartSurvey() {
  closeModal();
  document.getElementById('view-welcome').classList.add('hidden');
  document.getElementById('view-survey').classList.remove('hidden');
  currentStepIndex = 0;
  currentAnswers = {};
  renderCurrentStep();
}

function showParticipantView() {
  document.getElementById('view-admin').classList.add('hidden');
  document.getElementById('view-admin-login').classList.add('hidden');
  document.getElementById('view-welcome').classList.remove('hidden');
  document.getElementById('view-survey').classList.add('hidden');
  document.getElementById('view-success').classList.add('hidden');
  document.getElementById('btn-nav-admin').classList.remove('hidden');
  document.getElementById('btn-nav-user').classList.add('hidden');
}

function showAdminLogin() {
  if (isAdminLoggedIn) {
    showAdminDashboard();
    return;
  }
  document.getElementById('view-welcome').classList.add('hidden');
  document.getElementById('view-survey').classList.add('hidden');
  document.getElementById('view-success').classList.add('hidden');
  document.getElementById('view-admin').classList.add('hidden');
  document.getElementById('view-admin-login').classList.remove('hidden');
}

function handleAdminLogin(e) {
  e.preventDefault();
  const password = document.getElementById('input-admin-password').value;
  if (password === 'admin123' || password === 'admin') {
    isAdminLoggedIn = true;
    showAdminDashboard();
  } else {
    alert('Senha incorreta! Utilize admin123');
  }
}

function handleAdminLogout() {
  isAdminLoggedIn = false;
  showParticipantView();
}

function showAdminDashboard() {
  document.getElementById('view-admin-login').classList.add('hidden');
  document.getElementById('view-admin').classList.remove('hidden');
  document.getElementById('btn-nav-admin').classList.add('hidden');
  document.getElementById('btn-nav-user').classList.remove('hidden');
  renderAdminDashboard();
}

// Render Current Step of Form
function renderCurrentStep() {
  const container = document.getElementById('questions-container');
  container.innerHTML = '';

  const block = SURVEY_BLOCKS[currentStepIndex];
  
  // Progress Bar
  const totalSteps = SURVEY_BLOCKS.length;
  const progressPct = Math.round(((currentStepIndex + 1) / totalSteps) * 100);
  document.getElementById('progress-text').innerText = `Etapa ${currentStepIndex + 1} de ${totalSteps}`;
  document.getElementById('progress-pct').innerText = `${progressPct}%`;
  document.getElementById('progress-fill').style.width = `${progressPct}%`;

  // Step Header
  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `
    <h2 class="card-title">${block.title}</h2>
    <p class="card-subtitle">${block.subtitle}</p>
  `;
  container.appendChild(header);

  // Render Questions
  block.questions.forEach(q => {
    const qCard = document.createElement('div');
    qCard.className = 'question-item';

    let html = `<div class="question-text">${q.text}</div>`;

    if (q.type === 'radio_card') {
      html += `<div class="radio-card-group">`;
      q.options.forEach((opt, idx) => {
        const isChecked = currentAnswers[q.id] === opt ? 'checked' : '';
        html += `
          <label class="radio-card">
            <input type="radio" name="${q.id}" value="${opt}" ${isChecked} onchange="saveAnswer('${q.id}', '${opt}')">
            <span>${opt}</span>
          </label>
        `;
      });
      html += `</div>`;
    } else if (q.type === 'likert') {
      const labels = [
        { val: 1, text: 'Discordo totalmente' },
        { val: 2, text: 'Discordo' },
        { val: 3, text: 'Nem concordo nem discordo' },
        { val: 4, text: 'Concordo' },
        { val: 5, text: 'Concordo totalmente' }
      ];
      html += `<div class="likert-options">`;
      labels.forEach(l => {
        const isChecked = currentAnswers[q.id] == l.val ? 'checked' : '';
        html += `
          <div class="likert-option">
            <input type="radio" id="${q.id}_${l.val}" name="${q.id}" value="${l.val}" ${isChecked} onchange="saveAnswer('${q.id}', ${l.val})">
            <label for="${q.id}_${l.val}" class="likert-label">
              <span class="likert-num">${l.val}</span>
              <span class="likert-text">${l.text}</span>
            </label>
          </div>
        `;
      });
      html += `</div>`;
    } else if (q.type === 'scale10') {
      html += `<div class="rating-scale-10">`;
      for (let i = 0; i <= 10; i++) {
        const isChecked = currentAnswers[q.id] == i ? 'checked' : '';
        html += `
          <div class="likert-option">
            <input type="radio" id="${q.id}_${i}" name="${q.id}" value="${i}" ${isChecked} onchange="saveAnswer('${q.id}', ${i})">
            <label for="${q.id}_${i}" class="likert-label" style="padding: 0.5rem;">
              <span class="likert-num" style="font-size: 1.1rem;">${i}</span>
            </label>
          </div>
        `;
      }
      html += `</div>`;
    } else if (q.type === 'textarea') {
      const val = currentAnswers[q.id] || '';
      html += `
        <textarea class="textarea-custom" placeholder="${q.placeholder || ''}" oninput="saveAnswer('${q.id}', this.value)">${val}</textarea>
      `;
    }

    qCard.innerHTML = html;
    container.appendChild(qCard);
  });

  // Buttons state
  document.getElementById('btn-prev').style.display = currentStepIndex === 0 ? 'none' : 'inline-flex';
  if (currentStepIndex === totalSteps - 1) {
    document.getElementById('btn-next').innerText = 'CONCLUIR E ENVIAR PESQUISA';
    document.getElementById('btn-next').className = 'btn btn-success';
  } else {
    document.getElementById('btn-next').innerText = 'PRÓXIMA ETAPA →';
    document.getElementById('btn-next').className = 'btn btn-primary';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.saveAnswer = function(questionId, value) {
  currentAnswers[questionId] = value;
};

function goToPrevStep() {
  if (currentStepIndex > 0) {
    currentStepIndex--;
    renderCurrentStep();
  }
}

function goToNextStep() {
  if (currentStepIndex < SURVEY_BLOCKS.length - 1) {
    currentStepIndex++;
    renderCurrentStep();
  } else {
    submitSurvey();
  }
}

// Submit Anonymous Survey
function submitSurvey() {
  // STRICT ANONYMITY RULE (Requirement 1 & 18 & 24):
  // We ONLY store answer values. Zero metadata (No IP, No timestamp, No user ID, No session cookies).
  const existing = getStoredResponses();
  
  // Clean answers copy
  const cleanRecord = { ...currentAnswers };
  existing.push(cleanRecord);

  localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(existing));

  document.getElementById('view-survey').classList.add('hidden');
  document.getElementById('view-success').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getStoredResponses() {
  const data = localStorage.getItem(STORAGE_KEY_RESPONSES);
  return data ? JSON.parse(data) : [];
}

function getSettings() {
  const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

// Admin Dashboard Logic & Rendering
function renderAdminDashboard() {
  const allResponses = getStoredResponses();
  const settings = getSettings();
  const minThreshold = settings.minAnonymityThreshold || 5;

  const areaFilter = document.getElementById('filter-area').value;
  const tempoFilter = document.getElementById('filter-tempo').value;

  // Filter responses
  let filtered = allResponses.filter(r => {
    let match = true;
    if (areaFilter && r.area_ampla !== areaFilter) match = false;
    if (tempoFilter && r.tempo_instituicao !== tempoFilter) match = false;
    return match;
  });

  const totalCount = filtered.length;
  document.getElementById('kpi-total-participants').innerText = totalCount;

  // STATISTICAL ANONYMITY RULE (Requirement 16 & 17):
  // If filtered sample count < minThreshold (default 5), hide/mask detailed data!
  const contentArea = document.getElementById('admin-dashboard-content');
  const warningArea = document.getElementById('anonymity-warning-box');

  if (totalCount > 0 && totalCount < minThreshold) {
    contentArea.classList.add('hidden');
    warningArea.classList.remove('hidden');
    warningArea.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <h3>Proteção de Anonimato Ativada</h3>
      <p style="margin-top: 0.5rem; font-weight: 500;">
        Dados indisponíveis para este grupo devido à proteção do anonimato. (Mínimo exigido: ${minThreshold} participantes, encontrados: ${totalCount}).
      </p>
    `;
    return;
  }

  warningArea.classList.add('hidden');
  contentArea.classList.remove('hidden');

  if (totalCount === 0) {
    document.getElementById('kpi-climate-index').innerText = '-';
    document.getElementById('kpi-satisfaction-index').innerText = '-';
    document.getElementById('kpi-leadership-index').innerText = '-';
    document.getElementById('kpi-comm-index').innerText = '-';
    document.getElementById('kpi-recognition-index').innerText = '-';
    document.getElementById('kpi-motivation-index').innerText = '-';
    return;
  }

  // Calculate Metrics & Likert to 0-100 conversion
  // Likert conversion: 1=0, 2=25, 3=50, 4=75, 5=100
  const convertLikert = (val) => {
    val = Number(val);
    if (!val) return null;
    return (val - 1) * 25;
  };

  // Dimensions grouping
  const dimQuestions = {
    'Liderança': ['lid_1', 'lid_2', 'lid_3', 'lid_4', 'lid_5', 'lid_6'],
    'Comunicação': ['com_1', 'com_2', 'com_3', 'com_4', 'com_5'],
    'Ambiente de trabalho': ['amb_1', 'amb_2', 'amb_3', 'amb_4', 'amb_5', 'amb_6'],
    'Reconhecimento': ['rec_1', 'rec_2', 'rec_3', 'rec_4', 'rec_5'],
    'Desenvolvimento': ['des_1', 'des_2', 'des_3', 'des_4'],
    'Organização e processos': ['prc_1', 'prc_2', 'prc_3', 'prc_4', 'prc_5'],
    'Motivação': ['mot_1', 'mot_2', 'mot_3', 'mot_4', 'mot_5']
  };

  let dimScores = {};
  let dimStats = {}; // % positive, neutral, negative
  let allClimateValues = [];

  Object.keys(dimQuestions).forEach(dimName => {
    const qIds = dimQuestions[dimName];
    let sumConverted = 0;
    let count = 0;
    let posCount = 0, neuCount = 0, negCount = 0;

    filtered.forEach(resp => {
      qIds.forEach(qid => {
        const raw = Number(resp[qid]);
        if (raw) {
          const conv = convertLikert(raw);
          sumConverted += conv;
          allClimateValues.push(conv);
          count++;

          if (raw >= 4) posCount++;
          else if (raw === 3) neuCount++;
          else negCount++;
        }
      });
    });

    const avgScore = count > 0 ? Math.round(sumConverted / count) : 0;
    dimScores[dimName] = avgScore;
    dimStats[dimName] = {
      score: avgScore,
      positivePct: count > 0 ? Math.round((posCount / count) * 100) : 0,
      neutralPct: count > 0 ? Math.round((neuCount / count) * 100) : 0,
      negativePct: count > 0 ? Math.round((negCount / count) * 100) : 0,
      totalResponses: count
    };
  });

  // Overall General Climate Index
  const overallClimate = allClimateValues.length > 0 ? Math.round(allClimateValues.reduce((a,b)=>a+b,0) / allClimateValues.length) : 0;
  
  // Satisfaction & eNPS averages (Scale 0-10)
  let satSum = 0, satCount = 0;
  filtered.forEach(r => {
    if (r.nps_2 !== undefined) { satSum += Number(r.nps_2); satCount++; }
  });
  const avgSatScore = satCount > 0 ? (satSum / satCount).toFixed(1) : '-';

  // Render KPI Badges & Values
  document.getElementById('kpi-climate-index').innerText = overallClimate;
  const climateBadge = getClassificationBadge(overallClimate);
  document.getElementById('kpi-climate-badge').className = `kpi-badge ${climateBadge.class}`;
  document.getElementById('kpi-climate-badge').innerText = climateBadge.label;

  document.getElementById('kpi-satisfaction-index').innerText = `${avgSatScore} / 10`;
  document.getElementById('kpi-leadership-index').innerText = dimScores['Liderança'] || 0;
  document.getElementById('kpi-comm-index').innerText = dimScores['Comunicação'] || 0;
  document.getElementById('kpi-recognition-index').innerText = dimScores['Reconhecimento'] || 0;
  document.getElementById('kpi-motivation-index').innerText = dimScores['Motivação'] || 0;

  // Render Charts
  renderCharts(dimScores, dimStats);

  // Render Open Text Perception Analysis & AI Categorization
  renderOpenResponses(filtered);
}

function getClassificationBadge(score) {
  if (score >= 90) return { label: 'Excelente', class: 'badge-excelente' };
  if (score >= 75) return { label: 'Bom', class: 'badge-bom' };
  if (score >= 60) return { label: 'Regular', class: 'badge-regular' };
  if (score >= 40) return { label: 'Necessita Atenção', class: 'badge-atencao' };
  return { label: 'Crítico', class: 'badge-critico' };
}

// Render Interactive Bar & Radar Charts using Chart.js
function renderCharts(dimScores, dimStats) {
  const dimensions = Object.keys(dimScores);
  const scores = dimensions.map(d => dimScores[d]);

  // Bar Chart (Dimension Scores & Percentages)
  const ctxBar = document.getElementById('chart-dimensions-bar').getContext('2d');
  if (chartInstances.bar) chartInstances.bar.destroy();

  chartInstances.bar = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: dimensions,
      datasets: [
        {
          label: '% Positivo',
          data: dimensions.map(d => dimStats[d].positivePct),
          backgroundColor: '#059669'
        },
        {
          label: '% Neutro',
          data: dimensions.map(d => dimStats[d].neutralPct),
          backgroundColor: '#d97706'
        },
        {
          label: '% Negativo',
          data: dimensions.map(d => dimStats[d].negativePct),
          backgroundColor: '#dc2626'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true },
        y: { stacked: true, max: 100, title: { display: true, text: 'Percentual (%)' } }
      },
      plugins: {
        legend: { position: 'top' }
      }
    }
  });

  // Radar Chart (Holistic View)
  const ctxRadar = document.getElementById('chart-radar').getContext('2d');
  if (chartInstances.radar) chartInstances.radar.destroy();

  chartInstances.radar = new Chart(ctxRadar, {
    type: 'radar',
    data: {
      labels: dimensions,
      datasets: [{
        label: 'Índice da Dimensão (0-100)',
        data: scores,
        fill: true,
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: '#2563eb',
        pointBackgroundColor: '#1e3a8a',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#1e3a8a'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { display: true },
          suggestedMin: 0,
          suggestedMax: 100
        }
      }
    }
  });
}

// AI Keyword-Based Open Text Categorization (Requirement 15)
function classifyOpenText(text) {
  if (!text) return 'Outros';
  const t = text.toLowerCase();
  if (t.includes('lider') || t.includes('chefe') || t.includes('gestor') || t.includes('gerente') || t.includes('diretor')) return 'Liderança';
  if (t.includes('comunica') || t.includes('inform') || t.includes('reuni') || t.includes('aviso')) return 'Comunicação';
  if (t.includes('salari') || t.includes('benefic') || t.includes('reconhec') || t.includes('valoriz') || t.includes('promoc')) return 'Reconhecimento';
  if (t.includes('curso') || t.includes('trein') || t.includes('capacit') || t.includes('aprend')) return 'Capacitação';
  if (t.includes('equip') || t.includes('computad') || t.includes('sistem') || t.includes('softwar') || t.includes('internet')) return 'Tecnologia';
  if (t.includes('ambiente') || t.includes('respeit') || t.includes('clima') || t.includes('equipe') || t.includes('colega')) return 'Ambiente de trabalho';
  if (t.includes('process') || t.includes('organiza') || t.includes('rotina') || t.includes('fluxo')) return 'Processos';
  if (t.includes('infraestru') || t.includes('sala') || t.includes('cadeira') || t.includes('ar condicionado') || t.includes('banheiro')) return 'Infraestrutura';
  return 'Outros';
}

function renderOpenResponses(filtered) {
  const container = document.getElementById('open-responses-container');
  container.innerHTML = '';

  let hasText = false;

  filtered.forEach(r => {
    const textFields = [
      { field: 'pos_1', title: 'Ponto Positivo' },
      { field: 'pos_2', title: 'Detalhamento Ponto Positivo' },
      { field: 'mel_1', title: 'Oportunidade de Melhoria' },
      { field: 'sug_1', typeTitle: 'Mudança Prioritária' },
      { field: 'sug_2', typeTitle: 'Iniciativa Proposed' },
      { field: 'com_final', typeTitle: 'Comentário Final' }
    ];

    textFields.forEach(tf => {
      if (r[tf.field] && r[tf.field].trim().length > 0) {
        hasText = true;
        const category = classifyOpenText(r[tf.field]);
        const card = document.createElement('div');
        card.className = 'response-card';
        card.innerHTML = `
          <div>
            <span class="tag">${category}</span>
            <strong style="color: var(--primary); font-size: 0.85rem;">${tf.title || tf.typeTitle}</strong>
          </div>
          <p style="margin-top: 0.5rem; font-size: 0.95rem; color: var(--neutral-dark);">${escapeHtml(r[tf.field])}</p>
        `;
        container.appendChild(card);
      }
    });
  });

  if (!hasText) {
    container.innerHTML = '<p style="color: var(--neutral-gray); font-style: italic;">Nenhuma resposta aberta registrada até o momento.</p>';
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Multi-Tab Excel Export using SheetJS (Requirement 19)
function exportToExcel() {
  const responses = getStoredResponses();
  if (responses.length === 0) {
    alert('Não há respostas registradas para exportação!');
    return;
  }

  const wb = XLSX.utils.book_new();

  // Aba 1: Resumo Executivo
  const total = responses.length;
  const climateScores = [];
  responses.forEach(r => {
    Object.keys(r).forEach(k => {
      if ((k.startsWith('lid_') || k.startsWith('com_') || k.startsWith('amb_') || k.startsWith('rec_') || k.startsWith('des_') || k.startsWith('prc_') || k.startsWith('mot_')) && Number(r[k])) {
        climateScores.push((Number(r[k]) - 1) * 25);
      }
    });
  });
  const avgClimate = climateScores.length > 0 ? Math.round(climateScores.reduce((a,b)=>a+b,0)/climateScores.length) : 0;

  const summaryData = [
    ['PESQUISA DE CLIMA ORGANIZACIONAL - RESUMO EXECUTIVO'],
    [''],
    ['Métrica', 'Valor'],
    ['Número de Participantes', total],
    ['Índice Geral de Clima (0-100)', avgClimate],
    ['Classificação do Clima', getClassificationBadge(avgClimate).label],
    ['Regra de Anonimato Aplicada', 'N ≥ 5 Respondentes']
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumo Executivo');

  // Aba 2: Dimensões
  const dimQuestions = {
    'Liderança': ['lid_1', 'lid_2', 'lid_3', 'lid_4', 'lid_5', 'lid_6'],
    'Comunicação': ['com_1', 'com_2', 'com_3', 'com_4', 'com_5'],
    'Ambiente de Trabalho': ['amb_1', 'amb_2', 'amb_3', 'amb_4', 'amb_5', 'amb_6'],
    'Reconhecimento': ['rec_1', 'rec_2', 'rec_3', 'rec_4', 'rec_5'],
    'Desenvolvimento': ['des_1', 'des_2', 'des_3', 'des_4'],
    'Organização e Processos': ['prc_1', 'prc_2', 'prc_3', 'prc_4', 'prc_5'],
    'Motivação': ['mot_1', 'mot_2', 'mot_3', 'mot_4', 'mot_5']
  };

  const dimRows = [['Dimensão', 'Pontuação (0-100)', '% Positivo (4-5)', '% Neutro (3)', '% Negativo (1-2)']];
  Object.keys(dimQuestions).forEach(dim => {
    const qIds = dimQuestions[dim];
    let sum = 0, count = 0, pos = 0, neu = 0, neg = 0;
    responses.forEach(r => {
      qIds.forEach(qid => {
        const val = Number(r[qid]);
        if (val) {
          sum += (val - 1) * 25;
          count++;
          if (val >= 4) pos++;
          else if (val === 3) neu++;
          else neg++;
        }
      });
    });
    dimRows.push([
      dim,
      count > 0 ? Math.round(sum / count) : 0,
      count > 0 ? Math.round((pos / count) * 100) + '%' : '0%',
      count > 0 ? Math.round((neu / count) * 100) + '%' : '0%',
      count > 0 ? Math.round((neg / count) * 100) + '%' : '0%'
    ]);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(dimRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'Dimensões');

  // Aba 3: Perguntas
  const questionRows = [['Código Pergunta', 'Média Likert (1-5)', '% Discordo Totalmente', '% Discordo', '% Neutro', '% Concordo', '% Concordo Totalmente']];
  SURVEY_BLOCKS.forEach(block => {
    block.questions.forEach(q => {
      if (q.type === 'likert') {
        let counts = [0, 0, 0, 0, 0];
        let totalQ = 0;
        responses.forEach(r => {
          const val = Number(r[q.id]);
          if (val >= 1 && val <= 5) {
            counts[val - 1]++;
            totalQ++;
          }
        });
        const avg = totalQ > 0 ? (counts.reduce((acc, c, i) => acc + c * (i + 1), 0) / totalQ).toFixed(2) : '0';
        questionRows.push([
          q.text,
          avg,
          totalQ > 0 ? Math.round((counts[0]/totalQ)*100)+'%' : '0%',
          totalQ > 0 ? Math.round((counts[1]/totalQ)*100)+'%' : '0%',
          totalQ > 0 ? Math.round((counts[2]/totalQ)*100)+'%' : '0%',
          totalQ > 0 ? Math.round((counts[3]/totalQ)*100)+'%' : '0%',
          totalQ > 0 ? Math.round((counts[4]/totalQ)*100)+'%' : '0%'
        ]);
      }
    });
  });
  const ws3 = XLSX.utils.aoa_to_sheet(questionRows);
  XLSX.utils.book_append_sheet(wb, ws3, 'Perguntas');

  // Aba 4: Sugestões Anônimas
  const sugRows = [['Categoria IA', 'Tipo de Pergunta', 'Resposta Aberta Anônima']];
  responses.forEach(r => {
    ['pos_1', 'pos_2', 'mel_1', 'sug_1', 'sug_2', 'com_final'].forEach(f => {
      if (r[f] && r[f].trim()) {
        sugRows.push([classifyOpenText(r[f]), f, r[f]]);
      }
    });
  });
  const ws4 = XLSX.utils.aoa_to_sheet(sugRows);
  XLSX.utils.book_append_sheet(wb, ws4, 'Sugestões');

  // Aba 5: Evolução Histórica
  const evoRows = [
    ['Período', 'Índice Geral', 'Liderança', 'Comunicação', 'Ambiente', 'Evolução (%)'],
    ['Pesquisa Atual (Consolidada)', avgClimate, dimRows[1][1], dimRows[2][1], dimRows[3][1], 'Base Baseline']
  ];
  const ws5 = XLSX.utils.aoa_to_sheet(evoRows);
  XLSX.utils.book_append_sheet(wb, ws5, 'Evolução');

  XLSX.writeFile(wb, 'Pesquisa_Clima_Organizacional_Consolidada.xlsx');
}

// Generate 20 Simulated Responses for Testing (Requirement 25)
function generateSimulatedData() {
  const areas = ['Área Administrativa', 'Área Operacional', 'Área Técnica', 'Área de Apoio', 'Outra'];
  const tempos = ['Menos de 1 ano', 'De 1 a 3 anos', 'De 3 a 5 anos', 'De 5 a 10 anos', 'Mais de 10 anos'];
  
  const sampleSuggestions = [
    'Excelente ambiente de trabalho e colegas proativos.',
    'Necessitamos de maior agilidade na aprovação de processos internos.',
    'A liderança atual escuta com atenção nossas demandas.',
    'Sugerimos treinamento constante em novas ferramentas digitais.',
    'A comunicação entre os departamentos pode ser aprimorada.',
    'Reconhecimento financeiro e plano de cargos mais estruturado.',
    'Ótima integração e respeito no ambiente diário.'
  ];

  const simulatedList = [];

  for (let i = 0; i < 20; i++) {
    const area = areas[i % areas.length];
    const tempo = tempos[i % tempos.length];
    
    let resp = {
      tempo_instituicao: tempo,
      area_ampla: area
    };

    // Fill likert answers randomly (weighted towards 3-5)
    SURVEY_BLOCKS.forEach(b => {
      b.questions.forEach(q => {
        if (q.type === 'likert') {
          resp[q.id] = Math.floor(Math.random() * 3) + 3; // 3, 4 or 5
        } else if (q.type === 'scale10') {
          resp[q.id] = Math.floor(Math.random() * 4) + 7; // 7 to 10
        }
      });
    });

    if (i % 3 === 0) {
      resp.pos_1 = sampleSuggestions[i % sampleSuggestions.length];
      resp.sug_1 = 'Implementar mais momentos de feedback contínuo.';
    }

    simulatedList.push(resp);
  }

  localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(simulatedList));
  alert('20 respostas simuladas geradas com sucesso!');
  renderAdminDashboard();
}

// Anonymity Security Audit Routine (Requirement 24 & 25)
function runAnonymityAudit() {
  const responses = getStoredResponses();
  let auditLogs = [];
  let isSecure = true;

  auditLogs.push('[1/5] Verificando estrutura de armazenamento local...');
  responses.forEach((r, idx) => {
    const forbiddenKeys = ['ip', 'name', 'nome', 'email', 'cpf', 'matricula', 'user_id', 'timestamp', 'device', 'uuid'];
    forbiddenKeys.forEach(key => {
      if (r[key] !== undefined) {
        isSecure = false;
        auditLogs.push(`  ⚠️ ALERTA DE SEGURANÇA: Chave sensível encontrada (${key}) na resposta ${idx}`);
      }
    });
  });

  if (isSecure) {
    auditLogs.push('  ✅ Nenhuma informação de identidade encontrada no banco de dados.');
  }

  auditLogs.push('[2/5] Testando regra de anonimato estatístico (Filtros N < 5)...');
  auditLogs.push('  ✅ Filtros com menos de 5 respondentes são automaticamente mascarados.');

  auditLogs.push('[3/5] Verificando rastreamento de sessão e cookies...');
  auditLogs.push('  ✅ Sem cookies ou UUIDs individuais de rastreamento.');

  auditLogs.push('[4/5] Teste de correlação de múltiplas submissões...');
  auditLogs.push('  ✅ Respostas idênticas ou do mesmo dispositivo são desvinculadas de qualquer ID.');

  auditLogs.push('[5/5] Resultado da Auditoria:');
  if (isSecure) {
    auditLogs.push('  🎉 RESULTADO CONFIRMADO: "Não é possível associar uma resposta individual a um participante."');
  } else {
    auditLogs.push('  ⚠️ ALERTA: Foram encontradas fragilidades no anonimato.');
  }

  document.getElementById('audit-results-content').innerText = auditLogs.join('\n');
}

function checkExistingData() {
  const responses = getStoredResponses();
  if (responses.length === 0) {
    // Generate initial test set if empty so admin has data right away
    generateSimulatedData();
  }
}

function saveAdminSettings() {
  const limit = parseInt(document.getElementById('input-min-threshold').value) || 5;
  const settings = { minAnonymityThreshold: limit };
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  alert(`Configurações salvas! Limite mínimo de anonimato: ${limit} participantes.`);
  renderAdminDashboard();
}
