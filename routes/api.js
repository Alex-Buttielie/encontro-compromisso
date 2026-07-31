const express = require('express');
const db = require('../db/database');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// ============ VERSION ============

const activeUsers = new Map();
const ACTIVE_TIMEOUT = 2 * 60 * 1000;

function cleanInactiveUsers() {
  const now = Date.now();
  for (const [id, ts] of activeUsers) {
    if (now - ts > ACTIVE_TIMEOUT) activeUsers.delete(id);
  }
}

router.post('/heartbeat', (req, res) => {
  const sessionId = req.body.sessionId || req.headers['x-session-id'];
  if (sessionId) {
    activeUsers.set(sessionId, Date.now());
    cleanInactiveUsers();
  }
  res.json({ ok: true });
});

router.get('/active-users', (req, res) => {
  cleanInactiveUsers();
  res.json({ count: activeUsers.size });
});

router.get('/version', (req, res) => {
  try {
    const changelog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.json'), 'utf-8'));
    res.json({ latest: changelog[0], all: changelog });
  } catch (e) {
    res.json({ latest: null, all: [] });
  }
});

// ============ TASKS ============

router.get('/tasks', (req, res) => {
  const { category, status, priority, team, phase } = req.query;
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (priority) { sql += ' AND priority = ?'; params.push(priority); }
  if (team) { sql += ' AND responsible_team = ?'; params.push(team); }
  if (phase) { sql += ' AND phase = ?'; params.push(phase); }
  sql += ' ORDER BY category, CAST(item_number AS REAL), item_number';
  res.json(db.prepare(sql).all(...params));
});

router.post('/tasks', (req, res) => {
  const { category, item_number, title, description, responsible_team, deadline, priority, status, notes, phase } = req.body;
  const result = db.prepare(`INSERT INTO tasks (category, item_number, title, description, responsible_team, deadline, priority, status, notes, phase) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(category, item_number, title, description, responsible_team, deadline, priority, status || 'pendente', notes, phase || 'pre');
  res.json({ id: result.lastInsertRowid });
});

router.put('/tasks/:id', (req, res) => {
  const { category, item_number, title, description, responsible_team, deadline, priority, status, notes, phase } = req.body;
  db.prepare(`UPDATE tasks SET category=?, item_number=?, title=?, description=?, responsible_team=?, deadline=?, priority=?, status=?, notes=?, phase=?, updated_at=datetime('now','localtime') WHERE id=?`).run(category, item_number, title, description, responsible_team, deadline, priority, status, notes, phase || 'pre', req.params.id);
  // Sync linked lembrete
  const lembretes = db.getAll('lembretes');
  const lem = lembretes.find(l => Number(l.related_task_id) === Number(req.params.id));
  if (lem) {
    const lemFields = {};
    if (title) lemFields.title = title;
    if (description) lemFields.description = description;
    if (category) lemFields.category = category;
    if (priority) lemFields.priority = priority;
    if (deadline !== undefined) lemFields.due_date = deadline;
    if (status) lemFields.status = status === 'concluido' ? 'concluido' : 'pendente';
    if (Object.keys(lemFields).length > 0) {
      db.update('lembretes', lem.id, { ...lemFields, updated_at: new Date().toISOString() });
    }
  }
  res.json({ success: true });
});

router.patch('/tasks/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare(`UPDATE tasks SET status=?, updated_at=datetime('now','localtime') WHERE id=?`).run(status, req.params.id);
  // Sync linked lembrete
  const lembretes = db.getAll('lembretes');
  const lem = lembretes.find(l => Number(l.related_task_id) === Number(req.params.id));
  if (lem) {
    const lemStatus = status === 'concluido' ? 'concluido' : 'pendente';
    db.update('lembretes', lem.id, { status: lemStatus, updated_at: new Date().toISOString() });
  }
  res.json({ success: true });
});

router.delete('/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
  // Delete linked lembrete if it was auto-created from this task
  const lembretes = db.getAll('lembretes');
  const lem = lembretes.find(l => Number(l.related_task_id) === Number(req.params.id));
  if (lem) {
    db.remove('lembretes', lem.id);
  }
  res.json({ success: true });
});

// ============ TEAMS ============

router.get('/teams', (req, res) => {
  const teams = db.prepare('SELECT * FROM teams ORDER BY name').all();
  for (const t of teams) {
    t.members = db.prepare('SELECT * FROM team_members WHERE team_id=?').all(t.id);
  }
  res.json(teams);
});

router.post('/teams', (req, res) => {
  const { name, description } = req.body;
  const result = db.prepare('INSERT INTO teams (name, description) VALUES (?,?)').run(name, description);
  res.json({ id: result.lastInsertRowid });
});

router.put('/teams/:id', (req, res) => {
  const { name, description, responsible } = req.body;
  if (responsible) {
    const member = db.prepare('SELECT 1 FROM team_members WHERE team_id=? AND name=?').get(req.params.id, responsible);
    if (!member) {
      return res.status(400).json({ error: 'O encarregado deve ser um membro da equipe' });
    }
  }
  db.prepare('UPDATE teams SET name=?, description=?, responsible=? WHERE id=?').run(name, description, responsible || null, req.params.id);
  res.json({ success: true });
});

router.delete('/teams/:id', (req, res) => {
  db.prepare('DELETE FROM teams WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Team members
router.post('/teams/:id/members', (req, res) => {
  const { name, role, phone, email } = req.body;
  const result = db.prepare('INSERT INTO team_members (team_id, name, role, phone, email) VALUES (?,?,?,?,?)').run(req.params.id, name, role, phone, email);
  db.prepare('UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id=?) WHERE id=?').run(req.params.id, req.params.id);
  res.json({ id: result.lastInsertRowid });
});

router.delete('/teams/:teamId/members/:memberId', (req, res) => {
  db.prepare('DELETE FROM team_members WHERE id=? AND team_id=?').run(req.params.memberId, req.params.teamId);
  db.prepare('UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id=?) WHERE id=?').run(req.params.teamId, req.params.teamId);
  res.json({ success: true });
});

router.put('/teams/:teamId/members/:memberId', (req, res) => {
  const { name, role, phone, email } = req.body;
  db.prepare('UPDATE team_members SET name=?, role=?, phone=?, email=? WHERE id=? AND team_id=?').run(name, role, phone, email, req.params.memberId, req.params.teamId);
  res.json({ success: true });
});

// ============ SCHEDULE ============

router.get('/schedule', (req, res) => {
  const { day, team } = req.query;
  let sql = 'SELECT * FROM schedule_items WHERE 1=1';
  const params = [];
  if (day) { sql += ' AND day = ?'; params.push(day); }
  if (team) { sql += ' AND responsible_team LIKE ?'; params.push(`%${team}%`); }
  sql += ' ORDER BY CASE day WHEN "Sexta-feira" THEN 1 WHEN "Sábado" THEN 2 WHEN "Domingo" THEN 3 END, time';
  res.json(db.prepare(sql).all(...params));
});

router.post('/schedule', (req, res) => {
  const { day, time, activity, location, responsible_team, notes } = req.body;
  const result = db.prepare('INSERT INTO schedule_items (day, time, activity, location, responsible_team, notes) VALUES (?,?,?,?,?,?)').run(day, time, activity, location, responsible_team, notes);
  res.json({ id: result.lastInsertRowid });
});

router.put('/schedule/:id', (req, res) => {
  const { day, time, activity, location, responsible_team, notes, status } = req.body;
  db.prepare('UPDATE schedule_items SET day=?, time=?, activity=?, location=?, responsible_team=?, notes=?, status=? WHERE id=?').run(day, time, activity, location, responsible_team, notes, status, req.params.id);
  res.json({ success: true });
});

router.patch('/schedule/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE schedule_items SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ success: true });
});

router.delete('/schedule/:id', (req, res) => {
  db.prepare('DELETE FROM schedule_items WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ============ ENCOUNTER ============

router.get('/encounter', (req, res) => {
  const encounter = db.prepare('SELECT * FROM encounters ORDER BY id DESC LIMIT 1').get();
  res.json(encounter || {});
});

router.put('/encounter/:id', (req, res) => {
  const { name, start_date, end_date, location, theme, theme_song, status } = req.body;
  db.prepare('UPDATE encounters SET name=?, start_date=?, end_date=?, location=?, theme=?, theme_song=?, status=? WHERE id=?').run(name, start_date, end_date, location, theme, theme_song, status, req.params.id);
  res.json({ success: true });
});

// ============ STATS ============

router.get('/stats', (req, res) => {
  const allTasks = db.getAll('tasks');
  const preTasks = allTasks.filter(t => (t.phase || 'pre') === 'pre');
  const duringTasks = allTasks.filter(t => t.phase === 'during');
  const total = allTasks.length;
  const done = allTasks.filter(t => t.status === 'concluido').length;
  const inProgress = allTasks.filter(t => t.status === 'em_andamento').length;
  const pending = allTasks.filter(t => t.status === 'pendente').length;
  const preTotal = preTasks.length;
  const preDone = preTasks.filter(t => t.status === 'concluido').length;
  const duringTotal = duringTasks.length;
  const duringDone = duringTasks.filter(t => t.status === 'concluido').length;
  const byCategory = [...new Set(allTasks.map(t => t.category))].map(cat => {
    const items = allTasks.filter(t => t.category === cat);
    return { category: cat, total: items.length, done: items.filter(t => t.status === 'concluido').length };
  }).sort((a, b) => a.category.localeCompare(b.category));
  const byTeam = [...new Set(allTasks.map(t => t.responsible_team).filter(Boolean))].map(team => {
    const items = allTasks.filter(t => t.responsible_team === team);
    return { team, total: items.length, done: items.filter(t => t.status === 'concluido').length };
  }).sort((a, b) => a.team.localeCompare(b.team));
  const byPriority = ['baixa', 'media', 'alta'].map(p => {
    const items = allTasks.filter(t => t.priority === p);
    return { priority: p, total: items.length, done: items.filter(t => t.status === 'concluido').length };
  });
  res.json({ total, done, inProgress, pending, preTotal, preDone, duringTotal, duringDone, byCategory, byTeam, byPriority });
});

// ============ PARTICIPANTS (Matérias-primas) ============

router.get('/participants', (req, res) => {
  let list = db.getAll('participants');
  const { group, room, gender, status } = req.query;
  if (group) list = list.filter(p => p.group === group);
  if (room) list = list.filter(p => p.room === room);
  if (gender) list = list.filter(p => p.gender === gender);
  if (status) list = list.filter(p => p.status === status);
  list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  res.json(list);
});

router.post('/participants', (req, res) => {
  const { name, cracha_name, age, birth_date, gender, phone, email, whatsapp,
    school, course, work, father_name, father_phone, mother_name, mother_phone,
    lives_with_parents, siblings, indicated_by, best_friends, friend_doing_encounter,
    church_group, previous_retreats, food_restriction, medication, special_needs,
    shirt_size, group, room, padrinho, status, notes } = req.body;
  const id = db.insert('participants', {
    name, cracha_name, age, birth_date, gender, phone, email, whatsapp,
    school, course, work, father_name, father_phone, mother_name, mother_phone,
    lives_with_parents, siblings, indicated_by, best_friends, friend_doing_encounter,
    church_group, previous_retreats, food_restriction, medication, special_needs,
    shirt_size, group, room, padrinho, status: status || 'inscrito', notes,
    paid: false, paid_date: null
  });
  res.json({ id });
});

router.put('/participants/:id', (req, res) => {
  const fields = { ...req.body, updated_at: new Date().toISOString() };
  db.update('participants', req.params.id, fields);
  res.json({ success: true });
});

router.patch('/participants/:id/paid', (req, res) => {
  db.update('participants', req.params.id, { paid: req.body.paid, paid_date: req.body.paid ? new Date().toISOString() : null });
  res.json({ success: true });
});

router.patch('/participants/:id/kit', (req, res) => {
  const { kit_conferido, squeeze_personalizada, kit_entregue } = req.body;
  const updates = {};
  if (kit_conferido !== undefined) updates.kit_conferido = kit_conferido;
  if (squeeze_personalizada !== undefined) updates.squeeze_personalizada = squeeze_personalizada;
  if (kit_entregue !== undefined) updates.kit_entregue = kit_entregue;
  db.update('participants', req.params.id, { ...updates, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.patch('/participants/:id/presente', (req, res) => {
  db.update('participants', req.params.id, { presente: req.body.presente, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.delete('/participants/:id', (req, res) => {
  db.remove('participants', req.params.id);
  res.json({ success: true });
});

// ============ FINANCE ============

router.get('/finance', (req, res) => {
  let list = db.getAll('finance');
  const { type, category } = req.query;
  if (type) list = list.filter(f => f.type === type);
  if (category) list = list.filter(f => f.category === category);
  list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  res.json(list);
});

router.post('/finance', (req, res) => {
  const { type, category, description, amount, date, paid, responsible } = req.body;
  const id = db.insert('finance', {
    type, category, description, amount: parseFloat(amount) || 0,
    date: date || new Date().toISOString().slice(0, 10),
    paid: paid !== undefined ? paid : true, responsible
  });
  res.json({ id });
});

router.put('/finance/:id', (req, res) => {
  db.update('finance', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.delete('/finance/:id', (req, res) => {
  db.remove('finance', req.params.id);
  res.json({ success: true });
});

router.get('/finance/summary', (req, res) => {
  const items = db.getAll('finance');
  const income = items.filter(f => f.type === 'receita' && f.paid).reduce((s, f) => s + (f.amount || 0), 0);
  const expenses = items.filter(f => f.type === 'despesa' && f.paid).reduce((s, f) => s + (f.amount || 0), 0);
  const pendingIncome = items.filter(f => f.type === 'receita' && !f.paid).reduce((s, f) => s + (f.amount || 0), 0);
  const pendingExpenses = items.filter(f => f.type === 'despesa' && !f.paid).reduce((s, f) => s + (f.amount || 0), 0);
  const byCategory = {};
  for (const f of items) {
    const cat = f.category || 'Outros';
    if (!byCategory[cat]) byCategory[cat] = { receita: 0, despesa: 0 };
    if (f.type === 'receita' && f.paid) byCategory[cat].receita += f.amount || 0;
    if (f.type === 'despesa' && f.paid) byCategory[cat].despesa += f.amount || 0;
  }
  res.json({ income, expenses, balance: income - expenses, pendingIncome, pendingExpenses, byCategory });
});

// ============ FINANCE CATEGORIES ============

router.get('/finance/categories', (req, res) => {
  const list = db.getAll('finance_categories');
  list.sort((a, b) => (a.type || '').localeCompare(a.type || '') || (a.name || '').localeCompare(b.name || ''));
  res.json(list);
});

router.post('/finance/categories', (req, res) => {
  const { name, type, color, budget_limit, description } = req.body;
  const id = db.insert('finance_categories', {
    name, type: type || 'despesa', color: color || '#c0392b',
    budget_limit: parseFloat(budget_limit) || 0, description: description || ''
  });
  res.json({ id });
});

router.put('/finance/categories/:id', (req, res) => {
  db.update('finance_categories', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.delete('/finance/categories/:id', (req, res) => {
  db.remove('finance_categories', req.params.id);
  res.json({ success: true });
});

// ============ FINANCE EVENTS ============

router.get('/finance/events', (req, res) => {
  let list = db.getAll('finance_events');
  const { status } = req.query;
  if (status) list = list.filter(e => e.status === status);
  list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  res.json(list);
});

router.post('/finance/events', (req, res) => {
  const { name, type, date, description, expected_revenue, actual_revenue, expected_expense, actual_expense, status, location } = req.body;
  const id = db.insert('finance_events', {
    name, type: type || 'evento', date: date || new Date().toISOString().slice(0, 10),
    description: description || '',
    expected_revenue: parseFloat(expected_revenue) || 0, actual_revenue: parseFloat(actual_revenue) || 0,
    expected_expense: parseFloat(expected_expense) || 0, actual_expense: parseFloat(actual_expense) || 0,
    status: status || 'planejado', location: location || ''
  });
  res.json({ id });
});

router.put('/finance/events/:id', (req, res) => {
  db.update('finance_events', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.delete('/finance/events/:id', (req, res) => {
  db.remove('finance_events', req.params.id);
  res.json({ success: true });
});

// ============ FINANCE BUDGET ============

router.get('/finance/budget', (req, res) => {
  const list = db.getAll('finance_budget');
  list.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
  res.json(list);
});

router.post('/finance/budget', (req, res) => {
  const { category, type, planned_amount, notes } = req.body;
  const id = db.insert('finance_budget', {
    category, type: type || 'despesa',
    planned_amount: parseFloat(planned_amount) || 0, notes: notes || ''
  });
  res.json({ id });
});

router.put('/finance/budget/:id', (req, res) => {
  db.update('finance_budget', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.delete('/finance/budget/:id', (req, res) => {
  db.remove('finance_budget', req.params.id);
  res.json({ success: true });
});

// ============ FINANCE ANALYTICS ============

router.get('/finance/analytics', (req, res) => {
  const items = db.getAll('finance');
  const events = db.getAll('finance_events');
  const budget = db.getAll('finance_budget');

  // Monthly breakdown
  const monthly = {};
  for (const f of items) {
    if (!f.date) continue;
    const m = f.date.substring(0, 7);
    if (!monthly[m]) monthly[m] = { receita: 0, despesa: 0, receita_pendente: 0, despesa_pendente: 0 };
    if (f.type === 'receita') {
      if (f.paid) monthly[m].receita += f.amount || 0;
      else monthly[m].receita_pendente += f.amount || 0;
    } else {
      if (f.paid) monthly[m].despesa += f.amount || 0;
      else monthly[m].despesa_pendente += f.amount || 0;
    }
  }

  // Category breakdown with counts
  const byCategory = {};
  for (const f of items) {
    const cat = f.category || 'Outros';
    if (!byCategory[cat]) byCategory[cat] = { receita: 0, despesa: 0, count: 0, paid: 0, pending: 0 };
    byCategory[cat].count++;
    if (f.type === 'receita' && f.paid) byCategory[cat].receita += f.amount || 0;
    if (f.type === 'despesa' && f.paid) byCategory[cat].despesa += f.amount || 0;
    if (f.paid) byCategory[cat].paid++; else byCategory[cat].pending++;
  }

  // Payment status
  const paidCount = items.filter(f => f.paid).length;
  const pendingCount = items.filter(f => !f.paid).length;

  // Top expenses
  const topExpenses = items
    .filter(f => f.type === 'despesa')
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, 10)
    .map(f => ({ description: f.description, amount: f.amount, category: f.category, date: f.date }));

  // Top revenues
  const topRevenues = items
    .filter(f => f.type === 'receita')
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, 10)
    .map(f => ({ description: f.description, amount: f.amount, category: f.category, date: f.date }));

  // Budget vs actual
  const budgetVsActual = budget.map(b => {
    const actual = items
      .filter(f => f.category === b.category && f.type === b.type && f.paid)
      .reduce((s, f) => s + (f.amount || 0), 0);
    return {
      category: b.category, type: b.type,
      planned: b.planned_amount || 0, actual,
      difference: (b.planned_amount || 0) - actual
    };
  });

  // Events summary
  const eventsSummary = events.map(e => ({
    name: e.name, date: e.date, status: e.status,
    revenue: e.actual_revenue || 0, expense: e.actual_expense || 0,
    profit: (e.actual_revenue || 0) - (e.actual_expense || 0)
  }));

  res.json({
    monthly,
    byCategory,
    paymentStatus: { paid: paidCount, pending: pendingCount, total: items.length },
    topExpenses,
    topRevenues,
    budgetVsActual,
    eventsSummary,
    totalIncome: items.filter(f => f.type === 'receita' && f.paid).reduce((s, f) => s + (f.amount || 0), 0),
    totalExpenses: items.filter(f => f.type === 'despesa' && f.paid).reduce((s, f) => s + (f.amount || 0), 0),
    totalPendingIncome: items.filter(f => f.type === 'receita' && !f.paid).reduce((s, f) => s + (f.amount || 0), 0),
    totalPendingExpenses: items.filter(f => f.type === 'despesa' && !f.paid).reduce((s, f) => s + (f.amount || 0), 0),
  });
});

// ============ LEMBRANCINHAS ============

router.get('/lembrancinhas', (req, res) => {
  let list = db.getAll('lembrancinhas');
  const { team, status } = req.query;
  if (team) list = list.filter(l => l.team === team);
  if (status) list = list.filter(l => l.status === status);
  list.sort((a, b) => (a.team || '').localeCompare(b.team || ''));
  res.json(list);
});

router.post('/lembrancinhas', (req, res) => {
  const { team, item_name, description, quantity_needed, quantity_ready, status, delivery_date, notes } = req.body;
  const id = db.insert('lembrancinhas', {
    team, item_name, description, quantity_needed: parseInt(quantity_needed) || 0,
    quantity_ready: parseInt(quantity_ready) || 0, status: status || 'nao_iniciado',
    delivery_date, notes
  });
  res.json({ id });
});

router.put('/lembrancinhas/:id', (req, res) => {
  db.update('lembrancinhas', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.patch('/lembrancinhas/:id/status', (req, res) => {
  db.update('lembrancinhas', req.params.id, { status: req.body.status });
  res.json({ success: true });
});

router.delete('/lembrancinhas/:id', (req, res) => {
  db.remove('lembrancinhas', req.params.id);
  res.json({ success: true });
});

// ============ ESCOLINHAS ============

router.get('/escolinhas', (req, res) => {
  let list = db.getAll('escolinhas');
  const { type, status } = req.query;
  if (type) list = list.filter(e => e.type === type);
  if (status) list = list.filter(e => e.status === status);
  list.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  res.json(list);
});

router.post('/escolinhas', (req, res) => {
  const { name, type, date, time, location, description, target_audience, status, attendance } = req.body;
  const id = db.insert('escolinhas', {
    name, type, date, time, location, description, target_audience,
    status: status || 'agendada', attendance: attendance || []
  });
  res.json({ id });
});

router.put('/escolinhas/:id', (req, res) => {
  db.update('escolinhas', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.patch('/escolinhas/:id/status', (req, res) => {
  db.update('escolinhas', req.params.id, { status: req.body.status });
  res.json({ success: true });
});

router.delete('/escolinhas/:id', (req, res) => {
  db.remove('escolinhas', req.params.id);
  res.json({ success: true });
});

// ============ ALICERCES & ALVENARIAS ============

router.get('/alicerces', (req, res) => {
  let list = db.getAll('alicerces');
  const { type, status } = req.query;
  if (type) list = list.filter(a => a.type === type);
  if (status) list = list.filter(a => a.status === status);
  list.sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json(list);
});

router.post('/alicerces', (req, res) => {
  const { type, title, constructor_name, description, schedule_day, schedule_time, status, notes } = req.body;
  const id = db.insert('alicerces', {
    type, title, constructor_name, description, schedule_day, schedule_time,
    status: status || 'nao_atribuido', notes
  });
  res.json({ id });
});

router.put('/alicerces/:id', (req, res) => {
  db.update('alicerces', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.patch('/alicerces/:id/status', (req, res) => {
  db.update('alicerces', req.params.id, { status: req.body.status });
  res.json({ success: true });
});

router.delete('/alicerces/:id', (req, res) => {
  db.remove('alicerces', req.params.id);
  res.json({ success: true });
});

// ============ LEMBRETES ============

router.get('/lembretes', (req, res) => {
  let list = db.getAll('lembretes');
  const { status, priority, category } = req.query;
  if (status) list = list.filter(l => l.status === status);
  if (priority) list = list.filter(l => l.priority === priority);
  if (category) list = list.filter(l => l.category === category);
  list.sort((a, b) => {
    const catCmp = (a.category || '').localeCompare(b.category || '');
    if (catCmp !== 0) return catCmp;
    const priOrder = { alta: 0, media: 1, baixa: 2 };
    const priCmp = (priOrder[a.priority] || 1) - (priOrder[b.priority] || 1);
    if (priCmp !== 0) return priCmp;
    return new Date(a.due_date || 0) - new Date(b.due_date || 0);
  });
  res.json(list);
});

router.post('/lembretes', (req, res) => {
  const { title, description, due_date, priority, related_task_id, status, category } = req.body;
  let linkedTaskId = related_task_id || null;

  // If no related_task_id, create a linked task automatically
  if (!linkedTaskId) {
    const taskResult = db.prepare(`INSERT INTO tasks (category, item_number, title, description, responsible_team, deadline, priority, status, notes, phase) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
      category || 'Geral MOs', 'L', title, description || '', "MO's", due_date || '', priority || 'media', status || 'pendente', 'Lembrete vinculado', 'pre'
    );
    linkedTaskId = taskResult.lastInsertRowid;
  }

  const id = db.insert('lembretes', {
    title, description, due_date, priority: priority || 'media',
    related_task_id: linkedTaskId, status: status || 'pendente', category: category || 'Geral MOs'
  });
  res.json({ id, related_task_id: linkedTaskId });
});

router.put('/lembretes/:id', (req, res) => {
  db.update('lembretes', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  // Sync linked task
  const lem = db.getById('lembretes', Number(req.params.id));
  if (lem && lem.related_task_id) {
    const taskFields = {};
    if (req.body.title) taskFields.title = req.body.title;
    if (req.body.description) taskFields.description = req.body.description;
    if (req.body.category) taskFields.category = req.body.category;
    if (req.body.priority) taskFields.priority = req.body.priority;
    if (req.body.due_date !== undefined) taskFields.deadline = req.body.due_date;
    if (req.body.status) taskFields.status = req.body.status;
    if (Object.keys(taskFields).length > 0) {
      const task = db.getById('tasks', Number(lem.related_task_id));
      if (task) {
        db.prepare(`UPDATE tasks SET category=?, item_number=?, title=?, description=?, responsible_team=?, deadline=?, priority=?, status=?, notes=?, phase=?, updated_at=datetime('now','localtime') WHERE id=?`).run(
          taskFields.category || task.category, task.item_number, taskFields.title || task.title,
          taskFields.description !== undefined ? taskFields.description : task.description,
          task.responsible_team, taskFields.deadline !== undefined ? taskFields.deadline : task.deadline,
          taskFields.priority || task.priority, taskFields.status || task.status,
          task.notes, task.phase || 'pre', lem.related_task_id
        );
      }
    }
  }
  res.json({ success: true });
});

router.patch('/lembretes/:id/status', (req, res) => {
  db.update('lembretes', req.params.id, { status: req.body.status });
  // Sync linked task status
  const lem = db.getById('lembretes', Number(req.params.id));
  if (lem && lem.related_task_id) {
    const taskStatus = req.body.status === 'concluido' ? 'concluido' : 'pendente';
    db.prepare(`UPDATE tasks SET status=?, updated_at=datetime('now','localtime') WHERE id=?`).run(taskStatus, lem.related_task_id);
  }
  res.json({ success: true });
});

router.delete('/lembretes/:id', (req, res) => {
  const lem = db.getById('lembretes', Number(req.params.id));
  db.remove('lembretes', req.params.id);
  // Delete linked task if it was auto-created (item_number = 'L')
  if (lem && lem.related_task_id) {
    const task = db.getById('tasks', Number(lem.related_task_id));
    if (task && task.item_number === 'L') {
      db.prepare('DELETE FROM tasks WHERE id=?').run(lem.related_task_id);
    }
  }
  res.json({ success: true });
});

router.post('/lembretes/sync', (req, res) => {
  const lembretes = db.getAll('lembretes');
  const tasks = db.getAll('tasks');
  let created = 0;
  for (const lem of lembretes) {
    if (!lem.related_task_id || !tasks.find(t => t.id === Number(lem.related_task_id))) {
      const result = db.prepare(`INSERT INTO tasks (category, item_number, title, description, responsible_team, deadline, priority, status, notes, phase) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
        lem.category || 'Geral MOs', 'L', lem.title, lem.description || '', "MO's",
        lem.due_date || '', lem.priority || 'media', lem.status || 'pendente', 'Lembrete vinculado', 'pre'
      );
      db.update('lembretes', lem.id, { related_task_id: result.lastInsertRowid });
      created++;
    }
  }
  res.json({ success: true, created, message: `${created} tarefa(s) criada(s) a partir de lembretes sem vínculo.` });
});

router.get('/lembretes/auto', (req, res) => {
  const tasks = db.getAll('tasks');
  const encounters = db.getAll('encounters');
  const enc = encounters[encounters.length - 1];
  if (!enc || !enc.start_date) {
    res.json({ lembretes: [], message: 'Defina a data do Encontro para gerar lembretes automáticos.' });
    return;
  }
  const encDate = new Date(enc.start_date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const auto = [];
  for (const t of tasks) {
    if (t.status === 'concluido' || !t.deadline) continue;
    const m = t.deadline.match(/(-?\d+)\s*mes/i);
    const d = t.deadline.match(/(-?\d+)\s*dia/i);
    const w = t.deadline.match(/(-?\d+)\s*sem/i);
    let offsetMonths = 0, offsetDays = 0;
    if (m) offsetMonths = parseInt(m[1]);
    else if (d) offsetDays = parseInt(d[1]);
    else if (w) offsetDays = parseInt(w[1]) * 7;
    else if (t.deadline.toLowerCase().includes('no dia')) continue;
    else continue;
    const due = new Date(encDate);
    due.setMonth(due.getMonth() + offsetMonths);
    due.setDate(due.getDate() + offsetDays);
    const diffDays = Math.ceil((due - today) / 86400000);
    let urgency = 'info';
    if (diffDays < 0) urgency = 'overdue';
    else if (diffDays <= 7) urgency = 'urgent';
    else if (diffDays <= 30) urgency = 'warning';
    auto.push({
      task_id: t.id, title: t.title, category: t.category, deadline: t.deadline,
      due_date: due.toISOString().slice(0, 10), diff_days: diffDays, urgency,
      responsible_team: t.responsible_team, priority: t.priority
    });
  }
  auto.sort((a, b) => a.diff_days - b.diff_days);
  res.json({ lembretes: auto, encounter_date: enc.start_date });
});

// ============ PADRINHOS ============

router.get('/padrinhos', (req, res) => {
  let list = db.getAll('padrinhos');
  const { participant_id, status } = req.query;
  if (participant_id) list = list.filter(p => p.participant_id === Number(participant_id));
  if (status) list = list.filter(p => p.status === status);
  res.json(list);
});

router.post('/padrinhos', (req, res) => {
  const { participant_id, padrinho_name, padrinho_phone, step1_contact, step2_invitation,
    step3_confirmation, step4_meeting, step5_acompanhamento, notes, status } = req.body;
  const id = db.insert('padrinhos', {
    participant_id: Number(participant_id), padrinho_name, padrinho_phone,
    step1_contact: step1_contact || false, step2_invitation: step2_invitation || false,
    step3_confirmation: step3_confirmation || false, step4_meeting: step4_meeting || false,
    step5_acompanhamento: step5_acompanhamento || false,
    notes, status: status || 'nao_atribuido'
  });
  res.json({ id });
});

router.put('/padrinhos/:id', (req, res) => {
  db.update('padrinhos', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.patch('/padrinhos/:id/step', (req, res) => {
  const { step, value } = req.body;
  const fieldMap = { 1: 'step1_contact', 2: 'step2_invitation', 3: 'step3_confirmation', 4: 'step4_meeting', 5: 'step5_acompanhamento' };
  const field = fieldMap[step];
  if (!field) return res.status(400).json({ error: 'Invalid step' });
  const p = db.getById('padrinhos', req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const updates = { [field]: value };
  const stepsDone = ['step1_contact', 'step2_invitation', 'step3_confirmation', 'step4_meeting', 'step5_acompanhamento']
    .filter(s => s === field ? value : p[s]).length;
  if (stepsDone === 5) updates.status = 'concluido';
  else if (stepsDone > 0) updates.status = 'em_andamento';
  db.update('padrinhos', req.params.id, updates);
  res.json({ success: true, steps_done: stepsDone });
});

router.delete('/padrinhos/:id', (req, res) => {
  db.remove('padrinhos', req.params.id);
  res.json({ success: true });
});

// ============ FORNECEDORES ============

router.get('/fornecedores', (req, res) => {
  let list = db.getAll('fornecedores');
  const { category, status, type } = req.query;
  if (category) list = list.filter(f => f.category === category);
  if (status) list = list.filter(f => f.status === status);
  if (type) list = list.filter(f => (f.type || 'fornecedor') === type);
  list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  res.json(list);
});

router.post('/fornecedores', (req, res) => {
  const { name, category, service, phone, email, whatsapp, contact_person, status, notes, estimated_cost, actual_cost, type, mp_name, relationship } = req.body;
  const id = db.insert('fornecedores', {
    name, category, service, phone, email, whatsapp, contact_person,
    status: status || 'contatado', notes, estimated_cost: parseFloat(estimated_cost) || 0,
    actual_cost: parseFloat(actual_cost) || 0,
    type: type || 'fornecedor', mp_name: mp_name || '', relationship: relationship || ''
  });
  res.json({ id });
});

router.put('/fornecedores/:id', (req, res) => {
  db.update('fornecedores', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.patch('/fornecedores/:id/status', (req, res) => {
  db.update('fornecedores', req.params.id, { status: req.body.status });
  res.json({ success: true });
});

router.delete('/fornecedores/:id', (req, res) => {
  db.remove('fornecedores', req.params.id);
  res.json({ success: true });
});

// ============ AVISOS ============

router.get('/avisos', (req, res) => {
  let list = db.getAll('avisos');
  const { target, priority } = req.query;
  if (target) list = list.filter(a => a.target === target || a.target === 'todos');
  if (priority) list = list.filter(a => a.priority === priority);
  list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.json(list);
});

router.post('/avisos', (req, res) => {
  const { title, content, target, priority, author } = req.body;
  const id = db.insert('avisos', {
    title, content, target: target || 'todos', priority: priority || 'media',
    author: author || 'Coordenador', pinned: false
  });
  res.json({ id });
});

router.put('/avisos/:id', (req, res) => {
  db.update('avisos', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.patch('/avisos/:id/pin', (req, res) => {
  db.update('avisos', req.params.id, { pinned: req.body.pinned });
  res.json({ success: true });
});

router.delete('/avisos/:id', (req, res) => {
  db.remove('avisos', req.params.id);
  res.json({ success: true });
});

// ============ BUDGET (Orçamento do Encontro) ============

router.get('/budget', (req, res) => {
  let list = db.getAll('budget_items');
  const { category, status } = req.query;
  if (category) list = list.filter(b => b.category === category);
  if (status) list = list.filter(b => b.status === status);
  list.sort((a, b) => (a.category || '').localeCompare(b.category || '') || (a.item_name || '').localeCompare(b.item_name || ''));
  res.json(list);
});

router.post('/budget', (req, res) => {
  const { category, item_name, description, quantity, unit, estimated_unit_cost, actual_cost, status, supplier, notes } = req.body;
  const id = db.insert('budget_items', {
    category: category || 'Diversos',
    item_name: item_name || '',
    description: description || '',
    quantity: parseFloat(quantity) || 0,
    unit: unit || 'un',
    estimated_unit_cost: parseFloat(estimated_unit_cost) || 0,
    actual_cost: parseFloat(actual_cost) || 0,
    status: status || 'orcado',
    supplier: supplier || '',
    notes: notes || ''
  });
  res.json({ id });
});

router.put('/budget/:id', (req, res) => {
  db.update('budget_items', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.delete('/budget/:id', (req, res) => {
  db.remove('budget_items', req.params.id);
  res.json({ success: true });
});

router.get('/budget/summary', (req, res) => {
  const items = db.getAll('budget_items');
  const donations = db.getAll('donations');
  const finance = db.getAll('finance');

  const totalEstimated = items.reduce((s, b) => s + ((b.quantity || 0) * (b.estimated_unit_cost || 0)), 0);
  const totalActual = items.reduce((s, b) => s + (b.actual_cost || 0), 0);
  const totalDonations = donations.filter(d => d.type === 'dinheiro').reduce((s, d) => s + (d.value || 0), 0);
  const totalMaterialDonations = donations.filter(d => d.type === 'material').length;
  const financeExpenses = finance.filter(f => f.type === 'despesa' && f.paid).reduce((s, f) => s + (f.amount || 0), 0);
  const financeIncome = finance.filter(f => f.type === 'receita' && f.paid).reduce((s, f) => s + (f.amount || 0), 0);

  const netBudget = totalEstimated - totalDonations - financeIncome;
  const spentTotal = totalActual + financeExpenses;
  const remaining = netBudget - spentTotal + totalDonations;

  const byCategory = {};
  for (const b of items) {
    const cat = b.category || 'Outros';
    if (!byCategory[cat]) byCategory[cat] = { estimated: 0, actual: 0, count: 0, done: 0 };
    byCategory[cat].estimated += (b.quantity || 0) * (b.estimated_unit_cost || 0);
    byCategory[cat].actual += b.actual_cost || 0;
    byCategory[cat].count++;
    if (b.status === 'comprado' || b.status === 'recebido') byCategory[cat].done++;
  }

  const statusCounts = {
    orcado: items.filter(b => b.status === 'orcado').length,
    comprado: items.filter(b => b.status === 'comprado').length,
    recebido: items.filter(b => b.status === 'recebido').length,
    cancelado: items.filter(b => b.status === 'cancelado').length,
  };

  res.json({
    totalEstimated, totalActual, totalDonations, totalMaterialDonations,
    financeExpenses, financeIncome,
    netBudget, spentTotal, remaining,
    byCategory, statusCounts,
    itemCount: items.length, donationCount: donations.length
  });
});

// ============ DONATIONS (Doações) ============

router.get('/donations', (req, res) => {
  let list = db.getAll('donations');
  const { type } = req.query;
  if (type) list = list.filter(d => d.type === type);
  list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  res.json(list);
});

router.post('/donations', (req, res) => {
  const { donor_name, type, description, value, date, category, linked_budget_item, consolidate_finance } = req.body;
  const id = db.insert('donations', {
    donor_name: donor_name || 'Anônimo',
    type: type || 'dinheiro',
    description: description || '',
    value: parseFloat(value) || 0,
    date: date || new Date().toISOString().slice(0, 10),
    category: category || 'Geral',
    linked_budget_item: linked_budget_item || null,
    consolidated: false
  });

  if (consolidate_finance && type === 'dinheiro' && parseFloat(value) > 0) {
    db.insert('finance', {
      type: 'receita',
      category: 'Doações',
      description: `Doação - ${donor_name || 'Anônimo'}${description ? ' (' + description + ')' : ''}`,
      amount: parseFloat(value) || 0,
      date: date || new Date().toISOString().slice(0, 10),
      paid: true,
      responsible: 'Sistema (Doação)'
    });
    db.update('donations', id, { consolidated: true });
  }

  if (linked_budget_item && type === 'material') {
    db.update('budget_items', linked_budget_item, { status: 'recebido', actual_cost: 0 });
  }

  res.json({ id });
});

router.put('/donations/:id', (req, res) => {
  db.update('donations', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.delete('/donations/:id', (req, res) => {
  db.remove('donations', req.params.id);
  res.json({ success: true });
});

// ============ CARDÁPIO (Menu do Encontro) ============

router.get('/cardapio', (req, res) => {
  let list = db.getAll('cardapio');
  const { day } = req.query;
  if (day) list = list.filter(c => c.day === day);
  const dayOrder = { 'Sexta-feira': 0, 'Sábado': 1, 'Domingo': 2 };
  const mealOrder = { 'Café da manhã': 0, 'Almoço': 1, 'Lanche da tarde': 2, 'Jantar': 3, 'Almoço operários': 0 };
  list.sort((a, b) => (dayOrder[a.day] || 9) - (dayOrder[b.day] || 9) || (mealOrder[a.meal] || 9) - (mealOrder[b.meal] || 9));
  res.json(list);
});

router.post('/cardapio', (req, res) => {
  const { day, meal, items, notes } = req.body;
  const id = db.insert('cardapio', {
    day: day || '',
    meal: meal || '',
    items: items || [],
    notes: notes || ''
  });
  res.json({ id });
});

router.put('/cardapio/:id', (req, res) => {
  db.update('cardapio', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.delete('/cardapio/:id', (req, res) => {
  db.remove('cardapio', req.params.id);
  res.json({ success: true });
});

module.exports = router;
