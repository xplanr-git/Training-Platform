import Link from 'next/link';

export default async function CourseBuilder({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return (
    <div>
      <Link
        href={`/admin/courses/${courseId}`}
        className="text-sm text-muted hover:underline"
      >
        ← Course
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Course content</h1>
      <p className="mt-2 text-muted">
        Section / lesson authoring (video, PDF, quiz) lands in Phase C (C3).
      </p>
    </div>
  );
}
