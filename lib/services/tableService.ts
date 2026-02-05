import axiosInstance from './axiosInstance';

export interface TableItem {
    id: string;
    code: string;
    type: string;
    seatingCapacity: number;
    shape: string;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    rotation: number;
    tableStatusId: string;
    tableStatusName?: string;
    isActive: boolean;
}

export const tableService = {
    getAll: async () => {
        const response = await axiosInstance.get<TableItem[]>('/tables');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await axiosInstance.get<TableItem>(`/tables/${id}`);
        return response.data;
    },

    create: async (data: Partial<TableItem>) => {
        // Backend expects valid DTO.
        // If TableStatusId is required, we must fetch it or backend handles it.
        // Let's assume backend might assign default if ID is empty/default.
        const payload = {
            ...data,
            isActive: true,
            shape: data.shape || 'Rectangle',
        };
        const response = await axiosInstance.post<TableItem>('/tables', payload);
        return response.data;
    },

    update: async (id: string, data: Partial<TableItem>) => {
        const response = await axiosInstance.put<TableItem>(`/tables/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await axiosInstance.delete(`/tables/${id}`);
    }
};
