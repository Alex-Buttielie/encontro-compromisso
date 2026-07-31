module.exports = {
  name: 'V10__seed_cardapio',
  up(db) {
    const existing = db.getAll('cardapio');
    if (existing.length > 0) {
      console.log('  [V10] Cardapio already has ' + existing.length + ' entries. Skipping.');
      return;
    }

    const cardapio = [
      { day: 'Sexta-feira', meal: 'Almoço operários', items: ['Galinhada', 'Feijão de caldo', 'Repolho e tomate'], notes: '' },
      { day: 'Sexta-feira', meal: 'Jantar', items: ['Bife', 'Batata frita', 'Sucos e refrigerantes'], notes: '' },
      { day: 'Sábado', meal: 'Café da manhã', items: ['Pão de sal', 'Bolos', 'Ovo mexido', 'Presunto e muçarela', 'Leite zero lactose e normal', 'Achocolatado', 'Sucos'], notes: '' },
      { day: 'Sábado', meal: 'Almoço', items: ['Arroz', 'Macarrão', 'Salada', 'Frango assado com batata', 'Sucos e refrigerantes'], notes: '' },
      { day: 'Sábado', meal: 'Lanche da tarde', items: ['Pão com salsicha', 'Lanches das matérias-primas'], notes: '' },
      { day: 'Sábado', meal: 'Jantar', items: ['Noite de massas'], notes: '' },
      { day: 'Domingo', meal: 'Café da manhã', items: ['Pão de sal', 'Bolos', 'Ovo mexido', 'Presunto e muçarela', 'Leite zero lactose e normal', 'Achocolatado', 'Sucos'], notes: '' },
      { day: 'Domingo', meal: 'Almoço', items: ['Arroz', 'Strogonoff', 'Salada', 'Batata palha', 'Sobremesa: sorvete e gelatina'], notes: '' },
      { day: 'Domingo', meal: 'Lanche da tarde', items: ['Pão com carne', 'Sucos'], notes: '' },
    ];

    for (const c of cardapio) {
      db.insert('cardapio', c);
    }

    console.log('  [V10] Seeded ' + cardapio.length + ' cardapio entries');
  }
};
