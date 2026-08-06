import {
  test,
  expect,
  requireRlsProbeTarget,
  learnerAccessToken,
  RLS_PROBE_URL,
  RLS_PROBE_ANON_KEY,
} from './fixtures';

/**
 * Regression probes for the PostgREST privilege-escalation hole closed by
 * migration 0014_close_postgrest_write_surface.sql.
 *
 * Before 0014, migration 0001 applied one `for all` policy to sixteen domain
 * tables — scoped by TENANT but not by ROLE — and granted
 * `insert, update, delete on all tables in schema public to authenticated`.
 * Since the anon key ships in the client bundle by design and PostgREST is a
 * public endpoint, any learner with a valid session could skip the application
 * entirely and mutate the database directly. Most damagingly:
 *
 *   PATCH /rest/v1/memberships?user_id=eq.<self>  { "role": "platform_admin" }
 *
 * These are ATTACKS, executed with nothing but a learner's own credentials and
 * the public anon key — exactly what an attacker has. Each one must now fail.
 *
 * They deliberately go straight to the REST API rather than through the app: the
 * app was never the weak point (requireAdmin / requireAdminForSlug guard every
 * admin path, and authz-conventions.test.ts fails CI if a guard is dropped). The
 * boundary under test is the database's.
 *
 * SAFETY: requireRlsProbeTarget() skips unless ALLOW_LIVE_WRITES=1 AND a
 * dedicated RLS_PROBE_SUPABASE_URL is set AND that URL differs from the project
 * the app is configured against. See fixtures.ts.
 */

requireRlsProbeTarget();

/** Headers for a PostgREST call authenticated as the seeded learner. */
function authed(token: string, extra: Record<string, string> = {}) {
  return {
    apikey: RLS_PROBE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

const rest = (path: string) => `${RLS_PROBE_URL}/rest/v1/${path}`;

/**
 * A write is "denied" when PostgREST refuses it outright. With the table grant
 * revoked that is 401/403 (`permission denied for table …`, SQLSTATE 42501); if
 * a grant were ever restored, the role-gated policy would produce 403 instead.
 * Both are acceptable — 2xx is not.
 */
async function expectDenied(res: { status(): number; text(): Promise<string> }, what: string) {
  const status = res.status();
  const body = await res.text();
  expect(status, `${what} was NOT denied — status ${status}, body: ${body}`).toBeGreaterThanOrEqual(
    400,
  );
  expect(status, `${what} failed for the wrong reason (server error): ${body}`).toBeLessThan(500);
}

test.describe('a learner cannot escalate or forge through PostgREST', () => {
  test('1. cannot promote themselves to platform_admin', async ({ request }) => {
    const token = await learnerAccessToken(request);

    // Read the caller's own membership first. SELECT is still granted — the fix
    // removes writes, not reads — so this doubles as proof the learner really
    // does hold a live session against a reachable project.
    const before = await request.get(rest('memberships?select=id,role,user_id'), {
      headers: authed(token),
    });
    expect(before.status(), await before.text()).toBe(200);
    const rows = (await before.json()) as Array<{ id: string; role: string }>;
    expect(rows.length, 'seeded learner has no membership to attack').toBeGreaterThan(0);
    const target = rows[0];
    expect(target.role, 'the seeded probe account must be a learner').toBe('learner');

    const attack = await request.patch(rest(`memberships?id=eq.${target.id}`), {
      headers: authed(token, { Prefer: 'return=representation' }),
      data: { role: 'platform_admin' },
    });
    await expectDenied(attack, 'self-promotion to platform_admin');

    // Belt: a PATCH matching zero rows returns 200 with `[]`, which would pass a
    // status check while the hole was still open on some other predicate. Assert
    // the stored role is genuinely unchanged.
    const after = await request.get(rest(`memberships?id=eq.${target.id}&select=role`), {
      headers: authed(token),
    });
    expect((await after.json())[0].role).toBe('learner');
  });

  test('2. cannot forge a certificate that /verify would render as valid', async ({ request }) => {
    const token = await learnerAccessToken(request);
    const enrollmentId = await firstEnrollmentId(request, token);

    const attack = await request.post(rest('certificates'), {
      headers: authed(token, { Prefer: 'return=representation' }),
      data: {
        tenant_id: await tenantId(request, token),
        enrollment_id: enrollmentId ?? crypto.randomUUID(),
        verification_code: `forged-${crypto.randomUUID()}`,
      },
    });
    await expectDenied(attack, 'forging a certificate');
  });

  test('3. cannot self-enrol and bypass Stripe', async ({ request }) => {
    const token = await learnerAccessToken(request);
    const tid = await tenantId(request, token);

    const courses = await request.get(rest('courses?select=id&limit=1'), {
      headers: authed(token),
    });
    const courseId = ((await courses.json()) as Array<{ id: string }>)[0]?.id;

    const attack = await request.post(rest('enrollments'), {
      headers: authed(token, { Prefer: 'return=representation' }),
      data: {
        tenant_id: tid,
        user_id: await userId(request, token),
        course_id: courseId ?? crypto.randomUUID(),
        source: 'purchase',
      },
    });
    await expectDenied(attack, 'self-enrolment without payment');
  });

  test('4. cannot read the answer key, but can still read the question', async ({ request }) => {
    const token = await learnerAccessToken(request);

    const attack = await request.get(rest('quiz_questions?select=id,correct&limit=1'), {
      headers: authed(token),
    });
    await expectDenied(attack, 'reading quiz_questions.correct');

    // Positive control. Without this the test would also pass if 0014 had
    // revoked SELECT on the whole table — a different outcome that would break
    // any future browser-side quiz renderer. The restriction must be the single
    // `correct` column, not the table.
    const allowed = await request.get(rest('quiz_questions?select=id,prompt,options&limit=1'), {
      headers: authed(token),
    });
    expect(allowed.status(), await allowed.text()).toBe(200);
  });

  test('5. cannot self-complete a course by writing a progress event', async ({ request }) => {
    const token = await learnerAccessToken(request);
    const enrollmentId = await firstEnrollmentId(request, token);

    // Note this uses the learner's OWN enrolment — the ownership predicate in
    // 0014 passes here by design. What denies it is the revoked INSERT grant.
    // That distinction is the whole reason the grant revoke had to accompany the
    // policy change: an ownership check alone would not have closed this.
    const attack = await request.post(rest('progress_events'), {
      headers: authed(token, { Prefer: 'return=representation' }),
      data: {
        tenant_id: await tenantId(request, token),
        enrollment_id: enrollmentId ?? crypto.randomUUID(),
        event_type: 'completed',
      },
    });
    await expectDenied(attack, 'self-completing a course');
  });

  test('6. cannot write a forged entry into the audit log', async ({ request }) => {
    const token = await learnerAccessToken(request);

    // The hash-chain trigger would have chained a forged row exactly as it
    // chains a genuine one, making it indistinguishable after the fact.
    const attack = await request.post(rest('audit_log'), {
      headers: authed(token, { Prefer: 'return=representation' }),
      data: {
        tenant_id: await tenantId(request, token),
        action: 'membership.role_change',
        resource_type: 'membership',
        resource_id: crypto.randomUUID(),
        hash: '',
      },
    });
    await expectDenied(attack, 'forging an audit-log entry');
  });
});

/* ── Small readers, all using still-granted SELECT ────────────────────────── */

async function tenantId(request: Parameters<typeof learnerAccessToken>[0], token: string) {
  const res = await request.get(rest('memberships?select=tenant_id&limit=1'), {
    headers: authed(token),
  });
  return ((await res.json()) as Array<{ tenant_id: string }>)[0]?.tenant_id;
}

async function userId(request: Parameters<typeof learnerAccessToken>[0], token: string) {
  const res = await request.get(rest('memberships?select=user_id&limit=1'), {
    headers: authed(token),
  });
  return ((await res.json()) as Array<{ user_id: string }>)[0]?.user_id;
}

async function firstEnrollmentId(
  request: Parameters<typeof learnerAccessToken>[0],
  token: string,
): Promise<string | undefined> {
  const res = await request.get(rest('enrollments?select=id&limit=1'), { headers: authed(token) });
  if (res.status() !== 200) return undefined;
  return ((await res.json()) as Array<{ id: string }>)[0]?.id;
}
