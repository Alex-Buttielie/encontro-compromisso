# Quick Start - Profissional OS

## 🚀 Executando a Aplicação (Backend Flask + Frontend Next.js)

### 1. Iniciar o Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt
cp .env.example .env
python seed.py               # Dados de teste
python app.py
```

Backend: `http://localhost:5000`

### 2. Iniciar o Frontend

Em outro terminal:

```bash
cd frontend-next
npm install
npm run dev
```

Frontend: `http://localhost:3000`

### 3. Docker (opcional)

```bash
docker compose up --build
```

## 👤 Usuário de Teste

**Credenciais:**
- Email: `teste@profissional-os.com`
- Senha: `Teste123`

## 🧪 Testes

```bash
cd backend
python -m pytest tests/ -q
```

## 📁 Arquitetura

- `backend/` — API Python (Flask + SQLite/PostgreSQL)
- `frontend-next/` — Next.js 15 + Material UI 6
