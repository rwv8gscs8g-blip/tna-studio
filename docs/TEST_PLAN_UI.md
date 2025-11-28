# Plano de Testes de UI - TNA-Studio V2 Premium

**Data:** 2025-01-27  
**Objetivo:** Validar o redesign premium, responsividade e funcionalidades visuais

---

## 🎨 BLOCO 1: Validação Visual do Design Premium

### 1.1 Paleta de Cores

**Teste:** Verificar se as cores premium estão aplicadas corretamente

**Passos:**
1. Acessar qualquer página do sistema
2. Verificar fundo (Cream #FAF7F2)
3. Verificar botões primários (Gold #C29B43)
4. Verificar textos (Black com opacidade 80%)
5. Verificar títulos (Black #1B1B1B)

**Resultado Esperado:**
- ✅ Fundo em tom cream/ivory suave
- ✅ Botões em dourado premium
- ✅ Textos legíveis com contraste adequado
- ✅ Títulos em serif elegante

---

### 1.2 Tipografia Editorial

**Teste:** Verificar fontes serif e sans-serif

**Passos:**
1. Verificar títulos (H1, H2, H3)
2. Verificar textos do corpo
3. Verificar espaçamento entre linhas

**Resultado Esperado:**
- ✅ Títulos em Playfair Display (ou serif elegante)
- ✅ Corpo em Inter (ou sans-serif premium)
- ✅ Tracking levemente aberto nos títulos
- ✅ Line-height confortável (1.6) no corpo

---

### 1.3 Espaçamento Minimalista

**Teste:** Verificar whitespace e layout respirável

**Passos:**
1. Acessar páginas principais
2. Verificar espaçamento entre elementos
3. Verificar padding de cards e containers

**Resultado Esperado:**
- ✅ Muito espaço negativo (whitespace)
- ✅ Cards com padding generoso (1.5rem+)
- ✅ Grids respiráveis
- ✅ Sem elementos "apertados"

---

## 📱 BLOCO 2: Responsividade

### 2.1 Desktop (1920px+)

**Teste:** Layout em telas grandes

**Passos:**
1. Abrir em resolução 1920x1080 ou superior
2. Verificar grid de produtos/ensaios
3. Verificar navegação
4. Verificar galerias

**Resultado Esperado:**
- ✅ Layout centralizado (max-width: 1400px)
- ✅ Grid de 3-4 colunas
- ✅ Navegação horizontal funcional
- ✅ Galerias em masonry responsivo

---

### 2.2 Tablet (768px - 1024px)

**Teste:** Layout em tablets

**Passos:**
1. Redimensionar para 768px-1024px
2. Verificar adaptação do grid
3. Verificar navegação
4. Verificar formulários

**Resultado Esperado:**
- ✅ Grid de 2 colunas
- ✅ Navegação adaptada
- ✅ Formulários legíveis
- ✅ Cards não quebram

---

### 2.3 Mobile (320px - 767px)

**Teste:** Layout em smartphones

**Passos:**
1. Redimensionar para 375px (iPhone) ou 360px (Android)
2. Verificar grid (deve ser 1 coluna)
3. Verificar navegação (menu hamburger se necessário)
4. Verificar formulários
5. Verificar galerias

**Resultado Esperado:**
- ✅ Grid de 1 coluna
- ✅ Navegação mobile-friendly
- ✅ Formulários com inputs grandes o suficiente
- ✅ Galerias em coluna única
- ✅ Botões com área de toque adequada (44x44px mínimo)

---

## 🎨 BLOCO 3: Componentes Premium

### 3.1 Rich Text Editor (Tiptap)

**Teste:** Editor de texto rico

**Passos:**
1. Acessar criação/edição de produto ou ensaio
2. Localizar campo de descrição
3. Testar formatação:
   - Negrito (B)
   - Itálico (I)
   - Lista com marcadores (•)
   - Lista numerada (1.)
4. Verificar placeholder
5. Verificar salvamento

**Resultado Esperado:**
- ✅ Barra de ferramentas minimalista visível
- ✅ Botões funcionam corretamente
- ✅ Placeholder aparece quando vazio
- ✅ HTML sanitizado ao salvar
- ✅ Preview renderiza corretamente

---

### 3.2 Galeria Masonry

**Teste:** Grid adaptativo de fotos

**Passos:**
1. Acessar página de ensaio com fotos
2. Verificar grid masonry
3. Verificar que fotos verticais/horizontais não são cortadas
4. Verificar hover effect
5. Clicar em uma foto

**Resultado Esperado:**
- ✅ Grid adaptativo (3 colunas desktop, 2 tablet, 1 mobile)
- ✅ Fotos mantêm proporção
- ✅ Hover effect suave (sombra + translateY)
- ✅ Lightbox abre ao clicar

---

### 3.3 Lightbox

**Teste:** Visualização em tela cheia

**Passos:**
1. Abrir lightbox (clicar em foto)
2. Verificar fundo escuro/blur
3. Testar navegação:
   - Setas do teclado (← →)
   - Botões de navegação
   - ESC para fechar
4. Testar zoom (clicar na imagem)
5. Verificar contador (X / Y)

**Resultado Esperado:**
- ✅ Fundo escuro com blur
- ✅ Navegação por teclado funciona
- ✅ Botões de navegação visíveis
- ✅ Zoom ao clicar na imagem
- ✅ Contador mostra posição correta
- ✅ ESC fecha o lightbox

---

### 3.4 Avatares

**Teste:** Exibição de fotos de perfil

**Passos:**
1. Acessar lista de usuários
2. Verificar avatares aparecem
3. Verificar fallback (inicial) quando não há foto
4. Verificar tamanho e formato circular
5. Verificar hover effect (se houver)

**Resultado Esperado:**
- ✅ Fotos de perfil aparecem corretamente
- ✅ Fallback com inicial quando não há foto
- ✅ Formato circular
- ✅ Tamanho consistente (40px padrão)
- ✅ URLs assinadas funcionam

---

## 🔒 BLOCO 4: Segurança Visual

### 4.1 Botões de Ação por Role

**Teste:** Verificar que botões aparecem apenas para ARQUITETO

**Passos:**
1. Login como ADMIN
2. Verificar que não há botões "Novo", "Editar", "Excluir"
3. Login como MODELO
4. Verificar que não há botões de ação
5. Login como ARQUITETO
6. Verificar que botões aparecem

**Resultado Esperado:**
- ✅ ADMIN: Apenas visualização (sem botões de ação)
- ✅ MODELO: Apenas visualização (sem botões de ação)
- ✅ ARQUITETO: Botões de ação visíveis e funcionais

---

### 4.2 Uploads

**Teste:** Verificar inputs de upload estilizados

**Passos:**
1. Login como ARQUITETO
2. Acessar criação de produto/ensaio
3. Verificar input de upload de foto
4. Testar upload
5. Verificar preview

**Resultado Esperado:**
- ✅ Input de upload estilizado (premium)
- ✅ Preview aparece após upload
- ✅ Validação de tipo/tamanho funciona
- ✅ Mensagens de erro claras

---

## 📋 BLOCO 5: Funcionalidades Críticas

### 5.1 Navegação

**Teste:** Menu de navegação premium

**Passos:**
1. Verificar menu superior
2. Testar links
3. Verificar estado ativo (link destacado)
4. Verificar hover effects
5. Testar em mobile (se houver menu hamburger)

**Resultado Esperado:**
- ✅ Menu estilizado premium
- ✅ Links funcionam corretamente
- ✅ Estado ativo visível (cor dourada)
- ✅ Hover effects suaves
- ✅ Mobile-friendly

---

### 5.2 Formulários

**Teste:** Formulários premium

**Passos:**
1. Acessar qualquer formulário
2. Verificar inputs estilizados
3. Verificar labels
4. Verificar botões
5. Testar validação
6. Verificar mensagens de erro

**Resultado Esperado:**
- ✅ Inputs com estilo premium
- ✅ Labels claros
- ✅ Botões em dourado
- ✅ Validação funciona
- ✅ Mensagens de erro claras e visíveis

---

### 5.3 Termos de Autorização

**Teste:** Exibição de termos (PDF/D4Sign)

**Passos:**
1. Acessar ensaio com termo
2. Verificar botão de termo aparece
3. Testar link D4Sign (se houver)
4. Testar download PDF (se houver)
5. Verificar mensagem quando não há termo

**Resultado Esperado:**
- ✅ Botão premium (dourado para D4Sign, vermelho para PDF)
- ✅ Links funcionam
- ✅ Mensagem clara quando não há termo
- ✅ Estilo consistente

---

## ✅ Checklist Final

### Visual
- [ ] Cores premium aplicadas (Cream, Gold, Black)
- [ ] Tipografia editorial (Serif + Sans-serif)
- [ ] Espaçamento minimalista
- [ ] Cards com sombras suaves
- [ ] Bordas arredondadas (4-6px)

### Responsividade
- [ ] Desktop (1920px+): Layout centralizado, 3-4 colunas
- [ ] Tablet (768-1024px): 2 colunas, navegação adaptada
- [ ] Mobile (320-767px): 1 coluna, inputs grandes, menu mobile

### Componentes
- [ ] Rich Text Editor (Tiptap) funcional
- [ ] Galeria Masonry adaptativa
- [ ] Lightbox com navegação e zoom
- [ ] Avatares com fallback
- [ ] Botões premium estilizados

### Segurança
- [ ] ADMIN não vê botões de ação
- [ ] MODELO não vê botões de ação
- [ ] ARQUITETO vê todos os botões

### Funcionalidades
- [ ] Navegação funciona
- [ ] Formulários funcionam
- [ ] Uploads funcionam
- [ ] Termos aparecem corretamente
- [ ] Galerias carregam fotos

---

## 🐛 Troubleshooting

### Cores não aparecem
- Verificar se `src/styles/design-system.css` está importado em `globals.css`
- Verificar se `tailwind.config.ts` está configurado
- Limpar cache do navegador

### Fontes não carregam
- Verificar conexão com Google Fonts
- Verificar se fontes estão importadas em `globals.css`
- Verificar fallbacks no CSS

### Componentes não funcionam
- Verificar se imports estão corretos após reorganização
- Verificar se componentes estão em `src/components/` (não `src/app/components/`)
- Verificar console do navegador para erros

### Lightbox não abre
- Verificar se `MasonryGrid` está importando `Lightbox` corretamente
- Verificar se `Image` do Next.js está configurado
- Verificar se há erros no console

---

**Data de Execução:** _______________  
**Executado por:** _______________  
**Resultado:** _______________

