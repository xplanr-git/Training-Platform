import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createCourse } from '../actions';
import { NavForm } from '@/components/nav-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default async function NewCourse({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const action = createCourse.bind(null, slug);

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Courses
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">New course</h1>

      <Card className="mt-6">
        <CardContent className="py-6">
          <NavForm action={action} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="e.g. Deck Frame Installation"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                placeholder="What this course covers…"
              />
            </div>
            <div className="flex max-w-xs flex-col gap-1.5">
              <Label htmlFor="level">Level</Label>
              <select
                id="level"
                name="level"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <Button type="submit" className="self-start">
              Create course
            </Button>
          </NavForm>
        </CardContent>
      </Card>
    </div>
  );
}
