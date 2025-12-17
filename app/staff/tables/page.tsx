'use client';

import React, { useState, useEffect } from 'react';
import { useThemeMode } from '../../theme/AutoDarkThemeProvider';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  Tabs,
  Badge,
  Tooltip,
  message,
  Divider,
  Avatar,
  Timeline,
Flex,
} from 'antd';
import {
  TableOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Table status types
type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

interface TableData {
  id: string;
  name: string;
  zone: string;
  capacity: number;
  status: TableStatus;
  guests?: number;
  startTime?: string;
  order?: {
    id: string;
    items: number;
    total: number;
  };
  reservation?: {
    name: string;
    time: string;
    phone: string;
  };
}

// Mock table data
const initialTables: TableData[] = [
  // Zone A
  { id: 'a1', name: 'A01', zone: 'A', capacity: 4, status: 'available' },
  { id: 'a2', name: 'A02', zone: 'A', capacity: 4, status: 'occupied', guests: 3, startTime: '18:30', order: { id: 'ORD001', items: 5, total: 750000 } },
  { id: 'a3', name: 'A03', zone: 'A', capacity: 2, status: 'occupied', guests: 2, startTime: '19:00', order: { id: 'ORD002', items: 3, total: 420000 } },
  { id: 'a4', name: 'A04', zone: 'A', capacity: 4, status: 'reserved', reservation: { name: 'Nguyễn Văn B', time: '20:00', phone: '0901234567' } },
  { id: 'a5', name: 'A05', zone: 'A', capacity: 6, status: 'available' },
  { id: 'a6', name: 'A06', zone: 'A', capacity: 4, status: 'cleaning' },
  // Zone B
  { id: 'b1', name: 'B01', zone: 'B', capacity: 4, status: 'occupied', guests: 4, startTime: '18:00', order: { id: 'ORD003', items: 8, total: 1250000 } },
  { id: 'b2', name: 'B02', zone: 'B', capacity: 2, status: 'available' },
  { id: 'b3', name: 'B03', zone: 'B', capacity: 4, status: 'occupied', guests: 2, startTime: '19:15', order: { id: 'ORD004', items: 4, total: 580000 } },
  { id: 'b4', name: 'B04', zone: 'B', capacity: 6, status: 'reserved', reservation: { name: 'Trần Thị C', time: '19:30', phone: '0912345678' } },
  // Zone VIP
  { id: 'v1', name: 'VIP01', zone: 'VIP', capacity: 8, status: 'occupied', guests: 6, startTime: '18:45', order: { id: 'ORD005', items: 12, total: 3500000 } },
  { id: 'v2', name: 'VIP02', zone: 'VIP', capacity: 10, status: 'available' },
  { id: 'v3', name: 'VIP03', zone: 'VIP', capacity: 12, status: 'reserved', reservation: { name: 'Lê Văn D', time: '20:30', phone: '0923456789' } },
];

const getStatusConfig = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';
  return {
    available: {
      color: '#52c41a',
      bgColor: isDark ? 'rgba(82, 196, 26, 0.15)' : '#f6ffed',
      text: 'Trống',
      icon: <CheckCircleOutlined />,
    },
    occupied: {
      color: '#FF7A00',
      bgColor: isDark ? 'rgba(255, 122, 0, 0.15)' : '#fff7e6',
      text: 'Đang dùng',
      icon: <UserOutlined />,
    },
    reserved: {
      color: '#1890ff',
      bgColor: isDark ? 'rgba(24, 144, 255, 0.15)' : '#e6f7ff',
      text: 'Đã đặt',
      icon: <ClockCircleOutlined />,
    },
    cleaning: {
      color: '#faad14',
      bgColor: isDark ? 'rgba(250, 173, 20, 0.15)' : '#fffbe6',
      text: 'Đang dọn',
      icon: <ExclamationCircleOutlined />,
    },
  } as Record<TableStatus, { color: string; bgColor: string; text: string; icon: React.ReactNode }>;
};


export default function TableManagement() {
  const { mode } = useThemeMode();
  const [tables, setTables] = useState<TableData[]>(initialTables);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpenTableModal, setIsOpenTableModal] = useState(false);
  const [activeZone, setActiveZone] = useState('all');
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const statusConfig = getStatusConfig(mode);

  const filteredTables = activeZone === 'all' 
    ? tables 
    : tables.filter(t => t.zone === activeZone);

  const stats = {
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    cleaning: tables.filter(t => t.status === 'cleaning').length,
  };

  const handleTableClick = (table: TableData) => {
    setSelectedTable(table);
    setIsModalOpen(true);
  };

  const handleOpenTable = () => {
    if (selectedTable) {
      setIsModalOpen(false);
      setIsOpenTableModal(true);
    }
  };

  const handleConfirmOpenTable = (values: { guests: number }) => {
    if (selectedTable) {
      setTables(prev =>
        prev.map(t =>
          t.id === selectedTable.id
            ? {
                ...t,
                status: 'occupied' as TableStatus,
                guests: values.guests,
                startTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              }
            : t
        )
      );
      message.success(`Đã mở ${selectedTable.name} với ${values.guests} khách`);
      setIsOpenTableModal(false);
      form.resetFields();
    }
  };

  const handleCloseTable = () => {
    if (selectedTable) {
      setTables(prev =>
        prev.map(t =>
          t.id === selectedTable.id
            ? { ...t, status: 'cleaning' as TableStatus, guests: undefined, startTime: undefined, order: undefined }
            : t
        )
      );
      message.success(`Đã đóng ${selectedTable.name}`);
      setIsModalOpen(false);
    }
  };

  const handleFinishCleaning = () => {
    if (selectedTable) {
      setTables(prev =>
        prev.map(t =>
          t.id === selectedTable.id
            ? { ...t, status: 'available' as TableStatus }
            : t
        )
      );
      message.success(`${selectedTable.name} đã sẵn sàng`);
      setIsModalOpen(false);
    }
  };

  const renderTableCard = (table: TableData) => {
    const config = statusConfig[table.status];
    
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <Card
          hoverable
          onClick={() => handleTableClick(table)}
          style={{
            borderRadius: 12,
            border: `2px solid ${config.color}20`,
            background: config.bgColor,
            cursor: 'pointer',
            transition: 'all 0.3s',
            height: '100%',
            minHeight: isMobile ? 180 : 220,
            width: '100%',
            overflow: 'hidden',
          }}
          styles={{ body: { padding: isMobile ? 14 : 20, height: '100%', display: 'flex', flexDirection: 'column' } }}
        >
          <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Table Icon */}
            <div
              style={{
                width: isMobile ? 48 : 64,
                height: isMobile ? 48 : 64,
                borderRadius: 12,
                background: `${config.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                border: `2px solid ${config.color}30`,
              }}
            >
              <TableOutlined style={{ fontSize: isMobile ? 20 : 28, color: config.color }} />
            </div>

            {/* Table Name */}
            <Title level={isMobile ? 5 : 4} style={{ margin: '0 0 4px', color: 'var(--text)', fontSize: isMobile ? 16 : undefined }}>
              {table.name}
            </Title>

            {/* Capacity */}
            <Text style={{ fontSize: isMobile ? 13 : 14, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', fontWeight: 400 }}>
              <UserOutlined /> {table.capacity} chỗ
            </Text>

            {/* Status Tag */}
            <div style={{ marginTop: 12 }}>
              <Tag
                icon={config.icon}
                color={config.color}
                style={{
                  borderRadius: 12,
                  padding: '4px 12px',
                  fontWeight: 500,
                  border: 'none',
                }}
              >
                {config.text}
              </Tag>
            </div>

            {/* Additional Info - Spacer for equal heights */}
            <div style={{ flex: 1, minHeight: 12 }} />

            {/* Additional Info */}
            {table.status === 'occupied' && table.startTime && (
              <div style={{ marginTop: 'auto', padding: '8px', background: 'var(--card)', borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <ClockCircleOutlined /> Từ {table.startTime}
                </Text>
                <br />
                <Text style={{ fontSize: 14, color: '#FF7A00', fontWeight: 500 }}>
                  {table.guests} khách • {table.order?.items} món
                </Text>
              </div>
            )}

            {table.status === 'reserved' && table.reservation && (
              <div style={{ marginTop: 'auto', padding: '8px', background: 'var(--card)', borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Đặt lúc {table.reservation.time}
                </Text>
                <br />
                <Text style={{ fontSize: 14, color: '#1890ff', fontWeight: 500 }}>
                  {table.reservation.name}
                </Text>
              </div>
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
        {Object.entries(stats).map(([key, value]) => {
          const config = statusConfig[key as TableStatus];
          return (
            <Col xs={12} sm={12} md={6} lg={6} key={key} style={{ display: 'flex' }}>
              <Card
                style={{
                  borderRadius: 12,
                  border: `1px solid ${config.color}30`,
                  background: config.bgColor,
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                }}
                styles={{ body: { padding: isMobile ? '12px 16px' : '16px 20px', background: config.bgColor } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
                  <div
                    style={{
                      width: isMobile ? 36 : 44,
                      height: isMobile ? 36 : 44,
                      borderRadius: isMobile ? 10 : 12,
                      background: config.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: isMobile ? 16 : 20,
                      flexShrink: 0,
                    }}
                  >
                    {config.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <Text style={{ fontSize: isMobile ? 22 : 28, fontWeight: 500, color: 'var(--text)', display: 'block' }}>
                      {value}
                    </Text>
                    <Text style={{ fontSize: isMobile ? 13 : 15, color: 'var(--text-muted)', display: 'block', fontWeight: 400 }}>{config.text}</Text>
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Zone Tabs & Table Grid */}
      <Card
        style={{
          borderRadius: 12,
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
        }}
        styles={{ body: { padding: isMobile ? 12 : 24 } }}
      >
        <Tabs
          activeKey={activeZone}
          onChange={setActiveZone}
          style={{ marginBottom: isMobile ? 12 : 16 }}
          size={isMobile ? 'small' : 'middle'}
          items={[
            { key: 'all', label: `Tất cả (${tables.length})` },
            { key: 'A', label: `Khu A (${tables.filter(t => t.zone === 'A').length})` },
            { key: 'B', label: `Khu B (${tables.filter(t => t.zone === 'B').length})` },
            { key: 'VIP', label: `Khu VIP (${tables.filter(t => t.zone === 'VIP').length})` },
          ]}
        />

        <div>
          <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
            {filteredTables.map(table => (
              <Col xs={12} sm={8} md={6} lg={6} xl={4} key={table.id} style={{ display: 'flex' }}>
                {renderTableCard(table)}
              </Col>
            ))}
          </Row>
        </div>
      </Card>

      {/* Table Detail Modal */}
      <Modal
        title={
          <Space>
            <TableOutlined style={{ color: '#FF7A00' }} />
            <span>Chi tiết {selectedTable?.name}</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={isMobile ? '95%' : 500}
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
            padding: '16px 24px',
            paddingRight: '56px',
          },
          body: { backgroundColor: mode === 'dark' ? '#0A0E14' : '#FFFFFF' },
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
        {selectedTable && (
          <div>
            {/* Status Badge */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 12,
                  background: statusConfig[selectedTable.status].bgColor,
                  border: `3px solid ${statusConfig[selectedTable.status].color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <TableOutlined
                  style={{
                    fontSize: 36,
                    color: statusConfig[selectedTable.status].color,
                  }}
                />
              </div>
              <Tag
                color={statusConfig[selectedTable.status].color}
                style={{ fontSize: 14, padding: '4px 16px', borderRadius: 20 }}
              >
                {statusConfig[selectedTable.status].text}
              </Tag>
            </div>

            {/* Info Grid */}
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
              <Col span={12}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 16,
                    background: mode === 'dark' ? 'var(--card)' : '#FFFFFF',
                    border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
                    overflow: 'hidden',
                    boxShadow: mode === 'dark' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.2s ease',
                  }}
                  styles={{ body: { padding: '16px 20px' } }}
                >
                  <Text style={{ fontSize: 13, display: 'block', marginBottom: 8, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                    Khu vực
                  </Text>
                  <Text strong style={{ fontSize: 16, display: 'block' }}>Khu {selectedTable.zone}</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 16,
                    background: mode === 'dark' ? 'var(--card)' : '#FFFFFF',
                    border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
                    overflow: 'hidden',
                    boxShadow: mode === 'dark' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.2s ease',
                  }}
                  styles={{ body: { padding: '16px 20px' } }}
                >
                  <Text style={{ fontSize: 13, display: 'block', marginBottom: 8, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                    Sức chứa
                  </Text>
                  <Text strong style={{ fontSize: 16, display: 'block' }}>{selectedTable.capacity} người</Text>
                </Card>
              </Col>
            </Row>

            {/* Occupied Info */}
            {selectedTable.status === 'occupied' && selectedTable.order && (
              <Card
                size="small"
                style={{
                  borderRadius: 16,
                  background: mode === 'dark' 
                    ? 'linear-gradient(135deg, rgba(255, 122, 0, 0.15) 0%, rgba(255, 154, 64, 0.1) 100%)'
                    : 'linear-gradient(135deg, #fff7e6 0%, #fffbf0 100%)',
                  border: `1px solid ${mode === 'dark' ? 'rgba(255, 122, 0, 0.3)' : '#ffd591'}`,
                  marginBottom: 20,
                  overflow: 'hidden',
                  boxShadow: mode === 'dark' ? 'none' : '0 2px 12px rgba(255, 122, 0, 0.1)',
                }}
                styles={{ body: { padding: '20px 24px' } }}
              >
                <Row gutter={[16, 0]}>
                  <Col span={8}>
                    <Text style={{ fontSize: 13, display: 'block', marginBottom: 8, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                      Số khách
                    </Text>
                    <Text strong style={{ fontSize: 20, display: 'block', lineHeight: 1.2 }}>
                      {selectedTable.guests}
                    </Text>
                  </Col>
                  <Col span={8}>
                    <Text style={{ fontSize: 13, display: 'block', marginBottom: 8, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                      Bắt đầu
                    </Text>
                    <Text strong style={{ fontSize: 20, display: 'block', lineHeight: 1.2 }}>
                      {selectedTable.startTime}
                    </Text>
                  </Col>
                  <Col span={8}>
                    <Text style={{ fontSize: 13, display: 'block', marginBottom: 8, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                      Tổng tiền
                    </Text>
                    <Text strong style={{ fontSize: 20, display: 'block', lineHeight: 1.2, color: '#FF7A00' }}>
                      {selectedTable.order.total.toLocaleString('vi-VN')}đ
                    </Text>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Reserved Info */}
            {selectedTable.status === 'reserved' && selectedTable.reservation && (
              <Card
                size="small"
                style={{
                  borderRadius: 16,
                  background: mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(24, 144, 255, 0.15) 0%, rgba(24, 144, 255, 0.1) 100%)'
                    : 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)',
                  border: `1px solid ${mode === 'dark' ? 'rgba(24, 144, 255, 0.3)' : '#91d5ff'}`,
                  marginBottom: 20,
                  overflow: 'hidden',
                  boxShadow: mode === 'dark' ? 'none' : '0 2px 12px rgba(24, 144, 255, 0.1)',
                }}
                styles={{ body: { padding: '20px 24px' } }}
              >
                <Flex vertical gap={16} style={{ width: '100%' }}>
                  <div>
                    <Text style={{ fontSize: 13, display: 'block', marginBottom: 6, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                      Khách đặt
                    </Text>
                    <Text strong style={{ fontSize: 15, display: 'block' }}>{selectedTable.reservation.name}</Text>
                  </div>
                  <div>
                    <Text style={{ fontSize: 13, display: 'block', marginBottom: 6, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                      Thời gian đặt
                    </Text>
                    <Text strong style={{ fontSize: 15, display: 'block' }}>{selectedTable.reservation.time}</Text>
                  </div>
                  <div>
                    <Text style={{ fontSize: 13, display: 'block', marginBottom: 6, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                      Số điện thoại
                    </Text>
                    <Text strong style={{ fontSize: 15, display: 'block' }}>{selectedTable.reservation.phone}</Text>
                  </div>
                </Flex>
              </Card>
            )}

            {/* Actions */}
            <Divider />
            <Flex vertical gap={12} style={{ width: '100%' }}>
              {selectedTable.status === 'available' && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  block
                  onClick={handleOpenTable}
                  style={{
                    borderRadius: 12,
                    height: 48,
                    fontWeight: 500,
                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    border: 'none',
                  }}
                >
                  Mở bàn
                </Button>
              )}

              {selectedTable.status === 'occupied' && (
                <>
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    size="large"
                    block
                    style={{
                      borderRadius: 12,
                      height: 48,
                      fontWeight: 500,
                      background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                      border: 'none',
                    }}
                  >
                    Thêm món
                  </Button>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Button
                        icon={<SwapOutlined />}
                        size="large"
                        block
                        style={{ borderRadius: 12, height: 48 }}
                      >
                        Chuyển bàn
                      </Button>
                    </Col>
                    <Col span={12}>
                      <Button
                        icon={<DollarOutlined />}
                        size="large"
                        block
                        style={{
                          borderRadius: 12,
                          height: 48,
                          background: '#52c41a',
                          color: '#fff',
                          border: 'none',
                        }}
                      >
                        Thanh toán
                      </Button>
                    </Col>
                  </Row>
                  <Button
                    danger
                    size="large"
                    block
                    onClick={handleCloseTable}
                    style={{ borderRadius: 12, height: 48 }}
                  >
                    Đóng bàn
                  </Button>
                </>
              )}

              {selectedTable.status === 'reserved' && (
                <>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    size="large"
                    block
                    onClick={handleOpenTable}
                    style={{
                      borderRadius: 12,
                      height: 48,
                      fontWeight: 500,
                      background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                      border: 'none',
                    }}
                  >
                    Khách đã đến - Mở bàn
                  </Button>
                  <Button
                    icon={<EditOutlined />}
                    size="large"
                    block
                    style={{ borderRadius: 12, height: 48 }}
                  >
                    Sửa thông tin đặt bàn
                  </Button>
                </>
              )}

              {selectedTable.status === 'cleaning' && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  size="large"
                  block
                  onClick={handleFinishCleaning}
                  style={{
                    borderRadius: 12,
                    height: 48,
                    fontWeight: 500,
                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    border: 'none',
                  }}
                >
                  Hoàn thành dọn dẹp
                </Button>
              )}
            </Flex>
          </div>
        )}
      </Modal>

      {/* Open Table Modal */}
      <Modal
        title="Mở bàn mới"
        open={isOpenTableModal}
        onCancel={() => {
          setIsOpenTableModal(false);
          form.resetFields();
        }}
        footer={null}
        width={isMobile ? '95%' : 400}
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
            padding: '16px 24px',
            paddingRight: '56px',
          },
          body: { backgroundColor: mode === 'dark' ? '#0A0E14' : '#FFFFFF' },
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
        <Form
          form={form}
          layout="vertical"
          onFinish={handleConfirmOpenTable}
          initialValues={{ guests: 2 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: '#f6ffed',
                border: '2px solid #52c41a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <TableOutlined style={{ fontSize: 28, color: '#52c41a' }} />
            </div>
            <Title level={4} style={{ margin: 0 }}>
              {selectedTable?.name}
            </Title>
            <Text type="secondary">Sức chứa: {selectedTable?.capacity} người</Text>
          </div>

          <Form.Item
            name="guests"
            label="Số lượng khách"
            rules={[
              { required: true, message: 'Vui lòng nhập số khách' },
              {
                type: 'number',
                max: selectedTable?.capacity,
                message: `Tối đa ${selectedTable?.capacity} khách`,
              },
            ]}
          >
            <InputNumber
              min={1}
              max={selectedTable?.capacity}
              size="large"
              style={{ width: '100%', borderRadius: 12 }}
              addonAfter="khách"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              style={{
                borderRadius: 12,
                height: 48,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                border: 'none',
              }}
            >
              Xác nhận mở bàn
            </Button>
          </Form.Item>
        </Form>
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
          background: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)'} !important;
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

