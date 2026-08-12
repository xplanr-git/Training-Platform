/**
 * Normalises whatever someone pastes into the `/verify` lookup into a bare
 * verification code.
 *
 * Accepting a full URL is not a nicety. The certificate footer prints a code AND a
 * verify URL, and the not-found copy on `/verify/:code` explicitly tells people
 * "copying and pasting the whole link is surest" — so arriving with a URL in the
 * clipboard is the expected case. Taking the last path segment turns that into a
 * working lookup instead of a second failure on a page whose whole job is to answer
 * "is this certificate real?".
 *
 * Anything with whitespace inside it is rejected rather than half-parsed: a code
 * never contains a space, so a value that does is a sentence or a broken paste, and
 * guessing at it would send the reader to a confident "Certificate not found".
 */
export function extractVerificationCode(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let value = raw.trim();
  if (!value) return null;

  if (value.includes('/')) {
    // Drop any query string or fragment first, then take the last path segment —
    // trailing slashes and `?utm_...` both survive a copy-paste from an email.
    const path = value.split(/[?#]/)[0];
    const segments = path.split('/').filter(Boolean);
    value = segments[segments.length - 1] ?? '';
  }

  value = value.trim();
  if (!value || /\s/.test(value)) return null;

  /*
   * The single most likely paste is the string printed on the certificate itself —
   * "training.structurebuild.co/verify", with no code after it. The last segment of
   * that is "verify", which would redirect to /verify/verify and answer a sincere
   * "is this real?" with a confident "Certificate not found". Treat it as no code
   * given and leave the reader on the form. Codes are UUIDs, so this can never
   * shadow a real one.
   */
  if (value.toLowerCase() === 'verify') return null;

  return value;
}
