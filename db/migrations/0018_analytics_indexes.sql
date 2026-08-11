CREATE INDEX IF NOT EXISTS "certificates_tenant_idx" ON "certificates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "progress_events_tenant_event_lesson_idx" ON "progress_events" USING btree ("tenant_id","event_type","lesson_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "progress_events_tenant_occurred_idx" ON "progress_events" USING btree ("tenant_id","occurred_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_answers_tenant_question_idx" ON "quiz_answers" USING btree ("tenant_id","question_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_attempts_tenant_passed_idx" ON "quiz_attempts" USING btree ("tenant_id","passed");