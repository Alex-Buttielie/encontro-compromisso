# Prompt 11 — Correção de Bugs Médios

> Execute após `10-correcao-bugs-criticos.md`. Corrige BUG-08, BUG-09, BUG-10, BUG-11, BUG-12, BUG-13, BUG-15.

```text
Você é um arquiteto de software sênior. O projeto Profissional OS tem 8 fases backend e 38 páginas frontend. Agora você vai corrigir bugs médios de UX e funcionalidade no frontend.

## Contexto
- Frontend: React + TypeScript em `frontend/`
- 27 páginas novas (Phase 2-8) precisam de melhorias de UX
- TDD é obrigatório

---

## BUG-08: Páginas Phase 2-8 sem estado de loading

### Arquivos
- Todas as 27 páginas novas em `frontend/src/pages/`:
  - WalletPage, PaymentsPage, LoyaltyPage, PackagesPage, GiftCardsPage
  - CRMPage, InventoryPage, MarketingPage, AnalyticsPage
  - EmployeesPage, CommissionsPage, BranchesPage, ContractsPage, QuotesPage
  - ChatPage, SocialPage, NotificationsPage
  - WorkflowsPage, HomeCarePage
  - SubscriptionsPage, ReferralsPage, AIAgentsPage
  - AdminPage, ApiKeysPage, WebhooksPage, LGPDPage, FeatureFlagsPage

### Correção
1. Em cada página, adicionar:
   ```tsx
   const [loading, setLoading] = useState(true);
   ```
2. Na função `load()`:
   ```tsx
   const load = async () => {
     setLoading(true);
     const res = await someApi.getAll();
     setData(res.data || []);
     setLoading(false);
   };
   ```
3. Renderizar spinner/skeleton quando `loading` for true:
   ```tsx
   {loading ? (
     <div className="flex items-center justify-center py-12">
       <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
     </div>
   ) : (
     // conteúdo existente
   )}
   ```

### Teste
- Página exibe spinner durante carregamento
- Página exibe conteúdo após carregamento
- Página exibe empty state quando não há dados

---

## BUG-09: Páginas sem tratamento de erro de conexão

### Arquivos
- Todas as 27 páginas novas

### Correção
1. Adicionar `const [error, setError] = useState<string | null>(null);`
2. Na função `load()`:
   ```tsx
   const load = async () => {
     setLoading(true);
     setError(null);
     const res = await someApi.getAll();
     if (!res.success && res.errors) {
       setError(res.errors.join(', '));
     } else {
       setData(res.data || []);
     }
     setLoading(false);
   };
   ```
3. Renderizar estado de erro:
   ```tsx
   {error && (
     <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300">
       <p>{error}</p>
       <button onClick={load} className="mt-2 text-sm font-medium underline">Tentar novamente</button>
     </div>
   )}
   ```

---

## BUG-10: useEffect sem cleanup ou dependências

### Arquivos
- Todas as 27 páginas novas

### Correção
1. Envolver `load` em `useCallback`:
   ```tsx
   const load = useCallback(async () => {
     // ...
   }, []);
   ```
2. Adicionar `load` na dependency array:
   ```tsx
   useEffect(() => { load(); }, [load]);
   ```
3. Para páginas com chat/mensagens em tempo real, adicionar `AbortController`:
   ```tsx
   useEffect(() => {
     const controller = new AbortController();
     load(controller.signal);
     return () => controller.abort();
   }, [load]);
   ```

---

## BUG-11: ProfilePage não atualiza form quando user muda

### Arquivo
- `frontend/src/pages/ProfilePage.tsx`

### Correção
1. Adicionar `useEffect` para sincronizar form:
   ```tsx
   useEffect(() => {
     if (user) {
       setForm({
         name: user.name || '',
         profession: user.profession || '',
         phone: user.phone || '',
         address: user.address || '',
         bio: user.bio || '',
         link: user.link || '',
       });
     }
   }, [user]);
   ```

---

## BUG-12: Sem confirmação em ações destrutivas

### Arquivos
- `frontend/src/components/Modal.tsx` (adicionar variant de confirmação)
- Páginas com ações destrutivas: ClientsPage (delete), ApiKeysPage (revoke), WebhooksPage (disable), QuotesPage (reject), ContractsPage, SubscriptionsPage (cancel), FeatureFlagsPage (toggle), AdminPage (block/reject), LGPDPage (reject)

### Correção
1. Criar componente `ConfirmDialog` reutilizável:
   ```tsx
   interface ConfirmDialogProps {
     open: boolean;
     title: string;
     message: string;
     confirmLabel?: string;
     cancelLabel?: string;
     onConfirm: () => void;
     onCancel: () => void;
     variant?: 'danger' | 'warning' | 'info';
   }
   ```
2. Usar em todas as ações destrutivas:
   ```tsx
   const [confirm, setConfirm] = useState<{ action: () => void; title: string; message: string } | null>(null);
   // ...
   <ConfirmDialog
     open={!!confirm}
     title={confirm?.title || ''}
     message={confirm?.message || ''}
     variant="danger"
     onConfirm={() => { confirm?.action(); setConfirm(null); }}
     onCancel={() => setConfirm(null)}
   />
   ```

---

## BUG-13: API_BASE_URL hardcoded

### Arquivo
- `frontend/src/services/api.ts:13`

### Correção
1. Substituir:
   ```tsx
   const API_BASE_URL = 'http://localhost:5000';
   ```
   Por:
   ```tsx
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
   ```
2. Criar `frontend/.env.example`:
   ```
   VITE_API_URL=http://localhost:5000
   ```
3. Atualizar `frontend/.env` (se existir) ou documentar no README.

---

## BUG-15: Toast sem botão de fechar

### Arquivo
- `frontend/src/contexts/ToastContext.tsx`

### Correção
1. Adicionar botão X em cada toast:
   ```tsx
   <div key={t.id} className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 shadow-lg dark:bg-slate-800">
     <Icon className={`h-5 w-5 ${color}`} />
     <span className="text-sm text-slate-700 dark:text-slate-200">{t.message}</span>
     <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="ml-2 text-slate-400 hover:text-slate-600">
       <X className="h-4 w-4" />
     </button>
   </div>
   ```
2. Importar `X` de `lucide-react`.

---

## Critérios de Aceite
- [ ] Todas as 27 páginas têm loading state com spinner
- [ ] Todas as 27 páginas tratam erro de conexão com botão "tentar novamente"
- [ ] useEffect com useCallback e dependências corretas
- [ ] ProfilePage sincroniza form quando user muda
- [ ] ConfirmDialog em todas as ações destrutivas
- [ ] API_BASE_URL usa variável de ambiente
- [ ] Toast tem botão de fechar manual
- [ ] `tsc --noEmit` sem erros
- [ ] `vite build` sem erros
```
