import axiosInstance from './axiosInstance';

export interface Category {
  id: string; // Backend uses Guid which is string in JSON
  name: string;
  description: string;
  imageUrl?: string;
  parentId?: string | null;
  isActive?: boolean;
}

// Helper to normalie backend response (PascalCase -> camelCase)
const normalizeCategory = (data: any): Category => {
  if (!data) return data;
  const normalized: any = { ...data };

  if (!normalized.id && normalized.Id) normalized.id = normalized.Id;
  if (!normalized.name && normalized.Name) normalized.name = normalized.Name;
  if (!normalized.description && normalized.Description) normalized.description = normalized.Description;
  if (!normalized.imageUrl && normalized.ImageUrl) normalized.imageUrl = normalized.ImageUrl;
  if (normalized.parentId === undefined && normalized.ParentId !== undefined) normalized.parentId = normalized.ParentId;
  if (normalized.isActive === undefined && normalized.IsActive !== undefined) normalized.isActive = normalized.IsActive;

  return normalized as Category;
};

// Helper to convert frontend model to backend DTO (camelCase -> PascalCase)
const toBackendDto = (data: Partial<Category>): any => {
  return {
    Name: data.name,
    Description: data.description,
    ImageUrl: data.imageUrl || null, // Handle empty string as null
    ParentId: data.parentId || null,
    IsActive: data.isActive ?? true
  };
};

// Helper to convert object to FormData
const toFormData = (data: any): FormData => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== undefined && value !== null) {
      // Preserve File/Blob types for multipart upload.
      if (value instanceof Blob) {
        formData.append(key, value);
      } else {
        formData.append(key, value.toString());
      }
    }
  });
  return formData;
};

export const categoryService = {
  // GET /api/categories
  getCategories: async (): Promise<Category[]> => {
    const response = await axiosInstance.get('/categories');
    return Array.isArray(response.data) ? response.data.map(normalizeCategory) : [];
  },

  // GET /api/categories/{id}
  getCategoryById: async (id: string): Promise<Category> => {
    const response = await axiosInstance.get(`/categories/${id}`);
    return normalizeCategory(response.data);
  },

  // POST /api/categories
  createCategory: async (
    category: Omit<Category, 'id'>,
    file?: File | null,
  ): Promise<Category> => {
    const dto = toBackendDto(category);
    const formData = toFormData(dto);
    if (file) formData.append('File', file);

    // Backend returns the created ID (Guid)
    const response = await axiosInstance.post('/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    // Since backend only returns ID, we return the input category with the new ID
    return { ...category, id: response.data } as Category;
  },

  // PUT /api/categories/{id}
  updateCategory: async (
    id: string,
    category: Partial<Category>,
    file?: File | null,
  ): Promise<Category> => {
    const dto = toBackendDto(category);
    // Ensure Id is present in DTO for model binding if needed
    if (!dto.Id) dto.Id = id;

    const formData = toFormData(dto);
    if (file) formData.append('File', file);

    // Backend returns the updated ID (Guid)
    const response = await axiosInstance.put(`/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return { ...category, id: response.data } as Category;
  },

  // DELETE /api/categories/{id}
  deleteCategory: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/categories/${id}`);
  },
};

export default categoryService;

