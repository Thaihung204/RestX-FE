"use client";

import { useCart } from "@/lib/contexts/CartContext";
import notificationService from "@/lib/services/notificationService";
import paymentService from "@/lib/services/paymentService";
import { formatVND } from "@/lib/utils/currency";
import {
    CloseOutlined,
    EditOutlined,
    MinusOutlined,
    PlusOutlined,
    ShoppingCartOutlined,
} from "@ant-design/icons";
import { message as antMessage, Button, Card, Input, Modal, Tabs, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import FeedbackModal from "./FeedbackModal";

const { Text } = Typography;

export default function CartModal() {
  const { t } = useTranslation("common");
  const {
    cartItems,
    orderedItems,
    cartModalOpen,
    activeCartTab,
    isSubmittingOrder,
    cartItemCount,
    totalOrderAmount,
    orderTableId,
    updateQuantity,
    updateNote,
    confirmOrder,
    requestPayment,
    closeCartModal,
    setActiveCartTab,
    activeOrderId,
  } = useCart();

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);
  const [isSelfPaying, setIsSelfPaying] = useState(false);
  const [messageApi, contextHolder] = antMessage.useMessage();

  const handleRequestPayment = async () => {
    if (!orderTableId) {
      closeCartModal();
      setFeedbackOpen(true);
      return;
    }
    setIsRequestingPayment(true);
    try {
      await notificationService.requestTable(orderTableId, "Yêu cầu thanh toán");
      // Wait for the toast to display (1.5 seconds) before proceeding
      await messageApi.success(t("customer_page.cart_modal.payment_request_sent"), 1.5);
      closeCartModal();
      setFeedbackOpen(true);
    } catch {
      messageApi.error(t("customer_page.cart_modal.payment_request_failed"));
    } finally {
      setIsRequestingPayment(false);
    }
  };

  const handleSelfPayment = async () => {
    if (!activeOrderId) {
      messageApi.error(t("customer_page.cart_modal.no_order_to_pay"));
      return;
    }
    setIsSelfPaying(true);
    try {
      const response = await paymentService.createPaymentLink(activeOrderId, { isCustomer: true });
      if (response.checkoutUrl) {
        window.location.assign(response.checkoutUrl);
        return;
      }
      messageApi.error(t("customer_page.cart_modal.self_pay_failed"));
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.message || err?.response?.data?.title || err?.message || "";
      console.error("[SelfPayment] error", status, detail, err?.response?.data);
      if (status === 403) {
        messageApi.error(t("customer_page.cart_modal.self_pay_not_available"));
      } else if (status === 401) {
        messageApi.error(t("customer_page.cart_modal.self_pay_unauthorized"));
      } else if (status === 400) {
        messageApi.error(detail || t("customer_page.cart_modal.self_pay_failed"));
      } else {
        messageApi.error(t("customer_page.cart_modal.self_pay_failed"));
      }
    } finally {
      setIsSelfPaying(false);
    }
  };


  const orderedItemsByStatus = useMemo(() => {
    const grouped = new Map<string, typeof orderedItems>();

    orderedItems.forEach((item) => {
      const key = item.status || "Pending";
      const existing = grouped.get(key) || [];
      grouped.set(key, [...existing, item]);
    });

    return Array.from(grouped.entries());
  }, [orderedItems]);

  const getStatusColor = (status?: string) => {
    const normalized = (status || "pending").toLowerCase();
    if (normalized === "ready") return "green";
    if (normalized === "served") return "blue";
    if (normalized === "cancelled") return "red";
    return "orange";
  };

  return (
    <>
      {contextHolder}
      <Modal
        open={cartModalOpen}
        zIndex={2600}
        onCancel={closeCartModal}
        footer={null}
        closeIcon={null}
        centered
        width="100%"
        style={{ maxWidth: 500, padding: 0 }}
        styles={{
          mask: {
            backdropFilter: "blur(12px)",
            background: "var(--modal-overlay)",
          },
          wrapper: {
            background: "transparent",
          },
          body: {
            background: "transparent",
            padding: 0,
          },
        }}
        wrapClassName="cart-modal-wrapper">
        <div
          style={{
            position: "relative",
            background: "var(--card)",
            borderRadius: 20,
            padding: "18px 16px",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
            overflow: "hidden",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
          }}>
          {/* Decorative blur */}
          <div
            style={{
              position: "absolute",
              top: -50,
              left: -50,
              width: 150,
              height: 150,
              background: "var(--primary)",
              filter: "blur(90px)",
              opacity: 0.15,
              pointerEvents: "none",
            }}
          />

          {/* Close Button */}
          <div
            onClick={closeCartModal}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              backdropFilter: "blur(4px)",
              border: "1px solid var(--border)",
            }}>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              <CloseOutlined />
            </div>
          </div>

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "var(--primary-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--primary-border)",
              }}>
              <ShoppingCartOutlined
                style={{ color: "var(--primary)", fontSize: 20 }}
              />
            </div>
            <div>
              <Text
                style={{
                  color: "var(--primary)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  fontWeight: 700,
                }}>
                {t("customer_page.cart_modal.title")}
              </Text>
              <div
                style={{
                  color: "var(--text)",
                  fontSize: 16,
                  fontWeight: 700,
                  marginTop: -2,
                }}>
                {t("customer_page.cart_modal.items_count", {
                  count: cartItemCount,
                })}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            activeKey={activeCartTab}
            onChange={setActiveCartTab}
            items={[
              {
                key: "1",
                label: t("customer_page.cart_modal.cart_tab_with_count", {
                  count: cartItems.length,
                }),
                children: (
                  <>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        paddingRight: 2,
                        paddingBottom: 6,
                        maxHeight: "calc(80vh - 220px)",
                      }}>
                      {cartItems.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "60px 20px",
                            color: "var(--text-muted)",
                          }}>
                          <ShoppingCartOutlined
                            style={{
                              fontSize: 48,
                              marginBottom: 16,
                              opacity: 0.3,
                            }}
                          />
                          <Text
                            style={{
                              color: "var(--text-muted)",
                              fontSize: 14,
                              display: "block",
                            }}>
                            {t("customer_page.cart_modal.empty_cart")}
                          </Text>
                        </div>
                      ) : (
                        <>
                          {cartItems.map((item) => {
                            const isCombo = !!item.comboId;
                            return (
                            <Card
                              key={item.id}
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: 12,
                                marginBottom: 8,
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                              styles={{ body: { padding: 0 } }}>

                              {/* Main row: image + name/price + qty controls */}
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "center",
                                  padding: "10px 10px 8px",
                                }}>
                                {/* Image / emoji */}
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    style={{
                                      width: 52,
                                      height: 52,
                                      objectFit: "cover",
                                      borderRadius: 8,
                                      border: "1px solid var(--stroke-subtle)",
                                      flexShrink: 0,
                                    }}
                                  />
                                ) : isCombo ? (
                                  <div style={{
                                    width: 52, height: 52, borderRadius: 8,
                                    background: "var(--surface-subtle, #f0f0f0)",
                                    display: "flex", alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0, border: "1px solid var(--stroke-subtle)",
                                  }}>
                                    <img
                                      src="/images/dishStatus/spicy.png"
                                      alt=""
                                      style={{ width: 24, height: 24, objectFit: "contain", opacity: 0.3 }}
                                    />
                                  </div>
                                ) : null}

                                {/* Name + price */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Text
                                    style={{
                                      color: "var(--text)",
                                      fontSize: 14,
                                      fontWeight: 600,
                                      display: "block",
                                      marginBottom: 2,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}>
                                    {item.name}
                                  </Text>
                                  <Text style={{ color: "var(--text)", fontSize: 13, fontWeight: 600 }}>
                                    {formatVND(parseFloat(item.price) * item.quantity)}
                                  </Text>
                                </div>

                                {/* +/- controls */}
                                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                  <Button
                                    type="text"
                                    icon={<MinusOutlined />}
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    style={{
                                      color: "var(--text)",
                                      border: "1px solid var(--border)",
                                      width: 30, height: 30,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                    }}
                                    size="small"
                                  />
                                  <Text style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, width: 20, textAlign: "center" }}>
                                    {item.quantity}
                                  </Text>
                                  <Button
                                    type="text"
                                    icon={<PlusOutlined />}
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    style={{
                                      color: "var(--text)",
                                      border: "1px solid var(--border)",
                                      width: 30, height: 30,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                    }}
                                    size="small"
                                  />
                                </div>
                              </div>

                              {/* Combo children list */}
                              {isCombo && (item.children ?? []).length > 0 && (
                                <div style={{
                                  borderTop: "1px dashed var(--border)",
                                  padding: "5px 10px 5px 70px",
                                  display: "flex", flexDirection: "column", gap: 3,
                                  background: "rgba(0,0,0,0.02)",
                                }}>
                                  {(item.children ?? []).map((child) => (
                                    <div key={child.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      {child.image && (
                                        <img
                                          src={child.image}
                                          alt={child.name}
                                          style={{
                                            width: 28,
                                            height: 28,
                                            objectFit: "cover",
                                            borderRadius: 6,
                                            border: "1px solid var(--stroke-subtle)",
                                            flexShrink: 0,
                                          }}
                                        />
                                      )}
                                      <Text style={{ fontSize: 12, color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {child.name}
                                      </Text>
                                      <Text style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>
                                        x{child.quantity * item.quantity}
                                      </Text>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Note input */}
                              <div style={{ padding: "0 10px 10px" }}>
                                <Input
                                  prefix={
                                    <EditOutlined
                                      style={{
                                        color: "var(--text-muted)",
                                        fontSize: 13,
                                        opacity: item.note ? 1 : 0.5,
                                      }}
                                    />
                                  }
                                  placeholder={t("customer_page.cart_modal.note_placeholder")}
                                  value={item.note || ""}
                                  onChange={(e) => updateNote(item.id, e.target.value)}
                                  style={{
                                    background: "var(--background)",
                                    borderRadius: 8,
                                    padding: "5px 10px",
                                    color: "var(--text)",
                                    fontSize: 13,
                                    border: "1px solid var(--border)",
                                    boxShadow: "none",
                                  }}
                                />
                              </div>
                            </Card>
                            );
                          })}
                        </>
                      )}
                    </div>
                    {cartItems.length > 0 && (
                      <Button
                        block
                        type="primary"
                        size="large"
                        onClick={confirmOrder}
                        loading={isSubmittingOrder}
                        disabled={isSubmittingOrder}
                        style={{
                          background: "var(--primary)",
                          border: "none",
                          height: 48,
                          fontWeight: 700,
                          fontSize: 16,
                          marginTop: 16,
                          boxShadow: "0 10px 25px var(--primary-glow)",
                        }}>
                        {t("customer_page.cart_modal.confirm_order")}
                      </Button>
                    )}
                  </>
                ),
              },
              {
                key: "2",
                label: t("customer_page.cart_modal.ordered_tab"),
                children: (
                  <>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        paddingRight: 2,
                        paddingBottom: 6,
                        maxHeight: "calc(80vh - 390px)",
                      }}>
                      {orderedItems.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "60px 20px",
                            color: "var(--text-muted)",
                          }}>
                          <ShoppingCartOutlined
                            style={{
                              fontSize: 48,
                              marginBottom: 16,
                              opacity: 0.3,
                            }}
                          />
                          <Text
                            style={{
                              color: "var(--text-muted)",
                              fontSize: 14,
                              display: "block",
                            }}>
                            {t("customer_page.cart_modal.empty_ordered")}
                          </Text>
                        </div>
                      ) : (
                        <>
                          {orderedItemsByStatus.map(([status, items]) => {
                            if (items.length === 0) return null;
                            return (
                              <div key={status}>
                                <Text
                                  style={{
                                    color: "var(--primary)",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    display: "block",
                                    marginBottom: 8,
                                    textTransform: "uppercase",
                                    letterSpacing: 1,
                                    marginTop: 8,
                                  }}>
                                  {status}
                                </Text>
                                {items.map((item, index) => {
                                  const isCombo = !!item.comboId;
                                  return (
                                    <Card
                                      key={item.lineId || `${item.id}-${status}-${index}`}
                                      style={{
                                        background: "var(--surface)",
                                        border: "1px solid var(--border)",
                                        borderRadius: 12,
                                        marginBottom: 8,
                                        overflow: "hidden",
                                      }}
                                      styles={{ body: { padding: 0 } }}>
                                      {/* Main row */}
                                      <div
                                        style={{
                                          display: "flex",
                                          gap: 8,
                                          alignItems: "center",
                                          padding: 10,
                                        }}>
                                        {item.image ? (
                                          <img
                                            src={item.image}
                                            alt={item.name}
                                            style={{
                                              width: 56,
                                              height: 56,
                                              objectFit: "cover",
                                              borderRadius: 8,
                                              border: "1px solid var(--stroke-subtle)",
                                              flexShrink: 0,
                                            }}
                                          />
                                        ) : isCombo ? (
                                          <div
                                            style={{
                                              width: 56,
                                              height: 56,
                                              borderRadius: 8,
                                              background: "var(--surface-subtle, #f5f5f5)",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              flexShrink: 0,
                                              border: "1px solid var(--stroke-subtle)",
                                            }}>
                                            <img
                                              src="/images/dishStatus/spicy.png"
                                              alt=""
                                              style={{ width: 24, height: 24, objectFit: "contain", opacity: 0.3 }}
                                            />
                                          </div>
                                        ) : null}
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            flex: 1,
                                            minWidth: 0,
                                          }}>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text
                                              style={{
                                                color: "var(--text)",
                                                fontSize: 14,
                                                fontWeight: 600,
                                                display: "block",
                                                marginBottom: 2,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                              }}>
                                              {item.name}
                                            </Text>
                                            <Text
                                              style={{
                                                color: "var(--text)",
                                                fontSize: 13,
                                                fontWeight: 600,
                                              }}>
                                              {formatVND(parseFloat(item.price))} x {item.quantity}
                                            </Text>
                                          </div>
                                          <div
                                            style={{
                                              display: "flex",
                                              flexDirection: "column",
                                              alignItems: "flex-end",
                                              gap: 4,
                                              flexShrink: 0,
                                            }}>
                                            <Tag
                                              color={getStatusColor(item.status)}
                                              style={{ margin: 0, fontSize: 11 }}>
                                              {item.status || "Pending"}
                                            </Tag>
                                            <Text
                                              style={{
                                                color: "var(--text)",
                                                fontSize: 14,
                                                fontWeight: 600,
                                              }}>
                                              {formatVND(parseFloat(item.price) * item.quantity)}
                                            </Text>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Combo children */}
                                      {isCombo && (item.children ?? []).length > 0 && (
                                        <div
                                          style={{
                                            borderTop: "1px dashed var(--border)",
                                            padding: "6px 10px 6px 74px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 4,
                                            background: "var(--background, rgba(0,0,0,0.02))",
                                          }}>
                                          {(item.children ?? []).map((child) => (
                                            <div
                                              key={child.lineId ?? child.id}
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                              }}>
                                              {child.image && (
                                                <img
                                                  src={child.image}
                                                  alt={child.name}
                                                  style={{
                                                    width: 32,
                                                    height: 32,
                                                    objectFit: "cover",
                                                    borderRadius: 6,
                                                    border: "1px solid var(--stroke-subtle)",
                                                    flexShrink: 0,
                                                  }}
                                                />
                                              )}
                                              <Text
                                                style={{
                                                  fontSize: 13,
                                                  color: "var(--text-muted)",
                                                  flex: 1,
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  whiteSpace: "nowrap",
                                                }}>
                                                {child.name}
                                              </Text>
                                              <Text
                                                style={{
                                                  fontSize: 12,
                                                  color: "var(--text-muted)",
                                                  flexShrink: 0,
                                                }}>
                                                x{child.quantity}
                                              </Text>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Note */}
                                      {item.note && (
                                        <div
                                          style={{
                                            margin: "0 10px 10px",
                                            background: "var(--background)",
                                            borderRadius: 8,
                                            padding: "6px 12px",
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 8,
                                            border: "1px solid var(--border)",
                                          }}>
                                          <EditOutlined
                                            style={{
                                              color: "var(--text)",
                                              fontSize: 13,
                                              marginTop: 2,
                                              opacity: 0.8,
                                            }}
                                          />
                                          <Text
                                            style={{
                                              color: "var(--text)",
                                              fontSize: 13,
                                              fontStyle: "italic",
                                            }}>
                                            {item.note}
                                          </Text>
                                        </div>
                                      )}
                                    </Card>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                    {orderedItems.length > 0 && (
                      <div
                        style={{
                          borderTop: "1px solid var(--border)",
                          paddingTop: 16,
                          marginTop: 16,
                        }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 12,
                          }}>
                          <Text
                            style={{
                              color: "var(--text-muted)",
                              fontSize: 12,
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}>
                            {t("customer_page.cart_modal.total")}
                          </Text>
                          <div
                            style={{
                              color: "var(--text)",
                              fontSize: 16,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}>
                            {formatVND(totalOrderAmount)}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {/* Tự thanh toán PayOS — nổi bật, ở trên */}
                          <Button
                            block
                            type="primary"
                            size="large"
                            onClick={handleSelfPayment}
                            loading={isSelfPaying}
                            disabled={isRequestingPayment || isSelfPaying}
                            style={{
                              background: "var(--primary)",
                              border: "none",
                              height: 52,
                              fontWeight: 700,
                              fontSize: 15,
                              boxShadow: "0 10px 25px var(--primary-glow)",
                            }}>
                            {t("customer_page.cart_modal.self_payment")}
                          </Button>
                          {/* Nhân viên thanh toán — phụ, ở dưới */}
                          <Button
                            block
                            type="default"
                            size="large"
                            onClick={handleRequestPayment}
                            loading={isRequestingPayment}
                            disabled={isRequestingPayment || isSelfPaying}
                            style={{
                              height: 52,
                              fontWeight: 700,
                              fontSize: 15,
                              border: "1px solid var(--border)",
                              color: "var(--text-muted)",
                              background: "transparent",
                            }}>
                            {t("customer_page.cart_modal.request_payment")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ),
              },
            ]}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          />
        </div>
      </Modal>
      <FeedbackModal
        open={feedbackOpen}
        orderId={activeOrderId}
        onClose={() => setFeedbackOpen(false)}
        onSuccess={() => {
          setFeedbackOpen(false);
        }}
      />
    </>
  );
}
