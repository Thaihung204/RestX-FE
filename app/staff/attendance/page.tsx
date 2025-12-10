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

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => {
        const d = new Date(date);
        return (
          <div>
            <Text strong>{d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
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
          <Tag icon={<LoginOutlined />} color="green">
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
          <Tag icon={<LogoutOutlined />} color="blue">
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
      render: (hours: number) => (
        <Text strong style={{ color: hours >= 8 ? '#52c41a' : '#faad14' }}>
          {hours > 0 ? `${hours.toFixed(1)}h` : '--'}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusConfig[status].color}>{statusConfig[status].text}</Tag>
      ),
    },
  ];

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
            borderRadius: 24,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: 'none',
            marginBottom: 24,
            overflow: 'hidden',
          }}
        >
          <Row gutter={[32, 32]} align="middle">
            <Col xs={24} md={12}>
              <div style={{ padding: '20px 0' }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                  {formatDate(currentTime)}
                </Text>
                <div
                  style={{
                    fontSize: 72,
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: 'monospace',
                    letterSpacing: 4,
                    marginTop: 8,
                  }}
                >
                  {formatTime(currentTime)}
                </div>
                
                {isCheckedIn && (
                  <div style={{ marginTop: 16 }}>
                    <Space size={24}>
                      <div>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                          Giờ vào
                        </Text>
                        <br />
                        <Text style={{ color: '#52c41a', fontSize: 18, fontWeight: 600 }}>
                          {checkInTime}
                        </Text>
                      </div>
                      <div>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                          Đã làm
                        </Text>
                        <br />
                        <Text style={{ color: '#FF7A00', fontSize: 18, fontWeight: 600 }}>
                          {calculateWorkingHours().toFixed(1)}h
                        </Text>
                      </div>
                      {isOnBreak && (
                        <Tag color="orange" style={{ borderRadius: 20 }}>
                          <CoffeeOutlined /> Đang nghỉ giải lao
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
                      width: 200,
                      height: 200,
                      borderRadius: '50%',
                      fontSize: 24,
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
                    <LoginOutlined style={{ fontSize: 48 }} />
                    <span>CHECK IN</span>
                  </Button>
                ) : (
                  <Flex vertical gap={16} align="center">
                    <Button
                      type="primary"
                      danger
                      size="large"
                      icon={<LogoutOutlined />}
                      onClick={() => handleAction('checkOut')}
                      style={{
                        width: 160,
                        height: 160,
                        borderRadius: '50%',
                        fontSize: 20,
                        fontWeight: 700,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 8px 32px rgba(255, 77, 79, 0.4)',
                      }}
                    >
                      <LogoutOutlined style={{ fontSize: 36 }} />
                      <span>CHECK OUT</span>
                    </Button>
                    
                    <Button
                      size="large"
                      icon={isOnBreak ? <CheckCircleOutlined /> : <CoffeeOutlined />}
                      onClick={() => handleAction(isOnBreak ? 'breakEnd' : 'breakStart')}
                      style={{
                        borderRadius: 12,
                        height: 48,
                        background: isOnBreak ? '#52c41a' : '#faad14',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 600,
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
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 16, textAlign: 'center' }}>
            <Statistic
              title="Ngày công"
              value={monthlyStats.workedDays}
              suffix={`/${monthlyStats.totalDays}`}
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 16, textAlign: 'center' }}>
            <Statistic
              title="Đi muộn"
              value={monthlyStats.lateDays}
              suffix="ngày"
              valueStyle={{ color: '#faad14', fontWeight: 700 }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 16, textAlign: 'center' }}>
            <Statistic
              title="Nghỉ phép"
              value={monthlyStats.leaveDays}
              suffix="ngày"
              valueStyle={{ color: '#1890ff', fontWeight: 700 }}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 16, textAlign: 'center' }}>
            <Statistic
              title="Tổng giờ làm"
              value={monthlyStats.totalHours}
              suffix="h"
              valueStyle={{ color: '#FF7A00', fontWeight: 700 }}
              prefix={<FieldTimeOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Attendance History */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <HistoryOutlined style={{ color: '#FF7A00' }} />
                <span>Lịch sử chấm công</span>
              </Space>
            }
            style={{ borderRadius: 16 }}
          >
            <Table
              columns={columns}
              dataSource={attendanceHistory}
              rowKey="id"
              pagination={{ pageSize: 7 }}
              size="middle"
            />
          </Card>
        </Col>

        {/* Monthly Progress */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <TrophyOutlined style={{ color: '#FF7A00' }} />
                <span>Tiến độ tháng này</span>
              </Space>
            }
            style={{ borderRadius: 16, marginBottom: 24 }}
          >
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>Ngày công</Text>
                <Text strong>
                  {monthlyStats.workedDays}/{monthlyStats.totalDays}
                </Text>
              </div>
              <Progress
                percent={(monthlyStats.workedDays / monthlyStats.totalDays) * 100}
                strokeColor="#52c41a"
                railColor="#f0f0f0"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>Giờ làm việc</Text>
                <Text strong>
                  {monthlyStats.totalHours}/{monthlyStats.totalDays * 8}h
                </Text>
              </div>
              <Progress
                percent={(monthlyStats.totalHours / (monthlyStats.totalDays * 8)) * 100}
                strokeColor="#FF7A00"
                railColor="#f0f0f0"
              />
            </div>

            <Divider />

            <div>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>
                Hôm nay
              </Text>
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <>
                        <Text strong>07:58</Text> - Check in
                      </>
                    ),
                  },
                  {
                    color: 'orange',
                    children: (
                      <>
                        <Text strong>12:00</Text> - Nghỉ trưa
                      </>
                    ),
                  },
                  {
                    color: 'green',
                    children: (
                      <>
                        <Text strong>13:00</Text> - Tiếp tục làm việc
                      </>
                    ),
                  },
                  {
                    color: 'gray',
                    children: (
                      <>
                        <Text type="secondary">Đang làm việc...</Text>
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
              borderRadius: 16,
              background: 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)',
              border: '1px solid #ffd591',
            }}
          >
            <Space>
              <Avatar
                size={48}
                style={{
                  background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                }}
              >
                <UserOutlined />
              </Avatar>
              <div>
                <Text strong style={{ fontSize: 16 }}>Nguyễn Văn A</Text>
                <br />
                <Text type="secondary">Nhân viên phục vụ • Ca sáng (8:00 - 17:00)</Text>
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
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div
            style={{
              width: 80,
              height: 80,
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
            {actionType === 'checkIn' && <LoginOutlined style={{ fontSize: 36, color: '#fff' }} />}
            {actionType === 'checkOut' && <LogoutOutlined style={{ fontSize: 36, color: '#fff' }} />}
            {actionType === 'breakStart' && <CoffeeOutlined style={{ fontSize: 36, color: '#fff' }} />}
            {actionType === 'breakEnd' && <CheckCircleOutlined style={{ fontSize: 36, color: '#fff' }} />}
          </div>
          <Title level={4} style={{ margin: 0 }}>
            {actionType === 'checkIn' && 'Xác nhận CHECK IN?'}
            {actionType === 'checkOut' && 'Xác nhận CHECK OUT?'}
            {actionType === 'breakStart' && 'Bắt đầu nghỉ giải lao?'}
            {actionType === 'breakEnd' && 'Kết thúc nghỉ giải lao?'}
          </Title>
          <Text type="secondary">
            Thời gian: {formatTime(currentTime)}
          </Text>
        </div>
      </Modal>
    </div>
  );
}

