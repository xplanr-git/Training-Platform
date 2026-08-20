import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The sentinel messages that Server Action guards throw and NavForm's friendly()
 * turns into human copy must come from ONE source (lib/action-errors). Before,
 * the throw sites and the matcher held the literals independently, so renaming a
 * sentinel silently degraded the message to the generic fallback with no type
 * error and no failing test. This reads the source so that regression fails CI.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

const SENTINELS = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'TENANT_NOT_FOUND',
  'TENANT_INACTIVE',
  'VIEW_AS_READONLY',
  'ENROLLMENT_NOT_FOUND',
  'LESSON_NOT_FOUND',
] as const;

describe('action error sentinels are single-sourced', () => {
  it('the module defines every sentinel', () => {
    const src = read('src/lib/action-errors.ts');
    for (const k of SENTINELS) {
      expect(src, `${k} missing from action-errors`).toMatch(new RegExp(`${k}:`));
    }
  });

  it('the tenant guards throw the constant, not a re-typed literal', () => {
    const src = read('src/lib/tenant.ts');
    expect(src).toMatch(/from '@\/lib\/action-errors'/);
    // No hand-typed sentinel literals left to drift out of sync with friendly().
    expect(src).not.toMatch(
      /throw new Error\('(UNAUTHENTICATED|FORBIDDEN|TENANT_NOT_FOUND|TENANT_INACTIVE)'\)/,
    );
    expect(src.match(/throw new Error\(ActionError\./g)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });

  it('the view-as and learner guards use the constant', () => {
    expect(read('src/lib/view-as.ts')).toMatch(/throw new Error\(ActionError\.VIEW_AS_READONLY\)/);
    const learn = read('src/app/t/[slug]/learn/[courseSlug]/actions.ts');
    expect(learn).toMatch(/ActionError\.ENROLLMENT_NOT_FOUND/);
    expect(learn).toMatch(/ActionError\.LESSON_NOT_FOUND/);
  });

  it('friendly() matches against every constant (single-sourced in action-errors)', () => {
    // friendly()/isFrameworkNavigation() live in action-errors alongside the
    // sentinels so the copy and the constants cannot drift apart, and so both
    // client forms (NavForm and QuizForm) share ONE implementation.
    const src = read('src/lib/action-errors.ts');
    expect(src).toMatch(/export function friendly/);
    expect(src).toMatch(/export function isFrameworkNavigation/);
    for (const k of SENTINELS) {
      expect(src, `friendly must reference ActionError.${k}`).toMatch(
        new RegExp(`ActionError\\.${k}`),
      );
    }
  });

  it('both client forms import the shared error helpers', () => {
    for (const p of ['src/components/nav-form.tsx', 'src/components/quiz-form.tsx']) {
      const src = read(p);
      expect(src, `${p} must import from action-errors`).toMatch(/from '@\/lib\/action-errors'/);
      expect(src, `${p} must re-throw framework navigation`).toMatch(/isFrameworkNavigation/);
    }
  });
});
