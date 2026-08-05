# Prompt — Mapeamento de Bugs e Melhorias

> Use este prompt como referência completa de dívidas técnicas, bugs conhecidos e melhorias necessárias em todo o projeto Profissional OS. Execute os prompts `10` a `17` em ordem para corrigir e melhorar incrementalmente.

```text
Você é um arquiteto de software sênior, engenheiro full stack, especialista em SaaS multi-tenant, marketplaces, sistemas financeiros, automação e Inteligência Artificial.

O projeto Profissional OS está com 8 fases backend e 38 páginas frontend implementadas. Agora precisamos corrigir bugs, melhorar a qualidade do código, adicionar testes faltantes e preparar a plataforma para produção.

Abaixo está o mapeamento completo de issues encontradas, organizadas por categoria e prioridade.

---

# MAPA DE ISSUES — Profissional OS

## 🔴 BUGS CRÍTICOS (Prioridade Máxima)

### BUG-01: Login não redireciona por role
- **Arquivo:** `frontend/src/pages/LoginPage.tsx:22`, `frontend/src/pages/RegisterPage.tsx:28`
- **Problema:** Após login/register, sempre redireciona para `/dashboard` mesmo se o usuário for `client` (deveria ir para `/home`).
- **Correção:** Verificar `user.role` e redirecionar: provider → `/dashboard`, client → `/home`.

### BUG-02: Auth usa userId como token (sem JWT)
- **Arquivo:** `backend/app.py:98-106`, `frontend/src/services/api.ts:21,36`
- **Problema:** Autenticação envia `userId` em texto plano no header `Authorization: Bearer <user_id>`. Qualquer pessoa pode forjar um ID.
- **Correção:** Implementar JWT com `PyJWT` no backend, assinado com `SECRET_KEY`. Frontend armazena e envia o token JWT.

### BUG-03: Rate limiter em memória não persiste entre reinícios
- **Arquivo:** `backend/services/public_api_service.py:11-25`
- **Problema:** `_rate_limiter` é um `defaultdict` em memória. Reiniciar o servidor zera os contadores. Não funciona com múltiplos workers.
- **Correção:** Migrar para Redis ou SQLite para persistência de rate limiting.

### BUG-04: Webhook delivery é mockado (sempre sucesso)
- **Arquivo:** `backend/services/public_api_service.py:118-126`
- **Problema:** `deliver_webhook` sempre retorna 200 sem fazer HTTP real. Webhooks nunca são entregues de fato.
- **Correção:** Implementar delivery HTTP real com `requests` ou `httpx`, com retry, timeout e registro de status.

### BUG-05: LGPD deletion não anonimiza todos os dados
- **Arquivo:** `backend/services/lgpd_service.py:127-136`
- **Problema:** Deleta apenas `Client`, `Appointment`, `Transaction`. Não deleta `Payment`, `Wallet`, `WalletTransaction`, `SocialPost`, `Message`, `Review`, `Notification`, `Employee`, etc.
- **Correção:** Anonimizar ou deletar TODAS as entidades relacionadas ao usuário.

### BUG-06: SECRET_KEY com valor padrão em produção
- **Arquivo:** `backend/config.py:12`
- **Problema:** `SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')`. Se a env var não estiver setada, usa valor hardcoded.
- **Correção:** Falhar startup se `SECRET_KEY` não estiver definida em produção.

### BUG-07: Sem validação de content-type nos uploads
- **Arquivo:** Backend não valida MIME type de uploads
- **Problema:** Não há validação de tipo de arquivo em uploads de fotos, vídeos, documentos.
- **Correção:** Validar MIME type, extensão e tamanho máximo em todos os endpoints de upload.

## 🟡 BUGS MÉDIOS (Prioridade Alta)

### BUG-08: Páginas Phase 2-8 sem estado de loading
- **Arquivo:** Todas as 27 páginas novas (Phase 2-8)
- **Problema:** Nenhuma página tem `loading` state. Usuário vê tela vazia enquanto dados carregam. Apenas `LoginPage` e `RegisterPage` têm loading.
- **Correção:** Adicionar `loading` state com spinner/skeleton em todas as páginas.

### BUG-09: Páginas Phase 2-8 sem tratamento de erro de conexão
- **Arquivo:** Todas as 27 páginas novas
- **Problema:** Se a API estiver offline, `load()` falha silenciosamente. Sem mensagem de erro para o usuário.
- **Correção:** Adicionar `error` state e exibir mensagem de erro com botão "tentar novamente".

### BUG-10: useEffect sem cleanup ou dependências
- **Arquivo:** Todas as 27 páginas novas — `useEffect(() => { load(); }, [])`
- **Problema:** `load` não está na dependency array. Pode causar stale closures. Sem cleanup para abortar fetch se componente desmontar.
- **Correção:** Usar `useCallback` para `load` e `AbortController` para cancelar fetch.

### BUG-11: ProfilePage não atualiza form quando user muda
- **Arquivo:** `frontend/src/pages/ProfilePage.tsx:9-16`
- **Problema:** `useState` inicializa com `user?.name` mas não atualiza se `user` mudar (ex: após login). Form fica com dados vazios.
- **Correção:** Adicionar `useEffect` para sincronizar form quando `user` mudar.

### BUG-12: Sem confirmação em ações destrutivas
- **Arquivo:** Múltiplas páginas (delete client, revoke API key, disable webhook, reject quote, etc.)
- **Problema:** Ações de exclusão/revogação são executadas imediatamente sem confirmação.
- **Correção:** Adicionar modal de confirmação para todas as ações destrutivas.

### BUG-13: API_BASE_URL hardcoded
- **Arquivo:** `frontend/src/services/api.ts:13`
- **Problema:** `const API_BASE_URL = 'http://localhost:5000'`. Não funciona em produção.
- **Correção:** Usar `import.meta.env.VITE_API_URL` com fallback para localhost.

### BUG-14: Sem paginação em listagens
- **Arquivo:** Backend e frontend — todas as listagens (clients, appointments, transactions, etc.)
- **Problema:** Todas as listagens retornam todos os registros. Performance degrada com volume.
- **Correção:** Implementar paginação com `?page=1&limit=20` no backend e controles no frontend.

### BUG-15: Toast não tem botão de fechar
- **Arquivo:** `frontend/src/contexts/ToastContext.tsx:30-34`
- **Problema:** Toasts desaparecem após 3-5s mas não têm botão X para fechar manualmente.
- **Correção:** Adicionar botão de fechar em cada toast.

## 🟢 MELHORIAS DE QUALIDADE (Prioridade Média)

### MEL-01: Zero acessibilidade (a11y)
- **Arquivo:** Todo o frontend
- **Problema:** Sem `aria-label`, `role`, `tabIndex`, `sr-only`. Inputs sem `id` (label não associa). Botões de ícone sem label acessível.
- **Correção:** Adicionar ARIA labels, associar labels com `htmlFor`/`id`, adicionar `focus-visible` styles.

### MEL-02: Sem testes frontend
- **Arquivo:** `frontend/` — nenhum teste existe
- **Problema:** 679 testes no backend mas 0 no frontend. Sem Vitest, Testing Library ou Playwright.
- **Correção:** Configurar Vitest + Testing Library. Escrever testes para: AuthContext, ToastContext, Layout, páginas principais (Login, Register, Dashboard), API client.

### MEL-03: Sem TanStack Query
- **Arquivo:** Todo o frontend
- **Problema:** Cada página faz fetch manual com `useEffect` + `useState`. Sem cache, sem retry, sem dedup, sem optimistic updates.
- **Correção:** Migrar para TanStack Query (React Query) para cache, refetch e sincronização.

### MEL-04: Sem lazy loading de páginas
- **Arquivo:** `frontend/src/App.tsx`
- **Problema:** Todas as 38 páginas são importadas estaticamente. Bundle de 366 KB carrega tudo de uma vez.
- **Correção:** Usar `React.lazy()` + `Suspense` para code-splitting por rota.

### MEL-05: Sem Error Boundary
- **Arquivo:** `frontend/src/App.tsx`
- **Problema:** Erro em qualquer componente derruba a app inteira sem recovery.
- **Correção:** Adicionar Error Boundary com UI de fallback e botão "tentar novamente".

### MEL-06: Sem debounce em buscas
- **Arquivo:** `frontend/src/pages/ClientsPage.tsx`, `frontend/src/pages/ExplorePage.tsx`, `frontend/src/pages/CRMPage.tsx`
- **Problema:** Cada tecla dispara uma busca. Pode sobrecarregar a API.
- **Correção:** Adicionar debounce de 300ms em campos de busca.

### MEL-07: Sem i18n (internacionalização)
- **Arquivo:** Todo o frontend
- **Problema:** Textos hardcoded em pt-BR. Sem preparação para outros idiomas.
- **Correção:** Configurar `react-i18next` com namespace por página. Extrair strings para arquivos de tradução.

### MEL-08: Sem PWA
- **Arquivo:** Frontend
- **Problema:** Sem service worker, sem manifest.json, sem offline support.
- **Correção:** Configurar `vite-plugin-pwa` com manifest, icons e estratégia de cache.

### MEL-09: Backend sem migrações de banco
- **Arquivo:** `backend/`
- **Problema:** Usa `db.create_all()`. Sem Alembic para migrações. Mudanças no schema exigem recriar banco.
- **Correção:** Configurar Flask-Migrate (Alembic) com migrações versionadas.

### MEL-10: Sem Docker
- **Arquivo:** Raiz do projeto
- **Problema:** Sem Dockerfile, sem docker-compose. Setup manual apenas.
- **Correção:** Criar `Dockerfile` para backend e frontend, `docker-compose.yml` com SQLite volume.

## 🔵 MELHORIAS DE ARQUITETURA (Prioridade Baixa)

### ARQ-01: Migração Flask → FastAPI
- **Problema:** Flask é síncrono. Sem async, sem WebSocket nativo, sem validação Pydantic.
- **Correção:** Migrar para FastAPI gradualmente, mantendo compatibilidade de rotas.

### ARQ-02: Sem WebSocket para tempo real
- **Problema:** Chat e notificações são polling HTTP. Sem push em tempo real.
- **Correção:** Implementar WebSocket com Flask-SocketIO ou migrar para FastAPI com WebSocket nativo.

### ARQ-03: Sem jobs assíncronos
- **Problema:** Lembretes, notificações, webhooks são síncronos. Bloqueiam a request.
- **Correção:** Configurar Celery + Redis ou RQ para jobs em background.

### ARQ-04: Sem CI/CD
- **Problema:** Sem pipeline de testes, build ou deploy automático.
- **Correção:** Configurar GitHub Actions: lint → test → build → deploy.

### ARQ-05: Sem monitoramento externo
- **Problema:** Logs apenas em arquivo local. Sem Sentry, sem métricas Prometheus.
- **Correção:** Integrar Sentry para erros, Prometheus/Grafana para métricas.

### ARQ-06: SQLite não suporta concorrência
- **Problema:** SQLite bloqueia escritas concorrentes. Não escala para múltiplos usuários.
- **Correção:** Migrar para PostgreSQL para produção.

---

# ORDEM DE EXECUÇÃO DOS PROMPTS DE CORREÇÃO

| Ordem | Arquivo | Categoria | Issues Endereçadas |
|-------|---------|----------|-------------------|
| 10 | `10-correcao-bugs-criticos.md` | Bugs Críticos | BUG-01, BUG-02, BUG-06, BUG-07 |
| 11 | `11-correcao-bugs-medios.md` | Bugs Médios | BUG-08, BUG-09, BUG-10, BUG-11, BUG-12, BUG-13, BUG-15 |
| 12 | `12-melhorias-frontend.md` | Melhorias Frontend | MEL-01, MEL-04, MEL-05, MEL-06, BUG-14 |
| 13 | `13-testes-frontend.md` | Testes Frontend | MEL-02 |
| 14 | `14-melhorias-backend.md` | Melhorias Backend | BUG-03, BUG-04, BUG-05, MEL-09, BUG-14 |
| 15 | `15-infraestrutura-devops.md` | Infra & DevOps | MEL-10, ARQ-04, ARQ-05, ARQ-06 |
| 16 | `16-preparacao-mobile-pwa.md` | Mobile & PWA | MEL-07, MEL-08, ARQ-02 |
| 17 | `17-migracao-fastapi.md` | Migração Arquitetura | ARQ-01, ARQ-03 |

Cada prompt é autocontido e inclui:
- Contexto do problema
- Arquivos a modificar
- Critérios de aceite
- Testes obrigatórios (TDD)

Execute em ordem. Não pule etapas. Valide cada uma antes de avançar.
```
