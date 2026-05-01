-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "retrievalRate" INTEGER NOT NULL DEFAULT 0;

-- Backfill from MistakeNote
UPDATE "Problem" p
SET "retrievalRate" = m."retrievalRate"
FROM "MistakeNote" m
WHERE m."problemId" = p."id";

-- CreateIndex
CREATE INDEX "Problem_userId_retrievalRate_idx" ON "Problem"("userId", "retrievalRate");
