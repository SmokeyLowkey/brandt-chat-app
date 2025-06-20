-- CreateTable
CREATE TABLE "document_texts" (
    "id" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "document_texts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_texts_documentId_key" ON "document_texts"("documentId");

-- CreateIndex
CREATE INDEX "document_texts_documentId_idx" ON "document_texts"("documentId");

-- AddForeignKey
ALTER TABLE "document_texts" ADD CONSTRAINT "document_texts_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
