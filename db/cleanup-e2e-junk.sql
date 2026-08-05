-- Clears the E2E junk out of the `demo` academy's storefront.
--
-- WRITTEN, NOT RUN. Review it, then run it yourself. It touches production data.
--
-- READ THIS FIRST: the obvious approach does not work.
--
--   DELETE FROM courses ... would ABORT. `enrollments.course_id` cascades from
--   courses, `progress_events.enrollment_id` cascades from enrollments, and
--   progress_events carries an append-only trigger:
--
--     create trigger progress_events_no_update
--       before update or delete on public.progress_events
--       for each row execute function public.forbid_mutation();
--     -- migrations/0001_rls_and_policies.sql:162
--
--   VERIFIED, not assumed — both cases were attempted inside a transaction that
--   was rolled back, against the real database on 2026-08-06:
--     59 of the 73 junk courses have progress events. DELETE on one of those
--        aborts with "progress_events is append-only; DELETE is not permitted".
--     14 have an enrollment but no events, and DELETE on those SUCCEEDS.
--   The trigger is `for each row`, so it is the presence of events that decides,
--   not the presence of an enrollment. A single DELETE covering all 73 therefore
--   aborts as a whole; deleting only the 14 would leave the storefront still
--   mostly junk, which is not worth a production write.
--
--   Working around that trigger would be deleting learner progress, and whether
--   that is ever permitted is an OPEN decision in docs/POLISH_BACKLOG.md §5
--   ("may learner progress be deleted?"). Do not settle it by disabling a
--   trigger in a cleanup script.
--
-- SO THIS ARCHIVES INSTEAD, which fixes the actual complaint.
--   The storefront reads `status = 'published'` (web/src/app/t/[slug]/page.tsx:71),
--   so setting these to 'archived' empties them out of the catalogue while
--   deleting nothing. Reversible, no evidence lost, no blocked decision touched.
--
-- WHAT IT MATCHES
--   Titles of the exact form the specs generate — "Golden Path <10+ digits>",
--   "Quiz Path <10+ digits>", "Nav Check <10+ digits>", the digits being
--   Date.now(). Anchored at both ends, so a real course called "Golden Path to
--   Decking" or "Quiz Path 3" is NOT matched. Restricted to tenant `demo` as a
--   second, independent condition, so even a mistake in the title pattern cannot
--   reach the `outdure` academy.
--
-- CONTEXT
--   `npm run test:live` had no safety gate until 0c09d56, and its specs author
--   real courses through the real UI against whichever project the server under
--   test points at — which, via web/.env.local, is production. As of 2026-08-06:
--   73 of 77 courses are artifacts, 71 of them published, with 69 enrollments and
--   59 certificates attached. Page 1 of the demo storefront is entirely junk.
--
-- HOW TO RUN
--   Run it as shipped first: it ends in ROLLBACK, so it only prints the dry run.
--   When the numbers look right, change ROLLBACK to COMMIT and run it again.

BEGIN;

-- Defined once, so the dry run and the write cannot drift apart.
CREATE TEMP TABLE junk_courses AS
SELECT c.id, c.title, c.status
FROM courses c
JOIN tenants t ON t.id = c.tenant_id
WHERE t.slug = 'demo'
  AND c.title ~ '^(Golden Path|Quiz Path|Nav Check) [0-9]{10,}$';

-- ── DRY RUN ───────────────────────────────────────────────────────────────────

-- 1. What matched, by current status.
SELECT status, count(*) AS courses FROM junk_courses GROUP BY status ORDER BY status;

-- 2. What is attached. None of it is touched by the archive; listed so the scale
--    of what a DELETE would have taken is on the record.
SELECT
  (SELECT count(*) FROM enrollments e WHERE e.course_id IN (SELECT id FROM junk_courses)) AS enrollments,
  (SELECT count(*) FROM certificates ce WHERE ce.enrollment_id IN
     (SELECT id FROM enrollments WHERE course_id IN (SELECT id FROM junk_courses)))       AS certificates,
  (SELECT count(*) FROM progress_events pe WHERE pe.enrollment_id IN
     (SELECT id FROM enrollments WHERE course_id IN (SELECT id FROM junk_courses)))       AS progress_events;

-- 3. PROOF OF SAFETY: every course that stays PUBLISHED after this runs. Read it
--    before committing. If something you care about is missing, stop.
SELECT t.slug AS tenant, c.title
FROM courses c
JOIN tenants t ON t.id = c.tenant_id
WHERE c.status = 'published'
  AND c.id NOT IN (SELECT id FROM junk_courses)
ORDER BY t.slug, c.title;

-- ── THE WRITE ─────────────────────────────────────────────────────────────────

UPDATE courses
SET status = 'archived', updated_at = now()
WHERE id IN (SELECT id FROM junk_courses)
  AND status <> 'archived';

-- What the storefront will show afterwards. Expect exactly the one real demo
-- course, and the outdure academy unchanged.
SELECT t.slug AS tenant, count(*) AS published_courses
FROM courses c
JOIN tenants t ON t.id = c.tenant_id
WHERE c.status = 'published'
GROUP BY t.slug
ORDER BY t.slug;

-- NOTE: this UPDATE does not go through the audit helper, because it is a
-- one-off run by hand rather than an application mutation. If an audit row is
-- wanted for it, add one manually — audit_log is hash-chained and append-only,
-- so it cannot be back-filled later.

-- Change to COMMIT when the output above is right. As shipped this changes nothing.
ROLLBACK;
