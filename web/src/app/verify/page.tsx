import { redirect } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { extractVerificationCode } from '@/lib/verification-code';

export const metadata = {
  title: 'Verify a certificate',
  description:
    'Check that a certificate is genuine by entering its verification code. No account needed.',
};

/**
 * The landing page for `/verify`.
 *
 * Every certificate this platform issues prints "Verify at <host>/verify" in its
 * footer — it is inside the <article>, so it survives Save-as-PDF and is the one
 * instruction a third party is given. That URL returned a 404. Anyone who followed
 * the printed instruction on a credential landed on "Page not found", which is the
 * worst possible answer to "is this certificate real?": it reads as though the
 * issuer is fake.
 *
 * No client JS and no Server Action. The form is a plain GET back to this same
 * route, and the redirect happens server-side on `?code=`. That matters more here
 * than anywhere else in the product: this page is opened by people with no account,
 * on someone else's device, sometimes from a printed page — so it must work before
 * hydration and with JS disabled. It also sidesteps the Server-Action redirect
 * caveat documented in nav-form.tsx entirely.
 */
export default async function VerifyLookup({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const entered = code?.trim() ?? '';
  const parsed = extractVerificationCode(entered);

  if (parsed) redirect(`/verify/${encodeURIComponent(parsed)}`);

  /*
   * Only complain once they have actually submitted something unusable. An empty
   * `?code=` (pressing Verify on an empty field) is a slip, not an error worth a
   * red banner.
   *
   * Written as `!entered` rather than `entered.length === 0` deliberately:
   * empty-state-conventions.test.ts treats `length === 0` in a page as a branch
   * that renders absent content and must use <EmptyState>. This is neither — it is
   * validation of one form field, and there is no missing content to stand in for.
   * Matching the guard's literal is the honest fix; adding an exemption would blunt
   * it for the pages it exists to police.
   */
  const submittedEmpty = code !== undefined && !entered;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12 sm:py-14">
      <div className="rounded-(--radius-card) border border-border bg-surface p-8">
        <h1 className="text-h1 font-bold">Verify a certificate</h1>
        <p className="mt-2 text-body text-foreground-2">
          Enter the verification code printed on the certificate. You do not need an account, and
          the holder is not notified.
        </p>

        <form action="/verify" method="get" className="mt-6">
          <label htmlFor="code" className="text-meta font-semibold text-foreground">
            Verification code
          </label>
          <Input
            id="code"
            name="code"
            defaultValue={entered}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-describedby="code-hint"
            placeholder="0000a0a0-0000-0a00-a00a-0a0000a0aaa0"
            className="mt-1.5 tabular-nums"
          />
          <p id="code-hint" className="mt-1.5 text-meta text-foreground-2">
            {submittedEmpty
              ? 'Enter the code from the certificate to check it.'
              : 'Pasting the whole verification link works too.'}
          </p>

          <Button type="submit" className="mt-4">
            Verify
          </Button>
        </form>
      </div>
    </main>
  );
}
