const PDFDocument = require('pdfkit');
const db = require('../db/database');
const path = require('path');
const fs = require('fs');

const PDF_OPTIONS = { size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } };

const COLORS = {
  primary: '#8B1A1A',
  secondary: '#1B3A5C',
  accent: '#E74C3C',
  light: '#F0F3F4',
  lightAlt: '#F8F9FA',
  lightCard: '#EDF2F7',
  dark: '#1A1A2E',
  green: '#1B7A3A',
  greenLight: '#E8F5E9',
  orange: '#E67E22',
  orangeLight: '#FFF3E0',
  red: '#C0392B',
  redLight: '#FDEDEC',
  gray: '#5A6C7D',
  grayLight: '#A0A0A0',
  grayBg: '#F5F6F8',
  white: '#FFFFFF',
  jumireGreen: '#1A7A3A',
  cardBorder: '#E0E5EA',
  divider: '#D5DBE0',
};

const CONTENT_WIDTH = 510;
const PAGE_BOTTOM = 780;
const MARGIN = 50;
const CONTENT_X = 50;
const CONTENT_RIGHT = 560;

function sanitizePdfText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return value;

  return value
    .normalize('NFC')
    .replace(/📋/g, '[Cronograma]')
    .replace(/🔧/g, '[Preparacao]')
    .replace(/⚠/g, '[Atencao]')
    .replace(/📌/g, '-')
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF]/g, '');
}

function createReportDoc() {
  const doc = new PDFDocument(PDF_OPTIONS);
  const originalText = doc.text.bind(doc);

  doc.text = (value, ...args) => originalText(sanitizePdfText(value), ...args);

  let pageCount = 0;
  let inFooter = false;
  doc.on('pageAdded', () => {
    pageCount++;
    if (inFooter) return;
    inFooter = true;
    reportFooter(doc, pageCount);
    inFooter = false;
  });

  pageCount++;
  reportFooter(doc, pageCount);
  return doc;
}

function formatText(doc, text, options = {}) {
  doc.font('Helvetica').fontSize(options.size || 10).fillColor(options.color || COLORS.dark);
  doc.text(text, options.x || 50, options.y, options);
}

function reportHeader(doc, title, subtitle) {
  const pageW = doc.page.width;

  doc.fillColor(COLORS.secondary).rect(0, 0, pageW, 90).fill();
  doc.fillColor(COLORS.green).rect(0, 90, pageW, 5).fill();
  doc.fillColor(COLORS.primary).rect(0, 95, pageW, 2).fill();

  doc.fillColor('#fff').fontSize(22).font('Helvetica-Bold').text('Meu Coordenador', 50, 20);
  doc.fontSize(10).font('Helvetica').fillColor('rgba(255,255,255,0.75)').text('JUMIRE - Projeto Compromisso Trin', 50, 52);

  const dateStr = new Date().toLocaleDateString('pt-BR');
  doc.fontSize(9).fillColor('rgba(255,255,255,0.5)').text(dateStr, pageW - 150, 25, { width: 100, align: 'right' });

  doc.fillColor(COLORS.dark).fontSize(18).font('Helvetica-Bold').text(title, 50, 110);
  if (subtitle) {
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.gray).text(subtitle, 50, 135);
  }
}

function reportFooter(doc, pageNum) {
  const bottomY = doc.page.height - 35;
  const origBottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc.strokeColor(COLORS.divider).lineWidth(0.5).moveTo(50, bottomY - 5).lineTo(doc.page.width - 50, bottomY - 5).stroke();
  doc.fillColor(COLORS.grayLight).fontSize(7).font('Helvetica').text(
    'Meu Coordenador - JUMIRE | Projeto Compromisso Trin',
    50, bottomY, { width: 300 }
  );
  doc.text(`Pagina ${pageNum || 1}`, doc.page.width - 120, bottomY, { width: 70, align: 'right' });
  doc.page.margins.bottom = origBottomMargin;
}

function sectionTitle(doc, title, y, color) {
  const c = color || COLORS.primary;
  if (y > PAGE_BOTTOM - 50) { doc.addPage(); y = 50; }
  doc.fillColor(COLORS.lightCard).roundedRect(50, y - 2, CONTENT_WIDTH, 22, 3).fill();
  doc.fillColor(c).rect(50, y - 2, 4, 22).fill();
  doc.fillColor(c).fontSize(13).font('Helvetica-Bold').text(title, 62, y + 2);
  return y + 30;
}

function summaryCard(doc, label, value, x, y, w, h, color) {
  const c = color || COLORS.secondary;
  doc.fillColor(c).roundedRect(x, y, w, h, 6).fill();
  doc.fillColor('rgba(255,255,255,0.15)').roundedRect(x, y, w, 4, 6).fill();
  doc.fillColor('#fff').fontSize(h > 45 ? 22 : 16).font('Helvetica-Bold').text(value, x, y + 10, { width: w, align: 'center' });
  doc.fontSize(8).font('Helvetica').fillColor('rgba(255,255,255,0.85)').text(label, x, y + h - 15, { width: w, align: 'center' });
}

function progressBar(doc, pct, x, y, w) {
  doc.fillColor(COLORS.lightCard).roundedRect(x, y, w, 12, 6).fill();
  const fillW = Math.max(4, (w * pct) / 100);
  const color = pct === 100 ? COLORS.green : pct >= 50 ? COLORS.orange : COLORS.red;
  doc.fillColor(color).roundedRect(x, y, fillW, 12, 6).fill();
  doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text(pct + '%', x + w / 2 - 10, y + 2, { width: 20, align: 'center' });
}

function zebraRow(doc, y, h) {
  const bg = Math.floor(y / h) % 2 === 0 ? COLORS.lightAlt : COLORS.white;
  doc.fillColor(bg).rect(50, y - 2, CONTENT_WIDTH, h).fill();
}

function cardBox(doc, x, y, w, h, bgColor) {
  doc.fillColor(bgColor || COLORS.white).roundedRect(x, y, w, h, 4).fill();
  doc.strokeColor(COLORS.cardBorder).lineWidth(0.5).roundedRect(x, y, w, h, 4).stroke();
}

function tableHeader(doc, columns, y) {
  doc.fillColor(COLORS.secondary).roundedRect(50, y, CONTENT_WIDTH, 18, 3).fill();
  doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold');
  for (const col of columns) {
    doc.text(col.label, col.x, y + 5, { width: col.w || 80, align: col.align || 'left' });
  }
  return y + 20;
}

function statusBadge(doc, status, x, y) {
  const colors = { concluido: COLORS.green, em_andamento: COLORS.orange, pendente: COLORS.gray };
  const labels = { concluido: 'Concluido', em_andamento: 'Em Andamento', pendente: 'Pendente' };
  const color = colors[status] || COLORS.gray;
  const label = labels[status] || status;
  doc.fillColor(color).roundedRect(x, y, 82, 15, 4).fill();
  doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text(label, x, y + 4, { width: 82, align: 'center' });
}

function infoDivider(doc, y) {
  doc.strokeColor(COLORS.divider).lineWidth(0.5).moveTo(50, y).lineTo(CONTENT_RIGHT, y).stroke();
  return y + 8;
}

function calcTextHeight(doc, text, width, fontSize) {
  if (!text) return 0;
  const fs = doc._fontSize || 10;
  doc.fontSize(fontSize);
  const w = doc.widthOfString(text, { width });
  doc.fontSize(fs);
  const lines = Math.max(1, Math.ceil(w / width));
  return lines * (fontSize + 3);
}

function priorityLabel(p) {
  return { alta: 'Alta', media: 'Media', baixa: 'Baixa' }[p] || p;
}

function getEncounter() {
  const encs = db.getAll('encounters');
  return encs.length > 0 ? encs[encs.length - 1] : {};
}

function fmtDate(d) {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('pt-BR');
}

function fmtMoney(v) {
  return 'R$ ' + (v || 0).toFixed(2);
}

function generateFullReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  const enc = getEncounter();
  const encInfo = enc.name ? `${enc.name} - ${fmtDate(enc.start_date)} a ${fmtDate(enc.end_date)}` : '';
  reportHeader(doc, 'Relatorio Geral de Preparacao', `Gerado em ${new Date().toLocaleString('pt-BR')}${encInfo ? ' | ' + encInfo : ''}`);

  const allTasks = db.getAll('tasks');
  const preTasks = allTasks.filter(t => (t.phase || 'pre') === 'pre');
  const duringTasks = allTasks.filter(t => t.phase === 'during');
  const stats = {
    total: preTasks.length,
    done: preTasks.filter(t => t.status === 'concluido').length,
    in_progress: preTasks.filter(t => t.status === 'em_andamento').length,
    pending: preTasks.filter(t => t.status === 'pendente').length,
  };

  let y = 155;
  const cardW = 120;
  const cards = [
    { label: 'Total', value: stats.total, color: COLORS.secondary },
    { label: 'Concluidas', value: stats.done, color: COLORS.green },
    { label: 'Em Andamento', value: stats.in_progress, color: COLORS.orange },
    { label: 'Pendentes', value: stats.pending, color: COLORS.red },
  ];
  cards.forEach((c, i) => {
    summaryCard(doc, c.label, c.value, 50 + i * (cardW + 10), y, cardW, 55, c.color);
  });

  y += 75;
  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  doc.fillColor(COLORS.dark).fontSize(12).font('Helvetica-Bold').text(`Progresso Geral: ${pct}%`, 50, y);
  y += 18;
  progressBar(doc, pct, 50, y, CONTENT_WIDTH);
  y += 30;

  // Tasks by category (Pre-Encontro)
  const categories = [...new Set(preTasks.map(t => t.category))].sort();
  for (const cat of categories) {
    if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
    y = sectionTitle(doc, cat, y, COLORS.primary);
    const items = preTasks.filter(t => t.category === cat).sort((a, b) => parseFloat(a.item_number) - parseFloat(b.item_number));
    const catDone = items.filter(t => t.status === 'concluido').length;
    const catPct = items.length > 0 ? Math.round((catDone / items.length) * 100) : 0;
    doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(`${catDone}/${items.length} (${catPct}%)`, 500, y - 18, { width: 60, align: 'right' });
    y += 4;
    progressBar(doc, catPct, 50, y, CONTENT_WIDTH);
    y += 18;

    for (const t of items) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      const titleH = calcTextHeight(doc, `[${t.item_number}] ${t.title}`, 370, 10);
      const metaH = calcTextHeight(doc, `Equipe: ${t.responsible_team || 'N/A'}  |  Prazo: ${t.deadline || 'N/A'}  |  Prioridade: ${priorityLabel(t.priority)}`, 370, 8);
      const rowH = Math.max(32, titleH + metaH + 8);
      zebraRow(doc, y, rowH);
      const statusColor = t.status === 'concluido' ? COLORS.green : t.status === 'em_andamento' ? COLORS.orange : COLORS.gray;
      doc.fillColor(statusColor).circle(55, y + 6, 4).fill();
      doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(`[${t.item_number}]`, 68, y + 1, { continued: true });
      doc.font('Helvetica').text(` ${t.title}`, { width: 370 });
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.gray).text(`Equipe: ${t.responsible_team || 'N/A'}  |  Prazo: ${t.deadline || 'N/A'}  |  Prioridade: ${priorityLabel(t.priority)}`, 68, y + titleH + 4, { width: 370 });
      statusBadge(doc, t.status, 470, y + 4);
      y += rowH;
    }
    y += 10;
  }

  // Schedule
  doc.addPage();
  y = 50;
  reportHeader(doc, 'Cronograma do Encontro', 'Programacao Sexta a Domingo');
  y = 155;

  const days = ['Sexta-feira', 'Sabado', 'Domingo'];
  for (const day of days) {
    if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
    y = sectionTitle(doc, day, y, COLORS.secondary);
    const items = db.getAll('schedule').filter(s => s.day === day).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    for (const s of items) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      const actH = calcTextHeight(doc, s.activity || '', 270, 9);
      const rowH = Math.max(26, actH + 12);
      zebraRow(doc, y, rowH);
      doc.fillColor(COLORS.primary).fontSize(10).font('Helvetica-Bold').text(s.time || '-', 55, y + 4, { width: 55 });
      doc.fillColor(COLORS.dark).font('Helvetica').fontSize(9).text(s.activity || '', 115, y + 4, { width: 270 });
      doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica').text(s.location || '', 400, y + 4, { width: 70 });
      doc.fillColor(COLORS.secondary).fontSize(8).font('Helvetica-Bold').text(s.responsible_team || '', 400, y + 15, { width: 70 });
      statusBadge(doc, s.status, 480, y + 3);
      y += rowH;
    }
    y += 12;
  }

  // Teams
  doc.addPage();
  y = 50;
  reportHeader(doc, 'Equipes de Trabalho', 'Responsabilidades e Membros');
  y = 155;

  const teams = db.getAll('teams');
  for (const team of teams) {
    if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
    y = sectionTitle(doc, team.name, y, COLORS.primary);
    if (team.description) {
      doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica').text(team.description, 50, y, { width: CONTENT_WIDTH });
      y += 18;
    }
    const members = db.getAll('team_members').filter(m => m.team_id === team.id);
    if (members.length > 0) {
      doc.fontSize(9).fillColor(COLORS.gray).font('Helvetica-Bold').text(`Membros (${members.length}):`, 50, y);
      y += 14;
      const colW = 250;
      members.forEach((m, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const mx = 55 + col * colW;
        const my = y + row * 13;
        if (my > PAGE_BOTTOM) { doc.addPage(); y = 50; }
        doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(`- ${m.name}${m.role ? ' (' + m.role + ')' : ''}${m.phone ? '  ' + m.phone : ''}`, mx, my, { width: colW - 5 });
      });
      y += Math.ceil(members.length / 2) * 13 + 10;
    }
    y += 10;
  }

  // === ESCOLINHAS E EVENTOS DO CALENDARIO ===
  doc.addPage();
  y = 50;
  reportHeader(doc, 'Escolinhas e Eventos do Calendario 2026', 'Cronograma de formacao e preparacao - Abracando');
  y = 155;

  const allEsc = db.getAll('escolinhas').sort((a, b) => {
    const dCmp = (a.date || '9999').localeCompare(b.date || '9999');
    if (dCmp !== 0) return dCmp;
    return (a.time || '').localeCompare(b.time || '');
  });
  const escDone = allEsc.filter(e => e.status === 'concluida' || e.status === 'concluido').length;
  const escPending = allEsc.length - escDone;
  summaryCard(doc, 'Total', allEsc.length, 50, y, 120, 50, COLORS.secondary);
  summaryCard(doc, 'Concluidas', escDone, 180, y, 120, 50, COLORS.green);
  summaryCard(doc, 'Pendentes', escPending, 310, y, 120, 50, COLORS.orange);
  summaryCard(doc, 'Tipos', new Set(allEsc.map(e => e.type)).size, 440, y, 120, 50, COLORS.primary);
  y += 70;

  const escTypes = [...new Set(allEsc.map(e => e.type || 'evento'))].sort();
  for (const type of escTypes) {
    if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
    const typeItems = allEsc.filter(e => (e.type || 'evento') === type);
    const typeLabels = { formacao: 'Escolinhas de Formacao', equipes_extras: 'Equipes Extras', cozinha: 'Cozinha', implantacao: 'Implantacao', missa_entrega: 'Missa de Entrega', evento: 'Eventos Gerais' };
    y = sectionTitle(doc, `${typeLabels[type] || type} (${typeItems.length})`, y, COLORS.primary);
    for (const e of typeItems) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      const nameH = calcTextHeight(doc, e.name || '-', 280, 9);
      const descH = e.description ? calcTextHeight(doc, e.description, 420, 8) : 0;
      const rowH = Math.max(28, nameH + descH + 8);
      zebraRow(doc, y, rowH);
      const dt = e.date ? new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir';
      doc.fillColor(COLORS.primary).fontSize(10).font('Helvetica-Bold').text(dt, 55, y + 2, { width: 75 });
      doc.fillColor(COLORS.dark).font('Helvetica').fontSize(9).text(e.name || '-', 135, y + 2, { width: 280 });
      doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica').text(e.location || '-', 420, y + 2, { width: 70 });
      const stColor = e.status === 'concluida' || e.status === 'concluido' ? COLORS.green : e.status === 'em_andamento' ? COLORS.orange : COLORS.gray;
      doc.fillColor(stColor).font('Helvetica-Bold').fontSize(8).text(e.status || 'agendada', 500, y + 2, { width: 60 });
      if (e.description) {
        doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica-Oblique').text(e.description, 135, y + nameH + 4, { width: 420 });
      }
      y += rowH;
    }
    y += 8;
  }

  // === DURANTE O ENCONTRO ===
  if (duringTasks.length > 0) {
    doc.addPage();
    y = 50;
    reportHeader(doc, 'Tarefas Durante o Encontro', 'Execucao nos dias do Encontro (Sexta a Domingo)');
    y = 155;
    const duringCats = [...new Set(duringTasks.map(t => t.category))].sort();
    for (const cat of duringCats) {
      if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
      y = sectionTitle(doc, cat, y, COLORS.primary);
      const items = duringTasks.filter(t => t.category === cat).sort((a, b) => parseFloat(a.item_number) - parseFloat(b.item_number));
      const catDone = items.filter(t => t.status === 'concluido').length;
      doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(`${catDone}/${items.length}`, 500, y - 18, { width: 60, align: 'right' });
      y += 4;
      for (const t of items) {
        if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
        const titleH = calcTextHeight(doc, `[${t.item_number}] ${t.title}`, 390, 10);
        const descH = t.description ? calcTextHeight(doc, t.description, 390, 9) : 0;
        const rowH = Math.max(32, titleH + descH + 8);
        zebraRow(doc, y, rowH);
        const statusColor = t.status === 'concluido' ? COLORS.green : t.status === 'em_andamento' ? COLORS.orange : COLORS.gray;
        doc.fillColor(statusColor).circle(55, y + 6, 4).fill();
        doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(`[${t.item_number}] ${t.title}`, 68, y + 1, { width: 390 });
        let cy = y + titleH + 2;
        if (t.description) {
          doc.fontSize(9).font('Helvetica').fillColor(COLORS.gray).text(t.description, 68, cy, { width: 390 });
          cy += descH;
        }
        statusBadge(doc, t.status, 470, y + 4);
        y += rowH;
      }
      y += 10;
    }
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generateCategoryReport(category) {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  reportHeader(doc, `Relatorio: ${category}`, `Gerado em ${new Date().toLocaleString('pt-BR')}`);

  let y = 155;
  const allItems = db.getAll('tasks').filter(t => t.category === category).sort((a, b) => parseFloat(a.item_number) - parseFloat(b.item_number));
  const items = allItems.filter(t => (t.phase || 'pre') === 'pre');
  const duringItems = allItems.filter(t => t.phase === 'during');
  const total = items.length;
  const done = items.filter(t => t.status === 'concluido').length;
  const inProgress = items.filter(t => t.status === 'em_andamento').length;
  const pending = items.filter(t => t.status === 'pendente').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Summary cards
  const cardW = 120;
  summaryCard(doc, 'Total', total, 50, y, cardW, 50, COLORS.secondary);
  summaryCard(doc, 'Concluidas', done, 60 + cardW, y, cardW, 50, COLORS.green);
  summaryCard(doc, 'Em Andamento', inProgress, 70 + cardW * 2, y, cardW, 50, COLORS.orange);
  summaryCard(doc, 'Pendentes', pending, 80 + cardW * 3, y, cardW, 50, COLORS.red);
  y += 70;

  doc.fillColor(COLORS.dark).fontSize(12).font('Helvetica-Bold').text(`Progresso: ${pct}%`, 50, y);
  y += 18;
  progressBar(doc, pct, 50, y, CONTENT_WIDTH);
  y += 30;

  for (const t of items) {
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    const titleH = calcTextHeight(doc, `[${t.item_number}] ${t.title}`, 390, 10);
    const descH = t.description ? calcTextHeight(doc, t.description, 390, 9) : 0;
    const metaText = `Equipe: ${t.responsible_team || 'N/A'}  |  Prazo: ${t.deadline || 'N/A'}  |  Prioridade: ${priorityLabel(t.priority)}`;
    const metaH = calcTextHeight(doc, metaText, 390, 8);
    const notesH = t.notes ? calcTextHeight(doc, `Obs: ${t.notes}`, 420, 8) : 0;
    const rowH = Math.max(34, titleH + descH + metaH + notesH + 12);
    zebraRow(doc, y, rowH);
    const statusColor = t.status === 'concluido' ? COLORS.green : t.status === 'em_andamento' ? COLORS.orange : COLORS.gray;
    doc.fillColor(statusColor).circle(55, y + 6, 4).fill();
    doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(`[${t.item_number}] ${t.title}`, 68, y + 1, { width: 390 });
    let cy = y + titleH + 2;
    if (t.description) {
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.gray).text(t.description, 68, cy, { width: 390 });
      cy += descH;
    }
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.gray).text(metaText, 68, cy, { width: 390 });
    statusBadge(doc, t.status, 470, cy - 2);
    cy += metaH;
    if (t.notes) {
      doc.fontSize(8).font('Helvetica-Oblique').fillColor(COLORS.gray).text(`Obs: ${t.notes}`, 68, cy, { width: 420 });
    }
    y += rowH;
  }

  // === DURANTE O ENCONTRO ===
  if (duringItems.length > 0) {
    if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
    y += 10;
    y = sectionTitle(doc, 'Durante o Encontro', y, COLORS.primary);
    const dDone = duringItems.filter(t => t.status === 'concluido').length;
    const dPct = duringItems.length > 0 ? Math.round((dDone / duringItems.length) * 100) : 0;
    doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(`${dDone}/${duringItems.length} (${dPct}%)`, 500, y - 18, { width: 60, align: 'right' });
    y += 4;
    for (const t of duringItems) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      const titleH = calcTextHeight(doc, `[${t.item_number}] ${t.title}`, 390, 10);
      const descH = t.description ? calcTextHeight(doc, t.description, 390, 9) : 0;
      const metaText = `Equipe: ${t.responsible_team || 'N/A'}  |  Prioridade: ${priorityLabel(t.priority)}`;
      const metaH = calcTextHeight(doc, metaText, 390, 8);
      const notesH = t.notes ? calcTextHeight(doc, `Obs: ${t.notes}`, 420, 8) : 0;
      const rowH = Math.max(34, titleH + descH + metaH + notesH + 12);
      zebraRow(doc, y, rowH);
      const statusColor = t.status === 'concluido' ? COLORS.green : t.status === 'em_andamento' ? COLORS.orange : COLORS.gray;
      doc.fillColor(statusColor).circle(55, y + 6, 4).fill();
      doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(`[${t.item_number}] ${t.title}`, 68, y + 1, { width: 390 });
      let cy = y + titleH + 2;
      if (t.description) {
        doc.fontSize(9).font('Helvetica').fillColor(COLORS.gray).text(t.description, 68, cy, { width: 390 });
        cy += descH;
      }
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.gray).text(metaText, 68, cy, { width: 390 });
      statusBadge(doc, t.status, 470, cy - 2);
      cy += metaH;
      if (t.notes) {
        doc.fontSize(8).font('Helvetica-Oblique').fillColor(COLORS.gray).text(`Obs: ${t.notes}`, 68, cy, { width: 420 });
      }
      y += rowH;
    }
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generateTeamReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  reportHeader(doc, 'Relatorio por Equipes', `Gerado em ${new Date().toLocaleString('pt-BR')}`);

  let y = 155;
  const allTasksForTeams = db.getAll('tasks');
  const preTasks = allTasksForTeams.filter(t => (t.phase || 'pre') === 'pre');
  const duringTasks = allTasksForTeams.filter(t => t.phase === 'during');
  const teams = db.getAll('teams').sort((a, b) => a.name.localeCompare(b.name)).map(t => {
    const teamPre = preTasks.filter(tk => tk.responsible_team === t.name);
    const teamDuring = duringTasks.filter(tk => tk.responsible_team === t.name);
    return {
      name: t.name, description: t.description, id: t.id,
      pre_tasks: teamPre.length,
      pre_done: teamPre.filter(tk => tk.status === 'concluido').length,
      during_tasks: teamDuring.length,
      during_done: teamDuring.filter(tk => tk.status === 'concluido').length,
      total_tasks: teamPre.length + teamDuring.length,
      done_tasks: teamPre.filter(tk => tk.status === 'concluido').length + teamDuring.filter(tk => tk.status === 'concluido').length
    };
  });

  // Overall summary
  const totalTasks = teams.reduce((s, t) => s + t.total_tasks, 0);
  const doneTasks = teams.reduce((s, t) => s + t.done_tasks, 0);
  const overallPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  summaryCard(doc, 'Equipes', teams.length, 50, y, 120, 50, COLORS.secondary);
  summaryCard(doc, 'Tarefas', totalTasks, 180, y, 120, 50, COLORS.secondary);
  summaryCard(doc, 'Concluidas', doneTasks, 310, y, 120, 50, COLORS.green);
  summaryCard(doc, 'Progresso', overallPct + '%', 440, y, 120, 50, overallPct >= 50 ? COLORS.green : COLORS.orange);
  y += 70;

  for (const team of teams) {
    if (y > PAGE_BOTTOM - 80) { doc.addPage(); y = 50; }
    y = sectionTitle(doc, team.name, y, COLORS.primary);
    if (team.description) {
      doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(team.description, 50, y, { width: CONTENT_WIDTH });
      y += 16;
    }

    const pct = team.total_tasks > 0 ? Math.round((team.done_tasks / team.total_tasks) * 100) : 0;
    doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(`Total: ${team.done_tasks}/${team.total_tasks} (${pct}%)`, 50, y);
    y += 14;
    doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(`Pre-Encontro: ${team.pre_done}/${team.pre_tasks}  |  Durante: ${team.during_done}/${team.during_tasks}`, 50, y);
    y += 14;
    progressBar(doc, pct, 50, y, CONTENT_WIDTH);
    y += 18;

    const members = db.getAll('team_members').filter(m => m.team_id === team.id);
    if (members.length > 0) {
      doc.fontSize(9).fillColor(COLORS.gray).font('Helvetica-Bold').text(`Membros (${members.length}):`, 50, y);
      y += 14;
      const colW = 250;
      members.forEach((m, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const mx = 55 + col * colW;
        const my = y + row * 13;
        if (my > PAGE_BOTTOM) { doc.addPage(); y = 50; }
        doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(`- ${m.name}${m.role ? ' (' + m.role + ')' : ''}${m.phone ? '  ' + m.phone : ''}`, mx, my, { width: colW - 5 });
      });
      y += Math.ceil(members.length / 2) * 13 + 10;
    } else {
      doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica-Oblique').text('Nenhum membro cadastrado', 55, y);
      y += 16;
    }
    y += 10;
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generateTeamScheduleReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  reportHeader(doc, 'Programa por Equipe', `Cronograma de atividades de cada equipe - Gerado em ${new Date().toLocaleString('pt-BR')}`);

  let y = 155;
  const teams = db.getAll('teams');
  const schedule = db.getAll('schedule');
  const tasks = db.getAll('tasks');
  const dayOrder = { 'Sexta-feira': 0, 'Sabado': 1, 'Domingo': 2 };

  for (const team of teams) {
    const teamSchedule = schedule
      .filter(s => s.responsible_team === team.name)
      .sort((a, b) => (dayOrder[a.day] || 9) - (dayOrder[b.day] || 9) || (a.time || '').localeCompare(b.time || ''));
    const teamTasks = tasks.filter(t => t.responsible_team === team.name);
    const teamPreTasks = teamTasks.filter(t => (t.phase || 'pre') === 'pre');
    const teamDuringTasks = teamTasks.filter(t => t.phase === 'during');

    if (teamSchedule.length === 0 && teamTasks.length === 0) continue;

    if (y > PAGE_BOTTOM - 80) { doc.addPage(); y = 50; }
    y = sectionTitle(doc, team.name, y, COLORS.primary);
    if (team.description) {
      doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(team.description, 50, y, { width: CONTENT_WIDTH });
      y += 14;
    }

    // Members inline
    const members = db.getAll('team_members').filter(m => m.team_id === team.id);
    if (members.length > 0) {
      doc.fontSize(9).fillColor(COLORS.gray).font('Helvetica-Bold').text('Membros: ', 50, y, { continued: true });
      doc.font('Helvetica').fillColor(COLORS.dark).text(members.map(m => `${m.name}${m.role ? ' (' + m.role + ')' : ''}`).join(', '), { width: CONTENT_WIDTH });
      y += 16;
    }

    // Schedule activities
    if (teamSchedule.length > 0) {
      y += 4;
      doc.fillColor(COLORS.secondary).fontSize(11).font('Helvetica-Bold').text('Cronograma do Encontro', 50, y);
      y += 18;

      let currentDay = '';
      for (const s of teamSchedule) {
        if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
        if (s.day !== currentDay) {
          currentDay = s.day;
          doc.fillColor(COLORS.green).fontSize(10).font('Helvetica-Bold').text(`  ${currentDay}`, 50, y);
          y += 14;
        }
        const actH = calcTextHeight(doc, `  ${s.activity}`, 400, 10);
        const rowH = Math.max(24, actH + 10);
        zebraRow(doc, y, rowH);
        doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(`    ${s.time || '-'}`, 50, y + 4, { width: 60, continued: true });
        doc.font('Helvetica').fillColor(COLORS.dark).text(`  ${s.activity}`, { width: 400 });
        doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica').text(`    Local: ${s.location || '-'}`, 50, y + actH + 2, { width: 400 });
        const sColors = { concluido: COLORS.green, em_andamento: COLORS.orange, pendente: COLORS.gray };
        const sLabels = { concluido: 'Concluido', em_andamento: 'Em Andamento', pendente: 'Pendente' };
        doc.fillColor(sColors[s.status] || COLORS.gray).roundedRect(470, y + 3, 82, 15, 4).fill();
        doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text(sLabels[s.status] || s.status, 470, y + 5, { width: 82, align: 'center' });
        y += rowH;
      }
    } else {
      y += 4;
      doc.fillColor(COLORS.gray).fontSize(10).font('Helvetica-Oblique').text('  Sem atividades no cronograma.', 50, y);
      y += 16;
    }

    // Pre-Encontro tasks
    if (teamPreTasks.length > 0) {
      y += 8;
      if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
      doc.fillColor(COLORS.secondary).fontSize(11).font('Helvetica-Bold').text('Tarefas de Preparacao (Pre-Encontro)', 50, y);
      y += 18;
      const done = teamPreTasks.filter(t => t.status === 'concluido').length;
      doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(`${done}/${teamPreTasks.length} concluidas`, 50, y);
      y += 14;
      for (const t of teamPreTasks) {
        if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
        const titleH = calcTextHeight(doc, `[${t.item_number}] ${t.title}`, 400, 9);
        const rowH = Math.max(18, titleH + 6);
        zebraRow(doc, y, rowH);
        const stColor = t.status === 'concluido' ? COLORS.green : t.status === 'em_andamento' ? COLORS.orange : COLORS.gray;
        doc.fillColor(stColor).circle(55, y + 5, 3).fill();
        doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(`[${t.item_number}] ${t.title}`, 65, y + 3, { width: 400 });
        doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica').text(t.deadline || '', 470, y + 3, { width: 80 });
        y += rowH;
      }
    }

    // Durante o Encontro tasks
    if (teamDuringTasks.length > 0) {
      y += 8;
      if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
      doc.fillColor(COLORS.primary).fontSize(11).font('Helvetica-Bold').text('Tarefas Durante o Encontro', 50, y);
      y += 18;
      const done = teamDuringTasks.filter(t => t.status === 'concluido').length;
      doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(`${done}/${teamDuringTasks.length} concluidas`, 50, y);
      y += 14;
      for (const t of teamDuringTasks) {
        if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
        const titleH = calcTextHeight(doc, `[${t.item_number}] ${t.title}`, 400, 9);
        const rowH = Math.max(18, titleH + 6);
        zebraRow(doc, y, rowH);
        const stColor = t.status === 'concluido' ? COLORS.green : t.status === 'em_andamento' ? COLORS.orange : COLORS.gray;
        doc.fillColor(stColor).circle(55, y + 5, 3).fill();
        doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(`[${t.item_number}] ${t.title}`, 65, y + 3, { width: 400 });
        doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica').text(t.deadline || '', 470, y + 3, { width: 80 });
        y += rowH;
      }
    }

    y += 16;
    if (y < PAGE_BOTTOM) {
      doc.strokeColor(COLORS.light).lineWidth(1).moveTo(50, y).lineTo(560, y).stroke();
      y += 10;
    }
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generateScheduleReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  const enc = getEncounter();
  reportHeader(doc, 'Roteiro Geral do Encontro', `Programacao completa Sexta a Domingo${enc.name ? ' | ' + enc.name : ''}`);

  let y = 155;
  const days = ['Sexta-feira', 'Sabado', 'Domingo'];
  for (const day of days) {
    if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
    y = sectionTitle(doc, day, y, COLORS.primary);
    const items = db.getAll('schedule').filter(s => s.day === day).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    if (items.length === 0) {
      doc.fillColor(COLORS.gray).fontSize(10).font('Helvetica-Oblique').text('Nenhuma atividade cadastrada.', 55, y);
      y += 18;
    }
    for (const s of items) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      const actH = calcTextHeight(doc, s.activity || '', 270, 9);
      const rowH = Math.max(26, actH + 12);
      zebraRow(doc, y, rowH);
      doc.fillColor(COLORS.primary).fontSize(10).font('Helvetica-Bold').text(s.time || '-', 55, y + 4, { width: 55 });
      doc.fillColor(COLORS.dark).font('Helvetica').fontSize(9).text(s.activity || '', 115, y + 4, { width: 270 });
      doc.fillColor(COLORS.gray).fontSize(8).text(s.location || '', 400, y + 4, { width: 70 });
      doc.fillColor(COLORS.secondary).fontSize(8).font('Helvetica-Bold').text(s.responsible_team || '', 400, y + 15, { width: 70 });
      statusBadge(doc, s.status, 480, y + 3);
      y += rowH;
    }
    y += 14;
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generateParticipantsReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  reportHeader(doc, 'Lista de Materias-primas', 'Inscritos do Encontro Compromisso Trin');

  let y = 155;
  const participants = db.getAll('participants');
  const total = participants.length;
  const paid = participants.filter(p => p.paid).length;
  const restricted = participants.filter(p => p.food_restriction || p.medication || p.special_needs);

  // Summary cards
  summaryCard(doc, 'Total', total, 50, y, 120, 50, COLORS.secondary);
  summaryCard(doc, 'Pagos', paid, 180, y, 120, 50, COLORS.green);
  summaryCard(doc, 'Pendentes', total - paid, 310, y, 120, 50, COLORS.orange);
  summaryCard(doc, 'Com Restricoes', restricted.length, 440, y, 120, 50, COLORS.red);
  y += 70;

  // Table header
  y = tableHeader(doc, [
    { label: '#', x: 54, w: 20 },
    { label: 'Nome', x: 78, w: 120 },
    { label: 'Cracha', x: 200, w: 70 },
    { label: 'Idade', x: 272, w: 30 },
    { label: 'Grupo', x: 306, w: 60 },
    { label: 'Quarto', x: 368, w: 50 },
    { label: 'Camiseta', x: 420, w: 40 },
    { label: 'Pago', x: 470, w: 30, align: 'center' },
    { label: 'Restricoes', x: 500, w: 60 },
  ], y);

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    zebraRow(doc, y, 18);
    doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(String(p.id), 54, y + 4, { width: 20 });
    doc.text(p.name || '-', 78, y + 4, { width: 120 });
    doc.text(p.cracha_name || '-', 200, y + 4, { width: 70 });
    doc.text(String(p.age || '-'), 272, y + 4, { width: 30 });
    doc.text(p.group || '-', 306, y + 4, { width: 60 });
    doc.text(p.room || '-', 368, y + 4, { width: 50 });
    doc.text(p.shirt_size || '-', 420, y + 4, { width: 40 });
    doc.fillColor(p.paid ? COLORS.green : COLORS.red).font('Helvetica-Bold').text(p.paid ? 'Sim' : 'Nao', 470, y + 4, { width: 30, align: 'center' });
    doc.fillColor(p.food_restriction ? COLORS.red : COLORS.gray).font('Helvetica').text(p.food_restriction ? '! ' + p.food_restriction : '', 500, y + 4, { width: 60 });
    y += 18;
  }

  // Restrictions summary
  y += 16;
  if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
  y = sectionTitle(doc, 'Resumo de Restricoes e Necessidades Especiais', y, COLORS.red);
  if (restricted.length === 0) {
    doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica').text('Nenhuma restricao cadastrada.', 55, y);
    y += 14;
  } else {
    for (const p of restricted) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      zebraRow(doc, y, 40);
      doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(p.name, 55, y + 2);
      y += 14;
      if (p.food_restriction) { doc.fillColor(COLORS.red).font('Helvetica').fontSize(9).text(`  Restricao alimentar: ${p.food_restriction}`, 55, y, { width: 480 }); y += 12; }
      if (p.medication) { doc.fillColor(COLORS.orange).font('Helvetica').fontSize(9).text(`  Medicacao: ${p.medication}`, 55, y, { width: 480 }); y += 12; }
      if (p.special_needs) { doc.fillColor(COLORS.secondary).font('Helvetica').fontSize(9).text(`  Necessidades especiais: ${p.special_needs}`, 55, y, { width: 480 }); y += 12; }
      y += 6;
    }
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generateFinanceReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  reportHeader(doc, 'Relatorio Financeiro', 'Receitas e Despesas do Encontro');

  const items = db.getAll('finance');
  const income = items.filter(i => i.type === 'receita');
  const expenses = items.filter(i => i.type === 'despesa');
  const totalIncome = income.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, i) => s + (i.amount || 0), 0);
  const balance = totalIncome - totalExpenses;
  const pendingIncome = income.filter(i => !i.paid).reduce((s, i) => s + (i.amount || 0), 0);
  const pendingExpenses = expenses.filter(i => !i.paid).reduce((s, i) => s + (i.amount || 0), 0);

  let y = 155;
  // Summary cards
  summaryCard(doc, 'Receitas', fmtMoney(totalIncome), 50, y, 120, 55, COLORS.green);
  summaryCard(doc, 'Despesas', fmtMoney(totalExpenses), 180, y, 120, 55, COLORS.red);
  summaryCard(doc, 'Saldo', fmtMoney(balance), 310, y, 120, 55, balance >= 0 ? COLORS.green : COLORS.red);
  summaryCard(doc, 'A Receber', fmtMoney(pendingIncome), 440, y, 120, 55, COLORS.orange);
  y += 75;

  // Pending expenses
  if (pendingExpenses > 0) {
    doc.fillColor(COLORS.red).fontSize(10).font('Helvetica-Bold').text(`A Pagar: ${fmtMoney(pendingExpenses)}`, 50, y);
    y += 18;
  }

  // By category
  y = sectionTitle(doc, 'Resumo por Categoria', y, COLORS.primary);
  const cats = {};
  for (const i of items) {
    if (!cats[i.category]) cats[i.category] = { receita: 0, despesa: 0 };
    cats[i.category][i.type] = (cats[i.category][i.type] || 0) + (i.amount || 0);
  }
  y = tableHeader(doc, [
    { label: 'Categoria', x: 54, w: 200 },
    { label: 'Receita', x: 280, w: 100, align: 'right' },
    { label: 'Despesa', x: 400, w: 100, align: 'right' },
    { label: 'Saldo', x: 500, w: 50, align: 'right' },
  ], y);
  for (const [cat, vals] of Object.entries(cats)) {
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    zebraRow(doc, y, 16);
    doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(cat, 54, y + 3, { width: 200 });
    doc.fillColor(COLORS.green).text(fmtMoney(vals.receita || 0), 280, y + 3, { width: 100, align: 'right' });
    doc.fillColor(COLORS.red).text(fmtMoney(vals.despesa || 0), 400, y + 3, { width: 100, align: 'right' });
    const s = (vals.receita || 0) - (vals.despesa || 0);
    doc.fillColor(s >= 0 ? COLORS.green : COLORS.red).font('Helvetica-Bold').text(fmtMoney(s), 500, y + 3, { width: 50, align: 'right' });
    y += 16;
  }

  // Monthly breakdown
  y += 12;
  if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
  y = sectionTitle(doc, 'Resumo Mensal', y, COLORS.secondary);
  const months = {};
  for (const i of items) {
    if (!i.date) continue;
    const m = i.date.substring(0, 7);
    if (!months[m]) months[m] = { receita: 0, despesa: 0 };
    months[m][i.type] = (months[m][i.type] || 0) + (i.amount || 0);
  }
  const sortedMonths = Object.keys(months).sort();
  if (sortedMonths.length > 0) {
    y = tableHeader(doc, [
      { label: 'Mes', x: 54, w: 150 },
      { label: 'Receita', x: 280, w: 100, align: 'right' },
      { label: 'Despesa', x: 400, w: 100, align: 'right' },
      { label: 'Saldo', x: 500, w: 50, align: 'right' },
    ], y);
    for (const m of sortedMonths) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      zebraRow(doc, y, 16);
      const [yr, mo] = m.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthLabel = `${monthNames[parseInt(mo) - 1] || mo}/${yr}`;
      doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(monthLabel, 54, y + 3, { width: 150 });
      doc.fillColor(COLORS.green).text(fmtMoney(months[m].receita || 0), 280, y + 3, { width: 100, align: 'right' });
      doc.fillColor(COLORS.red).text(fmtMoney(months[m].despesa || 0), 400, y + 3, { width: 100, align: 'right' });
      const ms = (months[m].receita || 0) - (months[m].despesa || 0);
      doc.fillColor(ms >= 0 ? COLORS.green : COLORS.red).font('Helvetica-Bold').text(fmtMoney(ms), 500, y + 3, { width: 50, align: 'right' });
      y += 16;
    }
  }

  // Detailed list
  y += 12;
  if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
  y = sectionTitle(doc, 'Lancamentos Detalhados', y, COLORS.primary);
  for (const i of items) {
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    const descText = ` ${fmtMoney(i.amount)} - ${i.description || ''}`;
    const descH = calcTextHeight(doc, descText, 350, 10);
    const metaText = `${i.category || ''}  |  ${i.date ? fmtDate(i.date) : ''}  |  ${i.paid ? 'Pago' : 'Pendente'}  |  Resp: ${i.responsible || '-'}`;
    const metaH = calcTextHeight(doc, metaText, 440, 8);
    const rowH = Math.max(30, descH + metaH + 6);
    zebraRow(doc, y, rowH);
    doc.fillColor(i.type === 'receita' ? COLORS.green : COLORS.red).circle(55, y + 6, 3).fill();
    doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(i.type === 'receita' ? '+' : '-', 66, y + 1, { continued: true });
    doc.font('Helvetica').text(descText, { width: 350 });
    doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica').text(metaText, 66, y + descH + 2, { width: 440 });
    y += rowH;
  }

  // === EVENTOS FINANCEIROS ===
  const finEvents = db.getAll('finance_events');
  if (finEvents.length > 0) {
    y += 12;
    if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
    y = sectionTitle(doc, 'Eventos Financeiros', y, COLORS.secondary);
    y = tableHeader(doc, [
      { label: 'Evento', x: 54, w: 200 },
      { label: 'Data', x: 260, w: 70 },
      { label: 'Receita Prev.', x: 335, w: 90, align: 'right' },
      { label: 'Despesa Prev.', x: 430, w: 90, align: 'right' },
      { label: 'Status', x: 525, w: 35, align: 'right' },
    ], y);
    for (const ev of finEvents.sort((a, b) => (a.date || '').localeCompare(b.date || ''))) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      zebraRow(doc, y, 18);
      doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(ev.name || '-', 56, y + 4, { width: 200 });
      doc.fillColor(COLORS.gray).text(ev.date ? fmtDate(ev.date) : '-', 260, y + 4, { width: 70 });
      doc.fillColor(COLORS.green).text(fmtMoney(ev.expected_income || 0), 335, y + 4, { width: 90, align: 'right' });
      doc.fillColor(COLORS.red).text(fmtMoney(ev.expected_expense || 0), 430, y + 4, { width: 90, align: 'right' });
      const evColor = ev.status === 'concluido' ? COLORS.green : ev.status === 'em_andamento' ? COLORS.orange : COLORS.gray;
      doc.fillColor(evColor).font('Helvetica-Bold').text(ev.status || '-', 525, y + 4, { width: 35, align: 'right' });
      y += 18;
    }
  }

  // === ORCAMENTO POR CATEGORIA ===
  const finBudget = db.getAll('finance_budget');
  if (finBudget.length > 0) {
    y += 12;
    if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
    y = sectionTitle(doc, 'Orcamento por Categoria', y, COLORS.primary);
    y = tableHeader(doc, [
      { label: 'Categoria', x: 54, w: 180 },
      { label: 'Orcado', x: 240, w: 100, align: 'right' },
      { label: 'Gasto', x: 345, w: 100, align: 'right' },
      { label: 'Saldo', x: 450, w: 80, align: 'right' },
      { label: '%', x: 535, w: 25, align: 'right' },
    ], y);
    for (const b of finBudget.sort((a, b) => (a.category || '').localeCompare(b.category || ''))) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      zebraRow(doc, y, 16);
      const spent = b.spent || 0;
      const budgetAmt = b.amount || b.budgeted || 0;
      const bal = budgetAmt - spent;
      const bPct = budgetAmt > 0 ? Math.round((spent / budgetAmt) * 100) : 0;
      doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(b.category || '-', 56, y + 3, { width: 180 });
      doc.fillColor(COLORS.secondary).text(fmtMoney(budgetAmt), 240, y + 3, { width: 100, align: 'right' });
      doc.fillColor(COLORS.red).text(fmtMoney(spent), 345, y + 3, { width: 100, align: 'right' });
      doc.fillColor(bal >= 0 ? COLORS.green : COLORS.red).font('Helvetica-Bold').text(fmtMoney(bal), 450, y + 3, { width: 80, align: 'right' });
      doc.fillColor(bPct > 100 ? COLORS.red : bPct > 80 ? COLORS.orange : COLORS.green).text(`${bPct}%`, 535, y + 3, { width: 25, align: 'right' });
      y += 16;
    }
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generateAlicercesReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  reportHeader(doc, 'Mapa de Alicerces e Alvenarias', 'Pistas de reflexao - Construtores e horarios');

  let y = 155;
  const alicerces = db.getAll('alicerces');
  const alicerceItems = alicerces.filter(a => a.type === 'alicerce');
  const alvenariaItems = alicerces.filter(a => a.type === 'alvenaria');
  const alicerceDone = alicerceItems.filter(a => a.status === 'concluido').length;
  const alvenariaDone = alvenariaItems.filter(a => a.status === 'concluido').length;

  // Summary cards
  summaryCard(doc, 'Alicerces', alicerceItems.length, 50, y, 120, 50, COLORS.primary);
  summaryCard(doc, 'Concluidos', alicerceDone, 180, y, 120, 50, COLORS.green);
  summaryCard(doc, 'Alvenarias', alvenariaItems.length, 310, y, 120, 50, COLORS.secondary);
  summaryCard(doc, 'Concluidas', alvenariaDone, 440, y, 120, 50, COLORS.green);
  y += 70;

  y = sectionTitle(doc, `ALICERCES (${alicerceItems.length})`, y, COLORS.primary);

  for (const a of alicerceItems) {
    if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
    const contentH = a.content ? calcTextHeight(doc, a.content, 480, 10) : 0;
    const rowH = Math.max(44, 16 + contentH + 14 + 22);
    zebraRow(doc, y, rowH);
    doc.fillColor(COLORS.primary).fontSize(12).font('Helvetica-Bold').text(a.title, 55, y + 2);
    let cy = y + 16;
    if (a.content) { doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica').text(a.content, 55, cy, { width: 480 }); cy += contentH; }
    doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(`Construtor: ${a.builder || 'Nao atribuido'}  |  Dia: ${a.day || '-'}  |  Horario: ${a.time || '-'}`, 55, cy, { width: 400 });
    cy += 14;
    const stColors = { concluido: COLORS.green, atribuido: COLORS.orange, pendente: COLORS.gray };
    const stLabels = { concluido: 'Concluido', atribuido: 'Atribuido', pendente: 'Pendente' };
    doc.fillColor(stColors[a.status] || COLORS.gray).roundedRect(55, cy, 82, 15, 4).fill();
    doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text(stLabels[a.status] || a.status || 'pendente', 55, cy + 3, { width: 82, align: 'center' });
    y += rowH;
  }

  y += 10;
  if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
  y = sectionTitle(doc, `ALVENARIAS (${alvenariaItems.length})`, y, COLORS.secondary);

  for (const a of alvenariaItems) {
    if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
    const contentH = a.content ? calcTextHeight(doc, a.content, 480, 10) : 0;
    const rowH = Math.max(44, 16 + contentH + 14 + 22);
    zebraRow(doc, y, rowH);
    doc.fillColor(COLORS.secondary).fontSize(12).font('Helvetica-Bold').text(a.title, 55, y + 2);
    let cy = y + 16;
    if (a.content) { doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica').text(a.content, 55, cy, { width: 480 }); cy += contentH; }
    doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(`Construtor: ${a.builder || 'Nao atribuido'}  |  Dia: ${a.day || '-'}  |  Horario: ${a.time || '-'}`, 55, cy, { width: 400 });
    cy += 14;
    const stColors = { concluido: COLORS.green, atribuido: COLORS.orange, pendente: COLORS.gray };
    const stLabels = { concluido: 'Concluido', atribuido: 'Atribuido', pendente: 'Pendente' };
    doc.fillColor(stColors[a.status] || COLORS.gray).roundedRect(55, cy, 82, 15, 4).fill();
    doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text(stLabels[a.status] || a.status || 'pendente', 55, cy + 3, { width: 82, align: 'center' });
    y += rowH;
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generateLembrancinhasReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  reportHeader(doc, 'Lista de Lembrancinhas', 'Status de confeccao por equipe');

  let y = 155;
  const items = db.getAll('lembrancinhas');
  const done = items.filter(i => i.status === 'pronto').length;
  const inProgress = items.filter(i => i.status === 'em_andamento').length;
  const notStarted = items.filter(i => i.status === 'nao_iniciado').length;

  // Summary cards
  summaryCard(doc, 'Total', items.length, 50, y, 120, 50, COLORS.secondary);
  summaryCard(doc, 'Prontas', done, 180, y, 120, 50, COLORS.green);
  summaryCard(doc, 'Em Andamento', inProgress, 310, y, 120, 50, COLORS.orange);
  summaryCard(doc, 'Nao Iniciadas', notStarted, 440, y, 120, 50, COLORS.gray);
  y += 70;

  // Table header
  y = tableHeader(doc, [
    { label: 'Equipe', x: 54, w: 120 },
    { label: 'Item', x: 180, w: 150 },
    { label: 'Qtd. Necessaria', x: 340, w: 60, align: 'center' },
    { label: 'Qtd. Pronta', x: 410, w: 50, align: 'center' },
    { label: 'Status', x: 470, w: 80 },
  ], y);

  for (const l of items) {
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    zebraRow(doc, y, 20);
    doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(l.team || '-', 54, y + 4, { width: 120 });
    doc.text(l.item_name || '-', 180, y + 4, { width: 150 });
    doc.text(String(l.quantity_needed || 0), 340, y + 4, { width: 60, align: 'center' });
    doc.text(String(l.quantity_done || 0), 410, y + 4, { width: 50, align: 'center' });
    const stColors = { pronto: COLORS.green, em_andamento: COLORS.orange, nao_iniciado: COLORS.gray };
    const stLabels = { pronto: 'Pronto', em_andamento: 'Em Andamento', nao_iniciado: 'Nao Iniciado' };
    doc.fillColor(stColors[l.status] || COLORS.gray).roundedRect(470, y + 2, 82, 15, 4).fill();
    doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text(stLabels[l.status] || l.status || '-', 470, y + 4, { width: 82, align: 'center' });
    y += 20;
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generateFornecedoresReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  reportHeader(doc, 'Fornecedores', 'Agenda de contatos e cotacoes de prestadores de servicos');

  let y = 155;
  const items = db.getAll('fornecedores');
  const fornecedores = items.filter(f => (f.type || 'fornecedor') === 'fornecedor');
  const paisMP = items.filter(f => f.type === 'pai_mp');
  const contratados = fornecedores.filter(f => f.status === 'contratado').length;
  const pendentes = fornecedores.filter(f => f.status === 'pendente').length;

  // Summary cards
  summaryCard(doc, 'Fornecedores', fornecedores.length, 50, y, 120, 50, COLORS.secondary);
  summaryCard(doc, 'Contratados', contratados, 180, y, 120, 50, COLORS.green);
  summaryCard(doc, 'Pendentes', pendentes, 310, y, 120, 50, COLORS.orange);
  summaryCard(doc, 'Pais de MPs', paisMP.length, 440, y, 120, 50, COLORS.primary);
  y += 70;

  // Section 1: Fornecedores
  y = sectionTitle(doc, 'Fornecedores', y, COLORS.primary);
  const cats = [...new Set(fornecedores.map(f => f.category).filter(Boolean))].sort();

  for (const cat of cats) {
    if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
    doc.fillColor(COLORS.secondary).fontSize(11).font('Helvetica-Bold').text(cat, 55, y);
    doc.moveTo(55, y + 14).lineTo(560, y + 14).strokeColor(COLORS.green).lineWidth(1).stroke();
    y += 20;
    const catItems = fornecedores.filter(f => f.category === cat);
    for (const f of catItems) {
      if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
      const contacts = [];
      if (f.contact_person) contacts.push(`Contato: ${f.contact_person}`);
      if (f.phone) contacts.push(`Tel: ${f.phone}`);
      if (f.whatsapp) contacts.push(`WhatsApp: ${f.whatsapp}`);
      if (f.email) contacts.push(`Email: ${f.email}`);
      const contactsStr = contacts.length ? `  ${contacts.join(' | ')}` : '';
      const servH = calcTextHeight(doc, `Servico: ${f.service || '-'}`, 400, 9);
      const contactsH = contacts.length ? calcTextHeight(doc, contactsStr, 400, 9) : 0;
      const costH = (f.estimated_cost || f.actual_cost) ? calcTextHeight(doc, `Estimado: ${fmtMoney(f.estimated_cost)} | Real: ${fmtMoney(f.actual_cost)}`, 300, 9) : 0;
      const notesH = f.notes ? calcTextHeight(doc, `Obs: ${f.notes}`, 400, 8) : 0;
      const rowH = Math.max(54, 14 + servH + contactsH + costH + notesH + 16);
      zebraRow(doc, y, rowH);
      doc.fillColor(COLORS.dark).fontSize(11).font('Helvetica-Bold').text(f.name || 'Sem nome', 55, y + 2);
      let cy = y + 14;
      doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(`Servico: ${f.service || '-'}`, 65, cy, { width: 400 });
      cy += servH;
      if (contacts.length) { doc.text(contactsStr, 65, cy, { width: 400 }); cy += contactsH; }
      if (f.estimated_cost || f.actual_cost) {
        doc.fillColor(COLORS.secondary).font('Helvetica-Bold').text(`Estimado: ${fmtMoney(f.estimated_cost)} | Real: ${fmtMoney(f.actual_cost)}`, 65, cy, { width: 300 }); cy += costH;
      }
      const stColors = { contratado: COLORS.green, pendente: COLORS.orange, contatado: COLORS.secondary, cancelado: COLORS.red };
      const stLabels = { contratado: 'Contratado', pendente: 'Pendente', contatado: 'Contatado', cancelado: 'Cancelado' };
      doc.fillColor(stColors[f.status] || COLORS.gray).roundedRect(470, cy - 12, 82, 15, 4).fill();
      doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text(stLabels[f.status] || f.status, 470, cy - 10, { width: 82, align: 'center' });
      if (f.notes) { doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica-Oblique').text(`Obs: ${f.notes}`, 65, cy, { width: 400 }); cy += notesH; }
      y += rowH;
    }
    y += 10;
  }

  // Section 2: Pais de MPs
  if (paisMP.length > 0) {
    if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
    y += 6;
    y = sectionTitle(doc, 'Pais de Materias-Primas', y, COLORS.primary);

    for (const f of paisMP) {
      if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
      const details = [];
      if (f.mp_name) details.push(`Filho(a): ${f.mp_name}`);
      if (f.relationship) details.push(`Parentesco: ${f.relationship}`);
      if (f.phone) details.push(`Tel: ${f.phone}`);
      if (f.whatsapp) details.push(`WhatsApp: ${f.whatsapp}`);
      if (f.email) details.push(`Email: ${f.email}`);
      const detailsStr = details.join(' | ');
      const detailsH = details.length ? calcTextHeight(doc, detailsStr, 400, 9) : 0;
      const notesH = f.notes ? calcTextHeight(doc, `Obs: ${f.notes}`, 400, 8) : 0;
      const rowH = Math.max(44, 14 + detailsH + notesH + 16);
      zebraRow(doc, y, rowH);
      doc.fillColor(COLORS.dark).fontSize(11).font('Helvetica-Bold').text(f.name || 'Sem nome', 55, y + 2);
      let cy = y + 14;
      if (details.length) { doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(detailsStr, 65, cy, { width: 400 }); cy += detailsH; }
      const stColors = { contratado: COLORS.green, pendente: COLORS.orange, contatado: COLORS.secondary, cancelado: COLORS.red };
      const stLabels = { contratado: 'Confirmado', pendente: 'Pendente', contatado: 'Contatado', cancelado: 'Cancelado' };
      doc.fillColor(stColors[f.status] || COLORS.gray).roundedRect(470, cy - 12, 82, 15, 4).fill();
      doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text(stLabels[f.status] || f.status, 470, cy - 10, { width: 82, align: 'center' });
      if (f.notes) { doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica-Oblique').text(`Obs: ${f.notes}`, 65, cy, { width: 400 }); cy += notesH; }
      y += rowH;
    }
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generateAvisosReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  reportHeader(doc, 'Mural de Avisos', 'Comunicados do Coordenador');

  let y = 155;
  const items = db.getAll('avisos').sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const priorityLabels = { alta: 'ALTA', media: 'Media', baixa: 'Baixa' };
  const targetLabels = { todos: 'Todos', equipes: 'Equipes', materias_primas: 'Materias-primas', coordenacao: 'Coordenacao' };

  // Summary cards
  const alta = items.filter(a => a.priority === 'alta').length;
  const pinned = items.filter(a => a.pinned).length;
  summaryCard(doc, 'Total', items.length, 50, y, 120, 50, COLORS.secondary);
  summaryCard(doc, 'Fixados', pinned, 180, y, 120, 50, COLORS.primary);
  summaryCard(doc, 'Prioridade Alta', alta, 310, y, 120, 50, COLORS.red);
  summaryCard(doc, 'Outros', items.length - alta, 440, y, 120, 50, COLORS.gray);
  y += 70;

  if (items.length === 0) {
    doc.fillColor(COLORS.gray).fontSize(13).font('Helvetica').text('Nenhum aviso publicado.', 55, y);
  } else {
    for (const a of items) {
      if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
      const pColors = { alta: COLORS.red, media: COLORS.orange, baixa: COLORS.secondary };
      const contentLines = Math.ceil(doc.widthOfString(a.content || '', { width: 480 }) / 480);
      const rowH = 18 + contentLines * 13 + 10 + 20 + 14;
      zebraRow(doc, y, rowH);
      doc.fillColor(pColors[a.priority] || COLORS.gray).rect(50, y, 4, rowH - 10).fill();
      doc.fillColor(COLORS.dark).fontSize(13).font('Helvetica-Bold').text(`${a.pinned ? '- ' : ''}${a.title}`, 60, y + 2);
      y += 18;
      doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica').text(a.content || '', 60, y, { width: 480 });
      y += contentLines * 13 + 10;
      doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica').text(`Autor: ${a.author || '-'}  |  Publico: ${targetLabels[a.target] || a.target}  |  Prioridade: ${priorityLabels[a.priority] || a.priority}  |  ${a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : ''}`, 60, y, { width: 480 });
      y += 20;
      y = infoDivider(doc, y);
      y += 6;
    }
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generateKitReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  reportHeader(doc, 'Kit da Materia-prima', 'Checklist do RH - Itens para cada inscrito');

  let y = 155;
  const participants = db.getAll('participants');
  summaryCard(doc, 'Itens do Kit', 10, 50, y, 120, 50, COLORS.secondary);
  summaryCard(doc, 'Inscritos', participants.length, 180, y, 120, 50, COLORS.primary);
  summaryCard(doc, 'Pagos', participants.filter(p => p.paid).length, 310, y, 120, 50, COLORS.green);
  summaryCard(doc, 'Pendentes', participants.filter(p => !p.paid).length, 440, y, 120, 50, COLORS.orange);
  y += 70;

  doc.fillColor(COLORS.gray).fontSize(10).font('Helvetica-Oblique').text('Conferir os Kits ate 30 dias antes do Encontro. Cada materia-prima deve receber todos os itens abaixo.', 50, y, { width: CONTENT_WIDTH });
  y += 20;

  const kitItems = [
    { item: 'Bloco de anotacao', momento: 'Inicio do Encontro', anexo: 'ANEXO VII' },
    { item: 'Caneta', momento: 'Inicio do Encontro', anexo: 'ANEXO VIII' },
    { item: 'Cordao com pingente do Espirito Santo', momento: 'Acabamento', anexo: 'ANEXO IX' },
    { item: 'Fitas coloridas da JUMIRE (separacao das squeezes)', momento: 'Inicio do Encontro', anexo: 'ANEXO X' },
    { item: 'Lembrancinhas do RH (18 modelos)', momento: 'Durante o Encontro', anexo: 'ANEXO XI' },
    { item: 'Livreto de Oracoes', momento: 'Inicio do Encontro', anexo: '-' },
    { item: 'Oracao do Compromissado de bolso', momento: 'Acabamento', anexo: 'ANEXO XII' },
    { item: 'Oracao do Espirito Santo para instrutores', momento: 'Inicio do Encontro', anexo: 'ANEXO XIII' },
    { item: 'Sacolinha/Mochila', momento: 'Inicio do Encontro', anexo: 'ANEXO XIV' },
    { item: 'Squeeze (personalizar com nome)', momento: 'Antes do Encontro', anexo: 'ANEXO XV' },
  ];

  y = sectionTitle(doc, 'Itens do Kit', y, COLORS.primary);
  y = tableHeader(doc, [
    { label: 'Item', x: 54, w: 220 },
    { label: 'Momento de Uso', x: 280, w: 150 },
    { label: 'Modelo/Anexo', x: 440, w: 100 },
    { label: 'OK', x: 530, w: 20, align: 'center' },
  ], y);

  for (const k of kitItems) {
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    zebraRow(doc, y, 20);
    doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(k.item, 54, y + 4, { width: 220 });
    doc.fillColor(COLORS.gray).text(k.momento, 280, y + 4, { width: 150 });
    doc.text(k.anexo, 440, y + 4, { width: 100 });
    doc.strokeColor(COLORS.gray).lineWidth(1).rect(530, y + 2, 14, 14).stroke();
    y += 20;
  }

  // Per-participant checklist
  y += 16;
  if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
  y = sectionTitle(doc, 'Controle por Materia-prima', y, COLORS.secondary);
  if (participants.length === 0) {
    doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica').text('Nenhuma materia-prima inscrita ainda.', 55, y);
  } else {
    y = tableHeader(doc, [
      { label: '#', x: 54, w: 20 },
      { label: 'Nome', x: 78, w: 200 },
      { label: 'Kit Conferido', x: 300, w: 80, align: 'center' },
      { label: 'Squeeze Personalizada', x: 390, w: 100, align: 'center' },
      { label: 'Assinatura RH', x: 500, w: 60 },
    ], y);
    for (const p of participants) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      zebraRow(doc, y, 18);
      doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(String(p.id), 54, y + 4, { width: 20 });
      doc.text(p.name || '-', 78, y + 4, { width: 200 });
      doc.strokeColor(COLORS.gray).rect(310, y + 2, 12, 12).stroke();
      doc.strokeColor(COLORS.gray).rect(410, y + 2, 12, 12).stroke();
      doc.strokeColor(COLORS.gray).rect(500, y + 2, 50, 12).stroke();
      y += 18;
    }
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generateCoordinatorGuideReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  // ============ CAPA ============
  doc.fillColor(COLORS.primary).rect(0, 0, doc.page.width, doc.page.height).fill();
  // Accent line on cover
  doc.fillColor(COLORS.green).rect(0, 180, doc.page.width, 4).fill();
  doc.fillColor('#fff').fontSize(32).font('Helvetica-Bold').text('GUIA DO', 50, 200, { align: 'center' });
  doc.fontSize(32).text('COORDENADOR', 50, 240, { align: 'center' });
  doc.fontSize(14).font('Helvetica').text('Encontro Compromisso Trin', 50, 300, { align: 'center' });
  doc.text('Manual de Bolso - Dias do Encontro', 50, 320, { align: 'center' });

  // Encounter info on cover
  const enc = db.getAll('encounters')[0] || {};
  if (enc.name || enc.start_date) {
    doc.fontSize(11).text(`${enc.name || 'Encontro Compromisso Trin'}`, 50, 380, { align: 'center' });
    if (enc.start_date) {
      const dt = new Date(enc.start_date).toLocaleDateString('pt-BR');
      const dt2 = enc.end_date ? new Date(enc.end_date).toLocaleDateString('pt-BR') : dt;
      doc.text(`${dt} a ${dt2}`, 50, 400, { align: 'center' });
    }
    if (enc.location) doc.text(`Local: ${enc.location}`, 50, 420, { align: 'center' });
    if (enc.theme) doc.text(`Tema: ${enc.theme}`, 50, 440, { align: 'center' });
    if (enc.theme_song) doc.text(`Musica tema: ${enc.theme_song}`, 50, 460, { align: 'center' });
  }

  doc.fontSize(9).fillColor('rgba(255,255,255,0.6)').text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 50, 520, { align: 'center' });
  doc.fontSize(8).text('JUMIRE - Projeto Compromisso Trin', 50, 540, { align: 'center' });

  // ============ PAGINA 2: SUMARIO E EQUIPES ============
  doc.addPage();
  reportHeader(doc, 'Equipes e Contatos', 'Equipes de trabalho, membros e telefones');

  let y = 155;
  const teams = db.getAll('teams');
  const members = db.getAll('team_members');

  // Quick reference: key contacts
  y = sectionTitle(doc, 'Contatos Rapidos', y, COLORS.primary);
  const mo = members.filter(m => { const t = teams.find(te => te.id === m.team_id); return t && (t.name.includes('Mestre') || t.name.includes('Coordena') || t.name.includes('Supervisor')); });
  if (mo.length > 0) {
    for (const m of mo) {
      const t = teams.find(te => te.id === m.team_id);
      zebraRow(doc, y, 16);
      doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(`${m.name}`, 55, y + 3, { continued: true });
      doc.font('Helvetica').fillColor(COLORS.gray).text(`  - ${t ? t.name : ''}  ${m.phone ? '| ' + m.phone : ''}  ${m.role ? '| ' + m.role : ''}`);
      y += 16;
    }
  } else {
    doc.fillColor(COLORS.gray).fontSize(10).font('Helvetica').text('Nenhum Mestre de Obras ou Supervisor cadastrado.', 55, y);
    y += 16;
  }
  y += 14;

  // All teams with members
  y = sectionTitle(doc, 'Equipes de Trabalho', y, COLORS.primary);

  for (const team of teams) {
    if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
    doc.fillColor(COLORS.secondary).fontSize(11).font('Helvetica-Bold').text(team.name, 55, y);
    y += 16;
    if (team.description) {
      doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(team.description, 55, y, { width: CONTENT_WIDTH });
      y += 14;
    }
    const tm = members.filter(m => m.team_id === team.id);
    if (tm.length > 0) {
      for (const m of tm) {
        if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
        doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(`  - ${m.name}${m.role ? ' - ' + m.role : ''}${m.phone ? '  | ' + m.phone : ''}`, 55, y, { width: CONTENT_WIDTH });
        y += 13;
      }
    } else {
      doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica-Oblique').text('  Sem membros cadastrados', 55, y);
      y += 13;
    }
    y += 10;
  }

  // ============ CRONOGRAMA COMPLETO ============
  doc.addPage();
  reportHeader(doc, 'Cronograma do Encontro', 'Programacao completa - Sexta a Domingo');
  y = 155;

  const days = ['Sexta-feira', 'Sabado', 'Domingo'];
  const schedule = db.getAll('schedule');
  for (const day of days) {
    if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
    y = sectionTitle(doc, day, y, COLORS.primary);
    const items = schedule.filter(s => s.day === day).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    for (const s of items) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      const actH = calcTextHeight(doc, s.activity || '', 270, 9);
      const rowH = Math.max(26, actH + 12);
      zebraRow(doc, y, rowH);
      doc.fillColor(COLORS.primary).fontSize(10).font('Helvetica-Bold').text(s.time || '-', 55, y + 4, { width: 55 });
      doc.fillColor(COLORS.dark).font('Helvetica').fontSize(9).text(s.activity || '', 115, y + 4, { width: 270 });
      doc.fillColor(COLORS.gray).fontSize(8).text(s.location || '', 400, y + 4, { width: 70 });
      doc.fillColor(COLORS.secondary).fontSize(8).font('Helvetica-Bold').text(s.responsible_team || '', 400, y + 15, { width: 70 });
      statusBadge(doc, s.status, 480, y + 3);
      y += rowH;
    }
    y += 14;
  }

  // ============ CALENDARIO DE PREPARACAO ============
  doc.addPage();
  reportHeader(doc, 'Calendario de Preparacao 2026', 'Escolinhas e eventos antes do Encontro');
  y = 155;

  const calEsc = db.getAll('escolinhas').sort((a, b) => {
    const dCmp = (a.date || '9999').localeCompare(b.date || '9999');
    if (dCmp !== 0) return dCmp;
    return (a.time || '').localeCompare(b.time || '');
  });
  if (calEsc.length === 0) {
    doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica-Oblique').text('Nenhuma escolinha ou evento cadastrado.', 55, y);
    y += 20;
  } else {
    y = tableHeader(doc, [
      { label: 'Data', x: 54, w: 75 },
      { label: 'Hora', x: 135, w: 45 },
      { label: 'Evento', x: 190, w: 200 },
      { label: 'Local', x: 400, w: 90 },
      { label: 'Publico', x: 500, w: 60 },
    ], y);
    for (const e of calEsc) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      const nameH = calcTextHeight(doc, e.name || '-', 200, 9);
      const rowH = Math.max(22, nameH + 8);
      zebraRow(doc, y, rowH);
      const dt = e.date ? new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir';
      doc.fillColor(COLORS.primary).fontSize(9).font('Helvetica-Bold').text(dt, 56, y + 4, { width: 75 });
      doc.fillColor(COLORS.dark).font('Helvetica').text(e.time || '-', 135, y + 4, { width: 45 });
      doc.font('Helvetica-Bold').text(e.name || '-', 190, y + 4, { width: 200 });
      doc.font('Helvetica').fillColor(COLORS.gray).text(e.location || '-', 400, y + 4, { width: 90 });
      doc.fillColor(COLORS.secondary).fontSize(8).font('Helvetica-Oblique').text(e.target_audience || '-', 500, y + 4, { width: 60 });
      y += rowH;
    }
  }

  // ============ ALICERCES E ALVENARIAS ============
  doc.addPage();
  reportHeader(doc, 'Alicerces e Alvenarias', 'Pistas de reflexao - Construtores e horarios');
  y = 155;

  const alicerces = db.getAll('alicerces');
  const alicerceItems = alicerces.filter(a => a.type === 'alicerce');
  const alvenariaItems = alicerces.filter(a => a.type === 'alvenaria');

  y = sectionTitle(doc, `ALICERCES (${alicerceItems.length})`, y, COLORS.primary);

  for (const a of alicerceItems) {
    if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
    const contentH = a.content ? calcTextHeight(doc, a.content, 480, 9) : 0;
    const rowH = Math.max(44, 16 + 14 + contentH + 8);
    zebraRow(doc, y, rowH);
    doc.fillColor(COLORS.primary).fontSize(11).font('Helvetica-Bold').text(a.title, 55, y + 2);
    let cy = y + 16;
    doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(`Construtor: ${a.builder || 'NAO ATRIBUIDO'}  |  Dia: ${a.day || '-'}  |  Horario: ${a.time || '-'}`, 55, cy, { width: CONTENT_WIDTH });
    cy += 14;
    if (a.content) {
      if (cy + contentH > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(a.content, 65, cy, { width: 480 });
    }
    y += rowH;
  }

  y += 10;
  if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
  y = sectionTitle(doc, `ALVENARIAS (${alvenariaItems.length})`, y, COLORS.secondary);

  for (const a of alvenariaItems) {
    if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
    const contentH = a.content ? calcTextHeight(doc, a.content, 480, 9) : 0;
    const rowH = Math.max(44, 16 + 14 + contentH + 8);
    zebraRow(doc, y, rowH);
    doc.fillColor(COLORS.secondary).fontSize(11).font('Helvetica-Bold').text(a.title, 55, y + 2);
    let cy = y + 16;
    doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(`Construtor: ${a.builder || 'NAO ATRIBUIDO'}  |  Dia: ${a.day || '-'}  |  Horario: ${a.time || '-'}`, 55, cy, { width: CONTENT_WIDTH });
    cy += 14;
    if (a.content) {
      if (cy + contentH > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(a.content, 65, cy, { width: 480 });
    }
    y += rowH;
  }

  // ============ MATERIAS-PRIMAS ============
  doc.addPage();
  reportHeader(doc, 'Materias-primas', 'Lista de inscritos - Grupos, quartos e restricoes');
  y = 155;

  const participants = db.getAll('participants');
  const totalMP = participants.length;
  const paidMP = participants.filter(p => p.paid).length;
  const restrictedMP = participants.filter(p => p.food_restriction || p.medication || p.special_needs);
  summaryCard(doc, 'Total', totalMP, 50, y, 120, 50, COLORS.secondary);
  summaryCard(doc, 'Pagos', paidMP, 180, y, 120, 50, COLORS.green);
  summaryCard(doc, 'Pendentes', totalMP - paidMP, 310, y, 120, 50, COLORS.orange);
  summaryCard(doc, 'Com Restricoes', restrictedMP.length, 440, y, 120, 50, COLORS.red);
  y += 70;

  // Table
  y = tableHeader(doc, [
    { label: '#', x: 54, w: 16 },
    { label: 'Nome', x: 72, w: 110 },
    { label: 'Grupo', x: 184, w: 50 },
    { label: 'Quarto', x: 236, w: 45 },
    { label: 'Camiseta', x: 283, w: 35 },
    { label: 'P', x: 320, w: 12, align: 'center' },
    { label: 'Restricao Alimentar', x: 335, w: 100 },
    { label: 'Medicacao', x: 437, w: 80 },
    { label: 'Nec. Esp.', x: 520, w: 40 },
  ], y);

  for (const p of participants) {
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    zebraRow(doc, y, 15);
    doc.fillColor(COLORS.dark).fontSize(8).font('Helvetica').text(String(p.id), 54, y + 3, { width: 16 });
    doc.text(p.name || '-', 72, y + 3, { width: 110 });
    doc.text(p.group || '-', 184, y + 3, { width: 50 });
    doc.text(p.room || '-', 236, y + 3, { width: 45 });
    doc.text(p.shirt_size || '-', 283, y + 3, { width: 35 });
    doc.fillColor(p.paid ? COLORS.green : COLORS.red).font('Helvetica-Bold').text(p.paid ? 'S' : 'N', 320, y + 3, { width: 12, align: 'center' });
    doc.fillColor(p.food_restriction ? COLORS.red : COLORS.gray).font('Helvetica').text(p.food_restriction || '-', 335, y + 3, { width: 100 });
    doc.fillColor(p.medication ? COLORS.orange : COLORS.gray).text(p.medication || '-', 437, y + 3, { width: 80 });
    doc.fillColor(p.special_needs ? COLORS.secondary : COLORS.gray).text(p.special_needs || '-', 520, y + 3, { width: 40 });
    y += 15;
  }

  // Restrictions highlighted
  y += 16;
  if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
  y = sectionTitle(doc, 'ATENCAO - Restricoes e Necessidades Especiais', y, COLORS.red);
  const restricted = restrictedMP;
  if (restricted.length === 0) {
    doc.fillColor(COLORS.gray).fontSize(10).font('Helvetica').text('Nenhuma restricao cadastrada.', 55, y);
    y += 14;
  } else {
    for (const p of restricted) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      let restrictionH = 0;
      if (p.food_restriction) restrictionH += calcTextHeight(doc, `  ! Restricao alimentar: ${p.food_restriction}`, 480, 9);
      if (p.medication) restrictionH += calcTextHeight(doc, `  Medicacao: ${p.medication}`, 480, 9);
      if (p.special_needs) restrictionH += calcTextHeight(doc, `  Necessidades especiais: ${p.special_needs}`, 480, 9);
      const rowH = Math.max(40, 14 + restrictionH + 8);
      zebraRow(doc, y, rowH);
      doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(p.name, 55, y + 2);
      let cy = y + 14;
      if (p.food_restriction) { doc.fillColor(COLORS.red).font('Helvetica').fontSize(9).text(`  ! Restricao alimentar: ${p.food_restriction}`, 55, cy, { width: 480 }); cy += calcTextHeight(doc, `  ! Restricao alimentar: ${p.food_restriction}`, 480, 9); }
      if (p.medication) { doc.fillColor(COLORS.orange).font('Helvetica').fontSize(9).text(`  Medicacao: ${p.medication}`, 55, cy, { width: 480 }); cy += calcTextHeight(doc, `  Medicacao: ${p.medication}`, 480, 9); }
      if (p.special_needs) { doc.fillColor(COLORS.secondary).font('Helvetica').fontSize(9).text(`  Necessidades especiais: ${p.special_needs}`, 55, cy, { width: 480 }); }
      y += rowH;
    }
  }

  // ============ PADRINHOS ============
  doc.addPage();
  reportHeader(doc, 'Padrinhos e Madrinhas', 'Acompanhamento dos 5 passos');
  y = 155;

  const padrinhos = db.getAll('padrinhos');
  if (padrinhos.length === 0) {
    doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica').text('Nenhum padrinho atribuido ainda.', 55, y);
  } else {
    y = tableHeader(doc, [
      { label: 'Materia-prima', x: 54, w: 120 },
      { label: 'Padrinho', x: 176, w: 100 },
      { label: '1o Contato', x: 278, w: 45, align: 'center' },
      { label: 'Convite', x: 323, w: 40, align: 'center' },
      { label: 'Confirm.', x: 363, w: 45, align: 'center' },
      { label: 'Reuniao', x: 408, w: 40, align: 'center' },
      { label: 'Acomp.', x: 448, w: 40, align: 'center' },
      { label: 'Status', x: 490, w: 70 },
    ], y);
    for (const pad of padrinhos) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      zebraRow(doc, y, 16);
      const mp = participants.find(p => p.id === pad.participant_id);
      doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(mp ? mp.name : '-', 54, y + 3, { width: 120 });
      doc.text(pad.name || '-', 176, y + 3, { width: 100 });
      const steps = ['step1_contact', 'step2_invite', 'step3_confirm', 'step4_meeting', 'step5_follow'];
      steps.forEach((s, i) => {
        const x = 278 + i * 45;
        if (pad[s]) { doc.fillColor(COLORS.green).circle(x + 22, y + 7, 3).fill(); }
        else { doc.strokeColor(COLORS.gray).lineWidth(0.5).circle(x + 22, y + 7, 3).stroke(); }
      });
      const stColors = { completo: COLORS.green, em_andamento: COLORS.orange, atribuido: COLORS.gray };
      doc.fillColor(stColors[pad.status] || COLORS.gray).roundedRect(490, y + 1, 65, 12, 3).fill();
      doc.fillColor('#fff').fontSize(6).font('Helvetica-Bold').text(pad.status || '-', 490, y + 3, { width: 65, align: 'center' });
      y += 16;
    }
  }

  // ============ AVISOS IMPORTANTES ============
  doc.addPage();
  reportHeader(doc, 'Avisos e Comunicados', 'Mural - Comunicados do Coordenador');
  y = 155;

  const avisos = db.getAll('avisos').sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const priorityLabels = { alta: 'ALTA', media: 'Media', baixa: 'Baixa' };
  const targetLabels = { todos: 'Todos', equipes: 'Equipes', materias_primas: 'Materias-primas', coordenacao: 'Coordenacao' };

  if (avisos.length === 0) {
    doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica').text('Nenhum aviso publicado.', 55, y);
  } else {
    for (const a of avisos) {
      if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
      const pColors = { alta: COLORS.red, media: COLORS.orange, baixa: COLORS.secondary };
      const contentLines = Math.ceil(doc.widthOfString(a.content || '', { width: 480 }) / 480);
      const rowH = 18 + contentLines * 13 + 8 + 18 + 12;
      zebraRow(doc, y, rowH);
      doc.fillColor(pColors[a.priority] || COLORS.gray).rect(50, y, 4, rowH - 10).fill();
      doc.fillColor(COLORS.dark).fontSize(13).font('Helvetica-Bold').text(`${a.pinned ? '- ' : ''}${a.title}`, 60, y + 2);
      y += 18;
      doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica').text(a.content || '', 60, y, { width: 480 });
      y += contentLines * 13 + 8;
      doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica').text(`Publico: ${targetLabels[a.target] || a.target}  |  Prioridade: ${priorityLabels[a.priority] || a.priority}  |  ${a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : ''}`, 60, y, { width: 480 });
      y += 18;
      y = infoDivider(doc, y);
      y += 6;
    }
  }

  // ============ CHECKLIST DE TAREFAS PENDENTES ============
  doc.addPage();
  reportHeader(doc, 'Tarefas do Encontro', 'Checklist - Execucao durante o Encontro');
  y = 155;

  const tasks = db.getAll('tasks').filter(t => t.phase === 'during');
  const pending = tasks.filter(t => t.status !== 'concluido');
  const inProgress = pending.filter(t => t.status === 'em_andamento');
  const notStarted = pending.filter(t => t.status === 'pendente');

  summaryCard(doc, 'Pendentes', pending.length, 50, y, 120, 50, COLORS.red);
  summaryCard(doc, 'Em Andamento', inProgress.length, 180, y, 120, 50, COLORS.orange);
  summaryCard(doc, 'Nao Iniciadas', notStarted.length, 310, y, 120, 50, COLORS.gray);
  summaryCard(doc, 'Concluidas', tasks.length - pending.length, 440, y, 120, 50, COLORS.green);
  y += 70;

  if (inProgress.length > 0) {
    y = sectionTitle(doc, 'Em Andamento', y, COLORS.orange);
    for (const t of inProgress) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      const titleH = calcTextHeight(doc, `[${t.item_number}] ${t.title}`, 380, 9);
      const metaH = calcTextHeight(doc, `Equipe: ${t.responsible_team || '-'}  |  Prazo: ${t.deadline || '-'}`, 380, 8);
      const rowH = Math.max(24, titleH + metaH + 4);
      zebraRow(doc, y, rowH);
      doc.fillColor(COLORS.orange).circle(55, y + 5, 3).fill();
      doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica-Bold').text(`[${t.item_number}]`, 65, y + 1, { continued: true, width: 30 });
      doc.font('Helvetica').text(` ${t.title}`, { width: 380 });
      doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica').text(`Equipe: ${t.responsible_team || '-'}  |  Prazo: ${t.deadline || '-'}`, 65, y + titleH + 2, { width: 380 });
      y += rowH;
    }
    y += 10;
  }

  if (notStarted.length > 0) {
    if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
    y = sectionTitle(doc, 'Nao Iniciadas', y, COLORS.gray);
    for (const t of notStarted) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      const titleH = calcTextHeight(doc, `[${t.item_number}] ${t.title}`, 400, 9);
      const metaH = calcTextHeight(doc, `Equipe: ${t.responsible_team || '-'}  |  Prazo: ${t.deadline || '-'}`, 400, 8);
      const rowH = Math.max(22, titleH + metaH + 4);
      zebraRow(doc, y, rowH);
      doc.strokeColor(COLORS.gray).lineWidth(0.5).circle(55, y + 5, 3).stroke();
      doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(`[${t.item_number}] ${t.title}`, 65, y + 1, { width: 400 });
      doc.fillColor(COLORS.gray).fontSize(8).text(`Equipe: ${t.responsible_team || '-'}  |  Prazo: ${t.deadline || '-'}`, 65, y + titleH + 2, { width: 400 });
      y += rowH;
    }
  }

  if (pending.length === 0) {
    doc.fillColor(COLORS.green).fontSize(13).font('Helvetica-Bold').text('Todas as tarefas estao concluidas!', 55, y);
  }

  // ============ FORNECEDORES DE EMERGENCIA ============
  doc.addPage();
  reportHeader(doc, 'Contatos de Fornecedores', 'Agenda rapida - Para emergencias e consultas');
  y = 155;

  const allFornecedores = db.getAll('fornecedores');
  const fornecedores = allFornecedores.filter(f => (f.type || 'fornecedor') === 'fornecedor');
  const cats = [...new Set(fornecedores.map(f => f.category).filter(Boolean))].sort();

  for (const cat of cats) {
    if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
    y = sectionTitle(doc, cat, y, COLORS.primary);
    const catItems = fornecedores.filter(f => f.category === cat);
    for (const f of catItems) {
      if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
      const contacts = [];
      if (f.contact_person) contacts.push(f.contact_person);
      if (f.phone) contacts.push(f.phone);
      if (f.whatsapp) contacts.push(`WhatsApp: ${f.whatsapp}`);
      const contactsStr = contacts.length ? `  ${contacts.join(' | ')}` : '';
      const contactsH = contacts.length ? calcTextHeight(doc, contactsStr, 450, 9) : 0;
      const servH = f.service ? calcTextHeight(doc, `  Servico: ${f.service}`, 450, 8) : 0;
      const rowH = Math.max(40, 14 + contactsH + servH + 8);
      zebraRow(doc, y, rowH);
      const stColors = { contratado: COLORS.green, pendente: COLORS.orange, contatado: COLORS.secondary, cancelado: COLORS.red };
      doc.fillColor(stColors[f.status] || COLORS.gray).circle(55, y + 5, 3).fill();
      doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(f.name || '-', 65, y + 1);
      let cy = y + 14;
      if (contacts.length) { doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(contactsStr, 65, cy, { width: 450 }); cy += contactsH; }
      if (f.service) { doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica').text(`  Servico: ${f.service}`, 65, cy, { width: 450 }); }
      y += rowH;
    }
    y += 6;
  }

  // ============ ANOTACOES ============
  doc.addPage();
  reportHeader(doc, 'Anotacoes', 'Espaco para anotacoes do coordenador durante o Encontro');
  y = 155;

  doc.fillColor(COLORS.gray).fontSize(10).font('Helvetica-Oblique').text('Use este espaco para anotar observacoes, imprevistos, ideias e lembretes durante os dias do Encontro.', 50, y, { width: CONTENT_WIDTH });
  y += 26;

  for (let i = 0; i < 20; i++) {
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    doc.strokeColor(COLORS.divider).lineWidth(0.5).moveTo(50, y).lineTo(560, y).stroke();
    y += 26;
  }

  // Sexta notes
  y += 10;
  if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
  y = sectionTitle(doc, 'Sexta-feira', y, COLORS.primary);
  for (let i = 0; i < 6; i++) {
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    doc.strokeColor(COLORS.divider).lineWidth(0.5).moveTo(50, y).lineTo(560, y).stroke();
    y += 22;
  }

  // Sabado notes
  y += 10;
  if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
  y = sectionTitle(doc, 'Sabado', y, COLORS.primary);
  for (let i = 0; i < 6; i++) {
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    doc.strokeColor(COLORS.divider).lineWidth(0.5).moveTo(50, y).lineTo(560, y).stroke();
    y += 22;
  }

  // Domingo notes
  y += 10;
  if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
  y = sectionTitle(doc, 'Domingo', y, COLORS.primary);
  for (let i = 0; i < 6; i++) {
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    doc.strokeColor(COLORS.divider).lineWidth(0.5).moveTo(50, y).lineTo(560, y).stroke();
    y += 22;
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generatePreparationReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  const encArr = db.getAll('encounters');
  const enc = encArr.length > 0 ? encArr[encArr.length - 1] : null;
  const encName = enc ? enc.name : 'Encontro Compromisso Trin';
  const encStart = enc ? enc.start_date : '';
  const encEnd = enc ? enc.end_date : '';
  const encLocation = enc ? enc.location : '';
  const encTheme = enc ? enc.theme : '';
  const encThemeSong = enc ? enc.theme_song : '';

  const today = new Date();
  const todayStr = today.toLocaleDateString('pt-BR');
  let daysToEnc = '';
  if (encStart) {
    const encDate = new Date(encStart + 'T00:00:00');
    const diff = Math.ceil((encDate - today) / 86400000);
    daysToEnc = diff > 0 ? `${diff} dias restantes` : diff === 0 ? 'E hoje!' : `${Math.abs(diff)} dias atrassado`;
  }

  // === CAPA ===
  doc.fillColor(COLORS.primary).rect(0, 0, doc.page.width, doc.page.height).fill();
  doc.fillColor('#fff').fontSize(28).font('Helvetica-Bold').text('Relatorio de Preparacao', 50, 200, { align: 'center', width: 495 });
  doc.fontSize(18).font('Helvetica').text(encName, 50, 250, { align: 'center', width: 495 });
  doc.fontSize(12).text(encLocation || 'Trindade - GO', 50, 280, { align: 'center', width: 495 });
  if (encStart) {
    const fmtDate = (d) => { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('pt-BR'); };
    doc.text(`${fmtDate(encStart)} a ${fmtDate(encEnd)}`, 50, 300, { align: 'center', width: 495 });
  }
  if (encTheme) doc.fontSize(11).font('Helvetica-Oblique').text(`Tema: ${encTheme}`, 50, 330, { align: 'center', width: 495 });
  if (encThemeSong) doc.text(`Canto: ${encThemeSong}`, 50, 348, { align: 'center', width: 495 });
  doc.fontSize(10).font('Helvetica').text(`Gerado em ${todayStr}`, 50, 400, { align: 'center', width: 495 });
  if (daysToEnc) doc.fontSize(14).font('Helvetica-Bold').text(daysToEnc, 50, 430, { align: 'center', width: 495 });
  doc.fontSize(9).font('Helvetica').text('JUMIRE - Projeto Compromisso Trin', 50, 500, { align: 'center', width: 495 });
  doc.text('Manual dos Mestres de Obras', 50, 515, { align: 'center', width: 495 });

  // === SUMARIO EXECUTIVO ===
  doc.addPage();
  reportHeader(doc, 'Sumario Executivo da Preparacao', `Gerado em ${todayStr} | ${daysToEnc}`);

  const tasks = db.getAll('tasks').filter(t => (t.phase || 'pre') === 'pre').sort((a, b) => {
    const catCmp = (a.category || '').localeCompare(b.category || '');
    if (catCmp !== 0) return catCmp;
    return parseFloat(a.item_number) - parseFloat(b.item_number);
  });
  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'concluido').length,
    inProgress: tasks.filter(t => t.status === 'em_andamento').length,
    pending: tasks.filter(t => t.status === 'pendente').length,
  };
  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const allFin = db.getAll('finance');
  const finIncome = allFin.filter(f => f.type === 'receita').reduce((s, f) => s + (f.amount || 0), 0);
  const finExpenses = allFin.filter(f => f.type === 'despesa').reduce((s, f) => s + (f.amount || 0), 0);
  const finBalance = finIncome - finExpenses;

  const allParticipants = db.getAll('participants');
  const participants = { c: allParticipants.length, paid: allParticipants.filter(p => p.paid).length };
  const teams = { c: db.getAll('teams').length };
  const fornecedores = { c: db.getAll('fornecedores').length };
  const escolinhas = { c: db.getAll('escolinhas').length };
  const avisos = { c: db.getAll('avisos').length };
  const lembretes = { c: db.getAll('lembretes').filter(l => l.status !== 'concluido').length };

  let y = 155;
  // Cards de progresso
  const cards = [
    { label: 'Tarefas', value: stats.total, color: COLORS.secondary },
    { label: 'Concluidas', value: stats.done, color: COLORS.green },
    { label: 'Em Andamento', value: stats.inProgress, color: COLORS.orange },
    { label: 'Pendentes', value: stats.pending, color: COLORS.red },
  ];
  const cardW = 120;
  cards.forEach((c, i) => {
    const x = 50 + i * (cardW + 10);
    summaryCard(doc, c.label, c.value, x, y, cardW, 50, c.color);
  });

  y += 70;
  doc.fillColor(COLORS.dark).fontSize(12).font('Helvetica-Bold').text(`Progresso Geral: ${pct}%`, 50, y);
  y += 20;
  progressBar(doc, pct, 50, y, CONTENT_WIDTH);
  y += 30;

  // Tabela resumo
  const rows = [
    ['Receitas', `R$ ${finIncome.toFixed(2)}`, COLORS.green],
    ['Despesas', `R$ ${finExpenses.toFixed(2)}`, COLORS.red],
    ['Saldo Atual', `R$ ${finBalance.toFixed(2)}`, finBalance >= 0 ? COLORS.green : COLORS.red],
    ['Matérias-primas Inscritas', `${participants.c || 0}`, COLORS.secondary],
    ['MPs com Pagamento', `${participants.paid || 0} / ${participants.c || 0}`, COLORS.secondary],
    ['Equipes Cadastradas', `${teams.c || 0}`, COLORS.secondary],
    ['Fornecedores', `${fornecedores.c || 0}`, COLORS.secondary],
    ['Escolinhas/Encontros Prep.', `${escolinhas.c || 0}`, COLORS.secondary],
    ['Avisos Ativos', `${avisos.c || 0}`, COLORS.secondary],
    ['Lembretes Pendentes', `${lembretes.c || 0}`, COLORS.secondary],
  ];
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.secondary).text('Indicadores Gerais', 50, y);
  y += 20;
  for (const [label, value, color] of rows) {
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    zebraRow(doc, y, 18);
    doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(label, 58, y + 4, { width: 300 });
    doc.fillColor(color).font('Helvetica-Bold').text(value, 380, y + 4, { width: 170, align: 'right' });
    y += 18;
  }
  y += 15;

  // Tarefas atrasadas (deadline ja passou baseado na data do encontro)
  if (encStart) {
    const encDate = new Date(encStart + 'T00:00:00');
    const overdueTasks = tasks.filter(t => t.status !== 'concluido' && t.deadline);
    const overdueParsed = [];
    for (const t of overdueTasks) {
      const m = t.deadline.match(/(-?\d+)\s*mes/i);
      const d = t.deadline.match(/(-?\d+)\s*dia/i);
      const w = t.deadline.match(/(-?\d+)\s*sem/i);
      let offsetMonths = 0, offsetDays = 0;
      if (m) offsetMonths = parseInt(m[1]);
      else if (d) offsetDays = parseInt(d[1]);
      else if (w) offsetDays = parseInt(w[1]) * 7;
      else continue;
      const due = new Date(encDate);
      due.setMonth(due.getMonth() + offsetMonths);
      due.setDate(due.getDate() + offsetDays);
      if (due < today) {
        const diffDays = Math.ceil((today - due) / 86400000);
        overdueParsed.push({ ...t, due_date: due.toISOString().slice(0, 10), diff_days: diffDays });
      }
    }
    overdueParsed.sort((a, b) => a.diff_days - b.diff_days);
    if (overdueParsed.length > 0) {
      if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
      doc.fillColor(COLORS.red).fontSize(13).font('Helvetica-Bold').text(`Tarefas Atrasadas: ${overdueParsed.length}`, 50, y);
      y += 22;
      for (const t of overdueParsed.slice(0, 20)) {
        if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
        const titleH = calcTextHeight(doc, t.title, 340, 10);
        const catH = calcTextHeight(doc, `${t.category}`, 340, 8);
        const teamH = calcTextHeight(doc, `Equipe: ${t.responsible_team || 'N/A'}`, 130, 8);
        const rowH = Math.max(28, titleH + catH + 4);
        zebraRow(doc, y, rowH);
        doc.fillColor(COLORS.red).circle(55, y + 5, 3).fill();
        doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(t.title, 65, y + 1, { width: 340 });
        doc.fillColor(COLORS.gray).font('Helvetica').fontSize(8).text(`${t.category}`, 65, y + titleH + 2, { width: 340 });
        doc.fillColor(COLORS.red).font('Helvetica-Bold').fontSize(9).text(`${t.diff_days}d atrasado`, 420, y + 1, { width: 130, align: 'right' });
        doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica').text(`Equipe: ${t.responsible_team || 'N/A'}`, 420, y + titleH + 2, { width: 130, align: 'right' });
        y += rowH;
      }
      if (overdueParsed.length > 20) {
        doc.fillColor(COLORS.gray).fontSize(9).text(`... e mais ${overdueParsed.length - 20} tarefas atrasadas`, 50, y);
        y += 15;
      }
    }
  }

  // === PROGRESSO POR CATEGORIA ===
  if (y > 50) { doc.addPage(); }
  reportHeader(doc, 'Progresso por Categoria', 'Status detalhado de cada area de preparacao');
  y = 155;

  const categories = [...new Set(tasks.map(t => t.category))].sort();
  for (const cat of categories) {
    if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
    const catItems = tasks.filter(t => t.category === cat);
    const catDone = catItems.filter(t => t.status === 'concluido').length;
    const catPct = catItems.length > 0 ? Math.round((catDone / catItems.length) * 100) : 0;
    const catColor = catPct === 100 ? COLORS.green : catPct >= 50 ? COLORS.orange : COLORS.red;

    y = sectionTitle(doc, cat, y, catColor);
    doc.fillColor(catColor).fontSize(10).text(`${catDone}/${catItems.length} (${catPct}%)`, 500, y - 14, { width: 60, align: 'right' });
    progressBar(doc, catPct, 50, y - 4, CONTENT_WIDTH);
    y += 12;

    for (const t of catItems) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      const titleH = calcTextHeight(doc, `[${t.item_number}] ${t.title}`, 350, 9);
      const metaH = calcTextHeight(doc, `${t.responsible_team || ''}  |  ${t.deadline || ''}`, 350, 8);
      const rowH = Math.max(24, titleH + metaH + 4);
      zebraRow(doc, y, rowH);
      const sColor = t.status === 'concluido' ? COLORS.green : t.status === 'em_andamento' ? COLORS.orange : COLORS.gray;
      doc.fillColor(sColor).circle(55, y + 5, 3).fill();
      doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(`[${t.item_number}] ${t.title}`, 65, y + 1, { width: 350 });
      doc.fillColor(COLORS.gray).fontSize(8).text(`${t.responsible_team || ''}  |  ${t.deadline || ''}`, 65, y + titleH + 2, { width: 350 });
      statusBadge(doc, t.status, 470, y + 2);
      y += rowH;
    }
    y += 10;
  }

  // === EQUIPES E MEMBROS ===
  if (y > 50) { doc.addPage(); }
  reportHeader(doc, 'Equipes e Membros', 'Composicao completa das equipes de trabalho');
  y = 155;

  const allTeams = db.getAll('teams').sort((a, b) => a.name.localeCompare(b.name)).map(t => {
    const teamMembers = db.getAll('team_members').filter(m => Number(m.team_id) === Number(t.id));
    return { ...t, member_count: teamMembers.length };
  });
  for (const team of allTeams) {
    if (y > PAGE_BOTTOM - 80) { doc.addPage(); y = 50; }
    y = sectionTitle(doc, team.name, y, COLORS.primary);
    doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(`${team.member_count} membro(s)`, 500, y - 14, { width: 60, align: 'right' });
    if (team.description) {
      doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(team.description, 50, y, { width: CONTENT_WIDTH });
      y += 14;
    }
    const members = db.getAll('team_members').filter(m => Number(m.team_id) === Number(team.id)).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (members.length > 0) {
      const colW = 250;
      members.forEach((m, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const mx = 55 + col * colW;
        const my = y + row * 13;
        if (my > PAGE_BOTTOM) { doc.addPage(); y = 50; }
        doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(`- ${m.name}${m.role ? ' (' + m.role + ')' : ''}${m.phone ? '  ' + m.phone : ''}`, mx, my, { width: colW - 5 });
      });
      y += Math.ceil(members.length / 2) * 13 + 10;
    } else {
      doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica-Oblique').text('Nenhum membro cadastrado', 55, y);
      y += 14;
    }
    const teamTasks = tasks.filter(t => t.responsible_team === team.name);
    if (teamTasks.length > 0) {
      const tDone = teamTasks.filter(t => t.status === 'concluido').length;
      doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(`Tarefas: ${tDone}/${teamTasks.length} concluidas`, 55, y);
      y += 14;
    }
    y += 10;
  }

  // === FINANCEIRO DETALHADO ===
  if (y > 50) { doc.addPage(); }
  reportHeader(doc, 'Situacao Financeira', 'Receitas, despesas e saldo por categoria');
  y = 155;

  const finCards = [
    { label: 'Receitas', value: `R$ ${finIncome.toFixed(2)}`, color: COLORS.green },
    { label: 'Despesas', value: `R$ ${finExpenses.toFixed(2)}`, color: COLORS.red },
    { label: 'Saldo', value: `R$ ${finBalance.toFixed(2)}`, color: finBalance >= 0 ? COLORS.green : COLORS.red },
  ];
  finCards.forEach((c, i) => {
    const x = 50 + i * 175;
    summaryCard(doc, c.label, c.value, x, y, 160, 50, c.color);
  });
  y += 70;

  // Por categoria
  const finByCat = [];
  const finItems = db.getAll('finance');
  const finCatMap = {};
  for (const f of finItems) {
    const key = `${f.category}|${f.type}`;
    if (!finCatMap[key]) finCatMap[key] = { category: f.category, type: f.type, total: 0 };
    finCatMap[key].total += (f.amount || 0);
  }
  Object.values(finCatMap).sort((a, b) => {
    const c = (a.category || '').localeCompare(b.category || '');
    return c !== 0 ? c : (a.type || '').localeCompare(b.type || '');
  }).forEach(v => finByCat.push(v));
  const finCats = {};
  for (const f of finByCat) {
    if (!finCats[f.category]) finCats[f.category] = { receita: 0, despesa: 0 };
    finCats[f.category][f.type] = f.total;
  }
  y = sectionTitle(doc, 'Resumo por Categoria', y, COLORS.secondary);
  y = tableHeader(doc, [
    { label: 'Categoria', x: 54, w: 200 },
    { label: 'Receitas', x: 280, w: 100, align: 'right' },
    { label: 'Despesas', x: 390, w: 100, align: 'right' },
    { label: 'Saldo', x: 500, w: 60, align: 'right' },
  ], y);
  for (const [cat, vals] of Object.entries(finCats).sort((a, b) => b[1].receita - b[1].despesa - (a[1].receita - a[1].despesa))) {
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    zebraRow(doc, y, 16);
    const saldo = vals.receita - vals.despesa;
    doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(cat, 54, y + 3, { width: 200 });
    doc.fillColor(COLORS.green).text(`R$ ${vals.receita.toFixed(2)}`, 280, y + 3, { width: 100, align: 'right' });
    doc.fillColor(COLORS.red).text(`R$ ${vals.despesa.toFixed(2)}`, 390, y + 3, { width: 100, align: 'right' });
    doc.fillColor(saldo >= 0 ? COLORS.green : COLORS.red).font('Helvetica-Bold').text(`R$ ${saldo.toFixed(2)}`, 500, y + 3, { width: 60, align: 'right' });
    y += 16;
  }

  // === MATERIAS-PRIMAS ===
  if (y > 50) { doc.addPage(); }
  reportHeader(doc, 'Materias-Primas (Inscritos)', 'Lista completa de inscricoes e status de pagamento');
  y = 155;

  const prepParticipants = db.getAll('participants').sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const paidCount = prepParticipants.filter(p => p.paid).length;
  const pendingCount = prepParticipants.length - paidCount;
  summaryCard(doc, 'Total', prepParticipants.length, 50, y, 120, 50, COLORS.secondary);
  summaryCard(doc, 'Pagos', paidCount, 180, y, 120, 50, COLORS.green);
  summaryCard(doc, 'Pendentes', pendingCount, 310, y, 120, 50, COLORS.orange);
  y += 70;

  y = tableHeader(doc, [
    { label: 'Nome', x: 54, w: 180 },
    { label: 'Padrinho', x: 240, w: 150 },
    { label: 'Grupo', x: 400, w: 60 },
    { label: 'Pagto', x: 470, w: 80, align: 'right' },
  ], y);
  for (const p of prepParticipants) {
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    zebraRow(doc, y, 16);
    doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(p.name || 'Sem nome', 56, y + 3, { width: 180 });
    doc.fillColor(COLORS.gray).text(p.padrinho || '-', 240, y + 3, { width: 150 });
    doc.text(p.group || '-', 400, y + 3, { width: 60 });
    doc.fillColor(p.paid ? COLORS.green : COLORS.orange).font('Helvetica-Bold').text(p.paid ? 'Pago' : 'Pendente', 470, y + 3, { width: 80, align: 'right' });
    y += 16;
  }

  // === FORNECEDORES ===
  if (y > 50) { doc.addPage(); }
  reportHeader(doc, 'Fornecedores e Contatos', 'Lista completa de fornecedores e prestadores');
  y = 155;

  const allForn = db.getAll('fornecedores').sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  y = tableHeader(doc, [
    { label: 'Nome', x: 54, w: 140 },
    { label: 'Categoria', x: 198, w: 90 },
    { label: 'Contato', x: 292, w: 95 },
    { label: 'Telefone', x: 392, w: 65 },
    { label: 'Status', x: 462, w: 98 },
  ], y);
  for (const f of allForn) {
    if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
    zebraRow(doc, y, 16);
    doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(f.name || '-', 56, y + 3, { width: 140 });
    doc.fillColor(COLORS.gray).text(f.category || '-', 198, y + 3, { width: 90 });
    doc.text(f.contact_person || '-', 292, y + 3, { width: 95 });
    doc.text(f.phone || f.whatsapp || '-', 392, y + 3, { width: 65 });
    const stColor = f.status === 'confirmado' ? COLORS.green : f.status === 'em_negociacao' ? COLORS.orange : COLORS.gray;
    doc.fillColor(stColor).font('Helvetica-Bold').fontSize(8).text(f.status || '-', 462, y + 3, { width: 98 });
    y += 16;
  }

  // === ESCOLINHAS / ENCONTROS DE PREPARACAO ===
  if (y > 50) { doc.addPage(); }
  reportHeader(doc, 'Escolinhas e Encontros de Preparacao 2026', 'Cronograma de formacao antes do Encontro');
  y = 155;

  const allEsc = db.getAll('escolinhas').sort((a, b) => {
    const dCmp = (a.date || '9999').localeCompare(b.date || '9999');
    if (dCmp !== 0) return dCmp;
    return (a.time || '').localeCompare(b.time || '');
  });
  const escTotal = allEsc.length;
  const escDone = allEsc.filter(e => e.status === 'concluida' || e.status === 'concluido').length;
  const escScheduled = allEsc.filter(e => e.status === 'agendada' || e.status === 'pendente').length;
  summaryCard(doc, 'Total', escTotal, 50, y, 120, 50, COLORS.secondary);
  summaryCard(doc, 'Concluidas', escDone, 180, y, 120, 50, COLORS.green);
  summaryCard(doc, 'Agendadas', escScheduled, 310, y, 120, 50, COLORS.orange);
  summaryCard(doc, 'Tipos', new Set(allEsc.map(e => e.type)).size, 440, y, 120, 50, COLORS.primary);
  y += 70;

  if (allEsc.length === 0) {
    doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica-Oblique').text('Nenhuma escolinha cadastrada.', 55, y);
  } else {
    y = tableHeader(doc, [
      { label: 'Data', x: 54, w: 65 },
      { label: 'Hora', x: 123, w: 40 },
      { label: 'Nome', x: 168, w: 155 },
      { label: 'Local', x: 328, w: 75 },
      { label: 'Publico', x: 408, w: 70 },
      { label: 'Status', x: 483, w: 77, align: 'right' },
    ], y);
    for (const e of allEsc) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      const nameH = calcTextHeight(doc, e.name || '-', 155, 9);
      const descH = e.description ? calcTextHeight(doc, e.description, 380, 8) : 0;
      const rowH = Math.max(22, nameH + descH + 8);
      zebraRow(doc, y, rowH);
      const dt = e.date ? new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir';
      doc.fillColor(COLORS.primary).fontSize(9).font('Helvetica-Bold').text(dt, 56, y + 4, { width: 65 });
      doc.fillColor(COLORS.dark).font('Helvetica').text(e.time || '-', 123, y + 4, { width: 40 });
      doc.font('Helvetica-Bold').text(e.name || '-', 168, y + 4, { width: 155 });
      doc.font('Helvetica').fillColor(COLORS.gray).text(e.location || '-', 328, y + 4, { width: 75 });
      doc.fillColor(COLORS.secondary).fontSize(8).font('Helvetica-Oblique').text(e.target_audience || '-', 408, y + 4, { width: 70 });
      const stColor = e.status === 'concluida' || e.status === 'concluido' ? COLORS.green : e.status === 'em_andamento' ? COLORS.orange : COLORS.gray;
      doc.fillColor(stColor).font('Helvetica-Bold').fontSize(7).text(e.status || '-', 483, y + 4, { width: 77, align: 'right' });
      let cy = y + nameH + 6;
      if (e.description) {
        doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica-Oblique').text(e.description, 180, cy, { width: 380 });
      }
      y += rowH;
    }
  }

  // === AVISOS ===
  if (y > 50) { doc.addPage(); }
  reportHeader(doc, 'Mural de Avisos', 'Comunicados e informacoes importantes');
  y = 155;

  const allAvisos = db.getAll('avisos').sort((a, b) => {
    const pCmp = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
    if (pCmp !== 0) return pCmp;
    const prCmp = (b.priority || '').localeCompare(a.priority || '');
    if (prCmp !== 0) return prCmp;
    return (b.created_at || '').localeCompare(a.created_at || '');
  });
  if (allAvisos.length === 0) {
    doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica-Oblique').text('Nenhum aviso cadastrado.', 55, y);
  } else {
    for (const a of allAvisos) {
      if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
      const pColor = a.priority === 'alta' ? COLORS.red : a.priority === 'media' ? COLORS.orange : COLORS.gray;
      doc.fillColor(pColor).roundedRect(50, y, CONTENT_WIDTH, 4, 2).fill();
      y += 10;
      if (a.pinned) {
        doc.fillColor(COLORS.primary).fontSize(9).font('Helvetica-Bold').text('FIXADO', 50, y);
        y += 14;
      }
      doc.fillColor(COLORS.dark).fontSize(11).font('Helvetica-Bold').text(a.title, 50, y, { width: CONTENT_WIDTH });
      y += 16;
      if (a.content) {
        doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica').text(a.content, 50, y, { width: CONTENT_WIDTH });
        y += calcTextHeight(doc, a.content, CONTENT_WIDTH, 10) + 8;
      }
      doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica').text(`Prioridade: ${a.priority || 'baixa'}  |  Autor: ${a.author || 'N/A'}`, 50, y);
      y += 18;
      y = infoDivider(doc, y);
      y += 6;
    }
  }

  // === LEMBRETES AUTOMATICOS (PRAZOS) ===
  if (y > 50) { doc.addPage(); }
  reportHeader(doc, 'Prazos e Lembretes Automaticos', 'Baseados na data do Encontro - calculo automatico');
  y = 155;

  if (encStart) {
    const encDate = new Date(encStart + 'T00:00:00');
    const autoLembretes = [];
    for (const t of tasks) {
      if (t.status === 'concluido' || !t.deadline) continue;
      const m = t.deadline.match(/(-?\d+)\s*mes/i);
      const d = t.deadline.match(/(-?\d+)\s*dia/i);
      const w = t.deadline.match(/(-?\d+)\s*sem/i);
      let offsetMonths = 0, offsetDays = 0;
      if (m) offsetMonths = parseInt(m[1]);
      else if (d) offsetDays = parseInt(d[1]);
      else if (w) offsetDays = parseInt(w[1]) * 7;
      else continue;
      const due = new Date(encDate);
      due.setMonth(due.getMonth() + offsetMonths);
      due.setDate(due.getDate() + offsetDays);
      const diffDays = Math.ceil((due - today) / 86400000);
      let urgency = 'Em dia';
      let uColor = COLORS.gray;
      if (diffDays < 0) { urgency = 'ATRASADO'; uColor = COLORS.red; }
      else if (diffDays <= 7) { urgency = 'URGENTE'; uColor = COLORS.orange; }
      else if (diffDays <= 30) { urgency = 'ATENCAO'; uColor = COLORS.secondary; }
      autoLembretes.push({ title: t.title, category: t.category, team: t.responsible_team, due_date: due.toISOString().slice(0, 10), diff_days: diffDays, urgency, uColor, priority: t.priority });
    }
    autoLembretes.sort((a, b) => a.diff_days - b.diff_days);

    if (autoLembretes.length === 0) {
      doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica-Oblique').text('Nenhum prazo pendente. Todas as tarefas com prazo estao concluidas.', 55, y);
    } else {
      y = tableHeader(doc, [
        { label: 'Prazo', x: 54, w: 70 },
        { label: 'Urgencia', x: 130, w: 70 },
        { label: 'Tarefa', x: 210, w: 200 },
        { label: 'Equipe', x: 420, w: 80 },
        { label: 'Dias', x: 510, w: 50, align: 'right' },
      ], y);
      for (const l of autoLembretes) {
        if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
        zebraRow(doc, y, 16);
        const dt = new Date(l.due_date + 'T00:00:00').toLocaleDateString('pt-BR');
        doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(dt, 56, y + 3, { width: 70 });
        doc.fillColor(l.uColor).font('Helvetica-Bold').text(l.urgency, 130, y + 3, { width: 70 });
        doc.fillColor(COLORS.dark).font('Helvetica').text(l.title, 210, y + 3, { width: 200 });
        doc.fillColor(COLORS.gray).text(l.team || '-', 420, y + 3, { width: 80 });
        doc.fillColor(l.diff_days < 0 ? COLORS.red : COLORS.dark).font('Helvetica-Bold').text(String(l.diff_days), 510, y + 3, { width: 50, align: 'right' });
        y += 16;
      }
    }
  } else {
    doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica-Oblique').text('Defina a data do Encontro para gerar prazos automaticos.', 55, y);
  }

  // === CHECKLIST FINAL ===
  if (y > 50) { doc.addPage(); }
  reportHeader(doc, 'Checklist Final de Preparacao', 'Itens criticos a verificar antes do Encontro');
  y = 155;

  const checklistItems = [
    { area: 'Espaco Fisico', items: ['Canteiro de Obras reservado e confirmado', 'Aluguel pago (ou combinado)', 'Capela montada e equipada', 'Sala de reuniao para coordenacao'] },
    { area: 'Equipes', items: ['Todos os coordenadores de equipe confirmados', 'Telefones de contato atualizados', 'Reuniao geral de coordenacao realizada', 'Cronograma distribuido para todas as equipes'] },
    { area: 'Materias-Primas', items: ['Inscricoes fechadas', 'Pagamentos de taxa confirmados', 'Grupos e quartos definidos', 'Padrinhos atribuidos e contatados', 'Kits montados (sacochila, squeeze, cracha)'] },
    { area: 'Alimentacao', items: ['Cardapio definido por refeicao', 'Compras realizadas ou agendadas', 'Equipe de cozinha confirmada', 'Restricoes alimentares mapeadas'] },
    { area: 'Logistica', items: ['Transporte (onibus) reservado', 'Motorista confirmado', 'Rota definida', 'Horario de saida comunicado'] },
    { area: 'Materiais e Impressos', items: ['Crachas impressos', 'Cartilhas impressas', 'Lembrancinhas confeccionadas', 'Materiais de capela (sacrario, ostensorio, velas)'] },
    { area: 'Som e Tecnica', items: ['Equipamento de som testado', 'Operador confirmado', 'Playlist / musicas preparadas', 'Microfones testados'] },
    { area: 'Financeiro', items: ['Saldo verificado', 'Recursos para o Encontro separados', 'Despesas pendentes pagas', 'Caixa para o Encontro preparado'] },
    { area: 'Espiritualizacao', items: ['Alicerces e alvenarias definidos', 'Mestres de Obras orientados', 'Material de oracao preparado', 'Canto do encontro ensaiado'] },
    { area: 'Documentacao', items: ['Fichas de inscricao arquivadas', 'Autorizacoes dos pais coletadas', 'Lista de emergencia atualizada', 'Seguro ou responsabilidade civil verificada'] },
  ];

  for (const section of checklistItems) {
    if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
    y = sectionTitle(doc, section.area, y, COLORS.primary);
    for (const item of section.items) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      zebraRow(doc, y, 18);
      doc.strokeColor(COLORS.gray).lineWidth(0.5).roundedRect(55, y + 2, 10, 10, 2).stroke();
      doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica').text(item, 72, y + 3, { width: 480 });
      y += 18;
    }
    y += 8;
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generateLembretesReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  const enc = getEncounter();
  const encStart = enc.start_date;
  const encInfo = enc.name ? `${enc.name} - ${fmtDate(enc.start_date)} a ${fmtDate(enc.end_date)}` : '';
  reportHeader(doc, 'Relatorio de Lembretes', `Gerado em ${new Date().toLocaleString('pt-BR')}${encInfo ? ' | ' + encInfo : ''}`);

  let y = 155;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const manualLembretes = db.getAll('lembretes').sort((a, b) => {
    const sCmp = (a.status === 'concluido' ? 1 : 0) - (b.status === 'concluido' ? 1 : 0);
    if (sCmp !== 0) return sCmp;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });

  let autoLembretes = [];
  if (encStart) {
    const encDate = new Date(encStart + 'T00:00:00');
    const tasks = db.getAll('tasks');
    for (const t of tasks) {
      if (t.status === 'concluido' || !t.deadline) continue;
      const m = t.deadline.match(/(-?\d+)\s*mes/i);
      const d = t.deadline.match(/(-?\d+)\s*dia/i);
      const w = t.deadline.match(/(-?\d+)\s*sem/i);
      let offsetMonths = 0, offsetDays = 0;
      if (m) offsetMonths = parseInt(m[1]);
      else if (d) offsetDays = parseInt(d[1]);
      else if (w) offsetDays = parseInt(w[1]) * 7;
      else continue;
      const due = new Date(encDate);
      due.setMonth(due.getMonth() + offsetMonths);
      due.setDate(due.getDate() + offsetDays);
      const diffDays = Math.ceil((due - today) / 86400000);
      autoLembretes.push({
        title: t.title, category: t.category, team: t.responsible_team,
        due_date: due.toISOString().slice(0, 10), diff_days: diffDays,
        priority: t.priority, item_number: t.item_number, deadline: t.deadline
      });
    }
    autoLembretes.sort((a, b) => a.diff_days - b.diff_days);
  }

  const overdue = autoLembretes.filter(l => l.diff_days < 0);
  const urgent = autoLembretes.filter(l => l.diff_days >= 0 && l.diff_days <= 7);
  const warning = autoLembretes.filter(l => l.diff_days > 7 && l.diff_days <= 30);
  const info = autoLembretes.filter(l => l.diff_days > 30);
  const manualPending = manualLembretes.filter(l => l.status !== 'concluido');
  const manualDone = manualLembretes.filter(l => l.status === 'concluido');

  summaryCard(doc, 'Atrasados', overdue.length, 50, y, 100, 55, COLORS.red);
  summaryCard(doc, 'Urgentes', urgent.length, 160, y, 100, 55, COLORS.orange);
  summaryCard(doc, 'Atencao', warning.length, 270, y, 100, 55, COLORS.secondary);
  summaryCard(doc, 'Em Dia', info.length, 380, y, 100, 55, COLORS.green);
  y += 70;

  summaryCard(doc, 'Auto Total', autoLembretes.length, 50, y, 100, 45, COLORS.secondary);
  summaryCard(doc, 'Manuais Pend', manualPending.length, 160, y, 100, 45, COLORS.orange);
  summaryCard(doc, 'Manuais Concl', manualDone.length, 270, y, 100, 45, COLORS.green);
  summaryCard(doc, 'Total Geral', autoLembretes.length + manualLembretes.length, 380, y, 100, 45, COLORS.primary);
  y += 65;

  // === PROGRESSO POR MODULO/CATEGORIA ===
  const lemCats = {};
  manualLembretes.forEach(l => {
    const c = l.category || 'Geral MOs';
    if (!lemCats[c]) lemCats[c] = { total: 0, done: 0 };
    lemCats[c].total++;
    if (l.status === 'concluido') lemCats[c].done++;
  });
  const lemCatEntries = Object.entries(lemCats).sort((a, b) => b[1].total - a[1].total);
  if (lemCatEntries.length > 0) {
    if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
    y = sectionTitle(doc, 'Progresso por Modulo', y, COLORS.secondary);
    for (const [cat, vals] of lemCatEntries) {
      if (y > PAGE_BOTTOM - 30) { doc.addPage(); y = 50; }
      const catPct = vals.total > 0 ? Math.round((vals.done / vals.total) * 100) : 0;
      const catColor = catPct === 100 ? COLORS.green : catPct >= 50 ? COLORS.orange : COLORS.red;
      doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(cat, 55, y, { width: 300 });
      doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(`${vals.done}/${vals.total} (${catPct}%)`, 400, y, { width: 80, align: 'right' });
      y += 14;
      progressBar(doc, catPct, 55, y, 450);
      y += 18;
    }
    y += 10;
  }

  if (!encStart) {
    if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
    doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica-Oblique').text('Defina a data do Encontro para gerar lembretes automaticos baseados nos prazos do manual.', 50, y, { width: CONTENT_WIDTH });
    y += 30;
  }

  if (autoLembretes.length > 0 || !encStart) {
    y = infoDivider(doc, y);
    y += 6;
  }

  // === LEMBRETES AUTOMATICOS ===
  if (autoLembretes.length > 0 || !encStart) {
    y = sectionTitle(doc, 'Lembretes Automaticos (Prazos do Manual)', y, COLORS.primary);
    if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }
  }

  if (autoLembretes.length === 0) {
    doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica-Oblique').text(encStart ? 'Nenhum prazo pendente. Todas as tarefas com prazo estao concluidas.' : 'Nenhum lembrete automatico disponivel.', 55, y, { width: CONTENT_WIDTH });
    y += 25;
  } else {
    y = tableHeader(doc, [
      { label: 'Prazo', x: 54, w: 70 },
      { label: 'Urgencia', x: 130, w: 70 },
      { label: 'Tarefa', x: 210, w: 200 },
      { label: 'Equipe', x: 420, w: 80 },
      { label: 'Dias', x: 510, w: 50, align: 'right' },
    ], y);

    for (const l of autoLembretes) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      const titleH = calcTextHeight(doc, `[${l.item_number}] ${l.title}`, 200, 9);
      const teamH = calcTextHeight(doc, l.team || '-', 80, 9);
      const rowH = Math.max(18, Math.max(titleH, teamH) + 8);
      zebraRow(doc, y, rowH);
      const dt = fmtDate(l.due_date);
      let urgency = 'Em dia', uColor = COLORS.green;
      if (l.diff_days < 0) { urgency = 'ATRASADO'; uColor = COLORS.red; }
      else if (l.diff_days <= 7) { urgency = 'URGENTE'; uColor = COLORS.orange; }
      else if (l.diff_days <= 30) { urgency = 'ATENCAO'; uColor = COLORS.secondary; }
      doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(dt, 56, y + 4, { width: 70 });
      doc.fillColor(uColor).font('Helvetica-Bold').text(urgency, 130, y + 4, { width: 70 });
      doc.fillColor(COLORS.dark).font('Helvetica').text(`[${l.item_number}] ${l.title}`, 210, y + 4, { width: 200 });
      doc.fillColor(COLORS.gray).font('Helvetica').text(l.team || '-', 420, y + 4, { width: 80 });
      doc.fillColor(l.diff_days < 0 ? COLORS.red : COLORS.dark).font('Helvetica-Bold').text(String(l.diff_days), 510, y + 4, { width: 50, align: 'right' });
      y += rowH;
    }
    y += 12;
  }

  // === LEMBRETES MANUAIS (AGRUPADOS POR MODULO) ===
  if (manualLembretes.length > 0 && y > PAGE_BOTTOM - 50) { doc.addPage(); y = 50; }
  y = sectionTitle(doc, 'Lembretes Manuais por Modulo', y, COLORS.secondary);
  if (manualLembretes.length > 0 && y > PAGE_BOTTOM - 40) { doc.addPage(); y = 50; }

  if (manualLembretes.length === 0) {
    doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica-Oblique').text('Nenhum lembrete manual cadastrado.', 55, y, { width: CONTENT_WIDTH });
    y += 25;
  } else {
    const manualByCat = {};
    manualLembretes.forEach(l => {
      const c = l.category || 'Geral MOs';
      if (!manualByCat[c]) manualByCat[c] = [];
      manualByCat[c].push(l);
    });
    for (const [cat, catItems] of Object.entries(manualByCat).sort((a, b) => a[0].localeCompare(b[0]))) {
      if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
      const cDone = catItems.filter(l => l.status === 'concluido').length;
      const cPct = catItems.length > 0 ? Math.round((cDone / catItems.length) * 100) : 0;
      doc.fillColor(COLORS.primary).fontSize(11).font('Helvetica-Bold').text(`${cat} (${cDone}/${catItems.length} - ${cPct}%)`, 55, y);
      y += 16;
      progressBar(doc, cPct, 55, y, CONTENT_WIDTH);
      y += 16;

      y = tableHeader(doc, [
        { label: 'Titulo', x: 54, w: 170 },
        { label: 'Descricao', x: 228, w: 150 },
        { label: 'Prazo', x: 383, w: 65 },
        { label: 'Prioridade', x: 453, w: 55 },
        { label: 'Status', x: 513, w: 47, align: 'right' },
      ], y);

      for (const l of catItems) {
        if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
        const titleH = calcTextHeight(doc, l.title || '-', 170, 9);
        const descH = calcTextHeight(doc, l.description || '-', 150, 9);
        const rowH = Math.max(20, Math.max(titleH, descH) + 8);
        zebraRow(doc, y, rowH);
        doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica-Bold').text(l.title || '-', 56, y + 4, { width: 170 });
        doc.fillColor(COLORS.gray).font('Helvetica').text(l.description || '-', 228, y + 4, { width: 150 });
        doc.fillColor(COLORS.dark).font('Helvetica').text(l.due_date ? fmtDate(l.due_date) : '-', 383, y + 4, { width: 65 });
        const pColor = l.priority === 'alta' ? COLORS.red : l.priority === 'media' ? COLORS.orange : COLORS.gray;
        doc.fillColor(pColor).font('Helvetica-Bold').text(priorityLabel(l.priority), 453, y + 4, { width: 55 });
        const sColor = l.status === 'concluido' ? COLORS.green : l.status === 'em_andamento' ? COLORS.orange : COLORS.gray;
        doc.fillColor(sColor).font('Helvetica-Bold').text(l.status === 'concluido' ? 'OK' : l.status === 'em_andamento' ? 'Em curso' : 'Pendente', 513, y + 4, { width: 47, align: 'right' });
        y += rowH;
      }
      y += 12;
    }
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

function generateEscolinhasReport() {
  const doc = createReportDoc();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  const enc = getEncounter();
  const encInfo = enc.name ? `${enc.name} - ${fmtDate(enc.start_date)} a ${fmtDate(enc.end_date)}` : '';
  reportHeader(doc, 'Calendario de Escolinhas e Eventos 2026', `Cronograma completo de formacao${encInfo ? ' | ' + encInfo : ''}`);

  let y = 155;
  const allEsc = db.getAll('escolinhas').sort((a, b) => {
    const dCmp = (a.date || '9999').localeCompare(b.date || '9999');
    if (dCmp !== 0) return dCmp;
    return (a.time || '').localeCompare(b.time || '');
  });

  const total = allEsc.length;
  const done = allEsc.filter(e => e.status === 'concluida' || e.status === 'concluido').length;
  const scheduled = allEsc.filter(e => e.status === 'agendada' || e.status === 'pendente').length;
  const inProgress = allEsc.filter(e => e.status === 'em_andamento').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  summaryCard(doc, 'Total', total, 50, y, 120, 50, COLORS.secondary);
  summaryCard(doc, 'Concluidas', done, 180, y, 120, 50, COLORS.green);
  summaryCard(doc, 'Em Andamento', inProgress, 310, y, 120, 50, COLORS.orange);
  summaryCard(doc, 'Agendadas', scheduled, 440, y, 120, 50, COLORS.gray);
  y += 70;

  doc.fillColor(COLORS.dark).fontSize(12).font('Helvetica-Bold').text(`Progresso Geral: ${pct}%`, 50, y);
  y += 18;
  progressBar(doc, pct, 50, y, CONTENT_WIDTH);
  y += 30;

  const typeLabels = {
    formacao: 'Escolinhas de Formacao', equipes_extras: 'Equipes Extras',
    cozinha: 'Cozinha', implantacao: 'Implantacao', missa_entrega: 'Missa de Entrega',
    evento: 'Eventos Gerais'
  };

  const types = [...new Set(allEsc.map(e => e.type || 'evento'))].sort();
  for (const type of types) {
    if (y > PAGE_BOTTOM - 60) { doc.addPage(); y = 50; }
    const typeItems = allEsc.filter(e => (e.type || 'evento') === type);
    const tDone = typeItems.filter(e => e.status === 'concluida' || e.status === 'concluido').length;
    const tPct = typeItems.length > 0 ? Math.round((tDone / typeItems.length) * 100) : 0;
    y = sectionTitle(doc, `${typeLabels[type] || type} (${typeItems.length})`, y, COLORS.primary);
    doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(`${tDone}/${typeItems.length} (${tPct}%)`, 500, y - 18, { width: 60, align: 'right' });
    y += 4;
    progressBar(doc, tPct, 50, y, CONTENT_WIDTH);
    y += 18;

    y = tableHeader(doc, [
      { label: 'Data', x: 54, w: 70 },
      { label: 'Hora', x: 128, w: 40 },
      { label: 'Nome', x: 173, w: 155 },
      { label: 'Local', x: 333, w: 75 },
      { label: 'Publico', x: 413, w: 70 },
      { label: 'Status', x: 488, w: 72, align: 'right' },
    ], y);

    for (const e of typeItems) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      const nameH = calcTextHeight(doc, e.name || '-', 155, 9);
      const descH = e.description ? calcTextHeight(doc, e.description, 375, 8) : 0;
      const rowH = Math.max(26, nameH + descH + 8);
      zebraRow(doc, y, rowH);
      const dt = e.date ? new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir';
      doc.fillColor(COLORS.primary).fontSize(9).font('Helvetica-Bold').text(dt, 56, y + 4, { width: 70 });
      doc.fillColor(COLORS.dark).font('Helvetica').text(e.time || '-', 128, y + 4, { width: 40 });
      doc.font('Helvetica-Bold').text(e.name || '-', 173, y + 4, { width: 155 });
      doc.font('Helvetica').fillColor(COLORS.gray).text(e.location || '-', 333, y + 4, { width: 75 });
      doc.fillColor(COLORS.secondary).fontSize(7).font('Helvetica-Oblique').text(e.target_audience || '-', 413, y + 4, { width: 70 });
      const stColor = e.status === 'concluida' || e.status === 'concluido' ? COLORS.green : e.status === 'em_andamento' ? COLORS.orange : COLORS.gray;
      doc.fillColor(stColor).font('Helvetica-Bold').fontSize(7).text(e.status || '-', 488, y + 4, { width: 72, align: 'right' });
      let cy = y + nameH + 6;
      if (e.description) {
        doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica-Oblique').text(e.description, 185, cy, { width: 375 });
      }
      y += rowH;
    }
    y += 12;
  }

  doc.end();
  return new Promise(resolve => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

module.exports = { generateFullReport, generateCategoryReport, generateTeamReport, generateTeamScheduleReport,
  generateScheduleReport, generateParticipantsReport, generateFinanceReport, generateAlicercesReport,
  generateLembrancinhasReport, generateFornecedoresReport, generateAvisosReport, generateKitReport,
  generateCoordinatorGuideReport, generatePreparationReport, generateLembretesReport, generateEscolinhasReport };
