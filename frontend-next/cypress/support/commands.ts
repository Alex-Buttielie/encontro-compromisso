const API_BASE = 'http://localhost:5000';

Cypress.Commands.add('getByData', (selector: string) => {
  return cy.get(`[data-cy="${selector}"]`);
});

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${API_BASE}/api/auth/login`,
    body: { email, password },
    headers: { 'Content-Type': 'application/json' },
  }).then((resp) => {
    expect(resp.status).to.eq(200);
    const body = resp.body;
    expect(body.success).to.eq(true);
    const token = body.token || String(body.user.id);
    window.localStorage.setItem('profissionalOS_token', token);
  });
});

Cypress.Commands.add('loginAsProvider', () => {
  cy.login('teste@profissional-os.com', 'Teste123');
});

Cypress.Commands.add('loginAsClient', () => {
  cy.login('cliente@profissional-os.com', 'Cliente123');
});

Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('profissionalOS_token');
});

declare global {
  namespace Cypress {
    interface Chainable {
      getByData(selector: string): Chainable<JQuery<HTMLElement>>;
      login(email: string, password: string): Chainable<void>;
      loginAsProvider(): Chainable<void>;
      loginAsClient(): Chainable<void>;
      logout(): Chainable<void>;
    }
  }
}

export {};
