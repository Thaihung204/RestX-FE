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
  images?: Array<{
    id?: string; // For existing images
    file?: File; // For new images
    imageType: number;
    displayOrder: number;
    isActive: boolean;
  }>;
}

export interface DishUpdateDto extends DishCreateDto {
}

export interface DishImageDto {
  id: string;
  file: null;
  imageUrl: string;
  imageType: number;
  displayOrder: number;
  isActive: boolean;
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
  images?: DishImageDto[];
  mainImageUrl?: string;
  imageUrl?: string;
  image?: string;
}

export interface MenuItem extends Partial<DishResponseDto> {
  id: string;
  categoryId: string;
  categoryName: string;
  imageUrl?: string;
  name?: string;
  price?: number;
  description?: string;
  unit?: string;
  quantity?: number;
  isActive?: boolean;
}

export interface MenuCategory {
  categoryId: string;
  categoryName: string;
  items: MenuItem[];
}

export interface DishListResponseDto {
  dishes?: DishResponseDto[];
  data?: DishResponseDto[];
  items?: DishResponseDto[];
  totalCount?: number;
  page?: number;
  itemsPerPage?: number;
}

class DishService {

  async getDishes(
    page: number = 1,
    itemsPerPage: number = 100,
  ): Promise<DishListResponseDto> {
    const response = await axiosInstance.get("/dishes", {
      params: { page, itemsPerPage },
    });
    return response.data;
  }

  async getDishById(id: string): Promise<DishResponseDto> {
    const response = await axiosInstance.get(`/dishes/${id}`);
    return response.data;
  }

  async getMenu(): Promise<MenuCategory[]> {
    const response = await axiosInstance.get("/dishes/menu");
    return response.data;
  }

  /**
   * Create a new dish with FormData (matches backend [FromForm] expectation)
   */
  async createDish(dish: DishCreateDto): Promise<DishResponseDto> {
    const formData = this.buildFormData(dish);
    
    console.log('[DishService] FormData contents:');
    for (const pair of (formData as any).entries()) {
      console.log(`  ${pair[0]}:`, pair[1]);
    }
    
    const response = await axiosInstance.post("/dishes", formData);
    return response.data;
  }

  /**
   * Update existing dish with FormData (matches backend [FromForm] expectation)
   */
  async updateDish(id: string, dish: DishUpdateDto): Promise<DishResponseDto> {
    const formData = this.buildFormData(dish);
    
    console.log('[DishService] UpdateDish FormData contents:');
    for (const pair of (formData as any).entries()) {
      console.log(`  ${pair[0]}:`, pair[1]);
    }
    
    const response = await axiosInstance.put(`/dishes/${id}`, formData);
    return response.data;
  }

  /**
   * Helper: Build FormData from dish object
   * Backend expects:
   * - Simple fields: name, categoryId, price, etc.
   * - Images as List<DishImageItem>:
   *   - Images[0].File (IFormFile)
   *   - Images[0].ImageType (enum value)
   *   - Images[0].DisplayOrder (int)
   *   - Images[0].IsActive (bool)
   */
  private buildFormData(dish: DishCreateDto | DishUpdateDto): FormData {
    const formData = new FormData();
    
    if ('id' in dish && dish.id) {
      formData.append("id", dish.id.toString());
    }
    
    formData.append("name", dish.name || "");
    formData.append("categoryId", dish.categoryId || "");
    formData.append("price", (dish.price || 0).toString());
    formData.append("description", dish.description || "");
    formData.append("unit", dish.unit || "");
    formData.append("quantity", (dish.quantity || 0).toString());
    formData.append("isActive", String(dish.isActive));
    formData.append("isVegetarian", String(dish.isVegetarian));
    formData.append("isSpicy", String(dish.isSpicy));
    formData.append("isBestSeller", String(dish.isBestSeller));
    formData.append("autoDisableByStock", String(dish.autoDisableByStock));
    
    // Handle images array (both new files and existing images)
    if (dish.images && dish.images.length > 0) {
      dish.images.forEach((img, index) => {
        // For existing images (have ID)
        if (img.id) {
          formData.append(`Images[${index}].Id`, img.id);
        }
        // For new images (have file)
        if (img.file) {
          formData.append(`Images[${index}].File`, img.file);
        }
        formData.append(`Images[${index}].ImageType`, img.imageType.toString());
        formData.append(`Images[${index}].DisplayOrder`, img.displayOrder.toString());
        formData.append(`Images[${index}].IsActive`, String(img.isActive));
      });
    }
    
    return formData;
  }

  async deleteDish(id: string): Promise<void> {
    await axiosInstance.delete(`/dishes/${id}`);
  }

  async uploadDishImage(
    id: string,
    imageFile: File,
  ): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await axiosInstance.post(`/dishes/${id}/image`, formData, {
    });
    return response.data;
  }

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

export const dishService = new DishService();
export default dishService;
