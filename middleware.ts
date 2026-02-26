import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  // Landing domains - serve public landing page
  const LANDING_DOMAINS = new Set(["restx.food", "www.restx.food"]);

  // Super Admin domain - serve /tenants (manage all tenants)
  const ADMIN_DOMAIN = 'admin.restx.food';

  // Custom tenant domains (mapped in DB)
  const CUSTOM_TENANT_DOMAINS = new Set([
    "lebon.io.vn",
  ]);

  // Public routes accessible on any domain (no auth needed)
  const PUBLIC_ROUTES = new Set([
    "/login",
    "/login-email",
    "/login-admin",
    "/register",
    "/forgot-password",
    "/restaurant",
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
    pathname.startsWith('/restaurant');

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Development mode - allow all routes for plain localhost (no subdomain)
  const isPlainDevelopment =
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host === '127.0.0.1' ||
    host.startsWith('127.0.0.1:');

  if (isPlainDevelopment) {
    return NextResponse.next();
  }

  // Landing domains (restx.food, www.restx.food)
  if (LANDING_DOMAINS.has(host)) {
    return NextResponse.next();
  }

  const hostWithoutPort = host.includes(':') ? host.split(':')[0] : host;
  const isAdminDomain = host === ADMIN_DOMAIN || hostWithoutPort === 'admin.localhost';

  // ── Auth token check (read cookie set by authService on login) ──
  const accessToken = req.cookies.get('accessToken')?.value;
  const hasAuthToken = !!accessToken;

  // Super Admin domain (admin.restx.food or admin.localhost) → /tenants
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
  // - Production: *.restx.food (excluding www, admin, root)
  // - Development: *.localhost (e.g., demo.localhost:3000, excluding admin.localhost)
  const isTenantDomain =
    CUSTOM_TENANT_DOMAINS.has(hostWithoutPort) ||
    (host.endsWith('.restx.food') &&
      !LANDING_DOMAINS.has(host) &&
      host !== ADMIN_DOMAIN) ||
    (host.includes('.localhost') &&
      hostWithoutPort !== 'admin.localhost');

  if (isTenantDomain) {
    // Root path → restaurant landing page
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/restaurant', req.url));
    }

    // ── Protect /admin/* — require auth token in cookie ──
    if (pathname.startsWith('/admin')) {
      if (!hasAuthToken) {
        const loginUrl = new URL('/login-email', req.url);
        // Pass redirect so login page can send user back after login
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      // Has token → let AdminAuthGuard do the role check on client
      return NextResponse.next();
    }

    // Customer-facing authenticated routes: require access token
    if (
      (pathname === '/customer' || pathname.startsWith('/customer/')) ||
      (pathname === '/menu' || pathname.startsWith('/menu/'))
    ) {
      if (!hasAuthToken) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    // Staff routes
    if (pathname.startsWith('/staff')) {
      return NextResponse.next();
    }

    // All other paths
    return NextResponse.next();
  }

  // Unknown domain
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
