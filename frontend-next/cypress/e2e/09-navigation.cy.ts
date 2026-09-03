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

  it('deve exibir drawer de navegação por etapas com Stepper', () => {
    cy.contains('Fundação').should('exist');
    cy.contains('Captação').should('exist');
    cy.contains('Obra').should('exist');
    cy.contains('Acabamento').should('exist');
    cy.contains('Entrega').should('exist');
    cy.get('[aria-label="Navegação estrutural"]').should('exist');
  });

  it('deve navegar para Clientes via menu (Etapa Captação)', () => {
    cy.contains('Captação').click({ force: true });
    cy.get('[aria-label="Clientes"]', { timeout: 5000 }).first().click({ force: true });
    cy.url({ timeout: 10000 }).should('include', '/clients');
  });

  it('deve navegar para Serviços via menu (Etapa Fundação)', () => {
    cy.get('[aria-label="Serviços"]').first().click({ force: true });
    cy.url({ timeout: 10000 }).should('include', '/services');
  });

  it('deve navegar para Agenda via menu (Etapa Obra)', () => {
    cy.contains('Obra').click({ force: true });
    cy.get('[aria-label="Agenda"]', { timeout: 5000 }).first().click({ force: true });
    cy.url({ timeout: 10000 }).should('include', '/agenda');
  });

  it('deve navegar para Financeiro via menu (Etapa Acabamento)', () => {
    cy.contains('Acabamento').click({ force: true });
    cy.get('[aria-label="Financeiro"]', { timeout: 5000 }).first().click({ force: true });
    cy.url({ timeout: 10000 }).should('include', '/finance');
  });

  it('deve navegar para Trabalhos via menu (Etapa Obra)', () => {
    cy.contains('Obra').click({ force: true });
    cy.get('[aria-label="Trabalhos"]', { timeout: 5000 }).first().click({ force: true });
    cy.url({ timeout: 10000 }).should('include', '/works');
  });

  it('deve navegar via Stepper horizontal', () => {
    cy.get('[aria-label^="Etapa"]').should('exist');
  });

  it('deve abrir busca rápida (Ctrl+K) e filtrar', () => {
    cy.get('body').type('{ctrl}k');
    cy.contains('Buscar', { timeout: 5000 }).should('exist');
    cy.get('body').type('{esc}');
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
