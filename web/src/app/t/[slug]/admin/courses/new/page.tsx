import Link from 'next/link';
import { BackLink } from '@/components/back-link';
import { createCourse } from '../actions';
import { NavForm } from '@/components/nav-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default async function NewCourse({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const action = createCourse.bind(null, slug);

  return (
    <div className="max-w-2xl">
      <BackLink href="/admin/courses">Courses</BackLink>
      <h1 className="mt-3 text-2xl">New course</h1>

      <Card className="mt-6">
        <CardContent className="py-6">
          <NavForm action={action} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required placeholder="e.g. Deck Frame Installation" />
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
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
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
