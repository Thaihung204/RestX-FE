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
import Link from 'next/link';
import PageTransition from '../components/PageTransition';
import { useThemeMode } from '../theme/AutoDarkThemeProvider';

const { Title, Text } = Typography;

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
    color: '#faad14',
    bgColor: 'rgba(250, 173, 20, 0.1)',
    suffix: 'bàn',
    href: '/staff/checkout',
    urgent: true,
  },
  {
    title: 'Bàn đang phục vụ',
    value: 12,
    total: 20,
    icon: <TableOutlined />,
    color: '#FF7A00',
    bgColor: 'rgba(255, 122, 0, 0.1)',
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

const orderColumns = [
  {
    title: 'Bàn',
    dataIndex: 'table',
    key: 'table',
    width: '25%',
    render: (text: string) => <Text strong style={{ fontSize: 14 }}>{text}</Text>,
  },
  {
    title: 'Món',
    dataIndex: 'items',
    key: 'items',
    width: '20%',
    render: (items: number) => <Text style={{ fontSize: 14 }}>{items} món</Text>,
  },
  {
    title: 'Tổng tiền',
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
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    width: '35%',
    render: (status: string) => {
      const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
        pending: { color: 'orange', text: 'Chờ xử lý', icon: <ExclamationCircleOutlined /> },
        preparing: { color: 'blue', text: 'Đang nấu', icon: <SyncOutlined spin /> },
        ready: { color: 'green', text: 'Sẵn sàng', icon: <CheckCircleOutlined /> },
      };
      const config = statusConfig[status];
      return (
        <Tag icon={config.icon} color={config.color} style={{ margin: 0, fontSize: 13 }}>
          {config.text}
        </Tag>
      );
    },
  },
  {
    title: 'Thời gian',
    dataIndex: 'time',
    key: 'time',
    width: '20%',
    render: (time: string) => <Text type="secondary" style={{ fontSize: 14 }}>{time}</Text>,
  },
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
  const { mode } = useThemeMode();
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

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
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
            background: 'linear-gradient(135deg, #FF380B 0%, #FF380B 100%)',
            border: 'none',
            borderRadius: isMobile ? 16 : 20,
            overflow: 'hidden',
          }}
          styles={{ body: { padding: 0 } }}
        >
          <div style={{ padding: isMobile ? '20px 16px' : '32px 40px', position: 'relative' }}>
            <Row align="middle" justify="space-between" gutter={[16, 16]}>
              <Col xs={24} md={16}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Title level={isMobile ? 4 : 3} style={{ color: '#fff', margin: 0, marginBottom: 8 }}>
                    {getGreeting()}, Nguyễn Văn A! <SmileOutlined style={{ marginLeft: 8 }} />
                  </Title>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: isMobile ? 14 : 16 }}>
                    Bạn đang có{' '}
                    <motion.strong
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                      style={{ display: 'inline-block' }}
                    >
                      8 order
                    </motion.strong>{' '}
                    cần xử lý và{' '}
                    <strong>12 bàn</strong> đang phục vụ.
                  </Text>
                  
                  {/* Live status indicators */}
                  <div style={{ marginTop: isMobile ? 12 : 16, display: 'flex', gap: isMobile ? 8 : 16, flexWrap: 'wrap' }}>
                    <motion.div
                      animate={{ opacity: [1, 0.6, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{
                        color: mode === 'dark' ? '#FF7A00' : '#1A1A1A',
                        margin: 0,
                        marginBottom: 12,
                        fontWeight: 500,
                        letterSpacing: '-0.5px',
                        fontSize: isMobile ? 24 : 32,
                      }}
                    >
                      {getGreeting()}, Nguyễn Văn A
                    </Title>
                    <Text style={{
                      color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.65)',
                      fontSize: isMobile ? 15 : 17,
                      lineHeight: 1.6,
                      fontWeight: 400,
                    }}>
                      Bạn đang có <strong style={{ color: mode === 'dark' ? '#FF7A00' : '#FF7A00', fontWeight: 600 }}>8 order</strong> cần xử lý và <strong style={{ color: mode === 'dark' ? '#FF7A00' : '#FF7A00', fontWeight: 600 }}>2 bàn</strong> cần thanh toán.
                    </Text>

                    {/* Status indicators - Elegant */}
                    <div style={{ marginTop: isMobile ? 20 : 28, display: 'flex', gap: isMobile ? 12 : 16, flexWrap: 'wrap' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: mode === 'dark' ? 'rgba(255, 122, 0, 0.1)' : 'rgba(255, 122, 0, 0.08)',
                        padding: isMobile ? '8px 16px' : '10px 20px',
                        borderRadius: 8,
                        border: mode === 'dark' ? '1px solid rgba(255, 122, 0, 0.2)' : '1px solid rgba(255, 122, 0, 0.15)',
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a' }} />
                        <Text style={{
                          color: mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1A1A1A',
                          fontSize: isMobile ? 13 : 14,
                          fontWeight: 500,
                        }}>3 món sẵn sàng</Text>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: mode === 'dark' ? 'rgba(255, 122, 0, 0.1)' : 'rgba(255, 122, 0, 0.08)',
                        padding: isMobile ? '8px 16px' : '10px 20px',
                        borderRadius: 8,
                        border: mode === 'dark' ? '1px solid rgba(255, 122, 0, 0.2)' : '1px solid rgba(255, 122, 0, 0.15)',
                      }}>
                        <DollarOutlined style={{ color: '#FF7A00', fontSize: isMobile ? 14 : 16 }} />
                        <Text style={{
                          color: mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1A1A1A',
                          fontSize: isMobile ? 13 : 14,
                          fontWeight: 500,
                        }}>2 bàn cần thanh toán</Text>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={24} md={8} lg={8}>
                  <div style={{ textAlign: isMobile ? 'left' : 'right', width: '100%' }}>
                    <Flex
                      vertical={isMobile}
                      gap={isMobile ? 12 : 16}
                      wrap="wrap"
                      style={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: isMobile ? 'flex-start' : 'flex-end',
                      }}
                    >
                      <Link href="/staff/attendance" style={{ width: isMobile ? '100%' : 'auto' }}>
                        <Button
                          size={isMobile ? 'large' : 'large'}
                          icon={<CalendarOutlined />}
                          block={isMobile}
                          style={{
                            background: mode === 'dark' ? 'rgba(255, 122, 0, 0.1)' : '#FFFFFF',
                            border: mode === 'dark' ? '1px solid rgba(255, 122, 0, 0.3)' : '1px solid #E5E5E5',
                            color: mode === 'dark' ? '#FF7A00' : '#1A1A1A',
                            borderRadius: 8,
                            fontWeight: 500,
                            fontSize: isMobile ? 14 : 15,
                            minWidth: isMobile ? '100%' : 200,
                            height: isMobile ? 44 : 48,
                            transition: 'all 0.2s ease',
                          }}
                          className="luxury-btn"
                        >
                          Xem lịch làm việc
                        </Button>
                      </Link>
                      <Link href="/staff/orders" style={{ width: isMobile ? '100%' : 'auto' }}>
                        <Button
                          type="primary"
                          size={isMobile ? 'large' : 'large'}
                          icon={<ShoppingCartOutlined />}
                          block={isMobile}
                          style={{
                            background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 500,
                            fontSize: isMobile ? 14 : 15,
                            minWidth: isMobile ? '100%' : 200,
                            height: isMobile ? 44 : 48,
                            boxShadow: '0 4px 16px rgba(255, 122, 0, 0.3)',
                            transition: 'all 0.2s ease',
                          }}
                          className="luxury-btn-primary"
                        >
                          Tạo Order mới
                        </Button>
                      </Link>
                    </Flex>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        </div>

        {/* Statistics Cards - Chỉ hiển thị thông tin cần thiết */}
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
          {statsData.map((stat, index) => (
            <Col xs={12} sm={12} md={6} lg={6} key={index} style={{ display: 'flex' }}>
              <Link href={stat.href || '#'} style={{ width: '100%', textDecoration: 'none', display: 'flex' }}>
                <div
                  style={{ width: '100%', display: 'flex', minHeight: isMobile ? 110 : 140 }}
                >
                  <Card
                    hoverable={!isMobile}
                    style={{
                      borderRadius: 12,
                      border: mode === 'dark'
                        ? (stat.urgent ? '1px solid rgba(255, 122, 0, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)')
                        : (stat.urgent ? '1px solid #FF7A00' : '1px solid #E5E5E5'),
                      boxShadow: mode === 'dark'
                        ? (stat.urgent ? '0 4px 20px rgba(255, 122, 0, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.3)')
                        : (stat.urgent ? '0 4px 16px rgba(255, 122, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.08)'),
                      transition: 'all 0.3s ease',
                      height: '100%',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      background: mode === 'dark'
                        ? (stat.urgent ? 'rgba(255, 122, 0, 0.08)' : 'rgba(255, 255, 255, 0.03)')
                        : (stat.urgent ? 'rgba(255, 122, 0, 0.05)' : '#FFFFFF'),
                      overflow: 'hidden',
                    }}
                    styles={{
                      body: {
                        padding: isMobile ? 16 : 24,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: isMobile ? 140 : 160,
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flex: 1,
                      textAlign: 'center',
                      width: '100%',
                      gap: isMobile ? 8 : 12,
                    }}>
                      {/* Icon ở trên */}
                      <div
                        style={{
                          width: isMobile ? 48 : 64,
                          height: isMobile ? 48 : 64,
                          borderRadius: 12,
                          background: mode === 'dark'
                            ? 'rgba(255, 122, 0, 0.1)'
                            : 'rgba(255, 122, 0, 0.08)',
                          border: mode === 'dark'
                            ? '1px solid rgba(255, 122, 0, 0.2)'
                            : '1px solid rgba(255, 122, 0, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: isMobile ? 20 : 28,
                          color: '#FF7A00',
                          flexShrink: 0,
                        }}
                      >
                        {stat.icon}
                      </div>

                      {/* Content ở giữa */}
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                      }}>
                        <div>
                          <span
                            style={{
                              fontSize: isMobile ? 28 : 42,
                              fontWeight: 500,
                              color: mode === 'dark' ? '#FFFFFF' : '#1A1A1A',
                              display: 'block',
                              lineHeight: 1.2,
                              letterSpacing: '-1px',
                            }}
                          >
                            {stat.value}
                          </span>
                          {stat.suffix && (
                            <span style={{
                              fontSize: isMobile ? 13 : 18,
                              color: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                              marginLeft: 6,
                              fontWeight: 400,
                              display: 'block',
                              marginTop: 4,
                            }}>
                              {stat.suffix}
                            </span>
                          )}
                        </div>
                        {stat.total && (
                          <div style={{ marginTop: isMobile ? 12 : 16, width: '100%' }}>
                            <Progress
                              percent={(stat.value / stat.total) * 100}
                              showInfo={false}
                              strokeColor="#FF7A00"
                              railColor={mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E5E5E5'}
                              size={{ height: isMobile ? 3 : 4 }}
                            />
                            <Text style={{
                              fontSize: isMobile ? 11 : 13,
                              marginTop: isMobile ? 6 : 8,
                              display: 'block',
                              color: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                              fontWeight: 400,
                            }}>
                              {stat.value}/{stat.total} bàn
                            </Text>
                          </div>
                        )}
                      </div>

                      {/* Title ở dưới */}
                      <Text style={{
                        fontSize: isMobile ? 12 : 15,
                        display: 'block',
                        color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                        fontWeight: 400,
                        letterSpacing: '0.3px',
                        marginTop: 'auto',
                      }}>
                        {stat.title}
                      </Text>
                    </div>
                  </Card>
                </div>
              </Link>
            </Col>
          ))}
        </Row>

        <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
          {/* Order cần xử lý */}
          <Col xs={24} sm={24} md={24} lg={14} xl={14} style={{ display: 'flex', marginBottom: isMobile ? 12 : 0 }}>
            <div style={{ width: '100%', display: 'flex', minHeight: isMobile ? 'auto' : 400 }}>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <Space size={isMobile ? 8 : 12} wrap>
                      <ShoppingCartOutlined style={{ color: '#FF7A00', fontSize: isMobile ? 16 : 20 }} />
                      <span style={{ fontWeight: 500, fontSize: isMobile ? 14 : 16 }}>Order cần xử lý</span>
                      <Tag color="orange" style={{ borderRadius: 8, fontSize: isMobile ? 12 : 13, margin: 0, fontWeight: 500 }}>
                        {urgentOrders.length} đơn
                      </Tag>
                    </Space>
                    <Link href="/staff/orders">
                      <Button
                        type="link"
                        style={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          color: '#FF380B',
                          border: 'none',
                          borderRadius: 10,
                          fontWeight: 600,
                          fontSize: isMobile ? 12 : 14,
                          padding: isMobile ? '0 4px' : '0 15px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Xem tất cả <RightOutlined />
                      </Button>
                    </Link>
                  </div>
                }
                style={{
                  borderRadius: 12,
                  border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E5E5E5',
                  boxShadow: mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: isMobile ? 'auto' : 400,
                  overflow: 'hidden',
                  background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                }}
                styles={{
                  body: {
                    padding: 0,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }
                }}
              >
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <Table
                    columns={orderColumns}
                    dataSource={urgentOrders}
                    pagination={false}
                    size={isMobile ? 'small' : 'middle'}
                    scroll={isMobile ? { x: 'max-content' } : undefined}
                    rowClassName={(record) => {
                      if (record.status === 'ready') return 'table-row-ready';
                      if (record.status === 'pending') return 'table-row-pending';
                      return '';
                    }}
                    onRow={(record) => ({
                      onClick: () => window.location.href = '/staff/orders',
                      style: { cursor: 'pointer' },
                    })}
                    tableLayout={isMobile ? 'auto' : 'fixed'}
                  />
                </div>
              </Card>
            </div>
          </Col>

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
                    <span style={{ fontWeight: 600, fontSize: isMobile ? 14 : 16 }}>Order gần đây</span>
                    <Tag color="orange" style={{ borderRadius: 20, fontSize: isMobile ? 11 : 12, margin: 0 }}>
                      {tablesNeedingPayment.length}
                    </Tag>
                  </Space>
                  <Link href="/staff/orders">
                    <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                      <Button type="link" style={{ color: '#FF380B', fontWeight: 600, fontSize: isMobile ? 12 : 14, padding: isMobile ? '0 4px' : '0 15px' }}>
                        Xem tất cả <RightOutlined />
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
                      >
                        Xem tất cả
                      </Button>
                    </Link>
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
        <div>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: isMobile ? 14 : 16 }}>
                  <ThunderboltOutlined style={{ marginRight: 6 }} /> Thao tác nhanh
                </span>
                <Tooltip title="Làm mới dữ liệu">
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
                        border: mode === 'dark' ? `1px solid rgba(255, 122, 0, 0.2)` : `1px solid ${action.color}30`,
                        background: mode === 'dark' ? 'rgba(255, 122, 0, 0.08)' : `${action.color}08`,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{ fontSize: isMobile ? 22 : 28, color: action.color }}>
                        {action.icon}
                      </span>
                      <span style={{ fontWeight: 500, color: 'var(--text)', fontSize: isMobile ? 12 : 14 }}>{action.title}</span>
                    </Button>
                  </Link>
                </Col>
              ))}
            </Row>
          </Card>
        </div>

        <style jsx global>{`
        .luxury-btn:hover {
          background: ${mode === 'dark' ? 'rgba(255, 122, 0, 0.15)' : '#F8F8F8'} !important;
          border-color: ${mode === 'dark' ? 'rgba(255, 122, 0, 0.4)' : '#FF7A00'} !important;
          transform: translateY(-1px);
        }
        .luxury-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 122, 0, 0.4) !important;
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
          background: rgba(255, 122, 0, 0.05) !important;
        }
        .table-row-pending:hover {
          background: rgba(255, 122, 0, 0.12) !important;
        }
      `}</style>
      </div>
    </PageTransition>
  );
}

