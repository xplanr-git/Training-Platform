import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { CourseComplete } from '@/components/course-complete';

afterEach(cleanup);

const CODE = 'b5db6cf7-435e-4bc9-a61f-0cf6a7aaf3f4';
const ISSUED = new Date('2026-08-11T00:00:00Z');
const REVOKED = new Date('2026-08-12T00:00:00Z');

describe('CourseComplete tells the truth about the credential', () => {
  it('offers the certificate when one is held', () => {
    render(
      <CourseComplete
        courseTitle="Outdure Deck Frame Installation"
        verificationCode={CODE}
        issuedAt={ISSUED}
        revokedAt={null}
        reviewHref="/learn/x/1"
      />,
    );

    expect(screen.getByRole('link', { name: /view your certificate/i }).getAttribute('href')).toBe(
      `/verify/${CODE}`,
    );
    // The code itself is the point — a third party can check it without an account.
    expect(screen.getByText(CODE)).toBeTruthy();
    expect(screen.getByText(/11 August 2026/)).toBeTruthy();
  });

  it('does NOT claim a revoked certificate is held', () => {
    /*
     * The defect: neither learner surface filtered on revokedAt, so an admin could
     * withdraw a credential and this panel kept congratulating the learner and kept
     * offering the button. They found out only when someone else checked the code.
     */
    render(
      <CourseComplete
        courseTitle="Outdure Deck Frame Installation"
        verificationCode={CODE}
        issuedAt={ISSUED}
        revokedAt={REVOKED}
        reviewHref="/learn/x/1"
      />,
    );

    expect(screen.queryByRole('link', { name: /view your certificate/i })).toBeNull();
    expect(screen.getByText(/withdrawn on/i)).toBeTruthy();
    expect(screen.getByText(/12 August 2026/)).toBeTruthy();
    // Still reachable: /verify states the withdrawal, and the learner is entitled
    // to see exactly what a third party sees.
    expect(
      screen.getByRole('link', { name: /see the certificate status/i }).getAttribute('href'),
    ).toBe(`/verify/${CODE}`);
  });

  it('admits it when a certificate is expected but missing', () => {
    render(
      <CourseComplete
        courseTitle="Outdure Deck Frame Installation"
        verificationCode={null}
        issuedAt={null}
        revokedAt={null}
        reviewHref={null}
      />,
    );

    expect(screen.getByText(/has not been issued yet/i)).toBeTruthy();
    expect(screen.queryByRole('link', { name: /view your certificate/i })).toBeNull();
  });

  it('does not report a failure for a course that awards no certificate', () => {
    /*
     * The defect: certificateEnabled is a first-class toggle ("Turn off for courses
     * that don't award one") and finalizeCourseCompletion honours it by creating no
     * certificate row — but this panel never read the column, so it read the absence
     * as a failed issuance and told the learner to contact an administrator who then
     * had nothing to fix. A working configuration generated guaranteed support load.
     */
    render(
      <CourseComplete
        courseTitle="Toolbox Talk"
        verificationCode={null}
        issuedAt={null}
        revokedAt={null}
        certificateEnabled={false}
        reviewHref="/learn/x/1"
      />,
    );

    expect(screen.queryByText(/has not been issued yet/i)).toBeNull();
    expect(screen.queryByText(/administrator/i)).toBeNull();
    expect(screen.getByText(/does not award a certificate/i)).toBeTruthy();
  });

  it('still reports a genuine issuance failure when the course does award one', () => {
    // The opt-out must not swallow the real error case it sits next to.
    render(
      <CourseComplete
        courseTitle="Outdure Deck Frame Installation"
        verificationCode={null}
        issuedAt={null}
        revokedAt={null}
        certificateEnabled={true}
        reviewHref={null}
      />,
    );

    expect(screen.getByText(/has not been issued yet/i)).toBeTruthy();
  });

  it('treats a revoked flag with no code as no certificate at all', () => {
    // Defensive: revokedAt without a verificationCode is not a real state, and must
    // not render a link to /verify/null.
    render(
      <CourseComplete
        courseTitle="X"
        verificationCode={null}
        issuedAt={null}
        revokedAt={REVOKED}
        reviewHref={null}
      />,
    );

    expect(screen.getByText(/has not been issued yet/i)).toBeTruthy();
    expect(screen.queryByText(/verify\/null/)).toBeNull();
  });
});
