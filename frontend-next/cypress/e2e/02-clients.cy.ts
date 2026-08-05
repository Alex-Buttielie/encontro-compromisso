describe('CRUD Clientes', () => {
  beforeEach(() => {
    cy.loginAsProvider();
    cy.visit('/clients');
    cy.contains('Clientes', { timeout: 15000 }).should('be.visible');
  });

  afterEach(() => {
    cy.logout();
  });

  it('deve exibir a página de clientes', () => {
    cy.contains('Clientes').should('be.visible');
    cy.contains('Novo Cliente').should('be.visible');
  });

  it('deve criar um novo cliente', () => {
    const name = `Cliente Cypress ${Date.now()}`;
    cy.contains('Novo Cliente').click();
    cy.get('input[name="name"]').type(name);
    cy.get('input[name="email"]').type(`${Date.now()}@cliente.com`);
    cy.get('input[name="phone"]').type('(11) 98888-9999');
    cy.get('button[type="submit"]').contains('Salvar').click();
    cy.contains(name).should('be.visible');
  });

  it('deve editar um cliente existente', () => {
    cy.contains('Novo Cliente').click();
    const name = `Cliente Editar ${Date.now()}`;
    cy.get('input[name="name"]').type(name);
    cy.get('input[name="email"]').type(`editar.${Date.now()}@cliente.com`);
    cy.get('button[type="submit"]').contains('Salvar').click();
    cy.contains(name).should('be.visible');

    cy.contains(name).parent().parent().find('button').first().click();
    cy.get('input[name="name"]').clear().type(`${name} Editado`);
    cy.get('button[type="submit"]').contains('Salvar').click();
    cy.contains(`${name} Editado`).should('be.visible');
  });

  it('deve excluir um cliente', () => {
    cy.contains('Novo Cliente').click();
    const name = `Cliente Excluir ${Date.now()}`;
    cy.get('input[name="name"]').type(name);
    cy.get('input[name="email"]').type(`excluir.${Date.now()}@cliente.com`);
    cy.get('button[type="submit"]').contains('Salvar').click();
    cy.contains(name).should('be.visible');

    cy.contains(name).parent().parent().find('button').eq(1).click({ force: true });
    cy.get('button[aria-label="Excluir"]').click({ force: true });
    cy.contains(name, { timeout: 10000 }).should('not.exist');
  });

  it('deve buscar clientes', () => {
    cy.get('input[placeholder*="Buscar"]').should('exist');
  });

  it('deve validar campo obrigatório de nome', () => {
    cy.contains('Novo Cliente').click();
    cy.get('input[name="email"]').type('semnome@teste.com');
    cy.get('button[type="submit"]').contains('Salvar').click();
    cy.contains('Nome é obrigatório').should('be.visible');
  });
});
