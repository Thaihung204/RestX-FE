import axiosInstance from './axiosInstance';

export interface Category {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
}

export const categoryService = {
    getCategories: async (): Promise<Category[]> => {
        const response = await axiosInstance.get('/categories');
        return response.data;
    }
};
