/**
 * Captures the admin/learner screens Craig asked for as PNGs, signed in as a real
 * admin.
 *
 * Authentication is a ONE-TIME magic link minted at run time from the service-role
 * key already in web/.env.local, redeemed through the app's own /auth/confirm
 * route. No password is typed, stored, or passed on the command line — the token
 * exists only inside this process and is single-use.
 *
 *   node scripts/capture-screens.mjs            (defaults to the local dev server)
 *   ACADEMY_URL=https://training.structurebuild.co node scripts/capture-screens.mjs
 *
 * Read-only: it navigates and screenshots. It never submits a form, never enrols,
 * never completes a lesson, and never touches a destructive control.
 *
 * PII: pages marked `redact` get every email address and every leading name cell
 * masked IN THE PAGE before the shot, so no learner name or address reaches a PNG.
 */
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

/** Minimal .env.local reader — avoids pulling in a dotenv dependency. */
async function loadEnv(file) {
  const out = {};
  const text = await readFile(file, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const envPath = path.resolve(process.cwd(), '.env.local');
const env = await loadEnv(envPath);

const BASE = (process.env.ACADEMY_URL ?? 'http://localhost:3010').replace(/\/$/, '');
const EMAIL = process.env.ACADEMY_EMAIL ?? 'stevie.van.heerden@outdure.com';
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(`NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing from ${envPath}`);
  process.exit(1);
}

/* Course + lesson ids on the live academy (read out of the database, not guessed). */
const TRAINED_INSTALLER = '401a9aff-58e8-4e79-942c-0795e89134c2';
const QUIZ_LESSON = '16cfc0a4-5ea7-40c8-b5ee-e52b981a253c'; // "QwickBuild - Quiz", EP 1
const DECK_FRAME_SLUG = 'outdure-deck-frame-installation';
const DECK_FRAME_LESSON = '773e77f4-204e-48d6-b8b7-57408e18d056';
const DECK_FRAME_QUIZ = '1a132a80-8e03-4e70-98c7-202dfc52229c'; // "Installation knowledge check"
const PEDESTAL_SLUG = 'outdure-pedestal-systems';
const PEDESTAL_TEXT_LESSON = 'b68b58d4-bb65-43c1-ac1a-9cac18fb2043'; // 1 of 5 → "Complete & continue"
const PEDESTAL_VIDEO_LESSON = '8045f757-3c25-4d13-bf6d-10e2bbe88d62'; // 5 of 5 → "Complete course"
/* Deliberately a TEST account's certificate, so no real learner's name is on the page
   even before the redaction pass runs. */
const TEST_CERTIFICATE_CODE = '95f50d87-3c82-4646-b6fe-a7800a702af7';

/** `--only=Name,Name` limits the run to named shots, leaving the rest on disk untouched. */
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : null;

const SHOTS = [
  { subject: 'Admin-Menu', url: '/admin', fullPage: false, note: 'Admin navigation — “Soon” items are not built' },
  { subject: 'Course-List', url: '/admin/courses', note: 'Every course, with status' },
  { subject: 'Course-Settings', url: `/admin/courses/${TRAINED_INSTALLER}`, note: 'Confers-tier + certificate settings' },
  {
    subject: 'Course-Structure',
    url: `/admin/courses/${TRAINED_INSTALLER}/builder`,
    maxHeight: 2000,
    note: 'Sections → lessons hierarchy (top of a 14-section course)',
  },
  { subject: 'Assessment-Settings', url: `/admin/courses/${TRAINED_INSTALLER}/builder/quiz/${QUIZ_LESSON}`, note: 'Pass threshold + attempts, question list' },
  { subject: 'Course-Outline-Learner', url: `/learn/${DECK_FRAME_SLUG}`, note: 'What a learner sees: outline + progress' },
  /* Pedestal Systems, not Deck Frame: the completion control only renders on an
     UNFINISHED lesson, and every Deck Frame lesson is already complete for this
     account — so that course could only ever show the "Completed" tick. */
  {
    subject: 'Lesson-Completion',
    url: `/learn/${PEDESTAL_SLUG}/${PEDESTAL_TEXT_LESSON}`,
    note: 'The completion control itself — a manual button, on an unfinished lesson',
  },
  {
    subject: 'Lesson-Completion-Video',
    url: `/learn/${PEDESTAL_SLUG}/${PEDESTAL_VIDEO_LESSON}`,
    note: 'The same control on a video lesson, active without the video having been played',
  },
  { subject: 'People', url: '/admin/people', redact: true, note: 'Roles + tier tag (names/emails masked)' },
  { subject: 'Insights', url: '/admin/analytics', note: 'The entire reporting surface' },
  { subject: 'Certificates', url: '/admin/certificates', redact: true, note: 'Issued certificates (names masked)' },
  { subject: 'Certificate-Verification', url: '/verify', note: 'Public verification entry point' },

  /* Second pass — the gaps against Craig's evidence table. Several of these exist to
     show that a screen does NOT exist, which is itself the answer. */
  {
    subject: 'Certificate-Issued',
    url: `/verify/${TEST_CERTIFICATE_CODE}`,
    redact: true,
    scrub: [
      // The recipient's name is a heading, not a table cell — the generic passes miss it.
      ['[data-print-certificate] p.text-4xl', '████████ ██████'],
      // Captured against the local dev server; show the address learners actually see.
      ['[data-print-certificate] p.text-meta', 'Verify at training.structurebuild.co/verify'],
    ],
    note: 'The certificate a learner actually receives, on its public verification page',
  },
  {
    subject: 'Quiz-As-Learner-Sees-It',
    url: `/learn/trained-installer-training/${QUIZ_LESSON}`,
    maxHeight: 1700,
    note: 'How questions are presented to a learner (admin preview of the draft course)',
  },
  {
    subject: 'Quiz-Passed-State',
    url: `/learn/${DECK_FRAME_SLUG}/${DECK_FRAME_QUIZ}`,
    note: 'What a learner sees after passing — no per-question feedback, no answers revealed',
  },
  /* '/', not '/courses' — there is no courses index route; the storefront home IS
     the catalogue. '/courses' 404s, and that 404 shipped as the "catalogue" shot. */
  { subject: 'Course-Catalogue', url: '/', note: 'Learners self-enrol from here; there is no admin-side enrol' },
  { subject: 'Academy-Settings', url: '/admin/settings', note: 'The entire configurable surface of the academy' },
  {
    subject: 'Roles-Not-Built',
    url: '/admin/coming-soon?feature=User%20Roles',
    fullPage: false,
    note: 'There is no roles management screen — the three roles are fixed in code',
  },
  {
    subject: 'Notifications-Not-Built',
    url: '/admin/coming-soon?feature=Email%20Templates',
    fullPage: false,
    note: 'No email template or notification screen exists',
  },
  {
    subject: 'Reporting-Not-Built',
    url: '/admin/coming-soon?feature=Training%20Matrix',
    fullPage: false,
    note: 'No training matrix, gradebook or scheduled report exists',
  },
  /* NOT '/dashboard': landAfterSignIn bounces an admin to /admin, so that URL
     screenshots the ADMIN dashboard while claiming to show the learner one — which
     is exactly the mislabelled shot this replaces. View-as is the only way an admin
     account can see the learner dashboard, so the capture goes through it (and the
     read-only banner it adds is explained in the page's caption). Kept LAST: the
     view-as cookie would otherwise leak into every later admin shot.
     The banner prints the viewed learner's NAME, which no generic pass masks —
     hence the scrub on the banner's <strong>. */
  {
    subject: 'Learner-Dashboard',
    viewAs: true,
    redact: true,
    scrub: [['[role="status"] strong', '████ ███████']],
    note: 'The learner dashboard, reached through read-only view-as',
  },
];

/** YYYY_MM_DD__HH_MM in local time, per the file-naming standard. */
function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}_${p(d.getMonth() + 1)}_${p(d.getDate())}__${p(d.getHours())}_${p(d.getMinutes())}`;
}

/**
 * Masks personal data in the live DOM before the shot.
 *
 * Two passes, because names and addresses appear differently: every text node is
 * scrubbed of anything matching an email address, then the first cell of each table
 * row (the name column on People and Certificates) is blanked outright.
 */
async function redactPII(page, { names = true, scrub = [] } = {}) {
  /* Per-shot replacements for personal data that isn't an email or a table cell —
     the certificate puts the recipient's name in a heading, which neither pass
     below would catch. Also used to swap the capture host for the real one. */
  for (const [selector, replacement] of scrub) {
    await page
      .evaluate(
        ([sel, text]) => {
          for (const el of document.querySelectorAll(sel)) el.textContent = text;
        },
        [selector, replacement],
      )
      .catch(() => {});
  }
  await page.evaluate((maskNames) => {
    const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      EMAIL.lastIndex = 0;
      if (EMAIL.test(n.nodeValue ?? '')) {
        EMAIL.lastIndex = 0;
        n.nodeValue = (n.nodeValue ?? '').replace(EMAIL, 'name.redacted@example.com');
      }
    }
    if (!maskNames) return;
    for (const row of document.querySelectorAll('tbody tr')) {
      const first = row.querySelector('td');
      if (first && first.textContent && first.textContent.trim()) {
        const holder = first.querySelector('.font-medium, a, span, div') ?? first;
        holder.textContent = '████ ███████';
      }
    }
    // The "Requests to join" list on People is a <ul>, not a table.
    for (const item of document.querySelectorAll('li p.font-medium')) {
      item.textContent = '████ ███████';
    }
  }, names);
}

/** Hides the Next.js dev-mode badge so a local capture looks like production. */
async function hideDevChrome(page) {
  await page
    .addStyleTag({
      content:
        'nextjs-portal, #__next-build-watcher, [data-nextjs-toast] { display: none !important; }',
    })
    .catch(() => {});
}

/**
 * Releases the admin shell's inner scroller so a full-page shot captures the whole
 * screen.
 *
 * The shell is a flex column with `main.overflow-y-auto`, so the DOCUMENT is only
 * ever one viewport tall. Playwright sizes a fullPage shot from the document, which
 * on the 14-section course builder produced a 15,000px canvas with ~1,200px of paint
 * on it and the rest blank — the content was inside a scroller that never moved.
 */
async function unlockScroll(page) {
  await page
    .addStyleTag({
      content: `
        html, body { height: auto !important; overflow: visible !important; }
        body > div, main { height: auto !important; max-height: none !important;
                           overflow: visible !important; }
        aside, nav { position: static !important; }
      `,
    })
    .catch(() => {});
  // Let the reflow settle before anything measures the page.
  await page.waitForTimeout(400);
}

const outDir = path.resolve(process.cwd(), '..', 'docs', 'screenshots');
// Second, smaller JPEG copy of each shot. The PNGs are the deliverable; these are
// what gets embedded in the shareable page, which has a hard 16MB ceiling and
// would blow through it on full-page PNGs of a 77-lesson course.
const webDir = path.join(outDir, '_web');
await mkdir(webDir, { recursive: true });
const when = stamp();

console.log(`Minting a one-time sign-in link for ${EMAIL} …`);
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data: link, error: linkError } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email: EMAIL,
});
if (linkError || !link?.properties?.hashed_token) {
  console.error(`Could not mint a sign-in link: ${linkError?.message ?? 'no token returned'}`);
  process.exit(1);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.5,
});
const page = await context.newPage();

const confirmUrl =
  `${BASE}/auth/confirm?token_hash=${encodeURIComponent(link.properties.hashed_token)}` +
  `&type=magiclink&next=${encodeURIComponent('/admin')}`;
await page.goto(confirmUrl, { waitUntil: 'networkidle', timeout: 45_000 });

if (new URL(page.url()).pathname.startsWith('/auth/auth-code-error')) {
  console.error('The sign-in link was rejected. Is ACADEMY_URL pointing at the right deployment?');
  await browser.close();
  process.exit(1);
}
console.log(`Signed in (${page.url()}).\n`);

const written = [];
for (const shot of SHOTS.filter((s) => !ONLY || ONLY.has(s.subject))) {
  const file = path.join(outDir, `Outdure-Academy-${shot.subject}_Screenshot_${when}.png`);
  try {
    if (shot.viewAs) {
      /* Enter view-as through the UI, exactly as an admin would: People → the
         learner row's "View as". The action redirects to the learner dashboard. */
      await page.goto(`${BASE}/admin/people`, { waitUntil: 'networkidle', timeout: 60_000 });
      /* 'Verified' — the learner's tier tag — is the one string unique to the
         learner row. NOT 'Learner': every row's role <select> contains a Learner
         OPTION, so hasText:'Learner' matches the first admin row and view-as lands
         on the wrong person entirely. */
      await page
        .locator('tbody tr', { hasText: 'Verified' })
        .first()
        .getByRole('button', { name: 'View as' })
        .click();
      await page.waitForURL((u) => u.pathname.endsWith('/dashboard'), { timeout: 30_000 });
      await page.waitForLoadState('networkidle');
      /* The literal tenant path, NOT '/dashboard': the middleware rewrite drops the
         sb_view_as cookie, so the rewritten path bounces to the admin dashboard
         (bug flagged separately). The un-rewritten path keeps the cookie and
         renders the learner view. */
      await page.goto(`${BASE}/t/outdure/dashboard`, { waitUntil: 'networkidle', timeout: 60_000 });
    } else {
      await page.goto(`${BASE}${shot.url}`, { waitUntil: 'networkidle', timeout: 60_000 });
    }
    await hideDevChrome(page);
    const fullPage = shot.fullPage !== false;
    if (fullPage) await unlockScroll(page);
    // Settle web fonts and any client-side hydration BEFORE redacting: a late
    // client-side navigation or re-render after the redaction pass restores the
    // real DOM, and the shot ships unmasked (which happened — see Learner-Dashboard).
    await page.waitForTimeout(900);
    // Names are masked only where asked; the signed-in admin's own address sits in
    // the sidebar of EVERY admin page, so the email pass runs unconditionally.
    await redactPII(page, { names: Boolean(shot.redact), scrub: shot.scrub ?? [] });
    await page.waitForTimeout(150);

    /* Framing: whole page, the top N pixels of a very long one, or a window around
       a named element. */
    let clip;
    if (shot.maxHeight) {
      clip = { x: 0, y: 0, width: 1440, height: shot.maxHeight };
    } else if (shot.anchorText) {
      const box = await page
        .locator(`text=${JSON.stringify(shot.anchorText)}`)
        .first()
        .boundingBox();
      if (!box) throw new Error(`anchor "${shot.anchorText}" not found on the page`);
      const top = Math.max(0, box.y - 700);
      clip = { x: 0, y: top, width: 1440, height: 1200 };
    }

    const opts = clip ? { fullPage: true, clip } : { fullPage };
    await page.screenshot({ path: file, ...opts });
    await page.screenshot({
      path: path.join(webDir, `${shot.subject}.jpg`),
      ...opts,
      type: 'jpeg',
      quality: 72,
    });
    written.push({ subject: shot.subject, file: path.basename(file), url: shot.url, note: shot.note });
    console.log(`  ✓ ${path.basename(file)}`);
  } catch (err) {
    console.log(`  ✗ ${shot.subject} (${shot.url}) — ${err.message.split('\n')[0]}`);
  }
}

await browser.close();
console.log(`\n${written.length}/${SHOTS.length} captured into docs/screenshots/`);
