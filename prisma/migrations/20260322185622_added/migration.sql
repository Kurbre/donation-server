-- CreateEnum
CREATE TYPE "TokenTypes" AS ENUM ('RESET_PASSWORD', 'CHANGE_PASSWORD');

-- AlterTable
ALTER TABLE "pending_users" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '24 hours');

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" "TokenTypes" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (now() + interval '24 hours'),

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_email_key" ON "tokens"("email");
