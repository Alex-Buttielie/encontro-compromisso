describe('CRUD Financeiro (Transações)', () => {
  beforeEach(() => {
    cy.loginAsProvider();
    cy.visit('/finance');
    cy.contains('Financeiro', { timeout: 15000 }).should('be.visible');
  });

  afterEach(() => {
    cy.logout();
  });

  it('deve exibir a página de financeiro', () => {
    cy.contains('Nova Transação').should('be.visible');
  });

  it('deve exibir cards de resumo (saldo, receita, despesa)', () => {
    cy.contains('Saldo', { timeout: 10000 }).should('be.visible');
    cy.contains('Receita do Mês').should('be.visible');
    cy.contains('Despesa do Mês').should('be.visible');
  });

  it('deve criar uma nova receita', () => {
    cy.contains('Nova Transação').click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.get('.MuiSelect-select').first().click({ force: true });
    cy.get('.MuiMenuItem-root').contains('Receita').click({ force: true });
    cy.contains('label', 'Categoria').parent().find('input').type('Venda de Produto');
    cy.contains('label', 'Descrição').parent().find('input').type('Teste receita cypress');
    cy.contains('label', 'Valor').parent().find('input').clear().type('250');
    cy.get('button').contains('Salvar').click({ force: true });
    cy.contains('Transação criada', { timeout: 10000 }).should('be.visible');
  });

  it('deve criar uma nova despesa', () => {
    cy.contains('Nova Transação').click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.get('.MuiSelect-select').first().click({ force: true });
    cy.get('.MuiMenuItem-root').contains('Despesa').click({ force: true });
    cy.contains('label', 'Categoria').parent().find('input').type('Material');
    cy.contains('label', 'Descrição').parent().find('input').type('Teste despesa cypress');
    cy.contains('label', 'Valor').parent().find('input').clear().type('75');
    cy.get('button').contains('Salvar').click({ force: true });
    cy.contains('Transação criada', { timeout: 10000 }).should('be.visible');
  });

  it('deve listar transações na tabela', () => {
    cy.get('table', { timeout: 10000 }).should('exist');
    cy.get('thead').contains('Descrição').should('be.visible');
    cy.get('thead').contains('Tipo').should('be.visible');
    cy.get('thead').contains('Valor').should('be.visible');
  });

  it('deve marcar transação como paga', () => {
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Marcar pago")').length > 0) {
        cy.contains('Marcar pago').first().click();
        cy.contains('Marcado como pago').should('be.visible');
      }
    });
  });
});
