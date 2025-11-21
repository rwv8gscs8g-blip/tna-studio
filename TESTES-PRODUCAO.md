# TNA Studio - Guia de Testes em Produção

> **IMPORTANTE:** Este documento contém credenciais de teste. Mantenha confidencial.

## 🌐 Ambiente de Produção

### URL Base
```
https://tna-studio.vercel.app
```

### Links Principais

| Página | URL | Requer Autenticação |
|--------|-----|---------------------|
| Home | https://tna-studio.vercel.app/ | Não (redireciona se logado) |
| Login | https://tna-studio.vercel.app/signin | Não |
| Perfil | https://tna-studio.vercel.app/profile | Sim |
| Galerias | https://tna-studio.vercel.app/galleries | Sim |
| Nova Galeria | https://tna-studio.vercel.app/galleries/new | Sim |
| Admin - Usuários | https://tna-studio.vercel.app/admin/users | Sim (Admin) |
| Admin - Relatórios | https://tna-studio.vercel.app/admin/reports | Sim (Admin) |

## 👥 Usuários de Teste

### Administrador
- **Email:** `admin@tna.studio`
- **Senha:** `Admin@2025!`
- **Role:** ADMIN
- **Acesso:** Total (todas as funcionalidades)

### Modelo
- **Email:** `model1@tna.studio`
- **Senha:** `Model1@2025!`
- **Role:** MODEL
- **Acesso:** Perfil, galerias próprias, upload de fotos

### Cliente
- **Email:** `client1@tna.studio`
- **Senha:** `Client1@2025!`
- **Role:** CLIENT
- **Acesso:** Visualização de galerias compartilhadas

## 🧪 Checklist de Testes Funcionais

### 1. Autenticação

#### Login
- [ ] Login com Admin funciona
- [ ] Login com Modelo funciona
- [ ] Login com Cliente funciona
- [ ] Login com credenciais inválidas retorna erro
- [ ] Redirecionamento após login funciona

#### Sessão
- [ ] Sessão expira em 5 minutos
- [ ] SessionTimer mostra tempo restante
- [ ] Logout limpa cookies
- [ ] Acesso negado após logout

### 2. Navegação

#### Rotas Públicas
- [ ] `/signin` acessível sem autenticação
- [ ] `/` redireciona para `/signin` se não autenticado

#### Rotas Protegidas
- [ ] `/profile` requer autenticação
- [ ] `/galleries` requer autenticação
- [ ] `/admin/*` requer autenticação e role ADMIN
- [ ] Redirecionamento para login funciona

### 3. Funcionalidades por Role

#### Admin
- [ ] Acessa `/admin/users`
- [ ] Acessa `/admin/reports`
- [ ] Vê todas as galerias
- [ ] Pode criar usuários

#### Modelo
- [ ] Acessa `/profile`
- [ ] Acessa `/galleries`
- [ ] Cria nova galeria
- [ ] Faz upload de fotos
- [ ] NÃO acessa `/admin/*`

#### Cliente
- [ ] Acessa `/profile`
- [ ] Acessa `/galleries` (apenas compartilhadas)
- [ ] NÃO cria galerias
- [ ] NÃO acessa `/admin/*`

### 4. Upload de Mídia

#### Validações
- [ ] Upload de arquivo < 10 MB funciona
- [ ] Upload de arquivo > 10 MB retorna erro
- [ ] Upload de imagem (jpeg, png, webp, gif) funciona
- [ ] Upload de arquivo não-imagem retorna erro
- [ ] Rate limiting funciona (11 uploads/min = erro)

#### Visualização
- [ ] Thumbnails carregam corretamente
- [ ] URLs assinadas geradas (R2 em produção)
- [ ] Fotos aparecem no grid da galeria

### 5. Segurança

#### Middleware
- [ ] Acesso sem cookie redireciona para login
- [ ] Headers de segurança presentes
- [ ] Cookies limpos em logout

#### Validação de Token
- [ ] Token expirado bloqueia acesso
- [ ] Token inválido bloqueia acesso
- [ ] Build timestamp invalida tokens antigos

## 🔍 Testes de Segurança

### Teste 1: Acesso sem Autenticação
```bash
# Tente acessar rota protegida sem login
curl -I https://tna-studio.vercel.app/galleries
# Esperado: 307 Redirect para /signin
```

### Teste 2: Cookie Inválido
```bash
# Tente acessar com cookie falsificado
curl -H "Cookie: next-auth.session-token=invalid" \
     https://tna-studio.vercel.app/galleries
# Esperado: 401 Unauthorized (validação na rota)
```

### Teste 3: Rate Limiting
```bash
# Faça 11 uploads em 1 minuto
# Esperado: 11º upload retorna 429 Too Many Requests
```

### Teste 4: Validação de Tamanho
```bash
# Tente upload de arquivo > 10 MB
# Esperado: 400 Bad Request com mensagem de erro
```

## 📊 Monitoramento

### Logs na Vercel

Acesse: **Vercel Dashboard → tna-studio → Logs**

**Logs importantes:**
- `[Auth] Novo token criado` - Login bem-sucedido
- `[Auth] Token REJEITADO` - Tentativa de acesso inválido
- `[Upload] Sucesso:` - Upload bem-sucedido
- `[Upload] Rate limit excedido` - Tentativa de abuso
- `[R2] URL assinada gerada` - URLs assinadas criadas

### Métricas

- **Edge Requests:** Número de requisições ao middleware
- **Function Invocations:** Número de chamadas às APIs
- **Function Duration:** Tempo de execução das funções

## 🚨 Problemas Conhecidos

### Se login não funcionar:
1. Verifique se `NEXTAUTH_SECRET` está configurado
2. Verifique se `NEXTAUTH_URL` está correto
3. Limpe cookies do navegador
4. Verifique logs na Vercel

### Se upload não funcionar:
1. Verifique se variáveis R2_* estão configuradas
2. Verifique logs na Vercel
3. Teste com arquivo pequeno (< 1 MB)

### Se thumbnails não carregarem:
1. Verifique se R2 está configurado
2. Verifique logs de geração de URLs assinadas
3. Teste acesso direto à URL assinada

## ✅ Status de Validação

- [ ] Testes funcionais completos
- [ ] Testes de segurança completos
- [ ] Logs verificados
- [ ] Performance validada
- [ ] Pronto para evolução do MVP

---

**Última atualização:** 2025-11-20
**Ambiente:** Produção (Vercel)
**Versão:** 0.1.0

