import axiosInstance from './axiosInstance';
import adminAxiosInstance from './adminAxiosInstance';

export interface TenantConfig {
    id: string;
    prefix: string;
    name: string;

    // Branding & Assets
    logoUrl?: string;
    faviconUrl?: string;
    backgroundUrl?: string; // Banner/Hero image

    // Theme Colors
    baseColor: string;
    primaryColor: string;
    secondaryColor: string;
    headerColor: string;
    footerColor: string;

    // Network & Config
    networkIp?: string;
    connectionString?: string;
    status: boolean;
    hostname: string;
    expiredAt: string;

    // Business Info
    businessName: string;
    businessAddressLine1?: string;
    businessAddressLine2?: string;
    businessAddressLine3?: string;
    businessAddressLine4?: string;
    businessCounty?: string;
    businessPostCode?: string;
    businessCountry?: string;
    businessPrimaryPhone?: string;
    businessSecondaryPhone?: string;
    businessEmailAddress?: string;
    businessCompanyNumber?: string;
    businessOpeningHours?: string;

    // Meta
    createdDate: string;
    modifiedDate: string;
    createdBy: string;
    modifiedBy: string;
    tenantSettings: any[];
}

export const tenantService = {
    getTenantConfig: async (domain: string): Promise<TenantConfig> => {
        const response = await adminAxiosInstance.get(`/tenants/${domain}`);
        return response.data;
    },

    // Method to match the UpsertTenant (for Admin usage likely)
    upsertTenant: async (tenant: TenantConfig) => {
        return await axiosInstance.post('/tenant', tenant);
    }
};
