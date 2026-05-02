"use client";

import promotionService, { Promotion } from "@/lib/services/promotionService";
import { formatVND } from "@/lib/utils/currency";
import {
    BankOutlined,
    CheckCircleFilled,
    DollarOutlined,
    TagOutlined,
} from "@ant-design/icons";
import { Button, InputNumber, Modal, Spin, Typography } from "antd";
import { useEffect, useState } from "react";

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
  depositAmount?: number;
  serviceCharge?: number;
  serviceChargePercent?: number;
}

interface PaymentOrderProps {
  isOpen: boolean;
  selectedOrder: SelectedOrder | null;
  onFinalTotalChange?: (value: number) => void;
  onPromotionChange?: (promo: Promotion | null) => void;
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

/** Tính discount amount từ promotion và subTotal (thuần FE) */
function calcDiscountAmount(promo: Promotion, subTotal: number): number {
  if (promo.discountType === "PERCENTAGE") {
    const raw = subTotal * (promo.discountValue / 100);
    return promo.maxDiscountAmount > 0
      ? Math.min(raw, promo.maxDiscountAmount)
      : raw;
  }
  // FIXED
  return Math.min(promo.discountValue, subTotal);
}

export default function PaymentOrder({
  isOpen,
  selectedOrder,
  onFinalTotalChange,
  onPromotionChange,
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
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);

  // ── Derived values (all FE) ──────────────────────────────────────────────
  const subTotal = selectedOrder?.subTotal ?? 0;
  const serviceChargeAmt = selectedOrder?.serviceCharge ?? 0;
  const serviceChargePercent = selectedOrder?.serviceChargePercent ?? 0;
  const depositAmount = selectedOrder?.depositAmount ?? 0;
  const totalBeforeDiscount = subTotal + serviceChargeAmt - depositAmount;

  const discountAmount = selectedPromo
    ? calcDiscountAmount(selectedPromo, subTotal)
    : 0;
  const finalTotal = Math.max(0, totalBeforeDiscount - discountAmount);

  // ── Sync finalTotal to parent ────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    onFinalTotalChange?.(finalTotal);
  }, [isOpen, finalTotal, onFinalTotalChange]);

  // ── Reset on close / fetch promotions on open ────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setSelectedPromo(null);
      setActivePromotions([]);
      return;
    }
    const fetchPromotions = async () => {
      setIsLoadingPromotions(true);
      try {
        const data = await promotionService.getActivePromotions(
          selectedOrder?.id,
        );
        setActivePromotions(data);
      } catch {
        setActivePromotions([]);
      } finally {
        setIsLoadingPromotions(false);
      }
    };
    fetchPromotions();
  }, [isOpen, selectedOrder?.id]);

  // ── Notify parent whenever selected promo changes ────────────────────────
  useEffect(() => {
    onPromotionChange?.(selectedPromo);
  }, [selectedPromo, onPromotionChange]);

  const handleSelectPromotion = (promo: Promotion) => {
    setSelectedPromo((prev) => {
      const next = prev?.id === promo.id ? null : promo;
      const newDiscount = next ? calcDiscountAmount(next, subTotal) : 0;
      const newFinal = Math.max(0, totalBeforeDiscount - newDiscount);
      setCashReceived(newFinal);
      return next;
    });
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 10,
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
                  {formatVND(subTotal)}
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
                  {formatVND(finalTotal)}
                </div>
              </div>
            </div>

            {/* Breakdown lines */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 5,
                borderTop: "1px dashed #f0f0f0",
                paddingTop: 8,
              }}>
              {serviceChargeAmt > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                  <span style={{ fontSize: 12, color: "#8c8c8c" }}>
                    {t("staff.orders.payment.discount.service_charge")}
                    {serviceChargePercent > 0
                      ? ` (${serviceChargePercent}%)`
                      : ""}
                  </span>
                  <span
                    style={{ fontSize: 12, color: "#d46b08", fontWeight: 600 }}>
                    +{formatVND(serviceChargeAmt)}
                  </span>
                </div>
              )}

              {discountAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#8c8c8c",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}>
                    <CheckCircleFilled
                      style={{ color: "#52c41a", fontSize: 11 }}
                    />
                    {t("staff.orders.payment.discount.discount_label")}
                    {selectedPromo && ` (${selectedPromo.code})`}
                  </span>
                  <span
                    style={{ fontSize: 12, color: "#52c41a", fontWeight: 600 }}>
                    -{formatVND(discountAmount)}
                  </span>
                </div>
              )}

              {depositAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                  <span style={{ fontSize: 12, color: "#8c8c8c" }}>
                    {t("staff.orders.payment.discount.deposit_label")}
                  </span>
                  <span
                    style={{ fontSize: 12, color: "#cf1322", fontWeight: 600 }}>
                    -{formatVND(depositAmount)}
                  </span>
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
            </div>

            <div
              style={{
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}>
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
                    const isSelected = selectedPromo?.id === promo.id;
                    const isPct = promo.discountType === "PERCENTAGE";
                    return (
                      <button
                        key={promo.id}
                        type="button"
                        onClick={() => handleSelectPromotion(promo)}
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
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "border-color 0.15s, background 0.15s",
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
                                : `-${formatVND(promo.discountValue)}`}
                            </span>
                          </div>
                          <Text
                            style={{
                              color: "#1f1f1f",
                              fontSize: 13,
                              fontWeight: 500,
                              display: "block",
                            }}>
                            {promo.name}
                          </Text>
                          {promo.minOrderAmount > 0 && (
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#262626",
                                display: "block",
                              }}>
                              {t("staff.orders.payment.discount.min_order")}:{" "}
                              {formatVND(promo.minOrderAmount)}
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
                    {formatVND(amount)}
                  </Button>
                ))}
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background:
                    cashReceived >= finalTotal ? "#f6ffed" : "#fff1f0",
                  border: `1px solid ${
                    cashReceived >= finalTotal ? "#b7eb8f" : "#ffa39e"
                  }`,
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
                      -{formatVND(finalTotal - cashReceived)}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ fontSize: 13, color: "#389e0d" }}>
                      {t("staff.orders.payment.modal.change_label")}
                    </Text>
                    <Text strong style={{ fontSize: 16, color: "#52c41a" }}>
                      {formatVND(cashReceived - finalTotal)}
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
            {t("staff.orders.payment.actions.confirm")} · {formatVND(finalTotal)}
          </Button>
        </div>
      )}
    </Modal>
  );
}
