/**
 * Get API Base URL based on current domain
 * Supports multi-tenant architecture with subdomain routing
 */

type DomainConfig = {
  domain: string;
  baseUrl: string;
};

// Domain to API URL mapping
const DOMAIN_CONFIG: DomainConfig[] = [
  // Production domains
  { domain: 'admin.restx.food', baseUrl: 'https://api.restx.food' },
  { domain: 'restx.food', baseUrl: 'https://api.restx.food' },
  { domain: 'www.restx.food', baseUrl: 'https://api.restx.food' },
  
  // Local testing domains
  { domain: 'admin.restx.local', baseUrl: 'http://localhost:3000/api' },
  { domain: 'restx.local', baseUrl: 'http://localhost:3000/api' },
  { domain: 'www.restx.local', baseUrl: 'http://localhost:3000/api' },
  
  // Tenant domains - dynamic
  // Pattern: {tenant}.restx.food -> https://api.restx.food/tenant/{tenant}
  // Pattern: {tenant}.restx.local -> http://localhost:3000/api
];

/**
 * Get the base URL for API calls based on current domain
 * @param host - Optional host override (useful for SSR)
 * @returns API base URL
 */
export function getApiBaseUrl(host?: string): string {
  // Server-side: use host parameter or environment variable
  if (typeof window === 'undefined') {
    if (host) {
      return getBaseUrlFromHost(host);
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  }

  // Client-side: get from window.location
  const currentHost = window.location.host;
  return getBaseUrlFromHost(currentHost);
}

/**
 * Extract base URL from host
 */
function getBaseUrlFromHost(host: string): string {
  // Remove port for matching
  const hostWithoutPort = host.split(':')[0];

  // Development domains
  if (hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  }

  // Check exact domain match
  const config = DOMAIN_CONFIG.find(c => c.domain === hostWithoutPort);
  if (config) {
    return config.baseUrl;
  }

  // Tenant domain pattern: {tenant}.restx.food or {tenant}.restx.local
  if (hostWithoutPort.endsWith('.restx.food') || hostWithoutPort.endsWith('.restx.local')) {
    const suffix = hostWithoutPort.endsWith('.restx.food') ? '.restx.food' : '.restx.local';
    const tenant = hostWithoutPort.replace(suffix, '');
    
    // Exclude admin and www
    if (tenant !== 'admin' && tenant !== 'www') {
      // Option 1: Same API URL for all tenants (backend handles tenant via subdomain)
      if (suffix === '.restx.local') {
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      }
      return process.env.NEXT_PUBLIC_API_URL || 'https://api.restx.food';
      
      // Option 2: Tenant-specific API URL (uncomment if needed)
      // return `https://api.restx.food/tenant/${tenant}`;
    }
  }

  // Fallback to environment variable
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
}

/**
 * Get current tenant name from domain
 * @param host - Optional host override
 * @returns Tenant name or null
 */
export function getTenantFromDomain(host?: string): string | null {
  const currentHost = host || (typeof window !== 'undefined' ? window.location.host : '');
  const hostWithoutPort = currentHost.split(':')[0];

  if (hostWithoutPort.endsWith('.restx.food') || hostWithoutPort.endsWith('.restx.local')) {
    const suffix = hostWithoutPort.endsWith('.restx.food') ? '.restx.food' : '.restx.local';
    const tenant = hostWithoutPort.replace(suffix, '');
    
    // Exclude special domains
    if (tenant !== 'admin' && tenant !== 'www' && tenant !== 'restx') {
      return tenant;
    }
  }

  return null;
}

/**
 * Check if current domain is admin domain
 */
export function isAdminDomain(host?: string): boolean {
  const currentHost = host || (typeof window !== 'undefined' ? window.location.host : '');
  return currentHost.startsWith('admin.restx.food') || currentHost.startsWith('admin.restx.local');
}

/**
 * Check if current domain is tenant domain
 */
export function isTenantDomain(host?: string): boolean {
  return getTenantFromDomain(host) !== null;
}

export default getApiBaseUrl;
