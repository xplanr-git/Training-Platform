/**
 * Course content importer — creates draft courses (sections, placeholder video
 * lessons, quizzes, questions) from a platform-import payload JSON, exactly as
 * the admin builder would have: same row shapes, same audit-log actions
 * (CLAUDE.md §7.11 — audit rows are written in the same transaction; the DB
 * trigger computes the hash chain).
 *
 * Built for the Outdure Academy content import from the "2024 ONLINE TRAINING
 * PLATFORM" Google Sheet — see docs/course-import/ for the payload, the
 * extraction manifest, and the report. Placeholder videos are `video` lessons
 * with nothing attached (the builder's own not-attached state); attach real
 * videos later through the builder without restructuring.
 *
 * Usage (from db/):
 *   node import-courses.mjs dry-run --payload <path>   # print plan, write nothing
 *   node import-courses.mjs execute --payload <path>   # insert, one transaction
 *   node import-courses.mjs verify  --payload <path>   # diff DB against payload
 *
 * Reads DATABASE_URL from the environment, falling back to ../web/.env.local.
 * Refuses to execute if a payload course slug already exists in the tenant.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  if (process.env.DATABASE_URL) return;
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
  const args = { mode: null, payload: null, tenant: null };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--payload') args.payload = argv[++i];
    else if (a === '--tenant') args.tenant = argv[++i];
    else positional.push(a);
  }
  args.mode = positional[0] ?? 'dry-run';
  if (!['dry-run', 'execute', 'verify'].includes(args.mode)) {
    throw new Error(`Unknown mode "${args.mode}" — use dry-run | execute | verify`);
  }
  if (!args.payload) throw new Error('--payload <path> is required');
  return args;
}

const args = parseArgs(process.argv);
const payload = JSON.parse(fs.readFileSync(args.payload, 'utf-8'));
const tenantSlug = args.tenant ?? payload.tenant_slug;

loadEnvLocal();
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set and web/.env.local not found');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

function courseCounts(course) {
  let videos = 0;
  let quizzes = 0;
  let questions = 0;
  for (const s of course.sections) {
    for (const l of s.lessons) {
      if (l.type === 'video') videos++;
      if (l.type === 'quiz') {
        quizzes++;
        questions += l.quiz.questions.length;
      }
    }
  }
  return { sections: course.sections.length, lessons: videos + quizzes, videos, quizzes, questions };
}

async function resolveContext() {
  const tenants = await sql`select id, slug, name, status from tenants where slug = ${tenantSlug}`;
  if (tenants.length !== 1) {
    const all = await sql`select slug from tenants order by slug`;
    throw new Error(
      `Tenant "${tenantSlug}" not found. Tenants: ${all.map((t) => t.slug).join(', ')}`,
    );
  }
  const tenant = tenants[0];

  let actor = null;
  let actorHow = 'none (actor_user_id will be NULL)';
  const byEmail = await sql`select id, email from users where email = ${payload.actor_email} limit 1`;
  if (byEmail.length === 1) {
    actor = byEmail[0];
    actorHow = `users.email = ${actor.email}`;
  } else {
    const admins = await sql`
      select u.id, u.email from memberships m join users u on u.id = m.user_id
      where m.tenant_id = ${tenant.id} and m.role in ('platform_admin','company_admin')
        and m.status = 'active'
      order by m.created_at asc limit 1`;
    if (admins.length === 1) {
      actor = admins[0];
      actorHow = `first active admin membership (${actor.email})`;
    }
  }

  const slugs = payload.courses.map((c) => c.slug);
  const existing = await sql`
    select id, slug, status from courses
    where tenant_id = ${tenant.id} and slug = any(${slugs})`;

  return { tenant, actor, existing };
}

async function audited(tx, entry) {
  await tx`
    insert into audit_log (tenant_id, actor_user_id, action, resource_type, resource_id, before, after, hash)
    values (${entry.tenantId}, ${entry.actorUserId}, ${entry.action}, ${entry.resourceType},
            ${entry.resourceId ?? null},
            ${entry.before === undefined ? null : sql.json(entry.before)},
            ${entry.after === undefined ? null : sql.json(entry.after)},
            '')`;
}

async function importCourse(tx, tenantId, actorId, course) {
  const [courseRow] = await tx`
    insert into courses (tenant_id, title, slug, description, status, level, category, confers_role_code)
    values (${tenantId}, ${course.title}, ${course.slug}, ${course.description}, 'draft',
            ${course.level}, ${course.category}, ${course.confersRoleCode ?? null})
    returning *`;
  await audited(tx, {
    tenantId,
    actorUserId: actorId,
    action: 'course.create',
    resourceType: 'course',
    resourceId: courseRow.id,
    after: courseRow,
  });

  for (let sPos = 0; sPos < course.sections.length; sPos++) {
    const section = course.sections[sPos];
    const [sectionRow] = await tx`
      insert into sections (tenant_id, course_id, title, position)
      values (${tenantId}, ${courseRow.id}, ${section.title}, ${sPos})
      returning id`;
    await audited(tx, {
      tenantId,
      actorUserId: actorId,
      action: 'section.create',
      resourceType: 'section',
      resourceId: sectionRow.id,
      after: { courseId: courseRow.id, title: section.title, position: sPos },
    });

    for (let lPos = 0; lPos < section.lessons.length; lPos++) {
      const lesson = section.lessons[lPos];
      const [lessonRow] = await tx`
        insert into lessons (tenant_id, course_id, section_id, title, type, position, estimated_minutes, content)
        values (${tenantId}, ${courseRow.id}, ${sectionRow.id}, ${lesson.title}, ${lesson.type},
                ${lPos}, ${lesson.estimatedMinutes ?? null}, ${sql.json(lesson.content ?? {})})
        returning id`;
      await audited(tx, {
        tenantId,
        actorUserId: actorId,
        action: 'lesson.create',
        resourceType: 'lesson',
        resourceId: lessonRow.id,
        after: { title: lesson.title, type: lesson.type },
      });

      if (lesson.type === 'quiz') {
        const [quizRow] = await tx`
          insert into quizzes (tenant_id, lesson_id, settings)
          values (${tenantId}, ${lessonRow.id}, ${sql.json(lesson.quiz.settings)})
          returning id`;
        await audited(tx, {
          tenantId,
          actorUserId: actorId,
          action: 'quiz.create',
          resourceType: 'quiz',
          resourceId: quizRow.id,
          after: { lessonId: lessonRow.id, settings: lesson.quiz.settings },
        });
        for (let qPos = 0; qPos < lesson.quiz.questions.length; qPos++) {
          const q = lesson.quiz.questions[qPos];
          const [questionRow] = await tx`
            insert into quiz_questions (tenant_id, quiz_id, position, type, prompt, options, correct, points)
            values (${tenantId}, ${quizRow.id}, ${qPos}, ${q.type}, ${q.prompt},
                    ${sql.json(q.options)}, ${sql.json(q.correct)}, ${q.points})
            returning id`;
          await audited(tx, {
            tenantId,
            actorUserId: actorId,
            action: 'quiz_question.create',
            resourceType: 'quiz_question',
            resourceId: questionRow.id,
            after: {
              quizId: quizRow.id,
              prompt: q.prompt,
              type: q.type,
              options: q.options,
              correct: q.correct,
              points: q.points,
              source: q.source,
              ...(q.note ? { note: q.note } : {}),
            },
          });
        }
      }
    }
  }

  await audited(tx, {
    tenantId,
    actorUserId: actorId,
    action: 'course.import',
    resourceType: 'course',
    resourceId: courseRow.id,
    after: {
      source: payload.meta.source_sheet,
      payload: path.basename(args.payload),
      counts: courseCounts(course),
      decisions: payload.meta.decisions,
    },
  });
  return courseRow;
}

function printPlan(existing) {
  for (const course of payload.courses) {
    const c = courseCounts(course);
    console.log(`\nCOURSE ${course.slug} — "${course.title}" (draft)`);
    console.log(
      `  ${c.sections} sections, ${c.lessons} lessons (${c.videos} placeholder videos, ${c.quizzes} quizzes, ${c.questions} questions)`,
    );
    for (const s of course.sections) {
      const parts = s.lessons.map((l) =>
        l.type === 'quiz' ? `[quiz ${l.quiz.questions.length}q] ${l.title}` : `[video] ${l.title}`,
      );
      console.log(`  · ${s.title}: ${parts.join(' | ')}`);
    }
  }
  if (existing.length) {
    console.log(`\n!! Already in tenant: ${existing.map((e) => `${e.slug} (${e.status})`).join(', ')}`);
  }
}

async function verify() {
  const { tenant } = await resolveContext();
  let failures = 0;
  const fail = (msg) => {
    failures++;
    console.log(`  FAIL ${msg}`);
  };

  for (const course of payload.courses) {
    console.log(`\nVERIFY ${course.slug}`);
    const [c] = await sql`
      select id, title, status, level, category, confers_role_code from courses
      where tenant_id = ${tenant.id} and slug = ${course.slug}`;
    if (!c) {
      fail(`course ${course.slug} not found`);
      continue;
    }
    if (c.title !== course.title) fail(`title: ${c.title} != ${course.title}`);
    if (c.status !== 'draft') fail(`status: ${c.status} != draft`);
    if ((c.confers_role_code ?? null) !== (course.confersRoleCode ?? null)) {
      fail(`confers_role_code: ${c.confers_role_code} != ${course.confersRoleCode}`);
    }

    const dbSections = await sql`
      select id, title, position from sections
      where course_id = ${c.id} and tenant_id = ${tenant.id} order by position`;
    if (dbSections.length !== course.sections.length) {
      fail(`sections: ${dbSections.length} != ${course.sections.length}`);
    }
    for (let i = 0; i < Math.min(dbSections.length, course.sections.length); i++) {
      const want = course.sections[i];
      const got = dbSections[i];
      if (got.title !== want.title) fail(`section[${i}] title: "${got.title}" != "${want.title}"`);
      const dbLessons = await sql`
        select id, title, type, position, estimated_minutes, content from lessons
        where section_id = ${got.id} and tenant_id = ${tenant.id} order by position`;
      if (dbLessons.length !== want.lessons.length) {
        fail(`section "${want.title}" lessons: ${dbLessons.length} != ${want.lessons.length}`);
        continue;
      }
      for (let j = 0; j < want.lessons.length; j++) {
        const wl = want.lessons[j];
        const gl = dbLessons[j];
        if (gl.title !== wl.title) fail(`lesson "${wl.title}": title "${gl.title}"`);
        if (gl.type !== wl.type) fail(`lesson "${wl.title}": type ${gl.type} != ${wl.type}`);
        if ((gl.estimated_minutes ?? null) !== (wl.estimatedMinutes ?? null)) {
          fail(`lesson "${wl.title}": minutes ${gl.estimated_minutes} != ${wl.estimatedMinutes}`);
        }
        if (wl.type === 'quiz') {
          const [quiz] = await sql`
            select id, settings from quizzes where lesson_id = ${gl.id} and tenant_id = ${tenant.id}`;
          if (!quiz) {
            fail(`lesson "${wl.title}": no quiz row`);
            continue;
          }
          if ((quiz.settings?.passThreshold ?? null) !== wl.quiz.settings.passThreshold) {
            fail(`quiz "${wl.title}": passThreshold ${JSON.stringify(quiz.settings)}`);
          }
          const dbQs = await sql`
            select position, type, prompt, options, correct, points from quiz_questions
            where quiz_id = ${quiz.id} and tenant_id = ${tenant.id} order by position`;
          if (dbQs.length !== wl.quiz.questions.length) {
            fail(`quiz "${wl.title}": ${dbQs.length} questions != ${wl.quiz.questions.length}`);
            continue;
          }
          for (let k = 0; k < dbQs.length; k++) {
            const wq = wl.quiz.questions[k];
            const gq = dbQs[k];
            if (gq.prompt !== wq.prompt) fail(`"${wl.title}" q${k}: prompt mismatch`);
            if (gq.type !== wq.type) fail(`"${wl.title}" q${k}: type ${gq.type} != ${wq.type}`);
            if (JSON.stringify(gq.options) !== JSON.stringify(wq.options)) {
              fail(`"${wl.title}" q${k}: options mismatch`);
            }
            if (JSON.stringify(gq.correct) !== JSON.stringify(wq.correct)) {
              fail(`"${wl.title}" q${k}: correct mismatch`);
            }
            if (gq.points !== wq.points) fail(`"${wl.title}" q${k}: points ${gq.points}`);
          }
        }
      }
    }

    // The two publish-guard queries from setCourseStatus: quizzes with no
    // questions, and questions no answer can pass.
    const emptyQuizzes = await sql`
      select l.title from lessons l
      left join quizzes q on q.lesson_id = l.id
      where l.course_id = ${c.id} and l.tenant_id = ${tenant.id} and l.type = 'quiz'
        and (q.id is null or (select count(*) from quiz_questions qq where qq.quiz_id = q.id) = 0)`;
    if (emptyQuizzes.length) fail(`empty quizzes: ${emptyQuizzes.map((r) => r.title).join(', ')}`);

    const broken = await sql`
      select l.title from quiz_questions qq
      join quizzes q on q.id = qq.quiz_id
      join lessons l on l.id = q.lesson_id
      where l.course_id = ${c.id} and qq.tenant_id = ${tenant.id}
        and (jsonb_array_length(qq.correct) = 0
          or jsonb_array_length(qq.correct) <> (
               select count(distinct e.value) from jsonb_array_elements(qq.correct) e)
          or exists (
               select 1 from jsonb_array_elements_text(qq.correct) x
               where x ~ '^[0-9]+$' and x::int >= jsonb_array_length(qq.options)))`;
    if (broken.length) fail(`unpassable questions in: ${broken.map((r) => r.title).join(', ')}`);

    if (!failures) {
      const want = courseCounts(course);
      console.log(
        `  OK — ${want.sections} sections, ${want.lessons} lessons, ${want.questions} questions; publish guards clean`,
      );
    }
  }

  // Returns one row per problem; empty = intact. Rows that predate migration
  // 0015 (hash_version 1) are EXPECTED to be reported unverifiable — their
  // links are still checked — so they are informational, not failures
  // (CLAUDE.md §4 #11). Real problems are broken links / content mismatches.
  const chain = await sql`select * from verify_audit_chain(${tenant.id})`;
  const legacy = chain.filter((r) => r.problem.includes('predates migration 0015'));
  const real = chain.filter((r) => !r.problem.includes('predates migration 0015'));
  if (real.length) {
    failures += real.length;
    for (const row of real) console.log(`  FAIL audit chain: ${JSON.stringify(row)}`);
  }
  console.log(
    `\n  audit chain for tenant ${tenant.slug}: ${real.length} real problem(s), ` +
      `${legacy.length} pre-0015 rows reported unverifiable (expected, links checked)`,
  );
  console.log(failures ? `\nVERIFY FAILED — ${failures} problem(s)` : 'VERIFY PASSED');
  if (failures) process.exitCode = 1;
}

async function main() {
  if (args.mode === 'verify') {
    await verify();
    return;
  }

  const { tenant, actor, existing } = await resolveContext();
  console.log(`Tenant: ${tenant.slug} (${tenant.name}, ${tenant.status}) ${tenant.id}`);
  console.log(`Audit actor: ${actor ? actor.id : 'NULL'} — via ${actor ? 'lookup' : 'no admin found'}`);
  printPlan(existing);

  if (args.mode === 'dry-run') {
    console.log('\nDRY RUN — nothing written. Re-run with `execute` to import.');
    return;
  }

  if (existing.length) {
    throw new Error(
      `Refusing to import: slug(s) already exist (${existing.map((e) => e.slug).join(', ')}). ` +
        'Delete them in the admin UI first if you mean to re-import.',
    );
  }

  const created = await sql.begin(async (tx) => {
    const rows = [];
    for (const course of payload.courses) {
      rows.push(await importCourse(tx, tenant.id, actor?.id ?? null, course));
    }
    return rows;
  });
  console.log('\nIMPORTED:');
  for (const c of created) console.log(`  ${c.slug} -> ${c.id}`);
  console.log('Run `node import-courses.mjs verify --payload <same payload>` to verify.');
}

try {
  await main();
} finally {
  await sql.end({ timeout: 5 });
}
