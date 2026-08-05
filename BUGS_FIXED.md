# Bugs Corrigidos - Profissional OS

> Análise estática realizada em 21/07/2026. Python não estava disponível no ambiente para execução de testes automatizados.

## Backend Python

### 1. `BaseRepository.get_by_id` ignorava filtro de usuário
- **Arquivo:** `backend/repositories/base.py`
- **Problema:** `query.get(entity_id)` não respeitava o `filter_by(user_id=user_id)`, permitindo acesso a dados de outros usuários.
- **Correção:** Substituído por `filter_by(user_id=user_id, id=entity_id).first()`.

### 2. Validação de preço rejeitava valor zero
- **Arquivo:** `backend/services/service_service.py`
- **Problema:** `if not data.get('price')` era True para `0`, rejeitando preço válido.
- **Correção:** Validação explícita para `None`/`''` e conversão segura com try/except.

### 3. Validação de tipo de transação com precedência errada
- **Arquivo:** `backend/services/transaction_service.py`
- **Problema:** `if not data.get('type') in ['income', 'expense']` avaliava `(not data.get('type')) in [...]`.
- **Correção:** `if transaction_type not in ['income', 'expense']`.

## Frontend

### 4. Editar cliente/serviço/agendamento deletava o registro
- **Arquivo:** `main.js`, `index.html`
- **Problema:** `editClient`, `editService` e `editAppointment` chamavam `delete` antes de abrir o modal.
- **Correção:** Adicionados campos ocultos `client-id`, `service-id` e `appointment-id`; métodos de submit verificam ID e chamam update; métodos edit preenchem sem deletar.

### 5. Login não persistia sessão
- **Arquivo:** `main.js`
- **Problema:** `_handleLoginSubmit` não chamava `saveSession(result.user)`.
- **Correção:** Adicionada chamada `this.services.auth.saveSession(result.user)` após login.

### 6. API Client lançava exceção em erros 4xx
- **Arquivo:** `api-client.js`
- **Problema:** `request` fazia `throw` em respostas não-OK, impedindo `result.success` no frontend.
- **Correção:** Agora retorna `{success: false, errors: [...]}` do backend ou erro de conexão.

### 7. Formulários de modal não eram resetados ao criar novo após edição
- **Arquivo:** `main.js`
- **Problema:** Ao clicar "+ Novo" depois de editar, o modal abria com dados antigos.
- **Correção:** `openModal` público reseta o formulário antes de abrir; `_openModal` privado não reseta para edição; `_closeModal` reseta ao fechar.

## Correções de Login e Comunicação Backend/Frontend

### 8. Arquivo `.env` não era carregado pelo backend
- **Arquivo:** `backend/config.py`
- **Problema:** Variáveis de ambiente do `.env` (incluindo `CORS_ORIGINS`) eram ignoradas, pois `python-dotenv` estava instalado mas não era inicializado.
- **Correção:** Adicionado `load_dotenv()` no início do `config.py`.

### 9. CORS com wildcard `*` e `supports_credentials=True`
- **Arquivo:** `backend/config.py`, `backend/app.py`
- **Problema:** Origem `*` combinada com credenciais é rejeitada pelos navegadores, bloqueando requisições cross-origin (login e outras rotas).
- **Correção:** `CORS_ORIGINS` agora padrão para `http://localhost:8000,http://127.0.0.1:8000`; `app.py` configura `allow_headers=['Content-Type', 'Authorization']` e methods explicitamente.

### 10. `password_hash` com tamanho potencialmente insuficiente
- **Arquivo:** `backend/models.py`
- **Problema:** Coluna `String(256)` podia truncar hashes do Werkzeug 3.x, invalidando login.
- **Correção:** Aumentado para `String(512)`.

### 11. Rota `profile` fazia query direta no modelo
- **Arquivo:** `backend/app.py`, `backend/services/auth_service.py`
- **Problema:** `User.query.get(user_id)` não usava a camada de serviço/repositório.
- **Correção:** Adicionado `AuthService.get_user_by_id` e rota `profile` GET agora o utiliza.

### 12. `_checkAuth` não limpava token inválido
- **Arquivo:** `main.js`
- **Problema:** Sessão inválida permanecia em `localStorage` após erro em `/api/auth/profile`.
- **Correção:** `_checkAuth` chama `this.services.auth.logout()` quando `getCurrentUser` retorna erro.

## Instruções após correções

- **Recriar o banco:** como `password_hash` mudou de tamanho, delete `backend/profissional_os.db` e execute `python seed.py` novamente.
- **Criar `.env`:** copie `backend/.env.example` para `backend/.env` e ajuste `CORS_ORIGINS` se necessário.
- **Iniciar backend:** `cd backend && python app.py`.
- **Iniciar frontend:** `python -m http.server 8000` na raiz.
- **Testes E2E com Playwright:** ainda não puderam ser executados por falta de Python/Node no ambiente.
