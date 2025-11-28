# Limites de Upload - Ambiente de Desenvolvimento

## ⚠️ AVISO IMPORTANTE

**Estes limites são temporários e aplicam-se APENAS ao ambiente de desenvolvimento.**

Os limites foram aumentados para **40 MB** para facilitar testes reais de carga durante o desenvolvimento.

## Limites Atuais (Dev)

- **Imagens (JPG, PNG, WebP):** 40 MB por arquivo
- **PDFs (Termo de Autorização):** 40 MB por arquivo
- **Fotos de Produto:** 40 MB por arquivo
- **Fotos de Perfil:** 40 MB por arquivo
- **Fotos de Ensaio:** 40 MB por foto (máximo 30 fotos por ensaio)

## Limites de Produção (Futuro)

Em produção, os limites serão reduzidos para:
- **Imagens:** 10 MB por arquivo
- **PDFs:** 3 MB por arquivo
- **Fotos de Perfil:** 3 MB por arquivo

## Configuração

Os limites estão configurados nas seguintes rotas de API:

- `src/app/api/ensaios/upload/route.ts` - Upload de ensaios
- `src/app/api/admin/users/upload-profile-image/route.ts` - Upload de fotos de perfil
- `src/app/api/produtos/upload-photo/route.ts` - Upload de fotos de produto
- `src/app/api/media/upload/route.ts` - Upload geral de mídia

## Validação Frontend

O frontend também deve validar os limites antes de enviar:

```typescript
const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40 MB (dev)
```

## Notas

- Estes limites são apenas para desenvolvimento e testes
- Em produção, os limites serão ajustados conforme necessário
- O sistema de rate limiting ainda está ativo (10 uploads por minuto)

