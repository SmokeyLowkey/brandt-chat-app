-- AlterTable
-- This is an idempotent migration that will only add the column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                 WHERE table_name='document_texts' AND column_name='text_blocks_redacted') THEN
        ALTER TABLE "document_texts" ADD COLUMN "text_blocks_redacted" TEXT;
    END IF;
END $$;