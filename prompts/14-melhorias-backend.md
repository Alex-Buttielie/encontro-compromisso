# Prompt 14 — Melhorias de Backend

> Execute após `13-testes-frontend.md`. Endereça BUG-03, BUG-04, BUG-05, MEL-09, BUG-14 (backend).

```text
Você é um arquiteto de software sênior. O projeto Profissional OS tem 679 testes no backend. Agora você vai corrigir bugs de backend e melhorar a infraestrutura de dados.

## Contexto
- Backend: Python Flask em `backend/`
- Clean Architecture / DDD com TDD obrigatório
- 30+ serviços, 60+ modelos, 300+ rotas

---

## BUG-03: Rate limiter em memória não persiste

### Arquivo
- `backend/services/public_api_service.py:11-25`

### Problema
`_rate_limiter` é um `defaultdict` em memória. Reiniciar o servidor zera os contadores. Não funciona com múltiplos workers.

### Correção
1. Criar `backend/utils/rate_limiter.py`:
   ```python
   import time
   import json
   from database import db
   from models import RateLimitEntry

   class RateLimiter:
       def __init__(self, max_requests=100, window=60):
           self.max_requests = max_requests
           self.window = window

       def check(self, key):
           now = time.time()
           cutoff = now - self.window
           # Limpar entradas antigas
           RateLimitEntry.query.filter(RateLimitEntry.timestamp < cutoff).delete()
           # Contar requisições no window
           count = RateLimitEntry.query.filter_by(key=key).filter(RateLimitEntry.timestamp >= cutoff).count()
           if count >= self.max_requests:
               return False
           # Registrar nova requisição
           entry = RateLimitEntry(key=key, timestamp=now)
           db.session.add(entry)
           db.session.commit()
           return True
   ```
2. Criar modelo `RateLimitEntry` em `models.py` com campos: `id`, `key`, `timestamp`.
3. Substituir uso em `public_api_service.py`.

### Fallback sem Redis
Se Redis não estiver disponível, usar SQLite como store. Documentar que em produção deve-se usar Redis.

### Testes
- 100 requisições dentro de 60s → sucesso
- 101ª requisição dentro de 60s → bloqueada
- Após 60s, contador reseta
- Reiniciar servidor mantém contadores (persistido em SQLite)

---

## BUG-04: Webhook delivery é mockado

### Arquivo
- `backend/services/public_api_service.py:118-126`

### Problema
`deliver_webhook` sempre retorna 200 sem fazer HTTP real.

### Correção
1. Implementar delivery HTTP real:
   ```python
   import requests

   def deliver_webhook(self, webhook_id, event, payload):
       wh = self.webhook_repo.get_by_id(webhook_id)
       if not wh or not wh.matches_event(event):
           return {'success': False, 'errors': ['Webhook não encontrado']}

       try:
           response = requests.post(
               wh.url,
               json={'event': event, 'payload': payload, 'timestamp': datetime.utcnow().isoformat()},
               timeout=10,
               headers={'Content-Type': 'application/json', 'X-Webhook-Event': event},
           )
           success = 200 <= response.status_code < 300
           wh.record_delivery(status_code=response.status_code, success=success)
           self.webhook_repo.save(wh)
           return {'success': success, 'statusCode': response.status_code}
       except requests.RequestException as e:
           wh.record_delivery(status_code=0, success=False)
           self.webhook_repo.save(wh)
           self.logger.warning('Webhook delivery failed: id=%s error=%s', webhook_id, str(e))
           return {'success': False, 'errors': [str(e)]}
   ```
2. Adicionar retry com exponencial backoff (3 tentativas: 1s, 2s, 4s).
3. Adicionar `requests` ao `requirements.txt` se ainda não estiver.

### Testes
- Webhook entregue com sucesso → status 200, success=True
- Webhook com URL inválida → success=False, status=0
- Webhook com timeout → success=False
- Retry em caso de falha
- Delivery registrado no modelo Webhook

---

## BUG-05: LGPD deletion não anonimiza todos os dados

### Arquivo
- `backend/services/lgpd_service.py:107-150`

### Problema
Deleta apenas `Client`, `Appointment`, `Transaction`. Não trata: `Payment`, `Wallet`, `WalletTransaction`, `LoyaltyAccount`, `LoyaltyTransaction`, `ServicePackage`, `PackageUsage`, `GiftCard`, `Coupon`, `Campaign`, `CRMClient`, `InventoryItem`, `InventoryMovement`, `Expense`, `Revenue`, `Employee`, `Commission`, `Branch`, `Contract`, `Quote`, `CheckIn`, `CheckOut`, `Goal`, `AnalyticsEvent`, `Conversation`, `Message`, `SocialPost`, `SocialStory`, `Comment`, `Like`, `Follow`, `Report`, `Notification`, `Workflow`, `WorkflowExecution`, `HomeCareVisit`, `Route`, `Subscription`, `Billing`, `Referral`, `AgentConfig`, `AgentExecution`, `AuditLog`, `ApiKey`, `Webhook`, `DataRequest`, `FeatureFlag`, `Review`, `Favorite`, `Work`, `WorkOrder`, `Service`, `Category`.

### Correção
1. Listar TODAS as entidades que têm `user_id` ou referência ao usuário.
2. Anonimizar dados sensíveis (nomes, emails, telefones) em vez de apenas deletar (para manter integridade referencial de auditoria).
3. Deletar dados pessoais: `Client`, `Appointment`, `Transaction`, `Payment`, `Wallet`, `WalletTransaction`, `LoyaltyAccount`, `SocialPost`, `Message`, `Conversation`, `Review`, `Notification`.
4. Anonimizar: `User.name = 'Deleted User'`, `User.email = f'deleted_{id}@deleted.local'`.
5. Revogar: `ApiKey`, `Webhook`, `Session`.
6. Manter: `AuditLog` (com dados anonimizados), `DataRequest` (registro da solicitação).

### Testes
- Após deletion, User está anonimizado
- Nenhum dado pessoal em Client, Appointment, Transaction, Payment
- Wallet zerada e inativa
- ApiKeys revogadas
- Webhooks desativados
- AuditLog mantido mas sem dados pessoais
- DataRequest mantido como registro

---

## MEL-09: Migrações de banco com Flask-Migrate

### Arquivos
- `backend/requirements.txt` (adicionar `Flask-Migrate`)
- `backend/app.py`
- `backend/migrations/` (novo diretório)

### Correção
1. Adicionar `Flask-Migrate` ao `requirements.txt`.
2. Configurar em `app.py`:
   ```python
   from flask_migrate import Migrate
   migrate = Migrate(app, db)
   ```
3. Inicializar:
   ```bash
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```
4. Documentar no README: sempre rodar `flask db migrate` após mudanças no schema.

### Teste
- `flask db migrate` gera migration sem erros
- `flask db upgrade` aplica migration
- `flask db downgrade` reverte migration
- Banco existente mantém dados após migration

---

## BUG-14 (Backend): Paginação nas rotas GET

### Arquivo
- `backend/app.py` — todas as rotas GET de listagem

### Correção
1. Adicionar helper `paginate`:
   ```python
   def paginate_query(query, page, limit):
       page = max(1, int(page))
       limit = min(100, max(1, int(limit)))
       total = query.count()
       items = query.offset((page - 1) * limit).limit(limit).all()
       return {
           'items': items,
           'total': total,
           'page': page,
           'limit': limit,
           'pages': (total + limit - 1) // limit,
       }
   ```
2. Aplicar em todas as rotas: `/api/clients`, `/api/services`, `/api/appointments`, `/api/transactions`, `/api/works`, `/api/work-orders`, `/api/payments`, `/api/wallet/transactions`, `/api/crm/clients`, `/api/inventory/items`, `/api/marketing/campaigns`, `/api/employees`, `/api/commissions`, `/api/branches`, `/api/contracts`, `/api/quotes`, `/api/chat/conversations`, `/api/social/posts`, `/api/notifications`, `/api/workflows`, `/api/homecare/visits`, `/api/subscriptions`, `/api/referrals`, `/api/agents`, `/api/admin/audit`, `/api/api-keys`, `/api/webhooks`, `/api/lgpd/requests`.
3. Manter compatibilidade: se `?page` não for informado, retornar todos (deprecation warning no log).

### Testes
- Rota com `?page=1&limit=20` retorna 20 itens + metadados
- Rota sem parâmetros retorna todos (compatibilidade)
- `?limit=200` retorna no máximo 100
- `?page=0` trata como page=1
- Total e pages calculados corretamente

---

## Critérios de Aceite
- [ ] Rate limiter persiste em SQLite (sobrevive a restart)
- [ ] Webhook delivery faz HTTP real com retry
- [ ] LGPD deletion anonimiza TODAS as entidades do usuário
- [ ] Flask-Migrate configurado com migration inicial
- [ ] Paginação em todas as rotas GET de listagem
- [ ] Todos os testes existentes (679) + novos passando
- [ ] `python -m pytest tests/ -q` sem falhas
```
