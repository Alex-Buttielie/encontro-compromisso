module.exports = {
  name: 'V9__seed_budget_donations',
  up(db) {
    const budgetItems = [
      { category: 'Alimentação', item_name: 'Arroz', description: 'Para refeições do encontro', quantity: 50, unit: 'kg', estimated_unit_cost: 5.50, status: 'orcado', supplier: '', notes: '' },
      { category: 'Alimentação', item_name: 'Feijão', description: 'Para refeições do encontro', quantity: 30, unit: 'kg', estimated_unit_cost: 8.00, status: 'orcado', supplier: '', notes: '' },
      { category: 'Alimentação', item_name: 'Carne', description: 'Proteína para refeições', quantity: 25, unit: 'kg', estimated_unit_cost: 35.00, status: 'orcado', supplier: '', notes: '' },
      { category: 'Alimentação', item_name: 'Bebidas (Suco/Refrigerante)', description: 'Bebidas para todas as refeições', quantity: 100, unit: 'L', estimated_unit_cost: 4.00, status: 'orcado', supplier: '', notes: '' },
      { category: 'Alimentação', item_name: 'Café', description: 'Café da manhã e momentos extras', quantity: 10, unit: 'kg', estimated_unit_cost: 25.00, status: 'orcado', supplier: '', notes: '' },
      { category: 'Limpeza', item_name: 'Material de limpeza geral', description: 'Sabão, detergente, desinfetante', quantity: 20, unit: 'kit', estimated_unit_cost: 15.00, status: 'orcado', supplier: '', notes: '' },
      { category: 'Limpeza', item_name: 'Papel higiênico', description: 'Para banheiros', quantity: 50, unit: 'un', estimated_unit_cost: 8.00, status: 'orcado', supplier: '', notes: '' },
      { category: 'Limpeza', item_name: 'Sacos de lixo', description: 'Sacos grandes', quantity: 100, unit: 'un', estimated_unit_cost: 1.50, status: 'orcado', supplier: '', notes: '' },
      { category: 'Decoração', item_name: 'Flores e arranjos', description: 'Decoração da capela e ambientes', quantity: 15, unit: 'arranjo', estimated_unit_cost: 30.00, status: 'orcado', supplier: '', notes: '' },
      { category: 'Decoração', item_name: 'Velas', description: 'Velas para capela e momentos', quantity: 60, unit: 'un', estimated_unit_cost: 5.00, status: 'orcado', supplier: '', notes: '' },
      { category: 'Decoração', item_name: 'Tecidos e panos', description: 'Para decoração de ambientes', quantity: 10, unit: 'm', estimated_unit_cost: 12.00, status: 'orcado', supplier: '', notes: '' },
      { category: 'Materiais Diversos', item_name: 'Crachás e materiais gráficos', description: 'Crachás, cartilhas, impressos', quantity: 120, unit: 'un', estimated_unit_cost: 3.50, status: 'orcado', supplier: '', notes: '' },
      { category: 'Materiais Diversos', item_name: 'Lembrancinhas', description: 'Sacochilas, squeezes, terços', quantity: 120, unit: 'kit', estimated_unit_cost: 15.00, status: 'orcado', supplier: '', notes: '' },
      { category: 'Materiais Diversos', item_name: 'Material de capela', description: 'Sacrário, ostensório, cálices', quantity: 1, unit: 'kit', estimated_unit_cost: 500.00, status: 'orcado', supplier: '', notes: '' },
      { category: 'Logística', item_name: 'Transporte (ônibus)', description: 'Aluguel de ônibus para ida e volta', quantity: 1, unit: 'viagem', estimated_unit_cost: 2500.00, status: 'orcado', supplier: '', notes: '' },
      { category: 'Logística', item_name: 'Combustível', description: 'Combustível para veículos de apoio', quantity: 100, unit: 'L', estimated_unit_cost: 6.50, status: 'orcado', supplier: '', notes: '' },
      { category: 'Espaço Físico', item_name: 'Aluguel do local', description: 'Aluguel do canteiro de obras', quantity: 1, unit: 'evento', estimated_unit_cost: 3000.00, status: 'orcado', supplier: '', notes: '' },
      { category: 'Som e Técnica', item_name: 'Equipamento de som', description: 'Aluguel de som e microfones', quantity: 1, unit: 'kit', estimated_unit_cost: 800.00, status: 'orcado', supplier: '', notes: '' },
      { category: 'Primeiros Socorros', item_name: 'Kit primeiros socorros', description: 'Medicamentos e materiais básicos', quantity: 2, unit: 'kit', estimated_unit_cost: 150.00, status: 'orcado', supplier: '', notes: '' },
    ];

    for (const item of budgetItems) {
      db.insert('budget_items', item);
    }

    const donations = [
      { donor_name: 'Paróquia São Sebastião', type: 'dinheiro', description: 'Doação para o encontro', value: 500.00, date: '2026-06-15', category: 'Geral', consolidated: false },
      { donor_name: 'João e Maria Silva', type: 'material', description: '50kg de arroz', value: 0, date: '2026-07-01', category: 'Alimentação', linked_budget_item: null, consolidated: false },
      { donor_name: 'Comércio local - Mercearia Trindade', type: 'material', description: 'Doação de 30kg de feijão', value: 0, date: '2026-07-05', category: 'Alimentação', linked_budget_item: null, consolidated: false },
    ];

    for (const d of donations) {
      db.insert('donations', d);
    }

    console.log('  [V9] Seeded ' + budgetItems.length + ' budget items and ' + donations.length + ' donations');
  }
};
