ALTER TABLE "quiz_questions" ADD COLUMN "critical" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "critical_competency" text;