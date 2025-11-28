# Plano de Testes Críticos - TNA-Studio V2

**Data:** 2025-01-27  
**Objetivo:** Validar correções críticas em fluxos essenciais (Upload, Senha, Acesso de Modelo)

---

## 🔐 Matriz de Segurança (Imutável)

- **ARQUITETO:** Superusuário. ÚNICO com permissão de escrita e upload.
- **ADMIN:** Somente Leitura. PROIBIDO de criar, editar, excluir ou fazer upload.
- **MODELO/CLIENTE:** Somente Leitura (apenas dados próprios).

---

## ✅ BLOCO 1: Testes de Upload (ARQUITETO)

### 1.1 Upload de Foto de Perfil

**Teste:** ARQUITETO altera própria foto de perfil

**Passos:**
1. Login como `arquiteto@tna.studio` / `Arquiteto@2025!`
2. Acessar `/admin/users`
3. Clicar em "Editar" no próprio usuário
4. Selecionar nova foto (JPG, PNG ou WebP, até 40MB)
5. Clicar em "Salvar Alterações"

**Resultado Esperado:**
- ✅ Upload bem-sucedido
- ✅ Foto aparece atualizada na lista de usuários
- ✅ `storageKey` salvo no banco de dados
- ✅ URL assinada gerada corretamente

---

**Teste:** ARQUITETO altera foto de perfil de outro usuário

**Passos:**
1. Login como `arquiteto@tna.studio`
2. Acessar `/admin/users`
3. Clicar em "Editar" em outro usuário (ex: MODELO)
4. Selecionar nova foto
5. Clicar em "Salvar Alterações"

**Resultado Esperado:**
- ✅ Upload bem-sucedido
- ✅ Foto aparece atualizada na lista
- ✅ `storageKey` salvo no banco

---

### 1.2 Upload de Capa e Fotos de Produto

**Teste:** ARQUITETO cria produto com capa e fotos

**Passos:**
1. Login como `arquiteto@tna.studio`
2. Acessar `/arquiteto/produtos`
3. Clicar em "Novo Produto"
4. Preencher dados do produto
5. Fazer upload de capa (até 40MB)
6. Salvar produto
7. Editar produto e adicionar até 3 fotos (até 40MB cada)

**Resultado Esperado:**
- ✅ Upload de capa bem-sucedido
- ✅ Upload de fotos bem-sucedido (máximo 3)
- ✅ `storageKey` salvo no banco para cada foto
- ✅ Fotos aparecem na listagem do produto
- ✅ URLs assinadas geradas corretamente

---

### 1.3 Upload de Álbum de Ensaio

**Teste:** ARQUITETO faz upload de 30 fotos de ensaio (~40MB total)

**Passos:**
1. Login como `arquiteto@tna.studio`
2. Acessar `/arquiteto/ensaios`
3. Criar novo ensaio ou editar existente
4. Na seção "Fotos do Ensaio", fazer upload de múltiplas fotos
5. Verificar contador "X/30"
6. Fazer upload até atingir 30 fotos (ou próximo disso)

**Resultado Esperado:**
- ✅ Upload de múltiplas fotos bem-sucedido
- ✅ Contador atualiza corretamente (ex: "15/30")
- ✅ Validação impede upload além de 30 fotos
- ✅ Cada foto tem `storageKey` salvo no banco
- ✅ Fotos aparecem na galeria do ensaio
- ✅ URLs assinadas geradas corretamente (expiração 60-120s)

---

### 1.4 Upload de Termo PDF

**Teste:** ARQUITETO faz upload de termo PDF (até 40MB)

**Passos:**
1. Login como `arquiteto@tna.studio`
2. Acessar `/arquiteto/ensaios/[id]/edit`
3. Na seção "Termo de Autorização", fazer upload de PDF
4. Salvar ensaio

**Resultado Esperado:**
- ✅ Upload de PDF bem-sucedido
- ✅ `termPdfKey` salvo no banco
- ✅ PDF aparece na visualização do ensaio
- ✅ URL assinada gerada corretamente

---

## ❌ BLOCO 2: Testes de Bloqueio (ADMIN)

### 2.1 Tentativa de Upload (ADMIN)

**Teste:** ADMIN tenta fazer upload de foto de perfil

**Passos:**
1. Login como `admin@tna.studio` / `Admin@2025!`
2. Acessar `/admin/users`
3. Tentar editar um usuário
4. Tentar fazer upload de foto

**Resultado Esperado:**
- ❌ Botão de upload não aparece OU está desabilitado
- ❌ Se tentar via API, retorna 403 "Acesso negado"
- ❌ Mensagem clara: "ADMIN é somente leitura"

---

**Teste:** ADMIN tenta criar produto

**Passos:**
1. Login como `admin@tna.studio`
2. Tentar acessar `/arquiteto/produtos` (se possível)
3. Tentar criar produto via API (se tiver acesso)

**Resultado Esperado:**
- ❌ Página redireciona OU não mostra botão "Novo Produto"
- ❌ Se tentar via API, retorna 403 "Acesso negado"

---

**Teste:** ADMIN tenta criar ensaio

**Passos:**
1. Login como `admin@tna.studio`
2. Tentar acessar `/arquiteto/ensaios` (se possível)
3. Tentar criar ensaio via API (se tiver acesso)

**Resultado Esperado:**
- ❌ Página redireciona OU não mostra botão "Criar Ensaio"
- ❌ Se tentar via API, retorna 403 "Acesso negado"

---

## ✅ BLOCO 3: Testes de Acesso (MODELO)

### 3.1 Acesso a Ensaio Próprio Publicado

**Teste:** MODELO acessa seu próprio ensaio publicado

**Passos:**
1. Login como `modelo@tna.studio` / `Modelo@2025!`
2. Acessar `/modelo/ensaios`
3. Clicar em um ensaio publicado associado ao CPF da MODELO
4. Verificar visualização completa

**Resultado Esperado:**
- ✅ Ensaio aparece na listagem
- ✅ Página de detalhes carrega corretamente
- ✅ Foto de capa aparece (via URL assinada)
- ✅ Termo PDF aparece (via URL assinada)
- ✅ Fotos do ensaio aparecem (via URLs assinadas)
- ✅ Link para Sync.com aparece (via página protegida)

---

### 3.2 Tentativa de Acesso a Ensaio Não Publicado

**Teste:** MODELO tenta acessar ensaio não publicado

**Passos:**
1. Login como `modelo@tna.studio`
2. Tentar acessar diretamente `/modelo/ensaios/[id]` de um ensaio não publicado
3. Verificar comportamento

**Resultado Esperado:**
- ❌ Redireciona para `/modelo/ensaios`
- ❌ Mensagem de erro OU ensaio não aparece na listagem

---

### 3.3 Tentativa de Acesso a Ensaio de Outro Usuário

**Teste:** MODELO tenta acessar ensaio de outra MODELO

**Passos:**
1. Login como `modelo@tna.studio`
2. Tentar acessar diretamente `/modelo/ensaios/[id]` de um ensaio com `subjectCpf` diferente
3. Verificar comportamento

**Resultado Esperado:**
- ❌ Redireciona para `/modelo/ensaios`
- ❌ Mensagem de erro OU ensaio não aparece na listagem

---

## 🔑 BLOCO 4: Testes de Mudança de Senha

### 4.1 ARQUITETO altera própria senha

**Teste:** ARQUITETO altera sua própria senha

**Passos:**
1. Login como `arquiteto@tna.studio` / `Arquiteto@2025!`
2. Acessar rota de alteração de senha (se houver UI) OU chamar API diretamente
3. Enviar nova senha válida (mínimo 8 caracteres, maiúscula, minúscula, número, símbolo)
4. Fazer logout e login com nova senha

**Resultado Esperado:**
- ✅ Senha alterada com sucesso
- ✅ Login com nova senha funciona
- ✅ Login com senha antiga falha

**API:**
```bash
PATCH /api/profile/update-password
{
  "newPassword": "NovaSenha@2025!"
}
```

---

### 4.2 ARQUITETO altera senha de outro usuário

**Teste:** ARQUITETO altera senha de outro usuário

**Passos:**
1. Login como `arquiteto@tna.studio`
2. Chamar API de alteração de senha com `targetUserId`
3. Verificar se senha foi alterada

**Resultado Esperado:**
- ✅ Senha do usuário alvo alterada com sucesso
- ✅ Usuário alvo consegue fazer login com nova senha

**API:**
```bash
PATCH /api/profile/update-password
{
  "newPassword": "NovaSenha@2025!",
  "targetUserId": "id-do-usuario-alvo"
}
```

---

### 4.3 ADMIN tenta alterar senha

**Teste:** ADMIN tenta alterar senha (própria ou de outro)

**Passos:**
1. Login como `admin@tna.studio`
2. Tentar chamar API de alteração de senha

**Resultado Esperado:**
- ❌ Retorna 403 "ADMIN não pode alterar senhas"
- ❌ Senha não é alterada

**API:**
```bash
PATCH /api/profile/update-password
{
  "newPassword": "NovaSenha@2025!"
}
```

---

### 4.4 MODELO altera própria senha

**Teste:** MODELO altera sua própria senha

**Passos:**
1. Login como `modelo@tna.studio`
2. Chamar API de alteração de senha (sem `targetUserId`)
3. Verificar se senha foi alterada

**Resultado Esperado:**
- ✅ Senha alterada com sucesso (se houver UI para isso)
- ✅ Login com nova senha funciona

---

## 🔒 BLOCO 5: Testes de Storage e URLs Assinadas

### 5.1 Verificação de storageKey

**Teste:** Verificar se `storageKey` está sendo persistido

**Passos:**
1. Fazer upload de foto de perfil
2. Verificar no banco de dados se `profileImage` contém `storageKey`
3. Fazer upload de foto de produto
4. Verificar no banco se `ProdutoPhoto.storageKey` foi salvo
5. Fazer upload de foto de ensaio
6. Verificar no banco se `EnsaioPhoto.storageKey` foi salvo

**Resultado Esperado:**
- ✅ Todos os `storageKey` salvos corretamente no banco
- ✅ Formato: `tipo-id/timestamp.extensao` (ex: `ensaio-123/photo-1234567890.jpg`)

---

### 5.2 Geração de URLs Assinadas

**Teste:** Verificar geração de URLs assinadas

**Passos:**
1. Acessar ensaio como MODELO
2. Verificar se fotos aparecem (via URLs assinadas)
3. Aguardar 2 minutos
4. Tentar acessar foto novamente

**Resultado Esperado:**
- ✅ URLs assinadas geradas corretamente
- ✅ URLs expiram após 60-120 segundos
- ✅ Após expiração, nova URL é gerada automaticamente

---

### 5.3 Segurança de Credenciais

**Teste:** Verificar se credenciais não vazam

**Passos:**
1. Inspecionar código fonte da página (View Source)
2. Inspecionar Network tab no DevTools
3. Verificar se `R2_ACCESS_KEY_ID` ou `R2_SECRET_ACCESS_KEY` aparecem

**Resultado Esperado:**
- ✅ Credenciais NUNCA aparecem no código cliente
- ✅ Apenas URLs assinadas temporárias são enviadas ao cliente
- ✅ `storageKey` nunca é exposto diretamente

---

## 📋 Checklist de Validação Final

### Uploads
- [ ] ARQUITETO consegue fazer upload de foto de perfil (própria e de outros)
- [ ] ARQUITETO consegue fazer upload de capa e fotos de produto
- [ ] ARQUITETO consegue fazer upload de álbum de ensaio (30 fotos, ~40MB)
- [ ] ARQUITETO consegue fazer upload de termo PDF
- [ ] ADMIN não consegue fazer upload (403)
- [ ] Limites de 40MB funcionam corretamente

### Acesso
- [ ] MODELO consegue acessar ensaio próprio publicado
- [ ] MODELO não consegue acessar ensaio não publicado
- [ ] MODELO não consegue acessar ensaio de outro usuário
- [ ] URLs assinadas funcionam corretamente
- [ ] URLs assinadas expiram após 60-120s

### Senha
- [ ] ARQUITETO consegue alterar própria senha
- [ ] ARQUITETO consegue alterar senha de outro usuário
- [ ] ADMIN não consegue alterar senha (403)
- [ ] MODELO consegue alterar própria senha (se houver UI)

### Storage
- [ ] `storageKey` está sendo persistido corretamente
- [ ] Credenciais não vazam para o cliente
- [ ] URLs assinadas são geradas corretamente

---

## 🐛 Troubleshooting

### Upload falha com "Access Denied"
- Verificar se usuário é ARQUITETO
- Verificar se sessão está válida
- Verificar logs do servidor

### MODELO não consegue ver ensaio
- Verificar se `subjectCpf` do ensaio corresponde ao CPF da MODELO
- Verificar se `status` do ensaio é `PUBLISHED`
- Verificar se `deletedAt` é `null`

### Senha não altera
- Verificar se senha atende requisitos (8+ chars, maiúscula, minúscula, número, símbolo)
- Verificar se usuário tem permissão (ARQUITETO ou próprio usuário)
- Verificar logs do servidor

### URLs assinadas não funcionam
- Verificar se R2 está configurado (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`)
- Verificar se `storageKey` existe no banco
- Verificar logs do servidor

---

**Data de Execução:** _______________  
**Executado por:** _______________  
**Resultado:** _______________

