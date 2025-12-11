'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Table,
  Avatar,
  Statistic,
  Progress,
  Timeline,
  Divider,
  Modal,
  message,
  Calendar,
  Badge,
Flex,
} from 'antd';
import {
  ClockCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  TrophyOutlined,
  FieldTimeOutlined,
  UserOutlined,
  CoffeeOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  breakStart?: string;
  breakEnd?: string;
  totalHours: number;
  status: 'present' | 'late' | 'absent' | 'leave';
}

// Mock attendance data
const attendanceHistory: AttendanceRecord[] = [
  { id: '1', date: '2024-12-10', checkIn: '07:58', checkOut: null, totalHours: 0, status: 'present' },
  { id: '2', date: '2024-12-09', checkIn: '08:02', checkOut: '17:05', totalHours: 8.5, status: 'present' },
  { id: '3', date: '2024-12-08', checkIn: '08:15', checkOut: '17:00', totalHours: 8.2, status: 'late' },
  { id: '4', date: '2024-12-07', checkIn: '07:55', checkOut: '17:30', totalHours: 9.1, status: 'present' },
  { id: '5', date: '2024-12-06', checkIn: null, checkOut: null, totalHours: 0, status: 'leave' },
  { id: '6', date: '2024-12-05', checkIn: '08:00', checkOut: '17:00', totalHours: 8.5, status: 'present' },
  { id: '7', date: '2024-12-04', checkIn: '07:58', checkOut: '17:15', totalHours: 8.8, status: 'present' },
];

const statusConfig: Record<string, { color: string; text: string }> = {
  present: { color: 'green', text: 'Đúng giờ' },
  late: { color: 'orange', text: 'Đi muộn' },
  absent: { color: 'red', text: 'Vắng mặt' },
  leave: { color: 'blue', text: 'Nghỉ phép' },
};

export default function AttendancePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [checkInTime, setCheckInTime] = useState('07:58');
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'checkIn' | 'checkOut' | 'breakStart' | 'breakEnd'>('checkIn');
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateWorkingHours = () => {
    if (!isCheckedIn || !checkInTime) return 0;
    const [hours, minutes] = checkInTime.split(':').map(Number);
    const checkInDate = new Date();
    checkInDate.setHours(hours, minutes, 0);
    const diff = (currentTime.getTime() - checkInDate.getTime()) / 1000 / 60 / 60;
    return Math.max(0, diff);
  };

  const handleAction = (type: 'checkIn' | 'checkOut' | 'breakStart' | 'breakEnd') => {
    setActionType(type);
    setIsConfirmModalOpen(true);
  };

  const confirmAction = () => {
    const time = formatTime(currentTime).slice(0, 5);
    
    switch (actionType) {
      case 'checkIn':
        setIsCheckedIn(true);
        setCheckInTime(time);
        message.success(`Chấm công vào lúc ${time}`);
        break;
      case 'checkOut':
        setIsCheckedIn(false);
        message.success(`Chấm công ra lúc ${time}`);
        break;
      case 'breakStart':
        setIsOnBreak(true);
        message.success(`Bắt đầu nghỉ giải lao lúc ${time}`);
        break;
      case 'breakEnd':
        setIsOnBreak(false);
        message.success(`Kết thúc nghỉ giải lao lúc ${time}`);
        break;
    }
    
    setIsConfirmModalOpen(false);
  };

  const getColumns = () => {
    const allColumns = [
      {
        title: 'Ngày',
        dataIndex: 'date',
        key: 'date',
        render: (date: string) => {
          const d = new Date(date);
          return (
            <div>
              <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>{d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: isMobile ? 10 : 12 }}>
                {d.toLocaleDateString('vi-VN', { weekday: 'short' })}
              </Text>
            </div>
          );
        },
      },
      {
        title: 'Giờ vào',
        dataIndex: 'checkIn',
        key: 'checkIn',
        render: (time: string | null) =>
          time ? (
            <Tag icon={<LoginOutlined />} color="green" style={{ fontSize: isMobile ? 10 : 12 }}>
              {time}
            </Tag>
          ) : (
            <Text type="secondary">--:--</Text>
          ),
      },
      {
        title: 'Giờ ra',
        dataIndex: 'checkOut',
        key: 'checkOut',
        render: (time: string | null) =>
          time ? (
            <Tag icon={<LogoutOutlined />} color="blue" style={{ fontSize: isMobile ? 10 : 12 }}>
              {time}
            </Tag>
          ) : (
            <Text type="secondary">--:--</Text>
          ),
      },
      {
        title: 'Số giờ',
        dataIndex: 'totalHours',
        key: 'totalHours',
        hidden: isMobile,
        render: (hours: number) => (
          <Text strong style={{ color: hours >= 8 ? '#52c41a' : '#faad14', fontSize: isMobile ? 12 : 14 }}>
            {hours > 0 ? `${hours.toFixed(1)}h` : '--'}
          </Text>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
          <Tag color={statusConfig[status].color} style={{ fontSize: isMobile ? 10 : 12 }}>{statusConfig[status].text}</Tag>
        ),
      },
    ];
    return allColumns.filter(col => !col.hidden);
  };

  // Monthly stats
  const monthlyStats = {
    totalDays: 22,
    workedDays: 18,
    lateDays: 2,
    leaveDays: 2,
    totalHours: 152,
  };

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const record = attendanceHistory.find(r => r.date === dateStr);
    
    if (record) {
      return (
        <Badge
          status={
            record.status === 'present'
              ? 'success'
              : record.status === 'late'
              ? 'warning'
              : record.status === 'leave'
              ? 'processing'
              : 'error'
          }
        />
      );
    }
    return null;
  };

  return (
    <div>
      {/* Current Time Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card
          style={{
            borderRadius: isMobile ? 16 : 24,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: 'none',
            marginBottom: isMobile ? 16 : 24,
            overflow: 'hidden',
          }}
          styles={{ body: { padding: isMobile ? 16 : 24 } }}
        >
          <Row gutter={[isMobile ? 16 : 32, isMobile ? 16 : 32]} align="middle">
            <Col xs={24} md={12}>
              <div style={{ padding: isMobile ? '10px 0' : '20px 0', textAlign: isMobile ? 'center' : 'left' }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? 12 : 14 }}>
                  {formatDate(currentTime)}
                </Text>
                <div
                  style={{
                    fontSize: isMobile ? 48 : 72,
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: 'monospace',
                    letterSpacing: isMobile ? 2 : 4,
                    marginTop: 8,
                  }}
                >
                  {formatTime(currentTime)}
                </div>
                
                {isCheckedIn && (
                  <div style={{ marginTop: isMobile ? 12 : 16 }}>
                    <Space size={isMobile ? 16 : 24} wrap>
                      <div>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? 11 : 12 }}>
                          Giờ vào
                        </Text>
                        <br />
                        <Text style={{ color: '#52c41a', fontSize: isMobile ? 16 : 18, fontWeight: 600 }}>
                          {checkInTime}
                        </Text>
                      </div>
                      <div>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? 11 : 12 }}>
                          Đã làm
                        </Text>
                        <br />
                        <Text style={{ color: '#FF7A00', fontSize: isMobile ? 16 : 18, fontWeight: 600 }}>
                          {calculateWorkingHours().toFixed(1)}h
                        </Text>
                      </div>
                      {isOnBreak && (
                        <Tag color="orange" style={{ borderRadius: 20, fontSize: isMobile ? 11 : 12 }}>
                          <CoffeeOutlined /> {isMobile ? 'Nghỉ' : 'Đang nghỉ giải lao'}
                        </Tag>
                      )}
                    </Space>
                  </div>
                )}
              </div>
            </Col>
            
            <Col xs={24} md={12}>
              <div style={{ textAlign: 'center' }}>
                {!isCheckedIn ? (
                  <Button
                    type="primary"
                    size="large"
                    icon={<LoginOutlined />}
                    onClick={() => handleAction('checkIn')}
                    style={{
                      width: isMobile ? 140 : 200,
                      height: isMobile ? 140 : 200,
                      borderRadius: '50%',
                      fontSize: isMobile ? 18 : 24,
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                      border: 'none',
                      boxShadow: '0 8px 32px rgba(82, 196, 26, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <LoginOutlined style={{ fontSize: isMobile ? 36 : 48 }} />
                    <span>CHECK IN</span>
                  </Button>
                ) : (
                  <Flex vertical gap={isMobile ? 12 : 16} align="center">
                    <Button
                      type="primary"
                      danger
                      size="large"
                      icon={<LogoutOutlined />}
                      onClick={() => handleAction('checkOut')}
                      style={{
                        width: isMobile ? 120 : 160,
                        height: isMobile ? 120 : 160,
                        borderRadius: '50%',
                        fontSize: isMobile ? 16 : 20,
                        fontWeight: 700,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 8px 32px rgba(255, 77, 79, 0.4)',
                      }}
                    >
                      <LogoutOutlined style={{ fontSize: isMobile ? 28 : 36 }} />
                      <span>CHECK OUT</span>
                    </Button>
                    
                    <Button
                      size={isMobile ? 'middle' : 'large'}
                      icon={isOnBreak ? <CheckCircleOutlined /> : <CoffeeOutlined />}
                      onClick={() => handleAction(isOnBreak ? 'breakEnd' : 'breakStart')}
                      style={{
                        borderRadius: 12,
                        height: isMobile ? 40 : 48,
                        background: isOnBreak ? '#52c41a' : '#faad14',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: isMobile ? 13 : 14,
                      }}
                    >
                      {isOnBreak ? 'Kết thúc nghỉ' : 'Nghỉ giải lao'}
                    </Button>
                  </Flex>
                )}
              </div>
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: isMobile ? 12 : 16, textAlign: 'center' }} styles={{ body: { padding: isMobile ? 12 : 24 } }}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? 11 : 14 }}>Ngày công</span>}
              value={monthlyStats.workedDays}
              suffix={`/${monthlyStats.totalDays}`}
              valueStyle={{ color: '#52c41a', fontWeight: 700, fontSize: isMobile ? 20 : 24 }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: isMobile ? 12 : 16, textAlign: 'center' }} styles={{ body: { padding: isMobile ? 12 : 24 } }}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? 11 : 14 }}>Đi muộn</span>}
              value={monthlyStats.lateDays}
              suffix="ngày"
              valueStyle={{ color: '#faad14', fontWeight: 700, fontSize: isMobile ? 20 : 24 }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: isMobile ? 12 : 16, textAlign: 'center' }} styles={{ body: { padding: isMobile ? 12 : 24 } }}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? 11 : 14 }}>Nghỉ phép</span>}
              value={monthlyStats.leaveDays}
              suffix="ngày"
              valueStyle={{ color: '#1890ff', fontWeight: 700, fontSize: isMobile ? 20 : 24 }}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: isMobile ? 12 : 16, textAlign: 'center' }} styles={{ body: { padding: isMobile ? 12 : 24 } }}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? 11 : 14 }}>Tổng giờ làm</span>}
              value={monthlyStats.totalHours}
              suffix="h"
              valueStyle={{ color: '#FF7A00', fontWeight: 700, fontSize: isMobile ? 20 : 24 }}
              prefix={<FieldTimeOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[isMobile ? 12 : 24, isMobile ? 12 : 24]}>
        {/* Attendance History */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <HistoryOutlined style={{ color: '#FF7A00', fontSize: isMobile ? 16 : 18 }} />
                <span style={{ fontSize: isMobile ? 14 : 16 }}>Lịch sử chấm công</span>
              </Space>
            }
            style={{ borderRadius: isMobile ? 12 : 16 }}
            styles={{ body: { padding: isMobile ? 8 : 24 } }}
          >
            <Table
              columns={getColumns()}
              dataSource={attendanceHistory}
              rowKey="id"
              pagination={{ pageSize: isMobile ? 5 : 7 }}
              size={isMobile ? 'small' : 'middle'}
              scroll={isMobile ? { x: 350 } : undefined}
            />
          </Card>
        </Col>

        {/* Monthly Progress */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <TrophyOutlined style={{ color: '#FF7A00', fontSize: isMobile ? 16 : 18 }} />
                <span style={{ fontSize: isMobile ? 14 : 16 }}>Tiến độ tháng này</span>
              </Space>
            }
            style={{ borderRadius: isMobile ? 12 : 16, marginBottom: isMobile ? 12 : 24 }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            <div style={{ marginBottom: isMobile ? 16 : 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: isMobile ? 13 : 14 }}>Ngày công</Text>
                <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>
                  {monthlyStats.workedDays}/{monthlyStats.totalDays}
                </Text>
              </div>
              <Progress
                percent={(monthlyStats.workedDays / monthlyStats.totalDays) * 100}
                strokeColor="#52c41a"
                railColor="#f0f0f0"
              />
            </div>

            <div style={{ marginBottom: isMobile ? 16 : 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: isMobile ? 13 : 14 }}>Giờ làm việc</Text>
                <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>
                  {monthlyStats.totalHours}/{monthlyStats.totalDays * 8}h
                </Text>
              </div>
              <Progress
                percent={(monthlyStats.totalHours / (monthlyStats.totalDays * 8)) * 100}
                strokeColor="#FF7A00"
                railColor="#f0f0f0"
              />
            </div>

            <Divider style={{ margin: isMobile ? '12px 0' : '16px 0' }} />

            <div>
              <Text strong style={{ display: 'block', marginBottom: isMobile ? 8 : 12, fontSize: isMobile ? 13 : 14 }}>
                Hôm nay
              </Text>
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <>
                        <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>07:58</Text> <Text style={{ fontSize: isMobile ? 12 : 14 }}>- Check in</Text>
                      </>
                    ),
                  },
                  {
                    color: 'orange',
                    children: (
                      <>
                        <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>12:00</Text> <Text style={{ fontSize: isMobile ? 12 : 14 }}>- Nghỉ trưa</Text>
                      </>
                    ),
                  },
                  {
                    color: 'green',
                    children: (
                      <>
                        <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>13:00</Text> <Text style={{ fontSize: isMobile ? 12 : 14 }}>- Tiếp tục làm việc</Text>
                      </>
                    ),
                  },
                  {
                    color: 'gray',
                    children: (
                      <>
                        <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>Đang làm việc...</Text>
                      </>
                    ),
                  },
                ]}
              />
            </div>
          </Card>

          {/* Quick Info */}
          <Card
            style={{
              borderRadius: isMobile ? 12 : 16,
              background: 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)',
              border: '1px solid #ffd591',
            }}
            styles={{ body: { padding: isMobile ? 14 : 24 } }}
          >
            <Space size={isMobile ? 10 : 16}>
              <Avatar
                size={isMobile ? 40 : 48}
                style={{
                  background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                }}
              >
                <UserOutlined />
              </Avatar>
              <div>
                <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>Nguyễn Văn A</Text>
                <br />
                <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Nhân viên phục vụ • Ca sáng (8:00 - 17:00)</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Confirm Modal */}
      <Modal
        title="Xác nhận"
        open={isConfirmModalOpen}
        onCancel={() => setIsConfirmModalOpen(false)}
        onOk={confirmAction}
        okText="Xác nhận"
        cancelText="Hủy"
        centered
        width={isMobile ? '90%' : 400}
      >
        <div style={{ textAlign: 'center', padding: isMobile ? '12px 0' : '20px 0' }}>
          <div
            style={{
              width: isMobile ? 64 : 80,
              height: isMobile ? 64 : 80,
              borderRadius: '50%',
              background:
                actionType === 'checkOut'
                  ? '#ff4d4f'
                  : actionType === 'breakStart'
                  ? '#faad14'
                  : '#52c41a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            {actionType === 'checkIn' && <LoginOutlined style={{ fontSize: isMobile ? 28 : 36, color: '#fff' }} />}
            {actionType === 'checkOut' && <LogoutOutlined style={{ fontSize: isMobile ? 28 : 36, color: '#fff' }} />}
            {actionType === 'breakStart' && <CoffeeOutlined style={{ fontSize: isMobile ? 28 : 36, color: '#fff' }} />}
            {actionType === 'breakEnd' && <CheckCircleOutlined style={{ fontSize: isMobile ? 28 : 36, color: '#fff' }} />}
          </div>
          <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
            {actionType === 'checkIn' && 'Xác nhận CHECK IN?'}
            {actionType === 'checkOut' && 'Xác nhận CHECK OUT?'}
            {actionType === 'breakStart' && 'Bắt đầu nghỉ giải lao?'}
            {actionType === 'breakEnd' && 'Kết thúc nghỉ giải lao?'}
          </Title>
          <Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>
            Thời gian: {formatTime(currentTime)}
          </Text>
        </div>
      </Modal>
    </div>
  );
}

