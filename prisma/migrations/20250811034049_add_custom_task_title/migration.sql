/*
  Warnings:

  - Added the required column `title` to the `ProgressLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProgressLog" ADD COLUMN     "title" TEXT NOT NULL;
