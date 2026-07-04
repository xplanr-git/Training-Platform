/**
 * W3C Verifiable Credential (Open Badges 3.0-style) payload for a course
 * completion. Cryptographic signing (@digitalbazaar/vc) is a post-MVP add;
 * the public verification URL is the MVP acceptance.
 */
export function buildCredential(input: {
  verificationCode: string;
  learnerName: string;
  learnerEmail: string | null;
  courseTitle: string;
  tenantName: string;
  issuedAt: string;
  verifyUrl: string;
}) {
  return {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
    ],
    id: input.verifyUrl,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { type: ['Profile'], name: input.tenantName },
    validFrom: input.issuedAt,
    credentialSubject: {
      type: ['AchievementSubject'],
      identifier: input.learnerEmail ?? undefined,
      name: input.learnerName,
      achievement: {
        type: ['Achievement'],
        name: `Completion: ${input.courseTitle}`,
        description: `Awarded for completing ${input.courseTitle}.`,
      },
    },
  };
}
