# Prompts para desenvolvimento do Profissional OS

Este diretório contém o prompt técnico estruturado em fases independentes para execução incremental em ferramentas de desenvolvimento assistido por IA.

## Como usar

1. **Sempre comece pelo `00-contexto-geral.md`** — ele define a visão, stack, roles, multi-tenancy, regras globais e **metodologia TDD obrigatória**.
2. **Execute uma fase por vez** — cada arquivo é autocontido e pode ser colado diretamente na ferramenta de IA.
3. **Não pule fases** — cada fase depende da anterior estar concluída e validada.
4. **Valide os critérios de aceite** ao final de cada fase antes de avançar.
5. **TDD é obrigatório** — nenhum código de produção deve ser escrito sem que os testes correspondentes tenham sido escritos e validados primeiro (Red → Green → Refactor).

## Ordem de execução

| Ordem | Arquivo | Fase | Descrição |
|-------|---------|------|-----------|
| 0 | `00-contexto-geral.md` | — | Contexto, stack, roles, multi-tenancy, regras globais, **TDD obrigatório** e método de implementação |
| 1 | `01-fase-mvp.md` | MVP | Autenticação, perfis, serviços, agenda, agendamentos, marketplace, avaliações, dashboards |
| 2 | `02-fase-pagamentos.md` | Pagamentos | Gateway, carteira digital, fidelização, pacotes, gift cards |
| 3 | `03-fase-crm-erp.md` | Operação | CRM, ERP financeiro, estoque, marketing, analytics |
| 4 | `04-fase-equipes-multiunidade.md` | Escala | Equipes, comissões, multiunidade |
| 5 | `05-fase-rede-social-chat.md` | Engajamento | Rede social comercial, chat em tempo real, notificações |
| 6 | `06-fase-logistica-documentos-automacoes.md` | Logística | Atendimento domiciliar, documentos, contratos, orçamentos, check-in/out, Workflow Builder |
| 7 | `07-fase-assinaturas-ia.md` | Inteligência | Assinaturas recorrentes, indicações, agentes de IA multiagente |
| 8 | `08-fase-admin-api-observabilidade.md` | Plataforma | Administração, API pública, observabilidade, LGPD avançada, preparação mobile |

## Prompts de Correção e Melhoria (Pós-Fase 8)

Após concluir todas as 8 fases, execute os prompts de correção e melhoria na ordem abaixo:

| Ordem | Arquivo | Categoria | Issues Endereçadas |
|-------|---------|----------|-------------------|
| 9 | `09-mapeamento-bugs-melhorias.md` | Mapeamento | Mapa completo de 21 issues (7 bugs críticos, 8 bugs médios, 10 melhorias, 6 arquiteturais) |
| 10 | `10-correcao-bugs-criticos.md` | Bugs Críticos | BUG-01 (redirect role), BUG-02 (JWT), BUG-06 (SECRET_KEY), BUG-07 (upload validation) |
| 11 | `11-correcao-bugs-medios.md` | Bugs Médios | BUG-08 (loading), BUG-09 (error), BUG-10 (useEffect), BUG-11 (ProfilePage), BUG-12 (confirm dialog), BUG-13 (API URL), BUG-15 (toast close) |
| 12 | `12-melhorias-frontend.md` | Melhorias Frontend | MEL-01 (a11y), MEL-04 (lazy load), MEL-05 (error boundary), MEL-06 (debounce), BUG-14 (paginação) |
| 13 | `13-testes-frontend.md` | Testes Frontend | MEL-02 (Vitest + Testing Library, 9 suítes de teste) |
| 14 | `14-melhorias-backend.md` | Melhorias Backend | BUG-03 (rate limiter), BUG-04 (webhook real), BUG-05 (LGPD completo), MEL-09 (migrações), BUG-14 (paginação) |
| 15 | `15-infraestrutura-devops.md` | Infra & DevOps | MEL-10 (Docker), ARQ-04 (CI/CD), ARQ-05 (Sentry), ARQ-06 (PostgreSQL) |
| 16 | `16-preparacao-mobile-pwa.md` | Mobile & PWA | MEL-07 (i18n), MEL-08 (PWA), ARQ-02 (WebSocket) |
| 17 | `17-migracao-fastapi.md` | Migração | ARQ-01 (FastAPI), ARQ-03 (Celery + Redis) |

## Recomendações

- **Use o prompt em etapas:** um projeto com 32 grupos funcionais não deve ser gerado inteiro em uma única execução.
- **Comece pelo MVP:** autenticação, perfis, serviços, agenda, agendamento, marketplace e avaliações.
- **Não habilite pagamentos reais inicialmente:** utilize modo sandbox até validar os fluxos.
- **Defina o gateway antes da implementação financeira:** por exemplo, escolha entre provedores compatíveis com Pix, cartão, split e assinaturas.
- **Defina o provedor de IA:** os agentes precisam de limites de custo, permissões e aprovação humana.
- **Priorize o modelo multi-tenant:** erros nessa camada podem expor dados de diferentes empresas.
- **Implemente LGPD desde o início:** não deixe exportação, consentimento e exclusão de dados para o final.
- **Evite construir a rede social antes da operação principal:** marketplace, agenda e pagamentos são mais importantes para validar o produto.
- **Trate o ERP como módulo posterior:** primeiro valide se os profissionais realmente utilizam agenda, CRM e pagamentos.
- **Separe o plano comercial do técnico:** assinaturas da plataforma e assinaturas de serviços são fluxos diferentes.

## Ordem recomendada de desenvolvimento

1. Fundação do projeto, autenticação e multi-tenancy.
2. Perfis de cliente e prestador.
3. Serviços e categorias.
4. Agenda e agendamentos.
5. Marketplace.
6. Avaliações e notificações.
7. Pagamentos em sandbox.
8. Carteira, cashback e pacotes.
9. CRM e financeiro.
10. Equipes e comissões.
11. Multiunidade.
12. Chat.
13. Rede social comercial.
14. Automações.
15. Assinaturas, gift cards e indicações.
16. Analytics avançado.
17. Atendimento domiciliar e logística.
18. Agentes de IA.
19. Administração avançada.
20. Aplicativo mobile.

---

**Status:** prompt técnico estruturado e pronto para execução incremental. 8 fases de implementação + 9 prompts de correção/melhoria (bugs, testes, infraestrutura, PWA, migração FastAPI). 21 issues mapeadas com prioridade e critérios de aceite.
