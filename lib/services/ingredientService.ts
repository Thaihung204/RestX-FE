import axiosInstance from './axiosInstance';

// ── Types ────────────────────────────────────────────────────────────────────

export interface IngredientItem {
  id?: string;
  name: string;
  /** Short code, e.g. "CA_HOI" — max 20 chars */
  code: string;
  /** Unit of measure, e.g. "kg" — max 20 chars */
  unit: string;
  minStockLevel: number;
  maxStockLevel: number;
  supplierId?: string | null;
  supplierName?: string;
  /** Optional category / type — max 50 chars */
  type?: string | null;
  isActive: boolean;
}

// ── Normalizer (PascalCase → camelCase fallback) ──────────────────────────────

const normalize = (data: any): IngredientItem => {
  if (!data) return data;
  return {
    id:            data.id            ?? data.Id,
    name:          data.name          ?? data.Name          ?? '',
    code:          data.code          ?? data.Code          ?? '',
    unit:          data.unit          ?? data.Unit          ?? '',
    minStockLevel: data.minStockLevel ?? data.MinStockLevel ?? 0,
    maxStockLevel: data.maxStockLevel ?? data.MaxStockLevel ?? 0,
    supplierId:    data.supplierId    ?? data.SupplierId    ?? null,
    supplierName:  data.supplierName  ?? data.SupplierName  ?? '',
    type:          data.type          ?? data.Type          ?? null,
    isActive:      data.isActive      ?? data.IsActive      ?? true,
  };
};

// ── Service ───────────────────────────────────────────────────────────────────

const ingredientService = {
  /** GET /api/ingredients */
  getAll: async (): Promise<IngredientItem[]> => {
    const res = await axiosInstance.get('/ingredients');
    return Array.isArray(res.data) ? res.data.map(normalize) : [];
  },

  /** GET /api/ingredients/{id} */
  getById: async (id: string): Promise<IngredientItem> => {
    const res = await axiosInstance.get(`/ingredients/${id}`);
    return normalize(res.data);
  },

  /** POST /api/ingredients → returns new Guid */
  create: async (payload: Omit<IngredientItem, 'id'> & { id?: any }): Promise<string> => {
    // Strip id to avoid empty string Guid issue in .NET
    const { id: _id, ...body } = payload as any;
    const res = await axiosInstance.post('/ingredients', body);
    return res.data as string;
  },

  /** PUT /api/ingredients/{id} → returns Guid */
  update: async (id: string, payload: IngredientItem): Promise<string> => {
    const { id: _id, ...rest } = payload;
    const res = await axiosInstance.put(`/ingredients/${id}`, { ...rest, id });
    return res.data as string;
  },

  /** DELETE /api/ingredients/{id} */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/ingredients/${id}`);
  },
};

export default ingredientService;
