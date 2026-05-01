-- DropIndex
DROP INDEX "MistakeNote_userId_skipCount_hintCount_blurryCount_idx";

-- AlterTable
ALTER TABLE "MistakeNote" ADD COLUMN     "lastStudiedAt" TIMESTAMP(3),
ADD COLUMN     "vividCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "retrievalThreshold" INTEGER NOT NULL DEFAULT 80,
ADD COLUMN     "staleDays" INTEGER NOT NULL DEFAULT 7;

-- CreateTable
CREATE TABLE "StudyLog" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "studiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyLog_userId_studiedAt_idx" ON "StudyLog"("userId", "studiedAt");

-- CreateIndex
CREATE INDEX "StudyLog_problemId_studiedAt_idx" ON "StudyLog"("problemId", "studiedAt");

-- CreateIndex
CREATE INDEX "MistakeNote_userId_skipCount_blurryCount_vividCount_idx" ON "MistakeNote"("userId", "skipCount", "blurryCount", "vividCount");

-- CreateIndex
CREATE INDEX "MistakeNote_userId_lastStudiedAt_idx" ON "MistakeNote"("userId", "lastStudiedAt");

-- AddForeignKey
ALTER TABLE "StudyLog" ADD CONSTRAINT "StudyLog_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyLog" ADD CONSTRAINT "StudyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
