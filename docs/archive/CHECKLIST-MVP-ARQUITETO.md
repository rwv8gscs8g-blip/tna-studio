# Checklist MVP - Arquitetura ARQUITETO

**Data:** 2025-11-21  
**Versão:** 1.0

## Configuração Inicial

- [ ] Variáveis de ambiente configuradas (`.env.local`):
  - [ ] `DATABASE_URL` (banco Neon)
  - [ ] `DIRECT_URL` (banco Neon)
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `NEXTAUTH_URL`
  - [ ] `CERT_A1_FILE_PATH` (opcional)
  - [ ] `CERT_A1_PASSWORD` (opcional)
  - [ ] `CERT_A1_ENFORCE_WRITES` (opcional, default: false)

## Banco de Dados

- [ ] `./scripts/reset-database-zerar-tudo.sh` roda sem erros
- [ ] Seed cria apenas o ARQUITETO inicial:
  - [ ] Email: `[redacted-email]`
  - [ ] Senha: `[redacted-password]`
  - [ ] Perfil: `ARQUITETO`
  - [ ] CPF: `[redacted-cpf]`
  - [ ] Telefone: `[redacted-phone]`
  - [ ] Data nascimento: `1974-12-27`
- [ ] Tabela `ArquitetoSession` existe e está funcionando
- [ ] Tabela `AdminSession` foi removida (não existe mais)

## Autenticação

- [ ] Login por email + senha funciona (ARQUITETO, pelo menos) em localhost
- [ ] Login por email + senha funciona em produção
- [ ] Login por certificado A1 funciona para o ARQUITETO (quando certificado configurado) sem travar
- [ ] Logout funciona e não deixa o botão "Entrar" bugado
- [ ] Cookies são limpos corretamente no logout

## Permissões e Operações

- [ ] ARQUITETO consegue criar e editar galerias com SyncLink e TermsLink
- [ ] ARQUITETO consegue fazer upload de fotos
- [ ] ARQUITETO consegue criar, editar e excluir usuários
- [ ] ADMIN/SUPER_ADMIN conseguem ver galerias, mas não editar
- [ ] ADMIN/SUPER_ADMIN conseguem ver usuários, mas não editar
- [ ] MODEL/CLIENT veem apenas as próprias galerias
- [ ] MODEL/CLIENT não podem fazer upload de fotos

## Sessão do Arquiteto

- [ ] Apenas UM Arquiteto pode estar logado por vez
- [ ] Ao logar um segundo Arquiteto, o primeiro é deslogado automaticamente
- [ ] Se há sessão ativa em um ambiente (production/localhost), o outro fica read-only
- [ ] Sessão expira corretamente após 1 hora

## Guard de Escrita

- [ ] Apenas ARQUITETO pode executar operações de escrita
- [ ] ADMIN tenta escrever → retorna 403
- [ ] SUPER_ADMIN tenta escrever → retorna 403 (exceto trocar certificado)
- [ ] MODEL/CLIENT tentam escrever → retorna 403
- [ ] Certificado A1 é validado em cada operação de escrita (quando `CERT_A1_ENFORCE_WRITES=true`)

## Banco Unificado

- [ ] Localhost e produção usam o mesmo `DATABASE_URL`
- [ ] Migrations aplicadas corretamente em ambos os ambientes
- [ ] Sessão do Arquiteto funciona corretamente em ambos os ambientes

## Documentação

- [ ] `ARQUITETURA-ARQUITETO.md` criado e completo
- [ ] `SEGURANCA-A1.md` criado e completo
- [ ] `STATUS-ARQUITETURA-ARQUITETO.md` atualizado com estado atual
- [ ] `README.md` atualizado com instruções de setup

## Testes Rápidos

- [ ] Reset completo do banco funciona
- [ ] Login como ARQUITETO funciona
- [ ] Criação de galeria como ARQUITETO funciona
- [ ] Upload de foto como ARQUITETO funciona
- [ ] Visualização de galeria como ADMIN funciona (read-only)
- [ ] Visualização de galeria como MODEL funciona (apenas próprias)
- [ ] Logout funciona corretamente

## Notas

### Problemas Conhecidos
- [ ] Login por certificado A1 ainda não tem interface no frontend
- [ ] Alguns endpoints podem precisar de ajustes finos

### Melhorias Futuras
- [ ] Interface de login por certificado no frontend
- [ ] Melhorias de UX para diferenciar permissões (botões desabilitados para read-only)
- [ ] Login via SMS para modelos (Fase futura)
- [ ] Sistema de auditoria completo

