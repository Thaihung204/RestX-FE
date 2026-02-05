import axiosInstance from './axiosInstance';

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
  vipTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
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
  totalOrders: number;
  totalReservations: number;
}

export interface UpdateCustomerDto {
  fullName?: string;
  phoneNumber?: string;
  membershipLevel?: string;
  loyaltyPoints?: number;
  isActive?: boolean;
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
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerListItemDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
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

const membershipToVipTier = (level: string): Customer['vipTier'] => {
  switch (level.toUpperCase()) {
    case 'PLATINUM': return 'platinum';
    case 'GOLD': return 'gold';
    case 'SILVER': return 'silver';
    case 'BRONZE':
    default: return 'bronze';
  }
};

const mapCustomerResponseToCustomer = (dto: CustomerResponseDto): Customer => ({
  id: dto.id,
  name: dto.fullName,
  email: dto.email,
  phone: dto.phoneNumber || '',
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(dto.fullName)}&background=4F46E5&color=fff`,
  totalOrders: dto.totalOrders,
  totalSpent: 0,
  memberSince: dto.createdDate,
  lastVisit: dto.modifiedDate,
  loyaltyPoints: dto.loyaltyPoints,
  vipTier: membershipToVipTier(dto.membershipLevel),
});

const mapListItemToCustomer = (dto: CustomerListItemDto): Customer => ({
  id: dto.id,
  name: dto.fullName,
  email: dto.email,
  phone: dto.phoneNumber || '',
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(dto.fullName)}&background=4F46E5&color=fff`,
  totalOrders: 0,
  totalSpent: 0,
  memberSince: dto.createdDate,
  loyaltyPoints: dto.loyaltyPoints,
  vipTier: membershipToVipTier(dto.membershipLevel),
});

const customerService = {
  async getAllCustomers(filters?: CustomerFilterParams): Promise<Customer[]> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.membershipLevel) params.append('membershipLevel', filters.membershipLevel);
      if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters.minLoyaltyPoints !== undefined) params.append('minLoyaltyPoints', String(filters.minLoyaltyPoints));
      if (filters.maxLoyaltyPoints !== undefined) params.append('maxLoyaltyPoints', String(filters.maxLoyaltyPoints));
      if (filters.pageNumber) params.append('pageNumber', String(filters.pageNumber));
      if (filters.pageSize) params.append('pageSize', String(filters.pageSize));
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const response = await axiosInstance.get<ApiResponse<CustomerListItemDto[]>>(
      `/customers${params.toString() ? `?${params.toString()}` : ''}`
    );

    if (response.data.success) {
      return response.data.data.map(mapListItemToCustomer);
    }

    throw new Error(response.data.message || 'Failed to fetch customers');
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const response = await axiosInstance.get<ApiResponse<CustomerResponseDto>>(
      `/customers/${id}`
    );

    if (response.data.success && response.data.data) {
      return mapCustomerResponseToCustomer(response.data.data);
    }

    return null;
  },

  async getCustomerProfile(id: string): Promise<CustomerResponseDto | null> {
    const response = await axiosInstance.get<ApiResponse<CustomerResponseDto>>(
      `/customers/${id}`
    );

    if (response.data.success) {
      return response.data.data;
    }

    return null;
  },

  async updateCustomerProfile(id: string, data: UpdateCustomerDto): Promise<CustomerResponseDto | null> {
    const response = await axiosInstance.put<ApiResponse<CustomerResponseDto>>(
      `/customers/${id}`,
      data
    );

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to update customer');
  },

  async getCustomerByEmail(email: string): Promise<CustomerResponseDto | null> {
    const response = await axiosInstance.get<ApiResponse<{ items: CustomerListItemDto[] }>>(
      `/customers?search=${encodeURIComponent(email)}`
    );

    if (response.data.success && response.data.data?.items?.length > 0) {
      const customer = response.data.data.items.find(c => c.email.toLowerCase() === email.toLowerCase());
      if (customer) {
        return this.getCustomerProfile(customer.id);
      }
    }

    return null;
  },

  isBirthday(birthday?: string): boolean {
    if (!birthday) return false;

    const today = new Date();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const todayMMDD = `${todayMonth}-${todayDay}`;

    const birthdayMMDD = birthday.includes('-')
      ? birthday.split('-').slice(-2).join('-')
      : birthday;

    return birthdayMMDD === todayMMDD;
  },

  async getBirthdayCustomers(): Promise<Customer[]> {
    const allCustomers = await this.getAllCustomers();
    return allCustomers.filter(customer => this.isBirthday(customer.birthday));
  },

  getVipTierColor(tier?: string): string {
    switch (tier) {
      case 'platinum': return '#E5E7EB';
      case 'gold': return '#FBBF24';
      case 'silver': return '#9CA3AF';
      case 'bronze': return '#CD7F32';
      default: return '#6B7280';
    }
  },

  getVipTierName(tier?: string): string {
    switch (tier) {
      case 'platinum': return 'Platinum';
      case 'gold': return 'Vàng';
      case 'silver': return 'Bạc';
      case 'bronze': return 'Đồng';
      default: return 'Thường';
    }
  },
};

export default customerService;
