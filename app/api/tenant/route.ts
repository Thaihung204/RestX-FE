import { NextRequest, NextResponse } from 'next/server';

export interface TenantConfig {
  key: string;
  name: string;
  phone: string;
  address: string;
  color: string;
  logo: string;
  image: string;
}

// Mock tenant data - Replace with real database/API call
const mockTenants: Record<string, TenantConfig> = {
  demo: {
    key: 'demo',
    name: 'Nhà Hàng Demo',
    phone: '+84 123 456 789',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    color: '#FF7A00',
    logo: '/images/restaurant/logo.png',
    image: '/images/restaurant/banner.png',
  },
  // Add more tenants as needed
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json(
      { error: 'Domain parameter is required' },
      { status: 400 }
    );
  }

  // Mock: Return tenant config or 404
  // In production, fetch from database:
  // const tenant = await db.tenants.findByKey(domain);
  
  const tenant = mockTenants[domain];

  if (!tenant) {
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: tenant });
}

