'use client';

import React, { useState, useEffect } from 'react';
import { useThemeMode } from '../../theme/AutoDarkThemeProvider';
import { TableMap2D } from '../../admin/tables/components/TableMap2D';
import { TableData as Map2DTableData } from '../../admin/tables/components/DraggableTable';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../components/I18nProvider';
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
  Tabs,
  message,
  Divider,
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
      color: '#FF380B',
      bgColor: isDark ? 'rgba(255, 56, 11, 0.15)' : 'rgba(255, 56, 11, 0.08)',
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
      color: '#FF380B',
      bgColor: isDark ? 'rgba(250, 173, 20, 0.15)' : '#fffbe6',
      text: t('staff.tables.status.cleaning'),
      icon: <ExclamationCircleOutlined />,
    },
  } as Record<TableStatus, { color: string; bgColor: string; text: string; icon: React.ReactNode }>;
};

type ViewMode = 'grid' | 'map';

export default function TableManagement() {
  const { mode } = useThemeMode();
  const { t, i18n } = useTranslation();
  const { language } = useLanguage();
  const [messageApi, contextHolder] = message.useMessage();
  const [tables, setTables] = useState<TableData[]>(initialTables);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpenTableModal, setIsOpenTableModal] = useState(false);
  const [activeZone, setActiveZone] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const statusConfig = getStatusConfig(mode, t);

  const filteredTables = activeZone === 'all'
    ? tables
    : tables.filter(t => t.zone === activeZone);

  // Convert tables to Map2D format
  // Calculate map layout (positions and markers)
  const { map2DTables, mapMarkers, mapHeight } = React.useMemo(() => {
    const markers: { id: string; label: string; position: { x: number; y: number }; style?: React.CSSProperties }[] = [];
    const mappedTables: Map2DTableData[] = [];

    // Group tables by zone
    const tablesByZone: Record<string, TableData[]> = {};
    const zones = activeZone === 'all'
      ? Array.from(new Set(tables.map(t => t.zone))).sort()
      : [activeZone];

    zones.forEach(zone => {
      tablesByZone[zone] = tables.filter(t => t.zone === zone);
    });

    let currentY = 40;
    const itemsPerRow = 5;
    const itemWidth = 130;
    const itemHeight = 130;

    zones.forEach(zone => {
      const zoneTables = tablesByZone[zone];
      if (zoneTables.length === 0) return;

      // Add Zone Label Marker
      markers.push({
        id: `zone-${zone}`,
        label: i18n.exists('staff.tables.zones.zone_' + zone.toLowerCase())
          ? t('staff.tables.zones.zone_' + zone.toLowerCase())
          : `${t('staff.tables.zones.zone')} ${zone}`,
        position: { x: 40, y: currentY - 30 },
        style: {
          fontSize: 18,
          fontWeight: 'bold',
          color: mode === 'dark' ? '#fff' : '#000',
          opacity: 0.8,
        }
      });

      // Position tables for this zone
      zoneTables.forEach((table, index) => {
        mappedTables.push({
          id: table.id,
          tenantId: 'tenant-1',
          name: table.name,
          seats: table.capacity,
          status: table.status === 'available' ? 'AVAILABLE' :
            table.status === 'occupied' ? 'OCCUPIED' :
              table.status === 'reserved' ? 'RESERVED' : 'DISABLED',
          area: table.zone,
          position: {
            x: 40 + (index % itemsPerRow) * itemWidth,
            y: currentY + Math.floor(index / itemsPerRow) * itemHeight
          },
        });
      });

      // Update Y for next zone (rows + specific gap)
      const rows = Math.ceil(zoneTables.length / itemsPerRow);
      currentY += rows * itemHeight + 80; // 80px gap between zones
    });

    return { map2DTables: mappedTables, mapMarkers: markers, mapHeight: Math.max(600, currentY + 50) };
  }, [tables, activeZone, mode, t]);

  const handleTableClick = (table: TableData) => {
    setSelectedTable(table);
    setIsModalOpen(true);
  };

  const handleMap2DTableClick = (mapTable: Map2DTableData) => {
    const foundTable = tables.find(t => t.id === mapTable.id);
    if (foundTable) {
      handleTableClick(foundTable);
    }
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
              startTime: new Date().toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
            }
            : t
        )
      );
      messageApi.success(t('staff.tables.messages.table_opened', { table: selectedTable.name, guests: values.guests }));
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
      messageApi.success(t('staff.tables.messages.table_closed', { table: selectedTable.name }));
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
      messageApi.success(t('staff.tables.messages.table_ready', { table: selectedTable.name }));
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
              <UserOutlined /> {table.capacity} {t('staff.tables.table.seats')}
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
                  <ClockCircleOutlined /> {t('staff.tables.table.from')} {table.startTime}
                </Text>
                <br />
                <Text style={{ fontSize: 14, color: '#FF380B', fontWeight: 500 }}>
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
      {contextHolder}
      {/* Header Stats */}
      {/* ... (existing stats render) ... */}

      <Card
        style={{
          borderRadius: 12,
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
        }}
        styles={{ body: { padding: isMobile ? 12 : 24 } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 12 : 16 }}>
          <Tabs
            activeKey={activeZone}
            onChange={setActiveZone}
            size={isMobile ? 'small' : 'middle'}
            items={[
              { key: 'all', label: `${t('staff.tables.zones.all')} (${tables.length})` },
              { key: 'A', label: `${t('staff.tables.zones.zone_a')} (${tables.filter(t => t.zone === 'A').length})` },
              { key: 'B', label: `${t('staff.tables.zones.zone_b')} (${tables.filter(t => t.zone === 'B').length})` },
              { key: 'VIP', label: `${t('staff.tables.zones.zone_vip')} (${tables.filter(t => t.zone === 'VIP').length})` },
            ]}
          />

          <div className="flex gap-2">
            <Button
              type={viewMode === 'grid' ? 'primary' : 'default'}
              onClick={() => setViewMode('grid')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              }
            >
              {t('staff.tables.view.grid')}
            </Button>
            <Button
              type={viewMode === 'map' ? 'primary' : 'default'}
              onClick={() => setViewMode('map')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
            >
              {t('staff.tables.view.map')}
            </Button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
            {filteredTables.map(table => (
              <Col xs={12} sm={8} md={6} lg={6} xl={4} key={table.id} style={{ display: 'flex' }}>
                {renderTableCard(table)}
              </Col>
            ))}
          </Row>
        ) : (
          <TableMap2D
            tables={map2DTables}
            onTableClick={handleMap2DTableClick}
            onTablePositionChange={() => { }}
            readOnly={true}
            height={mapHeight}
            showGrid={true}
            mapMarkers={mapMarkers}
            renderTableContent={(table) => {
              const hasOrder = table.status === 'OCCUPIED' || table.status === 'RESERVED';
              return (
                hasOrder && (
                  <div style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    background: '#FF380B',
                    color: 'white',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    !
                  </div>
                )
              );
            }}
          />
        )}
      </Card>
      {/* Table Detail Modal */}
      <Modal
        title={
          <Space>
            <TableOutlined style={{ color: '#FF380B' }} />
            <span>{t('staff.tables.modal.detail')} {selectedTable?.name}</span>
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
                    {t('staff.tables.modal.zone')}
                  </Text>
                  <Text strong style={{ fontSize: 16, display: 'block' }}>{t('staff.tables.zones.zone')} {selectedTable.zone}</Text>
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
                    {t('staff.tables.modal.capacity')}
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
                  background: mode === 'dark' ? 'rgba(255, 56, 11, 0.15)' : 'rgba(255, 56, 11, 0.08)',
                  border: `1px solid ${mode === 'dark' ? 'rgba(255, 56, 11, 0.3)' : 'rgba(255, 56, 11, 0.2)'}`,
                  marginBottom: 24,
                }}
                styles={{ body: { padding: '20px 24px' } }}
              >
                <Row gutter={[16, 0]}>
                  <Col span={8}>
                    <Text style={{ fontSize: 13, display: 'block', marginBottom: 8, fontWeight: 400, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                      {t('staff.tables.modal.guest_count')}
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
                      {t('staff.tables.modal.total')}
                    </Text>
                    <Text strong style={{ fontSize: 20, display: 'block', lineHeight: 1.2, color: '#FF380B' }}>
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
                      {t('staff.tables.modal.reserved_by')}
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
                    fontWeight: 500,
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
                      background: 'linear-gradient(135deg, #FF380B 0%, #FF380B 100%)',
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
                      fontWeight: 500,
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
                    fontWeight: 500,
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

