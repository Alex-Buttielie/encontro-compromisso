#!/bin/bash
# ============================================
# Setup Script — Rodar UMA VEZ na VPS
# Configura Node.js, PM2, Nginx e SSL
# ============================================

set -e

echo "============================================"
echo "  Setup VPS — Meu Coordenador JUMIRE"
echo "============================================"

# ===== 1. Install Node.js via nvm =====
echo ">>> Installing nvm..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

echo ">>> Installing Node.js 20..."
nvm install 20
nvm use 20
nvm alias default 20

echo ">>> Node version:"
node -v
npm -v

# ===== 2. Install PM2 =====
echo ">>> Installing PM2..."
npm install -g pm2

# ===== 3. Create app directories =====
echo ">>> Creating app directories..."
mkdir -p /home/apps/coordenador-dev
mkdir -p /home/apps/coordenador-homolog
mkdir -p /home/apps/coordenador-prod

# ===== 4. Clone repositories =====
echo ">>> Cloning repositories..."
cd /home/apps
if [ ! -d "coordenador-dev/.git" ]; then
  git clone -b develop https://github.com/Alex-Buttielie/encontro-compromisso.git coordenador-dev
fi
if [ ! -d "coordenador-homolog/.git" ]; then
  git clone -b main https://github.com/Alex-Buttielie/encontro-compromisso.git coordenador-homolog
fi
if [ ! -d "coordenador-prod/.git" ]; then
  git clone -b main https://github.com/Alex-Buttielie/encontro-compromisso.git coordenador-prod
fi

# ===== 5. Install dependencies & start apps =====
for ENV in dev homolog prod; do
  DIR="/home/apps/coordenador-$ENV"
  cd "$DIR"
  echo ">>> Installing dependencies for $ENV..."
  npm install --production
done

# Start dev (port 3001)
cd /home/apps/coordenador-dev
PORT=3001 NODE_ENV=development pm2 start server.js --name "coordenador-dev"
# Start homolog (port 3002)
cd /home/apps/coordenador-homolog
PORT=3002 NODE_ENV=staging pm2 start server.js --name "coordenador-homolog"
# Start prod (port 3003)
cd /home/apps/coordenador-prod
PORT=3003 NODE_ENV=production pm2 start server.js --name "coordenador-prod"

pm2 save
pm2 startup
echo ">>> PM2 configured. Copy and run the command above if prompted."

# ===== 6. Install & Configure Nginx =====
echo ">>> Installing Nginx..."
sudo apt update && sudo apt install nginx -y

# Dev config
sudo tee /etc/nginx/sites-available/coordenador-dev << 'NGINX'
server {
    listen 80;
    server_name dev.meucoordenador.com.br;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /reports/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        client_max_body_size 10m;
    }
}
NGINX

# Homolog config
sudo tee /etc/nginx/sites-available/coordenador-homolog << 'NGINX'
server {
    listen 80;
    server_name homolog.meucoordenador.com.br;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /reports/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        client_max_body_size 10m;
    }
}
NGINX

# Prod config
sudo tee /etc/nginx/sites-available/coordenador-prod << 'NGINX'
server {
    listen 80;
    server_name meucoordenador.com.br www.meucoordenador.com.br;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /reports/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        client_max_body_size 10m;
    }
}
NGINX

# Enable sites
sudo ln -sf /etc/nginx/sites-available/coordenador-dev /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/coordenador-homolog /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/coordenador-prod /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# ===== 7. Install Certbot for SSL =====
echo ">>> Installing Certbot..."
sudo apt install certbot python3-certbot-nginx -y

echo "============================================"
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Point your domains DNS to this VPS IP:"
echo "     - dev.meucoordenador.com.br    → VPS IP"
echo "     - homolog.meucoordenador.com.br → VPS IP"
echo "     - meucoordenador.com.br         → VPS IP"
echo ""
echo "  2. Generate SSL certificates:"
echo "     sudo certbot --nginx -d dev.meucoordenador.com.br"
echo "     sudo certbot --nginx -d homolog.meucoordenador.com.br"
echo "     sudo certbot --nginx -d meucoordenador.com.br -d www.meucoordenador.com.br"
echo ""
echo "  3. Check app status:"
echo "     pm2 status"
echo "============================================"
