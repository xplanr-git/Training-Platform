/**
 * Seed the data-driven "required training" model (see migration 0022 +
 * lib/contractor-requirement.ts). Marks the Outdure Installer Training course as
 * required for the `installer` audience — the confirmed business rule
 * (Registered → complete installer training → Trained). This replaces the
 * hardcoded slug inference with explicit data; behaviour is unchanged because it
 * is the same course the constant named.
 *
 * Idempotent. Guarded to the NON-PROD ref. DRY-RUN by default.
 * Run at prod deploy time (with the prod DATABASE_URL) as part of the content seed.
 *
 * Usage (from db/):
 *   node seed-required-training.mjs           # preview
 *   node seed-required-training.mjs execute   # apply
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

const REQUIRED_SLUG = 'trained-installer-training';
const REQUIRED_FOR = ['installer'];

const url = process.env.DATABASE_URL || '';
// Allow prod at deploy time via an explicit opt-in; default guard is non-prod.
const allowProd = process.argv.includes('--allow-prod');
if (!url.includes('ysuzujgabfynjdylmlrq') && !allowProd) {
  throw new Error('REFUSING: not the non-prod ref (pass --allow-prod to seed production deliberately)');
}
const mode = process.argv.includes('execute') ? 'execute' : 'dry-run';
const sql = postgres(url, { prepare: false, max: 1 });

const before = await sql`
  select slug, title, status, required_for_audiences
  from courses where slug = ${REQUIRED_SLUG}`;
console.log(`MODE: ${mode}  (db: ${url.includes('ysuzujgabfynjdylmlrq') ? 'NON-PROD' : 'OTHER'})`);
if (before.length === 0) {
  console.log(`No course with slug "${REQUIRED_SLUG}" — nothing to seed.`);
  await sql.end();
} else {
  const c = before[0];
  console.log(`Course: "${c.title}" [${c.status}]  required_for_audiences = ${JSON.stringify(c.required_for_audiences)}`);
  console.log(`Target: required_for_audiences = ${JSON.stringify(REQUIRED_FOR)}`);
  if (mode === 'execute') {
    await sql`update courses set required_for_audiences = ${REQUIRED_FOR} where slug = ${REQUIRED_SLUG}`;
    const after = await sql`select required_for_audiences from courses where slug = ${REQUIRED_SLUG}`;
    console.log(`DONE. now = ${JSON.stringify(after[0].required_for_audiences)}`);
  } else {
    console.log('DRY-RUN — nothing written. Re-run with `execute`.');
  }
  await sql.end();
}
