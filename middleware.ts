import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const pathname = req.nextUrl.pathname;

  // Landing domains - serve public landing page
  const LANDING_DOMAINS = new Set([
    'restx.food',
    'www.restx.food',
  ]);

  // Admin subdomain - serve /dashboard
  const ADMIN_DOMAIN = 'admin.restx.food';

  // Development domains - no routing logic
  const DEVELOPMENT_DOMAINS = new Set([
    'localhost',
    '127.0.0.1',
  ]);

  // Public routes accessible on any domain
  const PUBLIC_ROUTES = new Set([
    '/login',
    '/login-email',
    '/login-admin',
    '/register',
    '/forgot-password',
    '/restaurant',
    '/customer',
    '/menu',
  ]);

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|otf)$/)
  ) {
    return NextResponse.next();
  }

  // Allow public routes on any domain
  const isPublicRoute =
    PUBLIC_ROUTES.has(pathname) ||
    pathname.startsWith('/restaurant') ||
    pathname.startsWith('/customer') ||
    pathname.startsWith('/menu');

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Development mode - allow all routes
  const isDevelopment = DEVELOPMENT_DOMAINS.has(host) || host.startsWith('localhost:') || host.startsWith('127.0.0.1:');

  if (isDevelopment) {
    return NextResponse.next();
  }

  // Landing domains (restx.food, www.restx.food) - serve public landing page
  if (LANDING_DOMAINS.has(host)) {
    return NextResponse.next();
  }

  // Admin domain (admin.restx.food) - route to /dashboard
  if (host === ADMIN_DOMAIN) {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/dashboard', req.url));
    }

    if (pathname.startsWith('/dashboard')) {
      return NextResponse.next();
    }

    return NextResponse.rewrite(new URL(`/dashboard${pathname}`, req.url));
  }

  // Tenant domains (*.restx.food excluding www, admin, and root)
  const isTenantDomain = host.endsWith('.restx.food') && !LANDING_DOMAINS.has(host) && host !== ADMIN_DOMAIN;

  if (isTenantDomain) {
    // Root path → restaurant page (for customers)
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/restaurant', req.url));
    }

    // Staff routes → allow through
    if (pathname.startsWith('/staff')) {
      return NextResponse.next();
    }

    // Other paths → allow through (could be /restaurant, /customer, etc)
    return NextResponse.next();
  }

  // Unknown domain - allow through
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

