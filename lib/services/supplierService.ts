import axiosInstance from './axiosInstance';

export interface SupplierItem {
  id?: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
}

const normalize = (data: any): SupplierItem => ({
  id:      data.id      ?? data.Id,
  name:    data.name    ?? data.Name    ?? '',
  phone:   data.phone   ?? data.Phone   ?? null,
  email:   data.email   ?? data.Email   ?? null,
  address: data.address ?? data.Address ?? null,
  isActive: data.isActive ?? data.IsActive ?? true,
});

const supplierService = {
  getAll: async (): Promise<SupplierItem[]> => {
    const res = await axiosInstance.get('/suppliers');
    return Array.isArray(res.data) ? res.data.map(normalize) : [];
  },

  getById: async (id: string): Promise<SupplierItem> => {
    const res = await axiosInstance.get(`/suppliers/${id}`);
    return normalize(res.data);
  },

  create: async (payload: Omit<SupplierItem, 'id'> & { id?: any }): Promise<string> => {
    // Destructure to strip id (empty string "" is invalid Guid in .NET)
    const { id: _id, ...body } = payload as any;
    const res = await axiosInstance.post('/suppliers', body);
    return res.data as string;
  },

  update: async (id: string, payload: SupplierItem): Promise<string> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = payload;
    const res = await axiosInstance.put(`/suppliers/${id}`, { ...rest, id });
    return res.data as string;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/suppliers/${id}`);
  },
};

export default supplierService;
