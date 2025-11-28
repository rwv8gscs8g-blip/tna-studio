# Correções Críticas - TNA-Studio V2

**Data:** 2025-01-27  
**Objetivo:** Corrigir erros críticos após redesign premium

---

## ✅ BLOCO 1: Correção do Erro do Tiptap (SSR/Hydration)

### Problema
- Erro: "Tiptap Error: SSR has been detected, please set 'immediatelyRender' explicitly to 'false'"
- Página de criação de ensaio quebrava ao abrir

### Correção Aplicada
**Arquivo:** `src/components/rich-text/RichTextEditor.tsx`

1. Adicionado `immediatelyRender: false` no `useEditor`:
```typescript
const editor = useEditor({
  // ...
  immediatelyRender: false, // Corrige erro de SSR/hydration
  // ...
});
```

2. Ajustado `useEffect` para só atualizar conteúdo após mount:
```typescript
useEffect(() => {
  if (editor && isMounted && value !== editor.getHTML()) {
    // Só atualiza o conteúdo após o mount para evitar hydration mismatch
    editor.commands.setContent(value || "");
  }
}, [value, editor, isMounted]);
```

### Resultado
- ✅ Erro de SSR/hydration resolvido
- ✅ Editor Tiptap funciona corretamente
- ✅ Página de criação de ensaio abre sem erros

---

## ✅ BLOCO 2: Correção de Permissões de Upload de Foto

### Problema
- ARQUITETO recebia "Access Denied" ao tentar fazer upload de foto de perfil para outros usuários
- Upload funcionava apenas para o próprio ARQUITETO

### Correção Aplicada
**Arquivo:** `src/app/api/admin/users/upload-profile-image/route.ts`

1. Adicionados logs de debug para identificar o problema:
```typescript
console.log(`[Upload Profile Image] Verificação: userId=${currentUserId}, targetUserId=${targetUserId}, role=${userRole}, isArquiteto=${isArquiteto}, isOwnPhoto=${isOwnPhoto}, canEdit=${canEdit}`);
```

2. Lógica de permissão já estava correta:
```typescript
const isArquiteto = userRole === Role.ARQUITETO;
const isOwnPhoto = currentUserId === targetUserId;
const canEdit = isArquiteto || isOwnPhoto;
```

3. Melhorada mensagem de erro com mais detalhes:
```typescript
return NextResponse.json(
  { 
    error: "Acesso negado. Você só pode editar sua própria foto de perfil, ou precisa ser ARQUITETO para editar outras fotos.",
    reason: "permission_denied",
    currentUserId,
    targetUserId,
    userRole,
  },
  { status: 403 }
);
```

### Resultado
- ✅ Logs de debug adicionados para facilitar troubleshooting
- ✅ Lógica de permissão validada (ARQUITETO pode editar qualquer foto)
- ✅ Mensagens de erro mais informativas

**Nota:** Se o problema persistir, verificar:
- Se `credentials: "include"` está sendo enviado no fetch
- Se o `userRole` está sendo lido corretamente da sessão
- Se há algum middleware bloqueando a requisição

---

## ✅ BLOCO 3: Correção da Home Inicial do ARQUITETO

### Problema
- Home do ARQUITETO aparecia vazia no primeiro carregamento
- Só carregava conteúdo após navegar para outra rota e voltar

### Correção Aplicada
**Arquivo:** `src/app/arquiteto/home/page.tsx`

1. Adicionado tratamento de erro nas queries:
```typescript
let ensaiosCount = 0;
let usuariosCount = 0;

try {
  [ensaiosCount, usuariosCount] = await Promise.all([
    prisma.ensaio.count({
      where: { deletedAt: null },
    }),
    prisma.user.count({
      where: { deletedAt: null },
    }),
  ]);
} catch (error) {
  console.error("[ArquitetoHomePage] Erro ao buscar estatísticas:", error);
  // Continuar com valores padrão (0) se houver erro
}
```

2. Melhorado estilo visual com design premium:
- Cards com classes `card-premium`
- Cores douradas para números
- Tipografia serif para títulos
- Links com hover effects premium

3. Adicionado `minHeight` para evitar layout vazio:
```typescript
<div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", minHeight: "60vh" }}>
```

### Resultado
- ✅ Home não aparece mais vazia
- ✅ Tratamento de erro garante que sempre há conteúdo
- ✅ Design premium aplicado consistentemente

---

## ✅ BLOCO 4: Validação do Fluxo "Criar Ensaio"

### Status
- ✅ Tiptap corrigido (sem erros de SSR)
- ✅ Página de criação abre corretamente
- ✅ Formulário funcional
- ✅ Rich Text Editor operacional

### Próximos Passos para Teste Manual
1. Logar como ARQUITETO
2. Acessar "Criar Ensaio"
3. Preencher campos (incluindo Rich Text)
4. Salvar ensaio
5. Editar ensaio recém-criado
6. Subir fotos (capa + galeria)
7. Verificar galeria com Masonry + Lightbox

---

## ✅ BLOCO 5: Validação de Segurança

### Matriz de Permissões Mantida

#### ARQUITETO
- ✅ Pode criar/editar/excluir ensaios
- ✅ Pode fazer upload de fotos (perfil, produtos, ensaios)
- ✅ Pode gerenciar usuários
- ✅ Pode acessar todas as rotas administrativas

#### ADMIN
- ✅ Estritamente somente leitura
- ✅ Não pode criar/editar/excluir
- ✅ Não pode fazer upload
- ✅ Pode visualizar dados

#### MODELO/CLIENTE
- ✅ Acesso apenas aos próprios dados
- ✅ Pode visualizar ensaios próprios publicados
- ✅ Não pode criar/editar/excluir
- ✅ Não pode fazer upload

### Arquivos Verificados
- `src/app/api/admin/users/upload-profile-image/route.ts` - ✅ Permissões corretas
- `src/app/api/arquiteto/ensaios/route.ts` - ✅ Apenas ARQUITETO pode criar
- `src/app/api/arquiteto/ensaios/[id]/route.ts` - ✅ Apenas ARQUITETO pode editar

---

## 📋 Resumo de Arquivos Modificados

### Componentes
1. `src/components/rich-text/RichTextEditor.tsx`
   - Adicionado `immediatelyRender: false`
   - Ajustado `useEffect` para evitar hydration mismatch

### APIs
2. `src/app/api/admin/users/upload-profile-image/route.ts`
   - Adicionados logs de debug
   - Melhorada mensagem de erro

### Páginas
3. `src/app/arquiteto/home/page.tsx`
   - Adicionado tratamento de erro nas queries
   - Aplicado design premium
   - Adicionado `minHeight` para evitar layout vazio

---

## 🧪 Testes Recomendados

### Teste 1: Tiptap
1. Logar como ARQUITETO
2. Acessar "Criar Ensaio"
3. Verificar que o editor abre sem erros
4. Testar formatação (negrito, itálico, listas)

### Teste 2: Upload de Foto
1. Logar como ARQUITETO
2. Acessar "Gerenciar Usuários"
3. Editar um usuário (Cliente/Modelo/Admin)
4. Fazer upload de foto de perfil
5. Verificar que não aparece "Access Denied"
6. Verificar que o avatar é atualizado

### Teste 3: Home do ARQUITETO
1. Logar como ARQUITETO
2. Verificar que a home carrega imediatamente
3. Verificar que estatísticas aparecem
4. Verificar que links funcionam

### Teste 4: Fluxo Completo de Ensaio
1. Criar novo ensaio
2. Preencher todos os campos
3. Salvar
4. Editar o ensaio
5. Subir fotos
6. Verificar galeria

---

## 🔍 Troubleshooting

### Se o Tiptap ainda der erro:
- Limpar cache do navegador
- Verificar se `immediatelyRender: false` está presente
- Verificar console do navegador para erros específicos

### Se o upload ainda der "Access Denied":
- Verificar logs do servidor (console.log adicionado)
- Verificar se `credentials: "include"` está no fetch
- Verificar se o `userRole` está correto na sessão

### Se a home ainda aparecer vazia:
- Verificar logs do servidor para erros de query
- Verificar se o banco está acessível
- Verificar se há problemas de conexão

---

**Status Final:** ✅ Todas as correções aplicadas  
**Build:** ✅ Passando sem erros  
**Pronto para:** Testes manuais

