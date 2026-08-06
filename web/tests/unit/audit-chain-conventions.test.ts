import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Architectural fitness test for the audit log's tamper-evidence.
 *
 * audit_log exists to be EVIDENCE — CLAUDE.md §7.11 routes every mutation on
 * tenants, memberships, roles, courses, enrollments and certificates through it,
 * for SOC 2 and for the accreditation audits customers pass using exported
 * platform evidence. Before migration 0015 it was append-only but not reliably
 * tamper-evident, and db/README.md claimed hash-chain integrity "passes" while
 * no verifier existed anywhere in the repo.
 *
 * Three defects, all locked out here:
 *
 *  1. The chain FORKED under concurrency. The trigger read its predecessor with
 *     no lock, so two transactions committing at once both chained onto the same
 *     row. And `occurred_at` defaults to now() = TRANSACTION START, so chain
 *     order did not match commit order even when serialised.
 *  2. NO CANONICALISATION. Fields were concatenated with no delimiter, so
 *     action='course.up' + resource_type='date' hashed identically to
 *     action='course.update' + resource_type='' — a forgeable collision.
 *  3. id, ip and user_agent were NOT HASHED — exactly the provenance fields an
 *     attacker rewrites to move blame onto another actor or address.
 *
 * This reads the migration SQL directly, because none of it is reachable from
 * TypeScript. It is a source check, not an execution check: it cannot prove the
 * SQL runs, only that the properties it must have are present.
 */

const MIGRATIONS = join(process.cwd(), '../db/migrations');

/** Strips `--` line comments so assertions test SQL, not the prose explaining it. */
function stripComments(sql: string): string {
  return sql
    .split(/\r?\n/)
    .map((l) => l.replace(/--.*$/, ''))
    .join('\n');
}

function migrationsContaining(needle: string): string[] {
  return readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .filter((f) => readFileSync(join(MIGRATIONS, f), 'utf8').includes(needle));
}

/** The newest migration defining a given object, comments stripped. */
function latestDefining(needle: string): string {
  const files = migrationsContaining(needle);
  expect(files.length, `no migration defines ${needle}`).toBeGreaterThan(0);
  return stripComments(readFileSync(join(MIGRATIONS, files[files.length - 1]), 'utf8'));
}

describe('the hash chain cannot fork', () => {
  const sql = latestDefining('function public.audit_log_hash_chain');

  it('takes a per-tenant advisory lock', () => {
    expect(sql).toMatch(/pg_advisory_xact_lock\(/);
    // Per tenant, not global: a single global lock would serialise every audit
    // write on the platform behind one another.
    expect(sql).toMatch(/hashtext\('audit_log:'/);
  });

  it('takes it BEFORE reading the predecessor, which is the whole point', () => {
    const lock = sql.indexOf('pg_advisory_xact_lock');
    const read = sql.indexOf('from audit_log a');
    expect(lock).toBeGreaterThan(-1);
    expect(read).toBeGreaterThan(-1);
    expect(lock, 'the lock must precede the predecessor read').toBeLessThan(read);
  });

  it('orders the chain by seq, never by occurred_at', () => {
    // occurred_at is now() = transaction start, so it is not commit order. Under
    // the advisory lock, seq is.
    expect(sql).toMatch(/order by a\.seq desc/);
    expect(sql, 'occurred_at must not decide chain position').not.toMatch(
      /order by a\.occurred_at/,
    );
  });
});

describe('the hashed payload is canonical and complete', () => {
  const sql = latestDefining('function public.audit_log_canonical');

  it('is built as a jsonb object, not bare concatenation', () => {
    expect(sql).toMatch(/jsonb_build_object\(/);
  });

  it('hashes every field, including the provenance ones that were omitted', () => {
    for (const field of [
      'prev_hash',
      'id',
      'seq',
      'tenant_id',
      'actor_user_id',
      'action',
      'resource_type',
      'resource_id',
      'before',
      'after',
      'ip', // was excluded
      'user_agent', // was excluded
      'occurred_at',
    ]) {
      expect(sql, `${field} is not in the canonical payload`).toMatch(new RegExp(`'${field}',`));
    }
  });

  it('renders occurred_at in explicit UTC, not a timezone-dependent cast', () => {
    // ::text on a timestamptz formats using the session TimeZone GUC, so a
    // verifier run in another timezone would recompute different hashes and
    // report an intact chain as forged.
    expect(sql).toMatch(/at time zone 'UTC'/);
    expect(sql).not.toMatch(/p_occurred_at::text/);
  });

  it('the trigger and the verifier share this one definition', () => {
    // If they each built their own string, editing one would report the whole
    // chain as forged — a false alarm indistinguishable from a real one.
    const chain = latestDefining('function public.audit_log_hash_chain');
    const verifier = latestDefining('function public.verify_audit_chain');
    expect(chain).toMatch(/public\.audit_log_canonical\(/);
    expect(verifier).toMatch(/public\.audit_log_canonical\(/);
  });

  it('the old delimiter-free concatenation is gone', () => {
    // Defect 2's exact shape was a local `canonical` built by chained ||:
    //   canonical := coalesce(prev, '') || coalesce(NEW.tenant_id::text, '') || …
    // Matched on the assignment, not on '||' alone — the advisory-lock key
    // legitimately concatenates ('audit_log:' || tenant_id) and an over-broad
    // pattern flagged it.
    const chain = latestDefining('function public.audit_log_hash_chain');
    expect(chain).not.toMatch(/canonical\s*:=/);
    expect(chain).not.toMatch(/declare[\s\S]*canonical text;/);
  });
});

describe('the chain can actually be checked', () => {
  const sql = latestDefining('function public.verify_audit_chain');

  it('exists and is callable per tenant', () => {
    // A tamper-evident log with no verifier is unfalsifiable in both directions:
    // nobody can show tampering, and nobody can show its absence — which is the
    // claim an audit needs.
    expect(sql).toMatch(/create or replace function public\.verify_audit_chain\(tenant uuid\)/);
  });

  it('checks the link and the contents as separate findings', () => {
    expect(sql).toMatch(/broken link/);
    expect(sql).toMatch(/do not match its hash/);
  });

  it('reports pre-0015 rows as unverifiable rather than as tampered', () => {
    // Rows hashed by the old algorithm cannot be recomputed, and rewriting them
    // is exactly what this table forbids. Flagging them as forged, or silently
    // skipping them, would each mislead an auditor in a different direction.
    expect(sql).toMatch(/hash_version = 2/);
    expect(sql).toMatch(/not verifiable/);
  });

  it('is not executable by learners or anonymous callers', () => {
    const migration = latestDefining('function public.verify_audit_chain');
    expect(migration).toMatch(
      /revoke execute on function public\.verify_audit_chain\(uuid\) from public, anon, authenticated/,
    );
  });
});

describe('TRUNCATE cannot empty an append-only table', () => {
  const sql = latestDefining('function public.forbid_truncate');

  it('guards both append-only tables at STATEMENT level', () => {
    // forbid_mutation is FOR EACH ROW, and TRUNCATE fires no row triggers — so
    // `truncate audit_log` erased the whole log without raising. `authenticated`
    // cannot truncate, but the app's own DATABASE_URL role owns these tables and
    // can.
    for (const table of ['audit_log', 'progress_events']) {
      expect(sql, `${table} has no truncate guard`).toMatch(
        new RegExp(`before truncate on public\\.${table}`),
      );
    }
    expect(sql).toMatch(/for each statement execute function public\.forbid_truncate/);
  });
});

describe('the audit helper still leaves the chain to the database', () => {
  const helper = readFileSync(join(process.cwd(), '../db/audit.ts'), 'utf8');

  it('never sets prev_hash, and passes hash only as the placeholder the trigger overwrites', () => {
    expect(helper).not.toMatch(/prevHash:/);
    expect(helper).toMatch(/hash: ''/);
  });

  it('records ip and user_agent, which are now part of the hash', () => {
    expect(helper).toMatch(/ip: entry\.ip/);
    expect(helper).toMatch(/userAgent: entry\.userAgent/);
  });
});
