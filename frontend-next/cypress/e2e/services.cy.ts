describe('Services Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/services');
  });

  it('should display services page', () => {
    cy.contains('Serviços').should('be.visible');
    cy.contains('Novo Serviço').should('be.visible');
  });

  it('should open create dialog', () => {
    cy.contains('Novo Serviço').click();
    cy.get('input[label="Nome"]').should('be.visible');
    cy.get('input[label="Preço"]').should('be.visible');
    cy.get('input[label="Duração"]').should('be.visible');
  });

  it('should have category filter autocomplete', () => {
    cy.get('input[label*="categoria"]').should('be.visible');
  });

  it('should have category autocomplete in dialog', () => {
    cy.contains('Novo Serviço').click();
    cy.get('input[label="Categoria"]').should('be.visible');
  });

  it('should have home attendance switch', () => {
    cy.contains('Novo Serviço').click();
    cy.contains('Atendimento domiciliar').should('be.visible');
  });
});
