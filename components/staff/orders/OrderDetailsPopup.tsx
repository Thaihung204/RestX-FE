import { formatVND } from "@/lib/utils/currency";
import { DollarOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Modal, Select, Space, Tag, Typography } from "antd";
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
  raw?: {
    paymentStatusId?: number;
    paymentStatus?: number;
  };
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
  openPaymentModal: (order: Order) => void;
  onOpenAddItemModal: (orderId: string) => void;
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
  openPaymentModal,
  onOpenAddItemModal,
  isMobile = false,
  mode = "light",
  t,
}: OrderDetailsPopupProps) {
  if (!order) return null;

  const textSizes = {
    title: isMobile ? 17 : 19,
    itemName: isMobile ? 14 : 15,
    itemNote: isMobile ? 12 : 13,
    itemPrice: isMobile ? 14 : 15,
    quantity: isMobile ? 13 : 14,
    totalLabel: isMobile ? 15 : 16,
    totalValue: isMobile ? 16 : 18,
  };

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
  const isPaid = Number(order.raw?.paymentStatusId ?? order.raw?.paymentStatus ?? 0) === 1;

  return (
    <>
      <Modal
        rootClassName="order-details-popup-root"
        className="order-details-popup-modal"
        title={
        <Space size={12} align="center">
          <Text strong style={{ fontSize: textSizes.title, lineHeight: 1.3 }}>
            {t?.("staff.orders.order.table")} {tableNamesStr}
          </Text>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={isMobile ? "92vw" : 600}
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
          padding: isMobile ? "14px 14px 8px" : "16px 20px 8px",
          marginBottom: 0,
        },
        body: {
          backgroundColor: popupStyle.bg,
          padding: isMobile ? "8px 14px 16px" : "8px 20px 20px",
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
                        fontSize: textSizes.itemName,
                        fontWeight: 500,
                        display: "block",
                        lineHeight: 1.3,
                      }}>
                      {item.name}
                    </Text>
                  </div>
                  
                  <Space size={isMobile ? 8 : 12} align="center" style={{ marginLeft: 6 }}>
                    <div style={{ textAlign: "right" }}>
                      <Text
                        strong
                        style={{
                          display: "block",
                          fontSize: textSizes.itemPrice,
                          color: mode === "dark" ? "rgba(255, 255, 255, 0.85)" : "#333",
                          lineHeight: 1.3,
                        }}>
                        {formatVND((item.price || 0) * item.quantity)}
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
                      <Select
                        value={normalizedValue}
                        size="small"
                        onChange={(value) => handleUpdateDetailStatus(order.id, item.id, String(value))}
                        disabled={isUpdatingDetailStatus || normalizedValue === normalizeStatusValue("cancelled")}
                        options={statusOptions}
                        style={{ minWidth: isMobile ? 82 : 98, fontSize: isMobile ? 11 : 12 }}
                        className="order-detail-status-select"
                        popupMatchSelectWidth={false}
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
        <Text strong style={{ fontSize: textSizes.totalLabel }}>
          {t?.("staff.orders.payment.modal.total_label")}
        </Text>
        <Text
          strong
          style={{ color: "var(--primary)", fontSize: textSizes.totalValue }}>
          {formatVND(order.total)}
        </Text>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 8,
          flexWrap: "wrap",
          marginTop: isMobile ? 12 : 14,
        }}>
        {!isPaid && (
          <Button
            icon={<DollarOutlined />}
            size="small"
            type="primary"
            onClick={() => openPaymentModal(order)}
            style={{
              borderRadius: 6,
              minWidth: isMobile ? 92 : 118,
              height: isMobile ? 26 : 28,
              padding: isMobile ? "0 6px" : "0 8px",
              fontSize: isMobile ? 11 : 12,
            }}>
            {t?.("staff.orders.payment.btn")}
          </Button>
        )}
        {!isPaid && (
          <Button
            icon={<PlusOutlined />}
            size="small"
            onClick={() => onOpenAddItemModal(order.id)}
            style={{
              borderRadius: 6,
              minWidth: isMobile ? 92 : 118,
              height: isMobile ? 26 : 28,
              padding: isMobile ? "0 6px" : "0 8px",
              fontSize: isMobile ? 11 : 12,
            }}>
            {t?.("staff.orders.modal.add_item")}
          </Button>
        )}
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
