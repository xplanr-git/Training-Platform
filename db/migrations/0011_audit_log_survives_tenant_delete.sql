-- Custom SQL migration file, put your code below! --

-- FIX: a tenant could never be deleted at all.
--
-- audit_log.tenant_id cascaded from tenants, but audit_log carries an
-- append-only trigger that rejects DELETE. So `delete from tenants` cascaded
-- into audit_log, the trigger raised, and the whole transaction aborted with
-- "audit_log is append-only; DELETE is not permitted". /platform could suspend a
-- tenant but nothing could remove one, and 22 empty test tenants were stuck.
--
-- SET NULL is the right resolution rather than relaxing the trigger:
--
--   * The column is already nullable, and actor_user_id already uses SET NULL
--     for exactly this reason — the log outlives the actor it names. The tenant
--     should behave the same way.
--   * An append-only audit log that is destroyed along with its subject is not
--     much of an audit log. Retaining the history is the stronger guarantee, and
--     the row keeps its action, resource ids, before/after payload and hash.
--   * The hash chain is untouched: only tenant_id is nulled, and it is not part
--     of the hashed payload.
--
-- NOT addressed here, deliberately: progress_events has the same collision — it
-- cascades from tenants AND from enrollments while its own trigger rejects
-- DELETE. That is why "Delete course" fails for any course a learner has
-- generated activity against. Fixing it means deciding whether progress_events
-- should permit DELETE at all, which has GDPR-erasure implications (a subject
-- deletion request requires being able to remove their progress) and is a
-- design decision, not a cleanup detail. The 22 tenants removed after this
-- migration have zero progress_events, so it does not block them.

alter table public.audit_log
  drop constraint if exists audit_log_tenant_id_tenants_id_fk;

alter table public.audit_log
  add constraint audit_log_tenant_id_tenants_id_fk
  foreign key (tenant_id) references public.tenants(id) on delete set null;
