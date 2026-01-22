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

const customerService = {
  // Get all customers
  async getAllCustomers(): Promise<Customer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return mockCustomers;
  },

  // Get customer by ID
  async getCustomerById(id: string): Promise<Customer | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockCustomers.find(customer => customer.id === id) || null;
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
