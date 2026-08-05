describe('Agenda Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/agenda');
  });

  it('should display agenda page', () => {
    cy.contains('Agenda').should('be.visible');
  });

  it('should show new appointment button', () => {
    cy.contains('Novo').should('be.visible');
  });
});

describe('Explore Page', () => {
  beforeEach(() => {
    cy.login('client@test.com', 'password123');
    cy.visit('/explore');
  });

  it('should display explore page', () => {
    cy.contains('Explorar').should('be.visible');
  });

  it('should have search field', () => {
    cy.get('input[placeholder*="Buscar"]').should('be.visible');
  });
});

describe('Works Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/works');
  });

  it('should display works page', () => {
    cy.contains('Trabalhos').should('be.visible');
    cy.contains('Novo Trabalho').should('be.visible');
  });

  it('should open create dialog', () => {
    cy.contains('Novo Trabalho').click();
    cy.get('input[label="Título"]').should('be.visible');
    cy.get('input[label="Preço"]').should('be.visible');
  });
});

describe('Finance Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/finance');
  });

  it('should display finance page', () => {
    cy.contains('Financeiro').should('be.visible');
  });
});

describe('Wallet Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/wallet');
  });

  it('should display wallet page', () => {
    cy.contains('Carteira').should('be.visible');
  });
});

describe('Payments Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/payments');
  });

  it('should display payments page', () => {
    cy.contains('Pagamento').should('be.visible');
  });
});

describe('Packages Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/packages');
  });

  it('should display packages page', () => {
    cy.contains('Pacote').should('be.visible');
  });
});

describe('Gift Cards Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/gift-cards');
  });

  it('should display gift cards page', () => {
    cy.contains('Gift').should('be.visible');
  });
});

describe('Loyalty Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/loyalty');
  });

  it('should display loyalty page', () => {
    cy.contains('Fidel').should('be.visible');
  });
});

describe('CRM Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/crm');
  });

  it('should display CRM page', () => {
    cy.contains('CRM').should('be.visible');
  });
});

describe('Inventory Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/inventory');
  });

  it('should display inventory page', () => {
    cy.contains('Estoque').should('be.visible');
  });
});

describe('Marketing Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/marketing');
  });

  it('should display marketing page', () => {
    cy.contains('Marketing').should('be.visible');
  });
});

describe('Analytics Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/analytics');
  });

  it('should display analytics page', () => {
    cy.contains('Analytics').should('be.visible');
  });
});

describe('Employees Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/employees');
  });

  it('should display employees page', () => {
    cy.contains('Equipe').should('be.visible');
  });
});

describe('Commissions Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/commissions');
  });

  it('should display commissions page', () => {
    cy.contains('Comiss').should('be.visible');
  });
});

describe('Branches Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/branches');
  });

  it('should display branches page', () => {
    cy.contains('Unidade').should('be.visible');
  });
});

describe('Chat Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/chat');
  });

  it('should display chat page', () => {
    cy.contains('Chat').should('be.visible');
  });
});

describe('Social Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/social');
  });

  it('should display social feed page', () => {
    cy.contains('Social').should('be.visible');
  });
});

describe('Notifications Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/notifications');
  });

  it('should display notifications page', () => {
    cy.contains('Notifica').should('be.visible');
  });
});

describe('Workflows Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/workflows');
  });

  it('should display workflows page', () => {
    cy.contains('Automa').should('be.visible');
  });
});

describe('Home Care Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/homecare');
  });

  it('should display homecare page', () => {
    cy.url().should('include', '/homecare');
  });
});

describe('Contracts Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/contracts');
  });

  it('should display contracts page', () => {
    cy.contains('Contrato').should('be.visible');
  });
});

describe('Quotes Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/quotes');
  });

  it('should display quotes page', () => {
    cy.contains('Orçamento').should('be.visible');
  });
});

describe('Subscriptions Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/subscriptions');
  });

  it('should display subscriptions page', () => {
    cy.contains('Assinatura').should('be.visible');
  });
});

describe('Referrals Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/referrals');
  });

  it('should display referrals page', () => {
    cy.contains('Indica').should('be.visible');
  });
});

describe('AI Agents Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/ai-agents');
  });

  it('should display AI agents page', () => {
    cy.url().should('include', '/ai-agents');
  });
});

describe('Admin Page', () => {
  beforeEach(() => {
    cy.login('admin@test.com', 'password123');
    cy.visit('/admin');
  });

  it('should display admin page', () => {
    cy.url().should('include', '/admin');
  });
});

describe('API Keys Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/api-keys');
  });

  it('should display API keys page', () => {
    cy.url().should('include', '/api-keys');
  });
});

describe('Webhooks Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/webhooks');
  });

  it('should display webhooks page', () => {
    cy.contains('Webhook').should('be.visible');
  });
});

describe('LGPD Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/lgpd');
  });

  it('should display LGPD page', () => {
    cy.contains('LGPD').should('be.visible');
  });
});

describe('Feature Flags Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/feature-flags');
  });

  it('should display feature flags page', () => {
    cy.url().should('include', '/feature-flags');
  });
});

describe('Profile Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/profile');
  });

  it('should display profile page', () => {
    cy.contains('Perfil').should('be.visible');
  });

  it('should have profession autocomplete', () => {
    cy.get('input[label*="Profissão"]').should('exist');
  });

  it('should have address fields with CEP', () => {
    cy.get('input[label*="CEP"]').should('exist');
  });
});
