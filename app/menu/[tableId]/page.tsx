"use client";

import CartModal from "@/components/customer/CartModal";
import CustomerFooter from "@/components/customer/CustomerFooter";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useCart } from "@/lib/contexts/CartContext";
import { useTheme } from "@/lib/hooks/useTheme";
import customerService, {
    CustomerResponseDto,
} from "@/lib/services/customerService";
import dishService, { ComboSummaryDto } from "@/lib/services/dishService";
import menuService from "@/lib/services/menuService";
import type {
    CartItem,
    Category,
    CategoryWithDishes,
    MenuItem,
} from "@/lib/types/menu";
import { formatVND } from "@/lib/utils/currency";
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
    Typography
} from "antd";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  // Handle PayOS return after customer self-payment
  const [messageApi] = message.useMessage();
  useEffect(() => {
    const payosStatus = searchParams.get("payos");
    if (!payosStatus) return;

    if (payosStatus === "success") {
      messageApi.success(t("customer_page.cart_modal.self_pay_success", "Thanh toán thành công!"));
    } else if (payosStatus === "cancel") {
      messageApi.warning(t("customer_page.cart_modal.self_pay_cancelled", "Thanh toán đã bị huỷ"));
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("payos");
    const nextUrl = nextParams.toString()
      ? `${pathname}?${nextParams.toString()}`
      : pathname;
    router.replace(nextUrl);
  }, [searchParams, pathname, router, messageApi, t]);
  const { mode: themeMode } = useTheme();
  const { user } = useAuth();
  const {
    cartItems,
    addToCart: addToCartContext,
    updateQuantity,
    setOrderContext,
    addComboToCart: addComboToCartContext,
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
  const [combos, setCombos] = useState<ComboSummaryDto[]>([]);
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

      const [menuData, comboData] = await Promise.all([
        menuService.getMenu(),
        dishService.getActiveCombos().catch(() => []),
      ]);

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

      setCombos(comboData ?? []);
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

  const filteredCombos = useMemo(() => {
    if (!searchText) return combos;
    const lower = searchText.toLowerCase();
    return combos.filter((c) => c.name.toLowerCase().includes(lower));
  }, [combos, searchText]);

  const [selectedCombo, setSelectedCombo] = useState<ComboSummaryDto | null>(null);
  const [comboDetailModalOpen, setComboDetailModalOpen] = useState(false);

  const dishImageMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    dishes.forEach((d) => {
      if (d.image) map[d.id] = d.image;
    });
    return map;
  }, [dishes]);

  const handleAddComboToCart = (combo: ComboSummaryDto) => {
    addComboToCartContext(
      combo,
      t("menu_page.combo_added_to_cart", { name: combo.name }),
      dishImageMap,
    );
  };

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
              {/* --- Combo Section --- */}
              {filteredCombos.length > 0 && (
                <div id="combos">
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
                      {t("menu_page.combo_section_title")}
                    </Title>
                    <Text style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {filteredCombos.length} {t("menu_page.items")}
                    </Text>
                  </div>

                  <Row gutter={[16, 16]}>
                    {filteredCombos.map((combo) => (
                      <Col xs={24} sm={12} md={12} lg={8} key={combo.id}>
                        <Card
                          hoverable
                          variant="borderless"
                          onClick={() => {
                            setSelectedCombo(combo);
                            setComboDetailModalOpen(true);
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
                              alignItems: "flex-start",
                            }}>
                            {/* Image */}
                            <div
                              style={{
                                flexShrink: 0,
                                width: isSmallPhone ? 72 : 85,
                                height: isSmallPhone ? 72 : 85,
                                borderRadius: 12,
                                overflow: "hidden",
                                border: "1px solid var(--stroke-subtle)",
                              }}>
                              {combo.imageUrl ? (
                                <img
                                  src={combo.imageUrl}
                                  alt={combo.name}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    background: "var(--surface-subtle)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}>
                                  <img
                                    src="/images/dishStatus/spicy.png"
                                    alt=""
                                    style={{ width: 28, height: 28, objectFit: "contain", opacity: 0.3 }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                style={{
                                  fontSize: isSmallPhone ? 15 : 16,
                                  fontWeight: 600,
                                  color: "var(--text)",
                                  display: "block",
                                  marginBottom: 2,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}>
                                {combo.name}
                              </Text>
                              <Text
                                style={{
                                  color: "var(--primary)",
                                  fontWeight: 700,
                                  fontSize: isSmallPhone ? 15 : 16,
                                  display: "block",
                                  marginBottom: 6,
                                }}>
                                {formatVND(combo.price)}
                              </Text>
                              {/* Dish list */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {combo.details.map((d) => (
                                  <Text
                                    key={d.id ?? d.dishId}
                                    style={{
                                      fontSize: 12,
                                      color: "var(--text-muted)",
                                      display: "block",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}>
                                    • {d.dishName} x{d.quantity}
                                  </Text>
                                ))}
                              </div>
                            </div>

                            {/* Add / Quantity controls */}
                            {(() => {
                              const cartItem = cartItems.find((c) => c.id === combo.id);
                              if (cartItem) {
                                return (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                      flexShrink: 0,
                                    }}>
                                    <Button
                                      type="text"
                                      icon={<MinusOutlined />}
                                      onClick={() => updateQuantity(combo.id, cartItem.quantity - 1)}
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
                                      onClick={() => updateQuantity(combo.id, cartItem.quantity + 1)}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddComboToCart(combo);
                                  }}
                                  style={{ background: "var(--primary)", border: "none", flexShrink: 0 }}
                                />
                              );
                            })()}
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {/* --- Regular categories --- */}
              {/* --- Regular categories --- */}
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
                                {formatVND(typeof item.price === "string" ? parseFloat(item.price) : item.price)}
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

            {/* Combo Detail Modal */}
            <Modal
              open={comboDetailModalOpen}
              onCancel={() => setComboDetailModalOpen(false)}
              footer={null}
              centered
              closeIcon={null}
              width="100%"
              styles={{
                mask: {
                  backdropFilter: "blur(12px)",
                  background: "var(--modal-overlay)",
                },
                wrapper: { background: "transparent" },
                body: { background: "transparent", padding: 0 },
              }}>
              {selectedCombo && (
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
                  {/* Glow */}
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

                  {/* Close */}
                  <div
                    onClick={() => setComboDetailModalOpen(false)}
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
                      border: "1px solid var(--border)",
                    }}>
                    <CloseOutlined style={{ color: "var(--text-muted)", fontSize: 14 }} />
                  </div>

                  <div style={{ position: "relative", zIndex: 1 }}>
                    {/* Image */}
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "4/3",
                        borderRadius: 16,
                        overflow: "hidden",
                        marginBottom: 20,
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-md)",
                      }}>
                      {selectedCombo.imageUrl ? (
                        <img
                          src={selectedCombo.imageUrl}
                          alt={selectedCombo.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                            alt=""
                            style={{ width: 48, height: 48, objectFit: "contain", opacity: 0.25 }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <Title
                      level={3}
                      style={{
                        color: "var(--text)",
                        margin: "0 0 8px 0",
                        fontSize: 24,
                        fontWeight: 700,
                      }}>
                      {selectedCombo.name}
                    </Title>

                    {/* Description */}
                    {selectedCombo.description && (
                      <div
                        style={{
                          marginBottom: 16,
                          background: "var(--surface)",
                          padding: 16,
                          borderRadius: 12,
                          border: "1px solid var(--border)",
                        }}>
                        <Text style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7 }}>
                          {selectedCombo.description}
                        </Text>
                      </div>
                    )}

                    {/* Dishes in combo */}
                    <div
                      style={{
                        marginBottom: 20,
                        background: "var(--surface)",
                        padding: 16,
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                      }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          display: "block",
                          marginBottom: 10,
                        }}>
                        {t("menu_page.combo_includes")}
                      </Text>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {selectedCombo.details.map((d) => (
                          <div
                            key={d.id ?? d.dishId}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "6px 0",
                              borderBottom: "1px dashed var(--border)",
                            }}>
                            <Text style={{ color: "var(--text)", fontSize: 14 }}>
                              {d.dishName}
                            </Text>
                            <span
                              style={{
                                background: "var(--surface-subtle, #f5f5f5)",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                padding: "1px 10px",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--text)",
                                whiteSpace: "nowrap",
                              }}>
                              x{d.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action bar */}
                    <div
                      style={{
                        background: "var(--surface)",
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
                        <Text style={{ color: "var(--text)", fontSize: 20, fontWeight: 700 }}>
                          {formatVND(selectedCombo.price)}
                        </Text>
                      </div>
                      <Button
                        type="primary"
                        shape="circle"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          handleAddComboToCart(selectedCombo);
                          setComboDetailModalOpen(false);
                        }}
                        style={{
                          background: "var(--primary)",
                          border: "none",
                          width: 44,
                          height: 44,
                          flexShrink: 0,
                          boxShadow: "0 4px 12px var(--primary-glow)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
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
                              shape="circle"
                              icon={<PlusOutlined />}
                              loading={addingItemId === selectedFood.id}
                              disabled={addingItemId === selectedFood.id}
                              onClick={() => handleAddToCart(selectedFood)}
                              style={{
                                background: "var(--primary)",
                                border: "none",
                                width: 44,
                                height: 44,
                                flexShrink: 0,
                                boxShadow: "0 4px 12px var(--primary-glow)",
                              }}
                            />
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
  );
}
