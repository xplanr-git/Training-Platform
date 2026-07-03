/**
 * Tenant storefront (catalog). Reached via subdomain rewrite in middleware:
 * `acme.domain/` -> `/t/acme`. Course catalog wiring lands in Phase C (C4).
 */
export default async function TenantHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold capitalize">{slug}</h1>
      <p className="mt-3 text-neutral-600">
        Course catalog for this academy will appear here.
      </p>
    </main>
  );
}
