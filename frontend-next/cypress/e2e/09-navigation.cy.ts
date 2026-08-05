describe('Navegação e Layout', () => {
  beforeEach(() => {
    cy.loginAsProvider();
    cy.viewport(1280, 720);
    cy.visit('/dashboard');
    cy.contains('Dashboard', { timeout: 15000 }).should('be.visible');
  });

  afterEach(() => {
    cy.logout();
  });

  it('deve redirecionar provider para dashboard após login', () => {
    cy.url().should('include', '/dashboard');
  });

  it('deve exibir drawer de navegação com seções', () => {
    cy.contains('Principal').should('exist');
    cy.contains('Operação').should('exist');
  });

  it('deve navegar para Clientes via menu', () => {
    cy.get('[aria-label="Clientes"]').first().click({ force: true });
    cy.url({ timeout: 10000 }).should('include', '/clients');
  });

  it('deve navegar para Serviços via menu', () => {
    cy.get('[aria-label="Serviços"]').first().click({ force: true });
    cy.url({ timeout: 10000 }).should('include', '/services');
  });

  it('deve navegar para Agenda via menu', () => {
    cy.get('[aria-label="Agenda"]').first().click({ force: true });
    cy.url({ timeout: 10000 }).should('include', '/agenda');
  });

  it('deve navegar para Financeiro via menu', () => {
    cy.get('[aria-label="Financeiro"]').first().click({ force: true });
    cy.url({ timeout: 10000 }).should('include', '/finance');
  });

  it('deve navegar para Trabalhos via menu', () => {
    cy.get('[aria-label="Trabalhos"]').first().click({ force: true });
    cy.url({ timeout: 10000 }).should('include', '/works');
  });

  it('deve ter toggle de tema (dark/light)', () => {
    cy.get('button[aria-label*="modo" i], button[aria-label*="theme" i], button[aria-label*="Tema" i]').should('exist');
  });

  it('deve abrir menu do usuário ao clicar no avatar', () => {
    cy.get('[aria-label="Menu do usuário"]').click({ force: true });
    cy.get('[role="menu"]').should('be.visible');
    cy.get('[aria-label="Ir para perfil"]').should('be.visible');
    cy.get('[aria-label="Sair da conta"]').should('be.visible');
  });
});
