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
import { motion, AnimatePresence } from 'framer-motion';
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

// Helper function to get icon for menu item
const getMenuItemIcon = (itemId: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'm1': <AppstoreOutlined style={{ fontSize: 24 }} />,
    'm2': <AppstoreOutlined style={{ fontSize: 24 }} />,
    'm3': <AppstoreOutlined style={{ fontSize: 24 }} />,
    'm4': <AppstoreOutlined style={{ fontSize: 24 }} />,
    'm5': <AppstoreOutlined style={{ fontSize: 24 }} />,
    'm6': <AppstoreOutlined style={{ fontSize: 24 }} />,
    'm7': <AppstoreOutlined style={{ fontSize: 24 }} />,
    'm8': <AppstoreOutlined style={{ fontSize: 24 }} />,
    'm9': <CoffeeOutlined style={{ fontSize: 24 }} />,
    'm10': <CoffeeOutlined style={{ fontSize: 24 }} />,
    'm11': <CoffeeOutlined style={{ fontSize: 24 }} />,
    'm12': <CoffeeOutlined style={{ fontSize: 24 }} />,
  };
  return iconMap[itemId] || <ShoppingOutlined style={{ fontSize: 24 }} />;
};

// Mock menu data
const menuCategories = [
  {
    id: 'appetizer',
    name: 'Khai vị',
    icon: <CoffeeOutlined />,
    items: [
      { id: 'm1', name: 'Gỏi cuốn tôm thịt', price: 65000 },
      { id: 'm2', name: 'Chả giò hải sản', price: 85000 },
      { id: 'm3', name: 'Súp cua', price: 55000 },
    ],
  },
  {
    id: 'main',
    name: 'Món chính',
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
    name: 'Đồ uống',
    icon: <CoffeeOutlined />,
    items: [
      { id: 'm9', name: 'Nước ép cam', price: 45000 },
      { id: 'm10', name: 'Sinh tố bơ', price: 55000 },
      { id: 'm11', name: 'Coca Cola', price: 25000 },
      { id: 'm12', name: 'Bia Tiger', price: 35000 },
    ],
  },
];

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

const statusConfig: Record<OrderStatus, { color: string; text: string; icon: React.ReactNode }> = {
  pending: { color: 'orange', text: 'Chờ xử lý', icon: <ExclamationCircleOutlined /> },
  preparing: { color: 'blue', text: 'Đang nấu', icon: <SyncOutlined spin /> },
  ready: { color: 'green', text: 'Sẵn sàng', icon: <CheckCircleOutlined /> },
  served: { color: 'default', text: 'Đã phục vụ', icon: <CheckCircleOutlined /> },
  cancelled: { color: 'red', text: 'Đã hủy', icon: <ClockCircleOutlined /> },
};

const itemStatusConfig: Record<OrderItemStatus, { color: string; text: string }> = {
  pending: { color: 'orange', text: 'Chờ' },
  preparing: { color: 'blue', text: 'Đang nấu' },
  ready: { color: 'green', text: 'Sẵn sàng' },
  served: { color: 'default', text: 'Đã phục vụ' },
};

export default function OrderManagement() {
  const { message } = App.useApp();
  const { mode } = useThemeMode();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [cart, setCart] = useState<{ item: typeof menuCategories[0]['items'][0]; quantity: number }[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [activeMenuCategory, setActiveMenuCategory] = useState('appetizer');
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile viewport
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
    message.success('Đã cập nhật trạng thái món');
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
      message.error('Vui lòng chọn bàn và thêm món');
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
    message.success('Đã tạo order mới');
    setIsNewOrderModalOpen(false);
    setCart([]);
    setSelectedTable('');
  };

  const renderOrderCard = (order: Order) => {
    const config = statusConfig[order.status];
    const pendingItems = order.items.filter(i => i.status === 'pending' || i.status === 'preparing').length;
    
    return (
      <motion.div
        key={order.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        layout
      >
        <Card
          hoverable
          onClick={() => handleOrderClick(order)}
          style={{
            borderRadius: isMobile ? 12 : 16,
            border: '1px solid var(--border)',
            marginBottom: isMobile ? 12 : 16,
            cursor: 'pointer',
          }}
          styles={{ body: { padding: isMobile ? 14 : 20 } }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ flex: 1, minWidth: isMobile ? '100%' : 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12, marginBottom: isMobile ? 10 : 12 }}>
                <Avatar
                  style={{
                    background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                    fontWeight: 600,
                    fontSize: isMobile ? 12 : 14,
                  }}
                  size={isMobile ? 38 : 44}
                >
                  {order.tableName}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>{order.tableName}</Text>
                    {isMobile && (
                      <Tag
                        icon={config.icon}
                        color={config.color}
                        style={{
                          borderRadius: 20,
                          padding: '2px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        {config.text}
                      </Tag>
                    )}
                  </div>
                  <Text type="secondary" style={{ fontSize: isMobile ? 12 : 13 }}>
                    {order.id} • {order.createdAt}
                  </Text>
                </div>
              </div>

              <div style={{ marginBottom: isMobile ? 10 : 12 }}>
                {order.items.slice(0, isMobile ? 2 : 3).map(item => (
                  <Tag
                    key={item.id}
                    color={itemStatusConfig[item.status].color}
                    style={{ marginBottom: 4, borderRadius: 20, fontSize: isMobile ? 11 : 12 }}
                  >
                    {item.name} x{item.quantity}
                  </Tag>
                ))}
                {order.items.length > (isMobile ? 2 : 3) && (
                  <Tag style={{ borderRadius: 20, fontSize: isMobile ? 11 : 12 }}>+{order.items.length - (isMobile ? 2 : 3)} món khác</Tag>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flexWrap: 'wrap' }}>
                <Text strong style={{ color: '#FF7A00', fontSize: isMobile ? 15 : 16 }}>
                  {order.total.toLocaleString('vi-VN')}đ
                </Text>
                {pendingItems > 0 && (
                  <Badge 
                    count={isMobile ? `${pendingItems} chưa xong` : `${pendingItems} món chưa xong`} 
                    style={{ backgroundColor: '#faad14', fontSize: isMobile ? 10 : 12 }} 
                  />
                )}
              </div>
            </div>

            {!isMobile && (
              <Tag
                icon={config.icon}
                color={config.color}
                style={{
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {config.text}
              </Tag>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div>
      {/* Header Stats */}
      <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={8} sm={8}>
          <Card
            style={{
              borderRadius: isMobile ? 12 : 16,
              background: mode === 'dark' ? 'rgba(250, 173, 20, 0.15)' : '#fff7e6',
              border: `1px solid ${mode === 'dark' ? 'rgba(250, 173, 20, 0.3)' : '#ffd591'}`,
            }}
            styles={{ body: { padding: isMobile ? 12 : 24 } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flexDirection: isMobile ? 'column' : 'row' }}>
              <div
                style={{
                  width: isMobile ? 40 : 52,
                  height: isMobile ? 40 : 52,
                  borderRadius: isMobile ? 10 : 14,
                  background: '#faad14',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ExclamationCircleOutlined style={{ fontSize: isMobile ? 18 : 24, color: '#fff' }} />
              </div>
              <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
                <Text style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700 }}>{stats.pending}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Chờ xử lý</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={8} sm={8}>
          <Card
            style={{
              borderRadius: isMobile ? 12 : 16,
              background: mode === 'dark' ? 'rgba(24, 144, 255, 0.15)' : '#e6f7ff',
              border: `1px solid ${mode === 'dark' ? 'rgba(24, 144, 255, 0.3)' : '#91d5ff'}`,
            }}
            styles={{ body: { padding: isMobile ? 12 : 24 } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flexDirection: isMobile ? 'column' : 'row' }}>
              <div
                style={{
                  width: isMobile ? 40 : 52,
                  height: isMobile ? 40 : 52,
                  borderRadius: isMobile ? 10 : 14,
                  background: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SyncOutlined spin style={{ fontSize: isMobile ? 18 : 24, color: '#fff' }} />
              </div>
              <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
                <Text style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700 }}>{stats.preparing}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Đang nấu</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={8} sm={8}>
          <Card
            style={{
              borderRadius: isMobile ? 12 : 16,
              background: mode === 'dark' ? 'rgba(82, 196, 26, 0.15)' : '#f6ffed',
              border: `1px solid ${mode === 'dark' ? 'rgba(82, 196, 26, 0.3)' : '#b7eb8f'}`,
            }}
            styles={{ body: { padding: isMobile ? 12 : 24 } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flexDirection: isMobile ? 'column' : 'row' }}>
              <div
                style={{
                  width: isMobile ? 40 : 52,
                  height: isMobile ? 40 : 52,
                  borderRadius: isMobile ? 10 : 14,
                  background: '#52c41a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircleOutlined style={{ fontSize: isMobile ? 18 : 24, color: '#fff' }} />
              </div>
              <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
                <Text style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700 }}>{stats.ready}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Sẵn sàng</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Search & Filter */}
      <Card
        style={{
          borderRadius: isMobile ? 12 : 20,
          border: '1px solid var(--border)',
          marginBottom: isMobile ? 16 : 24,
        }}
        styles={{ body: { padding: isMobile ? 12 : '16px 24px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={16} md={18}>
            <Search
              placeholder={isMobile ? "Tìm order..." : "Tìm theo mã order hoặc tên bàn..."}
              allowClear
              size={isMobile ? 'middle' : 'large'}
              style={{ width: '100%' }}
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              onChange={e => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Button
              type="primary"
              size={isMobile ? 'middle' : 'large'}
              icon={<PlusOutlined />}
              onClick={() => setIsNewOrderModalOpen(true)}
              block={isMobile}
              style={{
                borderRadius: 12,
                height: isMobile ? 40 : 48,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                border: 'none',
              }}
            >
              {isMobile ? 'Tạo Order' : 'Tạo Order mới'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Order List with Tabs */}
      <Card
        style={{
          borderRadius: isMobile ? 12 : 20,
          border: '1px solid var(--border)',
        }}
        styles={{ body: { padding: isMobile ? 12 : 24 } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size={isMobile ? 'small' : 'middle'}
          items={isMobile ? [
            { key: 'all', label: `Tất cả (${orders.length})` },
            { key: 'pending', label: `Chờ (${stats.pending})` },
            { key: 'preparing', label: `Nấu (${stats.preparing})` },
            { key: 'ready', label: `Sẵn (${stats.ready})` },
          ] : [
            { key: 'all', label: `Tất cả (${orders.length})` },
            { key: 'pending', label: `Chờ xử lý (${stats.pending})` },
            { key: 'preparing', label: `Đang nấu (${stats.preparing})` },
            { key: 'ready', label: `Sẵn sàng (${stats.ready})` },
          ]}
        />

        <AnimatePresence>
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => renderOrderCard(order))
          ) : (
            <Empty description="Không có order nào" />
          )}
        </AnimatePresence>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        title={
          <Space>
            <ShoppingCartOutlined style={{ color: '#FF7A00' }} />
            <span>Chi tiết Order {selectedOrder?.id}</span>
          </Space>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={isMobile ? '95%' : 600}
        centered
        style={{ backgroundColor: '#0A0E14', border: '1px solid rgba(255, 255, 255, 0.08)' }}
        styles={{
          body: { padding: isMobile ? 16 : 24 },
          header: { backgroundColor: '#0A0E14', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' },
          mask: {
            background: 'rgba(0, 0, 0, 0.92)',
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
                background: 'var(--card)',
                marginBottom: isMobile ? 16 : 20,
              }}
            >
              <Row gutter={[12, 12]}>
                <Col xs={8}>
                  <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Bàn</Text>
                  <br />
                  <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>{selectedOrder.tableName}</Text>
                </Col>
                <Col xs={8}>
                  <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Thời gian</Text>
                  <br />
                  <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>{selectedOrder.createdAt}</Text>
                </Col>
                <Col xs={8}>
                  <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Trạng thái</Text>
                  <br />
                  <Tag
                    icon={statusConfig[selectedOrder.status].icon}
                    color={statusConfig[selectedOrder.status].color}
                    style={{ marginTop: 4, fontSize: isMobile ? 10 : 12 }}
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
                    borderBottom: index < selectedOrder.items.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Space size={isMobile ? 4 : 8}>
                      <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>{item.name}</Text>
                      <Tag style={{ fontSize: isMobile ? 10 : 12 }}>{item.quantity}x</Tag>
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
                      { value: 'pending', label: 'Chờ' },
                      { value: 'preparing', label: 'Đang nấu' },
                      { value: 'ready', label: 'Sẵn sàng' },
                      { value: 'served', label: 'Đã phục vụ' },
                    ]}
                  />
                </div>
              ))}
            </div>

            <Divider style={{ margin: isMobile ? '12px 0' : '16px 0' }} />

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: isMobile ? 14 : 16 }}>Tổng cộng</Text>
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
                  {isMobile ? 'In' : 'In hóa đơn'}
                </Button>
              </Col>
              <Col xs={12} sm={8}>
                <Button
                  icon={<PlusOutlined />}
                  size={isMobile ? 'middle' : 'large'}
                  block
                  style={{ borderRadius: 12 }}
                >
                  Thêm món
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
                  Gửi bếp
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
            <span>Tạo Order mới</span>
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
        style={{ backgroundColor: '#0A0E14', border: '1px solid rgba(255, 255, 255, 0.08)' }}
        styles={{
          header: { backgroundColor: '#0A0E14', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' },
          body: { padding: isMobile ? 16 : 24, maxHeight: isMobile ? '80vh' : 'auto', overflowY: 'auto', backgroundColor: '#0A0E14' },
          mask: {
            background: 'rgba(0, 0, 0, 0.92)',
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
                placeholder="Chọn bàn"
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
                    {!isMobile && cat.name}
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
                      style={{ borderRadius: isMobile ? 10 : 12 }}
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
                  <span style={{ fontSize: isMobile ? 14 : 16 }}>Giỏ hàng ({cart.length})</span>
                </Space>
              }
              style={{
                borderRadius: isMobile ? 12 : 16,
                background: 'var(--card)',
              }}
              styles={{ body: { padding: isMobile ? 12 : 24 } }}
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
                          borderBottom: index < cart.length - 1 ? '1px solid var(--border)' : 'none',
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
                          <div style={{ fontSize: isMobile ? 12 : 14, color: 'var(--text-muted)' }}>
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
                    <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>Tổng cộng</Text>
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
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                      border: 'none',
                    }}
                  >
                    Tạo Order
                  </Button>
                </>
              ) : (
                <Empty description="Chưa có món nào" />
              )}
            </Card>
          </Col>
        </Row>
      </Modal>
    </div>
  );
}

