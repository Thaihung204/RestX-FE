/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // output: 'export', // Temporarily disable static export for i18n testing

  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    return [
      {
        source: '/api/admin/:path*',
        destination: `${apiUrl}/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
