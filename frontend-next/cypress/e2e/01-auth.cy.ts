describe('Autenticação', () => {
  beforeEach(() => {
    cy.logout();
    cy.visit('/login');
  });

  it('deve exibir a tela de login corretamente', () => {
    cy.contains('Profissional OS').should('be.visible');
    cy.contains('Bem-vindo de volta').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Entrar');
  });

  it('deve logar como prestador com credenciais válidas', () => {
    cy.get('input[type="email"]').type('teste@profissional-os.com');
    cy.get('input[type="password"]').type('Teste123');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('deve logar como cliente com credenciais válidas', () => {
    cy.get('input[type="email"]').type('cliente@profissional-os.com');
    cy.get('input[type="password"]').type('Cliente123');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/home');
  });

  it('deve mostrar erro com credenciais inválidas', () => {
    cy.get('input[type="email"]').type('invalido@teste.com');
    cy.get('input[type="password"]').type('senhaerrada');
    cy.get('button[type="submit"]').click();
    cy.contains('E-mail ou senha incorretos', { timeout: 10000 }).should('be.visible');
  });

  it('deve mostrar erro com e-mail válido mas senha errada', () => {
    cy.get('input[type="email"]').type('teste@profissional-os.com');
    cy.get('input[type="password"]').type('senhaerrada');
    cy.get('button[type="submit"]').click();
    cy.contains('E-mail ou senha incorretos', { timeout: 10000 }).should('be.visible');
  });

  it('deve navegar para a página de registro', () => {
    cy.get('a[href="/register"]').click();
    cy.url({ timeout: 10000 }).should('include', '/register');
    cy.contains('Criar sua conta').should('be.visible');
  });

  it('deve registrar um novo cliente', () => {
    const email = `novo_cliente_${Date.now()}@teste.com`;
    cy.visit('/register');
    cy.contains('Cliente').click();
    cy.get('input').eq(0).type('Novo Cliente Teste');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type('Senha123');
    cy.get('input[type="checkbox"]').first().check();
    cy.get('input[type="checkbox"]').eq(1).check();
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/home');
  });

  it('deve fazer logout corretamente', () => {
    cy.get('input[type="email"]').type('teste@profissional-os.com');
    cy.get('input[type="password"]').type('Teste123');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/dashboard');
    cy.get('[aria-label="Menu do usuário"]').click({ force: true });
    cy.contains('Sair').click({ force: true });
    cy.url({ timeout: 10000 }).should('include', '/login');
  });

  it('deve bloquear acesso a rotas protegidas sem login', () => {
    cy.visit('/dashboard');
    cy.url({ timeout: 10000 }).should('include', '/login');
  });
});
