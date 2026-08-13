'use client';

import { NavForm } from '@/components/nav-form';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { stopViewAs } from '@/lib/view-as-actions';

const ROLE_LABEL: Record<string, string> = {
  learner: 'learner',
  instructor: 'instructor',
  company_admin: 'admin',
  platform_admin: 'platform admin',
};

/**
 * The unmissable, always-present marker that the current view is an admin looking
 * through a member's eyes — read-only — with a one-click way out. Rendered by the
 * tenant layout whenever a view-as session is active, so it shows on every page.
 */
export function ViewAsBanner({ name, role }: { name: string; role: string }) {
  return (
    // The Callout owns the amber tone — this banner used to hand-copy the tone
    // strings character for character, plus a THIRD amber (border /50) on its
    // button. Only the banner shape is local: full-bleed, sticky, bottom
    // hairline only.
    <Callout
      role="status"
      tone="amber"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-none border-0 border-b px-4 py-2 text-center"
    >
      <span>
        Viewing as <strong>{name}</strong> ({ROLE_LABEL[role] ?? role}) — read-only. Nothing you do
        is recorded as them.
      </span>
      <NavForm action={stopViewAs} quiet className="inline">
        <Button type="submit" size="sm" variant="outline" className="h-7">
          Exit
        </Button>
      </NavForm>
    </Callout>
  );
}
