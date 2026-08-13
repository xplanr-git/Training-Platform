'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/components/ui/utils';

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // `.sb-modal-overlay`: an ink-tinted scrim (~42%), not pure black.
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-foreground/40 fixed inset-0 z-50',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      {/*
        core.css `.sb-modal`: elevated white (bg-card), 460px, radius 4,
        shadow-pop, no border — the pop shadow says "floating". p-0/gap-0: the
        sections carry their own padding and separators (keylined title
        masthead, body description, hairline footer), same as alert-dialog.tsx.
      */}
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'bg-card data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-0 overflow-hidden rounded-md p-0 shadow-pop duration-200 sm:max-w-[460px]',
          className,
        )}
        {...props}
      >
        {children}
        {/*
          No focus ring of its own: the global :focus-visible outline in
          globals.css is the app's single focus treatment (focus-conventions.test.ts).
          The kit shipped focus:ring + focus:outline-hidden here, which both added a
          second ring and suppressed the global one.

          top-5 right-5 centres the icon on the masthead row (py-5 + a 16px
          title line), per `.sb-modal .mh`'s justify-between.
        */}
        <DialogPrimitive.Close className="data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-5 right-5 rounded-xs opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

/**
 * Header is a transparent column: the DS structure lives on Title (the keylined
 * masthead) and Description (the body) — see alert-dialog.tsx.
 */
function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      // `.sb-modal .mf`: above the LIGHT hairline — the keyline belongs to the
      // masthead alone ("sections dark, rows light", inside a modal too).
      className={cn(
        'border-border flex flex-col-reverse gap-3 border-t px-5 py-4 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      // core.css `.sb-modal .mh h3`: 16/800 in a padded masthead with the 1px
      // dark keyline under it — heavier and one step smaller than the stock
      // 18/600, so the title reads as the modal's masthead rather than a page
      // heading that wandered into a popup. pr-12 keeps it clear of the close
      // button.
      className={cn('border-keyline border-b px-5 py-5 pr-12 text-base font-extrabold', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      // `.sb-modal .mb`: body copy at the 13.5 control size, text-2, 1.6 line.
      className={cn('text-foreground-2 text-control px-5 py-5 leading-relaxed', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
