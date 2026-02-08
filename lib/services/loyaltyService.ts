import axiosInstance from './axiosInstance';

export interface LoyaltyPointBand {
    id: string;
    name: string;
    min: number;
    max: number | null;
    discountPercentage: number;
    benefitDescription: string;
    icon: string;
    isActive: boolean;
}

export interface CreateLoyaltyPointBandDto {
    name: string;
    min: number;
    max: number | null;
    discountPercentage: number;
    benefitDescription: string;
    icon: string;
    isActive: boolean;
}

export interface UpdateLoyaltyPointBandDto extends CreateLoyaltyPointBandDto {
    id: string;
}

// Mock Data
let mockBands: LoyaltyPointBand[] = [
    {
        id: "1",
        name: "Bronze",
        min: 0,
        max: 100,
        discountPercentage: 5,
        benefitDescription: "5% discount on all orders",
        icon: "bronze",
        isActive: true
    },
    {
        id: "2",
        name: "Silver",
        min: 101,
        max: 500,
        discountPercentage: 10,
        benefitDescription: "10% discount + Priority support",
        icon: "silver",
        isActive: true
    },
    {
        id: "3",
        name: "Gold",
        min: 501,
        max: null,
        discountPercentage: 15,
        benefitDescription: "15% discount + Free delivery",
        icon: "gold",
        isActive: true
    }
];

const loyaltyService = {
    getAllBands: async (): Promise<LoyaltyPointBand[]> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return [...mockBands];
    },

    getBandById: async (id: string): Promise<LoyaltyPointBand> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const band = mockBands.find(b => b.id === id);
        if (!band) throw new Error("Band not found");
        return band;
    },

    createBand: async (data: CreateLoyaltyPointBandDto): Promise<LoyaltyPointBand> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newBand: LoyaltyPointBand = {
            ...data,
            id: Math.random().toString(36).substr(2, 9)
        };
        mockBands.push(newBand);
        return newBand;
    },

    updateBand: async (id: string, data: UpdateLoyaltyPointBandDto): Promise<LoyaltyPointBand> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const index = mockBands.findIndex(b => b.id === id);
        if (index === -1) throw new Error("Band not found");

        mockBands[index] = { ...mockBands[index], ...data };
        return mockBands[index];
    },

    deleteBand: async (id: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        mockBands = mockBands.filter(b => b.id !== id);
    }
};

export default loyaltyService;
