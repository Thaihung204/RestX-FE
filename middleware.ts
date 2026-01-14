import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const pathname = req.nextUrl.pathname;

  // Admin domains (whitelisted) - serve /dashboard
  const ADMIN_DOMAINS = new Set([
    'restx.food',
    'admin.restx.food',
  ]);

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

  // Allow public routes
  const isPublicRoute =
    PUBLIC_ROUTES.has(pathname) ||
    pathname.startsWith('/restaurant') ||
    pathname.startsWith('/customer');

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Development mode - allow all routes
  const isDevelopment = DEVELOPMENT_DOMAINS.has(host) || host.startsWith('localhost:') || host.startsWith('127.0.0.1:');

  if (isDevelopment) {
    return NextResponse.next();
  }

  // Admin domain (explicit whitelist)
  const isAdminDomain = ADMIN_DOMAINS.has(host);

  // Tenant domain (subdomain of restx.food, excluding admin)
  const isTenantDomain = host.endsWith('.restx.food') && !isAdminDomain;

  // Admin domain routing → /dashboard
  if (isAdminDomain) {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/dashboard', req.url));
    }

    if (pathname.startsWith('/dashboard')) {
      return NextResponse.next();
    }

    return NextResponse.rewrite(new URL(`/dashboard${pathname}`, req.url));
  }

  // Tenant domain routing → /staff
  if (isTenantDomain) {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/staff', req.url));
    }

    if (pathname.startsWith('/staff')) {
      return NextResponse.next();
    }

    return NextResponse.rewrite(new URL(`/staff${pathname}`, req.url));
  }

  // Unknown domain - allow through
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

