describe('CRUD Serviços', () => {
  beforeEach(() => {
    cy.loginAsProvider();
    cy.visit('/services');
    cy.contains('Serviços', { timeout: 15000 }).should('be.visible');
  });

  afterEach(() => {
    cy.logout();
  });

  it('deve exibir a página de serviços', () => {
    cy.contains('Serviços').should('be.visible');
    cy.contains('Novo Serviço').should('be.visible');
  });

  it('deve criar um novo serviço', () => {
    const name = `Serviço Cypress ${Date.now()}`;
    cy.contains('Novo Serviço').click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.contains('label', 'Nome').parent().find('input').type(name);
    cy.get('textarea').first().type('Descrição do serviço de teste');
    cy.get('input[type="number"]').eq(0).type('150');
    cy.get('input[type="number"]').eq(1).type('60');
    cy.get('button').contains('Salvar').click();
    cy.contains(name, { timeout: 10000 }).should('be.visible');
  });

  it('deve editar um serviço existente', () => {
    const name = `Serviço Edit ${Date.now()}`;
    cy.contains('Novo Serviço').click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.contains('label', 'Nome').parent().find('input').type(name);
    cy.get('input[type="number"]').eq(0).type('200');
    cy.get('input[type="number"]').eq(1).type('45');
    cy.get('button').contains('Salvar').click();
    cy.contains(name, { timeout: 10000 }).should('be.visible');

    cy.contains(name).parent().parent().find('button').first().click({ force: true });
    cy.get('.MuiDialog-root').should('be.visible');
    cy.contains('label', 'Nome').parent().find('input').clear().type(`${name} Editado`);
    cy.get('button').contains('Salvar').click();
    cy.contains(`${name} Editado`, { timeout: 10000 }).should('be.visible');
  });

  it('deve excluir um serviço', () => {
    const name = `Serviço Del ${Date.now()}`;
    cy.contains('Novo Serviço').click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.contains('label', 'Nome').parent().find('input').type(name);
    cy.get('input[type="number"]').eq(0).type('50');
    cy.get('input[type="number"]').eq(1).type('30');
    cy.get('button').contains('Salvar').click();
    cy.contains(name, { timeout: 10000 }).should('be.visible');

    cy.contains(name).parent().parent().find('button').eq(1).click({ force: true });
    cy.get('button[aria-label="Excluir"]').click({ force: true });
    cy.contains(name, { timeout: 10000 }).should('not.exist');
  });

  it('deve listar serviços existentes do seed', () => {
    cy.get('.MuiCard-root', { timeout: 10000 }).should('have.length.gte', 1);
  });
});
