/*
  Warnings:

  - You are about to drop the column `creatorId` on the `Room` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_creatorId_fkey";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "creatorId";
