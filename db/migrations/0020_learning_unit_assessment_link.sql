ALTER TABLE "lessons" ADD COLUMN "assessment_for_lesson_id" uuid;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lessons_assessment_for_idx" ON "lessons" USING btree ("assessment_for_lesson_id");