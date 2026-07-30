# Meu Coordenador — Encontro Compromisso Trin

Sistema web para organização, preparação e execução do Encontro Compromisso Trin (Projeto JUMIRE), baseado no **Manual dos Mestres de Obras**. Pensado como um assistente pessoal do coordenador/Mestre de Obras.

## Funcionalidades

- **Dashboard**: Visão geral com estatísticas, contagem regressiva para o Encontro, resumo financeiro e progresso de lembrancinhas
- **Checklist de Preparação**: 64 tarefas extraídas do manual, organizadas por categoria (Espaço Físico, Traslado, Impressos, Cozinha, Capela, etc.)
- **Cronograma**: Programação completa de Sexta a Domingo com 71 atividades (horários, locais e equipes responsáveis) com status de 3 estados (pendente → em andamento → concluído)
- **Equipes**: 19 equipes de trabalho com descrições, membros e progresso de tarefas
- **Matérias-primas**: Cadastro de inscritos (Ficha de Inscrição Final do manual) com controle de pagamentos, grupos, quartos, restrições alimentares, medicações, necessidades especiais, padrinhos e controle de presença no Encontro
- **Financeiro**: Controle de receitas e despesas com resumo (saldo, pendentes a receber/pagar), filtro por tipo e categoria, e 55 lançamentos pré-cadastrados em 19 categorias diversas (Receitas: Inscrições, Doações, Bazar, Camisetas, Apadrinhamento, Contribuições de Equipes, Betoneiras; Despesas: Espaço Físico, Traslado, Alimentação, Materiais Gráficos, Camisetas, Bíblias, Capela, Som e Técnica, Lembrancinhas, Decoração, Rosas, Bazar, Higienização, Equipamentos, Primeiros Socorros, Hospedagem, Honorários, Diversos). Dropdown de categorias dinâmico no modal de lançamento
- **Lembrancinhas**: Controle de confecção por equipe com status (não iniciado → em andamento → pronto), quantidades e data de entrega. 10 itens pré-cadastrados baseados nas responsabilidades de cada equipe
- **Escolinhas de Preparação**: Agendamento e acompanhamento das reuniões periódicas (Equipes Extras, Cozinha, Implantação, Missa de Entrega) com timeline visual. 10 escolinhas pré-cadastradas conforme o manual
- **Alicerces e Alvenarias**: Gestão das 13 pistas de reflexão do Encontro (7 Alicerces + 6 Alvenarias) com atribuição de construtores, dia/horário e status. Conteúdo extraído do manual
- **Lembretes Inteligentes**: Prazos calculados automaticamente a partir da data do Encontro. As 64 tarefas do manual têm prazos relativos (ex: "-9 meses", "-1 mês") que são convertidos em datas reais e classificados por urgência (atrasado, urgente, atenção, em dia). Permite também lembretes manuais personalizados
- **Padrinhos & Madrinhas**: Acompanhamento dos 5 passos do padrinho (1º Contato → Convite → Confirmação → Reunião → Acompanhamento) para cada matéria-prima, com tracking visual do progresso de cada etapa
- **Fornecedores**: Agenda de contatos e cotações por categoria (Espaço Físico, Traslado, Alimentação, Materiais Gráficos, Camisetas, Bíblias, Som e Técnica, Capela, Lembrancinhas, Decoração, Rosas, Bazar, Higienização, Equipamentos, Primeiros Socorros, Hospedagem). 21 fornecedores pré-cadastrados com status (contatado → pendente → contratado → cancelado) e controle de custos estimado vs real
- **Kit das Matérias-primas**: Controle interativo de conferência e entrega dos kits do RH (10 itens por matéria-prima) com tracking de kit conferido, squeeze personalizada e kit entregue
- **Avisos & Comunicados**: Mural de comunicações do coordenador para equipes e participantes, com fixação de avisos importantes, público-alvo (todos, equipes, matérias-primas, coordenação) e níveis de prioridade
- **Dados do Encontro**: Informações gerais (nome, datas, local, tema, música tema) — a data define a contagem regressiva no Dashboard e ativa os lembretes automáticos
- **Relatórios PDF**: Geração de relatórios em PDF para análise e acompanhamento
  - **Guia do Coordenador** — relatório completo para os dias do Encontro (contatos, cronograma, alicerces/alvenarias, matérias-primas com restrições, padrinhos, avisos, tarefas pendentes, fornecedores e espaço para anotações)
  - Relatório Geral Completo (tarefas + cronograma + equipes)
  - Roteiro Geral do Encontro (cronograma Sexta–Domingo standalone)
  - Relatório por Equipes (progresso e membros)
  - Programa por Equipe (cronograma + tarefas de cada equipe no Encontro)
  - Lista de Matérias-primas (inscritos, grupos, quartos, restrições alimentares, medicações, pagamentos)
  - Kit da Matéria-prima (checklist do RH com 10 itens + controle por inscrito)
  - Mapa de Alicerces e Alvenarias (construtores, horários e conteúdo)
  - Lista de Lembrancinhas (status de confecção por equipe)
  - Relatório Financeiro (receitas, despesas, saldo e lançamentos por categoria)
  - Lista de Fornecedores (contatos, cotações e status por categoria)
  - Mural de Avisos (comunicados para impressão)
  - Relatório de Lembretes (prazos automáticos e lembretes manuais)
  - Relatórios por Categoria (Espaço Físico, Traslado, Cozinha, Capela, etc.)

## Stack

- **Backend**: Node.js + Express
- **Database**: JSON file-based (sem dependências nativas)
- **PDF**: PDFKit
- **Frontend**: HTML/CSS/JS vanilla (sem frameworks, leve e rápido)
- **Fontes**: Google Fonts (Inter)

## Instalação

```bash
cd encontro-compromisso
npm install
npm start
```

Acesse: http://localhost:3000

## Estrutura do Projeto

```
encontro-compromisso/
├── server.js              # Servidor Express principal
├── package.json
├── db/
│   ├── database.js        # Camada de dados (JSON file-based)
│   └── encontro.json      # Banco de dados (gerado automaticamente)
├── data/
│   └── seed.js            # Dados extraídos do manual (64 tarefas, 19 equipes, 71 cronograma)
├── routes/
│   ├── api.js             # API REST (tasks, teams, schedule, encounter, stats)
│   └── pdf.js             # Geração de relatórios PDF
└── public/
    ├── index.html         # SPA
    ├── css/
    │   └── style.css      # Estilos (sidebar, cards, modais, responsivo)
    └── js/
        └── app.js         # Lógica do frontend (dashboard, checklist, cronograma, equipes)
```

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/tasks` | Lista tarefas (filtros: category, status, priority, team) |
| POST | `/api/tasks` | Cria tarefa |
| PUT | `/api/tasks/:id` | Atualiza tarefa |
| PATCH | `/api/tasks/:id/status` | Altera status da tarefa |
| DELETE | `/api/tasks/:id` | Remove tarefa |
| GET | `/api/teams` | Lista equipes com membros |
| POST | `/api/teams` | Cria equipe |
| POST | `/api/teams/:id/members` | Adiciona membro |
| DELETE | `/api/teams/:teamId/members/:memberId` | Remove membro |
| GET | `/api/schedule` | Lista cronograma (filtro: day) |
| PATCH | `/api/schedule/:id/status` | Altera status do item |
| GET | `/api/encounter` | Dados do encontro |
| PUT | `/api/encounter/:id` | Atualiza encontro |
| GET | `/api/participants` | Lista matérias-primas (filtros: group, room, gender, status) |
| POST | `/api/participants` | Cadastra matéria-prima (Ficha de Inscrição) |
| PUT | `/api/participants/:id` | Atualiza matéria-prima |
| PATCH | `/api/participants/:id/paid` | Alterna status de pagamento |
| PATCH | `/api/participants/:id/kit` | Alterna campos do kit (kit_conferido, squeeze_personalizada, kit_entregue) |
| PATCH | `/api/participants/:id/presente` | Alterna presença no Encontro |
| DELETE | `/api/participants/:id` | Remove matéria-prima |
| GET | `/api/finance` | Lista lançamentos financeiros (filtros: type, category) |
| POST | `/api/finance` | Cria lançamento |
| PUT | `/api/finance/:id` | Atualiza lançamento |
| DELETE | `/api/finance/:id` | Remove lançamento |
| GET | `/api/finance/summary` | Resumo financeiro (receitas, despesas, saldo, pendentes) |
| GET | `/api/lembrancinhas` | Lista lembrancinhas (filtros: team, status) |
| POST | `/api/lembrancinhas` | Cria lembrancinha |
| PUT | `/api/lembrancinhas/:id` | Atualiza lembrancinha |
| PATCH | `/api/lembrancinhas/:id/status` | Altera status |
| DELETE | `/api/lembrancinhas/:id` | Remove lembrancinha |
| GET | `/api/escolinhas` | Lista escolinhas (filtros: type, status) |
| POST | `/api/escolinhas` | Agenda escolinha |
| PUT | `/api/escolinhas/:id` | Atualiza escolinha |
| PATCH | `/api/escolinhas/:id/status` | Altera status |
| DELETE | `/api/escolinhas/:id` | Remove escolinha |
| GET | `/api/alicerces` | Lista alicerces/alvenarias (filtros: type, status) |
| POST | `/api/alicerces` | Cria alicerce/alvenaria |
| PUT | `/api/alicerces/:id` | Atualiza alicerce/alvenaria |
| PATCH | `/api/alicerces/:id/status` | Altera status |
| DELETE | `/api/alicerces/:id` | Remove alicerce/alvenaria |
| GET | `/api/lembretes` | Lista lembretes manuais (filtros: status, priority) |
| POST | `/api/lembretes` | Cria lembrete manual |
| PUT | `/api/lembretes/:id` | Atualiza lembrete |
| PATCH | `/api/lembretes/:id/status` | Altera status do lembrete |
| DELETE | `/api/lembretes/:id` | Remove lembrete |
| GET | `/api/lembretes/auto` | Lembretes automáticos baseados na data do Encontro |
| GET | `/api/padrinhos` | Lista padrinhos (filtros: participant_id, status) |
| POST | `/api/padrinhos` | Atribui padrinho a matéria-prima |
| PUT | `/api/padrinhos/:id` | Atualiza padrinho |
| PATCH | `/api/padrinhos/:id/step` | Alterna um dos 5 passos do padrinho |
| DELETE | `/api/padrinhos/:id` | Remove padrinho |
| GET | `/api/fornecedores` | Lista fornecedores (filtros: category, status) |
| POST | `/api/fornecedores` | Cadastra fornecedor |
| PUT | `/api/fornecedores/:id` | Atualiza fornecedor |
| PATCH | `/api/fornecedores/:id/status` | Altera status do fornecedor |
| DELETE | `/api/fornecedores/:id` | Remove fornecedor |
| GET | `/api/avisos` | Lista avisos (filtros: target, priority) |
| POST | `/api/avisos` | Publica aviso |
| PUT | `/api/avisos/:id` | Atualiza aviso |
| PATCH | `/api/avisos/:id/pin` | Fixa/desfixa aviso |
| DELETE | `/api/avisos/:id` | Remove aviso |
| GET | `/api/stats` | Estatísticas (totais, por categoria, equipe, prioridade) |
| GET | `/reports/full` | Relatório PDF geral |
| GET | `/reports/teams` | Relatório PDF por equipes |
| GET | `/reports/team-schedule` | Programa PDF por equipe (cronograma + tarefas) |
| GET | `/reports/schedule` | Roteiro geral do Encontro (cronograma Sexta–Domingo) |
| GET | `/reports/participants` | Lista de matérias-primas (inscritos, restrições, pagamentos) |
| GET | `/reports/finance` | Relatório financeiro (receitas, despesas, saldo por categoria) |
| GET | `/reports/alicerces` | Mapa de alicerces e alvenarias (construtores, horários) |
| GET | `/reports/lembrancinhas` | Lista de lembrancinhas (status por equipe) |
| GET | `/reports/fornecedores` | Lista de fornecedores (contatos e cotações por categoria) |
| GET | `/reports/avisos` | Mural de avisos (para impressão) |
| GET | `/reports/kit` | Kit da matéria-prima (checklist do RH) |
| GET | `/reports/coordinator-guide` | Guia do Coordenador (relatório completo para os dias do Encontro) |
| GET | `/reports/category/:category` | Relatório PDF por categoria |

## Categorias de Tarefas

- Espaço Físico - Canteiro de Obras (10 tarefas)
- Espaço Físico - Momentos Extras (6 tarefas)
- Traslado (6 tarefas)
- Impressos e Materiais Gráficos (12 tarefas)
- Material Padrão JUMIRE (3 tarefas)
- Crachás e Cordões (3 tarefas)
- Kits das Matérias-primas (1 tarefa)
- Som e Técnica (3 tarefas)
- Cozinha e Serviços Gerais (6 tarefas)
- Materiais para Capela (10 tarefas)
- Mestres de Obras (4 tarefas)

## Equipes

Mestres de Obras, Supervisores, Auxiliares, Bazar, Cozinha, Dinamização, Espiritualização, Estagiários, Instrutores, Laboral, Logística, Office Boy/Girl, Refeitório, Registro, Secretaria, Serviços Gerais, Sonorização, RH, Colaboradores.

## Como Usar

1. **Marcar tarefas**: Clique no círculo ao lado de cada tarefa para alternar entre Pendente → Em Andamento → Concluído
2. **Filtrar**: Use a busca e os filtros de status/equipe no Checklist
3. **Adicionar/editar**: Use o botão "+ Nova Tarefa" ou o ícone de edição em cada tarefa
4. **Cronograma**: Clique no círculo de cada atividade para alternar entre Pendente → Em Andamento → Concluído
5. **Equipes**: Adicione membros a cada equipe com nome, função e contato
6. **Relatórios**: Acesse a aba "Relatórios PDF" e baixe os relatórios para análise
