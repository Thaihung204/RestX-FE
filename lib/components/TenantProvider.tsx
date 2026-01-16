import { headers } from 'next/headers';
import { getTenantKeyFromHost } from '../utils/tenant';
import { TenantProvider as TenantContextProvider } from '../contexts/TenantContext';
import type { TenantConfig } from '../contexts/TenantContext';

async function fetchTenantConfig(tenantKey: string | null, host: string): Promise<TenantConfig | null> {
  if (!tenantKey) {
    return null;
  }

  try {
    // Get the base URL for API call
    // In production, use absolute URL or environment variable
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    const response = await fetch(`${baseUrl}/api/tenant?domain=${tenantKey}`, {
      // Important: cache the request per request lifecycle
      cache: 'no-store',
      headers: {
        // Forward host header for proper domain detection
        host: host,
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch tenant config for ${tenantKey}: ${response.statusText}`);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching tenant config:', error);
    return null;
  }
}

export default async function TenantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Extract tenant key from request headers (server-side)
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const tenantKey = getTenantKeyFromHost(host);

  // Fetch tenant config (server-side, once per request)
  const tenant = await fetchTenantConfig(tenantKey, host);

  // Provide tenant config to client components
  return (
    <TenantContextProvider tenant={tenant}>
      {children}
    </TenantContextProvider>
  );
}

