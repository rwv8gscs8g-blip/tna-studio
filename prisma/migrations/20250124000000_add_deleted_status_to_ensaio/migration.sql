-- Migration mantida como no-op por consistência de histórico.
-- A adição do valor DELETED ao enum EnsaioStatus é feita pela migration
-- 20250125000000_ensure_deleted_in_ensaio_status de forma idempotente.
-- Esta migration é mantida apenas para satisfazer o histórico do Prisma.
-- 
-- NOTA: Esta migration foi convertida em no-op porque:
-- 1. O enum EnsaioStatus pode não existir ainda quando esta migration é aplicada
-- 2. A migration 20250125000000_ensure_deleted_in_ensaio_status já adiciona DELETED de forma segura
-- 3. Evita conflitos na shadow database durante migração

