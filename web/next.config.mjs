/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The v2 database schema lives in the sibling db/ package (TS source).
  transpilePackages: ['@training-platform/db'],
  experimental: {
    // Server Actions are the default mutation path (no REST fan-out).
  },
};

export default nextConfig;
