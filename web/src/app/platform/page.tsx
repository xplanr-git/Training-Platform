import { db, desc, count, tenants, memberships } from '@training-platform/db';
import { setTenantStatus } from './actions';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  trial: 'bg-blue-50 text-blue-700',
  past_due: 'bg-amber-50 text-amber-700',
  suspended: 'bg-red-50 text-red-700',
  cancelled: 'bg-neutral-100 text-neutral-600',
};

export default async function PlatformHome() {
  const rows = await db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      name: tenants.name,
      plan: tenants.planId,
      status: tenants.status,
      createdAt: tenants.createdAt,
    })
    .from(tenants)
    .orderBy(desc(tenants.createdAt));

  // Member counts per tenant (small N of tenants at MVP scale).
  const memberCounts = await db
    .select({ tenantId: memberships.tenantId, n: count() })
    .from(memberships)
    .groupBy(memberships.tenantId);
  const countByTenant = new Map(memberCounts.map((m) => [m.tenantId, Number(m.n)]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tenants ({rows.length})</h2>
      </div>

      <div className="mt-4 overflow-x-auto rounded-[--radius-card] border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Academy</th>
              <th className="px-4 py-2 font-medium">Plan</th>
              <th className="px-4 py-2 font-medium">Members</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <span className="font-medium">{t.name}</span>
                  <span className="ml-2 text-xs text-muted">{t.slug}</span>
                </td>
                <td className="px-4 py-3 capitalize">{t.plan}</td>
                <td className="px-4 py-3">{countByTenant.get(t.id) ?? 0}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[t.status] ?? ''
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {t.status === 'suspended' ? (
                    <form action={setTenantStatus.bind(null, t.id, 'active')}>
                      <button className="text-brand-600 hover:underline">Reactivate</button>
                    </form>
                  ) : (
                    <form action={setTenantStatus.bind(null, t.id, 'suspended')}>
                      <button className="text-red-600 hover:underline">Suspend</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No tenants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
