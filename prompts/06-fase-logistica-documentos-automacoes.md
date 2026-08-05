# Prompt — Fase 6: Atendimento Domiciliar, Logística, Documentos e Automações

> Pré-requisito: Fase 5 concluída e validada.
> **TDD obrigatório:** todos os testes devem ser escritos e validados (Red) antes de implementar qualquer funcionalidade (Green). Refatore mantendo os testes verdes.

```text
Implemente a Fase 6 do Profissional OS — Atendimento domiciliar, logística, documentos, contratos, orçamentos, check-in/check-out e Workflow Builder.

**Lembre-se: TDD é obrigatório.** Para cada funcionalidade abaixo, siga o ciclo Red → Green → Refactor. Escreva os testes primeiro, valide que falham, implemente o mínimo para passar, refatore e confirme que os testes continuam passando.

---

## Atendimento domiciliar e logística

Implementar:

- Definição de raio de atendimento.
- Geolocalização e distância entre cliente e profissional.
- Taxa de deslocamento e tempo estimado.
- Área de cobertura.
- Agrupamento de atendimentos.
- Sugestão de rotas.
- Agenda considerando deslocamento.
- Bloqueio de horários incompatíveis com deslocamento.

Toda funcionalidade de localização deverá solicitar consentimento e limitar a coleta ao necessário.

## Documentos e contratos

Implementar:

- Criação de contratos com modelos de documentos.
- Variáveis dinâmicas e versões.
- Assinatura eletrônica com validação de aceite.
- Registro de IP, data, hora e versão aceita.
- Armazenamento, compartilhamento e histórico.

## Orçamentos

Implementar:

- Criação de orçamento com itens e serviços.
- Descontos e validade.
- Aprovação online, rejeição e comentários.
- Histórico de negociações.
- Conversão em agendamento ou venda.

## Check-in e check-out

Implementar:

- Check-in pelo cliente e pelo prestador.
- Check-out com registro de horário.
- Registro de localização com consentimento.
- Observações, anexos e comprovante do atendimento.
- Confirmação de presença.

## Workflow Builder

Criar editor visual para:

- Gatilhos, ações, condições e temporizadores.
- Integrações entre módulos.
- Execução automática com histórico e logs.
- Templates prontos.

Exemplo:

Gatilho: "Quando um atendimento for concluído"
Ação: "Enviar pesquisa de satisfação"
Condição: "Se a nota for maior ou igual a 4"
Ação: "Solicitar avaliação pública"

O motor deve ser seguro, auditável, idempotente e resistente a loops infinitos.

---

## Testes obrigatórios desta fase

### Testes unitários

- Cálculo de distância e tempo de deslocamento.
- Validação de conflitos de agenda com logística.
- Regras do Workflow Builder (gatilhos, condições, loops).
- Validação de assinatura eletrônica.

### Testes de integração

- Geolocalização com consentimento.
- Workflow Builder executando automações reais.
- Conversão de orçamento em venda.

### Testes end-to-end

1. Prestador configura raio de atendimento.
2. Cliente agenda domiciliar fora do raio e é bloqueado.
3. Cliente agenda dentro do raio com taxa de deslocamento.
4. Prestador cria orçamento e envia para cliente.
5. Cliente aprova orçamento e converte em agendamento.
6. Cliente faz check-in no dia do atendimento.
7. Prestador faz check-out com comprovante.
8. Workflow dispara pesquisa de satisfação automaticamente.

---

## Critérios de aceite

- Atendimento domiciliar com cálculo de raio e taxa.
- Bloqueio de horários incompatíveis com deslocamento.
- Contratos com assinatura eletrônica e registro de aceite.
- Orçamentos convertíveis em agendamento ou venda.
- Check-in/check-out com comprovante.
- Workflow Builder executando automações idempotentes.
- Consentimento de localização implementado.
- Testes principais passando.
```
