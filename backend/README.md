# Backend Profissional OS (Python + Flask)

Backend REST API desenvolvido em Python com Flask e **Google Firestore**, seguindo Clean Architecture / DDD com TDD obrigatório.

## Status de Implementação

**8 fases concluídas** — 823 testes passando (unitários + integração + E2E).
**Arquitetura Hexagonal**: Ports & Adapters com `FirestoreSerializable` para serialização de persistência.
**Frontend**: Next.js 15 + Material UI 6, 38 páginas cobrindo todas as Fases 1-8.
**Endereço estruturado**: User e Client com campos separados (cep, rua, numero, complemento, bairro, cidade, estado) + auto-preenchimento via ViaCEP proxy.

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 — MVP | Auth, perfis, catálogo, agenda, agendamentos, marketplace | ✅ Concluído |
| 2 — Monetização | Pagamentos, carteira, cashback, fidelidade, pacotes, gift cards | ✅ Concluído |
| 3 — Operação | CRM, ERP, estoque, marketing, analytics, metas | ✅ Concluído |
| 4 — Escala | Equipes, comissões, multiunidade, contratos, orçamentos, check-in/out | ✅ Concluído |
| 5 — Engajamento | Chat, rede social comercial, stories, moderação | ✅ Concluído |
| 6 — Inteligência | Workflow Builder, atendimento domiciliar, logística | ✅ Concluído |
| 7 — Plataforma | Assinaturas, indicações, agentes de IA multiagente | ✅ Concluído |
| 8 — Admin & API | Painel admin, API pública, observabilidade, LGPD, feature flags | ✅ Concluído |

## 🚀 Execução

### 1. Instalar dependências

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configurar Firebase

```bash
cp .env.example .env
```

Edite `.env` com as credenciais do Firebase:

```
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_CREDENTIALS=C:\caminho\para\service-account.json
```

Para obter a service account JSON:
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Project Settings > Service Accounts > Generate New Private Key
3. Salve o arquivo JSON em local seguro
4. Configure o caminho em `FIREBASE_CREDENTIALS`

### 3. Popular dados de teste no Firestore

```bash
python seed.py
```

### 4. Iniciar servidor

```bash
python app.py
```

O servidor estará disponível em `http://localhost:5000`.

### 5. Executar testes

```bash
python -m pytest tests/ -q              # Todos os 823 testes
python -m pytest tests/unit/ -q          # Testes unitários
python -m pytest tests/integration/ -q   # Testes de integração e E2E
python -m pytest tests/unit/test_phase8_domain.py -q  # Fase específica
```

## 📡 Endpoints da API (300+ rotas)

### Fase 1 — MVP

#### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Obter perfil
- `PUT /api/auth/profile` - Atualizar perfil

#### ViaCEP Proxy
- `GET /api/cep/<cep>` - Consultar endereço via ViaCEP (auto-preenchimento de CEP)

#### Clientes
- `GET /api/clients` - Listar clientes (com busca `?search=`)
- `POST /api/clients` - Criar cliente
- `GET /api/clients/<id>` - Obter cliente
- `PUT /api/clients/<id>` - Atualizar cliente
- `DELETE /api/clients/<id>` - Excluir cliente

#### Serviços
- `GET /api/services` - Listar serviços
- `POST /api/services` - Criar serviço
- `GET /api/services/<id>` - Obter serviço
- `PUT /api/services/<id>` - Atualizar serviço
- `DELETE /api/services/<id>` - Excluir serviço

#### Agendamentos
- `GET /api/appointments` - Listar (filtrar por `?date=YYYY-MM-DD`)
- `GET /api/appointments/today` - Agendamentos de hoje
- `GET /api/appointments/upcoming` - Próximos
- `POST /api/appointments` - Criar
- `PUT /api/appointments/<id>` - Atualizar
- `DELETE /api/appointments/<id>` - Excluir
- `POST /api/appointments/<id>/confirm` - Confirmar (pending → confirmed)
- `POST /api/appointments/<id>/complete` - Concluir (confirmed → completed)
- `POST /api/appointments/<id>/cancel` - Cancelar

#### Transações Financeiras
- `GET /api/transactions` - Listar
- `POST /api/transactions` - Criar
- `DELETE /api/transactions/<id>` - Excluir
- `POST /api/transactions/<id>/pay` - Marcar como paga
- `GET /api/finance/summary` - Resumo financeiro
- `GET /api/finance/monthly-income` - Receita mensal

#### Works e Work Orders
- `GET/POST/PUT/DELETE /api/works` - CRUD de trabalhos
- `GET /api/works/explore` - Explorar trabalhos ativos (Client)
- `POST /api/work-orders` - Criar pedido (Client)
- `GET /api/work-orders/received` - Pedidos recebidos (Provider)
- `GET /api/work-orders/placed` - Meus pedidos (Client)
- `POST /api/work-orders/<id>/accept|reject|complete|cancel`

### Fase 2 — Monetização
- `POST /api/payments` + `/refund`, `/split`
- `GET/POST /api/wallet` + `/withdraw`, `/transfer`
- `GET/POST /api/loyalty` + `/redeem`
- `GET/POST /api/packages` + `/redeem`
- `GET/POST /api/gift-cards` + `/redeem`
- `GET/POST /api/coupons` + `/validate`

### Fase 3 — Operação
- `GET/POST /api/crm/segments`, `/api/crm/clients`
- `GET/POST /api/erp/accounts-payable`, `/api/erp/accounts-receivable`
- `GET/POST /api/inventory/items`, `/api/inventory/movements`
- `GET/POST /api/marketing/campaigns`
- `GET /api/analytics/dashboard`, `/api/analytics/goals`

### Fase 4 — Escala
- `GET/POST /api/employees` + `/invite`
- `GET/POST /api/commissions`
- `GET/POST /api/branches`
- `GET/POST /api/contracts` + `/sign`
- `GET/POST /api/quotes` + `/approve`, `/reject`
- `POST /api/checkin`, `/api/checkout`

### Fase 5 — Engajamento
- `GET/POST /api/chat/conversations` + `/messages`
- `GET/POST /api/social/posts`, `/api/social/stories`
- `POST /api/social/posts/<id>/like`, `/comment`, `/share`, `/report`

### Fase 6 — Inteligência
- `GET/POST /api/workflows` + `/trigger`, `/executions`
- `GET/POST /api/homecare/visits` + `/routes`

### Fase 7 — Plataforma
- `GET/POST /api/subscriptions` + `/suspend`, `/cancel`, `/reactivate`, `/billing`
- `POST /api/billings/<id>/retry`
- `GET/POST /api/referrals` + `/register`, `/convert`, `/reward`, `/ranking`, `/stats`
- `GET/POST /api/agents` + `/enable`, `/disable`, `/consent`, `/execute`
- `GET /api/agents/executions` + `/propose-action`, `/approve`, `/reject`
- `GET /api/agents/audit`, `/api/agents/usage`

### Fase 8 — Admin & API Pública
- `GET /api/admin/dashboard` - Dashboard global
- `POST /api/admin/users/<id>/block` - Bloquear usuário
- `POST /api/admin/users/<id>/unblock` - Desbloquear usuário
- `POST /api/admin/users/<id>/approve` - Aprovar prestador
- `POST /api/admin/users/<id>/reject` - Rejeitar prestador
- `POST /api/admin/moderate/post/<id>` - Moderar publicação
- `GET /api/admin/audit` - Logs de auditoria
- `GET/POST /api/admin/feature-flags` + `/<id>/toggle` - Feature flags
- `GET/POST /api/api-keys` + `/<id>/revoke` - Chaves de API
- `GET/POST /api/webhooks` + `/<id>/disable` - Webhooks
- `GET/POST /api/lgpd/requests` + `/<id>/process`, `/<id>/reject` - LGPD
- `GET /api/v1/health` - Health check (API pública)
- `GET /api/v1/users` - Listar usuários (API pública, X-API-Key)
- `GET /api/docs/openapi.json` - Documentação OpenAPI 3.0

## 🏗️ Arquitetura DDD

O backend segue **Arquitetura Hexagonal (Ports & Adapters)** com princípios de Domain-Driven Design e modelos de domínio ricos (não anêmicos).

### Estrutura

```
backend/
├── domain/                    # Camada de domínio (sem dependências externas)
│   ├── enums.py               # 50+ enums com máquinas de estado
│   ├── exceptions.py          # 20+ exceções de domínio
│   ├── value_objects.py       # Money, Email, Duration (imutáveis)
│   ├── permissions.py         # Matriz de permissões RBAC
│   ├── entity.py              # Entidade base com created_at/updated_at
│   └── terms.py               # Versionamento de termos
├── models.py                  # 60+ entidades ricas com fábricas e invariantes
├── ports/                     # Interfaces abstratas (Ports) para repos
├── adapters/                  # Adaptadores concretos (Adapters)
│   ├── firestore_serializable.py  # Mixin de serialização para persistência
│   └── api/                   # Blueprints Flask (HTTP -> service)
├── repositories/              # Adaptadores Firestore (implementam Ports)
│   ├── base.py                # BaseRepository genérico (Firestore)
├── services/                  # 30+ serviços de orquestração
│   └── registry.py            # Service Registry (DI centralizada)
│   ├── auth_service.py
│   ├── client_service.py
│   ├── service_service.py
│   ├── appointment_service.py
│   ├── transaction_service.py
│   ├── work_service.py
│   ├── payment_service.py
│   ├── wallet_service.py
│   ├── loyalty_service.py
│   ├── package_service.py
│   ├── gift_card_service.py
│   ├── crm_service.py
│   ├── erp_service.py
│   ├── inventory_service.py
│   ├── marketing_service.py
│   ├── analytics_service.py
│   ├── employee_service.py
│   ├── commission_service.py
│   ├── branch_service.py
│   ├── social_service.py
│   ├── chat_service.py
│   ├── notification_service.py
│   ├── homecare_service.py
│   ├── document_service.py
│   ├── quote_service.py
│   ├── checkin_service.py
│   ├── workflow_service.py
│   ├── subscription_service.py
│   ├── referral_service.py
│   ├── ai_agent_service.py
│   ├── admin_service.py
│   ├── public_api_service.py
│   └── lgpd_service.py
├── repositories/              # Persistência (Firestore)
│   ├── base.py                # BaseRepository genérico (Firestore)
│   ├── user_repository.py
│   ├── client_repository.py
│   ├── appointment_repository.py
│   ├── transaction_repository.py
│   ├── work_repository.py
│   ├── wallet_repository.py
│   ├── service_repository.py
│   ├── team_repository.py
│   ├── social_repository.py
│   ├── chat_repository.py
│   ├── crm_repository.py
│   ├── erp_repository.py
│   ├── inventory_repository.py
│   ├── marketing_repository.py
│   ├── branch_repository.py
│   ├── commission_repository.py
│   ├── loyalty_repository.py
│   ├── package_repository.py
│   ├── payment_repository.py
│   ├── giftcard_repository.py
│   ├── phase6_repository.py
│   ├── phase7_repository.py
│   └── phase8_repository.py
├── tests/
│   ├── unit/                  # Testes unitários TDD
│   └── integration/           # Testes de integração e E2E
├── app.py                     # API REST (300+ rotas)
├── config.py
├── database.py
├── logger.py                  # Logging estruturado
├── utils/
│   └── error_log_store.py     # Error log estruturado (dev)
└── seed.py
```

### Princípios aplicados

- **Entidades ricas**: 60+ modelos encapsulam regras de negócio e transições de estado
- **Value Objects**: `Money`, `Email`, `Duration` são imutáveis e auto-validáveis
- **Exceções de domínio**: 20+ exceções específicas comunicam violações de regras
- **Máquinas de estado**: Transições validadas em enums (AppointmentStatus, PaymentStatus, etc.)
- **Services finos**: Orquestram persistência e delegam lógica para as entidades
- **Fábricas**: Métodos `create()` nas entidades garantem invariantes na criação
- **Repository Pattern**: `BaseRepository` + repos específicos para acesso a dados
- **Ports & Adapters**: Interfaces abstratas em `ports/` implementadas por adapters em `repositories/` e `adapters/`
- **FirestoreSerializable**: Mixin que separa serialização de persistência (`__dict__` → dict) da serialização de API (`to_dict()` camelCase)
- **Dependency Injection**: Services aceitam repos opcionais no construtor; `ServiceRegistry` centraliza instanciação
- **Composition Root**: `wire_adapters()` em `app.py` conecta adapters aos ports na inicialização
- **TDD obrigatório**: Red → Green → Refactor em todas as fases
- **Auditoria**: Todas as ações administrativas e financeiras registradas em AuditLog

### Error Log de Desenvolvimento

Em ambiente de desenvolvimento (`FLASK_DEBUG=True`), todos os erros (400, DomainError, 500) são automaticamente capturados e armazenados em `backend/logs/error_log.jsonl` com contexto completo:

- Tipo e mensagem do erro
- Stack trace completo
- Método HTTP, path, IP, headers e body da requisição
- User ID (se autenticado)
- Timestamp ISO 8601

**Endpoints de inspeção** (disponíveis apenas em dev):

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/dev/errors` | Lista erros (params: `limit`, `offset`, `type`) |
| `DELETE` | `/api/dev/errors` | Limpa todos os erros logados |

**Exemplo de uso:**

```bash
# Listar últimos 20 erros
curl http://localhost:5000/api/dev/errors?limit=20

# Filtrar por tipo de erro
curl http://localhost:5000/api/dev/errors?type=ValueError

# Limpar logs
curl -X DELETE http://localhost:5000/api/dev/errors
```

Em produção (`FLASK_DEBUG=False`), o error log é desativado e os endpoints não são registrados.

### Modelos principais (60+)

`User`, `Client`, `Service`, `Category`, `Appointment`, `Transaction`, `Work`, `WorkOrder`, `Payment`, `Refund`, `Wallet`, `WalletTransaction`, `LoyaltyAccount`, `LoyaltyTransaction`, `ServicePackage`, `PackageUsage`, `GiftCard`, `Coupon`, `Campaign`, `CRMClient`, `CRMSegment`, `InventoryItem`, `InventoryMovement`, `Supplier`, `Expense`, `Revenue`, `Employee`, `Commission`, `Branch`, `Transfer`, `Contract`, `Quote`, `CheckIn`, `CheckOut`, `Goal`, `AnalyticsEvent`, `Conversation`, `Message`, `SocialPost`, `SocialStory`, `Comment`, `Like`, `Follow`, `Report`, `Notification`, `Workflow`, `WorkflowExecution`, `HomeCareVisit`, `Route`, `Subscription`, `Billing`, `Referral`, `AgentConfig`, `AgentExecution`, `AuditLog`, `ApiKey`, `Webhook`, `DataRequest`, `FeatureFlag`

### Exemplo de fluxo

```
POST /api/appointments/3/confirm
  → AppointmentService.confirm(3)
    → appointment = repo.get_by_id(3)
    → appointment.confirm()          # entidade valida transição de estado
    → repo.save(appointment)
  → retorna appointment com actions disponíveis
```

## 🧪 Testes

```bash
# Todos os testes
python -m pytest tests/ -q

# Por fase
python -m pytest tests/unit/test_phase1_domain.py -q
python -m pytest tests/unit/test_phase8_domain.py -q
python -m pytest tests/integration/test_phase8_flows.py -q

# Com verbose
python -m pytest tests/ -v --tb=short
```

**823 testes** cobrindo:
- Testes unitários de domínio (enums, modelos, value objects, exceções)
- Testes de integração de serviços e repositórios
- Testes E2E de fluxos completos (8 fluxos obrigatórios da Fase 8)

## 🔐 Autenticação

O frontend envia o `userId` no header:

```
Authorization: Bearer <user_id>
```

A API pública (Fase 8) usa chaves de API:

```
X-API-Key: pos_<token>
```

Em produção, substituir por JWT real.

## 🔒 LGPD e Segurança

- Exportação, correção, exclusão e portabilidade de dados via `/api/lgpd/requests`
- Consentimento e aceite versionado de termos
- Rate limiting na API pública (100 req/60s por chave)
- Sanitização de inputs (prevenção XSS)
- Auditoria de todas as ações administrativas e financeiras
- Permissões RBAC com 5 níveis (super_admin, admin, moderator, support, read_only)
- Segredos somente em variáveis de ambiente

## 👤 Usuário de Teste

```
Email: teste@profissional-os.com
Senha: Teste123
```

## 📋 Funcionalidades Pendentes

- ~~Migração para Firebase~~ ✅ Concluído (Firestore)
- ~~Arquitetura Hexagonal~~ ✅ Concluído (Ports & Adapters + FirestoreSerializable)
- ~~Migração frontend para Next.js + MUI~~ ✅ Concluído (Next.js 15 + Material UI 6)
- Migração para FastAPI
- JWT real (atual: Bearer com userId)
- MFA (multi-factor authentication)
- Jobs assíncronos (Celery/RQ) ✅ Concluído
- Docker e CI/CD ✅ Concluído
- Integrações externas (Stripe, Google Calendar, WhatsApp, Firebase Cloud Messaging)
- Login social (Google, Apple, Facebook)
- Criptografia em repouso
- Backup automático
- App React Native/Expo
- Testes frontend (Vitest/Playwright)
- TanStack Query no frontend
- PWA (Progressive Web App) ✅ Concluído
- Internacionalização (i18n) ✅ Concluído
- WebSocket para tempo real ✅ Concluído
