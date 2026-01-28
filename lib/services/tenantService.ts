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
    /**
     * Get tenant config by domain/hostname
     * Backend endpoint: GET /api/tenants/{data}
     * where {data} can be tenant ID or hostname (e.g., "demo")
     */
    getTenantConfig: async (domain: string): Promise<TenantConfig | null> => {
        try {
            // Backend uses path param, not query param
            // e.g., /api/tenants/demo (not /api/tenants?domain=demo)
            const response = await adminAxiosInstance.get(`/tenants/${domain}`);

            if (response.status === 204) {
                return null;
            }

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Create or update tenant
     * Backend endpoint: POST /api/tenants
     */
    upsertTenant: async (tenant: TenantConfig) => {
        return await adminAxiosInstance.post('/tenants', tenant);
    },

    /**
     * Get all tenants (for admin panel)
     * Backend endpoint: GET /api/tenants
     */
    getAllTenants: async (): Promise<TenantConfig[]> => {
        const response = await adminAxiosInstance.get('/tenants');
        return response.data;
    },

    /**
     * Delete tenant
     * Backend endpoint: DELETE /api/tenants/{id}
     */
    deleteTenant: async (id: string): Promise<void> => {
        await adminAxiosInstance.delete(`/tenants/${id}`);
    }
};
