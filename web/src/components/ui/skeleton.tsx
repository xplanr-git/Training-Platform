// No "use client": this renders no interactivity, so keeping it a server
// component lets loading.tsx use it without opening a client boundary.
import { cn } from '@/components/ui/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-accent animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
