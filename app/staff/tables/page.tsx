'use client';

import orderSignalRService from '@/lib/services/orderSignalRService';
import reservationService, { ReservationListItem } from '@/lib/services/reservationService';
import { floorService, FloorSummary, tableService, TableSessionInfo } from '@/lib/services/tableService';
import { useTenant } from '@/lib/contexts/TenantContext';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FireOutlined,
  LoginOutlined,
  PhoneOutlined,
  ShoppingCartOutlined,
  TableOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { HubConnectionState } from '@microsoft/signalr';
import { App, Button, Card, Col, ConfigProvider, Divider, Input, Modal, Row, Tag, Typography } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../../theme/AntdProvider';

const { Title, Text } = Typography;

type TableStatus = 'available' | 'occupied';

const CHECKIN_EARLY_MINUTES = 30;
const CHECKIN_LATE_MINUTES = 15;

interface TableActivityData {
  id: string;
  name: string;
  zone: string;
  floorId?: string;
  floorName?: string;
  capacity: number;
  status: TableStatus;
  startAt?: string;
  orderId?: string;
  orderReference?: string;
  orderTotal?: number;
  customerName?: string;
  reservationCode?: string;
  reservationId?: string;
  reservationTime?: string;
  reservationGuests?: number;
  reservationContactName?: string;
  reservationContactPhone?: string;
  reservationStatusName?: string;
  sessionId?: string;
  sessionStartedAt?: string;
  sessionEndedAt?: string | null;
  sessionIsActive?: boolean;
  positionX?: number;
  positionY?: number;
}

const getTableStatusConfig = (mode: 'light' | 'dark') => ({
  available: {
    color: '#52c41a',
    bg: mode === 'dark' ? 'rgba(82,196,26,0.12)' : '#f6ffed',
    border: mode === 'dark' ? 'rgba(82,196,26,0.3)' : '#b7eb8f',
    label: 'staff.floor_activity.status.available',
    icon: <CheckCircleOutlined />,
  },
  occupied: {
    color: 'var(--primary)',
    bg: mode === 'dark' ? 'rgba(255,56,11,0.13)' : 'rgba(255,56,11,0.07)',
    border: mode === 'dark' ? 'rgba(255,56,11,0.35)' : 'rgba(255,56,11,0.25)',
    label: 'staff.floor_activity.status.occupied',
    icon: <UserOutlined />,
  },
});

function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

function getCheckInWindowStatus(reservationTime?: string, now: Date = new Date()) {
  if (!reservationTime) {
    return { allowed: true as const, state: 'allowed' as const };
  }

  const reservationDate = new Date(reservationTime);
  if (Number.isNaN(reservationDate.getTime())) {
    return { allowed: true as const, state: 'allowed' as const };
  }

  const earliestCheckIn = reservationDate.getTime() - CHECKIN_EARLY_MINUTES * 60 * 1000;
  const latestCheckIn = reservationDate.getTime() + CHECKIN_LATE_MINUTES * 60 * 1000;
  const nowTime = now.getTime();

  if (nowTime < earliestCheckIn) {
    return { allowed: false as const, state: 'too_early' as const, reservationDate };
  }

  if (nowTime > latestCheckIn) {
    return { allowed: false as const, state: 'too_late' as const, reservationDate };
  }

  return { allowed: true as const, state: 'allowed' as const, reservationDate };
}

export default function TablesPage({ showAllActivities = false }: { showAllActivities?: boolean } = {}) {
  const { t } = useTranslation();
  const { mode } = useThemeMode();
  const { tenant } = useTenant();
  const { message: messageApi, modal } = App.useApp();

  const [tables, setTables] = useState<TableActivityData[]>([]);
  const [floors, setFloors] = useState<FloorSummary[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [reservationKeyword, setReservationKeyword] = useState('');
  const [selectedTable, setSelectedTable] = useState<TableActivityData | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const statusConfig = getTableStatusConfig(mode);

  const fetchData = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const safe = async <T,>(promise: Promise<T>, fallback: T, label: string): Promise<T> => {
        try {
          return await promise;
        } catch (error) {
          console.warn(`${label} unavailable in tables page:`, error);
          return fallback;
        }
      };

      const [tableData, floorData, sessionData, reservationData] = await Promise.all([
        safe(tableService.getAllTables(), [], 'Tables'),
        safe(floorService.getAllFloors(), [], 'Floors'),
        safe(tableService.getTableSessions(), [], 'Sessions'),
        safe(
          reservationService.getReservations({ 
            pageNumber: 1, 
            pageSize: 200,
            date: new Date().toLocaleDateString('en-CA') 
          }),
          {
            items: [],
            totalCount: 0,
            pageNumber: 1,
            pageSize: 200,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          'Reservations',
        ),
      ]);

      setFloors(floorData);

      const sessionMap = new Map<string, TableSessionInfo>();
      for (const session of sessionData) {
        if (session.isActive) sessionMap.set(session.tableId, session);
      }

      const reservationMap = new Map<string, ReservationListItem>();
      for (const reservation of reservationData.items ?? []) {
        const code = reservation.status?.code?.toUpperCase();
        if (code === 'CANCELLED' || code === 'NO_SHOW' || code === 'NOSHOW' || code === 'COMPLETED' || code === 'CHECKED_IN') continue;
        for (const table of reservation.tables ?? []) {
          if (!reservationMap.has(table.id)) reservationMap.set(table.id, reservation);
        }
      }

      for (const session of sessionData) {
        if (session.reservationId && !reservationMap.has(session.tableId)) {
          const linkedRes = (reservationData.items ?? []).find((r) => r.id === session.reservationId);
          if (linkedRes) reservationMap.set(session.tableId, linkedRes);
        }
      }

      const mapped: TableActivityData[] = tableData.map((item) => {
        const session = sessionMap.get(item.id);
        const reservation = reservationMap.get(item.id);
        const status: TableStatus = session ? 'occupied' : 'available';

        return {
          id: item.id,
          name: item.code,
          zone: item.type || 'Other',
          floorId: item.floorId,
          floorName: item.floorName,
          capacity: item.seatingCapacity,
          positionX: Number(item.positionX) || 0,
          positionY: Number(item.positionY) || 0,
          status,
          startAt: session?.startedAt,
          orderId: session?.orderId ?? undefined,
          orderReference: session?.orderReference ?? undefined,
          orderTotal: session?.orderTotalAmount != null ? Number(session.orderTotalAmount) : undefined,
          reservationCode: reservation?.confirmationCode,
          reservationId: reservation?.id,
          reservationTime: reservation?.reservationDateTime,
          reservationGuests: reservation?.numberOfGuests,
          reservationContactName: reservation?.contactName,
          reservationContactPhone: reservation?.contactPhone,
          reservationStatusName: reservation?.status?.name,
          sessionId: session?.sessionId ?? session?.id,
          sessionStartedAt: session?.startedAt,
          sessionEndedAt: session?.endedAt ?? null,
          sessionIsActive: session?.isActive,
        };
      });

      setTables(mapped);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Tables page fetch failed:', err);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!tenant?.id) return;
    const tenantId = tenant.id;
    let debounceTimer: ReturnType<typeof setTimeout>;
    let mounted = true;

    const handleChange = (payload: unknown) => {
      if (!mounted) return;
      const p = payload as Record<string, unknown>;
      const changedTenantId = (p?.tenantId || (p?.order as Record<string, unknown>)?.tenantId) as string | undefined;
      if (changedTenantId && changedTenantId !== tenantId) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (mounted) fetchData();
      }, 500);
    };

    const events = ['orders.created', 'orders.updated', 'orders.deleted', 'reservations.created', 'reservations.updated', 'reservations.deleted', 'reservations.checkedin', 'tables.updated', 'tables.session_created', 'tables.session_closed'];

    const setup = async () => {
      try {
        await orderSignalRService.start();
        const conn = orderSignalRService.getConnection();
        if (conn.state === HubConnectionState.Connected) {
          await orderSignalRService.invoke('JoinTenantGroup', tenantId);
          events.forEach((e) => orderSignalRService.on(e, handleChange));
        }
      } catch (e) {
        console.error('SignalR tables page:', e);
      }
    };

    setup();

    return () => {
      mounted = false;
      clearTimeout(debounceTimer);
      events.forEach((e) => orderSignalRService.off(e, handleChange));
      orderSignalRService.invoke('LeaveTenantGroup', tenantId).catch(() => {});
    };
  }, [tenant?.id, fetchData]);

  const getCheckInWindowMessage = useCallback((reservationTime?: string) => {
    const checkInWindow = getCheckInWindowStatus(reservationTime);
    const formattedReservationTime = checkInWindow.reservationDate
      ? checkInWindow.reservationDate.toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : null;

    if (checkInWindow.state === 'too_early') {
      return t('staff.floor_activity.modal.checkin_too_early', {
        minutes: CHECKIN_EARLY_MINUTES,
        reservationTime: formattedReservationTime ?? '—',
        defaultValue: `Chỉ được check-in trong vòng ${CHECKIN_EARLY_MINUTES} phút trước giờ đặt (${formattedReservationTime ?? '—'}).`,
      });
    }

    if (checkInWindow.state === 'too_late') {
      return t('staff.floor_activity.modal.checkin_too_late', {
        minutes: CHECKIN_LATE_MINUTES,
        reservationTime: formattedReservationTime ?? '—',
        defaultValue: `Đã quá thời gian check-in hợp lệ. Chỉ hỗ trợ đến ${CHECKIN_LATE_MINUTES} phút sau giờ đặt (${formattedReservationTime ?? '—'}).`,
      });
    }

    return '';
  }, [t]);

  const handleCheckIn = async (table: TableActivityData) => {
    if (!table.reservationCode) return;

    const checkInWindow = getCheckInWindowStatus(table.reservationTime);
    if (!checkInWindow.allowed) {
      messageApi.warning(getCheckInWindowMessage(table.reservationTime));
      return;
    }

    setIsCheckingIn(true);
    try {
      await reservationService.checkInReservation(table.reservationCode);
      messageApi.success(t('staff.floor_activity.modal.checkin_success', { defaultValue: 'Check-in thành công!' }));
      setSelectedTable(null);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      messageApi.error(msg || t('staff.floor_activity.modal.checkin_error', { defaultValue: 'Check-in thất bại' }));
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCloseSession = useCallback((table: TableActivityData) => {
    if (!table.sessionIsActive) return;

    modal.confirm({
      title: t('staff.floor_activity.modal.end_session_confirm_title', {
        defaultValue: 'Kết thúc phiên bàn?',
      }),
      content: t('staff.floor_activity.modal.end_session_confirm_content', {
        defaultValue: 'Thao tác này sẽ đóng phiên hiện tại của bàn và cập nhật trạng thái bàn ngay lập tức.',
      }),
      okText: t('staff.floor_activity.modal.end_session_btn', { defaultValue: 'Kết thúc phiên' }),
      cancelText: t('staff.floor_activity.modal.cancel', { defaultValue: 'Hủy' }),
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await tableService.closeTableSession(table.id);
          messageApi.success(t('staff.floor_activity.modal.end_session_success', { defaultValue: 'Đã kết thúc phiên bàn' }));
          setSelectedTable(null);
          await fetchData();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          messageApi.error(msg || t('staff.floor_activity.modal.end_session_error', { defaultValue: 'Không thể kết thúc phiên bàn' }));
        }
      },
    });
  }, [fetchData, messageApi, modal, t]);

  const reservationKeywordNormalized = reservationKeyword.trim().toLowerCase();
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (!reservationKeywordNormalized) return true;
      return [t.reservationCode, t.reservationContactName, t.reservationContactPhone, t.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(reservationKeywordNormalized));
    });
  }, [reservationKeywordNormalized, tables]);

  const statsOccupied = filteredTables.filter((t) => t.status === 'occupied').length;
  const statsAvailable = filteredTables.filter((t) => t.status === 'available').length;
  const statsHasReservation = filteredTables.filter((t) => t.status === 'available' && !!(t.reservationCode || t.reservationContactName)).length;

  const tableGroups = useMemo(() => {
    const byFloor = new Map<string, TableActivityData[]>();
    const noFloor: TableActivityData[] = [];

    for (const table of filteredTables) {
      if (table.floorId) {
        const list = byFloor.get(table.floorId) || [];
        list.push(table);
        byFloor.set(table.floorId, list);
      } else {
        noFloor.push(table);
      }
    }

    if (showAllActivities) {
      return [
        ...floors.map((floor) => ({ label: floor.name, id: floor.id, tables: byFloor.get(floor.id) || [] })),
        { label: t('staff.floor_activity.no_floor'), id: '__no_floor__', tables: noFloor },
      ].filter((g) => g.tables.length > 0);
    }

    return [
      {
        label: t('staff.floor_activity.all_floors'),
        id: 'all',
        tables: filteredTables,
      },
    ];
  }, [filteredTables, floors, showAllActivities, t]);

  const hasResults = tableGroups.length > 0;
  const selectedTableCheckInWindow = selectedTable ? getCheckInWindowStatus(selectedTable.reservationTime) : null;
  const canCheckInNow = selectedTableCheckInWindow?.allowed ?? false;
  const checkInWindowMessage = selectedTable ? getCheckInWindowMessage(selectedTable.reservationTime) : '';

  return (
    <div className="floor-activity-root">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="floor-activity-header">
        <div className="floor-activity-header-left">
          <div className="floor-activity-title-row">
            <span className="floor-activity-live-dot" />
            <Title level={isMobile ? 5 : 4} style={{ margin: 0, color: 'var(--text)' }}>
              {t('staff.menu.tables')}
            </Title>
          </div>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {t('staff.floor_activity.last_updated')}: {lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
        </div>

        <div className="floor-activity-header-right" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <ConfigProvider theme={mode === 'dark' ? undefined : { token: { colorBgContainer: '#ffffff', colorText: '#000000' } }}>
            <Input
              allowClear
              value={reservationKeyword}
              onChange={(e) => setReservationKeyword(e.target.value)}
              placeholder={t('staff.floor_activity.search_placeholder')}
              style={{ width: isMobile ? 170 : 240, borderRadius: 10 }}
            />
          </ConfigProvider>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
        <Row gutter={[isMobile ? 10 : 16, isMobile ? 10 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
          {[
            { label: t('staff.floor_activity.stats.occupied'), value: statsOccupied, color: 'var(--primary)', icon: <UserOutlined />, bg: 'rgba(255,56,11,0.08)' },
            { label: t('staff.floor_activity.stats.available'), value: statsAvailable, color: '#52c41a', icon: <CheckCircleOutlined />, bg: 'rgba(82,196,26,0.08)' },
            { label: t('staff.floor_activity.stats.has_reservation'), value: statsHasReservation, color: '#1890ff', icon: <ClockCircleOutlined />, bg: 'rgba(24,144,255,0.08)' },
          ].map((stat, i) => (
            <Col xs={12} sm={8} key={i}>
              <motion.div whileHover={!isMobile ? { y: -3 } : undefined} transition={{ duration: 0.2 }}>
                <Card style={{ borderRadius: isMobile ? 12 : 16, border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: '100%' }} styles={{ body: { padding: isMobile ? '14px 16px' : '18px 20px' } }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14 }}>
                    <div style={{ width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 16 : 20, color: stat.color, flexShrink: 0 }}>{stat.icon}</div>
                    <div>
                      <Text style={{ fontSize: isMobile ? 11 : 12, color: 'var(--text-muted)', display: 'block' }}>{stat.label}</Text>
                      <Text style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: stat.color, lineHeight: 1.1 }}>{stat.value}</Text>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={reservationKeywordNormalized} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          {hasResults ? tableGroups.map((group) => (
            <div key={group.id} style={{ marginBottom: isMobile ? 20 : 28 }}>
              <div className="floor-activity-group-header">
                <FireOutlined style={{ color: 'var(--primary)', fontSize: 14 }} />
                <Text style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{group.label}</Text>
                <div className="floor-activity-group-divider" />
                <Text style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {group.tables.filter((t) => t.status === 'occupied').length}/{group.tables.length} {t('staff.floor_activity.occupied_suffix')}
                </Text>
              </div>

              <Row gutter={[isMobile ? 10 : 14, isMobile ? 10 : 14]}>
                {group.tables.map((table, ti) => {
                  const cfg = statusConfig[table.status];
                  return (
                    <Col xs={12} sm={8} md={6} lg={4} xl={4} key={table.id}>
                      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25, delay: Math.min(ti * 0.03, 0.3) }} whileHover={!isMobile ? { y: -4, transition: { duration: 0.18 } } : undefined} style={{ height: '100%' }}>
                        <div className="floor-activity-table-card" style={{ background: cfg.bg, borderColor: cfg.border, cursor: 'pointer' }} onClick={() => setSelectedTable(table)}>
                          <div className="floor-activity-table-top" style={{ justifyContent: 'flex-end' }}>
                            <span className="floor-activity-order-status-badge" style={{ visibility: 'hidden' }}>Placeholder</span>
                          </div>

                          <div className="table-card-number-badge" style={{ background: table.status === 'occupied' ? 'rgba(255,255,255,0.72)' : tint(cfg.color, 15), border: table.status === 'occupied' ? `2px solid ${tint(cfg.color, 40)}` : `2px solid ${tint(cfg.color, 28)}`, boxShadow: table.status === 'occupied' ? `0 0 0 1px ${tint(cfg.color, 22)} inset` : undefined }}>
                            <Text style={{ fontSize: 9, fontWeight: 700, color: cfg.color, opacity: 0.65, letterSpacing: 1.5, textTransform: 'uppercase', lineHeight: 1 }}>
                              {t('staff.floor_activity.table_label')}
                            </Text>
                            <Text style={{ fontSize: isMobile ? 26 : 30, fontWeight: 900, color: cfg.color, lineHeight: 1.05 }}>{table.name}</Text>
                          </div>

                          <div className="table-card-capacity-row">
                            <UserOutlined style={{ fontSize: 12, color: 'var(--text-muted)' }} />
                            <Text style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{table.capacity} {t('staff.floor_activity.seats_label')}</Text>
                          </div>

                          <Tag style={{ borderRadius: 20, fontSize: 11, padding: '2px 10px', border: 'none', background: tint(cfg.color, 20), color: cfg.color, marginTop: 4, fontWeight: 700 }}>
                            {cfg.icon} {t(cfg.label)}
                          </Tag>

                          <div className="floor-activity-table-detail floor-activity-table-detail--fixed">
                            {table.reservationCode ? (
                              <div className="floor-activity-detail-row">
                                <CalendarOutlined style={{ fontSize: 10, color: '#1890ff' }} />
                                <Text style={{ fontSize: 11, color: '#1890ff', marginRight: 4 }}>
                                  {new Date(table.reservationTime!).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <Text style={{ fontSize: 11, color: '#1890ff', fontWeight: 600 }}>#{table.reservationCode}</Text>
                              </div>
                            ) : table.status === 'occupied' && table.startAt ? (
                              <div className="floor-activity-detail-row">
                                <ClockCircleOutlined style={{ fontSize: 10, color: 'var(--text-muted)' }} />
                                <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(table.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
                              </div>
                            ) : (
                              <div className="floor-activity-detail-row" style={{ visibility: 'hidden' }}>
                                <ClockCircleOutlined style={{ fontSize: 10 }} />
                                <Text style={{ fontSize: 11 }}>00:00</Text>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-muted)' }}>
              <TableOutlined style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{t('staff.floor_activity.no_tables')}</div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Modal
        open={!!selectedTable}
        onCancel={() => setSelectedTable(null)}
        footer={null}
        width={isMobile ? '95%' : 560}
        centered
        closable
        wrapClassName="table-detail-modal-wrap"
        styles={{ body: { padding: 0 }, mask: { backdropFilter: 'blur(2px)' } }}
      >
        {selectedTable && (() => {
          const cfg = statusConfig[selectedTable.status];
          const hasReservation = !!(selectedTable.reservationCode || selectedTable.reservationContactName || selectedTable.reservationTime);
          const hasOrder = !!(selectedTable.orderId || selectedTable.orderReference || selectedTable.orderTotal);

          return (
            <div className="table-modal-root">
              <div className="table-modal-hero" style={{ background: `linear-gradient(135deg, ${tint(cfg.color, 22)} 0%, ${tint(cfg.color, 8)} 100%)`, borderBottom: `1px solid ${tint(cfg.color, 25)}` }}>
                <div className="table-modal-hero-icon" style={{ background: tint(cfg.color, 18), border: `2px solid ${tint(cfg.color, 35)}` }}>
                  <TableOutlined style={{ fontSize: 32, color: cfg.color }} />
                </div>
                <div className="table-modal-hero-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Title level={4} style={{ margin: 0, color: 'var(--text)' }}>{selectedTable.name}</Title>
                    <Tag style={{ borderRadius: 20, padding: '3px 12px', border: 'none', background: `${cfg.color}20`, color: cfg.color, fontWeight: 700, fontSize: 12 }}>
                      {cfg.icon} {t(cfg.label)}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}><UserOutlined style={{ marginRight: 5 }} />{selectedTable.capacity} {t('staff.floor_activity.modal.seats')}</Text>
                    {selectedTable.floorName && <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}><TableOutlined style={{ marginRight: 5 }} />{selectedTable.floorName}</Text>}
                  </div>
                </div>
              </div>

              <div className="table-modal-body">
                <div className="table-modal-section">
                  <div className="table-modal-section-header">
                    <div className="table-modal-section-icon" style={{ background: 'rgba(24,144,255,0.12)', color: '#1890ff' }}>
                      <ClockCircleOutlined />
                    </div>
                    <Text strong style={{ fontSize: 14, color: 'var(--text)' }}>
                      {t('staff.floor_activity.modal.session', { defaultValue: 'Phiên bàn' })}
                    </Text>
                    {selectedTable.sessionIsActive ? (
                      <Tag style={{ marginLeft: 'auto', borderRadius: 12, fontSize: 11, fontWeight: 600, border: 'none' }} color="green">
                        {t('staff.floor_activity.status.active', { defaultValue: 'Đang hoạt động' })}
                      </Tag>
                    ) : (
                      <Tag style={{ marginLeft: 'auto', borderRadius: 12, fontSize: 11, fontWeight: 600, border: 'none' }}>
                        {t('staff.floor_activity.status.inactive', { defaultValue: 'Đã kết thúc' })}
                      </Tag>
                    )}
                  </div>

                  <div className="table-modal-info-grid">
                    {selectedTable.sessionId && (
                      <div className="table-modal-info-row">
                        <span className="table-modal-info-label">
                          <ClockCircleOutlined /> {t('staff.floor_activity.modal.session_id', { defaultValue: 'Session ID' })}
                        </span>
                        <span className="table-modal-info-value" style={{ fontFamily: 'monospace' }}>{selectedTable.sessionId}</span>
                      </div>
                    )}
                    <div className="table-modal-info-row">
                      <span className="table-modal-info-label">
                        <ClockCircleOutlined /> {t('staff.floor_activity.modal.start_time', { defaultValue: 'Giờ bắt đầu' })}
                      </span>
                      <span className="table-modal-info-value">
                        {selectedTable.sessionStartedAt
                          ? new Date(selectedTable.sessionStartedAt).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : '—'}
                      </span>
                    </div>
                    <div className="table-modal-info-row">
                      <span className="table-modal-info-label">
                        <ClockCircleOutlined /> {t('staff.floor_activity.modal.end_time', { defaultValue: 'Giờ kết thúc' })}
                      </span>
                      <span className="table-modal-info-value">
                        {selectedTable.sessionEndedAt
                          ? new Date(selectedTable.sessionEndedAt).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {selectedTable.sessionIsActive && (
                    <Button
                      danger
                      block
                      size="large"
                      onClick={() => handleCloseSession(selectedTable)}
                      style={{ marginTop: 12, borderRadius: 12, height: 44, fontWeight: 700, fontSize: 14 }}
                    >
                      {t('staff.floor_activity.modal.end_session_btn', { defaultValue: 'Kết thúc phiên' })}
                    </Button>
                  )}
                </div>

                {hasReservation && (
                  <div className="table-modal-section">
                    <div className="table-modal-section-header">
                      <div className="table-modal-section-icon" style={{ background: 'rgba(24,144,255,0.12)', color: '#1890ff' }}>
                        <CalendarOutlined />
                      </div>
                      <Text strong style={{ fontSize: 14, color: 'var(--text)' }}>Reservation</Text>
                      {selectedTable.reservationCode && <span className="table-modal-code-badge">#{selectedTable.reservationCode}</span>}
                      {selectedTable.reservationStatusName && <Tag style={{ marginLeft: 'auto', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{selectedTable.reservationStatusName}</Tag>}
                    </div>

                    <div className="table-modal-info-grid">
                      {(selectedTable.reservationContactName || selectedTable.customerName) && (
                        <div className="table-modal-info-row">
                          <span className="table-modal-info-label"><UserOutlined /> {t('staff.floor_activity.modal.reserved_by')}</span>
                          <span className="table-modal-info-value">{selectedTable.reservationContactName || selectedTable.customerName}</span>
                        </div>
                      )}
                      {selectedTable.reservationContactPhone && (
                        <div className="table-modal-info-row">
                          <span className="table-modal-info-label"><PhoneOutlined /> {t('staff.floor_activity.modal.phone')}</span>
                          <span className="table-modal-info-value" style={{ fontFamily: 'monospace' }}>{selectedTable.reservationContactPhone}</span>
                        </div>
                      )}
                      {selectedTable.reservationTime && (
                        <div className="table-modal-info-row">
                          <span className="table-modal-info-label"><ClockCircleOutlined /> {t('staff.floor_activity.modal.reservation_time')}</span>
                          <span className="table-modal-info-value">{new Date(selectedTable.reservationTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        </div>
                      )}
                      {selectedTable.reservationGuests != null && (
                        <div className="table-modal-info-row">
                          <span className="table-modal-info-label"><UserOutlined /> {t('staff.floor_activity.modal.guest_count')}</span>
                          <span className="table-modal-info-value">{selectedTable.reservationGuests} {t('staff.floor_activity.modal.guests')}</span>
                        </div>
                      )}
                    </div>

                    {selectedTable.reservationCode && selectedTable.status === 'available' && (
                      <>
                        <Button
                          type="primary"
                          icon={<LoginOutlined />}
                          loading={isCheckingIn}
                          disabled={!canCheckInNow}
                          onClick={() => handleCheckIn(selectedTable)}
                          block
                          size="large"
                          style={{ marginTop: 12, borderRadius: 12, height: 44, fontWeight: 700, fontSize: 14 }}
                        >
                          {t('staff.floor_activity.modal.checkin_btn')}
                        </Button>
                        {!canCheckInNow && (
                          <Text style={{ display: 'block', marginTop: 8, color: '#faad14', fontSize: 12 }}>
                            {checkInWindowMessage}
                          </Text>
                        )}
                      </>
                    )}
                  </div>
                )}

                {hasOrder && (
                  <>
                    {hasReservation && <Divider style={{ margin: '0 0 16px' }} />}
                    <div className="table-modal-section">
                      <div className="table-modal-section-header">
                        <div className="table-modal-section-icon" style={{ background: 'rgba(255,56,11,0.1)', color: 'var(--primary)' }}>
                          <ShoppingCartOutlined />
                        </div>
                        <Text strong style={{ fontSize: 14, color: 'var(--text)' }}>Order</Text>
                        {selectedTable.orderReference && <span className="table-modal-code-badge" style={{ background: 'rgba(255,56,11,0.1)', color: 'var(--primary)', border: '1px solid rgba(255,56,11,0.2)' }}>#{selectedTable.orderReference}</span>}
                      </div>

                      <div className="table-modal-info-grid">
                        {selectedTable.orderTotal != null && (
                          <div className="table-modal-info-row">
                            <span className="table-modal-info-label"><DollarOutlined /> {t('staff.floor_activity.modal.total')}</span>
                            <span className="table-modal-info-value" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>{selectedTable.orderTotal.toLocaleString('vi-VN')}d</span>
                          </div>
                        )}
                        {!hasReservation && selectedTable.startAt && (
                          <div className="table-modal-info-row">
                            <span className="table-modal-info-label"><ClockCircleOutlined /> {t('staff.floor_activity.modal.start_time')}</span>
                            <span className="table-modal-info-value">{new Date(selectedTable.startAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {!hasReservation && !hasOrder && (
                  <div style={{ textAlign: 'center', padding: '24px 0 8px', color: 'var(--text-muted)' }}>
                    {selectedTable.status === 'occupied' ? (
                      <><UserOutlined style={{ fontSize: 32, color: cfg.color, marginBottom: 8, display: 'block' }} /><Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t(cfg.label)}</Text></>
                    ) : (
                      <><CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8, display: 'block' }} /><Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('staff.floor_activity.status.available')}</Text></>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
