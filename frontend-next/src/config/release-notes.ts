export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const CURRENT_VERSION = '1.58.0';

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.58.0',
    date: '2026-08-05',
    title: 'Correção do módulo de Estoque/Orçamento',
    changes: [
      'Corrigida incompatibilidade de campos entre frontend e backend no módulo de estoque',
      'Tipo InventoryItem atualizado para refletir os campos reais do Product (currentStock, minStock, category, unit, belowMinimum)',
      'Adicionado filtro por categoria e busca por nome na página de estoque',
      'Total estimado dos itens exibido em tempo real conforme filtros',
      'Formulário de criação agora inclui campos de categoria e unidade',
    ],
  },
  {
    version: '1.57.0',
    date: '2026-08-05',
    title: 'Carga de orçamento do XV Compromisso Trin',
    changes: [
      'Script de seed com 98 itens da lista unificada de compras do XV Compromisso Trin',
      'Itens organizados em 11 categorias: Carnes e Frios, Padaria e Laticínios, Mercearia, Hortifruti, Cozinha e Descartáveis, Identificação e Papelaria, Kits e Embalagens, Decoração, Capela e Encenações, Estrutura e Equipamentos, Eventos e Materiais Gerais',
      '44 itens com valor estimado total de R$ 13.885,00 baseado em atacadistas de Goiás',
      '54 itens sem valor para preenchimento posterior após cotações',
      'Usuário provider criado automaticamente se não existir',
    ],
  },
  {
    version: '1.56.0',
    date: '2026-07-31',
    title: 'Correção de sincronização + Versão Mobile do Financeiro',
    changes: [
      'Corrigido loop de re-renderização do módulo financeiro em mobile',
      'Tab bar do financeiro horizontalmente scrollável com scroll suave',
      'Cards de resumo em carrossel horizontal em telas pequenas (<=480px)',
      'Modais em tela cheia no mobile com inputs em font-size 15px (previne zoom no iOS)',
      'Botões com alvos de toque maiores (36px) para mobile',
    ],
  },
  {
    version: '1.55.0',
    date: '2026-07-31',
    title: 'Fechamento de Caixa Mensal no Financeiro',
    changes: [
      "Nova aba 'Fechamento' no módulo financeiro",
      'Seleção de mês para visualizar lançamentos e totais do período',
      'Resumo do mês: receitas pagas, despesas pagas, saldo, pendentes',
      'Fechar mês com modal de confirmação (notas + responsável)',
      'Reabrir mês fechado e visualizar notas do fechamento',
      'Histórico de meses fechados com totais e data',
    ],
  },
  {
    version: '1.54.0',
    date: '2026-07-31',
    title: 'Envio de Checklist por WhatsApp (CallMeBot)',
    changes: [
      'Integração com CallMeBot API para envio automático de WhatsApp',
      "Botão 'Enviar WhatsApp' no módulo de checklist para envio manual",
      'Envio automático diário via cron com horário configurável',
      'Mensagem gerada com resumo geral, tarefas por categoria e por equipe',
      'Fallback para wa.me link quando CallMeBot não está configurado',
    ],
  },
];
