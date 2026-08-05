describe('Authentication', () => {
  beforeEach(() => {
    cy.logout();
    cy.visit('/');
  });

  it('should display landing page', () => {
    cy.contains('Profissional OS');
  });

  it('should navigate to login page', () => {
    cy.contains('Entrar').click();
    cy.url().should('include', '/login');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('should show validation error on empty login', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();
    cy.get('input[type="email"]').should('be.visible');
  });

  it('should navigate to register page', () => {
    cy.visit('/login');
    cy.contains('Registrar').click();
    cy.url().should('include', '/register');
  });

  it('should fill register form and toggle role', () => {
    cy.visit('/register');
    cy.get('input[name="name"]').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');

    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');

    cy.contains('Prestador').click();
    cy.contains('Profissão').should('be.visible');
  });

  it('should login as provider successfully', () => {
    cy.loginAsProvider();
    cy.visit('/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should login as client successfully', () => {
    cy.loginAsClient();
    cy.visit('/home');
  });

  it('should show error on invalid credentials', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('invalid@test.com');
    cy.get('input[type="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();
    cy.get('.MuiAlert-root').should('be.visible');
  });

  it('should redirect to login when not authenticated', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('should toggle password visibility', () => {
    cy.visit('/login');
    cy.get('input[type="password"]').type('secret');
    cy.get('button[aria-label="Mostrar senha"]').click();
    cy.get('input[type="text"]').should('have.value', 'secret');
    cy.get('button[aria-label="Ocultar senha"]').click();
    cy.get('input[type="password"]').should('have.value', 'secret');
  });
});
