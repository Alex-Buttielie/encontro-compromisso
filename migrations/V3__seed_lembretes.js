module.exports = {
  up(db) {
    const lembretes = [
      // ===== RESPONSABILIDADE GERAL DOS MO's =====
      { title: 'Definir data do Encontro', description: 'Definir e fixar a data do Encontro no sistema para ativar lembretes automáticos e contagem regressiva.', priority: 'alta' },
      { title: 'Definir local do Encontro (Canteiro de Obras)', description: 'Reservar/alugar espaço com mínimo 9 meses de antecedência. Deve ter alojamentos, banheiros, cozinha, refeitório, sala de reunião, capela, espaço para grupos, almoxarifado e espaço para dinâmicas externas.', priority: 'alta' },
      { title: 'Confirmar Supervisores (in loco e extra)', description: 'Definir e confirmar Supervisores in loco e extra. Preparados para imprevistos. Fazem o papel dos Mestres no Canteiro de Obras.', priority: 'alta' },
      { title: 'Preparar Roteiro Geral e Memorial Descritivo', description: 'Preparar apresentação do Roteiro Geral e Memorial Descritivo para as Células de Equipe entre Mestres de Obras.', priority: 'alta' },
      { title: 'Preparar maquete-templo', description: 'Confeccionar ou confirmar a maquete-templo para apresentação na sala de reunião.', priority: 'media' },

      // ===== ESPAÇO FÍSICO - CANTEIRO DE OBRAS =====
      { title: 'Verificar alojamentos separados (masculino/feminino)', description: 'Alojamentos com cama ou colchão, separados em duas alas. Máx 10 pessoas por quarto. Quartos separados para equipes escondidas (~25 pessoas).', priority: 'alta' },
      { title: 'Verificar banheiros com chuveiro', description: 'Mínimo 1 banheiro para cada 10 pessoas. Alguns que possam ser isolados para equipes escondidas.', priority: 'alta' },
      { title: 'Verificar cozinha com isolamento visual', description: 'Cozinha com possibilidade de isolamento visual para que equipes não vejam a preparação.', priority: 'alta' },
      { title: 'Verificar espaço para refeitório', description: 'Mesas/cadeiras para refeições, ilhas de servir, espaço para lavar pratos, espaço para almoço de domingo (300-500 pessoas).', priority: 'alta' },
      { title: 'Verificar sala de reunião', description: 'Espaço para Matérias-primas sentadas + 15 operários, laboral com instrumentos, espaço para danças, equipamento AV, mesa para maquete-templo.', priority: 'alta' },
      { title: 'Verificar espaço para capela', description: 'Espaço para Matérias-primas no chão com almofadas + 15 operários, mesa para Sacrário-templo.', priority: 'alta' },
      { title: 'Verificar espaço para grupos de trabalho', description: '5 a 7 grupos com 9-14 pessoas cada. Cadeiras em círculos. Pode ser local descoberto se houver sombra.', priority: 'media' },
      { title: 'Verificar sala para almoxarifado', description: 'Sala exclusiva para ser o almoxarifado durante o Encontro.', priority: 'media' },
      { title: 'Verificar espaço para dinâmicas externas', description: 'Espaço para O Crucificado, Dinâmica das Vendas, entre outras dinâmicas externas.', priority: 'media' },

      // ===== ESPAÇO FÍSICO - MOMENTOS EXTRAS =====
      { title: 'Reservar espaço para Missa de Entrega', description: 'Definir em qual Igreja e quem será o presidente (padre). Missa celebrada às vésperas do Encontro.', priority: 'alta' },
      { title: 'Reservar espaço para Bota-fora', description: 'Reservar espaço para o Bota-fora na sexta-feira do Encontro na Igreja Matriz.', priority: 'alta' },
      { title: 'Reservar espaço para Bênção das Rosas', description: 'Reservar espaço para a Bênção das Rosas no sábado à tarde.', priority: 'alta' },
      { title: 'Reservar espaço para Alicerce com Fornecedores', description: 'Reservar espaço para o Alicerce com Fornecedores no domingo pela manhã.', priority: 'alta' },
      { title: 'Reservar espaço para Missa de Encerramento', description: 'Reservar espaço para a Missa de Encerramento no domingo à noite. Avisar à equipe de liturgia que a liturgia será por conta do Projeto.', priority: 'alta' },

      // ===== MESTRES DE OBRAS =====
      { title: 'Convidar Encarregados e marcar Escolinhas', description: 'Convidar Encarregados do RH, cozinha, auxiliares do RH e colaboradores antes do AEUC. Marcar datas das Escolinhas de Preparação.', priority: 'alta' },
      { title: 'Realizar Células de Equipe', description: 'Células entre Mestres de Obras seguindo roteiro do AEUC. Dividir apresentação do Roteiro Geral e Memorial Descritivo.', priority: 'alta' },
      { title: 'Publicar aviso/convite para Betoneiras', description: 'Publicar no Facebook com listagem das Matérias-primas, mínimo 12 dias antes. Incluir cabeçalho padrão.', priority: 'media' },
      { title: 'Preparar contagem regressiva', description: 'Fotos editadas com logo do Encontro. Publicar na Página Geral e redes sociais do Projeto Local.', priority: 'baixa' },

      // ===== TRASLADO =====
      { title: 'Contratar caminhão de frete', description: 'Contratar caminhão para levar e buscar tudo de uma vez (materiais, mesas, cadeiras, etc.).', priority: 'alta' },
      { title: 'Garantir carro para office boy/girl', description: 'Garantir carro para o office boy/girl. Gastos com combustível arcados pelo Encontro.', priority: 'media' },
      { title: 'Organizar carros para transportar malas', description: 'Carros separados para malas de homens e mulheres. Sexta (Bota-fora→Canteiro) e domingo (Canteiro→Missa).', priority: 'alta' },
      { title: 'Confirmar jogos de mesas e cadeiras', description: '30 jogos para refeições diárias, 80 jogos para almoço de domingo, 67 cadeiras para grupos de trabalho.', priority: 'alta' },
      { title: 'Contratar ônibus para transporte', description: '1-2 ônibus sexta, 2-3 ônibus domingo noite, 1-3 ônibus domingo manhã (Fornecedores/RH).', priority: 'alta' },
      { title: 'Pensar na locomoção dos operários', description: 'Pensar na locomoção dos operários para ir ao Canteiro na sexta e voltar no domingo.', priority: 'media' },

      // ===== IMPRESSOS E MATERIAIS GRÁFICOS =====
      { title: 'Solicitar Bíblias (se forem dar)', description: 'Edição de Bolso da Pastoral ou Aparecida, capa cristal. Contato e pedido diretamente com a Loja JUMIRE.', priority: 'media' },
      { title: 'Comprar botões de rosa', description: 'Vermelhas ou rosas para Matérias-primas. 24 brancas ou amarelas para as equipes. Natural ou artificial "toque real".', priority: 'alta' },
      { title: 'Pedir camisetas', description: 'Pedir com mínimo 18 dias de antecedência. Pedir 1-2 a mais de cada tamanho. Inclui camisetas pretas dos Mestres de Obras.', priority: 'alta' },
      { title: 'Imprimir cópias do "Aviso aos Fornecedores"', description: 'Cópias atualizadas para entregar após o Bota-fora. Deixar com Supervisor(a) Extra ou Encarregados do RH.', priority: 'media' },
      { title: 'Preparar Envelopes do Kit de Visitação do RH', description: 'Arquivo RH passo a passo, Ficha de Inscrição Final, Folha de Informações ao Jovem, Texto de Preparação (Águia e Galinha), Carta Aviso aos Pais, Folhas de Betoneira.', priority: 'alta' },
      { title: 'Preparar listagem dos nomes das Matérias-primas', description: 'Duas listas conforme DG 23, até mínimo 12 dias antes. Enviar para Secretaria JUMIRE e equipes de lembrancinhas.', priority: 'alta' },
      { title: 'Combinar fotografias gerais e dos grupos', description: 'Combinar local de revelação. Fotos editadas com logo e data. Foto oficial 15x21cm, fotos dos grupos 10x15cm.', priority: 'media' },
      { title: 'Imprimir materiais diversos', description: 'Listagem divisão por quarto, folha de assinaturas, 5 listagens finais, 3 listagens de grupos, listagem equipes in loco, papel de Betoneira.', priority: 'alta' },
      { title: 'Confeccionar Lembrancinhas para Construtores (13)', description: 'Canecas personalizadas confeccionadas pela Secretaria JUMIRE (ver planilha de custos).', priority: 'media' },
      { title: 'Preparar "Seja bem-vindo" personalizado', description: 'Para colocar na porta dos quartos junto com o Kit do RH. Feitos pelo RH.', priority: 'media' },
      { title: 'Imprimir etiquetas para malas e rosas', description: '2 por Matéria-prima (malas), 1 por Matéria-prima e 1 por equipe (rosas). Frase: "Devo florescer onde Deus me plantou!".', priority: 'media' },
      { title: 'Preparar adesivos personalizados para Bíblias', description: 'Colar somente após Bota-fora, após confirmação de quem foi. Arquivo matriz em Corel Draw/Word.', priority: 'baixa' },

      // ===== MATERIAL PADRÃO JUMIRE =====
      { title: 'Solicitar áudio, letra e cifra da música tema', description: 'Repassar à laboral, espiritualização e auxiliares do RH. Solicitar à Secretaria JUMIRE.', priority: 'alta' },
      { title: 'Confirmar base para ostensório (Acabamento)', description: 'Base para ser usada no Acabamento (momento final do Encontro).', priority: 'media' },
      { title: 'Preparar Bazar - artigos da JUMIRE', description: 'Preparar tabela de preços, prever dinheiro trocado, materiais do Projeto Local para vender.', priority: 'media' },

      // ===== CRACHÁS E CORDÕES =====
      { title: 'Imprimir crachás de Matérias-primas', description: 'Plastificados e perfurados, conforme DG 23.2.2. Arquivo matriz em Corel Draw.', priority: 'alta' },
      { title: 'Imprimir crachás de operários', description: 'Todos os operários devem ter crachás. Sem apelidos. Indicar número/local do COMPROMISSO que fizeram.', priority: 'alta' },
      { title: 'Comprar cordões para crachás', description: 'Cordão rabo de rato plástico, ou tecido vermelho com jacarezinho, ou personalizados do Projeto.', priority: 'media' },

      // ===== KITS DAS MATÉRIAS-PRIMAS =====
      { title: 'Conferir Kits das Matérias-primas', description: 'Conferir até 30 dias antes! Inclui: bloco de anotação, caneta, Bíblia, terço, squeeze, crachá, cordão, marca-lugar, foto oficial, adesivo, lembrancinhas e mais.', priority: 'alta' },

      // ===== SOM E TÉCNICA =====
      { title: 'Confirmar equipamentos de som e técnica', description: 'Som para capela, som para dinâmicas externas, datashow, telão, computador, impressora, cabos de vídeo/áudio, baterias/pilhas, fita isolante, câmera fotográfica.', priority: 'alta' },
      { title: 'Alugar refletores (4 a 6 pontos de luz)', description: '2 fixos na capela, outros para trabalhos de campo. Alugar da Secretaria JUMIRE.', priority: 'media' },
      { title: 'Comprar vasos de barro para trabalho de campo', description: 'Vasos para quebrar no trabalho de campo D: quebra dos vasos.', priority: 'media' },

      // ===== COZINHA E SERVIÇOS GERAIS =====
      { title: 'Repassar restrições alimentares', description: 'A partir das fichas, repassar à cozinha/refeitório restrições e dietas. Repassar aos estagiários medicamentos/necessidades especiais.', priority: 'alta' },
      { title: 'Comprar alimentos para o Encontro', description: 'Almoço sexta (equipe), 1 almoço + 2 jantares (120-160 pessoas), 2 cafés + 2 lanches + 2 ceias, 1 almoço domingo (300-500 pessoas), 1 café extra Alicerce Fornecedores (150-250 pessoas).', priority: 'alta' },
      { title: 'Confirmar materiais para cozinha', description: 'Panelas, bandejas, colheres, facas etc. Prever origem se não tiver no local. Gás e botijão.', priority: 'alta' },
      { title: 'Confirmar pratos, talheres e copos', description: '120-160 para 3 dias. Domingo triplicar ou usar descartáveis.', priority: 'alta' },
      { title: 'Comprar produtos de higienização e diversos', description: 'Água sanitária, álcool, baldes, desinfetante, detergente, esponjas, flanelas, inseticida, luvas, papéis, rodos, vassouras, sacos de lixo, toucas, etc.', priority: 'alta' },
      { title: 'Alugar refresqueira', description: 'Sugerido para facilitar e ter suco o tempo todo. Alugar da Secretaria JUMIRE.', priority: 'baixa' },

      // ===== MATERIAIS PARA CAPELA =====
      { title: 'Confirmar Sacrário-templo para capela', description: 'Com imagem de Nossa Senhora de Lourdes (mini).', priority: 'alta' },
      { title: 'Confirmar ostensório pequeno', description: 'Para exposição do Santíssimo.', priority: 'alta' },
      { title: 'Confirmar mini-betoneira para capela', description: 'Para uso na capela durante o Encontro.', priority: 'media' },
      { title: 'Alugar/adquirir almofadas para capela', description: 'Alugar ou adquirir da Secretaria JUMIRE.', priority: 'media' },
      { title: 'Solicitar Eucaristia para exposição', description: 'Solicitar ao padre ou ministro local.', priority: 'alta' },
      { title: 'Confirmar mesa para Sacrário-templo', description: 'Mesa apropriada para o Sacrário-templo na capela.', priority: 'media' },
      { title: 'Comprar velas de diferentes tamanhos', description: 'Velas para uso na capela.', priority: 'media' },
      { title: 'Arranjar vasos com flores para capela', description: 'Para enfeitar a capela.', priority: 'baixa' },
      { title: 'Confirmar tecidos litúrgicos coloridos', description: 'Tecidos para a capela.', priority: 'media' },
      { title: 'Confirmar mascotes para capela (mínimo 2)', description: 'Ao menos dois mascotes para a capela.', priority: 'baixa' },

      // ===== ESCOLINHAS DE PREPARAÇÃO =====
      { title: 'Agendar 1ª Escolinha de Preparação das Equipes Extras', description: 'Apresentação do Projeto aos casais e adultos. Lectio Divina, estudo das orientações gerais e confecção de lembrancinhas.', priority: 'alta' },
      { title: 'Agendar 2ª Escolinha de Preparação das Equipes Extras', description: 'Aprofundamento do serviço cristão, continuação da confecção de lembrancinhas.', priority: 'alta' },
      { title: 'Agendar 3ª Escolinha de Preparação das Equipes Extras', description: 'Última Escolinha das equipes extras antes do Encontro.', priority: 'alta' },
      { title: 'Agendar Escolinha da Cozinha - 1ª Reunião', description: 'Apresentação do Projeto, Lectio Divina, estudo das orientações e cardápio.', priority: 'alta' },
      { title: 'Agendar Escolinha da Cozinha - 2ª Reunião', description: 'Detalhamento do cardápio, lista de compras, organização da cozinha.', priority: 'alta' },
      { title: 'Agendar Escolinha de Implantação - 1ª Reunião', description: 'Reunião com todos envolvidos na Implantação. Apresentação geral do Projeto.', priority: 'alta' },
      { title: 'Agendar Escolinha de Implantação - 2ª Reunião', description: 'Lectio Divina e estudo das orientações passo a passo.', priority: 'alta' },
      { title: 'Agendar Escolinha de Implantação - 3ª Reunião', description: 'Encaminhamentos finais e confecção de lembrancinhas.', priority: 'alta' },
      { title: 'Agendar Escolinha de Implantação - 4ª Reunião (Betoneira Geral)', description: 'Betoneira Geral Local - quarta Escolinha, envolvendo todos os operários in loco e extras.', priority: 'alta' },
      { title: 'Confirmar Missa de Entrega', description: 'Santa Missa às vésperas do Encontro. Entrega de crachás e camisetas. Reunião geral com últimos orientações.', priority: 'alta' },

      // ===== ALICERCES E ALVENARIAS =====
      { title: 'Atribuir Construtor(a) - Alicerce 1: "Você Tem Valor"', description: 'Pista de reflexão sobre o valor pessoal. Construtor(a) deve preparar a fala e dinâmica.', priority: 'alta' },
      { title: 'Atribuir Construtor(a) - Alicerce 2: "Personalidade e Ideal"', description: 'Reflexão sobre personalidade e ideal de vida.', priority: 'alta' },
      { title: 'Atribuir Construtor(a) - Alicerce 3: "Vícios, DST\'s e Violência"', description: 'Abordagem sobre vícios, DSTs e violência. Sorrido Entre Lágrimas.', priority: 'alta' },
      { title: 'Atribuir Construtor(a) - Alicerce 4: "Revisão de Vida"', description: 'Revisão de vida e visão de mundo.', priority: 'alta' },
      { title: 'Preparar Momento Betoneira', description: 'Momento central: Bênção das Rosas, Alicerce Betoneira, oração da Oferta das Rosas e teatro O Crucificado. Sábado à tarde/noite.', priority: 'alta' },
      { title: 'Atribuir Construtor(a) - Alicerce 6: "Família" (Matérias-primas)', description: 'Reflexão sobre a família para as Matérias-primas no Canteiro de Obras.', priority: 'alta' },
      { title: 'Atribuir Construtor(a) - Alicerce Extra: "Família para Fornecedores"', description: 'Reflexão sobre a família direcionada aos Fornecedores (pais).', priority: 'alta' },
      { title: 'Atribuir Construtor(a) - Alvenaria 1: "Pérola Rara"', description: 'Reflexão sobre o valor único de cada pessoa.', priority: 'alta' },
      { title: 'Atribuir Construtor(a) - Alvenaria 2: "Talentos"', description: 'Descoberta e uso dos talentos pessoais.', priority: 'alta' },
      { title: 'Atribuir Construtor(a) - Alvenaria 3: "Ser Cristão sem Deixar de Ser Jovem"', description: 'Equilíbrio entre fé e juventude.', priority: 'alta' },
      { title: 'Atribuir Construtor(a) - Alvenaria 4: "Amizade"', description: 'Reflexão sobre amizade verdadeira.', priority: 'alta' },
      { title: 'Atribuir Construtor(a) - Alvenaria 5: "Eucaristia"', description: 'Reflexão sobre a Eucaristia.', priority: 'alta' },
      { title: 'Atribuir Construtor(a) - Alvenaria 6: "Maria"', description: 'Reflexão sobre Nossa Senhora.', priority: 'alta' },

      // ===== LEMBRANCINHAS =====
      { title: 'Confeccionar Lembrancinha "Serviço" (Auxiliares)', description: 'Frase: "Servir é amar em ação".', priority: 'media' },
      { title: 'Confeccionar Lembrancinha do Bazar', description: 'Item personalizado da equipe de Bazar.', priority: 'media' },
      { title: 'Confeccionar Lembrancinha da Cozinha', description: 'Item personalizado da equipe de Cozinha.', priority: 'media' },
      { title: 'Confeccionar Lembrancinha da Dinamização', description: 'Item personalizado da equipe de Dinamização.', priority: 'media' },
      { title: 'Confeccionar Lembrancinha da Espiritualização', description: 'Item personalizado da equipe de Espiritualização.', priority: 'media' },
      { title: 'Preparar etiquetas das malas e rosas (Estagiários)', description: 'Etiquetas personalizadas para malas e rosas das Matérias-primas.', priority: 'media' },
      { title: 'Confeccionar Lembrancinha dos MO para Matérias-primas', description: 'Sugestão: mini-betoneira ou item relacionado ao Momento Betoneira.', priority: 'media' },
      { title: 'Preparar Kit do RH (18 modelos padrão)', description: 'Lembrancinhas padrão para o Kit do RH - dezoito modelos já prontos.', priority: 'alta' },
      { title: 'Confeccionar Lembrancinhas para Construtores (13 canecas)', description: 'Lembrancinhas para os 13 Construtores (Alicerces e Alvenarias).', priority: 'media' },
      { title: 'Confeccionar Lembrancinha da Sonorização', description: 'Item personalizado da equipe de Sonorização.', priority: 'media' },

      // ===== FORNECEDORES =====
      { title: 'Confirmar fornecedor - Aluguel do Canteiro de Obras', description: 'Confirmar contrato, valores e datas com o local do Encontro.', priority: 'alta' },
      { title: 'Confirmar fornecedor - Ônibus para o Encontro', description: 'Confirmar empresa de ônibus para transporte das Matérias-primas.', priority: 'alta' },
      { title: 'Confirmar fornecedor - Caminhão de frete', description: 'Confirmar caminhão para transporte de materiais.', priority: 'alta' },
      { title: 'Confirmar fornecedor - Supermercado/Atacadão', description: 'Definir e confirmar fornecedor de alimentos para o Encontro.', priority: 'alta' },
      { title: 'Confirmar fornecedor - Açougue/Frutas e Verduras', description: 'Definir e confirmar fornecedor de carnes, frutas e verduras.', priority: 'alta' },
      { title: 'Confirmar fornecedor - Gráfica (crachás, cartilhas, impressos)', description: 'Definir e confirmar gráfica para materiais impressos.', priority: 'alta' },
      { title: 'Confirmar fornecedor - Banners e placas', description: 'Definir e confirmar fornecedor de banners e placas.', priority: 'media' },
      { title: 'Confirmar fornecedor - Confecção de camisetas', description: 'Definir e confirmar confecção para camisetas do Encontro.', priority: 'alta' },
      { title: 'Confirmar fornecedor - Bíblias (Loja JUMIRE/Pastoral)', description: 'Solicitar Bíblias Edição de Bolso da Pastoral ou Aparecida à Loja JUMIRE.', priority: 'media' },
      { title: 'Confirmar fornecedor - Equipamento de som e iluminação', description: 'Definir e confirmar fornecedor de equipamentos de som.', priority: 'alta' },
      { title: 'Confirmar fornecedor - Datashow, telão e computador', description: 'Definir e confirmar fornecedor de equipamentos audiovisuais.', priority: 'media' },
      { title: 'Confirmar fornecedor - Refletores (aluguel)', description: 'Alugar refletores da Secretaria JUMIRE ou outro fornecedor.', priority: 'media' },
      { title: 'Confirmar fornecedor - Capela (Paróquia)', description: 'Verificar disponibilidade de sacrário, ostensório e velas com o Padre.', priority: 'alta' },
      { title: 'Confirmar fornecedor - Materiais para lembrancinhas', description: 'Definir e confirmar fornecedor de materiais para confecção.', priority: 'media' },
      { title: 'Confirmar fornecedor - TNT, lonas, balões, faixas', description: 'Definir e confirmar fornecedor de materiais de decoração.', priority: 'media' },
      { title: 'Confirmar fornecedor - Rosas para o Momento Betoneira', description: 'Uma rosa por matéria-prima + extras. Confirmar fornecedor.', priority: 'alta' },
      { title: 'Confirmar fornecedor - Artigos da JUMIRE (Bazar)', description: 'Solicitar à Secretaria JUMIRE os artigos para venda no Bazar.', priority: 'media' },
      { title: 'Confirmar fornecedor - Produtos de limpeza e higiene', description: 'Definir e confirmar fornecedor de produtos de higienização.', priority: 'alta' },
      { title: 'Confirmar fornecedor - Refresqueira (aluguel)', description: 'Alugar refresqueira da Secretaria JUMIRE ou outro fornecedor.', priority: 'baixa' },
      { title: 'Confirmar fornecedor - Farmácia (remédios e primeiros socorros)', description: 'Montar caixa de remédios e primeiros socorros.', priority: 'alta' },
      { title: 'Confirmar fornecedor - Hospedagem para Supervisores e Construtores', description: 'Reservar hotel/pousada para Supervisores e Construtores externos.', priority: 'media' },

      // ===== FINANCEIRO =====
      { title: 'Definir taxa de inscrição das Matérias-primas', description: 'Definir valor da taxa de inscrição e prazo para pagamento.', priority: 'alta' },
      { title: 'Organizar sistema de Apadrinhamento', description: 'Definir padrinhos/madrinhas que cobrirão 50-75% da taxa de Matérias-primas.', priority: 'alta' },
      { title: 'Preparar troco para o Bazar', description: 'Prever dinheiro trocado para vendas no Bazar durante o Encontro.', priority: 'media' },
      { title: 'Confirmar recebimento de Betoneiras (cestas/doações)', description: 'Confirmar doações de Betoneiras (cestas básicas, etc.) para o Encontro.', priority: 'media' },
      { title: 'Prever custos de hospedagem de Supervisores e Construtores', description: 'Calcular e provisionar custos de hospedagem e traslado de Supervisores e Construtores externos.', priority: 'media' },

      // ===== DINAMIZAÇÃO =====
      { title: 'Preparar Cruz para O Crucificado (com suporte)', description: 'Confeccionar ou confirmar a cruz com suporte para a dinâmica O Crucificado.', priority: 'alta' },
      { title: 'Preparar materiais da dinamização', description: 'Confirmar todos os materiais para teatros e dinâmicas: coroa de espinhos, figurinos, cenários.', priority: 'alta' },

      // ===== RH =====
      { title: 'Confirmar lista final de Matérias-primas inscritas', description: 'Fechar inscrições e confirmar lista final de Matérias-primas com nomes completos.', priority: 'alta' },
      { title: 'Confirmar pagamento das taxas das Matérias-primas', description: 'Acompanhar pagamentos e confirmar quem quitou a taxa de inscrição.', priority: 'alta' },
      { title: 'Preparar saquinhos para celulares e objetos pessoais', description: 'Saquinhos etiquetados para recolher celulares e objetos das Matérias-primas na chegada.', priority: 'media' },

      // ===== ESTRUTURA/MONTAGEM =====
      { title: 'Preparar placas com nomes dos ambientes e alicerces', description: 'Placas identificando cada ambiente e alicerce no Canteiro de Obras.', priority: 'media' },
      { title: 'Preparar TNT/tecido xadrez para piquenique', description: 'Tecidos para o piquenique do domingo (Super Fantástico).', priority: 'baixa' },
      { title: 'Comprar foguetes (chegada das Matérias-primas)', description: 'Foguetes para comemorar a chegada das Matérias-primas no Canteiro de Obras.', priority: 'baixa' },
      { title: 'Preparar Papel Kraft para mural das Betoneiras', description: 'Papel kraft para o mural onde as Betoneiras serão fixadas.', priority: 'baixa' },
      { title: 'Preparar folhetos de missa para Missa de Encerramento', description: 'Imprimir folhetos de missa para a Missa de Encerramento no domingo.', priority: 'media' },
    ];

    const existing = db.getAll('lembretes');
    if (existing.length > 0) {
      console.log(`  [V3] Lembretes already exist (${existing.length}). Skipping.`);
      return;
    }

    let count = 0;
    for (const l of lembretes) {
      db.insert('lembretes', {
        title: l.title,
        description: l.description,
        due_date: null,
        priority: l.priority || 'media',
        related_task_id: null,
        status: 'pendente'
      });
      count++;
    }

    console.log(`  [V3] Inserted ${count} lembretes (pre-encontro checklist)`);
    console.log('[V3] Lembretes seed complete.');
  },
};
