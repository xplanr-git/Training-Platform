/**
 * The first tabbable element on a screen whose navigation comes before its
 * content in the DOM.
 *
 * Visually hidden until focused, then revealed by `.skip-link:focus` in
 * globals.css — verified working in a real browser with a real Tab press (139×41,
 * position: fixed, top-left, with the focus ring). It is worth saying how that was
 * verified: a programmatic `element.focus()` does NOT match `:focus` when the
 * document itself lacks window focus, so an automated check that focuses the link
 * and measures it reports a 1×1 box and looks exactly like a broken skip link. Test
 * this with a real key press or not at all.
 *
 * Placed on surfaces where the nav is long enough that skipping it matters. The
 * lesson player is the clearest case — the entire course outline sits in an
 * `<aside>` before `<main>`, so on a twenty-lesson course a keyboard learner tabs
 * twenty links to reach the video they opened.
 *
 * The target must carry `id={targetId}`.
 */
export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a href={`#${targetId}`} className="sr-only skip-link">
      Skip to content
    </a>
  );
}
