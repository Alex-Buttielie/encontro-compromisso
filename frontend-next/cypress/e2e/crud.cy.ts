describe('Provider CRUD operations', () => {
  beforeEach(() => {
    cy.loginAsProvider();
  });

  describe('Clients', () => {
    it('should create a new client', () => {
      cy.visit('/clients');
      cy.contains('Novo Cliente').click();
      cy.get('input[name="name"], input[label="Nome"]').type('Cliente Cypress Test');
      cy.get('input[name="email"], input[label="E-mail"]').type('cypress@test.com');
      cy.get('input[name="phone"], input[label="Telefone"]').type('11999999999');
      cy.get('.MuiDialog-root button[type="submit"], .MuiDialog-root .MuiButton-contained').click();
      cy.contains('Cliente Cypress Test').should('be.visible');
    });
  });

  describe('Services', () => {
    it('should create a new service', () => {
      cy.visit('/services');
      cy.contains('Novo Serviço').click();
      cy.get('input[label="Nome"]').type('Serviço Cypress');
      cy.get('input[label="Preço"]').type('150');
      cy.get('.MuiDialog-root .MuiButton-contained').click();
      cy.contains('Serviço Cypress').should('be.visible');
    });
  });

  describe('Employees', () => {
    it('should create a new employee', () => {
      cy.visit('/employees');
      cy.contains('Novo Colaborador').click();
      cy.get('input[label="Nome"]').type('Func Cypress');
      cy.get('input[label="E-mail"]').type('funccypress@test.com');
      cy.get('.MuiSelect-select').click();
      cy.get('.MuiMenuItem-root').contains('Dentista').click();
      cy.get('.MuiDialog-root .MuiButton-contained').click();
      cy.contains('Func Cypress').should('be.visible');
    });
  });

  describe('Inventory', () => {
    it('should create a new product', () => {
      cy.visit('/inventory');
      cy.contains('Novo Item').click();
      cy.get('input[label="Nome"]').type('Produto Cypress');
      cy.get('input[label="SKU"]').type('CYP001');
      cy.get('input[label="Preço Unitário"]').type('25.50');
      cy.get('input[label="Estoque Mínimo"]').type('5');
      cy.get('.MuiDialog-root .MuiButton-contained').click();
      cy.contains('Produto Cypress').should('be.visible');
    });
  });

  describe('Commissions', () => {
    it('should create a new commission rule', () => {
      cy.visit('/commissions');
      cy.contains('Nova Comissão').click();
      cy.get('input[label="ID do funcionário"]').type('1');
      cy.get('.MuiSelect-select').click();
      cy.get('.MuiMenuItem-root').contains('Percentual').click();
      cy.get('input[label="Valor"]').type('10');
      cy.get('.MuiDialog-root .MuiButton-contained').click();
    });
  });

  describe('Contracts', () => {
    it('should create a new contract', () => {
      cy.visit('/contracts');
      cy.contains('Novo Contrato').click();
      cy.get('input[label="Título"]').type('Contrato Cypress');
      cy.get('textarea[label="Cor"], input[label="Cor"]').type('Este é um contrato de teste.');
      cy.get('.MuiDialog-root .MuiButton-contained').click();
      cy.contains('Contrato Cypress').should('be.visible');
    });
  });

  describe('Quotes', () => {
    it('should create a new quote', () => {
      cy.visit('/quotes');
      cy.contains('Novo Orçamento').click();
      cy.get('input[label="ID do cliente"]').type('1');
      cy.get('input[label="Descrição"]').type('Item teste');
      cy.get('input[label="Preço"]').type('100');
      cy.get('input[label="Quantidade"]').type('2');
      cy.get('.MuiDialog-root .MuiButton-contained').click();
    });
  });

  describe('Social Posts', () => {
    it('should create a new social post', () => {
      cy.visit('/social');
      cy.contains('Novo Post').click();
      cy.get('.MuiSelect-select').click();
      cy.get('.MuiMenuItem-root').contains('Texto').click();
      cy.get('input[label="Legenda"], textarea[label="Legenda"]').type('Post Cypress Test');
      cy.get('.MuiDialog-root .MuiButton-contained').click();
    });
  });

  describe('Workflows', () => {
    it('should create a new workflow', () => {
      cy.visit('/workflows');
      cy.contains('Novo Workflow').click();
      cy.get('input[label="Nome"]').type('Workflow Cypress');
      cy.get('.MuiSelect-select').click();
      cy.get('.MuiMenuItem-root').contains('Manual').click();
      cy.get('.MuiDialog-root .MuiButton-contained').click();
      cy.contains('Workflow Cypress').should('be.visible');
    });
  });

  describe('Subscriptions', () => {
    it('should create a new subscription', () => {
      cy.visit('/subscriptions');
      cy.contains('Nova Assinatura').click();
      cy.get('input[label="Plano"]').type('Plano Cypress');
      cy.get('input[label="Valor"]').type('49.90');
      cy.get('.MuiSelect-select').click();
      cy.get('.MuiMenuItem-root').contains('Mensal').click();
      cy.get('.MuiDialog-root .MuiButton-contained').click();
    });
  });

  describe('Branches', () => {
    it('should create a new branch', () => {
      cy.visit('/branches');
      cy.contains('Nova Filial').click();
      cy.get('input[label="Nome"]').type('Filial Cypress');
      cy.get('input[label="Endereço"]').type('Rua Teste, 123');
      cy.get('input[label="Telefone"]').type('11888888888');
      cy.get('.MuiDialog-root .MuiButton-contained').click();
      cy.contains('Filial Cypress').should('be.visible');
    });
  });

  describe('Marketing Campaigns', () => {
    it('should create a new campaign', () => {
      cy.visit('/marketing');
      cy.contains('Nova Campanha').click();
      cy.get('input[label="Nome"]').type('Campanha Cypress');
      cy.get('.MuiSelect-select').click();
      cy.get('.MuiMenuItem-root').contains('E-mail').click();
      cy.get('input[label="Orçamento"]').type('500');
      cy.get('.MuiDialog-root .MuiButton-contained').click();
    });
  });

  describe('Referrals', () => {
    it('should create a new referral', () => {
      cy.visit('/referrals');
      cy.contains('Nova Indicação').click();
      cy.get('input[label="E-mail do indicado"]').type('indicado@test.com');
      cy.get('input[label="Nome do indicado"]').type('Indicado Cypress');
      cy.get('.MuiDialog-root .MuiButton-contained').click();
    });
  });
});
