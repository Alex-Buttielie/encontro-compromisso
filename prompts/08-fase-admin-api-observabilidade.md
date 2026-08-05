# Prompt — Fase 8: Administração, API Pública, Observabilidade e Mobile

> Pré-requisito: Fase 7 concluída e validada.
> **TDD obrigatório:** todos os testes devem ser escritos e validados (Red) antes de implementar qualquer funcionalidade (Green). Refatore mantendo os testes verdes.

```text
Implemente a Fase 8 do Profissional OS — Painel administrativo, API pública, observabilidade, LGPD avançada e preparação mobile.

**Lembre-se: TDD é obrigatório.** Para cada funcionalidade abaixo, siga o ciclo Red → Green → Refactor. Escreva os testes primeiro, valide que falham, implemente o mínimo para passar, refatore e confirme que os testes continuam passando.

---

## Administração

Criar painel administrativo com:

- Dashboard global.
- Gestão de usuários e profissionais.
- Aprovação de cadastros e moderacao de perfis, publicações, comentários e avaliações.
- Gestão de planos, assinaturas e pagamentos.
- Gestão de comissões da plataforma.
- Configurações globais, permissões e feature flags.
- Auditoria e logs.
- Bloqueio e desbloqueio de contas.
- Métricas de utilização e relatórios operacionais.

Toda ação administrativa deve ser registrada em auditoria.

## API pública

Criar API documentada com:

- Autenticação e chaves de API.
- Endpoints para usuários, tenants, perfis, serviços, categorias, agenda, agendamentos, clientes, pagamentos, carteira, avaliações, chat, notificações, CRM, financeiro, estoque, equipes, unidades, assinaturas, pacotes, gift cards, automações, agentes de IA e administração.

Implementar:

- Versionamento de API.
- Paginação, filtros e ordenação.
- Idempotência.
- Validação e tratamento padronizado de erros.
- Logs de requisições.
- Webhooks.
- Permissões por escopo.
- Documentação OpenAPI.

## Observabilidade

Implementar:

- Logs estruturados com correlação por request ID.
- Monitoramento de erros, métricas de API e jobs.
- Métricas de pagamentos, notificações e custo de IA.
- Auditoria de ações críticas.
- Alertas de falha.
- Monitoramento de uso por tenant.

Nunca registrar senhas, tokens, dados completos de cartão ou informações sensíveis desnecessárias.

## LGPD, segurança e privacidade

Implementar obrigatoriamente:

- Consentimento e aceite versionado de termos.
- Exportação, correção, portabilidade e exclusão de dados.
- Minimização e retenção configurável.
- Controle de acesso baseado em papéis e permissões.
- Criptografia em trânsito e proteção de dados sensíveis.
- Gestão de sessões e revogação de dispositivos.
- MFA preparado.
- Rate limiting e proteção contra abuso.
- Validação de uploads e sanitização de entradas.
- Auditoria de ações administrativas e financeiras.
- Segredos somente em variáveis de ambiente.
- Backup e recuperação.

## Preparação mobile

- Revisar contratos de API para compatibilidade com React Native/Expo.
- Garantir que componentes reutilizáveis estejam preparados para mobile.
- Documentar endpoints utilizados pelo app mobile futuro.
- Criar protótipo de navegação mobile (opcional).

---

## Testes obrigatórios desta fase

### Testes unitários

- Permissões administrativas.
- Validação de webhooks externos.
- Rate limiting.
- Sanitização de entradas.

### Testes de integração

- API pública com chaves e escopos.
- Observabilidade com logs estruturados.
- Exportação e exclusão de dados (LGPD).

### Testes end-to-end

1. Administrador bloqueia conta de usuário.
2. Administrador aprova cadastro de prestador.
3. Administrador modera publicação denunciada.
4. Terceiro consome API pública com chave válida.
5. Usuário solicita exportação de dados.
6. Sistema gera arquivo e registra em auditoria.
7. Usuário solicita exclusão de conta.
8. Sistema exclui dados e registra em auditoria.

---

## Critérios de aceite

- Painel administrativo com auditoria de todas as ações.
- API pública documentada com OpenAPI.
- Webhooks externos funcionando.
- Logs estruturados com request ID.
- Exportação e exclusão de dados conforme LGPD.
- Rate limiting e sanitização operacionais.
- Backup e recuperação testados.
- Contratos de API preparados para mobile.
- Testes principais passando.
- Documentação completa (instalação, execução, deploy, API, arquitetura).
```
