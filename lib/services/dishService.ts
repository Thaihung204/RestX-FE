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
}

export interface DishImageDto {
  id: string;
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
  mainImageUrl?: string;
  imageUrl?: string;
  image?: string;
  images?: DishImageDto[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  categoryName: string;
  imageUrl?: string;
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

  async createDish(dish: DishCreateDto): Promise<DishResponseDto> {
    const response = await axiosInstance.post("/dishes", dish);
    return response.data;
  }

  async updateDish(id: string, dish: DishUpdateDto): Promise<DishResponseDto> {
    const response = await axiosInstance.put(`/dishes/${id}`, dish);
    return response.data;
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
      headers: {
        "Content-Type": "multipart/form-data",
      },
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
