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
    // Admin API URL - for tenant verification and super admin operations (RestX.Admin port 4999)
    const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:4999/api';
    // Tenant API URL - for tenant-specific operations (RestX.WebApp port 5000)
    const tenantApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
