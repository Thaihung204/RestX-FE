import orderService, { ApplyDiscountResponse } from "@/lib/services/orderService";
import { CrownOutlined } from "@ant-design/icons";
import { Button, InputNumber, Modal, Space, Spin, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";

const { Text } = Typography;

type PaymentMethod = "cash" | "bank";

interface PaymentOption {
  id: PaymentMethod;
  label: string;
}

interface SelectedOrder {
  id: string;
  reference: string;
  total: number;
  customerId?: string;
}

interface PaymentOrderProps {
  isOpen: boolean;
  selectedOrder: SelectedOrder | null;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  cashReceived: number;
  setCashReceived: (value: number) => void;
  paymentOptions: PaymentOption[];
  isProcessingPayment: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: string) => string;
}

export default function PaymentOrder({
  isOpen,
  selectedOrder,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  setCashReceived,
  paymentOptions,
  isProcessingPayment,
  onClose,
  onConfirm,
  t,
}: PaymentOrderProps) {
  const [discountData, setDiscountData] = useState<ApplyDiscountResponse | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  const hasCustomer = !!(
    selectedOrder?.customerId &&
    selectedOrder.customerId !== "00000000-0000-0000-0000-000000000000"
  );

  const effectiveTotal = discountData?.totalAmount ?? selectedOrder?.total ?? 0;

  const applyMembershipDiscount = useCallback(async () => {
    if (!selectedOrder || !hasCustomer) return;

    setIsApplyingDiscount(true);
    try {
      const result = await orderService.applyDiscount(selectedOrder.id, {
        promotionCode: null,
        applyMembership: true,
      });
      setDiscountData(result);
      setCashReceived(result.totalAmount);
    } catch (error) {
      console.error("Failed to apply discount:", error);
    } finally {
      setIsApplyingDiscount(false);
    }
  }, [selectedOrder, hasCustomer, setCashReceived]);

  useEffect(() => {
    if (isOpen && selectedOrder && hasCustomer) {
      applyMembershipDiscount();
    }
    if (!isOpen) {
      setDiscountData(null);
    }
  }, [isOpen, selectedOrder?.id, hasCustomer, applyMembershipDiscount]);

  return (
    <Modal
      title={<span style={{ fontSize: 16, fontWeight: 700 }}>{t("staff.orders.payment.modal.title")}</span>}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={440}
      zIndex={1200}
      styles={{ body: { padding: "16px 18px 20px" } }}>
      {selectedOrder && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: 12, background: "var(--primary-5, #f0f7ff)", borderRadius: 10, border: "1px solid var(--primary-20, #bae7ff)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div>
                <Text type="secondary">{t("staff.orders.payment.modal.order_label")}</Text>
                <Text strong style={{ display: "block", fontSize: 14, lineHeight: 1.3 }}>{selectedOrder.reference}</Text>
              </div>
              <div style={{ textAlign: "right" }}>
                <Text type="secondary">{t("staff.orders.payment.modal.total_label")}</Text>
                <Text strong style={{ display: "block", fontSize: 16, color: "var(--primary)" }}>
                  {effectiveTotal.toLocaleString("vi-VN")}đ
                </Text>
              </div>
            </div>
          </div>

          {/* Membership Discount Section */}
          {hasCustomer && (
            <div style={{
              padding: 12,
              borderRadius: 10,
              border: discountData?.appliedMembership
                ? "1px solid #b7eb8f"
                : "1px solid #e8e8e8",
              background: discountData?.appliedMembership
                ? "#f6ffed"
                : "#fafafa",
            }}>
              {isApplyingDiscount ? (
                <div style={{ textAlign: "center", padding: 8 }}>
                  <Spin size="small" />
                  <Text type="secondary" style={{ display: "block", marginTop: 4, fontSize: 12 }}>
                    {t("staff.orders.payment.discount.applying")}
                  </Text>
                </div>
              ) : discountData?.appliedMembership ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                    <Space style={{ alignItems: "center", gap: 6 }}>
                      {/* <CrownOutlined style={{ color: "#faad14", fontSize: 16 }} /> */}
                      <Text strong style={{ fontSize: 13 }}>
                        {t("staff.orders.payment.discount.membership_applied")}
                      </Text>
                    </Space>
                    <Button
                      size="small"
                      onClick={applyMembershipDiscount}
                      style={{ borderRadius: 6, fontSize: 11, height: 24, paddingInline: 8 }}>
                      {t("staff.orders.payment.discount.apply_button")}
                    </Button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t("staff.orders.payment.discount.subtotal")}
                      </Text>
                      <Text style={{ fontSize: 12 }}>
                        {discountData.subTotal.toLocaleString("vi-VN")}đ
                      </Text>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t("staff.orders.payment.discount.level")} ({discountData.appliedMembership.level})
                      </Text>
                      <Text style={{ fontSize: 12, color: "#52c41a" }}>
                        -{discountData.appliedMembership.discountPercentage}%
                      </Text>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t("staff.orders.payment.discount.amount")}
                      </Text>
                      <Text strong style={{ fontSize: 12, color: "#52c41a" }}>
                        -{discountData.breakdown.membershipDiscount.toLocaleString("vi-VN")}đ
                      </Text>
                    </div>
                  </div>
                </div>
              ) : discountData ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CrownOutlined style={{ color: "#d9d9d9", fontSize: 16 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t("staff.orders.payment.discount.no_discount")}
                  </Text>
                </div>
              ) : null}
            </div>
          )}

          <div>
            <Text strong style={{ display: "block", marginBottom: 8, fontSize: 13 }}>{t("staff.orders.payment.modal.method_label")}</Text>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {paymentOptions.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    padding: "8px 10px",
                    textAlign: "center",
                    borderRadius: 8,
                    cursor: "pointer",
                    border: paymentMethod === method.id ? "2px solid var(--primary)" : "1px solid #E5E7EB",
                    background: paymentMethod === method.id ? "#fff" : "#FAFAFA",
                    transition: "all 0.2s",
                  }}>
                  <Text strong style={{ fontSize: 12 }}>{method.label}</Text>
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === "cash" && (
            <div>
              <Text strong style={{ fontSize: 13 }}>{t("staff.orders.payment.modal.cash_label")}</Text>
              <InputNumber
                autoFocus
                value={cashReceived}
                onChange={(value) => setCashReceived(value || 0)}
                min={0}
                size="middle"
                style={{ width: "100%", marginTop: 6, fontSize: 14, fontWeight: 600 }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => Number(value?.replace(/,/g, "") || 0)}
              />
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {[50000, 100000, 200000, 500000].map((amount) => (
                  <Button key={amount} size="small" onClick={() => setCashReceived(amount)} style={{ borderRadius: 6, fontSize: 11, height: 24, paddingInline: 8 }}>
                    {amount.toLocaleString("vi-VN")}
                  </Button>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: cashReceived >= effectiveTotal ? "#F6FFED" : "#FFF1F0", textAlign: "center" }}>
                {cashReceived < effectiveTotal ? (
                  <Text type="danger" strong style={{ fontSize: 13 }}>
                    {t("staff.orders.payment.modal.missing_label")}: {(effectiveTotal - cashReceived).toLocaleString("vi-VN")}đ
                  </Text>
                ) : (
                  <div>
                    <div style={{ color: "#52C41A", fontSize: 12 }}>{t("staff.orders.payment.modal.change_label")}</div>
                    <div style={{ color: "#52C41A", fontSize: 18, fontWeight: 700 }}>
                      {(cashReceived - effectiveTotal).toLocaleString("vi-VN")}đ
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            type="primary"
            size="large"
            loading={isProcessingPayment}
            onClick={onConfirm}
            disabled={paymentMethod === "cash" && cashReceived < effectiveTotal}
            style={{ width: "100%", height: 42, borderRadius: 10, fontSize: 14, fontWeight: 600, marginTop: 4, boxShadow: "0 3px 10px rgba(24, 144, 255, 0.24)" }}>
            {t("staff.orders.payment.actions.confirm")}
          </Button>
        </div>
      )}
    </Modal>
  );
}
