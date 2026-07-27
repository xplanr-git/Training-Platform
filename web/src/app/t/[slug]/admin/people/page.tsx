import { db, and, or, eq, ilike, desc, count, memberships, users } from '@training-platform/db';
import { withTenant } from '@/lib/tenant';
import { parsePage, pageMeta } from '@/lib/pagination';
import { Pagination } from '@/components/pagination';
import { InviteForm } from './invite-form';
import { setMemberRole, setMemberStatus } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { connectRoleLabel } from '@/lib/connect-roles';

const ROLE_LABELS: Record<string, string> = {
  company_admin: 'Admin',
  instructor: 'Instructor',
  learner: 'Learner',
  platform_admin: 'Platform',
};

export default async function People({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { q, page: pageParam } = await searchParams;
  const query = (q ?? '').trim();
  const ctx = await withTenant();

  const filters = ctx.tenantId ? [eq(memberships.tenantId, ctx.tenantId)] : [];
  if (ctx.tenantId && query) {
    filters.push(
      or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`))!,
    );
  }

  const [{ total } = { total: 0 }] = ctx.tenantId
    ? await db
        .select({ total: count() })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(and(...filters))
    : [];
  const meta = pageMeta(parsePage(pageParam), total);

  const rows = ctx.tenantId
    ? await db
        .select({
          id: memberships.id,
          userId: memberships.userId,
          role: memberships.role,
          connectRoleCode: memberships.connectRoleCode,
          status: memberships.status,
          name: users.name,
          email: users.email,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(and(...filters))
        .orderBy(desc(memberships.createdAt))
        .limit(meta.limit)
        .offset(meta.offset)
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">People</h1>
      <p className="mt-1 text-muted">Invite and manage members of your academy.</p>

      <div className="mt-6">
        <InviteForm tenantSlug={slug} />
      </div>

      <form method="get" className="mt-6 flex max-w-sm gap-2">
        <Input
          type="search"
          name="q"
          aria-label="Search people"
          defaultValue={query}
          placeholder="Search people…"
          className="flex-1"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-[--radius-card] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name || '—'}</TableCell>
                <TableCell className="text-muted">{m.email}</TableCell>
                <TableCell>
                  <form action={setMemberRole.bind(null, slug, m.id, nextRole(m.role))} className="inline">
                    <Button type="submit" variant="ghost" size="sm" title="Click to cycle role">
                      {ROLE_LABELS[m.role] ?? m.role}
                    </Button>
                  </form>
                </TableCell>
                <TableCell>
                  {connectRoleLabel(m.connectRoleCode) ? (
                    <Badge variant="secondary">{connectRoleLabel(m.connectRoleCode)}</Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={m.status === 'active' ? 'default' : 'outline'} className="capitalize">
                    {m.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {m.status === 'deactivated' ? (
                    <form action={setMemberStatus.bind(null, slug, m.id, 'active')} className="inline">
                      <Button type="submit" variant="ghost" size="sm">
                        Reactivate
                      </Button>
                    </form>
                  ) : (
                    <>
                      {m.status === 'invited' && (
                        <form action={setMemberStatus.bind(null, slug, m.id, 'active')} className="inline">
                          <Button type="submit" variant="ghost" size="sm">
                            Activate
                          </Button>
                        </form>
                      )}
                      <form action={setMemberStatus.bind(null, slug, m.id, 'deactivated')} className="inline">
                        <Button type="submit" variant="ghost" size="sm" className="text-muted">
                          Deactivate
                        </Button>
                      </form>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-muted">
                  No members yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination meta={meta} basePath="/admin/people" params={{ q: query || undefined }} />
    </div>
  );
}

/** Cycles learner → instructor → company_admin → learner for quick role edits. */
function nextRole(role: string): 'company_admin' | 'instructor' | 'learner' {
  if (role === 'learner') return 'instructor';
  if (role === 'instructor') return 'company_admin';
  return 'learner';
}
