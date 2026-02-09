import axiosInstance from './axiosInstance';

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive: boolean;
}

class CategoryService {
  async getCategories(): Promise<Category[]> {
    const response = await axiosInstance.get('/categories');
    return response.data;
  }

  async getCategoryById(id: string): Promise<Category> {
    const response = await axiosInstance.get(`/categories/${id}`);
    return response.data;
  }

  async createCategory(category: Omit<Category, "id">): Promise<Category> {
    const response = await axiosInstance.post('/categories', category);
    return response.data;
  }

  async updateCategory(id: string, category: Omit<Category, "id">): Promise<Category> {
    const response = await axiosInstance.put(`/categories/${id}`, category);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await axiosInstance.delete(`/categories/${id}`);
  }
}

export const categoryService = new CategoryService();
export default categoryService;
