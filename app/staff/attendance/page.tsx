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
import { useThemeMode } from '../../theme/AntdProvider';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../components/I18nProvider';

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

export default function AttendancePage() {
  const { mode } = useThemeMode();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [messageApi, contextHolder] = message.useMessage();

  const statusConfig: Record<string, { color: string; text: string }> = {
    present: { color: 'green', text: t('staff.attendance.status.present') },
    late: { color: 'gold', text: t('staff.attendance.status.late') },
    absent: { color: 'red', text: t('staff.attendance.status.absent') },
    leave: { color: 'blue', text: t('staff.attendance.status.leave') },
  };

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
    return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', {
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
        messageApi.success(t('staff.attendance.messages.checkin_success', { time }));
        break;
      case 'checkOut':
        setIsCheckedIn(false);
        messageApi.success(t('staff.attendance.messages.checkout_success', { time }));
        break;
      case 'breakStart':
        setIsOnBreak(true);
        messageApi.success(t('staff.attendance.messages.break_start_success', { time }));
        break;
      case 'breakEnd':
        setIsOnBreak(false);
        messageApi.success(t('staff.attendance.messages.break_end_success', { time }));
        break;
    }

    setIsConfirmModalOpen(false);
  };

  const getColumns = () => {
    const allColumns = [
      {
        title: t('staff.attendance.table.date'),
        dataIndex: 'date',
        key: 'date',
        render: (date: string) => {
          const d = new Date(date);
          return (
            <div>
              <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>{d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit' })}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: isMobile ? 10 : 12 }}>
                {d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', { weekday: 'short' })}
              </Text>
            </div>
          );
        },
      },
      {
        title: t('staff.attendance.table.check_in_time'),
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
        title: t('staff.attendance.table.check_out_time'),
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
        title: t('staff.attendance.table.hours'),
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
        title: t('staff.attendance.table.status'),
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
      {contextHolder}
      {/* Current Time Card */}
      <div>
        <Card
          style={{
            borderRadius: isMobile ? 16 : 24,
            background: mode === 'dark'
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(135deg, #FF380B 0%, #FF6B3B 100%)',
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
                    fontWeight: 500,
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
                          {t('staff.attendance.info.check_in_time')}
                        </Text>
                        <br />
                        <Text style={{ color: '#fff', fontSize: isMobile ? 16 : 18, fontWeight: 600 }}>
                          {checkInTime}
                        </Text>
                      </div>
                      <div>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? 11 : 12 }}>
                          {t('staff.attendance.info.worked')}
                        </Text>
                        <br />
                        <Text style={{ color: '#fff', fontSize: isMobile ? 16 : 18, fontWeight: 600 }}>
                          {calculateWorkingHours().toFixed(1)}h
                        </Text>
                      </div>
                      {isOnBreak && (
                        <Tag style={{ borderRadius: 20, fontSize: isMobile ? 11 : 12, background: '#fff', color: '#FF380B', border: 'none', fontWeight: 600 }}>
                          <CoffeeOutlined /> {isMobile ? t('staff.attendance.break') : t('staff.attendance.on_break')}
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
                    onClick={() => handleAction('checkIn')}
                    style={{
                      width: isMobile ? 140 : 200,
                      height: isMobile ? 140 : 200,
                      borderRadius: '50%',
                      fontSize: isMobile ? 18 : 24,
                      fontWeight: 500,
                      background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                      border: 'none',
                      boxShadow: '0 8px 32px rgba(82, 196, 26, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: isMobile ? 10 : 12,
                      padding: 0,
                    }}
                  >
                    <LoginOutlined style={{ fontSize: isMobile ? 40 : 52 }} />
                    <span style={{ fontSize: isMobile ? 14 : 16, marginTop: 4 }}>{t('staff.attendance.check_in')}</span>
                  </Button>
                ) : (
                  <Flex vertical gap={isMobile ? 12 : 16} align="center">
                    <Button
                      type="primary"
                      danger
                      size="large"
                      onClick={() => handleAction('checkOut')}
                      style={{
                        width: isMobile ? 120 : 160,
                        height: isMobile ? 120 : 160,
                        borderRadius: '50%',
                        fontSize: isMobile ? 16 : 20,
                        fontWeight: 500,
                        background: '#ffffff',
                        color: '#ff4d4f',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: isMobile ? 10 : 12,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                        padding: 0,
                        border: 'none'
                      }}
                    >
                      <LogoutOutlined style={{ fontSize: isMobile ? 32 : 40 }} />
                      <span style={{ fontSize: isMobile ? 13 : 15, marginTop: 4 }}>{t('staff.attendance.check_out')}</span>
                    </Button>

                    <Button
                      size={isMobile ? 'middle' : 'large'}
                      icon={isOnBreak ? <CheckCircleOutlined /> : <CoffeeOutlined />}
                      onClick={() => handleAction(isOnBreak ? 'breakEnd' : 'breakStart')}
                      style={{
                        borderRadius: 12,
                        height: isMobile ? 40 : 48,
                        background: isOnBreak ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                        color: isOnBreak ? '#52c41a' : '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        fontWeight: 600,
                        fontSize: isMobile ? 13 : 14,
                        backdropFilter: 'blur(5px)',
                      }}
                    >
                      {isOnBreak ? t('staff.attendance.end_break') : t('staff.attendance.break')}
                    </Button>
                  </Flex>
                )}
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Stats Cards */}
      <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card style={{
            borderRadius: 12,
            textAlign: 'center',
            overflow: 'hidden',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
            boxShadow: mode === 'dark' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
            background: mode === 'dark' ? 'var(--card)' : '#FFFFFF',
          }} styles={{ body: { padding: isMobile ? '16px 18px' : '24px 28px' } }}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? 13 : 15 }}>{t('staff.attendance.stats.work_days')}</span>}
              value={monthlyStats.workedDays}
              suffix={`/${monthlyStats.totalDays}`}
              styles={{ content: { color: '#52c41a', fontWeight: 500, fontSize: isMobile ? 24 : 32 } }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card style={{
            borderRadius: 12,
            textAlign: 'center',
            overflow: 'hidden',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
            boxShadow: mode === 'dark' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
            background: mode === 'dark' ? 'var(--card)' : '#FFFFFF',
          }} styles={{ body: { padding: isMobile ? '16px 18px' : '24px 28px' } }}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? 13 : 15 }}>{t('staff.attendance.stats.late_days')}</span>}
              value={monthlyStats.lateDays}
              suffix={t('staff.attendance.stats.days')}
              styles={{ content: { color: '#faad14', fontWeight: 500, fontSize: isMobile ? 24 : 32 } }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card style={{
            borderRadius: 12,
            textAlign: 'center',
            overflow: 'hidden',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
            boxShadow: mode === 'dark' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
            background: mode === 'dark' ? 'var(--card)' : '#FFFFFF',
          }} styles={{ body: { padding: isMobile ? '16px 18px' : '24px 28px' } }}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? 13 : 15 }}>{t('staff.attendance.stats.leave_days')}</span>}
              value={monthlyStats.leaveDays}
              suffix={t('staff.attendance.stats.days')}
              styles={{ content: { color: '#1890ff', fontWeight: 500, fontSize: isMobile ? 24 : 32 } }}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card style={{
            borderRadius: 12,
            textAlign: 'center',
            overflow: 'hidden',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
            boxShadow: mode === 'dark' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
            background: mode === 'dark' ? 'var(--card)' : '#FFFFFF',
          }} styles={{ body: { padding: isMobile ? '16px 18px' : '24px 28px' } }}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? 13 : 15 }}>{t('staff.attendance.stats.total_hours')}</span>}
              value={monthlyStats.totalHours}
              suffix="h"
              styles={{ content: { color: '#FF380B', fontWeight: 700, fontSize: isMobile ? 20 : 24 } }}
              prefix={<FieldTimeOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[isMobile ? 12 : 24, isMobile ? 12 : 24]}>
        {/* Attendance History */}
        <Col xs={24} md={24} lg={14}>
          <Card
            title={
              <Space>
                <HistoryOutlined style={{ color: '#FF380B', fontSize: isMobile ? 16 : 18 }} />
                <span style={{ fontSize: isMobile ? 14 : 16 }}>{t('staff.attendance.history.title')}</span>
              </Space>
            }
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
              boxShadow: mode === 'dark' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
              background: mode === 'dark' ? 'var(--card)' : '#FFFFFF',
            }}
            styles={{ body: { padding: isMobile ? '16px 18px' : '24px 28px' } }}
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
                <TrophyOutlined style={{ color: '#FF380B', fontSize: isMobile ? 16 : 18 }} />
                <span style={{ fontSize: isMobile ? 14 : 16 }}>{t('staff.attendance.history.progress')}</span>
              </Space>
            }
            style={{
              borderRadius: 12,
              marginBottom: isMobile ? 12 : 24,
              overflow: 'hidden',
              border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
              boxShadow: mode === 'dark' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
              background: mode === 'dark' ? 'var(--card)' : '#FFFFFF',
            }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            <div style={{ marginBottom: isMobile ? 16 : 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: isMobile ? 13 : 14 }}>{t('staff.attendance.stats.work_days')}</Text>
                <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>
                  {monthlyStats.workedDays}/{monthlyStats.totalDays}
                </Text>
              </div>
              <Progress
                percent={Number(((monthlyStats.workedDays / monthlyStats.totalDays) * 100).toFixed(1))}
                strokeColor="#52c41a"
                railColor="var(--border)"
                format={(p) => `${p?.toFixed(1)}%`}
              />
            </div>

            <div style={{ marginBottom: isMobile ? 16 : 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: isMobile ? 13 : 14 }}>{t('staff.attendance.history.working_hours')}</Text>
                <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>
                  {monthlyStats.totalHours}/{monthlyStats.totalDays * 8}h
                </Text>
              </div>
              <Progress
                percent={Number(((monthlyStats.totalHours / (monthlyStats.totalDays * 8)) * 100).toFixed(1))}
                strokeColor="#FF380B"
                railColor="var(--border)"
                format={(p) => `${p?.toFixed(1)}%`}
              />
            </div>

            <Divider style={{ margin: isMobile ? '12px 0' : '16px 0' }} />

            <div>
              <Text strong style={{ display: 'block', marginBottom: isMobile ? 8 : 12, fontSize: isMobile ? 13 : 14 }}>
                {t('staff.attendance.history.today')}
              </Text>
              <Timeline
                items={[
                  {
                    color: 'green',
                    content: (
                      <>
                        <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>07:58</Text> <Text style={{ fontSize: isMobile ? 12 : 14 }}>- {t('staff.attendance.timeline.check_in')}</Text>
                      </>
                    ),
                  },
                  {
                    color: 'orange',
                    content: (
                      <>
                        <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>12:00</Text> <Text style={{ fontSize: isMobile ? 12 : 14 }}>- {t('staff.attendance.timeline.lunch_break')}</Text>
                      </>
                    ),
                  },
                  {
                    color: 'green',
                    content: (
                      <>
                        <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>13:00</Text> <Text style={{ fontSize: isMobile ? 12 : 14 }}>- {t('staff.attendance.timeline.resume_work')}</Text>
                      </>
                    ),
                  },
                  {
                    color: 'gray',
                    content: (
                      <>
                        <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>{t('staff.attendance.timeline.working')}</Text>
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
              borderRadius: 12,
              background: mode === 'dark' ? 'var(--card)' : '#FFFFFF',
              border: mode === 'dark' ? '1px solid var(--border)' : '1px solid #E5E7EB',
            }}
            styles={{ body: { padding: isMobile ? 14 : 24 } }}
          >
            <Space size={isMobile ? 10 : 16}>
              <Avatar
                size={isMobile ? 40 : 48}
                style={{
                  background: 'linear-gradient(135deg, #FF380B 0%, #FF380B 100%)',
                }}
              >
                <UserOutlined />
              </Avatar>
              <div>
                <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>Nguyễn Văn A</Text>
                <br />
                <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>{t('staff.attendance.info.staff_info')}</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Confirm Modal */}
      <Modal
        title={t('staff.attendance.modal.confirm')}
        open={isConfirmModalOpen}
        onCancel={() => setIsConfirmModalOpen(false)}
        onOk={confirmAction}
        okText={t('staff.attendance.modal.ok')}
        cancelText={t('staff.attendance.modal.cancel')}
        centered
        width={isMobile ? '90%' : 400}
        style={{
          backgroundColor: mode === 'dark' ? '#1A1A1A' : '#FFFFFF',
          border: mode === 'dark' ? '1px solid rgba(255, 56, 11, 0.2)' : '1px solid #E5E7EB',
          borderRadius: 12,
        }}
        styles={{
          header: {
            backgroundColor: mode === 'dark' ? '#1A1A1A' : '#FFFFFF',
            borderBottom: mode === 'dark' ? '1px solid rgba(255, 56, 11, 0.2)' : '1px solid #E5E7EB',
            borderRadius: '12px 12px 0 0',
            padding: '16px 24px',
            paddingRight: '56px',
          },
          body: { backgroundColor: mode === 'dark' ? '#0A0E14' : '#FFFFFF' },
          footer: {
            backgroundColor: mode === 'dark' ? '#0A0E14' : '#FFFFFF',
            borderTop: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
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
                    ? '#FF380B'
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
            {actionType === 'checkIn' && t('staff.attendance.modal.confirm_checkin')}
            {actionType === 'checkOut' && t('staff.attendance.modal.confirm_checkout')}
            {actionType === 'breakStart' && t('staff.attendance.modal.start_break')}
            {actionType === 'breakEnd' && t('staff.attendance.modal.end_break')}
          </Title>
          <Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>
            {t('staff.attendance.modal.time')}: {formatTime(currentTime)}
          </Text>
        </div>
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

