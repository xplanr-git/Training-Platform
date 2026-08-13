import { BrandMark } from '@/components/brand-mark';

/**
 * The brand block above the auth cards. One component because the same
 * four-line masthead was copy-pasted across login, forgot, set-password and
 * auth-code-error — so its drift multiplied by four: an off-ramp 18px
 * wordmark (which outweighed the page's own 16px title) and an off-scale
 * 10px gap.
 *
 * Metrics are the system's brandlogo slot: wordmark 15/800 (`[data-brandlogo]
 * .word`), gap-2 against the DS's 9px. The mark stays the Structure Build
 * placeholder until official Outdure artwork lands (decision D1).
 */
export function AuthMasthead() {
  return (
    <div className="flex items-center gap-2">
      <BrandMark size={36} />
      <span className="text-h3 font-extrabold">Outdure Academy</span>
    </div>
  );
}
