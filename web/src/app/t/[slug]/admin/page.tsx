/** Tenant admin dashboard overview. Auth + role are enforced by the layout. */
export default function TenantAdminOverview() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-muted">
        Welcome to your academy admin. Use the sidebar to manage courses, people,
        and settings.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {['Courses', 'Learners', 'Completions'].map((label) => (
          <div
            key={label}
            className="rounded-[--radius-card] border border-border bg-surface p-5"
          >
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-1 text-2xl font-semibold">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
