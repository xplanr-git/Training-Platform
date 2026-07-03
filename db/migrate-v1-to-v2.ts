/**
 * One-shot v1 → v2 data migration.
 *
 * Copies the legacy project's courses / course_sections / course_activities
 * into the v2 schema, creating a tenant per legacy company slug. The old
 * 12-URL-column activity shape is normalised into lessons.type + content_jsonb
 * (+ lesson_assets for files).
 *
 * Usage:
 *   LEGACY_DATABASE_URL=postgres://…legacy   \
 *   DATABASE_URL=postgres://…v2               \
 *   npx tsx migrate-v1-to-v2.ts [--dry-run]
 *
 * Idempotent: a course whose (tenant, slug) already exists in v2 is skipped.
 * Read-only against the legacy DB; only writes to v2.
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import * as schema from './schema';
import { tenants, courses, sections, lessons, lessonAssets } from './schema';

const DRY_RUN = process.argv.includes('--dry-run');

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 63) || 'item'
  );
}

/** Maps a legacy course_activity row to a v2 lesson type + content_jsonb. */
function mapActivity(a: Record<string, unknown>): {
  type: 'video' | 'pdf' | 'scorm' | 'quiz' | 'text';
  content: Record<string, unknown>;
  asset?: { kind: 'youtube' | 'pdf' | 'scorm_package' | 'file'; storagePath?: string };
} {
  const legacyType = String(a.type ?? 'text').toLowerCase();
  const youtube = (a.youtube_url as string) || (a.video_url as string) || '';
  const pdf = (a.pdf_url as string) || '';
  const scorm = (a.scorm_url as string) || '';

  if (legacyType.includes('video') || youtube) {
    return { type: 'video', content: { youtubeUrl: youtube }, asset: youtube ? { kind: 'youtube' } : undefined };
  }
  if (legacyType.includes('pdf') || pdf) {
    return { type: 'pdf', content: { url: pdf }, asset: pdf ? { kind: 'pdf', storagePath: pdf } : undefined };
  }
  if (legacyType.includes('scorm') || scorm) {
    return { type: 'scorm', content: { url: scorm }, asset: scorm ? { kind: 'scorm_package', storagePath: scorm } : undefined };
  }
  if (legacyType.includes('quiz')) {
    return { type: 'quiz', content: {} };
  }
  return { type: 'text', content: { body: (a.content as string) || (a.description as string) || '' } };
}

async function main() {
  const legacyUrl = process.env.LEGACY_DATABASE_URL;
  const v2Url = process.env.DATABASE_URL;
  if (!legacyUrl || !v2Url) {
    throw new Error('Set LEGACY_DATABASE_URL and DATABASE_URL');
  }

  const legacy = postgres(legacyUrl, { prepare: false });
  const v2client = postgres(v2Url, { prepare: false });
  const db = drizzle(v2client, { schema });

  const stats = { tenants: 0, courses: 0, sections: 0, lessons: 0, assets: 0, skipped: 0 };
  const log = (...m: unknown[]) => console.log(DRY_RUN ? '[dry-run]' : '[migrate]', ...m);

  try {
    const legacyCourses = await legacy<Record<string, unknown>[]>`select * from courses`;
    log(`found ${legacyCourses.length} legacy courses`);

    // Resolve/create a v2 tenant per distinct legacy company slug.
    const tenantIdByCompany = new Map<string, string>();
    const companies = [...new Set(legacyCourses.map((c) => String(c.company_id)))];
    for (const company of companies) {
      const slug = slugify(company);
      const [existing] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
      if (existing) {
        tenantIdByCompany.set(company, existing.id);
        continue;
      }
      if (DRY_RUN) {
        log(`would create tenant ${slug}`);
        tenantIdByCompany.set(company, `dry-${slug}`);
      } else {
        const [t] = await db.insert(tenants).values({ slug, name: company, status: 'active' }).returning();
        tenantIdByCompany.set(company, t.id);
      }
      stats.tenants++;
    }

    for (const c of legacyCourses) {
      const tenantId = tenantIdByCompany.get(String(c.company_id))!;
      const slug = slugify(String(c.title ?? c.id));

      if (!DRY_RUN) {
        const [dup] = await db
          .select({ id: courses.id })
          .from(courses)
          .where(and(eq(courses.tenantId, tenantId), eq(courses.slug, slug)))
          .limit(1);
        if (dup) {
          stats.skipped++;
          continue;
        }
      }

      const legacySections = await legacy<Record<string, unknown>[]>`
        select * from course_sections where course_id = ${String(c.id)} order by "order" asc`;
      const legacyActivities = await legacy<Record<string, unknown>[]>`
        select * from course_activities where course_id = ${String(c.id)} order by "order" asc`;

      if (DRY_RUN) {
        log(`would migrate course "${c.title}" (${legacySections.length} sections, ${legacyActivities.length} activities)`);
        stats.courses++;
        stats.sections += legacySections.length;
        stats.lessons += legacyActivities.length;
        continue;
      }

      await db.transaction(async (tx) => {
        const [course] = await tx
          .insert(courses)
          .values({
            tenantId,
            title: String(c.title ?? 'Untitled'),
            slug,
            description: String(c.description ?? ''),
            status: 'draft',
            price: c.price != null ? String(c.price) : null,
            imageUrl: (c.image_url as string) ?? null,
            instructor: String(c.instructor ?? ''),
            level: String(c.level ?? 'Beginner'),
            category: (c.category as string) ?? null,
            certificateEnabled: Boolean(c.certificate_enabled),
          })
          .returning();
        stats.courses++;

        // legacy section id (text) -> new section uuid
        const sectionIdMap = new Map<string, string>();
        for (let i = 0; i < legacySections.length; i++) {
          const s = legacySections[i];
          const [section] = await tx
            .insert(sections)
            .values({
              tenantId,
              courseId: course.id,
              title: String(s.title ?? ''),
              position: Number(s.order ?? i),
              isFree: Boolean(s.is_free),
            })
            .returning();
          sectionIdMap.set(String(s.id), section.id);
          stats.sections++;
        }

        for (let i = 0; i < legacyActivities.length; i++) {
          const a = legacyActivities[i];
          const sectionUuid = sectionIdMap.get(String(a.section_id));
          if (!sectionUuid) continue; // orphan activity
          const mapped = mapActivity(a);
          const [lesson] = await tx
            .insert(lessons)
            .values({
              tenantId,
              courseId: course.id,
              sectionId: sectionUuid,
              title: String(a.title ?? 'Untitled'),
              type: mapped.type,
              position: Number(a.order ?? i),
              content: mapped.content,
            })
            .returning();
          stats.lessons++;

          if (mapped.asset) {
            await tx.insert(lessonAssets).values({
              tenantId,
              lessonId: lesson.id,
              kind: mapped.asset.kind,
              storagePath: mapped.asset.storagePath ?? null,
              metadata: { fileName: (a.file_name as string) ?? null },
            });
            stats.assets++;
          }
        }
      });
      log(`migrated course "${c.title}"`);
    }

    console.log('\nDone.', JSON.stringify(stats, null, 2));
  } finally {
    await legacy.end();
    await v2client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
