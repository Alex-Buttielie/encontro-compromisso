# Deploy na HostGator VPS — Meu Coordenador JUMIRE

## Pré-requisitos

- Acesso ao painel da HostGator (VPS)
- Terminal/SSH da VPS acessível pelo painel
- Repositório no GitHub: https://github.com/Alex-Buttielie/encontro-compromisso

---

## Passo 1 — Acessar o terminal da VPS

No painel da HostGator:
1. Vá em **Servidores VPS** → selecione sua VPS
2. Clique em **Acesso ao Terminal** (ou "Console", "VNC")
3. Abra o terminal web

---

## Passo 2 — Instalar Node.js (se ainda não tiver)

Copie e cole estes comandos no terminal da VPS:

```bash
# Instalar nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Recarregar o perfil
source ~/.bashrc

# Instalar Node.js 20 (versão LTS)
nvm install 20

# Confirmar instalação
node -v
npm -v
```

---

## Passo 3 — Instalar PM2 (gerenciador de processos)

O PM2 mantém sua aplicação rodando mesmo se o terminal fechar, e reinicia automaticamente em caso de crash.

```bash
npm install -g pm2
```

---

## Passo 4 — Clonar o repositório

```bash
# Entrar no diretório de sites (ou criar um)
mkdir -p ~/apps
cd ~/apps

# Clonar do GitHub
git clone https://github.com/Alex-Buttielie/encontro-compromisso.git
cd encontro-compromisso

# Instalar dependências
npm install
```

---

## Passo 5 — Iniciar a aplicação com PM2

```bash
# Iniciar o app
pm2 start server.js --name "meu-coordenador"

# Salvar a lista de processos (reinicia automaticamente após reboot)
pm2 save

# Configurar inicialização automática no boot do servidor
pm2 startup
# (copie e cole o comando que o PM2 exibir na tela)
```

---

## Passo 6 — Instalar e configurar Nginx (proxy reverso)

O Nginx recebe as requisições na porta 80/443 e repassa para sua aplicação na porta 3000.

```bash
# Instalar Nginx
sudo apt update && sudo apt install nginx -y

# Criar configuração do site
sudo tee /etc/nginx/sites-available/meu-coordenador << 'EOF'
server {
    listen 80;
    server_name SEU_DOMINIO_OU_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Ativar o site
sudo ln -s /etc/nginx/sites-available/meu-coordenador /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

**Importante**: Substitua `SEU_DOMINIO_OU_IP` pelo seu domínio (ex: `meucoordenador.com.br`) ou pelo IP da VPS.

---

## Passo 7 — Configurar SSL (HTTPS) com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Gerar certificado SSL
sudo certbot --nginx -d SEU_DOMINIO_OU_IP

# Siga as instruções na tela (digite seu email, concorde com os termos)
```

---

## Passo 8 — Comandos úteis para o dia a dia

```bash
# Ver status do app
pm2 status

# Ver logs do app
pm2 logs meu-coordenador

# Reiniciar o app
pm2 restart meu-coordenador

# Parar o app
pm2 stop meu-coordenador

# Atualizar a aplicação (após fazer mudanças no GitHub)
cd ~/apps/encontro-compromisso
git pull origin main
npm install
pm2 restart meu-coordenador
```

---

## Resumo da arquitetura

```
Internet → Nginx (porta 80/443) → Node.js (porta 3000) → App Meu Coordenador
                                    ↑ gerenciado por PM2 (auto-restart)
```

## Checklist final

- [ ] Node.js instalado na VPS
- [ ] PM2 instalado e app rodando
- [ ] Nginx configurado como proxy reverso
- [ ] SSL/HTTPS configurado com Let's Encrypt
- [ ] App acessível pelo domínio ou IP
- [ ] `pm2 startup` configurado (auto-start no reboot)
