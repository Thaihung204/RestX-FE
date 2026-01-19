'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Tag, Progress, Space, Avatar, Button, Tooltip, Flex } from 'antd';
import {
  TableOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  RightOutlined,
  ReloadOutlined,
  BellOutlined,
  FireOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import PageTransition from '../components/PageTransition';
import { useTranslation, Trans } from 'react-i18next';
import { useThemeMode } from '../theme/AutoDarkThemeProvider';

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

// Mock data for statistics - chỉ hiển thị thông tin hữu ích cho nhân viên
const statsData = [
  {
    title: 'Bàn đang phục vụ',
    value: 12,
    total: 20,
    icon: <TableOutlined />,
    color: '#FF380B',
    bgColor: 'rgba(255, 56, 11, 0.1)',
  },
  {
    title: 'Order đang xử lý',
    value: 8,
    icon: <ShoppingCartOutlined />,
    color: '#1890ff',
    bgColor: 'rgba(24, 144, 255, 0.1)',
    suffix: 'đơn',
    href: '/staff/orders',
    urgent: true,
  },
  {
    title: 'Món sẵn sàng',
    value: 3,
    icon: <CheckCircleOutlined />,
    color: '#52c41a',
    bgColor: 'rgba(82, 196, 26, 0.1)',
    suffix: 'món',
    href: '/staff/orders',
    urgent: true,
  },
  {
    title: 'Bàn cần thanh toán',
    value: 2,
    icon: <DollarOutlined />,
    color: '#FF380B',
    bgColor: 'rgba(255, 56, 11, 0.1)',
    suffix: 'bàn',
    href: '/staff/checkout',
    urgent: true,
  },
  {
    title: 'Bàn đang phục vụ',
    value: 12,
    total: 20,
    icon: <TableOutlined />,
    color: '#FF380B',
    bgColor: 'rgba(255, 56, 11, 0.1)',
    href: '/staff/tables',
  },
];

// Mock data for urgent orders - chỉ hiển thị order cần xử lý
const urgentOrders = [
  {
    key: '1',
    table: 'Bàn 05',
    items: 4,
    status: 'pending',
    time: '5 phút trước',
    priority: 'high',
  },
  {
    key: '2',
    table: 'Bàn 12',
    items: 6,
    status: 'preparing',
    time: '12 phút trước',
    priority: 'medium',
  },
  {
    key: '3',
    table: 'Bàn 03',
    items: 2,
    status: 'ready',
    time: '18 phút trước',
    priority: 'urgent',
  },
  {
    key: '5',
    table: 'Bàn 15',
    items: 3,
    status: 'preparing',
    time: '32 phút trước',
    priority: 'medium',
  },
  {
    key: '6',
    table: 'Bàn 02',
    items: 7,
    status: 'pending',
    time: '45 phút trước',
    priority: 'high',
  },
];

// Mock data for recent orders
const recentOrders = urgentOrders.slice(0, 5);

// Mock data for tables needing payment
const tablesNeedingPayment = [
  { table: 'A02', total: 750000, time: '2 giờ', guests: 3 },
  { table: 'A05', total: 1250000, time: '1.5 giờ', guests: 4 },
];

// Mock data for table status
const tableStatus = [
  { zone: 'Khu A', available: 4, occupied: 6, total: 10 },
  { zone: 'Khu B', available: 2, occupied: 4, total: 6 },
  { zone: 'Khu VIP', available: 1, occupied: 3, total: 4 },
];




// Animated counter component
const AnimatedCounter = ({ value, duration = 1 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const incrementTime = (duration * 1000) / end;

    const timer = setInterval(() => {
      start += Math.ceil(end / 50);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString('vi-VN')}</span>;
};

export default function StaffDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { t } = useTranslation();
  const { mode } = useThemeMode();

  const statsData = [
    {
      title: t('staff.dashboard.stats.serving_tables'), // 'Bàn đang phục vụ'
      value: 12,
      total: 20,
      icon: <TableOutlined />,
      color: '#FF380B',
      bgColor: 'rgba(255, 56, 11, 0.1)',
      suffix: t('staff.orders.order.table'),
    },
    {
      title: t('staff.dashboard.stats.processing_orders'), // 'Order đang xử lý'
      value: 8,
      icon: <ShoppingCartOutlined />,
      color: '#1890ff',
      bgColor: 'rgba(24, 144, 255, 0.1)',
      suffix: t('staff.dashboard.stats.orders_suffix'), // 'đơn'
    },
    {
      title: t('staff.dashboard.stats.today_revenue'), // 'Doanh thu hôm nay'
      value: 15750000,
      icon: <DollarOutlined />,
      color: '#52c41a',
      bgColor: 'rgba(82, 196, 26, 0.1)',
      prefix: '',
      isMoney: true,
    },
    {
      title: t('staff.dashboard.stats.today_hours'), // 'Giờ làm hôm nay'
      value: 5.5,
      icon: <ClockCircleOutlined />,
      color: '#722ed1',
      bgColor: 'rgba(114, 46, 209, 0.1)',
      suffix: t('staff.dashboard.stats.hours_suffix'), // 'giờ'
    },
  ];

  const recentOrders = [
    {
      key: '1',
      table: '05',
      items: 4,
      total: 850000,
      status: 'pending',
      time: 5,
    },
    {
      key: '2',
      table: '12',
      items: 6,
      total: 1250000,
      status: 'preparing',
      time: 12,
    },
    {
      key: '3',
      table: '03',
      items: 2,
      total: 420000,
      status: 'ready',
      time: 18,
    },
    {
      key: '4',
      table: '08',
      items: 5,
      total: 980000,
      status: 'served',
      time: 25,
    },
    {
      key: '5',
      table: '15',
      items: 3,
      total: 520000,
      status: 'preparing',
      time: 32,
    },
    {
      key: '6',
      table: '02',
      items: 7,
      total: 1680000,
      status: 'pending',
      time: 45,
    },
  ];

  const tableStatus = [
    { zone: t('staff.tables.zones.zone_a'), available: 4, occupied: 6, total: 10 },
    { zone: t('staff.tables.zones.zone_b'), available: 2, occupied: 4, total: 6 },
    { zone: t('staff.tables.zones.zone_vip'), available: 1, occupied: 3, total: 4 },
  ];

  const orderColumns = [
    {
      title: t('staff.orders.order.table'), // 'Bàn'
      dataIndex: 'table',
      key: 'table',
      width: '18%',
      render: (text: string) => <Text strong style={{ fontSize: 14 }}>{t('staff.orders.order.table')} {text}</Text>,
    },
    {
      title: t('staff.tables.table.dishes'), // 'Món'
      dataIndex: 'items',
      key: 'items',
      width: '14%',
      render: (items: number) => <Text style={{ fontSize: 14 }}>{items} {t('staff.tables.table.dishes')}</Text>,
    },
    {
      title: t('staff.orders.order.total'), // 'Tổng tiền'
      dataIndex: 'total',
      key: 'total',
      width: '22%',
      render: (total: number) => (
        <Text strong style={{ color: '#FF380B', fontSize: 14 }}>
          {total.toLocaleString('vi-VN')}đ
        </Text>
      ),
    },
    {
      title: t('staff.orders.order.status'), // 'Trạng thái'
      dataIndex: 'status',
      key: 'status',
      width: '24%',
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
          pending: { color: 'orange', text: t('staff.orders.status.pending'), icon: <ExclamationCircleOutlined /> },
          preparing: { color: 'blue', text: t('staff.orders.status.preparing'), icon: <SyncOutlined spin /> },
          ready: { color: 'green', text: t('staff.orders.status.ready'), icon: <CheckCircleOutlined /> },
          served: { color: 'default', text: t('staff.orders.status.served'), icon: <CheckCircleOutlined /> },
          // Mock data contains these exact status strings 
        };
        const config = statusConfig[status] || { color: 'default', text: status, icon: null };
        return (
          <Tag icon={config.icon} color={config.color} style={{ margin: 0 }}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: t('staff.orders.order.time'), // 'Thời gian'
      dataIndex: 'time',
      key: 'time',
      width: '22%',
      render: (time: number) => <Text type="secondary" style={{ fontSize: 14 }}>{t('common.time.minutes_ago', { count: time })}</Text>,
    },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t('staff.dashboard.greeting.morning');
    if (hour < 18) return t('staff.dashboard.greeting.afternoon');
    return t('staff.dashboard.greeting.evening');
  };
  return (
    <PageTransition minimumLoadingTime={1500}>
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
                    <Title level={isMobile ? 4 : 3} style={{ color: '#FF380B', margin: 0, marginBottom: isMobile ? 12 : 8, fontWeight: 700 }}>
                      {getGreeting()}, Nguyễn Văn A! <SmileOutlined style={{ marginLeft: 8 }} />
                    </Title>
                    <Text style={{ color: 'var(--text)', fontSize: isMobile ? 14 : 16 }}>
                      Bạn đang có{' '}
                      <motion.strong
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                        style={{ display: 'inline-block', color: '#FF380B' }}
                      >
                        8 order
                      </motion.strong>{' '}
                      cần xử lý và{' '}
                      <strong style={{ color: '#FF380B' }}>12 bàn</strong> đang phục vụ.
                    </Text>

                    <div style={{ marginTop: isMobile ? 16 : 16, display: 'flex', gap: isMobile ? 10 : 16, flexWrap: 'wrap' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: mode === 'dark' ? 'rgba(255, 56, 11, 0.15)' : 'rgba(255, 56, 11, 0.12)',
                        padding: isMobile ? '8px 16px' : '10px 20px',
                        borderRadius: 8,
                        border: mode === 'dark' ? '1px solid rgba(255, 56, 11, 0.3)' : '1px solid rgba(255, 56, 11, 0.25)',
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a' }} />
                        <Text style={{
                          color: 'var(--text)',
                          fontSize: isMobile ? 13 : 14,
                          fontWeight: 500,
                        }}>3 món sẵn sàng</Text>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: mode === 'dark' ? 'rgba(255, 56, 11, 0.15)' : 'rgba(255, 56, 11, 0.12)',
                        padding: isMobile ? '8px 16px' : '10px 20px',
                        borderRadius: 8,
                        border: mode === 'dark' ? '1px solid rgba(255, 56, 11, 0.3)' : '1px solid rgba(255, 56, 11, 0.25)',
                      }}>
                        <DollarOutlined style={{ color: '#FF380B', fontSize: isMobile ? 14 : 16 }} />
                        <Text style={{
                          color: 'var(--text)',
                          fontSize: isMobile ? 13 : 14,
                          fontWeight: 500,
                        }}>2 bàn cần thanh toán</Text>
                      </div>
                    </div>
                  </motion.div>
                </Col>
                <Col xs={24} md={8}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{ textAlign: isMobile ? 'left' : 'right' }}
                  >
                    <Flex vertical={!isMobile} gap={isMobile ? 10 : 12} wrap="wrap" style={{ display: 'inline-flex' }}>
                      <Link href="/staff/attendance" style={{ display: 'inline-block' }}>
                        <Button
                          size={isMobile ? 'middle' : 'large'}
                          icon={<CalendarOutlined />}
                          style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            color: '#fff',
                            borderRadius: 10,
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)',
                            fontSize: isMobile ? 12 : 14,
                            minWidth: isMobile ? 150 : 180,
                            height: isMobile ? 36 : 44,
                            transition: 'all 0.2s ease',
                          }}
                          className="welcome-btn"
                        >
                          {t('staff.dashboard.actions.view_schedule')}
                        </Button>
                      </Link>
                      <Link href="/staff/orders" style={{ display: 'inline-block' }}>
                        <Button
                          type="primary"
                          size={isMobile ? 'middle' : 'large'}
                          icon={<ShoppingCartOutlined />}
                          style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            color: '#FF380B',
                            border: 'none',
                            borderRadius: 10,
                            fontWeight: 600,
                            fontSize: isMobile ? 12 : 14,
                            minWidth: isMobile ? 150 : 180,
                            height: isMobile ? 36 : 44,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                            transition: 'all 0.2s ease',
                          }}
                          className="welcome-btn-primary"
                        >
                          {t('staff.dashboard.actions.create_order')}
                        </Button>
                      </Link>
                    </Flex>
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

        {/* Statistics Cards */}
        <motion.div variants={itemVariants}>
          <Row gutter={[isMobile ? 12 : 24, isMobile ? 12 : 24]} style={{ marginBottom: isMobile ? 16 : 24 }}>
            {statsData.map((stat, index) => (
              <Col xs={12} sm={12} lg={6} key={index} style={{ display: 'flex' }}>
                <motion.div
                  variants={itemVariants}
                  whileHover={!isMobile ? { y: -5, transition: { duration: 0.2 } } : undefined}
                  style={{ width: '100%' }}
                >
                  <Card
                    hoverable={!isMobile}
                    style={{
                      borderRadius: isMobile ? 12 : 16,
                      border: '1px solid var(--border)',
                      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.3s ease',
                      height: '100%',
                    }}
                    styles={{ body: { padding: isMobile ? 14 : 24, height: '100%' } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14, display: 'block' }}>
                          {stat.title}
                        </Text>
                        <div style={{ marginTop: isMobile ? 4 : 8 }}>
                          <motion.span
                            style={{
                              fontSize: isMobile ? 22 : 32,
                              fontWeight: 700,
                              color: stat.isMoney ? stat.color : 'var(--text)',
                              display: 'inline-block'
                            }}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                          >
                            {stat.isMoney ? (
                              <AnimatedCounter value={stat.value} />
                            ) : (
                              stat.value
                            )}
                          </motion.span>
                          {stat.suffix && (
                            <span style={{ fontSize: isMobile ? 12 : 16, color: 'var(--text-muted)', marginLeft: 4 }}>
                              {stat.suffix}
                            </span>
                          )}
                          {stat.isMoney && (
                            <span style={{ fontSize: isMobile ? 12 : 16, color: 'var(--text-muted)', marginLeft: 2 }}>đ</span>
                          )}
                        </div>
                        {stat.total && (
                          <div style={{ marginTop: isMobile ? 8 : 12 }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ delay: 0.5, duration: 0.8 }}
                            >
                              <Progress
                                percent={(stat.value / stat.total) * 100}
                                showInfo={false}
                                strokeColor={{
                                  '0%': stat.color,
                                  '100%': `${stat.color}80`,
                                }}
                                railColor="var(--border)"
                                size="small"
                              />
                            </motion.div>
                            <Text type="secondary" style={{ fontSize: isMobile ? 10 : 12 }}>
                              {stat.value}/{stat.total} {stat.suffix}
                            </Text>
                          </div>
                        )}
                      </div>
                      <motion.div
                        whileHover={!isMobile ? { scale: 1.1, rotate: 5 } : undefined}
                        transition={{ type: 'spring', stiffness: 300 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: isMobile ? 20 : 28,
                          color: stat.color,
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
                        {stat.icon}
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
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
                        <ShoppingCartOutlined style={{ color: '#FF380B', fontSize: isMobile ? 16 : 20 }} />
                      </motion.div>
                      <span style={{ fontWeight: 600, fontSize: isMobile ? 14 : 16 }}>{t('staff.dashboard.recent_orders.title')}</span>
                      <Tag color="orange" style={{ borderRadius: 20, fontSize: isMobile ? 11 : 12, margin: 0 }}>
                        {t('staff.dashboard.recent_orders.processing_count', { count: recentOrders.filter(o => o.status === 'pending' || o.status === 'preparing').length })}
                      </Tag>
                    </Space>
                    <Link href="/staff/orders">
                      <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                        <Button type="link" style={{ color: '#FF380B', fontWeight: 600, fontSize: isMobile ? 12 : 14, padding: isMobile ? '0 4px' : '0 15px' }}>
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
                  columns={isMobile ? orderColumns.filter((_, i) => i !== 2 && i !== 4) : orderColumns}
                  dataSource={recentOrders}
                  pagination={false}
                  size="middle"
                  scroll={isMobile ? { x: 300 } : undefined}
                  rowClassName={(record) =>
                    record.status === 'ready' ? 'table-row-ready' : ''
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
                    <TableOutlined style={{ color: '#FF380B', fontSize: isMobile ? 16 : 20 }} />
                    <span style={{ fontWeight: 600, fontSize: isMobile ? 14 : 16 }}>Tình trạng bàn</span>
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
                      <Text strong>{zone.zone}</Text>
                      <Text type="secondary">
                        <motion.span
                          key={zone.available}
                          initial={{ scale: 1.5, color: '#52c41a' }}
                          animate={{ scale: 1, color: 'var(--text-muted)' }}
                          transition={{ duration: 0.3 }}
                        >
                          {zone.available}
                        </motion.span>
                        /{zone.total} trống
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
                          '0%': '#FF380B',
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
                          Trống: {zone.available}
                        </Text>
                      </Space>
                      <Space size={4}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#FF380B',
                          }}
                        />
                        <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Đang phục vụ: {zone.occupied}
                        </Text>
                      </Space>
                    </div>
                  </motion.div>
                ))}

                <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                  <Link href="/staff/tables">
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
                          background: 'linear-gradient(135deg, #FF380B 0%, #FF380B 100%)',
                          border: 'none',
                          boxShadow: '0 4px 15px rgba(255, 56, 11, 0.3)',
                        }}
                      >
                        Xem sơ đồ bàn
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: isMobile ? 14 : 16 }}>
                  <ThunderboltOutlined style={{ marginRight: 6 }} /> {t('staff.dashboard.actions.quick_actions')}
                </span>
                <Tooltip title={t('staff.dashboard.actions.refresh_data')}>
                  <motion.div
                    animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Button
                      type="text"
                      icon={<ReloadOutlined />}
                      onClick={handleRefresh}
                      loading={isRefreshing}
                      size={isMobile ? 'small' : 'middle'}
                    />
                  </motion.div>
                </Tooltip>
              </div>
            }
            style={{
              marginTop: isMobile ? 16 : 24,
              borderRadius: isMobile ? 12 : 16,
              border: '1px solid var(--border)',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
            }}
          >
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
              {[
                { icon: <TableOutlined />, title: 'Mở bàn', color: '#FF380B', href: '/staff/tables' },
                { icon: <ShoppingCartOutlined />, title: 'Tạo order', color: '#1890ff', href: '/staff/orders' },
                { icon: <DollarOutlined />, title: 'Thanh toán', color: '#52c41a', href: '/staff/checkout' },
                { icon: <ClockCircleOutlined />, title: 'Chấm công', color: '#722ed1', href: '/staff/attendance' },
              ].map((action, index) => (
                <Col xs={12} sm={6} key={index}>
                  <Link href={action.href}>
                    <motion.div
                      whileHover={!isMobile ? {
                        scale: 1.03,
                        y: -5,
                        boxShadow: `0 10px 30px ${action.color}25`,
                      } : undefined}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Button
                        style={{
                          width: '100%',
                          height: isMobile ? 70 : 90,
                          borderRadius: 12,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: isMobile ? 4 : 8,
                          border: mode === 'dark' ? `1px solid rgba(255, 56, 11, 0.2)` : `1px solid ${action.color}30`,
                          background: mode === 'dark' ? 'rgba(255, 56, 11, 0.08)' : `${action.color}08`,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span style={{ fontSize: isMobile ? 22 : 28, color: action.color }}>
                          {action.icon}
                        </span>
                        <span style={{ fontWeight: 500, color: 'var(--text)', fontSize: isMobile ? 12 : 14 }}>{action.title}</span>
                      </Button>
                    </motion.div>
                  </Link>
                </Col>
              ))}
            </Row>
          </Card>
        </motion.div>

        <style jsx global>{`
        .luxury-btn:hover {
          background: ${mode === 'dark' ? 'rgba(255, 56, 11, 0.15)' : '#F8F8F8'} !important;
          border-color: ${mode === 'dark' ? 'rgba(255, 56, 11, 0.4)' : '#FF380B'} !important;
          transform: translateY(-1px);
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
          color: var(--text-muted);
          font-size: 13px;
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
    </PageTransition >
  );
}
