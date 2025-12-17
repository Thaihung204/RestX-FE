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
    title: 'Order cần xử lý',
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
      <div>
      {/* Welcome Section - Luxury Design */}
      <div>
        <Card
          style={{
            marginBottom: isMobile ? 24 : 32,
            background: mode === 'dark' 
              ? 'linear-gradient(135deg, #1A1A1A 0%, #2C2C2C 100%)'
              : 'linear-gradient(135deg, #F8F8F8 0%, #FFFFFF 100%)',
            border: mode === 'dark' 
              ? '1px solid rgba(255, 122, 0, 0.2)' 
              : '1px solid #E5E5E5',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: mode === 'dark' 
              ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
              : '0 2px 12px rgba(0, 0, 0, 0.08)',
          }}
          styles={{ body: { padding: 0 } }}
        >
          <div style={{ padding: isMobile ? '32px 24px' : '48px 56px', position: 'relative' }}>
            <Row align="middle" justify="space-between" gutter={[24, 24]}>
              <Col xs={24} md={16}>
                <div>
                  <Title 
                    level={isMobile ? 3 : 2} 
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
                            size="small"
                            strokeWidth={isMobile ? 3 : 4}
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
                        color: '#FF7A00', 
                        fontWeight: 500, 
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

        {/* Bàn cần thanh toán */}
        <Col xs={24} sm={24} md={24} lg={10} xl={10} style={{ display: 'flex' }}>
          <div style={{ width: '100%', display: 'flex', minHeight: isMobile ? 'auto' : 400 }}>
            <Card
              title={
                <Space wrap>
                  <DollarOutlined style={{ color: '#faad14', fontSize: isMobile ? 16 : 20 }} />
                  <span style={{ fontWeight: 600, fontSize: isMobile ? 14 : 16 }}>Bàn cần thanh toán</span>
                  <Tag color="orange" style={{ borderRadius: 20, fontSize: isMobile ? 11 : 12, margin: 0 }}>
                    {tablesNeedingPayment.length}
                  </Tag>
                </Space>
              }
              style={{
                borderRadius: 12,
                border: mode === 'dark' ? '1px solid rgba(255, 122, 0, 0.4)' : '1px solid #FF7A00',
                boxShadow: mode === 'dark' ? '0 4px 20px rgba(255, 122, 0, 0.15)' : '0 4px 16px rgba(255, 122, 0, 0.2)',
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: mode === 'dark' ? 'rgba(255, 122, 0, 0.08)' : 'rgba(255, 122, 0, 0.05)',
                minHeight: isMobile ? 'auto' : 400,
                overflow: 'hidden',
              }}
              styles={{ 
                body: { 
                  padding: isMobile ? 12 : 16,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                } 
              }}
            >
              {tablesNeedingPayment.length > 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    {tablesNeedingPayment.map((table, index) => (
                      <div
                        key={index}
                        onClick={() => window.location.href = '/staff/checkout'}
                        style={{
                          padding: isMobile ? 12 : 16,
                          marginBottom: index < tablesNeedingPayment.length - 1 ? 12 : 0,
                          background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                          borderRadius: 12,
                          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E5E5E5',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <Text strong style={{ fontSize: isMobile ? 14 : 16, display: 'block' }}>{table.table}</Text>
                            <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
                              {table.guests} khách • {table.time}
                            </Text>
                          </div>
                          <Text strong style={{ fontSize: isMobile ? 16 : 18, color: '#FF7A00', whiteSpace: 'nowrap' }}>
                            {table.total.toLocaleString('vi-VN')}đ
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/staff/checkout" style={{ marginTop: 'auto' }}>
                    <Button
                      type="primary"
                      block
                      size={isMobile ? 'middle' : 'large'}
                      icon={<DollarOutlined />}
                      style={{
                        marginTop: 16,
                        borderRadius: 8,
                        height: isMobile ? 44 : 48,
                        fontWeight: 500,
                        background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                        border: 'none',
                      }}
                    >
                      Xem tất cả
                    </Button>
                  </Link>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                  <Text style={{ fontSize: 14, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>Không có bàn nào cần thanh toán</Text>
                </div>
              )}
            </Card>
          </div>
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
              </Tooltip>
            </div>
          }
          style={{
            marginTop: isMobile ? 16 : 24,
            borderRadius: 12,
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E5E5E5',
            boxShadow: mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
          }}
        >
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            {[
              { icon: <TableOutlined />, title: 'Mở bàn', color: '#FF7A00', href: '/staff/tables' },
              { icon: <ShoppingCartOutlined />, title: 'Tạo order', color: '#1890ff', href: '/staff/orders' },
              { icon: <DollarOutlined />, title: 'Thanh toán', color: '#52c41a', href: '/staff/checkout' },
              { icon: <ClockCircleOutlined />, title: 'Chấm công', color: '#722ed1', href: '/staff/attendance' },
            ].map((action, index) => (
              <Col xs={12} sm={12} md={6} lg={6} key={index}>
                <Link href={action.href}>
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
          background: rgba(255, 122, 0, 0.08) !important;
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

