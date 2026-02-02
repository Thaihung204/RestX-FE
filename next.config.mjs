/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // output: 'export', // Temporarily disable static export for i18n testing

  // Specify the path if your app is not deployed at the root of your domain.
  // basePath: '/',

  // Optional: Change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
  // trailingSlash: true,

  // Optional: Prevent automatic `/me` -> `/me/`, instead preserve `href`
  // skipTrailingSlashRedirect: true,

  // Optional: Change the output directory `out` -> `dist`. Remember to update
  // it in .gitlab-ci.yml as well.
  // distDir: 'dist',
  reactStrictMode: false,
  // Bypass CORS for Admin API during development
  async rewrites() {
    // Internal API URLs - for development, these point to localhost
    // In Docker, these would be set to internal container names
    const adminApiUrl = process.env.INTERNAL_ADMIN_API_URL || 'http://localhost:4999/api';
    const tenantApiUrl = process.env.INTERNAL_API_URL || 'http://localhost:5000/api';

    return [
      // Admin API rewrites - always go to admin backend
      {
        source: '/api/admin/:path*',
        destination: `${adminApiUrl}/:path*`,
      },
      // Tenant API rewrites - go to tenant backend (development only)
      {
        source: '/api/:path*',
        destination: `${tenantApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
