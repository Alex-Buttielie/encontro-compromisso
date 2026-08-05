# Profissional OS — Regras de Negócio e Requisitos

> Documentação completa dos requisitos funcionais, regras de negócio, fluxos de estado e invariantes do domínio.

---

## 1. Visão Geral do Produto

**Profissional OS** é uma plataforma SaaS para gestão de profissionais autônomos e pequenos prestadores de serviço no Brasil. O sistema conecta **prestadores** (cabeleireiros, eletricistas, dentistas, personal trainers, etc.) a **clientes** finais, oferecendo agenda, pagamentos, CRM, fidelização, rede social, chat, IA e mais.

### Atores do Sistema

| Papel | Descrição | Permissões |
|-------|-----------|------------|
| **Prestador** (provider) | Profissional autônomo que oferece serviços | Gerencia serviços, clientes, agenda, finanças, equipe, unidades |
| **Cliente** (client) | Consumidor que busca e contrata serviços | Cria agendamentos, explora serviços, faz pedidos, chat |
| **Colaborador** (collaborator) | Funcionário de um prestador | Gerencia próprios agendamentos |
| **Administrador** (admin) | Gestão da plataforma | Acesso total ao painel admin, moderação, auditoria |

---

## 2. Requisitos Funcionais por Módulo

### 2.1. Autenticação e Conta

- **Cadastro**: Usuário informa nome, e-mail, senha (mín. 6 caracteres), role (prestador/cliente). Prestadores devem informar profissão.
- **Obrigatoriedade legal**: Aceite dos Termos de Uso e Política de Privacidade (LGPD) é obrigatório no cadastro.
- **Confirmação de e-mail**: Token de 24h enviado por e-mail. Conta fica não-confirmada até validação.
- **Login**: Autenticação por e-mail + senha, retorna JWT (expira em 24h).
- **Recuperação de senha**: Token de 1h enviado por e-mail. Senha é resetada via token.
- **Perfil**: Usuário pode atualizar nome, profissão, telefone, endereço (CEP via ViaCEP), bio e link público.
- **Soft delete**: Usuário pode ser marcado como excluído (`deleted_at`) sem remover dados (LGPD).
- **Link público**: Cada prestador tem um link único (`/u/{link}`) para sua página pública.

### 2.2. Clientes

- Prestador cadastra clientes com nome, e-mail (opcional), telefone (opcional), endereço.
- Clientes podem ser buscados por nome com debounce + autocompletes.
- Endereço usa ViaCEP para preenchimento automático e Autocomplete IBGE para cidade/estado.

### 2.3. Serviços

- Prestador cria serviços com nome, descrição, preço (R$), duração (min), categoria, atendimento domiciliar.
- Categorias: Beleza, Saúde, Fitness, Consultoria, Educação, Reparo, Outro.
- Filtro por categoria via Autocomplete na listagem.

### 2.4. Agendamentos

- **Máquina de estados**:
  ```
  scheduled → confirmed → completed
      ↓          ↓
  cancelled  cancelled
  ```
- Transições inválidas são rejeitadas (`InvalidStateTransition`).
- Agendamento vincula cliente + serviço + data + hora + observações.

### 2.5. Marketplace (Works e Work Orders)

- **Work**: Prestador publica trabalhos com título, descrição, preço, categoria e campos customizados.
- **Work Order**: Cliente solicita um trabalho preenchendo os campos customizados.
- **Máquina de estados do pedido**:
  ```
  pending → accepted → completed
      ↓        ↓
  rejected  cancelled
  ```
- Campos customizados: texto, select, número, data — definidos pelo prestador.

### 2.6. Transações Financeiras

- Prestador registra receitas e despesas manualmente.
- Tipos: `income` (receita) e `expense` (despesa).
- Status: `pending` (pendente) e `paid` (pago).
- Dashboard financeiro: saldo atual, receita/Despesa do mês, pagamentos pendentes.

### 2.7. Pagamentos

- **Máquina de estados completa**:
  ```
  pending → authorized → processing → paid
      ↓         ↓            ↓
    failed    failed       failed
  
  paid → partially_refunded → fully_refunded
      ↓
   disputed → paid | fully_refunded
  ```
- Métodos: Pix, Cartão de crédito, Cartão de débito, QR Code, Carteira, Gift Card.
- Gateway sandbox (mock) implementado. Produção: integrar Mercado Pago, Pagar.me ou Stripe Brasil.
- **Segurança**: Nunca armazena dados de cartão — apenas tokens do gateway.

### 2.8. Carteira Digital (Wallet)

- Cada usuário possui uma carteira com saldo.
- **Tipos de lançamento (ledger)**:
  - Crédito: `credit`, `cashback`, `promotional`, `transfer_in`, `gift_card_redemption`, `refund`
  - Débito: `debit`, `withdrawal`, `transfer_out`, `package_purchase`
- Transferências entre usuários (P2P) com máquina de estados:
  ```
  requested → approved → in_transit → completed
      ↓          ↓            ↓
   rejected  cancelled    cancelled
  ```
- Saldo nunca pode ser negativo.

### 2.9. Pacotes de Sessões

- Prestador cria pacotes: nome, total de sessões, preço, validade, descrição.
- Estados: `active` → `expired` | `exhausted` | `cancelled`.
- Cliente compra pacote via carteira ou pagamento.
- Sessões são consumidas a cada agendamento.

### 2.10. Gift Cards

- Prestador cria gift cards com código único, valor, validade.
- Estados: `active` → `redeemed` | `expired` | `blocked` | `cancelled`.
- Cliente resgata gift card creditando na carteira.

### 2.11. Fidelização (Loyalty)

- **Conta de fidelidade**: pontos, nível (tier), XP, cashback acumulado.
- **Tipos de transação**: pontos ganhos/gastos, XP ganho, cashback ganho, missão concluída, medalha conquistada, subiu de nível.
- **Missões**: Objetivos que concedem recompensas ao serem concluídos.
- **Medalhas**: Conquistas visuais exibidas no perfil.

### 2.12. CRM

- Segmentação de clientes: Novo, Ativo, VIP, Inativo, Perdido.
- Perfil do cliente com histórico de visitas, LTV (Lifetime Value), último contato.
- Pesquisas de satisfação pós-atendimento: Pendente → Respondida | Ignorada.

### 2.13. ERP / Financeiro Avançado

- **Centros de custo**: Categorização de receitas e despesas.
- **Fluxo de caixa**: Entradas (`revenue`) e saídas (`expense`).
- **Contas a pagar/receber**: Status: Pendente → Pago | Vencido | Cancelado.
- **Períodos financeiros**: Aberto → Fechado (fechamento mensal).
- **Fornecedores**: Cadastro de fornecedores com produtos associados.

### 2.14. Estoque (Inventory)

- Produtos com quantidade, quantidade mínima, preço unitário, SKU, fornecedor.
- **Movimentações**: Entrada, Saída, Consumo, Ajuste, Devolução.
- Entradas aumentam estoque (entry, return); saídas diminuem (exit, consumption).
- **Transferências entre unidades** com máquina de estados:
  ```
  requested → approved → in_transit → completed
      ↓          ↓            ↓
   rejected  cancelled    cancelled
  ```

### 2.15. Marketing

- **Campanhas**: Nome, canal (E-mail, SMS, Push, WhatsApp), segmento, status.
- **Máquina de estados**: Rascunho → Agendada → Em execução → Concluída | Cancelada.
- **Cupons**: Percentual, Valor fixo, Sessão grátis.
- Métricas: enviados, aberturas.

### 2.16. Analytics

- Dashboard com receita total, novos clientes, agendamentos, taxa de conversão.
- Relatórios de desempenho por período.

### 2.17. Equipe (Employees)

- **Cargos**: Dentista, Assistente, Recepcionista, Gerente, Financeiro, Outro.
- **Estados**: Convidado → Ativo → Suspenso | Demitido.
- Apenas colaboradores Ativos podem acessar o sistema.
- **Níveis de permissão**: Acesso total, Agenda, Financeiro (leitura/escrita), Estoque, Relatórios, Sem acesso.
- Histórico de mudanças de cargo/status por funcionário.

### 2.18. Comissões

- **Tipos**: Percentual ou Valor fixo.
- **Estados**: Pendente → Pago | Cancelado.
- Vinculada a funcionário e opcionalmente a serviço.

### 2.19. Multi-Unidade (Branches)

- **Tipos**: Matriz (headquarters) ou Filial (branch).
- Unidades com nome, endereço, telefone, status ativo/inativo.
- Transferências de estoque entre unidades.

### 2.20. Rede Social

- **Posts**: Foto, Vídeo, Reels, Texto, Patrocinado.
- **Estados**: Rascunho → Publicado → Em revisão | Removido | Arquivado.
- Apenas posts Publicados são visíveis.
- **Ações do post**: Nenhuma, Agendar, Comprar, Assinar plano.
- **Stories**: Ativo → Expirado | Removido.
- **Interações**: Curtir, comentar, compartilhar, seguir.
- **Moderação**: Status: Pendente → Aprovado | Rejeitado | Removido.
- **Denúncias**: Motivos: Spam, Assédio, Conteúdo inapropriado, Violência, Desinformação, Direitos autorais, Outro.
- **Status de denúncia**: Aberta → Em análise → Resolvida | Arquivada.

### 2.21. Chat

- **Tipos de conversa**: Cliente ↔ Profissional, Equipe, Suporte.
- **Tipos de mensagem**: Texto, Foto, Vídeo, Áudio, Documento, Localização, Automática.
- **Status de mensagem**: Enviada → Entregue → Lida | Falhou.
- WebSocket (Socket.IO) para tempo real: eventos `connect`, `join_conversation`, `new_message`.

### 2.22. Notificações

- **Canais**: Push, SMS, E-mail, WhatsApp, In-app.
- **Tipos**: Lembrete de agendamento, Confirmação/Cancelamento de agendamento, Promoção, Alerta financeiro, Alerta de segurança, Mensagem de chat, Interação social, Sistema.
- **Prioridades**: Baixa, Normal, Alta, Urgente.
- Preferências de notificação por usuário (opt-in/out por canal).

### 2.23. Atendimento Domiciliar (Home Care)

- Cadastro de visitas domiciliares com endereço do cliente.
- Cálculo de distância e taxa de deslocamento.
- **Rotas**: Planejada → Otimizada → Em andamento → Concluída | Cancelada.
- Áreas de atendimento geográficas.

### 2.24. Documentos

- Geração de documentos (contratos, orçamentos) a partir de templates.
- Assinatura eletrônica: Pendente → Assinada | Rejeitada.

### 2.25. Orçamentos (Quotes)

- **Máquina de estados**:
  ```
  draft → sent → approved → converted
               ↓
           rejected | expired | cancelled
  ```
- Itens com descrição, quantidade, preço unitário.
- Comentários no orçamento.
- Conversão de orçamento aprovado em contrato.

### 2.26. Contratos

- **Máquina de estados**:
  ```
  draft → sent → signed → active → expired | terminated
                              ↓
                          cancelled
  ```
- Versionamento de contratos.
- Assinatura eletrônica.
- Ativação após assinatura.

### 2.27. Check-in / Check-out

- **Tipos**: Cliente ou Prestador.
- **Estados**: Check-in realizado → Check-out realizado | Não compareceu | Cancelado.
- Registrado por agendamento.

### 2.28. Workflows (Automações)

- **Gatilhos**: Agendamento criado/concluído/cancelado, Orçamento aprovado, Contrato assinado, Cliente cadastrado, Pagamento recebido, Check-out concluído, Manual.
- **Ações**: Enviar notificação/e-mail/SMS/pesquisa, Solicitar avaliação, Criar agendamento/tarefa, Atualizar tag do cliente, Gerar documento, Webhook.
- **Condições**: Nota ≥/≤, Tag do cliente, Serviço, Unidade, Valor ≥/≤, Dia da semana, Faixa de horário.
- **Estados do workflow**: Rascunho → Ativo → Pausado | Arquivado.
- **Estados de execução**: Pendente → Executando → Concluída | Falhou | Ignorada.

### 2.29. Assinaturas (Subscriptions)

- **Máquina de estados**:
  ```
  trialing → active → past_due → active | suspended | cancelled
              ↓
          suspended → active | cancelled
              ↓
          cancelled | expired
  ```
- **Cobranças (Billing)**: Pendente → Pago | Falhou → Retentando | Reembolsado.
- Retry de cobrança falha.
- Histórico de cobranças por assinatura.

### 2.30. Indicações (Referrals)

- **Máquina de estados**:
  ```
  pending → registered → converted → rewarded
                ↓
            expired
  ```
- Código de indicação único.
- Ranking de indicações.
- Recompensa ao converter indicação.
- Estatísticas de conversão.

### 2.31. Agentes de IA (Multi-Agent)

- **15 tipos de agentes**: Executivo, Financeiro, CRM, Marketing, Conteúdo, Social, Agenda, Comercial, Analytics, Logística, Estoque, Reputação, Crescimento, Segurança, Suporte.
- **Estados do agente**: Ativo, Desativado, Pausado.
- **Ações do agente**: Pendente → Aprovada | Rejeitada → Executada | Falhou.
- **Aprovação humana obrigatória** para agentes com impacto financeiro: Financeiro, Marketing, Comercial, Segurança.
- Consentimento explícito do usuário para ativar agentes.
- Auditoria de todas as execuções.
- Uso e métricas por agente.

### 2.32. Administração

- **Papéis admin**: Super Admin, Admin, Moderador, Suporte, Somente Leitura.
- **Permissões granulares** por papel.
- **Ações auditáveis**: Bloqueio/desbloqueio de usuário, Aprovação/rejeição de prestador, Moderação de posts/comentários/avaliações, Criação/atualização de planos, Gestão de assinaturas, Atualização de comissões, Configurações, Feature flags, Exportação/exclusão de dados, Gestão de chaves de API e webhooks.
- **Feature Flags**: Toggle de funcionalidades por chave com descrição.
- **Chaves de API**: Ativa → Revogada | Expirada. Scopes por chave.
- **Webhooks**: Ativo → Desativado | Falhando. Eventos inscritos.

### 2.33. LGPD (Lei Geral de Proteção de Dados)

- **Tipos de solicitação**: Exportação, Correção, Exclusão, Portabilidade.
- **Máquina de estados**:
  ```
  pending → processing → completed
      ↓
  rejected
  ```
- Exportação de dados do usuário.
- Direito ao esquecimento (exclusão).
- Versões de Termos e Política de Privacidade rastreadas por usuário.
- Re-consentimento necessário quando versões mudam.

---

## 3. Regras de Negócio Transversais

### 3.1. Invariantes de Domínio

| Regra | Entidade | Implementação |
|-------|----------|---------------|
| Nome é obrigatório | User, Client | `ValidationError` se vazio |
| E-mail válido | User, Client | Value Object `Email` valida formato |
| Senha mín. 6 caracteres | User | Validado no AuthService |
| Profissão obrigatória para prestador | User | `User.create()` valida |
| Aceite de Termos e Privacidade obrigatório | User | `User.create()` valida |
| Valor monetário não-negativo | Money, Payment, Wallet | Value Object `Money` rejeita negativos |
| Duração positiva | Service | Value Object `Duration` rejeita ≤ 0 |
| Saldo de carteira não-negativo | Wallet | Validado antes de débito |
| Link único e formato slug | User | Regex `^[a-z0-9-]+$` |
| Transições de estado válidas | Todas entidades com state machine | `can_transition_to()` rejeita inválidas |

### 3.2. Value Objects

- **Money**: Valor monetário em BRL, arredondado para centavos, imutável. Operações: `add`, `subtract`, `is_zero`, `formatted`.
- **Email**: Endereço de e-mail validado por regex, imutável. Permite vazio (para contatos sem e-mail).
- **Duration**: Duração em minutos, positiva, imutável. Formatação: `90 min` ou `1h30min`.

### 3.3. Permissões por Role

| Permissão | Client | Provider | Collaborator | Admin |
|-----------|--------|----------|--------------|-------|
| Criar agendamento | ✅ | — | — | — |
| Gerenciar próprios agendamentos | — | — | ✅ | — |
| Gerenciar todos agendamentos | — | ✅ | — | ✅ |
| Gerenciar serviços | — | ✅ | — | ✅ |
| Gerenciar clientes | — | ✅ | — | ✅ |
| Gerenciar finanças | — | ✅ | — | ✅ |
| Gerenciar usuários | — | — | — | ✅ |
| Gerenciar tenant | — | ✅ | — | ✅ |

### 3.4. Auditoria

Todas as ações administrativas são registradas com:
- Tipo de ação (AuditActionType)
- ID e role do ator
- Detalhes em JSON
- Timestamp

### 3.5. Idempotência

Operações críticas (pagamentos, transferências) suportam idempotência via chave única para evitar duplicação.

---

## 4. API Pública

- Endpoints públicos sob `/api/v1/` para integração de terceiros.
- Health check: `GET /api/v1/health`
- Listagem de usuários: `GET /api/v1/users`
- Documentação OpenAPI: `GET /api/docs/openapi.json`
- Chaves de API com scopes e revogação.
- Webhooks para eventos do sistema.

---

## 5. Internacionalização

- Backend: Mensagens de erro e labels em português (pt-BR).
- Frontend: i18next com pt-BR (padrão) e en-US.
- Formatação: Moeda em BRL, datas em formato brasileiro (dd/mm/yyyy).

---

## 6. Conformidade Legal

- **LGPD**: Solicitações de dados, direito ao esquecimento, portabilidade, rastreio de consentimento.
- **Termos de Uso**: Versão 1.0 — aceite obrigatório no cadastro.
- **Política de Privacidade**: Versão 1.0 — aceite obrigatório no cadastro.
- **Re-consentimento**: Quando versões mudam, usuários existentes devem re-aceitar.
