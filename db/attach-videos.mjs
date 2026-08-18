/**
 * Bulk video attach — points placeholder video lessons at uploaded Bunny Stream
 * videos, exactly as the admin builder's attachVideo action would have: same
 * content shape (`{ provider, videoId }`), same audit-log action
 * (`lesson.video_attached`, before/after rows, hash computed by the DB trigger),
 * same estimated-minutes seeding rule (only if unset).
 *
 * Built for the Outdure Academy content import — see docs/course-import/ for
 * the video register and the Bunny upload map. Companion to import-courses.mjs.
 *
 * Usage (from db/):
 *   node attach-videos.mjs dry-run --map <path>   # print plan, write nothing
 *   node attach-videos.mjs execute --map <path>   # attach, one transaction
 *   node attach-videos.mjs verify  --map <path>   # diff DB against map
 *
 * The map JSON: { tenant_slug, actor_email, course_slugs: [..],
 *   videos: [{ lessonTitle, bunnyId, durationSec }],
 *   unattachable: [{ lessonTitle, reason }] }.
 * Lessons are matched by exact title across all listed courses (shared videos
 * attach to every lesson bearing the title). A lesson that already carries a
 * DIFFERENT videoId is never clobbered — it is reported and skipped.
 *
 * Reads DATABASE_URL / BUNNY_API_KEY / BUNNY_LIBRARY_ID from the environment,
 * falling back to ../web/.env.local. Execute confirms every Bunny id actually
 * exists in the library before any row is written (a typo cannot point a
 * lesson at nothing — the builder does the same).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = path.join(HERE, '..', 'web', '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, rawVal] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawVal.replace(/^(['"])(.*)\1$/, '$2');
  }
}

function parseArgs(argv) {
  const args = { mode: null, map: null };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--map') args.map = argv[++i];
    else positional.push(a);
  }
  args.mode = positional[0] ?? 'dry-run';
  if (!['dry-run', 'execute', 'verify'].includes(args.mode)) {
    throw new Error(`Unknown mode "${args.mode}" — use dry-run | execute | verify`);
  }
  if (!args.map) throw new Error('--map <path> is required');
  return args;
}

const args = parseArgs(process.argv);
const map = JSON.parse(fs.readFileSync(args.map, 'utf-8'));
loadEnvLocal();
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set and web/.env.local not found');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

const byTitle = new Map(map.videos.map((v) => [v.lessonTitle, v]));
const unattachable = new Set((map.unattachable ?? []).map((u) => u.lessonTitle));

async function bunnyVideoExists(videoId) {
  const key = process.env.BUNNY_API_KEY;
  const lib = process.env.BUNNY_LIBRARY_ID;
  if (!key || !lib) throw new Error('BUNNY_API_KEY / BUNNY_LIBRARY_ID not set');
  const res = await fetch(
    `https://video.bunnycdn.com/library/${lib}/videos/${encodeURIComponent(videoId)}`,
    { headers: { AccessKey: key, accept: 'application/json' } },
  );
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`Bunny lookup for ${videoId} failed (${res.status})`);
  const v = await res.json();
  return !!v.guid;
}

async function resolveContext() {
  const tenants = await sql`select id, slug, name from tenants where slug = ${map.tenant_slug}`;
  if (tenants.length !== 1) throw new Error(`Tenant "${map.tenant_slug}" not found`);
  const tenant = tenants[0];

  const actors = await sql`select id, email from users where email = ${map.actor_email} limit 1`;
  const actor = actors[0] ?? null;

  const courses = await sql`
    select id, slug, title from courses
    where tenant_id = ${tenant.id} and slug = any(${map.course_slugs})`;
  const missing = map.course_slugs.filter((s) => !courses.some((c) => c.slug === s));
  if (missing.length) throw new Error(`Course slug(s) not found: ${missing.join(', ')}`);

  const lessons = await sql`
    select l.id, l.course_id, l.section_id, l.tenant_id, l.title, l.type, l.position,
           l.estimated_minutes, l.content, l.created_at, l.updated_at, c.slug as course_slug
    from lessons l join courses c on c.id = l.course_id
    where l.tenant_id = ${tenant.id} and l.course_id = any(${courses.map((c) => c.id)})
      and l.type = 'video'
    order by c.slug, l.position`;

  return { tenant, actor, courses, lessons };
}

/** Classify every video lesson in the target courses against the map. */
function plan(lessons) {
  const attach = [];
  const alreadySame = [];
  const conflict = [];
  const expectedBare = [];
  const unexpected = [];
  for (const l of lessons) {
    const mapped = byTitle.get(l.title);
    const existing = typeof l.content?.videoId === 'string' ? l.content.videoId.trim() : '';
    if (!mapped) {
      (unattachable.has(l.title) ? expectedBare : unexpected).push(l);
      continue;
    }
    if (existing === mapped.bunnyId) alreadySame.push(l);
    else if (existing) conflict.push({ lesson: l, mapped });
    else attach.push({ lesson: l, mapped });
  }
  return { attach, alreadySame, conflict, expectedBare, unexpected };
}

async function main() {
  const { tenant, actor, lessons } = await resolveContext();
  const p = plan(lessons);

  console.log(`Tenant: ${tenant.slug} (${tenant.id})`);
  console.log(`Audit actor: ${actor ? `${actor.email} (${actor.id})` : 'NULL — no user matched'}`);
  console.log(
    `Video lessons: ${lessons.length} · to attach: ${p.attach.length} · already attached: ` +
      `${p.alreadySame.length} · conflicts: ${p.conflict.length} · expected placeholders: ` +
      `${p.expectedBare.length} · UNEXPECTED unmapped: ${p.unexpected.length}`,
  );
  for (const { lesson, mapped } of p.attach) {
    console.log(`  ATTACH [${lesson.course_slug}] "${lesson.title}" -> ${mapped.bunnyId}`);
  }
  for (const { lesson, mapped } of p.conflict) {
    console.log(
      `  !! CONFLICT [${lesson.course_slug}] "${lesson.title}" already has ` +
        `${lesson.content.videoId}, map says ${mapped.bunnyId} — will NOT touch`,
    );
  }
  for (const l of p.expectedBare) {
    console.log(`  (placeholder stays) [${l.course_slug}] "${l.title}"`);
  }
  for (const l of p.unexpected) {
    console.log(`  ?? UNMAPPED video lesson [${l.course_slug}] "${l.title}" — title mismatch?`);
  }

  if (args.mode === 'verify') {
    const bad = p.unexpected.length + p.conflict.length;
    const pending = p.attach.length;
    console.log(
      pending === 0 && bad === 0
        ? `\nVERIFY PASSED — every mapped lesson attached (${p.alreadySame.length}), ` +
          `${p.expectedBare.length} known placeholders remain`
        : `\nVERIFY FAILED — ${pending} still unattached, ${bad} conflicts/unexpected`,
    );
    if (pending || bad) process.exitCode = 1;
    return;
  }

  if (p.unexpected.length) {
    throw new Error(
      'Unmapped video lessons found (titles above). Fix the map before attaching.',
    );
  }
  if (args.mode === 'dry-run') {
    console.log('\nDRY RUN — nothing written. Re-run with `execute` to attach.');
    return;
  }
  if (!p.attach.length) {
    console.log('\nNothing to attach.');
    return;
  }

  // A typo'd id must fail BEFORE any row is written, as the builder would.
  const ids = [...new Set(p.attach.map(({ mapped }) => mapped.bunnyId))];
  console.log(`\nConfirming ${ids.length} Bunny video(s) exist…`);
  for (const id of ids) {
    if (!(await bunnyVideoExists(id))) throw new Error(`Bunny video ${id} not found in library`);
  }

  await sql.begin(async (tx) => {
    for (const { lesson, mapped } of p.attach) {
      const minutes =
        lesson.estimated_minutes ??
        (mapped.durationSec ? Math.max(1, Math.round(mapped.durationSec / 60)) : null);
      const content = { provider: 'bunny', videoId: mapped.bunnyId };
      const [after] = await tx`
        update lessons
        set content = ${tx.json(content)}, estimated_minutes = ${minutes}, updated_at = now()
        where id = ${lesson.id} and tenant_id = ${tenant.id}
        returning *`;
      const { course_slug, ...before } = lesson;
      await tx`
        insert into audit_log (tenant_id, actor_user_id, action, resource_type, resource_id, before, after, hash)
        values (${tenant.id}, ${actor?.id ?? null}, 'lesson.video_attached', 'lesson',
                ${lesson.id}, ${tx.json(before)}, ${tx.json(after)}, '')`;
    }
  });
  console.log(`ATTACHED ${p.attach.length} lesson(s) in one transaction.`);
  console.log('Run `node attach-videos.mjs verify --map <same map>` to verify.');
}

try {
  await main();
} finally {
  await sql.end({ timeout: 5 });
}
