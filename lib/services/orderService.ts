import axiosInstance from "./axiosInstance";

// Backend DTOs (mirrors RestX.BLL.DataTranferObjects.Orders)

export interface OrderDetailRequestDto {
  dishId: string;
  quantity: number;
  note?: string;
}

export interface OrderRequestDto {
  tableId: string;
  customerId: string;
  reservationId?: string | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  serviceCharge?: number | null;
  tableIds?: string[];
  orderDetails: OrderDetailRequestDto[];
}

export interface OrderDetailDto {
  id?: string;
  dishId: string;
  quantity: number;
  note?: string | null;
  status?: string | null;
}

export interface OrderDto {
  id?: string;
  reference?: string | null;
  tableId: string;
  customerId: string;
  reservationId?: string | null;
  orderStatusId: number;
  paymentStatusId: number;
  subTotal?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  serviceCharge?: number | null;
  totalAmount: number;
  completedAt?: string | null;
  cancelledAt?: string | null;
  handledBy?: string | null;
  tableIds?: string[];
  orderDetails: OrderDetailDto[];
}

class OrderService {
  async createOrder(payload: OrderRequestDto): Promise<string> {
    const response = await axiosInstance.post<string>("/orders", payload);
    // Backend returns Guid in body, axios will parse as string
    return response.data as unknown as string;
  }

  async getAllOrders(): Promise<OrderDto[]> {
    const response = await axiosInstance.get<OrderDto[]>("/orders");
    return response.data;
  }

  async getOrderById(id: string): Promise<OrderDto> {
    const response = await axiosInstance.get<OrderDto>(`/orders/${id}`);
    return response.data;
  }
}

const orderService = new OrderService();

export default orderService;

