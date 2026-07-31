import 'server-only';
import { Resend } from 'resend';
import { env } from '@/lib/env';

/**
 * Transactional email via Resend. No-ops (logs) when RESEND_API_KEY is unset so
 * the app runs without email credentials in dev. Sends never throw into the
 * calling flow — callers wrap in try/catch and treat email as best-effort.
 */
async function send(to: string, subject: string, html: string): Promise<void> {
  const key = env.resendApiKey();
  if (!key) {
    console.log(`[email:skipped] to=${to} subject="${subject}" (no RESEND_API_KEY)`);
    return;
  }
  const resend = new Resend(key);
  await resend.emails.send({ from: env.emailFrom(), to, subject, html });
}

function layout(body: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0a0a0a">
    ${body}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
    <p style="font-size:12px;color:#6b7280">Sent by Outdure Academy.</p>
  </div>`;
}

export async function sendWelcomeEmail(to: string, name: string, tenantName: string, adminUrl: string) {
  await send(
    to,
    `Welcome to ${tenantName}`,
    layout(`<h2>Welcome, ${name}!</h2>
      <p>Your academy <strong>${tenantName}</strong> is ready.</p>
      <p><a href="${adminUrl}">Open your admin dashboard →</a></p>`),
  );
}

export async function sendInviteEmail(to: string, tenantName: string, inviteUrl: string) {
  await send(
    to,
    `You've been invited to ${tenantName}`,
    layout(`<h2>You're invited</h2>
      <p>You've been invited to join <strong>${tenantName}</strong>.</p>
      <p><a href="${inviteUrl}">Accept your invitation →</a></p>`),
  );
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await send(
    to,
    'Reset your password',
    layout(`<h2>Reset your password</h2>
      <p>Choose a new password using the link below. It works once and expires shortly.</p>
      <p><a href="${resetUrl}">Choose a new password →</a></p>
      <p style="font-size:12px;color:#6b7280">If you didn't request this, you can ignore
      this email — nothing has changed.</p>`),
  );
}

export async function sendEnrollmentEmail(to: string, courseTitle: string, learnUrl: string) {
  await send(
    to,
    `You're enrolled: ${courseTitle}`,
    layout(`<h2>You're enrolled</h2>
      <p>You now have access to <strong>${courseTitle}</strong>.</p>
      <p><a href="${learnUrl}">Start learning →</a></p>`),
  );
}

export async function sendCertificateEmail(
  to: string,
  courseTitle: string,
  verifyUrl: string,
) {
  await send(
    to,
    `Your certificate for ${courseTitle}`,
    layout(`<h2>Congratulations!</h2>
      <p>You've completed <strong>${courseTitle}</strong> and earned a certificate.</p>
      <p><a href="${verifyUrl}">View &amp; verify your certificate →</a></p>`),
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
      <p>Thank you for your purchase of <strong>${courseTitle}</strong>.</p>
      <p>Amount: ${currency} ${amount}</p>`),
  );
}
