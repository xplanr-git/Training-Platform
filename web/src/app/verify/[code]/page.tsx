import { StatusBadge } from '@/components/ui/badge';
import {
  db,
  eq,
  certificates,
  certificateTemplates,
  enrollments,
  courses,
  tenants,
  users,
} from '@training-platform/db';
import { PrintButton } from '@/components/print-button';
import { env } from '@/lib/env';

/**
 * Public certificate verification. Shared route (not rewritten per host).
 * Renders a branded, printable certificate using the tenant's template design
 * and confirms authenticity, issue date, and revocation.
 */
export default async function VerifyCertificate({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  // Host for the printed "check it here" line. Deliberately not absoluteUrl(),
  // which throws in production on a loopback origin — correct for an email, but it
  // would take the whole certificate down rather than degrade one line.
  const verifyHost = env.appOrigin().replace(/^https?:\/\//, '');

  const [cert] = await db
    .select({
      tenantId: certificates.tenantId,
      issuedAt: certificates.issuedAt,
      revokedAt: certificates.revokedAt,
      courseTitle: courses.title,
      tenantName: tenants.name,
      learnerName: users.name,
    })
    .from(certificates)
    .innerJoin(enrollments, eq(enrollments.id, certificates.enrollmentId))
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(tenants, eq(tenants.id, enrollments.tenantId))
    .innerJoin(users, eq(users.id, enrollments.userId))
    .where(eq(certificates.verificationCode, code))
    .limit(1);

  if (!cert) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-14">
        <div className="rounded-(--radius-card) border border-border bg-surface p-8 text-center">
          <h1 className="text-xl">Certificate not found</h1>
          <p className="mt-2 text-muted">
            No certificate matches this code. Check it against the certificate — copying and pasting
            the whole link is surest.
          </p>
        </div>
      </main>
    );
  }

  const [tpl] = await db
    .select({ design: certificateTemplates.design })
    .from(certificateTemplates)
    .where(eq(certificateTemplates.tenantId, cert.tenantId))
    .limit(1);
  const design = (tpl?.design ?? {}) as {
    title?: string;
    signatory?: string;
    accentColor?: string;
  };
  /*
   * The DEFAULT was #2563eb — the retired brand blue — so every tenant that has
   * not chosen an accent was printing a blue-framed certificate under a
   * monochrome system. Ink is the default now; a tenant's own accentColor still
   * wins, which is the point of the field.
   *
   * A literal rather than a token because this value crosses into `style` and
   * into print, where a CSS custom property is not guaranteed to resolve. It is
   * --color-foreground; the two must be changed together.
   */
  const accent = design.accentColor || '#1b1b1e';
  const heading = design.title || 'Certificate of Completion';

  return (
    <main
      data-print-certificate
      className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-14"
    >
      {/*
        `print:hidden` used to sit on this whole row. PrintButton already carries its
        own, so the only thing the row's rule actually hid was the STATUS BADGE — and
        for a revoked certificate that badge is the warning. A printed revocation
        should be unmissable, so the badge now prints when revoked and is hidden only
        when it says "Valid certificate", which is a screen affordance rather than
        part of the document.
      */}
      <div className="flex items-center justify-between">
        <StatusBadge
          tone={cert.revokedAt ? 'red' : 'green'}
          className={cert.revokedAt ? 'print:border print:border-status-red' : 'print:hidden'}
        >
          {cert.revokedAt ? 'Revoked' : 'Valid certificate'}
        </StatusBadge>
        {!cert.revokedAt && <PrintButton />}
      </div>

      <article
        className="rounded-(--radius-card) bg-card px-10 py-14 text-center sm:px-16"
        style={{ border: `3px solid ${accent}` }}
      >
        {/* A kicker above the real heading — the sanctioned use of an eyebrow,
            and the size/weight sb specifies for one (11/700). This is the issuer. */}
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
          {cert.tenantName}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight" style={{ color: accent }}>
          {heading}
        </h1>
        {/* A short, symmetric accent rule under the title — a deliberate certificate
            device, centred, not the lonely part-width divider it replaces. */}
        <span
          aria-hidden="true"
          className="mx-auto mt-5 block h-[2px] w-12"
          style={{ backgroundColor: accent }}
        />

        <p className="mt-10 text-sm text-muted">This certifies that</p>
        {/* The recipient's name is the point of a certificate, so it is the hero —
            the largest, heaviest element, above the title in visual weight. Ink, not
            accent: a pale tenant accent must never cost the name its legibility. */}
        <p className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          {cert.learnerName || '—'}
        </p>
        <p className="mt-8 text-sm text-muted">has successfully completed</p>
        <p className="mt-3 text-xl font-semibold text-foreground">{cert.courseTitle}</p>

        {cert.revokedAt && (
          <p className="mt-10 text-sm font-semibold text-destructive">
            This certificate was revoked on{' '}
            <span className="tabular-nums">
              {new Date(cert.revokedAt).toLocaleDateString()}
            </span>
            .
          </p>
        )}

        {/* Issued date: a single centred line, tabular figures. No signature rule —
            a line above a printed date reads as somewhere to sign, which it is not. */}
        <p className="mt-12 text-sm text-muted">
          Issued <span className="tabular-nums text-foreground">{new Date(cert.issuedAt).toLocaleDateString()}</span>
        </p>

        {/* A signatory DOES sign, so it keeps the ruled line — centred, so the
            composition stays balanced whether or not a signatory is configured. */}
        {design.signatory && (
          <div className="mx-auto mt-10 w-56">
            <p className="border-t border-keyline pt-2 text-sm font-medium text-foreground">
              {design.signatory}
            </p>
            <p className="mt-0.5 text-xs text-muted">Signatory</p>
          </div>
        )}

        {/*
          The verification code lives INSIDE the certificate, and prints.
          It used to sit outside the <article> carrying `print:hidden`, and there is
          no @media print block anywhere to put it back — so printing, or "Save as
          PDF" on a phone, produced a certificate with no code and no verify URL on
          it. An unverifiable certificate defeats the only purpose this page has, and
          Save-as-PDF is exactly how a contractor keeps a copy to show a client.

          Sans + tabular, not font-mono: the spec rejects robot-monospace, and the
          code is not transformed (case included) because /verify matches it verbatim.
        */}
        <div className="mt-12 border-t border-border pt-5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
            Verification code
          </p>
          <p className="mt-1.5 select-all break-all text-sm tabular-nums tracking-wide text-foreground">
            {code}
          </p>
          <p className="mt-2 text-xs text-muted">
            Verify at {verifyHost}/verify
          </p>
        </div>
      </article>
    </main>
  );
}
