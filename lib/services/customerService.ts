import axiosInstance from './axiosInstance';

// ==================== INTERFACES ====================

// Frontend Customer interface (for UI)
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

// ==================== API DTOs (matching backend) ====================

// Response from backend GET /api/customers/{id}
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

// Request for PUT /api/customers/{id}
export interface UpdateCustomerDto {
  fullName?: string;
  phoneNumber?: string;
  membershipLevel?: string;
  loyaltyPoints?: number;
  isActive?: boolean;
}

// Filter params for GET /api/customers
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

// List item from GET /api/customers
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

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ==================== MOCK DATA ====================

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Nguyễn Văn An",
    email: "nguyenvanan@example.com",
    phone: "0901234567",
    avatar: "https://ui-avatars.com/api/?name=Nguyen+Van+An&background=4F46E5&color=fff",
    birthday: "01-20",
    totalOrders: 45,
    totalSpent: 12500000,
    memberSince: "2023-01-15",
    lastVisit: "2026-01-19",
    loyaltyPoints: 2500,
    vipTier: "gold",
    favoriteItems: ["Phở bò", "Cà phê sữa đá"],
  },
  {
    id: "2",
    name: "Trần Thị Bình",
    email: "tranthibibinh@example.com",
    phone: "0912345678",
    avatar: "https://ui-avatars.com/api/?name=Tran+Thi+Binh&background=EC4899&color=fff",
    birthday: "03-15",
    totalOrders: 32,
    totalSpent: 8900000,
    memberSince: "2023-03-20",
    lastVisit: "2026-01-18",
    loyaltyPoints: 1780,
    vipTier: "silver",
    favoriteItems: ["Bún chả", "Trà đào"],
  },
  {
    id: "3",
    name: "Lê Minh Cường",
    email: "leminhcuong@example.com",
    phone: "0923456789",
    avatar: "https://ui-avatars.com/api/?name=Le+Minh+Cuong&background=10B981&color=fff",
    birthday: "07-22",
    totalOrders: 68,
    totalSpent: 18700000,
    memberSince: "2022-11-10",
    lastVisit: "2026-01-20",
    loyaltyPoints: 3740,
    vipTier: "platinum",
    favoriteItems: ["Gà rán", "Bia", "Salad"],
  },
  {
    id: "4",
    name: "Phạm Thị Diễm",
    email: "phamthidiem@example.com",
    phone: "0934567890",
    birthday: "01-20",
    totalOrders: 23,
    totalSpent: 5600000,
    memberSince: "2024-02-05",
    lastVisit: "2026-01-15",
    loyaltyPoints: 1120,
    vipTier: "bronze",
    favoriteItems: ["Bánh mì", "Nước ép"],
  },
  {
    id: "5",
    name: "Hoàng Văn Em",
    email: "hoangvanem@example.com",
    phone: "0945678901",
    avatar: "https://ui-avatars.com/api/?name=Hoang+Van+Em&background=F59E0B&color=fff",
    birthday: "11-05",
    totalOrders: 15,
    totalSpent: 3200000,
    memberSince: "2024-08-12",
    lastVisit: "2026-01-10",
    loyaltyPoints: 640,
    vipTier: "bronze",
    favoriteItems: ["Cơm tấm", "Chè"],
  },
  {
    id: "6",
    name: "Vũ Thị Phương",
    email: "vuthiphuong@example.com",
    phone: "0956789012",
    avatar: "https://ui-avatars.com/api/?name=Vu+Thi+Phuong&background=8B5CF6&color=fff",
    birthday: "05-18",
    totalOrders: 51,
    totalSpent: 14200000,
    memberSince: "2023-06-08",
    lastVisit: "2026-01-19",
    loyaltyPoints: 2840,
    vipTier: "gold",
    favoriteItems: ["Lẩu", "Trà sữa"],
  },
];

// ==================== HELPER FUNCTIONS ====================

// Convert membership level to VIP tier
const membershipToVipTier = (level: string): Customer['vipTier'] => {
  switch (level.toUpperCase()) {
    case 'PLATINUM': return 'platinum';
    case 'GOLD': return 'gold';
    case 'SILVER': return 'silver';
    case 'BRONZE':
    default: return 'bronze';
  }
};

// Convert API response to frontend Customer format
const mapCustomerResponseToCustomer = (dto: CustomerResponseDto): Customer => ({
  id: dto.id,
  name: dto.fullName,
  email: dto.email,
  phone: dto.phoneNumber || '',
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(dto.fullName)}&background=4F46E5&color=fff`,
  totalOrders: dto.totalOrders,
  totalSpent: 0, // Not provided by API
  memberSince: dto.createdDate,
  lastVisit: dto.modifiedDate,
  loyaltyPoints: dto.loyaltyPoints,
  vipTier: membershipToVipTier(dto.membershipLevel),
});

// Convert list item to frontend Customer format
const mapListItemToCustomer = (dto: CustomerListItemDto): Customer => ({
  id: dto.id,
  name: dto.fullName,
  email: dto.email,
  phone: dto.phoneNumber || '',
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(dto.fullName)}&background=4F46E5&color=fff`,
  totalOrders: 0, // Not in list response
  totalSpent: 0,
  memberSince: dto.createdDate,
  loyaltyPoints: dto.loyaltyPoints,
  vipTier: membershipToVipTier(dto.membershipLevel),
});

// ==================== SERVICE ====================

const customerService = {
  // Get all customers (with optional filters)
  async getAllCustomers(filters?: CustomerFilterParams): Promise<Customer[]> {
    try {
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
    } catch (error) {
      console.warn('API call failed, using mock data:', error);
      // Fallback to mock data on API failure
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockCustomers;
    }
  },

  // Get customer by ID (profile)
  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const response = await axiosInstance.get<ApiResponse<CustomerResponseDto>>(
        `/customers/${id}`
      );

      if (response.data.success && response.data.data) {
        return mapCustomerResponseToCustomer(response.data.data);
      }

      return null;
    } catch (error) {
      console.warn('API call failed, using mock data:', error);
      // Fallback to mock data
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockCustomers.find(customer => customer.id === id) || null;
    }
  },

  // Get customer profile (raw API response)
  async getCustomerProfile(id: string): Promise<CustomerResponseDto | null> {
    try {
      const response = await axiosInstance.get<ApiResponse<CustomerResponseDto>>(
        `/customers/${id}`
      );

      if (response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to get customer profile:', error);
      throw error;
    }
  },

  // Update customer profile
  async updateCustomerProfile(id: string, data: UpdateCustomerDto): Promise<CustomerResponseDto | null> {
    try {
      const response = await axiosInstance.put<ApiResponse<CustomerResponseDto>>(
        `/customers/${id}`,
        data
      );

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to update customer');
    } catch (error) {
      console.error('Failed to update customer profile:', error);
      throw error;
    }
  },

  // Check if today is customer's birthday
  isBirthday(birthday?: string): boolean {
    if (!birthday) return false;

    const today = new Date();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const todayMMDD = `${todayMonth}-${todayDay}`;

    // Support both MM-DD and YYYY-MM-DD formats
    const birthdayMMDD = birthday.includes('-')
      ? birthday.split('-').slice(-2).join('-')
      : birthday;

    return birthdayMMDD === todayMMDD;
  },

  // Get birthday customers today
  async getBirthdayCustomers(): Promise<Customer[]> {
    const allCustomers = await this.getAllCustomers();
    return allCustomers.filter(customer => this.isBirthday(customer.birthday));
  },

  // Get VIP tier color
  getVipTierColor(tier?: string): string {
    switch (tier) {
      case 'platinum': return '#E5E7EB';
      case 'gold': return '#FBBF24';
      case 'silver': return '#9CA3AF';
      case 'bronze': return '#CD7F32';
      default: return '#6B7280';
    }
  },

  // Get VIP tier display name
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

