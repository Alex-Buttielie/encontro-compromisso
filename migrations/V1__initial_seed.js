const tasks = [
  { category: 'Espaço Físico - Canteiro de Obras', item_number: '1', title: 'Reservar/alugar espaço para o Canteiro de Obras', description: 'Reservar com mínimo 9 meses de antecedência. Deve ter alojamentos, banheiros, cozinha, refeitório, sala de reunião, capela, espaço para grupos, almoxarifado e espaço para dinâmicas externas.', responsible_team: 'Mestres de Obras', deadline: '-9 meses', priority: 'alta' },
  { category: 'Espaço Físico - Canteiro de Obras', item_number: '1.1', title: 'Alojamentos separados (masculino/feminino)', description: 'Alojamentos com cama ou colchão, separados em duas alas. Máx 10 pessoas por quarto. Quartos separados para equipes escondidas (~25 pessoas).', responsible_team: 'Mestres de Obras', deadline: '-9 meses', priority: 'alta' },
  { category: 'Espaço Físico - Canteiro de Obras', item_number: '1.2', title: 'Banheiros com chuveiro', description: 'Mínimo 1 banheiro para cada 10 pessoas. Alguns que possam ser isolados para equipes escondidas.', responsible_team: 'Mestres de Obras', deadline: '-9 meses', priority: 'alta' },
  { category: 'Espaço Físico - Canteiro de Obras', item_number: '1.3', title: 'Cozinha com isolamento visual', description: 'Cozinha com possibilidade de isolamento visual.', responsible_team: 'Mestres de Obras', deadline: '-9 meses', priority: 'alta' },
  { category: 'Espaço Físico - Canteiro de Obras', item_number: '1.4', title: 'Espaço para refeitório', description: 'Mesas/cadeiras para refeições, ilhas de servir, espaço para lavar pratos, espaço para almoço de domingo.', responsible_team: 'Mestres de Obras', deadline: '-9 meses', priority: 'alta' },
  { category: 'Espaço Físico - Canteiro de Obras', item_number: '1.5', title: 'Sala de reunião', description: 'Espaço para Matérias-primas sentadas + 15 operários, laboral com instrumentos, espaço para danças, equipamento AV, mesa para maquete-templo.', responsible_team: 'Mestres de Obras', deadline: '-9 meses', priority: 'alta' },
  { category: 'Espaço Físico - Canteiro de Obras', item_number: '1.6', title: 'Espaço para capela', description: 'Espaço para Matérias-primas no chão com almofadas + 15 operários, mesa para Sacrário-templo.', responsible_team: 'Mestres de Obras', deadline: '-9 meses', priority: 'alta' },
  { category: 'Espaço Físico - Canteiro de Obras', item_number: '1.7', title: 'Espaço para grupos de trabalho', description: '5 a 7 grupos com 9-14 pessoas cada. Cadeiras em círculos. Pode ser local descoberto se houver sombra.', responsible_team: 'Mestres de Obras', deadline: '-9 meses', priority: 'media' },
  { category: 'Espaço Físico - Canteiro de Obras', item_number: '1.8', title: 'Sala para almoxarifado', description: 'Sala exclusiva para ser o almoxarifado.', responsible_team: 'Logística', deadline: '-9 meses', priority: 'media' },
  { category: 'Espaço Físico - Canteiro de Obras', item_number: '1.9', title: 'Espaço para dinâmicas externas', description: 'Espaço para O Crucificado, Dinâmica das Vendas, entre outras.', responsible_team: 'Dinamização', deadline: '-9 meses', priority: 'media' },
  { category: 'Espaço Físico - Momentos Extras', item_number: '2', title: 'Reservar espaços para momentos extras', description: 'Reservar com mínimo 45 dias de antecedência.', responsible_team: 'Mestres de Obras', deadline: '-45 dias', priority: 'alta' },
  { category: 'Espaço Físico - Momentos Extras', item_number: '2.1', title: 'Missa de Entrega', description: 'Definir em qual Igreja e quem será o presidente (padre).', responsible_team: 'Espiritualização', deadline: '-45 dias', priority: 'alta' },
  { category: 'Espaço Físico - Momentos Extras', item_number: '2.2', title: 'Bota-fora', description: 'Reservar espaço para o Bota-fora na sexta-feira do Encontro.', responsible_team: 'Mestres de Obras', deadline: '-45 dias', priority: 'alta' },
  { category: 'Espaço Físico - Momentos Extras', item_number: '2.3', title: 'Bênção das Rosas', description: 'Reservar espaço para a Bênção das Rosas no sábado à tarde.', responsible_team: 'Espiritualização', deadline: '-45 dias', priority: 'alta' },
  { category: 'Espaço Físico - Momentos Extras', item_number: '2.4', title: 'Alicerce com os Fornecedores', description: 'Reservar espaço para o Alicerce com Fornecedores no domingo pela manhã.', responsible_team: 'RH', deadline: '-45 dias', priority: 'alta' },
  { category: 'Espaço Físico - Momentos Extras', item_number: '2.5', title: 'Missa de Encerramento', description: 'Reservar espaço para a Missa de Encerramento no domingo à noite. Avisar à equipe de liturgia que a liturgia será por conta do Projeto.', responsible_team: 'Espiritualização', deadline: '-45 dias', priority: 'alta' },
  { category: 'Traslado', item_number: '3', title: 'Caminhão de frete', description: 'Contratar caminhão para levar e buscar tudo de uma vez.', responsible_team: 'Logística', deadline: '-30 dias', priority: 'alta' },
  { category: 'Traslado', item_number: '4', title: 'Carro para office boy/girl', description: 'Garantir carro para o office boy/girl. Gastos com combustível arcados pelo Encontro.', responsible_team: 'Logística', deadline: '-30 dias', priority: 'media' },
  { category: 'Traslado', item_number: '5', title: 'Carros para transportar malas', description: 'Carros separados para malas de homens e mulheres. Sexta (Bota-fora→Canteiro) e domingo (Canteiro→Missa).', responsible_team: 'Logística', deadline: '-30 dias', priority: 'alta' },
  { category: 'Traslado', item_number: '6', title: 'Jogos de mesas e cadeiras', description: '30 jogos para refeições diárias, 80 jogos para almoço de domingo, 67 cadeiras para grupos de trabalho.', responsible_team: 'Logística', deadline: '-30 dias', priority: 'alta' },
  { category: 'Traslado', item_number: '7', title: 'Ônibus para transporte', description: '1-2 ônibus sexta, 2-3 ônibus domingo noite, 1-3 ônibus domingo manhã (Fornecedores/RH).', responsible_team: 'Logística', deadline: '-30 dias', priority: 'alta' },
  { category: 'Traslado', item_number: '8', title: 'Locomoção dos operários', description: 'Pensar na locomoção dos operários para ir ao Canteiro na sexta e voltar no domingo.', responsible_team: 'Mestres de Obras', deadline: '-30 dias', priority: 'media' },
  { category: 'Impressos e Materiais Gráficos', item_number: '9', title: 'Bíblias (se forem dar)', description: 'Edição de Bolso da Pastoral ou Aparecida, capa cristal. Contato e pedido diretamente com a Loja.', responsible_team: 'Secretaria', deadline: '-30 dias', priority: 'media' },
  { category: 'Impressos e Materiais Gráficos', item_number: '10', title: 'Botões de rosa', description: 'Vermelhas ou rosas para Matérias-primas. 24 brancas ou amarelas para as equipes. Natural ou artificial "toque real".', responsible_team: 'Serviços Gerais', deadline: '-15 dias', priority: 'alta' },
  { category: 'Impressos e Materiais Gráficos', item_number: '11', title: 'Camisetas', description: 'Pedir com mínimo 18 dias de antecedência. Pedir 1-2 a mais de cada tamanho. Inclui camisetas pretas dos Mestres de Obras.', responsible_team: 'Secretaria', deadline: '-18 dias', priority: 'alta' },
  { category: 'Impressos e Materiais Gráficos', item_number: '12', title: 'Cópias do "Aviso aos Fornecedores"', description: 'Cópias atualizadas para entregar após o Bota-fora. Deixar com Supervisor(a) Extra ou Encarregados do RH.', responsible_team: 'Secretaria', deadline: '-15 dias', priority: 'media' },
  { category: 'Impressos e Materiais Gráficos', item_number: '13', title: 'Envelopes do Kit de Visitação do RH', description: 'Arquivo RH passo a passo, Ficha de Inscrição Final, Folha de Informações ao Jovem, Texto de Preparação (Águia e Galinha), Carta Aviso aos Pais, Folhas de Betoneira.', responsible_team: 'RH', deadline: '-15 dias', priority: 'alta' },
  { category: 'Impressos e Materiais Gráficos', item_number: '14', title: 'Listagem dos nomes das Matérias-primas', description: 'Duas listas conforme DG 23, até mínimo 12 dias antes. Enviar para Secretaria JUMIRE e equipes de lembrancinhas.', responsible_team: 'Secretaria', deadline: '-12 dias', priority: 'alta' },
  { category: 'Impressos e Materiais Gráficos', item_number: '15', title: 'Fotografias gerais e dos grupos', description: 'Combinar local de revelação. Fotos editadas com logo e data. Foto oficial 15x21cm, fotos dos grupos 10x15cm.', responsible_team: 'Registro', deadline: '-10 dias', priority: 'media' },
  { category: 'Impressos e Materiais Gráficos', item_number: '16', title: 'Impressões/produção dos materiais', description: 'Listagem divisão por quarto, folha de assinaturas, 5 listagens finais, 3 listagens de grupos, listagem equipes in loco, papel de Betoneira.', responsible_team: 'Secretaria', deadline: '-10 dias', priority: 'alta' },
  { category: 'Impressos e Materiais Gráficos', item_number: '17', title: 'Lembrancinhas para Construtores (13)', description: 'Canecas personalizadas confeccionadas pela Secretaria JUMIRE (ver planilha de custos).', responsible_team: 'Secretaria', deadline: '-15 dias', priority: 'media' },
  { category: 'Impressos e Materiais Gráficos', item_number: '18', title: 'Seja bem-vindo personalizado', description: 'Para colocar na porta dos quartos junto com o Kit do RH. Feitos pelo RH.', responsible_team: 'RH', deadline: '-10 dias', priority: 'media' },
  { category: 'Impressos e Materiais Gráficos', item_number: '19', title: 'Etiquetas para malas e rosas', description: '2 por Matéria-prima (malas), 1 por Matéria-prima e 1 por equipe (rosas). Frase: "Devo florescer onde Deus me plantou!".', responsible_team: 'Secretaria', deadline: '-10 dias', priority: 'media' },
  { category: 'Impressos e Materiais Gráficos', item_number: '20', title: 'Adesivos personalizados para Bíblias', description: 'Colar somente após Bota-fora, após confirmação de quem foi. Arquivo matriz em Corel Draw/Word.', responsible_team: 'Secretaria', deadline: '-10 dias', priority: 'baixa' },
  { category: 'Material Padrão JUMIRE', item_number: '21', title: 'Áudio, letra e cifra da música tema', description: 'Repassar à laboral, espiritualização e auxiliares do RH. Solicitar à Secretaria JUMIRE.', responsible_team: 'Mestres de Obras', deadline: '-30 dias', priority: 'alta' },
  { category: 'Material Padrão JUMIRE', item_number: '22', title: 'Base para ostensório (Acabamento)', description: 'Base para ser usada no Acabamento.', responsible_team: 'Espiritualização', deadline: '-15 dias', priority: 'media' },
  { category: 'Material Padrão JUMIRE', item_number: '23', title: 'Bazar - artigos da JUMIRE', description: 'Preparar tabela de preços, prever dinheiro trocado, materiais do Projeto Local para vender.', responsible_team: 'Bazar', deadline: '-15 dias', priority: 'media' },
  { category: 'Crachás e Cordões', item_number: '24', title: 'Crachás de Matérias-primas', description: 'Plastificados e perfurados, conforme DG 23.2.2. Arquivo matriz em Corel Draw.', responsible_team: 'Secretaria', deadline: '-10 dias', priority: 'alta' },
  { category: 'Crachás e Cordões', item_number: '25', title: 'Crachás de operários', description: 'Todos os operários devem ter crachás. Sem apelidos. Indicar número/local do COMPROMISSO que fizeram.', responsible_team: 'Secretaria', deadline: '-10 dias', priority: 'alta' },
  { category: 'Crachás e Cordões', item_number: '26', title: 'Cordões para crachás', description: 'Cordão rabo de rato plástico, ou tecido vermelho com jacarezinho, ou personalizados do Projeto.', responsible_team: 'Secretaria', deadline: '-10 dias', priority: 'media' },
  { category: 'Kits das Matérias-primas', item_number: '27', title: 'Conferir Kits das Matérias-primas', description: 'Conferir até 30 dias antes! Inclui: bloco de anotação, caneta, Bíblia, terço, squeeze, crachá, cordão, marca-lugar, foto oficial, adesivo, lembrancinhas e mais.', responsible_team: 'Auxiliares', deadline: '-30 dias', priority: 'alta' },
  { category: 'Som e Técnica', item_number: '61', title: 'Equipamentos de som e técnica', description: 'Som para capela, som para dinâmicas externas, datashow, telão, computador, impressora, cabos de vídeo/áudio, baterias/pilhas, fita isolante, câmera fotográfica.', responsible_team: 'Sonorização', deadline: '-15 dias', priority: 'alta' },
  { category: 'Som e Técnica', item_number: '62', title: 'Refletores (4 a 6 pontos de luz)', description: '2 fixos na capela, outros para trabalhos de campo. Alugar da Secretaria JUMIRE.', responsible_team: 'Sonorização', deadline: '-15 dias', priority: 'media' },
  { category: 'Som e Técnica', item_number: '63', title: 'Vasos de barro para trabalho de campo', description: 'Vasos para quebrar no trabalho de campo D: quebra dos vasos.', responsible_team: 'Dinamização', deadline: '-15 dias', priority: 'media' },
  { category: 'Cozinha e Serviços Gerais', item_number: '64', title: 'Repassar restrições alimentares', description: 'A partir das fichas, repassar à cozinha/refeitório restrições e dietas. Repassar aos estagiários medicamentos/necessidades especiais.', responsible_team: 'Estagiários', deadline: '-7 dias', priority: 'alta' },
  { category: 'Cozinha e Serviços Gerais', item_number: '65', title: 'Alimentos para o Encontro', description: 'Almoço sexta (equipe), 1 almoço + 2 jantares (120-160 pessoas), 2 cafés + 2 lanches + 2 ceias, 1 almoço domingo (300-500 pessoas), 1 café extra Alicerce Fornecedores (150-250 pessoas).', responsible_team: 'Cozinha', deadline: '-7 dias', priority: 'alta' },
  { category: 'Cozinha e Serviços Gerais', item_number: '66', title: 'Materiais para cozinha', description: 'Panelas, bandejas, colheres, facas etc. Prever origem se não tiver no local. Gás e botijão.', responsible_team: 'Cozinha', deadline: '-7 dias', priority: 'alta' },
  { category: 'Cozinha e Serviços Gerais', item_number: '67', title: 'Pratos, talheres e copos', description: '120-160 para 3 dias. Domingo triplicar ou usar descartáveis.', responsible_team: 'Refeitório', deadline: '-7 dias', priority: 'alta' },
  { category: 'Cozinha e Serviços Gerais', item_number: '68', title: 'Produtos de higienização e diversos', description: 'Água sanitária, álcool, baldes, desinfetante, detergente, esponjas, flanelas, inseticida, luvas, papéis, rodos, vassouras, sacos de lixo, toucas, etc.', responsible_team: 'Serviços Gerais', deadline: '-7 dias', priority: 'alta' },
  { category: 'Cozinha e Serviços Gerais', item_number: '69', title: 'Refresqueira', description: 'Sugerido para facilitar e ter suco o tempo todo. Alugar da Secretaria JUMIRE.', responsible_team: 'Cozinha', deadline: '-15 dias', priority: 'baixa' },
  { category: 'Materiais para Capela', item_number: '70', title: 'Sacrário-templo para capela', description: 'Com imagem de Nossa Senhora de Lourdes (mini).', responsible_team: 'Espiritualização', deadline: '-15 dias', priority: 'alta' },
  { category: 'Materiais para Capela', item_number: '71', title: 'Ostensório pequeno', description: 'Para exposição do Santíssimo.', responsible_team: 'Espiritualização', deadline: '-15 dias', priority: 'alta' },
  { category: 'Materiais para Capela', item_number: '72', title: 'Mini-betoneira para capela', description: 'Para uso na capela durante o Encontro.', responsible_team: 'Espiritualização', deadline: '-15 dias', priority: 'media' },
  { category: 'Materiais para Capela', item_number: '73', title: 'Almofadas para capela', description: 'Alugar ou adquirir da Secretaria JUMIRE.', responsible_team: 'Espiritualização', deadline: '-15 dias', priority: 'media' },
  { category: 'Materiais para Capela', item_number: '74', title: 'Eucaristia para exposição', description: 'Solicitar ao padre ou ministro local.', responsible_team: 'Espiritualização', deadline: '-7 dias', priority: 'alta' },
  { category: 'Materiais para Capela', item_number: '75', title: 'Mesa para Sacrário-templo', description: 'Mesa apropriada para o Sacrário-templo na capela.', responsible_team: 'Logística', deadline: '-15 dias', priority: 'media' },
  { category: 'Materiais para Capela', item_number: '76', title: 'Velas de diferentes tamanhos', description: 'Velas para uso na capela.', responsible_team: 'Espiritualização', deadline: '-15 dias', priority: 'media' },
  { category: 'Materiais para Capela', item_number: '77', title: 'Vasos com flores para capela', description: 'Para enfeitar a capela.', responsible_team: 'Espiritualização', deadline: '-7 dias', priority: 'baixa' },
  { category: 'Materiais para Capela', item_number: '78', title: 'Tecidos litúrgicos coloridos', description: 'Tecidos para a capela.', responsible_team: 'Espiritualização', deadline: '-15 dias', priority: 'media' },
  { category: 'Materiais para Capela', item_number: '79', title: 'Mascotes para capela (mínimo 2)', description: 'Ao menos dois mascotes para a capela.', responsible_team: 'Espiritualização', deadline: '-15 dias', priority: 'baixa' },
  { category: 'Mestres de Obras', item_number: '80', title: 'Convidar Encarregados e marcar Escolinhas', description: 'Convidar Encarregados do RH, cozinha, auxiliares do RH e colaboradores antes do AEUC. Marcar datas das Escolinhas de Preparação.', responsible_team: 'Mestres de Obras', deadline: '-60 dias', priority: 'alta' },
  { category: 'Mestres de Obras', item_number: '81', title: 'Realizar Células de Equipe', description: 'Células entre Mestres de Obras seguindo roteiro do AEUC. Dividir apresentação do Roteiro Geral e Memorial Descritivo.', responsible_team: 'Mestres de Obras', deadline: '-30 dias', priority: 'alta' },
  { category: 'Mestres de Obras', item_number: '82', title: 'Publicar aviso/convite para Betoneiras', description: 'Publicar no Facebook com listagem das Matérias-primas, mínimo 12 dias antes. Incluir cabeçalho padrão.', responsible_team: 'Mestres de Obras', deadline: '-12 dias', priority: 'media' },
  { category: 'Mestres de Obras', item_number: '83', title: 'Preparar contagem regressiva', description: 'Fotos editadas com logo do Encontro. Publicar na Página Geral e redes sociais do Projeto Local.', responsible_team: 'Registro', deadline: '-30 dias', priority: 'baixa' },
];

const teams = [
  { name: 'Mestres de Obras', description: 'Coordenadores gerais do Encontro. Responsáveis por toda a organização, planejamento e execução.' },
  { name: 'Supervisores', description: 'Supervisores in loco e extra. Fazem o papel dos Mestres no Canteiro de Obras. Preparados para imprevistos.' },
  { name: 'Auxiliares', description: 'Responsáveis por squeezes, marca-lugares, kits, montagem do templo, placas dos alicerces/alvenarias.' },
  { name: 'Bazar', description: 'Venda de artigos da JUMIRE. Tabela de preços, troco, produtos do Projeto Local.' },
  { name: 'Cozinha', description: 'Preparação de todas as refeições. Almoço, jantar, café, lanches, ceias. 120-160 pessoas (300-500 no domingo).' },
  { name: 'Dinamização', description: 'Responsável por teatros, dinâmicas e trabalhos de campo. Quebra dos vasos, O Crucificado, Dinâmica das Vendas.' },
  { name: 'Espiritualização', description: 'Orações, capela, animação litúrgica, sacrário-templo, ostensório, eucaristia, velas, tecidos litúrgicos.' },
  { name: 'Estagiários', description: 'Acompanham necessidades especiais, medicamentos. Retiram pertences eletrônicos das malas. Apoio geral.' },
  { name: 'Instrutores', description: 'Responsáveis pelos grupos de trabalho. Apresentação das equipes. Alicerces e alvenarias. Lembrancinhas.' },
  { name: 'Laboral', description: 'Equipe musical. Animações, músicas calmas, liturgia. Instrumentos e equipamentos musicais.' },
  { name: 'Logística', description: 'Transporte, caminhão, ônibus, mesas, cadeiras, almoxarifado, traslado de malas.' },
  { name: 'Office Boy/Girl', description: 'Transporte de materiais, mensagens, apoios externos. Lembrancinha da oração do Santo Anjo.' },
  { name: 'Refeitório', description: 'Servir refeições, organização do espaço, pratos, talheres, copos. Ilhas de servir.' },
  { name: 'Registro', description: 'Fotografias, vídeos, contagem regressiva, edição com logo e data do Encontro.' },
  { name: 'Secretaria', description: 'Impressões, listagens, crachás, camisetas, bíblias, etiquetas, adesivos, materiais gráficos.' },
  { name: 'Serviços Gerais', description: 'Higienização, limpeza, organização do espaço. Botões de rosa, sacos de lixo, produtos de limpeza.' },
  { name: 'Sonorização', description: 'Equipamentos de som, datashow, telão, computador, cabos, refletores, câmera fotográfica.' },
  { name: 'RH', description: 'Responsável pelas Matérias-primas e Fornecedores. Kit de visitação, fichas de inscrição, escolinhas de preparação.' },
  { name: 'Colaboradores', description: 'Equipe extra de apoio. 3 a 10 operários. Auxiliam conforme necessidade.' },
];

const schedule = [
  { day: 'Sexta-feira', time: '17h30', activity: 'Bota-fora', location: 'Igreja Matriz', responsible_team: 'Mestres de Obras' },
  { day: 'Sexta-feira', time: '18h30', activity: 'Saída da Igreja Matriz', location: 'Igreja → Canteiro de Obras', responsible_team: 'Logística' },
  { day: 'Sexta-feira', time: '19h00', activity: 'Chegada - Boas-vindas', location: 'Canteiro de Obras', responsible_team: 'Mestres de Obras' },
  { day: 'Sexta-feira', time: '19h20', activity: 'Memorial Descritivo: Apresentação do Encontro e Regras', location: 'Sala de Reunião', responsible_team: 'Mestres de Obras' },
  { day: 'Sexta-feira', time: '20h00', activity: 'Jantar', location: 'Refeitório', responsible_team: 'Cozinha/Refeitório' },
  { day: 'Sexta-feira', time: '20h40', activity: 'Animação', location: 'Sala de Reunião', responsible_team: 'Laboral' },
  { day: 'Sexta-feira', time: '21h00', activity: 'Trabalho de Campo A: Teatro de abertura', location: 'Sala de Reunião', responsible_team: 'Dinamização' },
  { day: 'Sexta-feira', time: '21h15', activity: 'Alicerce 1: "Você Tem Valor"', location: 'Sala de Reunião', responsible_team: 'Instrutores' },
  { day: 'Sexta-feira', time: '22h00', activity: 'Animação', location: 'Sala de Reunião', responsible_team: 'Laboral' },
  { day: 'Sexta-feira', time: '22h10', activity: 'Alicerce 2: "Personalidade e Ideal"', location: 'Sala de Reunião', responsible_team: 'Instrutores' },
  { day: 'Sexta-feira', time: '22h50', activity: 'Argamassa 1 e Trabalho de Campo B: "Sapatos"', location: 'Sala de Reunião', responsible_team: 'Dinamização' },
  { day: 'Sexta-feira', time: '23h15', activity: 'Oração - Sexta-feira à noite', location: 'Capela', responsible_team: 'Espiritualização' },
  { day: 'Sexta-feira', time: '23h50', activity: 'Recolhimento e Ceia', location: 'Refeitório', responsible_team: 'Refeitório' },
  { day: 'Sexta-feira', time: '00h20', activity: 'Dormir', location: 'Alojamentos', responsible_team: 'Estagiários' },
  { day: 'Sábado', time: '06h30', activity: 'Acordar', location: 'Alojamentos', responsible_team: 'Estagiários' },
  { day: 'Sábado', time: '07h10', activity: 'Oração - Sábado de manhã', location: 'Capela', responsible_team: 'Espiritualização' },
  { day: 'Sábado', time: '07h40', activity: 'Café da manhã', location: 'Refeitório', responsible_team: 'Cozinha/Refeitório' },
  { day: 'Sábado', time: '08h10', activity: 'Animação/Foto', location: 'Sala de Reunião', responsible_team: 'Laboral/Registro' },
  { day: 'Sábado', time: '08h30', activity: 'Trabalho de Campo C: Teatro', location: 'Sala de Reunião', responsible_team: 'Dinamização' },
  { day: 'Sábado', time: '08h50', activity: 'Alvenaria 1: "Pérola Rara"', location: 'Sala de Reunião', responsible_team: 'Instrutores' },
  { day: 'Sábado', time: '09h10', activity: 'Animação', location: 'Sala de Reunião', responsible_team: 'Laboral' },
  { day: 'Sábado', time: '09h30', activity: 'Alvenaria 2: "Talentos"', location: 'Sala de Reunião', responsible_team: 'Instrutores' },
  { day: 'Sábado', time: '10h00', activity: 'Argamassa 2: geral + reflexão do texto de preparação', location: 'Sala de Reunião', responsible_team: 'Mestres de Obras' },
  { day: 'Sábado', time: '10h20', activity: 'Lanche', location: 'Refeitório', responsible_team: 'Cozinha/Refeitório' },
  { day: 'Sábado', time: '10h40', activity: 'Animação', location: 'Sala de Reunião', responsible_team: 'Laboral' },
  { day: 'Sábado', time: '10h50', activity: 'Alvenaria 3: "Ser Cristão Sem Deixar de Ser Jovem"', location: 'Sala de Reunião', responsible_team: 'Instrutores' },
  { day: 'Sábado', time: '11h20', activity: 'Animação', location: 'Sala de Reunião', responsible_team: 'Laboral' },
  { day: 'Sábado', time: '11h40', activity: 'Alicerce 3: "Vícios, DST\'s e violência" ou "Sorrindo Entre Lágrimas"', location: 'Sala de Reunião', responsible_team: 'Instrutores' },
  { day: 'Sábado', time: '12h30', activity: 'Oração - Sábado, antes do almoço', location: 'Capela', responsible_team: 'Espiritualização' },
  { day: 'Sábado', time: '13h00', activity: 'Almoço', location: 'Refeitório', responsible_team: 'Cozinha/Refeitório' },
  { day: 'Sábado', time: '14h00', activity: 'Argamassa 3: geral (se der, Parábola do Trem)', location: 'Sala de Reunião', responsible_team: 'Mestres de Obras' },
  { day: 'Sábado', time: '14h20', activity: 'Animação', location: 'Sala de Reunião', responsible_team: 'Laboral' },
  { day: 'Sábado', time: '14h30', activity: 'Trabalho de Campo D: Teatro/Dança - Quebra dos vasos', location: 'Externo', responsible_team: 'Dinamização' },
  { day: 'Sábado', time: '14h45', activity: 'Alicerce 4: "Revisão de Vida" ou "Visão de mundo"', location: 'Sala de Reunião', responsible_team: 'Instrutores' },
  { day: 'Sábado', time: '15h30', activity: 'Animação', location: 'Sala de Reunião', responsible_team: 'Laboral' },
  { day: 'Sábado', time: '15h40', activity: 'Alvenaria 4: "Amizade"', location: 'Sala de Reunião', responsible_team: 'Instrutores' },
  { day: 'Sábado', time: '16h10', activity: 'Argamassa 4 + Lanche', location: 'Sala de Reunião', responsible_team: 'Mestres de Obras' },
  { day: 'Sábado', time: '16h30', activity: 'Bênção das Rosas', location: 'A definir', responsible_team: 'Espiritualização' },
  { day: 'Sábado', time: '16h50', activity: 'Alvenaria 5: "Eucaristia"', location: 'Sala de Reunião', responsible_team: 'Instrutores' },
  { day: 'Sábado', time: '17h20', activity: 'Oração - Capela: Adoração ao Santíssimo Sacramento', location: 'Capela', responsible_team: 'Espiritualização' },
  { day: 'Sábado', time: '18h50', activity: 'Banho', location: 'Alojamentos', responsible_team: 'Estagiários' },
  { day: 'Sábado', time: '19h40', activity: 'Noite de Massas/Jantar de Gala', location: 'Refeitório', responsible_team: 'Cozinha/Refeitório' },
  { day: 'Sábado', time: '20h50', activity: 'Trabalho de Campo E: Teatro/dança - Lifehouse', location: 'Sala de Reunião', responsible_team: 'Dinamização' },
  { day: 'Sábado', time: '21h00', activity: 'Alicerce 5: Betoneira - "Ninguém te ama como Eu"', location: 'Sala de Reunião', responsible_team: 'Instrutores' },
  { day: 'Sábado', time: '22h00', activity: 'Oração: "Oferta de Rosas"', location: 'Capela', responsible_team: 'Espiritualização' },
  { day: 'Sábado', time: '22h30', activity: 'Trabalho de Campo F: "O Crucificado"', location: 'Externo', responsible_team: 'Dinamização' },
  { day: 'Sábado', time: '23h00', activity: 'Recolhimento e Ceia', location: 'Refeitório', responsible_team: 'Refeitório' },
  { day: 'Sábado', time: '23h30', activity: 'Dormir', location: 'Alojamentos', responsible_team: 'Estagiários' },
  { day: 'Domingo', time: '06h30', activity: 'Acordar', location: 'Alojamentos', responsible_team: 'Estagiários' },
  { day: 'Domingo', time: '07h10', activity: 'Oração - Domingo de manhã', location: 'Capela', responsible_team: 'Espiritualização' },
  { day: 'Domingo', time: '07h40', activity: 'Café da manhã: Piquenique - Super Fantástico', location: 'Refeitório', responsible_team: 'Cozinha/Refeitório' },
  { day: 'Domingo', time: '08h10', activity: 'Animação', location: 'Sala de Reunião', responsible_team: 'Laboral' },
  { day: 'Domingo', time: '08h20', activity: 'Trabalho de Campo G: Teatro', location: 'Sala de Reunião', responsible_team: 'Dinamização' },
  { day: 'Domingo', time: '08h45', activity: 'Alvenaria 6: "Maria"', location: 'Sala de Reunião', responsible_team: 'Instrutores' },
  { day: 'Domingo', time: '09h15', activity: 'Argamassa 5 + Lanche', location: 'Sala de Reunião', responsible_team: 'Mestres de Obras' },
  { day: 'Domingo', time: '08h30', activity: 'Alicerce com os Fornecedores', location: 'A definir', responsible_team: 'RH' },
  { day: 'Domingo', time: '09h45', activity: 'Animação', location: 'Sala de Reunião', responsible_team: 'Laboral' },
  { day: 'Domingo', time: '10h10', activity: 'Alicerce 6: "Família"', location: 'Sala de Reunião', responsible_team: 'Instrutores' },
  { day: 'Domingo', time: '11h30', activity: 'Trabalho de Campo H: "Dinâmica das Vendas"', location: 'Externo', responsible_team: 'Dinamização' },
  { day: 'Domingo', time: '12h10', activity: 'Oração da Família', location: 'Ambiente aberto', responsible_team: 'Espiritualização' },
  { day: 'Domingo', time: '12h30', activity: 'Almoço', location: 'Refeitório', responsible_team: 'Cozinha/Refeitório' },
  { day: 'Domingo', time: '13h40', activity: 'Apresentação das Equipes', location: 'Sala de Reunião', responsible_team: 'Mestres de Obras' },
  { day: 'Domingo', time: '15h00', activity: 'Banho e Malas', location: 'Alojamentos', responsible_team: 'Estagiários' },
  { day: 'Domingo', time: '16h00', activity: 'Argamassa 6 - escolha dos representantes', location: 'Sala de Reunião', responsible_team: 'Mestres de Obras' },
  { day: 'Domingo', time: '16h20', activity: 'Acabamento: "Compromisso"', location: 'Sala de Reunião', responsible_team: 'Mestres de Obras' },
  { day: 'Domingo', time: '16h50', activity: 'Argamassa Geral: Partilha Geral', location: 'Sala de Reunião', responsible_team: 'Mestres de Obras' },
  { day: 'Domingo', time: '18h00', activity: 'Encerramento e Lanche', location: 'Refeitório', responsible_team: 'Cozinha/Refeitório' },
  { day: 'Domingo', time: '18h20', activity: 'Saída do Canteiro de Obras', location: 'Canteiro → Igreja', responsible_team: 'Logística' },
  { day: 'Domingo', time: '18h40', activity: 'Chegada à Igreja', location: 'Igreja', responsible_team: 'Logística' },
  { day: 'Domingo', time: '19h00', activity: 'Missa de Encerramento', location: 'Igreja', responsible_team: 'Espiritualização' },
  { day: 'Domingo', time: '20h30', activity: 'Encerramento Oficial', location: 'Igreja', responsible_team: 'Mestres de Obras' },
];

const escolinhas = [
  { name: '1ª Escolinha de Preparação das Equipes Extras', type: 'equipes_extras', date: null, time: null, location: null, description: 'Apresentação do Projeto Compromisso Trin aos casais e adultos. Lectio Divina, estudo das orientações gerais e confecção de lembrancinhas.', target_audience: 'Equipes extras (Auxiliares, Bazar, Cozinha, Espiritualização, etc.)', status: 'agendada' },
  { name: '2ª Escolinha de Preparação das Equipes Extras', type: 'equipes_extras', date: null, time: null, location: null, description: 'Aprofundamento do serviço cristão, continuação da confecção de lembrancinhas.', target_audience: 'Equipes extras', status: 'agendada' },
  { name: '3ª Escolinha de Preparação das Equipes Extras', type: 'equipes_extras', date: null, time: null, location: null, description: 'Última Escolinha das equipes extras antes do Encontro.', target_audience: 'Equipes extras', status: 'agendada' },
  { name: 'Escolinha de Preparação da Cozinha - 1ª Reunião', type: 'cozinha', date: null, time: null, location: null, description: 'Apresentação do Projeto, Lectio Divina, estudo das orientações e cardápio.', target_audience: 'Equipe da Cozinha', status: 'agendada' },
  { name: 'Escolinha de Preparação da Cozinha - 2ª Reunião', type: 'cozinha', date: null, time: null, location: null, description: 'Detalhamento do cardápio, lista de compras, organização da cozinha.', target_audience: 'Equipe da Cozinha', status: 'agendada' },
  { name: 'Escolinha de Implantação - 1ª Reunião', type: 'implantacao', date: null, time: null, location: null, description: 'Reunião com todos envolvidos na Implantação. Apresentação geral do Projeto.', target_audience: 'Todos os envolvidos na implantação', status: 'agendada' },
  { name: 'Escolinha de Implantação - 2ª Reunião', type: 'implantacao', date: null, time: null, location: null, description: 'Lectio Divina e estudo das orientações passo a passo.', target_audience: 'Todos os envolvidos na implantação', status: 'agendada' },
  { name: 'Escolinha de Implantação - 3ª Reunião', type: 'implantacao', date: null, time: null, location: null, description: 'Encaminhamentos finais e confecção de lembrancinhas.', target_audience: 'Todos os envolvidos na implantação', status: 'agendada' },
  { name: 'Escolinha de Implantação - 4ª Reunião', type: 'implantacao', date: null, time: null, location: null, description: 'Betoneira Geral Local - quarta Escolinha de Preparação, envolvendo todos os operários in loco e extras.', target_audience: 'Todos os operários (in loco e extras)', status: 'agendada' },
  { name: 'Missa de Entrega', type: 'missa_entrega', date: null, time: null, location: null, description: 'Santa Missa celebrada às vésperas do Encontro. Importante que todos participem. Entrega de crachás e camisetas. Reunião geral com últimos orientações.', target_audience: 'Todos os operários', status: 'agendada' },
];

const alicerces = [
  { type: 'alicerce', order: 1, title: 'Alicerce 1 – Você Tem Valor', constructor_name: null, description: 'Pista de reflexão sobre o valor pessoal. Construtor(a) deve preparar a fala e dinâmica.', schedule_day: 'Sábado', schedule_time: 'Manhã', status: 'nao_atribuido' },
  { type: 'alicerce', order: 2, title: 'Alicerce 2 – Personalidade e Ideal', constructor_name: null, description: 'Reflexão sobre personalidade e ideal de vida.', schedule_day: 'Sábado', schedule_time: 'Manhã', status: 'nao_atribuido' },
  { type: 'alicerce', order: 3, title: 'Alicerce 3 – Vícios, DST\'s e Violência (Sorrido Entre Lágrimas)', constructor_name: null, description: 'Abordagem sobre vícios, DSTs e violência.', schedule_day: 'Sábado', schedule_time: 'Tarde', status: 'nao_atribuido' },
  { type: 'alicerce', order: 4, title: 'Alicerce 4 – Revisão de Vida (Visão de Mundo)', constructor_name: null, description: 'Revisão de vida e visão de mundo.', schedule_day: 'Sábado', schedule_time: 'Tarde', status: 'nao_atribuido' },
  { type: 'alicerce', order: 5, title: 'Momento Betoneira (Bênção das Rosas + Alicerce Betoneira + Oferta das Rosas + O Crucificado)', constructor_name: null, description: 'Momento central do Encontro: Bênção das Rosas, Alicerce Betoneira, oração da Oferta das Rosas e teatro O Crucificado. Sábado à tarde/noite.', schedule_day: 'Sábado', schedule_time: 'Tarde/Noite', status: 'nao_atribuido' },
  { type: 'alicerce', order: 6, title: 'Alicerce 6 – Família (para Matérias-primas no Canteiro de Obras)', constructor_name: null, description: 'Reflexão sobre a família para as Matérias-primas.', schedule_day: 'Domingo', schedule_time: 'Manhã', status: 'nao_atribuido' },
  { type: 'alicerce', order: 7, title: 'Alicerce Extra – Família para os Fornecedores', constructor_name: null, description: 'Reflexão sobre a família direcionada aos Fornecedores (pais).', schedule_day: 'Domingo', schedule_time: 'Manhã', status: 'nao_atribuido' },
  { type: 'alvenaria', order: 1, title: 'Alvenaria 1 – Pérola Rara', constructor_name: null, description: 'Reflexão sobre o valor único de cada pessoa.', schedule_day: 'Sábado', schedule_time: 'Manhã', status: 'nao_atribuido' },
  { type: 'alvenaria', order: 2, title: 'Alvenaria 2 – Talentos', constructor_name: null, description: 'Descoberta e uso dos talentos pessoais.', schedule_day: 'Sábado', schedule_time: 'Manhã', status: 'nao_atribuido' },
  { type: 'alvenaria', order: 3, title: 'Alvenaria 3 – Ser Cristão sem Deixar de Ser Jovem', constructor_name: null, description: 'Equilíbrio entre fé e juventude.', schedule_day: 'Sábado', schedule_time: 'Tarde', status: 'nao_atribuido' },
  { type: 'alvenaria', order: 4, title: 'Alvenaria 4 – Amizade', constructor_name: null, description: 'Reflexão sobre amizade verdadeira.', schedule_day: 'Sábado', schedule_time: 'Tarde', status: 'nao_atribuido' },
  { type: 'alvenaria', order: 5, title: 'Alvenaria 5 – Eucaristia', constructor_name: null, description: 'Reflexão sobre a Eucaristia.', schedule_day: 'Domingo', schedule_time: 'Manhã', status: 'nao_atribuido' },
  { type: 'alvenaria', order: 6, title: 'Alvenaria 6 – Maria', constructor_name: null, description: 'Reflexão sobre Nossa Senhora.', schedule_day: 'Domingo', schedule_time: 'Manhã', status: 'nao_atribuido' },
];

const lembrancinhas = [
  { team: 'Auxiliares', item_name: 'Lembrancinha "Serviço"', description: 'Frase: "Servir é amar em ação"', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
  { team: 'Bazar', item_name: 'Lembrancinha do Bazar', description: 'Item personalizado da equipe de Bazar', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
  { team: 'Cozinha', item_name: 'Lembrancinha da Cozinha', description: 'Item personalizado da equipe de Cozinha', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
  { team: 'Dinamização', item_name: 'Lembrancinha da Dinamização', description: 'Item personalizado da equipe de Dinamização', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
  { team: 'Espiritualização', item_name: 'Lembrancinha da Espiritualização', description: 'Item personalizado da equipe de Espiritualização', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
  { team: 'Estagiários', item_name: 'Etiquetas das malas e rosas', description: 'Etiquetas personalizadas para malas e rosas das Matérias-primas', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
  { team: 'Mestres de Obras', item_name: 'Lembrancinha dos MO para Matérias-primas', description: 'Sugestão: mini-betoneira ou item relacionado ao Momento Betoneira', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
  { team: 'RH', item_name: 'Kit do RH (18 modelos padrão)', description: 'Lembrancinhas padrão para o Kit do RH - dezoito modelos já prontos', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
  { team: 'Secretaria', item_name: 'Lembrancinhas para Construtores (13)', description: 'Lembrancinhas para os 13 Construtores (Alicerces e Alvenarias)', quantity_needed: 13, quantity_ready: 0, status: 'nao_iniciado' },
  { team: 'Sonorização', item_name: 'Lembrancinha da Sonorização', description: 'Item personalizado da equipe de Sonorização', quantity_needed: 0, quantity_ready: 0, status: 'nao_iniciado' },
];

function buildFinanceItems() {
  const todayStr = new Date().toISOString().slice(0, 10);
  return [
    { type: 'receita', category: 'Inscrições', description: 'Taxa de inscrição - Matérias-primas', amount: 0, date: todayStr, paid: false, responsible: 'RH' },
    { type: 'receita', category: 'Doações', description: 'Doações em dinheiro para o Encontro', amount: 0, date: todayStr, paid: false, responsible: 'Mestres de Obras' },
    { type: 'receita', category: 'Bazar', description: 'Venda de artigos da JUMIRE', amount: 0, date: todayStr, paid: false, responsible: 'Bazar' },
    { type: 'receita', category: 'Camisetas', description: 'Venda de camisetas do Encontro', amount: 0, date: todayStr, paid: false, responsible: 'Secretaria' },
    { type: 'receita', category: 'Apadrinhamento', description: 'Contribuição de padrinhos/madrinhas (50-75% da taxa)', amount: 0, date: todayStr, paid: false, responsible: 'RH' },
    { type: 'receita', category: 'Contribuições de Equipes', description: 'Contribuições das equipes para lembrancinhas', amount: 0, date: todayStr, paid: false, responsible: 'Mestres de Obras' },
    { type: 'receita', category: 'Betoneiras', description: 'Doações de Betoneiras (cestas básicas, etc.)', amount: 0, date: todayStr, paid: false, responsible: 'Mestres de Obras' },
    { type: 'despesa', category: 'Espaço Físico', description: 'Aluguel do Canteiro de Obras', amount: 0, date: todayStr, paid: false, responsible: 'Mestres de Obras' },
    { type: 'despesa', category: 'Traslado', description: 'Ônibus para transporte das Matérias-primas', amount: 0, date: todayStr, paid: false, responsible: 'Logística' },
    { type: 'despesa', category: 'Traslado', description: 'Caminhão de frete (materiais)', amount: 0, date: todayStr, paid: false, responsible: 'Logística' },
    { type: 'despesa', category: 'Traslado', description: 'Combustível (office boy/girl e carros)', amount: 0, date: todayStr, paid: false, responsible: 'Logística' },
    { type: 'despesa', category: 'Alimentação', description: 'Compras de alimentação (Sexta a Domingo)', amount: 0, date: todayStr, paid: false, responsible: 'Cozinha' },
    { type: 'despesa', category: 'Alimentação', description: 'Almoço de domingo (Fornecedores - 300-500 pessoas)', amount: 0, date: todayStr, paid: false, responsible: 'Cozinha' },
    { type: 'despesa', category: 'Alimentação', description: 'Café extra - Alicerce com os Fornecedores', amount: 0, date: todayStr, paid: false, responsible: 'Cozinha' },
    { type: 'despesa', category: 'Materiais Gráficos', description: 'Impressos, crachás, cordões, cartilhas', amount: 0, date: todayStr, paid: false, responsible: 'Secretaria' },
    { type: 'despesa', category: 'Materiais Gráficos', description: 'Banners (grande e pequeno) do Projeto', amount: 0, date: todayStr, paid: false, responsible: 'Secretaria' },
    { type: 'despesa', category: 'Materiais Gráficos', description: 'Fotografias (oficial 15x21 e grupos 10x15)', amount: 0, date: todayStr, paid: false, responsible: 'Registro' },
    { type: 'despesa', category: 'Materiais Gráficos', description: 'Etiquetas para malas e rosas', amount: 0, date: todayStr, paid: false, responsible: 'Secretaria' },
    { type: 'despesa', category: 'Camisetas', description: 'Confecção de camisetas (Matérias-primas e operários)', amount: 0, date: todayStr, paid: false, responsible: 'Secretaria' },
    { type: 'despesa', category: 'Camisetas', description: 'Camisetas pretas dos Mestres de Obras', amount: 0, date: todayStr, paid: false, responsible: 'Mestres de Obras' },
    { type: 'despesa', category: 'Bíblias', description: 'Bíblias (Edição de Bolso da Pastoral ou Aparecida)', amount: 0, date: todayStr, paid: false, responsible: 'Secretaria' },
    { type: 'despesa', category: 'Capela', description: 'Materiais para Capela (sacrário, ostensório, velas)', amount: 0, date: todayStr, paid: false, responsible: 'Espiritualização' },
    { type: 'despesa', category: 'Capela', description: 'Almofadas para capela', amount: 0, date: todayStr, paid: false, responsible: 'Espiritualização' },
    { type: 'despesa', category: 'Capela', description: 'Vasos com flores e tecidos litúrgicos', amount: 0, date: todayStr, paid: false, responsible: 'Espiritualização' },
    { type: 'despesa', category: 'Som e Técnica', description: 'Equipamento de som (sala, capela, externo)', amount: 0, date: todayStr, paid: false, responsible: 'Sonorização' },
    { type: 'despesa', category: 'Som e Técnica', description: 'Datashow, telão e computador', amount: 0, date: todayStr, paid: false, responsible: 'Sonorização' },
    { type: 'despesa', category: 'Som e Técnica', description: 'Refletores (4 a 6 pontos de luz)', amount: 0, date: todayStr, paid: false, responsible: 'Sonorização' },
    { type: 'despesa', category: 'Som e Técnica', description: 'Máquina de fumaça com glicerina', amount: 0, date: todayStr, paid: false, responsible: 'Sonorização' },
    { type: 'despesa', category: 'Som e Técnica', description: 'Cabos, extensões, adaptadores, baterias/pilhas', amount: 0, date: todayStr, paid: false, responsible: 'Sonorização' },
    { type: 'despesa', category: 'Lembrancinhas', description: 'Materiais para confecção de lembrancinhas', amount: 0, date: todayStr, paid: false, responsible: 'Equipes' },
    { type: 'despesa', category: 'Lembrancinhas', description: 'Lembrancinhas para Construtores (13 canecas)', amount: 0, date: todayStr, paid: false, responsible: 'Secretaria' },
    { type: 'despesa', category: 'Lembrancinhas', description: 'Lembrancinhas dos Mestres de Obras (chaveiro tijolinho)', amount: 0, date: todayStr, paid: false, responsible: 'Mestres de Obras' },
    { type: 'despesa', category: 'Lembrancinhas', description: 'Kit da Matéria-prima (bloco, caneta, squeeze, etc.)', amount: 0, date: todayStr, paid: false, responsible: 'Auxiliares' },
    { type: 'despesa', category: 'Decoração', description: 'TNT, lonas, balões, faixas e cartazes', amount: 0, date: todayStr, paid: false, responsible: 'Logística' },
    { type: 'despesa', category: 'Decoração', description: 'Materiais de montagem (fita, cola, arame, tesouras, pincéis)', amount: 0, date: todayStr, paid: false, responsible: 'Logística' },
    { type: 'despesa', category: 'Decoração', description: 'Materiais para Noite de Massas/Jantar de Gala', amount: 0, date: todayStr, paid: false, responsible: 'Logística' },
    { type: 'despesa', category: 'Decoração', description: 'Placas com nomes dos ambientes e alicerces', amount: 0, date: todayStr, paid: false, responsible: 'Auxiliares' },
    { type: 'despesa', category: 'Rosas', description: 'Botões de rosa (Matérias-primas + equipes)', amount: 0, date: todayStr, paid: false, responsible: 'Serviços Gerais' },
    { type: 'despesa', category: 'Bazar', description: 'Artigos da JUMIRE para venda', amount: 0, date: todayStr, paid: false, responsible: 'Bazar' },
    { type: 'despesa', category: 'Bazar', description: 'Troco para o bazar', amount: 0, date: todayStr, paid: false, responsible: 'Bazar' },
    { type: 'despesa', category: 'Higienização', description: 'Produtos de limpeza (água sanitária, detergente, etc.)', amount: 0, date: todayStr, paid: false, responsible: 'Serviços Gerais' },
    { type: 'despesa', category: 'Higienização', description: 'Papel higiênico, sacos de lixo, guardanapos', amount: 0, date: todayStr, paid: false, responsible: 'Serviços Gerais' },
    { type: 'despesa', category: 'Higienização', description: 'Pratos, talheres e copos (ou descartáveis)', amount: 0, date: todayStr, paid: false, responsible: 'Refeitório' },
    { type: 'despesa', category: 'Equipamentos', description: 'Refresqueira (aluguel)', amount: 0, date: todayStr, paid: false, responsible: 'Cozinha' },
    { type: 'despesa', category: 'Equipamentos', description: 'Maquete-templo e Sacrário-templo', amount: 0, date: todayStr, paid: false, responsible: 'Espiritualização' },
    { type: 'despesa', category: 'Equipamentos', description: 'Cruz para O Crucificado (com suporte)', amount: 0, date: todayStr, paid: false, responsible: 'Dinamização' },
    { type: 'despesa', category: 'Equipamentos', description: 'Materiais da dinamização (coroa de espinhos, figurinos, cenários)', amount: 0, date: todayStr, paid: false, responsible: 'Dinamização' },
    { type: 'despesa', category: 'Primeiros Socorros', description: 'Caixa de remédios e primeiros socorros', amount: 0, date: todayStr, paid: false, responsible: 'Estagiários' },
    { type: 'despesa', category: 'Hospedagem', description: 'Hospedagem de Supervisores e Construtores', amount: 0, date: todayStr, paid: false, responsible: 'Mestres de Obras' },
    { type: 'despesa', category: 'Honorários', description: 'Traslado de Supervisores e Construtores', amount: 0, date: todayStr, paid: false, responsible: 'Mestres de Obras' },
    { type: 'despesa', category: 'Diversos', description: 'Folhetos de missa para Missa de Encerramento', amount: 0, date: todayStr, paid: false, responsible: 'Mestres de Obras' },
    { type: 'despesa', category: 'Diversos', description: 'Papel Kraft para mural das Betoneiras', amount: 0, date: todayStr, paid: false, responsible: 'Auxiliares' },
    { type: 'despesa', category: 'Diversos', description: 'Saquinhos e etiquetas (malas, celulares, cartinhas)', amount: 0, date: todayStr, paid: false, responsible: 'Estagiários' },
    { type: 'despesa', category: 'Diversos', description: 'TNT/tecido xadrez para piquenique', amount: 0, date: todayStr, paid: false, responsible: 'Logística' },
    { type: 'despesa', category: 'Diversos', description: 'Foguetes (chegada das Matérias-primas)', amount: 0, date: todayStr, paid: false, responsible: 'Logística' },
  ];
}

const fornecedores = [
  { name: '', category: 'Espaço Físico', service: 'Aluguel do Canteiro de Obras', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Traslado', service: 'Ônibus para o Encontro', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Traslado', service: 'Caminhão de frete', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Alimentação', service: 'Supermercado / Atacadão', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Alimentação', service: 'Açougue / Frutas e Verduras', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Materiais Gráficos', service: 'Gráfica (crachás, cartilhas, impressos)', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Materiais Gráficos', service: 'Banners e placas', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Camisetas', service: 'Confecção de camisetas', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Bíblias', service: 'Loja JUMIRE / Pastoral', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: 'Edição de Bolso da Pastoral ou Aparecida', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Som e Técnica', service: 'Equipamento de som e iluminação', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Som e Técnica', service: 'Datashow, telão e computador', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Som e Técnica', service: 'Refletores (aluguel)', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: 'Alugar da Secretaria JUMIRE', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Capela', service: 'Sacrário, ostensório, velas (Paróquia)', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: 'Verificar disponibilidade com o Padre', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Lembrancinhas', service: 'Materiais para confecção', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Decoração', service: 'TNT, lonas, balões, faixas', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Rosas', service: 'Rosas para o Momento Betoneira', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: 'Uma rosa por matéria-prima + extras', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Bazar', service: 'Artigos da JUMIRE', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: 'Solicitar à Secretaria JUMIRE', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Higienização', service: 'Produtos de limpeza e higiene', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Equipamentos', service: 'Refresqueira (aluguel)', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: 'Alugar da Secretaria JUMIRE', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Primeiros Socorros', service: 'Farmácia - remédios e primeiros socorros', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
  { name: '', category: 'Hospedagem', service: 'Hotel/pousada para Supervisores e Construtores', phone: '', email: '', whatsapp: '', contact_person: '', status: 'contatado', notes: '', estimated_cost: 0, actual_cost: 0, type: 'fornecedor' },
];

const avisos = [
  { title: 'Bem-vindo ao Meu Coordenador!', content: 'Este é o seu painel de gestão do Encontro COMPROMISSO. Use os lembretes automáticos para não perder prazos, gerencie padrinhos, fornecedores e mantenha todos informados através dos avisos.', target: 'todos', priority: 'alta', author: 'Sistema', pinned: true },
  { title: 'Defina a data do Encontro', content: 'Vá em "Encontro" e defina a data de início. Isso ativará a contagem regressiva no dashboard e gerará lembretes automáticos baseados nos prazos do manual.', target: 'todos', priority: 'alta', author: 'Sistema', pinned: false },
];

module.exports = {
  up(db) {
    const insertTask = db.prepare('INSERT INTO tasks (category, item_number, title, description, responsible_team, deadline, priority, status, phase) VALUES (?,?,?,?,?,?,?,?,?)');
    for (const t of tasks) {
      insertTask.run(t.category, t.item_number, t.title, t.description, t.responsible_team, t.deadline, t.priority, 'pendente', t.phase || 'pre');
    }

    const insertTeam = db.prepare('INSERT INTO teams (name, description) VALUES (?,?)');
    for (const t of teams) {
      insertTeam.run(t.name, t.description);
    }

    const insertSchedule = db.prepare('INSERT INTO schedule_items (day, time, activity, location, responsible_team, status) VALUES (?,?,?,?,?,?)');
    for (const s of schedule) {
      insertSchedule.run(s.day, s.time, s.activity, s.location, s.responsible_team, 'pendente');
    }

    const insertEncounter = db.prepare('INSERT INTO encounters (name, status) VALUES (?,?)');
    insertEncounter.run('Novo Encontro Compromisso Trin', 'em_preparacao');

    for (const e of escolinhas) {
      db.insert('escolinhas', e);
    }

    for (const a of alicerces) {
      db.insert('alicerces', a);
    }

    for (const l of lembrancinhas) {
      db.insert('lembrancinhas', l);
    }

    const financeItems = buildFinanceItems();
    for (const f of financeItems) {
      db.insert('finance', f);
    }

    for (const f of fornecedores) {
      db.insert('fornecedores', f);
    }

    for (const a of avisos) {
      db.insert('avisos', a);
    }

    console.log(`[V1] Seeded: ${tasks.length} tasks, ${teams.length} teams, ${schedule.length} schedule items, ${escolinhas.length} escolinhas, ${alicerces.length} alicerces/alvenarias, ${lembrancinhas.length} lembrancinhas, ${financeItems.length} finance items, ${fornecedores.length} fornecedores, ${avisos.length} avisos`);
  },
};
