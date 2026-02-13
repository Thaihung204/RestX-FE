import { ITenant, TenantApiResponse, TenantCreateInput } from "../types/tenant";
import adminAxiosInstance from "./adminAxiosInstance";

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
  aboutUs?: string;
  aboutUsType?: 'text' | 'html';
  overview?: string;
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
    networkIp: apiTenant.networkIp || "",
    businessName: apiTenant.businessName,
    phoneNumber: apiTenant.businessPrimaryPhone || "",
    addressLine1: apiTenant.businessAddressLine1 || "",
    addressLine2: apiTenant.businessAddressLine2 || "",
    addressLine3: apiTenant.businessAddressLine3 || "",
    addressLine4: apiTenant.businessAddressLine4 || "",
    ownerEmail: "", // Backend doesn't have this field yet
    mailRestaurant: apiTenant.businessEmailAddress || "",
    plan: "basic", // Backend doesn't have this field yet
    status: apiTenant.status ? "active" : "inactive",
    lastActive:
      apiTenant.modifiedDate ||
      apiTenant.createdDate ||
      new Date().toISOString(),
  };
};

// Helper function to convert frontend create input to API format
const mapCreateInputToApi = (input: TenantCreateInput) => {
  // Remove .restx.food suffix if accidentally included
  const fullHostname = input.hostName && input.hostName.endsWith(".restx.food")
    ? input.hostName
    : `${input.hostName}.restx.food`;

  return {
    name: input.name,
    hostname: fullHostname,
    networkIp: fullHostname, // Save to networkIp as well
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

// Helper to convert object to FormData
const toFormData = (data: any, files?: { logo?: File | null; background?: File | null; favicon?: File | null }): FormData => {
  const formData = new FormData();

  // Append simple fields
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value !== null && value !== undefined && key !== "tenantSettings") {
      // Handle values properly
      if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // If nested object, JSON stringify? Or flatten?
        // for now skip complex nested objects to avoid [object Object]
      } else if (typeof value === 'boolean') {
        // C# boolean binding works best with "true"/"false" strings
        formData.append(key, value ? "true" : "false");
      } else {
        formData.append(key, value.toString());
      }
    }
  });

  // Append files
  if (files) {
    if (files.logo) formData.append("LogoFile", files.logo);
    if (files.background) formData.append("BackgroundFile", files.background);
    if (files.favicon) formData.append("FaviconFile", files.favicon);
  }

  return formData;
};

export const tenantService = {
  /**
   * Get tenant config by domain/hostname
   * Backend endpoint: GET /api/tenants/{data}
   * where {data} can be tenant ID or hostname (e.g., "demo")
   */
  getTenantConfig: async (domain: string): Promise<TenantConfig | null> => {
    try {
      const response = await adminAxiosInstance.get(`/tenants/${domain}`);

      if (response.status === 204) {
        return null;
      }

      const data = response.data;

      if (data) {
        console.log('[getTenantConfig] Raw API response keys:', Object.keys(data));
        console.log('[getTenantConfig] id:', data.id, '| Id:', data.Id);

        // Comprehensive PascalCase -> camelCase normalization
        // Backend (C#) returns PascalCase by default, frontend uses camelCase
        const pascalToCamelMap: Record<string, string> = {
          Id: 'id',
          Name: 'name',
          Prefix: 'prefix',
          Hostname: 'hostname',
          HostName: 'hostname',
          Status: 'status',
          BusinessName: 'businessName',
          LogoUrl: 'logoUrl',
          FaviconUrl: 'faviconUrl',
          BackgroundUrl: 'backgroundUrl',
          BaseColor: 'baseColor',
          PrimaryColor: 'primaryColor',
          SecondaryColor: 'secondaryColor',
          HeaderColor: 'headerColor',
          FooterColor: 'footerColor',
          NetworkIp: 'networkIp',
          ConnectionString: 'connectionString',
          ExpiredAt: 'expiredAt',
          AboutUs: 'aboutUs',
          AboutUsType: 'aboutUsType',
          Overview: 'overview',
          BusinessAddressLine1: 'businessAddressLine1',
          BusinessAddressLine2: 'businessAddressLine2',
          BusinessAddressLine3: 'businessAddressLine3',
          BusinessAddressLine4: 'businessAddressLine4',
          BusinessCounty: 'businessCounty',
          BusinessPostCode: 'businessPostCode',
          BusinessCountry: 'businessCountry',
          BusinessPrimaryPhone: 'businessPrimaryPhone',
          BusinessSecondaryPhone: 'businessSecondaryPhone',
          BusinessEmailAddress: 'businessEmailAddress',
          BusinessCompanyNumber: 'businessCompanyNumber',
          BusinessOpeningHours: 'businessOpeningHours',
          CreatedDate: 'createdDate',
          ModifiedDate: 'modifiedDate',
          CreatedBy: 'createdBy',
          ModifiedBy: 'modifiedBy',
          TenantSettings: 'tenantSettings',
        };

        for (const [pascalKey, camelKey] of Object.entries(pascalToCamelMap)) {
          if (data[pascalKey] !== undefined && !data[camelKey]) {
            data[camelKey] = data[pascalKey];
          }
        }

        console.log('[getTenantConfig] Normalized id:', data.id);

        // Backend's TenantOverview DTO does NOT include Id field.
        // If id is still missing, resolve it by fetching the full tenant list
        // (GET /api/tenants returns full Tenant entities which include Id)
        if (!data.id && data.hostname) {
          try {
            console.log('[getTenantConfig] ID missing from response, resolving via tenant list...');
            const listResponse = await adminAxiosInstance.get('/tenants');
            const allTenants = listResponse.data;
            const match = allTenants.find((t: any) =>
              (t.hostname || t.Hostname) === data.hostname
            );
            if (match) {
              data.id = match.id || match.Id;
              console.log('[getTenantConfig] Resolved ID from tenant list:', data.id);
            } else {
              console.warn('[getTenantConfig] Could not find matching tenant for hostname:', data.hostname);
            }
          } catch (listError) {
            console.error('[getTenantConfig] Failed to resolve tenant ID:', listError);
          }
        }
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all tenants for admin panel (mapped to ITenant format)
   * Backend endpoint: GET /api/tenants
   */
  getAllTenantsForAdmin: async (): Promise<ITenant[]> => {
    const response =
      await adminAxiosInstance.get<TenantApiResponse[]>("/tenants");
    return response.data.map(mapApiResponseToTenant);
  },

  /**
   * Get tenant by ID (mapped to ITenant format)
   * Backend endpoint: GET /api/tenants/{id}
   */
  getTenantById: async (id: string): Promise<ITenant> => {
    const response = await adminAxiosInstance.get<TenantApiResponse>(
      `/tenants/${id}`,
    );
    return mapApiResponseToTenant(response.data);
  },

  /**
   * Create tenant
   * Backend endpoint: POST /api/tenants
   */
  createTenant: async (
    input: TenantCreateInput,
  ): Promise<TenantApiResponse> => {
    const apiData = mapCreateInputToApi(input);
    const formData = toFormData(apiData);
    const response = await adminAxiosInstance.post("/tenants", formData, {
      headers: { "Content-Type": undefined },
    });
    return response.data;
  },

  /**
   * Update tenant
   * Backend endpoint: PUT /api/tenants/{id}
   */
  updateTenant: async (
    id: string,
    input: TenantCreateInput,
  ): Promise<TenantApiResponse> => {
    const apiData = mapCreateInputToApi(input);

    // Merge ID into the payload as some backends require it in the body too
    const payload = {
      ...apiData,
      id
    };

    console.log('[updateTenant] Tenant ID:', id);
    console.log('[updateTenant] Input data:', input);
    console.log('[updateTenant] API payload:', payload);

    const formData = toFormData(payload);
    const response = await adminAxiosInstance.put(`/tenants/${id}`, formData, {
      headers: { "Content-Type": undefined },
    });
    console.log('[updateTenant] Response:', response.data);
    return response.data;
  },

  /**
   * Create or update tenant
   * Backend endpoint: POST /api/tenants OR PUT /api/tenants/{id}
   */
  upsertTenant: async (
    tenant: TenantConfig,
    files?: { logo?: File | null; background?: File | null; favicon?: File | null }
  ) => {
    const findId = (obj: any): string | undefined => {
      if (!obj) return undefined;

      // Try lowercase id first (TypeScript interface)
      if (obj.id) return obj.id;

      // Try uppercase Id (C# Entity - backend returns PascalCase by default)
      if (obj.Id) return obj.Id;

      // Check if there is a nested 'tenant' property
      if (obj.tenant) {
        if (obj.tenant.id) return obj.tenant.id;
        if (obj.tenant.Id) return obj.tenant.Id;
      }

      return undefined;
    };

    const tenantId = findId(tenant);

    console.log('[tenantService] upsertTenant called for:', {
      name: tenant.name || (tenant as any).Name,
      resolvedId: tenantId,
      topLevelKeys: Object.keys(tenant),
      hasLowercaseId: !!tenant.id,
      hasUppercaseId: !!(tenant as any).Id,
      fullObject: JSON.stringify(tenant).substring(0, 200) + "..."
    });

    // If tenant has an ID, use PUT to update
    if (tenantId) {
      // We filter out tenantSettings and other non-primitive complex objects that backend might not expect
      const formData = toFormData(tenant, files);

      console.log(`[tenantService] Performing PUT update for ID: ${tenantId}`);
      return await adminAxiosInstance.put(`/tenants/${tenantId}`, formData, {
        headers: { "Content-Type": undefined },
      });
    } else {
      // Create new
      console.log('[tenantService] Performing POST create (no ID found)');
      const formData = toFormData(tenant, files);
      return await adminAxiosInstance.post("/tenants", formData, {
        headers: { "Content-Type": undefined },
      });
    }
  },

  /**
   * Get all tenants (for admin panel)
   * Backend endpoint: GET /api/tenants
   */
  getAllTenants: async (): Promise<TenantConfig[]> => {
    const response = await adminAxiosInstance.get("/tenants");
    return response.data;
  },

  /**
   * Delete tenant
   * Backend endpoint: DELETE /api/tenants/{id}
   */
  deleteTenant: async (id: string): Promise<void> => {
    await adminAxiosInstance.delete(`/tenants/${id}`);
  },
};
