"use client";

import NotificationSystem from "@/components/notifications/NotificationSystem";
import menuService from "@/lib/services/menuService";
import type {
  CartItem,
  Category,
  CategoryWithDishes,
  MenuItem,
} from "@/lib/types/menu";
import {
  ArrowLeftOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownOutlined,
  FireOutlined,
  HeartFilled,
  MinusOutlined,
  PlusOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  StarFilled,
} from "@ant-design/icons";
import {
  Affix,
  Button,
  Card,
  Col,
  Collapse,
  ConfigProvider,
  Input,
  Modal,
  Row,
  Spin,
  Typography,
  message,
  theme,
} from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

export default function MenuPage() {
  const { t } = useTranslation("common");
  const router = useRouter();

  // State management
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [foodDetailModalOpen, setFoodDetailModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<MenuItem | null>(null);
  const [searchText, setSearchText] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  // API state
  const [dishes, setDishes] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch menu data using service
      const menuData = await menuService.getMenu();

      if (menuData && Array.isArray(menuData)) {
        // Extract all dishes from all categories
        const allDishes: MenuItem[] = [];
        const extractedCategories: Category[] = [];

        menuData.forEach((categoryGroup) => {
          // Add category to the list
          if (categoryGroup.categoryId && categoryGroup.categoryName) {
            extractedCategories.push({
              id: categoryGroup.categoryId,
              name: categoryGroup.categoryName,
            });
          }

          // Map dishes from this category
          if (categoryGroup.items && Array.isArray(categoryGroup.items)) {
            categoryGroup.items.forEach((item) => {
              allDishes.push({
                id: item.id?.toString() || "",
                name: item.name || "",
                price: item.price?.toString() || "0",
                description:
                  item.description || t("menu_page.default_food_desc"),
                image: item.imageUrl ?? undefined,
                categoryId: item.categoryId || categoryGroup.categoryId || "",
                categoryName:
                  item.categoryName || categoryGroup.categoryName || "",
                isPopular: item.isPopular || false,
                isBestSeller: item.isBestSeller || false,
                isSpicy: item.isSpicy || false,
                isVegetarian: item.isVegetarian || false,
                tags: [
                  item.isSpicy && "spicy",
                  item.isVegetarian && "vegan",
                  item.isBestSeller && "best",
                ].filter(Boolean) as string[],
                note: item.isBestSeller
                  ? t("menu_page.best_seller")
                  : undefined,
              });
            });
          }
        });

        setDishes(allDishes);
        setCategories(extractedCategories);
      }
    } catch (err) {
      console.error("Failed to fetch menu data:", err);
      setError(t("menu_page.error_load"));
    } finally {
      setLoading(false);
    }
  };

  // Group dishes by category for display
  const categoriesWithDishes = useMemo<CategoryWithDishes[]>(() => {
    let filteredDishes = dishes;

    // Filter by search text
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filteredDishes = dishes.filter((d) =>
        d.name.toLowerCase().includes(lowerSearch),
      );
    }

    return categories
      .map((cat) => ({
        category: cat,
        dishes: filteredDishes.filter((d) => d.categoryId === cat.id),
      }))
      .filter((group) => group.dishes.length > 0);
  }, [dishes, categories, searchText]);

  const cartItemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const handleAddToCart = (item: MenuItem) => {
    setCartItems((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        );
      } else {
        return [
          ...prev,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            category: "food",
            categoryId: item.categoryId || "",
            image: item.image,
          },
        ];
      }
    });
    messageApi.success(t("menu_page.cart.added_success", { name: item.name }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    messageApi.success(t("menu_page.cart.removed_success"));
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace(/[.,]/g, ""));
      return total + price * item.quantity;
    }, 0);
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
  };

  const formatPrice = (price: string | number) => {
    const priceNum = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("vi-VN").format(priceNum);
  };

  // Loading state
  if (loading) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#FF380B",
          },
        }}>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#050505",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
          }}>
          <Spin size="large" />
          <Text style={{ color: "#999" }}>{t("menu_page.loading")}</Text>
        </div>
      </ConfigProvider>
    );
  }

  // Error state
  if (error) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#FF380B",
          },
        }}>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#050505",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
            padding: 24,
          }}>
          <Text style={{ color: "#ff4d4f", fontSize: 18 }}>{error}</Text>
          <Button type="primary" onClick={fetchMenuData}>
            {t("menu_page.retry")}
          </Button>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <>
      {contextHolder}
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#FF380B",
            fontFamily:
              "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            borderRadius: 12,
            controlHeight: 45, // Increase input/select height for easier tap
          },
          components: {
            Modal: {
              contentBg: "transparent",
              boxShadow: "none",
            },
            Collapse: {
              headerBg: "transparent",
              contentBg: "transparent",
              headerPadding: "16px 20px",
              colorBorder: "transparent",
              contentPadding: "5px",
            },
            Select: {
              colorBgContainer: "rgba(255,255,255,0.08)",
              colorBorder: "transparent",
              selectorBg: "rgba(255,255,255,0.08)",
              optionSelectedBg: "rgba(255, 56, 11, 0.2)",
              colorTextPlaceholder: "#a6a6a6",
            },
            Input: {
              colorBgContainer: "rgba(255,255,255,0.04)",
              colorBorder: "transparent",
              activeBorderColor: "#FF380B",
            },
          },
        }}>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#050505",
            backgroundImage: `
            radial-gradient(circle at 0% 0%, rgba(255, 56, 11, 0.1), transparent 40%),
            radial-gradient(circle at 100% 100%, rgba(255, 56, 11, 0.05), transparent 40%)
          `,
            paddingBottom: 80,
          }}>
          {/* --- Hero Section --- */}
          <div
            style={{ position: "relative", height: 280, overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "url('/images/menu/banner.png') center/cover, #1f1f1f",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.3), #050505)",
              }}
            />

            {/* Back Button */}
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/customer")}
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                height: 40,
                width: 40,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            />

            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: 16,
                right: 16,
                maxWidth: 1200,
                margin: "0 auto",
              }}>
              <Text
                style={{
                  color: "#FF380B",
                  letterSpacing: 2,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}>
                {t("menu_page.logo_title")}
              </Text>
              <Title level={2} style={{ margin: "4px 0 0", color: "#fff" }}>
                {t("menu_page.title")}
              </Title>
            </div>
          </div>

          {/* --- Search Bar --- */}
          <Affix offsetTop={0}>
            <div
              style={{
                background: "rgba(5, 5, 5, 0.9)",
                backdropFilter: "blur(16px)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                padding: "12px 16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                zIndex: 100,
              }}>
              <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <Input
                  size="large"
                  placeholder="Search items..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                  }}
                />
              </div>
            </div>
          </Affix>

          {/* --- Main Content --- */}
          <div
            style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
            {/* Display categories with their dishes */}
            <Collapse
              defaultActiveKey={[]}
              expandIconPlacement="start"
              expandIcon={({ isActive }) => (
                <DownOutlined
                  style={{
                    color: "#FF380B",
                    fontSize: 14,
                    transform: isActive ? "rotate(0deg)" : "rotate(-90deg)",
                    transition: "transform 0.3s ease",
                  }}
                />
              )}
              style={{
                background: "transparent",
                border: "none",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
              items={categoriesWithDishes.map((categoryGroup) => ({
                key: categoryGroup.category.id,
                label: (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}>
                      <Title
                        level={4}
                        style={{
                          color: "#fff",
                          margin: 0,
                          fontSize: 18,
                          fontWeight: 600,
                          letterSpacing: "0.2px",
                        }}>
                        {categoryGroup.category.name}
                      </Title>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 11,
                          fontWeight: 500,
                        }}>
                        {categoryGroup.dishes.length} {t("menu_page.items")}
                      </Text>
                    </div>
                  </div>
                ),
                style: {
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: 16,
                  border: "1px solid rgba(255, 255, 255, 0.04)",
                  overflow: "hidden",
                  backdropFilter: "blur(10px)",
                  marginBottom: 0,
                },
                children: (
                  <div style={{ padding: "0 4px 12px 4px" }}>
                    <Row gutter={[10, 10]}>
                      {categoryGroup.dishes.map((item, index) => (
                        <Col xs={24} sm={12} key={`${item.id}-${index}`}>
                          <Card
                            hoverable
                            variant="borderless"
                            onClick={() => {
                              setSelectedFood(item);
                              setFoodDetailModalOpen(true);
                            }}
                            style={{
                              background:
                                "linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(20, 20, 20, 0.9) 100%)",
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.06)",
                              overflow: "hidden",
                              transition: "all 0.3s ease",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                            }}
                            styles={{
                              body: { padding: 0 },
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-1px)";
                              e.currentTarget.style.boxShadow =
                                "0 6px 20px rgba(255, 56, 11, 0.1)";
                              e.currentTarget.style.borderColor =
                                "rgba(255, 56, 11, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow =
                                "0 2px 8px rgba(0, 0, 0, 0.2)";
                              e.currentTarget.style.borderColor =
                                "rgba(255,255,255,0.06)";
                            }}>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 10,
                                padding: 10,
                                alignItems: "center",
                              }}>
                              {/* Image Section */}
                              <div
                                style={{
                                  flexShrink: 0,
                                  width: 72,
                                  height: 72,
                                  position: "relative",
                                }}>
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      borderRadius: 8,
                                      border:
                                        "1px solid rgba(255,255,255,0.08)",
                                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      borderRadius: 8,
                                      background:
                                        "linear-gradient(135deg, #1f1f1f 0%, #141414 100%)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#444",
                                      border:
                                        "1px dashed rgba(255,255,255,0.1)",
                                      overflow: "hidden",
                                      position: "relative",
                                    }}>
                                    <div style={{ textAlign: "center" }}></div>
                                  </div>
                                )}
                              </div>

                              {/* Content Section */}
                              <div
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  minWidth: 0,
                                  gap: 10,
                                }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: 600,
                                      color: "#fff",
                                      display: "block",
                                      marginBottom: 4,
                                      lineHeight: 1.3,
                                    }}>
                                    {item.name}
                                  </Text>
                                  <Text
                                    style={{
                                      color: "#FF380B",
                                      fontWeight: 700,
                                      fontSize: 15,
                                      display: "block",
                                    }}>
                                    {formatPrice(item.price)}đ
                                  </Text>

                                  {item.tags && item.tags.length > 0 && (
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 4,
                                        flexWrap: "wrap",
                                        marginTop: 4,
                                      }}>
                                      {item.tags.slice(0, 2).map((tag, idx) => {
                                        let icon = <StarFilled />;
                                        let color = "#FF380B";
                                        let bg = "rgba(255, 56, 11, 0.1)";
                                        let label = t(`menu_page.tags.${tag}`, {
                                          defaultValue: tag,
                                        });

                                        if (tag === "spicy") {
                                          icon = <FireOutlined />;
                                          color = "#ff4d4f";
                                          bg = "rgba(255, 77, 79, 0.1)";
                                        } else if (tag === "vegan") {
                                          icon = <HeartFilled />;
                                          color = "#52c41a";
                                          bg = "rgba(82, 196, 26, 0.1)";
                                        } else if (tag === "best") {
                                          icon = <StarFilled />;
                                          color = "#faad14";
                                          bg = "rgba(250, 173, 20, 0.1)";
                                        }

                                        return (
                                          <span
                                            key={idx}
                                            style={{
                                              fontSize: 9,
                                              padding: "1px 6px",
                                              borderRadius: 6,
                                              background: bg,
                                              color: color,
                                              border: `1px solid ${color}`,
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 3,
                                              fontWeight: 600,
                                            }}>
                                            <span style={{ fontSize: 9 }}>
                                              {icon}
                                            </span>{" "}
                                            {label}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                <div suppressHydrationWarning>
                                  <Button
                                    type="primary"
                                    icon={
                                      <PlusOutlined style={{ fontSize: 12 }} />
                                    }
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToCart(item);
                                    }}
                                    style={{
                                      background:
                                        "linear-gradient(135deg, #FF380B 0%, #ff5722 100%)",
                                      border: "none",
                                      width: 32,
                                      height: 32,
                                      minWidth: 32,
                                      padding: 0,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                      borderRadius: 8,
                                      boxShadow:
                                        "0 4px 10px rgba(255, 56, 11, 0.3)",
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ),
              }))}
            />

            {/* Floating Cart Button */}
            <div
              onClick={() => setCartModalOpen(true)}
              style={{
                position: "fixed",
                bottom: 24,
                right: 24,
                zIndex: 99,
                background: "#FF380B",
                width: 56,
                height: 56,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 30px rgba(255, 56, 11, 0.5)",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}>
              <ShoppingCartOutlined style={{ color: "#fff", fontSize: 24 }} />
              {cartItemCount > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    background: "white",
                    color: "#FF380B",
                    fontSize: 12,
                    fontWeight: "bold",
                    padding: "2px 6px",
                    borderRadius: 10,
                    border: "2px solid #FF380B",
                    minWidth: 20,
                    textAlign: "center",
                  }}>
                  {cartItemCount}
                </div>
              )}
            </div>

            {/* Cart Modal */}
            <Modal
              open={cartModalOpen}
              onCancel={() => setCartModalOpen(false)}
              footer={null}
              closeIcon={null}
              centered
              width="100%"
              style={{ maxWidth: 500, padding: 0 }}
              styles={{
                mask: {
                  backdropFilter: "blur(12px)",
                  background: "rgba(0,0,0,0.7)",
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
                  background:
                    "linear-gradient(160deg, #1f1f1f 0%, #0a0a0a 100%)",
                  borderRadius: 24,
                  padding: "18px 16px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9)",
                  overflow: "hidden",
                  maxHeight: "80vh",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}>
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

                <div
                  onClick={() => setCartModalOpen(false)}
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 10,
                    backdropFilter: "blur(4px)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                  <div style={{ color: "#888", fontSize: 14 }}>
                    <CloseOutlined />
                  </div>
                </div>

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
                    <ShoppingCartOutlined
                      style={{ color: "#FF380B", fontSize: 20 }}
                    />
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
                      {t("menu_page.cart.title")}
                    </Text>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: 700,
                        marginTop: -2,
                      }}>
                      {t("menu_page.cart.items_count", {
                        count: cartItemCount,
                      })}
                    </div>
                  </div>
                </div>

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
                  }}>
                  {cartItems.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "60px 20px",
                        color: "#666",
                      }}>
                      <ShoppingCartOutlined
                        style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}
                      />
                      <Text
                        style={{
                          color: "#888",
                          fontSize: 14,
                          display: "block",
                        }}>
                        {t("menu_page.cart.empty")}
                      </Text>
                    </div>
                  ) : (
                    <>
                      {categories.map((cat) => {
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
                                  background:
                                    "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.25) 100%)",
                                  border: "1px solid rgba(255,255,255,0.06)",
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
                                      onClick={() =>
                                        handleRemoveFromCart(item.id)
                                      }
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
                                        handleUpdateQuantity(
                                          item.id,
                                          item.quantity - 1,
                                        )
                                      }
                                      style={{
                                        color: "#fff",
                                        border:
                                          "1px solid rgba(255,255,255,0.2)",
                                      }}
                                      size="small"
                                    />
                                    <Text
                                      style={{
                                        color: "#fff",
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
                                        handleUpdateQuantity(
                                          item.id,
                                          item.quantity + 1,
                                        )
                                      }
                                      style={{
                                        color: "#fff",
                                        border:
                                          "1px solid rgba(255,255,255,0.2)",
                                      }}
                                      size="small"
                                    />
                                  </div>
                                  <Text
                                    style={{
                                      color: "#fff",
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
                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      paddingTop: 16,
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.25) 100%)",
                      borderRadius: 16,
                      padding: 16,
                      marginTop: 14,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                    }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}>
                      <div>
                        <Text
                          style={{
                            color: "#888",
                            fontSize: 12,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}>
                          {t("menu_page.cart.total")}
                        </Text>
                        <div
                          style={{
                            color: "#FF380B",
                            fontSize: 22,
                            fontWeight: 800,
                            marginTop: -2,
                          }}>
                          {formatVND(calculateTotal())}
                        </div>
                      </div>
                      <div
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 12,
                        }}>
                        {t("menu_page.cart.items_count", {
                          count: cartItemCount,
                        })}
                      </div>
                    </div>
                    <Button
                      type="primary"
                      block
                      size="large"
                      style={{
                        background: "#FF380B",
                        border: "none",
                        height: 48,
                        fontWeight: 700,
                        fontSize: 16,
                        boxShadow: "0 10px 25px rgba(255,56,11,0.35)",
                      }}>
                      {t("menu_page.cart.confirm")}
                    </Button>
                  </div>
                )}
              </div>
            </Modal>

            {/* Food Detail Modal */}
            <Modal
              open={foodDetailModalOpen}
              onCancel={() => setFoodDetailModalOpen(false)}
              footer={null}
              centered
              closeIcon={null}
              width="100%"
              style={{ maxWidth: 400, padding: 0 }}
              styles={{
                mask: {
                  backdropFilter: "blur(12px)",
                  background: "rgba(0,0,0,0.7)",
                },
                wrapper: {
                  background: "transparent",
                },
                body: {
                  background: "transparent",
                  padding: 0,
                },
              }}>
              {selectedFood && (
                <div
                  style={{
                    position: "relative",
                    background:
                      "linear-gradient(160deg, #1f1f1f 0%, #0a0a0a 100%)",
                    borderRadius: 24,
                    padding: "30px 24px",
                    overflow: "hidden",
                  }}>
                  {/* Decoration Glow */}
                  <div
                    style={{
                      position: "absolute",
                      top: -50,
                      left: -50,
                      width: 150,
                      height: 150,
                      background: "#FF380B",
                      filter: "blur(80px)",
                      opacity: 0.15,
                      pointerEvents: "none",
                    }}
                  />

                  {/* Custom Close Button */}
                  <div
                    onClick={() => setFoodDetailModalOpen(false)}
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      zIndex: 10,
                      backdropFilter: "blur(4px)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}>
                    <div style={{ color: "#888", fontSize: 14 }}>
                      <CloseOutlined />
                    </div>
                  </div>

                  {/* --- Content Body --- */}
                  <div style={{ position: "relative", zIndex: 1 }}>
                    {/* Food Image Card */}
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "4/3", // Better image aspect ratio
                        borderRadius: 16,
                        overflow: "hidden",
                        marginBottom: 20,
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                        position: "relative",
                      }}>
                      {selectedFood.image ? (
                        <img
                          src={selectedFood.image}
                          alt={selectedFood.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "#141414",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                          <FireOutlined
                            style={{ fontSize: 40, color: "#FF380B" }}
                          />
                        </div>
                      )}

                      {/* Note Badge on Image (if exists) */}
                      {selectedFood.note && (
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            background: "rgba(255, 193, 7, 0.9)",
                            color: "#000",
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            backdropFilter: "blur(4px)",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                          }}>
                          {selectedFood.note}
                        </div>
                      )}
                    </div>

                    {/* Header Info */}
                    <div style={{ marginBottom: 16 }}>
                      <Title
                        level={3}
                        style={{
                          color: "#fff",
                          margin: "0 0 8px 0",
                          fontSize: 22,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                        }}>
                        {selectedFood.name}
                      </Title>

                      {/* Tags */}
                      {selectedFood.tags && selectedFood.tags.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                          }}>
                          {selectedFood.tags.map((tag, idx) => {
                            let icon = <StarFilled />;
                            let color = "#FF380B";
                            let bg = "rgba(255, 56, 11, 0.1)";
                            let label = t("menu_page.tags." + tag, {
                              defaultValue: tag,
                            });

                            if (tag === "spicy") {
                              icon = <FireOutlined />;
                              color = "#ff4d4f";
                              bg = "rgba(255, 77, 79, 0.1)";
                            } else if (tag === "vegan") {
                              icon = <HeartFilled />;
                              color = "#52c41a";
                              bg = "rgba(82, 196, 26, 0.1)";
                            } else if (tag === "best") {
                              icon = <StarFilled />;
                              color = "#faad14";
                              bg = "rgba(250, 173, 20, 0.1)";
                            }

                            return (
                              <span
                                key={idx}
                                style={{
                                  background: bg,
                                  color: color,
                                  padding: "4px 10px",
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  border: `1px solid ${color}`,
                                  textTransform: "capitalize",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                }}>
                                {icon}
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div
                      style={{
                        marginBottom: 24,
                        background: "rgba(255,255,255,0.02)",
                        padding: 12,
                        borderRadius: 12,
                      }}>
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.6)",
                          fontSize: 14,
                          lineHeight: 1.6,
                        }}>
                        {selectedFood.description ||
                          t("menu_page.default_food_desc")}
                      </Text>
                    </div>

                    {/* Action Bar (Price + Button) */}
                    <div
                      style={{
                        background: "rgba(20,20,20,0.6)",
                        backdropFilter: "blur(10px)",
                        borderRadius: 16,
                        padding: "12px 16px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                      <div>
                        <Text
                          style={{
                            color: "#888",
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            display: "block",
                            marginBottom: 2,
                          }}>
                          {t("menu_page.detail_modal.price")}
                        </Text>
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 20,
                            fontWeight: 700,
                          }}>
                          {selectedFood.price}{" "}
                          <span style={{ fontSize: 14, color: "#FF380B" }}>
                            đ
                          </span>
                        </Text>
                      </div>

                      {/* Add/Update Quantity Logic */}
                      {(() => {
                        const cartItem = cartItems.find(
                          (item) => item.name === selectedFood.name,
                        );
                        if (cartItem) {
                          return (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                background: "rgba(255,255,255,0.05)",
                                padding: "4px 6px",
                                borderRadius: 12,
                                border: "1px solid rgba(255,255,255,0.1)",
                              }}>
                              <Button
                                icon={
                                  <MinusOutlined style={{ fontSize: 12 }} />
                                }
                                onClick={() =>
                                  handleUpdateQuantity(
                                    selectedFood.name,
                                    cartItem.quantity - 1,
                                  )
                                }
                                size="small"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#fff",
                                  width: 28,
                                  height: 28,
                                }}
                              />
                              <Text
                                style={{
                                  color: "#FF380B",
                                  fontSize: 16,
                                  fontWeight: 700,
                                  minWidth: 20,
                                  textAlign: "center",
                                }}>
                                {cartItem.quantity}
                              </Text>
                              <Button
                                icon={<PlusOutlined style={{ fontSize: 12 }} />}
                                onClick={() =>
                                  handleUpdateQuantity(
                                    selectedFood.name,
                                    cartItem.quantity + 1,
                                  )
                                }
                                size="small"
                                style={{
                                  background: "#FF380B",
                                  border: "none",
                                  color: "#fff",
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  boxShadow: "0 4px 10px rgba(255,56,11,0.3)",
                                }}
                              />
                            </div>
                          );
                        } else {
                          return (
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={() => handleAddToCart(selectedFood)}
                              style={{
                                background: "#FF380B",
                                border: "none",
                                height: 44,
                                padding: "0 24px",
                                borderRadius: 12,
                                fontWeight: 600,
                                fontSize: 14,
                                boxShadow: "0 4px 12px rgba(255,56,11,0.3)",
                              }}>
                              {t("menu_page.detail_modal.add_to_cart")}
                            </Button>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </Modal>
          </div>
        </div>
      </ConfigProvider>
      <NotificationSystem />
    </>
  );
}
