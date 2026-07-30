module.exports = {
  up(db) {
    // ===== 1. FINANCE CATEGORIES =====
    const existingCats = db.getAll('finance_categories');
    if (existingCats.length > 0) {
      console.log('  [V5] Finance categories already exist. Skipping.');
    } else {
      const categories = [
        // Receitas
        { name: 'Inscrições', type: 'receita', color: '#27ae60', budget_limit: 0, description: 'Taxas de inscrição de Matérias-primas e eventos (Domus, etc.)' },
        { name: 'Doações', type: 'receita', color: '#2ecc71', budget_limit: 0, description: 'Doações em dinheiro para o Encontro e ações sociais' },
        { name: 'Bazar', type: 'receita', color: '#16a085', budget_limit: 0, description: 'Venda de artigos da JUMIRE e camisetas' },
        { name: 'Noite na Praça', type: 'receita', color: '#3498db', budget_limit: 0, description: 'Receitas de vendas nas Noites na Praça (espécie, PIX, cartão)' },
        { name: 'Feijoada', type: 'receita', color: '#2980b9', budget_limit: 0, description: 'Receitas da Feijoada do Padre (espécie, PIX, cartão)' },
        { name: 'Confraternização', type: 'receita', color: '#8e44ad', budget_limit: 0, description: 'Receitas de eventos de confraternização' },
        { name: 'Pamonhada', type: 'receita', color: '#9b59b6', budget_limit: 0, description: 'Receitas de vendas de pamonhada' },
        { name: 'Tríduo da Vila', type: 'receita', color: '#f39c12', budget_limit: 0, description: 'Receitas de vendas no Tríduo da Vila' },
        { name: 'Reembolso', type: 'receita', color: '#e67e22', budget_limit: 0, description: 'Rifas e reembolsos' },
        { name: 'Rendimento de Conta', type: 'receita', color: '#1abc9c', budget_limit: 0, description: 'Rendimentos sobre dinheiro em conta' },
        { name: 'Taxa MP', type: 'receita', color: '#27ae60', budget_limit: 0, description: 'Taxa de Matéria-prima' },
        { name: 'Taxa Operário', type: 'receita', color: '#27ae60', budget_limit: 0, description: 'Taxa de Operário' },
        { name: 'Caixa Anterior', type: 'receita', color: '#2c3e50', budget_limit: 0, description: 'Caixa repassado da coordenação anterior' },

        // Despesas
        { name: 'Espaço Físico', type: 'despesa', color: '#e74c3c', budget_limit: 8000, description: 'Aluguel do Canteiro de Obras e espaços para eventos' },
        { name: 'Alimentação', type: 'despesa', color: '#c0392b', budget_limit: 5000, description: 'Insumos para vendas e refeições em eventos' },
        { name: 'Bazar', type: 'despesa', color: '#e67e22', budget_limit: 3000, description: 'Compra de camisetas e artigos da JUMIRE para venda' },
        { name: 'AEUC', type: 'despesa', color: '#d35400', budget_limit: 4000, description: 'Despesas do AEUC (frango, carnes, verduras, impressões, traslado)' },
        { name: 'Noite na Praça', type: 'despesa', color: '#e74c3c', budget_limit: 3000, description: 'Insumos, bebidas, embalagens para Noites na Praça' },
        { name: 'Confraternização', type: 'despesa', color: '#c0392b', budget_limit: 2000, description: 'Embalagens, espetinhos, bebidas para confraternizações' },
        { name: 'Materiais Gráficos', type: 'despesa', color: '#34495e', budget_limit: 2000, description: 'Impressões, cordões, ingressos' },
        { name: 'Materiais', type: 'despesa', color: '#7f8c8d', budget_limit: 2000, description: 'Sacochilas, squeezes, envelopes' },
        { name: 'Gás', type: 'despesa', color: '#95a5a6', budget_limit: 500, description: 'Botijões de gás e produtos de limpeza associados' },
        { name: 'Limpeza', type: 'despesa', color: '#bdc3c7', budget_limit: 500, description: 'Produtos de limpeza' },
        { name: 'Office Boy', type: 'despesa', color: '#95a5a6', budget_limit: 1000, description: 'Despesas com office boy/girl (combustível, transporte)' },
        { name: 'Taxas', type: 'despesa', color: '#e74c3c', budget_limit: 2000, description: 'Taxa de convênio e outras taxas' },
        { name: 'Reembolso', type: 'despesa', color: '#e67e22', budget_limit: 0, description: 'Devoluções de rifas e reembolsos' },
        { name: 'Despesas Gerais', type: 'despesa', color: '#7f8c8d', budget_limit: 5000, description: 'Despesas diversas: livretos, ações sociais, homenagens, reservas' },
      ];

      let count = 0;
      for (const c of categories) {
        db.insert('finance_categories', c);
        count++;
      }
      console.log(`  [V5] Inserted ${count} finance categories`);
    }

    // ===== 2. FINANCE EVENTS =====
    const existingEvents = db.getAll('finance_events');
    if (existingEvents.length > 0) {
      console.log('  [V5] Finance events already exist. Skipping.');
    } else {
      // Calculate actuals from finance data
      const finance = db.getAll('finance');
      const sumBy = (cat, type) => finance.filter(f => f.category === cat && f.type === type).reduce((s, f) => s + (f.amount || 0), 0);

      const events = [
        {
          name: 'Noite na Praça (Out/2025)',
          type: 'Noite na Praça',
          date: '2025-10-23',
          expected_revenue: 2000, actual_revenue: sumBy('Noite na Praça', 'receita'),
          expected_expense: 800, actual_expense: sumBy('Noite na Praça', 'despesa'),
          status: 'concluido', location: 'Praça'
        },
        {
          name: 'Noite na Praça (Nov/2025)',
          type: 'Noite na Praça',
          date: '2025-11-23',
          expected_revenue: 2500, actual_revenue: 2326.12,
          expected_expense: 1000, actual_expense: 1250,
          status: 'concluido', location: 'Praça'
        },
        {
          name: 'Noite na Praça de Pastel (Mar/2026)',
          type: 'Noite na Praça',
          date: '2026-03-29',
          expected_revenue: 2000, actual_revenue: 1355.73 + 570.42 + 313.00,
          expected_expense: 600, actual_expense: 317.91 + 200,
          status: 'concluido', location: 'Praça'
        },
        {
          name: 'Noite na Praça (Jun/2026 - Preparação)',
          type: 'Noite na Praça',
          date: '2026-06-21',
          expected_revenue: 2500, actual_revenue: 0,
          expected_expense: 800, actual_expense: 0,
          status: 'planejado', location: 'Praça'
        },
        {
          name: 'Noite na Praça (Jul/2026 - Preparação)',
          type: 'Noite na Praça',
          date: '2026-07-26',
          expected_revenue: 2500, actual_revenue: 0,
          expected_expense: 800, actual_expense: 0,
          status: 'planejado', location: 'Praça'
        },
        {
          name: 'Pamonhada (Mar/2026)',
          type: 'Pamonhada',
          date: '2026-03-07',
          expected_revenue: 3000, actual_revenue: 2612.30 + 518.00 + 447.00 + 90.00,
          expected_expense: 1000, actual_expense: 420 + 269 + 55 + 21 + 86 + 339.49 + 357.87 + 116.49 + 97.88 + 140 + 69.96 + 5,
          status: 'concluido', location: 'A definir'
        },
        {
          name: 'Feijoada do Padre (Jun/2026)',
          type: 'Feijoada',
          date: '2026-06-13',
          expected_revenue: 8000, actual_revenue: sumBy('Feijoada', 'receita'),
          expected_expense: 500, actual_expense: sumBy('Feijoada', 'despesa'),
          status: 'concluido', location: 'A definir'
        },
        {
          name: 'Confraternização 15 Anos (Mai/2026)',
          type: 'Confraternização',
          date: '2026-05-29',
          expected_revenue: 3000, actual_revenue: sumBy('Confraternização', 'receita'),
          expected_expense: 1200, actual_expense: sumBy('Confraternização', 'despesa'),
          status: 'concluido', location: 'A definir'
        },
        {
          name: 'Tríduo da Vila (Abr/2026)',
          type: 'Tríduo da Vila',
          date: '2026-04-16',
          expected_revenue: 1500, actual_revenue: 148 + 44.61 + 297 + 88.54 + 341.55 + 117.18 + 522,
          expected_expense: 600, actual_expense: 473 + 120,
          status: 'concluido', location: 'Vila'
        },
        {
          name: 'Bazar Domus (Fev/2026)',
          type: 'Bazar',
          date: '2026-02-22',
          expected_revenue: 2000, actual_revenue: sumBy('Bazar', 'receita'),
          expected_expense: 3000, actual_expense: sumBy('Bazar', 'despesa'),
          status: 'concluido', location: 'Igreja'
        },
        {
          name: 'AEUC (Mai/2026)',
          type: 'AEUC',
          date: '2026-05-23',
          expected_revenue: 0, actual_revenue: sumBy('AEUC', 'receita'),
          expected_expense: 4000, actual_expense: sumBy('AEUC', 'despesa'),
          status: 'concluido', location: 'A definir'
        },
        {
          name: 'XV Compromisso Trin (Ago/2026)',
          type: 'Encontro',
          date: '2026-08-21',
          expected_revenue: 15000, actual_revenue: 0,
          expected_expense: 12000, actual_expense: 4500 + 2550,
          status: 'planejado', location: 'Casa de Cursilho'
        },
        {
          name: 'Festa Junina Paroquial (Jun/2026)',
          type: 'Evento',
          date: '2026-06-04',
          expected_revenue: 0, actual_revenue: 0,
          expected_expense: 500, actual_expense: 0,
          status: 'planejado', location: 'Paróquia'
        },
        {
          name: 'Ação Social - Dia das Crianças (Out/2026)',
          type: 'Evento',
          date: '2026-10-11',
          expected_revenue: 200, actual_revenue: 0,
          expected_expense: 300, actual_expense: 0,
          status: 'planejado', location: 'A definir'
        },
      ];

      let count = 0;
      for (const e of events) {
        db.insert('finance_events', e);
        count++;
      }
      console.log(`  [V5] Inserted ${count} finance events`);
    }

    // ===== 3. FINANCE BUDGET =====
    const existingBudget = db.getAll('finance_budget');
    if (existingBudget.length > 0) {
      console.log('  [V5] Finance budget already exist. Skipping.');
    } else {
      // Calculate actuals from finance data
      const finance = db.getAll('finance');
      const sumBy = (cat, type) => finance.filter(f => f.category === cat && f.type === type).reduce((s, f) => s + (f.amount || 0), 0);

      const budgetItems = [
        // Receitas
        { category: 'Inscrições', type: 'receita', planned_amount: 8000, actual_amount: 18796.47 + 100 + 120, period: 'anual', description: 'Taxas de inscrição (MP, Operários, Domus, etc.)' },
        { category: 'Doações', type: 'receita', planned_amount: 3000, actual_amount: sumBy('Doações', 'receita'), period: 'anual', description: 'Doações em dinheiro' },
        { category: 'Bazar', type: 'receita', planned_amount: 2000, actual_amount: sumBy('Bazar', 'receita'), period: 'anual', description: 'Venda de camisetas e artigos' },
        { category: 'Noite na Praça', type: 'receita', planned_amount: 10000, actual_amount: sumBy('Noite na Praça', 'receita'), period: 'anual', description: 'Receitas de todas as Noites na Praça' },
        { category: 'Feijoada', type: 'receita', planned_amount: 8000, actual_amount: sumBy('Feijoada', 'receita'), period: 'anual', description: 'Receitas da Feijoada do Padre' },
        { category: 'Confraternização', type: 'receita', planned_amount: 3000, actual_amount: sumBy('Confraternização', 'receita'), period: 'anual', description: 'Receitas de confraternizações' },
        { category: 'Pamonhada', type: 'receita', planned_amount: 3000, actual_amount: 2612.30 + 518.00 + 447.00 + 90.00, period: 'anual', description: 'Receitas de pamonhada' },
        { category: 'Tríduo da Vila', type: 'receita', planned_amount: 1500, actual_amount: 148 + 44.61 + 297 + 88.54 + 341.55 + 117.18 + 522, period: 'anual', description: 'Receitas do Tríduo da Vila' },
        { category: 'Reembolso', type: 'receita', planned_amount: 2000, actual_amount: sumBy('Reembolso', 'receita'), period: 'anual', description: 'Rifas e reembolsos' },
        { category: 'Rendimento de Conta', type: 'receita', planned_amount: 200, actual_amount: 237.47, period: 'anual', description: 'Rendimentos de conta' },

        // Despesas
        { category: 'Espaço Físico', type: 'despesa', planned_amount: 8000, actual_amount: sumBy('Espaço Físico', 'despesa'), period: 'anual', description: 'Aluguel de espaços (Canteiro, AUEC, barracas)' },
        { category: 'Alimentação', type: 'despesa', planned_amount: 5000, actual_amount: sumBy('Alimentação', 'despesa'), period: 'anual', description: 'Insumos para vendas e refeições' },
        { category: 'Bazar', type: 'despesa', planned_amount: 3000, actual_amount: sumBy('Bazar', 'despesa'), period: 'anual', description: 'Compra de camisetas e artigos' },
        { category: 'AEUC', type: 'despesa', planned_amount: 4000, actual_amount: sumBy('AEUC', 'despesa'), period: 'anual', description: 'Despesas do AEUC' },
        { category: 'Noite na Praça', type: 'despesa', planned_amount: 3000, actual_amount: sumBy('Noite na Praça', 'despesa'), period: 'anual', description: 'Insumos para Noites na Praça' },
        { category: 'Confraternização', type: 'despesa', planned_amount: 2000, actual_amount: sumBy('Confraternização', 'despesa'), period: 'anual', description: 'Despesas com confraternizações' },
        { category: 'Materiais Gráficos', type: 'despesa', planned_amount: 2000, actual_amount: sumBy('Materiais Gráficos', 'despesa'), period: 'anual', description: 'Impressões, cordões, ingressos' },
        { category: 'Materiais', type: 'despesa', planned_amount: 2000, actual_amount: sumBy('Materiais', 'despesa'), period: 'anual', description: 'Sacochilas, squeezes, envelopes' },
        { category: 'Gás', type: 'despesa', planned_amount: 500, actual_amount: sumBy('Gás', 'despesa'), period: 'anual', description: 'Botijões de gás' },
        { category: 'Limpeza', type: 'despesa', planned_amount: 500, actual_amount: sumBy('Limpeza', 'despesa'), period: 'anual', description: 'Produtos de limpeza' },
        { category: 'Office Boy', type: 'despesa', planned_amount: 1000, actual_amount: sumBy('Office Boy', 'despesa'), period: 'anual', description: 'Despesas com office boy/girl' },
        { category: 'Taxas', type: 'despesa', planned_amount: 2000, actual_amount: sumBy('Taxas', 'despesa'), period: 'anual', description: 'Taxa de convênio' },
        { category: 'Despesas Gerais', type: 'despesa', planned_amount: 8000, actual_amount: sumBy('Despesa', 'despesa'), period: 'anual', description: 'Despesas diversas (livretos, ações, homenagens, reservas)' },
      ];

      let count = 0;
      for (const b of budgetItems) {
        db.insert('finance_budget', b);
        count++;
      }
      console.log(`  [V5] Inserted ${count} budget items`);
    }

    // ===== 4. AVISO =====
    const avisos = db.getAll('avisos');
    const hasFinanceAviso = avisos.some(a => a.title && a.title.includes('Dados Financeiros Importados'));
    if (hasFinanceAviso) {
      console.log('  [V5] Finance aviso already exists. Skipping.');
    } else {
      db.insert('avisos', {
        title: 'Dados Financeiros Importados - Categorias, Eventos e Orçamento',
        content: 'Os dados do relatório financeiro foram analisados e importados para o sistema!\n\n• 27 categorias financeiras criadas (13 de receita, 14 de despesa) com cores e limites de orçamento\n• 14 eventos financeiros mapeados (Noites na Praça, Pamonhada, Feijoada, Confraternização, Tríduo da Vila, Bazar Domus, AEUC, XV Compromisso Trin e mais)\n• 24 itens de orçamento anual com valores planejados vs. realizados\n\nAcesse a aba Financeiro > Categorias, Eventos e Orçamento para visualizar e gerenciar todos os dados.',
        target: 'todos',
        priority: 'alta',
        author: 'Sistema',
        pinned: true
      });
      console.log('  [V5] Created aviso about finance data import');
    }

    console.log('[V5] Finance data migration complete.');
  },
};
