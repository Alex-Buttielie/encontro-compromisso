# Prompt 10 — Correção de Bugs Críticos

> Execute após `09-mapeamento-bugs-melhorias.md`. Corrige BUG-01, BUG-02, BUG-06, BUG-07.

```text
Você é um arquiteto de software sênior. O projeto Profissional OS tem 8 fases backend e 38 páginas frontend implementadas. Agora você vai corrigir bugs críticos de segurança e funcionalidade.

## Contexto
- Backend: Python Flask em `backend/`
- Frontend: React + TypeScript em `frontend/`
- TDD é obrigatório: escreva testes primeiro, depois corrija

---

## BUG-01: Login não redireciona por role

### Arquivos
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`

### Problema
Após login ou cadastro, o usuário é sempre redirecionado para `/dashboard`, mesmo se for `client` (deveria ir para `/home`).

### Correção
1. Em `LoginPage.tsx` e `RegisterPage.tsx`, após `res.success`:
   - Verificar `res.user.role`
   - Se `provider` → `navigate('/dashboard')`
   - Se `client` → `navigate('/home')`
2. O `AuthContext.login()` e `AuthContext.register()` já retornam `res.user`, usar esse dado.

### Teste
- Login como provider → redireciona para `/dashboard`
- Login como client → redireciona para `/home`
- Register como provider → redireciona para `/dashboard`
- Register como client → redireciona para `/home`

---

## BUG-02: Auth usa userId como token (sem JWT)

### Arquivos
- `backend/requirements.txt` (adicionar `PyJWT`)
- `backend/services/auth_service.py`
- `backend/app.py` (função `get_current_user_id`)
- `frontend/src/services/api.ts`
- `frontend/src/contexts/AuthContext.tsx`

### Problema
A autenticação envia `userId` em texto plano no header `Authorization: Bearer <user_id>`. Qualquer pessoa pode forjar um ID e acessar dados de outro usuário.

### Correção
1. **Backend:**
   - Adicionar `PyJWT` ao `requirements.txt`
   - Em `auth_service.py`, após login bem-sucedido, gerar JWT:
     ```python
     import jwt
     token = jwt.encode({'user_id': user.id, 'role': user.role, 'exp': datetime.utcnow() + timedelta(hours=24)}, Config.SECRET_KEY, algorithm='HS256')
     ```
   - Retornar `{'success': True, 'user': user.to_dict(), 'token': token}`
   - Em `app.py`, substituir `get_current_user_id` para decodificar JWT:
     ```python
     def get_current_user_id(request):
         auth = request.headers.get('Authorization')
         if auth and auth.startswith('Bearer '):
             try:
                 payload = jwt.decode(auth.split(' ')[1], Config.SECRET_KEY, algorithms=['HS256'])
                 return payload['user_id']
             except (jwt.InvalidTokenError, KeyError):
                 return None
         return None
     ```
   - Manter compatibilidade: se o token for um número (legacy), aceitar temporariamente.

2. **Frontend:**
   - Em `api.ts`, `saveSession` deve salvar o token JWT (não o userId)
   - `AuthContext` deve armazenar e enviar o token JWT
   - Atualizar `localStorage` key de `profissionalOS_userId` para `profissionalOS_token`

### Testes
- Login retorna token JWT válido
- Request com token válido → autenticado
- Request com token inválido → 401
- Request sem token → 401
- Token expirado → 401
- Compatibilidade: token numérico antigo ainda funciona (deprecation)

---

## BUG-06: SECRET_KEY com valor padrão em produção

### Arquivo
- `backend/config.py`

### Problema
`SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')`. Se a env var não estiver setada, usa valor hardcoded, comprometendo toda a segurança.

### Correção
1. Em `Config.__init__` ou após classe:
   ```python
   if not os.environ.get('SECRET_KEY') and Config.DEBUG:
       # Apenas em desenvolvimento, usar valor padrão
       pass
   elif not os.environ.get('SECRET_KEY'):
       raise RuntimeError('SECRET_KEY deve ser definida em variável de ambiente em produção')
   ```
2. Criar/atualizar `.env.example` com `SECRET_KEY=gerar-chave-aleatoria-aqui`

### Teste
- Sem SECRET_KEY + DEBUG=True → usa default (dev)
- Sem SECRET_KEY + DEBUG=False → RuntimeError
- Com SECRET_KEY → usa valor da env

---

## BUG-07: Sem validação de content-type nos uploads

### Arquivos
- `backend/app.py` (todos os endpoints que recebem arquivos)
- `backend/services/` (services que processam uploads)

### Problema
Não há validação de MIME type, extensão ou tamanho em uploads de fotos, vídeos, documentos.

### Correção
1. Criar `backend/utils/upload_validation.py`:
   ```python
   ALLOWED_MIME_TYPES = {
       'image': ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
       'video': ['video/mp4', 'video/webm'],
       'document': ['application/pdf', 'image/jpeg', 'image/png'],
   }
   MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

   def validate_upload(file_storage, category='image'):
       if not file_storage:
           raise ValidationError('Arquivo não fornecido')
       if file_storage.content_length > MAX_FILE_SIZE:
           raise ValidationError('Arquivo excede 10MB')
       allowed = ALLOWED_MIME_TYPES.get(category, [])
       if file_storage.mimetype not in allowed:
           raise ValidationError(f'Tipo não permitido: {file_storage.mimetype}')
       return True
   ```
2. Aplicar em todos os endpoints de upload (photos, videos, documents).

### Testes
- Upload de imagem JPEG válida → sucesso
- Upload de arquivo .exe → rejeitado
- Upload de arquivo > 10MB → rejeitado
- Upload sem arquivo → erro

---

## Critérios de Aceite
- [ ] Login redireciona corretamente por role
- [ ] JWT implementado e validado no backend
- [ ] Frontend armazena e envia token JWT
- [ ] SECRET_KEY obrigatória em produção
- [ ] Uploads validam MIME type e tamanho
- [ ] Todos os testes passando (existentes + novos)
- [ ] `python -m pytest tests/ -q` sem falhas
- [ ] `tsc --noEmit` sem erros
- [ ] `vite build` sem erros
```
