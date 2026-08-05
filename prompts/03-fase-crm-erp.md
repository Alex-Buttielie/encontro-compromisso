# Prompt — Fase 3: CRM, ERP e Gestão Operacional

> Pré-requisito: Fase 2 concluída e validada.
> **TDD obrigatório:** todos os testes devem ser escritos e validados (Red) antes de implementar qualquer funcionalidade (Green). Refatore mantendo os testes verdes.

```text
Implemente a Fase 3 do Profissional OS — CRM, ERP financeiro, estoque, marketing e analytics.

**Lembre-se: TDD é obrigatório.** Para cada funcionalidade abaixo, siga o ciclo Red → Green → Refactor. Escreva os testes primeiro, valide que falham, implemente o mínimo para passar, refatore e confirme que os testes continuam passando.

---

## CRM

Implementar:

- Cadastro de clientes com histórico completo.
- Último atendimento, frequência e ticket médio.
- Preferências e segmentação.
- Clientes VIP e clientes inativos.
- Aniversariantes.
- Recuperação automática de clientes.
- Pós-venda e pesquisa de satisfação.
- Campanhas automáticas.

## ERP financeiro

Implementar:

- Fluxo de caixa, receitas e despesas.
- Categorias e centros de custo.
- DRE simplificado, lucro e prejuízo.
- Projeções financeiras e metas.
- Contas a pagar e contas a receber.
- Fechamento de período.
- Exportação de relatórios.

## Estoque

Implementar:

- Cadastro de produtos, categorias e fornecedores.
- Entradas, saídas e consumo automático por serviço.
- Inventário e estoque mínimo.
- Alertas de reposição.
- Compras e histórico de movimentações.

## Marketing

Implementar:

- Campanhas, cupons e promoções.
- Push, SMS e e-mail.
- Segmentação de público.
- Relatório de conversão.

## Analytics

Implementar:

- Receita mensal e anual.
- Ticket médio, conversão e cancelamentos.
- Retenção, CAC e LTV.
- Crescimento.
- Serviços e horários mais vendidos.
- Ocupação da agenda.
- Dashboard executivo com filtros por período, unidade, colaborador e serviço.

---

## Testes obrigatórios desta fase

### Testes unitários

- Cálculos financeiros (lucro, projeções, DRE).
- Regras de estoque (mínimo, consumo automático).
- Segmentação de clientes.
- Cálculo de comissões.

### Testes de integração

- Sincronização entre estoque e agendamentos.
- Campanhas de marketing (envio mock).
- Relatórios de analytics com dados reais.

### Testes end-to-end

1. Cadastrar produto e fornecedor.
2. Registrar entrada de estoque.
3. Agendar serviço que consome produto.
4. Verificar baixa automática no estoque.
5. Gerar relatório de fluxo de caixa.
6. Criar campanha de marketing para clientes inativos.
7. Consultar dashboard executivo com filtros.

---

## Critérios de aceite

- Fluxo de caixa com dados reais.
- Estoque com consumo automático funcionando.
- Campanhas enviando via adaptador mock.
- Dashboard executivo com filtros operacionais.
- Relatórios exportáveis.
- Testes principais passando.
```
