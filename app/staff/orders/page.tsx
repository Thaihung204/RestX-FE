'use client';

import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Modal,
  Avatar,
  Badge,
  Tabs,
  Input,
  Select,
  Divider,
  Empty,
  InputNumber,
  App,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
  ShoppingCartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  FireOutlined,
  CoffeeOutlined,
  TableOutlined,
  UserOutlined,
  PrinterOutlined,
  SendOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useThemeMode } from '../../theme/AutoDarkThemeProvider';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  note?: string;
  status: OrderItemStatus;
}

interface Order {
  id: string;
  tableId: string;
  tableName: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  total: number;
  notes?: string;
}

// Mock menu data - Note: In a real app, menu data should also be internationalized
const menuCategories = [
  {
    id: 'appetizer',
    name: 'Khai vị', // Will be replaced with translation in component
    icon: <CoffeeOutlined />,
    items: [
      { id: 'm1', name: 'Gỏi cuốn tôm thịt', price: 65000 },
      { id: 'm2', name: 'Chả giò hải sản', price: 85000 },
      { id: 'm3', name: 'Súp cua', price: 55000 },
    ],
  },
  {
    id: 'main',
    name: 'Món chính', // Will be replaced with translation in component
    icon: <FireOutlined />,
    items: [
      { id: 'm4', name: 'Bò lúc lắc', price: 185000 },
      { id: 'm5', name: 'Cá hồi sốt chanh dây', price: 245000 },
      { id: 'm6', name: 'Gà nướng muối ớt', price: 165000 },
      { id: 'm7', name: 'Tôm hùm nướng bơ', price: 650000 },
      { id: 'm8', name: 'Cơm chiên hải sản', price: 125000 },
    ],
  },
  {
    id: 'drink',
    name: 'Đồ uống', // Will be replaced with translation in component
    icon: <CoffeeOutlined />,
    items: [
      { id: 'm9', name: 'Nước ép cam', price: 45000 },
      { id: 'm10', name: 'Sinh tố bơ', price: 55000 },
      { id: 'm11', name: 'Coca Cola', price: 25000 },
      { id: 'm12', name: 'Bia Tiger', price: 35000 },
    ],
  },
];

// Helper function to get icon for menu item based on its category
const getMenuItemIcon = (itemId: string): React.ReactNode => {
  // Find which category this item belongs to
  for (const category of menuCategories) {
    if (category.items.some(item => item.id === itemId)) {
      return category.icon;
    }
  }
  // Default icon if not found
  return <AppstoreOutlined />;
};

// Mock orders data
const initialOrders: Order[] = [
  {
    id: 'ORD001',
    tableId: 'a2',
    tableName: 'A02',
    status: 'preparing',
    createdAt: '18:35',
    total: 750000,
    items: [
      { id: 'i1', name: 'Bò lúc lắc', quantity: 2, price: 185000, status: 'preparing' },
      { id: 'i2', name: 'Gỏi cuốn tôm thịt', quantity: 1, price: 65000, status: 'ready' },
      { id: 'i3', name: 'Cơm chiên hải sản', quantity: 2, price: 125000, status: 'pending' },
      { id: 'i4', name: 'Nước ép cam', quantity: 3, price: 45000, status: 'served' },
    ],
  },
  {
    id: 'ORD002',
    tableId: 'a3',
    tableName: 'A03',
    status: 'pending',
    createdAt: '19:05',
    total: 420000,
    items: [
      { id: 'i5', name: 'Cá hồi sốt chanh dây', quantity: 1, price: 245000, status: 'pending' },
      { id: 'i6', name: 'Súp cua', quantity: 2, price: 55000, status: 'pending' },
      { id: 'i7', name: 'Sinh tố bơ', quantity: 2, price: 55000, status: 'pending' },
    ],
  },
  {
    id: 'ORD003',
    tableId: 'b1',
    tableName: 'B01',
    status: 'ready',
    createdAt: '18:10',
    total: 1250000,
    items: [
      { id: 'i8', name: 'Tôm hùm nướng bơ', quantity: 1, price: 650000, status: 'ready' },
      { id: 'i9', name: 'Bò lúc lắc', quantity: 2, price: 185000, status: 'ready' },
      { id: 'i10', name: 'Chả giò hải sản', quantity: 2, price: 85000, status: 'ready' },
      { id: 'i11', name: 'Bia Tiger', quantity: 4, price: 35000, status: 'served' },
    ],
  },
  {
    id: 'ORD004',
    tableId: 'b3',
    tableName: 'B03',
    status: 'served',
    createdAt: '19:20',
    total: 580000,
    items: [
      { id: 'i12', name: 'Gà nướng muối ớt', quantity: 2, price: 165000, status: 'served' },
      { id: 'i13', name: 'Cơm chiên hải sản', quantity: 2, price: 125000, status: 'served' },
    ],
  },
];

// Status configs will be created inside the component to use translations

export default function OrderManagement() {
  const { message } = App.useApp();
  const { mode } = useThemeMode();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  // Create status configs inside component to use translations
  const statusConfig: Record<OrderStatus, { color: string; text: string; icon: React.ReactNode }> = {
    pending: { color: 'orange', text: t('staff.orders.status.pending'), icon: <ExclamationCircleOutlined /> },
    preparing: { color: 'blue', text: t('staff.orders.status.preparing'), icon: <SyncOutlined spin /> },
    ready: { color: 'green', text: t('staff.orders.status.ready'), icon: <CheckCircleOutlined /> },
    served: { color: 'default', text: t('staff.orders.status.served'), icon: <CheckCircleOutlined /> },
    cancelled: { color: 'red', text: t('staff.orders.status.cancelled'), icon: <ClockCircleOutlined /> },
  };

  const itemStatusConfig: Record<OrderItemStatus, { color: string; text: string }> = {
    pending: { color: 'orange', text: t('staff.orders.item_status.pending') },
    preparing: { color: 'blue', text: t('staff.orders.item_status.preparing') },
    ready: { color: 'green', text: t('staff.orders.item_status.ready') },
    served: { color: 'default', text: t('staff.orders.item_status.served') },
  };
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [cart, setCart] = useState<{ item: typeof menuCategories[0]['items'][0]; quantity: number }[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [activeMenuCategory, setActiveMenuCategory] = useState('appetizer');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Check viewport
  React.useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < 576); // xs breakpoint
      setIsTablet(width >= 576 && width < 992); // sm to md breakpoint
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.tableName.toLowerCase().includes(searchText.toLowerCase()) ||
      order.id.toLowerCase().includes(searchText.toLowerCase());
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleUpdateItemStatus = (orderId: string, itemId: string, newStatus: OrderItemStatus) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item =>
            item.id === itemId ? { ...item, status: newStatus } : item
          );
          // Update order status based on items
          let orderStatus: OrderStatus = order.status;
          if (updatedItems.every(i => i.status === 'served')) {
            orderStatus = 'served';
          } else if (updatedItems.every(i => i.status === 'ready' || i.status === 'served')) {
            orderStatus = 'ready';
          } else if (updatedItems.some(i => i.status === 'preparing')) {
            orderStatus = 'preparing';
          }
          return { ...order, items: updatedItems, status: orderStatus };
        }
        return order;
      })
    );
    message.success(t('staff.orders.messages.status_updated'));
  };

  const addToCart = (item: typeof menuCategories[0]['items'][0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(c => c.item.id === itemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
        .filter(c => c.quantity > 0);
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  const handleCreateOrder = () => {
    if (!selectedTable || cart.length === 0) {
      message.error(t('staff.orders.messages.select_table_and_items'));
      return;
    }

    const newOrder: Order = {
      id: `ORD${String(orders.length + 1).padStart(3, '0')}`,
      tableId: selectedTable,
      tableName: selectedTable,
      status: 'pending',
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      total: cartTotal,
      items: cart.map((c, idx) => ({
        id: `new_${idx}`,
        name: c.item.name,
        quantity: c.quantity,
        price: c.item.price,
        status: 'pending' as OrderItemStatus,
      })),
    };

    setOrders(prev => [newOrder, ...prev]);
    message.success(t('staff.orders.messages.order_created'));
    setIsNewOrderModalOpen(false);
    setCart([]);
    setSelectedTable('');
  };

  const renderOrderCard = (order: Order) => {
    const config = statusConfig[order.status];
    const pendingItems = order.items.filter(i => i.status === 'pending' || i.status === 'preparing').length;

    return (
      <div>
        <Card
          hoverable
          onClick={() => handleOrderClick(order)}
          style={{
            borderRadius: 12,
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E5E5E5',
            marginBottom: isMobile ? 12 : 16,
            cursor: 'pointer',
            overflow: 'hidden',
            background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
            boxShadow: mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
          }}
          styles={{ body: { padding: isMobile ? 14 : 20 } }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ flex: 1, minWidth: isMobile ? '100%' : 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12, marginBottom: isMobile ? 10 : 12 }}>
                <Avatar
                  style={{
                    background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                    fontWeight: 500,
                    fontSize: isMobile ? 12 : 14,
                  }}
                  size={isMobile ? 38 : 44}
                >
                  {order.tableName}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text strong style={{ fontSize: isMobile ? 15 : 17, fontWeight: 500 }}>{order.tableName}</Text>
                    {isMobile && (
                      <Tag
                        icon={config.icon}
                        color={config.color}
                        style={{
                          borderRadius: 8,
                          padding: '4px 12px',
                          fontSize: 12,
                          fontWeight: 500,
                          margin: 0,
                        }}
                      >
                        {config.text}
                      </Tag>
                    )}
                  </div>
                  <Text style={{
                    fontSize: isMobile ? 13 : 14,
                    color: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    fontWeight: 400,
                  }}>
                    {order.id} • {order.createdAt}
                  </Text>
                </div>
              </div>

              <div style={{ marginBottom: isMobile ? 10 : 12 }}>
                {order.items.slice(0, isMobile ? 2 : 3).map(item => (
                  <Tag
                    key={item.id}
                    color={itemStatusConfig[item.status].color}
                    style={{ marginBottom: 4, borderRadius: 8, fontSize: isMobile ? 12 : 13, fontWeight: 400 }}
                  >
                    {item.name} x{item.quantity}
                  </Tag>
                ))}
                {order.items.length > (isMobile ? 2 : 3) && (
                  <Tag style={{ borderRadius: 8, fontSize: isMobile ? 12 : 13, fontWeight: 400 }}>+{order.items.length - (isMobile ? 2 : 3)} món khác</Tag>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flexWrap: 'wrap' }}>
                <Text strong style={{
                  color: '#FF7A00',
                  fontSize: isMobile ? 16 : 18,
                  fontWeight: 500,
                }}>
                  {order.total.toLocaleString('vi-VN')}đ
                </Text>
                {pendingItems > 0 && (
                  <Badge
                    count={isMobile ? `${pendingItems} chưa xong` : `${pendingItems} món chưa xong`}
                    style={{
                      backgroundColor: mode === 'dark' ? 'rgba(255, 122, 0, 0.2)' : 'rgba(255, 122, 0, 0.1)',
                      color: '#FF7A00',
                      fontSize: isMobile ? 12 : 13,
                      fontWeight: 500,
                      border: `1px solid ${mode === 'dark' ? 'rgba(255, 122, 0, 0.3)' : 'rgba(255, 122, 0, 0.2)'}`,
                    }}
                  />
                )}
              </div>
            </div>

            {!isMobile && (
              <Tag
                icon={config.icon}
                color={config.color}
                style={{
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {config.text}
              </Tag>
            )}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div>
      {/* Header Stats */}
      <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={8} sm={8} md={8}>
          <Card
            style={{
              borderRadius: 12,
              background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
              border: mode === 'dark' ? '1px solid rgba(255, 122, 0, 0.2)' : '1px solid #E5E5E5',
              overflow: 'hidden',
              height: '100%',
              boxShadow: mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
            styles={{ body: { padding: isMobile ? 12 : 28 } }}
          >
            <div style={{ display: 'flex', alignItems: isMobile ? 'center' : 'flex-start', gap: isMobile ? 12 : 20, flexDirection: isMobile ? 'column' : 'row', height: '100%' }}>
              <div
                style={{
                  width: isMobile ? 40 : 56,
                  height: isMobile ? 40 : 56,
                  borderRadius: 10,
                  background: mode === 'dark' ? 'rgba(255, 122, 0, 0.1)' : 'rgba(255, 122, 0, 0.08)',
                  border: mode === 'dark' ? '1px solid rgba(255, 122, 0, 0.2)' : '1px solid rgba(255, 122, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ExclamationCircleOutlined style={{ fontSize: isMobile ? 20 : 24, color: '#FF7A00' }} />
              </div>
              <div style={{ textAlign: isMobile ? 'center' : 'left', flex: 1 }}>
                <Text style={{
                  fontSize: isMobile ? 28 : 36,
                  fontWeight: 500,
                  display: 'block',
                  color: mode === 'dark' ? '#FFFFFF' : '#1A1A1A',
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}>{stats.pending}</Text>
                <Text style={{
                  fontSize: isMobile ? 13 : 15,
                  color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  fontWeight: 400,
                  display: 'block',
                }}>Chờ xử lý</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={8} sm={8} md={8}>
          <Card
            style={{
              borderRadius: 12,
              background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
              border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E5E5E5',
              overflow: 'hidden',
              height: '100%',
              boxShadow: mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
            styles={{ body: { padding: isMobile ? 12 : 28 } }}
          >
            <div style={{ display: 'flex', alignItems: isMobile ? 'center' : 'flex-start', gap: isMobile ? 12 : 20, flexDirection: isMobile ? 'column' : 'row', height: '100%' }}>
              <div
                style={{
                  width: isMobile ? 40 : 56,
                  height: isMobile ? 40 : 56,
                  borderRadius: 10,
                  background: mode === 'dark' ? 'rgba(255, 122, 0, 0.1)' : 'rgba(255, 122, 0, 0.08)',
                  border: mode === 'dark' ? '1px solid rgba(255, 122, 0, 0.2)' : '1px solid rgba(255, 122, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <SyncOutlined style={{ fontSize: isMobile ? 20 : 24, color: '#FF7A00' }} />
              </div>
              <div style={{ textAlign: isMobile ? 'center' : 'left', flex: 1 }}>
                <Text style={{
                  fontSize: isMobile ? 28 : 36,
                  fontWeight: 500,
                  display: 'block',
                  color: mode === 'dark' ? '#FFFFFF' : '#1A1A1A',
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}>{stats.preparing}</Text>
                <Text style={{
                  fontSize: isMobile ? 13 : 15,
                  color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  fontWeight: 400,
                  display: 'block',
                }}>Đang nấu</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={8} sm={8} md={8}>
          <Card
            style={{
              borderRadius: 12,
              background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
              border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E5E5E5',
              overflow: 'hidden',
              height: '100%',
              boxShadow: mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
            styles={{ body: { padding: isMobile ? 12 : 28 } }}
          >
            <div style={{ display: 'flex', alignItems: isMobile ? 'center' : 'flex-start', gap: isMobile ? 12 : 20, flexDirection: isMobile ? 'column' : 'row', height: '100%' }}>
              <div
                style={{
                  width: isMobile ? 40 : 56,
                  height: isMobile ? 40 : 56,
                  borderRadius: 10,
                  background: mode === 'dark' ? 'rgba(255, 122, 0, 0.1)' : 'rgba(255, 122, 0, 0.08)',
                  border: mode === 'dark' ? '1px solid rgba(255, 122, 0, 0.2)' : '1px solid rgba(255, 122, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircleOutlined style={{ fontSize: isMobile ? 20 : 24, color: '#FF7A00' }} />
              </div>
              <div style={{ textAlign: isMobile ? 'center' : 'left', flex: 1 }}>
                <Text style={{
                  fontSize: isMobile ? 28 : 36,
                  fontWeight: 500,
                  display: 'block',
                  color: mode === 'dark' ? '#FFFFFF' : '#1A1A1A',
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}>{stats.ready}</Text>
                <Text style={{
                  fontSize: isMobile ? 13 : 15,
                  color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  fontWeight: 400,
                  display: 'block',
                }}>Sẵn sàng</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Search & Filter */}
      <Card
        style={{
          borderRadius: 12,
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E5E5E5',
          marginBottom: isMobile ? 16 : 24,
          background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
          boxShadow: mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
        styles={{ body: { padding: isMobile ? 16 : '20px 28px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={24} md={18} lg={18} xl={18}>
            <Search
              placeholder={isMobile ? t('staff.orders.search.placeholder') : t('staff.orders.search.placeholder_full')}
              allowClear
              size={isMobile ? 'middle' : 'large'}
              style={{ width: '100%' }}
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              onChange={e => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={24} md={6} lg={6} xl={6}>
            <Button
              type="primary"
              size={isMobile ? 'middle' : 'large'}
              icon={<PlusOutlined />}
              onClick={() => setIsNewOrderModalOpen(true)}
              block={isMobile || isTablet}
              style={{
                borderRadius: 12,
                height: isMobile ? 40 : 48,
                fontWeight: 500,
                background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                border: 'none',
                width: '100%',
              }}
            >
              {isMobile || isTablet ? t('staff.orders.create_order_short') : t('staff.orders.create_order')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Order List with Tabs */}
      <Card
        style={{
          borderRadius: 12,
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E5E5E5',
          background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
          boxShadow: mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
        styles={{ body: { padding: isMobile ? 16 : 24 } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size={isMobile ? 'small' : 'middle'}
          items={isMobile ? [
            { key: 'all', label: `${t('staff.orders.tabs.all')} (${orders.length})` },
            { key: 'pending', label: `${t('staff.orders.tabs.pending')} (${stats.pending})` },
            { key: 'preparing', label: `${t('staff.orders.tabs.preparing')} (${stats.preparing})` },
            { key: 'ready', label: `${t('staff.orders.tabs.ready')} (${stats.ready})` },
          ] : [
            { key: 'all', label: `${t('staff.orders.tabs.all')} (${orders.length})` },
            { key: 'pending', label: `${t('staff.orders.tabs.pending')} (${stats.pending})` },
            { key: 'preparing', label: `${t('staff.orders.tabs.preparing')} (${stats.preparing})` },
            { key: 'ready', label: `${t('staff.orders.tabs.ready')} (${stats.ready})` },
          ]}
        />

        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <div key={order.id}>
              {renderOrderCard(order)}
            </div>
          ))
        ) : (
          <Empty
            description="Không có order nào"
            style={{
              color: mode === 'dark' ? undefined : '#4F4F4F',
            }}
            styles={{
              image: {
                opacity: mode === 'dark' ? 0.65 : 0.4,
              }
            }}
          />
        )}
      </Card>

      {/* Order Detail Modal */}
      <Modal
        title={
          <Space>
            <ShoppingCartOutlined style={{ color: '#FF7A00' }} />
            <span>{t('staff.orders.modal.order_detail')} {selectedOrder?.id}</span>
          </Space>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={isMobile ? '95%' : 600}
        centered
        style={{
          backgroundColor: mode === 'dark' ? '#1A1A1A' : '#FFFFFF',
          border: mode === 'dark' ? '1px solid rgba(255, 122, 0, 0.2)' : '1px solid #E5E7EB',
          borderRadius: 12,
        }}
        styles={{
          body: { padding: isMobile ? 20 : 28 },
          header: {
            backgroundColor: mode === 'dark' ? '#1A1A1A' : '#FFFFFF',
            borderBottom: mode === 'dark' ? '1px solid rgba(255, 122, 0, 0.2)' : '1px solid #E5E7EB',
            borderRadius: '12px 12px 0 0',
            padding: '20px 28px',
            position: 'relative',
            paddingRight: '56px',
          },
          footer: {
            borderRadius: '0 0 12px 12px',
          },
          mask: {
            background: mode === 'dark' ? 'rgba(0, 0, 0, 0.92)' : 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            filter: 'none',
          },
        }}
      >
        {selectedOrder && (
          <div>
            {/* Order Info */}
            <Card
              size="small"
              style={{
                borderRadius: 12,
                background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                marginBottom: isMobile ? 16 : 20,
                border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E5E7EB',
                boxShadow: mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
              styles={{ body: { padding: isMobile ? '18px 20px' : '24px 28px' } }}
            >
              <Row gutter={[16, 0]}>
                <Col xs={8}>
                  <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12, display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    Bàn
                  </Text>
                  <Text strong style={{ fontSize: isMobile ? 15 : 17, display: 'block' }}>{selectedOrder.tableName}</Text>
                </Col>
                <Col xs={8}>
                  <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12, display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    Thời gian
                  </Text>
                  <Text strong style={{ fontSize: isMobile ? 15 : 17, display: 'block' }}>{selectedOrder.createdAt}</Text>
                </Col>
                <Col xs={8}>
                  <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12, display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    Trạng thái
                  </Text>
                  <Tag
                    icon={statusConfig[selectedOrder.status].icon}
                    color={statusConfig[selectedOrder.status].color}
                    style={{ marginTop: 0, fontSize: isMobile ? 11 : 12, borderRadius: 12, padding: '4px 12px' }}
                  >
                    {statusConfig[selectedOrder.status].text}
                  </Tag>
                </Col>
              </Row>
            </Card>

            {/* Items List */}
            <div>
              {selectedOrder.items.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '10px 0' : '14px 0',
                    borderBottom: index < selectedOrder.items.length - 1
                      ? mode === 'dark'
                        ? '1px solid var(--border)'
                        : '1px solid #E5E7EB'
                      : 'none',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Space size={isMobile ? 4 : 8}>
                      <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>{item.name}</Text>
                      <Tag style={{ fontSize: isMobile ? 12 : 13 }}>{item.quantity}x</Tag>
                    </Space>
                    <div>
                      <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </Text>
                    </div>
                  </div>
                  <Select
                    value={item.status}
                    size="small"
                    style={{ width: isMobile ? 90 : 110 }}
                    onChange={(value) => handleUpdateItemStatus(selectedOrder.id, item.id, value)}
                    options={[
                      { value: 'pending', label: t('staff.orders.item_status.pending') },
                      { value: 'preparing', label: t('staff.orders.item_status.preparing') },
                      { value: 'ready', label: t('staff.orders.item_status.ready') },
                      { value: 'served', label: t('staff.orders.item_status.served') },
                    ]}
                  />
                </div>
              ))}
            </div>

            <Divider style={{ margin: isMobile ? '12px 0' : '16px 0' }} />

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: isMobile ? 14 : 16 }}>{t('staff.orders.order.total')}</Text>
              <Text strong style={{ fontSize: isMobile ? 20 : 24, color: '#FF7A00' }}>
                {selectedOrder.total.toLocaleString('vi-VN')}đ
              </Text>
            </div>

            {/* Actions */}
            <Row gutter={[8, 8]} style={{ marginTop: isMobile ? 16 : 24 }}>
              <Col xs={12} sm={8}>
                <Button
                  icon={<PrinterOutlined />}
                  size={isMobile ? 'middle' : 'large'}
                  block
                  style={{ borderRadius: 12 }}
                >
                  {isMobile ? t('staff.orders.modal.print_short') : t('staff.orders.modal.print')}
                </Button>
              </Col>
              <Col xs={12} sm={8}>
                <Button
                  icon={<PlusOutlined />}
                  size={isMobile ? 'middle' : 'large'}
                  block
                  style={{ borderRadius: 12 }}
                >
                  {t('staff.orders.modal.add_item')}
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  size={isMobile ? 'middle' : 'large'}
                  block
                  style={{
                    borderRadius: 12,
                    background: '#52c41a',
                    border: 'none',
                  }}
                >
                  {t('staff.orders.modal.send_to_kitchen')}
                </Button>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* New Order Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#FF7A00' }} />
            <span>{t('staff.orders.modal.new_order')}</span>
          </Space>
        }
        open={isNewOrderModalOpen}
        onCancel={() => {
          setIsNewOrderModalOpen(false);
          setCart([]);
          setSelectedTable('');
        }}
        footer={null}
        width={isMobile ? '95%' : 900}
        centered
        style={{
          backgroundColor: mode === 'dark' ? '#1A1A1A' : '#FFFFFF',
          border: mode === 'dark' ? '1px solid rgba(255, 122, 0, 0.2)' : '1px solid #E5E7EB',
          borderRadius: 12,
        }}
        styles={{
          header: {
            backgroundColor: mode === 'dark' ? '#1A1A1A' : '#FFFFFF',
            borderBottom: mode === 'dark' ? '1px solid rgba(255, 122, 0, 0.2)' : '1px solid #E5E7EB',
            borderRadius: '12px 12px 0 0',
            padding: '20px 28px',
            position: 'relative',
            paddingRight: '56px',
          },
          body: {
            padding: isMobile ? 20 : 28,
            maxHeight: isMobile ? '80vh' : 'auto',
            overflowY: 'auto',
            backgroundColor: mode === 'dark' ? '#1A1A1A' : '#FFFFFF',
          },
          footer: {
            borderRadius: '0 0 12px 12px',
          },
          mask: {
            background: mode === 'dark' ? 'rgba(0, 0, 0, 0.92)' : 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            filter: 'none',
          },
        }}
      >
        <Row gutter={[16, 16]}>
          {/* Menu */}
          <Col xs={24} md={14}>
            <div style={{ marginBottom: 16 }}>
              <Select
                placeholder={t('staff.orders.modal.select_table')}
                size={isMobile ? 'middle' : 'large'}
                style={{ width: '100%' }}
                value={selectedTable || undefined}
                onChange={setSelectedTable}
                options={[
                  { value: 'A01', label: 'Bàn A01' },
                  { value: 'A05', label: 'Bàn A05' },
                  { value: 'B02', label: 'Bàn B02' },
                  { value: 'VIP02', label: 'Bàn VIP02' },
                ]}
              />
            </div>

            <Tabs
              activeKey={activeMenuCategory}
              onChange={setActiveMenuCategory}
              size={isMobile ? 'small' : 'middle'}
              items={menuCategories.map(cat => ({
                key: cat.id,
                label: (
                  <Space size={isMobile ? 4 : 8}>
                    {cat.icon}
                    {!isMobile && t(`staff.orders.menu.${cat.id}`)}
                  </Space>
                ),
              }))}
            />

            <Row gutter={[isMobile ? 8 : 12, isMobile ? 8 : 12]}>
              {menuCategories
                .find(c => c.id === activeMenuCategory)
                ?.items.map(item => (
                  <Col xs={24} sm={12} key={item.id}>
                    <Card
                      hoverable
                      size="small"
                      style={{ borderRadius: isMobile ? 12 : 16, overflow: 'hidden' }}
                      styles={{ body: { padding: isMobile ? 10 : 12 } }}
                      onClick={() => addToCart(item)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: isMobile ? 32 : 40,
                          height: isMobile ? 32 : 40,
                          borderRadius: 8,
                          background: 'var(--surface)',
                          color: '#FF7A00'
                        }}>
                          {getMenuItemIcon(item.id)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong style={{ display: 'block', fontSize: isMobile ? 13 : 14 }}>{item.name}</Text>
                          <Text style={{ color: '#FF7A00', fontSize: isMobile ? 12 : 14 }}>
                            {item.price.toLocaleString('vi-VN')}đ
                          </Text>
                        </div>
                        <PlusOutlined style={{ color: '#FF7A00', fontSize: isMobile ? 14 : 16 }} />
                      </div>
                    </Card>
                  </Col>
                ))}
            </Row>
          </Col>

          {/* Cart */}
          <Col xs={24} md={10}>
            <Card
              title={
                <Space size={isMobile ? 8 : 12}>
                  <ShoppingCartOutlined />
                  <span style={{ fontSize: isMobile ? 14 : 16 }}>{t('staff.orders.modal.cart')} ({cart.length})</span>
                </Space>
              }
              style={{
                borderRadius: 12,
                background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E5E7EB',
                overflow: 'hidden',
                boxShadow: mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
              styles={{ body: { padding: isMobile ? 16 : 24 } }}
            >
              {cart.length > 0 ? (
                <>
                  <div>
                    {cart.map((c, index) => (
                      <div
                        key={c.item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: isMobile ? '8px 0' : '12px 0',
                          borderBottom: index < cart.length - 1
                            ? mode === 'dark'
                              ? '1px solid var(--border)'
                              : '1px solid #E5E7EB'
                            : 'none',
                          gap: isMobile ? 8 : 12,
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: isMobile ? 28 : 32,
                          height: isMobile ? 28 : 32,
                          borderRadius: 6,
                          background: 'var(--surface)',
                          color: '#FF7A00'
                        }}>
                          {getMenuItemIcon(c.item.id)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500 }}>{c.item.name}</div>
                          <div style={{
                            fontSize: isMobile ? 12 : 14,
                            color: mode === 'dark' ? 'var(--text-muted)' : '#4F4F4F'
                          }}>
                            {(c.item.price * c.quantity).toLocaleString('vi-VN')}đ
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Button
                            type="text"
                            size="small"
                            icon={<MinusOutlined />}
                            onClick={() => updateCartQuantity(c.item.id, -1)}
                          />
                          <span style={{ minWidth: 20, textAlign: 'center', fontSize: isMobile ? 13 : 14 }}>
                            {c.quantity}
                          </span>
                          <Button
                            type="text"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => updateCartQuantity(c.item.id, 1)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Divider style={{ margin: isMobile ? '12px 0' : '16px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: isMobile ? 12 : 16 }}>
                    <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>{t('staff.orders.order.total')}</Text>
                    <Text strong style={{ fontSize: isMobile ? 16 : 18, color: '#FF7A00' }}>
                      {cartTotal.toLocaleString('vi-VN')}đ
                    </Text>
                  </div>

                  <Button
                    type="primary"
                    size={isMobile ? 'middle' : 'large'}
                    block
                    onClick={handleCreateOrder}
                    style={{
                      borderRadius: 12,
                      height: isMobile ? 44 : 48,
                      fontWeight: 500,
                      background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                      border: 'none',
                    }}
                  >
                    {t('staff.orders.create_order_short')}
                  </Button>
                </>
              ) : (
                <Empty
                  description="Chưa có món nào"
                  styles={{
                    image: {
                      opacity: mode === 'dark' ? 0.65 : 0.4,
                    }
                  }}
                  style={{
                    color: mode === 'dark' ? undefined : '#4F4F4F',
                  }}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Modal>

      <style jsx global>{`
        /* Modal border radius */
        .ant-modal-content {
          border-radius: 12px !important;
          overflow: hidden !important;
        }
        
        /* Modal close button positioning - inside header */
        .ant-modal-close {
          top: 16px !important;
          right: 20px !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 8px !important;
          background: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)'} !important;
          transition: all 0.2s ease !important;
        }
        .ant-modal-close:hover {
          background: ${mode === 'dark' ? 'rgba(255, 122, 0, 0.2)' : 'rgba(255, 122, 0, 0.15)'} !important;
        }
        .ant-modal-close-x {
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-size: 16px !important;
          color: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.65)'} !important;
        }
        .ant-modal-close:hover .ant-modal-close-x {
          color: ${mode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.85)'} !important;
        }
      `}</style>
    </div>
  );
}

