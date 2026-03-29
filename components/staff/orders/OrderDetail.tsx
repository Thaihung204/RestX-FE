import { DollarOutlined } from "@ant-design/icons";
import { Button, Divider, Modal, Select, Space, Tag, Typography } from "antd";
import { Order, OrderStatusId } from "./CardOrder";

const { Text } = Typography;

interface OrderDetailProps {
  selectedOrderForDetail: Order | null;
  isOrderDetailModalOpen: boolean;
  isMobile: boolean;
  mode: "light" | "dark";
  isUpdatingOrderStatus: boolean;
  isUpdatingDetailStatus: boolean;
  normalizeStatusValue: (status: string) => string;
  statusOptions: { value: string; label: React.ReactNode; className: string }[];
  orderStatusOptions: { value: number; label: string; className: string }[];
  totalLabel: string;
  emptyLabel: string;
  paymentLabel: string;
  statusLabel: string;
  onClose: () => void;
  onUpdateOrderStatus: (orderId: string, statusId: OrderStatusId) => void;
  onUpdateDetailStatus: (orderId: string, detailId: string, statusValue: string) => void;
  onOpenPayment: (order: Order) => void;
  onAddItem: (orderId: string) => void;
}

export default function OrderDetail({
  selectedOrderForDetail,
  isOrderDetailModalOpen,
  isMobile,
  mode,
  isUpdatingOrderStatus,
  isUpdatingDetailStatus,
  normalizeStatusValue,
  statusOptions,
  orderStatusOptions,
  totalLabel,
  emptyLabel,
  paymentLabel,
  statusLabel,
  onClose,
  onUpdateOrderStatus,
  onUpdateDetailStatus,
  onOpenPayment,
  onAddItem,
}: OrderDetailProps) {
  return (
    <Modal
      title={<span style={{ fontSize: 18, fontWeight: 700 }}>{selectedOrderForDetail?.reference ?? ""}</span>}
      open={isOrderDetailModalOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={isMobile ? "95%" : 720}
      styles={{
        body: {
          padding: isMobile ? 16 : 24,
          maxHeight: isMobile ? "85vh" : "80vh",
          overflow: "hidden",
        },
      }}>
      {selectedOrderForDetail && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              alignItems: "end",
            }}>
            <div>
              <Text type="secondary">{statusLabel}</Text>
              <div style={{ marginTop: 8 }}>
                <Select
                  value={selectedOrderForDetail.orderStatusId}
                  size="middle"
                  style={{ minWidth: 160, width: isMobile ? "100%" : "auto" }}
                  className="order-status-select"
                  onChange={(value) => onUpdateOrderStatus(selectedOrderForDetail.id, value as OrderStatusId)}
                  disabled={isUpdatingOrderStatus}
                  options={orderStatusOptions}
                />
              </div>
            </div>
            <div style={{ textAlign: isMobile ? "left" : "right" }}>
              <Text type="secondary">{totalLabel}</Text>
              <Text strong style={{ display: "block", fontSize: 18, color: "var(--primary)", marginTop: 8 }}>
                {selectedOrderForDetail.total.toLocaleString("vi-VN")}đ
              </Text>
            </div>
          </div>
          <Divider style={{ margin: "8px 0" }} />
          <div>
            {selectedOrderForDetail.detailItems.length > 0 ? (
              <div
                style={{
                  maxHeight: isMobile ? 360 : 390,
                  overflowY: selectedOrderForDetail.detailItems.length > 6 ? "auto" : "visible",
                  paddingRight: selectedOrderForDetail.detailItems.length > 6 ? 6 : 0,
                }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {selectedOrderForDetail.detailItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "8px 0",
                        borderBottom: mode === "dark" ? "1px dashed rgba(255, 255, 255, 0.08)" : "1px dashed #EDEDED",
                      }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ display: "block" }}>
                          {item.name}
                        </Text>
                        {item.note && (
                          <Text type="secondary" style={{ display: "block" }}>
                            {item.note}
                          </Text>
                        )}
                      </div>
                      <Space size={8} style={{ alignItems: "center" }}>
                        <Tag style={{ margin: 0, borderRadius: 8 }}>x{item.quantity}</Tag>
                        <Select
                          value={normalizeStatusValue(item.status)}
                          size="small"
                          style={{ minWidth: 130 }}
                          onChange={(value) => onUpdateDetailStatus(selectedOrderForDetail.id, item.id, String(value))}
                          disabled={isUpdatingDetailStatus}
                          options={statusOptions}
                        />
                      </Space>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Text type="secondary">{emptyLabel}</Text>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {selectedOrderForDetail.raw?.paymentStatusId !== 1 && (
              <Button icon={<DollarOutlined />} size="middle" type="primary" onClick={() => onOpenPayment(selectedOrderForDetail)}>
                {paymentLabel}
              </Button>
            )}
            {/* <Button icon={<PlusOutlined />} size="middle" onClick={() => onAddItem(selectedOrderForDetail.id)}>
              {addItemLabel}
            </Button> */}
          </div>
        </div>
      )}
    </Modal>
  );
}
