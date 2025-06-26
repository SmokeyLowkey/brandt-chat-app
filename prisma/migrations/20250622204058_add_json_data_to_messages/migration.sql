-- AlterTable
-- This is an idempotent migration that will only add the column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                 WHERE table_name='messages' AND column_name='jsonData') THEN
        ALTER TABLE "messages" ADD COLUMN "jsonData" JSONB;
    END IF;
END $$;