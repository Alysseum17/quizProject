-- AlterTable
ALTER TABLE "User" ADD COLUMN     "reset_token" VARCHAR(255),
ADD COLUMN     "reset_token_expires_at" TIMESTAMPTZ;
