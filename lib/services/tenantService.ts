import axiosInstance from './axiosInstance';

export interface TenantConfig {
    id?: string;
    name: string;
    phone: string;
    address: string;
    branding: {
        primaryColor: string;
        logoUrl: string;
        bannerUrl?: string;
    };
}

export const tenantService = {
    getTenantConfig: async (domain: string): Promise<TenantConfig> => {
        const response = await axiosInstance.get(`/tenant`, {
            params: { domain }
        });
        return response.data;
    }
};
