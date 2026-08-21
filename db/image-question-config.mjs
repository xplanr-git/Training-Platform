/**
 * Image-identification question rework (paired with migration 0025:
 * quiz_questions.image_url, and the quiz player rendering).
 *
 * Two changes, both to the "Image [0-9]"-style questions that were placeholders:
 *
 *   1. STRIP the vestigial "Image N " / "Image N. " prefix from every option of
 *      every affected question. The prefix pointed at pictures that never
 *      existed; stripping it leaves the plain product/spec names. Option ORDER
 *      is preserved, so every question's `correct` index stays valid untouched.
 *
 *   2. For the four questions that now have a real product photo, set
 *      `image_url` and reword the prompt to "What is the product shown below?".
 *      The learner identifies the pictured part and picks its name — so naming
 *      the part in the prompt (the old wording) would leak the answer.
 *
 * The A203 (timber profiles) and A207 (screw codes) questions become clean TEXT
 * questions — no photo needed. The "T clip" question has no A512 render in the
 * library, so it only gets the prefix strip (stays text; flag for a photo later).
 *
 * Matching is by exact prompt, so BOTH course copies (standard-training and
 * trained-installer-training) are updated together. Idempotent: re-running
 * changes nothing once applied. Guarded to NON-PROD and DRY-RUN by default,
 * exactly like cohort-content-config.mjs.
 *
 *   node image-question-config.mjs                    # preview (non-prod)
 *   node image-question-config.mjs execute            # apply (non-prod)
 *   DATABASE_URL=<prod> node image-question-config.mjs --allow-prod          # preview prod
 *   DATABASE_URL=<prod> node image-question-config.mjs execute --allow-prod  # apply prod
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  if (process.env.DATABASE_URL) return;
  const p = path.join(HERE, '..', 'web', '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadEnvLocal();

// Exact current prompt -> product photo (served from web/public). These four are
// the only ones with a render in the library.
const IMAGE_QUESTIONS = {
  'Which item is the A201 90° Bracket?': '/product-images/a201-90-bracket.webp',
  'Which item is the A202 Joiner Bracket?': '/product-images/a202-joiner-bracket.webp',
  'What item is the A205 Double Joist Bracket?': '/product-images/a206-double-joist-bracket.webp',
  'What image shows the twistclip?': '/product-images/a510-twistclip.webp',
  'What item is the T clip?': '/product-images/a512-t-clip.webp',
};
const REWORDED_PROMPT = 'What is the product shown below?';
const PREFIX = /^\s*Image\s*\d+\.?\s+/;

const url = process.env.DATABASE_URL || '';
const allowProd = process.argv.includes('--allow-prod');
if (!url.includes('ysuzujgabfynjdylmlrq') && !allowProd) {
  throw new Error('REFUSING: not the non-prod ref (pass --allow-prod to target production)');
}
const mode = process.argv.includes('execute') ? 'execute' : 'dry-run';
const sql = postgres(url, { prepare: false, max: 1 });

const rows = await sql`
  select q.id, q.prompt, q.options, q.image_url,
         c.slug as course
  from quiz_questions q
  join quizzes z on z.id = q.quiz_id
  join lessons l on l.id = z.lesson_id
  join sections s on s.id = l.section_id
  join courses c on c.id = s.course_id
  where q.options::text ~ 'Image [0-9]'
  order by c.slug, q.prompt`;

console.log(
  `MODE: ${mode}  (db: ${url.includes('ysuzujgabfynjdylmlrq') ? 'NON-PROD' : 'PROD/OTHER'})`,
);
console.log(`Matched ${rows.length} image-placeholder question row(s).\n`);

const plan = [];
for (const r of rows) {
  const opts = r.options;
  const newOpts = opts.map((o) => String(o).replace(PREFIX, ''));
  const stripped = newOpts.some((o, i) => o !== String(opts[i]));
  const image = IMAGE_QUESTIONS[r.prompt] ?? null;
  const newPrompt = image ? REWORDED_PROMPT : r.prompt;
  plan.push({ ...r, newOpts, newPrompt, image, stripped });
}

for (const p of plan) {
  console.log(`• [${p.course}] "${p.prompt}"`);
  if (p.image) console.log(`    prompt -> "${REWORDED_PROMPT}"   image_url -> ${p.image}`);
  if (p.stripped) console.log(`    options -> ${JSON.stringify(p.newOpts)}`);
  if (!p.image && !p.stripped) console.log('    (no change)');
}

if (mode === 'dry-run') {
  console.log('\nDRY-RUN — nothing written. Re-run with `execute`.');
  await sql.end();
} else {
  await sql.begin(async (tx) => {
    for (const p of plan) {
      await tx`
        update quiz_questions
        set options = ${sql.json(p.newOpts)},
            prompt = ${p.newPrompt},
            image_url = ${p.image}
        where id = ${p.id}`;
    }
  });
  console.log(`\nEXECUTED — ${plan.length} question row(s) updated.`);
  await sql.end();
}
