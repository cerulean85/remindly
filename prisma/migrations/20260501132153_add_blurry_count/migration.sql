-- DropIndex
DROP INDEX "MistakeNote_userId_skipCount_hintCount_idx";

-- AlterTable
ALTER TABLE "MistakeNote" ADD COLUMN     "blurryCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "MistakeNote_userId_skipCount_hintCount_blurryCount_idx" ON "MistakeNote"("userId", "skipCount", "hintCount", "blurryCount");
