import axiosInstance from "./axiosInstance";

export interface IngredientItem {
  id?: string;
  name: string;
  code: string;
  unit: string;
  currentQuantity?: number;
  minStockLevel: number;
  maxStockLevel: number;
  supplierId?: string | null;
  supplierName?: string;
  type?: string | null;
  isActive: boolean;
  status?: number;
}

export interface IngredientCategory {
  id?: string;
  name: string;
  code?: string;
  description?: string | null;
  isActive?: boolean;
}

let ingredientsCache: IngredientItem[] | null = null;
let ingredientsInFlight: Promise<IngredientItem[]> | null = null;
const ingredientByIdCache = new Map<string, IngredientItem>();
const ingredientByIdInFlight = new Map<string, Promise<IngredientItem>>();

const invalidateIngredientCache = (id?: string): void => {
  ingredientsCache = null;
  ingredientsInFlight = null;

  if (id) {
    ingredientByIdCache.delete(id);
    ingredientByIdInFlight.delete(id);
    return;
  }

  ingredientByIdCache.clear();
  ingredientByIdInFlight.clear();
};

const normalize = (data: any): IngredientItem => {
  if (!data) return data;
  return {
    id: data.id ?? data.Id,
    name: data.name ?? data.Name ?? "",
    code: data.code ?? data.Code ?? "",
    unit: data.unit ?? data.Unit ?? "",
    currentQuantity: data.currentQuantity ?? data.CurrentQuantity ?? 0,
    minStockLevel: data.minStockLevel ?? data.MinStockLevel ?? 0,
    maxStockLevel: data.maxStockLevel ?? data.MaxStockLevel ?? 0,
    supplierId: data.supplierId ?? data.SupplierId ?? null,
    supplierName: data.supplierName ?? data.SupplierName ?? "",
    type: data.type ?? data.Type ?? null,
    isActive: data.isActive ?? data.IsActive ?? true,
    status: data.status ?? data.Status,
  };
};

const normalizeCategory = (data: any): IngredientCategory => {
  if (!data) return data;
  return {
    id: data.id ?? data.Id,
    name: data.name ?? data.Name ?? "",
    code: data.code ?? data.Code ?? "",
    description: data.description ?? data.Description ?? null,
    isActive: data.isActive ?? data.IsActive ?? true,
  };
};

const ingredientService = {
  getAll: async (): Promise<IngredientItem[]> => {
    if (ingredientsCache) {
      return ingredientsCache;
    }

    if (ingredientsInFlight) {
      return ingredientsInFlight;
    }

    ingredientsInFlight = axiosInstance
      .get("/ingredients")
      .then((res) => {
        const normalized = Array.isArray(res.data)
          ? res.data.map(normalize)
          : [];
        ingredientsCache = normalized;
        return normalized;
      })
      .finally(() => {
        ingredientsInFlight = null;
      });

    return ingredientsInFlight;
  },

  getById: async (id: string): Promise<IngredientItem> => {
    const cached = ingredientByIdCache.get(id);
    if (cached) {
      return cached;
    }

    const inFlight = ingredientByIdInFlight.get(id);
    if (inFlight) {
      return inFlight;
    }

    const request = axiosInstance
      .get(`/ingredients/${id}`)
      .then((res) => {
        const normalized = normalize(res.data);
        ingredientByIdCache.set(id, normalized);
        return normalized;
      })
      .finally(() => {
        ingredientByIdInFlight.delete(id);
      });

    ingredientByIdInFlight.set(id, request);
    return request;
  },

  create: async (
    payload: Omit<IngredientItem, "id"> & { id?: any },
  ): Promise<string> => {
    const { id: _id, ...body } = payload as any;
    const res = await axiosInstance.post("/ingredients", body);
    invalidateIngredientCache();
    return res.data as string;
  },

  update: async (id: string, payload: IngredientItem): Promise<string> => {
    const { id: _id, ...rest } = payload;
    const res = await axiosInstance.put(`/ingredients/${id}`, { ...rest, id });
    invalidateIngredientCache(id);
    return res.data as string;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/ingredients/${id}`);
    invalidateIngredientCache(id);
  },

  getAllCategories: async (): Promise<IngredientCategory[]> => {
    const res = await axiosInstance.get("/ingredients/categories");
    return Array.isArray(res.data) ? res.data.map(normalizeCategory) : [];
  },

  getCategoryById: async (id: string): Promise<IngredientCategory> => {
    const res = await axiosInstance.get(`/ingredients/categories/${id}`);
    return normalizeCategory(res.data);
  },

  createCategory: async (
    payload: Omit<IngredientCategory, "id"> & { id?: any },
  ): Promise<string> => {
    const { id: _id, ...body } = payload as any;
    const res = await axiosInstance.post("/ingredients/categories", body);
    return res.data as string;
  },

  updateCategory: async (
    id: string,
    payload: IngredientCategory,
  ): Promise<string> => {
    const { id: _id, ...rest } = payload;
    const res = await axiosInstance.put(`/ingredients/categories/${id}`, {
      ...rest,
      id,
    });
    return res.data as string;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/ingredients/categories/${id}`);
  },
};

export default ingredientService;
