# Prompt 15 — Infraestrutura e DevOps

> Execute após `14-melhorias-backend.md`. Endereça MEL-10, ARQ-04, ARQ-05, ARQ-06.

```text
Você é um arquiteto de software sênior e DevOps. O projeto Profissional OS precisa de infraestrutura para produção: Docker, CI/CD, monitoramento e migração de banco.

## Contexto
- Backend: Python Flask em `backend/`
- Frontend: React + TypeScript em `frontend/`
- Atualmente: SQLite, sem Docker, sem CI/CD, sem monitoramento

---

## MEL-10: Docker

### Arquivos a criar
- `Dockerfile.backend`
- `Dockerfile.frontend`
- `docker-compose.yml`
- `.dockerignore`

### Dockerfile.backend
```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

### Dockerfile.frontend
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      dockerfile: ../Dockerfile.backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_DEBUG=True
      - DATABASE_URL=sqlite:///profissional_os.db
    volumes:
      - backend-data:/app/instance

  frontend:
    build:
      context: ./frontend
      dockerfile: ../Dockerfile.frontend
    ports:
      - "8080:80"
    depends_on:
      - backend

volumes:
  backend-data:
```

### nginx.conf (para frontend)
```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Teste
- `docker compose up` sobe backend e frontend
- Frontend acessível em `http://localhost:8080`
- Backend acessível em `http://localhost:5000`
- API proxy funciona via nginx

---

## ARQ-04: CI/CD com GitHub Actions

### Arquivo a criar
- `.github/workflows/ci.yml`

### Pipeline
```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.13'
      - run: pip install -r backend/requirements.txt
      - run: cd backend && python -m pytest tests/ -q --tb=short

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run test
      - run: cd frontend && npm run build

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.13'
      - run: pip install flake8
      - run: cd backend && flake8 . --max-line-length=120 --extend-ignore=E203,W503
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npx tsc --noEmit
```

### Teste
- Push para `develop` dispara CI
- Backend tests rodam e passam
- Frontend tests rodam e passam
- Lint roda em ambos
- Falha em qualquer etapa bloqueia merge

---

## ARQ-05: Monitoramento com Sentry

### Arquivos
- `backend/requirements.txt` (adicionar `sentry-sdk[flask]`)
- `backend/app.py`
- `frontend/src/main.tsx` (adicionar `@sentry/react`)
- `frontend/package.json` (adicionar `@sentry/react`)

### Backend
```python
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN'),
    integrations=[FlaskIntegration()],
    traces_sample_rate=1.0 if os.environ.get('FLASK_DEBUG') else 0.1,
    environment=os.environ.get('SENTRY_ENV', 'development'),
)
```

### Frontend
```tsx
import * as Sentry from '@sentry/react';
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

### Configuração
- Adicionar `SENTRY_DSN` ao `.env.example`
- Adicionar `VITE_SENTRY_DSN` ao `frontend/.env.example`
- Documentar no README como obter DSN

### Teste
- Erro no backend é capturado pelo Sentry
- Erro no frontend é capturado pelo Sentry
- Performance traces funcionando

---

## ARQ-06: Migração SQLite → PostgreSQL

### Arquivos
- `backend/requirements.txt` (adicionar `psycopg2-binary`)
- `backend/config.py`
- `docker-compose.yml` (adicionar serviço postgres)

### docker-compose.yml (atualizar)
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: profissional_os
      POSTGRES_USER: pos_user
      POSTGRES_PASSWORD: pos_pass
    ports:
      - "5432:5432"
    volumes:
      - pg-data:/var/lib/postgresql/data

  backend:
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://pos_user:pos_pass@db:5432/profissional_os
```

### config.py
```python
SQLALCHEMY_DATABASE_URI = os.environ.get(
    'DATABASE_URL',
    'sqlite:///profissional_os.db'  # fallback para dev
)
```

### Migração
1. Rodar `flask db migrate` com PostgreSQL
2. Rodar `flask db upgrade`
3. Rodar `python seed.py` para popular
4. Testar todas as rotas

### Teste
- Backend conecta ao PostgreSQL
- Todas as 679+ testes passam com PostgreSQL
- `seed.py` funciona com PostgreSQL
- SQLite ainda funciona em desenvolvimento (fallback)

---

## Critérios de Aceite
- [ ] `docker compose up` sobe aplicação completa
- [ ] CI/CD pipeline no GitHub Actions
- [ ] Sentry captura erros de backend e frontend
- [ ] PostgreSQL configurado e funcionando
- [ ] SQLite ainda funciona como fallback para dev
- [ ] `.env.example` atualizado com todas as variáveis
- [ ] README atualizado com instruções Docker
- [ ] Todos os testes passando
```
