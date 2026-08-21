/**
 * Reversible cohort content configuration (final release gate, D1 + D2).
 * NOTHING is deleted — every change is a reversible flag flip.
 *
 *   D1  Standard Training -> status 'draft': removed from the storefront catalogue
 *       so it is NOT promoted to external installers while its name/audience are
 *       unresolved. Already-enrolled learners keep access (course view does not
 *       gate on status); admins still see and can edit it. Reverse: republish.
 *   D2  Image-identification questions (options "Image 1 ...") -> active = false:
 *       withheld from the cohort assessment because they require product photos
 *       that were never supplied and their captions leak the answer. Grading and
 *       rendering skip inactive questions; the threshold recomputes over what
 *       remains. Reverse: reactivate.
 *   D3  "A220 - Beam End Cap" lesson -> active = false: its content is only a
 *       "MISSING VIDEO!" placeholder (the video was never supplied), so it is
 *       withheld from the curriculum — dropped from lists, 404 in the player, and
 *       excluded from the completion denominator so it never blocks a certificate.
 *       Reverse: reactivate (do this once the video is attached).
 *
 * Guarded to NON-PROD by default. DRY-RUN by default.
 *   node cohort-content-config.mjs                 # preview
 *   node cohort-content-config.mjs execute         # apply the exclusions
 *   node cohort-content-config.mjs restore         # reverse both
 *   (append --allow-prod with the prod DATABASE_URL to run against production)
 */
import fs from 'node:fs';
import postgres from 'postgres';

function loadEnvLocal() {
  const p = '/Users/craigf/Documents/Claude/Projects/Outdure-Academy/web/.env.local';
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadEnvLocal();

const STANDARD_SLUG = 'standard-training';
const IMAGE_OPT = `options::text ~ 'Image [0-9]'`;
const A220_TITLE = 'A220 - Beam End Cap';

const url = process.env.DATABASE_URL || '';
const allowProd = process.argv.includes('--allow-prod');
if (!url.includes('ysuzujgabfynjdylmlrq') && !allowProd) {
  throw new Error('REFUSING: not the non-prod ref (pass --allow-prod to target production)');
}
const mode = ['execute', 'restore'].find((m) => process.argv.includes(m)) ?? 'dry-run';
const sql = postgres(url, { prepare: false, max: 1 });

const imageQ = await sql.unsafe(
  `select count(*)::int c from quiz_questions where ${IMAGE_OPT}`,
);
const std = await sql`select slug, title, status from courses where slug = ${STANDARD_SLUG}`;
const a220 = await sql`select id, title, active from lessons where title = ${A220_TITLE}`;
console.log(`MODE: ${mode}  (db: ${url.includes('ysuzujgabfynjdylmlrq') ? 'NON-PROD' : 'PROD/OTHER'})`);
console.log(`D2 image-identification questions matched: ${imageQ[0].c}`);
console.log(`D1 Standard Training: ${std[0] ? `"${std[0].title}" status=${std[0].status}` : 'NOT FOUND'}`);
console.log(`D3 A220 lesson: ${a220[0] ? `active=${a220[0].active}` : 'NOT FOUND'}`);

if (mode === 'dry-run') {
  console.log('\nDRY-RUN — nothing written. Use `execute` (apply) or `restore` (reverse).');
  await sql.end();
} else if (mode === 'execute') {
  await sql.begin(async (tx) => {
    await tx.unsafe(`update quiz_questions set active = false where ${IMAGE_OPT}`);
    await tx`update courses set status = 'draft' where slug = ${STANDARD_SLUG} and status = 'published'`;
    await tx`update lessons set active = false where title = ${A220_TITLE}`;
  });
  console.log('\nEXECUTED — image questions deactivated; Standard Training drafted; A220 excluded.');
  await sql.end();
} else {
  // restore
  await sql.begin(async (tx) => {
    await tx.unsafe(`update quiz_questions set active = true where ${IMAGE_OPT}`);
    await tx`update courses set status = 'published' where slug = ${STANDARD_SLUG} and status = 'draft'`;
    await tx`update lessons set active = true where title = ${A220_TITLE}`;
  });
  console.log('\nRESTORED — image questions reactivated; Standard Training republished; A220 restored.');
  await sql.end();
}
