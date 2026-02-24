import axiosInstance from './axiosInstance';


export interface IngredientItem {
  id?: string;
  name: string;
  code: string;
  unit: string;
  minStockLevel: number;
  maxStockLevel: number;
  supplierId?: string | null;
  supplierName?: string;
  type?: string | null;
  isActive: boolean;
}


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


const ingredientService = {
  getAll: async (): Promise<IngredientItem[]> => {
    const res = await axiosInstance.get('/ingredients');
    return Array.isArray(res.data) ? res.data.map(normalize) : [];
  },

  getById: async (id: string): Promise<IngredientItem> => {
    const res = await axiosInstance.get(`/ingredients/${id}`);
    return normalize(res.data);
  },
  create: async (payload: Omit<IngredientItem, 'id'> & { id?: any }): Promise<string> => {
    const { id: _id, ...body } = payload as any;
    const res = await axiosInstance.post('/ingredients', body);
    return res.data as string;
  },

  update: async (id: string, payload: IngredientItem): Promise<string> => {
    const { id: _id, ...rest } = payload;
    const res = await axiosInstance.put(`/ingredients/${id}`, { ...rest, id });
    return res.data as string;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/ingredients/${id}`);
  },
};

export default ingredientService;
