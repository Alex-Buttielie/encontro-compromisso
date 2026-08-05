module.exports = {
  name: 'V13__seed_unified_budget_insumos',
  up(db) {
    const existing = db.getAll('budget_items');
    const existingNames = new Set(existing.map(b => b.item_name));

    const insumos = [
      // CARNES E FRIOS
      { category: 'Carnes e Frios', item_name: 'Filé de frango', quantity: 70, unit: 'kg', estimated_unit_cost: 25.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 1.750,00' },
      { category: 'Carnes e Frios', item_name: 'Coxa e sobrecoxa', quantity: 90, unit: 'kg', estimated_unit_cost: 13.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 1.170,00' },
      { category: 'Carnes e Frios', item_name: 'Patinho (bife)', quantity: 50, unit: 'kg', estimated_unit_cost: 45.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 2.250,00' },
      { category: 'Carnes e Frios', item_name: 'Calabresa', quantity: 2, unit: 'pacote', estimated_unit_cost: 90.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 180,00' },
      { category: 'Carnes e Frios', item_name: 'Bacon', quantity: 1, unit: 'manta', estimated_unit_cost: 280.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 280,00' },
      { category: 'Carnes e Frios', item_name: 'Salsicha', quantity: 12, unit: 'kg', estimated_unit_cost: 15.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 180,00' },
      { category: 'Carnes e Frios', item_name: 'Presunto', quantity: 3, unit: 'barra', estimated_unit_cost: 300.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 900,00' },
      { category: 'Carnes e Frios', item_name: 'Muçarela', quantity: 3, unit: 'barra', estimated_unit_cost: 400.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 1.200,00' },

      // PADARIA E LATICÍNIOS
      { category: 'Padaria e Laticínios', item_name: 'Pão de sal', quantity: 600, unit: 'un', estimated_unit_cost: 0.60, status: 'orcado', supplier: '', notes: 'Total est. R$ 360,00' },
      { category: 'Padaria e Laticínios', item_name: 'Leite', quantity: 4, unit: 'caixa', estimated_unit_cost: 180.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 720,00' },
      { category: 'Padaria e Laticínios', item_name: 'Creme de leite', quantity: 13, unit: 'L', estimated_unit_cost: 10.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 130,00' },
      { category: 'Padaria e Laticínios', item_name: 'Ovos', quantity: 1, unit: 'caixa', estimated_unit_cost: 780.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 780,00' },
      { category: 'Padaria e Laticínios', item_name: 'Fermento Royal', quantity: 2, unit: 'lata', estimated_unit_cost: 35.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 70,00' },
      { category: 'Padaria e Laticínios', item_name: 'Biscoito/Pão de queijo congelado', quantity: 1, unit: 'un', estimated_unit_cost: 350.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 350,00' },

      // MERCEARIA
      { category: 'Mercearia', item_name: 'Arroz', quantity: 70, unit: 'kg', estimated_unit_cost: 7.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 490,00' },
      { category: 'Mercearia', item_name: 'Feijão', quantity: 16, unit: 'kg', estimated_unit_cost: 10.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 160,00' },
      { category: 'Mercearia', item_name: 'Macarrão penne', quantity: 3, unit: 'kg', estimated_unit_cost: 9.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 27,00' },
      { category: 'Mercearia', item_name: 'Macarrão fusilli', quantity: 2, unit: 'kg', estimated_unit_cost: 9.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 18,00' },
      { category: 'Mercearia', item_name: 'Espaguete', quantity: 8, unit: 'kg', estimated_unit_cost: 8.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 64,00' },
      { category: 'Mercearia', item_name: 'Massa para lasanha', quantity: 8, unit: 'kg', estimated_unit_cost: 20.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 160,00' },
      { category: 'Mercearia', item_name: 'Farinha de trigo', quantity: 1, unit: 'fardo', estimated_unit_cost: 180.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 180,00' },
      { category: 'Mercearia', item_name: 'Extrato de tomate (Elefante)', quantity: 15, unit: 'kg', estimated_unit_cost: 16.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 240,00' },
      { category: 'Mercearia', item_name: 'Milho', quantity: 4, unit: 'kg', estimated_unit_cost: 10.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 40,00' },
      { category: 'Mercearia', item_name: 'Café', quantity: 10, unit: 'kg', estimated_unit_cost: 48.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 480,00' },
      { category: 'Mercearia', item_name: 'Mostarda', quantity: 3, unit: 'L', estimated_unit_cost: 15.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 45,00' },
      { category: 'Mercearia', item_name: 'Azeitona', quantity: 1, unit: 'baldinho', estimated_unit_cost: 90.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 90,00' },
      { category: 'Mercearia', item_name: 'Orégano', quantity: 300, unit: 'g', estimated_unit_cost: 0.06, status: 'orcado', supplier: '', notes: 'Total est. R$ 18,00' },
      { category: 'Mercearia', item_name: 'Achocolatado', quantity: 3, unit: 'kg', estimated_unit_cost: 25.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 75,00' },
      { category: 'Mercearia', item_name: 'Chocolate granulado', quantity: 1, unit: 'kg', estimated_unit_cost: 30.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 30,00' },

      // HORTIFRUTI
      { category: 'Hortifruti', item_name: 'Batata para fritar', quantity: 30, unit: 'kg', estimated_unit_cost: 7.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 210,00' },
      { category: 'Hortifruti', item_name: 'Batata inglesa', quantity: 1, unit: 'saco', estimated_unit_cost: 250.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 250,00' },
      { category: 'Hortifruti', item_name: 'Batata-doce', quantity: 4, unit: 'kg', estimated_unit_cost: 6.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 24,00' },
      { category: 'Hortifruti', item_name: 'Cenoura', quantity: 8, unit: 'kg', estimated_unit_cost: 6.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 48,00' },
      { category: 'Hortifruti', item_name: 'Abóbora', quantity: 4, unit: 'kg', estimated_unit_cost: 6.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 24,00' },
      { category: 'Hortifruti', item_name: 'Alface', quantity: 9, unit: 'pé', estimated_unit_cost: 5.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 45,00' },
      { category: 'Hortifruti', item_name: 'Repolho', quantity: 16, unit: 'cabeça', estimated_unit_cost: 7.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 112,00' },
      { category: 'Hortifruti', item_name: 'Cheiro-verde', quantity: 10, unit: 'maço', estimated_unit_cost: 4.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 40,00' },
      { category: 'Hortifruti', item_name: 'Pimenta-de-cheiro', quantity: 4, unit: 'kg', estimated_unit_cost: 15.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 60,00' },
      { category: 'Hortifruti', item_name: 'Limão', quantity: 5, unit: 'kg', estimated_unit_cost: 7.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 35,00' },
      { category: 'Hortifruti', item_name: 'Abacaxi', quantity: 5, unit: 'un', estimated_unit_cost: 10.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 50,00' },
      { category: 'Hortifruti', item_name: 'Manga', quantity: 5, unit: 'kg', estimated_unit_cost: 7.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 35,00' },

      // COZINHA E DESCARTÁVEIS
      { category: 'Cozinha e Descartáveis', item_name: 'Papel-alumínio', quantity: 6, unit: 'rolo', estimated_unit_cost: 30.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 180,00' },
      { category: 'Cozinha e Descartáveis', item_name: 'Filme PVC', quantity: 1, unit: 'rolo', estimated_unit_cost: 35.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 35,00' },
      { category: 'Cozinha e Descartáveis', item_name: 'Batata palha', quantity: 12, unit: 'kg', estimated_unit_cost: 25.00, status: 'orcado', supplier: '', notes: 'Total est. R$ 300,00' },

      // IDENTIFICAÇÃO E PAPELARIA
      { category: 'Identificação e Papelaria', item_name: 'Etiquetas de mala', quantity: 2, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Identificação e Papelaria', item_name: 'Etiqueta para rosa', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Identificação e Papelaria', item_name: 'Etiqueta para travesseiro', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Identificação e Papelaria', item_name: 'Etiquetas para garrafinhas das MPs', quantity: 90, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Identificação e Papelaria', item_name: 'Crachás da música tema', quantity: 90, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Identificação e Papelaria', item_name: 'Crachás de operários', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Identificação e Papelaria', item_name: 'Xamex branco', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Identificação e Papelaria', item_name: 'Xamex colorido', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Identificação e Papelaria', item_name: 'Papel kraft', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Identificação e Papelaria', item_name: 'Folha de assinatura da Congregação', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Identificação e Papelaria', item_name: 'Marca-lugares sala de reunião', quantity: 90, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Identificação e Papelaria', item_name: 'Adesivos para sacolas de cartas', quantity: 90, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },

      // KITS E EMBALAGENS
      { category: 'Kits e Embalagens', item_name: 'Sacos de cartinhas', quantity: 90, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Kits e Embalagens', item_name: 'Sacolas de camisetas', quantity: 90, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Kits e Embalagens', item_name: 'Sacos plásticos kit KH/quarto/sala', quantity: 90, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Kits e Embalagens', item_name: 'Sacos para recolher itens pessoais RH', quantity: 90, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Kits e Embalagens', item_name: 'Lembrancinhas dos construtores', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },

      // DECORAÇÃO
      { category: 'Decoração', item_name: 'Cestos', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Cesta', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Rosas vermelhas', quantity: 95, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Rosas brancas', quantity: 30, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Nuvens', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Estrelas cadentes (capela)', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Estrelinhas', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Estrelinhas para nuvens', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Piscas-piscas', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Balões vermelhos e brancos', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'TNT para piquenique', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Materiais para decoração do refeitório', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Lírios com nomes das MPs', quantity: 90, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Vasos para corredores dos alojamentos', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Vasos para a capela', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Imagem de Nossa Senhora de Lourdes', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Decoração', item_name: 'Fitinhas', quantity: 95, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },

      // CAPELA E ENCENAÇÕES
      { category: 'Capela e Encenações', item_name: 'Lamparina', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Capela e Encenações', item_name: 'Sangue falso', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Capela e Encenações', item_name: 'Coroa de espinhos', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Capela e Encenações', item_name: 'Pano branco/retalho', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Capela e Encenações', item_name: 'Velas para adoração', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Capela e Encenações', item_name: 'Máquina de fumaça', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },

      // ESTRUTURA E EQUIPAMENTOS
      { category: 'Estrutura e Equipamentos', item_name: 'Strobo de luz (Sávio)', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Estrutura e Equipamentos', item_name: 'Canos', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Estrutura e Equipamentos', item_name: 'Cola quente', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Estrutura e Equipamentos', item_name: 'Pistola de cola quente', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Estrutura e Equipamentos', item_name: 'Pilhas', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Estrutura e Equipamentos', item_name: 'Rádios', quantity: 4, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Estrutura e Equipamentos', item_name: 'Rodos pequenos', quantity: 3, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Estrutura e Equipamentos', item_name: 'Rodos grandes', quantity: 4, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Estrutura e Equipamentos', item_name: 'Caminhão para frete', quantity: 1, unit: 'serviço', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },

      // EVENTOS
      { category: 'Eventos', item_name: 'Foguetes (Bota-fora, Chegada no Canteiro e Missa de Encerramento)', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },

      // MATERIAIS GERAIS
      { category: 'Materiais Gerais', item_name: 'Bíblias', quantity: 90, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Materiais Gerais', item_name: 'Cordão do Espírito Santo', quantity: 80, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Materiais Gerais', item_name: 'Camisas das MPs', quantity: 90, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
      { category: 'Materiais Gerais', item_name: 'Aviso aos fornecedores', quantity: 1, unit: 'un', estimated_unit_cost: 0, status: 'orcado', supplier: '', notes: 'Valor a definir' },
    ];

    let created = 0;
    let skipped = 0;
    for (const item of insumos) {
      if (existingNames.has(item.item_name)) {
        skipped++;
        continue;
      }
      db.insert('budget_items', {
        ...item,
        description: '',
        actual_cost: 0,
        created_at: new Date().toISOString(),
      });
      created++;
    }

    console.log(`  [V13] Seeded ${created} unified budget items (skipped ${skipped} duplicates)`);
  }
};
