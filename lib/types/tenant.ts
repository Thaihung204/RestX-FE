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

// Tenant Request types
export type TenantRequestStatus = "pending" | "approved" | "rejected";

export interface ITenantRequest {
  id: string;
  businessName: string;
  contactPersonName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  requestedPlan: "basic" | "pro" | "enterprise";
  status: TenantRequestStatus;
  rejectionReason?: string;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  createdTenantId?: string;
  notes?: string;
}
