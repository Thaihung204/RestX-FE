import { MOCK_ORDER_STATUSES } from "@/lib/constants/orderStatuses";

export interface OrderStatus {
  id: string;
  name: string;
  code: string;
  color: string;
  isDefault: boolean;
}

const mapMockStatus = (status: (typeof MOCK_ORDER_STATUSES)[number]): OrderStatus => ({
  id: status.id,
  name: status.name,
  code: status.code,
  color: status.colorCode,
  isDefault: status.isDefault,
});

class OrderStatusService {
  async getAllStatuses(): Promise<OrderStatus[]> {
    return MOCK_ORDER_STATUSES.map(mapMockStatus);
  }
}

const orderStatusService = new OrderStatusService();
export default orderStatusService;
