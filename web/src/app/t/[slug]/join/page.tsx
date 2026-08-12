import { notFound } from 'next/navigation';
import { tenantBySlug } from '@/lib/tenant';
import { JoinForm } from './join-form';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await tenantBySlug(slug);
  return { title: t ? `Request access — ${t.name}` : 'Request access' };
}

/**
 * Public "ask to join this academy" page.
 *
 * Distinct from /signup, which provisions a whole academy plus an owner. This
 * creates a learner account whose membership is 'pending' until an admin
 * accepts it in People.
 */
export default async function JoinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // generateMetadata resolved this a moment ago; request-cached, so no second read.
  const tenant = await tenantBySlug(slug);
  if (!tenant) notFound();

  return (
    <main className="mx-auto w-full max-w-md px-6 py-12 sm:py-14">
      <h1 className="text-2xl">Request access</h1>
      <p className="mt-2 text-muted">
        Ask to join {tenant.name}. An administrator reviews every request, so you will not be able
        to sign in to the courses until yours is accepted.
      </p>
      <JoinForm tenantSlug={slug} academyName={tenant.name} />
    </main>
  );
}
