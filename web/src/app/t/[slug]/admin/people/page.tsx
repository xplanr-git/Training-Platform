import {
  db,
  and,
  or,
  eq,
  ne,
  ilike,
  asc,
  desc,
  count,
  memberships,
  users,
} from '@training-platform/db';
import Link from 'next/link';
import { EmptyRow } from '@/components/empty-state';
import { requireAdminForSlug } from '@/lib/tenant';
import { parsePage, pageMeta, PAGE_SIZE } from '@/lib/pagination';
import { Pagination } from '@/components/pagination';
import { InviteForm } from './invite-form';
import { RoleSelect } from './role-select';
import { setMemberStatus, acceptJoinRequest, declineJoinRequest } from './actions';
import { canViewAs } from '@/lib/view-as';
import { startViewAs } from '@/lib/view-as-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { SegmentedNav } from '@/components/ui/segmented';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { connectRoleLabel } from '@/lib/connect-roles';
import { NavForm } from '@/components/nav-form';

export const metadata = { title: 'People' };

/**
 * The membership states a ?status= filter may name. 'pending' is deliberately
 * absent: pending rows are join REQUESTS, not members — they live in their own
 * section above the table, so a filter that surfaced them here would show
 * someone with no access beside people who have it.
 */
const MEMBER_STATUSES = ['active', 'invited', 'deactivated'] as const;
type MemberStatusFilter = (typeof MEMBER_STATUSES)[number];

export default async function People({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const { slug } = await params;
  const { q, page: pageParam, status: statusParam } = await searchParams;
  const query = (q ?? '').trim();
  // Validated against the closed set, not passed through: ?status= is
  // user-controlled input on its way into a WHERE clause.
  const statusFilter = MEMBER_STATUSES.includes(statusParam as MemberStatusFilter)
    ? (statusParam as MemberStatusFilter)
    : undefined;
  const ctx = await requireAdminForSlug(slug);

  // Pending rows are join REQUESTS, not members, and are listed separately
  // below (see MEMBER_STATUSES). A named filter is always a non-pending value,
  // so the equality subsumes the exclusion.
  const filters = ctx.tenantId
    ? [
        eq(memberships.tenantId, ctx.tenantId),
        statusFilter ? eq(memberships.status, statusFilter) : ne(memberships.status, 'pending'),
      ]
    : [];
  if (ctx.tenantId && query) {
    filters.push(or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`))!);
  }

  // Segment hrefs keep the search query and drop ?page= — a changed filter
  // starts at page 1 of the new result set.
  const filterHref = (status?: MemberStatusFilter) => {
    const p = new URLSearchParams();
    if (query) p.set('q', query);
    if (status) p.set('status', status);
    const qs = p.toString();
    return `/admin/people${qs ? `?${qs}` : ''}`;
  };

  /*
    Count and rows are independent, so they run together rather than as two
    sequential round trips. The offset comes DIRECTLY from ?page= — pageMeta clamps
    against a pageCount derived from the total, so a provisional total of 0 would
    pin every request to page 1. Same shape as t/[slug]/page.tsx.
  */
  const requestedPage = parsePage(pageParam);
  const requestedOffset = (requestedPage - 1) * PAGE_SIZE;
  const rowsAt = (offset: number) =>
    db
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
      .limit(PAGE_SIZE)
      .offset(offset);

  // The pending-requests list is independent of both, so it joins the same batch
  // rather than adding a third wave. Oldest first: a request that has waited
  // longest should be decided first.
  const [countRows, requestedRows, requests] = await Promise.all([
    ctx.tenantId
      ? db
          .select({ total: count() })
          .from(memberships)
          .innerJoin(users, eq(users.id, memberships.userId))
          .where(and(...filters))
      : Promise.resolve([] as Array<{ total: number }>),
    ctx.tenantId
      ? rowsAt(requestedOffset)
      : Promise.resolve([] as Awaited<ReturnType<typeof rowsAt>>),
    ctx.tenantId
      ? db
          .select({
            id: memberships.id,
            name: users.name,
            email: users.email,
            createdAt: memberships.createdAt,
          })
          .from(memberships)
          .innerJoin(users, eq(users.id, memberships.userId))
          .where(and(eq(memberships.tenantId, ctx.tenantId), eq(memberships.status, 'pending')))
          .orderBy(asc(memberships.createdAt))
      : Promise.resolve(
          [] as Array<{ id: string; name: string | null; email: string; createdAt: Date }>,
        ),
  ]);
  const total = countRows[0]?.total ?? 0;
  const meta = pageMeta(requestedPage, total);

  const rows =
    !ctx.tenantId || meta.offset === requestedOffset ? requestedRows : await rowsAt(meta.offset);

  return (
    <div>
      <h1 className="text-2xl">People</h1>
      <p className="mt-1 text-muted">Invite and manage members of your academy.</p>

      <div className="mt-6">
        <InviteForm tenantSlug={slug} />
      </div>

      {/*
        Above the members table on purpose: a request is the only thing on this
        page that needs a decision, and it is invisible to the person waiting
        until someone makes it. Rendered only when there is something to decide,
        so the page is unchanged for academies that never use /join.
      */}
      {/*
        A flush list, not a data table — so it takes the keyline treatment: 2px
        dark under its header, 1px dark between items, and no outer box
        (GUIDELINES.md §2). A data table would keep light row dividers instead;
        the distinction is what stops every list in the admin area from
        converging on the same heavy grid.
      */}
      {requests.length > 0 && (
        <section className="mt-6 rounded-(--radius-card) bg-surface">
          <h2 className="border-b-[1.75px] border-keyline px-4 py-3 text-h2 font-bold">
            Requests to join
            <span className="ml-2 text-sm font-normal text-muted tabular-nums">
              {requests.length} waiting
            </span>
          </h2>
          <ul>
            {requests.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-keyline px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="font-medium">{r.name || '—'}</p>
                  <p className="text-sm text-muted">{r.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <NavForm action={acceptJoinRequest.bind(null, slug, r.id)} quiet>
                    <Button type="submit" size="sm">
                      Accept
                    </Button>
                  </NavForm>
                  <NavForm
                    action={declineJoinRequest.bind(null, slug, r.id)}
                    quiet
                    confirm={`Decline the request from ${r.email}? They are not told, and they can ask again.`}
                  >
                    <Button type="submit" size="sm" variant="destructive-ghost">
                      Decline
                    </Button>
                  </NavForm>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SegmentedNav
          label="Filter people by status"
          items={[
            { label: 'All', href: filterHref(), active: !statusFilter },
            ...MEMBER_STATUSES.map((s) => ({
              label: s[0].toUpperCase() + s.slice(1),
              href: filterHref(s),
              active: statusFilter === s,
            })),
          ]}
        />
        <form method="get" className="flex max-w-sm flex-1 gap-2">
          {/* The form submits ?q= and would drop ?status= — carry it. */}
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
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
      </div>

      <div className="mt-6 overflow-x-auto rounded-(--radius-card) bg-surface">
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
                  <RoleSelect
                    tenantSlug={slug}
                    membershipId={m.id}
                    role={m.role}
                    personLabel={m.name || m.email}
                    // Not your own row (no self role-change) and not a platform
                    // admin (not demotable from a tenant screen).
                    editable={m.role !== 'platform_admin' && m.userId !== ctx.userId}
                  />
                </TableCell>
                <TableCell>
                  {connectRoleLabel(m.connectRoleCode) ? (
                    <Badge variant="secondary">{connectRoleLabel(m.connectRoleCode)}</Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    tone={
                      m.status === 'active' ? 'green' : m.status === 'invited' ? 'amber' : 'grey'
                    }
                    className="capitalize"
                  >
                    {m.status}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-right">
                  {m.status === 'deactivated' ? (
                    <NavForm
                      action={setMemberStatus.bind(null, slug, m.id, 'active')}
                      className="inline"
                      quiet
                    >
                      <Button type="submit" variant="ghost" size="sm">
                        Reactivate
                      </Button>
                    </NavForm>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      {canViewAs(ctx.role, m.role) && m.userId !== ctx.userId && (
                        <NavForm
                          action={startViewAs.bind(null, slug, m.userId)}
                          className="inline"
                          quiet
                        >
                          <Button type="submit" variant="ghost" size="sm">
                            View as
                          </Button>
                        </NavForm>
                      )}
                      {m.status === 'invited' && (
                        <NavForm
                          action={setMemberStatus.bind(null, slug, m.id, 'active')}
                          className="inline"
                          quiet
                        >
                          <Button type="submit" variant="ghost" size="sm">
                            Activate
                          </Button>
                        </NavForm>
                      )}
                      <NavForm
                        action={setMemberStatus.bind(null, slug, m.id, 'deactivated')}
                        className="inline"
                        quiet
                        confirm="Deactivate this member? They lose access immediately. Their progress and certificates are kept, and you can reactivate them here."
                      >
                        <Button type="submit" variant="ghost" size="sm" className="text-muted">
                          Deactivate
                        </Button>
                      </NavForm>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  {query ? (
                    <EmptyRow title={`No one matches “${query}”`}>
                      Search looks at names and email addresses. Try a shorter search, or{' '}
                      <Link
                        href={filterHref(statusFilter)}
                        className="text-link hover:text-link-hover hover:underline font-semibold"
                      >
                        show everyone
                      </Link>
                      .
                    </EmptyRow>
                  ) : statusFilter ? (
                    // A filter with no rows is not "no one here yet" — the
                    // academy may be full of members in other states.
                    <EmptyRow title={`No ${statusFilter} members`}>
                      Nothing is in this state right now.{' '}
                      <Link
                        href={filterHref()}
                        className="text-link hover:text-link-hover hover:underline font-semibold"
                      >
                        Show everyone
                      </Link>
                      .
                    </EmptyRow>
                  ) : (
                    <EmptyRow title="No one here yet">
                      Invite a contractor or dealer using the form above. They get an email with a
                      link to set a password, and appear here once they accept.
                    </EmptyRow>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        meta={meta}
        basePath="/admin/people"
        params={{ q: query || undefined, status: statusFilter }}
      />
    </div>
  );
}
