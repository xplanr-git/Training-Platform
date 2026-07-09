import Link from 'next/link';
import { createCourse } from '../actions';
import { NavForm } from '@/components/nav-form';

export default async function NewCourse({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const action = createCourse.bind(null, slug);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/courses" className="text-sm text-muted hover:underline">
        ← Courses
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">New course</h1>

      <NavForm action={action} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Title</span>
          <input
            name="title"
            required
            className="rounded-md border border-border px-3 py-2"
            placeholder="e.g. Workplace Safety Fundamentals"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Description</span>
          <textarea
            name="description"
            rows={4}
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Level</span>
            <select name="level" className="rounded-md border border-border px-3 py-2">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Price (blank = free)</span>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              className="rounded-md border border-border px-3 py-2"
            />
          </label>
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Create course
        </button>
      </NavForm>
    </div>
  );
}
