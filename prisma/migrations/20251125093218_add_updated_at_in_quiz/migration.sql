/*
  Warnings:

  - Added the required column `updated_at` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL;
