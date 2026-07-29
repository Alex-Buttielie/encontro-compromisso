const express = require('express');
const path = require('path');
const {
  generateFullReport, generateCategoryReport, generateTeamReport, generateTeamScheduleReport,
  generateScheduleReport, generateParticipantsReport, generateFinanceReport, generateAlicercesReport,
  generateLembrancinhasReport, generateFornecedoresReport, generateAvisosReport, generateKitReport,
  generateCoordinatorGuideReport, generatePreparationReport
} = require('./routes/pdf');
const apiRouter = require('./routes/api');
const { seed } = require('./data/seed');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', apiRouter);

// PDF routes
app.get('/reports/full', async (req, res) => {
  const pdf = await generateFullReport();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="relatorio-geral-compromisso-trin.pdf"');
  res.send(pdf);
});

app.get('/reports/category/:category', async (req, res) => {
  const pdf = await generateCategoryReport(decodeURIComponent(req.params.category));
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="relatorio-${req.params.category}.pdf"`);
  res.send(pdf);
});

app.get('/reports/teams', async (req, res) => {
  const pdf = await generateTeamReport();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="relatorio-equipes.pdf"');
  res.send(pdf);
});

app.get('/reports/team-schedule', async (req, res) => {
  const pdf = await generateTeamScheduleReport();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="programa-por-equipe.pdf"');
  res.send(pdf);
});

app.get('/reports/schedule', async (req, res) => {
  const pdf = await generateScheduleReport();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="roteiro-do-encontro.pdf"');
  res.send(pdf);
});

app.get('/reports/participants', async (req, res) => {
  const pdf = await generateParticipantsReport();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="lista-materias-primas.pdf"');
  res.send(pdf);
});

app.get('/reports/finance', async (req, res) => {
  const pdf = await generateFinanceReport();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="relatorio-financeiro.pdf"');
  res.send(pdf);
});

app.get('/reports/alicerces', async (req, res) => {
  const pdf = await generateAlicercesReport();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="mapa-alicerces-alvenarias.pdf"');
  res.send(pdf);
});

app.get('/reports/lembrancinhas', async (req, res) => {
  const pdf = await generateLembrancinhasReport();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="lista-lembrancinhas.pdf"');
  res.send(pdf);
});

app.get('/reports/fornecedores', async (req, res) => {
  const pdf = await generateFornecedoresReport();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="lista-fornecedores.pdf"');
  res.send(pdf);
});

app.get('/reports/avisos', async (req, res) => {
  const pdf = await generateAvisosReport();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="mural-avisos.pdf"');
  res.send(pdf);
});

app.get('/reports/kit', async (req, res) => {
  const pdf = await generateKitReport();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="kit-materia-prima.pdf"');
  res.send(pdf);
});

app.get('/reports/coordinator-guide', async (req, res) => {
  const pdf = await generateCoordinatorGuideReport();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="guia-do-coordenador.pdf"');
  res.send(pdf);
});

app.get('/reports/preparation', async (req, res) => {
  const pdf = await generatePreparationReport();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="relatorio-preparacao.pdf"');
  res.send(pdf);
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Seed database on startup
seed();

app.listen(PORT, () => {
  console.log(`\n  ========================================`);
  console.log(`  Meu Coordenador - JUMIRE`);
  console.log(`  Projeto Compromisso Trin - Gestão`);
  console.log(`  Servidor rodando em: http://localhost:${PORT}`);
  console.log(`  ========================================\n`);
});
