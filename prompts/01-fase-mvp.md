# Prompt — Fase 1: MVP (Autenticação, Perfis, Serviços, Agenda, Marketplace, Avaliações)

> Pré-requisito: execute o prompt `00-contexto-geral.md` antes deste.
> **TDD obrigatório:** todos os testes devem ser escritos e validados (Red) antes de implementar qualquer funcionalidade (Green). Refatore mantendo os testes verdes.

```text
Implemente a Fase 1 do Profissional OS — MVP funcional.

**Lembre-se: TDD é obrigatório.** Para cada funcionalidade abaixo, siga o ciclo Red → Green → Refactor. Escreva os testes primeiro, valide que falham, implemente o mínimo para passar, refatore e confirme que os testes continuam passando.

---

## Autenticação

- Cadastro por e-mail.
- Login, logout e recuperação de senha.
- Alteração de senha.
- Confirmação de e-mail.
- Aceite dos Termos de Uso e da Política de Privacidade.
- Gerenciamento básico de sessão.
- Exclusão da conta.
- Separação entre cliente, prestador e administrador.

Preparar a arquitetura para:

- Login por telefone.
- Login com Google, Apple e Facebook.
- MFA.
- Confirmação por SMS.
- Controle de dispositivos.

## Perfil profissional

Criar campos para:

- Nome profissional, nome comercial, foto, banner e biografia.
- Especialidades, formação, certificações e tempo de experiência.
- Redes sociais, idiomas, horário de funcionamento e áreas de atendimento.
- Atendimento presencial, domiciliar e online.
- Link público personalizado e QR Code.
- Status ativo/inativo.

## Perfil do cliente

Criar campos para:

- Nome, e-mail, telefone, foto.
- CPF, quando necessário e permitido.
- Endereços, preferências e configurações de notificação.
- Favoritos e histórico de agendamentos.

## Catálogo de serviços

Permitir:

- Criar, editar, excluir ou arquivar serviço.
- Definir nome, categoria, subcategoria, descrição, preço e duração.
- Adicionar imagens e vídeos.
- Definir modalidade de atendimento.
- Ativar ou desativar serviço.
- Criar serviço personalizado.

## Agenda

Implementar:

- Agenda diária, semanal e mensal.
- Horários disponíveis e bloqueados.
- Intervalos, férias e regras de antecedência.
- Duração dos serviços e conflito de horários.
- Reagendamento, cancelamento, confirmação e lembretes básicos.

## Agendamentos

Permitir que o cliente:

1. Escolha uma categoria.
2. Escolha um profissional.
3. Escolha um serviço.
4. Escolha colaborador, quando aplicável.
5. Escolha data e horário.
6. Escolha endereço.
7. Escolha modalidade de atendimento.
8. Escolha forma de pagamento.
9. Confirme o agendamento.
10. Receba confirmação.

Estados do agendamento:

- Rascunho.
- Aguardando confirmação.
- Confirmado.
- Em atendimento.
- Concluído.
- Reagendado.
- Cancelado pelo cliente.
- Cancelado pelo prestador.
- Não compareceu.
- Expirado.

## Marketplace básico

Implementar:

- Lista de profissionais.
- Busca por nome, categoria e especialidade.
- Filtro por localização, preço, avaliação e modalidade de atendimento.
- Página pública do profissional.
- Favoritar profissional.
- Compartilhar perfil.
- Botão de agendamento.

## Avaliações

Permitir:

- Avaliação após atendimento concluído.
- Nota de 1 a 5 estrelas.
- Comentário.
- Resposta do prestador.
- Denúncia de avaliação.
- Moderação administrativa.
- Cálculo de reputação.

## Dashboard do prestador

Exibir:

- Próximos agendamentos.
- Receita do período.
- Quantidade de clientes.
- Serviços mais vendidos.
- Taxa de cancelamento.
- Avaliação média.
- Horários ocupados.
- Atalhos para criar serviço, bloquear horário e consultar clientes.

## Dashboard do cliente

Exibir:

- Próximos agendamentos.
- Histórico.
- Profissionais favoritos.
- Recomendações.
- Créditos disponíveis, quando aplicável.
- Notificações.

---

## Testes obrigatórios desta fase

### Testes unitários

- Regras de agendamento (conflito, duração, intervalo).
- Cálculo de disponibilidade.
- Permissões por role.
- Validação de perfis.

### Testes de integração

- Autenticação.
- Persistência de dados.
- Isolamento entre tenants.
- APIs de serviços, agenda e agendamentos.

### Testes end-to-end

1. Cadastro de prestador.
2. Configuração de perfil.
3. Cadastro de serviço.
4. Configuração de agenda.
5. Cadastro de cliente.
6. Busca no marketplace.
7. Agendamento.
8. Confirmação.
9. Avaliação.
10. Cancelamento.
11. Reagendamento.

---

## Critérios de aceite

- O projeto iniciar localmente sem erros.
- Frontend conseguir autenticar usuários.
- Backend expor APIs funcionais.
- Dados persistidos corretamente.
- Isolamento entre tenants implementado.
- Permissões verificadas no backend.
- Fluxo completo de agendamento funcionar.
- Fluxo de cancelamento funcionar.
- Dashboards exibirem dados reais.
- Erros tratados adequadamente.
- Testes principais passarem.
- Não existirem segredos no repositório.
- Documentação atualizada.
- Interface responsiva em português do Brasil.
```
