# Prompt — Fase 7: Assinaturas, Indicações e Inteligência Artificial Multiagente

> Pré-requisito: Fase 6 concluída e validada.
> **TDD obrigatório:** todos os testes devem ser escritos e validados (Red) antes de implementar qualquer funcionalidade (Green). Refatore mantendo os testes verdes.

```text
Implemente a Fase 7 do Profissional OS — Assinaturas recorrentes, programa de indicação e sistema de IA multiagente.

**Lembre-se: TDD é obrigatório.** Para cada funcionalidade abaixo, siga o ciclo Red → Green → Refactor. Escreva os testes primeiro, valide que falham, implemente o mínimo para passar, refatore e confirme que os testes continuam passando.

---

## Assinaturas

Implementar:

- Planos recorrentes com renovação automática.
- Cancelamento, suspensão e falha de cobrança.
- Retentativas e benefícios exclusivos.
- Histórico de cobranças e controle de recorrência.

## Programa de indicação

Implementar:

- Indicação de clientes e profissionais.
- Código de indicação e link personalizado.
- Recompensas e controle de conversões.
- Status da indicação e ranking.

## Sistema de Inteligência Artificial multiagente

Criar uma arquitetura de agentes especializados, com um agente coordenador.

### Agente Executivo

- Coordena os demais agentes.
- Prioriza tarefas e consolida informações.
- Solicita aprovação humana em ações sensíveis.

### Agentes especializados

- **Financeiro:** fluxo de caixa, precificação, lucro, projeções e anomalias.
- **CRM:** segmentação, fidelização, clientes inativos e pós-venda.
- **Marketing:** campanhas, promoções, públicos e resultados.
- **Conteúdo:** legendas, hashtags, roteiros, artes e vídeos.
- **Social:** engajamento, tendências e horários ideais.
- **Agenda:** otimização, encaixes e reagendamentos.
- **Comercial:** upsell, cross-sell e pacotes.
- **Analytics:** KPIs e insights.
- **Logística:** rotas e agrupamentos.
- **Estoque:** compras e reposição.
- **Reputação:** respostas a avaliações e reclamações.
- **Crescimento:** expansão e novos mercados.
- **Segurança:** fraudes e contas falsas.
- **Support:** FAQ e atendimento automático.

### Regras obrigatórias para IA

- Não executar ações financeiras irreversíveis sem confirmação humana.
- Não enviar campanhas automaticamente sem autorização configurável.
- Registrar prompts, respostas, decisões e ações.
- Permitir revisão humana e desligamento por agente.
- Respeitar permissões do usuário e isolamento entre tenants.
- Não expor dados de outros usuários.
- Implementar limites de custo e uso.
- Informar quando uma resposta foi gerada por IA.
- Não utilizar dados pessoais para treinamento sem consentimento válido.

---

## Testes obrigatórios desta fase

### Testes unitários

- Regras de assinatura (renovação, falha, retentativa).
- Validação de indicações (código, conversão, recompensa).
- Limites de custo e uso dos agentes de IA.

### Testes de integração

- Gateway de assinaturas recorrentes (sandbox).
- Execução de agentes com adaptador mock de LLM.
- Registro de auditoria de IA.

### Testes end-to-end

1. Cliente assina plano mensal.
2. Cobrança recorrente processada (sandbox).
3. Cliente indica amigo com link personalizado.
4. Amigo se cadastra e converte indicação.
5. Prestador ativa Agente Financeiro.
6. Agente sugere precificação baseada em histórico.
7. Prestador revisa e aprova sugestão.
8. Sistema registra recomendação em auditoria.

---

## Critérios de aceite

- Assinaturas recorrentes com retentativas funcionando.
- Programa de indicação com recompensas e ranking.
- Agentes de IA executando via adaptador mock (ou provedor real configurado).
- Ações de IA com impacto financeiro exigindo aprovação humana.
- Registro completo de prompts, respostas e ações de IA.
- Limites de custo operacionais.
- Testes principais passando.
```
