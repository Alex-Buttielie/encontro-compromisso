# Prompt 17 — Migração para FastAPI

> Execute após `16-preparacao-mobile-pwa.md`. Endereça ARQ-01, ARQ-03. Esta é a fase final.

```text
Você é um arquiteto de software sênior. O projeto Profissional OS está em Flask e precisa migrar para FastAPI para ganhar async, validação Pydantic, WebSocket nativo e documentação OpenAPI automática.

## Contexto
- Backend atual: Python Flask em `backend/`
- Target: FastAPI + Pydantic + Uvicorn
- Frontend: não muda (mesma API REST)
- Migração incremental: manter Flask rodando enquanto FastAPI é construído

---

## Estratégia de Migração

### Princípios
1. **Migrar por domínio, não por rotas individuais** — auth primeiro, depois clients, services, etc.
2. **Manter compatibilidade de URLs** — mesmas rotas `/api/auth/login`, mesmos payloads
3. **Migrar testes junto** — cada domínio migrado deve ter seus testes passando no FastAPI
4. **Rodar ambos em paralelo** — Flask na porta 5000, FastAPI na 5001, depois trocar

### Ordem de migração
1. Setup FastAPI + estrutura + health check
2. Auth (login, register, profile)
3. Clients + Services
4. Appointments + Transactions
5. Works + Work Orders
6. Payments + Wallet + Loyalty
7. CRM + Inventory + Marketing + Analytics
8. Employees + Commissions + Branches
9. Contracts + Quotes + Check-in/out
10. Chat + Social + Notifications
11. Workflows + HomeCare
12. Subscriptions + Referrals + AI Agents
13. Admin + API Keys + Webhooks + LGPD + Feature Flags

---

## ARQ-01: Migração Flask → FastAPI

### Setup inicial

Criar `backend/fastapi_app/`:
```
backend/fastapi_app/
├── main.py              # App FastAPI + routers
├── deps.py              # Dependências (auth, db, services)
├── schemas/             # Modelos Pydantic
│   ├── auth.py
│   ├── client.py
│   ├── service.py
│   └── ...
├── routers/             # Routers por domínio
│   ├── auth.py
│   ├── clients.py
│   ├── services.py
│   └── ...
└── requirements.txt     # fastapi, uvicorn, pydantic
```

### main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import db, init_app
from routers import auth, clients, services

app = FastAPI(title="Profissional OS API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
init_app(app)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(clients.router, prefix="/api/clients", tags=["clients"])
app.include_router(services.router, prefix="/api/services", tags=["services"])
```

### deps.py — Injeção de dependências
```python
from fastapi import Depends, HTTPException, Header
import jwt
from config import Config

async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token não fornecido")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token inválido")

async def get_current_user_id(user = Depends(get_current_user)):
    return user["user_id"]
```

### schemas/auth.py — Validação Pydantic
```python
from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = Field(default="provider", pattern="^(provider|client)$")
    profession: str = ""
    phone: str = ""
    address: str = ""
    bio: str = ""
    link: str = ""
    termsAccepted: bool = False
    privacyAccepted: bool = False

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    profession: str
    # ...
```

### routers/auth.py
```python
from fastapi import APIRouter, Depends
from deps import get_current_user_id
from schemas.auth import LoginRequest, RegisterRequest

router = APIRouter()

@router.post("/login")
async def login(data: LoginRequest):
    service = AuthService()
    result = service.login(data.email, data.password)
    if not result["success"]:
        raise HTTPException(400, detail=result["errors"])
    return result

@router.post("/register")
async def register(data: RegisterRequest):
    service = AuthService()
    result = service.register(data.model_dump())
    if not result["success"]:
        raise HTTPException(400, detail=result["errors"])
    return result

@router.get("/profile")
async def get_profile(user_id: int = Depends(get_current_user_id)):
    service = AuthService()
    user = service.get_profile(user_id)
    return user
```

### requirements.txt (FastAPI)
```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
pydantic[email]>=2.0
python-jose[cryptography]>=3.3
```

### Rodar
```bash
uvicorn fastapi_app.main:app --reload --port 5001
```

### Documentação automática
- `/docs` — Swagger UI
- `/redoc` — ReDoc
- `/openapi.json` — Schema OpenAPI 3.1

### Testes
Usar `httpx` + `pytest`:
```python
from fastapi.testclient import TestClient
from fastapi_app.main import app

client = TestClient(app)

def test_login():
    response = client.post("/api/auth/login", json={"email": "teste@profissional-os.com", "password": "Teste123"})
    assert response.status_code == 200
    assert "token" in response.json()
```

---

## ARQ-03: Jobs assíncronos com Celery + Redis

### Arquivos
- `backend/requirements.txt` (adicionar `celery`, `redis`)
- `backend/celery_app.py` (novo)
- `backend/tasks/` (novo diretório)
- `docker-compose.yml` (adicionar redis e celery worker)

### celery_app.py
```python
from celery import Celery
import os

celery = Celery(
    'profissional_os',
    broker=os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
    backend=os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
)
celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Sao_Paulo',
    enable_utc=True,
)
```

### tasks/notifications.py
```python
from celery_app import celery
from services.notification_service import NotificationService

@celery.task
def send_appointment_reminder(appointment_id):
    service = NotificationService()
    service.send_reminder(appointment_id)

@celery.task
def send_marketing_campaign(campaign_id):
    service = MarketingService()
    service.execute_campaign(campaign_id)
```

### tasks/webhooks.py
```python
@celery.task(bind=True, max_retries=3)
def deliver_webhook(self, webhook_id, event, payload):
    try:
        service = PublicApiService()
        result = service.deliver_webhook(webhook_id, event, payload)
        if not result['success']:
            raise Exception(result.get('errors', 'Delivery failed'))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
```

### docker-compose.yml
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  celery-worker:
    build: ./backend
    command: celery -A celery_app worker --loglevel=info
    depends_on:
      - redis
```

### Integrar com serviços
- `appointment_service` → chamar `send_appointment_reminder.delay(appointment_id)`
- `public_api_service.trigger_webhooks` → chamar `deliver_webhook.delay(wh.id, event, payload)`
- `marketing_service` → chamar `send_marketing_campaign.delay(campaign_id)`

### Teste
- Job é enfileirado e executado
- Retry em caso de falha
- Resultado armazenado no backend
- Worker processa múltiplos jobs concorrentemente

---

## Migração gradual do frontend

1. Adicionar `VITE_API_URL` que aponta para FastAPI (porta 5001)
2. Testar todas as páginas contra FastAPI
3. Quando todos os domínios estiverem migrados, desligar Flask
4. FastAPI passa a rodar na porta 5000

---

## Critérios de Aceite
- [ ] FastAPI rodando com pelo menos auth, clients e services migrados
- [ ] Documentação Swagger/ReDoc automática em `/docs`
- [ ] Validação Pydantic em todos os endpoints migrados
- [ ] JWT com python-jose funcionando
- [ ] Celery + Redis configurados
- [ ] Jobs assíncronos para notificações, webhooks e campanhas
- [ ] Todos os testes passando (existentes + novos no FastAPI)
- [ ] Frontend funciona contra FastAPI sem mudanças
- [ ] Docker compose com FastAPI + Redis + Celery + PostgreSQL
- [ ] README atualizado com nova arquitetura
```
