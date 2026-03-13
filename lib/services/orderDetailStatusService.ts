import axiosInstance from './axiosInstance';

interface BackendStatusValue {
    id: number;
    code: string;
    name: string;
    colorCode: string;
    isDefault: boolean;
}

interface BackendResponse<T> {
    success: boolean;
    data: T;
}

export interface OrderDetailStatus {
    id: string;
    name: string;
    code: string;
    color: string;
    isDefault: boolean;
}

export interface CreateOrderDetailStatusDto {
    name: string;
    code: string;
    color: string;
    isDefault: boolean;
}

export interface UpdateOrderDetailStatusDto extends CreateOrderDetailStatusDto {
    id: string;
}


// Map backend -> frontend
function mapFromBackend(sv: BackendStatusValue): OrderDetailStatus {
    return {
        id: String(sv.id),
        name: sv.name,
        code: sv.code,
        color: sv.colorCode,
        isDefault: sv.isDefault,
    };
}

class OrderDetailStatusService {
    private get apiBase() {
        return `/statuses/order-detail`;
    }

    /**
     * GET /api/statuses/order-detail
     */
    async getAllStatuses(): Promise<OrderDetailStatus[]> {
        const response = await axiosInstance.get<BackendResponse<BackendStatusValue[]>>(this.apiBase);
        const data = response.data?.data ?? [];
        return data.map(mapFromBackend);
    }

    /**
     * GET /api/statuses/order-detail/{id}
     */
    async getStatusById(id: string): Promise<OrderDetailStatus> {
        const response = await axiosInstance.get<BackendResponse<BackendStatusValue>>(`${this.apiBase}/${id}`);
        return mapFromBackend(response.data.data);
    }

    /**
     * POST /api/statuses/order-detail
     */
    async createStatus(data: CreateOrderDetailStatusDto): Promise<OrderDetailStatus> {
        const payload = {
            code: data.code,
            name: data.name,
            colorCode: data.color,
            isDefault: data.isDefault,
        };
        const response = await axiosInstance.post<BackendResponse<BackendStatusValue>>(this.apiBase, payload);
        return mapFromBackend(response.data.data);
    }

    /**
     * PUT /api/statuses/order-detail/{id}
     */
    async updateStatus(id: string, data: UpdateOrderDetailStatusDto | Partial<OrderDetailStatus>): Promise<OrderDetailStatus> {
        const payload = {
            code: data.code,
            name: data.name,
            colorCode: (data as OrderDetailStatus).color ?? (data as UpdateOrderDetailStatusDto).color,
            isDefault: data.isDefault,
        };
        const response = await axiosInstance.put<BackendResponse<BackendStatusValue>>(`${this.apiBase}/${id}`, payload);
        return mapFromBackend(response.data.data);
    }

    /**
     * DELETE /api/statuses/order-detail/{id}
     */
    async deleteStatus(id: string): Promise<void> {
        await axiosInstance.delete(`${this.apiBase}/${id}`);
    }

    /**
     * PUT /api/statuses/order-detail/{id} with isDefault=true
     */
    async setAsDefault(status: OrderDetailStatus): Promise<OrderDetailStatus> {
        return this.updateStatus(status.id, { ...status, isDefault: true });
    }
}

const orderDetailStatusService = new OrderDetailStatusService();
export default orderDetailStatusService;
