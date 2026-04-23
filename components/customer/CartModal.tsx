"use client";

import { useCart } from "@/lib/contexts/CartContext";
import notificationService from "@/lib/services/notificationService";
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
  } = useCart();

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);
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
      messageApi.success(t("customer_page.cart_modal.payment_request_sent"));
    } catch {
      // silent fail - vẫn mở feedback
    } finally {
      setIsRequestingPayment(false);
    }
    closeCartModal();
    setFeedbackOpen(true);
  };

  const handleFeedbackSubmit = async (_rating: number, _feedback: string) => {
    setFeedbackOpen(false);
    requestPayment();
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
                        maxHeight: "calc(80vh - 320px)",
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
                          {cartItems.map((item) => (
                            <Card
                              key={item.id}
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: 12,
                                marginBottom: 8,
                              }}
                              styles={{ body: { padding: 10 } }}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "center",
                                }}>
                                {item.image && (
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
                                )}

                                <div
                                  style={{
                                    flex: 1,
                                    minWidth: 0,
                                  }}>
                                  <Text
                                    style={{
                                      color: "var(--text)",
                                      fontSize: 14,
                                      fontWeight: 600,
                                      display: "block",
                                      marginBottom: 2,
                                    }}>
                                    {item.name}
                                  </Text>
                                  <Text
                                    style={{
                                      color: "var(--text)",
                                      fontSize: 14,
                                      fontWeight: 600,
                                    }}>
                                    {formatVND(
                                      parseFloat(item.price) * item.quantity,
                                    )}
                                  </Text>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    background: "var(--surface)",
                                    padding: "4px 6px",
                                  }}>
                                  <Button
                                    type="text"
                                    icon={<MinusOutlined />}
                                    onClick={() =>
                                      updateQuantity(item.id, item.quantity - 1)
                                    }
                                    style={{
                                      color: "var(--text)",
                                      border: "1px solid var(--border)",
                                      width: 32,
                                      height: 32,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                    size="small"
                                  />
                                  <Text
                                    style={{
                                      color: "var(--text)",
                                      fontSize: 14,
                                      fontWeight: 600,
                                      width: 20,
                                      textAlign: "center",
                                    }}>
                                    {item.quantity}
                                  </Text>
                                  <Button
                                    type="text"
                                    icon={<PlusOutlined />}
                                    onClick={() =>
                                      updateQuantity(item.id, item.quantity + 1)
                                    }
                                    style={{
                                      color: "var(--text)",
                                      border: "1px solid var(--border)",
                                      width: 32,
                                      height: 32,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                    size="small"
                                  />
                                </div>
                              </div>
                              <Input
                                prefix={
                                  <EditOutlined
                                    style={{
                                      color: "var(--text)",
                                      fontSize: 14,
                                      opacity: item.note ? 1 : 0.6,
                                    }}
                                  />
                                }
                                placeholder={t(
                                  "customer_page.cart_modal.note_placeholder",
                                )}
                                value={item.note || ""}
                                onChange={(e) =>
                                  updateNote(item.id, e.target.value)
                                }
                                style={{
                                  marginTop: 12,
                                  background: "var(--background)",
                                  borderRadius: 8,
                                  padding: "6px 12px",
                                  color: "var(--text)",
                                  fontSize: 13,
                                  border: "1px solid var(--border)",
                                  boxShadow: "none",
                                }}
                              />
                            </Card>
                          ))}
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
                        maxHeight: "calc(80vh - 320px)",
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
                                {items.map((item, index) => (
                                  <Card
                                    key={
                                      item.lineId ||
                                      `${item.id}-${status}-${index}`
                                    }
                                    style={{
                                      background: "var(--surface)",
                                      border: "1px solid var(--border)",
                                      borderRadius: 12,
                                      marginBottom: 8,
                                    }}
                                    styles={{ body: { padding: 10 } }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 8,
                                        alignItems: "center",
                                      }}>
                                      {item.image && (
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          style={{
                                            width: 56,
                                            height: 56,
                                            objectFit: "cover",
                                            borderRadius: 8,
                                            border:
                                              "1px solid var(--stroke-subtle)",
                                            flexShrink: 0,
                                          }}
                                        />
                                      )}
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
                                            {formatVND(parseFloat(item.price))}{" "}
                                            x {item.quantity}
                                          </Text>
                                        </div>
                                        <div
                                          style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "flex-end",
                                            gap: 4,
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
                                            {formatVND(
                                              parseFloat(item.price) *
                                                item.quantity,
                                            )}
                                          </Text>
                                        </div>
                                      </div>
                                    </div>
                                    {item.note && (
                                      <div
                                        style={{
                                          marginTop: 8,
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
                                ))}
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
                        <Button
                          block
                          type="primary"
                          size="large"
                          onClick={handleRequestPayment}
                          loading={isRequestingPayment}
                          disabled={isRequestingPayment}
                          style={{
                            background: "var(--primary)",
                            border: "none",
                            height: 48,
                            fontWeight: 700,
                            fontSize: 16,
                            boxShadow: "0 10px 25px var(--primary-glow)",
                          }}>
                          {t("customer_page.cart_modal.request_payment")}
                        </Button>
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
        onClose={() => setFeedbackOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  );
}
