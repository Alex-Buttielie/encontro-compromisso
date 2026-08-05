describe('Dashboard', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/dashboard');
  });

  it('should display dashboard with stats cards', () => {
    cy.contains('Dashboard').should('be.visible');
  });

  it('should display navigation drawer items', () => {
    cy.contains('Agenda');
    cy.contains('Clientes');
    cy.contains('Serviços');
    cy.contains('Financeiro');
  });
});
