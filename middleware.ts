import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  // Public routes that should work on both domains
  const publicRoutes = [
    '/login',
    '/login-email',
    '/login-admin',
    '/register',
    '/forgot-password',
    '/restaurant',
    '/customer',
  ];

  // Check if it's a static file or API route (skip middleware)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Check if it's a public route
  const isPublicRoute = publicRoutes.includes(pathname) || 
    pathname.startsWith('/restaurant') || 
    pathname.startsWith('/customer');

  // Tenant domain (demo.restx.food)
  const isTenantDomain = host.startsWith("demo.") || host === "demo.restx.food";
  
  // Admin domain (restx.food - root domain only, not subdomains)
  const isAdminDomain = host === "restx.food" || 
    (host.endsWith(".restx.food") && !host.startsWith("demo."));

  // Development mode: allow all routes (localhost, 127.0.0.1, etc.)
  const isDevelopment = host.includes("localhost") || 
    host.includes("127.0.0.1") || 
    host.includes("0.0.0.0");
    // host.includes(".vercel.app");

  if (isDevelopment) {
    // In development, allow all routes to work normally
    return NextResponse.next();
  }

  // Tenant domain routing
  if (isTenantDomain) {
    // Allow public routes
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Root path → rewrite to /restaurant (for demo.restx.food/)
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/restaurant', req.url));
    }

    // Already on /staff/* path, allow it
    if (pathname.startsWith('/staff')) {
      return NextResponse.next();
    }

    // Rewrite other paths to /staff/* for tenant
    return NextResponse.rewrite(new URL(`/staff${pathname}`, req.url));
  }

  // Admin domain routing
  if (isAdminDomain) {
    // Allow public routes
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Root path → render app/page.tsx (no rewrite needed)
    if (pathname === '/') {
      return NextResponse.next();
    }

    // Already on /dashboard/* path, allow it
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.next();
    }

    // Rewrite other paths to /dashboard/* for admin
    return NextResponse.rewrite(new URL(`/dashboard${pathname}`, req.url));
  }

  // Default: allow the request to proceed (for other domains or fallback)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

