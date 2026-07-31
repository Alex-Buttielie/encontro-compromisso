const express = require('express');
const path = require('path');
const {
  generateFullReport, generateCategoryReport, generateTeamReport, generateTeamScheduleReport,
  generateScheduleReport, generateParticipantsReport, generateFinanceReport, generateAlicercesReport,
  generateLembrancinhasReport, generateFornecedoresReport, generateAvisosReport, generateKitReport,
  generateCoordinatorGuideReport, generatePreparationReport, generateLembretesReport, generateEscolinhasReport,
  generateAssignedTasksReport
} = require('./routes/pdf');
const apiRouter = require('./routes/api');
const { runMigrations } = require('./migrations/run');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// API routes
app.use('/api', apiRouter);

// PDF report helper
function sendPdf(res, pdf, filename) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Content-Length', pdf.length);
  res.setHeader('Cache-Control', 'no-cache');
  res.send(pdf);
}

function reportRoute(fn, filename) {
  return async (req, res) => {
    try {
      const pdf = await fn(req);
      sendPdf(res, pdf, filename);
    } catch (err) {
      console.error('PDF generation error:', err.message);
      res.status(500).type('text/html').send('<h1>Erro ao gerar PDF</h1><p>' + err.message + '</p>');
    }
  };
}

// PDF routes
app.get('/reports/full', reportRoute(() => generateFullReport(), 'relatorio-geral-compromisso-trin.pdf'));
app.get('/reports/category/:category', reportRoute(req => generateCategoryReport(decodeURIComponent(req.params.category)), 'relatorio-categoria.pdf'));
app.get('/reports/teams', reportRoute(() => generateTeamReport(), 'relatorio-equipes.pdf'));
app.get('/reports/team-schedule', reportRoute(() => generateTeamScheduleReport(), 'programa-por-equipe.pdf'));
app.get('/reports/schedule', reportRoute(() => generateScheduleReport(), 'roteiro-do-encontro.pdf'));
app.get('/reports/participants', reportRoute(() => generateParticipantsReport(), 'lista-materias-primas.pdf'));
app.get('/reports/finance', reportRoute(() => generateFinanceReport(), 'relatorio-financeiro.pdf'));
app.get('/reports/alicerces', reportRoute(() => generateAlicercesReport(), 'mapa-alicerces-alvenarias.pdf'));
app.get('/reports/lembrancinhas', reportRoute(() => generateLembrancinhasReport(), 'lista-lembrancinhas.pdf'));
app.get('/reports/fornecedores', reportRoute(() => generateFornecedoresReport(), 'lista-fornecedores.pdf'));
app.get('/reports/avisos', reportRoute(() => generateAvisosReport(), 'mural-avisos.pdf'));
app.get('/reports/kit', reportRoute(() => generateKitReport(), 'kit-materia-prima.pdf'));
app.get('/reports/coordinator-guide', reportRoute(() => generateCoordinatorGuideReport(), 'guia-do-coordenador.pdf'));
app.get('/reports/preparation', reportRoute(() => generatePreparationReport(), 'relatorio-preparacao.pdf'));
app.get('/reports/lembretes', reportRoute(() => generateLembretesReport(), 'relatorio-lembretes.pdf'));
app.get('/reports/escolinhas', reportRoute(() => generateEscolinhasReport(), 'calendario-escolinhas-2026.pdf'));
app.get('/reports/assigned-tasks', reportRoute(() => generateAssignedTasksReport(), 'tarefas-atribuidas.pdf'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Run pending migrations on startup (Flyway-style)
runMigrations();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  ========================================`);
    console.log(`  Meu Coordenador - JUMIRE`);
    console.log(`  Projeto Compromisso Trin - Gestão`);
    console.log(`  Servidor rodando em: http://localhost:${PORT}`);
    console.log(`  ========================================\n`);
  });
}

module.exports = app;
