import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Normalise line endings — a CRLF checkout has silently defeated a guard here before. */
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

const ACTIONS = read('src/app/t/[slug]/admin/courses/[courseId]/builder/actions.ts');
const CONTROLS = read('src/components/reorder-controls.tsx');

/** The body of a top-level exported function, up to the next export. */
function body(src: string, name: string): string {
  const start = src.indexOf(`export async function ${name}(`);
  expect(start, `${name} not found`).toBeGreaterThan(-1);
  const after = src.indexOf('\nexport ', start + 1);
  return src.slice(start, after === -1 ? undefined : after);
}

describe('a position swap reads and writes in one locked transaction', () => {
  // A swap is read-modify-write. With the read outside the transaction there is a
  // gap: two overlapping calls both read the pre-swap positions, so the second
  // re-applies the swap the first already committed — two clicks, one move — and
  // two moves in different directions can leave two rows sharing a position, after
  // which list order is whatever Postgres happens to return.
  for (const fn of ['moveSection', 'moveLesson']) {
    describe(fn, () => {
      const src = body(ACTIONS, fn);

      it('opens the transaction before reading', () => {
        const tx = src.indexOf('db.transaction(');
        const select = src.indexOf('.select(');
        expect(tx, 'no transaction').toBeGreaterThan(-1);
        expect(select, 'no read').toBeGreaterThan(-1);
        expect(tx, 'the read must happen INSIDE the transaction that writes').toBeLessThan(select);
      });

      it('reads through the transaction handle, not the pooled db', () => {
        // `db.select()` inside a `db.transaction()` block silently runs on a
        // DIFFERENT connection, outside the transaction — so it compiles, looks
        // transactional, and locks nothing.
        expect(src).toMatch(/await tx\s*\n?\s*\.select\(/);
        const inside = src.slice(src.indexOf('db.transaction('));
        expect(inside).not.toMatch(/await db\s*\n?\s*\.select\(/);
      });

      it('locks the rows it is about to reorder', () => {
        expect(src, "add .for('update') or concurrent moves interleave").toContain("for('update')");
      });
    });
  }

  // NOT asserted here: that drizzle's `.for('update')` really emits FOR UPDATE.
  // It does — rendering the exact query with toSQL() gives
  //   … order by "lessons"."position" asc for update
  // but drizzle-orm is a dependency of the `db` workspace, not of `web`, so
  // importing the query builder here would mean pinning its version in a second
  // place. Re-run the render by hand after a drizzle upgrade.
});

describe('reorder controls tell you the click landed', () => {
  it('shows a spinner on the pressed direction', () => {
    // The previous feedback was a 16px ghost icon fading to 60% opacity, which
    // flickers past on a fast connection and reads as nothing on a slow one.
    expect(CONTROLS).toMatch(/animate-spin/);
    expect(CONTROLS).toMatch(/movingDir === 'up' \?/);
    expect(CONTROLS).toMatch(/movingDir === 'down' \?/);
  });

  it('disables BOTH directions while a move is in flight, not just the pressed one', () => {
    // Two NavForms each disabled only themselves, so the opposite chevron stayed
    // live during the round trip — the exact way to provoke two interleaved moves.
    const disables = [...CONTROLS.matchAll(/disabled=\{([^}]*)\}/g)].map((m) => m[1]);
    expect(disables.length, 'expected an up and a down button').toBe(2);
    for (const d of disables) {
      expect(d, `"${d}" must include the shared busy flag`).toContain('busy');
    }
  });

  it('announces the move, since a reorder is silent to a screen reader', () => {
    expect(CONTROLS).toMatch(/aria-live="polite"/);
    expect(CONTROLS).toMatch(/sr-only/);
  });

  it('surfaces a failure instead of leaving the row looking merely unmoved', () => {
    expect(CONTROLS).toMatch(/role="alert"/);
    expect(CONTROLS).toMatch(/catch/);
  });

  it('the builder uses the component rather than raw NavForm chevrons', () => {
    const builder = read('src/app/t/[slug]/admin/courses/[courseId]/builder/page.tsx');
    expect(builder).toContain('<ReorderControls');
    expect(builder, 'move actions must go through ReorderControls').not.toMatch(
      /NavForm action=\{move(Section|Lesson)/,
    );
  });
});
