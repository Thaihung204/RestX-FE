import {
  DownloadableFile,
  getFileNameFromContentDisposition,
} from "@/lib/utils/fileDownload";
import axiosInstance from "./axiosInstance";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  birthday?: string;
  totalOrders: number;
  totalSpent: number;
  memberSince: string;
  lastVisit?: string;
  favoriteItems?: string[];
  loyaltyPoints?: number;
  vipTier?: "bronze" | "silver" | "gold" | "platinum";
  isActive: boolean;
}

export interface CustomerResponseDto {
  id: string;
  membershipLevel: string;
  loyaltyPoints: number;
  isActive: boolean;
  createdDate: string;
  modifiedDate?: string;
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  totalOrders: number;
  totalReservations: number;
}

export interface UpdateCustomerDto {
  fullName?: string;
  phoneNumber?: string;
  membershipLevel?: string;
  loyaltyPoints?: number;
  isActive?: boolean;
  avatar?: File;
}

export interface CustomerFilterParams {
  search?: string;
  membershipLevel?: string;
  isActive?: boolean;
  minLoyaltyPoints?: number;
  maxLoyaltyPoints?: number;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CustomerListItemDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
  membershipLevel: string;
  loyaltyPoints: number;
  isActive: boolean;
  createdDate: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const membershipToVipTier = (level: string): Customer["vipTier"] => {
  switch (level.toUpperCase()) {
    case "PLATINUM":
      return "platinum";
    case "GOLD":
      return "gold";
    case "SILVER":
      return "silver";
    case "BRONZE":
    default:
      return "bronze";
  }
};

const mapCustomerResponseToCustomer = (dto: CustomerResponseDto): Customer => ({
  id: dto.id,
  name: dto.fullName,
  email: dto.email,
  phone: dto.phoneNumber || "",
  avatar:
    dto.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(dto.fullName)}&background=4F46E5&color=fff`,
  totalOrders: dto.totalOrders,
  totalSpent: 0,
  memberSince: dto.createdDate,
  lastVisit: dto.modifiedDate,
  loyaltyPoints: dto.loyaltyPoints,
  vipTier: membershipToVipTier(dto.membershipLevel),
  isActive: dto.isActive,
});

const mapListItemToCustomer = (dto: CustomerListItemDto): Customer => ({
  id: dto.id,
  name: dto.fullName,
  email: dto.email,
  phone: dto.phoneNumber || "",
  avatar:
    dto.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(dto.fullName)}&background=4F46E5&color=fff`,
  totalOrders: 0,
  totalSpent: 0,
  memberSince: dto.createdDate,
  loyaltyPoints: dto.loyaltyPoints,
  vipTier: membershipToVipTier(dto.membershipLevel),
  isActive: dto.isActive,
});

export interface CustomerPageResult {
  items: Customer[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const customerService = {
  async exportCustomers(
    filters?: CustomerFilterParams,
  ): Promise<DownloadableFile> {
    const params: Record<string, string | number | boolean> = {};

    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.membershipLevel)
        params.membershipLevel = filters.membershipLevel;
      if (filters.isActive !== undefined) params.isActive = filters.isActive;
      if (filters.minLoyaltyPoints !== undefined)
        params.minLoyaltyPoints = filters.minLoyaltyPoints;
      if (filters.maxLoyaltyPoints !== undefined)
        params.maxLoyaltyPoints = filters.maxLoyaltyPoints;
      if (filters.pageNumber) params.pageNumber = filters.pageNumber;
      if (filters.pageSize) params.pageSize = filters.pageSize;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.sortOrder) params.sortOrder = filters.sortOrder;
    }

    const response = await axiosInstance.get<Blob>("/customers/export/csv", {
      params,
      responseType: "blob",
    });

    const contentDisposition = response.headers?.["content-disposition"] as
      | string
      | undefined;

    return {
      blob: response.data,
      fileName: getFileNameFromContentDisposition(
        contentDisposition,
        `customers_${Date.now()}.xlsx`,
      ),
    };
  },

  async getCustomersPaginated(
    filters?: CustomerFilterParams,
  ): Promise<PaginatedResponse<CustomerListItemDto>> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append("search", filters.search);
      if (filters.membershipLevel)
        params.append("membershipLevel", filters.membershipLevel);
      if (filters.isActive !== undefined)
        params.append("isActive", String(filters.isActive));
      if (filters.minLoyaltyPoints !== undefined)
        params.append("minLoyaltyPoints", String(filters.minLoyaltyPoints));
      if (filters.maxLoyaltyPoints !== undefined)
        params.append("maxLoyaltyPoints", String(filters.maxLoyaltyPoints));
      if (filters.pageNumber)
        params.append("pageNumber", String(filters.pageNumber));
      if (filters.pageSize) params.append("pageSize", String(filters.pageSize));
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    }

    const response = await axiosInstance.get<
      ApiResponse<PaginatedResponse<CustomerListItemDto>>
    >(`/customers${params.toString() ? `?${params.toString()}` : ""}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || "Failed to fetch customers");
  },

  async getAllCustomers(filters?: CustomerFilterParams): Promise<Customer[]> {
    const pageData = await this.getCustomersPaginated(filters);
    return pageData.items.map(mapListItemToCustomer);
  },

  async getCustomersWithMeta(
    filters?: CustomerFilterParams,
  ): Promise<CustomerPageResult> {
    const pageData = await this.getCustomersPaginated(filters);
    return {
      items: pageData.items.map(mapListItemToCustomer),
      totalCount: pageData.totalCount,
      pageNumber: pageData.pageNumber,
      pageSize: pageData.pageSize,
      totalPages: pageData.totalPages,
      hasPreviousPage: pageData.hasPreviousPage,
      hasNextPage: pageData.hasNextPage,
    };
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const response = await axiosInstance.get<ApiResponse<CustomerResponseDto>>(
      `/customers/${id}`,
    );

    if (response.data.success && response.data.data) {
      return mapCustomerResponseToCustomer(response.data.data);
    }

    return null;
  },

  _profileCache: new Map<
    string,
    { data: CustomerResponseDto; timestamp: number }
  >(),

  async getCustomerProfile(id: string): Promise<CustomerResponseDto | null> {
    const cached = this._profileCache.get(id);
    if (cached && Date.now() - cached.timestamp < 60000) {
      // 1 minute cache
      return cached.data;
    }

    const response = await axiosInstance.get<ApiResponse<CustomerResponseDto>>(
      `/customers/${id}`,
    );

    if (response.data.success) {
      this._profileCache.set(id, {
        data: response.data.data,
        timestamp: Date.now(),
      });
      return response.data.data;
    }

    return null;
  },

  async updateCustomerProfile(
    id: string,
    data: UpdateCustomerDto,
  ): Promise<CustomerResponseDto | null> {
    const formData = new FormData();

    if (data.fullName !== undefined) formData.append("fullName", data.fullName);
    if (data.phoneNumber !== undefined)
      formData.append("phoneNumber", data.phoneNumber);
    if (data.membershipLevel !== undefined)
      formData.append("membershipLevel", data.membershipLevel);
    if (data.loyaltyPoints !== undefined)
      formData.append("loyaltyPoints", String(data.loyaltyPoints));
    if (data.isActive !== undefined)
      formData.append("isActive", String(data.isActive));
    if (data.avatar) formData.append("avatar", data.avatar);

    const response = await axiosInstance.put<ApiResponse<CustomerResponseDto>>(
      `/customers/${id}`,
      formData,
    );

    if (response.data.success) {
      this._profileCache.set(id, {
        data: response.data.data,
        timestamp: Date.now(),
      });
      return response.data.data;
    }

    throw new Error(response.data.message || "Failed to update customer");
  },

  async getCustomerByEmail(email: string): Promise<CustomerResponseDto | null> {
    const response = await axiosInstance.get<
      ApiResponse<PaginatedResponse<CustomerListItemDto>>
    >(`/customers?search=${encodeURIComponent(email)}`);

    if (response.data.success && response.data.data?.items?.length > 0) {
      const customer = response.data.data.items.find(
        (c) => c.email.toLowerCase() === email.toLowerCase(),
      );
      if (customer) {
        return this.getCustomerProfile(customer.id);
      }
    }

    return null;
  },

  isBirthday(birthday?: string): boolean {
    if (!birthday) return false;

    const today = new Date();
    const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
    const todayDay = String(today.getDate()).padStart(2, "0");
    const todayMMDD = `${todayMonth}-${todayDay}`;

    const birthdayMMDD = birthday.includes("-")
      ? birthday.split("-").slice(-2).join("-")
      : birthday;

    return birthdayMMDD === todayMMDD;
  },

  async getBirthdayCustomers(): Promise<Customer[]> {
    const allCustomers = await this.getAllCustomers();
    return allCustomers.filter((customer) =>
      this.isBirthday(customer.birthday),
    );
  },

  getVipTierColor(tier?: string): string {
    switch (tier) {
      case "platinum":
        return "#E5E7EB";
      case "gold":
        return "#FBBF24";
      case "silver":
        return "#9CA3AF";
      case "bronze":
        return "#CD7F32";
      default:
        return "#6B7280";
    }
  },

  getVipTierName(tier?: string): string {
    switch (tier) {
      case "platinum":
        return "Platinum";
      case "gold":
        return "Vàng";
      case "silver":
        return "Bạc";
      case "bronze":
        return "Đồng";
      default:
        return "Thường";
    }
  },
};

export default customerService;
