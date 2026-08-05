import Link from 'next/link';
import { Award, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * What the learner sees the moment they finish a course.
 *
 * Completing a course issued a certificate, advanced their Connect tier and sent
 * them an email — and showed them nothing. The last click redirected to the
 * outline, which said "100% complete" and offered a "Review course" button, so the
 * one moment worth marking looked identical to any other visit.
 *
 * The verification code is the part that earns its place here rather than being
 * left to the email: a contractor showing a client their credential needs a code
 * the client can check without an account, and until now the only copy of it was
 * in an email they may have deleted.
 *
 * Deliberately does NOT name a designation ("Trained", "Certified"). What the
 * credential is *called* is an open decision (see the backlog), and the
 * certificate page derives its own heading from the tenant's template. Asserting
 * a name here would quietly pre-empt that and could contradict the certificate
 * itself.
 *
 * Body copy is `text-neutral-700`, not `text-muted`: muted grey on the brand-50
 * tint is 4.38:1, which fails WCAG AA for normal text. On white it passes at
 * 4.63:1, which is how it went unnoticed.
 */
export function CourseComplete({
  courseTitle,
  verificationCode,
  issuedAt,
  reviewHref,
}: {
  courseTitle: string;
  /** Null when the course is complete but no certificate row exists. */
  verificationCode: string | null;
  issuedAt: Date | null;
  reviewHref: string | null;
}) {
  return (
    <section
      aria-labelledby="course-complete-heading"
      className="rounded-(--radius-card) border border-brand-100 bg-brand-50 px-5 py-5"
    >
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"
        >
          <Award className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 id="course-complete-heading" className="text-base font-semibold">
            Course complete
          </h2>

          {verificationCode ? (
            <>
              <p className="mt-1 text-sm leading-relaxed text-neutral-700">
                You finished {courseTitle}
                {issuedAt ? (
                  <>
                    , and your certificate was issued on{' '}
                    {issuedAt.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </>
                ) : null}
                . A copy is in your email too.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button asChild size="sm">
                  <Link href={`/verify/${verificationCode}`}>View your certificate</Link>
                </Button>
                {reviewHref ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={reviewHref}>Review the course</Link>
                  </Button>
                ) : null}
              </div>

              <div className="mt-4 border-t border-brand-100 pt-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-brand-700">
                  <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                  Verification code
                </p>
                <p className="mt-1 select-all break-all font-mono text-xs text-neutral-700">
                  {verificationCode}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-700">
                  Anyone you share this with can check the certificate without signing in.
                </p>
              </div>
            </>
          ) : (
            /*
              Complete, but no certificate row. Reachable if issuance failed after
              the enrolment was already marked completed. Saying "here is your
              certificate" and linking nowhere would be worse than admitting it.
            */
            <>
              <p className="mt-1 text-sm leading-relaxed text-neutral-700">
                You finished {courseTitle}. Your certificate has not been issued yet — if it
                does not appear shortly, contact your academy administrator and mention this
                course.
              </p>
              {reviewHref ? (
                <div className="mt-4">
                  <Button asChild size="sm" variant="outline">
                    <Link href={reviewHref}>Review the course</Link>
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
