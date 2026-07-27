-- Custom SQL migration file, put your code below! --

-- FIX: deleting a lesson failed for any lesson a learner had touched.
--
-- progress_events.lesson_id referenced lessons(id) ON DELETE SET NULL, but
-- progress_events is append-only (forbid_mutation blocks UPDATE/DELETE). So the
-- cascade Postgres runs on lesson delete — UPDATE progress_events SET
-- lesson_id = NULL — hit the trigger and raised:
--   "progress_events is append-only; UPDATE is not permitted"
-- Every lesson with a completion or watch event was therefore undeletable, and
-- the admin's Remove button returned an error.
--
-- Fix: drop the foreign key and keep lesson_id as a plain historical reference.
-- That is the correct shape for an append-only event log — the event records
-- which lesson id was involved at the time, and must stay truthful even after
-- the lesson is gone. Reader code already tolerates a missing lesson (rows are
-- joined for reporting and filtered on non-null ids).

alter table "progress_events"
  drop constraint if exists "progress_events_lesson_id_lessons_id_fk";
