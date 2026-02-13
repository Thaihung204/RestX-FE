"use client";

import CartModal from "@/components/customer/CartModal";
import CustomerFooter from "@/components/customer/CustomerFooter";
import NotificationSystem from "@/components/notifications/NotificationSystem";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useCart } from "@/lib/contexts/CartContext";
import { useTheme } from "@/lib/hooks/useTheme";
import customerService, {
    CustomerResponseDto,
} from "@/lib/services/customerService";
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
    FireOutlined,
    HeartFilled,
    MinusOutlined,
    PlusOutlined,
    SearchOutlined,
    StarFilled,
} from "@ant-design/icons";
import {
    Affix,
    Button,
    Card,
    Col,
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

export default function MenuPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { mode: themeMode } = useTheme();
  const { user } = useAuth();
  const {
    cartItems,
    addToCart: addToCartContext,
    updateQuantity,
    openCartModal,
    cartModalOpen,
  } = useCart();

  // Ref to track if data has been fetched
  const hasFetchedData = useRef(false);

  // State management
  const [foodDetailModalOpen, setFoodDetailModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<MenuItem | null>(null);
  const [searchText, setSearchText] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  // API state
  const [dishes, setDishes] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Customer profile state
  const [customerProfile, setCustomerProfile] =
    useState<CustomerResponseDto | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Load customer profile
  const loadCustomerProfile = useCallback(async () => {
    if (!user) return;

    try {
      let profile = null;

      if (user.customerId) {
        profile = await customerService.getCustomerProfile(user.customerId);
      } else if (user.email) {
        profile = await customerService.getCustomerByEmail(user.email);
      }

      if (profile) {
        setCustomerProfile(profile);
        setCustomerName(profile.fullName);
        setPhoneNumber(profile.phoneNumber || "");
        setAvatarUrl(
          `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=4F46E5&color=fff`,
        );
      }
    } catch (error) {
      console.error("Failed to load customer profile:", error);
    }
  }, [user]);

  const fetchMenuData = useCallback(async () => {
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
                isBestSeller:
                  item.isBestSeller ||
                  item.name === "Bún bò Huế" ||
                  item.name === "Cà phê sữa đá",
                // item.isBestSeller || false,
                isSpicy:
                  item.isSpicy ||
                  item.name?.toLowerCase().includes("bún bò") ||
                  item.name?.toLowerCase().includes("cay") ||
                  false,
                isVegetarian:
                  item.isVegetarian ||
                  item.name?.toLowerCase().includes("chay") ||
                  item.name?.toLowerCase().includes("rau") ||
                  false,
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
  }, [t]);

  // Fetch data from API
  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchMenuData();
      loadCustomerProfile();
    }
  }, []); // Empty dependency array - only run once on mount

  // Re-fetch customer profile when user changes (login/logout)
  useEffect(() => {
    if (hasFetchedData.current && user) {
      loadCustomerProfile();
    }
  }, [user?.customerId, user?.email]); // Only when user ID or email changes

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

  const handleAddToCart = (item: MenuItem) => {
    const cartItem: CartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      category: "food",
      categoryId: item.categoryId || "",
      categoryName: item.categoryName,
      image: item.image,
    };
    addToCartContext(cartItem);
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
          algorithm:
            themeMode === "dark"
              ? theme.darkAlgorithm
              : theme.defaultAlgorithm,
          token: {
            colorPrimary: "var(--primary)",
          },
        }}>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "var(--bg-base)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
          }}>
          <Spin size="large" />
          <Text style={{ color: "var(--text-muted)" }}>
            {t("menu_page.loading")}
          </Text>
        </div>
      </ConfigProvider>
    );
  }

  // Error state
  if (error) {
    return (
      <ConfigProvider
        theme={{
          algorithm:
            themeMode === "dark"
              ? theme.darkAlgorithm
              : theme.defaultAlgorithm,
          token: {
            colorPrimary: "var(--primary)",
          },
        }}>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "var(--bg-base)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
            padding: 24,
          }}>
          <Text style={{ color: "var(--danger)", fontSize: 18 }}>{error}</Text>
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
          algorithm:
            themeMode === "dark"
              ? theme.darkAlgorithm
              : theme.defaultAlgorithm,
          token: {
            colorPrimary: "var(--primary)",
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
              colorBgContainer: "var(--surface)",
              colorBorder: "var(--border)",
              selectorBg: "var(--surface)",
              optionSelectedBg: "var(--primary-soft)",
              colorTextPlaceholder: "var(--text-muted)",
            },
            Input: {
              colorBgContainer: "var(--surface)",
              colorBorder: "var(--border)",
              activeBorderColor: "var(--primary)",
            },
          },
        }}>
        <div
          style={{
            minHeight: "100vh",
            background: "var(--bg-base)",
            backgroundImage: `
            radial-gradient(circle at 0% 0%, var(--primary-soft), transparent 45%),
            radial-gradient(circle at 100% 100%, var(--primary-faint), transparent 45%)
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
                  "url('/images/menu/banner.png') center/cover, var(--surface)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, var(--modal-overlay), var(--bg-base))",
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
                background: "var(--modal-overlay)",
                backdropFilter: "blur(8px)",
                border: "1px solid var(--border)",
                color: "var(--text)",
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
                  color: "var(--primary)",
                  letterSpacing: 2,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}>
                {t("menu_page.logo_title")}
              </Text>
              <Title
                level={2}
                style={{ margin: "4px 0 0", color: "var(--text)" }}>
                {t("menu_page.title")}
              </Title>
            </div>
          </div>

          {/* --- Search Bar --- */}
          <Affix offsetTop={0}>
            <div
              style={{
                background: "var(--bg-base)",
                backdropFilter: "blur(16px)",
                borderBottom: "1px solid var(--border)",
                padding: "12px 16px",
                boxShadow: "var(--shadow-md)",
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
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                />
              </div>
            </div>
          </Affix>

          {/* --- Main Content --- */}
          <div
            style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
            {/* Hiển thị phẳng các category và dishes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {categoriesWithDishes.map((categoryGroup) => (
                <div
                  key={categoryGroup.category.id}
                  id={categoryGroup.category.id}>
                  {/* Tiêu đề Category */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                      padding: "0 4px",
                      borderLeft: "4px solid var(--primary)",
                      paddingLeft: 12,
                    }}>
                    <Title
                      level={3}
                      style={{
                        color: "var(--text)",
                        margin: 0,
                        fontSize: 22,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                      }}>
                      {categoryGroup.category.name}
                    </Title>
                    <Text
                      style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {categoryGroup.dishes.length} {t("menu_page.items")}
                    </Text>
                  </div>

                  {/* Danh sách món ăn thuộc Category */}
                  <Row gutter={[16, 16]}>
                    {categoryGroup.dishes.map((item, index) => (
                      <Col
                        xs={24}
                        sm={12}
                        md={12}
                        lg={8}
                        key={`${item.id}-${index}`}>
                        <Card
                          hoverable
                          variant="borderless"
                          onClick={() => {
                            setSelectedFood(item);
                            setFoodDetailModalOpen(true);
                          }}
                          style={{
                            background: "var(--card)",
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                            overflow: "hidden",
                            transition: "all 0.3s ease",
                            boxShadow: "var(--shadow-sm)",
                          }}
                          styles={{ body: { padding: 0 } }}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              gap: 12,
                              padding: 12,
                              alignItems: "center",
                            }}>
                            {/* Image Section */}
                            <div
                              style={{
                                flexShrink: 0,
                                width: 85,
                                height: 85,
                                position: "relative",
                              }}>
                              {item.isBestSeller && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    background: "#FFC107",
                                    color: "#000",
                                    padding: "2px 6px",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    borderBottomRightRadius: 8,
                                    zIndex: 1,
                                  }}>
                                  {t("menu_page.best_seller", "Best Seller")}
                                </div>
                              )}
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: 12,
                                    border: "1px solid var(--stroke-subtle)",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: 12,
                                    background: "var(--surface-subtle)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}>
                                  <FireOutlined
                                    style={{
                                      color: "var(--text-muted)",
                                      fontSize: 24,
                                    }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Content Section */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontWeight: 600,
                                  color: "var(--text)",
                                  display: "block",
                                  marginBottom: 4,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}>
                                {item.name}
                              </Text>
                              <Text
                                style={{
                                  color: "var(--primary)",
                                  fontWeight: 700,
                                  fontSize: 16,
                                  display: "block",
                                }}>
                                {formatPrice(item.price)}đ
                              </Text>

                              {/* Tags mini */}
                              <div
                                style={{
                                  display: "flex",
                                  gap: 4,
                                  marginTop: 6,
                                }}>
                                {item.isSpicy && (
                                  <FireOutlined
                                    style={{ color: "var(--danger)", fontSize: 12 }}
                                  />
                                )}
                                {item.isVegetarian && (
                                  <HeartFilled
                                    style={{ color: "var(--success)", fontSize: 12 }}
                                  />
                                )}
                                {item.isBestSeller && (
                                  <StarFilled
                                    style={{ color: "var(--warning)", fontSize: 12 }}
                                  />
                                )}
                              </div>
                            </div>

                            {/* Quick Add Button */}
                            <Button
                              type="primary"
                              shape="circle"
                              icon={<PlusOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(item);
                              }}
                              style={{
                                background: "var(--primary)",
                                border: "none",
                                boxShadow: "0 4px 10px var(--primary-glow)",
                              }}
                            />
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              ))}
            </div>

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
                  background: "var(--modal-overlay)",
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
                    background: "var(--card)",
                    borderRadius: 20,
                    padding: "30px 24px",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-lg)",
                  }}>
                  {/* Decoration Glow */}
                  <div
                    style={{
                      position: "absolute",
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      background: "var(--decoration-glow)",
                      filter: "blur(60px)",
                      borderRadius: "50%",
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
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-md)",
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
                            background: "var(--surface)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                          <FireOutlined
                            style={{ fontSize: 40, color: "var(--primary)" }}
                          />
                        </div>
                      )}

                      {/* Best Seller Badge on Image (if exists) */}
                      {selectedFood.isBestSeller && (
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            background: "var(--warning)",
                            color: "var(--text-on-warning)",
                            padding: "6px 12px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            backdropFilter: "blur(4px)",
                            boxShadow: "var(--shadow-sm)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}>
                          <StarFilled style={{ fontSize: 10 }} />
                          {t("menu_page.best_seller")}
                        </div>
                      )}
                    </div>

                    {/* Header Info */}
                    <div style={{ marginBottom: 16 }}>
                      <Title
                        level={3}
                        style={{
                          color: "var(--text)",
                          margin: "0 0 12px 0",
                          fontSize: 24,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                        }}>
                        {selectedFood.name}
                      </Title>

                      {/* Additional Info Tags */}
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginBottom: 8,
                        }}>
                        {selectedFood.isSpicy && (
                          <span
                            style={{
                              background: "var(--danger-soft)",
                              color: "var(--danger)",
                              padding: "6px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              border: "1px solid var(--danger-border)",
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}>
                            <FireOutlined />
                            {t("menu_page.tags.spicy", { defaultValue: "Spicy" })}
                          </span>
                        )}
                        {selectedFood.isVegetarian && (
                          <span
                            style={{
                              background: "var(--success-soft)",
                              color: "var(--success)",
                              padding: "6px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              border: "1px solid var(--success-border)",
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}>
                            <HeartFilled />
                            {t("menu_page.tags.vegan", { defaultValue: "Vegetarian" })}
                          </span>
                        )}
                      </div>

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
                            let color = "var(--primary)";
                            let bg = "var(--primary-soft)";
                            let label = t("menu_page.tags." + tag, {
                              defaultValue: tag,
                            });

                            if (tag === "spicy") {
                              icon = <FireOutlined />;
                              color = "var(--danger)";
                              bg = "var(--danger-soft)";
                            } else if (tag === "vegan") {
                              icon = <HeartFilled />;
                              color = "var(--success)";
                              bg = "var(--success-soft)";
                            } else if (tag === "best") {
                              icon = <StarFilled />;
                              color = "var(--warning)";
                              bg = "var(--warning-soft)";
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

                    {/* Additional Fields */}
                    {(selectedFood.isSpicy ||
                      selectedFood.isVegetarian ||
                      selectedFood.isBestSeller) && (
                      <div
                        style={{
                          marginBottom: 16,
                          display: "flex",
                          gap: 12,
                        }}>
                        {selectedFood.isBestSeller && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              color: "#faad14",
                              background: "rgba(250, 173, 20, 0.1)",
                              padding: "4px 8px",
                              borderRadius: 6,
                            }}>
                            <StarFilled />
                            <Text style={{ color: "inherit", fontWeight: 600 }}>
                              {t("menu_page.best_seller", "Best Seller")}
                            </Text>
                          </div>
                        )}
                        {selectedFood.isSpicy && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              color: "#ff4d4f",
                              background: "rgba(255, 77, 79, 0.1)",
                              padding: "4px 8px",
                              borderRadius: 6,
                            }}>
                            <FireOutlined />
                            <Text style={{ color: "inherit", fontWeight: 600 }}>
                              {t("menu_page.tags.spicy", "Spicy")}
                            </Text>
                          </div>
                        )}
                        {selectedFood.isVegetarian && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              color: "#52c41a",
                              background: "rgba(82, 196, 26, 0.1)",
                              padding: "4px 8px",
                              borderRadius: 6,
                            }}>
                            <HeartFilled />
                            <Text style={{ color: "inherit", fontWeight: 600 }}>
                              {t("menu_page.tags.vegan", "Vegetarian")}
                            </Text>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    <div
                      style={{
                        marginBottom: 24,
                        background: "var(--surface)",
                        padding: 16,
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                      }}>
                      <Text
                        style={{
                          color: "var(--text-muted)",
                          fontSize: 14,
                          lineHeight: 1.7,
                        }}>
                        {selectedFood.description ||
                          t("menu_page.default_food_desc")}
                      </Text>
                    </div>

                    {/* Action Bar (Price + Button) */}
                    <div
                      style={{
                        background: "var(--surface)",
                        backdropFilter: "blur(10px)",
                        borderRadius: 12,
                        padding: "16px 20px",
                        border: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                      <div>
                        <Text
                          style={{
                            color: "var(--text-muted)",
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
                            color: "var(--text)",
                            fontSize: 20,
                            fontWeight: 700,
                          }}>
                          {selectedFood.price}{" "}
                          <span
                            style={{ fontSize: 14, color: "var(--primary)" }}>
                            đ
                          </span>
                        </Text>
                      </div>

                      {/* Add/Update Quantity Logic */}
                      {(() => {
                        const cartItem = cartItems.find(
                          (item) => item.id === selectedFood.id,
                        );
                        if (cartItem) {
                          return (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                background: "var(--surface)",
                                padding: "4px 6px",
                                borderRadius: 12,
                                border: "1px solid var(--border)",
                              }}>
                              <Button
                                icon={
                                  <MinusOutlined style={{ fontSize: 12 }} />
                                }
                                onClick={() =>
                                  updateQuantity(
                                    selectedFood.id,
                                    cartItem.quantity - 1,
                                  )
                                }
                                size="small"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--text)",
                                  width: 28,
                                  height: 28,
                                }}
                              />
                              <Text
                                style={{
                                  color: "var(--primary)",
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
                                  updateQuantity(
                                    selectedFood.id,
                                    cartItem.quantity + 1,
                                  )
                                }
                                size="small"
                                style={{
                                  background: "var(--primary)",
                                  border: "none",
                                  color: "var(--text)",
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  boxShadow: "0 4px 10px var(--primary-glow)",
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
                                background: "var(--primary)",
                                border: "none",
                                height: 44,
                                padding: "0 24px",
                                borderRadius: 12,
                                fontWeight: 600,
                                fontSize: 14,
                                boxShadow: "0 4px 12px var(--primary-glow)",
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

        <CartModal />

        <CustomerFooter
          customerProfile={customerProfile}
          customerName={customerName}
          phoneNumber={phoneNumber}
          avatarUrl={avatarUrl}
          onProfileUpdate={loadCustomerProfile}
        />
      </ConfigProvider>
      <NotificationSystem />
    </>
  );
}
