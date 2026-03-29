import { Card, Typography, Space, Badge } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
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
        borderRadius: 16,
        border: mode === "dark" ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #F0F0F0",
        background: mode === "dark" ? "rgba(255, 255, 255, 0.02)" : "#FFFFFF",
        boxShadow: mode === "dark" ? "0 4px 12px rgba(0, 0, 0, 0.2)" : "0 4px 12px rgba(0, 0, 0, 0.03)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      styles={{ body: { padding: isMobile ? 16 : 20, flex: 1, display: "flex", flexDirection: "column" } }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Space size={12}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "var(--primary-10, rgba(255,107,59,0.1))",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <AppstoreOutlined style={{ color: "var(--primary, #FF6B3B)", fontSize: 18 }} />
          </div>
          <Text
            strong
            style={{
              fontSize: 18,
              color: mode === "dark" ? "#FFF" : "#262626",
            }}>
            {tableLabel} {tableCode}
          </Text>
        </Space>
        {tableOrders.length > 0 && (
          <Badge 
            count={tableOrders.length} 
            showZero 
            style={{ backgroundColor: "var(--primary, #FF6B3B)", boxShadow: "none" }} 
          />
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {tableOrders.map((order) => (
          <CardOrder
            key={order.id}
            order={order}
            mode={mode}
            isMobile={isMobile}
            isUpdatingOrderStatus={isUpdatingOrderStatus}
            orderStatusOptions={orderStatusOptions}
            orderStatusStyleMap={orderStatusStyleMap}
            onOpenDetail={onOpenDetail}
            onUpdateOrderStatus={onUpdateOrderStatus}
          />
        ))}
        {tableOrders.length === 0 && (
          <div style={{ 
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", 
            minHeight: 120, border: mode === "dark" ? "1px dashed rgba(255,255,255,0.1)" : "1px dashed #E5E5E5", borderRadius: 12,
            background: mode === "dark" ? "rgba(255,255,255,0.01)" : "#FAFAFA"
          }}>
            <Text type="secondary" style={{ fontSize: 14 }}>Chưa có đơn hàng</Text>
          </div>
        )}
      </div>
    </Card>
  );
}
