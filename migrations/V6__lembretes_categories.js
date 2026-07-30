module.exports = {
  up(db) {
    const lembretes = db.getAll('lembretes');

    // Category mapping based on title patterns
    const categoryMap = [
      { patterns: ['Definir data', 'Definir local', 'Confirmar Supervisores', 'Roteiro Geral', 'maquete-templo'], category: 'Geral MOs' },
      { patterns: ['Verificar alojamentos', 'Verificar banheiros', 'Verificar cozinha', 'Verificar espaço', 'Verificar sala', 'Reservar espaço para'], category: 'Espaço Físico' },
      { patterns: ['Convidar Encarregados', 'Células de Equipe', 'Publicar aviso', 'contagem regressiva'], category: 'Mestres de Obras' },
      { patterns: ['caminhão', 'office boy', 'malas', 'mesas e cadeiras', 'ônibus', 'locomoção'], category: 'Traslado' },
      { patterns: ['Bíblias', 'rosa', 'camisetas', 'Aviso aos Fornecedores', 'Envelopes', 'listagem', 'fotografias', 'Imprimir materiais', 'Lembrancinhas para Construtores', 'Seja bem-vindo', 'etiquetas', 'adesivos'], category: 'Materiais Gráficos' },
      { patterns: ['música tema', 'ostensório', 'Bazar - artigos'], category: 'Material JUMIRE' },
      { patterns: ['crachás', 'cordões', 'Conferir Kits'], category: 'Kits e Crachás' },
      { patterns: ['equipamentos de som', 'refletores', 'vasos de barro'], category: 'Som e Técnica' },
      { patterns: ['restrições alimentares', 'alimentos', 'materiais para cozinha', 'pratos', 'higienização', 'refresqueira'], category: 'Cozinha e Higiene' },
      { patterns: ['Sacrário-templo', 'ostensório pequeno', 'mini-betoneira', 'almofadas', 'Eucaristia', 'mesa para Sacrário', 'velas', 'vasos com flores', 'tecidos litúrgicos', 'mascotes'], category: 'Capela' },
      { patterns: ['Escolinha', 'Missa de Entrega'], category: 'Escolinhas' },
      { patterns: ['Atribuir Construtor', 'Momento Betoneira'], category: 'Alicerces e Alvenarias' },
      { patterns: ['Confeccionar Lembrancinha', 'Preparar etiquetas', 'Kit do RH'], category: 'Lembrancinhas' },
      { patterns: ['Confirmar fornecedor'], category: 'Fornecedores' },
      { patterns: ['taxa de inscrição', 'Apadrinhamento', 'troco para o Bazar', 'Betoneiras', 'hospedagem de Supervisores'], category: 'Financeiro' },
      { patterns: ['Cruz para O Crucificado', 'materiais da dinamização'], category: 'Dinamização' },
      { patterns: ['lista final de Matérias-primas', 'pagamento das taxas', 'saquinhos para celulares'], category: 'RH' },
      { patterns: ['placas com nomes', 'TNT/tecido', 'foguetes', 'Papel Kraft', 'folhetos de missa'], category: 'Montagem' },
    ];

    let updated = 0;
    for (const l of lembretes) {
      if (l.category) continue; // Already has category
      let matched = 'Geral MOs';
      for (const map of categoryMap) {
        if (map.patterns.some(p => l.title.toLowerCase().includes(p.toLowerCase()))) {
          matched = map.category;
          break;
        }
      }
      db.update('lembretes', l.id, { category: matched });
      updated++;
    }

    console.log(`  [V6] Updated ${updated} lembretes with categories`);

    // Show distribution
    const all = db.getAll('lembretes');
    const dist = {};
    all.forEach(l => { dist[l.category] = (dist[l.category] || 0) + 1; });
    Object.entries(dist).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`    ${cat}: ${count}`);
    });

    console.log('[V6] Lembretes categories migration complete.');
  },
};
