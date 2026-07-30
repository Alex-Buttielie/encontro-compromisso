module.exports = {
  up(db) {
    // ===== 1. UPDATE ENCOUNTER =====
    const encounters = db.getAll('encounters');
    if (encounters.length > 0) {
      const enc = encounters[encounters.length - 1];
      db.update('encounters', enc.id, {
        name: 'XV Compromisso Trin',
        start_date: '2026-08-21',
        end_date: '2026-08-23',
        status: 'em_preparacao'
      });
      console.log('  [V4] Updated encounter: XV Compromisso Trin (21-23/08/2026)');
    }

    // ===== 2. UPDATE EXISTING ESCOLINHAS WITH DATES =====
    const escolinhas = db.getAll('escolinhas');
    const dateMap = {
      'Escolinha de Implantação - 1ª Reunião': { date: '2026-06-06', location: 'A definir' },
      'Escolinha de Implantação - 2ª Reunião': { date: '2026-06-14', location: 'A definir' },
      'Escolinha de Implantação - 3ª Reunião': { date: '2026-07-25', location: 'A definir' },
      'Escolinha de Implantação - 4ª Reunião (Betoneira Geral Local - quarta Escolinha de Preparação, envolvendo todos os operários in loco e extras)': { date: '2026-08-08', location: 'A definir' },
      'Missa de Entrega': { date: '2026-08-20', location: 'Igreja Matriz' },
    };

    let updated = 0;
    for (const esc of escolinhas) {
      const match = dateMap[esc.name];
      if (match) {
        db.update('escolinhas', esc.id, { date: match.date, location: match.location, status: 'agendada' });
        updated++;
      }
    }
    // Also match by partial name for the Betoneira Geral
    for (const esc of escolinhas) {
      if (esc.name.includes('Betoneira Geral') && !esc.date) {
        db.update('escolinhas', esc.id, { date: '2026-08-08', location: 'A definir', status: 'agendada' });
        updated++;
      }
    }
    console.log(`  [V4] Updated ${updated} existing escolinhas with calendar dates`);

    // ===== 3. CREATE NEW ESCOLINHAS FOR CALENDAR EVENTS =====
    const newEvents = [
      // === ESCOLINHAS DE FORMAÇÃO (type: formacao) ===
      { name: '9ª Escolinha de Formação', type: 'formacao', date: '2026-01-24', time: null, location: 'A definir', description: '9ª Escolinha de Formação do ano.', target_audience: 'Todos os jovens', status: 'agendada' },
      { name: '10ª Escolinha de Formação', type: 'formacao', date: '2026-03-21', time: null, location: 'A definir', description: '10ª Escolinha de Formação do ano.', target_audience: 'Todos os jovens', status: 'agendada' },
      { name: '11ª Escolinha de Formação', type: 'formacao', date: '2026-04-11', time: null, location: 'A definir', description: '11ª Escolinha de Formação do ano.', target_audience: 'Todos os jovens', status: 'agendada' },
      { name: '12ª Escolinha de Formação e Entrega das Cédulas', type: 'formacao', date: '2026-04-25', time: null, location: 'A definir', description: '12ª Escolinha de Formação do ano e entrega das cédulas.', target_audience: 'Todos os jovens', status: 'agendada' },
      { name: '13ª Escolinha de Formação', type: 'formacao', date: '2026-05-09', time: null, location: 'A definir', description: '13ª Escolinha de Formação do ano.', target_audience: 'Todos os jovens', status: 'agendada' },
      { name: '1ª Escolinha de Formação (Ano B)', type: 'formacao', date: '2026-09-12', time: null, location: 'A definir', description: '1ª Escolinha de Formação do novo ano (Abracando).', target_audience: 'Todos os jovens', status: 'agendada' },
      { name: '2ª Escolinha de Formação (Ano B)', type: 'formacao', date: '2026-09-26', time: null, location: 'A definir', description: '2ª Escolinha de Formação do novo ano (Abracando).', target_audience: 'Todos os jovens', status: 'agendada' },
      { name: '3ª Escolinha de Formação (Ano B)', type: 'formacao', date: '2026-10-10', time: null, location: 'A definir', description: '3ª Escolinha de Formação do novo ano (Abracando).', target_audience: 'Todos os jovens', status: 'agendada' },
      { name: '4ª Escolinha de Formação (Ano B)', type: 'formacao', date: '2026-10-17', time: null, location: 'A definir', description: '4ª Escolinha de Formação do novo ano (Abracando).', target_audience: 'Todos os jovens', status: 'agendada' },

      // === ESCOLINHA EXTRA (type: equipes_extras) ===
      { name: 'Tríduo da Vila / Escolinha Extra', type: 'equipes_extras', date: '2026-04-16', time: null, location: 'Vila', description: 'Tríduo da Vila com Escolinha Extra. Evento de 16 a 18/04.', target_audience: 'Equipes extras e jovens', status: 'agendada' },
      { name: '2º Escolinha Extra', type: 'equipes_extras', date: '2026-05-02', time: null, location: 'A definir', description: '2º Escolinha Extra de preparação.', target_audience: 'Equipes extras', status: 'agendada' },

      // === EVENTOS GERAIS (type: evento) ===
      { name: 'Noite na Praça / Missa da Juventude', type: 'evento', date: '2026-01-25', time: null, location: 'Praça', description: 'Noite na Praça seguida de Missa da Juventude.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Missa em Ação de Graças', type: 'evento', date: '2026-02-07', time: null, location: 'Igreja', description: 'Missa em Ação de Graças.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Domus Ecclesiae / Missa da Juventude', type: 'evento', date: '2026-02-22', time: null, location: 'Igreja', description: 'Domus Ecclesiae seguida de Missa da Juventude.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Pamonhada', type: 'evento', date: '2026-03-07', time: null, location: 'A definir', description: 'Pamonhada - evento comunitário e financeiro.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Noite na Praça', type: 'evento', date: '2026-03-15', time: null, location: 'Praça', description: 'Noite na Praça.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Missa da Juventude', type: 'evento', date: '2026-03-22', time: null, location: 'Igreja', description: 'Missa da Juventude.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Noite na Praça', type: 'evento', date: '2026-04-12', time: null, location: 'Praça', description: 'Noite na Praça.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Missa da Juventude', type: 'evento', date: '2026-04-26', time: null, location: 'Igreja', description: 'Missa da Juventude.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Noite na Praça', type: 'evento', date: '2026-05-17', time: null, location: 'Praça', description: 'Noite na Praça.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Retiro de Silêncio "Ainda Existe Uma Cruz" - AEUC/AUEC', type: 'evento', date: '2026-05-23', time: null, location: 'A definir', description: 'Retiro de Silêncio "Ainda Existe Uma Cruz" - AEUC e AUEC. Evento de 23 e 24/05.', target_audience: 'Jovens do Compromisso', status: 'agendada' },
      { name: 'Missa em Ação de Graças aos 15 anos de Implantação do Projeto Compromisso em Trindade', type: 'evento', date: '2026-05-29', time: null, location: 'Igreja', description: 'Missa em Ação de Graças pelos 15 anos de Implantação do Projeto Compromisso em Trindade.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Totus Tuus', type: 'evento', date: '2026-05-30', time: null, location: 'A definir', description: 'Evento Totus Tuus.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Festa Junina Paroquial', type: 'evento', date: '2026-06-04', time: null, location: 'Paróquia', description: 'Festa Junina Paroquial. Evento de 04 a 06/06.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Feijoada do Padre', type: 'evento', date: '2026-06-13', time: null, location: 'A definir', description: 'Feijoada do Padre - evento comunitário e financeiro.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Noite na Praça de Preparação', type: 'evento', date: '2026-06-21', time: null, location: 'Praça', description: 'Noite na Praça de Preparação para o Encontro.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Romaria da Juventude / Missa com a Juventude Basílica', type: 'evento', date: '2026-06-27', time: '16h', location: 'Basílica', description: 'Romaria da Juventude às 16h e Missa com a Juventude na Basílica às 22h.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Missa e Noite da Copiosa Redenção', type: 'evento', date: '2026-07-04', time: null, location: 'Igreja', description: 'Missa e Noite da Copiosa Redenção.', target_audience: 'Todos', status: 'agendada' },
      { name: '"O Que Jesus Fez Por Você?"', type: 'evento', date: '2026-07-18', time: null, location: 'A definir', description: 'Encontro "O Que Jesus Fez Por Você?".', target_audience: 'Jovens', status: 'agendada' },
      { name: 'Noite na Praça de Preparação', type: 'evento', date: '2026-07-26', time: null, location: 'Praça', description: 'Noite na Praça de Preparação para o Encontro.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Confraternização de Todos os Projetos e Aniversário do Compromisso', type: 'evento', date: '2026-08-01', time: null, location: 'A definir', description: 'Confraternização de Todos os Projetos e Aniversário do Compromisso.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Reencontro', type: 'evento', date: '2026-08-29', time: null, location: 'A definir', description: 'Reencontro pós-Encontro.', target_audience: 'Matérias-primas e operários', status: 'agendada' },
      { name: 'Noite na Praça', type: 'evento', date: '2026-09-20', time: null, location: 'Praça', description: 'Noite na Praça.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Missa da Juventude', type: 'evento', date: '2026-09-27', time: null, location: 'Igreja', description: 'Missa da Juventude.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Noite na Praça', type: 'evento', date: '2026-10-04', time: null, location: 'Praça', description: 'Noite na Praça.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Ação Social - Dia das Crianças', type: 'evento', date: '2026-10-11', time: null, location: 'A definir', description: 'Ação Social em comemoração ao Dia das Crianças.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Pamonhada', type: 'evento', date: '2026-10-24', time: null, location: 'A definir', description: 'Pamonhada - evento comunitário e financeiro.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Missa da Juventude', type: 'evento', date: '2026-10-25', time: null, location: 'Igreja', description: 'Missa da Juventude.', target_audience: 'Todos', status: 'agendada' },
      { name: 'Encontro de Formação do Ano A - Abracando', type: 'evento', date: '2026-11-07', time: null, location: 'A definir', description: 'Encontro de Formação do Ano A - Abracando. Evento de 07 a 08/11.', target_audience: 'Todos', status: 'agendada' },
    ];

    // Check if already inserted (idempotent)
    const existing = db.getAll('escolinhas');
    const hasCalendarEvents = existing.some(e => e.type === 'formacao' || (e.type === 'evento' && e.name.includes('Noite na Praça')));
    if (hasCalendarEvents) {
      console.log('  [V4] Calendar events already inserted. Skipping.');
    } else {
      let inserted = 0;
      for (const e of newEvents) {
        db.insert('escolinhas', e);
        inserted++;
      }
      console.log(`  [V4] Inserted ${inserted} new calendar events as escolinhas`);
    }

    // ===== 4. CREATE AVISO ABOUT CALENDAR UPDATE =====
    const avisos = db.getAll('avisos');
    const hasCalendarAviso = avisos.some(a => a.title && a.title.includes('Calendário Oficial 2026'));
    if (hasCalendarAviso) {
      console.log('  [V4] Calendar aviso already exists. Skipping.');
    } else {
      db.insert('avisos', {
        title: 'Calendário Oficial 2026 - Abracando atualizado no sistema!',
        content: 'O calendário oficial 2026 do Projeto Compromisso Trin foi carregado no sistema. Todas as datas de Escolinhas de Formação, Escolinhas de Preparação, Noites na Praça, Missas da Juventude e eventos especiais já estão disponíveis na aba "Escolinhas". O XV Compromisso Trin está marcado para 21, 22 e 23 de agosto de 2026. Confira todas as datas e prepare-se!\n\nObservação: Este calendário está sujeito a alterações. Sempre confira as informações no grupo "Compromisso TRIN" no WhatsApp e nos encaminhamentos da coordenação.',
        target: 'todos',
        priority: 'alta',
        author: 'Sistema',
        pinned: true
      });
      console.log('  [V4] Created aviso about calendar update');
    }

    console.log('[V4] Calendar migration complete.');
  },
};
