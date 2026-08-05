'use client';

/** Triggers the browser print dialog (for saving a certificate as PDF). */
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-muted print:hidden"
    >
      Print or save as PDF
    </button>
  );
}
