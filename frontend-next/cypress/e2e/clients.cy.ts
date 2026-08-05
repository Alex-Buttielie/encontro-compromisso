describe('Clients Page', () => {
  beforeEach(() => {
    cy.login('provider@test.com', 'password123');
    cy.visit('/clients');
  });

  it('should display clients page with header', () => {
    cy.contains('Clientes').should('be.visible');
    cy.contains('Novo Cliente').should('be.visible');
  });

  it('should open create dialog when clicking Novo Cliente', () => {
    cy.contains('Novo Cliente').click();
    cy.contains('Novo Cliente').should('be.visible');
    cy.get('input[name="name"], input[label="Nome"]').should('be.visible');
  });

  it('should fill client form fields', () => {
    cy.contains('Novo Cliente').click();
    cy.get('input[label="Nome"]').type('João Silva');
    cy.get('input[label="E-mail"]').type('joao@example.com');
    cy.get('input[label="Telefone"]').type('11999999999');
  });

  it('should have search autocomplete', () => {
    cy.get('input[placeholder*="Buscar"]').should('be.visible');
  });
});
