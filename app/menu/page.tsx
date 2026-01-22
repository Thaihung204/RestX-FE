"use client";

import NotificationSystem from "@/components/notifications/NotificationSystem";
import {
  ArrowLeftOutlined,
  CloseOutlined,
  CoffeeOutlined,
  DeleteOutlined,
  DownOutlined,
  FilterOutlined,
  FireOutlined,
  MinusOutlined,
  PlusOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
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
  Select,
  Typography,
  message,
  theme,
} from "antd";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

// --- Sample data ---
type MenuItem = {
  name: string;
  price: string;
  tags?: string[];
  note?: string;
  description?: string;
  image?: string;
};

type CartItem = {
  name: string;
  price: string;
  quantity: number;
  category: "food" | "drink";
  image?: string;
};

type MenuSection = {
  key: string;
  title: string;
  description: string;
  items: MenuItem[];
};

// Sections moved inside component for translation support

export default function MenuPage() {
  const { t } = useTranslation("common");
  const sections = useMemo<MenuSection[]>(() => {
    const rawSections = [
      {
        key: "special",
        title: t("menu_page.sections.special_title"),
        description: t("menu_page.sections.special_desc"),
        items: [
          {
            name: "Honi Poke",
            price: "89.000",
            tags: ["spicy"],
            note: t("menu_page.best_seller"),
            description:
              "Cá hồi tươi sống kết hợp cùng rong biển, dưa chuột, bơ và sốt cay đặc trưng",
            image: "/images/menu/Honi-Poke.png",
          },
          {
            name: "Ahi Poke",
            price: "89.000",
            description:
              "Cá ngừ đại dương sốt Shoyu, hành tây, mè rang và rau củ tươi mát",
            image: "/images/menu/ahi-poke.png",
          },
          {
            name: "Sriracha Mayo Salmon",
            price: "89.000",
            tags: ["new"],
            description:
              "Cá hồi nướng phủ sốt Sriracha Mayo cay ngọt hòa quyện hoàn hảo",
            image: "/images/menu/Sriracha-Mayo-Salmon.png",
          },
        ],
      },
      {
        key: "sushi",
        title: t("menu_page.sections.sushi_title"),
        description: t("menu_page.sections.sushi_desc"),
        items: [
          {
            name: "Salmon Lover Set",
            price: "95.000",
            description:
              "Combo gồm 8 miếng nigiri cá hồi tươi và 6 miếng maki cá hồi chuẩn Nhật",
            image: "/images/menu/Salmon-Lover-Set.png",
          },
          {
            name: "Rainbow Roll",
            price: "85.000",
            tags: ["spicy"],
            description:
              "Cuộn sushi 7 màu sắc với nhiều loại cá tươi, bơ và sốt đặc biệt",
            image: "/images/menu/Rainbow-Roll.png",
          },
          {
            name: "Vegan Garden Roll",
            price: "75.000",
            tags: ["vegan"],
            description:
              "Cuộn chay với rau củ tươi, bơ, dưa chuột và nấm truffle thuần chay",
            image: "/images/menu/Vegan-Garden-Roll.png",
          },
        ],
      },
      {
        key: "boba",
        title: t("menu_page.sections.boba_title"),
        description: t("menu_page.sections.boba_desc"),
        items: [
          {
            name: "Brown Sugar Milk",
            price: "45.000",
            tags: ["best"],
            description:
              "Trà sữa trân châu đường đen thơm ngon, ngọt ngào với vị caramel đặc trưng",
            image: "/images/menu/Brown-Sugar-Milk.png",
          },
          {
            name: "Matcha Cream Foam",
            price: "42.000",
            description:
              "Trà xanh matcha Nhật Bản phủ lớp kem cheese mềm mịn thơm béo",
            image: "/images/menu/matcha-cold-cream.png",
          },
        ],
      },
    ];

    const allItems = rawSections.flatMap((s) => s.items);

    return [
      {
        key: "all",
        title: t("menu_page.sections.all_title"),
        description: t("menu_page.sections.all_desc"),
        items: allItems,
      },
      ...rawSections,
    ];
  }, [t]);
  const router = useRouter();
  // Default to the first section
  const [activeSectionKey, setActiveSectionKey] = useState<string>("all");
  const [searchText, setSearchText] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [foodDetailModalOpen, setFoodDetailModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<MenuItem | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  // Filter logic:
  // 1. Use the current section
  // 2. If search text exists -> filter by name inside that section
  const currentSection = useMemo(
    () => sections.find((s) => s.key === activeSectionKey) || sections[1],
    [activeSectionKey],
  );

  const displayedItems = useMemo(() => {
    let items = currentSection.items;
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(lowerSearch));
    }
    return items;
  }, [currentSection, searchText]);

  const cartItemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const getItemCategory = (itemName: string): "food" | "drink" => {
    // Find item in sections to determine category
    for (const section of sections) {
      const foundItem = section.items.find((i) => i.name === itemName);
      if (foundItem) {
        // If section key is "boba" it's a drink, otherwise food
        return section.key === "boba" ? "drink" : "food";
      }
    }
    return "food"; // Default to food
  };

  const handleAddToCart = (item: MenuItem) => {
    const category = getItemCategory(item.name);
    setCartItems((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.name === item.name);
      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.name === item.name
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        );
      } else {
        return [
          ...prev,
          {
            name: item.name,
            price: item.price,
            quantity: 1,
            category,
            image: item.image,
          },
        ];
      }
    });
    messageApi.success(t("menu_page.cart.added_success", { name: item.name }));
  };

  const handleRemoveFromCart = (itemName: string) => {
    setCartItems((prev) => prev.filter((item) => item.name !== itemName));
    messageApi.success(t("menu_page.cart.removed_success"));
  };

  const handleUpdateQuantity = (itemName: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemName);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.name === itemName ? { ...item, quantity: newQuantity } : item,
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

  const foodItems = useMemo(() => {
    return cartItems.filter((item) => item.category === "food");
  }, [cartItems]);

  const drinkItems = useMemo(() => {
    return cartItems.filter((item) => item.category === "drink");
  }, [cartItems]);

  return (
    <>
      {contextHolder}
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#FF380B",
            fontFamily: "'Playfair Display', 'Inter', sans-serif",
            borderRadius: 12,
            controlHeight: 45, // Increase input/select height for easier tap
          },
          components: {
            Modal: {
              contentBg: "transparent",
              boxShadow: "none",
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
                RestX Menu
              </Text>
              <Title level={2} style={{ margin: "4px 0 0", color: "#fff" }}>
                {t("menu_page.title")}
              </Title>
            </div>
          </div>

          {/* --- STICKY NAVIGATION BAR (Dropdown + Search) --- */}
          <Affix offsetTop={0}>
            <div
              style={{
                background: "rgba(5, 5, 5, 0.9)",
                backdropFilter: "blur(16px)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                padding: "12px 16px",
                zIndex: 100,
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}>
              <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <Row gutter={[12, 12]}>
                  {/* Dropdown chọn danh mục (Chiếm diện tích lớn trên mobile) */}
                  <Col xs={14} md={8}>
                    <Select
                      style={{ width: "100%" }}
                      value={activeSectionKey}
                      onChange={setActiveSectionKey}
                      suffixIcon={<DownOutlined style={{ color: "#FF380B" }} />}
                      showSearch={false}
                      options={sections.map((s) => ({
                        label: (
                          <span style={{ fontWeight: 500, fontSize: 15 }}>
                            {s.title}
                          </span>
                        ),
                        value: s.key,
                      }))}
                      styles={{
                        popup: {
                          root: {
                            background: "#1f1f1f",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                          },
                        },
                      }}
                    />
                  </Col>

                  {/* Search Input */}
                  <Col xs={10} md={16}>
                    <div suppressHydrationWarning style={{ width: "100%" }}>
                      <Input
                        prefix={<SearchOutlined style={{ color: "#666" }} />}
                        placeholder={t("menu_page.search_placeholder")}
                        allowClear
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ borderRadius: 8 }}
                      />
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          </Affix>

          {/* --- Main Content --- */}
          <div
            style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
            {/* Section Description */}
            <div style={{ marginBottom: 16, animation: "fadeIn 0.5s ease" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}>
                <FilterOutlined style={{ color: "#FF380B" }} />
                <Text
                  style={{
                    color: "#FF380B",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    fontSize: 13,
                  }}>
                  {t("menu_page.viewing_category")}
                </Text>
              </div>
              <Title level={3} style={{ color: "#fff", margin: 0 }}>
                {currentSection.title}
              </Title>
              <Text
                style={{
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 4,
                  display: "block",
                }}>
                {currentSection.description}
              </Text>
            </div>

            {/* Result Count */}
            <div style={{ marginBottom: 12 }}>
              <Text style={{ color: "#666", fontSize: 13 }}>
                {t("menu_page.showing_items", { count: displayedItems.length })}
              </Text>
            </div>

            {/* Product Grid - Horizontal Layout */}
            <Row gutter={[0, 8]}>
              {displayedItems.length > 0 ? (
                displayedItems.map((item, index) => (
                  <Col xs={24} key={`${item.name}-${index}`}>
                    <Card
                      hoverable
                      variant="borderless"
                      onClick={() => {
                        setSelectedFood(item);
                        setFoodDetailModalOpen(true);
                      }}
                      style={{
                        background: "#121212",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.06)",
                        overflow: "hidden",
                      }}
                      styles={{
                        body: { padding: 0 },
                      }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: 12,
                          padding: 8,
                          alignItems: "center",
                        }}>
                        {/* Image Section */}
                        <div
                          style={{
                            flexShrink: 0,
                            width: 80,
                            height: 80,
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
                                border: "1px solid rgba(255,255,255,0.1)",
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
                                border: "1px dashed rgba(255,255,255,0.1)",
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
                            gap: 12,
                          }}>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: "#fff",
                              flex: 1,
                              minWidth: 0,
                            }}>
                            {item.name}
                          </Text>
                          <Text
                            style={{
                              color: "#FF380B",
                              fontWeight: 700,
                              fontSize: 15,
                              flexShrink: 0,
                            }}>
                            {item.price}
                          </Text>
                          <div suppressHydrationWarning>
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(item);
                              }}
                              style={{
                                background: "#FF380B",
                                border: "none",
                                width: 32,
                                height: 32,
                                minWidth: 32,
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col
                  span={24}
                  style={{ textAlign: "center", padding: "40px 0" }}>
                  <Text style={{ color: "#666" }}>
                    {t("menu_page.no_items_found")}
                  </Text>
                </Col>
              )}
            </Row>

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
                      {/* Đồ ăn Section */}
                      {foodItems.length > 0 && (
                        <div>
                          <Text
                            style={{
                              color: "#FF380B",
                              fontSize: 16,
                              fontWeight: 700,
                              display: "block",
                              marginBottom: 10,
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}>
                            {t("menu_page.cart.food_section")}
                          </Text>
                          {foodItems.map((item) => (
                            <Card
                              key={item.name}
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
                                      border: "1px solid rgba(255,255,255,0.1)",
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
                                      {item.price}
                                    </Text>
                                  </div>
                                  <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    onClick={() =>
                                      handleRemoveFromCart(item.name)
                                    }
                                    style={{ color: "#ff4d4f", flexShrink: 0 }}
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
                                        item.name,
                                        item.quantity - 1,
                                      )
                                    }
                                    style={{
                                      color: "#fff",
                                      border: "1px solid rgba(255,255,255,0.2)",
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
                                        item.name,
                                        item.quantity + 1,
                                      )
                                    }
                                    style={{
                                      color: "#fff",
                                      border: "1px solid rgba(255,255,255,0.2)",
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
                                  {(
                                    parseFloat(
                                      item.price.replace(/[£,]/g, ""),
                                    ) * item.quantity
                                  ).toFixed(2)}
                                  £
                                </Text>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Nước uống Section */}
                      {drinkItems.length > 0 && (
                        <div>
                          <Text
                            style={{
                              color: "#FF380B",
                              fontSize: 16,
                              fontWeight: 700,
                              display: "block",
                              marginBottom: 10,
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}>
                            <CoffeeOutlined className="mr-2" />{" "}
                            {t("menu_page.cart.drink_section")}
                          </Text>
                          {drinkItems.map((item) => (
                            <Card
                              key={item.name}
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
                                      border: "1px solid rgba(255,255,255,0.1)",
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
                                      {item.price}
                                    </Text>
                                  </div>
                                  <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    onClick={() =>
                                      handleRemoveFromCart(item.name)
                                    }
                                    style={{ color: "#ff4d4f", flexShrink: 0 }}
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
                                        item.name,
                                        item.quantity - 1,
                                      )
                                    }
                                    style={{
                                      color: "#fff",
                                      border: "1px solid rgba(255,255,255,0.2)",
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
                                        item.name,
                                        item.quantity + 1,
                                      )
                                    }
                                    style={{
                                      color: "#fff",
                                      border: "1px solid rgba(255,255,255,0.2)",
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
                                  {(
                                    parseFloat(
                                      item.price.replace(/[£,]/g, ""),
                                    ) * item.quantity
                                  ).toFixed(2)}
                                  £
                                </Text>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
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
                          {selectedFood.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: "rgba(255, 56, 11, 0.1)",
                                color: "#FF380B",
                                padding: "4px 10px",
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 500,
                                border: "1px solid rgba(255, 56, 11, 0.2)",
                                textTransform: "capitalize",
                              }}>
                              {t("menu_page.tags." + tag, {
                                defaultValue: tag,
                              })}
                            </span>
                          ))}
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
