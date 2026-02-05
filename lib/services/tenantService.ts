import axiosInstance from './axiosInstance';
import adminAxiosInstance from './adminAxiosInstance';
import { ITenant, TenantApiResponse, TenantCreateInput } from '../types/tenant';

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

// Helper function to convert API response to frontend ITenant format
const mapApiResponseToTenant = (apiTenant: TenantApiResponse): ITenant => {
    return {
        id: apiTenant.id,
        name: apiTenant.name,
        hostName: apiTenant.hostname,
        businessName: apiTenant.businessName,
        phoneNumber: apiTenant.businessPrimaryPhone || '',
        addressLine1: apiTenant.businessAddressLine1 || '',
        addressLine2: apiTenant.businessAddressLine2 || '',
        addressLine3: apiTenant.businessAddressLine3 || '',
        addressLine4: apiTenant.businessAddressLine4 || '',
        ownerEmail: '', // Backend doesn't have this field yet
        mailRestaurant: apiTenant.businessEmailAddress || '',
        plan: 'basic', // Backend doesn't have this field yet
        status: apiTenant.status ? 'active' : 'inactive',
        lastActive: apiTenant.modifiedDate || apiTenant.createdDate || new Date().toISOString(),
    };
};

// Helper function to convert frontend create input to API format
const mapCreateInputToApi = (input: TenantCreateInput) => {
    return {
        name: input.name,
        hostname: input.hostName,
        businessName: input.businessName,
        businessAddressLine1: input.addressLine1,
        businessAddressLine2: input.addressLine2,
        businessAddressLine3: input.addressLine3,
        businessAddressLine4: input.addressLine4,
        businessPrimaryPhone: input.phoneNumber,
        businessEmailAddress: input.mailRestaurant,
        status: true,
        // ownerEmail, ownerPassword and plan will need to be added to backend
    };
};

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
     * Get all tenants for admin panel (mapped to ITenant format)
     * Backend endpoint: GET /api/tenants
     */
    getAllTenantsForAdmin: async (): Promise<ITenant[]> => {
        const response = await adminAxiosInstance.get<TenantApiResponse[]>('/tenants');
        return response.data.map(mapApiResponseToTenant);
    },

    /**
     * Get tenant by ID (mapped to ITenant format)
     * Backend endpoint: GET /api/tenants/{id}
     */
    getTenantById: async (id: string): Promise<ITenant> => {
        const response = await adminAxiosInstance.get<TenantApiResponse>(`/tenants/${id}`);
        return mapApiResponseToTenant(response.data);
    },

    /**
     * Create tenant
     * Backend endpoint: POST /api/tenants
     */
    createTenant: async (input: TenantCreateInput): Promise<TenantApiResponse> => {
        const apiData = mapCreateInputToApi(input);
        const response = await adminAxiosInstance.post('/tenants', apiData);
        return response.data;
    },

    /**
     * Update tenant
     * Backend endpoint: PUT /api/tenants/{id}
     */
    updateTenant: async (id: string, input: TenantCreateInput): Promise<TenantApiResponse> => {
        const apiData = mapCreateInputToApi(input);
        const response = await adminAxiosInstance.put(`/tenants/${id}`, apiData);
        return response.data;
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
