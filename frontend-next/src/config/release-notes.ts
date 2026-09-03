export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const CURRENT_VERSION = '1.63.0';

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.63.0',
    date: '2026-08-06',
    title: 'Navegação em 5 Etapas — Manual dos Mestres de Obras',
    changes: [
      'Nova arquitetura de navegação em 5 Etapas: Fundação → Captação → Obra → Acabamento → Entrega (Manual Mestres p.11-15)',
      'Drawer colapsável por etapa, Stepper horizontal no AppBar e Breadcrumb estrutural',
      'Busca rápida global (Ctrl+K / /) com Command Palette por nome/rota/descrição',
      'Onboarding por etapa, PageHeader com chip de etapa e componente EmptyState com CTA',
      'Correção ReleaseNotesDialog e uiSlice (hydrateUi/startOnboarding por etapa)',
      'Cypress 09-navigation atualizado para etapas; .gitignore ignora frontend-next/.next',
    ],
  },
  {
    version: '1.61.0',
    date: '2026-08-05',
    title: 'Relatório Detalhado de Orçamento com 7 Seções',
    changes: [
      'Relatório reformulado com 7 seções: resumo executivo (10 cards), barras de progresso e totais por categoria',
      'Análise por status, alerta de itens sem cotação e variância estimado vs real',
      'Resumo financeiro integrando doações e despesas; rodapé com data/hora',
    ],
  },
  {
    version: '1.60.0',
    date: '2026-08-05',
    title: 'Itens de Orçamento Unificados (98 Insumos)',
    changes: [
      'Migration V13 com 98 itens unificados para o XV Compromisso Trin (44 com valores, 54 a definir)',
      '12 categorias; sistema anti-duplicação',
    ],
  },
  {
    version: '1.59.0',
    date: '2026-08-05',
    title: 'Avisos Automáticos de Versão no Frontend',
    changes: [
      'Dialog de release notes automático detectando nova versão via localStorage',
      'Exibição de versão, data, título e mudanças com formatação',
    ],
  },
  {
    version: '1.58.0',
    date: '2026-08-05',
    title: 'Correção do Módulo de Estoque',
    changes: [
      'Alinhamento dos campos do frontend com backend (currentStock/minStock)',
      'Filtro por categoria e busca por nome no estoque',
    ],
  },
  {
    version: '1.57.0',
    date: '2026-08-05',
    title: 'Sistema Profissional-OS com Lista de Compras Unificada',
    changes: [
      'Sistema profissional-os com seed de 98 insumos para o XV Compromisso Trin',
      'Provider user automático e seed Firestore/JSON DB',
    ],
  },
  {
    version: '1.56.0',
    date: '2026-07-31',
    title: 'Correção de sincronização + Versão Mobile do Financeiro',
    changes: [
      'Corrigido loop de re-renderização do módulo financeiro em mobile',
      'Tab bar scrollável, carrossel de cards e modais em tela cheia no mobile',
    ],
  },
];
