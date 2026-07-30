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

// ============ NAVIGATION ============
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    currentPage = item.dataset.page;
    renderPage();
    closeSidebar();
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
      countdownHTML = `<div class="card" style="text-align:center">
        <div class="card-title">Contagem Regressiva para o Encontro</div>
        <div class="countdown">
          <div class="countdown-unit"><div class="countdown-number">${days}</div><div class="countdown-label">Dias</div></div>
          <div class="countdown-unit"><div class="countdown-number">${hours}</div><div class="countdown-label">Horas</div></div>
          <div class="countdown-unit"><div class="countdown-number">${mins}</div><div class="countdown-label">Min</div></div>
        </div>
        <p style="color:var(--text-light);font-size:13px">${enc.name || 'Encontro Compromisso Trin'} — ${new Date(enc.start_date).toLocaleDateString('pt-BR')}</p>
      </div>`;
    }
  }

  const paidCount = participants.filter(p => p.paid).length;
  const lemDone = lembrancinhas.filter(l => l.status === 'pronto').length;
  const lemTotal = lembrancinhas.length;

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
      <div class="card-title">Progresso Geral</div>
      <div class="progress-container">
        <div class="progress-label"><span>${stats.done} de ${stats.total} tarefas</span><span>${pct}%</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Progresso por Categoria</div>
      ${stats.byCategory.map(c => {
        const cp = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
        return `<div class="progress-container">
          <div class="progress-label"><span>${c.category}</span><span>${c.done}/${c.total} (${cp}%)</span></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${cp}%"></div></div>
        </div>`;
      }).join('')}
    </div>
    <div class="card">
      <div class="card-title">Progresso por Equipe</div>
      ${stats.byTeam.map(t => {
        const tp = t.total > 0 ? Math.round((t.done / t.total) * 100) : 0;
        return `<div class="progress-container">
          <div class="progress-label"><span>${t.team || 'N/A'}</span><span>${t.done}/${t.total} (${tp}%)</span></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${tp}%"></div></div>
        </div>`;
      }).join('')}
    </div>
  `;
  updateSidebarProgress(pct);
}

// ============ CHECKLIST ============
let currentPhaseTab = 'pre';

async function renderChecklist() {
  tasksCache = await api('/tasks');
  const main = document.getElementById('main-content');
  const preCount = tasksCache.filter(t => (t.phase || 'pre') === 'pre').length;
  const duringCount = tasksCache.filter(t => t.phase === 'during').length;
  main.innerHTML = `
    <h1 class="page-title">Checklist do Encontro</h1>
    <p class="page-subtitle">Tarefas divididas por fase: preparação antes do Encontro e execução durante o Encontro.</p>
    <div class="phase-tabs" style="display:flex;gap:0;margin-bottom:16px;border-bottom:2px solid var(--border)">
      <button class="phase-tab ${currentPhaseTab==='pre'?'active':''}" onclick="switchPhaseTab('pre')" style="padding:10px 20px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:600;border-bottom:3px solid ${currentPhaseTab==='pre'?'var(--primary)':'transparent'};color:${currentPhaseTab==='pre'?'var(--primary)':'var(--text-light)'};margin-bottom:-2px">
        📋 Pré-Encontro <span class="badge" style="margin-left:6px">${preCount}</span>
      </button>
      <button class="phase-tab ${currentPhaseTab==='during'?'active':''}" onclick="switchPhaseTab('during')" style="padding:10px 20px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:600;border-bottom:3px solid ${currentPhaseTab==='during'?'var(--primary)':'transparent'};color:${currentPhaseTab==='during'?'var(--primary)':'var(--text-light)'};margin-bottom:-2px">
        🏗️ Durante o Encontro <span class="badge" style="margin-left:6px">${duringCount}</span>
      </button>
    </div>
    <div class="filters">
      <input type="text" class="search-box" id="task-search" placeholder="Buscar tarefa..." oninput="filterTasks()">
      <div class="filter-group">
        <span class="filter-label">Status:</span>
        <select id="filter-status" onchange="filterTasks()">
          <option value="">Todos</option>
          <option value="pendente">Pendente</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="concluido">Concluído</option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">Equipe:</span>
        <select id="filter-team" onchange="filterTasks()">
          <option value="">Todas</option>
        </select>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openTaskModal()">+ Nova Tarefa</button>
    </div>
    <div id="task-phase-content"></div>
  `;
  const teams = [...new Set(tasksCache.map(t => t.responsible_team).filter(Boolean))].sort();
  const teamSelect = document.getElementById('filter-team');
  teams.forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; teamSelect.appendChild(o); });
  renderChecklistSections(tasksCache);
}

function switchPhaseTab(phase) {
  currentPhaseTab = phase;
  renderChecklistSections(tasksCache);
  document.querySelectorAll('.phase-tab').forEach(btn => {
    const isActive = btn.textContent.includes(phase === 'pre' ? 'Pré-Encontro' : 'Durante o Encontro');
    btn.style.borderBottom = isActive ? '3px solid var(--primary)' : '3px solid transparent';
    btn.style.color = isActive ? 'var(--primary)' : 'var(--text-light)';
  });
}

function filterTasks() {
  const search = document.getElementById('task-search').value.toLowerCase();
  const status = document.getElementById('filter-status').value;
  const team = document.getElementById('filter-team').value;
  let filtered = tasksCache;
  if (search) filtered = filtered.filter(t => t.title.toLowerCase().includes(search) || (t.description || '').toLowerCase().includes(search));
  if (status) filtered = filtered.filter(t => t.status === status);
  if (team) filtered = filtered.filter(t => t.responsible_team === team);
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

function renderChecklistSections(tasks) {
  const phaseTasks = tasks.filter(t => (t.phase || 'pre') === currentPhaseTab);
  const moTasks = phaseTasks.filter(isMOTask);
  const teamSpecificTasks = phaseTasks.filter(t => !isMOTask(t));
  const container = document.getElementById('task-phase-content');
  if (!container) return;
  const phaseLabel = currentPhaseTab === 'pre' ? 'Pré-Encontro' : 'Durante o Encontro';
  container.innerHTML = `
    <div class="card" style="margin-bottom:12px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">
      <div style="font-size:13px;color:var(--text-light)">
        <strong>${phaseLabel}:</strong> ${phaseTasks.length} tarefas &nbsp;|&nbsp;
        <strong>MO's:</strong> ${moTasks.length} &nbsp;|&nbsp;
        <strong>Equipes:</strong> ${teamSpecificTasks.length}
      </div>
      <button class="btn btn-secondary btn-sm" onclick="goToEquipesFromChecklist()">Ver responsabilidades por equipe</button>
    </div>
    <h3 style="margin:16px 0 8px;color:var(--primary)">Responsabilidades Gerais (MO's)</h3>
    <div id="task-categories-mos"></div>
    <h3 style="margin:20px 0 8px;color:var(--primary)">Tarefas Específicas por Equipe</h3>
    <div id="task-categories-teams"></div>
  `;
  renderTaskCategories(moTasks, 'task-categories-mos', `Nenhuma tarefa de MO encontrada para ${phaseLabel} com os filtros atuais.`);
  renderTaskCategories(teamSpecificTasks, 'task-categories-teams', `Nenhuma tarefa específica de equipe encontrada para ${phaseLabel} com os filtros atuais.`);
}

function renderTaskCategories(tasks, containerId = 'task-categories', emptyMessage = 'Nenhuma tarefa encontrada.') {
  const categories = [...new Set(tasks.map(t => t.category))];
  const container = document.getElementById(containerId);
  if (!container) return;
  if (tasks.length === 0) {
    container.innerHTML = `<div class="card" style="color:var(--text-light)">${emptyMessage}</div>`;
    return;
  }
  container.innerHTML = categories.map(cat => {
    const items = tasks.filter(t => t.category === cat);
    const done = items.filter(t => t.status === 'concluido').length;
    return `<div class="task-category">
      <div class="task-category-header" onclick="toggleCategory(this)">
        <span>${cat}</span>
        <span style="display:flex;align-items:center;gap:8px">
          <span class="badge">${done}/${items.length}</span>
          <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </div>
      <div class="task-list">${items.map(t => renderTaskItem(t)).join('')}</div>
    </div>`;
  }).join('');
}

function renderTaskItem(t) {
  const checkboxClass = t.status === 'concluido' ? 'checked' : t.status === 'em_andamento' ? 'in-progress' : '';
  return `<div class="task-item status-${t.status}">
    <div class="task-checkbox ${checkboxClass}" onclick="cycleTaskStatus(${t.id})"></div>
    <div class="task-body">
      <div class="task-title">[${t.item_number}] ${t.title}</div>
      ${t.description ? `<div class="task-desc">${t.description}</div>` : ''}
      <div class="task-meta">
        ${t.responsible_team ? `<span class="tag tag-team" style="cursor:pointer" onclick="filterByTeam('${t.responsible_team.replace(/'/g,"\\'")}')">${t.responsible_team}</span>` : ''}
        ${t.deadline ? `<span class="tag tag-deadline">⏰ ${t.deadline}</span>` : ''}
        <span class="tag tag-priority-${t.priority}">${priorityLabel(t.priority)}</span>
      </div>
    </div>
    <div class="task-actions">
      <button class="btn-icon" onclick="openTaskModal(${t.id})" title="Editar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="btn-icon" onclick="deleteTask(${t.id})" title="Excluir">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>`;
}

function toggleCategory(header) {
  const list = header.nextElementSibling;
  const chevron = header.querySelector('.chevron');
  list.classList.toggle('collapsed');
  chevron.classList.toggle('collapsed');
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
        return `<div class="schedule-day">
          <div class="schedule-day-header">📅 ${day} (${items.length} atividades)</div>
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
    return `<div class="schedule-day">
      <div class="schedule-day-header">📅 ${day} (${items.length} atividades)</div>
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
        return `<div class="team-card" style="border-left:4px solid var(--jumire-green)">
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
            <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px">
              <div style="font-size:11px;font-weight:600;color:var(--primary);margin-bottom:6px">📅 No Encontro (${schedDone}/${teamSchedule.length} concluídas)</div>
              <div style="max-height:180px;overflow-y:auto">
                ${teamSchedule.map(s => `<div style="display:flex;gap:6px;align-items:center;padding:3px 0;font-size:11px">
                  <span style="color:var(--primary);font-weight:700;min-width:42px">${s.time}</span>
                  <span style="color:var(--text);flex:1">${s.activity}</span>
                  <span style="color:var(--text-light);font-size:10px">${s.day.replace('-feira','')}</span>
                  <span style="width:10px;height:10px;border-radius:50%;background:${s.status==='concluido'?'var(--success)':'var(--border)'};flex-shrink:0"></span>
                </div>`).join('')}
              </div>
            </div>
          ` : ''}

          ${teamTasks.length > 0 ? `
            <div style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px">
              <div style="font-size:11px;font-weight:600;color:var(--primary);margin-bottom:6px">📋 Tarefas de Preparação</div>
              <div style="max-height:200px;overflow-y:auto">
                ${teamTasks.map(task => `<div style="display:flex;gap:6px;align-items:flex-start;padding:3px 0;font-size:11px">
                  <span style="width:14px;height:14px;border-radius:50%;border:1.5px solid ${task.status==='concluido'?'var(--success)':task.status==='em_andamento'?'var(--warning)':'var(--border)'};background:${task.status==='concluido'?'var(--success)':task.status==='em_andamento'?'rgba(243,156,18,0.2)':'transparent'};flex-shrink:0;margin-top:1px;${task.status==='concluido'?'border-color:var(--success)':''}"></span>
                  <span style="color:var(--text-light);font-weight:600;min-width:28px">[${task.item_number}]</span>
                  <span style="color:var(--text);flex:1">${task.title}</span>
                  <span style="color:var(--text-light);font-size:10px;white-space:nowrap">${task.deadline || ''}</span>
                </div>`).join('')}
              </div>
            </div>
          ` : ''}

          ${teamLembrancinhas.length > 0 ? `
            <div style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px">
              <div style="font-size:11px;font-weight:600;color:var(--primary);margin-bottom:6px">🎁 Lembrancinhas</div>
              ${teamLembrancinhas.map(l => `<div style="display:flex;gap:6px;align-items:center;padding:3px 0;font-size:11px">
                <span style="color:var(--text);flex:1">${l.item_name || '—'}</span>
                <span style="color:var(--text-light);font-size:10px">${l.quantity_done || 0}/${l.quantity_needed || 0}</span>
                <span style="font-size:9px;padding:1px 6px;border-radius:8px;background:${l.status==='pronto'?'var(--success)':l.status==='em_andamento'?'var(--warning)':'var(--border)'};color:#fff;font-weight:600">${(l.status||'—').replace(/_/g,' ')}</span>
              </div>`).join('')}
            </div>
          ` : ''}

          ${teamAlicerces.length > 0 ? `
            <div style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px">
              <div style="font-size:11px;font-weight:600;color:var(--primary);margin-bottom:6px">🏛️ Alicerces/Alvenarias</div>
              ${teamAlicerces.map(a => `<div style="display:flex;gap:6px;align-items:center;padding:3px 0;font-size:11px">
                <span style="color:var(--text);flex:1">${a.title}</span>
                <span style="font-size:9px;padding:1px 6px;border-radius:8px;background:${a.status==='concluido'?'var(--success)':a.status==='atribuido'?'var(--warning)':'var(--border)'};color:#fff;font-weight:600">${(a.status||'—').replace(/_/g,' ')}</span>
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
        <div class="info-item"><label>Nome</label><div class="info-value">${enc.name || '—'}</div></div>
        <div class="info-item"><label>Data de Início</label><div class="info-value">${enc.start_date || '—'}</div></div>
        <div class="info-item"><label>Data de Fim</label><div class="info-value">${enc.end_date || '—'}</div></div>
        <div class="info-item"><label>Local</label><div class="info-value">${enc.location || '—'}</div></div>
        <div class="info-item"><label>Tema</label><div class="info-value">${enc.theme || '—'}</div></div>
        <div class="info-item"><label>Música Tema</label><div class="info-value">${enc.theme_song || '—'}</div></div>
        <div class="info-item"><label>Status</label><div class="info-value">${statusLabel(enc.status || 'em_preparacao')}</div></div>
      </div>
      <button class="btn btn-primary" onclick="editEncontro(${enc.id || 0})">Editar Dados</button>
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
          <div class="btn-pdf-info"><h4>Fornecedores & Pais de MPs</h4><p>Contatos, cotações e pais das matérias-primas</p></div>
        </a>
        <a class="btn-pdf" href="/reports/avisos" target="_blank">
          <div class="btn-pdf-icon" style="background:rgba(241,196,15,0.15);color:var(--warning)">📢</div>
          <div class="btn-pdf-info"><h4>Mural de Avisos</h4><p>Comunicados fixados e prioritários para impressão</p></div>
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
    return `<div class="participant-card ${p.paid ? 'paid' : 'pending-payment'}">
    <div class="participant-name">${displayName || 'Sem nome'} ${p.paid ? '<span class="badge-sm badge-success">Pago</span>' : '<span class="badge-sm badge-warning">Pendente</span>'} ${p.presente ? '<span class="badge-sm badge-info">Presente</span>' : ''}</div>
    <div class="participant-info">
      ${p.cracha_name ? `Crachá: ${p.cracha_name}<br>` : ''}
      ${p.age ? `Idade: ${p.age} anos<br>` : ''}
      ${p.gender ? `Sexo: ${p.gender === 'MASC' ? 'Masculino' : 'Feminino'}<br>` : ''}
      ${p.phone ? `Tel: ${p.phone}<br>` : ''}
      ${p.food_restriction ? `⚠️ Restrição alimentar: ${p.food_restriction}<br>` : ''}
      ${p.medication ? `💊 Medicação: ${p.medication}<br>` : ''}
      ${p.special_needs ? `♿ Necessidades especiais: ${p.special_needs}<br>` : ''}
      ${p.shirt_size ? `Camiseta: ${p.shirt_size}<br>` : ''}
      ${p.group ? `Grupo: ${p.group}<br>` : ''}
      ${p.room ? `Quarto: ${p.room}<br>` : ''}
      ${displayPadrinho ? `Padrinho/Madrinha: ${displayPadrinho}<br>` : ''}
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

async function renderFinanceiro() {
  financeCache = await api('/finance');
  const summary = await api('/finance/summary');
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h1 class="page-title">Controle Financeiro</h1>
    <p class="page-subtitle">Receitas e despesas do Encontro Compromisso Trin</p>
    <div class="finance-summary">
      <div class="finance-card income"><div class="label">Receitas</div><div class="amount">R$ ${summary.income.toFixed(2)}</div></div>
      <div class="finance-card expense"><div class="label">Despesas</div><div class="amount">R$ ${summary.expenses.toFixed(2)}</div></div>
      <div class="finance-card balance"><div class="label">Saldo</div><div class="amount">R$ ${summary.balance.toFixed(2)}</div></div>
      <div class="finance-card pending"><div class="label">Pendente a Receber</div><div class="amount">R$ ${summary.pendingIncome.toFixed(2)}</div></div>
      <div class="finance-card pending"><div class="label">Pendente a Pagar</div><div class="amount">R$ ${summary.pendingExpenses.toFixed(2)}</div></div>
    </div>
    <div class="filters">
      <div class="filter-group">
        <span class="filter-label">Tipo:</span>
        <select id="fin-type" onchange="filterFinance()">
          <option value="">Todos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
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
}

function filterFinance() {
  const type = document.getElementById('fin-type').value;
  let filtered = financeCache;
  if (type) filtered = filtered.filter(f => f.type === type);
  renderFinanceTable(filtered);
}

function renderFinanceTable(list) {
  const tbody = document.querySelector('#finance-table tbody');
  const cardsContainer = document.getElementById('finance-cards');
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
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">
    <h3>${f ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
    <div class="form-row">
      <div class="form-group"><label>Tipo</label><select id="f-type"><option value="receita" ${f?.type==='receita'?'selected':''}>Receita</option><option value="despesa" ${f?.type==='despesa'?'selected':''}>Despesa</option></select></div>
      <div class="form-group"><label>Categoria</label><input id="f-category" value="${f?.category || ''}" placeholder="Ex: Inscrições, Alimentação"></div>
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

// ============ LEMBRANCINHAS ============
let lembrancinhasCache = [];

async function renderLembrancinhas() {
  lembrancinhasCache = await api('/lembrancinhas');
  const main = document.getElementById('main-content');
  const done = lembrancinhasCache.filter(l => l.status === 'pronto').length;
  const inProgress = lembrancinhasCache.filter(l => l.status === 'em_andamento').length;
  const notStarted = lembrancinhasCache.filter(l => l.status === 'nao_iniciado').length;
  main.innerHTML = `
    <h1 class="page-title">Lembrancinhas</h1>
    <p class="page-subtitle">Controle de confecção por equipe — cada equipe confecciona suas lembrancinhas</p>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon total">🎁</div><div class="stat-info"><h3>${lembrancinhasCache.length}</h3><p>Total Itens</p></div></div>
      <div class="stat-card"><div class="stat-icon done">✅</div><div class="stat-info"><h3>${done}</h3><p>Prontos</p></div></div>
      <div class="stat-card"><div class="stat-icon progress">⏳</div><div class="stat-info"><h3>${inProgress}</h3><p>Em Andamento</p></div></div>
      <div class="stat-card"><div class="stat-icon pending">⭕</div><div class="stat-info"><h3>${notStarted}</h3><p>Não Iniciados</p></div></div>
    </div>
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

async function renderLembretes() {
  lembretesCache = await api('/lembretes');
  const auto = await api('/lembretes/auto');
  autoLembretesCache = auto.lembretes || [];
  const main = document.getElementById('main-content');
  const overdue = autoLembretesCache.filter(l => l.urgency === 'overdue');
  const urgent = autoLembretesCache.filter(l => l.urgency === 'urgent');
  const warning = autoLembretesCache.filter(l => l.urgency === 'warning');
  main.innerHTML = `
    <h1 class="page-title">Lembretes</h1>
    <p class="page-subtitle">Prazos calculados automaticamente a partir da data do Encontro</p>
    ${auto.message ? `<div class="card" style="text-align:center;color:var(--text-light)">${auto.message}</div>` : `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon pending">🚨</div><div class="stat-info"><h3>${overdue.length}</h3><p>Atrasados</p></div></div>
      <div class="stat-card"><div class="stat-icon progress">⚠️</div><div class="stat-info"><h3>${urgent.length}</h3><p>Esta Semana</p></div></div>
      <div class="stat-card"><div class="stat-icon total">📅</div><div class="stat-info"><h3>${warning.length}</h3><p>Próximo Mês</p></div></div>
      <div class="stat-card"><div class="stat-icon done">📋</div><div class="stat-info"><h3>${lembretesCache.length}</h3><p>Manuais</p></div></div>
    </div>`}
    <div class="card">
      <div class="card-title">Lembretes Automáticos (baseados nos prazos do manual)</div>
      <div id="auto-lembretes"></div>
    </div>
    <div class="card">
      <div class="card-title">Lembretes Manuais</div>
      <div class="filters">
        <button class="btn btn-primary btn-sm" onclick="openLembreteModal()">+ Novo Lembrete</button>
      </div>
      <div id="manual-lembretes"></div>
    </div>
  `;
  renderAutoLembretes(autoLembretesCache);
  renderManualLembretes(lembretesCache);
}

function renderAutoLembretes(list) {
  const container = document.getElementById('auto-lembretes');
  if (list.length === 0) { container.innerHTML = '<p style="color:var(--text-light);padding:12px">Nenhum lembrete automático. Defina a data do Encontro.</p>'; return; }
  const icons = { overdue: '🚨', urgent: '⚠️', warning: '📅', info: 'ℹ️' };
  const labels = { overdue: 'Atrasado', urgent: 'Urgente', warning: 'Atenção', info: 'Em dia' };
  container.innerHTML = list.slice(0, 30).map(l => `<div class="lembrete-card ${l.urgency}">
    <div class="lembrete-icon">${icons[l.urgency]}</div>
    <div class="lembrete-info">
      <div class="lembrete-title">${l.title}</div>
      <div class="lembrete-meta">${l.category} — Equipe: ${l.responsible_team || 'N/A'} — Prazo manual: ${l.deadline}</div>
      <div class="lembrete-due ${l.urgency}">${l.diff_days < 0 ? `${Math.abs(l.diff_days)} dias atrasado` : l.diff_days === 0 ? 'Vence hoje!' : `Faltam ${l.diff_days} dias — ${new Date(l.due_date).toLocaleDateString('pt-BR')}`}</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:end;gap:4px">
      <span class="badge-sm ${l.urgency === 'overdue' ? 'badge-danger' : l.urgency === 'urgent' ? 'badge-warning' : 'badge-info'}">${labels[l.urgency]}</span>
      <button class="btn-icon" onclick="completeAutoLembrete(${l.task_id})" title="Marcar tarefa como concluída">✅</button>
    </div>
  </div>`).join('');
}

async function completeAutoLembrete(taskId) {
  if (!confirm('Marcar esta tarefa como concluída? O lembrete será removido da lista.')) return;
  await api(`/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'concluido' }) });
  toast('Tarefa concluída! Lembrete removido.', 'success');
  renderLembretes();
}

function renderManualLembretes(list) {
  const container = document.getElementById('manual-lembretes');
  if (list.length === 0) { container.innerHTML = '<p style="color:var(--text-light);padding:12px">Nenhum lembrete manual.</p>'; return; }
  const statusBadges = { pendente: 'badge-warning', concluido: 'badge-success' };
  const priorityBadges = { alta: 'badge-danger', media: 'badge-warning', baixa: 'badge-info' };
  container.innerHTML = list.map(l => `<div class="lembrete-card ${l.status === 'concluido' ? '' : 'info'}">
    <div class="lembrete-icon">${l.status === 'concluido' ? '✅' : '🔔'}</div>
    <div class="lembrete-info">
      <div class="lembrete-title">${l.title}</div>
      ${l.description ? `<div class="lembrete-meta">${l.description}</div>` : ''}
      ${l.due_date ? `<div class="lembrete-due">Vence em ${new Date(l.due_date).toLocaleDateString('pt-BR')}</div>` : ''}
    </div>
    <div style="display:flex;flex-direction:column;align-items:end;gap:4px">
      <span class="badge-sm ${statusBadges[l.status] || 'badge-gray'}">${l.status}</span>
      <span class="badge-sm ${priorityBadges[l.priority] || 'badge-gray'}">${l.priority}</span>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn-icon" onclick="toggleLembreteStatus(${l.id})">${l.status === 'concluido' ? '↩️' : '✅'}</button>
        <button class="btn-icon" onclick="openLembreteModal(${l.id})">✏️</button>
        <button class="btn-icon" onclick="deleteLembrete(${l.id})">🗑️</button>
      </div>
    </div>
  </div>`).join('');
}

async function toggleLembreteStatus(id) {
  const l = lembretesCache.find(l => l.id === id);
  const next = l.status === 'concluido' ? 'pendente' : 'concluido';
  await api(`/lembretes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
  l.status = next;
  renderManualLembretes(lembretesCache);
  toast(next === 'concluido' ? 'Lembrete concluído!' : 'Lembrete reaberto', next === 'concluido' ? 'success' : '');
}

function openLembreteModal(id) {
  const l = id ? lembretesCache.find(l => l.id === id) : null;
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
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveLembrete(${id || 'null'}, this)">${l ? 'Salvar' : 'Criar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function saveLembrete(id, btn) {
  const data = { title: val('lem-title'), description: val('lem-desc'), due_date: val('lem-date'), priority: val('lem-priority') };
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
let fornecedoresTab = 'fornecedor'; // 'fornecedor' | 'pai_mp'

async function renderFornecedores() {
  fornecedoresCache = await api('/fornecedores');
  const main = document.getElementById('main-content');
  const fornecedores = fornecedoresCache.filter(f => (f.type || 'fornecedor') === 'fornecedor');
  const paisMP = fornecedoresCache.filter(f => f.type === 'pai_mp');
  const contratados = fornecedores.filter(f => f.status === 'contratado').length;
  const pendentes = fornecedores.filter(f => f.status === 'pendente').length;
  const paisContatados = paisMP.filter(f => f.status === 'contratado').length;
  const paisPendentes = paisMP.filter(f => f.status === 'pendente').length;
  main.innerHTML = `
    <h1 class="page-title">Fornecedores & Pais de MPs</h1>
    <p class="page-subtitle">Gestão de fornecedores e pais das matérias-primas</p>
    <div class="tab-bar">
      <button class="tab-btn ${fornecedoresTab==='fornecedor'?'active':''}" onclick="switchFornecedoresTab('fornecedor')">📦 Fornecedores (${fornecedores.length})</button>
      <button class="tab-btn ${fornecedoresTab==='pai_mp'?'active':''}" onclick="switchFornecedoresTab('pai_mp')">👨‍👩‍👧 Pais de MPs (${paisMP.length})</button>
    </div>
    <div id="fornecedores-content"></div>
  `;
  renderFornecedoresTab();
}

function switchFornecedoresTab(tab) {
  fornecedoresTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderFornecedoresTab();
}

function renderFornecedoresTab() {
  const content = document.getElementById('fornecedores-content');
  const list = fornecedoresCache.filter(f => (f.type || 'fornecedor') === fornecedoresTab);
  if (fornecedoresTab === 'fornecedor') {
    const categories = [...new Set(list.map(f => f.category).filter(Boolean))].sort();
    const contratados = list.filter(f => f.status === 'contratado').length;
    const pendentes = list.filter(f => f.status === 'pendente').length;
    content.innerHTML = `
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
  } else {
    const contatados = list.filter(f => f.status === 'contratado').length;
    const pendentes = list.filter(f => f.status === 'pendente').length;
    content.innerHTML = `
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
}

function filterFornecedores() {
  const cat = document.getElementById('forn-cat').value;
  let list = fornecedoresCache.filter(f => (f.type || 'fornecedor') === fornecedoresTab);
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
  renderFornecedoresTab();
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
  renderFornecedores();
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
  renderFornecedores();
}

async function deleteFornecedor(id) {
  if (!confirm('Excluir este registro?')) return;
  await api(`/fornecedores/${id}`, { method: 'DELETE' });
  toast('Registro excluído', 'error');
  renderFornecedores();
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

// INIT
renderPage();
