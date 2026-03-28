import { Card, Typography } from "antd";
import CardOrder, { Order, OrderStatusId, OrderStatusUi } from "./CardOrder";

const { Text } = Typography;

interface CardTableProps {
  tableCode: string;
  tableOrders: Order[];
  mode: "light" | "dark";
  isMobile: boolean;
  isUpdatingOrderStatus: boolean;
  orderStatusOptions: { value: number; label: string; className: string }[];
  orderStatusStyleMap: Record<OrderStatusUi, { bg: string; border: string }>;
  tableLabel: string;
  onOpenDetail: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, statusId: OrderStatusId) => void;
}

export default function CardTable({
  tableCode,
  tableOrders,
  mode,
  isMobile,
  isUpdatingOrderStatus,
  orderStatusOptions,
  orderStatusStyleMap,
  tableLabel,
  onOpenDetail,
  onUpdateOrderStatus,
}: CardTableProps) {
  return (
    <Card
      style={{
        marginBottom: isMobile ? 16 : 20,
        borderRadius: 12,
        border: mode === "dark" ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #E8E8E8",
        background: mode === "dark" ? "rgba(255, 255, 255, 0.02)" : "#FAFAFA",
        boxShadow: mode === "dark" ? "0 2px 6px rgba(0, 0, 0, 0.25)" : "0 2px 6px rgba(0, 0, 0, 0.04)",
      }}
      styles={{ body: { padding: isMobile ? 12 : 16 } }}>
      <Text
        strong
        style={{
          display: "block",
          marginBottom: isMobile ? 10 : 12,
          fontSize: isMobile ? 14 : 16,
          color: "var(--primary)",
        }}>
        {tableLabel} {tableCode}
      </Text>
      {tableOrders.map((order) => (
        <div key={order.id}>
          <CardOrder
            order={order}
            mode={mode}
            isMobile={isMobile}
            isUpdatingOrderStatus={isUpdatingOrderStatus}
            orderStatusOptions={orderStatusOptions}
            orderStatusStyleMap={orderStatusStyleMap}
            onOpenDetail={onOpenDetail}
            onUpdateOrderStatus={onUpdateOrderStatus}
          />
        </div>
      ))}
    </Card>
  );
}
