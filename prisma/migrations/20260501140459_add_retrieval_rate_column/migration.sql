-- AlterTable
ALTER TABLE "MistakeNote" ADD COLUMN     "retrievalRate" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows
UPDATE "MistakeNote"
SET "retrievalRate" = ROUND(
  ("vividCount"::numeric * 100) /
  NULLIF("skipCount" + "blurryCount" + "vividCount", 0)
)
WHERE ("skipCount" + "blurryCount" + "vividCount") > 0;

-- CreateIndex
CREATE INDEX "MistakeNote_userId_retrievalRate_idx" ON "MistakeNote"("userId", "retrievalRate");
