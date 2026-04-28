/*
  Warnings:

  - You are about to drop the column `memo` on the `Problem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "memo",
ADD COLUMN     "images" TEXT[];
