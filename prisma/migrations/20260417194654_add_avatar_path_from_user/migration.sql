-- AlterTable
ALTER TABLE "pending_users" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '24 hours');

-- AlterTable
ALTER TABLE "tokens" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '24 hours');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarPath" TEXT NOT NULL DEFAULT 'http://res.cloudinary.com/dwbzak6xg/image/upload/v1776454853/db9ytvlloe4gxawiawax.png';
