import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This is a temporary endpoint to create the PasswordResetToken table
// since we couldn't run the migration due to permission issues
export async function GET() {
  try {
    // Check if the table exists by trying to query it
    try {
      await prisma.$queryRaw`SELECT 1 FROM "password_reset_tokens" LIMIT 1`;
      return NextResponse.json({ message: "Table already exists" });
    } catch (error) {
      // Table doesn't exist, create it
      await prisma.$executeRaw`
        CREATE TABLE "password_reset_tokens" (
          "id" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
        );
      `;
      
      // Create index on email
      await prisma.$executeRaw`
        CREATE INDEX "password_reset_tokens_email_idx" ON "password_reset_tokens"("email");
      `;
      
      // Create unique constraint on token
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");
      `;
      
      return NextResponse.json({ message: "Table created successfully" });
    }
  } catch (error) {
    console.error("[CREATE_RESET_TOKEN_TABLE]", error);
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}