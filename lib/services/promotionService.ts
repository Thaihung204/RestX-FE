import axiosInstance from "./axiosInstance";

const PROMOTIONS_API = "/promotions";

export interface Promotion {
  id: string;
  code: string;
  name: string;
  discountValue: number;
  discountType: "PERCENTAGE" | "FIXED";
  maxDiscountAmount: number;
  minOrderAmount: number;
  usageLimit: number;
  usagePerCustomer: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  applicableItems: PromotionApplicableItem[];
}

export interface PromotionApplicableItem {
  id?: string;
  dishId?: string | null;
  categoryId?: string | null;
  comboId?: string | null;
  dishName?: string | null;
  categoryName?: string | null;
  comboName?: string | null;
}

export interface CreatePromotionDto {
  code: string;
  name: string;
  discountValue: number;
  discountType: "PERCENTAGE" | "FIXED";
  maxDiscountAmount: number;
  minOrderAmount: number;
  usageLimit: number;
  usagePerCustomer: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  applicableItems: PromotionApplicableItem[];
}

export interface UpdatePromotionDto extends CreatePromotionDto {
  id: string;
}

const normalizePromotion = (data: any): Promotion => ({
  id: data?.id ?? data?.Id ?? "",
  code: data?.code ?? data?.Code ?? "",
  name: data?.name ?? data?.Name ?? "",
  discountValue: Number(data?.discountValue ?? data?.DiscountValue ?? 0),
  discountType: (data?.discountType ?? data?.DiscountType ?? "PERCENTAGE") as
    | "PERCENTAGE"
    | "FIXED",
  maxDiscountAmount: Number(
    data?.maxDiscountAmount ?? data?.MaxDiscountAmount ?? 0,
  ),
  minOrderAmount: Number(data?.minOrderAmount ?? data?.MinOrderAmount ?? 0),
  usageLimit: Number(data?.usageLimit ?? data?.UsageLimit ?? 0),
  usagePerCustomer: Number(
    data?.usagePerCustomer ?? data?.UsagePerCustomer ?? 1,
  ),
  validFrom: data?.validFrom ?? data?.ValidFrom ?? new Date().toISOString(),
  validTo: data?.validTo ?? data?.ValidTo ?? new Date().toISOString(),
  isActive: Boolean(data?.isActive ?? data?.IsActive ?? true),
  applicableItems: data?.applicableItems ?? data?.ApplicableItems ?? [],
});

const extractArray = <T>(raw: any): T[] => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

const extractObject = <T>(raw: any): T => {
  if (raw?.data && !Array.isArray(raw.data)) return raw.data as T;
  return raw as T;
};

const promotionService = {
  getActivePromotions: async (): Promise<Promotion[]> => {
    try {
      const response = await axiosInstance.get(`${PROMOTIONS_API}/active`);
      const items = extractArray<any>(response.data);
      return items.map(normalizePromotion);
    } catch (error: any) {
      console.error("Failed to fetch active promotions:", error);
      throw error;
    }
  },

  getAllPromotions: async (): Promise<Promotion[]> => {
    try {
      const response = await axiosInstance.get(PROMOTIONS_API);
      const items = extractArray<any>(response.data);
      return items.map(normalizePromotion);
    } catch (error: any) {
      console.error("Failed to fetch promotions:", error);
      throw error;
    }
  },

  getPromotionById: async (id: string): Promise<Promotion> => {
    try {
      const response = await axiosInstance.get(`${PROMOTIONS_API}/${id}`);
      return normalizePromotion(extractObject<any>(response.data));
    } catch (error: any) {
      console.error("Failed to fetch promotion:", error);
      throw error;
    }
  },

  createPromotion: async (data: CreatePromotionDto): Promise<string> => {
    try {
      const response = await axiosInstance.post<string>(PROMOTIONS_API, {
        code: data.code.trim().toUpperCase(),
        name: data.name,
        discountValue: data.discountValue,
        discountType: data.discountType,
        maxDiscountAmount: data.maxDiscountAmount,
        minOrderAmount: data.minOrderAmount,
        usageLimit: data.usageLimit,
        usagePerCustomer: data.usagePerCustomer,
        validFrom: data.validFrom,
        validTo: data.validTo,
        isActive: data.isActive,
        applicableItems: data.applicableItems ?? [],
      });
      return response.data;
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to create promotion";
      throw new Error(message);
    }
  },

  updatePromotion: async (
    id: string,
    data: UpdatePromotionDto,
  ): Promise<string> => {
    try {
      const response = await axiosInstance.put<string>(
        `${PROMOTIONS_API}/${id}`,
        {
          id,
          code: data.code.trim().toUpperCase(),
          name: data.name,
          discountValue: data.discountValue,
          discountType: data.discountType,
          maxDiscountAmount: data.maxDiscountAmount,
          minOrderAmount: data.minOrderAmount,
          usageLimit: data.usageLimit,
          usagePerCustomer: data.usagePerCustomer,
          validFrom: data.validFrom,
          validTo: data.validTo,
          isActive: data.isActive,
          applicableItems: data.applicableItems ?? [],
        },
      );
      return response.data;
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to update promotion";
      throw new Error(message);
    }
  },

  deletePromotion: async (id: string): Promise<void> => {
    try {
      await axiosInstance.delete(`${PROMOTIONS_API}/${id}`);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to delete promotion";
      throw new Error(message);
    }
  },
};

export default promotionService;
