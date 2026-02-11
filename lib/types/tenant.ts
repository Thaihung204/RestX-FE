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
  hostName?: string; // Optional - can be undefined
  networkIp?: string; // Optional - can be undefined
  businessName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  addressLine4: string;
  ownerEmail: string;
  ownerPassword?: string; // Optional for edit mode
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
