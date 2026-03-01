import axiosInstance from './axiosInstance';

// Backend DTO shape from /api/statuses/ORDER-DETAIL
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

const TYPE_CODE = 'ORDER-DETAIL';

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
        return `/statuses/${TYPE_CODE}`;
    }

    /**
     * Get all order detail statuses
     * GET /api/statuses/ORDER-DETAIL
     */
    async getAllStatuses(): Promise<OrderDetailStatus[]> {
        const response = await axiosInstance.get<BackendResponse<BackendStatusValue[]>>(this.apiBase);
        const data = response.data?.data ?? [];
        return data.map(mapFromBackend);
    }

    /**
     * Get a single order detail status by ID
     * GET /api/statuses/ORDER-DETAIL/{id}
     */
    async getStatusById(id: string): Promise<OrderDetailStatus> {
        const response = await axiosInstance.get<BackendResponse<BackendStatusValue>>(`${this.apiBase}/${id}`);
        return mapFromBackend(response.data.data);
    }

    /**
     * Create a new order detail status
     * POST /api/statuses/ORDER-DETAIL
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
     * Update an existing order detail status
     * PUT /api/statuses/ORDER-DETAIL/{id}
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
     * Delete an order detail status
     * DELETE /api/statuses/ORDER-DETAIL/{id}
     */
    async deleteStatus(id: string): Promise<void> {
        await axiosInstance.delete(`${this.apiBase}/${id}`);
    }

    /**
     * Set a status as default (and unset all others via backend)
     * PUT /api/statuses/ORDER-DETAIL/{id}  with isDefault=true
     */
    async setAsDefault(id: string): Promise<OrderDetailStatus> {
        const current = await this.getStatusById(id);
        return this.updateStatus(id, { ...current, isDefault: true });
    }
}

const orderDetailStatusService = new OrderDetailStatusService();
export default orderDetailStatusService;
