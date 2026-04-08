import { DollarOutlined, PlusOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Button, Card, Select, Space, Tag, Typography } from "antd";
import type { DefaultOptionType } from "antd/es/select";

const { Text } = Typography;

type OrderItemStatus = string;

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  note?: string;
  status: OrderItemStatus;
}

interface OrderStatus {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface Order {
  id: string;
  reference: string;
  detailItems: OrderItem[];
  total: number;
  raw?: {
    paymentStatusId?: number;
  };
  orderStatusId: number;
  tableSessions?: Array<{
    id?: string;
    tableId?: string;
    tableCode?: string;
  }>;
}

interface CardOrderProps {
  order: Order;
  isMobile: boolean;
  mode: "light" | "dark";
  statusOptions: DefaultOptionType[];
  orderStatuses: OrderStatus[];
  orderStatusOptions: DefaultOptionType[];
  isUpdatingOrderStatus: boolean;
  isUpdatingDetailStatus: boolean;
  normalizeStatusValue: (status: OrderItemStatus) => string;
  handleUpdateOrderStatus: (orderId: string, statusId: number) => void;
  handleUpdateDetailStatus: (
    orderId: string,
    detailId: string,
    statusValue: string,
  ) => void;
  openPaymentModal: (order: Order) => void;
  onOpenAddItemModal: (orderId: string) => void;
  onViewDetails?: (orderId: string) => void;
  t: (key: string) => string;
}

export default function CardOrder({
  order,
  isMobile,
  mode,
  statusOptions,
  orderStatuses,
  orderStatusOptions,
  isUpdatingOrderStatus,
  isUpdatingDetailStatus,
  normalizeStatusValue,
  handleUpdateOrderStatus,
  handleUpdateDetailStatus,
  openPaymentModal,
  onOpenAddItemModal,
  onViewDetails,
  t,
}: CardOrderProps) {
  const currentStatus = orderStatuses?.find(s => Number(s.id) === order.orderStatusId);
  const styleColor = currentStatus?.color || "#E5E5E5";
  const bgLight = `${styleColor}15`;
  const borderLight = `${styleColor}40`;
  const bgDark = `${styleColor}20`;
  const borderDark = `${styleColor}50`;

  const orderStyle = {
    bg: mode === "dark" ? bgDark : bgLight,
    border: mode === "dark" ? borderDark : borderLight,
  };

  return (
    <Card
      onClick={() => onViewDetails?.(order.id)}
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
        cursor: onViewDetails ? "pointer" : "default",
      }}
      styles={{ body: { padding: isMobile ? 14 : 20 } }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 8,
        }}>
        <div style={{ flex: 1, minWidth: isMobile ? "100%" : "auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 10 : 12,
              marginBottom: isMobile ? 10 : 12,
            }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  flexWrap: "wrap",
                }}>
                <Text
                  strong
                  style={{
                    fontSize: isMobile ? 15 : 17,
                    fontWeight: 500,
                  }}>
                  {t("staff.orders.order.table")} {order.tableSessions?.map((s) => s.tableCode).join(" - ")}
                </Text>
                <div
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}>
                  <Select
                    value={order.orderStatusId}
                    size="small"
                    style={{ minWidth: 130 }}
                    className="order-status-select"
                    onChange={(value) =>
                      handleUpdateOrderStatus(order.id, Number(value))
                    }
                    disabled={isUpdatingOrderStatus}
                    options={orderStatusOptions}
                  />
                </div>
              </div>
              <Text
                style={{
                  fontSize: isMobile ? 13 : 14,
                  color:
                    mode === "dark"
                      ? "rgba(255, 255, 255, 0.5)"
                      : "rgba(0, 0, 0, 0.5)",
                  fontWeight: 400,
                }}>
                {order.reference}
              </Text>
            </div>
          </div>

          <div style={{ marginBottom: isMobile ? 12 : 16 }}>
            {order.detailItems.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {order.detailItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: isMobile ? "6px 0" : "8px 0",
                      borderBottom:
                        mode === "dark"
                          ? "1px dashed rgba(255, 255, 255, 0.08)"
                          : "1px dashed #EDEDED",
                    }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          fontSize: isMobile ? 13 : 14,
                          fontWeight: 500,
                          display: "block",
                        }}>
                        {item.name}
                      </Text>
                      {item.note && (
                        <Text
                          style={{
                            fontSize: isMobile ? 11 : 12,
                            color:
                              mode === "dark"
                                ? "rgba(255, 255, 255, 0.45)"
                                : "rgba(0, 0, 0, 0.45)",
                            display: "block",
                          }}>
                          {item.note}
                        </Text>
                      )}
                    </div>
                    <Space size={8} style={{ alignItems: "center" }}>
                      <Tag
                        style={{
                          margin: 0,
                          borderRadius: 8,
                          fontSize: isMobile ? 12 : 13,
                        }}>
                        x{item.quantity}
                      </Tag>
                      <div
                        onClick={(event) => event.stopPropagation()}
                        onMouseDown={(event) => event.stopPropagation()}>
                        <Select
                          value={normalizeStatusValue(item.status)}
                          size="small"
                          style={{ minWidth: isMobile ? 110 : 130 }}
                          onChange={(value) =>
                            handleUpdateDetailStatus(order.id, item.id, String(value))
                          }
                          disabled={isUpdatingDetailStatus}
                          options={statusOptions}
                        />
                      </div>
                    </Space>
                  </div>
                ))}
              </div>
            ) : (
              <Text
                style={{
                  fontSize: isMobile ? 12 : 13,
                  color:
                    mode === "dark"
                      ? "rgba(255, 255, 255, 0.5)"
                      : "rgba(0, 0, 0, 0.45)",
                }}>
                {t("staff.orders.empty")}
              </Text>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: isMobile ? 8 : 16,
              flexWrap: "wrap",
            }}>
            <Text
              strong
              style={{ color: "var(--primary)", fontSize: isMobile ? 15 : 16 }}>
              {order.total.toLocaleString("vi-VN")}đ
            </Text>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {order.raw?.paymentStatusId !== 1 && (
                <Button
                  icon={<DollarOutlined />}
                  size="small"
                  type="primary"
                  onClick={(e) => { e.stopPropagation(); openPaymentModal(order); }}
                  style={{
                    borderRadius: 6,
                    minWidth: isMobile ? 110 : 130,
                    height: 24,
                    padding: "0 8px",
                  }}>
                  {!isMobile ? (t("staff.orders.payment.btn")) : null}
                </Button>
              )}
              <Button
                icon={<PlusOutlined />}
                size="small"
                onClick={(e) => { e.stopPropagation(); onOpenAddItemModal(order.id); }}
                style={{
                  borderRadius: 6,
                  minWidth: isMobile ? 110 : 130,
                  height: 24,
                  padding: "0 8px",
                }}>
                {t("staff.orders.modal.add_item")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
