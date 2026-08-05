# Profissional OS — Documentação Técnica

> Arquitetura, stack, padrões, estrutura de diretórios, API e detalhes de implementação de backend e frontend.

---

## 1. Stack Tecnológica

### Backend

| Tecnologia | Versão | Função |
|------------|--------|--------|
| Python | 3.13 | Linguagem principal |
| Flask | 3.0.3 | API REST principal |
| SQLAlchemy | 3.1.1 (flask-sqlalchemy) | ORM |
| Flask-Migrate | 4.0.7 | Migrações de schema |
| Flask-CORS | 4.0.0 | Cross-origin |
| Flask-SocketIO | 5.3.6 | WebSocket tempo real |
| PyJWT | 2.9.0 | Autenticação JWT |
| Werkzeug | 3.0.2 | Hash de senhas, WSGI |
| Sentry SDK | 2.14.0 | Monitoramento de erros |
| Celery + Redis | — | Jobs assíncronos |
| pytest | 8.3.5 | Testes |
| gunicorn | 22.0.0 | Servidor WSGI produção |
| SQLite | — | Banco dev |
| PostgreSQL | 16 | Banco produção |

### Frontend (frontend-next — atual)

| Tecnologia | Versão | Função |
|------------|--------|--------|
| Next.js | 15.5.21 | Framework React (App Router) |
| React | 19 | UI library |
| TypeScript | 5.5.4 | Tipagem estática |
| Material UI | 6.3 | Componentes visuais |
| Emotion | 11.14 | CSS-in-JS (engine MUI) |
| @mui/material-nextjs | 6.3 | Integração MUI + App Router |
| react-i18next + i18next | 15.0.2 / 23.15 | Internacionalização |
| socket.io-client | 4.7.5 | WebSocket client |
| lucide-react | 0.439 | Ícones |

---

## 2. Arquitetura do Backend

### 2.1. Visão Geral

O backend segue uma abordagem **Domain-Driven Design (DDD) com rich domain models**. As entidades não são anêmicas — cada uma possui factory methods que validam invariantes e métodos de transição de estado que protegem o agregado.

```
backend/
├── app.py                    # Flask application factory + registro de rotas
├── config.py                 # Configuração (env vars, CORS, JWT)
├── database.py               # SQLAlchemy init
├── celery_app.py             # Celery para jobs assíncronos
├── logger.py                 # Logging profissional (console + rotating file)
├── seed.py                   # Dados iniciais para desenvolvimento
│
├── domain/                   # Camada de Domínio (pura, sem dependências externas)
│   ├── enums.py              # 60+ enums com state machines e labels pt-BR
│   ├── exceptions.py         # Exceções de domínio (DomainError e 30+ subclasses)
│   ├── value_objects.py      # Value Objects: Money, Email, Duration
│   ├── permissions.py        # Matriz de permissões por role
│   └── terms.py              # Versões de Termos e Política de Privacidade
│
├── models.py                 # 62 entidades SQLAlchemy (rich models com comportamento)
│
├── repositories/             # Camada de Persistência (Repository Pattern)
│   ├── base.py               # BaseRepository: CRUD genérico
│   ├── user_repository.py
│   ├── client_repository.py
│   ├── appointment_repository.py
│   └── ... (24 repositórios)
│
├── services/                 # Camada de Aplicação (Application Services)
│   ├── auth_service.py       # Orquestra registro, login, JWT, recuperação
│   ├── client_service.py
│   ├── appointment_service.py
│   ├── payment_service.py
│   ├── payment_gateway.py    # Abstração de gateway (SandboxGateway implementado)
│   ├── email_sender.py       # Abstração de e-mail (ConsoleEmailSender para dev)
│   └── ... (35 services)
│
├── tasks/                    # Celery tasks (jobs assíncronos)
│
├── utils/
│   ├── rate_limiter.py       # Rate limiting
│   └── upload_validation.py  # Validação de uploads
│
└── tests/
    ├── conftest.py           # Fixtures do pytest
    ├── unit/                 # 26 arquivos de testes unitários
    └── integration/
```

### 2.2. Padrões Arquiteturais

#### Rich Domain Models
As entidades SQLAlchemy **não são anêmicas**. Cada uma:
- Possui `@classmethod create(...)` que valida invariantes antes de instanciar
- Possui métodos de transição de estado (ex: `appointment.confirm()`, `payment.mark_paid()`)
- Levanta `DomainError` (ou subclasse) quando invariantes são violadas
- O service layer apenas orquestra, não contém regras de negócio

#### Repository Pattern
- `BaseRepository` fornece CRUD genérico: `add`, `get_by_id`, `get_all`, `get_paginated`, `update`, `save`, `delete`
- Repositórios específicos herdam e adicionam queries de domínio (ex: `find_by_email`, `find_active_by_user`)
- Services recebem repositórios via injeção (construtor com default para compatibilidade)

#### Application Services
- Services são **finos**: orquestram repositorios e entidades de domínio
- Não contêm regras de negócio — apenas coordenam
- Retornam dicts no formato da API: `{'success': bool, 'errors': [...], ...}`
- Injeção de dependências no construtor (ex: `AuthService(user_repository=None, email_sender=None)`)

#### State Machines
- 12+ máquinas de estado implementadas como enums com `can_transition_to()`
- Transições inválidas lançam `InvalidStateTransition`
- Estados terminais verificados via `is_terminal`
- Transições definidas em dicts module-level (ex: `_APPOINTMENT_TRANSITIONS`)

#### Value Objects
- `Money`: Imutável, não-negativo, arredondado para centavos, formatação BRL
- `Email`: Imutável, validado por regex, permite vazio
- `Duration`: Imutável, positiva, formatação legível (1h30min)

#### Exception Hierarchy
```
DomainError (base)
├── ValidationError
├── InvalidStateTransition
├── BusinessRuleViolation
├── InvalidTokenError
├── PaymentError
├── WalletError
├── ... (30+ exceções específicas)
```

### 2.3. API REST

#### Convenções
- **Base URL**: `/api/`
- **Autenticação**: `Authorization: Bearer <JWT>` (ou ID numérico legado para testes)
- **Resposta**: JSON com `{'success': bool, 'errors': [...], ...}`
- **Paginação**: `?page=1&limit=20` — retorna `{items, total, page, limit, pages}`. Sem `?page`, retorna todos.
- **CORS**: Configurado via `CORS_ORIGINS` env var
- **Rate limiting**: Implementado em `utils/rate_limiter.py`

#### Endpoints (237 rotas)

| Domínio | Prefixo | Rotas |
|---------|---------|-------|
| Auth | `/api/auth/` | register, login, profile, confirm-email, password-reset |
| Clients | `/api/clients` | CRUD + busca |
| Services | `/api/services` | CRUD + filtro por categoria |
| Appointments | `/api/appointments` | CRUD + confirm/cancel/complete |
| Transactions | `/api/transactions` | CRUD + mark-paid |
| Works | `/api/works` | CRUD + orders |
| Work Orders | `/api/work-orders` | list, accept, reject, complete, cancel |
| Payments | `/api/payments` | create, webhook, refund |
| Wallet | `/api/wallet` | balance, ledger, transfer |
| Packages | `/api/packages` | CRUD + purchase |
| Gift Cards | `/api/gift-cards` | CRUD + redeem |
| Loyalty | `/api/loyalty` | account, transactions, missions, medals |
| CRM | `/api/crm` | clients, segments, surveys |
| ERP | `/api/erp` | cost-centers, cash-flow, payables, receivables, periods |
| Inventory | `/api/inventory` | products, movements, transfers |
| Marketing | `/api/marketing` | campaigns, coupons |
| Analytics | `/api/analytics` | dashboard, reports |
| Employees | `/api/employees` | CRUD + history |
| Commissions | `/api/commissions` | rules, payments |
| Branches | `/api/branches` | CRUD |
| Social | `/api/social` | posts, comments, stories, follows, reports |
| Chat | `/api/chat` | conversations, messages (WebSocket) |
| Notifications | `/api/notifications` | list, preferences, send |
| Home Care | `/api/homecare` | visits, routes, areas |
| Documents | `/api/documents` | generate, sign |
| Quotes | `/api/quotes` | CRUD + approve/reject/convert + comments |
| Contracts | `/api/contracts` | CRUD + send/sign/activate/terminate + versions |
| Check-in | `/api/checkin` | check-in, check-out, no-show |
| Workflows | `/api/workflows` | CRUD + activate/pause/trigger + executions |
| Subscriptions | `/api/subscriptions` | CRUD + suspend/cancel/reactivate + billing |
| Referrals | `/api/referrals` | CRUD + register/convert/reward/expire + stats/ranking |
| AI Agents | `/api/agents` | CRUD + enable/disable/pause + execute + approvals |
| Admin | `/api/admin` | dashboard + block/unblock + moderate + audit + feature-flags |
| API Keys | `/api/api-keys` | CRUD + revoke |
| Webhooks | `/api/webhooks` | CRUD + disable |
| LGPD | `/api/lgpd` | requests + process/reject |
| Public API | `/api/v1/` | health, users |
| Docs | `/api/docs/` | openapi.json |
| CEP | `/api/cep/<cep>` | ViaCEP proxy |

#### WebSocket Events
- `connect`: Usuário entra na sala pessoal `user_{id}`
- `join_conversation`: Entra na sala `conversation_{id}`
- `new_message`: Emitido para a sala da conversa
- `notify_user`: Emitido para a sala pessoal do usuário

### 2.4. Segurança

- **Senhas**: Hash via `werkzeug.security.generate_password_hash` (PBKDF2)
- **JWT**: HS256, expiração 24h, payload com `user_id` e `role`
- **Tokens**: `secrets.token_urlsafe(32)` para confirmação de e-mail e reset de senha
- **CORS**: Configurado para origins específicas
- **Sentry**: Integração ativa para erros e performance
- **Rate limiting**: Implementado para proteção de endpoints
- **Upload validation**: Validação de tipo e tamanho de arquivos
- **Sanitização**: `sanitize_input` no PublicApiService

### 2.5. Logging

- Formato: `YYYY-MM-DD HH:MM:SS | LEVEL | logger | [file:line] message`
- Saída: Console (stdout) + arquivo rotativo (`logs/profissional_os.log`, 5MB, 5 backups)
- Nível configurável via `LOG_LEVEL` env var (default: INFO)
- Request logging: `before_request` (IN) e `after_request` (OUT) com duração em ms

### 2.6. Jobs Assíncronos (Celery)

- Broker/Backend: Redis (`redis://localhost:6379/0`)
- Serialização: JSON
- Timezone: America/Sao_Paulo (UTC habilitado)
- Uso: Notificações, webhooks, campanhas de marketing, exportações LGPD

---

## 3. Arquitetura do Frontend (frontend-next)

### 3.1. Visão Geral

Frontend migrado de Vite + React Router + Tailwind para **Next.js 15 (App Router) + Material UI v6 + TypeScript**.

```
frontend-next/
├── src/
│   ├── app/                         # App Router (Next.js 15)
│   │   ├── layout.tsx               # Root layout (HTML + Providers)
│   │   ├── providers.tsx            # ThemeRegistry + AuthProvider + ToastProvider + SocketProvider
│   │   ├── page.tsx                 # Landing page
│   │   ├── globals.css              # Estilos globais
│   │   ├── login/page.tsx           # Tela de login
│   │   ├── register/page.tsx        # Cadastro com Autocomplete de profissão
│   │   └── (protected)/             # Grupo com guard de autenticação
│   │       ├── layout.tsx           # Layout com Drawer + AppBar (Layout component)
│   │       ├── dashboard/           # Dashboard principal
│   │       ├── home/                # Home
│   │       ├── agenda/              # Agenda de agendamentos
│   │       ├── clients/             # CRUD de clientes + busca com Autocomplete
│   │       ├── services/            # CRUD de serviços + filtro por categoria
│   │       ├── explore/             # Marketplace + busca com Autocomplete
│   │       ├── works/               # Trabalhos e pedidos
│   │       ├── orders/              # Pedidos
│   │       ├── my-orders/           # Meus pedidos (cliente)
│   │       ├── payments/            # Pagamentos
│   │       ├── wallet/              # Carteira digital
│   │       ├── finance/             # Financeiro (transações)
│   │       ├── packages/            # Pacotes de sessões
│   │       ├── gift-cards/          # Gift cards
│   │       ├── loyalty/             # Fidelização
│   │       ├── crm/                 # CRM
│   │       ├── inventory/           # Estoque
│   │       ├── marketing/           # Campanhas
│   │       ├── analytics/           # Analytics
│   │       ├── employees/           # Equipe
│   │       ├── commissions/         # Comissões
│   │       ├── branches/            # Unidades
│   │       ├── contracts/           # Contratos
│   │       ├── quotes/              # Orçamentos
│   │       ├── chat/                # Chat em tempo real
│   │       ├── social/              # Feed social
│   │       ├── notifications/       # Notificações
│   │       ├── workflows/           # Automações
│   │       ├── homecare/            # Atendimento domiciliar
│   │       ├── subscriptions/       # Assinaturas
│   │       ├── referrals/           # Indicações
│   │       ├── ai-agents/           # Agentes de IA
│   │       ├── admin/               # Administração
│   │       ├── api-keys/            # Chaves de API
│   │       ├── webhooks/            # Webhooks
│   │       ├── lgpd/                # LGPD
│   │       ├── feature-flags/       # Feature flags
│   │       └── profile/             # Perfil + Autocomplete de profissão
│   │
│   ├── components/
│   │   ├── Layout.tsx               # Drawer + AppBar + navegação por role
│   │   ├── AddressFields.tsx        # Endereço com ViaCEP + Autocomplete IBGE
│   │   ├── SearchAutocomplete.tsx   # Busca com sugestões + debounce
│   │   ├── ConfirmDialog.tsx        # Dialog de confirmação
│   │   ├── LoadingSpinner.tsx       # CircularProgress
│   │   ├── ErrorBanner.tsx          # Alert de erro
│   │   ├── Pagination.tsx           # Controles de paginação
│   │   └── ErrorBoundary.tsx        # Boundary de erros
│   │
│   ├── config/
│   │   └── autocompletes.ts         # Listas: estados BR, profissões, categorias
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx          # Autenticação e perfil
│   │   ├── ToastContext.tsx         # Notificações toast
│   │   └── SocketContext.tsx        # WebSocket (socket.io-client)
│   │
│   ├── services/
│   │   └── api.ts                   # API client com 27+ módulos tipados
│   │
│   ├── hooks/
│   │   └── useDebounce.ts           # Hook de debounce
│   │
│   ├── utils/
│   │   └── helpers.ts               # Formatação (BRL, datas, initials, status labels, ViaCEP)
│   │
│   ├── i18n/
│   │   └── index.ts                 # i18next (pt-BR, en-US)
│   │
│   ├── types/
│   │   └── index.ts                 # 60+ interfaces TypeScript
│   │
│   └── theme.ts                     # Tema MUI (paleta indigo, borderRadius 12, overrides)
│
├── public/                       # Assets estáticos
│
├── package.json
├── tsconfig.json                    # Path alias @/* → src/*
├── next.config.js
└── next-env.d.ts
```

### 3.2. Padrões Frontend

#### App Router + Client Components
- Páginas usam `'use client'` onde necessário (interatividade, hooks)
- Layout aninhado: `(protected)/layout.tsx` aplica guard de autenticação
- Route groups: `(protected)` não afeta URL

#### Context API
- **AuthContext**: Login, logout, registro, perfil, token JWT em localStorage
- **ToastContext**: Notificações temporárias (success, error, info)
- **SocketContext**: Conexão WebSocket via socket.io-client

#### API Client
- `src/services/api.ts` com módulos tipados: `authApi`, `clientApi`, `serviceApi`, `appointmentApi`, `paymentApi`, `walletApi`, etc.
- Base URL configurável via env
- Interceptors: Adiciona `Authorization` header automaticamente
- Tipos genéricos: `ApiResponse<T>` para respostas

#### Autocompletes Inteligentes
- **AddressFields**: Estado (lista de 27 UFs) + Cidade (API IBGE dinâmica) + ViaCEP para CEP
- **SearchAutocomplete**: Componente reutilizável com debounce + sugestões dinâmicas
- **Profissão**: Autocomplete com 50+ profissões brasileiras (freeSolo)
- **Categorias de serviço**: Filtro e seleção com lista predefinida

#### Tema MUI
- Paleta primary: Indigo (#6366f1)
- Paleta secondary: Pink (#ec4899)
- Border radius: 12px
- Cards sem elevation, com borda sutil
- Botões sem elevation, texto sem uppercase
- TextFields small por padrão

#### Internacionalização
- pt-BR (padrão) e en-US
- Namespaces por módulo
- Formatação de moeda: BRL
- Formatação de data: dd/mm/yyyy

### 3.3. Build e Deploy

```bash
# Desenvolvimento
npm run dev          # next dev (porta 3000)

# Produção
npm run build        # next build (44 páginas estáticas)
npm run start        # next start

# Lint
npm run lint         # next lint
```

---

## 4. Estrutura de Testes

### 4.1. Backend (pytest)

```
backend/tests/
├── conftest.py              # Fixtures: app, client, db
├── unit/                    # 26 arquivos
│   ├── test_jwt_auth.py
│   ├── test_auth_service_recovery.py
│   ├── test_payment_domain.py
│   ├── test_wallet_domain.py
│   ├── test_user_account_recovery.py
│   └── ... (22 arquivos por domínio)
└── integration/
    └── test_phase1_flows.py  # ... test_phase8_flows.py
```

```bash
cd backend && python -m pytest tests/ -q --tb=short
```

### 4.2. CI/CD

```yaml
# .github/workflows/ci.yml
jobs:
  backend-tests:    # Python 3.13 + pytest
  frontend-build:   # Node 20 + npm build
  lint:             # flake8 (backend) + tsc --noEmit (frontend)
```

### 4.3. Docker

```bash
# Desenvolvimento
docker-compose up    # PostgreSQL + backend (Flask) + frontend (nginx)

# Serviços
db:        PostgreSQL 16 (porta 5432)
backend:   Flask (porta 5000)
frontend:  Next.js (porta 3000)
```

---

## 5. Configuração de Ambiente

### 5.1. Backend (.env)

```env
SECRET_KEY=<generate-with-secrets.token_hex(32)>
DATABASE_URL=sqlite:///profissional_os.db    # dev | postgresql://... # prod
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
FLASK_DEBUG=True                              # False em produção
SENTRY_DSN=                                   # opcional
SENTRY_ENV=development
LOG_LEVEL=INFO
EMAIL_PROVIDER=console                        # console | smtp (não implementado)
REDIS_URL=redis://localhost:6379/0            # Celery
```

### 5.2. Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 6. Entidades do Domínio (62 modelos)

### Núcleo
User, Client, Service, Appointment, Transaction, Work, WorkOrder

### Pagamentos e Financeiro
Payment, Wallet, LedgerEntry, Package, GiftCard

### Fidelização
LoyaltyAccount, LoyaltyTransaction, Mission, Medal

### CRM e ERP
ClientProfile, SatisfactionSurvey, CostCenter, CashFlowEntry, AccountPayable, AccountReceivable, FinancialPeriod, Supplier, Product, StockMovement

### Marketing
Campaign, Coupon, DashboardReport

### Equipe e Multi-Unidade
Branch, Employee, EmployeeHistory, CommissionRule, CommissionPayment, StockTransfer

### Social e Comunicação
Post, Comment, Story, Follow, Report, ModerationLog, Chat, Message, NotificationPreference, Notification

### Home Care e Documentos
ServiceArea, Quote, Contract, CheckInOut

### Workflows
Workflow, WorkflowExecution

### Assinaturas e Indicações
Subscription, Billing, Referral

### IA e Administração
AgentConfig, AgentExecution, AuditLog, ApiKey, Webhook, DataRequest, FeatureFlag, RateLimitEntry

---

## 8. Enums do Domínio (60+)

Todos os enums herdam de `str, Enum` e possuem:
- `from_value()`: Factory com validação
- `label`: Label em português (pt-BR)
- `is_terminal`: Para estados finais (onde aplicável)
- `can_transition_to()`: Para máquinas de estado

### Máquinas de Estado (12+)
1. AppointmentStatus: scheduled → confirmed → completed | cancelled
2. WorkOrderStatus: pending → accepted → completed | rejected | cancelled
3. PaymentStatus: pending → authorized → processing → paid → refunded | disputed
4. TransferStatus: requested → approved → in_transit → completed
5. PackageStatus: active → expired | exhausted | cancelled
6. GiftCardStatus: active → redeemed | expired | blocked | cancelled
7. CampaignStatus: draft → scheduled → running → completed | cancelled
8. EmployeeStatus: invited → active → suspended | terminated
9. CommissionStatus: pending → paid | cancelled
10. QuoteStatus: draft → sent → approved → converted | rejected | expired
11. ContractStatus: draft → sent → signed → active → expired | terminated
12. SubscriptionStatus: trialing → active → past_due → suspended | cancelled | expired
13. ReferralStatus: pending → registered → converted → rewarded
14. DataRequestStatus: pending → processing → completed | rejected
15. MessageStatus: sent → delivered → read | failed

---

## 9. Endpoints de Integração Externa

| Serviço | Uso | URL |
|---------|-----|-----|
| ViaCEP | Consulta de CEP | `https://viacep.com.br/ws/{cep}/json/` |
| IBGE | Lista de municípios por UF | `https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/municipios` |
| Sentry | Monitoramento | Configurado via `SENTRY_DSN` |
| Redis | Broker Celery | `redis://localhost:6379/0` |
| PostgreSQL | Banco produção | Configurado via `DATABASE_URL` |
