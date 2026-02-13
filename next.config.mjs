/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "standalone", // Disable for local development
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
    // Internal API URLs - default to production since local BE is not running
    console.log('API Config:', {
      INTERNAL_ADMIN_API_URL: process.env.INTERNAL_ADMIN_API_URL,
      INTERNAL_API_URL: process.env.INTERNAL_API_URL
    });

    const adminApiUrl = process.env.INTERNAL_ADMIN_API_URL || 'https://admin.restx.food/api';
    const tenantApiUrl = process.env.INTERNAL_API_URL || 'https://demo.restx.food/api';

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
