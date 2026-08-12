import Link from 'next/link';
import { Award, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateLong } from '@/lib/format-date';

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
 * Body copy is `text-foreground-2` (sb's --text-2), not `text-muted`. The panel
 * used to sit on the pale-blue brand-50 tint, where muted grey measured 4.38:1
 * and failed AA — it passes on white at 4.63:1, which is how that went unnoticed.
 * The fill is now sunken grey, where muted measures 4.70:1 and technically
 * passes, but only just; --text-2 clears it at 8.34:1 and is the token this copy
 * should have been using all along. The lesson that outlasts the palette: measure
 * body copy against the panel's OWN fill, never against the page.
 */
export function CourseComplete({
  courseTitle,
  verificationCode,
  issuedAt,
  revokedAt,
  certificateEnabled,
  reviewHref,
}: {
  courseTitle: string;
  /** Null when the course is complete but no certificate row exists. */
  verificationCode: string | null;
  issuedAt: Date | null;
  /** Set once an admin withdraws the credential. Reversible — see setCertificateRevoked. */
  revokedAt?: Date | null;
  /**
   * The course's `certificateEnabled` column. False means no certificate was ever
   * meant to exist, so a missing one is the configured outcome, not a failure.
   * Defaults true to match the column default.
   */
  certificateEnabled?: boolean;
  reviewHref: string | null;
}) {
  const revoked = Boolean(verificationCode && revokedAt);
  const awardsCertificate = certificateEnabled !== false;

  return (
    <section
      aria-labelledby="course-complete-heading"
      className="bg-sunken rounded-(--radius-card) px-5 py-5"
    >
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius-card)"
        >
          <Award className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 id="course-complete-heading" className="text-h2 font-bold">
            Course complete
          </h2>

          {revoked ? (
            /*
              Revoked. This panel used to render the happy path regardless, so a
              learner whose credential had been withdrawn was still told they had
              earned it and still handed a "View your certificate" button. They
              found out only when someone else checked the code.

              The code stays visible and the link stays live: /verify states the
              withdrawal and its date, and hiding it would leave the learner unable
              to see what a third party sees. What changes is that nothing here
              claims they hold it.
            */
            <>
              <p className="mt-1 text-sm leading-relaxed text-foreground-2">
                You finished {courseTitle}, but the certificate issued for it was withdrawn on{' '}
                {formatDateLong(revokedAt)}. Your academy administrator can tell you why, and can
                reinstate it.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/verify/${verificationCode}`}>See the certificate status</Link>
                </Button>
                {reviewHref ? (
                  <Button asChild size="sm" variant="ghost">
                    <Link href={reviewHref}>Review the course</Link>
                  </Button>
                ) : null}
              </div>
            </>
          ) : verificationCode ? (
            <>
              <p className="mt-1 text-sm leading-relaxed text-foreground-2">
                You finished {courseTitle}
                {issuedAt ? (
                  <>, and your certificate was issued on {formatDateLong(issuedAt)}</>
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

              <div className="mt-4 border-t border-keyline pt-3">
                <p className="flex items-center gap-1.5 text-meta font-semibold text-foreground">
                  <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                  Verification code
                </p>
                <p className="mt-1 select-all break-all text-meta text-foreground-2 tabular-nums">
                  {verificationCode}
                </p>
                <p className="mt-1.5 text-meta leading-relaxed text-foreground-2">
                  Anyone you share this with can check the certificate without signing in.
                </p>
              </div>
            </>
          ) : !awardsCertificate ? (
            /*
              The course opted out of certificates (courses.certificateEnabled =
              false, "Turn off for courses that don't award one"), and
              finalizeCourseCompletion honours that by creating no certificate row.

              This panel used to read the missing row as a failure and tell the
              learner to contact an administrator — who then had nothing to fix.
              A working configuration was generating guaranteed support load, and
              telling every learner of such a course that the platform had failed
              them. Say the course is finished, name why there is no certificate so
              the absence is not a mystery, and stop.
            */
            <>
              <p className="mt-1 text-sm leading-relaxed text-foreground-2">
                You finished {courseTitle}. This course does not award a certificate, so there is
                nothing further to collect.
              </p>
              {reviewHref ? (
                <div className="mt-4">
                  <Button asChild size="sm" variant="outline">
                    <Link href={reviewHref}>Review the course</Link>
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            /*
              Complete, the course DOES award a certificate, but no row exists.
              Reachable if issuance failed after the enrolment was already marked
              completed. Saying "here is your certificate" and linking nowhere would
              be worse than admitting it.
            */
            <>
              <p className="mt-1 text-sm leading-relaxed text-foreground-2">
                You finished {courseTitle}. Your certificate has not been issued yet — if it does
                not appear shortly, contact your academy administrator and mention this course.
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
