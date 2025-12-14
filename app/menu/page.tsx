"use client";

import {
    DeleteOutlined,
    DownOutlined,
    FilterOutlined,
    MinusOutlined,
    PlusOutlined,
    SearchOutlined,
    ShoppingCartOutlined
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
    theme
} from "antd";
import { useMemo, useState } from "react";

const { Title, Text } = Typography;

// --- Dữ liệu mẫu ---
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

const sections: MenuSection[] = [
  {
    key: "all",
    title: "Tất cả món ăn",
    description: "Khám phá toàn bộ thực đơn tinh hoa của RestX.",
    items: [], // Sẽ được gộp tự động
  },
  {
    key: "special",
    title: "Special Bowls",
    description: "Signature poke bowls với cá tươi, rau củ muối và sốt đậm đà.",
    items: [
      { name: "Honi Poke", price: "£11.95", tags: ["spicy"], note: "Best Seller", image: "/images/menu/Honi-Poke.png" },
      { name: "Ahi Poke", price: "£11.95", description: "Cá ngừ đại dương sốt Shoyu", image: "/images/menu/ahi-poke.png" },
      { name: "Sriracha Mayo Salmon", price: "£11.95", tags: ["new"], image: "/images/menu/Sriracha-Mayo-Salmon.png" },
    ],
  },
  {
    key: "sushi",
    title: "Honi Sushi",
    description: "Combo sushi tươi, phong phú cho mọi khẩu vị.",
    items: [
      { name: "Salmon Lover Set", price: "£12.50", image: "/images/menu/Salmon-Lover-Set.png" },
      { name: "Rainbow Roll", price: "£11.20", tags: ["spicy"], image: "/images/menu/Rainbow-Roll.png" },
      { name: "Vegan Garden Roll", price: "£9.50", tags: ["vegan"], image: "/images/menu/Vegan-Garden-Roll.png" },
    ],
  },
  {
    key: "boba",
    title: "Honi Boba",
    description: "Trà sữa và nước trái cây pha chế tươi mát.",
    items: [
      { name: "Brown Sugar Milk", price: "£5.20", tags: ["best"], image: "/images/menu/Brown-Sugar-Milk.png" },
      { name: "Matcha Cream Foam", price: "£4.90", image: "/images/menu/matcha-cold-cream.png" },
    ],
  },
];

// Gộp tất cả items cho mục "Tất cả"
const allItems = sections.flatMap(s => s.items);
sections[0].items = allItems;

export default function MenuPage() {
  // Mặc định chọn mục đầu tiên (Tất cả hoặc Special tùy bạn chỉnh)
  const [activeSectionKey, setActiveSectionKey] = useState<string>("special");
  const [searchText, setSearchText] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Logic lọc món ăn:
  // 1. Lấy section đang chọn
  // 2. Nếu có search text -> lọc trong section đó theo tên
  const currentSection = useMemo(
    () => sections.find((s) => s.key === activeSectionKey) || sections[1],
    [activeSectionKey]
  );

  const displayedItems = useMemo(() => {
    let items = currentSection.items;
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(lowerSearch));
    }
    return items;
  }, [currentSection, searchText]);

  const cartItemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const getItemCategory = (itemName: string): "food" | "drink" => {
    // Tìm item trong sections để xác định category
    for (const section of sections) {
      const foundItem = section.items.find(i => i.name === itemName);
      if (foundItem) {
        // Nếu section key là "boba" thì là nước uống, còn lại là đồ ăn
        return section.key === "boba" ? "drink" : "food";
      }
    }
    return "food"; // Mặc định là đồ ăn
  };

  const handleAddToCart = (item: MenuItem) => {
    const category = getItemCategory(item.name);
    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.name === item.name);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.name === item.name
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prev, { name: item.name, price: item.price, quantity: 1, category, image: item.image }];
      }
    });
    messageApi.success(`Đã thêm ${item.name} vào giỏ hàng`);
  };

  const handleRemoveFromCart = (itemName: string) => {
    setCartItems(prev => prev.filter(item => item.name !== itemName));
    messageApi.success("Đã xóa món khỏi giỏ hàng");
  };

  const handleUpdateQuantity = (itemName: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemName);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.name === itemName ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace(/[£,]/g, ""));
      return total + price * item.quantity;
    }, 0);
  };

  const foodItems = useMemo(() => {
    return cartItems.filter(item => item.category === "food");
  }, [cartItems]);

  const drinkItems = useMemo(() => {
    return cartItems.filter(item => item.category === "drink");
  }, [cartItems]);

  return (
    <>
      {contextHolder}
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#ff5722",
          fontFamily: "'Playfair Display', 'Inter', sans-serif",
          borderRadius: 12,
          controlHeight: 45, // Tăng chiều cao các input/select cho dễ bấm
        },
        components: {
          Select: {
            colorBgContainer: "rgba(255,255,255,0.08)",
            colorBorder: "transparent",
            selectorBg: "rgba(255,255,255,0.08)",
            optionSelectedBg: "rgba(255, 87, 34, 0.2)",
            colorTextPlaceholder: "#a6a6a6"
          },
          Input: {
            colorBgContainer: "rgba(255,255,255,0.04)",
            colorBorder: "transparent",
            activeBorderColor: "#ff5722",
          }
        }
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#050505",
          backgroundImage: `
            radial-gradient(circle at 0% 0%, rgba(255, 87, 34, 0.1), transparent 40%),
            radial-gradient(circle at 100% 100%, rgba(255, 87, 34, 0.05), transparent 40%)
          `,
          paddingBottom: 80,
        }}
      >
        {/* --- Hero Section --- */}
        <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute", inset: 0,
              background: "url('/images/menu/banner.png') center/cover, #1f1f1f",
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3), #050505)" }} />
          
          <div style={{ position: "absolute", bottom: 20, left: 16, right: 16, maxWidth: 1200, margin: "0 auto" }}>
            <Text style={{ color: "#ff5722", letterSpacing: 2, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                RestX Menu
            </Text>
            <Title level={2} style={{ margin: "4px 0 0", color: "#fff" }}>
                Thực đơn hôm nay
            </Title>
          </div>
        </div>

        {/* --- STICKY NAVIGATION BAR (Dropdown + Search) --- */}
        <Affix offsetTop={0}>
            <div style={{ 
                background: "rgba(5, 5, 5, 0.9)", 
                backdropFilter: "blur(16px)", 
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                padding: "12px 16px",
                zIndex: 100,
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
            }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <Row gutter={[12, 12]}>
                        {/* Dropdown chọn danh mục (Chiếm diện tích lớn trên mobile) */}
                        <Col xs={14} md={8}>
                            <Select
                                style={{ width: "100%" }}
                                value={activeSectionKey}
                                onChange={setActiveSectionKey}
                                suffixIcon={<DownOutlined style={{ color: "#ff5722" }} />}
                                options={sections.map(s => ({
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
                                  placeholder="Tìm món..."
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
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
          
          {/* Section Description */}
          <div style={{ marginBottom: 16, animation: "fadeIn 0.5s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <FilterOutlined style={{ color: "#ff5722" }} />
                <Text style={{ color: "#ff5722", fontWeight: 600, textTransform: "uppercase", fontSize: 13 }}>
                    Đang xem danh mục
                </Text>
            </div>
            <Title level={3} style={{ color: "#fff", margin: 0 }}>
                {currentSection.title}
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 4, display: "block" }}>
                {currentSection.description}
            </Text>
          </div>

          {/* Result Count */}
          <div style={{ marginBottom: 12 }}>
             <Text style={{ color: "#666", fontSize: 13 }}>
                Hiển thị {displayedItems.length} món ăn
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
                    style={{
                        background: "#121212",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.06)",
                        overflow: "hidden"
                    }}
                    styles={{
                        body: { padding: 0 }
                    }}
                    >
                    <div style={{ 
                        display: "flex", 
                        flexDirection: "row", 
                        gap: 12,
                        padding: 8,
                        alignItems: "center"
                    }}>
                        {/* Image Section */}
                        <div style={{ 
                            flexShrink: 0, 
                            width: 80, 
                            height: 80,
                            position: "relative"
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
                                        border: "1px solid rgba(255,255,255,0.1)"
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: 8,
                                        background: "linear-gradient(135deg, #1f1f1f 0%, #141414 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#444",
                                        border: "1px dashed rgba(255,255,255,0.1)",
                                        overflow: "hidden",
                                        position: "relative",
                                    }}
                                >
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: 20, opacity: 0.5 }}>🍽️</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Content Section */}
                        <div style={{ 
                            flex: 1, 
                            display: "flex", 
                            flexDirection: "row", 
                            justifyContent: "space-between",
                            alignItems: "center",
                            minWidth: 0,
                            gap: 12
                        }}>
                            <Text style={{ fontSize: 15, fontWeight: 600, color: "#fff", flex: 1, minWidth: 0 }}>
                                {item.name}
                            </Text>
                            <Text style={{ color: "#ff5722", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
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
                                      background: "#ff5722",
                                      border: "none",
                                      width: 32,
                                      height: 32,
                                      minWidth: 32,
                                      padding: 0,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0
                                  }}
                              />
                            </div>
                        </div>
                    </div>
                    </Card>
                </Col>
                ))
            ) : (
                <Col span={24} style={{ textAlign: "center", padding: "40px 0" }}>
                    <Text style={{ color: "#666" }}>Không tìm thấy món nào phù hợp.</Text>
                </Col>
            )}
          </Row>

          {/* Floating Cart Button */}
          <div 
            onClick={() => setCartModalOpen(true)}
            style={{ 
                position: "fixed", bottom: 24, right: 24, zIndex: 99,
                background: "#ff5722", width: 56, height: 56, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 30px rgba(255, 87, 34, 0.5)", cursor: "pointer",
                transition: "transform 0.2s"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
            }}
          >
             <ShoppingCartOutlined style={{ color: "#fff", fontSize: 24 }} />
             {cartItemCount > 0 && (
                <div style={{ 
                    position: "absolute", top: 0, right: 0, 
                    background: "white", color: "#ff5722", 
                    fontSize: 12, fontWeight: "bold", 
                    padding: "2px 6px", borderRadius: 10,
                    border: "2px solid #ff5722",
                    minWidth: 20,
                    textAlign: "center"
                }}>{cartItemCount}</div>
             )}
          </div>

          {/* Cart Modal */}
          <Modal
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShoppingCartOutlined style={{ color: "#ff5722", fontSize: 20 }} />
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: 600 }}>
                  Giỏ hàng ({cartItemCount})
                </Text>
              </div>
            }
            open={cartModalOpen}
            onCancel={() => setCartModalOpen(false)}
            footer={null}
            width={500}
            styles={{
              body: { background: "#050505", padding: 0, maxHeight: "70vh", overflowY: "auto" },
              header: { background: "#121212", borderBottom: "1px solid rgba(255,255,255,0.1)" },
              mask: { background: "rgba(0, 0, 0, 0.7)" }
            }}
            wrapClassName="cart-modal-wrapper"
          >
            <div style={{ 
              display: "flex", 
              flexDirection: "column",
              padding: "20px"
            }}>
              {cartItems.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "60px 20px",
                  color: "#666"
                }}>
                  <ShoppingCartOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
                  <Text style={{ color: "#666", fontSize: 14, display: "block" }}>
                    Giỏ hàng của bạn đang trống
                  </Text>
                </div>
              ) : (
                <>
                  {/* Đồ ăn Section */}
                  {foodItems.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Text style={{ 
                        color: "#ff5722", 
                        fontSize: 16, 
                        fontWeight: 700, 
                        display: "block", 
                        marginBottom: 12,
                        textTransform: "uppercase",
                        letterSpacing: 1
                      }}>
                        🍽️ Đồ ăn
                      </Text>
                      {foodItems.map((item) => (
                        <Card
                          key={item.name}
                          style={{
                            background: "#121212",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 12,
                            marginBottom: 12
                          }}
                          styles={{ body: { padding: 12 } }}
                        >
                          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{
                                  width: 60,
                                  height: 60,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  flexShrink: 0
                                }}
                              />
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flex: 1 }}>
                              <div style={{ flex: 1 }}>
                                <Text style={{ color: "#fff", fontSize: 15, fontWeight: 600, display: "block", marginBottom: 4 }}>
                                  {item.name}
                                </Text>
                                <Text style={{ color: "#ff5722", fontSize: 14, fontWeight: 600 }}>
                                  {item.price}
                                </Text>
                              </div>
                              <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveFromCart(item.name)}
                                style={{ color: "#ff4d4f", flexShrink: 0 }}
                                size="small"
                              />
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Button
                                type="text"
                                icon={<MinusOutlined />}
                                onClick={() => handleUpdateQuantity(item.name, item.quantity - 1)}
                                style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                                size="small"
                              />
                              <Text style={{ color: "#fff", fontSize: 15, fontWeight: 600, minWidth: 30, textAlign: "center" }}>
                                {item.quantity}
                              </Text>
                              <Button
                                type="text"
                                icon={<PlusOutlined />}
                                onClick={() => handleUpdateQuantity(item.name, item.quantity + 1)}
                                style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                                size="small"
                              />
                            </div>
                            <Text style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>
                              {(parseFloat(item.price.replace(/[£,]/g, "")) * item.quantity).toFixed(2)}£
                            </Text>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Nước uống Section */}
                  {drinkItems.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Text style={{ 
                        color: "#ff5722", 
                        fontSize: 16, 
                        fontWeight: 700, 
                        display: "block", 
                        marginBottom: 12,
                        textTransform: "uppercase",
                        letterSpacing: 1
                      }}>
                        🥤 Nước uống
                      </Text>
                      {drinkItems.map((item) => (
                        <Card
                          key={item.name}
                          style={{
                            background: "#121212",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 12,
                            marginBottom: 12
                          }}
                          styles={{ body: { padding: 12 } }}
                        >
                          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{
                                  width: 60,
                                  height: 60,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  flexShrink: 0
                                }}
                              />
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flex: 1 }}>
                              <div style={{ flex: 1 }}>
                                <Text style={{ color: "#fff", fontSize: 15, fontWeight: 600, display: "block", marginBottom: 4 }}>
                                  {item.name}
                                </Text>
                                <Text style={{ color: "#ff5722", fontSize: 14, fontWeight: 600 }}>
                                  {item.price}
                                </Text>
                              </div>
                              <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveFromCart(item.name)}
                                style={{ color: "#ff4d4f", flexShrink: 0 }}
                                size="small"
                              />
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Button
                                type="text"
                                icon={<MinusOutlined />}
                                onClick={() => handleUpdateQuantity(item.name, item.quantity - 1)}
                                style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                                size="small"
                              />
                              <Text style={{ color: "#fff", fontSize: 15, fontWeight: 600, minWidth: 30, textAlign: "center" }}>
                                {item.quantity}
                              </Text>
                              <Button
                                type="text"
                                icon={<PlusOutlined />}
                                onClick={() => handleUpdateQuantity(item.name, item.quantity + 1)}
                                style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                                size="small"
                              />
                            </div>
                            <Text style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>
                              {(parseFloat(item.price.replace(/[£,]/g, "")) * item.quantity).toFixed(2)}£
                            </Text>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {/* Total and Checkout */}
                  <div style={{ 
                    borderTop: "1px solid rgba(255,255,255,0.1)", 
                    paddingTop: 16,
                    background: "#121212",
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 8
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <Text style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>
                        Tổng cộng:
                      </Text>
                      <Text style={{ color: "#ff5722", fontSize: 20, fontWeight: 700 }}>
                        {calculateTotal().toFixed(2)}£
                      </Text>
                    </div>
                    <Button
                      type="primary"
                      block
                      size="large"
                      style={{
                        background: "#ff5722",
                        border: "none",
                        height: 48,
                        fontWeight: 600,
                        fontSize: 16
                      }}
                    >
                      Đặt món
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Modal>

        </div>
      </div>
    </ConfigProvider>
    </>
  );
}