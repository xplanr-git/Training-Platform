/**
 * Decision-free content typo corrections for the cohort release candidate.
 * See docs/Outdure-Academy-Cohort-Release_Report_2026_08_20__22_51.md (CUR-3).
 *
 * Corrects unambiguous spelling errors in live learner-facing content:
 *   - quiz option "Alumunium"  -> "Aluminium"   (a CORRECT answer)
 *   - quiz option "Imhae 4 ..." / "Imahe 4 ..." -> "Image 4 ..."  (both transpositions)
 *   - lesson title "... black/sliver" -> "... black/silver"
 *
 * These are spelling fixes, NOT technical-content changes — no meaning is altered.
 *
 * Guarded to the NON-PROD ref. DRY-RUN by default (read-only preview, writes
 * nothing). `execute` applies the changes in one transaction. Deliberately NOT
 * run during reconciliation: the beta reads non-prod, and the release rule is to
 * apply content corrections at candidate-deploy time, not while the beta is live.
 *
 * Usage (from db/):
 *   node fix-content-typos.mjs            # dry-run: preview affected rows
 *   node fix-content-typos.mjs execute    # apply (deploy time only)
 */
import fs from 'node:fs';
import postgres from 'postgres';

function loadEnvLocal() {
  const envPath = '/Users/craigf/Documents/Claude/Projects/Outdure-Academy/web/.env.local';
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, rawVal] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawVal.replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadEnvLocal();

const url = process.env.DATABASE_URL || '';
if (!url.includes('ysuzujgabfynjdylmlrq')) {
  throw new Error('REFUSING: DATABASE_URL is not the non-prod ref ysuzujgabfynjdylmlrq');
}
const mode = process.argv[2] === 'execute' ? 'execute' : 'dry-run';
const sql = postgres(url, { prepare: false, max: 1 });

// Each fix: a preview query + the mutating statement (only run on execute).
async function run() {
  // 1) Option label "Alumunium" -> "Aluminium" inside quiz_questions.options (jsonb array of text).
  const alu = await sql`
    select id, prompt, options from quiz_questions
    where options::text ilike '%Alumunium%'`;
  // 2) Option label "Imhae " -> "Image " (the "Imhae 4 90 bracket" typo).
  const imhae = await sql`
    select id, prompt, options from quiz_questions
    where options::text ilike '%Imhae %' or options::text ilike '%Imahe %'`;
  // 3) Lesson title "sliver" -> "silver".
  const sliver = await sql`
    select id, title from lessons where title ilike '%sliver%'`;

  console.log(`MODE: ${mode}`);
  console.log(`\n[1] "Alumunium" -> "Aluminium"  (${alu.length} question rows)`);
  alu.forEach((r) => console.log(`    q ${r.id.slice(0, 8)} — ${r.prompt.slice(0, 60)}`));
  console.log(`\n[2] "Imhae " -> "Image "  (${imhae.length} question rows)`);
  imhae.forEach((r) => console.log(`    q ${r.id.slice(0, 8)} — ${r.prompt.slice(0, 60)}`));
  console.log(`\n[3] "sliver" -> "silver"  (${sliver.length} lesson rows)`);
  sliver.forEach((r) => console.log(`    lesson ${r.id.slice(0, 8)} — "${r.title}"`));

  if (mode === 'dry-run') {
    console.log('\nDRY-RUN — no rows written. Re-run with `execute` at deploy time.');
    await sql.end();
    return;
  }

  await sql.begin(async (tx) => {
    for (const r of alu) {
      const fixed = r.options.map((o) => (typeof o === 'string' ? o.replace(/Alumunium/g, 'Aluminium') : o));
      await tx`update quiz_questions set options = ${tx.json(fixed)} where id = ${r.id}`;
    }
    for (const r of imhae) {
      const fixed = r.options.map((o) => (typeof o === 'string' ? o.replace(/Im(hae|ahe) /g, "Image ") : o));
      await tx`update quiz_questions set options = ${tx.json(fixed)} where id = ${r.id}`;
    }
    for (const r of sliver) {
      await tx`update lessons set title = ${r.title.replace(/sliver/g, 'silver')} where id = ${r.id}`;
    }
  });
  console.log('\nEXECUTED — typos corrected in one transaction.');
  await sql.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
