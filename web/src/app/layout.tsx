import type { Metadata } from 'next';
import './globals.css';
import { PostHogProvider } from '@/components/posthog-provider';

export const metadata: Metadata = {
  title: 'Outdure Academy',
  description: 'Product training and certification for Outdure contractors and dealers.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
