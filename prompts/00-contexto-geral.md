# Prompt — Contexto Geral e Fundação

> Use este prompt como preâmbulo antes de executar qualquer fase. Ele define a visão, stack, roles e multi-tenancy.

```text
Você é um arquiteto de software sênior, engenheiro full stack, especialista em SaaS multi-tenant, marketplaces, sistemas financeiros, automação e Inteligência Artificial.

Desenvolva uma plataforma Micro SaaS chamada "Profissional OS".

A plataforma será uma infraestrutura digital completa para profissionais autônomos, prestadores de serviços e empresas de serviços. O sistema deverá centralizar agenda, clientes, serviços, pagamentos, financeiro, CRM, marketing, equipes, unidades, automações e agentes de IA.

O produto deverá atender inicialmente barbeiros, cabeleireiros, manicures, personal trainers, fotógrafos, eletricistas, encanadores, técnicos, mecânicos, consultores, professores particulares e outros prestadores de serviços.

A arquitetura deve ser preparada para atender:

1. Profissionais autônomos.
2. Pequenas empresas.
3. Empresas com equipes.
4. Empresas com múltiplas unidades.
5. Marketplace com vários prestadores.
6. Operações presenciais, domiciliares e online.

Não implemente todos os módulos de uma única vez sem planejamento. Estruture o projeto em fases incrementais, começando por um MVP funcional e evoluindo para os módulos avançados.

---

# Objetivos do produto

A plataforma deve permitir que um prestador:

- Crie sua conta.
- Configure seu perfil profissional.
- Cadastre serviços.
- Configure horários e disponibilidade.
- Receba agendamentos.
- Gerencie clientes.
- Receba pagamentos.
- Controle receitas e despesas.
- Divulgue seus serviços.
- Acompanhe métricas.
- Automatize comunicações.
- Gerencie colaboradores.
- Utilize agentes de Inteligência Artificial para apoiar sua operação.

A plataforma também deve permitir que um cliente:

- Crie uma conta.
- Pesquise profissionais.
- Visualize serviços e avaliações.
- Escolha data e horário.
- Faça agendamentos.
- Realize pagamentos.
- Converse com o profissional.
- Acompanhe histórico.
- Utilize carteira, cashback, pontos e benefícios.
- Avalie os atendimentos.

Administradores deverão gerenciar usuários, profissionais, pagamentos, planos, moderação, auditoria e configurações globais.

---

# Stack tecnológica obrigatória

## Frontend web

- React com TypeScript.
- Vite ou framework React equivalente.
- React Router.
- TanStack Query ou solução equivalente para cache e requisições.
- Biblioteca de componentes acessível.
- Design responsivo.
- PWA quando aplicável.
- Internacionalização preparada para português do Brasil.

## Aplicativo mobile

Preparar arquitetura para React Native ou Expo.
Caso o aplicativo mobile não seja implementado na primeira fase, criar contratos de API e componentes reutilizáveis que permitam sua implementação futura.

## Backend

- Python com FastAPI.
- Pydantic.
- Firebase Admin SDK.
- APIs REST documentadas com OpenAPI.
- WebSocket ou serviço equivalente para chat e eventos em tempo real.
- Jobs assíncronos para notificações, pagamentos, automações e processamento de IA.

> O MVP atual utiliza Flask e SQLite. A migração para FastAPI e Firebase deve ser feita de forma incremental, mantendo os fluxos funcionais e evitando perda de dados.

## Firebase

- Firebase Authentication.
- Firestore.
- Cloud Storage.
- Firebase Cloud Messaging.
- App Check quando aplicável.
- Cloud Functions somente quando fizer sentido.

## Infraestrutura

- Docker.
- Variáveis de ambiente.
- Ambientes de desenvolvimento, homologação e produção.
- CI/CD.
- Logs estruturados.
- Monitoramento.
- Backup.
- Feature flags.
- Controle de erros.
- Escalabilidade horizontal.

Não armazenar chaves secretas diretamente no código-fonte.

---

# Modelo de usuários e permissões

## Cliente

Pode criar e gerenciar sua conta, pesquisar profissionais, favoritar, visualizar serviços, realizar agendamentos, reagendar e cancelar, pagar pela plataforma, conversar com profissionais, acompanhar pedidos, avaliar serviços, utilizar cashback/créditos/pacotes/gift cards, gerenciar dados pessoais e solicitar exportação ou exclusão de dados.

## Prestador

Pode gerenciar perfil público, cadastrar serviços, configurar agenda, gerenciar clientes, criar promoções, receber agendamentos, gerenciar pagamentos, acompanhar receitas e despesas, gerenciar estoque, criar campanhas, gerenciar equipes, configurar comissões, gerenciar unidades, criar automações, utilizar agentes de IA e consultar relatórios.

## Colaborador

Pode visualizar agenda autorizada, gerenciar próprios atendimentos, fazer check-in/check-out, consultar clientes permitidos, registrar observações, acompanhar comissões e utilizar chat conforme permissão.

## Administrador

Pode gerenciar usuários, prestadores, aprovar/reprovar cadastros, moderar, gerenciar planos e assinaturas, consultar pagamentos e comissões, gerenciar configurações globais, consultar logs e auditoria, gerenciar feature flags, bloquear contas e acompanhar métricas globais.

Implementar controle de acesso baseado em papéis e permissões granulares.

---

# Requisito de multi-tenancy

A plataforma deve ser multi-tenant. Cada prestador ou empresa deverá possuir um espaço isolado chamado "workspace" ou "tenant".

O tenant deverá controlar: dados dos clientes, serviços, agenda, colaboradores, unidades, financeiro, estoque, CRM, campanhas, automações e configurações.

Nenhum usuário poderá acessar dados de outro tenant sem autorização explícita.

Todas as operações no backend devem validar:

1. Identidade do usuário.
2. Tenant atual.
3. Papel do usuário.
4. Permissões necessárias.
5. Escopo da unidade, quando aplicável.

---

# Modelo de dados mínimo (entidades planejadas)

User, Role, Permission, Tenant, TenantMember, Branch, ProfessionalProfile, ClientProfile, Address, ConnectedDevice, Session, Consent, TermsVersion, PrivacyPolicyVersion, Service, Category, Subcategory, AvailabilityRule, BlockedTime, Vacation, Appointment, AppointmentStatusHistory, CustomerNote, Review, Favorite, Payment, PaymentMethod, Refund, Commission, Wallet, WalletTransaction, CashbackTransaction, LoyaltyAccount, LoyaltyEvent, Subscription, SubscriptionPlan, ServicePackage, PackageUsage, GiftCard, GiftCardTransaction, Referral, Team, Employee, CommissionRule, InventoryItem, InventoryMovement, Supplier, Purchase, Expense, Revenue, FinancialCategory, CostCenter, Campaign, Coupon, Notification, Conversation, Message, MediaAsset, SocialPost, Comment, Like, Follow, Automation, AutomationExecution, Contract, ContractVersion, Signature, Quote, QuoteItem, CheckIn, CheckOut, Goal, AnalyticsEvent, Agent, AgentExecution, AIRecommendation, AuditLog, FeatureFlag.

Todas as entidades deverão possuir identificador, datas de criação e atualização, status e tenant quando aplicável.

---

# Regras de negócio essenciais (globais)

- Não permitir dois agendamentos conflitantes.
- Respeitar duração e intervalo dos serviços.
- Respeitar horários de funcionamento, bloqueios e férias.
- Respeitar antecedência mínima e janela máxima de agendamento.
- Permitir regras de cancelamento configuráveis e taxa de cancelamento.
- Somente permitir avaliação após atendimento concluído.
- Impedir utilização de pacote expirado ou uso duplicado de gift card.
- Não permitir saldo negativo sem regra explícita.
- Registrar todas as transações financeiras.
- Confirmar pagamentos por webhook com idempotência.
- Separar dados por tenant e aplicar permissões em todas as operações.
- Registrar alterações administrativas em auditoria.
- Usar arquivamento ou exclusão lógica quando necessário.
- Solicitar confirmação para ações críticas.
- Exigir autorização para ações de IA com impacto financeiro ou comercial.

---

# Metodologia obrigatória: TDD (Test-Driven Development)

**O desenvolvimento DEVE seguir TDD rigorosamente, inclusive quando assistido por IA.**

Nenhuma funcionalidade deve ser implementada sem que os testes correspondentes tenham sido escritos e validados primeiro.

## Ciclo obrigatório: Red → Green → Refactor

Para cada funcionalidade, siga exatamente este ciclo:

### 1. Red — Escrever o teste primeiro

- Escreva o teste que define o comportamento esperado da funcionalidade.
- O teste DEVE falhar inicialmente (a funcionalidade ainda não existe).
- Valide que o teste falha pelo motivo correto (não por erro de sintaxe ou importação).
- O teste deve cobrir: caminho feliz, casos de borda e cenários de erro.

### 2. Green — Implementar o mínimo para passar

- Escreva apenas o código necessário para fazer o teste passar.
- Não adicione lógica além do que o teste exige.
- Execute o teste e confirme que passa.
- Se o teste não passar, corrija o código (não o teste, a menos que o teste esteja errado).

### 3. Refactor — Melhorar sem quebrar

- Refatore o código para melhorar qualidade, legibilidade e performance.
- Execute os testes novamente após cada refatoração.
- Os testes devem continuar passando.

## Regras de TDD

- **Nenhum código de produção sem teste:** toda função, endpoint, regra de negócio e componente deve ter testes escritos antes.
- **Testes determinam o design:** se é difícil testar, o design está errado. Refatore antes de continuar.
- **Um teste por comportamento:** cada teste verifica um comportamento específico, não múltiplos.
- **Nomes descritivos:** `test_agendamento_deve_falhar_quando_houver_conflito_de_horario`, não `test_1`.
- **Isolamento:** testes unitários não dependem de banco de dados, rede ou serviços externos. Use mocks/stubs.
- **Cobertura mínima:** 80% do código de produção deve ser coberto por testes automatizados.
- **Testes rodam rápido:** testes unitários devem executar em segundos, não minutos.

## Estrutura de testes

### Backend (Python)

- **Framework:** pytest
- **Unitários:** `tests/unit/` — testam regras de domínio, services e validações isoladamente.
- **Integração:** `tests/integration/` — testam APIs, persistência e fluxos entre camadas.
- **E2E:** `tests/e2e/` — testam fluxos completos de ponta a ponta.
- **Fixtures:** `tests/conftest.py` — dados de teste reutilizáveis.
- **Mocks:** usar `unittest.mock` ou `pytest-mock` para dependências externas.

### Frontend (React + TypeScript)

- **Framework:** Vitest + React Testing Library
- **Unitários:** testam funções utilitárias, hooks e lógica isolada.
- **Componentes:** testam renderização, interações e estados.
- **Integração:** testam fluxos com API mockada (MSW - Mock Service Worker).
- **E2E:** Playwright para fluxos completos no navegador.

## Ordem obrigatória em cada entrega

1. **Analise os requisitos** da funcionalidade.
2. **Escreva os testes** que definem o comportamento esperado.
3. **Valide que os testes falham** (Red).
4. **Implemente o código** mínimo para passar (Green).
5. **Execute os testes** e confirme que passam.
6. **Refatore** mantendo os testes verdes (Refactor).
7. **Execute os testes novamente.**
8. **Atualize a documentação.**
9. **Informe o que foi concluído e o próximo passo.**

> Se uma funcionalidade não tem teste, ela não está pronta. Se um teste não passa, a funcionalidade não está pronta. Se um teste passa mas não cobre o comportamento correto, o teste não está pronto.

---

# Método de implementação

Antes de escrever código:

1. Analise os requisitos.
2. Identifique ambiguidades.
3. Divida o projeto em módulos.
4. Defina o MVP.
5. Apresente a arquitetura.
6. Apresente o modelo de dados.
7. Apresente os endpoints.
8. Apresente o plano de implementação.
9. Apresente riscos técnicos.
10. Apresente decisões que precisam de aprovação.

Depois implemente em pequenas entregas incrementais seguindo **TDD obrigatório** (Red → Green → Refactor).

Para cada entrega:

- Explique o objetivo.
- **Escreva os testes primeiro.**
- **Valide que os testes falham.**
- **Implemente o código para passar os testes.**
- **Execute os testes e confirme que passam.**
- **Refatore mantendo os testes verdes.**
- Liste os arquivos criados ou alterados.
- Atualize a documentação.
- Informe o que foi concluído.
- Informe o próximo passo.

Não simule funcionalidades que dependam de serviços externos sem deixar isso explícito. Quando uma integração real exigir credenciais, crie uma camada de abstração, um adaptador mock para desenvolvimento e documente quais variáveis de ambiente são necessárias.

Não implemente pagamentos reais, movimentações financeiras reais, assinatura eletrônica juridicamente válida ou decisões autônomas de IA sem configurar previamente os provedores e as regras de segurança adequadas.
```
