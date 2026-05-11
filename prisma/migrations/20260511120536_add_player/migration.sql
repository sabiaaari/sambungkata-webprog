/*
  Warnings:

  - You are about to drop the column `playerCount` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - Added the required column `roomCode` to the `MatchHistory` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "MatchHistory" ADD COLUMN     "roomCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "playerCount",
ADD COLUMN     "currentWord" TEXT,
ADD COLUMN     "turnIndex" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'waiting';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "password";

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "userId" INTEGER,
    "roomId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
