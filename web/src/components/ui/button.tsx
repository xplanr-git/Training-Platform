'use client';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/components/ui/utils';

/**
 * sb-ui buttons: primary = ink, secondary = quiet outline, ghost = chrome-free.
 * There is no blue variant, and there should never be one — blue means "this is
 * a text link", so a blue button reads as a category error (GUIDELINES.md §1).
 *
 * `outline` follows sb's secondary: the hover DARKENS THE EDGE rather than
 * filling the button. A fill on hover makes a secondary button momentarily look
 * like the primary one, which is the whole thing the hierarchy is for.
 *
 * Sizes: a 44px phone tap target (h-11) that is stricter than WCAG 2.2 AA's
 * 24px minimum, stepping down to the system's one button height — 38px
 * (core.css `.sb-btn`) — from `sm:` up. mobile-conventions.test.ts pins the
 * exact shape of all three.
 *
 * Hover/active are the v4.1 interaction states, which demand a PERCEPTIBLE
 * hover ("never a sub-1% shift"): primary lifts with elevation and presses
 * back down on :active; secondary/outline firms its edge to ink over a sunken
 * wash; ghost takes the wash with a hairline inset. The shadows are the
 * system's own one-off state values, not the shadow-md ramp the fluffiness
 * rule bans. transform transitions are covered by the global
 * prefers-reduced-motion kill switch in globals.css.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-control font-semibold transition-[color,background-color,border-color,box-shadow,transform] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-[0_5px_16px_rgba(20,20,22,0.32)] hover:-translate-y-px active:translate-y-px active:shadow-none',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-card text-foreground-2 hover:border-foreground hover:bg-sunken hover:text-foreground hover:shadow-[0_2px_8px_rgba(20,20,22,0.12)] active:translate-y-px active:shadow-none',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'text-foreground-2 hover:bg-accent hover:text-accent-foreground hover:shadow-[inset_0_0_0_1px_var(--color-border-strong)]',
        link: 'text-link underline-offset-4 hover:text-link-hover hover:underline',
      },
      size: {
        default: 'h-11 px-4 py-2 sm:h-[38px]',
        sm: 'h-10 rounded-md px-3 sm:h-9',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-11 w-11 sm:h-[38px] sm:w-[38px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
