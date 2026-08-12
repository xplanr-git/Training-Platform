import 'server-only';
import { Resend } from 'resend';
import { env } from '@/lib/env';

/**
 * Transactional email via Resend. No-ops (logs) when RESEND_API_KEY is unset so
 * the app runs without email credentials in dev.
 *
 * Sends DO throw on failure. Callers wrap in try/catch and treat email as
 * best-effort, but the throw is what makes the failure observable: the Resend
 * SDK returns `{ data, error }` and does NOT throw on an API error, so the
 * previous `await resend.emails.send(...)` swallowed every rejection. A wrong
 * from-address (403 "domain is not verified") produced a silent no-op while the
 * UI reported the invitation as sent — and the invite link is only ever
 * delivered by email, so that was unrecoverable.
 */

/**
 * Escapes text interpolated into an HTML email.
 *
 * Required, not cosmetic: the academy name is set by a tenant admin
 * (updateSchoolSettings) and anyone can self-provision a tenant at /signup. Raw
 * interpolation turned invites into a relay for attacker-authored HTML sent from
 * the platform's DKIM-signed domain — good enough to phish, and enough to get
 * the Resend account suspended, which would take down every other email.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Strips anything markup-like from a subject line and collapses whitespace. */
function plainSubject(value: string): string {
  return value
    .replace(/[<>\r\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const key = env.resendApiKey();
  if (!key) {
    console.log(`[email:skipped] to=${to} subject="${subject}" (no RESEND_API_KEY)`);
    return;
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: env.emailFrom(),
    to,
    subject: plainSubject(subject),
    html,
  });
  if (error) {
    // Include the from-address: a mismatch with the verified Resend domain is
    // by far the most common cause and is invisible otherwise.
    throw new Error(
      `Resend rejected the message (from=${env.emailFrom()}, to=${to}): ${error.message}`,
    );
  }
}

function layout(body: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1b1b1e">
    ${body}
    <hr style="border:none;border-top:1px solid #efefed;margin:24px 0"/>
    <p style="font-size:12px;color:#6a6b70">Sent by Outdure Academy.</p>
  </div>`;
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  tenantName: string,
  adminUrl: string,
) {
  const tenant = escapeHtml(tenantName);
  await send(
    to,
    `Welcome to ${tenantName}`,
    layout(`<h2>Welcome, ${escapeHtml(name)}!</h2>
      <p>Your academy <strong>${tenant}</strong> is ready.</p>
      <p><a href="${escapeHtml(adminUrl)}">Open your admin dashboard →</a></p>`),
  );
}

export async function sendInviteEmail(to: string, tenantName: string, inviteUrl: string) {
  const tenant = escapeHtml(tenantName);
  await send(
    to,
    `You've been invited to ${tenantName}`,
    layout(`<h2>You're invited</h2>
      <p>You've been invited to join <strong>${tenant}</strong>.</p>
      <p><a href="${escapeHtml(inviteUrl)}">Accept your invitation →</a></p>`),
  );
}

/**
 * Sent when an admin ACCEPTS a request someone made at /join.
 *
 * Distinct from sendInviteEmail on purpose. An accepted request is the opposite
 * direction of travel from an invitation: this person already has an account,
 * already chose a password at /join, and already asked. Sending them "You've been
 * invited to X — Accept your invitation →" told them to accept something they had
 * initiated, and pointed at a step they had already completed. The most likely
 * reading is that the first attempt failed and this is a second one.
 *
 * The link is a plain sign-in, not a set-password token, which is exactly why the
 * invitation wording did not fit it.
 */
export async function sendJoinAcceptedEmail(to: string, tenantName: string, signInUrl: string) {
  const tenant = escapeHtml(tenantName);
  await send(
    to,
    `You're in — ${tenantName}`,
    layout(`<h2>Your request was accepted</h2>
      <p>An administrator has accepted your request to join <strong>${tenant}</strong>.
      Sign in with the password you chose and your courses will be waiting.</p>
      <p><a href="${escapeHtml(signInUrl)}">Sign in →</a></p>`),
  );
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await send(
    to,
    'Reset your password',
    layout(`<h2>Reset your password</h2>
      <p>Choose a new password using the link below. It works once and expires shortly.</p>
      <p><a href="${escapeHtml(resetUrl)}">Choose a new password →</a></p>
      <p style="font-size:12px;color:#6a6b70">If you didn't request this, you can ignore
      this email — nothing has changed.</p>`),
  );
}

export async function sendEnrollmentEmail(to: string, courseTitle: string, learnUrl: string) {
  const course = escapeHtml(courseTitle);
  await send(
    to,
    `You're enrolled: ${courseTitle}`,
    layout(`<h2>You're enrolled</h2>
      <p>You now have access to <strong>${course}</strong>.</p>
      <p><a href="${escapeHtml(learnUrl)}">Start learning →</a></p>`),
  );
}

export async function sendCertificateEmail(to: string, courseTitle: string, verifyUrl: string) {
  const course = escapeHtml(courseTitle);
  await send(
    to,
    `Your certificate for ${courseTitle}`,
    layout(`<h2>Your certificate is ready</h2>
      <p>You've completed <strong>${course}</strong> and earned a certificate.</p>
      <p><a href="${escapeHtml(verifyUrl)}">View &amp; verify your certificate →</a></p>`),
  );
}

export async function sendReceiptEmail(
  to: string,
  courseTitle: string,
  amount: string,
  currency: string,
) {
  await send(
    to,
    `Receipt: ${courseTitle}`,
    layout(`<h2>Payment received</h2>
      <p>Thank you for your purchase of <strong>${escapeHtml(courseTitle)}</strong>.</p>
      <p>Amount: ${escapeHtml(currency)} ${escapeHtml(amount)}</p>`),
  );
}
