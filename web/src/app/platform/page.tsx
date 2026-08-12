import { db, desc, count, tenants, memberships } from '@training-platform/db';
import { EmptyRow } from '@/components/empty-state';
import { setTenantStatus } from './actions';
import { NavForm } from '@/components/nav-form';
import { StatusBadge, type StatusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/**
 * Tenant status → Badge variant. This was a bespoke pill built from five off-token
 * colour families (green-50, blue-50, amber-50, red-50, neutral-100), which is a
 * sixth visual language for something the other three admin tables already express
 * with `Badge`.
 */
const STATUS_TONE: Record<string, StatusTone> = {
  active: 'green',
  trial: 'blue',
  past_due: 'amber',
  suspended: 'red',
  cancelled: 'grey',
};

/** The column printed the raw enum, so admins read "past_due". */
const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  trial: 'Trial',
  past_due: 'Past due',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
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
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl">Academies ({rows.length})</h1>
      </div>

      {/*
        Uses the Table primitive like the other three admin tables. It was
        hand-rolled `<table>/<thead>/<td>`, so it disagreed with them on row height,
        header treatment, hover and border colour — and, being the only one with its
        own `bg-surface`, it was also the only one whose rows were not grey.
      */}
      <div className="mt-6 overflow-x-auto rounded-(--radius-card) bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Academy</TableHead>
              <TableHead>Plan</TableHead>
              {/* The only genuinely numeric column in any of the four tables. */}
              <TableHead className="text-right">Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <span className="font-medium">{t.name}</span>
                  <span className="ml-2 text-xs text-muted">{t.slug}</span>
                </TableCell>
                <TableCell className="capitalize">{t.plan}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {countByTenant.get(t.id) ?? 0}
                </TableCell>
                <TableCell>
                  <StatusBadge tone={STATUS_TONE[t.status] ?? 'grey'}>
                    {STATUS_LABEL[t.status] ?? t.status}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-right">
                  {t.status === 'suspended' ? (
                    <NavForm
                      action={setTenantStatus.bind(null, t.id, 'active')}
                      className="inline"
                      quiet
                    >
                      <Button type="submit" variant="ghost" size="sm">
                        Reactivate
                      </Button>
                    </NavForm>
                  ) : (
                    <NavForm
                      action={setTenantStatus.bind(null, t.id, 'suspended')}
                      className="inline"
                      quiet
                      confirm="Suspend this academy? Its learners and admins lose access immediately."
                    >
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        Suspend
                      </Button>
                    </NavForm>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyRow title="No academies yet">
                    Each academy is a separate tenant with its own courses, learners and branding.
                    One is created the first time someone signs up on a subdomain.
                  </EmptyRow>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
