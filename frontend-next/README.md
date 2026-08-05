# Profissional OS — Frontend Next.js + MUI

Frontend **Next.js 15** (App Router) + **Material UI v6** (Emotion CSS-in-JS).

## Stack

- **Next.js 15** com App Router e React 19
- **Material UI v6** com Emotion, CssBaseline e AppRouterCacheProvider
- **TypeScript** com path alias `@/*`
- **socket.io-client** para WebSocket
- **react-i18next** + **i18next** (pt-BR e en-US)
- **lucide-react** para ícones

## Estrutura

```
frontend-next/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (HTML + Providers)
│   │   ├── page.tsx            # Redirect por role
│   │   ├── providers.tsx       # MUI ThemeProvider + CssBaseline + Contexts + i18n
│   │   ├── globals.css         # CSS mínimo global
│   │   ├── login/page.tsx      # Página pública de login
│   │   ├── register/page.tsx   # Página pública de cadastro
│   │   └── (protected)/        # Grupo de rotas autenticadas
│   │       ├── layout.tsx      # Auth guard + Layout (Drawer + AppBar)
│   │       ├── dashboard/      # Dashboard do prestador
│   │       ├── clients/        # CRUD de clientes
│   │       ├── services/       # CRUD de serviços
│   │       ├── agenda/         # Agenda de agendamentos
│   │       ├── finance/        # Financeiro (transações)
│   │       ├── profile/        # Perfil do usuário
│   │       ├── works/          # Trabalhos com campos customizados
│   │       ├── orders/         # Pedidos recebidos
│   │       ├── home/           # Home do cliente
│   │       ├── explore/        # Explorar serviços
│   │       ├── my-orders/      # Meus pedidos
│   │       ├── payments/       # Pagamentos
│   │       ├── wallet/         # Carteira digital
│   │       ├── loyalty/        # Fidelização
│   │       ├── packages/       # Pacotes de sessões
│   │       ├── gift-cards/     # Gift cards
│   │       ├── crm/            # CRM
│   │       ├── inventory/      # Estoque
│   │       ├── marketing/      # Campanhas de marketing
│   │       ├── analytics/      # Analytics
│   │       ├── employees/      # Equipe
│   │       ├── commissions/    # Comissões
│   │       ├── branches/       # Unidades
│   │       ├── contracts/      # Contratos
│   │       ├── quotes/         # Orçamentos
│   │       ├── chat/           # Chat em tempo real
│   │       ├── social/         # Feed social
│   │       ├── notifications/  # Notificações
│   │       ├── workflows/      # Automações
│   │       ├── homecare/       # Atendimento domiciliar
│   │       ├── subscriptions/  # Assinaturas
│   │       ├── referrals/      # Indicações
│   │       ├── ai-agents/      # Agentes de IA
│   │       ├── admin/          # Administração
│   │       ├── api-keys/       # Chaves de API
│   │       ├── webhooks/       # Webhooks
│   │       ├── lgpd/           # LGPD
│   │       └── feature-flags/  # Feature flags
│   ├── components/
│   │   ├── Layout.tsx          # Drawer + AppBar + navegação por role
│   │   ├── AddressFields.tsx   # Campos de endereço com ViaCEP + Autocomplete (Estado/Cidade via IBGE)
│   │   ├── SearchAutocomplete.tsx # Busca com sugestões dinâmicas e debounce
│   │   ├── ConfirmDialog.tsx   # Dialog de confirmação
│   │   ├── LoadingSpinner.tsx  # CircularProgress
│   │   ├── ErrorBanner.tsx     # Alert de erro
│   │   ├── Pagination.tsx      # Controles de paginação
│   │   └── ErrorBoundary.tsx   # Boundary de erros
│   ├── config/
│   │   └── autocompletes.ts    # Listas para Autocomplete (estados, profissões, categorias)
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Autenticação e perfil
│   │   ├── ToastContext.tsx    # Notificações toast
│   │   └── SocketContext.tsx   # WebSocket (socket.io-client)
│   ├── services/
│   │   └── api.ts              # API client com todos os módulos
│   ├── hooks/
│   │   └── useDebounce.ts      # Hook de debounce
│   ├── utils/
│   │   └── helpers.ts          # Formatação, ViaCEP, labels
│   ├── i18n/
│   │   └── index.ts            # i18next (pt-BR, en-US)
│   ├── types/
│   │   └── index.ts            # Tipos TypeScript compartilhados
│   └── theme.ts                # Tema MUI (paleta, overrides)
├── public/
│   └── manifest.json           # PWA manifest
├── package.json
├── tsconfig.json
├── next.config.js
└── next-env.d.ts
```

## Configuração

### Variáveis de ambiente

Crie um arquivo `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Instalação

```bash
cd frontend-next
npm install
npm run dev
```

### Build

```bash
npm run build
npm start
```

## Páginas migradas (38 total)

### Públicas
- `/login` — Login com e-mail/senha
- `/register` — Cadastro (prestador/cliente)
- `/` — Redirect por role

### Prestador (Provider)
- `/dashboard` — Visão geral
- `/clients` — CRUD de clientes
- `/services` — CRUD de serviços
- `/agenda` — Agenda de agendamentos
- `/finance` — Financeiro
- `/works` — Trabalhos com campos customizados
- `/orders` — Pedidos recebidos
- `/profile` — Perfil

### Cliente (Client)
- `/home` — Home do cliente
- `/explore` — Explorar serviços
- `/my-orders` — Meus pedidos

### Fase 2-8 (todas autenticadas)
- `/payments` — Pagamentos
- `/wallet` — Carteira digital
- `/loyalty` — Fidelização
- `/packages` — Pacotes de sessões
- `/gift-cards` — Gift cards
- `/crm` — CRM
- `/inventory` — Estoque
- `/marketing` — Campanhas
- `/analytics` — Analytics
- `/employees` — Equipe
- `/commissions` — Comissões
- `/branches` — Unidades
- `/contracts` — Contratos
- `/quotes` — Orçamentos
- `/chat` — Chat
- `/social` — Feed social
- `/notifications` — Notificações
- `/workflows` — Automações
- `/homecare` — Atendimento domiciliar
- `/subscriptions` — Assinaturas
- `/referrals` — Indicações
- `/ai-agents` — Agentes de IA
- `/admin` — Administração
- `/api-keys` — Chaves de API
- `/webhooks` — Webhooks
- `/lgpd` — LGPD
- `/feature-flags` — Feature flags

## Status da Migração

- ✅ Setup Next.js 15 + MUI v6
- ✅ Contexts (Auth, Toast, Socket) migrados
- ✅ API service com todos os módulos
- ✅ Componentes base com MUI
- ✅ 38 páginas migradas
- ✅ i18n configurado (pt-BR, en-US)
- ✅ PWA manifest
- ✅ Autocompletes inteligentes (endereço, profissão, busca, categorias)
- ✅ npm install e build final (44 páginas estáticas geradas)
- ✅ Testes unitários com Vitest (46 testes — helpers, API client, serviços)
- ✅ Testes E2E com Cypress (auth, navigation, CRUD operations)

## Testes

### Unitários (Vitest)

```bash
npm test                # Rodar todos os testes (46)
npm run test:watch      # Modo watch
```

Cobertura:
- `src/utils/helpers.test.ts` — formatCurrency, formatDate, getInitials, getStatusLabel, formatCep
- `src/services/api/client.test.ts` — ApiClient (token management, HTTP methods, error handling)
- `src/services/api/services.test.ts` — Módulos de API (team, payments, operations, engagement, platform, admin)

### E2E (Cypress)

```bash
npm run cypress:run     # Rodar E2E headless
npm run cypress         # Abrir Cypress interativo
```

Suítes:
- `cypress/e2e/auth.cy.ts` — Login/logout, credenciais inválidas, redirect, toggle de senha
- `cypress/e2e/navigation.cy.ts` — Navegação e visibilidade de 30+ páginas
- `cypress/e2e/crud.cy.ts` — Operações CRUD para clientes, serviços, funcionários, estoque, etc.
