'use client';

import { useEffect, useRef } from 'react';

/**
 * Drop inside a NavForm to make it save itself when a field changes — the
 * HubSpot pattern: edit, click away, it's saved. Renders nothing.
 *
 * Listens for the native `change` event, which fires once per real edit (on
 * blur for text fields, immediately for selects), so tabbing through
 * untouched fields never submits — and an unchanged form never reaches the
 * server or the audit log. Radix checkboxes are the exception: their hidden
 * input emits no native change, so a click on anything with role="checkbox"
 * queues a submit too.
 *
 * The short debounce coalesces a select-then-blur pair into one submit, and
 * the data-pending guard skips while NavForm already has a save in flight
 * (its disabled fieldset blocks further edits for that window anyway).
 */
export function AutoSubmit() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const form = ref.current?.closest('form');
    if (!form) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const queue = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!form.matches('[data-pending]')) form.requestSubmit();
      }, 250);
    };
    const onChange = () => queue();
    const onClick = (e: Event) => {
      if ((e.target as HTMLElement).closest('[role="checkbox"]')) queue();
    };
    form.addEventListener('change', onChange);
    form.addEventListener('click', onClick);
    return () => {
      form.removeEventListener('change', onChange);
      form.removeEventListener('click', onClick);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return <span ref={ref} hidden />;
}
