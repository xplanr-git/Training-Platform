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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
