describe('Perfil do Usuário', () => {
  beforeEach(() => {
    cy.loginAsProvider();
    cy.visit('/profile');
  });

  afterEach(() => {
    cy.logout();
  });

  it('deve exibir a página de perfil', () => {
    cy.contains('Perfil', { timeout: 15000 }).should('be.visible');
    cy.contains('Dados Pessoais', { timeout: 10000 }).should('be.visible');
  });

  it('deve exibir avatar e nome do usuário', () => {
    cy.get('.MuiAvatar-root').should('be.visible');
    cy.contains('Profissional Teste').should('be.visible');
  });

  it('deve exibir role como Prestador', () => {
    cy.contains('Prestador').should('be.visible');
  });

  it('deve editar nome e salvar', () => {
    cy.get('input').eq(0).clear().type('Profissional Teste Editado');
    cy.contains('Salvar Alterações').click();
    cy.contains('Perfil atualizado').should('be.visible');
  });

  it('deve exibir campos de endereço', () => {
    cy.contains('Endereço').should('be.visible');
  });

  it('deve exibir campo de profissão para provider', () => {
    cy.get('label', { timeout: 10000 }).contains('Profissão').should('be.visible');
  });
});
