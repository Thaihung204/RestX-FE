import axiosInstance from "./axiosInstance";

export interface Category {
  id: string; // Backend uses Guid which is string in JSON
  name: string;
  description: string;
  imageUrl?: string;
  parentId?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  categoryChildrens?: Category[];
}

let categoriesCache: Category[] | null = null;
let categoriesInFlight: Promise<Category[]> | null = null;
const categoryByIdCache = new Map<string, Category>();
const categoryByIdInFlight = new Map<string, Promise<Category>>();

const invalidateCategoryCache = (id?: string): void => {
  categoriesCache = null;
  categoriesInFlight = null;

  if (id) {
    categoryByIdCache.delete(id);
    categoryByIdInFlight.delete(id);
    return;
  }

  categoryByIdCache.clear();
  categoryByIdInFlight.clear();
};

// Helper to normalie backend response (PascalCase -> camelCase)
const normalizeCategory = (data: any): Category => {
  if (!data) return data;
  const normalized: any = { ...data };

  if (!normalized.id && normalized.Id) normalized.id = normalized.Id;
  if (!normalized.name && normalized.Name) normalized.name = normalized.Name;
  if (!normalized.description && normalized.Description)
    normalized.description = normalized.Description;
  if (!normalized.imageUrl && normalized.ImageUrl)
    normalized.imageUrl = normalized.ImageUrl;
  if (normalized.parentId === undefined && normalized.ParentId !== undefined)
    normalized.parentId = normalized.ParentId;
  if (normalized.isActive === undefined && normalized.IsActive !== undefined)
    normalized.isActive = normalized.IsActive;

  return normalized as Category;
};

// Helper to convert frontend model to backend DTO (camelCase -> PascalCase)
const toBackendDto = (data: Partial<Category>): any => {
  return {
    Name: data.name,
    Description: data.description,
    ImageUrl: data.imageUrl || null, // Handle empty string as null
    ParentId: data.parentId || null,
    IsActive: data.isActive ?? true,
  };
};

// Helper to convert object to FormData
const toFormData = (data: any): FormData => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
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
    if (categoriesCache) {
      return categoriesCache;
    }

    if (categoriesInFlight) {
      return categoriesInFlight;
    }

    categoriesInFlight = axiosInstance
      .get("/categories")
      .then((response) => {
        const normalized = Array.isArray(response.data)
          ? response.data.map(normalizeCategory)
          : [];
        categoriesCache = normalized;
        return normalized;
      })
      .finally(() => {
        categoriesInFlight = null;
      });

    return categoriesInFlight;
  },

  // GET /api/categories/{id}
  getCategoryById: async (id: string): Promise<Category> => {
    const cached = categoryByIdCache.get(id);
    if (cached) {
      return cached;
    }

    const inFlight = categoryByIdInFlight.get(id);
    if (inFlight) {
      return inFlight;
    }

    const request = axiosInstance
      .get(`/categories/${id}`)
      .then((response) => {
        const normalized = normalizeCategory(response.data);
        categoryByIdCache.set(id, normalized);
        return normalized;
      })
      .finally(() => {
        categoryByIdInFlight.delete(id);
      });

    categoryByIdInFlight.set(id, request);
    return request;
  },

  // POST /api/categories
  createCategory: async (
    category: Omit<Category, "id">,
    file?: File | null,
  ): Promise<Category> => {
    const dto = toBackendDto(category);
    const formData = toFormData(dto);
    if (file) formData.append("File", file);

    // Backend returns the created ID (Guid)
    const response = await axiosInstance.post("/categories", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    invalidateCategoryCache();

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
    if (file) formData.append("File", file);

    // Backend returns the updated ID (Guid)
    const response = await axiosInstance.put(`/categories/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    invalidateCategoryCache(id);

    return { ...category, id: response.data } as Category;
  },

  // DELETE /api/categories/{id}
  deleteCategory: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/categories/${id}`);
    invalidateCategoryCache(id);
  },

  // PUT /api/categories/display-order
  updateDisplayOrder: async (categories: Category[]): Promise<void> => {
    const payload = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      file: null,
      imageUrl: cat.imageUrl || null,
      parentId: cat.parentId || null,
      isActive: cat.isActive ?? true,
      displayOrder: cat.displayOrder ?? 0,
      categoryChildrens: cat.categoryChildrens ?? [],
    }));
    await axiosInstance.put("/categories/display-order", payload);
    invalidateCategoryCache();
  },
};

export default categoryService;
