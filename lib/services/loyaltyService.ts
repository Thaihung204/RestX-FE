import axiosInstance from './axiosInstance';

const LOYALTY_BANDS_API = '/loyalty-point-bands';

type ApiEnvelope<T> = {
    success: boolean;
    data: T;
    message?: string;
};

// ── Matches BE: LoyaltyPointBand entity + DTO ──
export interface LoyaltyPointBand {
    id: string;
    name: string;
    min: number;
    max: number | null;
    discountPercentage: number;
    benefitDescription: string;
    /** BE field: hex color e.g. "#FFD700". FE uses this to drive icon color. */
    logoColor: string;
    isActive: boolean;
}

export interface CreateLoyaltyPointBandDto {
    name: string;
    min: number;
    max: number | null;
    discountPercentage: number;
    benefitDescription: string;
    logoColor: string;
    isActive: boolean;
}

export interface UpdateLoyaltyPointBandDto extends CreateLoyaltyPointBandDto {
    id: string;
}

// ── Predefined tier colours matching BE seeder ──
export const TIER_COLORS: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF',
};

/** Resolve a display tier name from a logoColor hex, used for icon selection */
export const getTierFromColor = (logoColor: string): string => {
    const entry = Object.entries(TIER_COLORS).find(
        ([, color]) => color.toLowerCase() === logoColor?.toLowerCase()
    );
    return entry?.[0] ?? 'bronze';
};

// ── Fallback mock data — mirrors LoyaltySeeder.cs exactly ──
// Used automatically when BE API is not yet implemented (404).
const MOCK_BANDS: LoyaltyPointBand[] = [
    { id: '1', name: 'Bronze', min: 0, max: 999, discountPercentage: 0, benefitDescription: 'Thành viên cơ bản - Tích điểm cho mọi giao dịch', logoColor: '#CD7F32', isActive: true },
    { id: '2', name: 'Silver', min: 1000, max: 4999, discountPercentage: 3, benefitDescription: 'Giảm 3% cho mọi đơn hàng - Ưu đãi sinh nhật', logoColor: '#C0C0C0', isActive: true },
    { id: '3', name: 'Gold', min: 5000, max: 14999, discountPercentage: 7, benefitDescription: 'Giảm 7% cho mọi đơn hàng - Ưu tiên đặt bàn - Voucher sinh nhật', logoColor: '#FFD700', isActive: true },
    { id: '4', name: 'Platinum', min: 15000, max: 29999, discountPercentage: 10, benefitDescription: 'Giảm 10% - Ưu tiên đặt bàn - Quà sinh nhật cao cấp - Hỗ trợ đặt phòng riêng', logoColor: '#E5E4E2', isActive: true },
    { id: '5', name: 'Diamond', min: 30000, max: null, discountPercentage: 12, benefitDescription: 'Giảm 12% - VIP treatment - Phòng riêng miễn phí - Quà sinh nhật đặc biệt - Ưu đãi sự kiện riêng', logoColor: '#B9F2FF', isActive: true },
];

const loyaltyService = {
    getAllBands: async (): Promise<LoyaltyPointBand[]> => {
        try {
            const response = await axiosInstance.get<ApiEnvelope<LoyaltyPointBand[]>>(LOYALTY_BANDS_API);
            return response.data.data;
        } catch {
            console.info('[loyaltyService] API not ready — using mock bands');
            return [...MOCK_BANDS];
        }
    },

    getBandById: async (id: string): Promise<LoyaltyPointBand> => {
        try {
            const response = await axiosInstance.get<ApiEnvelope<LoyaltyPointBand>>(`${LOYALTY_BANDS_API}/${id}`);
            return response.data.data;
        } catch {
            const band = MOCK_BANDS.find((b) => b.id === id);
            if (!band) throw new Error('Band not found');
            return band;
        }
    },

    createBand: async (data: CreateLoyaltyPointBandDto): Promise<string> => {
        try {
            const response = await axiosInstance.post<ApiEnvelope<{ id: string }>>(LOYALTY_BANDS_API, data);
            return response.data.data.id;
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to create loyalty point band';
            throw new Error(message);
        }
    },

    updateBand: async (id: string, data: UpdateLoyaltyPointBandDto): Promise<string> => {
        try {
            const response = await axiosInstance.put<ApiEnvelope<{ id: string }>>(`${LOYALTY_BANDS_API}/${id}`, data);
            return response.data.data.id;
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to update loyalty point band';
            throw new Error(message);
        }
    },

    deleteBand: async (id: string): Promise<void> => {
        await axiosInstance.delete(`${LOYALTY_BANDS_API}/${id}`);
    },
};

export default loyaltyService;
