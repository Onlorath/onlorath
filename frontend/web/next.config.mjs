/** @type {import('next').NextConfig} */

// The Go API. The browser always talks to /api/v1 on this origin and Next proxies it,
// so cookies (refresh token) and uploads work without CORS.
const apiOrigin = process.env.API_INTERNAL_URL || 'http://localhost:8080';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${apiOrigin}/api/v1/:path*` }];
  },
};

export default nextConfig;
