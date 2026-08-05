# Prompt 12 — Melhorias de Frontend

> Execute após `11-correcao-bugs-medios.md`. Endereça MEL-01, MEL-04, MEL-05, MEL-06, BUG-14.

```text
Você é um arquiteto de software sênior. O projeto Profissional OS tem 38 páginas React. Agora você vai melhorar a qualidade do frontend com acessibilidade, performance e UX.

## Contexto
- Frontend: React + TypeScript em `frontend/`
- Stack: Vite, TailwindCSS, React Router 6, Lucide React

---

## MEL-01: Acessibilidade (a11y)

### Arquivos
- Todo o frontend, priorizando: Layout, Modal, LoginPage, RegisterPage, DashboardPage, todas as páginas com formulários

### Correção
1. **Labels e inputs:**
   - Todos os `<label>` devem ter `htmlFor` apontando para o `id` do input
   - Todos os `<input>` devem ter `id` único
   - Exemplo: `<label htmlFor="email">E-mail</label><input id="email" ... />`

2. **Botões de ícone:**
   - Adicionar `aria-label` em todos os botões que só têm ícone
   - Exemplo: `<button aria-label="Fechar"><X /></button>`

3. **Navegação:**
   - Adicionar `aria-current="page"` no NavLink ativo (React Router já faz via `isActive`)
   - Adicionar `role="navigation"` no `<nav>`
   - Adicionar `aria-label="Menu principal"` no nav

4. **Modal:**
   - Adicionar `role="dialog"` e `aria-modal="true"`
   - Adicionar `aria-labelledby` apontando para o título
   - Foco deve ir para o modal ao abrir e voltar ao elemento anterior ao fechar
   - Fechar com tecla Escape

5. **Estados:**
   - Adicionar `aria-live="polite"` no container de toasts
   - Adicionar `aria-busy="true"` em áreas com loading
   - Adicionar `role="alert"` em mensagens de erro

6. **Focus visible:**
   - Adicionar em `index.css`:
   ```css
   *:focus-visible {
     outline: 2px solid #6366f1;
     outline-offset: 2px;
   }
   ```

### Teste
- Navegar apenas com teclado (Tab, Enter, Escape)
- Screen reader lê labels corretamente
- Modal abre/fecha com teclado
- Foco visível em todos os elementos interativos

---

## MEL-04: Lazy loading de páginas

### Arquivo
- `frontend/src/App.tsx`

### Correção
1. Substituir imports estáticos por `React.lazy`:
   ```tsx
   import { lazy, Suspense } from 'react';
   const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
   // repetir para todas as 38 páginas
   ```
2. Envolver `Routes` em `Suspense`:
   ```tsx
   <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" /></div>}>
     <Routes>
       // rotas
     </Routes>
   </Suspense>
   ```
3. Manter `LoginPage` e `RegisterPage` como imports estáticos (páginas iniciais).

### Teste
- Build gera múltiplos chunks (verificar com `vite build`)
- Navegação entre páginas carrega apenas o chunk necessário
- Suspense fallback exibido durante carregamento

---

## MEL-05: Error Boundary

### Arquivo
- `frontend/src/components/ErrorBoundary.tsx` (novo)
- `frontend/src/App.tsx`

### Correção
1. Criar `ErrorBoundary.tsx`:
   ```tsx
   import { Component, type ReactNode } from 'react';

   interface State { hasError: boolean; error?: Error; }

   export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
     state: State = { hasError: false };

     static getDerivedStateFromError(error: Error): State {
       return { hasError: true, error };
     }

     componentDidCatch(error: Error, info: React.ErrorInfo) {
       console.error('ErrorBoundary caught:', error, info);
     }

     render() {
       if (this.state.hasError) {
         return (
           <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
             <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Algo deu errado</h1>
             <p className="text-slate-500">{this.state.error?.message}</p>
             <button onClick={() => window.location.reload()} className="btn-primary">Recarregar página</button>
           </div>
         );
       }
       return this.props.children;
     }
   }
   ```
2. Envolver `App` em `ErrorBoundary`:
   ```tsx
   <ErrorBoundary>
     <BrowserRouter>
       // ...
     </BrowserRouter>
   </ErrorBoundary>
   ```

---

## MEL-06: Debounce em buscas

### Arquivos
- `frontend/src/pages/ClientsPage.tsx`
- `frontend/src/pages/ExplorePage.tsx`
- `frontend/src/pages/CRMPage.tsx`

### Correção
1. Criar hook `useDebounce` em `frontend/src/hooks/useDebounce.ts`:
   ```tsx
   import { useEffect, useState } from 'react';
   export function useDebounce<T>(value: T, delay = 300): T {
     const [debounced, setDebounced] = useState(value);
     useEffect(() => {
       const timer = setTimeout(() => setDebounced(value), delay);
       return () => clearTimeout(timer);
     }, [value, delay]);
     return debounced;
   }
   ```
2. Usar nas páginas com busca:
   ```tsx
   const [search, setSearch] = useState('');
   const debouncedSearch = useDebounce(search, 300);
   useEffect(() => {
     if (debouncedSearch) clientApi.search(debouncedSearch).then(res => setClients(res.clients || []));
     else clientApi.getAll().then(res => setClients(res.clients || []));
   }, [debouncedSearch]);
   ```

---

## BUG-14: Paginação em listagens

### Arquivos
- Backend: `backend/app.py` (todas as rotas GET de listagem)
- Frontend: componentes de listagem

### Correção
1. **Backend:** Adicionar parâmetros `?page=1&limit=20` em todas as rotas GET de listagem:
   ```python
   page = int(request.args.get('page', 1))
   limit = int(request.args.get('limit', 20))
   offset = (page - 1) * limit
   items = Item.query.filter_by(user_id=user_id).offset(offset).limit(limit).all()
   total = Item.query.filter_by(user_id=user_id).count()
   return jsonify({ 'items': [i.to_dict() for i in items], 'total': total, 'page': page, 'limit': limit, 'pages': (total + limit - 1) // limit })
   ```
2. **Frontend:** Criar componente `Pagination`:
   ```tsx
   interface PaginationProps {
     page: number;
     pages: number;
     onPageChange: (page: number) => void;
   }
   ```
3. Usar nas páginas: ClientsPage, OrdersPage, TransactionsPage, etc.

### Teste
- Listagem com 50 itens retorna 20 na página 1
- Navegação entre páginas funciona
- Total e páginas calculados corretamente

---

## Critérios de Aceite
- [ ] Labels associadas com htmlFor/id em todos os formulários
- [ ] aria-label em botões de ícone
- [ ] Modal acessível com role, aria-modal, Escape, focus trap
- [ ] Focus visible em todos os elementos interativos
- [ ] Lazy loading com Suspense em todas as 38 páginas
- [ ] ErrorBoundary envolve a aplicação
- [ ] Debounce de 300ms em campos de busca
- [ ] Paginação no backend e frontend
- [ ] `tsc --noEmit` sem erros
- [ ] `vite build` sem erros
- [ ] Lighthouse a11y score > 80
```
