/** @type {import('next').NextConfig} */
const nextConfig = {
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
    return [
      {
        source: '/api/admin/:path*',
        destination: 'https://admin.restx.food/api/:path*',
      },
    ];
  },
};

export default nextConfig;
