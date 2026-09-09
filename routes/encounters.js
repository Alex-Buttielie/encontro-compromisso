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

function seedManual(db, encounterId) {
  const s = require('../data/seed');
  for (const t of s.teams) db.insert('teams', { name: t.name, description: t.description, members_count: 0, responsible: null, encounter_id: encounterId });
  for (const t of s.tasks) db.insert('tasks', { category: t.category, item_number: t.item_number, title: t.title, description: t.description, responsible_team: t.responsible_team, deadline: t.deadline, priority: t.priority, status: 'pendente', phase: t.phase || 'pre', encounter_id: encounterId });
  for (const sc of s.schedule) db.insert('schedule', { day: sc.day, time: sc.time, activity: sc.activity, location: sc.location, responsible_team: sc.responsible_team, notes: '', status: 'pendente', encounter_id: encounterId });
  const escolinhas = [
    { name: '1ª Escolinha de Preparação das Equipes Extras', type: 'equipes_extras', description: 'Apresentação do Projeto aos casais e adultos.', target_audience: 'Equipes extras', status: 'agendada' },
    { name: '2ª Escolinha de Preparação das Equipes Extras', type: 'equipes_extras', description: 'Aprofundamento do serviço cristão.', target_audience: 'Equipes extras', status: 'agendada' },
    { name: '3ª Escolinha de Preparação das Equipes Extras', type: 'equipes_extras', description: 'Última Escolinha antes do Encontro.', target_audience: 'Equipes extras', status: 'agendada' },
    { name: 'Escolinha de Preparação da Cozinha - 1ª Reunião', type: 'cozinha', description: 'Apresentação e cardápio.', target_audience: 'Equipe da Cozinha', status: 'agendada' },
    { name: 'Escolinha de Preparação da Cozinha - 2ª Reunião', type: 'cozinha', description: 'Detalhamento de compras.', target_audience: 'Equipe da Cozinha', status: 'agendada' },
    { name: 'Escolinha de Implantação - 1ª Reunião', type: 'implantacao', description: 'Reunião geral do Projeto.', target_audience: 'Todos', status: 'agendada' },
    { name: 'Escolinha de Implantação - 2ª Reunião', type: 'implantacao', description: 'Lectio Divina e orientações.', target_audience: 'Todos', status: 'agendada' },
    { name: 'Escolinha de Implantação - 3ª Reunião', type: 'implantacao', description: 'Encaminhamentos finais.', target_audience: 'Todos', status: 'agendada' },
    { name: 'Escolinha de Implantação - 4ª Reunião', type: 'implantacao', description: 'Betoneira Geral Local.', target_audience: 'Todos os operários', status: 'agendada' },
    { name: 'Missa de Entrega', type: 'missa_entrega', description: 'Missa às vésperas. Entrega de crachás.', target_audience: 'Todos', status: 'agendada' },
  ];
  for (const e of escolinhas) db.insert('escolinhas', { ...e, date: null, time: null, location: null, attendance: [], encounter_id: encounterId });
  const alicerces = [
    { type: 'alicerce', order: 1, title: 'Alicerce 1 – Você Tem Valor', description: 'Valor pessoal.', schedule_day: 'Sábado', schedule_time: 'Manhã', status: 'nao_atribuido' },
    { type: 'alicerce', order: 2, title: 'Alicerce 2 – Personalidade e Ideal', description: 'Personalidade e ideal.', schedule_day: 'Sábado', schedule_time: 'Manhã', status: 'nao_atribuido' },
    { type: 'alicerce', order: 3, title: 'Alicerce 3 – Vícios, DSTs e Violência', description: 'Vícios e violência.', schedule_day: 'Sábado', schedule_time: 'Tarde', status: 'nao_atribuido' },
    { type: 'alicerce', order: 4, title: 'Alicerce 4 – Revisão de Vida', description: 'Revisão de vida.', schedule_day: 'Sábado', schedule_time: 'Tarde', status: 'nao_atribuido' },
    { type: 'alicerce', order: 5, title: 'Momento Betoneira', description: 'Bênção das Rosas + Betoneira + O Crucificado.', schedule_day: 'Sábado', schedule_time: 'Tarde/Noite', status: 'nao_atribuido' },
    { type: 'alicerce', order: 6, title: 'Alicerce 6 – Família', description: 'Família no Canteiro.', schedule_day: 'Domingo', schedule_time: 'Manhã', status: 'nao_atribuido' },
    { type: 'alicerce', order: 7, title: 'Alicerce Extra – Família Fornecedores', description: 'Família para pais.', schedule_day: 'Domingo', schedule_time: 'Manhã', status: 'nao_atribuido' },
    { type: 'alvenaria', order: 1, title: 'Alvenaria 1 – Pérola Rara', description: 'Valor único.', schedule_day: 'Sábado', schedule_time: 'Manhã', status: 'nao_atribuido' },
    { type: 'alvenaria', order: 2, title: 'Alvenaria 2 – Talentos', description: 'Talentos.', schedule_day: 'Sábado', schedule_time: 'Manhã', status: 'nao_atribuido' },
    { type: 'alvenaria', order: 3, title: 'Alvenaria 3 – Ser Cristão sem Deixar de Ser Jovem', description: 'Fé e juventude.', schedule_day: 'Sábado', schedule_time: 'Tarde', status: 'nao_atribuido' },
    { type: 'alvenaria', order: 4, title: 'Alvenaria 4 – Amizade', description: 'Amizade.', schedule_day: 'Sábado', schedule_time: 'Tarde', status: 'nao_atribuido' },
    { type: 'alvenaria', order: 5, title: 'Alvenaria 5 – Eucaristia', description: 'Eucaristia.', schedule_day: 'Domingo', schedule_time: 'Manhã', status: 'nao_atribuido' },
    { type: 'alvenaria', order: 6, title: 'Alvenaria 6 – Maria', description: 'Nossa Senhora.', schedule_day: 'Domingo', schedule_time: 'Manhã', status: 'nao_atribuido' },
  ];
  for (const a of alicerces) db.insert('alicerces', { ...a, constructor_name: null, encounter_id: encounterId });
  const lembrancinhas = [
    { team: 'Auxiliares', item_name: 'Lembrancinha "Serviço"', description: 'Servir é amar em ação', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
    { team: 'Bazar', item_name: 'Lembrancinha do Bazar', description: 'Item do Bazar', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
    { team: 'Cozinha', item_name: 'Lembrancinha da Cozinha', description: 'Item da Cozinha', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
    { team: 'Dinamização', item_name: 'Lembrancinha da Dinamização', description: 'Item da Dinamização', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
    { team: 'Espiritualização', item_name: 'Lembrancinha da Espiritualização', description: 'Item da Espiritualização', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
    { team: 'Estagiários', item_name: 'Etiquetas das malas e rosas', description: 'Etiquetas', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
    { team: 'Mestres de Obras', item_name: 'Lembrancinha dos MO', description: 'Mini-betoneira', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
    { team: 'RH', item_name: 'Kit do RH', description: '18 modelos padrão', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
    { team: 'Secretaria', item_name: 'Lembrancinhas Construtores (13)', description: '13 canecas', quantity_needed: 13, quantity_ready: 0, status: 'nao_iniciado' },
    { team: 'Sonorização', item_name: 'Lembrancinha da Sonorização', description: 'Item da Sonorização', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
  ];
  for (const l of lembrancinhas) db.insert('lembrancinhas', { ...l, encounter_id: encounterId });
  const cardapio = [
    { day: 'Sexta-feira', meal: 'Almoço operários', items: ['Galinhada', 'Feijão de caldo', 'Repolho e tomate'], notes: '' },
    { day: 'Sexta-feira', meal: 'Jantar', items: ['Bife', 'Batata frita', 'Sucos e refrigerantes'], notes: '' },
    { day: 'Sábado', meal: 'Café da manhã', items: ['Pão de sal', 'Bolos', 'Ovo mexido', 'Presunto e muçarela', 'Leite', 'Achocolatado', 'Sucos'], notes: '' },
    { day: 'Sábado', meal: 'Almoço', items: ['Arroz', 'Macarrão', 'Salada', 'Frango assado com batata', 'Sucos e refrigerantes'], notes: '' },
    { day: 'Sábado', meal: 'Lanche da tarde', items: ['Pão com salsicha', 'Lanches das MPs'], notes: '' },
    { day: 'Sábado', meal: 'Jantar', items: ['Noite de massas'], notes: '' },
    { day: 'Domingo', meal: 'Café da manhã', items: ['Pão de sal', 'Bolos', 'Ovo mexido', 'Presunto e muçarela', 'Leite', 'Achocolatado', 'Sucos'], notes: '' },
    { day: 'Domingo', meal: 'Almoço', items: ['Arroz', 'Strogonoff', 'Salada', 'Batata palha', 'Sobremesa: sorvete e gelatina'], notes: '' },
    { day: 'Domingo', meal: 'Lanche da tarde', items: ['Pão com carne', 'Sucos'], notes: '' },
  ];
  for (const c of cardapio) db.insert('cardapio', { ...c, encounter_id: encounterId });
  try { const v13 = require('../migrations/V13__seed_unified_budget_insumos'); const tmp = { getAll: () => [], insert: (t, o) => db.insert(t, { ...o, encounter_id: encounterId }) }; v13.up(tmp); } catch (e) { console.error('[seedManual] V13 falhou:', e.message); }
  const financeCategories = [
    { name: 'Inscrições', type: 'receita', color: '#27ae60', budget_limit: 0, description: 'Taxas de inscrição' }, { name: 'Doações', type: 'receita', color: '#2ecc71', budget_limit: 0, description: 'Doações' },
    { name: 'Bazar', type: 'receita', color: '#16a085', budget_limit: 0, description: 'Venda JUMIRE' }, { name: 'Noite na Praça', type: 'receita', color: '#3498db', budget_limit: 0, description: 'Noite na Praça' },
    { name: 'Feijoada', type: 'receita', color: '#2980b9', budget_limit: 0, description: 'Feijoada' }, { name: 'Confraternização', type: 'receita', color: '#8e44ad', budget_limit: 0, description: 'Confraternização' },
    { name: 'Pamonhada', type: 'receita', color: '#9b59b6', budget_limit: 0, description: 'Pamonhada' }, { name: 'Tríduo da Vila', type: 'receita', color: '#f39c12', budget_limit: 0, description: 'Tríduo' },
    { name: 'Reembolso', type: 'receita', color: '#e67e22', budget_limit: 0, description: 'Rifas' }, { name: 'Rendimento de Conta', type: 'receita', color: '#1abc9c', budget_limit: 0, description: 'Rendimentos' },
    { name: 'Taxa MP', type: 'receita', color: '#27ae60', budget_limit: 0, description: 'Taxa MP' }, { name: 'Taxa Operário', type: 'receita', color: '#27ae60', budget_limit: 0, description: 'Taxa Operário' },
    { name: 'Caixa Anterior', type: 'receita', color: '#2c3e50', budget_limit: 0, description: 'Caixa anterior' },
    { name: 'Espaço Físico', type: 'despesa', color: '#e74c3c', budget_limit: 8000, description: 'Aluguel Canteiro' }, { name: 'Alimentação', type: 'despesa', color: '#c0392b', budget_limit: 5000, description: 'Alimentação' },
    { name: 'Bazar', type: 'despesa', color: '#e67e22', budget_limit: 3000, description: 'Compra JUMIRE' }, { name: 'AEUC', type: 'despesa', color: '#d35400', budget_limit: 4000, description: 'AEUC' },
    { name: 'Noite na Praça', type: 'despesa', color: '#e74c3c', budget_limit: 3000, description: 'Noite na Praça' }, { name: 'Confraternização', type: 'despesa', color: '#c0392b', budget_limit: 2000, description: 'Confraternização' },
    { name: 'Materiais Gráficos', type: 'despesa', color: '#34495e', budget_limit: 2000, description: 'Impressões' }, { name: 'Materiais', type: 'despesa', color: '#7f8c8d', budget_limit: 2000, description: 'Sacochilas' },
    { name: 'Gás', type: 'despesa', color: '#95a5a6', budget_limit: 500, description: 'Gás' }, { name: 'Limpeza', type: 'despesa', color: '#bdc3c7', budget_limit: 500, description: 'Limpeza' },
    { name: 'Office Boy', type: 'despesa', color: '#95a5a6', budget_limit: 1000, description: 'Office Boy' }, { name: 'Taxas', type: 'despesa', color: '#e74c3c', budget_limit: 2000, description: 'Taxas' },
    { name: 'Reembolso', type: 'despesa', color: '#e67e22', budget_limit: 0, description: 'Reembolso' }, { name: 'Despesas Gerais', type: 'despesa', color: '#7f8c8d', budget_limit: 5000, description: 'Gerais' },
  ];
  for (const c of financeCategories) db.insert('finance_categories', { ...c, encounter_id: encounterId });
  const fornecedoresTpl = [
    { category: 'Espaço Físico', service: 'Aluguel do Canteiro de Obras' }, { category: 'Traslado', service: 'Ônibus para o Encontro' }, { category: 'Traslado', service: 'Caminhão de frete' },
    { category: 'Alimentação', service: 'Supermercado / Atacadão' }, { category: 'Alimentação', service: 'Açougue / Frutas e Verduras' }, { category: 'Materiais Gráficos', service: 'Gráfica (crachás, cartilhas, impressos)' },
    { category: 'Materiais Gráficos', service: 'Banners e placas' }, { category: 'Camisetas', service: 'Confecção de camisetas' }, { category: 'Bíblias', service: 'Loja JUMIRE / Pastoral' },
    { category: 'Som e Técnica', service: 'Equipamento de som e iluminação' }, { category: 'Som e Técnica', service: 'Datashow, telão e computador' }, { category: 'Som e Técnica', service: 'Refletores (aluguel)' },
    { category: 'Capela', service: 'Sacrário, ostensório, velas (Paróquia)' }, { category: 'Lembrancinhas', service: 'Materiais para confecção' }, { category: 'Decoração', service: 'TNT, lonas, balões, faixas' },
    { category: 'Rosas', service: 'Rosas para o Momento Betoneira' }, { category: 'Bazar', service: 'Artigos da JUMIRE' }, { category: 'Higienização', service: 'Produtos de limpeza e higiene' },
    { category: 'Equipamentos', service: 'Refresqueira (aluguel)' }, { category: 'Primeiros Socorros', service: 'Farmácia - remédios' }, { category: 'Hospedagem', service: 'Hotel/pousada Supervisores' },
  ];
  for (const f of fornecedoresTpl) db.insert('fornecedores', { name: '', category: f.category, service: f.service, phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor', encounter_id: encounterId });
}
function shiftYear(dateStr, delta) {
  if (!dateStr || !delta) return dateStr;
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return dateStr;
  return `${parseInt(m[1], 10) + delta}-${m[2]}-${m[3]}`;
}
function cloneTemplates(db, srcId, destId) {
  const src = db.getById('encounters', Number(srcId));
  const dest = db.getById('encounters', Number(destId));
  const yearDelta = (src && dest && src.year && dest.year) ? (Number(dest.year) - Number(src.year)) : 0;
  const tables = ['tasks', 'teams', 'schedule', 'alicerces', 'escolinhas', 'lembrancinhas', 'cardapio', 'budget_items', 'finance_categories', 'fornecedores'];
  const srcTasks = db.getAll('tasks').filter(r => Number(r.encounter_id) === Number(srcId));
  const hasTpl = srcTasks.length > 0;
  if (!hasTpl) { seedManual(db, destId); return; }
  for (const t of tables) {
    const list = db.getAll(t).filter(r => Number(r.encounter_id) === Number(srcId));
    for (const r of list) {
      const { id: _id, encounter_id: _eid, created_at: _ca, updated_at: _ua, ...clean } = r;
      if (t === 'tasks') { clean.status = 'pendente'; }
      if (t === 'teams') { clean.members_count = 0; clean.responsible = null; }
      if (t === 'schedule') { clean.status = 'pendente'; clean.notes = ''; }
      if (t === 'alicerces') { clean.constructor_name = null; clean.status = 'nao_atribuido'; }
      if (t === 'escolinhas') { clean.date = clean.date ? shiftYear(clean.date, yearDelta) : null; clean.time = null; clean.location = null; clean.status = 'agendada'; clean.attendance = []; }
      if (t === 'lembrancinhas') { clean.quantity_ready = 0; clean.status = 'nao_iniciado'; }
      if (t === 'budget_items') { clean.actual_cost = 0; clean.status = 'orcado'; clean.supplier = ''; }
      if (t === 'fornecedores') { clean.name = ''; clean.phone = ''; clean.email = ''; clean.whatsapp = ''; clean.contact_person = ''; clean.actual_cost = 0; clean.status = 'contatado'; clean.notes = ''; }
      clean.encounter_id = destId;
      db.insert(t, clean);
    }
  }
}
router.post('/encounters', (req, res) => {
  const { name, edition, edition_number, year, start_date, end_date, location, theme, theme_song, status, clone_from_id } = req.body;
  const edNum = edition_number !== undefined && edition_number !== '' ? parseInt(edition_number, 10) : (edition ? parseInt(edition, 10) : null);
  const yr = year !== undefined && year !== '' ? parseInt(year, 10) : (start_date ? parseInt(String(start_date).slice(0, 4), 10) : new Date().getFullYear());
  if (!edNum || !yr) return res.status(400).json({ error: 'Informe edicao e ano' });
  const exists = db.getAll('encounters').find(e => (e.edition_number === edNum || String(e.edition) === String(edNum)) && Number(e.year) === Number(yr));
  if (exists) return res.status(409).json({ error: `Ja existe ${toRoman(edNum)} / ${yr}` });
  const roman = toRoman(edNum);
  const finalName = name || `${roman} Compromisso Trin`;
  const id = db.insert('encounters', { name: finalName, edition: String(edNum), edition_number: edNum, year: yr, start_date: start_date || null, end_date: end_date || null, location: location || null, theme: theme || null, theme_song: theme_song || null, status: status || 'em_preparacao', is_active: false });
  if (clone_from_id) {
    const srcEnc = db.getById('encounters', Number(clone_from_id));
    if (srcEnc) cloneTemplates(db, srcEnc.id, id);
    else seedManual(db, id);
  } else {
    const all = db.getAll('encounters').filter(e => Number(e.id) !== Number(id));
    const src = all.length ? all[all.length - 1] : null;
    if (src) cloneTemplates(db, src.id, id);
    else seedManual(db, id);
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
  const delId = Number(req.params.id);
  const scoped = ['tasks', 'teams', 'schedule', 'alicerces', 'escolinhas', 'lembrancinhas', 'cardapio', 'budget_items', 'finance_categories', 'fornecedores', 'participants', 'padrinhos', 'lembretes', 'finance', 'finance_events', 'finance_budget', 'donations', 'finance_closings', 'avisos'];
  const teamIds = db.getAll('teams').filter(t => Number(t.encounter_id) === delId).map(t => Number(t.id));
  for (const t of scoped) {
    for (const r of db.getAll(t).filter(r => Number(r.encounter_id) === delId)) db.remove(t, r.id);
  }
  for (const m of db.getAll('team_members').filter(m => teamIds.includes(Number(m.team_id)))) db.remove('team_members', m.id);
  db.remove('encounters', req.params.id);
  res.json({ success: true });
});

router.post('/encounters/:id/clone', (req, res) => {
  const src = db.getById('encounters', req.params.id);
  if (!src) return res.status(404).json({ error: 'Encontro origem não encontrado' });
  const { year, edition, edition_number, start_date, end_date } = req.body;
  const edNum = edition_number !== undefined && edition_number !== '' ? parseInt(edition_number, 10) : (edition ? parseInt(edition, 10) : (src.edition_number || 0) + 1);
  const yr = year !== undefined && year !== '' ? parseInt(year, 10) : (start_date ? parseInt(String(start_date).slice(0, 4), 10) : (src.year || new Date().getFullYear()) + 1);
  const roman = toRoman(edNum);
  const exists = db.getAll('encounters').find(e => Number(e.edition_number) === Number(edNum) && Number(e.year) === Number(yr));
  if (exists) return res.status(409).json({ error: `Ja existe ${roman} / ${yr}` });
  const id = db.insert('encounters', {
    name: `${roman} Compromisso Trin`,
    edition: String(edNum),
    edition_number: edNum,
    year: yr,
    start_date: start_date || null, end_date: end_date || null, location: src.location || null, theme: null, theme_song: null,
    status: 'em_preparacao', is_active: false,
  });
  cloneTemplates(db, src.id, id);
  res.status(201).json({ id, cloned_from: Number(src.id) });
});

module.exports = router;
