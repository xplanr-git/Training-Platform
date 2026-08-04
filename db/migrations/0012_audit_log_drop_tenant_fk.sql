-- Custom SQL migration file, put your code below! --

-- Supersedes the approach in 0011, which did not work.
--
-- 0011 changed audit_log.tenant_id from ON DELETE CASCADE to SET NULL to stop a
-- tenant delete cascading into the append-only log. But SET NULL is an UPDATE,
-- and the same trigger (audit_log_no_update) rejects UPDATE as well as DELETE —
-- so the tenant delete still aborted, just with a different message. Any
-- referential action on this column is blocked by construction.
--
-- Drop the foreign key instead. tenant_id stays as a plain uuid, retaining which
-- academy each entry belonged to; it simply stops being enforced against a live
-- tenants row. For an append-only historical record that is the correct trade:
-- the log describes something that happened, and it must survive the deletion of
-- its subject without being rewritten.
--
-- This is the same resolution migration 0009 applied to
-- progress_events.lesson_id, where ON DELETE SET NULL tripped that table's
-- append-only trigger and made a completed lesson undeletable. Same collision,
-- same fix.
--
-- Consequence to be aware of: reads that join audit_log to tenants must tolerate
-- a tenant_id with no matching row. Nothing reads audit_log today (there is no
-- Activity Log screen yet), so whatever builds that screen must LEFT JOIN and
-- render a deleted academy gracefully.

alter table public.audit_log
  drop constraint if exists audit_log_tenant_id_tenants_id_fk;
