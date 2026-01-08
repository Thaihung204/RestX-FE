'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { useTranslation } from 'react-i18next';

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

const getStatusConfig = (mode: 'light' | 'dark', t: (key: string) => string) => {
  const isDark = mode === 'dark';
  return {
    available: {
      color: '#52c41a',
      bgColor: isDark ? 'rgba(82, 196, 26, 0.15)' : '#f6ffed',
      text: t('staff.tables.status.available'),
      icon: <CheckCircleOutlined />,
    },
    occupied: {
      color: '#FF7A00',
      bgColor: isDark ? 'rgba(255, 122, 0, 0.15)' : '#fff7e6',
      text: t('staff.tables.status.occupied'),
      icon: <UserOutlined />,
    },
    reserved: {
      color: '#1890ff',
      bgColor: isDark ? 'rgba(24, 144, 255, 0.15)' : '#e6f7ff',
      text: t('staff.tables.status.reserved'),
      icon: <ClockCircleOutlined />,
    },
    cleaning: {
      color: '#faad14',
      bgColor: isDark ? 'rgba(250, 173, 20, 0.15)' : '#fffbe6',
      text: t('staff.tables.status.cleaning'),
      icon: <ExclamationCircleOutlined />,
    },
  } as Record<TableStatus, { color: string; bgColor: string; text: string; icon: React.ReactNode }>;
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
  const { mode } = useThemeMode();
  const { t } = useTranslation();
  const [tables, setTables] = useState<TableData[]>(initialTables);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpenTableModal, setIsOpenTableModal] = useState(false);
  const [activeZone, setActiveZone] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [form] = Form.useForm();
  
  const statusConfig = getStatusConfig(mode, t);

  // Check viewport
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < 576); // xs breakpoint
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

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
      message.success(t('staff.tables.messages.table_opened', { table: selectedTable.name, guests: values.guests }));
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
      message.success(t('staff.tables.messages.table_closed', { table: selectedTable.name }));
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
      message.success(t('staff.tables.messages.table_ready', { table: selectedTable.name }));
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
            <Title level={4} style={{ margin: '0 0 4px', color: 'var(--text)' }}>
              {table.name}
            </Title>

            {/* Capacity */}
            <Text style={{ fontSize: isMobile ? 13 : 14, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', fontWeight: 400 }}>
              <UserOutlined /> {table.capacity} {t('staff.tables.table.seats')}
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
              <div style={{ marginTop: 'auto', padding: '8px', background: 'var(--card)', borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <ClockCircleOutlined /> {t('staff.tables.table.from')} {table.startTime}
                </Text>
                <br />
                <Text style={{ fontSize: 14, color: '#FF7A00', fontWeight: 500 }}>
                  {table.guests} {t('staff.tables.table.guests')} • {table.order?.items} {t('staff.tables.table.dishes')}
                </Text>
              </div>
            )}

            {table.status === 'reserved' && table.reservation && (
              <div style={{ marginTop: 'auto', padding: '8px', background: 'var(--card)', borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {t('staff.tables.table.booked_at')} {table.reservation.time}
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
                styles={{ body: { padding: '16px 20px', background: config.bgColor } }}
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
                    <Text style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
                      {value}
                    </Text>
                    <br />
                    <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>{config.text}</Text>
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
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Tabs
          activeKey={activeZone}
          onChange={setActiveZone}
          style={{ marginBottom: 16 }}
          items={[
            { key: 'all', label: `${t('staff.tables.zones.all')} (${tables.length})` },
            { key: 'A', label: `${t('staff.tables.zones.zone_a')} (${tables.filter(t => t.zone === 'A').length})` },
            { key: 'B', label: `${t('staff.tables.zones.zone_b')} (${tables.filter(t => t.zone === 'B').length})` },
            { key: 'VIP', label: `${t('staff.tables.zones.zone_vip')} (${tables.filter(t => t.zone === 'VIP').length})` },
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
            <span>{t('staff.tables.modal.detail')} {selectedTable?.name}</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={500}
        centered
        style={{ backgroundColor: '#0A0E14', border: '1px solid rgba(255, 255, 255, 0.08)' }}
        styles={{
          header: { backgroundColor: '#0A0E14', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' },
          body: { backgroundColor: '#0A0E14' },
          mask: {
            background: 'rgba(0, 0, 0, 0.92)',
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
                    {t('staff.tables.modal.zone')}
                  </Text>
                  <Text strong style={{ fontSize: 16, display: 'block' }}>
                    {selectedTable.zone === 'A' ? t('staff.tables.zones.zone_a') :
                     selectedTable.zone === 'B' ? t('staff.tables.zones.zone_b') :
                     selectedTable.zone === 'VIP' ? t('staff.tables.zones.zone_vip') :
                     selectedTable.zone}
                  </Text>
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
                    {t('staff.tables.table.capacity')}
                  </Text>
                  <Text strong style={{ fontSize: 16, display: 'block' }}>{selectedTable.capacity} {t('staff.tables.table.guests')}</Text>
                </Card>
              </Col>
            </Row>

            {/* Occupied Info */}
            {selectedTable.status === 'occupied' && selectedTable.order && (
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: mode === 'dark' ? 'rgba(255, 122, 0, 0.15)' : '#fff7e6',
                  border: `1px solid ${mode === 'dark' ? 'rgba(255, 122, 0, 0.3)' : '#ffd591'}`,
                  marginBottom: 24,
                }}
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Text style={{ fontSize: 13, display: 'block', marginBottom: 8, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                      {t('staff.tables.modal.guests_count')}
                    </Text>
                    <Text strong style={{ fontSize: 20, display: 'block', lineHeight: 1.2 }}>
                      {selectedTable.guests}
                    </Text>
                  </Col>
                  <Col span={8}>
                    <Text style={{ fontSize: 13, display: 'block', marginBottom: 8, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                      {t('staff.tables.modal.start_time')}
                    </Text>
                    <Text strong style={{ fontSize: 20, display: 'block', lineHeight: 1.2 }}>
                      {selectedTable.startTime}
                    </Text>
                  </Col>
                  <Col span={8}>
                    <Text style={{ fontSize: 13, display: 'block', marginBottom: 8, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                      {t('staff.tables.modal.total_amount')}
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
                  borderRadius: 12,
                  background: mode === 'dark' ? 'rgba(24, 144, 255, 0.15)' : '#e6f7ff',
                  border: `1px solid ${mode === 'dark' ? 'rgba(24, 144, 255, 0.3)' : '#91d5ff'}`,
                  marginBottom: 24,
                }}
              >
                <Flex vertical gap={12} style={{ width: '100%' }}>
                  <div>
                    <Text style={{ fontSize: 13, display: 'block', marginBottom: 6, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                      {t('staff.tables.modal.reservation_name')}
                    </Text>
                    <Text strong style={{ fontSize: 15, display: 'block' }}>{selectedTable.reservation.name}</Text>
                  </div>
                  <div>
                    <Text style={{ fontSize: 13, display: 'block', marginBottom: 6, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                      {t('staff.tables.modal.reservation_time')}
                    </Text>
                    <Text strong style={{ fontSize: 15, display: 'block' }}>{selectedTable.reservation.time}</Text>
                  </div>
                  <div>
                    <Text style={{ fontSize: 13, display: 'block', marginBottom: 6, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                      {t('staff.tables.modal.phone')}
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
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    border: 'none',
                  }}
                >
                  {t('staff.tables.actions.open_table')}
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
                    {t('staff.tables.actions.add_dish')}
                  </Button>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Button
                        icon={<SwapOutlined />}
                        size="large"
                        block
                        style={{ borderRadius: 12, height: 48 }}
                      >
                        {t('staff.tables.actions.transfer_table')}
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
                        {t('staff.tables.actions.checkout')}
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
                    {t('staff.tables.actions.close_table')}
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
                    {t('staff.tables.actions.guest_arrived')}
                  </Button>
                  <Button
                    icon={<EditOutlined />}
                    size="large"
                    block
                    style={{ borderRadius: 12, height: 48 }}
                  >
                    {t('staff.tables.actions.edit_reservation')}
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
                  {t('staff.tables.actions.finish_cleaning')}
                </Button>
              )}
            </Flex>
          </div>
        )}
      </Modal>

      {/* Open Table Modal */}
      <Modal
        title={t('staff.tables.modal.open_table')}
        open={isOpenTableModal}
        onCancel={() => {
          setIsOpenTableModal(false);
          form.resetFields();
        }}
        footer={null}
        width={400}
        centered
        style={{ backgroundColor: '#0A0E14', border: '1px solid rgba(255, 255, 255, 0.08)' }}
        styles={{
          header: { backgroundColor: '#0A0E14', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' },
          body: { backgroundColor: '#0A0E14' },
          mask: {
            background: 'rgba(0, 0, 0, 0.92)',
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
            <Text type="secondary">{t('staff.tables.table.capacity')}: {selectedTable?.capacity} {t('staff.tables.table.guests')}</Text>
          </div>

          <Form.Item
            name="guests"
            label={t('staff.tables.modal.guests_count')}
            rules={[
              { required: true, message: t('staff.tables.messages.enter_guests') },
              {
                type: 'number',
                max: selectedTable?.capacity,
                message: t('staff.tables.messages.max_guests', { capacity: selectedTable?.capacity }),
              },
            ]}
          >
            <InputNumber
              min={1}
              max={selectedTable?.capacity}
              size="large"
              style={{ width: '100%', borderRadius: 12 }}
              addonAfter={t('staff.tables.table.guests')}
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
              {t('staff.tables.modal.confirm_open')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

