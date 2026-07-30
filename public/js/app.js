const API = '/api';
let currentPage = 'dashboard';
let tasksCache = [];
let teamsCache = [];

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  return res.json();
}

function toast(msg, type = '') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2500);
}

function statusLabel(s) {
  return { concluido: 'Concluído', em_andamento: 'Em Andamento', pendente: 'Pendente' }[s] || s;
}

function priorityLabel(p) {
  return { alta: 'Alta', media: 'Média', baixa: 'Baixa' }[p] || p;
}

function splitUppercaseCoupleToken(token) {
  if (!token || token.includes(' ')) return token;
  const upperOnly = /^[A-ZÀ-Ú.]+$/.test(token);
  if (!upperOnly || token.length < 10 || !token.includes('E')) return token;
  let bestIdx = -1;
  let bestScore = Infinity;
  for (let i = 3; i <= token.length - 4; i++) {
    if (token[i] !== 'E') continue;
    const left = token.slice(0, i).replace(/\./g, '');
    const right = token.slice(i + 1).replace(/\./g, '');
    if (left.length < 3 || right.length < 3) continue;
    const score = Math.abs(left.length - right.length);
    if (score < bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  if (bestIdx === -1) return token;
  return `${token.slice(0, bestIdx)} e ${token.slice(bestIdx + 1)}`;
}

function prettifyPersonName(raw, opts = {}) {
  if (!raw) return '';
  const { couple = false } = opts;
  let value = String(raw)
    .replace(/✅/g, ' ')
    .replace(/[-\s]*P\s*G\s*[-\s]*(pix|dinheiro)?/gi, ' ')
    .replace(/[-–—]+\s*$/g, ' ')
    .replace(/\bWA\b/gi, ' ')
    .replace(/\.([A-Za-zÀ-ú])/g, '. $1')
    .replace(/([A-Za-zÀ-ú])(dos|das|do|da|de)(\s|$)/gi, '$1 $2$3')
    .replace(/\s+/g, ' ')
    .trim();

  if (couple) value = splitUppercaseCoupleToken(value);

  if (!value.includes(' ') && /[a-zà-ú][A-ZÀ-Ú]/.test(value)) {
    value = value
      .replace(/([a-zà-ú])([A-ZÀ-Ú])/g, (m, a, b) => `${a} ${b}`)
      .replace(/([A-ZÀ-Ú])([A-ZÀ-Ú][a-zà-ú])/g, (m, a, b) => `${a} ${b}`);
  }

  const lowerWords = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  return value
    .split(' ')
    .filter(Boolean)
    .map((part, idx) => {
      const p = part.trim();
      const normalized = p.toLowerCase();
      if (idx > 0 && lowerWords.has(normalized)) return normalized;
      if (p.length <= 2 && p === p.toUpperCase()) return p;
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join(' ')
    .trim();
}

// ============ NAVIGATION (Hash Routing) ============
const VALID_PAGES = ['dashboard','checklist','cronograma','equipes','encontro','inscritos','padrinhos','pais','fornecedores','escolinhas','alicerces','lembretes','avisos','financeiro','lembrancinhas','kit','relatorios'];

function getPageFromHash() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  return VALID_PAGES.includes(hash) ? hash : 'dashboard';
}

function updateActiveNav() {
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === currentPage);
  });
}

function navigateTo(page) {
  window.location.hash = '#/' + page;
}

window.addEventListener('hashchange', () => {
  currentPage = getPageFromHash();
  updateActiveNav();
  renderPage();
  closeSidebar();
  window.scrollTo(0, 0);
});

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    navigateTo(item.dataset.page);
  });
});

// ============ MOBILE SIDEBAR ============
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('sidebar-backdrop');
const menuBtn = document.getElementById('mobile-menu-btn');

function openSidebar() { sidebar.classList.add('open'); backdrop.classList.add('active'); }
function closeSidebar() { sidebar.classList.remove('open'); backdrop.classList.remove('active'); }

menuBtn.addEventListener('click', () => { sidebar.classList.contains('open') ? closeSidebar() : openSidebar(); });
backdrop.addEventListener('click', closeSidebar);
document.getElementById('sidebar-close-btn').addEventListener('click', closeSidebar);

function renderPage() {
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  if (currentPage === 'dashboard') renderDashboard();
  else if (currentPage === 'checklist') renderChecklist();
  else if (currentPage === 'cronograma') renderCronograma();
  else if (currentPage === 'equipes') renderEquipes();
  else if (currentPage === 'inscritos') renderInscritos();
  else if (currentPage === 'financeiro') renderFinanceiro();
  else if (currentPage === 'lembrancinhas') renderLembrancinhas();
  else if (currentPage === 'escolinhas') renderEscolinhas();
  else if (currentPage === 'alicerces') renderAlicerces();
  else if (currentPage === 'encontro') renderEncontro();
  else if (currentPage === 'lembretes') renderLembretes();
  else if (currentPage === 'padrinhos') renderPadrinhos();
  else if (currentPage === 'fornecedores') renderFornecedores();
  else if (currentPage === 'pais') renderPaisMP();
  else if (currentPage === 'avisos') renderAvisos();
  else if (currentPage === 'kit') renderKit();
  else if (currentPage === 'relatorios') renderRelatorios();
}

// ============ DASHBOARD ============
async function renderDashboard() {
  const stats = await api('/stats');
  const enc = await api('/encounter');
  const fin = await api('/finance/summary');
  const participants = await api('/participants');
  const lembrancinhas = await api('/lembrancinhas');
  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const main = document.getElementById('main-content');

  let countdownHTML = '';
  if (enc && enc.start_date) {
    const target = new Date(enc.start_date + 'T00:00:00');
    const now = new Date();
    const diff = target - now;
    if (diff > 0) {
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      countdownHTML = `<div class="card countdown-card" style="text-align:center;background:linear-gradient(135deg,rgba(192,57,43,0.05),rgba(212,160,23,0.05));border:1px solid rgba(192,57,43,0.15)">
        <div class="card-title" style="border:none;text-align:center">⏰ Contagem Regressiva</div>
        <div class="countdown">
          <div class="countdown-unit"><div class="countdown-number">${days}</div><div class="countdown-label">Dias</div></div>
          <div class="countdown-unit"><div class="countdown-number">${hours}</div><div class="countdown-label">Horas</div></div>
          <div class="countdown-unit"><div class="countdown-number">${mins}</div><div class="countdown-label">Min</div></div>
        </div>
        <p style="color:var(--text-light);font-size:13px;margin-top:8px">${enc.name || 'Encontro Compromisso Trin'} — ${new Date(enc.start_date).toLocaleDateString('pt-BR')}</p>
      </div>`;
    }
  }

  const paidCount = participants.filter(p => p.paid).length;
  const lemDone = lembrancinhas.filter(l => l.status === 'pronto').length;
  const lemTotal = lembrancinhas.length;
  const prePct = stats.preTotal > 0 ? Math.round((stats.preDone / stats.preTotal) * 100) : 0;
  const duringPct = stats.duringTotal > 0 ? Math.round((stats.duringDone / stats.duringTotal) * 100) : 0;

  main.innerHTML = `
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">Visão geral da preparação do Encontro Compromisso Trin</p>
    ${countdownHTML}
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon total">📋</div><div class="stat-info"><h3>${stats.total}</h3><p>Total de Tarefas</p></div></div>
      <div class="stat-card"><div class="stat-icon done">✅</div><div class="stat-info"><h3>${stats.done}</h3><p>Concluídas</p></div></div>
      <div class="stat-card"><div class="stat-icon progress">⏳</div><div class="stat-info"><h3>${stats.inProgress}</h3><p>Em Andamento</p></div></div>
      <div class="stat-card"><div class="stat-icon pending">⭕</div><div class="stat-info"><h3>${stats.pending}</h3><p>Pendentes</p></div></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon total">👥</div><div class="stat-info"><h3>${participants.length}</h3><p>Matérias-primas (${paidCount} pagas)</p></div></div>
      <div class="stat-card"><div class="stat-icon done">💰</div><div class="stat-info"><h3>R$ ${fin.balance.toFixed(0)}</h3><p>Saldo Atual</p></div></div>
      <div class="stat-card"><div class="stat-icon progress">🎁</div><div class="stat-info"><h3>${lemDone}/${lemTotal}</h3><p>Lembrancinhas Prontas</p></div></div>
      <div class="stat-card"><div class="stat-icon pending">📅</div><div class="stat-info"><h3>${enc.start_date ? new Date(enc.start_date).toLocaleDateString('pt-BR') : '—'}</h3><p>Data do Encontro</p></div></div>
    </div>
    <div class="card">
      <div class="card-title">Progresso por Fase</div>
      <div class="progress-container">
        <div class="progress-label"><span>📋 Pré-Encontro (Preparação)</span><span>${stats.preDone}/${stats.preTotal} (${prePct}%)</span></div>
        <div class="progress-bar"><div class="progress-fill ${prePct >= 75 ? '' : prePct >= 40 ? 'warn' : 'danger'}" style="width:${prePct}%"></div></div>
      </div>
      <div class="progress-container">
        <div class="progress-label"><span>🏗️ Durante o Encontro (Execução)</span><span>${stats.duringDone}/${stats.duringTotal} (${duringPct}%)</span></div>
        <div class="progress-bar"><div class="progress-fill ${duringPct >= 75 ? '' : duringPct >= 40 ? 'warn' : 'danger'}" style="width:${duringPct}%"></div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Progresso Geral</div>
      <div class="progress-container">
        <div class="progress-label"><span>${stats.done} de ${stats.total} tarefas</span><span>${pct}%</span></div>
        <div class="progress-bar"><div class="progress-fill ${pct >= 75 ? '' : pct >= 40 ? 'warn' : 'danger'}" style="width:${pct}%"></div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Progresso por Categoria</div>
      ${stats.byCategory.map(c => {
        const cp = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
        const cls = cp >= 75 ? '' : cp >= 40 ? 'warn' : 'danger';
        return `<div class="progress-container">
          <div class="progress-label"><span>${c.category}</span><span>${c.done}/${c.total} (${cp}%)</span></div>
          <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${cp}%"></div></div>
        </div>`;
      }).join('')}
    </div>
    <div class="card">
      <div class="card-title">Progresso por Equipe</div>
      ${stats.byTeam.map(t => {
        const tp = t.total > 0 ? Math.round((t.done / t.total) * 100) : 0;
        const cls = tp >= 75 ? '' : tp >= 40 ? 'warn' : 'danger';
        return `<div class="progress-container">
          <div class="progress-label"><span>${t.team || 'N/A'}</span><span>${t.done}/${t.total} (${tp}%)</span></div>
          <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${tp}%"></div></div>
        </div>`;
      }).join('')}
    </div>
  `;
  updateSidebarProgress(pct);
}

// ============ CHECKLIST ============
let currentPhaseTab = 'pre';
let currentSort = 'deadline';
let collapsedCategories = new Set();

async function renderChecklist() {
  tasksCache = await api('/tasks');
  const main = document.getElementById('main-content');
  const preCount = tasksCache.filter(t => (t.phase || 'pre') === 'pre').length;
  const duringCount = tasksCache.filter(t => t.phase === 'during').length;
  const preDone = tasksCache.filter(t => (t.phase || 'pre') === 'pre' && t.status === 'concluido').length;
  const duringDone = tasksCache.filter(t => t.phase === 'during' && t.status === 'concluido').length;
  const prePct = preCount > 0 ? Math.round((preDone / preCount) * 100) : 0;
  const duringPct = duringCount > 0 ? Math.round((duringDone / duringCount) * 100) : 0;
  main.innerHTML = `
    <h1 class="page-title">Checklist do Encontro</h1>
    <p class="page-subtitle">Tarefas divididas por fase: preparação antes do Encontro e execução durante o Encontro.</p>

    <div class="checklist-overview">
      <div class="checklist-phase-card ${currentPhaseTab==='pre'?'active':''}" onclick="switchPhaseTab('pre')">
        <div class="checklist-phase-icon">📋</div>
        <div class="checklist-phase-info">
          <div class="checklist-phase-name">Pré-Encontro</div>
          <div class="checklist-phase-stats">${preDone}/${preCount} concluídas</div>
        </div>
        <div class="checklist-phase-ring">
          <div class="ring-progress" style="--pct:${prePct}"><span>${prePct}%</span></div>
        </div>
      </div>
      <div class="checklist-phase-card ${currentPhaseTab==='during'?'active':''}" onclick="switchPhaseTab('during')">
        <div class="checklist-phase-icon">🏗️</div>
        <div class="checklist-phase-info">
          <div class="checklist-phase-name">Durante o Encontro</div>
          <div class="checklist-phase-stats">${duringDone}/${duringCount} concluídas</div>
        </div>
        <div class="checklist-phase-ring">
          <div class="ring-progress" style="--pct:${duringPct}"><span>${duringPct}%</span></div>
        </div>
      </div>
    </div>

    <div class="checklist-toolbar">
      <div class="checklist-toolbar-left">
        <input type="text" class="search-box" id="task-search" placeholder="🔍 Buscar tarefa..." oninput="filterTasks()">
        <select id="filter-status" onchange="filterTasks()" class="checklist-select">
          <option value="">📊 Status: Todos</option>
          <option value="pendente">⭕ Pendente</option>
          <option value="em_andamento">🔄 Em Andamento</option>
          <option value="concluido">✅ Concluído</option>
        </select>
        <select id="filter-priority" onchange="filterTasks()" class="checklist-select">
          <option value="">🎯 Prioridade: Todas</option>
          <option value="alta">🔴 Alta</option>
          <option value="media">🟡 Média</option>
          <option value="baixa">⚪ Baixa</option>
        </select>
        <select id="filter-team" onchange="filterTasks()" class="checklist-select">
          <option value="">👥 Equipe: Todas</option>
        </select>
        <select id="filter-sort" onchange="changeSort()" class="checklist-select">
          <option value="deadline">📅 Por Prazo</option>
          <option value="priority">🔴 Por Prioridade</option>
          <option value="category">📁 Por Categoria</option>
          <option value="status">📊 Por Status</option>
        </select>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openTaskModal()">+ Nova Tarefa</button>
    </div>

    <div id="task-phase-content"></div>
  `;
  const teams = [...new Set(tasksCache.map(t => t.responsible_team).filter(Boolean))].sort();
  const teamSelect = document.getElementById('filter-team');
  teams.forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; teamSelect.appendChild(o); });
  const sortSelect = document.getElementById('filter-sort');
  if (sortSelect) sortSelect.value = currentSort;
  renderChecklistSections(tasksCache);
}

function switchPhaseTab(phase) {
  currentPhaseTab = phase;
  collapsedCategories.clear();
  renderChecklistSections(tasksCache);
  document.querySelectorAll('.checklist-phase-card').forEach(card => {
    card.classList.remove('active');
  });
  const cards = document.querySelectorAll('.checklist-phase-card');
  if (phase === 'pre' && cards[0]) cards[0].classList.add('active');
  if (phase === 'during' && cards[1]) cards[1].classList.add('active');
}

function changeSort() {
  currentSort = document.getElementById('filter-sort').value;
  filterTasks();
}

function filterTasks() {
  const search = document.getElementById('task-search')?.value.toLowerCase() || '';
  const status = document.getElementById('filter-status')?.value || '';
  const team = document.getElementById('filter-team')?.value || '';
  const priority = document.getElementById('filter-priority')?.value || '';
  let filtered = tasksCache;
  if (search) filtered = filtered.filter(t => t.title.toLowerCase().includes(search) || (t.description || '').toLowerCase().includes(search));
  if (status) filtered = filtered.filter(t => t.status === status);
  if (team) filtered = filtered.filter(t => t.responsible_team === team);
  if (priority) filtered = filtered.filter(t => t.priority === priority);
  renderChecklistSections(filtered);
}

function filterByTeam(teamName) {
  const teamSelect = document.getElementById('filter-team');
  if (teamSelect) {
    teamSelect.value = teamName;
    filterTasks();
  }
}

function normalizeTeamName(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMOTask(task) {
  const team = normalizeTeamName(task?.responsible_team);
  if (!team) return true;
  return team === 'mo' || team === 'mos' || team === "mo's" || team.includes('mestre de obra');
}

const PRIORITY_WEIGHT = { alta: 0, media: 1, baixa: 2 };
const STATUS_WEIGHT = { em_andamento: 0, pendente: 1, concluido: 2 };

function sortTasks(items) {
  const sorted = [...items];
  if (currentSort === 'priority') {
    sorted.sort((a, b) => (PRIORITY_WEIGHT[a.priority] || 9) - (PRIORITY_WEIGHT[b.priority] || 9));
  } else if (currentSort === 'status') {
    sorted.sort((a, b) => (STATUS_WEIGHT[a.status] || 9) - (STATUS_WEIGHT[b.status] || 9));
  } else if (currentSort === 'category') {
    sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
  } else {
    sorted.sort((a, b) => (a.deadline || 'zzz').localeCompare(b.deadline || 'zzz'));
  }
  return sorted;
}

function renderChecklistSections(tasks) {
  const phaseTasks = tasks.filter(t => (t.phase || 'pre') === currentPhaseTab);
  const moTasks = phaseTasks.filter(isMOTask);
  const teamSpecificTasks = phaseTasks.filter(t => !isMOTask(t));
  const container = document.getElementById('task-phase-content');
  if (!container) return;
  const phaseLabel = currentPhaseTab === 'pre' ? 'Pré-Encontro' : 'Durante o Encontro';
  const total = phaseTasks.length;
  const done = phaseTasks.filter(t => t.status === 'concluido').length;
  const inProg = phaseTasks.filter(t => t.status === 'em_andamento').length;
  const pend = phaseTasks.filter(t => t.status === 'pendente').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  container.innerHTML = `
    <div class="checklist-summary-bar">
      <div class="checklist-summary-stats">
        <div class="checklist-stat"><span class="stat-num">${total}</span><span class="stat-label">Total</span></div>
        <div class="checklist-stat stat-done"><span class="stat-num">${done}</span><span class="stat-label">Concluídas</span></div>
        <div class="checklist-stat stat-progress"><span class="stat-num">${inProg}</span><span class="stat-label">Em Andamento</span></div>
        <div class="checklist-stat stat-pending"><span class="stat-num">${pend}</span><span class="stat-label">Pendentes</span></div>
      </div>
      <div class="checklist-summary-progress">
        <div class="checklist-progress-bar">
          <div class="checklist-progress-fill" style="width:${pct}%"></div>
        </div>
        <span class="checklist-progress-pct">${pct}%</span>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="goToEquipesFromChecklist()">Ver por equipe →</button>
    </div>

    <div class="checklist-section">
      <div class="checklist-section-header">
        <h3>👷 Responsabilidades Gerais (MO's)</h3>
        <span class="checklist-section-count">${moTasks.length} tarefas</span>
      </div>
      <div id="task-categories-mos"></div>
    </div>

    <div class="checklist-section">
      <div class="checklist-section-header">
        <h3>👥 Tarefas Específicas por Equipe</h3>
        <span class="checklist-section-count">${teamSpecificTasks.length} tarefas</span>
      </div>
      <div id="task-categories-teams"></div>
    </div>
  `;
  renderTaskCategories(moTasks, 'task-categories-mos', `Nenhuma tarefa de MO encontrada para ${phaseLabel} com os filtros atuais.`);
  renderTaskCategories(teamSpecificTasks, 'task-categories-teams', `Nenhuma tarefa específica de equipe encontrada para ${phaseLabel} com os filtros atuais.`);
}

function renderTaskCategories(tasks, containerId = 'task-categories', emptyMessage = 'Nenhuma tarefa encontrada.') {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (tasks.length === 0) {
    container.innerHTML = `<div class="checklist-empty">${emptyMessage}</div>`;
    return;
  }
  const categories = [...new Set(tasks.map(t => t.category))].sort();
  container.innerHTML = categories.map(cat => {
    const items = sortTasks(tasks.filter(t => t.category === cat));
    const done = items.filter(t => t.status === 'concluido').length;
    const inProg = items.filter(t => t.status === 'em_andamento').length;
    const pend = items.filter(t => t.status === 'pendente').length;
    const catPct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
    const isCollapsed = collapsedCategories.has(containerId + '::' + cat);
    const catColor = catPct === 100 ? 'var(--success)' : catPct >= 50 ? 'var(--warning)' : 'var(--danger)';
    return `<div class="task-category ${isCollapsed ? 'collapsed' : ''}">
      <div class="task-category-header" onclick="toggleCategory(this, '${containerId}', '${(cat || '').replace(/'/g, "\\'")}')">
        <div class="task-category-left">
          <svg class="chevron ${isCollapsed ? 'collapsed' : ''}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          <span class="task-category-name">${cat}</span>
        </div>
        <div class="task-category-right">
          <div class="task-category-mini-stats">
            ${pend > 0 ? `<span class="mini-stat mini-pend" title="Pendentes">${pend}</span>` : ''}
            ${inProg > 0 ? `<span class="mini-stat mini-prog" title="Em Andamento">${inProg}</span>` : ''}
            ${done > 0 ? `<span class="mini-stat mini-done" title="Concluídas">${done}</span>` : ''}
          </div>
          <div class="task-category-progress">
            <div class="cat-progress-bar"><div class="cat-progress-fill" style="width:${catPct}%;background:${catColor}"></div></div>
          </div>
          <span class="task-category-pct" style="color:${catColor}">${catPct}%</span>
        </div>
      </div>
      <div class="task-list">${items.map(t => renderTaskItem(t)).join('')}</div>
    </div>`;
  }).join('');
}

function renderTaskItem(t) {
  const checkboxClass = t.status === 'concluido' ? 'checked' : t.status === 'em_andamento' ? 'in-progress' : '';
  const priorityIcon = t.priority === 'alta' ? '🔴' : t.priority === 'media' ? '🟡' : '⚪';
  const isLembrete = t.item_number === 'L' || (t.notes && t.notes.includes('Lembrete vinculado'));
  return `<div class="task-item status-${t.status}">
    <div class="task-checkbox ${checkboxClass}" onclick="cycleTaskStatus(${t.id})" title="Clique para mudar status"></div>
    <div class="task-body">
      <div class="task-title-line">
        <span class="task-num">[${t.item_number}]</span>
        <span class="task-title">${t.title}</span>
        ${isLembrete ? '<span class="badge-sm badge-info" title="Vem de um lembrete">🔔 Lembrete</span>' : ''}
      </div>
      ${t.description ? `<div class="task-desc">${t.description}</div>` : ''}
      <div class="task-meta">
        ${t.responsible_team ? `<span class="tag tag-team" style="cursor:pointer" onclick="filterByTeam('${t.responsible_team.replace(/'/g,"\\'")}')">👥 ${t.responsible_team}</span>` : ''}
        ${t.deadline ? `<span class="tag tag-deadline">⏰ ${t.deadline}</span>` : ''}
        <span class="tag tag-priority-${t.priority}">${priorityIcon} ${priorityLabel(t.priority)}</span>
      </div>
    </div>
    <div class="task-actions">
      <button class="btn-icon" onclick="openTaskDetails(${t.id})" title="Ver detalhes">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      <button class="btn-icon" onclick="openTaskModal(${t.id})" title="Editar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="btn-icon" onclick="deleteTask(${t.id})" title="Excluir">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>`;
}

function toggleCategory(header, containerId, catName) {
  const list = header.nextElementSibling;
  const chevron = header.querySelector('.chevron');
  const category = header.closest('.task-category');
  const key = containerId + '::' + catName;
  if (collapsedCategories.has(key)) {
    collapsedCategories.delete(key);
    category.classList.remove('collapsed');
    chevron.classList.remove('collapsed');
  } else {
    collapsedCategories.add(key);
    category.classList.add('collapsed');
    chevron.classList.add('collapsed');
  }
}

async function cycleTaskStatus(id) {
  const task = tasksCache.find(t => t.id === id);
  const next = task.status === 'pendente' ? 'em_andamento' : task.status === 'em_andamento' ? 'concluido' : 'pendente';
  await api(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
  task.status = next;
  filterTasks();
  toast(`Tarefa marcada como: ${statusLabel(next)}`, next === 'concluido' ? 'success' : '');
  updateStats();
}

async function deleteTask(id) {
  if (!confirm('Excluir esta tarefa?')) return;
  await api(`/tasks/${id}`, { method: 'DELETE' });
  tasksCache = tasksCache.filter(t => t.id !== id);
  filterTasks();
  toast('Tarefa excluída', 'error');
}

function openTaskModal(id) {
  const task = id ? tasksCache.find(t => t.id === id) : null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>${task ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
    <div class="form-group"><label>Categoria</label><input id="t-category" value="${task?.category || ''}"></div>
    <div class="form-row">
      <div class="form-group"><label>Número</label><input id="t-number" value="${task?.item_number || ''}"></div>
      <div class="form-group"><label>Fase</label><select id="t-phase">
        <option value="pre" ${(!task || task?.phase==='pre')?'selected':''}>Pré-Encontro (Preparação)</option>
        <option value="during" ${task?.phase==='during'?'selected':''}>Durante o Encontro (Execução)</option>
      </select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Prioridade</label><select id="t-priority">
        <option value="baixa" ${task?.priority==='baixa'?'selected':''}>Baixa</option>
        <option value="media" ${task?.priority==='media'||!task?'selected':''}>Média</option>
        <option value="alta" ${task?.priority==='alta'?'selected':''}>Alta</option>
      </select></div>
      <div class="form-group"><label>Prazo</label><input id="t-deadline" value="${task?.deadline || ''}"></div>
    </div>
    <div class="form-group"><label>Título</label><input id="t-title" value="${task?.title || ''}"></div>
    <div class="form-group"><label>Descrição</label><textarea id="t-desc" rows="3">${task?.description || ''}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Equipe Responsável</label><input id="t-team" value="${task?.responsible_team || ''}"></div>
      <div class="form-group"><label>Status</label><select id="t-status">
        <option value="pendente" ${task?.status==='pendente'||!task?'selected':''}>Pendente</option>
        <option value="em_andamento" ${task?.status==='em_andamento'?'selected':''}>Em Andamento</option>
        <option value="concluido" ${task?.status==='concluido'?'selected':''}>Concluído</option>
      </select></div>
    </div>
    <div class="form-group"><label>Observações</label><textarea id="t-notes" rows="2">${task?.notes || ''}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveTask(${id || 'null'}, this)">${task ? 'Salvar' : 'Criar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function saveTask(id, btn) {
  const teamValue = document.getElementById('t-team').value;
  const data = {
    category: document.getElementById('t-category').value,
    item_number: document.getElementById('t-number').value,
    title: document.getElementById('t-title').value,
    description: document.getElementById('t-desc').value,
    responsible_team: teamValue || "MO's",
    deadline: document.getElementById('t-deadline').value,
    priority: document.getElementById('t-priority').value,
    status: document.getElementById('t-status').value,
    notes: document.getElementById('t-notes').value,
    phase: document.getElementById('t-phase').value,
  };
  if (id) await api(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  else await api('/tasks', { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Tarefa salva!', 'success');
  renderChecklist();
}

function goToEquipesFromChecklist() {
  currentPage = 'equipes';
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const target = document.querySelector('.nav-item[data-page="equipes"]');
  if (target) target.classList.add('active');
  renderPage();
}

// ============ CRONOGRAMA ============
async function renderCronograma() {
  const schedule = await api('/schedule');
  const teams = await api('/teams');
  const days = ['Sexta-feira', 'Sábado', 'Domingo'];
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h1 class="page-title">Cronograma do Encontro</h1>
    <p class="page-subtitle">Programação completa - Sexta a Domingo</p>
    <div class="filters">
      <div class="filter-group">
        <span class="filter-label">Filtrar por equipe:</span>
        <select id="schedule-team-filter" onchange="filterSchedule()">
          <option value="">Todas as equipes</option>
          ${teams.map(t => `<option value="${t.name}">${t.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="card" id="schedule-card">
      ${days.map(day => {
        const items = schedule.filter(s => s.day === day);
        if (items.length === 0) return '';
        const doneCount = items.filter(s => s.status === 'concluido').length;
        return `<div class="schedule-day">
          <div class="schedule-day-header">📅 ${day}<span class="schedule-day-count">${doneCount}/${items.length} concluídas</span></div>
          ${items.map(s => `<div class="schedule-item">
            <div class="schedule-time">${s.time}</div>
            <div class="schedule-activity">${s.activity}</div>
            <div class="schedule-location">${s.location || ''}</div>
            <div class="schedule-team" style="cursor:pointer" onclick="document.getElementById('schedule-team-filter').value='${(s.responsible_team||'').replace(/'/g,"\\'")}';filterSchedule()">${s.responsible_team || ''}</div>
            <div class="schedule-status ${s.status==='concluido'?'done':''} ${s.status==='em_andamento'?'in-progress':''}" data-status="${s.status||'pendente'}" onclick="toggleSchedule(${s.id}, this)"></div>
          </div>`).join('')}
        </div>`;
      }).join('')}
    </div>`;
}

async function filterSchedule() {
  const team = document.getElementById('schedule-team-filter').value;
  const schedule = team ? await api(`/schedule?team=${encodeURIComponent(team)}`) : await api('/schedule');
  const days = ['Sexta-feira', 'Sábado', 'Domingo'];
  const card = document.getElementById('schedule-card');
  card.innerHTML = days.map(day => {
    const items = schedule.filter(s => s.day === day);
    if (items.length === 0) return '';
    const doneCount = items.filter(s => s.status === 'concluido').length;
    return `<div class="schedule-day">
      <div class="schedule-day-header">📅 ${day}<span class="schedule-day-count">${doneCount}/${items.length} concluídas</span></div>
      ${items.map(s => `<div class="schedule-item">
        <div class="schedule-time">${s.time}</div>
        <div class="schedule-activity">${s.activity}</div>
        <div class="schedule-location">${s.location || ''}</div>
        <div class="schedule-team" style="cursor:pointer" onclick="document.getElementById('schedule-team-filter').value='${(s.responsible_team||'').replace(/'/g,"\\'")}';filterSchedule()">${s.responsible_team || ''}</div>
        <div class="schedule-status ${s.status==='concluido'?'done':''} ${s.status==='em_andamento'?'in-progress':''}" data-status="${s.status||'pendente'}" onclick="toggleSchedule(${s.id}, this)"></div>
      </div>`).join('')}
    </div>`;
  }).join('');
}

async function toggleSchedule(id, el) {
  const current = el.dataset.status || 'pendente';
  const cycle = { pendente: 'em_andamento', em_andamento: 'concluido', concluido: 'pendente' };
  const status = cycle[current] || 'em_andamento';
  await api(`/schedule/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  el.dataset.status = status;
  el.classList.remove('done', 'in-progress');
  if (status === 'concluido') el.classList.add('done');
  else if (status === 'em_andamento') el.classList.add('in-progress');
  const labels = { pendente: 'Atividade reaberta', em_andamento: 'Atividade em andamento!', concluido: 'Atividade concluída!' };
  toast(labels[status], status === 'concluido' ? 'success' : status === 'em_andamento' ? '' : '');
}

// ============ EQUIPES ============
async function renderEquipes() {
  teamsCache = await api('/teams');
  const allTasks = await api('/tasks');
  const allSchedule = await api('/schedule');
  const allLembrancinhas = await api('/lembrancinhas');
  const allAlicerces = await api('/alicerces');
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h1 class="page-title">Equipes de Trabalho</h1>
    <p class="page-subtitle">Responsabilidades, membros, tarefas e cronograma de cada equipe</p>
    <div class="team-grid">
      ${teamsCache.map(t => {
        const teamTasks = allTasks.filter(task => task.responsible_team === t.name);
        const teamSchedule = allSchedule.filter(s => (s.responsible_team || '').includes(t.name));
        const teamLembrancinhas = allLembrancinhas.filter(l => l.team === t.name);
        const teamAlicerces = allAlicerces.filter(a => a.constructor_name && a.constructor_name.includes(t.name));
        const tasksDone = teamTasks.filter(task => task.status === 'concluido').length;
        const tasksPct = teamTasks.length > 0 ? Math.round((tasksDone / teamTasks.length) * 100) : 0;
        const schedDone = teamSchedule.filter(s => s.status === 'concluido').length;
        return `<div class="team-card">
          <div class="team-card-header">
            <h3>${t.name}</h3>
            <span class="team-count">${t.members?.length || 0} membros</span>
          </div>
          <p>${t.description}</p>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            <span class="tag tag-team" style="font-size:11px">📋 ${teamTasks.length} tarefas</span>
            <span class="tag tag-deadline" style="font-size:11px">🗓️ ${teamSchedule.length} no cronograma</span>
            ${teamLembrancinhas.length > 0 ? `<span class="tag tag-priority-media" style="font-size:11px">🎁 ${teamLembrancinhas.length} lembrancinhas</span>` : ''}
            ${teamAlicerces.length > 0 ? `<span class="tag tag-priority-alta" style="font-size:11px">🏛️ ${teamAlicerces.length} pistas</span>` : ''}
          </div>

          ${teamTasks.length > 0 ? `
            <div class="team-progress">
              <div class="progress-label">
                <span>Tarefas: ${tasksDone}/${teamTasks.length}</span>
                <span>${tasksPct}%</span>
              </div>
              <div class="team-progress-bar"><div class="team-progress-fill" style="width:${tasksPct}%"></div></div>
            </div>
          ` : ''}

          ${teamSchedule.length > 0 ? `
            <div class="team-section">
              <div class="team-section-title">📅 No Encontro (${schedDone}/${teamSchedule.length} concluídas)</div>
              <div class="team-section-content">
                ${teamSchedule.map(s => `<div class="team-sched-row">
                  <span class="team-sched-time">${s.time}</span>
                  <span class="team-sched-activity">${s.activity}</span>
                  <span class="team-sched-day">${s.day.replace('-feira','')}</span>
                  <span class="team-sched-dot" style="background:${s.status==='concluido'?'var(--success)':'var(--border)'}"></span>
                </div>`).join('')}
              </div>
            </div>
          ` : ''}

          ${teamTasks.length > 0 ? `
            <div class="team-section">
              <div class="team-section-title">📋 Tarefas de Preparação</div>
              <div class="team-section-content">
                ${teamTasks.map(task => `<div class="team-task-row">
                  <span class="team-task-dot ${task.status==='concluido'?'done':task.status==='em_andamento'?'in-progress':''}"></span>
                  <span style="color:var(--text-light);font-weight:600;min-width:28px">[${task.item_number}]</span>
                  <span style="color:var(--text);flex:1">${task.title}</span>
                  <span style="color:var(--text-light);font-size:10px;white-space:nowrap">${task.deadline || ''}</span>
                </div>`).join('')}
              </div>
            </div>
          ` : ''}

          ${teamLembrancinhas.length > 0 ? `
            <div class="team-section">
              <div class="team-section-title">🎁 Lembrancinhas</div>
              ${teamLembrancinhas.map(l => `<div class="team-mini-row">
                <span style="color:var(--text);flex:1">${l.item_name || '—'}</span>
                <span style="color:var(--text-light);font-size:10px">${l.quantity_done || 0}/${l.quantity_needed || 0}</span>
                <span class="team-mini-badge" style="background:${l.status==='pronto'?'var(--success)':l.status==='em_andamento'?'var(--warning)':'var(--border)'}">${(l.status||'—').replace(/_/g,' ')}</span>
              </div>`).join('')}
            </div>
          ` : ''}

          ${teamAlicerces.length > 0 ? `
            <div class="team-section">
              <div class="team-section-title">🏛️ Alicerces/Alvenarias</div>
              ${teamAlicerces.map(a => `<div class="team-mini-row">
                <span style="color:var(--text);flex:1">${a.title}</span>
                <span class="team-mini-badge" style="background:${a.status==='concluido'?'var(--success)':a.status==='atribuido'?'var(--warning)':'var(--border)'}">${(a.status||'—').replace(/_/g,' ')}</span>
              </div>`).join('')}
            </div>
          ` : ''}

          ${t.members?.length ? `<ul class="team-members-list">${t.members.map(m => `<li>
            <span><span class="team-member-name">${m.name}</span> ${m.role ? `<span class="team-member-role">(${m.role})</span>` : ''}${m.phone ? ` <span style="font-size:10px;color:var(--text-light)">📞 ${m.phone}</span>` : ''}</span>
            <button class="btn-icon" onclick="removeMember(${t.id},${m.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </li>`).join('')}</ul>` : '<p style="font-size:12px;color:var(--text-light);padding-top:8px;border-top:1px solid var(--border)">Nenhum membro cadastrado</p>'}
          <button class="btn btn-secondary btn-sm" style="margin-top:12px;width:100%" onclick="addMember(${t.id})">+ Adicionar Membro</button>
        </div>`;
      }).join('')}
    </div>
  `;
}

function addMember(teamId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>Adicionar Membro</h3>
    <div class="form-group"><label>Nome</label><input id="m-name"></div>
    <div class="form-group"><label>Função</label><input id="m-role"></div>
    <div class="form-row">
      <div class="form-group"><label>Telefone</label><input id="m-phone"></div>
      <div class="form-group"><label>Email</label><input id="m-email"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveMember(${teamId}, this)">Adicionar</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function saveMember(teamId, btn) {
  const data = {
    name: document.getElementById('m-name').value,
    role: document.getElementById('m-role').value,
    phone: document.getElementById('m-phone').value,
    email: document.getElementById('m-email').value,
  };
  await api(`/teams/${teamId}/members`, { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Membro adicionado!', 'success');
  renderEquipes();
}

async function removeMember(teamId, memberId) {
  await api(`/teams/${teamId}/members/${memberId}`, { method: 'DELETE' });
  toast('Membro removido', 'error');
  renderEquipes();
}

// ============ ENCONTRO ============
async function renderEncontro() {
  const enc = await api('/encounter');
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h1 class="page-title">Dados do Encontro</h1>
    <p class="page-subtitle">Informações gerais do Encontro Compromisso Trin</p>
    <div class="card">
      <div class="encounter-info">
        <div class="info-item"><label>📛 Nome</label><div class="info-value">${enc.name || '—'}</div></div>
        <div class="info-item"><label>📅 Data de Início</label><div class="info-value">${enc.start_date || '—'}</div></div>
        <div class="info-item"><label>🏁 Data de Fim</label><div class="info-value">${enc.end_date || '—'}</div></div>
        <div class="info-item"><label>📍 Local</label><div class="info-value">${enc.location || '—'}</div></div>
        <div class="info-item"><label>🎨 Tema</label><div class="info-value">${enc.theme || '—'}</div></div>
        <div class="info-item"><label>🎵 Música Tema</label><div class="info-value">${enc.theme_song || '—'}</div></div>
        <div class="info-item"><label>📊 Status</label><div class="info-value">${statusLabel(enc.status || 'em_preparacao')}</div></div>
      </div>
      <button class="btn btn-primary" onclick="editEncontro(${enc.id || 0})">✏️ Editar Dados</button>
    </div>
  `;
}

function editEncontro(id) {
  const enc = {};
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>Editar Encontro</h3>
    <div class="form-group"><label>Nome</label><input id="e-name" placeholder="Ex: XXV Compromisso Trin"></div>
    <div class="form-row">
      <div class="form-group"><label>Data Início</label><input type="date" id="e-start"></div>
      <div class="form-group"><label>Data Fim</label><input type="date" id="e-end"></div>
    </div>
    <div class="form-group"><label>Local (Canteiro de Obras)</label><input id="e-location"></div>
    <div class="form-group"><label>Tema do Encontro</label><input id="e-theme"></div>
    <div class="form-group"><label>Música Tema</label><input id="e-song"></div>
    <div class="form-group"><label>Status</label><select id="e-status">
      <option value="em_preparacao">Em Preparação</option>
      <option value="realizado">Realizado</option>
      <option value="cancelado">Cancelado</option>
    </select></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveEncontro(${id}, this)">Salvar</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function saveEncontro(id, btn) {
  const data = {
    name: document.getElementById('e-name').value,
    start_date: document.getElementById('e-start').value,
    end_date: document.getElementById('e-end').value,
    location: document.getElementById('e-location').value,
    theme: document.getElementById('e-theme').value,
    theme_song: document.getElementById('e-song').value,
    status: document.getElementById('e-status').value,
  };
  if (id) await api(`/encounter/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Dados salvos!', 'success');
  renderEncontro();
}

// ============ RELATÓRIOS ============
function renderRelatorios() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h1 class="page-title">Relatórios PDF</h1>
    <p class="page-subtitle">Gere relatórios em PDF para análise, acompanhamento e impressão</p>

    <div class="card" style="margin-bottom:20px;border:2px solid var(--jumire-green);border-left:6px solid var(--jumire-green)">
      <div class="card-title">🛠️ Relatório de Preparação — Antes do Encontro</div>
      <p style="font-size:12px;color:var(--text-light);margin-bottom:12px">Relatório completo e profissional de tudo que envolve a preparação pré-encontro: sumário executivo, progresso por categoria, tarefas atrasadas, equipes e membros, situação financeira detalhada, matérias-primas, fornecedores, escolinhas, avisos, prazos automáticos e checklist final.</p>
      <a class="btn-pdf" href="/reports/preparation" target="_blank" style="border-left:4px solid var(--jumire-green)">
        <div class="btn-pdf-icon" style="background:rgba(45,134,89,0.15);color:var(--jumire-green);font-size:28px">🛠️</div>
        <div class="btn-pdf-info"><h4>Relatório de Preparação (Completo)</h4><p>Visão total da preparação pré-encontro para coordenação</p></div>
      </a>
    </div>

    <div class="card" style="margin-bottom:20px;border:2px solid var(--primary);border-left:6px solid var(--jumire-green)">
      <div class="card-title">📕 Guia do Coordenador — Dias do Encontro</div>
      <p style="font-size:12px;color:var(--text-light);margin-bottom:12px">Relatório completo para impressão e uso durante os 3 dias do Encontro. Inclui contatos de equipes, cronograma, alicerces/alvenarias, matérias-primas com restrições, padrinhos, avisos, tarefas pendentes, fornecedores e espaço para anotações.</p>
      <a class="btn-pdf" href="/reports/coordinator-guide" target="_blank" style="border-left:4px solid var(--primary)">
        <div class="btn-pdf-icon" style="background:rgba(192,57,43,0.15);color:var(--primary);font-size:28px">📕</div>
        <div class="btn-pdf-info"><h4>Guia do Coordenador (Completo)</h4><p>Tudo que o coordenador precisa durante o Encontro em um só PDF</p></div>
      </a>
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card-title">📋 Relatórios Gerais</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
        <a class="btn-pdf" href="/reports/full" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(192,57,43,0.15);color:var(--primary)">📄</div>
          <div class="btn-pdf-info"><h4>Relatório Geral Completo</h4><p>Todas as tarefas, cronograma e equipes</p></div>
        </a>
        <a class="btn-pdf" href="/reports/schedule" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(26,58,92,0.15);color:var(--secondary)">🗓️</div>
          <div class="btn-pdf-info"><h4>Roteiro Geral do Encontro</h4><p>Cronograma completo Sexta a Domingo</p></div>
        </a>
        <a class="btn-pdf" href="/reports/teams" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(52,152,219,0.15);color:var(--info)">👥</div>
          <div class="btn-pdf-info"><h4>Relatório por Equipes</h4><p>Progresso e membros de cada equipe</p></div>
        </a>
        <a class="btn-pdf" href="/reports/team-schedule" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(241,196,15,0.15);color:var(--warning)">📅</div>
          <div class="btn-pdf-info"><h4>Programa por Equipe</h4><p>Cronograma e tarefas de cada equipe no Encontro</p></div>
        </a>
      </div>
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card-title">👥 Para Equipes e MO's</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
        <a class="btn-pdf" href="/reports/participants" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(192,57,43,0.15);color:var(--primary)">🧍</div>
          <div class="btn-pdf-info"><h4>Lista de Matérias-primas</h4><p>Inscritos, grupos, quartos, restrições e pagamentos</p></div>
        </a>
        <a class="btn-pdf" href="/reports/kit" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(45,134,89,0.15);color:var(--jumire-green)">🎒</div>
          <div class="btn-pdf-info"><h4>Kit da Matéria-prima</h4><p>Checklist do RH — itens e controle por inscrito</p></div>
        </a>
        <a class="btn-pdf" href="/reports/alicerces" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(155,89,182,0.15);color:#9b59b6">🏛️</div>
          <div class="btn-pdf-info"><h4>Mapa de Alicerces e Alvenarias</h4><p>Construtores, horários e conteúdo das pistas</p></div>
        </a>
        <a class="btn-pdf" href="/reports/lembrancinhas" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(230,126,34,0.15);color:var(--accent)">🎁</div>
          <div class="btn-pdf-info"><h4>Lista de Lembrancinhas</h4><p>Status de confecção por equipe e quantidades</p></div>
        </a>
      </div>
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card-title">📊 Para Supervisores e Coordenação</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
        <a class="btn-pdf" href="/reports/finance" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(39,174,96,0.15);color:var(--success)">💰</div>
          <div class="btn-pdf-info"><h4>Relatório Financeiro</h4><p>Receitas, despesas, saldo e lançamentos por categoria</p></div>
        </a>
        <a class="btn-pdf" href="/reports/fornecedores" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(52,152,219,0.15);color:var(--info)">📦</div>
          <div class="btn-pdf-info"><h4>Fornecedores</h4><p>Contatos, cotações e status de contratação</p></div>
        </a>
        <a class="btn-pdf" href="/reports/avisos" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(241,196,15,0.15);color:var(--warning)">📢</div>
          <div class="btn-pdf-info"><h4>Mural de Avisos</h4><p>Comunicados fixados e prioritários para impressão</p></div>
        </a>
        <a class="btn-pdf" href="/reports/lembretes" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(192,57,43,0.15);color:var(--primary)">🔔</div>
          <div class="btn-pdf-info"><h4>Relatório de Lembretes</h4><p>Prazos automáticos e lembretes manuais por módulo</p></div>
        </a>
        <a class="btn-pdf" href="/reports/escolinhas" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(44,123,229,0.15);color:var(--primary)">📅</div>
          <div class="btn-pdf-info"><h4>Calendário de Escolinhas 2026</h4><p>Eventos e escolinhas de preparação com datas</p></div>
        </a>
      </div>
    </div>

    <div class="card">
      <div class="card-title">🏗️ Relatórios por Categoria de Tarefa</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
        <a class="btn-pdf" href="/reports/category/Espa%C3%A7o%20F%C3%ADsico%20-%20Canteiro%20de%20Obras" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(39,174,96,0.15);color:var(--success)">🏗️</div>
          <div class="btn-pdf-info"><h4>Espaço Físico</h4><p>Canteiro de Obras e momentos extras</p></div>
        </a>
        <a class="btn-pdf" href="/reports/category/Traslado" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(230,126,34,0.15);color:var(--accent)">🚛</div>
          <div class="btn-pdf-info"><h4>Traslado</h4><p>Transporte, ônibus e logística</p></div>
        </a>
        <a class="btn-pdf" href="/reports/category/Impressos%20e%20Materiais%20Gr%C3%A1ficos" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(155,89,182,0.15);color:#9b59b6">📋</div>
          <div class="btn-pdf-info"><h4>Impressos e Gráficos</h4><p>Materiais gráficos e lembrancinhas</p></div>
        </a>
        <a class="btn-pdf" href="/reports/category/Cozinha%20e%20Servi%C3%A7os%20Gerais" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(241,196,15,0.15);color:var(--warning)">🍳</div>
          <div class="btn-pdf-info"><h4>Cozinha e Serviços</h4><p>Alimentação e produtos de limpeza</p></div>
        </a>
        <a class="btn-pdf" href="/reports/category/Materiais%20para%20Capela" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(243,156,18,0.15);color:var(--accent)">⛪</div>
          <div class="btn-pdf-info"><h4>Materiais para Capela</h4><p>Sacrário, ostensório e itens litúrgicos</p></div>
        </a>
        <a class="btn-pdf" href="/reports/category/Mestres%20de%20Obras" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(44,62,80,0.15);color:var(--secondary)">👷</div>
          <div class="btn-pdf-info"><h4>Mestres de Obras</h4><p>Tarefas específicas dos Mestres</p></div>
        </a>
      </div>
    </div>
  `;
}

// ============ HELPERS ============
async function updateStats() {
  const stats = await api('/stats');
  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  updateSidebarProgress(pct);
}

function updateSidebarProgress(pct) {
  document.getElementById('sidebar-progress').style.width = pct + '%';
  document.getElementById('sidebar-progress-text').textContent = pct + '% concluído';
}

// ============ MATÉRIAS-PRIMAS (INSCRITOS) ============
let participantsCache = [];

async function renderInscritos() {
  participantsCache = await api('/participants');
  const main = document.getElementById('main-content');
  const groups = [...new Set(participantsCache.map(p => p.group).filter(Boolean))].sort();
  const paidCount = participantsCache.filter(p => p.paid).length;
  const pendingCount = participantsCache.filter(p => !p.paid).length;
  const presentesCount = participantsCache.filter(p => p.presente).length;
  main.innerHTML = `
    <h1 class="page-title">Matérias-primas</h1>
    <p class="page-subtitle">Gestão de inscritos — Ficha de Inscrição Final do Manual</p>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon total">👥</div><div class="stat-info"><h3>${participantsCache.length}</h3><p>Total Inscritos</p></div></div>
      <div class="stat-card"><div class="stat-icon done">✅</div><div class="stat-info"><h3>${paidCount}</h3><p>Pagamentos Confirmados</p></div></div>
      <div class="stat-card"><div class="stat-icon pending">⭕</div><div class="stat-info"><h3>${pendingCount}</h3><p>Pagamentos Pendentes</p></div></div>
      <div class="stat-card"><div class="stat-icon progress">📍</div><div class="stat-info"><h3>${presentesCount}</h3><p>Presentes no Encontro</p></div></div>
    </div>
    <div class="filters">
      <input type="text" class="search-box" id="part-search" placeholder="Buscar por nome..." oninput="filterParticipants()">
      <div class="filter-group">
        <span class="filter-label">Grupo:</span>
        <select id="part-group" onchange="filterParticipants()">
          <option value="">Todos</option>
          ${groups.map(g => `<option value="${g}">${g}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openParticipantModal()">+ Nova Inscrição</button>
    </div>
    <div id="participants-list" class="participant-grid"></div>
  `;
  renderParticipantCards(participantsCache);
}

function filterParticipants() {
  const search = document.getElementById('part-search').value.toLowerCase();
  const group = document.getElementById('part-group').value;
  let filtered = participantsCache;
  if (search) filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(search));
  if (group) filtered = filtered.filter(p => p.group === group);
  renderParticipantCards(filtered);
}

function renderParticipantCards(list) {
  const container = document.getElementById('participants-list');
  if (list.length === 0) { container.innerHTML = '<div class="empty-state"><p>Nenhuma matéria-prima inscrita. Clique em "+ Nova Inscrição" para começar.</p></div>'; return; }
  container.innerHTML = list.map(p => {
    const displayName = prettifyPersonName(p.name);
    const displayPadrinho = prettifyPersonName(p.padrinho, { couple: true });
    const initials = (displayName || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return `<div class="participant-card ${p.paid ? 'paid' : 'pending-payment'}">
    <div class="participant-name"><div class="participant-avatar">${initials}</div>${displayName || 'Sem nome'} ${p.paid ? '<span class="badge-sm badge-success">Pago</span>' : '<span class="badge-sm badge-warning">Pendente</span>'} ${p.presente ? '<span class="badge-sm badge-info">Presente</span>' : ''}</div>
    <div class="participant-info">
      ${p.cracha_name ? `<div class="participant-info-row">🏷️ Crachá: ${p.cracha_name}</div>` : ''}
      ${p.age ? `<div class="participant-info-row">🎂 Idade: ${p.age} anos</div>` : ''}
      ${p.gender ? `<div class="participant-info-row">👤 Sexo: ${p.gender === 'MASC' ? 'Masculino' : 'Feminino'}</div>` : ''}
      ${p.phone ? `<div class="participant-info-row">📞 Tel: ${p.phone}</div>` : ''}
      ${p.food_restriction ? `<div class="participant-info-row">⚠️ Restrição: ${p.food_restriction}</div>` : ''}
      ${p.medication ? `<div class="participant-info-row">💊 Medicação: ${p.medication}</div>` : ''}
      ${p.special_needs ? `<div class="participant-info-row">♿ Necessidades especiais: ${p.special_needs}</div>` : ''}
      ${p.shirt_size ? `<div class="participant-info-row">👕 Camiseta: ${p.shirt_size}</div>` : ''}
      ${p.group ? `<div class="participant-info-row">👥 Grupo: ${p.group}</div>` : ''}
      ${p.room ? `<div class="participant-info-row">🚪 Quarto: ${p.room}</div>` : ''}
      ${displayPadrinho ? `<div class="participant-info-row">❤️ Padrinho/Madrinha: ${displayPadrinho}</div>` : ''}
    </div>
    <div class="participant-tags">
      <button class="btn-icon" onclick="togglePaid(${p.id})" title="${p.paid ? 'Marcar como não pago' : 'Marcar como pago'}">
        ${p.paid ? '✅' : '⭕'}
      </button>
      <button class="btn-icon" onclick="togglePresente(${p.id})" title="${p.presente ? 'Marcar como ausente' : 'Marcar como presente'}">
        ${p.presente ? '📍' : '🏁'}
      </button>
      <button class="btn-icon" onclick="openParticipantModal(${p.id})" title="Editar">✏️</button>
      <button class="btn-icon" onclick="deleteParticipant(${p.id})" title="Excluir">🗑️</button>
    </div>
  </div>`;
  }).join('');
}

async function togglePaid(id) {
  const p = participantsCache.find(p => p.id === id);
  await api(`/participants/${id}/paid`, { method: 'PATCH', body: JSON.stringify({ paid: !p.paid }) });
  p.paid = !p.paid;
  renderParticipantCards(participantsCache);
  toast(p.paid ? 'Pagamento confirmado!' : 'Pagamento marcado como pendente', p.paid ? 'success' : '');
}

async function togglePresente(id) {
  const p = participantsCache.find(p => p.id === id);
  await api(`/participants/${id}/presente`, { method: 'PATCH', body: JSON.stringify({ presente: !p.presente }) });
  p.presente = !p.presente;
  renderParticipantCards(participantsCache);
  toast(p.presente ? 'Presença confirmada!' : 'Marcado como ausente', p.presente ? 'success' : '');
}

async function deleteParticipant(id) {
  if (!confirm('Excluir esta inscrição?')) return;
  await api(`/participants/${id}`, { method: 'DELETE' });
  participantsCache = participantsCache.filter(p => p.id !== id);
  renderParticipantCards(participantsCache);
  toast('Inscrição excluída', 'error');
}

function openParticipantModal(id) {
  const p = id ? participantsCache.find(p => p.id === id) : null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal" style="max-width:640px">
    <h3>${p ? 'Editar Inscrição' : 'Nova Inscrição - Ficha Final'}</h3>
    <div class="form-row">
      <div class="form-group"><label>Nome Completo</label><input id="p-name" value="${p?.name || ''}"></div>
      <div class="form-group"><label>Nome no Crachá</label><input id="p-cracha" value="${p?.cracha_name || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Idade</label><input id="p-age" type="number" value="${p?.age || ''}"></div>
      <div class="form-group"><label>Data Nasc.</label><input id="p-birth" type="date" value="${p?.birth_date || ''}"></div>
      <div class="form-group"><label>Sexo</label><select id="p-gender"><option value="" selected>—</option><option value="MASC" ${p?.gender==='MASC'?'selected':''}>Masculino</option><option value="FEM" ${p?.gender==='FEM'?'selected':''}>Feminino</option></select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Telefone</label><input id="p-phone" value="${p?.phone || ''}"></div>
      <div class="form-group"><label>WhatsApp</label><input id="p-wpp" value="${p?.whatsapp || ''}"></div>
      <div class="form-group"><label>Email</label><input id="p-email" value="${p?.email || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Escola/Trabalho</label><input id="p-school" value="${p?.school || ''}"></div>
      <div class="form-group"><label>Tamanho Camiseta</label><select id="p-shirt"><option value="">—</option>${['Baby','PP','P','M','G','GG','XGG'].map(s=>`<option value="${s}" ${p?.shirt_size===s?'selected':''}>${s}</option>`).join('')}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Nome do Pai</label><input id="p-father" value="${p?.father_name || ''}"></div>
      <div class="form-group"><label>Tel. Pai</label><input id="p-father-phone" value="${p?.father_phone || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Nome da Mãe</label><input id="p-mother" value="${p?.mother_name || ''}"></div>
      <div class="form-group"><label>Tel. Mãe</label><input id="p-mother-phone" value="${p?.mother_phone || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Restrição Alimentar</label><input id="p-food" value="${p?.food_restriction || ''}" placeholder="Ex: Alergia a glúten"></div>
      <div class="form-group"><label>Medicação Controlada</label><input id="p-med" value="${p?.medication || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Necessidades Especiais</label><input id="p-needs" value="${p?.special_needs || ''}"></div>
      <div class="form-group"><label>Indicado Por</label><input id="p-indicated" value="${p?.indicated_by || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Grupo</label><input id="p-group" value="${p?.group || ''}" placeholder="Ex: Grupo 1"></div>
      <div class="form-group"><label>Quarto</label><input id="p-room" value="${p?.room || ''}" placeholder="Ex: Quarto 3"></div>
      <div class="form-group"><label>Padrinho/Madrinha</label><input id="p-padrinho" value="${p?.padrinho || ''}"></div>
    </div>
    <div class="form-group"><label>Observações</label><textarea id="p-notes" rows="2">${p?.notes || ''}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveParticipant(${id || 'null'}, this)">${p ? 'Salvar' : 'Cadastrar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function saveParticipant(id, btn) {
  const data = {
    name: val('p-name'), cracha_name: val('p-cracha'), age: val('p-age'), birth_date: val('p-birth'),
    gender: val('p-gender'), phone: val('p-phone'), whatsapp: val('p-wpp'), email: val('p-email'),
    school: val('p-school'), shirt_size: val('p-shirt'), father_name: val('p-father'), father_phone: val('p-father-phone'),
    mother_name: val('p-mother'), mother_phone: val('p-mother-phone'), food_restriction: val('p-food'),
    medication: val('p-med'), special_needs: val('p-needs'), indicated_by: val('p-indicated'),
    group: val('p-group'), room: val('p-room'), padrinho: val('p-padrinho'), notes: val('p-notes'),
  };
  if (id) await api(`/participants/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  else await api('/participants', { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Inscrição salva!', 'success');
  renderInscritos();
}

function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }

// ============ FINANCEIRO ============
let financeCache = [];
let financeCategoriesCache = [];
let financeEventsCache = [];
let financeBudgetCache = [];
let financeAnalyticsCache = null;
let financeCharts = {};
let financeTab = 'overview';

const FINANCE_CATEGORIES = {
  receita: ['Inscrições', 'Doações', 'Bazar', 'Camisetas', 'Apadrinhamento', 'Contribuições de Equipes', 'Betoneiras', 'Outros'],
  despesa: ['Espaço Físico', 'Traslado', 'Alimentação', 'Materiais Gráficos', 'Camisetas', 'Bíblias', 'Capela', 'Som e Técnica', 'Lembrancinhas', 'Decoração', 'Rosas', 'Bazar', 'Higienização', 'Equipamentos', 'Primeiros Socorros', 'Hospedagem', 'Honorários', 'Diversos', 'Outros'],
};

const FINANCE_EVENT_TYPES = ['Evento', 'Bazar', 'Rifa', 'Campanha', 'Jantar', 'Show', 'Sorteio', 'Outro'];
const FINANCE_EVENT_STATUS = ['planejado', 'em_andamento', 'concluido', 'cancelado'];

async function renderFinanceiro() {
  financeCache = await api('/finance');
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h1 class="page-title">Controle Financeiro</h1>
    <p class="page-subtitle">Gestão completa: lançamentos, análises, categorias, eventos e orçamento</p>
    <div class="tab-bar" id="fin-tabs">
      <button class="tab-btn active" onclick="switchFinanceTab('overview')">📊 Visão Geral</button>
      <button class="tab-btn" onclick="switchFinanceTab('lancamentos')">💰 Lançamentos</button>
      <button class="tab-btn" onclick="switchFinanceTab('categorias')">📁 Categorias</button>
      <button class="tab-btn" onclick="switchFinanceTab('eventos')">📅 Eventos</button>
      <button class="tab-btn" onclick="switchFinanceTab('orcamento')">🎯 Orçamento</button>
    </div>
    <div id="fin-tab-content"></div>
  `;
  await switchFinanceTab(financeTab);
}

async function switchFinanceTab(tab) {
  financeTab = tab;
  document.querySelectorAll('#fin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  const btns = document.querySelectorAll('#fin-tabs .tab-btn');
  const tabMap = { overview: 0, lancamentos: 1, categorias: 2, eventos: 3, orcamento: 4 };
  if (btns[tabMap[tab]]) btns[tabMap[tab]].classList.add('active');
  Object.values(financeCharts).forEach(c => { try { c.destroy(); } catch(e){} });
  financeCharts = {};
  const content = document.getElementById('fin-tab-content');
  if (!content) return;
  if (tab === 'overview') await renderFinOverview(content);
  else if (tab === 'lancamentos') await renderFinLancamentos(content);
  else if (tab === 'categorias') await renderFinCategorias(content);
  else if (tab === 'eventos') await renderFinEventos(content);
  else if (tab === 'orcamento') await renderFinOrcamento(content);
}

// ===== VISÃO GERAL (charts) =====
async function renderFinOverview(container) {
  financeAnalyticsCache = await api('/finance/analytics');
  const a = financeAnalyticsCache;
  const balance = a.totalIncome - a.totalExpenses;
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  container.innerHTML = `
    <div class="finance-summary">
      <div class="finance-card income"><div class="label">Receitas</div><div class="amount">R$ ${a.totalIncome.toFixed(2)}</div></div>
      <div class="finance-card expense"><div class="label">Despesas</div><div class="amount">R$ ${a.totalExpenses.toFixed(2)}</div></div>
      <div class="finance-card balance"><div class="label">Saldo</div><div class="amount">R$ ${balance.toFixed(2)}</div></div>
      <div class="finance-card pending"><div class="label">A Receber</div><div class="amount">R$ ${a.totalPendingIncome.toFixed(2)}</div></div>
      <div class="finance-card pending"><div class="label">A Pagar</div><div class="amount">R$ ${a.totalPendingExpenses.toFixed(2)}</div></div>
    </div>
    <div class="fin-charts-grid">
      <div class="card"><div class="card-title">Receitas vs Despesas por Mês</div><canvas id="chart-monthly" height="200"></canvas></div>
      <div class="card"><div class="card-title">Despesas por Categoria</div><canvas id="chart-exp-cat" height="200"></canvas></div>
      <div class="card"><div class="card-title">Receitas por Categoria</div><canvas id="chart-inc-cat" height="200"></canvas></div>
      <div class="card"><div class="card-title">Status de Pagamentos</div><canvas id="chart-payment" height="200"></canvas></div>
    </div>
    <div class="fin-overview-grid">
      <div class="card">
        <div class="card-title">Top 10 Despesas</div>
        <div class="fin-top-list">
          ${a.topExpenses.length === 0 ? '<p class="empty-state">Nenhuma despesa.</p>' :
            a.topExpenses.map(e => `<div class="fin-top-item"><span class="fin-top-desc">${e.description || '—'}</span><span class="fin-top-cat">${e.category || '—'}</span><span class="fin-top-val" style="color:var(--danger)">R$ ${(e.amount||0).toFixed(2)}</span></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Top 10 Receitas</div>
        <div class="fin-top-list">
          ${a.topRevenues.length === 0 ? '<p class="empty-state">Nenhuma receita.</p>' :
            a.topRevenues.map(e => `<div class="fin-top-item"><span class="fin-top-desc">${e.description || '—'}</span><span class="fin-top-cat">${e.category || '—'}</span><span class="fin-top-val" style="color:var(--success)">R$ ${(e.amount||0).toFixed(2)}</span></div>`).join('')}
        </div>
      </div>
    </div>
  `;

  // Monthly chart
  const months = Object.keys(a.monthly).sort();
  if (months.length > 0) {
    const ctx = document.getElementById('chart-monthly');
    if (ctx) financeCharts.monthly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months.map(m => { const [y, mo] = m.split('-'); return `${monthNames[parseInt(mo)-1]}/${y}`; }),
        datasets: [
          { label: 'Receitas', data: months.map(m => a.monthly[m].receita), backgroundColor: '#27ae60' },
          { label: 'Despesas', data: months.map(m => a.monthly[m].despesa), backgroundColor: '#c0392b' },
        ]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
    });
  }

  // Expense category doughnut
  const expCats = Object.entries(a.byCategory).filter(([_, v]) => v.despesa > 0).sort((a, b) => b[1].despesa - a[1].despesa);
  const ctxExp = document.getElementById('chart-exp-cat');
  if (ctxExp && expCats.length > 0) financeCharts.expCat = new Chart(ctxExp, {
    type: 'doughnut',
    data: { labels: expCats.map(([k]) => k), datasets: [{ data: expCats.map(([_, v]) => v.despesa), backgroundColor: ['#c0392b','#e74c3c','#f39c12','#d4a017','#1a3a5c','#234c72','#2d8659','#8e44ad','#7f8c8d','#e67e22','#3498db','#95a5a6'] }] },
    options: { responsive: true, plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } } }
  });

  // Income category doughnut
  const incCats = Object.entries(a.byCategory).filter(([_, v]) => v.receita > 0).sort((a, b) => b[1].receita - a[1].receita);
  const ctxInc = document.getElementById('chart-inc-cat');
  if (ctxInc && incCats.length > 0) financeCharts.incCat = new Chart(ctxInc, {
    type: 'doughnut',
    data: { labels: incCats.map(([k]) => k), datasets: [{ data: incCats.map(([_, v]) => v.receita), backgroundColor: ['#27ae60','#2d8659','#16a085','#1abc9c','#2ecc71','#f1c40f','#e67e22','#d4a017','#1a3a5c','#3498db'] }] },
    options: { responsive: true, plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } } }
  });

  // Payment status pie
  const ctxPay = document.getElementById('chart-payment');
  if (ctxPay) financeCharts.payment = new Chart(ctxPay, {
    type: 'pie',
    data: { labels: ['Pagos', 'Pendentes'], datasets: [{ data: [a.paymentStatus.paid, a.paymentStatus.pending], backgroundColor: ['#27ae60', '#f39c12'] }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

// ===== LANÇAMENTOS =====
async function renderFinLancamentos(container) {
  const summary = await api('/finance/summary');
  container.innerHTML = `
    <div class="finance-summary">
      <div class="finance-card income"><div class="label">Receitas</div><div class="amount">R$ ${summary.income.toFixed(2)}</div></div>
      <div class="finance-card expense"><div class="label">Despesas</div><div class="amount">R$ ${summary.expenses.toFixed(2)}</div></div>
      <div class="finance-card balance"><div class="label">Saldo</div><div class="amount">R$ ${summary.balance.toFixed(2)}</div></div>
      <div class="finance-card pending"><div class="label">A Receber</div><div class="amount">R$ ${summary.pendingIncome.toFixed(2)}</div></div>
      <div class="finance-card pending"><div class="label">A Pagar</div><div class="amount">R$ ${summary.pendingExpenses.toFixed(2)}</div></div>
    </div>
    <div class="filters">
      <div class="filter-group">
        <span class="filter-label">Tipo:</span>
        <select id="fin-type" onchange="filterFinance(); populateFinanceCategoryDropdown(this.value)">
          <option value="">Todos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">Categoria:</span>
        <select id="fin-category" onchange="filterFinance()">
          <option value="">Todas</option>
        </select>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openFinanceModal()">+ Lançamento</button>
    </div>
    <div class="card finance-table-card">
      <table class="data-table" id="finance-table">
        <thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Resp.</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
      <div class="finance-cards" id="finance-cards"></div>
    </div>
  `;
  renderFinanceTable(financeCache);
  populateFinanceCategoryDropdown();
}

function filterFinance() {
  const type = document.getElementById('fin-type').value;
  const category = document.getElementById('fin-category').value;
  let filtered = financeCache;
  if (type) filtered = filtered.filter(f => f.type === type);
  if (category) filtered = filtered.filter(f => f.category === category);
  renderFinanceTable(filtered);
}

function populateFinanceCategoryDropdown(selectedType, selectedCategory) {
  const sel = document.getElementById('fin-category');
  if (!sel) return;
  const currentVal = selectedCategory !== undefined ? selectedCategory : sel.value;
  const cats = selectedType ? (FINANCE_CATEGORIES[selectedType] || []) : [...new Set([...FINANCE_CATEGORIES.receita, ...FINANCE_CATEGORIES.despesa])];
  sel.innerHTML = '<option value="">Todas</option>' + cats.map(c => `<option value="${c}" ${c === currentVal ? 'selected' : ''}>${c}</option>`).join('');
}

function renderFinanceTable(list) {
  const tbody = document.querySelector('#finance-table tbody');
  const cardsContainer = document.getElementById('finance-cards');
  if (!tbody) return;
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-light);padding:20px">Nenhum lançamento.</td></tr>';
    cardsContainer.innerHTML = '<div class="empty-state"><p>Nenhum lançamento.</p></div>';
    return;
  }
  tbody.innerHTML = list.map(f => `<tr>
    <td>${f.date ? new Date(f.date).toLocaleDateString('pt-BR') : '—'}</td>
    <td><span class="badge-sm ${f.type==='receita'?'badge-success':'badge-danger'}">${f.type==='receita'?'Receita':'Despesa'}</span></td>
    <td>${f.category || '—'}</td>
    <td>${f.description || '—'}</td>
    <td style="font-weight:600;color:${f.type==='receita'?'var(--success)':'var(--danger)'}">R$ ${(f.amount||0).toFixed(2)}</td>
    <td>${f.paid ? '<span class="badge-sm badge-success">Pago</span>' : '<span class="badge-sm badge-warning">Pendente</span>'}</td>
    <td>${f.responsible || '—'}</td>
    <td>
      <button class="btn-icon" onclick="openFinanceModal(${f.id})">✏️</button>
      <button class="btn-icon" onclick="deleteFinance(${f.id})">🗑️</button>
    </td>
  </tr>`).join('');
  cardsContainer.innerHTML = list.map(f => `<div class="finance-item-card ${f.type==='receita'?'income':'expense'}">
    <div class="finance-item-top">
      <span class="badge-sm ${f.type==='receita'?'badge-success':'badge-danger'}">${f.type==='receita'?'Receita':'Despesa'}</span>
      <span class="finance-item-amount" style="color:${f.type==='receita'?'var(--success)':'var(--danger)'}">R$ ${(f.amount||0).toFixed(2)}</span>
    </div>
    <div class="finance-item-desc">${f.description || '—'}</div>
    <div class="finance-item-meta">
      <span>📁 ${f.category || '—'}</span>
      <span>📅 ${f.date ? new Date(f.date).toLocaleDateString('pt-BR') : '—'}</span>
      <span>👤 ${f.responsible || '—'}</span>
      <span>${f.paid ? '<span class="badge-sm badge-success">Pago</span>' : '<span class="badge-sm badge-warning">Pendente</span>'}</span>
    </div>
    <div class="finance-item-actions">
      <button class="btn-icon" onclick="openFinanceModal(${f.id})">✏️</button>
      <button class="btn-icon" onclick="deleteFinance(${f.id})">🗑️</button>
    </div>
  </div>`).join('');
}

function openFinanceModal(id) {
  const f = id ? financeCache.find(f => f.id === id) : null;
  const fType = f?.type || 'receita';
  const fCategory = f?.category || '';
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>${f ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
    <div class="form-row">
      <div class="form-group"><label>Tipo</label><select id="f-type" onchange="updateFinanceCategoryOptions()"><option value="receita" ${fType==='receita'?'selected':''}>Receita</option><option value="despesa" ${fType==='despesa'?'selected':''}>Despesa</option></select></div>
      <div class="form-group"><label>Categoria</label><select id="f-category"><option value="Outros" ${fCategory==='Outros'?'selected':''}>Outros</option></select></div>
    </div>
    <div class="form-group"><label>Descrição</label><input id="f-desc" value="${f?.description || ''}"></div>
    <div class="form-row">
      <div class="form-group"><label>Valor (R$)</label><input id="f-amount" type="number" step="0.01" value="${f?.amount || ''}"></div>
      <div class="form-group"><label>Data</label><input id="f-date" type="date" value="${f?.date || ''}"></div>
      <div class="form-group"><label>Responsável</label><input id="f-resp" value="${f?.responsible || ''}"></div>
    </div>
    <div class="form-group"><label>Status</label><select id="f-paid"><option value="true" ${f?.paid?'selected':''}>Pago</option><option value="false" ${!f?.paid?'selected':''}>Pendente</option></select></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveFinance(${id || 'null'}, this)">${f ? 'Salvar' : 'Adicionar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  updateFinanceCategoryOptions(fCategory);
}

function updateFinanceCategoryOptions(selectedCategory) {
  const type = document.getElementById('f-type')?.value || 'receita';
  const sel = document.getElementById('f-category');
  if (!sel) return;
  const cats = FINANCE_CATEGORIES[type] || [];
  const current = selectedCategory || sel.value;
  sel.innerHTML = cats.map(c => `<option value="${c}" ${c === current ? 'selected' : ''}>${c}</option>`).join('');
}

async function saveFinance(id, btn) {
  const data = {
    type: val('f-type'), category: val('f-category'), description: val('f-desc'),
    amount: parseFloat(val('f-amount')) || 0, date: val('f-date'),
    responsible: val('f-resp'), paid: val('f-paid') === 'true',
  };
  if (id) await api(`/finance/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  else await api('/finance', { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Lançamento salvo!', 'success');
  renderFinanceiro();
}

async function deleteFinance(id) {
  if (!confirm('Excluir este lançamento?')) return;
  await api(`/finance/${id}`, { method: 'DELETE' });
  toast('Lançamento excluído', 'error');
  renderFinanceiro();
}

// ===== CATEGORIAS =====
async function renderFinCategorias(container) {
  financeCategoriesCache = await api('/finance/categories');
  container.innerHTML = `
    <div class="filters">
      <h3 class="card-title" style="margin:0">Categorias de Lançamentos</h3>
      <button class="btn btn-primary btn-sm" onclick="openFinCategoryModal()">+ Categoria</button>
    </div>
    <div class="card">
      ${financeCategoriesCache.length === 0 ? '<div class="empty-state"><p>Nenhuma categoria cadastrada. Crie uma nova!</p></div>' : `
      <table class="data-table" id="fin-cat-table">
        <thead><tr><th>Nome</th><th>Tipo</th><th>Cor</th><th>Orçamento (R$)</th><th>Descrição</th><th></th></tr></thead>
        <tbody>
          ${financeCategoriesCache.map(c => `<tr>
            <td style="font-weight:600">${c.name}</td>
            <td><span class="badge-sm ${c.type==='receita'?'badge-success':'badge-danger'}">${c.type==='receita'?'Receita':'Despesa'}</span></td>
            <td><span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:${c.color||'#ccc'};vertical-align:middle"></span></td>
            <td>R$ ${(c.budget_limit||0).toFixed(2)}</td>
            <td>${c.description || '—'}</td>
            <td>
              <button class="btn-icon" onclick="openFinCategoryModal(${c.id})">✏️</button>
              <button class="btn-icon" onclick="deleteFinCategory(${c.id})">🗑️</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`}
    </div>
  `;
}

function openFinCategoryModal(id) {
  const c = id ? financeCategoriesCache.find(c => c.id === id) : null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>${c ? 'Editar Categoria' : 'Nova Categoria'}</h3>
    <div class="form-row">
      <div class="form-group"><label>Nome</label><input id="fc-name" value="${c?.name || ''}"></div>
      <div class="form-group"><label>Tipo</label><select id="fc-type"><option value="receita" ${c?.type==='receita'?'selected':''}>Receita</option><option value="despesa" ${c?.type==='despesa'?'selected':''}>Despesa</option></select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Cor</label><input id="fc-color" type="color" value="${c?.color || '#c0392b'}" style="height:40px;padding:4px"></div>
      <div class="form-group"><label>Orçamento (R$)</label><input id="fc-budget" type="number" step="0.01" value="${c?.budget_limit || 0}"></div>
    </div>
    <div class="form-group"><label>Descrição</label><input id="fc-desc" value="${c?.description || ''}"></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveFinCategory(${id || 'null'}, this)">${c ? 'Salvar' : 'Criar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function saveFinCategory(id, btn) {
  const data = {
    name: val('fc-name'), type: val('fc-type'), color: val('fc-color'),
    budget_limit: parseFloat(val('fc-budget')) || 0, description: val('fc-desc')
  };
  if (id) await api(`/finance/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  else await api('/finance/categories', { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Categoria salva!', 'success');
  renderFinCategorias(document.getElementById('fin-tab-content'));
}

async function deleteFinCategory(id) {
  if (!confirm('Excluir esta categoria?')) return;
  await api(`/finance/categories/${id}`, { method: 'DELETE' });
  toast('Categoria excluída', 'error');
  renderFinCategorias(document.getElementById('fin-tab-content'));
}

// ===== EVENTOS =====
async function renderFinEventos(container) {
  financeEventsCache = await api('/finance/events');
  container.innerHTML = `
    <div class="filters">
      <h3 class="card-title" style="margin:0">Eventos Financeiros</h3>
      <button class="btn btn-primary btn-sm" onclick="openFinEventModal()">+ Evento</button>
    </div>
    <div class="fin-events-grid">
      ${financeEventsCache.length === 0 ? '<div class="card empty-state"><p>Nenhum evento cadastrado. Crie um novo evento financeiro!</p></div>' :
        financeEventsCache.map(e => {
          const profit = (e.actual_revenue||0) - (e.actual_expense||0);
          const statusLabels = { planejado: 'Planejado', em_andamento: 'Em Andamento', concluido: 'Concluído', cancelado: 'Cancelado' };
          const statusBadge = { planejado: 'badge-warning', em_andamento: 'badge-info', concluido: 'badge-success', cancelado: 'badge-danger' };
          return `<div class="card fin-event-card">
            <div class="fin-event-header">
              <div>
                <h3 style="margin:0;font-size:16px">${e.name}</h3>
                <span style="font-size:12px;color:var(--text-light)">${e.type || 'Evento'} · ${e.date ? new Date(e.date).toLocaleDateString('pt-BR') : '—'} · ${e.location || '—'}</span>
              </div>
              <span class="badge-sm ${statusBadge[e.status]||'badge-gray'}">${statusLabels[e.status]||e.status}</span>
            </div>
            ${e.description ? `<p style="font-size:13px;color:var(--text-light);margin:8px 0">${e.description}</p>` : ''}
            <div class="fin-event-stats">
              <div class="fin-event-stat"><span class="label">Receita Prevista</span><span class="value">R$ ${(e.expected_revenue||0).toFixed(2)}</span></div>
              <div class="fin-event-stat"><span class="label">Receita Real</span><span class="value" style="color:var(--success)">R$ ${(e.actual_revenue||0).toFixed(2)}</span></div>
              <div class="fin-event-stat"><span class="label">Despesa Prevista</span><span class="value">R$ ${(e.expected_expense||0).toFixed(2)}</span></div>
              <div class="fin-event-stat"><span class="label">Despesa Real</span><span class="value" style="color:var(--danger)">R$ ${(e.actual_expense||0).toFixed(2)}</span></div>
              <div class="fin-event-stat"><span class="label">Lucro/Prejuízo</span><span class="value" style="color:${profit>=0?'var(--success)':'var(--danger)'};font-weight:700">R$ ${profit.toFixed(2)}</span></div>
            </div>
            <div class="fin-event-actions">
              <button class="btn-icon" onclick="openFinEventModal(${e.id})">✏️</button>
              <button class="btn-icon" onclick="deleteFinEvent(${e.id})">🗑️</button>
            </div>
          </div>`;
        }).join('')}
    </div>
  `;
}

function openFinEventModal(id) {
  const e = id ? financeEventsCache.find(e => e.id === id) : null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>${e ? 'Editar Evento' : 'Novo Evento'}</h3>
    <div class="form-row">
      <div class="form-group"><label>Nome</label><input id="fe-name" value="${e?.name || ''}"></div>
      <div class="form-group"><label>Tipo</label><select id="fe-type">${FINANCE_EVENT_TYPES.map(t => `<option value="${t}" ${e?.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Data</label><input id="fe-date" type="date" value="${e?.date || ''}"></div>
      <div class="form-group"><label>Local</label><input id="fe-location" value="${e?.location || ''}"></div>
      <div class="form-group"><label>Status</label><select id="fe-status">${FINANCE_EVENT_STATUS.map(s => `<option value="${s}" ${e?.status===s?'selected':''}>${s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>`).join('')}</select></div>
    </div>
    <div class="form-group"><label>Descrição</label><textarea id="fe-desc" rows="2">${e?.description || ''}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Receita Prevista (R$)</label><input id="fe-exp-rev" type="number" step="0.01" value="${e?.expected_revenue || 0}"></div>
      <div class="form-group"><label>Receita Real (R$)</label><input id="fe-act-rev" type="number" step="0.01" value="${e?.actual_revenue || 0}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Despesa Prevista (R$)</label><input id="fe-exp-exp" type="number" step="0.01" value="${e?.expected_expense || 0}"></div>
      <div class="form-group"><label>Despesa Real (R$)</label><input id="fe-act-exp" type="number" step="0.01" value="${e?.actual_expense || 0}"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveFinEvent(${id || 'null'}, this)">${e ? 'Salvar' : 'Criar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', ev => { if (ev.target === overlay) overlay.remove(); });
}

async function saveFinEvent(id, btn) {
  const data = {
    name: val('fe-name'), type: val('fe-type'), date: val('fe-date'),
    location: val('fe-location'), status: val('fe-status'), description: val('fe-desc'),
    expected_revenue: parseFloat(val('fe-exp-rev')) || 0, actual_revenue: parseFloat(val('fe-act-rev')) || 0,
    expected_expense: parseFloat(val('fe-exp-exp')) || 0, actual_expense: parseFloat(val('fe-act-exp')) || 0,
  };
  if (id) await api(`/finance/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  else await api('/finance/events', { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Evento salvo!', 'success');
  renderFinEventos(document.getElementById('fin-tab-content'));
}

async function deleteFinEvent(id) {
  if (!confirm('Excluir este evento?')) return;
  await api(`/finance/events/${id}`, { method: 'DELETE' });
  toast('Evento excluído', 'error');
  renderFinEventos(document.getElementById('fin-tab-content'));
}

// ===== ORÇAMENTO =====
async function renderFinOrcamento(container) {
  financeBudgetCache = await api('/finance/budget');
  const analytics = financeAnalyticsCache || await api('/finance/analytics');
  const bva = analytics.budgetVsActual || [];
  container.innerHTML = `
    <div class="filters">
      <h3 class="card-title" style="margin:0">Planejamento Orçamentário</h3>
      <button class="btn btn-primary btn-sm" onclick="openFinBudgetModal()">+ Item de Orçamento</button>
    </div>
    ${bva.length > 0 ? `
    <div class="card" style="margin-bottom:16px">
      <div class="card-title">Orçamento vs Realizado</div>
      <table class="data-table" id="fin-bva-table">
        <thead><tr><th>Categoria</th><th>Tipo</th><th>Planejado</th><th>Realizado</th><th>Diferença</th><th>% Uso</th></tr></thead>
        <tbody>
          ${bva.map(b => {
            const pct = b.planned > 0 ? Math.round((b.actual / b.planned) * 100) : 0;
            const diffColor = b.difference >= 0 ? 'var(--success)' : 'var(--danger)';
            return `<tr>
              <td style="font-weight:600">${b.category}</td>
              <td><span class="badge-sm ${b.type==='receita'?'badge-success':'badge-danger'}">${b.type==='receita'?'Receita':'Despesa'}</span></td>
              <td>R$ ${b.planned.toFixed(2)}</td>
              <td>R$ ${b.actual.toFixed(2)}</td>
              <td style="color:${diffColor};font-weight:600">R$ ${b.difference.toFixed(2)}</td>
              <td>${pct}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : ''}
    <div class="card">
      <div class="card-title">Itens de Orçamento</div>
      ${financeBudgetCache.length === 0 ? '<div class="empty-state"><p>Nenhum item de orçamento. Crie um novo!</p></div>' : `
      <table class="data-table" id="fin-budget-table">
        <thead><tr><th>Categoria</th><th>Tipo</th><th>Valor Planejado</th><th>Notas</th><th></th></tr></thead>
        <tbody>
          ${financeBudgetCache.map(b => `<tr>
            <td style="font-weight:600">${b.category}</td>
            <td><span class="badge-sm ${b.type==='receita'?'badge-success':'badge-danger'}">${b.type==='receita'?'Receita':'Despesa'}</span></td>
            <td>R$ ${(b.planned_amount||0).toFixed(2)}</td>
            <td>${b.notes || '—'}</td>
            <td>
              <button class="btn-icon" onclick="openFinBudgetModal(${b.id})">✏️</button>
              <button class="btn-icon" onclick="deleteFinBudget(${b.id})">🗑️</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`}
    </div>
  `;
}

function openFinBudgetModal(id) {
  const b = id ? financeBudgetCache.find(b => b.id === id) : null;
  const allCats = [...new Set([...FINANCE_CATEGORIES.receita, ...FINANCE_CATEGORIES.despesa])];
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>${b ? 'Editar Orçamento' : 'Novo Item de Orçamento'}</h3>
    <div class="form-row">
      <div class="form-group"><label>Categoria</label><select id="fb-category">${allCats.map(c => `<option value="${c}" ${b?.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label>Tipo</label><select id="fb-type"><option value="receita" ${b?.type==='receita'?'selected':''}>Receita</option><option value="despesa" ${b?.type==='despesa'?'selected':''}>Despesa</option></select></div>
    </div>
    <div class="form-group"><label>Valor Planejado (R$)</label><input id="fb-amount" type="number" step="0.01" value="${b?.planned_amount || 0}"></div>
    <div class="form-group"><label>Notas</label><textarea id="fb-notes" rows="2">${b?.notes || ''}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveFinBudget(${id || 'null'}, this)">${b ? 'Salvar' : 'Criar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function saveFinBudget(id, btn) {
  const data = {
    category: val('fb-category'), type: val('fb-type'),
    planned_amount: parseFloat(val('fb-amount')) || 0, notes: val('fb-notes')
  };
  if (id) await api(`/finance/budget/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  else await api('/finance/budget', { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Orçamento salvo!', 'success');
  renderFinOrcamento(document.getElementById('fin-tab-content'));
}

async function deleteFinBudget(id) {
  if (!confirm('Excluir este item de orçamento?')) return;
  await api(`/finance/budget/${id}`, { method: 'DELETE' });
  toast('Item excluído', 'error');
  renderFinOrcamento(document.getElementById('fin-tab-content'));
}

// ============ LEMBRANCINHAS ============
let lembrancinhasCache = [];

async function renderLembrancinhas() {
  lembrancinhasCache = await api('/lembrancinhas');
  const main = document.getElementById('main-content');
  const done = lembrancinhasCache.filter(l => l.status === 'pronto').length;
  const inProgress = lembrancinhasCache.filter(l => l.status === 'em_andamento').length;
  const notStarted = lembrancinhasCache.filter(l => l.status === 'nao_iniciado').length;
  const stats = { total: lembrancinhasCache.length, pronto: done, em_andamento: inProgress, nao_iniciado: notStarted };
  const pct = stats.total > 0 ? Math.round((stats.pronto / stats.total) * 100) : 0;
  main.innerHTML = `
    <h1 class="page-title">Lembrancinhas</h1>
    <p class="page-subtitle">Controle de produção e entrega das lembrancinhas por equipe</p>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon total">🎁</div><div class="stat-info"><h3>${stats.total}</h3><p>Total de Lembrancinhas</p></div></div>
      <div class="stat-card"><div class="stat-icon done">✅</div><div class="stat-info"><h3>${stats.pronto}</h3><p>Prontas (${pct}%)</p></div></div>
      <div class="stat-card"><div class="stat-icon progress">🔧</div><div class="stat-info"><h3>${stats.em_andamento}</h3><p>Em Produção</p></div></div>
      <div class="stat-card"><div class="stat-icon pending">⭕</div><div class="stat-info"><h3>${stats.nao_iniciado}</h3><p>Não Iniciadas</p></div></div>
    </div>
    ${stats.total > 0 ? `<div class="card"><div class="progress-container"><div class="progress-label"><span>Progresso Geral</span><span>${stats.pronto}/${stats.total} (${pct}%)</span></div><div class="progress-bar"><div class="progress-fill ${pct >= 75 ? '' : pct >= 40 ? 'warn' : 'danger'}" style="width:${pct}%"></div></div></div></div>` : ''}
    <div class="filters">
      <button class="btn btn-primary btn-sm" onclick="openLembrancinhaModal()">+ Nova Lembrancinha</button>
    </div>
    <div class="team-grid" id="lembrancinhas-grid"></div>
  `;
  renderLembrancinhaCards(lembrancinhasCache);
}

function renderLembrancinhaCards(list) {
  const container = document.getElementById('lembrancinhas-grid');
  if (list.length === 0) { container.innerHTML = '<div class="empty-state"><p>Nenhuma lembrancinha cadastrada.</p></div>'; return; }
  const statusLabels = { nao_iniciado: 'Não Iniciado', em_andamento: 'Em Andamento', pronto: 'Pronto' };
  const statusBadges = { nao_iniciado: 'badge-gray', em_andamento: 'badge-warning', pronto: 'badge-success' };
  container.innerHTML = list.map(l => {
    const pct = l.quantity_needed > 0 ? Math.round((l.quantity_ready / l.quantity_needed) * 100) : 0;
    return `<div class="team-card">
      <div class="team-card-header">
        <h3>${l.team}</h3>
        <span class="badge-sm ${statusBadges[l.status]}">${statusLabels[l.status]}</span>
      </div>
      <p><strong>${l.item_name}</strong></p>
      <p>${l.description || ''}</p>
      <p style="font-size:13px;margin-top:8px">Quantidade: ${l.quantity_ready}/${l.quantity_needed} ${l.quantity_needed > 0 ? `(${pct}%)` : ''}</p>
      ${l.quantity_needed > 0 ? `<div class="lembrancinha-progress"><div class="lembrancinha-progress-fill" style="width:${pct}%"></div></div>` : ''}
      ${l.delivery_date ? `<p style="font-size:12px;color:var(--accent);margin-top:6px">Entrega: ${new Date(l.delivery_date).toLocaleDateString('pt-BR')}</p>` : ''}
      <div style="display:flex;gap:6px;margin-top:10px">
        <button class="btn btn-secondary btn-sm" onclick="cycleLembrancinhaStatus(${l.id})">${l.status === 'nao_iniciado' ? 'Iniciar' : l.status === 'em_andamento' ? 'Marcar Pronto' : 'Reabrir'}</button>
        <button class="btn-icon" onclick="openLembrancinhaModal(${l.id})">✏️</button>
        <button class="btn-icon" onclick="deleteLembrancinha(${l.id})">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

async function cycleLembrancinhaStatus(id) {
  const l = lembrancinhasCache.find(l => l.id === id);
  const next = l.status === 'nao_iniciado' ? 'em_andamento' : l.status === 'em_andamento' ? 'pronto' : 'nao_iniciado';
  await api(`/lembrancinhas/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
  l.status = next;
  renderLembrancinhaCards(lembrancinhasCache);
  toast(`Status: ${next === 'pronto' ? 'Pronto!' : next === 'em_andamento' ? 'Em andamento' : 'Não iniciado'}`, next === 'pronto' ? 'success' : '');
}

function openLembrancinhaModal(id) {
  const l = id ? lembrancinhasCache.find(l => l.id === id) : null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>${l ? 'Editar Lembrancinha' : 'Nova Lembrancinha'}</h3>
    <div class="form-group"><label>Equipe</label><input id="l-team" value="${l?.team || ''}"></div>
    <div class="form-group"><label>Nome do Item</label><input id="l-name" value="${l?.item_name || ''}"></div>
    <div class="form-group"><label>Descrição</label><textarea id="l-desc" rows="2">${l?.description || ''}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Qtd. Necessária</label><input id="l-needed" type="number" value="${l?.quantity_needed || 0}"></div>
      <div class="form-group"><label>Qtd. Pronta</label><input id="l-ready" type="number" value="${l?.quantity_ready || 0}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Data de Entrega</label><input id="l-date" type="date" value="${l?.delivery_date || ''}"></div>
      <div class="form-group"><label>Status</label><select id="l-status"><option value="nao_iniciado" ${l?.status==='nao_iniciado'?'selected':''}>Não Iniciado</option><option value="em_andamento" ${l?.status==='em_andamento'?'selected':''}>Em Andamento</option><option value="pronto" ${l?.status==='pronto'?'selected':''}>Pronto</option></select></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveLembrancinha(${id || 'null'}, this)">${l ? 'Salvar' : 'Criar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function saveLembrancinha(id, btn) {
  const data = {
    team: val('l-team'), item_name: val('l-name'), description: val('l-desc'),
    quantity_needed: parseInt(val('l-needed')) || 0, quantity_ready: parseInt(val('l-ready')) || 0,
    delivery_date: val('l-date'), status: val('l-status'),
  };
  if (id) await api(`/lembrancinhas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  else await api('/lembrancinhas', { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Lembrancinha salva!', 'success');
  renderLembrancinhas();
}

async function deleteLembrancinha(id) {
  if (!confirm('Excluir esta lembrancinha?')) return;
  await api(`/lembrancinhas/${id}`, { method: 'DELETE' });
  toast('Lembrancinha excluída', 'error');
  renderLembrancinhas();
}

// ============ ESCOLINHAS ============
let escolinhasCache = [];

async function renderEscolinhas() {
  escolinhasCache = await api('/escolinhas');
  const main = document.getElementById('main-content');
  const concluidas = escolinhasCache.filter(e => e.status === 'concluida').length;
  const agendadas = escolinhasCache.filter(e => e.status === 'agendada').length;
  main.innerHTML = `
    <h1 class="page-title">Escolinhas de Preparação</h1>
    <p class="page-subtitle">Reuniões periódicas de aprofundamento no serviço cristão</p>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon total">📚</div><div class="stat-info"><h3>${escolinhasCache.length}</h3><p>Total Escolinhas</p></div></div>
      <div class="stat-card"><div class="stat-icon done">✅</div><div class="stat-info"><h3>${concluidas}</h3><p>Concluídas</p></div></div>
      <div class="stat-card"><div class="stat-icon pending">📅</div><div class="stat-info"><h3>${agendadas}</h3><p>Agendadas</p></div></div>
    </div>
    <div class="filters">
      <button class="btn btn-primary btn-sm" onclick="openEscolinhaModal()">+ Nova Escolinha</button>
    </div>
    <div class="escolinha-timeline" id="escolinhas-list"></div>
  `;
  renderEscolinhaItems(escolinhasCache);
}

function renderEscolinhaItems(list) {
  const container = document.getElementById('escolinhas-list');
  if (list.length === 0) { container.innerHTML = '<div class="empty-state"><p>Nenhuma escolinha agendada.</p></div>'; return; }
  const typeLabels = { equipes_extras: 'Equipes Extras', cozinha: 'Cozinha', implantacao: 'Implantação', missa_entrega: 'Missa de Entrega' };
  const statusLabels = { agendada: 'Agendada', concluida: 'Concluída', cancelada: 'Cancelada' };
  const statusBadges = { agendada: 'badge-info', concluida: 'badge-success', cancelada: 'badge-danger' };
  container.innerHTML = list.map(e => `<div class="escolinha-item status-${e.status}">
    <div style="display:flex;justify-content:space-between;align-items:start">
      <div>
        <div style="font-weight:600;font-size:14px">${e.name}</div>
        <div style="font-size:12px;color:var(--text-light);margin-top:4px">${typeLabels[e.type] || e.type} — ${e.target_audience || ''}</div>
        ${e.date ? `<div style="font-size:12px;color:var(--accent);margin-top:4px">📅 ${new Date(e.date).toLocaleDateString('pt-BR')} ${e.time ? 'às ' + e.time : ''} ${e.location ? '— ' + e.location : ''}</div>` : '<div style="font-size:12px;color:var(--text-light);margin-top:4px">Data a definir</div>'}
        ${e.description ? `<div style="font-size:12px;color:var(--text-light);margin-top:6px;line-height:1.5">${e.description}</div>` : ''}
      </div>
      <span class="badge-sm ${statusBadges[e.status]}">${statusLabels[e.status]}</span>
    </div>
    <div style="display:flex;gap:6px;margin-top:10px">
      <button class="btn btn-secondary btn-sm" onclick="cycleEscolinhaStatus(${e.id})">${e.status === 'agendada' ? 'Marcar Concluída' : 'Reabrir'}</button>
      <button class="btn-icon" onclick="openEscolinhaModal(${e.id})">✏️</button>
      <button class="btn-icon" onclick="deleteEscolinha(${e.id})">🗑️</button>
    </div>
  </div>`).join('');
}

async function cycleEscolinhaStatus(id) {
  const e = escolinhasCache.find(e => e.id === id);
  const next = e.status === 'agendada' ? 'concluida' : 'agendada';
  await api(`/escolinhas/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
  e.status = next;
  renderEscolinhaItems(escolinhasCache);
  toast(next === 'concluida' ? 'Escolinha concluída!' : 'Escolinha reaberta', next === 'concluida' ? 'success' : '');
}

function openEscolinhaModal(id) {
  const e = id ? escolinhasCache.find(e => e.id === id) : null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>${e ? 'Editar Escolinha' : 'Nova Escolinha'}</h3>
    <div class="form-group"><label>Nome</label><input id="e-name" value="${e?.name || ''}"></div>
    <div class="form-group"><label>Tipo</label><select id="e-type"><option value="equipes_extras" ${e?.type==='equipes_extras'?'selected':''}>Equipes Extras</option><option value="cozinha" ${e?.type==='cozinha'?'selected':''}>Cozinha</option><option value="implantacao" ${e?.type==='implantacao'?'selected':''}>Implantação</option><option value="missa_entrega" ${e?.type==='missa_entrega'?'selected':''}>Missa de Entrega</option></select></div>
    <div class="form-row">
      <div class="form-group"><label>Data</label><input id="e-date" type="date" value="${e?.date || ''}"></div>
      <div class="form-group"><label>Hora</label><input id="e-time" value="${e?.time || ''}" placeholder="Ex: 19h30"></div>
      <div class="form-group"><label>Local</label><input id="e-loc" value="${e?.location || ''}"></div>
    </div>
    <div class="form-group"><label>Público-alvo</label><input id="e-audience" value="${e?.target_audience || ''}"></div>
    <div class="form-group"><label>Descrição</label><textarea id="e-desc" rows="3">${e?.description || ''}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveEscolinha(${id || 'null'}, this)">${e ? 'Salvar' : 'Agendar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e2 => { if (e2.target === overlay) overlay.remove(); });
}

async function saveEscolinha(id, btn) {
  const data = {
    name: val('e-name'), type: val('e-type'), date: val('e-date'), time: val('e-time'),
    location: val('e-loc'), target_audience: val('e-audience'), description: val('e-desc'),
  };
  if (id) await api(`/escolinhas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  else await api('/escolinhas', { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Escolinha salva!', 'success');
  renderEscolinhas();
}

async function deleteEscolinha(id) {
  if (!confirm('Excluir esta escolinha?')) return;
  await api(`/escolinhas/${id}`, { method: 'DELETE' });
  toast('Escolinha excluída', 'error');
  renderEscolinhas();
}

// ============ ALICERCES & ALVENARIAS ============
let alicercesCache = [];

async function renderAlicerces() {
  alicercesCache = await api('/alicerces');
  const main = document.getElementById('main-content');
  const alicerces = alicercesCache.filter(a => a.type === 'alicerce');
  const alvenarias = alicercesCache.filter(a => a.type === 'alvenaria');
  const atribuidos = alicercesCache.filter(a => a.status === 'atribuido' || a.status === 'concluido').length;
  main.innerHTML = `
    <h1 class="page-title">Alicerces e Alvenarias</h1>
    <p class="page-subtitle">Pistas de reflexão do Encontro — gestão de construtores</p>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon total">🏗️</div><div class="stat-info"><h3>${alicerces.length}</h3><p>Alicerces</p></div></div>
      <div class="stat-card"><div class="stat-icon done">🧱</div><div class="stat-info"><h3>${alvenarias.length}</h3><p>Alvenarias</p></div></div>
      <div class="stat-card"><div class="stat-icon progress">👤</div><div class="stat-info"><h3>${atribuidos}</h3><p>Atribuídos</p></div></div>
    </div>
    <div class="alicerce-section">
      <div class="alicerce-section-title">Alicerces</div>
      <div id="alicerces-list"></div>
    </div>
    <div class="alicerce-section">
      <div class="alicerce-section-title">Alvenarias</div>
      <div id="alvenarias-list"></div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="openAlicerceModal()">+ Novo Alicerce/Alvenaria</button>
  `;
  renderAlicerceCards(alicerces, 'alicerces-list');
  renderAlicerceCards(alvenarias, 'alvenarias-list');
}

function renderAlicerceCards(list, containerId) {
  const container = document.getElementById(containerId);
  if (list.length === 0) { container.innerHTML = '<p style="color:var(--text-light);padding:12px">Nenhum item.</p>'; return; }
  const statusLabels = { nao_atribuido: 'Não Atribuído', atribuido: 'Atribuído', concluido: 'Concluído' };
  const statusBadges = { nao_atribuido: 'badge-gray', atribuido: 'badge-info', concluido: 'badge-success' };
  container.innerHTML = list.map(a => `<div class="alicerce-card">
    <div class="alicerce-number">${a.order || '—'}</div>
    <div class="alicerce-info">
      <div class="alicerce-title">${a.title}</div>
      <div class="alicerce-desc">${a.description || ''}</div>
      ${a.constructor_name ? `<div class="alicerce-constructor">👤 Construtor(a): ${a.constructor_name}</div>` : '<div class="alicerce-constructor" style="color:var(--warning)">⚠️ Sem construtor atribuído</div>'}
      ${a.schedule_day ? `<div style="font-size:11px;color:var(--text-light);margin-top:2px">📅 ${a.schedule_day} — ${a.schedule_time || ''}</div>` : ''}
    </div>
    <div style="display:flex;flex-direction:column;align-items:end;gap:6px">
      <span class="badge-sm ${statusBadges[a.status]}">${statusLabels[a.status]}</span>
      <div style="display:flex;gap:4px">
        <button class="btn-icon" onclick="openAlicerceModal(${a.id})">✏️</button>
        <button class="btn-icon" onclick="deleteAlicerce(${a.id})">🗑️</button>
      </div>
    </div>
  </div>`).join('');
}

function openAlicerceModal(id) {
  const a = id ? alicercesCache.find(a => a.id === id) : null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>${a ? 'Editar Alicerce/Alvenaria' : 'Novo Alicerce/Alvenaria'}</h3>
    <div class="form-row">
      <div class="form-group"><label>Tipo</label><select id="a-type"><option value="alicerce" ${a?.type==='alicerce'?'selected':''}>Alicerce</option><option value="alvenaria" ${a?.type==='alvenaria'?'selected':''}>Alvenaria</option></select></div>
      <div class="form-group"><label>Ordem</label><input id="a-order" type="number" value="${a?.order || ''}"></div>
    </div>
    <div class="form-group"><label>Título</label><input id="a-title" value="${a?.title || ''}"></div>
    <div class="form-group"><label>Construtor(a)</label><input id="a-constructor" value="${a?.constructor_name || ''}" placeholder="Nome de quem fará a reflexão"></div>
    <div class="form-group"><label>Descrição</label><textarea id="a-desc" rows="3">${a?.description || ''}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Dia</label><select id="a-day"><option value="">—</option><option value="Sexta-feira" ${a?.schedule_day==='Sexta-feira'?'selected':''}>Sexta-feira</option><option value="Sábado" ${a?.schedule_day==='Sábado'?'selected':''}>Sábado</option><option value="Domingo" ${a?.schedule_day==='Domingo'?'selected':''}>Domingo</option></select></div>
      <div class="form-group"><label>Horário</label><input id="a-time" value="${a?.schedule_time || ''}" placeholder="Ex: Manhã, Tarde"></div>
      <div class="form-group"><label>Status</label><select id="a-status"><option value="nao_atribuido" ${a?.status==='nao_atribuido'?'selected':''}>Não Atribuído</option><option value="atribuido" ${a?.status==='atribuido'?'selected':''}>Atribuído</option><option value="concluido" ${a?.status==='concluido'?'selected':''}>Concluído</option></select></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveAlicerce(${id || 'null'}, this)">${a ? 'Salvar' : 'Criar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e2 => { if (e2.target === overlay) overlay.remove(); });
}

async function saveAlicerce(id, btn) {
  const data = {
    type: val('a-type'), order: parseInt(val('a-order')) || 0, title: val('a-title'),
    constructor_name: val('a-constructor'), description: val('a-desc'),
    schedule_day: val('a-day'), schedule_time: val('a-time'), status: val('a-status'),
  };
  if (id) await api(`/alicerces/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  else await api('/alicerces', { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Alicerce/Alvenaria salvo!', 'success');
  renderAlicerces();
}

async function deleteAlicerce(id) {
  if (!confirm('Excluir este item?')) return;
  await api(`/alicerces/${id}`, { method: 'DELETE' });
  toast('Item excluído', 'error');
  renderAlicerces();
}

// ============ LEMBRETES ============
let lembretesCache = [];
let autoLembretesCache = [];
let lembreteActiveTab = 'all';
let lembreteFilterStatus = '';
let lembreteFilterPriority = '';
let lembreteSearchText = '';
let autoFilterUrgency = '';
let autoFilterCategory = '';
let autoFilterTeam = '';
let autoSearchText = '';

const LEMBRETE_CATEGORIES = [
  'Geral MOs', 'Espaço Físico', 'Mestres de Obras', 'Traslado', 'Materiais Gráficos',
  'Material JUMIRE', 'Kits e Crachás', 'Som e Técnica', 'Cozinha e Higiene', 'Capela',
  'Escolinhas', 'Alicerces e Alvenarias', 'Lembrancinhas', 'Fornecedores', 'Financeiro',
  'Dinamização', 'RH', 'Montagem'
];

const LEMBRETE_CATEGORY_ICONS = {
  'Geral MOs': '📋', 'Espaço Físico': '🏠', 'Mestres de Obras': '👷', 'Traslado': '🚌',
  'Materiais Gráficos': '🖨️', 'Material JUMIRE': '📦', 'Kits e Crachás': '🎫', 'Som e Técnica': '🔊',
  'Cozinha e Higiene': '🍲', 'Capela': '⛪', 'Escolinhas': '📚', 'Alicerces e Alvenarias': '🧱',
  'Lembrancinhas': '🎁', 'Fornecedores': '🤝', 'Financeiro': '💰', 'Dinamização': '🎭',
  'RH': '👥', 'Montagem': '🔧'
};

async function renderLembretes() {
  lembretesCache = await api('/lembretes');
  const auto = await api('/lembretes/auto');
  autoLembretesCache = auto.lembretes || [];
  const main = document.getElementById('main-content');

  const total = lembretesCache.length;
  const done = lembretesCache.filter(l => l.status === 'concluido').length;
  const pending = total - done;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const overdue = autoLembretesCache.filter(l => l.urgency === 'overdue');
  const urgent = autoLembretesCache.filter(l => l.urgency === 'urgent');
  const warning = autoLembretesCache.filter(l => l.urgency === 'warning');

  const cats = {};
  lembretesCache.forEach(l => {
    const c = l.category || 'Geral MOs';
    if (!cats[c]) cats[c] = { total: 0, done: 0 };
    cats[c].total++;
    if (l.status === 'concluido') cats[c].done++;
  });

  main.innerHTML = `
    <h1 class="page-title">Lembretes</h1>
    <p class="page-subtitle">Checklist de preparação para o Encontro — organize e marque o progresso</p>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon total">📊</div><div class="stat-info"><h3>${total}</h3><p>Total</p></div></div>
      <div class="stat-card"><div class="stat-icon done">✅</div><div class="stat-info"><h3>${done}</h3><p>Concluídos</p></div></div>
      <div class="stat-card"><div class="stat-icon pending">🔔</div><div class="stat-info"><h3>${pending}</h3><p>Pendentes</p></div></div>
      <div class="stat-card"><div class="stat-icon progress">📈</div><div class="stat-info"><h3>${pct}%</h3><p>Progresso</p></div></div>
    </div>

    <div class="card">
      <div class="progress-bar-container" style="margin-bottom:16px">
        <div class="progress-bar-header"><span>Progresso Geral</span><span><strong>${done}</strong>/${total} (${pct}%)</span></div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      </div>
    </div>

    ${auto.message ? `<div class="card" style="text-align:center;color:var(--text-light)">${auto.message}</div>` : `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon pending">🚨</div><div class="stat-info"><h3>${overdue.length}</h3><p>Atrasados</p></div></div>
      <div class="stat-card"><div class="stat-icon progress">⚠️</div><div class="stat-info"><h3>${urgent.length}</h3><p>Urgentes</p></div></div>
      <div class="stat-card"><div class="stat-icon total">📅</div><div class="stat-info"><h3>${warning.length}</h3><p>Atenção</p></div></div>
      <div class="stat-card"><div class="stat-icon done">📋</div><div class="stat-info"><h3>${autoLembretesCache.length}</h3><p>Automáticos</p></div></div>
    </div>`}

    <div class="card">
      <div class="card-title">Lembretes Automáticos (baseados nos prazos do manual)</div>
      <div class="lem-filters" id="auto-filters">
        <input type="text" class="lem-search" placeholder="🔍 Buscar lembrete automático..." oninput="autoSearch(this.value)" id="auto-search-input">
        <select onchange="autoFilterByUrgency(this.value)" id="auto-filter-urgency">
          <option value="">Todas Urgências</option>
          <option value="overdue">🚨 Atrasados</option>
          <option value="urgent">⚠️ Urgentes</option>
          <option value="warning">📅 Atenção</option>
          <option value="info">ℹ️ Em Dia</option>
        </select>
        <select onchange="autoFilterByCategory(this.value)" id="auto-filter-category">
          <option value="">Todas Categorias</option>
        </select>
        <select onchange="autoFilterByTeam(this.value)" id="auto-filter-team">
          <option value="">Todas Equipes</option>
        </select>
      </div>
      <div id="auto-lembretes"></div>
    </div>

    <div class="card">
      <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>Lembretes Manuais por Módulo</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="syncLembretesTasks()">🔄 Sincronizar com Checklist</button>
          <button class="btn btn-primary btn-sm" onclick="openLembreteModal()">+ Novo Lembrete</button>
        </div>
      </div>

      <div class="lem-tab-bar" id="lem-tabs">
        <button class="lem-tab active" data-cat="all" onclick="switchLemTab('all')">
          <span class="lem-tab-icon">📋</span><span>Todos</span>
          <span class="lem-tab-count">${total}</span>
        </button>
        ${LEMBRETE_CATEGORIES.filter(c => cats[c]).map(c => {
          const catPct = cats[c].total > 0 ? Math.round((cats[c].done / cats[c].total) * 100) : 0;
          return `<button class="lem-tab" data-cat="${c}" onclick="switchLemTab('${c}')">
            <span class="lem-tab-icon">${LEMBRETE_CATEGORY_ICONS[c] || '📌'}</span>
            <span>${c}</span>
            <span class="lem-tab-count">${cats[c].done}/${cats[c].total}</span>
            <span class="lem-tab-pct ${catPct === 100 ? 'done' : catPct >= 50 ? 'half' : ''}">${catPct}%</span>
          </button>`;
        }).join('')}
      </div>

      <div class="lem-filters" id="lem-filters">
        <input type="text" class="lem-search" placeholder="🔍 Buscar lembrete..." oninput="lemSearch(this.value)" id="lem-search-input">
        <select onchange="lemFilterStatus(this.value)" id="lem-filter-status">
          <option value="">Todos Status</option>
          <option value="pendente">Pendente</option>
          <option value="concluido">Concluído</option>
        </select>
        <select onchange="lemFilterPriority(this.value)" id="lem-filter-priority">
          <option value="">Todas Prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
      </div>

      <div id="lem-progress-area"></div>
      <div id="manual-lembretes"></div>
    </div>
  `;

  renderAutoLembretes(autoLembretesCache);
  populateAutoFilters();
  applyAutoFilters();
  applyLemFilters();
}

function populateAutoFilters() {
  const cats = [...new Set(autoLembretesCache.map(l => l.category || 'N/A'))].sort();
  const teams = [...new Set(autoLembretesCache.map(l => l.responsible_team || 'N/A').filter(Boolean))].sort();
  const catSelect = document.getElementById('auto-filter-category');
  const teamSelect = document.getElementById('auto-filter-team');
  if (catSelect) { catSelect.innerHTML = '<option value="">Todas Categorias</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join(''); }
  if (teamSelect) { teamSelect.innerHTML = '<option value="">Todas Equipes</option>' + teams.map(t => `<option value="${t}">${t}</option>`).join(''); }
}

function autoSearch(text) {
  autoSearchText = text.toLowerCase();
  applyAutoFilters();
}

function autoFilterByUrgency(val) {
  autoFilterUrgency = val;
  applyAutoFilters();
}

function autoFilterByCategory(val) {
  autoFilterCategory = val;
  applyAutoFilters();
}

function autoFilterByTeam(val) {
  autoFilterTeam = val;
  applyAutoFilters();
}

function applyAutoFilters() {
  let list = [...autoLembretesCache];
  if (autoFilterUrgency) list = list.filter(l => l.urgency === autoFilterUrgency);
  if (autoFilterCategory) list = list.filter(l => (l.category || 'N/A') === autoFilterCategory);
  if (autoFilterTeam) list = list.filter(l => (l.responsible_team || 'N/A') === autoFilterTeam);
  if (autoSearchText) list = list.filter(l =>
    (l.title || '').toLowerCase().includes(autoSearchText) ||
    (l.category || '').toLowerCase().includes(autoSearchText) ||
    (l.responsible_team || '').toLowerCase().includes(autoSearchText)
  );
  renderAutoLembretes(list);
}

function switchLemTab(cat) {
  lembreteActiveTab = cat;
  document.querySelectorAll('.lem-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.cat === cat);
  });
  applyLemFilters();
}

function lemSearch(text) {
  lembreteSearchText = text.toLowerCase();
  applyLemFilters();
}

function lemFilterStatus(val) {
  lembreteFilterStatus = val;
  applyLemFilters();
}

function lemFilterPriority(val) {
  lembreteFilterPriority = val;
  applyLemFilters();
}

function applyLemFilters() {
  let list = [...lembretesCache];
  if (lembreteActiveTab !== 'all') list = list.filter(l => (l.category || 'Geral MOs') === lembreteActiveTab);
  if (lembreteFilterStatus) list = list.filter(l => l.status === lembreteFilterStatus);
  if (lembreteFilterPriority) list = list.filter(l => l.priority === lembreteFilterPriority);
  if (lembreteSearchText) list = list.filter(l =>
    (l.title || '').toLowerCase().includes(lembreteSearchText) ||
    (l.description || '').toLowerCase().includes(lembreteSearchText)
  );

  const progArea = document.getElementById('lem-progress-area');
  if (progArea && lembreteActiveTab !== 'all') {
    const t = list.length;
    const d = list.filter(l => l.status === 'concluido').length;
    const p = t > 0 ? Math.round((d / t) * 100) : 0;
    progArea.innerHTML = `
      <div class="progress-bar-container" style="margin-bottom:12px">
        <div class="progress-bar-header">
          <span><strong>${LEMBRETE_CATEGORY_ICONS[lembreteActiveTab] || '📌'} ${lembreteActiveTab}</strong></span>
          <span><strong>${d}</strong>/${t} (${p}%)</span>
        </div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${p}%"></div></div>
      </div>`;
  } else if (progArea) {
    progArea.innerHTML = '';
  }

  renderManualLembretes(list);
}

function renderAutoLembretes(list) {
  const container = document.getElementById('auto-lembretes');
  if (list.length === 0) {
    const hasData = autoLembretesCache.length > 0;
    container.innerHTML = `<p style="color:var(--text-light);padding:12px">${hasData ? 'Nenhum lembrete automático encontrado com os filtros atuais.' : 'Nenhum lembrete automático. Defina a data do Encontro.'}</p>`;
    return;
  }
  const icons = { overdue: '🚨', urgent: '⚠️', warning: '📅', info: 'ℹ️' };
  const labels = { overdue: 'Atrasado', urgent: 'Urgente', warning: 'Atenção', info: 'Em dia' };
  const showingAll = list.length === autoLembretesCache.length;
  const countBar = showingAll ? '' : '<div style="font-size:11px;color:var(--text-light);padding:4px 12px">Mostrando ' + list.length + ' de ' + autoLembretesCache.length + ' lembretes</div>';
  const cards = list.map(l => `<div class="lembrete-card ${l.urgency}">
    <div class="lembrete-icon">${icons[l.urgency]}</div>
    <div class="lembrete-info">
      <div class="lembrete-title">${l.title}</div>
      <div class="lembrete-meta">${l.category} — Equipe: ${l.responsible_team || 'N/A'} — Prazo manual: ${l.deadline}</div>
      <div class="lembrete-due ${l.urgency}">${l.diff_days < 0 ? `${Math.abs(l.diff_days)} dias atrasado` : l.diff_days === 0 ? 'Vence hoje!' : `Faltam ${l.diff_days} dias — ${new Date(l.due_date).toLocaleDateString('pt-BR')}`}</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:end;gap:4px">
      <span class="badge-sm ${l.urgency === 'overdue' ? 'badge-danger' : l.urgency === 'urgent' ? 'badge-warning' : 'badge-info'}">${labels[l.urgency]}</span>
      <div style="display:flex;gap:4px">
        <button class="btn-icon" onclick="openAutoLembreteDetails(${l.task_id})" title="Ver detalhes">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="btn-icon" onclick="completeAutoLembrete(${l.task_id})" title="Marcar tarefa como concluída">✅</button>
      </div>
    </div>
  </div>`).join('');
  container.innerHTML = countBar + cards;
}

async function openAutoLembreteDetails(taskId) {
  const l = autoLembretesCache.find(a => a.task_id === taskId);
  if (!l) return;
  if (tasksCache.length === 0) {
    try { tasksCache = await api('/tasks'); } catch(e) {}
  }
  const t = tasksCache.find(t => Number(t.id) === Number(taskId));
  const urgencyLabels = { overdue: 'Atrasado', urgent: 'Urgente', warning: 'Atenção', info: 'Em dia' };
  const urgencyColors = { overdue: 'var(--danger)', urgent: 'var(--warning)', warning: 'var(--info)', info: 'var(--success)' };
  const priorityColors = { alta: 'var(--danger)', media: 'var(--warning)', baixa: 'var(--text-light)' };
  const dueDate = l.due_date ? new Date(l.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
  const diffText = l.diff_days < 0 ? Math.abs(l.diff_days) + ' dias atrasado' : l.diff_days === 0 ? 'Vence hoje!' : 'Faltam ' + l.diff_days + ' dias';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal modal-details">
    <div class="details-header">
      <div class="details-header-left">
        <span class="details-badge" style="background:${urgencyColors[l.urgency] || 'var(--text-light)'}">${urgencyLabels[l.urgency] || '-'}</span>
        <span class="details-badge" style="background:${priorityColors[l.priority] || 'var(--text-light)'}">${priorityLabel(l.priority)}</span>
        ${l.item_number ? '<span class="details-num">[' + l.item_number + ']</span>' : ''}
      </div>
      <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()" title="Fechar">✕</button>
    </div>
    <h3 class="details-title">${l.title}</h3>
    ${t && t.description ? '<div class="details-description">' + t.description + '</div>' : '<div class="details-description details-empty">Sem descrição</div>'}

    <div class="details-grid">
      <div class="detail-row"><span class="detail-label">📁 Categoria</span><span class="detail-value">${l.category || '-'}</span></div>
      <div class="detail-row"><span class="detail-label">👥 Equipe</span><span class="detail-value">${l.responsible_team || 'N/A'}</span></div>
      <div class="detail-row"><span class="detail-label">⏰ Prazo do Manual</span><span class="detail-value">${l.deadline || '-'}</span></div>
      <div class="detail-row"><span class="detail-label">📅 Data de Vencimento</span><span class="detail-value">${dueDate}</span></div>
      <div class="detail-row"><span class="detail-label">⏳ Status</span><span class="detail-value" style="color:${urgencyColors[l.urgency]}">${diffText}</span></div>
      <div class="detail-row"><span class="detail-label">📊 Prioridade</span><span class="detail-value">${priorityLabel(l.priority)}</span></div>
    </div>

    ${t && t.notes ? '<div class="detail-section"><div class="detail-section-title">📝 Observações</div><div class="detail-section-body">' + t.notes + '</div></div>' : ''}

    <div class="detail-section">
      <div class="detail-section-title">ℹ️ Sobre Lembretes Automáticos</div>
      <div class="detail-section-body">Este lembrete foi gerado automaticamente com base no prazo do manual em relação à data do Encontro. Para remover este lembrete, marque a tarefa vinculada como concluída.</div>
    </div>

    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
      <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); completeAutoLembrete(${taskId})">✅ Marcar como Concluída</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function completeAutoLembrete(taskId) {
  if (!confirm('Marcar esta tarefa como concluída? O lembrete será removido da lista.')) return;
  await api(`/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'concluido' }) });
  toast('Tarefa concluída! Lembrete removido.', 'success');
  renderLembretes();
}

function renderManualLembretes(list) {
  const container = document.getElementById('manual-lembretes');
  if (list.length === 0) {
    container.innerHTML = '<p style="color:var(--text-light);padding:12px">Nenhum lembrete encontrado com os filtros atuais.</p>';
    return;
  }
  const statusBadges = { pendente: 'badge-warning', concluido: 'badge-success' };
  const priorityBadges = { alta: 'badge-danger', media: 'badge-warning', baixa: 'badge-info' };
  const catIcons = LEMBRETE_CATEGORY_ICONS;
  container.innerHTML = list.map(l => {
    const cat = l.category || 'Geral MOs';
    const linked = l.related_task_id ? '<span class="badge-sm badge-info" title="Vinculado ao checklist">🔗 Checklist</span>' : '<span class="badge-sm badge-gray" title="Não vinculado">⚠️ Sem vínculo</span>';
    return `<div class="lembrete-card ${l.status === 'concluido' ? '' : 'info'}">
    <div class="lembrete-icon">${l.status === 'concluido' ? '✅' : '🔔'}</div>
    <div class="lembrete-info">
      <div class="lembrete-title">${l.title}</div>
      ${l.description ? `<div class="lembrete-meta">${l.description}</div>` : ''}
      <div class="lembrete-meta" style="margin-top:2px">
        <span class="lem-cat-badge">${catIcons[cat] || '📌'} ${cat}</span>
        ${l.due_date ? ` · <span class="lembrete-due" style="display:inline">Vence em ${new Date(l.due_date).toLocaleDateString('pt-BR')}</span>` : ''}
        · ${linked}
      </div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:end;gap:4px">
      <span class="badge-sm ${statusBadges[l.status] || 'badge-gray'}">${l.status}</span>
      <span class="badge-sm ${priorityBadges[l.priority] || 'badge-gray'}">${l.priority}</span>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn-icon" onclick="openLembreteDetails(${l.id})" title="Ver detalhes">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="btn-icon" onclick="toggleLembreteStatus(${l.id})" title="${l.status === 'concluido' ? 'Reabrir' : 'Concluir'}">${l.status === 'concluido' ? '↩️' : '✅'}</button>
        <button class="btn-icon" onclick="openLembreteModal(${l.id})" title="Editar">✏️</button>
        <button class="btn-icon" onclick="deleteLembrete(${l.id})" title="Excluir">🗑️</button>
      </div>
    </div>
  </div>`;
  }).join('');
}

async function syncLembretesTasks() {
  const result = await api('/lembretes/sync', { method: 'POST' });
  toast(result.message || 'Sincronização concluída!', 'success');
  renderLembretes();
}

async function toggleLembreteStatus(id) {
  const l = lembretesCache.find(l => l.id === id);
  const next = l.status === 'concluido' ? 'pendente' : 'concluido';
  await api(`/lembretes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
  l.status = next;
  applyLemFilters();
  toast(next === 'concluido' ? 'Lembrete concluído!' : 'Lembrete reaberto', next === 'concluido' ? 'success' : '');
}

function openLembreteModal(id) {
  const l = id ? lembretesCache.find(l => l.id === id) : null;
  const catOpts = LEMBRETE_CATEGORIES.map(c =>
    `<option value="${c}" ${l?.category === c ? 'selected' : ''}>${LEMBRETE_CATEGORY_ICONS[c] || '📌'} ${c}</option>`
  ).join('');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>${l ? 'Editar Lembrete' : 'Novo Lembrete'}</h3>
    <div class="form-group"><label>Título</label><input id="lem-title" value="${l?.title || ''}"></div>
    <div class="form-group"><label>Descrição</label><textarea id="lem-desc" rows="2">${l?.description || ''}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Data</label><input id="lem-date" type="date" value="${l?.due_date || ''}"></div>
      <div class="form-group"><label>Prioridade</label><select id="lem-priority"><option value="baixa" ${l?.priority==='baixa'?'selected':''}>Baixa</option><option value="media" ${l?.priority==='media'?'selected':''}>Média</option><option value="alta" ${l?.priority==='alta'?'selected':''}>Alta</option></select></div>
    </div>
    <div class="form-group"><label>Módulo / Categoria</label><select id="lem-category">${catOpts}</select></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveLembrete(${id || 'null'}, this)">${l ? 'Salvar' : 'Criar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function saveLembrete(id, btn) {
  const data = {
    title: val('lem-title'), description: val('lem-desc'),
    due_date: val('lem-date'), priority: val('lem-priority'),
    category: val('lem-category')
  };
  if (id) await api(`/lembretes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  else await api('/lembretes', { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Lembrete salvo!', 'success');
  renderLembretes();
}

async function deleteLembrete(id) {
  if (!confirm('Excluir este lembrete?')) return;
  await api(`/lembretes/${id}`, { method: 'DELETE' });
  toast('Lembrete excluído', 'error');
  renderLembretes();
}

// ============ PADRINHOS ============
let padrinhosCache = [];
let participantsForPadrinhos = [];

async function renderPadrinhos() {
  padrinhosCache = await api('/padrinhos');
  participantsForPadrinhos = await api('/participants');
  const main = document.getElementById('main-content');
  const atribuidos = padrinhosCache.filter(p => p.status !== 'nao_atribuido').length;
  const concluidos = padrinhosCache.filter(p => p.status === 'concluido').length;
  const semPadrinho = participantsForPadrinhos.filter(p => !padrinhosCache.find(pd => pd.participant_id === p.id)).length;
  main.innerHTML = `
    <h1 class="page-title">Padrinhos & Madrinhas</h1>
    <p class="page-subtitle">Acompanhamento dos 5 passos do padrinho para cada matéria-prima</p>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon total">👥</div><div class="stat-info"><h3>${participantsForPadrinhos.length}</h3><p>Matérias-primas</p></div></div>
      <div class="stat-card"><div class="stat-icon done">✅</div><div class="stat-info"><h3>${concluidos}</h3><p>Processo Completo</p></div></div>
      <div class="stat-card"><div class="stat-icon progress">⏳</div><div class="stat-info"><h3>${atribuidos - concluidos}</h3><p>Em Andamento</p></div></div>
      <div class="stat-card"><div class="stat-icon pending">⭕</div><div class="stat-info"><h3>${semPadrinho}</h3><p>Sem Padrinho</p></div></div>
    </div>
    <div class="filters">
      <button class="btn btn-primary btn-sm" onclick="openPadrinhoModal()">+ Atribuir Padrinho</button>
    </div>
    <div id="padrinhos-list"></div>
  `;
  renderPadrinhoCards();
}

function renderPadrinhoCards() {
  const container = document.getElementById('padrinhos-list');
  if (padrinhosCache.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhum padrinho atribuído ainda. Clique em "+ Atribuir Padrinho" para começar.</p></div>';
    return;
  }
  const stepNames = ['1º Contato', 'Convite', 'Confirmação', 'Reunião', 'Acompanhamento'];
  const stepFields = ['step1_contact', 'step2_invitation', 'step3_confirmation', 'step4_meeting', 'step5_acompanhamento'];
  container.innerHTML = padrinhosCache.map(p => {
    const mp = participantsForPadrinhos.find(pt => pt.id === p.participant_id);
    const mpName = prettifyPersonName(mp ? mp.name : '');
    const padrinhoName = prettifyPersonName(p.padrinho_name, { couple: true });
    const stepsDone = stepFields.filter(s => p[s]).length;
    return `<div class="padrinho-card">
      <div class="padrinho-header">
        <div>
          <div class="padrinho-name">${mpName || 'Matéria-prima #' + p.participant_id}</div>
          <div class="padrinho-meta">Padrinho/Madrinha: ${padrinhoName || '—'} ${p.padrinho_phone ? '— 📞 ' + p.padrinho_phone : ''}</div>
          ${p.notes ? `<div class="padrinho-meta">${p.notes}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:end;gap:4px">
          <span class="badge-sm ${p.status === 'concluido' ? 'badge-success' : p.status === 'em_andamento' ? 'badge-info' : 'badge-gray'}">${p.status.replace(/_/g, ' ')}</span>
          <span style="font-size:11px;color:var(--text-light)">${stepsDone}/5 passos</span>
          <div style="display:flex;gap:4px">
            <button class="btn-icon" onclick="openPadrinhoModal(${p.id})">✏️</button>
            <button class="btn-icon" onclick="deletePadrinho(${p.id})">🗑️</button>
          </div>
        </div>
      </div>
      <div class="padrinho-steps">
        ${stepNames.map((name, i) => `<div class="padrinho-step ${p[stepFields[i]] ? 'done' : ''}" onclick="togglePadrinhoStep(${p.id}, ${i+1})">
          <span class="padrinho-step-num">${p[stepFields[i]] ? '✓' : i+1}</span>${name}
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

async function togglePadrinhoStep(id, step) {
  const p = padrinhosCache.find(p => p.id === id);
  const stepFields = ['step1_contact', 'step2_invitation', 'step3_confirmation', 'step4_meeting', 'step5_acompanhamento'];
  const field = stepFields[step - 1];
  const newValue = !p[field];
  await api(`/padrinhos/${id}/step`, { method: 'PATCH', body: JSON.stringify({ step, value: newValue }) });
  p[field] = newValue;
  const stepsDone = stepFields.filter(s => p[s]).length;
  p.status = stepsDone === 5 ? 'concluido' : stepsDone > 0 ? 'em_andamento' : 'nao_atribuido';
  renderPadrinhoCards();
  toast(`Passo ${step} ${newValue ? 'concluído' : 'reaberto'}`, newValue ? 'success' : '');
}

function openPadrinhoModal(id) {
  const p = id ? padrinhosCache.find(p => p.id === id) : null;
  const unassigned = participantsForPadrinhos.filter(pt => !padrinhosCache.find(pd => pd.participant_id === pt.id) || (p && p.participant_id === pt.id));
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>${p ? 'Editar Padrinho' : 'Atribuir Padrinho'}</h3>
    <div class="form-group"><label>Matéria-prima</label><select id="pd-participant">${unassigned.map(pt => `<option value="${pt.id}" ${p?.participant_id===pt.id?'selected':''}>${pt.name}</option>`).join('')}</select></div>
    <div class="form-row">
      <div class="form-group"><label>Nome do Padrinho/Madrinha</label><input id="pd-name" value="${p?.padrinho_name || ''}"></div>
      <div class="form-group"><label>Telefone</label><input id="pd-phone" value="${p?.padrinho_phone || ''}"></div>
    </div>
    <div class="form-group"><label>Observações</label><textarea id="pd-notes" rows="2">${p?.notes || ''}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="savePadrinho(${id || 'null'}, this)">${p ? 'Salvar' : 'Atribuir'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function savePadrinho(id, btn) {
  const data = {
    participant_id: val('pd-participant'), padrinho_name: val('pd-name'),
    padrinho_phone: val('pd-phone'), notes: val('pd-notes'),
  };
  if (id) await api(`/padrinhos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  else await api('/padrinhos', { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Padrinho salvo!', 'success');
  renderPadrinhos();
}

async function deletePadrinho(id) {
  if (!confirm('Remover este padrinho?')) return;
  await api(`/padrinhos/${id}`, { method: 'DELETE' });
  toast('Padrinho removido', 'error');
  renderPadrinhos();
}

// ============ FORNECEDORES ============
let fornecedoresCache = [];

async function renderFornecedores() {
  fornecedoresCache = await api('/fornecedores');
  const main = document.getElementById('main-content');
  const list = fornecedoresCache.filter(f => (f.type || 'fornecedor') === 'fornecedor');
  const contratados = list.filter(f => f.status === 'contratado').length;
  const pendentes = list.filter(f => f.status === 'pendente').length;
  const categories = [...new Set(list.map(f => f.category).filter(Boolean))].sort();
  main.innerHTML = `
    <h1 class="page-title">Fornecedores</h1>
    <p class="page-subtitle">Gestão de fornecedores e prestadores de serviços</p>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon total">📦</div><div class="stat-info"><h3>${list.length}</h3><p>Total Fornecedores</p></div></div>
      <div class="stat-card"><div class="stat-icon done">✅</div><div class="stat-info"><h3>${contratados}</h3><p>Contratados</p></div></div>
      <div class="stat-card"><div class="stat-icon pending">⭕</div><div class="stat-info"><h3>${pendentes}</h3><p>Pendentes</p></div></div>
    </div>
    <div class="filters">
      <div class="filter-group">
        <span class="filter-label">Categoria:</span>
        <select id="forn-cat" onchange="filterFornecedores()">
          <option value="">Todas</option>
          ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openFornecedorModal()">+ Novo Fornecedor</button>
    </div>
    <div class="fornecedor-grid" id="fornecedores-grid"></div>
  `;
  renderFornecedorCards(list);
}

function filterFornecedores() {
  const cat = document.getElementById('forn-cat').value;
  let list = fornecedoresCache.filter(f => (f.type || 'fornecedor') === 'fornecedor');
  if (cat) list = list.filter(f => f.category === cat);
  renderFornecedorCards(list);
}

function renderFornecedorCards(list) {
  const container = document.getElementById('fornecedores-grid');
  if (list.length === 0) { container.innerHTML = '<div class="empty-state"><p>Nenhum fornecedor cadastrado.</p></div>'; return; }
  const statusLabels = { contatado: 'Contatado', pendente: 'Pendente', contratado: 'Contratado', cancelado: 'Cancelado' };
  const statusBadges = { contatado: 'badge-info', pendente: 'badge-warning', contratado: 'badge-success', cancelado: 'badge-danger' };
  container.innerHTML = list.map(f => `<div class="fornecedor-card status-${f.status}">
    <div style="display:flex;justify-content:space-between;align-items:start">
      <div>
        <div class="fornecedor-name">${f.name || 'Sem nome'}</div>
        <div class="fornecedor-service">${f.service || ''}</div>
        <div class="fornecedor-contact">
          ${f.category ? `📁 ${f.category}<br>` : ''}
          ${f.contact_person ? `👤 ${f.contact_person}<br>` : ''}
          ${f.phone ? `📞 ${f.phone}<br>` : ''}
          ${f.whatsapp ? `💬 ${f.whatsapp}<br>` : ''}
          ${f.email ? `✉️ ${f.email}<br>` : ''}
        </div>
        ${f.estimated_cost || f.actual_cost ? `<div class="fornecedor-cost">Estimado: R$ ${(f.estimated_cost||0).toFixed(2)} ${f.actual_cost ? `| Real: R$ ${(f.actual_cost||0).toFixed(2)}` : ''}</div>` : ''}
        ${f.notes ? `<div style="font-size:12px;color:var(--text-light);margin-top:6px">${f.notes}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:end;gap:4px">
        <span class="badge-sm ${statusBadges[f.status] || 'badge-gray'}">${statusLabels[f.status] || f.status}</span>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn-icon" onclick="cycleFornecedorStatus(${f.id})">🔄</button>
          <button class="btn-icon" onclick="openFornecedorModal(${f.id})">✏️</button>
          <button class="btn-icon" onclick="deleteFornecedor(${f.id})">🗑️</button>
        </div>
      </div>
    </div>
  </div>`).join('');
}

// ============ PAIS DE MPs ============
async function renderPaisMP() {
  fornecedoresCache = await api('/fornecedores');
  const main = document.getElementById('main-content');
  const list = fornecedoresCache.filter(f => f.type === 'pai_mp');
  const contatados = list.filter(f => f.status === 'contratado').length;
  const pendentes = list.filter(f => f.status === 'pendente').length;
  main.innerHTML = `
    <h1 class="page-title">Pais de MPs</h1>
    <p class="page-subtitle">Contatos dos pais/responsáveis das matérias-primas</p>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon total">👨‍👩‍👧</div><div class="stat-info"><h3>${list.length}</h3><p>Total Pais de MPs</p></div></div>
      <div class="stat-card"><div class="stat-icon done">✅</div><div class="stat-info"><h3>${contatados}</h3><p>Contatados</p></div></div>
      <div class="stat-card"><div class="stat-icon pending">⭕</div><div class="stat-info"><h3>${pendentes}</h3><p>Pendentes</p></div></div>
    </div>
    <div class="filters">
      <button class="btn btn-primary btn-sm" onclick="openPaiMPModal()">+ Novo Pai de MP</button>
    </div>
    <div class="fornecedor-grid" id="fornecedores-grid"></div>
  `;
  renderPaiMPCards(list);
}

function renderPaiMPCards(list) {
  const container = document.getElementById('fornecedores-grid');
  if (list.length === 0) { container.innerHTML = '<div class="empty-state"><p>Nenhum pai de MP cadastrado.</p></div>'; return; }
  const statusLabels = { contatado: 'Contatado', pendente: 'Pendente', contratado: 'Contatado', cancelado: 'Cancelado' };
  const statusBadges = { contatado: 'badge-info', pendente: 'badge-warning', contratado: 'badge-success', cancelado: 'badge-danger' };
  container.innerHTML = list.map(f => `<div class="fornecedor-card status-${f.status}">
    <div style="display:flex;justify-content:space-between;align-items:start">
      <div>
        <div class="fornecedor-name">${f.name || 'Sem nome'}</div>
        <div class="fornecedor-contact">
          ${f.mp_name ? `🧒 Filho(a): ${f.mp_name}<br>` : ''}
          ${f.relationship ? `🔗 Parentesco: ${f.relationship}<br>` : ''}
          ${f.phone ? `📞 ${f.phone}<br>` : ''}
          ${f.whatsapp ? `💬 ${f.whatsapp}<br>` : ''}
          ${f.email ? `✉️ ${f.email}<br>` : ''}
        </div>
        ${f.notes ? `<div style="font-size:12px;color:var(--text-light);margin-top:6px">${f.notes}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:end;gap:4px">
        <span class="badge-sm ${statusBadges[f.status] || 'badge-gray'}">${statusLabels[f.status] || f.status}</span>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn-icon" onclick="cycleFornecedorStatus(${f.id})">🔄</button>
          <button class="btn-icon" onclick="openPaiMPModal(${f.id})">✏️</button>
          <button class="btn-icon" onclick="deleteFornecedor(${f.id})">🗑️</button>
        </div>
      </div>
    </div>
  </div>`).join('');
}

async function cycleFornecedorStatus(id) {
  const f = fornecedoresCache.find(f => f.id === id);
  const order = ['contatado', 'pendente', 'contratado', 'cancelado'];
  const next = order[(order.indexOf(f.status) + 1) % order.length];
  await api(`/fornecedores/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
  f.status = next;
  if (currentPage === 'pais') renderPaisMP(); else renderFornecedores();
  toast(`Status: ${next}`, next === 'contratado' ? 'success' : '');
}

function openFornecedorModal(id) {
  const f = id ? fornecedoresCache.find(f => f.id === id) : null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>${f ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
    <div class="form-row">
      <div class="form-group"><label>Nome/Empresa</label><input id="fr-name" value="${f?.name || ''}"></div>
      <div class="form-group"><label>Categoria</label><select id="fr-cat">${['Espaço Físico','Traslado','Alimentação','Materiais Gráficos','Som e Técnica','Capela','Lembrancinhas','Rosas','Outros'].map(c=>`<option value="${c}" ${f?.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
    </div>
    <div class="form-group"><label>Serviço</label><input id="fr-service" value="${f?.service || ''}"></div>
    <div class="form-row">
      <div class="form-group"><label>Telefone</label><input id="fr-phone" value="${f?.phone || ''}"></div>
      <div class="form-group"><label>WhatsApp</label><input id="fr-wpp" value="${f?.whatsapp || ''}"></div>
      <div class="form-group"><label>Email</label><input id="fr-email" value="${f?.email || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Pessoa de Contato</label><input id="fr-contact" value="${f?.contact_person || ''}"></div>
      <div class="form-group"><label>Status</label><select id="fr-status"><option value="contatado" ${f?.status==='contatado'?'selected':''}>Contatado</option><option value="pendente" ${f?.status==='pendente'?'selected':''}>Pendente</option><option value="contratado" ${f?.status==='contratado'?'selected':''}>Contratado</option><option value="cancelado" ${f?.status==='cancelado'?'selected':''}>Cancelado</option></select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Custo Estimado (R$)</label><input id="fr-est" type="number" step="0.01" value="${f?.estimated_cost || 0}"></div>
      <div class="form-group"><label>Custo Real (R$)</label><input id="fr-act" type="number" step="0.01" value="${f?.actual_cost || 0}"></div>
    </div>
    <div class="form-group"><label>Observações</label><textarea id="fr-notes" rows="2">${f?.notes || ''}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveFornecedor(${id || 'null'}, this)">${f ? 'Salvar' : 'Cadastrar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function openPaiMPModal(id) {
  const f = id ? fornecedoresCache.find(f => f.id === id) : null;
  if (!participantsCache.length) participantsCache = await api('/participants');
  const participants = participantsCache;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>${f ? 'Editar Pai de MP' : 'Novo Pai de MP'}</h3>
    <div class="form-row">
      <div class="form-group"><label>Nome do Pai/Mãe</label><input id="fr-name" value="${f?.name || ''}"></div>
      <div class="form-group"><label>Parentesco</label><select id="fr-relationship">${['Pai','Mãe','Avô/Avó','Tio/Tia','Outro'].map(r=>`<option value="${r}" ${f?.relationship===r?'selected':''}>${r}</option>`).join('')}</select></div>
    </div>
    <div class="form-group"><label>Matéria-prima (Filho(a))</label><select id="fr-mp-name"><option value="">— Selecionar —</option>${participants.map(p=>`<option value="${p.name}" ${f?.mp_name===p.name?'selected':''}>${p.name}</option>`).join('')}</select></div>
    <div class="form-row">
      <div class="form-group"><label>Telefone</label><input id="fr-phone" value="${f?.phone || ''}"></div>
      <div class="form-group"><label>WhatsApp</label><input id="fr-wpp" value="${f?.whatsapp || ''}"></div>
      <div class="form-group"><label>Email</label><input id="fr-email" value="${f?.email || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Status</label><select id="fr-status"><option value="contatado" ${f?.status==='contatado'?'selected':''}>Contatado</option><option value="pendente" ${f?.status==='pendente'?'selected':''}>Pendente</option><option value="contratado" ${f?.status==='contratado'?'selected':''}>Confirmado</option><option value="cancelado" ${f?.status==='cancelado'?'selected':''}>Cancelado</option></select></div>
    </div>
    <div class="form-group"><label>Observações</label><textarea id="fr-notes" rows="2">${f?.notes || ''}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="savePaiMP(${id || 'null'}, this)">${f ? 'Salvar' : 'Cadastrar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function saveFornecedor(id, btn) {
  const data = {
    type: 'fornecedor',
    name: val('fr-name'), category: val('fr-cat'), service: val('fr-service'),
    phone: val('fr-phone'), whatsapp: val('fr-wpp'), email: val('fr-email'),
    contact_person: val('fr-contact'), status: val('fr-status'),
    estimated_cost: parseFloat(val('fr-est')) || 0, actual_cost: parseFloat(val('fr-act')) || 0,
    notes: val('fr-notes'),
  };
  if (id) await api(`/fornecedores/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  else await api('/fornecedores', { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Fornecedor salvo!', 'success');
  if (currentPage === 'pais') renderPaisMP(); else renderFornecedores();
}

async function savePaiMP(id, btn) {
  const data = {
    type: 'pai_mp',
    name: val('fr-name'), relationship: val('fr-relationship'),
    mp_name: val('fr-mp-name'),
    phone: val('fr-phone'), whatsapp: val('fr-wpp'), email: val('fr-email'),
    status: val('fr-status'),
    notes: val('fr-notes'),
  };
  if (id) await api(`/fornecedores/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  else await api('/fornecedores', { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Pai de MP salvo!', 'success');
  if (currentPage === 'pais') renderPaisMP(); else renderFornecedores();
}

async function deleteFornecedor(id) {
  if (!confirm('Excluir este registro?')) return;
  await api(`/fornecedores/${id}`, { method: 'DELETE' });
  toast('Registro excluído', 'error');
  if (currentPage === 'pais') renderPaisMP(); else renderFornecedores();
}

// ============ KIT DAS MATÉRIAS-PRIMAS ============
let kitParticipantsCache = [];

async function renderKit() {
  kitParticipantsCache = await api('/participants');
  const main = document.getElementById('main-content');
  const total = kitParticipantsCache.length;
  const kitsConferidos = kitParticipantsCache.filter(p => p.kit_conferido).length;
  const squeezesProntas = kitParticipantsCache.filter(p => p.squeeze_personalizada).length;
  const kitsEntregues = kitParticipantsCache.filter(p => p.kit_entregue).length;

  const kitItems = [
    { item: 'Bloco de anotação', momento: 'Início do Encontro', anexo: 'ANEXO VII' },
    { item: 'Caneta', momento: 'Início do Encontro', anexo: 'ANEXO VIII' },
    { item: 'Cordão com pingente do Espírito Santo', momento: 'Acabamento', anexo: 'ANEXO IX' },
    { item: 'Fitas coloridas da JUMIRE (separação das squeezes)', momento: 'Início do Encontro', anexo: 'ANEXO X' },
    { item: 'Lembrancinhas do RH (18 modelos)', momento: 'Durante o Encontro', anexo: 'ANEXO XI' },
    { item: 'Livreto de Orações', momento: 'Início do Encontro', anexo: '-' },
    { item: 'Oração do Compromissado de bolso', momento: 'Acabamento', anexo: 'ANEXO XII' },
    { item: 'Oração do Espírito Santo para instrutores', momento: 'Início do Encontro', anexo: 'ANEXO XIII' },
    { item: 'Sacolinha/Mochila', momento: 'Início do Encontro', anexo: 'ANEXO XIV' },
    { item: 'Squeeze (personalizar com nome)', momento: 'Antes do Encontro', anexo: 'ANEXO XV' },
  ];

  main.innerHTML = `
    <h1 class="page-title">Kit das Matérias-primas</h1>
    <p class="page-subtitle">Controle de conferência e entrega dos kits — responsabilidade do RH</p>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon total">📦</div><div class="stat-info"><h3>${total}</h3><p>Matérias-primas</p></div></div>
      <div class="stat-card"><div class="stat-icon done">✅</div><div class="stat-info"><h3>${kitsConferidos}</h3><p>Kits Conferidos</p></div></div>
      <div class="stat-card"><div class="stat-icon progress">👕</div><div class="stat-info"><h3>${squeezesProntas}</h3><p>Squeezes Personalizadas</p></div></div>
      <div class="stat-card"><div class="stat-icon pending">🎁</div><div class="stat-info"><h3>${kitsEntregues}</h3><p>Kits Entregues</p></div></div>
    </div>
    <div class="card">
      <div class="card-title">Itens do Kit (10 itens por matéria-prima)</div>
      <div class="kit-items-list">
        ${kitItems.map(k => `<div class="kit-item-row">
          <span class="kit-item-name">${k.item}</span>
          <span class="kit-item-moment">${k.momento}</span>
          <span class="kit-item-anexo">${k.anexo}</span>
        </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-title">Controle por Matéria-prima</div>
      ${total === 0 ? '<div class="empty-state"><p>Nenhuma matéria-prima inscrita ainda.</p></div>' : `
      <div class="kit-table-wrapper">
        <table class="kit-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>Kit Conferido</th>
              <th>Squeeze Personalizada</th>
              <th>Kit Entregue</th>
            </tr>
          </thead>
          <tbody id="kit-tbody">
          </tbody>
        </table>
      </div>`}
    </div>
  `;
  renderKitTable();
}

function renderKitTable() {
  const tbody = document.getElementById('kit-tbody');
  if (!tbody) return;
  tbody.innerHTML = kitParticipantsCache.map((p, i) => `<tr>
    <td>${i + 1}</td>
    <td class="kit-name">${p.name || '—'}</td>
    <td class="kit-toggle-cell">
      <div class="kit-toggle ${p.kit_conferido ? 'checked' : ''}" onclick="toggleKitField(${p.id}, 'kit_conferido')">
        ${p.kit_conferido ? '✓' : ''}
      </div>
    </td>
    <td class="kit-toggle-cell">
      <div class="kit-toggle ${p.squeeze_personalizada ? 'checked' : ''}" onclick="toggleKitField(${p.id}, 'squeeze_personalizada')">
        ${p.squeeze_personalizada ? '✓' : ''}
      </div>
    </td>
    <td class="kit-toggle-cell">
      <div class="kit-toggle ${p.kit_entregue ? 'checked' : ''}" onclick="toggleKitField(${p.id}, 'kit_entregue')">
        ${p.kit_entregue ? '✓' : ''}
      </div>
    </td>
  </tr>`).join('');
}

async function toggleKitField(participantId, field) {
  const p = kitParticipantsCache.find(p => p.id === participantId);
  if (!p) return;
  const newValue = !p[field];
  await api(`/participants/${participantId}/kit`, { method: 'PATCH', body: JSON.stringify({ [field]: newValue }) });
  p[field] = newValue;
  renderKitTable();
  toast(`Kit atualizado!`, newValue ? 'success' : '');
}

// ============ AVISOS ============
let avisosCache = [];

async function renderAvisos() {
  avisosCache = await api('/avisos');
  const main = document.getElementById('main-content');
  const pinned = avisosCache.filter(a => a.pinned);
  const others = avisosCache.filter(a => !a.pinned);
  main.innerHTML = `
    <h1 class="page-title">Avisos & Comunicados</h1>
    <p class="page-subtitle">Mural de comunicações do coordenador para equipes e participantes</p>
    <div class="filters">
      <button class="btn btn-primary btn-sm" onclick="openAvisoModal()">+ Novo Aviso</button>
    </div>
    ${pinned.length > 0 ? '<div id="pinned-avisos"></div>' : ''}
    <div id="other-avisos"></div>
  `;
  renderAvisoCards(pinned, 'pinned-avisos');
  renderAvisoCards(others, 'other-avisos');
}

function renderAvisoCards(list, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (list.length === 0) { if (containerId === 'other-avisos') container.innerHTML = '<div class="empty-state"><p>Nenhum aviso publicado.</p></div>'; return; }
  const priorityLabels = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
  const targetLabels = { todos: 'Todos', equipes: 'Equipes', materias_primas: 'Matérias-primas', coordenacao: 'Coordenação' };
  container.innerHTML = list.map(a => `<div class="aviso-card priority-${a.priority} ${a.pinned ? 'pinned' : ''}">
    <div class="aviso-header">
      <div>
        <div class="aviso-title">${a.title}</div>
        <div class="aviso-content" style="margin-top:6px">${a.content || ''}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:end;gap:4px">
        <span class="aviso-pin" onclick="togglePinAviso(${a.id})">${a.pinned ? '📌' : '📍'}</span>
        <div style="display:flex;gap:4px">
          <button class="btn-icon" onclick="openAvisoModal(${a.id})">✏️</button>
          <button class="btn-icon" onclick="deleteAviso(${a.id})">🗑️</button>
        </div>
      </div>
    </div>
    <div class="aviso-meta">
      <span>👤 ${a.author || 'Coordenador'}</span>
      <span>🎯 ${targetLabels[a.target] || a.target}</span>
      <span>⚠️ ${priorityLabels[a.priority] || a.priority}</span>
      ${a.created_at ? `<span>📅 ${new Date(a.created_at).toLocaleDateString('pt-BR')}</span>` : ''}
    </div>
  </div>`).join('');
}

async function togglePinAviso(id) {
  const a = avisosCache.find(a => a.id === id);
  await api(`/avisos/${id}/pin`, { method: 'PATCH', body: JSON.stringify({ pinned: !a.pinned }) });
  a.pinned = !a.pinned;
  toast(a.pinned ? 'Aviso fixado!' : 'Aviso desfixado', '');
  renderAvisos();
}

function openAvisoModal(id) {
  const a = id ? avisosCache.find(a => a.id === id) : null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>${a ? 'Editar Aviso' : 'Novo Aviso'}</h3>
    <div class="form-group"><label>Título</label><input id="av-title" value="${a?.title || ''}"></div>
    <div class="form-group"><label>Conteúdo</label><textarea id="av-content" rows="4">${a?.content || ''}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Público-alvo</label><select id="av-target"><option value="todos" ${a?.target==='todos'?'selected':''}>Todos</option><option value="equipes" ${a?.target==='equipes'?'selected':''}>Equipes</option><option value="materias_primas" ${a?.target==='materias_primas'?'selected':''}>Matérias-primas</option><option value="coordenacao" ${a?.target==='coordenacao'?'selected':''}>Coordenação</option></select></div>
      <div class="form-group"><label>Prioridade</label><select id="av-priority"><option value="baixa" ${a?.priority==='baixa'?'selected':''}>Baixa</option><option value="media" ${a?.priority==='media'?'selected':''}>Média</option><option value="alta" ${a?.priority==='alta'?'selected':''}>Alta</option></select></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveAviso(${id || 'null'}, this)">${a ? 'Salvar' : 'Publicar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function saveAviso(id, btn) {
  const data = { title: val('av-title'), content: val('av-content'), target: val('av-target'), priority: val('av-priority') };
  if (id) await api(`/avisos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  else await api('/avisos', { method: 'POST', body: JSON.stringify(data) });
  btn.closest('.modal-overlay').remove();
  toast('Aviso publicado!', 'success');
  renderAvisos();
}

async function deleteAviso(id) {
  if (!confirm('Excluir este aviso?')) return;
  await api(`/avisos/${id}`, { method: 'DELETE' });
  toast('Aviso excluído', 'error');
  renderAvisos();
}

// ============ DETALHES (TASKS & LEMBRETES) ============

async function openTaskDetails(id) {
  const t = tasksCache.find(t => t.id === id);
  if (!t) return;
  if (lembretesCache.length === 0) {
    try { lembretesCache = await api('/lembretes'); } catch(e) {}
  }
  const linkedLem = lembretesCache.find(l => Number(l.related_task_id) === Number(id));
  const statusColors = { concluido: 'var(--success)', em_andamento: 'var(--warning)', pendente: 'var(--text-light)' };
  const priorityColors = { alta: 'var(--danger)', media: 'var(--warning)', baixa: 'var(--text-light)' };
  const phaseLabel = t.phase === 'during' ? 'Durante o Encontro' : 'Pré-Encontro';
  const created = t.created_at ? new Date(t.created_at).toLocaleString('pt-BR') : '-';
  const updated = t.updated_at ? new Date(t.updated_at).toLocaleString('pt-BR') : '-';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal modal-details">
    <div class="details-header">
      <div class="details-header-left">
        <span class="details-badge" style="background:${statusColors[t.status] || 'var(--text-light)'}">${statusLabel(t.status)}</span>
        <span class="details-badge" style="background:${priorityColors[t.priority] || 'var(--text-light)'}">${priorityLabel(t.priority)}</span>
        ${t.item_number ? `<span class="details-num">[${t.item_number}]</span>` : ''}
      </div>
      <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()" title="Fechar">✕</button>
    </div>
    <h3 class="details-title">${t.title}</h3>
    ${t.description ? `<div class="details-description">${t.description}</div>` : '<div class="details-description details-empty">Sem descrição</div>'}

    <div class="details-grid">
      <div class="detail-row"><span class="detail-label">📁 Categoria</span><span class="detail-value">${t.category || '-'}</span></div>
      <div class="detail-row"><span class="detail-label">🔄 Fase</span><span class="detail-value">${phaseLabel}</span></div>
      <div class="detail-row"><span class="detail-label">👥 Equipe</span><span class="detail-value">${t.responsible_team || '-'}</span></div>
      <div class="detail-row"><span class="detail-label">⏰ Prazo</span><span class="detail-value">${t.deadline || '-'}</span></div>
    </div>

    ${t.notes ? `<div class="detail-section"><div class="detail-section-title">📝 Observações</div><div class="detail-section-body">${t.notes}</div></div>` : ''}

    ${linkedLem ? `<div class="detail-section detail-linked">
      <div class="detail-section-title">🔗 Lembrete Vinculado</div>
      <div class="detail-section-body">
        <div><strong>${linkedLem.title}</strong></div>
        ${linkedLem.description ? `<div class="detail-sub">${linkedLem.description}</div>` : ''}
        <div class="detail-sub">Status: ${linkedLem.status} · Prioridade: ${priorityLabel(linkedLem.priority)} · Vencimento: ${linkedLem.due_date ? new Date(linkedLem.due_date).toLocaleDateString('pt-BR') : '-'}</div>
      </div>
    </div>` : ''}

    <div class="detail-timestamps">
      <span>Criado em: ${created}</span>
      ${updated !== '-' ? `<span>Atualizado em: ${updated}</span>` : ''}
    </div>

    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
      <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); openTaskModal(${id})">✏️ Editar</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function openLembreteDetails(id) {
  const l = lembretesCache.find(l => l.id === id);
  if (!l) return;
  if (tasksCache.length === 0) {
    try { tasksCache = await api('/tasks'); } catch(e) {}
  }
  const linkedTask = l.related_task_id ? tasksCache.find(t => Number(t.id) === Number(l.related_task_id)) : null;
  const statusColors = { concluido: 'var(--success)', pendente: 'var(--warning)' };
  const priorityColors = { alta: 'var(--danger)', media: 'var(--warning)', baixa: 'var(--text-light)' };
  const cat = l.category || 'Geral MOs';
  const catIcon = LEMBRETE_CATEGORY_ICONS[cat] || '📌';
  const created = l.created_at ? new Date(l.created_at).toLocaleString('pt-BR') : '-';
  const updated = l.updated_at ? new Date(l.updated_at).toLocaleString('pt-BR') : '-';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal modal-details">
    <div class="details-header">
      <div class="details-header-left">
        <span class="details-badge" style="background:${statusColors[l.status] || 'var(--text-light)'}">${l.status === 'concluido' ? 'Concluído' : 'Pendente'}</span>
        <span class="details-badge" style="background:${priorityColors[l.priority] || 'var(--text-light)'}">${priorityLabel(l.priority)}</span>
        <span class="details-badge" style="background:var(--info)">${catIcon} ${cat}</span>
      </div>
      <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()" title="Fechar">✕</button>
    </div>
    <h3 class="details-title">${l.title}</h3>
    ${l.description ? `<div class="details-description">${l.description}</div>` : '<div class="details-description details-empty">Sem descrição</div>'}

    <div class="details-grid">
      <div class="detail-row"><span class="detail-label">📅 Vencimento</span><span class="detail-value">${l.due_date ? new Date(l.due_date).toLocaleDateString('pt-BR') : '-'}</span></div>
      <div class="detail-row"><span class="detail-label">📌 Categoria</span><span class="detail-value">${cat}</span></div>
      <div class="detail-row"><span class="detail-label">🔗 Vínculo</span><span class="detail-value">${l.related_task_id ? 'Vinculado ao checklist' : 'Sem vínculo'}</span></div>
      <div class="detail-row"><span class="detail-label">📊 Status</span><span class="detail-value">${l.status === 'concluido' ? 'Concluído' : 'Pendente'}</span></div>
    </div>

    ${linkedTask ? `<div class="detail-section detail-linked">
      <div class="detail-section-title">🔗 Tarefa Vinculada no Checklist</div>
      <div class="detail-section-body">
        <div><strong>[${linkedTask.item_number}] ${linkedTask.title}</strong></div>
        ${linkedTask.description ? `<div class="detail-sub">${linkedTask.description}</div>` : ''}
        <div class="detail-sub">Categoria: ${linkedTask.category || '-'} · Equipe: ${linkedTask.responsible_team || '-'} · Status: ${statusLabel(linkedTask.status)}</div>
      </div>
    </div>` : ''}

    <div class="detail-timestamps">
      <span>Criado em: ${created}</span>
      ${updated !== '-' ? `<span>Atualizado em: ${updated}</span>` : ''}
    </div>

    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
      <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); openLembreteModal(${id})">✏️ Editar</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// INIT
currentPage = getPageFromHash();
updateActiveNav();
renderPage();
checkVersionUpdate();
startActiveUsersTracking();

function getSessionId() {
  let sid = localStorage.getItem('app_session_id');
  if (!sid) {
    sid = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('app_session_id', sid);
  }
  return sid;
}

async function sendHeartbeat() {
  try {
    await api('/heartbeat', { method: 'POST', body: JSON.stringify({ sessionId: getSessionId() }) });
  } catch (e) {}
}

async function updateActiveUsersCount() {
  try {
    const data = await api('/active-users');
    const el = document.getElementById('active-users-count');
    if (el) el.textContent = data.count;
  } catch (e) {}
}

function startActiveUsersTracking() {
  sendHeartbeat();
  updateActiveUsersCount();
  setInterval(sendHeartbeat, 30000);
  setInterval(updateActiveUsersCount, 10000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { sendHeartbeat(); updateActiveUsersCount(); }
  });
}

async function checkVersionUpdate() {
  try {
    const data = await api('/version');
    if (!data.latest) return;
    const seenVersion = localStorage.getItem('app_version_seen') || '';
    if (data.latest.version !== seenVersion) {
      showVersionModal(data.latest);
      localStorage.setItem('app_version_seen', data.latest.version);
    }
  } catch (e) {}
}

function showVersionModal(info) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal" style="max-width:520px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <span style="font-size:28px">🎉</span>
      <div>
        <h3 style="margin:0">Atualização v${info.version}</h3>
        <span style="font-size:12px;color:var(--text-light)">${info.date} — ${info.title}</span>
      </div>
    </div>
    <div style="margin:12px 0">
      <p style="font-weight:600;margin-bottom:8px">O que há de novo:</p>
      <ul style="margin:0;padding-left:20px;line-height:1.8">
        ${info.changes.map(c => '<li>' + c + '</li>').join('')}
      </ul>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Entendi</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}
