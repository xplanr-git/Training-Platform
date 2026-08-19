import Link from 'next/link';
import { Award, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/share-button';
import { ConfidenceCheck, type ConfidenceInput } from '@/components/confidence-check';
import { FOLLOWUP_REASONS } from '@/lib/confidence';

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
  reviewHref,
  inviteHref = null,
  confidenceAction = null,
}: {
  courseTitle: string;
  /** Null when the course is complete but no certificate row exists. */
  verificationCode: string | null;
  issuedAt: Date | null;
  reviewHref: string | null;
  /** Public course/landing path to share when inviting a colleague. */
  inviteHref?: string | null;
  /**
   * Bound server action for the post-training confidence question. Optional so
   * the panel still renders (e.g. in preview) without it. NEVER gates anything —
   * the course is already complete when this shows.
   */
  confidenceAction?: ((input: ConfidenceInput) => Promise<{ ok: true } | { error: string }>) | null;
}) {
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

          {verificationCode ? (
            <>
              <p className="mt-1 text-sm leading-relaxed text-foreground-2">
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

              <div className="mt-4 border-t border-keyline pt-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                  Verification code
                </p>
                <p className="mt-1 select-all break-all text-xs text-foreground-2 tabular-nums">
                  {verificationCode}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground-2">
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

          {/* Outcome check — readiness, not satisfaction. Voluntary, and it can
              never change the result the learner just earned. */}
          {confidenceAction ? (
            <div className="mt-5 border-t border-border pt-4">
              <ConfidenceCheck
                prompt="After this training, how confident are you installing QwickBuild on a real project?"
                helpText="Optional — this won’t change your result."
                action={confidenceAction}
                followup={{
                  prompt: 'What would help you feel more confident?',
                  reasons: FOLLOWUP_REASONS,
                }}
                ackText="Thanks — that helps us support you and improve the training."
              />
            </div>
          ) : null}

          {/* Referral — the strongest proactive moment (§16), kept subordinate to
              the credential. Native share / copy link; no incentive. */}
          {inviteHref ? (
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-sm text-foreground-2">
                Know another installer who’d find this useful?
              </p>
              <div className="mt-2.5">
                <ShareButton
                  path={inviteHref}
                  title="Outdure Academy"
                  text="I’ve been doing the Outdure Installer Training — thought this might be useful for you."
                  label="Invite a colleague"
                  variant="action"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
