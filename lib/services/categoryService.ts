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
      formData.append(key, value.toString());
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
  createCategory: async (category: Omit<Category, 'id'>): Promise<Category> => {
    const dto = toBackendDto(category);
    const formData = toFormData(dto);

    // Backend returns the created ID (Guid)
    const response = await axiosInstance.post('/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    // Since backend only returns ID, we return the input category with the new ID
    return { ...category, id: response.data } as Category;
  },

  // PUT /api/categories/{id}
  updateCategory: async (id: string, category: Partial<Category>): Promise<Category> => {
    const dto = toBackendDto(category);
    // Ensure Id is present in DTO for model binding if needed
    if (!dto.Id) dto.Id = id;

    const formData = toFormData(dto);

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

  /**
   * Upload image (Workaround using Employee Avatar)
   * Since there is no direct upload endpoint for categories, we use the Employee creation endpoint
   * which supports file upload, get the URL, and then delete the temp employee.
   */
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    formData.append('Avatar', file);
    formData.append('Email', `temp-upload-${uniqueId}@restx.food`);
    formData.append('FullName', `Temp Uploader ${uniqueId}`);
    formData.append('Position', 'Temp');
    formData.append('Role', 'Waiter');
    formData.append('PhoneNumber', '0123456789'); // Dummy phone number
    formData.append('HireDate', new Date().toISOString());
    formData.append('Address', 'Temp Address');

    try {
      // 1. Create temp employee to upload file
      // NOTE: Do NOT set Content-Type header for FormData!
      // Let browser/axios set it automatically with correct boundary
      const response = await axiosInstance.post('/employees', formData);

      const employeeData = response.data.data;
      const avatarUrl = employeeData?.avatarUrl || employeeData?.AvatarUrl;

      // 2. Delete temp employee immediately
      if (employeeData?.id) {
        // Fire and forget cleanup to avoid delaying the response, but log error if it fails
        axiosInstance.delete(`/employees/${employeeData.id}`).catch(err => console.warn("Failed to cleanup temp employee", err));
      }

      if (!avatarUrl) {
        throw new Error("Failed to retrieve image URL from upload response");
      }

      return avatarUrl;
    } catch (error: any) {
      console.error("Image upload failed detailed:", error.response?.data || error.message);
      // Extract meaningful error message from backend
      const backendMessage = error.response?.data?.message || error.message;
      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        // If it's a validation error (e.g. ModelState), join them
        const errorStr = Object.values(validationErrors).flat().join(', ');
        throw new Error(`Upload failed: ${errorStr}`);
      }

      throw new Error(`Image upload failed: ${backendMessage}`);
    }
  }
};

export default categoryService;

