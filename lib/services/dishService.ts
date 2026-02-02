import axiosInstance from "./axiosInstance";

export interface DishCreateDto {
  name: string;
  categoryId: string;
  price: number;
  description: string;
  unit: string;
  quantity: number;
  isActive: boolean;
  isVegetarian: boolean;
  isSpicy: boolean;
  isBestSeller: boolean;
  autoDisableByStock: boolean;
}

export interface DishUpdateDto extends DishCreateDto {
  // Same fields as create
}

export interface DishResponseDto {
  id: string;
  name: string;
  categoryId?: string;
  categoryName?: string;
  price: number;
  description: string;
  unit: string;
  quantity: number;
  isActive: boolean;
  isVegetarian: boolean;
  isSpicy: boolean;
  isBestSeller: boolean;
  autoDisableByStock: boolean;
  mainImageUrl?: string;
  imageUrl?: string;
  image?: string;
}

export interface DishListResponseDto {
  dishes?: DishResponseDto[];
  data?: DishResponseDto[];
  items?: DishResponseDto[];
  totalCount?: number;
  page?: number;
  itemsPerPage?: number;
}

/**
 * Dish Service - Handles all dish/menu related API calls
 */
class DishService {
  /**
   * Get all dishes with pagination
   */
  async getDishes(
    page: number = 1,
    itemsPerPage: number = 100,
  ): Promise<DishListResponseDto> {
    const response = await axiosInstance.get("/dishes", {
      params: { page, itemsPerPage },
    });
    return response.data;
  }

  /**
   * Get a single dish by ID
   */
  async getDishById(id: string): Promise<DishResponseDto> {
    const response = await axiosInstance.get(`/dishes/${id}`);
    return response.data;
  }

  /**
   * Create a new dish
   */
  async createDish(dish: DishCreateDto): Promise<DishResponseDto> {
    const response = await axiosInstance.post("/dishes", dish);
    return response.data;
  }

  /**
   * Update an existing dish
   */
  async updateDish(id: string, dish: DishUpdateDto): Promise<DishResponseDto> {
    const response = await axiosInstance.put(`/dishes/${id}`, dish);
    return response.data;
  }

  /**
   * Delete a dish
   */
  async deleteDish(id: string): Promise<void> {
    await axiosInstance.delete(`/dishes/${id}`);
  }

  /**
   * Upload dish image (if backend supports it)
   */
  async uploadDishImage(
    id: string,
    imageFile: File,
  ): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await axiosInstance.post(`/dishes/${id}/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  /**
   * Toggle dish active status
   */
  async toggleDishStatus(
    id: string,
    isActive: boolean,
  ): Promise<DishResponseDto> {
    const response = await axiosInstance.patch(`/dishes/${id}/status`, {
      isActive,
    });
    return response.data;
  }
}

// Export singleton instance
export const dishService = new DishService();
export default dishService;
