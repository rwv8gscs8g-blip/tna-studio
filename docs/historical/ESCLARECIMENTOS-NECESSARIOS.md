# Esclarecimentos Necessários - Reconstrução Completa

## ⚠️ Pontos que Precisam Decisão Antes de Implementar

### 1. Provedores de SMS/WhatsApp

**Pergunta:** Qual provedor usar?
RESPOSTA: 
**Opções:**
- **Twilio** (SMS + WhatsApp)
- **Zenvia** (SMS)
- **Meta WhatsApp Cloud API** (WhatsApp)
- **Placeholder no MVP** (logs no console, sem envio real)

**Recomendação:** Placeholder no MVP, integrar depois

**Impacto:** Define estrutura de integração
RESPOSTA: Implementação com o Twilio.  façca um detalhamento passo a passo. 
---

### 2. Integração Sync.com

**Pergunta:** Como acessar Sync.com?

**Opções:**
- **API Sync.com** (se disponível)
- **Iframe interno** (pode ter restrições de segurança)
- **Link direto com proteção** (janela popup segura)
- **Gateway proxy** (nossa API faz proxy para Sync.com)

**Recomendação:** Gateway proxy com validação de sessão

**Impacto:** Define arquitetura do módulo Sync.com
 RESPOSTA:  Link direto colocado pelo Administrador.  Faça apenas uma  janela segura   para acesso controlada por sessão. 
---

### 3. Termo de Autorização

**Pergunta:** Formato do termo?

**Opções:**
- **PDF** (mais comum)
- **Imagem** (JPG/PNG)
- **Texto** (formulário)

**Recomendação:** PDF ou Imagem (armazenado no R2)

**Pergunta:** Um termo por foto ou um termo por galeria?

**Recomendação:** Um termo por foto (mais granular)

**Impacto:** Define schema e estrutura de upload
RESPOSTA:  Um termo por galeria.  Cada galeria corresponderá a uma sessão fotográfica que  foi  realizado por uma determinada modelo em um determinado dia.  toda galeria pode ter um campo de nome com data no formato DD/MM/AAA e o CPF ou nome da modelo como identificador.  Essa galeria terá uma foto, um termo de autorização e o link para o ensaio completo.  Ao clicar na foto, aí sim será lançada para uma página filha com as 30 fotos da sessão.  então teremos uma visão simplificada da galeria e ao clicar na foto a visualização de donwload das fotos. 
---

### 4. Mensagens do Admin

**Pergunta:** Onde exibir mensagens?

**Opções:**
- **Banner no topo** (todas as páginas)
- **Seção dedicada** (página de mensagens)
- **Notificação** (badge no menu)
- **Combinação** (banner + página)

**Recomendação:** Banner no topo + página de mensagens

**Pergunta:** Mensagens podem ser editadas/deletadas?

**Recomendação:** Sim, apenas admin

**Impacto:** Define UI/UX de mensagens
RESPOSTA:  Sim uma área de mensagem abaixo  do nome da modelo de dados da modelo. Servirá como uma mensagem geral para todos os Modelos, clientes Etc.  Logo abaixo criei um campo de mensagem adicional caso o administrador queira colocar  mensagens específicas para a modelo. 
---

### 5. Área da Modelo

**Pergunta:** Estrutura da área?

**Opções:**
- **Página única** (`/model`) com todas as informações
- **Subpáginas** (`/model/profile`, `/model/galleries`, etc.)
- **Parte do perfil** (`/profile` com seção especial para modelos)
RESPOSTA:  Modelo terá uma página com o seu prefil e  abaixo links para subpaginas de cada uma das suas galerias.  Na página principal terá uma informação de cada sessão,  contendo a data da sessão, formato DD/MM/AAA, o link para download do termo de autorização de uso de imagem daquela sessão, que será um documento pdf feito upload  em banco R2 para download pela modelo e um link seguro, com um pop up controlado no qual ela terá acesso a um link  com senha do sync.com que será visível somente enquanto ela estiver com sessão ativa. 

**Recomendação:** Página dedicada `/model` com subpáginas
RESPOSTA:  Sim, página com subpáginas.  
**Pergunta:** Modelo pode editar foto de perfil e descrição?

Sim a modelo e o administrador podem alterar a descrição da modelo e os dados pessoais para correção.  Colocar campos de endereço completo, cep  etc nao obrigatórios. Os itens obrigatórios serão os para logins e validações de SMS e whatsapp: Telefone, email, cpf ( ou documento passaporte) e data de nascimento  maior que 18 anos
**Recomendação:** Sim, mas admin pode sobrescrever

**Impacto:** Define estrutura de rotas e permissões
 haverá uma área de informação para a modelo que será um aviso do administrador para todas as pessoas da categoria Clientes, Da Categoria Modelos, da Categoria Outros. Poder criar  categorias. 
---

### 6. Upload de Fotos

**Pergunta:** Fluxo de upload?

**Opções:**
- **Criar galeria → Upload fotos → Upload termo** (sequencial)
- **Upload tudo junto** (galeria + fotos + termo em um formulário)
- **Upload fotos primeiro → Criar galeria depois** (inverso)

**Recomendação:** Criar galeria → Upload fotos → Upload termo (sequencial)
RESPOSTA: Criar a Galeria, Criar o upload de termo e depois o upload de fotos. Não será permitido subir fotos sem o termo de autorização de uso de imagens assinado e disponível para todos.  Apenas o Administrador poderá subir fotos. As modelos poderão efetuar download do termo e das fotos. A página será um grande armazenador do termo de autorização, com uma foto da sessão, dentro 30 fotos de exemplo do ensaio e um link no sync  com senha para baixar o conteúdo completo. 

**Pergunta:** Upload múltiplo de fotos?

**Recomendação:** Sim, até 30 fotos por vez

**Impacto:** Define UX de criação de galeria
 Sim.  Até 30 fotos por vez.  Pensar em uma evolução futura um upload de foto que receba as fotos em um determinado formato, tipo 001.jpg e renomeie as fotos com  a estrutura data aaa-mm-dd-/cpf/nofoto
---

### 7. Validação de CPF/Passaporte

**Pergunta:** Nível de validação?

**Opções:**
- **Apenas formato** (regex + dígitos verificadores para CPF)
- **Validação real** (consulta API externa)
- **Validação + verificação de existência** (consulta Receita Federal)

**Recomendação:** Formato + dígitos verificadores (CPF), formato ICAO (Passaporte)
RESPOSTA: formato + Digitos Verificadores, ICAO para passaporte  
**Impacto:** Define complexidade de validação

---

### 8. Email/WhatsApp de Auditoria

**Pergunta:** Configurar agora ou placeholder?

**Opções:**
- **SMTP real** (SendGrid, Resend, etc.)
- **WhatsApp real** (Twilio, Meta)
- **Placeholder** (logs no console, sem envio real)
RESPOSTA: Twilio. Integração real
**Recomendação:** Placeholder no MVP, integrar depois
RESPOSTA: O Mvp é da integração com twilio, email, sms e email. Precisamos de de isso funcional para validarmos para a próxima etapa com o cliente e definirmos ajustes. Precisa funcionar já integrado.  Apenas placeholders não atende. ( Veja a opção de separar o banco de dados de produção e localhost ou entao já apontar os dois diretamente para uma mesma base de dados de produção. Ainda no modo testes. )
**Pergunta:** Frequência de envio?
RESPOSTA: de 5 a 30 por mês.  Não mais do que 30 por mes na primeira fase. 
**Opções:**
- **Cada login** (pode ser muito)
- **Apenas logins suspeitos** (IP diferente, horário estranho)
- **Resumo diário** (todos os logins do dia)

**Recomendação:** Cada login (conforme especificação)

**Impacto:** Define estrutura de notificações
RESPOSTA: Envio de email direto com notificaçao de login e com notificação de logout por sessão expirada. Quero saber quem está acessando, quando acessou, qual o país, local etc.  Essas informações deverão ser apagadas automaticamente da base a casa 6 meses por questões da GDPR.  A princípio somente pessoas convidadas poderão acessar.  Previsão de 5 a 30 acessos por mês no início. 
---

### 9. Sessões e Tokens

**Pergunta:** Manter 5 minutos ou aumentar?

**Opções:**
- **Manter 5 minutos** (mais seguro)
- **Aumentar para 15-30 minutos** (melhor UX)
- **Configurável por role** (admin mais tempo, clientes menos)

**Recomendação:** Manter 5 minutos (conforme especificação)
RESPOSTA: Manter em 10 minutos para administradores e 5 minutos para os demais ( para validação e testes.  Possíveis alterações mais para frente) 
**Pergunta:** Limite de extensões?
RESPOSTA: Extensões na tela  de +5 minutos.  Na página do Sync.com criar extensões de mais 30 minutos.
**Opções:**
- **Sem limite** (usuário pode estender indefinidamente)
- **Limite de 3 extensões** (total 20 minutos)
- **Limite de tempo total** (ex: máximo 1 hora por sessão)

**Recomendação:** Limite de 3 extensões (total 20 minutos)

**Impacto:** Define lógica de sessão
RESPOSTA:  Extensões limitadas a duas hora por login.  Depois desse prazo devem ser revogados os tokens, as rotas e os caminhos de acesso de forma definitiva e testada, até novo login
---

### 10. Estrutura de Galeria (3 Colunas)

**Pergunta:** Layout responsivo?

**Opções:**
- **3 colunas desktop, 1 coluna mobile**
- **3 colunas sempre** (scroll horizontal)
- **Grid adaptativo** (2-3 colunas conforme tela)

**Recomendação:** 3 colunas desktop, 1 coluna mobile (stack vertical)
RESPOSTA: Seguir a descrição.  3 colunas desktop. uma coluna mobile. 

**Pergunta:** Ordem das colunas?
RESPOSTA: Obrigatoriamente por ordem de data de ensaio. Os mais novos aparecem primeiro. Formato AAAA/MM/DD que será utilizado com o sistema de renomear as fotos das galerias ou páginas filhas. Toda galeria terá  a data, o cpf da modelo  ( ou passaporte) o termo de autorização de uso e o link para o ensaio completo. 
**Opções:**
- **Thumbnail | Termo | Sync.com** (conforme especificação)
- **Termo | Thumbnail | Sync.com** (termo primeiro)
- **Configurável** (admin escolhe ordem)
RESPOSTA: Padrão thumbnail | termo | Sync,.  
**Recomendação:** Thumbnail | Termo | Sync.com (conforme especificação)

**Impacto:** Define layout e CSS

---

## 📋 Decisões Técnicas Pendentes

### 1. Biblioteca de Lightbox
- **Opção 1:** `react-image-gallery`
- **Opção 2:** `yet-another-react-lightbox`
- **Opção 3:** Custom (mais controle)

**Recomendação:** Custom (mais controle, menos dependências)
RESPOSTA: Custom ( O foco sempre deve ser controle e segurança. Validar que os ensaios somente podem ser vistos pela modelo e pelo administrador. Um modelo não consegue acessar ensaios de outros modelos. Os ensaios devem ficar visíveis para o administrador organizados como  por modelo. )
### 2. Biblioteca de Drag & Drop
- **Opção 1:** `react-dropzone`
- **Opção 2:** `react-uploader`
- **Opção 3:** Custom

**Recomendação:** `react-dropzone` (maduro, bem testado)
RESPOSTA: Deixo a critério do que for mais seguro. React-Dropzone parece bom, mas na anterior vamos usar o custom. VValidar se não estamos incluindo muita complexidade desnecessária. Poderá ser criado um módulo específico para upload de galerias por modelos com renomeação das imagens, conforme proposto. Podemos fazer isso em um módulo futuro. 
### 3. Biblioteca de Validação
- **Opção 1:** `zod` (TypeScript-first)
- **Opção 2:** `yup`
- **Opção 3:** Custom

**Recomendação:** `zod` (TypeScript-first, type-safe)
RESPOSTA: ZOD
### 4. Biblioteca de Formulários
- **Opção 1:** `react-hook-form` + `zod`
- **Opção 2:** Formulários nativos
- **Opção 3:** Custom

**Recomendação:** `react-hook-form` + `zod` (validação type-safe)
RESPOSTA: Recomendação aceita. 
---

## 🎯 Próximos Passos

1. **Você responde os esclarecimentos acima**
2. **Eu ajusto o plano conforme suas respostas**
3. **Começamos implementação faseada**
4. **Validamos cada módulo antes do próximo**

---

**Status:** Aguardando esclarecimentos
**Próximo passo:** Responder perguntas acima para ajustar plano

