import axiosInstance from './axiosInstance';

// Interface matching the .NET Backend Tenant model
export interface TenantConfig {
    id: string;
    prefix?: string;
    name: string;

    // Branding & Assets
    logoUrl?: string;
    faviconUrl?: string;
    backgroundUrl?: string; // Banner/Hero image

    // Theme Colors
    baseColor?: string;
    primaryColor?: string;
    secondaryColor?: string;

    // Network & Config
    networkIp?: string;
    status?: string; // e.g. "Active", "Inactive"
    hostname: string;
    expiredAt?: string;

    // Contact Info (May be separate or extended in backend)
    phone?: string;
    address?: string;
}

export const tenantService = {
    getTenantConfig: async (domain: string): Promise<TenantConfig> => {
        const response = await axiosInstance.get(`/tenants/${domain}`);
        return response.data;
    },

    // Method to match the UpsertTenant (for Admin usage likely)
    upsertTenant: async (tenant: TenantConfig) => {
        return await axiosInstance.post('/tenant', tenant);
    }
};
