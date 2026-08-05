declare global {
  namespace Cypress {
    interface Chainable {
      getByData(selector: string): Chainable<JQuery<HTMLElement>>;
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
    }
  }
}

export {};
