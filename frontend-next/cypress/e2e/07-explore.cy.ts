describe('Explorar Serviços e Pedidos (Client)', () => {
  beforeEach(() => {
    cy.loginAsClient();
    cy.visit('/explore');
    cy.contains('Explorar Serviços', { timeout: 15000 }).should('be.visible');
  });

  afterEach(() => {
    cy.logout();
  });

  it('deve exibir a página de explorar', () => {
    cy.contains('Explorar Serviços').should('be.visible');
  });

  it('deve listar trabalhos disponíveis', () => {
    cy.get('.MuiCard-root', { timeout: 10000 }).should('have.length.gte', 1);
  });

  it('deve abrir dialog ao clicar em Solicitar', () => {
    cy.contains('Solicitar').first().click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.contains('Cancelar').should('be.visible');
    cy.contains('Enviar Pedido').should('be.visible');
  });

  it('deve enviar um pedido para um trabalho', () => {
    cy.contains('Solicitar').first().click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.get('.MuiDialog-root').find('input[type="text"]').each(($el) => {
      cy.wrap($el).type('Teste Cypress');
    });
    cy.get('.MuiDialog-root').then($dialog => {
      if ($dialog.find('input[type="number"]').length > 0) {
        cy.wrap($dialog).find('input[type="number"]').each(($el) => {
          cy.wrap($el).type('1');
        });
      }
    });
    cy.get('.MuiDialog-root').then($dialog => {
      if ($dialog.find('.MuiSelect-select').length > 0) {
        cy.wrap($dialog).find('.MuiSelect-select').each(($el) => {
          cy.wrap($el).click({ force: true });
          cy.get('.MuiPopover-paper .MuiMenuItem-root, [role="listbox"] .MuiMenuItem-root').first().click({ force: true });
        });
      }
    });
    cy.get('.MuiDialog-root textarea').first().type('Observação de teste cypress');
    cy.get('.MuiDialog-root').contains('Enviar Pedido').click({ force: true });
    cy.contains('Pedido enviado', { timeout: 10000 }).should('be.visible');
  });

  it('deve cancelar dialog de solicitação', () => {
    cy.contains('Solicitar').first().click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.contains('Cancelar').first().click();
    cy.get('.MuiDialog-root').should('not.exist');
  });
});
