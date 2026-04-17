"use client";

import orderService, {
    ApplyDiscountResponse,
} from "@/lib/services/orderService";
import promotionService, { Promotion } from "@/lib/services/promotionService";
import {
    BankOutlined,
    CheckCircleFilled,
    CrownOutlined,
    DollarOutlined,
    TagOutlined,
} from "@ant-design/icons";
import { Button, InputNumber, Modal, Spin, Typography } from "antd";
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
  subTotal: number;
  total: number;
  customerId?: string;
}

interface PaymentOrderProps {
  isOpen: boolean;
  selectedOrder: SelectedOrder | null;
  onFinalTotalChange?: (value: number) => void;
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
  onFinalTotalChange,
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
  const [discountData, setDiscountData] =
    useState<ApplyDiscountResponse | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);
  const [discountMode, setDiscountMode] = useState<
    "none" | "promotion" | "membership"
  >("none");
  const [selectedPromoCode, setSelectedPromoCode] = useState<string | null>(
    null,
  );

  const hasCustomer = !!(
    selectedOrder?.customerId &&
    selectedOrder.customerId !== "00000000-0000-0000-0000-000000000000"
  );

  // subTotal = tạm tính (giá gốc bill từ OrderDto.subTotal)
  // total = totalAmount của order (trước khi apply discount API)
  // finalTotal = totalAmount sau khi apply discount API (hoặc total nếu chưa apply)
  const subTotal = selectedOrder?.subTotal ?? selectedOrder?.total ?? 0;
  const finalTotal = discountData?.totalAmount ?? selectedOrder?.total ?? 0;
  const hasDiscount = !!(discountData && discountData.discountAmount > 0);

  useEffect(() => {
    if (!isOpen) return;
    onFinalTotalChange?.(finalTotal);
  }, [isOpen, finalTotal, onFinalTotalChange]);

  useEffect(() => {
    if (!isOpen) {
      setDiscountData(null);
      setDiscountMode("none");
      setSelectedPromoCode(null);
      setActivePromotions([]);
      return;
    }
    const fetchPromotions = async () => {
      setIsLoadingPromotions(true);
      try {
        const data = await promotionService.getActivePromotions();
        setActivePromotions(data);
      } catch {
        setActivePromotions([]);
      } finally {
        setIsLoadingPromotions(false);
      }
    };
    fetchPromotions();
  }, [isOpen]);

  const applyDiscount = useCallback(
    async (mode: "promotion" | "membership", promoCode?: string | null) => {
      if (!selectedOrder) return;
      setIsApplyingDiscount(true);
      try {
        const result = await orderService.applyDiscount(selectedOrder.id, {
          promotionCode: mode === "promotion" ? (promoCode ?? null) : null,
          applyMembership: mode === "membership",
        });
        setDiscountData(result);
        setCashReceived(result.totalAmount);
      } catch (error) {
        console.error("Failed to apply discount:", error);
      } finally {
        setIsApplyingDiscount(false);
      }
    },
    [selectedOrder, setCashReceived],
  );

  const handleSelectPromotion = async (code: string) => {
    if (selectedPromoCode === code && discountMode === "promotion") {
      setSelectedPromoCode(null);
      setDiscountMode("none");
      setDiscountData(null);
      setCashReceived(selectedOrder?.total ?? 0);
      return;
    }
    setDiscountMode("promotion");
    setSelectedPromoCode(code);
    await applyDiscount("promotion", code);
  };

  const handleSelectMembership = async () => {
    if (discountMode === "membership") {
      setDiscountMode("none");
      setSelectedPromoCode(null);
      setDiscountData(null);
      setCashReceived(selectedOrder?.total ?? 0);
      return;
    }
    setDiscountMode("membership");
    setSelectedPromoCode(null);
    await applyDiscount("membership");
  };

  return (
    <Modal
      title={
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          {selectedOrder?.reference
            ? `#${selectedOrder.reference}`
            : t("staff.orders.payment.modal.title")}
        </span>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={440}
      zIndex={1200}
      styles={{ body: { padding: "4px 16px 16px" } }}>
      {selectedOrder && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* ── Order summary ── */}
          <div
            style={{
              borderRadius: 10,
              background: "#fff",
              border: "1px solid #f0f0f0",
              padding: "12px 14px",
            }}>
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {t("staff.orders.payment.modal.total_label")}
                  </Text>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#262626",
                      marginTop: 2,
                    }}>
                    {subTotal.toLocaleString("vi-VN")}đ
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {t("staff.orders.payment.modal.final_total_label")}
                  </Text>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: "var(--primary, #1677ff)",
                      marginTop: 2,
                    }}>
                    {finalTotal.toLocaleString("vi-VN")}đ
                  </div>
                </div>
              </div>

              {hasDiscount && !isApplyingDiscount && (
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 4,
                  }}>
                  <CheckCircleFilled
                    style={{ color: "#52c41a", fontSize: 11 }}
                  />
                  <Text style={{ fontSize: 12, color: "#52c41a" }}>
                    -{discountData!.discountAmount.toLocaleString("vi-VN")}đ
                  </Text>
                </div>
              )}
            </div>
          </div>

          {/* ── Discount section ── */}
          <div style={{ borderRadius: 10, border: "1px solid #f0f0f0" }}>
            <div
              style={{
                padding: "9px 12px",
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
              <TagOutlined
                style={{ color: "var(--primary, #1677ff)", fontSize: 13 }}
              />
              <Text strong style={{ fontSize: 13 }}>
                {t("staff.orders.payment.discount.title")}
              </Text>
              {isApplyingDiscount && (
                <Spin size="small" style={{ marginLeft: "auto" }} />
              )}
            </div>

            <div
              style={{
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}>
              {/* Promotion list */}
              {isLoadingPromotions ? (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <Spin size="small" />
                </div>
              ) : activePromotions.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    maxHeight: 192,
                    overflowY: "auto",
                  }}>
                  {activePromotions.map((promo) => {
                    const isSelected =
                      discountMode === "promotion" &&
                      selectedPromoCode === promo.code;
                    const isPct = promo.discountType === "PERCENTAGE";
                    return (
                      <button
                        key={promo.id}
                        type="button"
                        disabled={isApplyingDiscount}
                        onClick={() => handleSelectPromotion(promo.code)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 11px",
                          borderRadius: 8,
                          border: isSelected
                            ? "1.5px solid var(--primary, #1677ff)"
                            : "1px solid #e8e8e8",
                          background: isSelected ? "#f0f7ff" : "#fff",
                          cursor: isApplyingDiscount
                            ? "not-allowed"
                            : "pointer",
                          textAlign: "left",
                          transition: "border-color 0.15s, background 0.15s",
                          opacity: isApplyingDiscount && !isSelected ? 0.55 : 1,
                        }}>
                        <TagOutlined
                          style={{
                            fontSize: 14,
                            color: isSelected
                              ? "var(--primary, #1677ff)"
                              : "#bfbfbf",
                            flexShrink: 0,
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              flexWrap: "wrap",
                            }}>
                            <Text strong style={{ fontSize: 13 }}>
                              {promo.code}
                            </Text>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "1px 6px",
                                borderRadius: 4,
                                background: isPct ? "#e6f4ff" : "#fff7e6",
                                color: isPct
                                  ? "var(--primary, #1677ff)"
                                  : "#d46b08",
                                border: `1px solid ${isPct ? "#bae0ff" : "#ffd591"}`,
                              }}>
                              {isPct
                                ? `-${promo.discountValue}%`
                                : `-${promo.discountValue.toLocaleString("vi-VN")}đ`}
                            </span>
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <span
                              style={{
                                color: "#1f1f1f",
                                fontSize: 13,
                                fontWeight: 500,
                              }}>
                              {promo.name}
                            </span>
                          </Text>
                          {promo.minOrderAmount > 0 && (
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#262626",
                                display: "block",
                              }}>
                              {t("staff.orders.payment.discount.min_order")}:{" "}
                              {promo.minOrderAmount.toLocaleString("vi-VN")}đ
                            </Text>
                          )}
                        </div>

                        {isSelected ? (
                          <CheckCircleFilled
                            style={{
                              color: "var(--primary, #1677ff)",
                              fontSize: 15,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 15,
                              height: 15,
                              borderRadius: "50%",
                              border: "1.5px solid #d9d9d9",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    textAlign: "center",
                    padding: "6px 0",
                    display: "block",
                  }}>
                  {t("staff.orders.payment.discount.no_promotions")}
                </Text>
              )}

              {/* Divider */}
              {hasCustomer && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    margin: "2px 0",
                  }}>
                  <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {t("staff.orders.payment.discount.or") || "hoặc"}
                  </Text>
                  <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
                </div>
              )}

              {/* Membership option */}
              {hasCustomer && (
                <button
                  type="button"
                  disabled={isApplyingDiscount}
                  onClick={handleSelectMembership}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 11px",
                    borderRadius: 8,
                    border:
                      discountMode === "membership"
                        ? "1.5px solid var(--primary, #1677ff)"
                        : "1px solid #e8e8e8",
                    background:
                      discountMode === "membership" ? "#f0f7ff" : "#fff",
                    cursor: isApplyingDiscount ? "not-allowed" : "pointer",
                    textAlign: "left",
                    transition: "border-color 0.15s, background 0.15s",
                    opacity:
                      isApplyingDiscount && discountMode !== "membership"
                        ? 0.55
                        : 1,
                  }}>
                  <CrownOutlined
                    style={{
                      fontSize: 14,
                      color:
                        discountMode === "membership"
                          ? "var(--primary, #1677ff)"
                          : "#bfbfbf",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: 13 }}>
                      {t("staff.orders.payment.discount.membership_label")}
                    </Text>
                    {discountMode === "membership" &&
                      discountData?.appliedMembership && (
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, display: "block" }}>
                          {discountData.appliedMembership.level} · -
                          {discountData.appliedMembership.discountPercentage}%
                        </Text>
                      )}
                  </div>
                  {discountMode === "membership" ? (
                    <CheckCircleFilled
                      style={{
                        color: "var(--primary, #1677ff)",
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 15,
                        height: 15,
                        borderRadius: "50%",
                        border: "1.5px solid #d9d9d9",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* ── Payment method ── */}
          <div>
            <Text
              strong
              style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
              {t("staff.orders.payment.modal.method_label")}
            </Text>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}>
              {paymentOptions.map((method) => {
                const active = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      padding: "9px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      border: active
                        ? "2px solid var(--primary, #1677ff)"
                        : "1.5px solid #e8e8e8",
                      background: "#fff",
                      transition: "all 0.15s",
                    }}>
                    <span
                      style={{
                        fontSize: 14,
                        color: active ? "var(--primary, #1677ff)" : "#8c8c8c",
                      }}>
                      {method.id === "cash" ? (
                        <DollarOutlined />
                      ) : (
                        <BankOutlined />
                      )}
                    </span>
                    <Text
                      strong
                      style={{
                        fontSize: 13,
                        color: active ? "var(--primary, #1677ff)" : "#595959",
                      }}>
                      {method.label}
                    </Text>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Cash input ── */}
          {paymentMethod === "cash" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Text strong style={{ fontSize: 13 }}>
                {t("staff.orders.payment.modal.cash_label")}
              </Text>
              <InputNumber
                autoFocus
                value={cashReceived}
                onChange={(value) => setCashReceived(value || 0)}
                min={0}
                size="large"
                style={{ width: "100%", fontWeight: 600 }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => Number(value?.replace(/,/g, "") || 0)}
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[50000, 100000, 200000, 500000].map((amount) => (
                  <Button
                    key={amount}
                    size="small"
                    type={cashReceived === amount ? "primary" : "default"}
                    onClick={() => setCashReceived(amount)}
                    style={{ borderRadius: 6, fontSize: 11 }}>
                    {amount.toLocaleString("vi-VN")}
                  </Button>
                ))}
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background:
                    cashReceived >= finalTotal ? "#f6ffed" : "#fff1f0",
                  border: `1px solid ${cashReceived >= finalTotal ? "#b7eb8f" : "#ffa39e"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                {cashReceived < finalTotal ? (
                  <>
                    <Text type="danger" style={{ fontSize: 13 }}>
                      {t("staff.orders.payment.modal.missing_label")}
                    </Text>
                    <Text type="danger" strong style={{ fontSize: 15 }}>
                      -{(finalTotal - cashReceived).toLocaleString("vi-VN")}đ
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ fontSize: 13, color: "#389e0d" }}>
                      {t("staff.orders.payment.modal.change_label")}
                    </Text>
                    <Text strong style={{ fontSize: 16, color: "#52c41a" }}>
                      {(cashReceived - finalTotal).toLocaleString("vi-VN")}đ
                    </Text>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Confirm ── */}
          <Button
            type="primary"
            size="large"
            loading={isProcessingPayment}
            onClick={onConfirm}
            disabled={paymentMethod === "cash" && cashReceived < finalTotal}
            style={{
              width: "100%",
              height: 44,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              marginTop: 2,
            }}>
            {t("staff.orders.payment.actions.confirm")} ·{" "}
            {finalTotal.toLocaleString("vi-VN")}đ
          </Button>
        </div>
      )}
    </Modal>
  );
}
