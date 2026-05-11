/*
  Warnings:

  - You are about to drop the column `isPhrase` on the `Dictionary` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dictionary" DROP COLUMN "isPhrase";

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "usedWords" TEXT[] DEFAULT ARRAY[]::TEXT[];
