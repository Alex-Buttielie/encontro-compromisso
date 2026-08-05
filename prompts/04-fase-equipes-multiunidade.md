# Prompt — Fase 4: Equipes, Comissões e Multiunidade

> Pré-requisito: Fase 3 concluída e validada.
> **TDD obrigatório:** todos os testes devem ser escritos e validados (Red) antes de implementar qualquer funcionalidade (Green). Refatore mantendo os testes verdes.

```text
Implemente a Fase 4 do Profissional OS — Equipes, comissões e gestão multiunidade.

**Lembre-se: TDD é obrigatório.** Para cada funcionalidade abaixo, siga o ciclo Red → Green → Refactor. Escreva os testes primeiro, valide que falham, implemente o mínimo para passar, refatore e confirme que os testes continuam passando.

---

## Equipes

Implementar:

- Cadastro de funcionários.
- Convite por e-mail.
- Perfis de acesso e permissões.
- Agenda individual e compartilhada.
- Produtividade.
- Status de colaborador.
- Histórico de alterações.

## Comissões

Permitir:

- Comissão por colaborador e por serviço.
- Comissão percentual ou valor fixo.
- Regras por unidade.
- Relatórios com valores pagos e pendentes.
- Histórico.

## Multiunidade

Implementar:

- Cadastro de filiais.
- Usuários por unidade.
- Agenda, financeiro e estoque por unidade.
- Relatórios consolidados.
- Transferências entre unidades.
- Regras globais e específicas por unidade.

---

## Testes obrigatórios desta fase

### Testes unitários

- Cálculo de comissões (percentual e fixo).
- Validação de permissões por unidade.
- Regras de transferência entre unidades.

### Testes de integração

- Agenda compartilhada entre colaboradores.
- Relatórios consolidados multiunidade.
- Isolamento de dados entre unidades.

### Testes end-to-end

1. Cadastrar funcionário e enviar convite.
2. Funcionário aceita convite e acessa agenda.
3. Agendar atendimento como colaborador.
4. Verificar comissão calculada.
5. Cadastrar filial.
6. Transferir produto entre unidades.
7. Gerar relatório consolidado.

---

## Critérios de aceite

- Colaboradores com agenda individual e compartilhada.
- Comissões calculadas automaticamente.
- Multiunidade com isolamento de dados por filial.
- Relatórios consolidados funcionando.
- Transferências entre unidades auditadas.
- Testes principais passando.
```
