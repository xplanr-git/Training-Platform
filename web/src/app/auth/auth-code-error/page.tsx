import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Where /auth/confirm sends a link it could not verify.
 *
 * This is a routine outcome, not an error state to apologise for: the token is
 * single-use and time-limited, so it fires for an already-used link, an expired
 * one, or one a mail scanner opened first. Sending these users to /login would
 * be actively wrong — an invitee has no password yet.
 */
export const metadata = { title: 'Link expired · Outdure Academy' };

export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-600 text-white">
          <GraduationCap className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold">Outdure Academy</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>That link has already been used</CardTitle>
          <CardDescription>
            Invitation and password links work once, then expire.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-muted">
            This also happens if the link was opened twice, or if your email provider
            checked it before you did. Request a new one and it will work.
          </p>
          <Button asChild>
            <Link href="/login/forgot">Send me a new link</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
