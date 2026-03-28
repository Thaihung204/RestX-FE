import { Card, Select, Typography } from "antd";

const { Text } = Typography;

export type OrderStatusId = 0 | 1 | 2 | 3 | 4;
export type OrderStatusUi = "pending" | "confirmed" | "serving" | "completed" | "cancelled";

export interface OrderItem {
  id: string;
  dishId: string;
  name: string;
  quantity: number;
  price: number;
  note?: string;
  status: string;
}

export interface Order {
  id: string;
  reference: string;
  tableId: string;
  tableName: string;
  items: OrderItem[];
  detailItems: OrderItem[];
  createdAt: string;
  total: number;
  notes?: string;
  orderStatusId: OrderStatusId;
  orderStatus: OrderStatusUi;
  raw?: any;
}

interface CardOrderProps {
  order: Order;
  mode: "light" | "dark";
  isMobile: boolean;
  isUpdatingOrderStatus: boolean;
  orderStatusOptions: { value: number; label: string; className: string }[];
  orderStatusStyleMap: Record<OrderStatusUi, { bg: string; border: string }>;
  onOpenDetail: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, statusId: OrderStatusId) => void;
}

export default function CardOrder({
  order,
  mode,
  isMobile,
  isUpdatingOrderStatus,
  orderStatusOptions,
  orderStatusStyleMap,
  onOpenDetail,
  onUpdateOrderStatus,
}: CardOrderProps) {
  const orderStyle = orderStatusStyleMap[order.orderStatus];

  return (
    <Card
      hoverable
      onClick={() => onOpenDetail(order)}
      style={{
        borderRadius: 12,
        border: `1px solid ${orderStyle.border}`,
        marginBottom: isMobile ? 12 : 16,
        overflow: "hidden",
        background: orderStyle.bg,
        boxShadow:
          mode === "dark"
            ? "0 2px 8px rgba(0, 0, 0, 0.3)"
            : "0 2px 8px rgba(0, 0, 0, 0.08)",
        transition: "all 0.3s ease",
      }}
      styles={{ body: { padding: isMobile ? 14 : 20 } }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div style={{ flex: 1, minWidth: isMobile ? "100%" : "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 12, marginBottom: isMobile ? 10 : 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <Text strong style={{ fontSize: isMobile ? 15 : 17, fontWeight: 500 }}>
                  {order.reference}
                </Text>
                <div onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
                  <Select
                    value={order.orderStatusId}
                    size="small"
                    style={{ minWidth: 130 }}
                    className="order-status-select"
                    onChange={(value) => onUpdateOrderStatus(order.id, value as OrderStatusId)}
                    disabled={isUpdatingOrderStatus}
                    options={orderStatusOptions}
                  />
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </Card>
  );
}
