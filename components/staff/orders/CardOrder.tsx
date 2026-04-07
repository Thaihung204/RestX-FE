import { ClockCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import { Card, Select, Space, Typography } from "antd";

const { Text } = Typography;

export type OrderStatusId = 0 | 1 | 2 | 3;
export type OrderStatusUi = "pending" | "served" | "completed" | "cancelled";

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
        borderRadius: 16,
        border: `1px solid ${orderStyle.border}`,
        overflow: "hidden",
        background: orderStyle.bg,
        boxShadow: mode === "dark" ? "0 4px 12px rgba(0, 0, 0, 0.2)" : "0 4px 12px rgba(0, 0, 0, 0.05)",
        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
      }}
      styles={{ body: { padding: isMobile ? 14 : 16 } }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <Space align="start">
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: mode === "dark" ? "none" : "0 2px 6px rgba(0,0,0,0.04)"
          }}>
             <FileTextOutlined style={{ fontSize: 20, color: "var(--primary)" }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 16, display: 'block', lineHeight: 1.2 }}>
              {order.reference}
            </Text>
            <Space size={4} style={{ color: mode === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", fontSize: 13, marginTop: 4 }}>
              <ClockCircleOutlined />
              <Text type="secondary">{order.createdAt || "N/A"}</Text>
            </Space>
          </div>
        </Space>
        
        <div onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
          <Select
            value={order.orderStatusId}
            size="middle"
            style={{ width: 140 }}
            className="order-status-select"
            onChange={(value) => onUpdateOrderStatus(order.id, value as OrderStatusId)}
            disabled={isUpdatingOrderStatus}
            options={orderStatusOptions}
            onClick={(e) => e.stopPropagation()}
            popupMatchSelectWidth={false}
          />
        </div>
      </div>
    </Card>
  );
}
