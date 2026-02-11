"use client";

import { useCart } from "@/lib/contexts/CartContext";
import {
  CloseOutlined,
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { Button, Card, Modal, Tabs, Tag, Typography } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default function CartModal() {
  const { t } = useTranslation("common");
  const {
    cartItems,
    orderedItems,
    cartModalOpen,
    activeCartTab,
    cartItemCount,
    totalCartAmount,
    totalOrderAmount,
    removeFromCart,
    updateQuantity,
    confirmOrder,
    requestPayment,
    closeCartModal,
    setActiveCartTab,
  } = useCart();

  // Group items by category
  const cartCategories = useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string }>();
    cartItems.forEach((item) => {
      if (item.categoryId && item.categoryName) {
        categoryMap.set(item.categoryId, {
          id: item.categoryId,
          name: item.categoryName,
        });
      }
    });
    return Array.from(categoryMap.values());
  }, [cartItems]);

  const orderedCategories = useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string }>();
    orderedItems.forEach((item) => {
      if (item.categoryId && item.categoryName) {
        categoryMap.set(item.categoryId, {
          id: item.categoryId,
          name: item.categoryName,
        });
      }
    });
    return Array.from(categoryMap.values());
  }, [orderedItems]);

  const formatPrice = (price: string | number) => {
    const priceNum = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("vi-VN").format(priceNum);
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
  };

  return (
    <Modal
      open={cartModalOpen}
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
          gap: 10,
        }}>
        {/* Decorative blur */}
        <div
          style={{
            position: "absolute",
            top: -50,
            left: -50,
            width: 150,
            height: 150,
            background: "#FF380B",
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
              background: "rgba(255,56,11,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,56,11,0.25)",
            }}>
            <ShoppingCartOutlined style={{ color: "#FF380B", fontSize: 20 }} />
          </div>
          <div>
            <Text
              style={{
                color: "#FF380B",
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
                      gap: 10,
                      flex: 1,
                      minHeight: 0,
                      overflowY: "auto",
                      paddingRight: 2,
                      paddingBottom: 6,
                      maxHeight: "50vh",
                    }}>
                    {cartItems.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "60px 20px",
                          color: "#666",
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
                        {cartCategories.map((cat) => {
                          const items = cartItems.filter(
                            (item) => item.categoryId === cat.id,
                          );
                          if (items.length === 0) return null;
                          return (
                            <div key={cat.id}>
                              <Text
                                style={{
                                  color: "#FF380B",
                                  fontSize: 16,
                                  fontWeight: 700,
                                  display: "block",
                                  marginBottom: 10,
                                  textTransform: "uppercase",
                                  letterSpacing: 1,
                                  marginTop: 10,
                                }}>
                                {cat.name}
                              </Text>
                              {items.map((item) => (
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
                                      gap: 10,
                                      marginBottom: 6,
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
                                            "1px solid rgba(255,255,255,0.1)",
                                          flexShrink: 0,
                                        }}
                                      />
                                    )}
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        flex: 1,
                                      }}>
                                      <div style={{ flex: 1 }}>
                                        <Text
                                          style={{
                                            color: "#fff",
                                            fontSize: 14,
                                            fontWeight: 600,
                                            display: "block",
                                            marginBottom: 2,
                                          }}>
                                          {item.name}
                                        </Text>
                                        <Text
                                          style={{
                                            color: "#FF380B",
                                            fontSize: 13,
                                            fontWeight: 600,
                                          }}>
                                          {formatPrice(item.price)}đ
                                        </Text>
                                      </div>
                                      <Button
                                        type="text"
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeFromCart(item.id)}
                                        style={{
                                          color: "#ff4d4f",
                                          flexShrink: 0,
                                        }}
                                        size="small"
                                      />
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      justifyContent: "space-between",
                                    }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                      }}>
                                      <Button
                                        type="text"
                                        icon={<MinusOutlined />}
                                        onClick={() =>
                                          updateQuantity(
                                            item.id,
                                            item.quantity - 1,
                                          )
                                        }
                                        style={{
                                          color: "var(--text)",
                                          border:
                                            "1px solid var(--border)",
                                        }}
                                        size="small"
                                      />
                                      <Text
                                        style={{
                                          color: "var(--text)",
                                          fontSize: 14,
                                          fontWeight: 600,
                                          minWidth: 30,
                                          textAlign: "center",
                                        }}>
                                        {item.quantity}
                                      </Text>
                                      <Button
                                        type="text"
                                        icon={<PlusOutlined />}
                                        onClick={() =>
                                          updateQuantity(
                                            item.id,
                                            item.quantity + 1,
                                          )
                                        }
                                        style={{
                                          color: "var(--text)",
                                          border:
                                            "1px solid var(--border)",
                                        }}
                                        size="small"
                                      />
                                    </div>
                                    <Text
                                      style={{
                                        color: "var(--text)",
                                        fontSize: 14,
                                        fontWeight: 600,
                                      }}>
                                      {formatPrice(
                                        (
                                          parseFloat(item.price) * item.quantity
                                        ).toString(),
                                      )}
                                      đ
                                    </Text>
                                  </div>
                                </Card>
                              ))}
                            </div>
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
                      style={{
                        background: "#FF380B",
                        border: "none",
                        height: 48,
                        fontWeight: 700,
                        fontSize: 16,
                        marginTop: 16,
                        boxShadow: "0 10px 25px rgba(255,56,11,0.35)",
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
                      gap: 10,
                      flex: 1,
                      minHeight: 0,
                      overflowY: "auto",
                      paddingRight: 2,
                      paddingBottom: 6,
                      maxHeight: "50vh",
                    }}>
                    {orderedItems.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "60px 20px",
                          color: "#666",
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
                        {orderedCategories.map((cat) => {
                          const items = orderedItems.filter(
                            (item) => item.categoryId === cat.id,
                          );
                          if (items.length === 0) return null;
                          return (
                            <div key={cat.id}>
                              <Text
                                style={{
                                  color: "#FF380B",
                                  fontSize: 16,
                                  fontWeight: 700,
                                  display: "block",
                                  marginBottom: 10,
                                  textTransform: "uppercase",
                                  letterSpacing: 1,
                                  marginTop: 10,
                                }}>
                                {cat.name}
                              </Text>
                              {items.map((item) => (
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
                                      gap: 10,
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
                                            "1px solid rgba(255,255,255,0.1)",
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
                                        gap: 8,
                                      }}>
                                      <div style={{ flex: 1 }}>
                                        <Text
                                          style={{
                                            color: "#fff",
                                            fontSize: 14,
                                            fontWeight: 600,
                                            display: "block",
                                            marginBottom: 2,
                                          }}>
                                          {item.name}
                                        </Text>
                                        <Text
                                          style={{
                                            color: "#FF380B",
                                            fontSize: 13,
                                            fontWeight: 600,
                                          }}>
                                          {formatPrice(item.price)}đ x{" "}
                                          {item.quantity}
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
                                          color="orange"
                                          style={{ margin: 0, fontSize: 11 }}>
                                          {t(
                                            "customer_page.cart_modal.status_preparing",
                                          )}
                                        </Tag>
                                        <Text
                                          style={{
                                            color: "#fff",
                                            fontSize: 14,
                                            fontWeight: 600,
                                          }}>
                                          {formatPrice(
                                            (
                                              parseFloat(item.price) *
                                              item.quantity
                                            ).toString(),
                                          )}
                                          đ
                                        </Text>
                                      </div>
                                    </div>
                                  </div>
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
                            color: "#FF380B",
                            fontSize: 22,
                            fontWeight: 800,
                          }}>
                          {formatVND(totalOrderAmount)}
                        </div>
                      </div>
                      <Button
                        block
                        danger
                        size="large"
                        onClick={requestPayment}
                        style={{
                          height: 48,
                          fontWeight: 700,
                          fontSize: 16,
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
  );
}
