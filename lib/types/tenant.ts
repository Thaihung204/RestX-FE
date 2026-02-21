export interface ITenant {
  id: string;
  name: string;
  hostName: string;
  networkIp?: string; // Domain/IP address
  businessName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  addressLine4: string;
  ownerEmail: string;
  mailRestaurant: string;
  plan: "basic" | "pro" | "enterprise";
  status: "active" | "inactive" | "maintenance";
  lastActive: string;
}

export interface TenantCreateInput {
  name: string;
  hostName?: string;
  networkIp?: string;
  businessName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  addressLine4: string;
  ownerEmail: string;
  ownerPassword?: string;
  mailRestaurant: string;
  plan: "basic" | "pro" | "enterprise";
}

// Full tenant update input (all fields from backend)
export interface TenantUpdateInput {
  id?: string;
  name: string;
  hostname?: string;
  prefix?: string;

  // Branding & Assets
  logoUrl?: string;
  faviconUrl?: string;
  backgroundUrl?: string;

  // Theme Colors
  baseColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  headerColor?: string;
  footerColor?: string;
  lightBaseColor?: string;
  lightSurfaceColor?: string;
  lightCardColor?: string;
  darkBaseColor?: string;
  darkSurfaceColor?: string;
  darkCardColor?: string;

  // Network & Config
  networkIp?: string;
  connectionString?: string;
  status?: boolean;
  expiredAt?: string;

  // Business Info
  businessName: string;
  aboutUs?: string;
  aboutUsType?: "text" | "html";
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
  plan?: "basic" | "pro" | "enterprise";
}

// Backend API response type
export interface TenantApiResponse {
  id: string;
  name: string;
  hostname: string;
  prefix?: string;
  logoUrl?: string;
  faviconUrl?: string;
  backgroundUrl?: string;
  baseColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  headerColor?: string;
  footerColor?: string;
  lightBaseColor?: string;
  lightSurfaceColor?: string;
  lightCardColor?: string;
  darkBaseColor?: string;
  darkSurfaceColor?: string;
  darkCardColor?: string;
  networkIp?: string;
  connectionString?: string;
  status: boolean;
  expiredAt: string;
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
  createdDate?: string;
  modifiedDate?: string;
  createdBy?: string;
  modifiedBy?: string;
}

// Tenant Request types (matching backend DTO)
// Backend returns string enum: "Pending", "Accepted", "Denied"
export enum TenantRequestStatus {
  Pending = 0,
  Accepted = 1,
  Denied = 2,
}

// Type for tenantRequestStatus that backend may return as string or number
export type TenantRequestStatusValue =
  | TenantRequestStatus
  | "Pending"
  | "Accepted"
  | "Denied"
  | 0
  | 1
  | 2;

export interface ITenantRequest {
  id?: string;
  name: string;
  hostname: string;
  businessName?: string;
  businessPrimaryPhone?: string;
  businessEmailAddress?: string;
  businessAddressLine1?: string;
  businessAddressLine2?: string;
  businessAddressLine3?: string;
  businessAddressLine4?: string;
  businessCountry?: string;
  tenantRequestStatus?: TenantRequestStatusValue;
}

// Request input for creating tenant request
export interface TenantRequestInput {
  name: string;
  hostname: string;
  businessName?: string;
  businessPrimaryPhone?: string;
  businessEmailAddress?: string;
  businessAddressLine1?: string;
  businessAddressLine2?: string;
  businessAddressLine3?: string;
  businessAddressLine4?: string;
  businessCountry?: string;
}
