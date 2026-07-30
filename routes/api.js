const express = require('express');
const db = require('../db/database');

const router = express.Router();

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
  res.json({ success: true });
});

router.patch('/tasks/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare(`UPDATE tasks SET status=?, updated_at=datetime('now','localtime') WHERE id=?`).run(status, req.params.id);
  res.json({ success: true });
});

router.delete('/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
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
  db.prepare('UPDATE teams SET name=?, description=?, responsible=? WHERE id=?').run(name, description, responsible, req.params.id);
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
  const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
  const done = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status='concluido'").get().count;
  const inProgress = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status='em_andamento'").get().count;
  const pending = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status='pendente'").get().count;
  const byCategory = db.prepare("SELECT category, COUNT(*) as total, SUM(CASE WHEN status='concluido' THEN 1 ELSE 0 END) as done FROM tasks GROUP BY category ORDER BY category").all();
  const byTeam = db.prepare("SELECT responsible_team as team, COUNT(*) as total, SUM(CASE WHEN status='concluido' THEN 1 ELSE 0 END) as done FROM tasks GROUP BY responsible_team ORDER BY responsible_team").all();
  const byPriority = db.prepare("SELECT priority, COUNT(*) as total, SUM(CASE WHEN status='concluido' THEN 1 ELSE 0 END) as done FROM tasks GROUP BY priority").all();
  res.json({ total, done, inProgress, pending, byCategory, byTeam, byPriority });
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
  const { status, priority } = req.query;
  if (status) list = list.filter(l => l.status === status);
  if (priority) list = list.filter(l => l.priority === priority);
  list.sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0));
  res.json(list);
});

router.post('/lembretes', (req, res) => {
  const { title, description, due_date, priority, related_task_id, status } = req.body;
  const id = db.insert('lembretes', {
    title, description, due_date, priority: priority || 'media',
    related_task_id, status: status || 'pendente'
  });
  res.json({ id });
});

router.put('/lembretes/:id', (req, res) => {
  db.update('lembretes', req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json({ success: true });
});

router.patch('/lembretes/:id/status', (req, res) => {
  db.update('lembretes', req.params.id, { status: req.body.status });
  res.json({ success: true });
});

router.delete('/lembretes/:id', (req, res) => {
  db.remove('lembretes', req.params.id);
  res.json({ success: true });
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

module.exports = router;
