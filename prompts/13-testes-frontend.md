# Prompt 13 — Testes Frontend

> Execute após `12-melhorias-frontend.md`. Endereça MEL-02.

```text
Você é um arquiteto de software sênior. O projeto Profissional OS tem 679 testes no backend mas 0 no frontend. Agora você vai configurar e escrever testes para o frontend React + TypeScript.

## Contexto
- Frontend: React + TypeScript em `frontend/`
- Stack: Vite, TailwindCSS, React Router 6, Lucide React
- TDD é obrigatório

---

## Configuração

### 1. Instalar dependências
```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @testing-library/dom jsdom @vitest/coverage-vite
```

### 2. Configurar Vitest
Criar `frontend/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

### 3. Setup de testes
Criar `frontend/src/test/setup.ts`:
```ts
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

### 4. Script no package.json
Adicionar em `scripts`:
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

---

## Testes a Escrever

### A. Testes do API Client (`src/services/api.test.ts`)

Testar:
- `ApiClient.request` faz fetch com URL correta
- `ApiClient.request` envia Authorization header quando token existe
- `ApiClient.request` retorna `{ success: false }` em erro HTTP
- `ApiClient.request` retorna `{ success: false }` em erro de conexão
- `ApiClient.request` envia body como JSON
- `authApi.login` chama `/api/auth/login` com email e password
- `authApi.register` chama `/api/auth/register` com dados corretos
- `authApi.saveSession` salva token no localStorage
- `authApi.logout` remove token do localStorage

### B. Testes do AuthContext (`src/contexts/AuthContext.test.tsx`)

Testar:
- `login` com credenciais válidas → seta user e salva token
- `login` com credenciais inválidas → retorna `{ success: false, errors }`
- `register` com dados válidos → seta user e salva token
- `logout` → limpa user e remove token
- `updateProfile` com dados válidos → atualiza user
- Carregamento inicial: se token existe, busca perfil do usuário
- Carregamento inicial: se token não existe, loading = false

### C. Testes do ToastContext (`src/contexts/ToastContext.test.tsx`)

Testar:
- `notify('mensagem', 'success')` exibe toast com mensagem e ícone de sucesso
- `notify('mensagem', 'error')` exibe toast com mensagem e ícone de erro
- Toast desaparece após 3s (success) ou 5s (error)
- Botão de fechar remove toast manualmente
- Múltiplos toasts são exibidos simultaneamente

### D. Testes do Layout (`src/components/Layout.test.tsx`)

Testar:
- Renderiza logo "Profissional OS"
- Renderiza nome do usuário no sidebar
- Itens de navegação filtrados por role (provider vê mais itens que client)
- Seções agrupadas (Principal, Monetização, Gestão, etc.)
- Botão de dark/light mode alterna classe `dark` no `<html>`
- Botão de logout chama `logout()` e navega para `/login`
- NavLink ativo tem classe `bg-indigo-50`

### E. Testes do LoginPage (`src/pages/LoginPage.test.tsx`)

Testar:
- Renderiza formulário com campos email e senha
- Input de senha tem botão de mostrar/ocultar
- Submit com email vazio → não envia (required)
- Submit com credenciais válidas → chama `login` e redireciona para `/dashboard` (provider)
- Submit com credenciais válidas → chama `login` e redireciona para `/home` (client)
- Submit com credenciais inválidas → exibe toast de erro
- Link "Criar conta" navega para `/register`
- Botão de submit mostra "Entrando..." durante loading

### F. Testes do RegisterPage (`src/pages/RegisterPage.test.tsx`)

Testar:
- Renderiza formulário com nome, email, senha
- Seleção de role (provider/client) com cards visuais
- Campo profissão aparece apenas se role = provider
- Submit válido → chama `register` e redireciona por role
- Submit inválido → exibe toast de erro
- Link "Fazer login" navega para `/login`

### G. Testes do Modal (`src/components/Modal.test.tsx`)

Testar:
- Não renderiza conteúdo quando `open={false}`
- Renderiza título e children quando `open={true}`
- Botão X fecha o modal (chama `onClose`)
- Click no overlay fecha o modal
- Tecla Escape fecha o modal
- Tem `role="dialog"` e `aria-modal="true"`

### H. Testes de uma página representativa (`src/pages/PackagesPage.test.tsx`)

Testar (usando mock do `packageApi`):
- Renderiza título "Pacotes"
- Exibe spinner durante loading
- Exibe "Nenhum pacote cadastrado" quando lista vazia
- Exibe cards de pacotes quando há dados
- Botão "Novo Pacote" abre modal
- Submit do formulário chama `packageApi.create`
- Botão "Usar Sessão" chama `packageApi.redeem`
- Erro de API exibe mensagem com botão "tentar novamente"

### I. Teste do hook useDebounce (`src/hooks/useDebounce.test.ts`)

Testar:
- Valor inicial retornado imediatamente
- Valor atualiza após delay
- Múltiplas mudanças rápidas → apenas último valor

---

## Mocks

Criar `frontend/src/test/mocks.ts`:
```ts
export const mockUser = {
  id: 1, name: 'João Teste', email: 'teste@profissional-os.com',
  role: 'provider', profession: 'Barbeiro', isProvider: true, isClient: false,
};

export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};
```

Usar `vi.mock('../services/api')` para mockar módulo inteiro quando necessário.

---

## Critérios de Aceite
- [ ] Vitest configurado e rodando
- [ ] Coverage > 60% em: AuthContext, ToastContext, Layout, LoginPage, RegisterPage, Modal
- [ ] Coverage > 40% em: api.ts, uma página representativa
- [ ] Todos os testes passando: `npm test`
- [ ] Sem warnings ou erros nos testes
- [ ] CI-ready: `npm run test:coverage` gera relatório
```
