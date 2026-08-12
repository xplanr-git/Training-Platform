import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const nav = readFileSync(join(process.cwd(), 'src/components/nav-form.tsx'), 'utf8');

/**
 * Every admin mutation confirms through NavForm. It must use the kit's accessible
 * AlertDialog, never window.confirm — which is off-brand, not theme-aware, and
 * silently returns false once the browser blocks repeat dialogs, after which a
 * quiet form's action never fires and it reads as "delete is broken".
 */
describe('NavForm confirms through the accessible dialog', () => {
  it('does not call window.confirm', () => {
    // The call, not the prose: the comment above onSubmit names window.confirm to
    // explain why it is gone, so match the invocation.
    expect(nav).not.toMatch(/window\.confirm\(/);
  });

  it('gates submission behind the AlertDialog and defers the action to confirm', () => {
    expect(nav).toMatch(/from '@\/components\/ui\/alert-dialog'/);
    expect(nav).toMatch(/<AlertDialog\b/);
    expect(nav).toMatch(/<AlertDialogAction\b/);
    // The confirm branch opens the dialog and runs the action from onConfirm,
    // rather than synchronously — the whole point of an async dialog.
    expect(nav).toMatch(/setConfirmOpen\(true\)/);
    expect(nav).toMatch(/onClick=\{onConfirm\}/);
  });
});
