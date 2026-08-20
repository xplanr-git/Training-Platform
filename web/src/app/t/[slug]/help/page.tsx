import { redirect } from 'next/navigation';
import { getTenantContext, tenantBySlug } from '@/lib/tenant';
import { LearnerShell } from '@/components/learner-shell';
import { HelpForm } from '@/components/help-form';
import { submitHelpRequest } from './actions';

/**
 * Help — reachable from the shell on every learner app page, and deep-linked
 * with context (?course=&topic=&item=&from=) from the learning flow so a request
 * carries where the learner was. Simple v1: a message routed to Outdure.
 */
export default async function HelpPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    course?: string;
    courseTitle?: string;
    topic?: string;
    item?: string;
    from?: string;
  }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const ctx = await getTenantContext();
  if (!ctx) redirect('/login');
  const tenant = await tenantBySlug(slug);

  const path = sp.from ?? `/t/${slug}/help`;
  const contextLine =
    [
      sp.courseTitle && `course “${sp.courseTitle}”`,
      sp.topic && `topic “${sp.topic}”`,
      sp.item && `“${sp.item}”`,
    ]
      .filter(Boolean)
      .join(' · ') || null;

  const action = submitHelpRequest.bind(null, slug, {
    path,
    courseSlug: sp.course,
    courseTitle: sp.courseTitle,
    topicTitle: sp.topic,
    item: sp.item,
  });

  return (
    <>
      <LearnerShell slug={slug} tenantName={tenant?.name ?? 'Outdure Academy'} active="help" />
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-14">
        <h1 className="text-2xl">Get help</h1>
        <p className="text-foreground-2 mt-2 max-w-prose text-sm leading-relaxed">
          Stuck on a lesson, a knowledge check, or getting into your account? Send the Outdure team
          a message and we’ll help. If you’re part-way through training, we’ll include where you
          were so you don’t have to explain it.
        </p>
        <div className="mt-6">
          <HelpForm action={action} contextLine={contextLine} />
        </div>
      </main>
    </>
  );
}
