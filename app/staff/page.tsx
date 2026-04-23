'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useTenant } from '@/lib/contexts/TenantContext';
import orderService from '@/lib/services/orderService';
import orderSignalRService from '@/lib/services/orderSignalRService';
import { tableService, TableStatus } from '@/lib/services/tableService';
import {
  RightOutlined,
  ShoppingCartOutlined,
  SmileOutlined,
  TableOutlined
} from '@ant-design/icons';
import { HubConnectionState } from '@microsoft/signalr';
import { Button, Card, Col, Progress, Row, Space, Table, Tag, Typography } from 'antd';
import { motion } from 'framer-motion';
import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useThemeMode } from '../theme/AntdProvider';
import { formatVND } from "@/lib/utils/currency";

const { Title, Text } = Typography;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};

export default function StaffDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const { tenant } = useTenant();
  const { user } = useAuth();
  const lastRefreshRef = useRef<number | null>(null);
  const ordersInFlightRef = useRef(false);

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [tables, setTables] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch tables
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const data = await tableService.getAllTables();
        setTables(data);
      } catch (error) {
        console.error('Failed to fetch tables:', error);
      }
    };
    fetchTables();
  }, []);

  // Fetch recent orders — called once on mount, then driven by SignalR
  const fetchOrders = useCallback(async () => {
    if (ordersInFlightRef.current) return;
    ordersInFlightRef.current = true;

    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const query = {
        Status: 0,
        From: `${yyyy}-${mm}-${dd}T00:00:00Z`,
        To: `${yyyy}-${mm}-${dd}T23:59:59Z`,
      };
      const data = await orderService.getAllOrders(query);
      const mapped = (data ?? []).map((order: any) => {
        const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
        const tableSessions: Array<{ tableCode?: string; table?: { code?: string } }> =
          order.tableSessions ?? [];

        const tableCodes = tableSessions
          .map((s) => s?.tableCode || s?.table?.code)
          .filter((code): code is string => !!code);

        const tableDisplay =
          tableCodes.length > 0
            ? tableCodes.join(' - ')
            : order.tableId && order.tableId !== EMPTY_GUID
              ? order.tableId
              : '—';

        const itemCount = (order.orderDetails ?? []).length;
        const subTotal = Number(order.subTotal ?? order.totalAmount ?? 0);

        return {
          key: order.id,
          table: tableDisplay,
          items: itemCount,
          total: subTotal,
        };
      });
      setRecentOrders(mapped);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      ordersInFlightRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // stable — getTodayOrderQuery is pure, no deps needed

  const refreshOrders = useCallback(async () => {
    const now = Date.now();
    if (lastRefreshRef.current && now - lastRefreshRef.current < 2000) return;
    lastRefreshRef.current = now;
    await fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, []); // run once on mount only

  // SignalR realtime for orders
  useEffect(() => {
    if (!tenant?.id) return;

    const tenantId = tenant.id;
    let isMounted = true;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const handleOrderChange = (payload: any) => {
      if (!isMounted) return;
      const changedTenantId = payload?.tenantId || payload?.order?.tenantId;
      if (changedTenantId && changedTenantId !== tenantId) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!isMounted) return;
        refreshOrders();
      }, 300);
    };

    const events = ['orders.created', 'orders.updated', 'orders.deleted'];

    const setupSignalR = async () => {
      try {
        await orderSignalRService.start();
        if (!isMounted) return;

        const conn = orderSignalRService.getConnection();
        if (conn.state === HubConnectionState.Connected) {
          await orderSignalRService.joinTenantGroup(tenantId);
          if (!isMounted) return;

          events.forEach((event) => orderSignalRService.on(event, handleOrderChange));
        }
      } catch (error) {
        console.error('SignalR: Setup failed', error);
      }
    };

    setupSignalR();

    return () => {
      isMounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      events.forEach((event) => orderSignalRService.off(event, handleOrderChange));
      orderSignalRService.leaveTenantGroup(tenantId).catch(() => { });
    };
  }, [tenant?.id, refreshOrders]);

  const { t } = useTranslation();
  const { mode } = useThemeMode();

  const tableStatus = React.useMemo(() => {
    // Group tables by floorName
    const statusByZone: Record<string, { total: number, occupied: number, available: number, name: string }> = {};

    tables.forEach(table => {
      const zoneName = table.floorName || 'Khác';
      if (!statusByZone[zoneName]) {
        statusByZone[zoneName] = {
          total: 0, occupied: 0, available: 0,
          name: zoneName
        };
      }
      statusByZone[zoneName].total++;
      if (table.tableStatusId === TableStatus.Occupied) statusByZone[zoneName].occupied++;
      else if (table.tableStatusId === TableStatus.Available) statusByZone[zoneName].available++;
    });

    return Object.values(statusByZone);
  }, [tables]);

  const orderColumns = [
    {
      title: t('staff.orders.order.table'),
      dataIndex: 'table',
      key: 'table',
      width: '34%',
      align: 'left' as const,
      render: (text: string) => <Text strong style={{ fontSize: 14 }}>{t('staff.orders.order.table')} {text}</Text>,
    },
    {
      title: t('staff.tables.table.dishes'),
      dataIndex: 'items',
      key: 'items',
      width: '32%',
      align: 'center' as const,
      render: (items: number) => <Text style={{ fontSize: 14 }}>{items}</Text>,
    },
    {
      title: t('staff.orders.order.total'),
      dataIndex: 'total',
      key: 'total',
      width: '34%',
      align: 'right' as const,
      render: (total: number) => (
        <Text strong style={{ color: 'var(--primary)', fontSize: 14 }}>
          {formatVND(total)}
        </Text>
      ),
    },
  ];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t('staff.dashboard.greeting.morning');
    if (hour < 18) return t('staff.dashboard.greeting.afternoon');
    return t('staff.dashboard.greeting.evening');
  };
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <Card
          style={{
            marginBottom: isMobile ? 16 : 24,
            background: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255, 56, 11, 0.15) 0%, rgba(255, 56, 11, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(255, 56, 11, 0.08) 0%, rgba(255, 56, 11, 0.05) 100%)',
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 56, 11, 0.3)' : 'rgba(255, 56, 11, 0.2)'}`,
            borderRadius: isMobile ? 16 : 20,
            overflow: 'hidden',
          }}
          styles={{ body: { padding: 0 } }}
        >
          <div style={{ padding: isMobile ? '24px 20px' : '32px 40px', position: 'relative' }}>
            <Row align="middle" justify="space-between" gutter={[16, isMobile ? 20 : 16]}>
              <Col xs={24} md={16}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Title level={isMobile ? 4 : 3} style={{ color: 'var(--primary)', margin: 0, marginBottom: isMobile ? 12 : 8, fontWeight: 700 }}>
                    {getGreeting()}, {user?.fullName || user?.name || user?.email?.split('@')[0]}! <SmileOutlined style={{ marginLeft: 8 }} />
                  </Title>
                  <Text style={{ color: 'var(--text)', fontSize: isMobile ? 14 : 16 }}>
                    <Trans i18nKey="staff.dashboard.welcome_message" values={{ orders: recentOrders.length, tables: tables.filter(tb => tb.tableStatusId === TableStatus.Occupied).length }} components={[
                      <span key="0" />,
                      <motion.strong
                        key="1"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                        style={{ display: 'inline-block', color: 'var(--primary)' }}
                      />,
                      <span key="2" />,
                      <strong key="3" style={{ color: 'var(--primary)' }} />
                    ]} />
                  </Text>
                </motion.div>
              </Col>
            </Row>

            {/* Animated Decorative Elements - Hidden on mobile */}
            {!isMobile && (
              <>
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, 0],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    right: -50,
                    top: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    pointerEvents: 'none',
                  }}
                />
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, -5, 0],
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  style={{
                    position: 'absolute',
                    right: 80,
                    bottom: -80,
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    pointerEvents: 'none',
                  }}
                />
              </>
            )}
          </div>
        </Card>
      </motion.div>

      <Row gutter={[isMobile ? 12 : 24, isMobile ? 12 : 24]} style={{ display: 'flex', flexWrap: 'wrap' }}>
        {/* Recent Orders */}
        <Col xs={24} lg={16} style={{ display: 'flex' }}>
          <motion.div variants={itemVariants} style={{ width: '100%' }}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <Space size={isMobile ? 8 : 12}>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <ShoppingCartOutlined style={{ color: 'var(--primary)', fontSize: isMobile ? 16 : 20 }} />
                    </motion.div>
                    <span style={{ fontWeight: 600, fontSize: isMobile ? 14 : 16 }}>{t('staff.dashboard.recent_orders.title')}</span>
                    <Tag color="orange" style={{ borderRadius: 20, fontSize: isMobile ? 11 : 12, margin: 0 }}>
                      {t('staff.dashboard.recent_orders.processing_count', { count: recentOrders.length })}
                    </Tag>
                  </Space>
                  <Link href="/staff/orders">
                    <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                      <Button type="link" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: isMobile ? 12 : 14, padding: isMobile ? '0 4px' : '0 15px' }}>
                        {t('staff.dashboard.recent_orders.view_all')} <RightOutlined />
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              }
              style={{
                borderRadius: isMobile ? 12 : 16,
                border: '1px solid var(--border)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                height: '100%',
                minHeight: isMobile ? 'auto' : 420,
              }}
              styles={{ body: { padding: 0 } }}
            >
              <Table
                columns={orderColumns}
                dataSource={recentOrders}
                pagination={false}
                size="middle"
                scroll={isMobile ? { x: 300 } : undefined}
                rowClassName={(record) =>
                  record.status === 'completed' ? 'table-row-ready' : ''
                }
                tableLayout="fixed"
              />
            </Card>
          </motion.div>
        </Col>

        {/* Table Status */}
        <Col xs={24} lg={8} style={{ display: 'flex' }}>
          <motion.div variants={itemVariants} style={{ width: '100%' }}>
            <Card
              title={
                <Space>
                  <TableOutlined style={{ color: 'var(--primary)', fontSize: isMobile ? 16 : 20 }} />
                  <span style={{ fontWeight: 600, fontSize: isMobile ? 14 : 16 }}>{t('staff.dashboard.table_status.title')}</span>
                </Space>
              }
              style={{
                borderRadius: isMobile ? 12 : 16,
                border: '1px solid var(--border)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
            >
              {tableStatus.map((zone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ background: 'var(--card)', borderRadius: 12 }}
                  style={{
                    padding: '16px 12px',
                    marginLeft: -12,
                    marginRight: -12,
                    borderBottom: index < tableStatus.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text strong>{zone.name}</Text>
                    <Text type="secondary">
                      <motion.span
                        key={zone.available}
                        initial={{ scale: 1.5, color: '#52c41a' }}
                        animate={{ scale: 1, color: 'var(--text-muted)' }}
                        transition={{ duration: 0.3 }}
                      >
                        {zone.available}
                      </motion.span>
                      /{zone.total} {t('staff.dashboard.table_status.available')}
                    </Text>
                  </div>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                    style={{ transformOrigin: 'left' }}
                  >
                    <Progress
                      percent={(zone.occupied / zone.total) * 100}
                      showInfo={false}
                      strokeColor={{
                        '0%': 'var(--primary)',
                        '100%': '#FF6B3B',
                      }}
                      railColor="var(--border)"
                      size="small"
                    />
                  </motion.div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <Space size={4}>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#52c41a',
                        }}
                      />
                      <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {t('staff.dashboard.table_status.available')}: {zone.available}
                      </Text>
                    </Space>
                    <Space size={4}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--primary)',
                        }}
                      />
                      <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {t('staff.dashboard.table_status.occupied')}: {zone.occupied}
                      </Text>
                    </Space>
                  </div>
                </motion.div>
              ))}

              <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                <Link href="/staff/activity">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="primary"
                      block
                      size="large"
                      icon={<TableOutlined />}
                      style={{
                        borderRadius: 12,
                        height: 48,
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)',
                        border: 'none',
                        boxShadow: '0 4px 15px rgba(255, 56, 11, 0.3)',
                      }}
                    >
                      {t('staff.dashboard.actions.view_table_map')}
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <style jsx global>{`
        .luxury-btn:hover {
          background: ${mode === 'dark' ? 'rgba(255, 56, 11, 0.15)' : '#F8F8F8'} !important;
          border-color: ${mode === 'dark' ? 'rgba(255, 56, 11, 0.4)' : 'var(--primary)'} !important;
          transform: translateY(-1px);
        }
        .welcome-btn:hover {
          transform: scale(1.03);
          background: rgba(255, 255, 255, 0.3) !important;
        }
        .welcome-btn:active {
          transform: scale(0.97);
        }
        .luxury-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 56, 11, 0.4) !important;
        }
        .welcome-btn-primary:hover {
          transform: scale(1.03);
          box-shadow: 0 8px 25px rgba(0,0,0,0.2) !important;
        }
        .welcome-btn-primary:active {
          transform: scale(0.97);
        }
        .ant-table-wrapper .ant-table-tbody > tr > td {
          padding: 16px 20px !important;
          vertical-align: middle;
        }
        .ant-table-wrapper .ant-table-thead > tr > th {
          padding: 14px 20px !important;
          background: var(--card) !important;
          font-weight: 600;
          color: var(--text) !important;
          font-size: 13px;
        }
        .ant-table-wrapper .ant-table-thead > tr > th span,
        .ant-table-wrapper .ant-table-thead > tr > th .ant-table-column-title {
          color: var(--text) !important;
        }
        .ant-table-wrapper .ant-table-tbody > tr:hover > td {
          background: rgba(255, 56, 11, 0.08) !important;
        }
        .ant-table-wrapper .ant-table-tbody > tr:last-child > td {
          border-bottom: none;
        }
        .table-row-ready {
          background: rgba(82, 196, 26, 0.08) !important;
        }
        .table-row-ready:hover {
          background: rgba(82, 196, 26, 0.15) !important;
        }
        .table-row-pending {
          background: rgba(255, 56, 11, 0.05) !important;
        }
        .table-row-pending:hover {
          background: rgba(255, 56, 11, 0.12) !important;
        }
      `}</style>
    </motion.div>
  );
}
