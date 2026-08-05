# Prompt — Fase 2: Pagamentos, Carteira e Fidelização

> Pré-requisito: Fase 1 concluída e validada.
> **TDD obrigatório:** todos os testes devem ser escritos e validados (Red) antes de implementar qualquer funcionalidade (Green). Refatore mantendo os testes verdes.

```text
Implemente a Fase 2 do Profissional OS — Pagamentos, carteira digital e fidelização.

**Lembre-se: TDD é obrigatório.** Para cada funcionalidade abaixo, siga o ciclo Red → Green → Refactor. Escreva os testes primeiro, valide que falham, implemente o mínimo para passar, refatore e confirme que os testes continuam passando.

---

## Pagamentos

Preparar integração com gateway compatível com o Brasil para:

- Pix.
- Cartão de crédito.
- Cartão de débito, quando suportado.
- QR Code.
- Cupons.
- Parcelamento.
- Reembolso.
- Estorno.
- Split de pagamento.
- Comissão da plataforma.
- Assinaturas recorrentes.
- Gift Cards.
- Créditos pré-pagos.

Não armazenar dados completos de cartão. Utilizar tokenização e os recursos do gateway.

O sistema deverá possuir idempotência para pagamentos e webhooks.

Estados de pagamento:

- Pendente.
- Autorizado.
- Processando.
- Pago.
- Falhou.
- Cancelado.
- Estornado parcialmente.
- Estornado integralmente.
- Em disputa.

## Carteira digital

Implementar:

- Saldo.
- Extrato.
- Recebimentos.
- Saques.
- Transferências internas.
- Cashback.
- Créditos promocionais.
- Histórico de movimentações.

Toda movimentação deve gerar um registro contábil imutável, com:

- Identificador, tipo, valor, usuário, tenant.
- Origem, destino, data, status.
- Referência externa e metadados.

## Fidelização

Implementar:

- Cashback.
- Pontos.
- XP.
- Missões.
- Medalhas.
- Níveis.
- Benefícios.
- Ranking.
- Regras configuráveis pelo prestador.

## Pacotes

Permitir:

- Criar pacote com quantidade de sessões, desconto e validade.
- Controlar saldo e registrar utilização.
- Exibir histórico.
- Impedir uso após expiração.

## Gift Cards

Permitir:

- Criar gift card com valor e código seguro.
- Vender e enviar para presente.
- Resgatar código com validade e saldo.
- Bloquear fraude e reutilização indevida.

---

## Testes obrigatórios desta fase

### Testes unitários

- Cálculo de cashback.
- Validação de pacotes (saldo, validade).
- Validação de gift cards (código, saldo, reutilização).
- Movimentações da carteira.
- Idempotência de webhooks.

### Testes de integração

- Gateway de pagamento (modo sandbox).
- Webhooks de pagamento.
- Conciliação de transações.
- Isolamento entre tenants para carteira.

### Testes end-to-end

1. Cliente paga agendamento via Pix (sandbox).
2. Prestador recebe na carteira.
3. Cliente compra pacote.
4. Cliente utiliza sessão do pacote.
5. Cliente compra gift card.
6. Cliente resgata gift card.
7. Cashback creditado automaticamente.

---

## Critérios de aceite

- Pagamentos em sandbox funcionando.
- Webhooks idempotentes.
- Carteira com registro contábil imutável.
- Pacotes impedindo uso após expiração.
- Gift cards bloqueando reutilização indevida.
- Não armazenar dados completos de cartão.
- Testes principais passando.
```
