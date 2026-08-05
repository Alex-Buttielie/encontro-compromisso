# Prompt 16 — Preparação Mobile, PWA e i18n

> Execute após `15-infraestrutura-devops.md`. Endereça MEL-07, MEL-08, ARQ-02.

```text
Você é um arquiteto de software sênior. O projeto Profissional OS precisa de PWA, internacionalização e preparação para tempo real (WebSocket).

## Contexto
- Frontend: React + TypeScript em `frontend/`
- Stack: Vite, TailwindCSS, React Router 6
- Interface atual: apenas pt-BR, sem offline, sem push

---

## MEL-07: Internacionalização (i18n)

### Arquivos
- `frontend/package.json` (adicionar `react-i18next` e `i18next`)
- `frontend/src/i18n/index.ts` (novo)
- `frontend/src/i18n/locales/pt-BR.json` (novo)
- `frontend/src/i18n/locales/en-US.json` (novo)
- `frontend/src/main.tsx` (importar i18n)

### Configuração
```ts
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    'en-US': { translation: enUS },
  },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
});

export default i18n;
```

### Estrutura de traduções
```json
// pt-BR.json
{
  "common": {
    "loading": "Carregando...",
    "error": "Erro",
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir",
    "confirm": "Confirmar",
    "search": "Buscar",
    "noResults": "Nenhum resultado encontrado",
    "tryAgain": "Tentar novamente"
  },
  "auth": {
    "login": "Entrar",
    "register": "Criar conta",
    "logout": "Sair",
    "email": "E-mail",
    "password": "Senha",
    "name": "Nome",
    "loginSuccess": "Login realizado com sucesso!",
    "loginError": "Erro ao fazer login"
  },
  "nav": {
    "dashboard": "Dashboard",
    "agenda": "Agenda",
    "clients": "Clientes",
    "services": "Serviços",
    "finance": "Financeiro",
    "profile": "Perfil"
  },
  "dashboard": {
    "title": "Dashboard",
    "nextAppointments": "Próximos agendamentos",
    "recentClients": "Clientes recentes"
  }
}
```

### Uso nas páginas
```tsx
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<h1>{t('dashboard.title')}</h1>
```

### Seletor de idioma
Adicionar botão no Layout sidebar para alternar entre pt-BR e en-US.
Persistir escolha em `localStorage`.

### Teste
- Idioma padrão é pt-BR
- Trocar para en-US muda todos os textos
- Idioma persiste após reload
- Strings não traduzidas mostram fallback pt-BR

---

## MEL-08: PWA (Progressive Web App)

### Arquivos
- `frontend/package.json` (adicionar `vite-plugin-pwa`)
- `frontend/vite.config.ts`
- `frontend/public/icons/` (ícones PWA 192x192, 512x512, etc.)

### Configuração
```ts
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Profissional OS',
        short_name: 'ProfOS',
        description: 'Sistema de gestão para profissionais autônomos',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:5000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
});
```

### Teste
- Lighthouse PWA score > 90
- App instalável no Chrome/Edge
- Funciona offline (páginas em cache)
- Service worker registra e atualiza automaticamente
- Manifest válido

---

## ARQ-02: WebSocket para tempo real

### Arquivos
- `backend/requirements.txt` (adicionar `flask-socketio`)
- `backend/app.py`
- `frontend/package.json` (adicionar `socket.io-client`)
- `frontend/src/contexts/SocketContext.tsx` (novo)

### Backend
```python
from flask_socketio import SocketIO, emit, join_room
socketio = SocketIO(app, cors_allowed_origins=Config.CORS_ORIGINS)

@socketio.on('connect')
def on_connect():
    user_id = get_current_user_id(request)
    if user_id:
        join_room(f'user_{user_id}')

@socketio.on('join_conversation')
def on_join(data):
    join_room(f'conversation_{data["conversationId"]}')

def notify_user(user_id, event, data):
    socketio.emit(event, data, room=f'user_{user_id}')

def notify_conversation(conv_id, message):
    socketio.emit('new_message', message, room=f'conversation_{conv_id}')
```

Substituir `app.run()` por `socketio.run(app)`.

### Frontend
```tsx
// src/contexts/SocketContext.tsx
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    transports: ['websocket'],
    auth: { token: localStorage.getItem('profissionalOS_token') },
  });

  useEffect(() => () => { socket.disconnect(); }, [socket]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const socket = useContext(SocketContext);
  if (!socket) throw new Error('useSocket must be used within SocketProvider');
  return socket;
}
```

### Uso em ChatPage
```tsx
const socket = useSocket();
useEffect(() => {
  socket.on('new_message', (msg: Message) => {
    setMessages(prev => [...prev, msg]);
  });
  return () => { socket.off('new_message'); };
}, [socket]);
```

### Uso em NotificationsPage
```tsx
useEffect(() => {
  socket.on('notification', (notif: Notification) => {
    setNotifications(prev => [notif, ...prev]);
    notify('Nova notificação', 'info');
  });
  return () => { socket.off('notification'); };
}, [socket]);
```

### Integrar com serviços backend
- `chat_service.send_message()` → emitir `new_message` via socket
- `notification_service.create()` → emitir `notification` via socket
- `appointment_service.confirm()` → emitir `appointment_update`

### Teste
- Cliente conecta ao WebSocket
- Mensagem enviada aparece em tempo real para ambos os usuários
- Notificação push em tempo real
- Desconexão e reconexão automática
- Room isolation (usuário não recebe mensagens de outros)

---

## Critérios de Aceite
- [ ] i18n configurado com pt-BR e en-US
- [ ] Seletor de idioma no Layout
- [ ] PWA instalável com manifest e service worker
- [ ] Lighthouse PWA score > 90
- [ ] WebSocket conecta e transmite mensagens em tempo real
- [ ] Chat em tempo real sem polling
- [ ] Notificações em tempo real sem polling
- [ ] `tsc --noEmit` sem erros
- [ ] `vite build` sem erros
- [ ] Todos os testes passando
```
