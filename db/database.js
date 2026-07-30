const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'encontro.json');

const TABLES = ['tasks', 'teams', 'schedule', 'encounters', 'team_members',
  'participants', 'finance', 'lembrancinhas', 'escolinhas', 'alicerces',
  'lembretes', 'padrinhos', 'fornecedores', 'avisos', 'migrations',
  'finance_categories', 'finance_events', 'finance_budget'];

let data = {
  tasks: [], teams: [], schedule: [], encounters: [], team_members: [],
  participants: [], finance: [], lembrancinhas: [], escolinhas: [], alicerces: [],
  lembretes: [], padrinhos: [], fornecedores: [], avisos: [], migrations: [],
  finance_categories: [], finance_events: [], finance_budget: [],
  _seq: {}
};
for (const t of TABLES) data._seq[t] = 0;

function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      for (const t of TABLES) {
        if (!parsed[t]) parsed[t] = [];
        if (!parsed._seq) parsed._seq = {};
        if (!parsed._seq[t]) parsed._seq[t] = 0;
      }
      data = parsed;
    }
  } catch (e) {
    console.error('Error loading DB:', e.message);
  }
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function nextId(table) {
  data._seq[table] = (data._seq[table] || 0) + 1;
  return data._seq[table];
}

function getTable(name) {
  return data[name] || [];
}

function findById(table, id) {
  return getTable(table).find(r => r.id === Number(id));
}

function filterBy(table, criteria) {
  return getTable(table).filter(r => {
    for (const [k, v] of Object.entries(criteria)) {
      if (r[k] !== v) return false;
    }
    return true;
  });
}

const db = {
  prepare(sql) {
    return {
      all(...params) { return queryAll(sql, params); },
      get(...params) { return queryAll(sql, params)[0] || null; },
      run(...params) { return execute(sql, params); }
    };
  },
  pragma() {},
  exec() {},
  // Generic helpers for new tables
  getAll(table) { load(); return getTable(table); },
  getById(table, id) { load(); return findById(table, id); },
  insert(table, obj) { load(); const id = nextId(table); obj.id = id; obj.created_at = new Date().toISOString(); if (table === 'team_members' && obj.team_id !== undefined) obj.team_id = Number(obj.team_id); getTable(table).push(obj); save(); return id; },
  update(table, id, fields) { load(); const r = findById(table, id); if (r) { Object.assign(r, fields, { updated_at: new Date().toISOString() }); save(); } return r; },
  remove(table, id) { load(); const arr = getTable(table); const before = arr.length; data[table] = arr.filter(r => r.id !== Number(id)); save(); return before - data[table].length; },
  filter(table, criteria) { load(); return filterBy(table, criteria); }
};

// ============ SQL-COMPATIBLE QUERIES (for existing routes/pdf) ============

function queryAll(sql, params) {
  load();
  const lower = sql.toLowerCase().trim();

  if (lower.startsWith('select count(*) as count from tasks where status')) {
    const status = sql.match(/status='(\w+)'/)[1];
    return [{ count: data.tasks.filter(t => t.status === status).length }];
  }
  if (lower.startsWith('select count(*) as count from tasks')) {
    return [{ count: data.tasks.length }];
  }
  if (lower.startsWith('select') && lower.includes('from tasks') && lower.includes('where 1=1')) {
    let results = [...data.tasks];
    let paramIdx = 0;
    if (lower.includes('and category = ?')) { const v = params[paramIdx++]; results = results.filter(t => t.category === v); }
    if (lower.includes('and status = ?')) { const v = params[paramIdx++]; results = results.filter(t => t.status === v); }
    if (lower.includes('and priority = ?')) { const v = params[paramIdx++]; results = results.filter(t => t.priority === v); }
    if (lower.includes('and responsible_team = ?')) { const v = params[paramIdx++]; results = results.filter(t => t.responsible_team === v); }
    if (lower.includes('and phase = ?')) { const v = params[paramIdx++]; results = results.filter(t => (t.phase || 'pre') === v); }
    results.sort((a, b) => {
      const catCmp = (a.category || '').localeCompare(b.category || '');
      if (catCmp !== 0) return catCmp;
      return parseFloat(a.item_number) - parseFloat(b.item_number);
    });
    return results;
  }
  if (lower.startsWith('select') && lower.includes('from tasks') && lower.includes('group by category')) {
    const map = {};
    for (const t of data.tasks) {
      if (!map[t.category]) map[t.category] = { category: t.category, total: 0, done: 0 };
      map[t.category].total++;
      if (t.status === 'concluido') map[t.category].done++;
    }
    return Object.values(map).sort((a, b) => a.category.localeCompare(b.category));
  }
  if (lower.startsWith('select') && lower.includes('from tasks') && lower.includes('group by responsible_team')) {
    const map = {};
    for (const t of data.tasks) {
      const team = t.responsible_team || 'N/A';
      if (!map[team]) map[team] = { team, total: 0, done: 0 };
      map[team].total++;
      if (t.status === 'concluido') map[team].done++;
    }
    return Object.values(map).sort((a, b) => a.team.localeCompare(b.team));
  }
  if (lower.startsWith('select') && lower.includes('from tasks') && lower.includes('group by priority')) {
    const map = {};
    for (const t of data.tasks) {
      if (!map[t.priority]) map[t.priority] = { priority: t.priority, total: 0, done: 0 };
      map[t.priority].total++;
      if (t.status === 'concluido') map[t.priority].done++;
    }
    return Object.values(map);
  }
  if (lower.startsWith('select') && lower.includes('from tasks') && /where category\s*=\s*\?/.test(lower)) {
    const cat = params[0];
    return data.tasks.filter(t => t.category === cat).sort((a, b) => parseFloat(a.item_number) - parseFloat(b.item_number));
  }
  if (lower.startsWith('select distinct category from tasks')) {
    const cats = [...new Set(data.tasks.map(t => t.category))].sort();
    return cats.map(c => ({ category: c }));
  }
  if (lower.startsWith('select * from teams')) {
    if (lower.includes('order by name')) {
      return [...data.teams].sort((a, b) => a.name.localeCompare(b.name));
    }
    return data.teams;
  }
  if (lower.startsWith('select * from team_members where team_id')) {
    return data.team_members.filter(m => Number(m.team_id) === Number(params[0]));
  }
  if (lower.startsWith('select * from team_members where team_id in')) {
    const teamIds = data.teams.filter(t => params.includes(t.name)).map(t => t.id);
    return data.team_members.filter(m => teamIds.includes(Number(m.team_id)));
  }
  if (lower.startsWith('select * from schedule_items')) {
    let results = [...data.schedule];
    if (lower.includes('where day = ?')) { results = results.filter(s => s.day === params[0]); }
    if (lower.includes('responsible_team like ?')) {
      const teamParam = params[lower.includes('where day = ?') ? 1 : 0];
      const teamClean = teamParam.replace(/%/g, '');
      results = results.filter(s => (s.responsible_team || '').includes(teamClean));
    }
    const dayOrder = { 'Sexta-feira': 1, 'Sábado': 2, 'Domingo': 3 };
    results.sort((a, b) => {
      const da = dayOrder[a.day] || 99;
      const db = dayOrder[b.day] || 99;
      if (da !== db) return da - db;
      return a.time.localeCompare(b.time);
    });
    return results;
  }
  if (lower.startsWith('select * from encounters')) {
    if (lower.includes('order by id desc limit 1')) {
      return data.encounters.length > 0 ? [data.encounters[data.encounters.length - 1]] : [];
    }
    return data.encounters;
  }
  if (lower.startsWith('select') && lower.includes('from tasks') && lower.includes('count(*) as count')) {
    const stats = {
      total: data.tasks.length,
      done: data.tasks.filter(t => t.status === 'concluido').length,
      in_progress: data.tasks.filter(t => t.status === 'em_andamento').length,
      pending: data.tasks.filter(t => t.status === 'pendente').length,
    };
    return [stats];
  }
  if (lower.startsWith('select t.name, t.description')) {
    return data.teams.map(t => {
      const total = data.tasks.filter(tk => tk.responsible_team === t.name).length;
      const done = data.tasks.filter(tk => tk.responsible_team === t.name && tk.status === 'concluido').length;
      return { name: t.name, description: t.description, total_tasks: total, done_tasks: done };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  return [];
}

function execute(sql, params) {
  load();
  const lower = sql.toLowerCase().trim();

  if (lower.startsWith('insert into tasks')) {
    const id = nextId('tasks');
    data.tasks.push({
      id, category: params[0], item_number: params[1], title: params[2], description: params[3],
      responsible_team: params[4], deadline: params[5], priority: params[6],
      status: params[7] || 'pendente', notes: params[8], phase: params[9] || 'pre',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });
    save();
    return { lastInsertRowid: id };
  }
  if (lower.startsWith('insert into teams')) {
    const id = nextId('teams');
    data.teams.push({ id, name: params[0], description: params[1], members_count: 0, responsible: null, created_at: new Date().toISOString() });
    save();
    return { lastInsertRowid: id };
  }
  if (lower.startsWith('insert into schedule_items')) {
    const id = nextId('schedule');
    data.schedule.push({ id, day: params[0], time: params[1], activity: params[2], location: params[3], responsible_team: params[4], notes: params[5], status: 'pendente', created_at: new Date().toISOString() });
    save();
    return { lastInsertRowid: id };
  }
  if (lower.startsWith('insert into encounters')) {
    const id = nextId('encounters');
    data.encounters.push({ id, name: params[0], start_date: null, end_date: null, location: null, theme: null, theme_song: null, status: params[1] || 'em_preparacao', created_at: new Date().toISOString() });
    save();
    return { lastInsertRowid: id };
  }
  if (lower.startsWith('insert into team_members')) {
    const id = nextId('team_members');
    data.team_members.push({ id, team_id: Number(params[0]), name: params[1], role: params[2], phone: params[3], email: params[4] });
    const team = data.teams.find(t => t.id === Number(params[0]));
    if (team) team.members_count = data.team_members.filter(m => Number(m.team_id) === Number(params[0])).length;
    save();
    return { lastInsertRowid: id };
  }
  if (lower.startsWith('update tasks set category')) {
    const t = data.tasks.find(t => t.id === Number(params[10]));
    if (t) {
      Object.assign(t, { category: params[0], item_number: params[1], title: params[2], description: params[3],
        responsible_team: params[4], deadline: params[5], priority: params[6], status: params[7],
        notes: params[8], phase: params[9] || t.phase || 'pre', updated_at: new Date().toISOString() });
      save();
    }
    return { changes: t ? 1 : 0 };
  }
  if (lower.startsWith('update tasks set status')) {
    const t = data.tasks.find(t => t.id === Number(params[1]));
    if (t) { t.status = params[0]; t.updated_at = new Date().toISOString(); save(); }
    return { changes: t ? 1 : 0 };
  }
  if (lower.startsWith('update teams set name')) {
    const t = data.teams.find(t => t.id === Number(params[3]));
    if (t) { t.name = params[0]; t.description = params[1]; t.responsible = params[2]; save(); }
    return { changes: t ? 1 : 0 };
  }
  if (lower.startsWith('update teams set members_count')) {
    const t = data.teams.find(t => t.id === Number(params[1]));
    if (t) { t.members_count = data.team_members.filter(m => Number(m.team_id) === Number(params[0])).length; save(); }
    return { changes: t ? 1 : 0 };
  }
  if (lower.startsWith('update encounters set name')) {
    const e = data.encounters.find(e => e.id === Number(params[7]));
    if (e) { e.name = params[0]; e.start_date = params[1]; e.end_date = params[2]; e.location = params[3]; e.theme = params[4]; e.theme_song = params[5]; e.status = params[6]; save(); }
    return { changes: e ? 1 : 0 };
  }
  if (lower.startsWith('update schedule_items set day')) {
    const s = data.schedule.find(s => s.id === Number(params[7]));
    if (s) { s.day = params[0]; s.time = params[1]; s.activity = params[2]; s.location = params[3]; s.responsible_team = params[4]; s.notes = params[5]; s.status = params[6]; save(); }
    return { changes: s ? 1 : 0 };
  }
  if (lower.startsWith('update schedule_items set status')) {
    const s = data.schedule.find(s => s.id === Number(params[1]));
    if (s) { s.status = params[0]; save(); }
    return { changes: s ? 1 : 0 };
  }
  if (lower.startsWith('delete from tasks')) {
    const before = data.tasks.length;
    data.tasks = data.tasks.filter(t => t.id !== Number(params[0]));
    save();
    return { changes: before - data.tasks.length };
  }
  if (lower.startsWith('delete from teams')) {
    data.team_members = data.team_members.filter(m => Number(m.team_id) !== Number(params[0]));
    data.teams = data.teams.filter(t => t.id !== Number(params[0]));
    save();
    return { changes: 1 };
  }
  if (lower.startsWith('delete from team_members')) {
    const before = data.team_members.length;
    data.team_members = data.team_members.filter(m => !(m.id === Number(params[0]) && Number(m.team_id) === Number(params[1])));
    save();
    return { changes: before - data.team_members.length };
  }
  if (lower.startsWith('delete from schedule_items')) {
    const before = data.schedule.length;
    data.schedule = data.schedule.filter(s => s.id !== Number(params[0]));
    save();
    return { changes: before - data.schedule.length };
  }

  return { changes: 0 };
}

load();
module.exports = db;
