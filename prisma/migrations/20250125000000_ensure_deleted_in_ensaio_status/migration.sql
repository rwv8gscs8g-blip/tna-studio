-- Migration idempotente para garantir que DELETED existe no enum EnsaioStatus
-- Esta migration é segura para rodar mesmo se o valor já existir
-- PostgreSQL não suporta IF NOT EXISTS em ALTER TYPE ADD VALUE, então usamos DO $$ BEGIN ... EXCEPTION
DO $$ 
BEGIN
    -- Tenta adicionar o valor DELETED ao enum
    -- Se já existir, o PostgreSQL lançará um erro que será capturado pelo EXCEPTION
    ALTER TYPE "EnsaioStatus" ADD VALUE 'DELETED';
EXCEPTION
    WHEN duplicate_object THEN
        -- O valor já existe, não faz nada - isso é esperado
        NULL;
    WHEN OTHERS THEN
        -- Outros erros são re-lançados para debug
        RAISE;
END $$;

