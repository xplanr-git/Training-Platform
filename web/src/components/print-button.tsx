'use client';

import { Button } from '@/components/ui/button';

/** Triggers the browser print dialog (for saving a certificate as PDF). */
export function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()} className="print:hidden">
      Print or save as PDF
    </Button>
  );
}
