import axiosInstance from './axiosInstance';

export interface OrderDetailStatus {
    id: string;
    name: string;
    code: string;
    color: string;
    isActive: boolean;
    isDefault: boolean;
}

export interface CreateOrderDetailStatusDto {
    name: string;
    code: string;
    color: string;
    isActive: boolean;
    isDefault: boolean;
}

export interface UpdateOrderDetailStatusDto extends CreateOrderDetailStatusDto {
    id: string;
}

// Mock Data - Replace with actual API calls when backend is ready
let mockStatuses: OrderDetailStatus[] = [
    {
        id: "1",
        name: "Pending",
        code: "PENDING",
        color: "#FFA500",
        isActive: true,
        isDefault: true
    },
    {
        id: "2",
        name: "Processing",
        code: "PROCESSING",
        color: "#1890FF",
        isActive: true,
        isDefault: false
    },
    {
        id: "3",
        name: "Completed",
        code: "COMPLETED",
        color: "#52C41A",
        isActive: true,
        isDefault: false
    },
    {
        id: "4",
        name: "Cancelled",
        code: "CANCELLED",
        color: "#FF4D4F",
        isActive: false,
        isDefault: false
    }
];

class OrderDetailStatusService {
    private apiUrl = '/api/admin/order-detail-statuses';

    /**
     * Get all order detail statuses
     */
    async getAllStatuses(): Promise<OrderDetailStatus[]> {
        try {
            // TODO: Replace with actual API call when backend is ready
            // const response = await axiosInstance.get<OrderDetailStatus[]>(this.apiUrl);
            // return response.data;
            
            // Using mock data for now
            return Promise.resolve([...mockStatuses]);
        } catch (error) {
            console.error('Error fetching order detail statuses:', error);
            throw error;
        }
    }

    /**
     * Get a single order detail status by ID
     */
    async getStatusById(id: string): Promise<OrderDetailStatus> {
        try {
            // TODO: Replace with actual API call when backend is ready
            // const response = await axiosInstance.get<OrderDetailStatus>(`${this.apiUrl}/${id}`);
            // return response.data;
            
            // Using mock data for now
            const status = mockStatuses.find(s => s.id === id);
            if (!status) {
                throw new Error('Status not found');
            }
            return Promise.resolve(status);
        } catch (error) {
            console.error(`Error fetching order detail status with id ${id}:`, error);
            throw error;
        }
    }

    /**
     * Create a new order detail status
     */
    async createStatus(data: CreateOrderDetailStatusDto): Promise<OrderDetailStatus> {
        try {
            // TODO: Replace with actual API call when backend is ready
            // const response = await axiosInstance.post<OrderDetailStatus>(this.apiUrl, data);
            // return response.data;
            
            // Using mock data for now
            const newStatus: OrderDetailStatus = {
                ...data,
                id: (mockStatuses.length + 1).toString()
            };
            
            // If setting as default, unset all others
            if (data.isDefault) {
                mockStatuses = mockStatuses.map(s => ({ ...s, isDefault: false }));
            }
            
            mockStatuses.push(newStatus);
            return Promise.resolve(newStatus);
        } catch (error) {
            console.error('Error creating order detail status:', error);
            throw error;
        }
    }

    /**
     * Update an existing order detail status
     */
    async updateStatus(id: string, data: UpdateOrderDetailStatusDto | Partial<OrderDetailStatus>): Promise<OrderDetailStatus> {
        try {
            // TODO: Replace with actual API call when backend is ready
            // const response = await axiosInstance.put<OrderDetailStatus>(`${this.apiUrl}/${id}`, data);
            // return response.data;
            
            // Using mock data for now
            const index = mockStatuses.findIndex(s => s.id === id);
            if (index === -1) {
                throw new Error('Status not found');
            }
            
            // If setting as default, unset all others
            if (data.isDefault) {
                mockStatuses = mockStatuses.map(s => ({ ...s, isDefault: false }));
            }
            
            const updatedStatus = { ...mockStatuses[index], ...data };
            mockStatuses[index] = updatedStatus;
            return Promise.resolve(updatedStatus);
        } catch (error) {
            console.error(`Error updating order detail status with id ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete an order detail status
     */
    async deleteStatus(id: string): Promise<void> {
        try {
            // TODO: Replace with actual API call when backend is ready
            // await axiosInstance.delete(`${this.apiUrl}/${id}`);
            
            // Using mock data for now
            mockStatuses = mockStatuses.filter(s => s.id !== id);
            return Promise.resolve();
        } catch (error) {
            console.error(`Error deleting order detail status with id ${id}:`, error);
            throw error;
        }
    }

    /**
     * Toggle active status of an order detail status
     */
    async toggleActive(id: string): Promise<OrderDetailStatus> {
        try {
            const status = await this.getStatusById(id);
            return this.updateStatus(id, { ...status, isActive: !status.isActive });
        } catch (error) {
            console.error(`Error toggling active status for id ${id}:`, error);
            throw error;
        }
    }

    /**
     * Set a status as default (and unset all others)
     */
    async setAsDefault(id: string): Promise<OrderDetailStatus> {
        try {
            const status = await this.getStatusById(id);
            return this.updateStatus(id, { ...status, isDefault: true });
        } catch (error) {
            console.error(`Error setting status as default for id ${id}:`, error);
            throw error;
        }
    }
}

const orderDetailStatusService = new OrderDetailStatusService();
export default orderDetailStatusService;
