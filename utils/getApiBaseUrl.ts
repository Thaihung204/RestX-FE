/**
 * Get API Base URL based on current domain
 * Simple and straightforward approach for multi-tenant architecture
 */

export const getApiBaseUrl = (): string => {
  // SSR fallback - use environment variable
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  const host = window.location.host;

  // Local development (localhost:3000, 127.0.0.1:3000)
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  // Local testing with .restx.local domains
  if (host.endsWith('.restx.local')) {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  // Admin domain: admin.restx.food → https://admin.restx.food/api
  if (host.startsWith('admin.restx.food')) {
    return 'https://admin.restx.food/api';
  }

  // Tenant domains: {tenant}.restx.food → https://{tenant}.restx.food/api
  if (host.endsWith('.restx.food')) {
    return `https://${host}/api`;
  }

  // Main domain: restx.food, www.restx.food → https://api.restx.food
  if (host === 'restx.food' || host === 'www.restx.food') {
    return 'https://api.restx.food';
  }

  // Fallback
  return process.env.NEXT_PUBLIC_API_URL || 'https://demo.restx.food/api';
};

/**
 * Extract tenant name from current domain
 * @returns Tenant name or null if not a tenant domain
 */
export const getTenantFromHost = (): string | null => {
  if (typeof window === 'undefined') return null;

  const host = window.location.host.split(':')[0]; // Remove port

  // Check for .restx.food or .restx.local
  const patterns = ['.restx.food', '.restx.local'];
  
  for (const pattern of patterns) {
    if (host.endsWith(pattern)) {
      const tenant = host.replace(pattern, '');
      // Exclude special subdomains
      if (tenant && tenant !== 'admin' && tenant !== 'www' && tenant !== 'restx') {
        return tenant;
      }
    }
  }

  return null;
};

/**
 * Check if current domain is admin domain
 */
export const isAdminDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  const host = window.location.host;
  return host.startsWith('admin.restx.food') || host.startsWith('admin.restx.local');
};

/**
 * Check if current domain is tenant domain
 */
export const isTenantDomain = (): boolean => {
  return getTenantFromHost() !== null;
};

export default getApiBaseUrl;
