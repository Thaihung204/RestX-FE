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
import { motion } from 'framer-motion';

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

const statusConfig: Record<TableStatus, { color: string; bgColor: string; text: string; icon: React.ReactNode }> = {
  available: {
    color: '#52c41a',
    bgColor: '#f6ffed',
    text: 'Trống',
    icon: <CheckCircleOutlined />,
  },
  occupied: {
    color: '#FF7A00',
    bgColor: '#fff7e6',
    text: 'Đang dùng',
    icon: <UserOutlined />,
  },
  reserved: {
    color: '#1890ff',
    bgColor: '#e6f7ff',
    text: 'Đã đặt',
    icon: <ClockCircleOutlined />,
  },
  cleaning: {
    color: '#faad14',
    bgColor: '#fffbe6',
    text: 'Đang dọn',
    icon: <ExclamationCircleOutlined />,
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
};

export default function TableManagement() {
  const [tables, setTables] = useState<TableData[]>(initialTables);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpenTableModal, setIsOpenTableModal] = useState(false);
  const [activeZone, setActiveZone] = useState('all');
  const [form] = Form.useForm();

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
      <motion.div
        key={table.id}
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Card
          hoverable
          onClick={() => handleTableClick(table)}
          style={{
            borderRadius: 16,
            border: `2px solid ${config.color}20`,
            background: config.bgColor,
            cursor: 'pointer',
            transition: 'all 0.3s',
            height: '100%',
            minHeight: 220,
          }}
          styles={{ body: { padding: 20, height: '100%', display: 'flex', flexDirection: 'column' } }}
        >
          <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Table Icon */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: `${config.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                border: `2px solid ${config.color}30`,
              }}
            >
              <TableOutlined style={{ fontSize: 28, color: config.color }} />
            </div>

            {/* Table Name */}
            <Title level={4} style={{ margin: '0 0 4px', color: '#111' }}>
              {table.name}
            </Title>

            {/* Capacity */}
            <Text type="secondary" style={{ fontSize: 13 }}>
              <UserOutlined /> {table.capacity} chỗ
            </Text>

            {/* Status Tag */}
            <div style={{ marginTop: 12 }}>
              <Tag
                icon={config.icon}
                color={config.color}
                style={{
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontWeight: 600,
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
              <div style={{ marginTop: 'auto', padding: '8px', background: '#fff', borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: '#888' }}>
                  <ClockCircleOutlined /> Từ {table.startTime}
                </Text>
                <br />
                <Text style={{ fontSize: 12, color: '#FF7A00', fontWeight: 600 }}>
                  {table.guests} khách • {table.order?.items} món
                </Text>
              </div>
            )}

            {table.status === 'reserved' && table.reservation && (
              <div style={{ marginTop: 'auto', padding: '8px', background: '#fff', borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: '#888' }}>
                  Đặt lúc {table.reservation.time}
                </Text>
                <br />
                <Text style={{ fontSize: 12, color: '#1890ff', fontWeight: 600 }}>
                  {table.reservation.name}
                </Text>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div>
      {/* Header Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {Object.entries(stats).map(([key, value]) => {
          const config = statusConfig[key as TableStatus];
          return (
            <Col xs={12} sm={6} key={key}>
              <Card
                style={{
                  borderRadius: 16,
                  border: `1px solid ${config.color}30`,
                  background: config.bgColor,
                }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: config.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 20,
                    }}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <Text style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>
                      {value}
                    </Text>
                    <br />
                    <Text style={{ fontSize: 13, color: '#666' }}>{config.text}</Text>
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
          borderRadius: 20,
          border: '1px solid #f0f0f0',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Tabs
          activeKey={activeZone}
          onChange={setActiveZone}
          style={{ marginBottom: 16 }}
          items={[
            { key: 'all', label: `Tất cả (${tables.length})` },
            { key: 'A', label: `Khu A (${tables.filter(t => t.zone === 'A').length})` },
            { key: 'B', label: `Khu B (${tables.filter(t => t.zone === 'B').length})` },
            { key: 'VIP', label: `Khu VIP (${tables.filter(t => t.zone === 'VIP').length})` },
          ]}
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={activeZone}
        >
          <Row gutter={[16, 16]} style={{ display: 'flex', flexWrap: 'wrap' }}>
            {filteredTables.map(table => (
              <Col xs={12} sm={8} md={6} lg={4} key={table.id} style={{ display: 'flex' }}>
                {renderTableCard(table)}
              </Col>
            ))}
          </Row>
        </motion.div>
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
        width={500}
        centered
      >
        {selectedTable && (
          <div>
            {/* Status Badge */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
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
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card size="small" style={{ borderRadius: 12, background: '#f9f9f9' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Khu vực</Text>
                  <br />
                  <Text strong>Khu {selectedTable.zone}</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ borderRadius: 12, background: '#f9f9f9' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Sức chứa</Text>
                  <br />
                  <Text strong>{selectedTable.capacity} người</Text>
                </Card>
              </Col>
            </Row>

            {/* Occupied Info */}
            {selectedTable.status === 'occupied' && selectedTable.order && (
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: '#fff7e6',
                  border: '1px solid #ffd591',
                  marginBottom: 24,
                }}
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Số khách</Text>
                    <br />
                    <Text strong style={{ fontSize: 18 }}>{selectedTable.guests}</Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Bắt đầu</Text>
                    <br />
                    <Text strong style={{ fontSize: 18 }}>{selectedTable.startTime}</Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Tổng tiền</Text>
                    <br />
                    <Text strong style={{ fontSize: 18, color: '#FF7A00' }}>
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
                  borderRadius: 12,
                  background: '#e6f7ff',
                  border: '1px solid #91d5ff',
                  marginBottom: 24,
                }}
              >
                <Flex vertical gap={12} style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Khách đặt</Text>
                    <br />
                    <Text strong>{selectedTable.reservation.name}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Thời gian đặt</Text>
                    <br />
                    <Text strong>{selectedTable.reservation.time}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Số điện thoại</Text>
                    <br />
                    <Text strong>{selectedTable.reservation.phone}</Text>
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
                    fontWeight: 600,
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
                      fontWeight: 600,
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
                      fontWeight: 600,
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
                    fontWeight: 600,
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
        width={400}
        centered
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
    </div>
  );
}

