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

export interface DishUpdateDto extends DishCreateDto {}

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
  private dishListCache = new Map<string, DishListResponseDto>();

  private dishListInFlight = new Map<string, Promise<DishListResponseDto>>();

  private dishByIdCache = new Map<string, DishResponseDto>();

  private dishByIdInFlight = new Map<string, Promise<DishResponseDto>>();

  private menuCache: MenuCategory[] | null = null;

  private menuInFlight: Promise<MenuCategory[]> | null = null;

  private getDishListCacheKey(page: number, itemsPerPage: number): string {
    return `${page}:${itemsPerPage}`;
  }

  private invalidateDishCache(id?: string): void {
    this.dishListCache.clear();
    this.dishListInFlight.clear();
    this.menuCache = null;
    this.menuInFlight = null;

    if (id) {
      this.dishByIdCache.delete(id);
      this.dishByIdInFlight.delete(id);
      return;
    }

    this.dishByIdCache.clear();
    this.dishByIdInFlight.clear();
  }

  async getDishes(
    page: number = 1,
    itemsPerPage: number = 100,
  ): Promise<DishListResponseDto> {
    const cacheKey = this.getDishListCacheKey(page, itemsPerPage);

    const cached = this.dishListCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const inFlight = this.dishListInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const request = axiosInstance
      .get("/dishes", {
        params: { page, itemsPerPage },
      })
      .then((response) => {
        const data = response.data as DishListResponseDto;
        this.dishListCache.set(cacheKey, data);
        return data;
      })
      .finally(() => {
        this.dishListInFlight.delete(cacheKey);
      });

    this.dishListInFlight.set(cacheKey, request);
    return request;
  }

  async getDishById(id: string): Promise<DishResponseDto> {
    const cached = this.dishByIdCache.get(id);
    if (cached) {
      return cached;
    }

    const inFlight = this.dishByIdInFlight.get(id);
    if (inFlight) {
      return inFlight;
    }

    const request = axiosInstance
      .get(`/dishes/${id}`)
      .then((response) => {
        const data = response.data as DishResponseDto;
        this.dishByIdCache.set(id, data);
        return data;
      })
      .finally(() => {
        this.dishByIdInFlight.delete(id);
      });

    this.dishByIdInFlight.set(id, request);
    return request;
  }

  async getMenu(): Promise<MenuCategory[]> {
    if (this.menuCache) {
      return this.menuCache;
    }

    if (this.menuInFlight) {
      return this.menuInFlight;
    }

    const request = axiosInstance
      .get("/dishes/menu")
      .then((response) => {
        const data = response.data as MenuCategory[];
        this.menuCache = data;
        return data;
      })
      .finally(() => {
        this.menuInFlight = null;
      });

    this.menuInFlight = request;
    return request;
  }

  /**
   * Create a new dish with FormData (matches backend [FromForm] expectation)
   */
  async createDish(dish: DishCreateDto): Promise<DishResponseDto> {
    const formData = this.buildFormData(dish);

    console.log("[DishService] FormData contents:");
    for (const pair of (formData as any).entries()) {
      console.log(`  ${pair[0]}:`, pair[1]);
    }

    const response = await axiosInstance.post("/dishes", formData);
    this.invalidateDishCache();
    return response.data;
  }

  /**
   * Update existing dish with FormData (matches backend [FromForm] expectation)
   */
  async updateDish(id: string, dish: DishUpdateDto): Promise<DishResponseDto> {
    const formData = this.buildFormData(dish);

    console.log("[DishService] UpdateDish FormData contents:");
    for (const pair of (formData as any).entries()) {
      console.log(`  ${pair[0]}:`, pair[1]);
    }

    const response = await axiosInstance.put(`/dishes/${id}`, formData);
    this.invalidateDishCache(id);
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

    if ("id" in dish && dish.id) {
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
        formData.append(
          `Images[${index}].DisplayOrder`,
          img.displayOrder.toString(),
        );
        formData.append(`Images[${index}].IsActive`, String(img.isActive));
      });
    }

    return formData;
  }

  async deleteDish(id: string): Promise<void> {
    await axiosInstance.delete(`/dishes/${id}`);
    this.invalidateDishCache(id);
  }

  async uploadDishImage(
    id: string,
    imageFile: File,
  ): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await axiosInstance.post(
      `/dishes/${id}/image`,
      formData,
      {},
    );
    return response.data;
  }

  async toggleDishStatus(
    id: string,
    isActive: boolean,
  ): Promise<DishResponseDto> {
    const currentDish = await this.getDishById(id);

    const response = await this.updateDish(id, {
      name: currentDish.name,
      categoryId: currentDish.categoryId || "",
      price: currentDish.price,
      description: currentDish.description,
      unit: currentDish.unit,
      quantity: currentDish.quantity,
      isActive,
      isVegetarian: currentDish.isVegetarian,
      isSpicy: currentDish.isSpicy,
      isBestSeller: currentDish.isBestSeller,
      autoDisableByStock: currentDish.autoDisableByStock,
      images: (currentDish.images || []).map((img) => ({
        id: img.id,
        imageType: img.imageType,
        displayOrder: img.displayOrder,
        isActive: img.isActive,
      })),
    });

    this.invalidateDishCache(id);
    return response;
  }
}

export const dishService = new DishService();
export default dishService;
