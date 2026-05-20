-- Convert 5 learning-process stage columns from nullable TEXT to NOT NULL BOOLEAN.
-- Existing non-empty text is treated as "checked" (true); NULL/empty becomes false.
ALTER TABLE "Problem"
  ALTER COLUMN "definition" TYPE BOOLEAN
    USING ("definition" IS NOT NULL AND "definition" <> ''),
  ALTER COLUMN "definition" SET NOT NULL,
  ALTER COLUMN "definition" SET DEFAULT false,
  ALTER COLUMN "components" TYPE BOOLEAN
    USING ("components" IS NOT NULL AND "components" <> ''),
  ALTER COLUMN "components" SET NOT NULL,
  ALTER COLUMN "components" SET DEFAULT false,
  ALTER COLUMN "diagram" TYPE BOOLEAN
    USING ("diagram" IS NOT NULL AND "diagram" <> ''),
  ALTER COLUMN "diagram" SET NOT NULL,
  ALTER COLUMN "diagram" SET DEFAULT false,
  ALTER COLUMN "comparison" TYPE BOOLEAN
    USING ("comparison" IS NOT NULL AND "comparison" <> ''),
  ALTER COLUMN "comparison" SET NOT NULL,
  ALTER COLUMN "comparison" SET DEFAULT false,
  ALTER COLUMN "linkage" TYPE BOOLEAN
    USING ("linkage" IS NOT NULL AND "linkage" <> ''),
  ALTER COLUMN "linkage" SET NOT NULL,
  ALTER COLUMN "linkage" SET DEFAULT false;
