import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Card, Select, Space, Tag, Typography } from "antd";
import type { DefaultOptionType } from "antd/es/select";
import { useState } from "react";

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
    paymentStatus?: number;
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
  onViewDetails,
  t,
}: CardOrderProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const textSizes = {
    table: isMobile ? 16 : 18,
    reference: isMobile ? 14 : 15,
    detailHeader: isMobile ? 14 : 15,
    itemName: isMobile ? 14 : 15,
    itemNote: isMobile ? 12 : 13,
    quantity: isMobile ? 13 : 14,
    total: isMobile ? 16 : 17 ,
  };
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
      styles={{ body: { padding: isMobile ? 12 : 16 } }}>
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
                    fontSize: textSizes.table,
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}>
                  {t("staff.orders.order.table")} {order.tableSessions?.map((s) => s.tableCode).join(" - ")}
                </Text>
                <div
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {Number(order.raw?.paymentStatus) === 1 && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      margin: 0,
                      fontWeight: 500,
                      fontSize: isMobile ? 11 : 12,
                      lineHeight: '22px',
                      padding: '0 7px',
                      border: '1.5px solid #52c41a',
                      background: 'transparent',
                      color: mode === 'dark' ? '#fff' : '#000',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                    }}>
                      {t("staff.orders.order.paid")}
                    </span>
                  )}
                  <Select
                    value={order.orderStatusId}
                    size="small"
                    style={{ minWidth: isMobile ? 102 : 116, fontSize: isMobile ? 11 : 12 }}
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
                  fontSize: textSizes.reference,
                  color:
                    mode === "dark"
                      ? "rgba(255, 255, 255, 0.5)"
                      : "rgba(0, 0, 0, 0.5)",
                  fontWeight: 400,
                  lineHeight: 1.3,
                }}>
                {order.reference}
              </Text>
            </div>
          </div>

          <div style={{ marginBottom: isMobile ? 12 : 16 }}>
            {order.detailItems.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsExpanded((prev) => !prev);
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    cursor: "pointer",
                    padding: isMobile ? "8px 0" : "10px 0",
                    borderBottom:
                      mode === "dark"
                        ? "1px dashed rgba(255, 255, 255, 0.12)"
                        : "1px dashed #D9D9D9",
                  }}>
                  <Text
                    strong
                    style={{
                      fontSize: textSizes.detailHeader,
                    }}>
                    {t("staff.orders.modal.order_detail")}
                  </Text>
                  <Button
                    type="text"
                    size="small"
                    icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                    style={{ paddingInline: 4, fontSize: isMobile ? 11 : 12, height: isMobile ? 24 : 26 }}>
                    {isExpanded ? t("staff.orders.actions.collapse") : t("staff.orders.actions.expand")}
                  </Button>
                </div>

                {isExpanded &&
                  order.detailItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={(event) => event.stopPropagation()}
                      onMouseDown={(event) => event.stopPropagation()}
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
                      <div style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                        <Text
                          style={{
                            fontSize: textSizes.itemName,
                            fontWeight: 500,
                            display: "block",
                            lineHeight: 1.3,
                          }}>
                          {item.name}
                        </Text>
                      </div>
                      <Space size={isMobile ? 6 : 8} style={{ alignItems: "center" }}>
                        <Tag
                          style={{
                            margin: 0,
                            borderRadius: 8,
                            fontSize: textSizes.quantity,
                            lineHeight: 1.2,
                            paddingInline: isMobile ? 6 : 8,
                          }}>
                          x{item.quantity}
                        </Tag>
                        <div
                          onClick={(event) => event.stopPropagation()}
                          onMouseDown={(event) => event.stopPropagation()}>
                          <Select
                            value={normalizeStatusValue(item.status)}
                            size="small"
                            style={{ minWidth: isMobile ? 82 : 98, fontSize: isMobile ? 11 : 12 }}
                            className="order-detail-status-select"
                            onChange={(value) =>
                              handleUpdateDetailStatus(order.id, item.id, String(value))
                            }
                            disabled={isUpdatingDetailStatus}
                            options={statusOptions}
                            popupMatchSelectWidth={false}
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
            {/* <Text
              strong
              style={{ color: "var(--primary)", fontSize: textSizes.total }}>
              {order.total.toLocaleString("vi-VN")}đ
            </Text> */}
          </div>
        </div>
      </div>
    </Card>
  );
}
