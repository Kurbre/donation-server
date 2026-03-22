-- AlterTable
ALTER TABLE "pending_users" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '1 minutes');
