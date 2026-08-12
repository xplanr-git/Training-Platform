import { describe, it, expect } from 'vitest';
import { extractVerificationCode } from '../../src/lib/verification-code';

const CODE = 'b5db6cf7-435e-4bc9-a61f-0cf6a7aaf3f4';

describe('verification code lookup accepts what people actually paste', () => {
  it('takes a bare code unchanged', () => {
    expect(extractVerificationCode(CODE)).toBe(CODE);
  });

  it('does not change case — /verify/:code matches verbatim', () => {
    // The certificate prints the code untransformed for exactly this reason.
    expect(extractVerificationCode('AbCdEf-123')).toBe('AbCdEf-123');
  });

  it('pulls the code out of a pasted verify URL', () => {
    for (const input of [
      `https://training.structurebuild.co/verify/${CODE}`,
      `http://localhost:3010/verify/${CODE}`,
      `training.structurebuild.co/verify/${CODE}`,
      `/verify/${CODE}`,
    ]) {
      expect(extractVerificationCode(input), input).toBe(CODE);
    }
  });

  it('survives a trailing slash, a query string and a fragment', () => {
    // All three arrive routinely from an email client or a QR scanner.
    expect(extractVerificationCode(`https://x.co/verify/${CODE}/`)).toBe(CODE);
    expect(extractVerificationCode(`https://x.co/verify/${CODE}?utm_source=email`)).toBe(CODE);
    expect(extractVerificationCode(`https://x.co/verify/${CODE}#top`)).toBe(CODE);
  });

  it('trims the whitespace a copy-paste drags along', () => {
    expect(extractVerificationCode(`  ${CODE}\n`)).toBe(CODE);
  });

  it('rejects rather than half-parses anything with inner whitespace', () => {
    // Guessing here would send the reader to a confident "Certificate not found",
    // which is a worse answer than "enter the code".
    expect(extractVerificationCode('not a code')).toBeNull();
    expect(extractVerificationCode('see https://x.co/verify/abc for details')).toBeNull();
  });

  it('returns null for empty and missing input', () => {
    expect(extractVerificationCode('')).toBeNull();
    expect(extractVerificationCode('   ')).toBeNull();
    expect(extractVerificationCode(null)).toBeNull();
    expect(extractVerificationCode(undefined)).toBeNull();
  });

  it('treats the URL printed on the certificate as "no code given"', () => {
    /*
     * The certificate footer prints "Verify at <host>/verify" — no code. That is the
     * most likely thing to be pasted, and its last path segment is "verify". Left
     * unhandled it redirects to /verify/verify and answers a sincere "is this real?"
     * with "Certificate not found", which is worse than asking again.
     */
    expect(extractVerificationCode('training.structurebuild.co/verify')).toBeNull();
    expect(extractVerificationCode('https://training.structurebuild.co/verify/')).toBeNull();
    expect(extractVerificationCode('/verify')).toBeNull();
    expect(extractVerificationCode('VERIFY')).toBeNull();
  });
});
