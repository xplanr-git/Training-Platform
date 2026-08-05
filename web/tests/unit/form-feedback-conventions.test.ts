import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every form that invokes a Server Action must go through NavForm.
 *
 * A bare `<form action={serverAction}>` gives no feedback and swallows failures:
 * the page looks identical whether the action succeeded, failed, or never ran.
 * That produced a real incident — a course was saved five times in seventy
 * seconds because each successful save was silent, and the reporter reasonably
 * concluded the button was broken.
 *
 * NavForm supplies the three things a bare form cannot: an in-flight disable, a
 * "Saved." confirmation, and a readable message when the action throws.
 *
 * Exempt: `method="get"` (a search/navigation form, no mutation) and client
 * components using `onSubmit` (they own their own pending and error state).
 */
const APP = join(process.cwd(), 'src/app');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.tsx')) out.push(full);
  }
  return out;
}

/** Opening `<form …>` tags, including ones whose attributes span lines. */
function formTags(src: string): string[] {
  const tags: string[] = [];
  let i = src.indexOf('<form');
  while (i !== -1) {
    const end = src.indexOf('>', i);
    if (end === -1) break;
    tags.push(src.slice(i, end + 1));
    i = src.indexOf('<form', end);
  }
  return tags;
}

describe('server-action forms all route through NavForm', () => {
  const files = walk(APP);

  it('finds the app tree', () => {
    expect(files.length).toBeGreaterThan(15);
  });

  it('no page invokes a Server Action from a bare <form>', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      for (const tag of formTags(src)) {
        if (tag.includes('method="get"')) continue; // search / navigation
        if (tag.includes('onSubmit')) continue; // client-managed
        if (!tag.includes('action=')) continue; // not an action form
        offenders.push(
          `${file.replace(process.cwd(), '').replace(/\\/g, '/')} — ${tag
            .replace(/\s+/g, ' ')
            .slice(0, 70)}`,
        );
      }
    }
    expect(
      offenders,
      `use <NavForm> so failures and successes are visible:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});

describe('NavForm feedback contract', () => {
  const src = readFileSync(join(process.cwd(), 'src/components/nav-form.tsx'), 'utf8').replace(
    /\r\n/g,
    '\n',
  );

  it('reports in flight, on success and on failure', () => {
    expect(src).toMatch(/Saving…/);
    expect(src).toMatch(/Saved\./);
    expect(src).toMatch(/aria-live="polite"/);
  });

  it('disables its controls while the action runs, to stop double submits', () => {
    // A fieldset is the only way to disable a submit button this component never
    // renders itself — children are arbitrary.
    expect(src).toMatch(/<fieldset[\s\S]{0,120}disabled=\{pending\}/);
  });

  it('never suppresses errors, even when quiet', () => {
    // `quiet` hides the success line for self-evident actions (reorder, delete).
    // Hiding an error would recreate the original bug.
    expect(src).toMatch(/\{pending && !quiet/);
    expect(src).toMatch(/\{saved && !pending && !quiet/);
    const errorLine = src.slice(src.indexOf('{error &&'));
    expect(errorLine.slice(0, 80)).not.toMatch(/quiet/);
  });

  it('lets framework navigation propagate', () => {
    // redirect()/notFound() from an action throw a digest-carrying error. Catching
    // it would strand the user on the page they were being moved off.
    expect(src).toMatch(/isFrameworkNavigation\(err\)\) throw err/);
  });
});
