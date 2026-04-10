"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CartModal from "@/components/customer/CartModal";
import CustomerFooter from "@/components/customer/CustomerFooter";
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
  Grid,
  Input,
  message,
  Modal,
  Row,
  Spin,
  theme,
  Typography,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function MenuPage() {
  const { t } = useTranslation("common");
  const screens = useBreakpoint();
  const isSmallPhone = !screens.sm;
  const pageHorizontalPadding = isSmallPhone ? 12 : 16;
  const sectionGap = isSmallPhone ? 24 : 32;
  const router = useRouter();
  const params = useParams();
  
  const rawTableId = params?.tableId;
  const tableId = Array.isArray(rawTableId) ? rawTableId[0] : rawTableId || "";

  function isValidGuid(id: string) {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
  }

  useEffect(() => {
    if (!isValidGuid(tableId)) {
      router.replace("/404");
    }
  }, [tableId]);
  const { mode: themeMode } = useTheme();
  const { user } = useAuth();
  const {
    cartItems,
    addToCart: addToCartContext,
    updateQuantity,
    setOrderContext,
  } = useCart();

  // Ref to track if data has been fetched
  const hasFetchedData = useRef(false);

  // State management
  const [foodDetailModalOpen, setFoodDetailModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<MenuItem | null>(null);
  const [searchText, setSearchText] = useState("");
  const [, contextHolder] = message.useMessage();
  const [addingItemId, setAddingItemId] = useState<string | null>(null);

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
          profile.avatarUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=4F46E5&color=fff`,
        );
      }
    } catch (error) {
      console.error("Failed to load customer profile:", error);
    }
  }, [user]);

  const toBoolean = (value: unknown): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
    if (typeof value === "number") return value === 1;
    return false;
  };

  const buildDishTags = (dish: {
    isSpicy?: boolean;
    isVegetarian?: boolean;
    isBestSeller?: boolean;
  }) => {
    const tags: string[] = [];
    if (dish.isBestSeller) tags.push("best");
    if (dish.isSpicy) tags.push("spicy");
    if (dish.isVegetarian) tags.push("vegan");
    return tags;
  };

  const fetchMenuData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const menuData = await menuService.getMenu();

      if (menuData && Array.isArray(menuData)) {
        const allDishes: MenuItem[] = [];
        const extractedCategories: Category[] = [];

        menuData.forEach((categoryGroup) => {
          if (categoryGroup.categoryId && categoryGroup.categoryName) {
            extractedCategories.push({
              id: categoryGroup.categoryId,
              name: categoryGroup.categoryName,
            });
          }

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
                isBestSeller: toBoolean(item.isBestSeller),
                isSpicy: toBoolean(item.isSpicy),
                isVegetarian: toBoolean(item.isVegetarian),
                tags: buildDishTags({
                  isBestSeller: toBoolean(item.isBestSeller),
                  isSpicy: toBoolean(item.isSpicy),
                  isVegetarian: toBoolean(item.isVegetarian),
                }),
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

  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchMenuData();
      loadCustomerProfile();
    }
  }, []);

  useEffect(() => {
    if (!isValidGuid(tableId)) return;

    const customerId =
      customerProfile?.id || user?.customerId || undefined;

    setOrderContext({
      tableId: tableId as string,
      customerId,
    });
  }, [tableId, customerProfile?.id, user?.customerId, setOrderContext]);

  // Re-fetch customer profile when user changes (login/logout)
  useEffect(() => {
    if (hasFetchedData.current && user) {
      loadCustomerProfile();
    }
  }, [user?.customerId, user?.email]);

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

  const handleOpenFoodDetail = (item: MenuItem) => {
    setSelectedFood(item);
    setFoodDetailModalOpen(true);
  };

  const handleAddToCart = (item: MenuItem) => {
    if (addingItemId === item.id) return;

    setAddingItemId(item.id);
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
    window.setTimeout(() => {
      setAddingItemId((current) => (current === item.id ? null : current));
    }, 450);
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
        }}
        form={{ requiredMark: false }}
      >
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
        }}
        form={{ requiredMark: false }}
      >
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
    <ProtectedRoute>
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
            controlHeight: 45,
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
        }}
        form={{ requiredMark: false }}
      >
        <div
          style={{
            minHeight: "100vh",
            background: "var(--bg-base)",
            backgroundImage: `
            radial-gradient(circle at 0% 0%, var(--primary-soft), transparent 45%),
            radial-gradient(circle at 100% 100%, var(--primary-faint), transparent 45%)
          `,
            paddingBottom: isSmallPhone ? 104 : 96,
          }}>
          {/* --- Hero Section --- */}
          <div
            style={{
              position: "relative",
              height: isSmallPhone
                ? "clamp(205px, 30vh, 250px)"
                : "clamp(220px, 34vh, 300px)",
              overflow: "hidden",
            }}>
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
              onClick={() => router.push(`/customer/${tableId}`)}
              style={{
                position: "absolute",
                top: isSmallPhone ? 12 : 16,
                left: pageHorizontalPadding,
                background: "var(--modal-overlay)",
                backdropFilter: "blur(8px)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                height: isSmallPhone ? 36 : 40,
                width: isSmallPhone ? 36 : 40,
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
                bottom: isSmallPhone ? 16 : 20,
                left: pageHorizontalPadding,
                right: pageHorizontalPadding,
                maxWidth: 1200,
                margin: "0 auto",
              }}>
              <Text
                style={{
                  color: "var(--primary)",
                  letterSpacing: isSmallPhone ? 1.5 : 2,
                  fontSize: isSmallPhone ? 11 : 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}>
                {t("menu_page.logo_title")}
              </Text>
              <Title
                level={2}
                style={{
                  margin: "4px 0 0",
                  color: "var(--text)",
                  fontSize: isSmallPhone ? 28 : 32,
                  lineHeight: isSmallPhone ? 1.2 : 1.15,
                }}>
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
                padding: isSmallPhone
                  ? `10px ${pageHorizontalPadding}px`
                  : `12px ${pageHorizontalPadding}px`,
                boxShadow: "var(--shadow-md)",
                zIndex: 100,
              }}>
              <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <Input
                  size={isSmallPhone ? "middle" : "large"}
                  placeholder={t("menu_page.search_placeholder")}
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
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: isSmallPhone
                ? `16px ${pageHorizontalPadding}px`
                : `20px ${pageHorizontalPadding}px`,
            }}>
            {/* Hiển thị phẳng các category và dishes */}
            <div style={{ display: "flex", flexDirection: "column", gap: sectionGap }}>
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
                            handleOpenFoodDetail(item);
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
                              gap: isSmallPhone ? 8 : 12,
                              padding: isSmallPhone ? 10 : 12,
                              alignItems: "center",
                            }}>
                            {/* Image Section */}
                            <div
                              style={{
                                flexShrink: 0,
                                width: isSmallPhone ? 72 : 85,
                                height: isSmallPhone ? 72 : 85,
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
                                  {t("menu_page.best_seller")}
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
                                  <img
                                src="/images/dishStatus/spicy.png"
                                alt={t("menu_page.tags.vegan")}
                                style={{ width: 16, height: 16, objectFit: "contain" }}
                              />
                                </div>
                              )}
                            </div>

                            {/* Content Section */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                style={{
                                  fontSize: isSmallPhone ? 15 : 16,
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
                                  fontSize: isSmallPhone ? 15 : 16,
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
                                  <img
                                    src="/images/dishStatus/spicy.png"
                                    alt={t("menu_page.tags.spicy")}
                                    style={{ width: 12, height: 12, objectFit: "contain" }}
                                  />
                                )}
                                {item.isVegetarian && (
                                  <img
                                    src="/images/dishStatus/vegetable.png"
                                    alt={t("menu_page.tags.vegan")}
                                    style={{ width: 12, height: 12, objectFit: "contain" }}
                                  />
                                )}
                                {item.isBestSeller && (
                                  <StarFilled
                                    style={{ color: "var(--warning)", fontSize: 12 }}
                                  />
                                )}
                              </div>
                            </div>

                            {/* Quick Add / Quantity Controls */}
                            {(() => {
                              const cartItem = cartItems.find(
                                (cart) => cart.id === item.id,
                              );

                              if (cartItem) {
                                return (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                      background: "var(--card)",
                                      padding: "4px 6px",
                                    }}>
                                    <Button
                                      type="text"
                                      icon={<MinusOutlined />}
                                      disabled={addingItemId === item.id}
                                      onClick={() =>
                                        updateQuantity(item.id, cartItem.quantity - 1)
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
                                      {cartItem.quantity}
                                    </Text>
                                    <Button
                                      type="text"
                                      icon={<PlusOutlined />}
                                      disabled={addingItemId === item.id}
                                      onClick={() =>
                                        updateQuantity(item.id, cartItem.quantity + 1)
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
                                );
                              }

                              return (
                                <Button
                                  type="primary"
                                  shape="circle"
                                  icon={<PlusOutlined />}
                                  loading={addingItemId === item.id}
                                  disabled={addingItemId === item.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(item);
                                  }}
                                  style={{
                                    background: "var(--primary)",
                                    border: "none",
                                  }}
                                />
                              );
                            })()}
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
                        aspectRatio: "4/3",
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
                          <img
                                src="/images/dishStatus/spicy.png"
                                alt={t("menu_page.tags.vegan")}
                                style={{ width: 16, height: 16, objectFit: "contain" }}
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

                      {/* Info Tags */}
                      {(selectedFood.isBestSeller ||
                        selectedFood.isSpicy ||
                        selectedFood.isVegetarian) && (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            marginBottom: 8,
                          }}>
                          {selectedFood.isBestSeller && (
                            <span
                              style={{
                                background: "var(--warning-soft)",
                                color: "var(--warning)",
                                padding: "6px 12px",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                border: "1px solid var(--warning-border)",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                              }}>
                              <StarFilled />
                              {t("menu_page.best_seller")}
                            </span>
                          )}
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
                              <img
                                src="/images/dishStatus/spicy.png"
                                alt={t("menu_page.tags.vegan")}
                                style={{ width: 16, height: 16, objectFit: "contain" }}
                              />
                              {t("menu_page.tags.spicy")}
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
                              <img
                                src="/images/dishStatus/vegetable.png"
                                alt={t("menu_page.tags.vegan")}
                                style={{ width: 16, height: 16, objectFit: "contain" }}
                              />
                              {t("menu_page.tags.vegan")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

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
                                justifyContent: "center",
                                minWidth: 118,
                              }}>
                              <Button
                                type="text"
                                icon={<MinusOutlined />}
                                onClick={() =>
                                  updateQuantity(
                                    selectedFood.id,
                                    cartItem.quantity - 1,
                                  )
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
                                {cartItem.quantity}
                              </Text>
                              <Button
                                type="text"
                                icon={<PlusOutlined />}
                                onClick={() =>
                                  updateQuantity(
                                    selectedFood.id,
                                    cartItem.quantity + 1,
                                  )
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
                          );
                        } else {
                          return (
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              loading={addingItemId === selectedFood.id}
                              disabled={addingItemId === selectedFood.id}
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
          tableId={tableId}
        />
      </ConfigProvider>
    </>
    </ProtectedRoute>
  );
}
