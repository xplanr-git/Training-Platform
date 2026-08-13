import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PostHogProvider } from '@/components/posthog-provider';

/**
 * The one system face. sb-ui specifies SF Pro / Inter; Inter is the half that
 * exists off an Apple device, and the app was previously running whatever
 * `system-ui` resolved to — Segoe UI on Windows, Roboto on Android — so the
 * same screen had three different letterfits depending on who opened it.
 *
 * `variable` rather than `className` so globals.css owns the font stack: the
 * variable is consumed by --font-sans, which keeps the system-ui fallbacks in
 * one place instead of splitting them between here and the stylesheet.
 * `display: swap` renders in the fallback immediately rather than blocking on
 * the webfont — the alternative is invisible text on a slow connection.
 */
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Outdure Academy',
  description: 'Product training and certification for Outdure contractors and dealers.',
};

/**
 * Applies the stored theme before first paint, so a dark-preferring machine
 * never flashes the light shell. Inline and blocking by design: a deferred
 * script is exactly what produces the flash. `suppressHydrationWarning` on
 * <html> exists because this script legitimately changes the class before
 * React hydrates — that is the one attribute where server and client are
 * ALLOWED to disagree. CSP permits inline scripts (script-src
 * 'unsafe-inline'); if that ever tightens to nonces, this needs one too.
 *
 * localStorage 'theme': 'dark' | 'light' | 'auto' (absent = auto → follow
 * prefers-color-scheme). Kept in sync by ThemeToggle.
 */
const themeBoot = `try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
