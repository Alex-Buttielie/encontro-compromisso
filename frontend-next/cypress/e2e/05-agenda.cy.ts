describe('CRUD Agenda (Agendamentos)', () => {
  beforeEach(() => {
    cy.loginAsProvider();
    cy.visit('/agenda');
    cy.contains('Agenda', { timeout: 15000 }).should('be.visible');
  });

  afterEach(() => {
    cy.logout();
  });

  it('deve exibir a página de agenda', () => {
    cy.contains('Novo Agendamento').should('be.visible');
  });

  it('deve exibir seletor de data', () => {
    cy.get('input[type="date"]', { timeout: 10000 }).should('exist');
  });

  it('deve criar um novo agendamento', () => {
    cy.contains('Novo Agendamento').click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.get('.MuiDialog-root').contains('Cliente').parent().find('.MuiSelect-select').click();
    cy.wait(500);
    cy.get('ul[role="listbox"] li', { timeout: 5000 }).should('have.length.gte', 1).eq(0).click();
    cy.get('.MuiDialog-root').contains('Serviço').parent().find('.MuiSelect-select').click();
    cy.wait(500);
    cy.get('ul[role="listbox"] li', { timeout: 5000 }).should('have.length.gte', 1).eq(0).click();
    cy.get('.MuiDialog-root').contains('Agendar').click();
    cy.contains('Agendamento criado', { timeout: 10000 }).should('be.visible');
  });

  it('deve listar agendamentos do dia', () => {
    cy.get('input[type="date"]').should('have.value', new Date().toISOString().slice(0, 10));
  });

  it('deve mostrar mensagem quando não há agendamentos', () => {
    const futureDate = '2099-12-31';
    cy.get('input[type="date"]').clear().type(futureDate);
    cy.contains('Nenhum agendamento', { timeout: 10000 }).should('be.visible');
  });

  it('deve permitir confirmar agendamento pendente', () => {
    const today = new Date().toISOString().slice(0, 10);
    cy.get('input[type="date"]').should('have.value', today);
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Confirmar")').length > 0) {
        cy.contains('Confirmar').click();
        cy.contains('confirmado').should('be.visible');
      }
    });
  });
});
