-- Two data-integrity repairs, plus the constraints that keep them repaired.
--
-- 1) Certification.category drifted: rows created through the admin panel could
--    be stored with an empty or oddly-cased category, and the public page
--    silently bucketed anything that was not literally "certification" under
--    Training (e.g. "AWS Certified Cloud Practitioner"). Normalise every row to
--    the two values the UI understands, blank/unknown -> "certification", the
--    Prisma default for the column.
UPDATE "Certification"
SET "category" = CASE
  WHEN LOWER(TRIM(COALESCE("category", ''))) = 'training' THEN 'training'
  ELSE 'certification'
END;

-- 2) Ordering drifted: manual "Order" inputs allowed duplicates (two rows sat
--    on 7) and holes. Re-compact each table to a strict 1..n sequence, keeping
--    the previous intent (old order first, id as the tie-breaker). The
--    temporary mapping table means the UPDATE never reads rows it is writing.
--
--    Certification is ordered per category group; every other table is one group.
CREATE TEMP TABLE "_order_fix" AS
SELECT "id", ROW_NUMBER() OVER (
  PARTITION BY "category" ORDER BY "sortOrder" ASC, "id" ASC
) AS "newOrder" FROM "Certification";
UPDATE "Certification"
SET "sortOrder" = (SELECT "newOrder" FROM "_order_fix" AS f WHERE f."id" = "Certification"."id");
DROP TABLE "_order_fix";

CREATE TEMP TABLE "_order_fix" AS
SELECT "id", ROW_NUMBER() OVER (ORDER BY "sortOrder" ASC, "id" ASC) AS "newOrder" FROM "Experience";
UPDATE "Experience"
SET "sortOrder" = (SELECT "newOrder" FROM "_order_fix" AS f WHERE f."id" = "Experience"."id");
DROP TABLE "_order_fix";

CREATE TEMP TABLE "_order_fix" AS
SELECT "id", ROW_NUMBER() OVER (ORDER BY "sortOrder" ASC, "id" ASC) AS "newOrder" FROM "Education";
UPDATE "Education"
SET "sortOrder" = (SELECT "newOrder" FROM "_order_fix" AS f WHERE f."id" = "Education"."id");
DROP TABLE "_order_fix";

CREATE TEMP TABLE "_order_fix" AS
SELECT "id", ROW_NUMBER() OVER (ORDER BY "sortOrder" ASC, "id" ASC) AS "newOrder" FROM "Achievement";
UPDATE "Achievement"
SET "sortOrder" = (SELECT "newOrder" FROM "_order_fix" AS f WHERE f."id" = "Achievement"."id");
DROP TABLE "_order_fix";

CREATE TEMP TABLE "_order_fix" AS
SELECT "id", ROW_NUMBER() OVER (ORDER BY "sortOrder" ASC, "id" ASC) AS "newOrder" FROM "SkillGroup";
UPDATE "SkillGroup"
SET "sortOrder" = (SELECT "newOrder" FROM "_order_fix" AS f WHERE f."id" = "SkillGroup"."id");
DROP TABLE "_order_fix";

CREATE TEMP TABLE "_order_fix" AS
SELECT "id", ROW_NUMBER() OVER (ORDER BY "sortOrder" ASC, "id" ASC) AS "newOrder" FROM "Project";
UPDATE "Project"
SET "sortOrder" = (SELECT "newOrder" FROM "_order_fix" AS f WHERE f."id" = "Project"."id");
DROP TABLE "_order_fix";

-- 3) Enforce what the repair just established. Ordering is now server-managed
--    (see src/lib/ordering.ts), so a duplicate position can never be written
--    again - not even by a stale form or a future code path.
CREATE UNIQUE INDEX "Experience_sortOrder_key" ON "Experience"("sortOrder");
CREATE UNIQUE INDEX "Education_sortOrder_key" ON "Education"("sortOrder");
CREATE UNIQUE INDEX "Certification_category_sortOrder_key" ON "Certification"("category", "sortOrder");
CREATE UNIQUE INDEX "Achievement_sortOrder_key" ON "Achievement"("sortOrder");
CREATE UNIQUE INDEX "SkillGroup_sortOrder_key" ON "SkillGroup"("sortOrder");
CREATE UNIQUE INDEX "Project_sortOrder_key" ON "Project"("sortOrder");
