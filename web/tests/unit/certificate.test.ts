import { describe, it, expect } from 'vitest';
import { buildCredential } from '@/lib/certificate';

describe('buildCredential', () => {
  const cred = buildCredential({
    verificationCode: 'abc-123',
    learnerName: 'Ada Lovelace',
    learnerEmail: 'ada@example.com',
    courseTitle: 'Intro to Safety',
    tenantName: 'Acme Academy',
    issuedAt: '2026-07-04T00:00:00.000Z',
    verifyUrl: 'https://acme.app/verify/abc-123',
  });

  it('is a W3C VC / Open Badges credential', () => {
    expect(cred.type).toContain('VerifiableCredential');
    expect(cred.type).toContain('OpenBadgeCredential');
    expect(cred['@context']).toContain('https://www.w3.org/ns/credentials/v2');
  });

  it('embeds issuer, subject, and achievement', () => {
    expect(cred.issuer.name).toBe('Acme Academy');
    expect(cred.credentialSubject.name).toBe('Ada Lovelace');
    expect(cred.credentialSubject.identifier).toBe('ada@example.com');
    expect(cred.credentialSubject.achievement.name).toBe('Completion: Intro to Safety');
    expect(cred.id).toBe('https://acme.app/verify/abc-123');
    expect(cred.validFrom).toBe('2026-07-04T00:00:00.000Z');
  });

  it('omits identifier when no email is present', () => {
    const anon = buildCredential({
      verificationCode: 'x',
      learnerName: 'No Email',
      learnerEmail: null,
      courseTitle: 'C',
      tenantName: 'T',
      issuedAt: '2026-01-01T00:00:00.000Z',
      verifyUrl: 'https://t.app/verify/x',
    });
    expect(anon.credentialSubject.identifier).toBeUndefined();
  });
});
