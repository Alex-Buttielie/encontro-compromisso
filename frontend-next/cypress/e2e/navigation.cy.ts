describe('Provider dashboard and navigation', () => {
  beforeEach(() => {
    cy.loginAsProvider();
  });

  it('should display dashboard with stats', () => {
    cy.visit('/dashboard');
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Receita do Mês').should('be.visible');
    cy.contains('Total de Clientes').should('be.visible');
    cy.contains('Próximos Agendamentos').should('be.visible');
    cy.contains('Pedidos Pendentes').should('be.visible');
  });

  it('should navigate to clients page', () => {
    cy.visit('/clients');
    cy.contains('Clientes').should('be.visible');
  });

  it('should navigate to services page', () => {
    cy.visit('/services');
    cy.contains('Serviços').should('be.visible');
  });

  it('should navigate to agenda page', () => {
    cy.visit('/agenda');
    cy.contains('Agenda').should('be.visible');
  });

  it('should navigate to finance page', () => {
    cy.visit('/finance');
    cy.contains('Finanças').should('be.visible');
  });

  it('should navigate to payments page', () => {
    cy.visit('/payments');
    cy.contains('Pagamentos').should('be.visible');
  });

  it('should navigate to wallet page', () => {
    cy.visit('/wallet');
    cy.contains('Carteira').should('be.visible');
  });

  it('should navigate to packages page', () => {
    cy.visit('/packages');
    cy.contains('Pacotes').should('be.visible');
  });

  it('should navigate to gift-cards page', () => {
    cy.visit('/gift-cards');
    cy.contains('Gift Cards').should('be.visible');
  });

  it('should navigate to subscriptions page', () => {
    cy.visit('/subscriptions');
    cy.contains('Assinaturas').should('be.visible');
  });

  it('should navigate to employees page', () => {
    cy.visit('/employees');
    cy.contains('Equipe').should('be.visible');
  });

  it('should navigate to commissions page', () => {
    cy.visit('/commissions');
    cy.contains('Comissões').should('be.visible');
  });

  it('should navigate to branches page', () => {
    cy.visit('/branches');
    cy.contains('Filiais').should('be.visible');
  });

  it('should navigate to contracts page', () => {
    cy.visit('/contracts');
    cy.contains('Contratos').should('be.visible');
  });

  it('should navigate to inventory page', () => {
    cy.visit('/inventory');
    cy.contains('Estoque').should('be.visible');
  });

  it('should navigate to quotes page', () => {
    cy.visit('/quotes');
    cy.contains('Orçamentos').should('be.visible');
  });

  it('should navigate to marketing page', () => {
    cy.visit('/marketing');
    cy.contains('Marketing').should('be.visible');
  });

  it('should navigate to loyalty page', () => {
    cy.visit('/loyalty');
    cy.contains('Fidelidade').should('be.visible');
  });

  it('should navigate to social page', () => {
    cy.visit('/social');
    cy.contains('Social').should('be.visible');
  });

  it('should navigate to workflows page', () => {
    cy.visit('/workflows');
    cy.contains('Workflows').should('be.visible');
  });

  it('should navigate to analytics page', () => {
    cy.visit('/analytics');
    cy.contains('Analytics').should('be.visible');
  });

  it('should navigate to CRM page', () => {
    cy.visit('/crm');
    cy.contains('CRM').should('be.visible');
  });

  it('should navigate to homecare page', () => {
    cy.visit('/homecare');
    cy.contains('Atendimento Domiciliar').should('be.visible');
  });

  it('should navigate to referrals page', () => {
    cy.visit('/referrals');
    cy.contains('Indicações').should('be.visible');
  });

  it('should navigate to profile page', () => {
    cy.visit('/profile');
    cy.contains('Perfil').should('be.visible');
  });

  it('should navigate to notifications page', () => {
    cy.visit('/notifications');
    cy.contains('Notificações').should('be.visible');
  });

  it('should navigate to chat page', () => {
    cy.visit('/chat');
    cy.contains('Chat').should('be.visible');
  });

  it('should navigate to admin page', () => {
    cy.visit('/admin');
    cy.contains('Admin').should('be.visible');
  });

  it('should navigate to api-keys page', () => {
    cy.visit('/api-keys');
    cy.contains('API Keys').should('be.visible');
  });

  it('should navigate to webhooks page', () => {
    cy.visit('/webhooks');
    cy.contains('Webhooks').should('be.visible');
  });

  it('should navigate to feature-flags page', () => {
    cy.visit('/feature-flags');
    cy.contains('Feature Flags').should('be.visible');
  });

  it('should navigate to lgpd page', () => {
    cy.visit('/lgpd');
    cy.contains('LGPD').should('be.visible');
  });
});
