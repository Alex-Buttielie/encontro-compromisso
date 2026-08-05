import './commands';

Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('RedirectError') || err.message.includes('NEXT_REDIRECT') || err.message.includes('NEXT_NOT_FOUND')) {
    return false;
  }
  return true;
});

export {};

