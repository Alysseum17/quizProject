/*
  Warnings:

  - You are about to drop the column `description` on the `Quiz` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "description",
ADD COLUMN     "quiz_description" TEXT;
