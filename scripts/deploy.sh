#!/bin/bash
# ============================================
# Deploy Script — Meu Coordenador JUMIRE
# Executado na VPS via SSH pelo GitHub Actions
# ============================================

set -e

ENVIRONMENT="$1"
BRANCH="$2"
PORT="$3"
APP_DIR="$4"

if [ -z "$ENVIRONMENT" ] || [ -z "$BRANCH" ] || [ -z "$PORT" ] || [ -z "$APP_DIR" ]; then
  echo "Usage: deploy.sh <environment> <branch> <port> <app_dir>"
  echo "Example: deploy.sh dev develop 3001 /home/apps/coordenador-dev"
  exit 1
fi

echo "============================================"
echo "  Deploy: $ENVIRONMENT"
echo "  Branch: $BRANCH"
echo "  Port:   $PORT"
echo "  Dir:    $APP_DIR"
echo "============================================"

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20

# Clone or pull
if [ -d "$APP_DIR/.git" ]; then
  echo ">>> Pulling latest code..."

  # Backup database before git reset (preserve user data)
  DB_FILE="$APP_DIR/db/encontro.json"
  DB_BACKUP=""
  if [ -f "$DB_FILE" ]; then
    DB_BACKUP=$(mktemp /tmp/encontro-db-XXXXXX.json)
    cp "$DB_FILE" "$DB_BACKUP"
    echo ">>> Database backed up"
  fi

  cd "$APP_DIR"
  git fetch origin
  git reset --hard "origin/$BRANCH"

  # Restore database after git reset
  if [ -n "$DB_BACKUP" ] && [ -f "$DB_BACKUP" ]; then
    mkdir -p "$APP_DIR/db"
    cp "$DB_BACKUP" "$DB_FILE"
    rm -f "$DB_BACKUP"
    echo ">>> Database restored"
  fi
else
  echo ">>> Cloning repository..."
  mkdir -p "$(dirname "$APP_DIR")"
  git clone -b "$BRANCH" https://github.com/Alex-Buttielie/encontro-compromisso.git "$APP_DIR"
  cd "$APP_DIR"
fi

# Install dependencies
echo ">>> Installing dependencies..."
npm install --production

# Set environment port
export PORT="$PORT"
export NODE_ENV="$ENVIRONMENT"

# Stop existing PM2 process (if any)
pm2 delete "coordenador-$ENVIRONMENT" 2>/dev/null || true

# Start with PM2
echo ">>> Starting PM2 process..."
pm2 start server.js --name "coordenador-$ENVIRONMENT" --env "$ENVIRONMENT"

# Save PM2 process list
pm2 save

echo "============================================"
echo "  Deploy $ENVIRONMENT complete!"
echo "  App running on port $PORT"
echo "  PM2 process: coordenador-$ENVIRONMENT"
echo "============================================"
