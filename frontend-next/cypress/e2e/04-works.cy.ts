describe('CRUD Trabalhos (Works)', () => {
  beforeEach(() => {
    cy.loginAsProvider();
    cy.visit('/works');
    cy.contains('Trabalhos', { timeout: 15000 }).should('be.visible');
  });

  afterEach(() => {
    cy.logout();
  });

  it('deve exibir a página de trabalhos', () => {
    cy.contains('Trabalhos').should('be.visible');
    cy.contains('Novo Trabalho').should('be.visible');
  });

  it('deve criar um novo trabalho', () => {
    const title = `Trabalho Cypress ${Date.now()}`;
    cy.contains('Novo Trabalho').click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.contains('label', 'Título').parent().find('input').type(title);
    cy.get('textarea').first().type('Descrição do trabalho de teste');
    cy.get('input[type="number"]').first().type('500');
    cy.get('button').contains('Salvar').click();
    cy.contains(title, { timeout: 10000 }).should('be.visible');
  });

  it('deve editar um trabalho existente', () => {
    const title = `Trabalho Edit ${Date.now()}`;
    cy.contains('Novo Trabalho').click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.contains('label', 'Título').parent().find('input').type(title);
    cy.get('input[type="number"]').first().type('300');
    cy.get('button').contains('Salvar').click();
    cy.contains(title, { timeout: 10000 }).should('be.visible');

    cy.contains(title).parent().parent().find('button').first().click({ force: true });
    cy.get('.MuiDialog-root').should('be.visible');
    cy.contains('label', 'Título').parent().find('input').clear({ force: true }).type(`${title} Editado`, { force: true });
    cy.get('button').contains('Salvar').click();
    cy.contains(`${title} Editado`, { timeout: 10000 }).should('be.visible');
  });

  it('deve excluir um trabalho', () => {
    const title = `Trabalho Del ${Date.now()}`;
    cy.contains('Novo Trabalho').click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.contains('label', 'Título').parent().find('input').type(title);
    cy.get('input[type="number"]').first().type('100');
    cy.get('button').contains('Salvar').click();
    cy.contains(title, { timeout: 10000 }).should('be.visible');

    cy.contains(title).parent().parent().find('button').eq(1).click({ force: true });
    cy.get('button[aria-label="Excluir"]').click({ force: true });
    cy.contains(title, { timeout: 10000 }).should('not.exist');
  });

  it('deve adicionar campo personalizado ao trabalho', () => {
    const title = `Trabalho Campos ${Date.now()}`;
    cy.contains('Novo Trabalho').click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.contains('label', 'Título').parent().find('input').type(title);
    cy.get('input[type="number"]').first().type('250');
    cy.contains('Adicionar').click();
    cy.contains('label', 'Rótulo').parent().find('input').first().type('Rótulo Teste');
    cy.contains('label', 'Nome').parent().find('input').first().type('nome_teste');
    cy.get('button').contains('Salvar').click();
    cy.contains(title, { timeout: 10000 }).should('be.visible');
  });

  it('deve listar trabalhos existentes do seed', () => {
    cy.get('.MuiCard-root', { timeout: 10000 }).should('have.length.gte', 1);
  });
});
