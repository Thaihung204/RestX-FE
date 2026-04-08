import { Modal, Select, Space, Tag, Typography } from "antd";
import type { DefaultOptionType } from "antd/es/select";

const { Text } = Typography;

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  note?: string;
  status: string;
  price?: number;
}

interface Order {
  id: string;
  reference: string;
  detailItems: OrderItem[];
  total: number;
  orderStatusId: number;
  tableSessions?: Array<{
    id?: string;
    tableId?: string;
    tableCode?: string;
  }>;
}

interface OrderStatus {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface OrderDetailsPopupProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  orderStatuses: OrderStatus[];
  statusOptions: DefaultOptionType[];
  isUpdatingDetailStatus: boolean;
  normalizeStatusValue: (status: string) => string;
  handleUpdateDetailStatus: (orderId: string, detailId: string, statusValue: string) => void;
  isMobile?: boolean;
  mode?: "light" | "dark";
  t?: (key: string, options?: any) => string;
}

export default function OrderDetailsPopup({
  order,
  isOpen,
  onClose,
  orderStatuses,
  statusOptions,
  isUpdatingDetailStatus,
  normalizeStatusValue,
  handleUpdateDetailStatus,
  isMobile = false,
  mode = "light",
  t,
}: OrderDetailsPopupProps) {
  if (!order) return null;

  const tableNamesStr = order.tableSessions?.map((s) => s.tableCode).filter(Boolean).join(" - ") || "";

  const currentStatus = orderStatuses?.find(
    (s) => Number(s.id) === order.orderStatusId,
  );
  const styleColor = currentStatus?.color || "#E5E5E5";
  const bgLight = `${styleColor}15`;
  const borderLight = `${styleColor}40`;
  const bgDark = `${styleColor}20`;
  const borderDark = `${styleColor}50`;

  const popupStyle = {
    bg: mode === "dark" ? bgDark : bgLight,
    border: mode === "dark" ? borderDark : borderLight,
  };

  return (
    <>
      <Modal
        rootClassName="order-details-popup-root"
        className="order-details-popup-modal"
        title={
        <Space size={12} align="center">
          <Text strong style={{ fontSize: 18 }}>
            {t?.("staff.orders.order.table")} {tableNamesStr}
          </Text>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      styles={{
        content: {
          backgroundColor: popupStyle.bg,
          border: `1px solid ${popupStyle.border}`,
          borderRadius: 12,
          padding: 0,
          overflow: "hidden",
          boxShadow:
            mode === "dark"
              ? "0 2px 8px rgba(0, 0, 0, 0.3)"
              : "0 2px 8px rgba(0, 0, 0, 0.08)",
        },
        header: {
          backgroundColor: popupStyle.bg,
          borderBottom: "none",
          padding: isMobile ? "16px 16px 8px" : "16px 24px 8px",
          marginBottom: 0,
        },
        body: {
          backgroundColor: popupStyle.bg,
          padding: isMobile ? "8px 16px 20px" : "8px 24px 24px",
        },
      } as any}
    >

      <div
        style={{
          marginBottom: isMobile ? 12 : 16,
          background: "transparent",
        }}>
        {order.detailItems.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {order.detailItems.map((item) => {
              const normalizedValue = normalizeStatusValue(item.status);


              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: isMobile ? "8px 0" : "10px 0",
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
                  
                  <Space size={16} align="center" style={{ marginLeft: 8 }}>
                    <div style={{ textAlign: "right" }}>
                      <Text
                        strong
                        style={{
                          display: "block",
                          fontSize: isMobile ? 13 : 14,
                          color: mode === "dark" ? "rgba(255, 255, 255, 0.85)" : "#333", // override global primary text
                        }}>
                        {((item.price || 0) * item.quantity).toLocaleString("vi-VN")}đ
                      </Text>
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
                      <Select
                        value={normalizedValue}
                        size="small"
                        onChange={(value) => handleUpdateDetailStatus(order.id, item.id, String(value))}
                        disabled={isUpdatingDetailStatus}
                        options={statusOptions}
                        style={{ minWidth: isMobile ? 100 : 120 }}
                      />
                    </Space>
                  </Space>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 12,
          borderTop:
            mode === "dark"
              ? "1px solid rgba(255, 255, 255, 0.08)"
              : "1px solid #EDEDED",
        }}>
        <Text strong style={{ fontSize: isMobile ? 15 : 16 }}>
          {t?.("staff.orders.payment.modal.total_label")}
        </Text>
        <Text
          strong
          style={{ color: "var(--primary)", fontSize: isMobile ? 16 : 18 }}>
          {order.total.toLocaleString("vi-VN")}đ
        </Text>
      </div>
    </Modal>

      <style jsx global>{`
        .order-details-popup-root .ant-modal-container {
          padding: 0 !important;
        }

        .order-details-popup-root .ant-modal {
          background: transparent !important;
        }

        .order-details-popup-root .ant-modal-section,
        .order-details-popup-root .ant-modal-content,
        .order-details-popup-root .ant-modal-header,
        .order-details-popup-root .ant-modal-body,
        .order-details-popup-root .ant-modal-footer {
          background: ${popupStyle.bg} !important;
        }

        .order-details-popup-root .ant-modal-content {
          border: 1px solid ${popupStyle.border} !important;
          border-radius: 12px !important;
          box-shadow: ${mode === "dark"
            ? "0 2px 8px rgba(0, 0, 0, 0.3)"
            : "0 2px 8px rgba(0, 0, 0, 0.08)"} !important;
        }

        .order-details-popup-root .ant-modal-header {
          border-bottom: none !important;
          border-radius: 12px 12px 0 0 !important;
        }

        .order-details-popup-root .ant-modal-body {
          border-radius: 0 0 12px 12px !important;
        }
      `}</style>
    </>
  );
}
