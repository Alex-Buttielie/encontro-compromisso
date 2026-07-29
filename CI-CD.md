# Pipeline CI/CD — Meu Coordenador JUMIRE

## Visão Geral

Pipeline automatizado via GitHub Actions com 3 ambientes:

```
                    push develop                         PR develop → main                         tag v*
                   ──────────────►                      ──────────────────►                      ───────────────►
                   │                │                    │                  │                    │                │
                   ▼                ▼                    ▼                  ▼                    ▼                ▼
              CI Workflow      Deploy DEV           CI Workflow        Deploy HOMOLOG        Deploy PROD     GitHub Release
              (lint/test)     (VPS :3001)          (lint/test)         (VPS :3002)           (VPS :3003)      + Tag
```

### Ambientes na VPS

| Ambiente | Branch | Porta | URL | PM2 Process |
|----------|--------|-------|-----|-------------|
| DEV | develop | 3001 | dev.meucoordenador.com.br | coordenador-dev |
| HOMOLOG | develop (no PR) | 3002 | homolog.meucoordenador.com.br | coordenador-homolog |
| PROD | main (tag v*) | 3003 | meucoordenador.com.br | coordenador-prod |

### Fluxo Git Flow

1. **Desenvolver feature**: `git checkout develop` → criar branch `feature/x` → commitar → merge em `develop`
2. **Push em develop**: dispara CI + deploy automático em DEV (porta 3001)
3. **PR develop → main**: dispara CI + deploy em HOMOLOG (porta 3002) para validação
4. **Merge PR + tag**: criar tag `v1.0.0` dispara deploy em PROD (porta 3003) + GitHub Release

---

## Configuração — PASSO ÚNICO (uma vez)

### Passo 1: Configurar Secrets no GitHub

No repositório GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret | Valor | Descrição |
|--------|-------|-----------|
| `VPS_HOST` | IP da sua VPS (ex: `192.168.1.100`) | IP público da VPS HostGator |
| `VPS_USER` | `root` (ou seu usuário) | Usuário SSH da VPS |
| `VPS_SSH_KEY` | (chave privada SSH) | Chave privada para acessar a VPS via SSH |

### Passo 2: Configurar Environments no GitHub

No repositório GitHub → **Settings** → **Environments**:

1. Criar environment **development** (sem proteção)
2. Criar environment **homolog** (opcional: exigir aprovação manual)
3. Criar environment **production** (recomendado: exigir aprovação manual antes do deploy)

### Passo 3: Gerar chave SSH para GitHub Actions

Na sua máquina local (Windows), rode:

```bash
# Gerar chave SSH (sem passphrase)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_key

# Exibir a chave PRIVADA (copie tudo — vai no secret VPS_SSH_KEY)
cat ~/.ssh/github_actions_key

# Exibir a chave PÚBLICA (vai na VPS)
cat ~/.ssh/github_actions_key.pub
```

### Passo 4: Adicionar chave pública na VPS

No terminal da VPS (pelo painel da HostGator):

```bash
# Adicionar chave pública
echo "COLE_AQUI_SUA_CHAVE_PUBLICA" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Passo 5: Setup inicial na VPS

No terminal da VPS, rode o script de setup:

```bash
# Baixar e executar o setup
curl -o- https://raw.githubusercontent.com/Alex-Buttielie/encontro-compromisso/main/scripts/setup-vps.sh | bash
```

Ou manualmente:

```bash
# Clonar repositório
git clone https://github.com/Alex-Buttielie/encontro-compromisso.git
cd encontro-compromisso

# Instalar Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20

# Instalar PM2
npm install -g pm2

# Instalar Nginx
sudo apt update && sudo apt install nginx -y

# Configurar Nginx (ver scripts/setup-vps.sh para configs completas)
```

### Passo 6: Configurar DNS

No painel de DNS do seu domínio, aponte 3 subdomínios para o IP da sua VPS:

| Registro | Tipo | Valor |
|----------|------|-------|
| `dev.meucoordenador.com.br` | A | IP_DA_VPS |
| `homolog.meucoordenador.com.br` | A | IP_DA_VPS |
| `meucoordenador.com.br` | A | IP_DA_VPS |
| `www.meucoordenador.com.br` | A | IP_DA_VPS |

### Passo 7: Configurar SSL (HTTPS)

Na VPS, após o DNS propagar:

```bash
sudo certbot --nginx -d dev.meucoordenador.com.br
sudo certbot --nginx -d homolog.meucoordenador.com.br
sudo certbot --nginx -d meucoordenador.com.br -d www.meucoordenador.com.br
```

---

## Como usar no dia a dia

### Deploy em DEV (automático)

```bash
git checkout develop
git add .
git commit -m "feat: nova funcionalidade"
git push origin develop
# → CI roda → Deploy DEV automático → App na porta 3001
```

### Deploy em HOMOLOG (automático via PR)

1. No GitHub, criar **Pull Request**: `develop` → `main`
2. Pipeline dispara automaticamente:
   - CI roda (lint, test, build)
   - Deploy em HOMOLOG (porta 3002)
   - Validação automática (HTTP check)
   - Comentário no PR com resultado
3. Validar manualmente em `homolog.meucoordenador.com.br`

### Deploy em PROD (via tag)

Após aprovar e merge do PR:

```bash
git checkout main
git pull origin main
git tag v1.0.0
git push origin v1.0.0
# → CI roda → Deploy PROD automático → GitHub Release criado → App na porta 3003
```

### Rollback em caso de problema

```bash
# Na VPS, voltar para versão anterior
cd /home/apps/coordenador-prod
git log --oneline -5          # ver commits anteriores
git reset --hard <commit_hash>
pm2 restart coordenador-prod
```

---

## Workflows do GitHub Actions

| Workflow | Arquivo | Trigger | O que faz |
|----------|--------|---------|-----------|
| CI | `.github/workflows/ci.yml` | push/PR em develop e main | Lint, syntax check, build artifact |
| Deploy DEV | `.github/workflows/deploy-dev.yml` | push em develop | CI + deploy VPS porta 3001 + validação |
| Deploy HOMOLOG | `.github/workflows/deploy-homolog.yml` | PR para main | CI + deploy VPS porta 3002 + validação + comenta PR |
| Deploy PROD | `.github/workflows/deploy-prod.yml` | tag v* | CI + deploy VPS porta 3003 + validação + GitHub Release |

---

## Estrutura de Arquivos

```
encontro-compromisso/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Pipeline de CI (lint, test, build)
│       ├── deploy-dev.yml      # Deploy automático DEV
│       ├── deploy-homolog.yml  # Deploy automático HOMOLOG
│       └── deploy-prod.yml     # Deploy automático PROD
├── scripts/
│   ├── setup-vps.sh           # Setup inicial da VPS (rodar 1x)
│   └── deploy.sh              # Script de deploy genérico
├── .gitignore
├── .env.example
├── .nvmrc
├── DEPLOY.md                  # Guia de deploy manual
├── CI-CD.md                   # Este arquivo
└── ...
```
