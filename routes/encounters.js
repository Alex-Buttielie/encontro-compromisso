const express = require('express');
const db = require('../db/database');

const router = express.Router();

function getActiveEncounter() {
  const encs = db.getAll('encounters');
  return encs.find(e => e.is_active) || (encs.length ? encs[encs.length - 1] : null);
}

router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

function toRoman(num) {
  if (!num || num < 1) return String(num || 1);
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let n = parseInt(num, 10); let r = '';
  for (const [v, s] of map) { while (n >= v) { r += s; n -= v; } }
  return r;
}

function enrich(enc) {
  if (!enc) return enc;
  const n = enc.edition_number || parseInt(enc.edition, 10) || 1;
  return { ...enc, edition_roman: toRoman(n), label: `${toRoman(n)} Compromisso Trin - ${enc.year || ''}`.trim() };
}

router.get('/encounters', (req, res) => {
  const list = db.getAll('encounters');
  list.sort((a, b) => (a.year || 0) - (b.year || 0) || (a.edition_number || 0) - (b.edition_number || 0) || a.id - b.id);
  res.json(list.map(enrich));
});

router.get('/encounters/active', (req, res) => {
  const enc = getActiveEncounter();
  if (!enc) return res.status(404).json({ error: 'Nenhum encontro cadastrado' });
  res.json(enrich(enc));
});

router.get('/encounters/:id', (req, res) => {
  const enc = db.getById('encounters', req.params.id);
  if (!enc) return res.status(404).json({ error: 'Encontro não encontrado' });
  res.json(enrich(enc));
});

router.post('/encounters', (req, res) => {
  const { name, edition, edition_number, year, start_date, end_date, location, theme, theme_song, status, clone_from_id } = req.body;
  const edNum = edition_number !== undefined && edition_number !== '' ? parseInt(edition_number, 10) : (edition ? parseInt(edition, 10) : null);
  const yr = year !== undefined && year !== '' ? parseInt(year, 10) : (start_date ? parseInt(String(start_date).slice(0, 4), 10) : new Date().getFullYear());
  if (!edNum || !yr) return res.status(400).json({ error: 'Informe edicao e ano' });

  const exists = db.getAll('encounters').find(e => (e.edition_number === edNum || String(e.edition) === String(edNum)) && Number(e.year) === Number(yr));
  if (exists) return res.status(409).json({ error: `Ja existe ${toRoman(edNum)} / ${yr}` });

  const roman = toRoman(edNum);
  const finalName = name || `${roman} Compromisso Trin`;

  const id = db.insert('encounters', {
    name: finalName,
    edition: String(edNum),
    edition_number: edNum,
    year: yr,
    start_date: start_date || null,
    end_date: end_date || null,
    location: location || null,
    theme: theme || null,
    theme_song: theme_song || null,
    status: status || 'em_preparacao',
    is_active: false,
  });

  if (clone_from_id) {
    const srcId = Number(clone_from_id);
    const srcEnc = db.getById('encounters', srcId);
    if (srcEnc) {
      const tables = ['tasks', 'teams', 'schedule', 'participants', 'lembrancinhas', 'escolinhas', 'alicerces', 'lembretes', 'fornecedores', 'avisos', 'budget_items', 'cardapio', 'finance_categories'];
      const teamIdMap = {};
      for (const t of tables) {
        const list = db.getAll(t).filter(r => Number(r.encounter_id) === srcId);
        for (const r of list) {
          const { id: _id, encounter_id: _eid, created_at: _ca, updated_at: _ua, _seq: _sq, ...clean } = r;
          if (t === 'teams') {
            const newId = db.insert(t, { ...clean, encounter_id: id });
            teamIdMap[r.id] = newId;
          } else if (t === 'team_members') {
            continue;
          } else {
            db.insert(t, { ...clean, encounter_id: id });
          }
        }
      }
      const srcMembers = db.getAll('team_members').filter(m => { const tid = Number(m.team_id); return teamIdMap[tid] !== undefined; });
      for (const m of srcMembers) {
        const { id: _id, ...clean } = m;
        db.insert('team_members', { ...clean, team_id: teamIdMap[Number(m.team_id)] });
      }
      for (const tid of Object.values(teamIdMap)) {
        const cnt = db.getAll('team_members').filter(mm => Number(mm.team_id) === Number(tid)).length;
        db.update('teams', tid, { members_count: cnt });
      }
    }
  } else {
    const stdTasks = db.getAll('tasks').filter(t => Number(t.encounter_id) === Number(id));
    if (stdTasks.length === 0) {
      try {
        const fs = require('fs'); const path = require('path');
        const seedPath = path.join(__dirname, '..', 'data', 'seed.js');
        if (false && fs.existsSync(seedPath)) {}
      } catch {}
    }
  }

  res.status(201).json({ id, name: finalName, edition: String(edNum), edition_number: edNum, year: yr });
});

router.put('/encounters/:id', (req, res) => {
  const enc = db.getById('encounters', req.params.id);
  if (!enc) return res.status(404).json({ error: 'Encontro não encontrado' });
  const { name, edition, edition_number, year, start_date, end_date, location, theme, theme_song, status } = req.body;
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (edition !== undefined) patch.edition = String(edition);
  if (edition_number !== undefined) patch.edition_number = parseInt(edition_number, 10);
  if (year !== undefined) patch.year = parseInt(year, 10);
  if (start_date !== undefined) patch.start_date = start_date || null;
  if (end_date !== undefined) patch.end_date = end_date || null;
  if (location !== undefined) patch.location = location;
  if (theme !== undefined) patch.theme = theme;
  if (theme_song !== undefined) patch.theme_song = theme_song;
  if (status !== undefined) patch.status = status;
  patch.updated_at = new Date().toISOString();
  db.update('encounters', req.params.id, patch);
  res.json({ success: true });
});

router.patch('/encounters/:id/activate', (req, res) => {
  const enc = db.getById('encounters', req.params.id);
  if (!enc) return res.status(404).json({ error: 'Encontro não encontrado' });
  for (const e of db.getAll('encounters')) if (e.is_active) db.update('encounters', e.id, { is_active: false });
  db.update('encounters', req.params.id, { is_active: true });
  res.json({ success: true, active_id: Number(req.params.id) });
});

router.delete('/encounters/:id', (req, res) => {
  const enc = db.getById('encounters', req.params.id);
  if (!enc) return res.status(404).json({ error: 'Encontro não encontrado' });
  if (enc.is_active) return res.status(400).json({ error: 'Nao e possivel excluir o encontro ativo. Ative outro antes.' });
  const all = db.getAll('encounters');
  if (all.length <= 1) return res.status(400).json({ error: 'Deve existir ao menos um encontro' });
  db.remove('encounters', req.params.id);
  res.json({ success: true });
});

router.post('/encounters/:id/clone', (req, res) => {
  const src = db.getById('encounters', req.params.id);
  if (!src) return res.status(404).json({ error: 'Encontro origem não encontrado' });
  const { year, edition, edition_number } = req.body;
  const edNum = edition_number !== undefined && edition_number !== '' ? parseInt(edition_number, 10) : (edition ? parseInt(edition, 10) : (src.edition_number || 0) + 1);
  const yr = year !== undefined && year !== '' ? parseInt(year, 10) : (src.year || new Date().getFullYear()) + 1;
  const roman = toRoman(edNum);
  const id = db.insert('encounters', {
    name: `${roman} Compromisso Trin`,
    edition: String(edNum),
    edition_number: edNum,
    year: yr,
    start_date: null, end_date: null, location: src.location || null, theme: null, theme_song: null,
    status: 'em_preparacao', is_active: false,
  });
  const teamIdMap = {};
  const tables = ['tasks', 'teams', 'schedule', 'participants', 'lembrancinhas', 'escolinhas', 'alicerces', 'lembretes', 'fornecedores', 'avisos', 'budget_items', 'cardapio', 'finance_categories'];
  for (const t of tables) {
    const list = db.getAll(t).filter(r => Number(r.encounter_id) === Number(src.id));
    for (const r of list) {
      const { id: _id, encounter_id: _eid, created_at: _ca, updated_at: _ua, ...clean } = r;
      if (t === 'teams') {
        const newId = db.insert(t, { ...clean, encounter_id: id, members_count: 0 });
        teamIdMap[r.id] = newId;
      } else if (t === 'team_members') continue;
      else db.insert(t, { ...clean, encounter_id: id });
    }
  }
  const srcMembers = db.getAll('team_members').filter(m => teamIdMap[Number(m.team_id)] !== undefined);
  for (const m of srcMembers) {
    const { id: _id, ...clean } = m;
    db.insert('team_members', { ...clean, team_id: teamIdMap[Number(m.team_id)] });
  }
  for (const tid of Object.values(teamIdMap)) {
    const cnt = db.getAll('team_members').filter(mm => Number(mm.team_id) === Number(tid)).length;
    db.update('teams', tid, { members_count: cnt });
  }
  res.status(201).json({ id, cloned_from: Number(src.id) });
});

module.exports = router;
