ALTER TABLE "courses" ALTER COLUMN "certificate_enabled" SET DEFAULT true;
--> statement-breakpoint
-- Backfill: every existing course kept issuing certificates on completion while
-- this flag was never read. Set them all true so gating issuance on the flag
-- (finalizeCourseCompletion) does not silently stop certificates for courses that
-- issue them today. New courses default true via the ALTER above; admins opt out
-- per course in the editor.
UPDATE "courses" SET "certificate_enabled" = true WHERE "certificate_enabled" = false;
