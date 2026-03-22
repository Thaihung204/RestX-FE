import axiosInstance from "./axiosInstance";

export interface DishRecipeItem {
  id?: string;
  dishId?: string;
  ingredientId: string;
  ingredientName?: string;
  quantity: number;
}

const normalizeRecipe = (data: any): DishRecipeItem => {
  if (!data) return data;
  return {
    id: data.id ?? data.Id,
    dishId: data.dishId ?? data.DishId,
    ingredientId: data.ingredientId ?? data.IngredientId,
    ingredientName: data.ingredientName ?? data.IngredientName,
    quantity: data.quantity ?? data.Quantity ?? 0,
  };
};

const recipeService = {
  getByDishId: async (dishId: string): Promise<DishRecipeItem[]> => {
    const res = await axiosInstance.get(`/dishes/${dishId}/recipes`);
    const list = Array.isArray(res.data)
      ? res.data
      : res.data?.items || res.data?.data || [];
    return Array.isArray(list) ? list.map(normalizeRecipe) : [];
  },

  create: async (item: DishRecipeItem): Promise<string> => {
    const res = await axiosInstance.post("/dishes/recipe", item);
    return res.data as string;
  },

  update: async (id: string, item: DishRecipeItem): Promise<string> => {
    const res = await axiosInstance.put(`/dishes/recipe/${id}`, item);
    return res.data as string;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/dishes/recipe/${id}`);
  },

  setRecipes: async (
    dishId: string,
    items: DishRecipeItem[],
  ): Promise<string> => {
    const res = await axiosInstance.post(`/dishes/${dishId}/recipes`, items);
    return res.data as string;
  },
};

export default recipeService;
