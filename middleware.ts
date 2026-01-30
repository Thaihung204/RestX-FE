import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  // Landing domains - serve public landing page
  const LANDING_DOMAINS = new Set(["restx.food", "www.restx.food"]);

  // Super Admin domain - serve /tenants (manage all tenants)
  const ADMIN_DOMAIN = 'admin.restx.food';

  // Development domains - no routing logic
  const DEVELOPMENT_DOMAINS = new Set(["localhost", "127.0.0.1"]);

  // Public routes accessible on any domain
  const PUBLIC_ROUTES = new Set([
    "/login",
    "/login-email",
    "/login-admin",
    "/register",
    "/forgot-password",
    "/restaurant",
    "/customer",
    "/menu",
    "/reset-password",
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

  // Development mode - allow all routes for plain localhost
  // But NOT for subdomains like demo.localhost (those are treated as tenant domains)
  const isPlainDevelopment =
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host === '127.0.0.1' ||
    host.startsWith('127.0.0.1:');

  if (isPlainDevelopment) {
    return NextResponse.next();
  }

  // Landing domains (restx.food, www.restx.food) - serve public landing page
  if (LANDING_DOMAINS.has(host)) {
    return NextResponse.next();
  }

  // Super Admin domain (admin.restx.food or admin.localhost) - route to /tenants
  const hostWithoutPort = host.includes(':') ? host.split(':')[0] : host;
  const isAdminDomain = host === ADMIN_DOMAIN || hostWithoutPort === 'admin.localhost';

  if (isAdminDomain) {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/tenants', req.url));
    }

    if (pathname.startsWith('/tenants')) {
      return NextResponse.next();
    }

    return NextResponse.rewrite(new URL(`/tenants${pathname}`, req.url));
  }

  // Tenant domains:
  // - Production: *.restx.food (excluding www, admin, and root)
  // - Development: *.localhost (e.g., demo.localhost:3000, excluding admin.localhost)
  const isTenantDomain =
    (host.endsWith('.restx.food') && !LANDING_DOMAINS.has(host) && host !== ADMIN_DOMAIN) ||
    (host.includes('.localhost') && hostWithoutPort !== 'admin.localhost');

  if (isTenantDomain) {
    // Root path → restaurant page (for customers)
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/restaurant', req.url));
    }

    // Tenant admin routes → allow through
    if (pathname.startsWith('/admin')) {
      return NextResponse.next();
    }

    // Staff routes → allow through
    if (pathname.startsWith('/staff')) {
      return NextResponse.next();
    }

    // Other paths → allow through (could be /restaurant, /customer, /menu, etc)
    return NextResponse.next();
  }

  // Unknown domain - allow through
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
