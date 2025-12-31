/**
 * Extract tenant key from domain
 * Examples:
 * - "demo.restx.food" -> "demo"
 * - "localhost:3000" -> null (no tenant in dev)
 * - "restx.food" -> null (root domain, no tenant)
 */
export function getTenantKeyFromHost(host: string): string | null {
  // Remove port if present
  const hostWithoutPort = host.split(':')[0];

  // Development/localhost - no tenant
  if (
    hostWithoutPort.includes('localhost') ||
    hostWithoutPort.includes('127.0.0.1') ||
    hostWithoutPort.includes('0.0.0.0') ||
    hostWithoutPort.includes('.vercel.app')
  ) {
    return null;
  }

  // Extract subdomain from restx.food
  // demo.restx.food -> demo
  // tenant1.restx.food -> tenant1
  const parts = hostWithoutPort.split('.');
  
  // If it's exactly "restx.food", no tenant
  if (parts.length === 2 && parts[0] === 'restx' && parts[1] === 'food') {
    return null;
  }

  // If it has more parts, first part is tenant key
  // demo.restx.food -> ["demo", "restx", "food"] -> "demo"
  if (parts.length >= 3 && parts[parts.length - 2] === 'restx' && parts[parts.length - 1] === 'food') {
    return parts[0];
  }

  return null;
}

