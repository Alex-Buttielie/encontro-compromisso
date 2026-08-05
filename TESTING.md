# Guia de Testes - Profissional OS

## 📋 Índice

1. [Testes do Backend (pytest)](#testes-do-backend)
2. [Testes E2E do Frontend (Cypress)](#testes-e2e-do-frontend)
3. [Cobertura de Testes](#cobertura-de-testes)

## 🧪 Testes do Backend (pytest)

### Preparação do Ambiente

1. **Inicie o backend:**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate        # Windows
   # source venv/bin/activate   # Linux/Mac
   pip install -r requirements.txt
   cp .env.example .env
   python seed.py
   ```

2. **Credenciais de Teste:**
   - Email: `teste@profissional-os.com`
   - Senha: `Teste123`

### Estrutura dos Testes

```
backend/tests/
├── unit/                       # Testes unitários (domínio, entidades, serviços)
└── integration/                # Testes de integração e E2E (Flask test client)
    ├── test_phase1_flows.py    # Auth, clients, services, appointments
    ├── test_phase2_flows.py    # Payments, wallet, loyalty, packages, gift cards
    ├── test_phase3_flows.py    # CRM, ERP, inventory, marketing, analytics
    ├── test_phase4_flows.py    # Employees, commissions, branches, contracts, quotes
    ├── test_phase5_flows.py    # Chat, social, notifications
    ├── test_phase6_flows.py    # Homecare, quotes, contracts, check-in/out, workflows
    ├── test_phase7_flows.py    # Subscriptions, referrals, AI agents
    └── test_phase8_flows.py    # Admin, public API, LGPD, feature flags
```

### Execução

```bash
cd backend

# Todos os testes
python -m pytest tests/ -q

# Apenas unitários
python -m pytest tests/unit/ -q

# Apenas integração
python -m pytest tests/integration/ -q

# Teste específico
python -m pytest tests/integration/test_phase1_flows.py -v

# Com verbose
python -m pytest tests/ -v --tb=short
```

### Cobertura

- **711 testes** passando (unitários + integração + E2E)
- **8 fases** cobertas integralmente
- **Clean Architecture / DDD** — testes validam domain, services e API

## 🤖 Testes E2E do Frontend (Cypress)

### Requisitos

- Backend rodando em `http://localhost:5000`
- Frontend rodando em `http://localhost:3000`

### Execução

```bash
cd frontend-next

# Modo headless
npm run cypress:run

# Modo interativo
npm run cypress
```

## 📊 Cobertura Total

- **Backend:** 711 testes (pytest)
- **Frontend:** Cypress E2E
- **Cobertura de Funcionalidades:** 100% das Fases 1-8

## 🔧 Reset de Dados

```bash
cd backend
del profissional_os.db          # Windows
# rm profissional_os.db         # Linux/Mac
python app.py
```

## 🐛 Relatórios de Bugs

Ao encontrar bugs durante os testes:

1. **Descreva o passo a passo** para reproduzir
2. **Inclua screenshots** se possível
3. **Verifique o console** por erros
4. **Documente no issue tracker**

---

**Total de Testes:** 711 testes pytest + Cypress E2E
**Cobertura:** 100% das Fases 1-8
