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
  private get apiBase() {
    return `/statuses/order`;
  }

  async getAllStatuses(): Promise<OrderStatus[]> {
    const response = await axiosInstance.get<BackendResponse<BackendStatusValue[]>>(this.apiBase);
    const data = response.data?.data ?? [];
    return data.map(mapFromBackend);
  }

  async getStatusById(id: string): Promise<OrderStatus> {
    const response = await axiosInstance.get<BackendResponse<BackendStatusValue>>(`${this.apiBase}/${id}`);
    return mapFromBackend(response.data.data);
  }

  async createStatus(data: CreateOrderStatusDto): Promise<OrderStatus> {
    const payload = {
      code: data.code,
      name: data.name,
      colorCode: data.color,
      isDefault: data.isDefault,
    };
    const response = await axiosInstance.post<BackendResponse<BackendStatusValue>>(this.apiBase, payload);
    return mapFromBackend(response.data.data);
  }

  async updateStatus(id: string, data: UpdateOrderStatusDto | Partial<OrderStatus>): Promise<OrderStatus> {
    const payload = {
      code: data.code,
      name: data.name,
      colorCode: (data as OrderStatus).color ?? (data as UpdateOrderStatusDto).color,
      isDefault: data.isDefault,
    };
    const response = await axiosInstance.put<BackendResponse<BackendStatusValue>>(`${this.apiBase}/${id}`, payload);
    return mapFromBackend(response.data.data);
  }

  async deleteStatus(id: string): Promise<void> {
    await axiosInstance.delete(`${this.apiBase}/${id}`);
  }

  async setAsDefault(status: OrderStatus): Promise<OrderStatus> {
    return this.updateStatus(status.id, { ...status, isDefault: true });
  }
}

const orderStatusService = new OrderStatusService();
export default orderStatusService;
