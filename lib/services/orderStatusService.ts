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

interface FormListOption {
    id?: string;
    name?: string;
    Id?: string;
    Name?: string;
}

export interface OrderStatus {
    id: string;
    name: string;
    code: string;
    color: string;
    isDefault: boolean;
}

export interface CreateOrderStatusDto {
    name: string;
    code: string;
    color: string;
    isDefault: boolean;
}

export interface UpdateOrderStatusDto extends CreateOrderStatusDto {
    id: string;
}

function mapFromBackend(sv: BackendStatusValue): OrderStatus {
    return {
        id: String(sv.id),
        name: sv.name,
        code: sv.code,
        color: sv.colorCode,
        isDefault: sv.isDefault,
    };
}

class OrderStatusService {
    private get listApiBase() {
        return `/forms/get-lists/order-statuses`;
    }

    private get manageApiBase() {
        return `/statuses/order`;
    }

    private mapFromFormList(option: FormListOption): OrderStatus {
        const rawId = option.id ?? option.Id ?? '0';
        const rawName = option.name ?? option.Name ?? '';
        const normalizedCode = rawName.toUpperCase().replace(/\s+/g, '_');

        const colorByCode: Record<string, string> = {
            OPEN: '#1890ff',
            COMPLETED: '#52c41a',
            CANCELLED: '#ff4d4f',
        };

        return {
            id: String(rawId),
            name: rawName,
            code: normalizedCode,
            color: colorByCode[normalizedCode] || '#8c8c8c',
            isDefault: rawId === '0' || normalizedCode === 'OPEN',
        };
    }

    /**
     * GET /api/forms/get-lists/order-statuses
     */
    async getAllStatuses(): Promise<OrderStatus[]> {
        const response = await axiosInstance.get<BackendResponse<FormListOption[]>>(this.listApiBase);
        const data = response.data?.data ?? [];
        return data.map((item) => this.mapFromFormList(item));
    }

    /**
     * GET /api/statuses/order/{id}
     */
    async getStatusById(id: string): Promise<OrderStatus> {
        const response = await axiosInstance.get<BackendResponse<BackendStatusValue>>(`${this.manageApiBase}/${id}`);
        return mapFromBackend(response.data.data);
    }

    /**
     * POST /api/statuses/order
     */
    async createStatus(data: CreateOrderStatusDto): Promise<OrderStatus> {
        const payload = {
            code: data.code,
            name: data.name,
            colorCode: data.color,
            isDefault: data.isDefault,
        };
        const response = await axiosInstance.post<BackendResponse<BackendStatusValue>>(this.manageApiBase, payload);
        return mapFromBackend(response.data.data);
    }

    /**
     * PUT /api/statuses/order/{id}
     */
    async updateStatus(id: string, data: UpdateOrderStatusDto | Partial<OrderStatus>): Promise<OrderStatus> {
        const payload = {
            code: data.code,
            name: data.name,
            colorCode: (data as OrderStatus).color ?? (data as UpdateOrderStatusDto).color,
            isDefault: data.isDefault,
        };
        const response = await axiosInstance.put<BackendResponse<BackendStatusValue>>(`${this.manageApiBase}/${id}`, payload);
        return mapFromBackend(response.data.data);
    }

    /**
     * DELETE /api/statuses/order/{id}
     */
    async deleteStatus(id: string): Promise<void> {
        await axiosInstance.delete(`${this.manageApiBase}/${id}`);
    }

    /**
     * PUT /api/statuses/order/{id} with isDefault=true
     */
    async setAsDefault(status: OrderStatus): Promise<OrderStatus> {
        return this.updateStatus(status.id, { ...status, isDefault: true });
    }
}

const orderStatusService = new OrderStatusService();
export default orderStatusService;
