'use client';

import orderService, { OrderDto } from '@/lib/services/orderService';
import orderSignalRService from '@/lib/services/orderSignalRService';
import orderStatusService from '@/lib/services/orderStatusService';
import reservationService, { ReservationListItem } from '@/lib/services/reservationService';
import { floorService, FloorSummary, tableService, TableStatus as TableStatusEnum } from '@/lib/services/tableService';
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
import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  message,
  Modal,
  Row,
  Select,
  Tag,
  Typography,
  ConfigProvider,
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../../theme/AntdProvider';

const { Title, Text } = Typography;

export const SESSIONS = [
  { value: 'all', label: 'Tất cả (All)', startTime: '00:00', endTime: '23:59' },
  { value: 'morning', label: 'Sáng (08:00 - 12:00)', startTime: '08:00', endTime: '12:00' },
  { value: 'noon', label: 'Trưa (12:00 - 17:00)', startTime: '12:00', endTime: '17:00' },
  { value: 'evening', label: 'Tối (17:00 - 22:00)', startTime: '17:00', endTime: '22:00' }
];

export const getCurrentSession = (sessions: typeof SESSIONS) => {
  const now = new Date();
  const currentTotal = now.getHours() * 60 + now.getMinutes();

  for (const s of sessions) {
    if (s.value === 'all') continue;
    const [sH, sM] = s.startTime.split(':').map(Number);
    const [eH, eM] = s.endTime.split(':').map(Number);
    if (currentTotal >= sH * 60 + sM && currentTotal < eH * 60 + eM) {
      return s.value;
    }
  }

  let closestSession = sessions[1].value; // Default to first actual session
  let minDiff = Infinity;
  for (const s of sessions) {
    if (s.value === 'all') continue;
    const [eH, eM] = s.endTime.split(':').map(Number);
    const endTotal = eH * 60 + eM;
    if (endTotal <= currentTotal) {
      const diff = currentTotal - endTotal;
      if (diff < minDiff) {
        minDiff = diff;
        closestSession = s.value;
      }
    }
  }
  return closestSession;
};

type TableStatus = 'available' | 'occupied';

interface TableActivityData {
  id: string;
  name: string;
  zone: string;
  floorId?: string;
  floorName?: string;
  capacity: number;
  status: TableStatus;
  guests?: number;
  startAt?: string;
  durationMinutes?: number;
  orderId?: string;
  orderReference?: string;
  orderTotal?: number;
  orderItemCount?: number;
  orderStatusName?: string;
  orderStatusColor?: string;
  paymentStatusName?: string;
  customerName?: string;
  reservationCode?: string;
  reservationId?: string;
  reservationTime?: string;
  reservationGuests?: number;
  reservationContactName?: string;
  reservationContactPhone?: string;
  reservationStatusName?: string;
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
    pulse: false,
  },
  occupied: {
    color: 'var(--primary)',
    bg: mode === 'dark' ? 'rgba(255,56,11,0.13)' : 'rgba(255,56,11,0.07)',
    border: mode === 'dark' ? 'rgba(255,56,11,0.35)' : 'rgba(255,56,11,0.25)',
    label: 'staff.floor_activity.status.occupied',
    icon: <UserOutlined />,
    pulse: true,
  },
});

function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

export default function TablesPage({ showAllActivities = false, showFilters = false }: { showAllActivities?: boolean; showFilters?: boolean } = {}) {
  const { t } = useTranslation();
  const { mode } = useThemeMode();
  const { tenant } = useTenant();

  const [tables, setTables] = useState<TableActivityData[]>([]);
  const [floors, setFloors] = useState<FloorSummary[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [reservationKeyword, setReservationKeyword] = useState('');
  const [sessionFilter, setSessionFilter] = useState<string>(() => getCurrentSession(SESSIONS));
  const [selectedTable, setSelectedTable] = useState<TableActivityData | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const inFlightRef = useRef(false);

  // Viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const statusConfig = getTableStatusConfig(mode);

  // Fetch all data
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

      // Build order time range: scope to today (or current session if selected)
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const orderParams: { From?: string; To?: string } = {
        From: `${today}T00:00:00`,
        To: `${today}T23:59:59`,
      };

      const [tableData, floorData, orderStatusData, orderData, reservationData] = await Promise.all([
        safe(tableService.getAllTables(), [], 'Tables'),
        safe(floorService.getAllFloors(), [], 'Floors'),
        safe(orderStatusService.getAllStatuses(), [], 'Order statuses'),
        safe(orderService.getAllOrders(orderParams), [], 'Orders'),
        safe(
          reservationService.getReservations({
            pageNumber: 1,
            pageSize: 200,
            date: new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local time
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
          'Reservations'
        ),
      ]);

      setFloors(floorData);

      // Build order map: tableId -> latest active order (skip completed/cancelled for non-occupied tables)
      const orderMap = new Map<string, OrderDto>();
      for (const order of orderData) {
        const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
        const tableId =
          (order.tableId && order.tableId !== EMPTY_GUID ? order.tableId : undefined) ||
          (order.tableSessions ?? []).map((s) => s?.tableId).find((id): id is string => !!id && id !== EMPTY_GUID) ||
          (order.tableIds ?? []).find((id): id is string => !!id && id !== EMPTY_GUID);

        if (!tableId) continue;

        // Skip cancelled orders only — completed orders still matter for occupied tables
        if (order.cancelledAt) continue;

        const current = orderMap.get(tableId);
        if (!current) {
          orderMap.set(tableId, order);
          continue;
        }

        const currentTime = new Date(current.createdDate || 0).getTime();
        const nextTime = new Date(order.createdDate || 0).getTime();
        if (nextTime >= currentTime) {
          orderMap.set(tableId, order);
        }
      }

      // Fetch missing reservations referenced by active orders
      const missingResIds = new Set<string>();
      for (const order of orderMap.values()) {
        if (order.reservationId && !reservationData.items.some(r => r.id === order.reservationId)) {
          missingResIds.add(order.reservationId);
        }
      }
      
      if (missingResIds.size > 0) {
        const extraReservations = await Promise.all(
          Array.from(missingResIds).map(id => safe(reservationService.getReservationById(id), null as any, 'Extra Reservation'))
        );
        for (const res of extraReservations) {
          if (res) {
            reservationData.items.push({
              id: res.id,
              confirmationCode: res.confirmationCode,
              reservationDateTime: res.reservationDateTime,
              numberOfGuests: res.numberOfGuests,
              contactName: res.contact?.name,
              contactPhone: res.contact?.phone,
              isGuest: res.contact?.isGuest,
              status: res.status,
              tables: res.tables,
            } as any);
          }
        }
      }

      // Build reservation map: include all reservations except cancelled/no-show
      const reservationMap = new Map<string, ReservationListItem>();

      const activeSessionObj = SESSIONS.find(s => s.value === sessionFilter);
      let sH = 0, sM = 0, eH = 24, eM = 0;
      if (activeSessionObj && activeSessionObj.value !== 'all') {
         [sH, sM] = activeSessionObj.startTime.split(':').map(Number);
         [eH, eM] = activeSessionObj.endTime.split(':').map(Number);
      }

      for (const reservation of reservationData.items ?? []) {
        // Exclude only cancelled and no-show reservations, keep everything else
        // so occupied tables still show their reservation info
        const code = reservation.status?.code?.toUpperCase();
        if (code === 'CANCELLED' || code === 'NO_SHOW' || code === 'NOSHOW') continue;

        // FILTER BY SESSION
        if (activeSessionObj && activeSessionObj.value !== 'all') {
           const resTime = new Date(reservation.reservationDateTime);
           const resTotal = resTime.getHours() * 60 + resTime.getMinutes();
           const startTotal = sH * 60 + sM;
           const endTotal = eH * 60 + eM;
           if (resTotal < startTotal || resTotal >= endTotal) {
              continue; // skip reservations outside current session
           }
        }

        for (const table of reservation.tables ?? []) {
          if (!reservationMap.has(table.id)) {
            reservationMap.set(table.id, reservation);
          }
        }
      }

      const mapped: TableActivityData[] = tableData.map((item) => {
        // BE only has Available(0) and Occupied(1)
        let status: TableStatus = 'available';
        if (item.tableStatusId === TableStatusEnum.Occupied) status = 'occupied';

        const order = orderMap.get(item.id);
        let reservation = reservationMap.get(item.id);

        // If table has an active order linked to a reservation, prioritize that reservation
        if (order?.reservationId) {
          const linkedRes = (reservationData.items ?? []).find(r => r.id === order.reservationId);
          if (linkedRes) reservation = linkedRes;
        }

        // Only attach order data to occupied tables
        const isOccupied = status === 'occupied';
        const matchedStatus = isOccupied && order
          ? orderStatusData.find((s) => Number(s.id) === Number(order.orderStatusId))
          : undefined;

        const startAt = isOccupied ? (order?.createdDate || undefined) : undefined;

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
          guests: undefined,
          startAt,
          // Order data — only for occupied tables
          orderId: isOccupied ? order?.id : undefined,
          orderReference: isOccupied ? (order?.reference || undefined) : undefined,
          orderTotal: isOccupied && order ? Number(order.totalAmount || 0) : undefined,
          orderItemCount: isOccupied && order ? (order.orderDetails?.length ?? 0) : undefined,
          orderStatusName: matchedStatus?.name,
          orderStatusColor: matchedStatus?.color,
          paymentStatusName: isOccupied ? (order?.paymentStatusName || undefined) : undefined,
          customerName: isOccupied
            ? (order?.customerName?.trim() || (order?.customerId ? `Customer #${order.customerId.slice(0, 8)}` : undefined))
            : undefined,
          // Reservation data — only for reserved tables
          reservationCode: reservation?.confirmationCode,
          reservationId: reservation?.id,
          reservationTime: reservation?.reservationDateTime,
          reservationGuests: reservation?.numberOfGuests,
          reservationContactName: reservation?.contactName,
          reservationContactPhone: reservation?.contactPhone,
          reservationStatusName: reservation?.status?.name,
        };
      });

      setTables(mapped);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Tables page fetch failed:', err);
    } finally {
      inFlightRef.current = false;
    }
  }, [sessionFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-switch session filter when real time crosses a shift boundary
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getCurrentSession(SESSIONS);
      setSessionFilter(prev => {
        // Only auto-switch if user hasn't manually picked 'all'
        if (prev !== 'all' && prev !== current) return current;
        return prev;
      });
    }, 60_000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // SignalR realtime updates
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
      debounceTimer = setTimeout(() => { if (mounted) fetchData(); }, 500);
    };

    const events = [
      'orders.created',
      'orders.updated',
      'orders.deleted',
      'reservations.created',
      'reservations.updated',
      'reservations.deleted',
      'reservations.checkedin',
      'tables.updated',
    ];

    const setup = async () => {
      try {
        await orderSignalRService.start();
        const conn = orderSignalRService.getConnection();
        if (conn.state === HubConnectionState.Connected) {
          await orderSignalRService.invoke('JoinTenantGroup', tenantId);
          events.forEach((e) => orderSignalRService.on(e, handleChange));
        }
      } catch (e) { console.error('SignalR tables page:', e); }
    };
    setup();

    return () => {
      mounted = false;
      clearTimeout(debounceTimer);
      events.forEach((e) => orderSignalRService.off(e, handleChange));
      orderSignalRService.invoke('LeaveTenantGroup', tenantId).catch(() => { });
    };
  }, [tenant?.id, fetchData]);

  const handleCheckIn = async (confirmationCode: string) => {
    setIsCheckingIn(true);
    try {
      await reservationService.checkInReservation(confirmationCode);
      message.success(t('staff.floor_activity.modal.checkin_success'));
      setSelectedTable(null);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      message.error(msg || t('staff.floor_activity.modal.checkin_error'));
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Filter tables by active floor + reservation code + reservation status
  const reservationKeywordNormalized = reservationKeyword.trim().toLowerCase();
  const floorFilteredTables = activeFloorId === 'all'
    ? tables
    : tables.filter((t) => t.floorId === activeFloorId);

  const keywordFilteredTables = reservationKeywordNormalized
    ? floorFilteredTables.filter((t) =>
      (t.reservationCode || '').toLowerCase().includes(reservationKeywordNormalized)
    )
    : floorFilteredTables;

  const activeSessionFilter = showAllActivities ? 'all' : (sessionFilter === 'all' ? getCurrentSession(SESSIONS) : sessionFilter);
  const isSessionFiltered = !showAllActivities && activeSessionFilter !== 'all';
  const canShowFilters = showFilters || showAllActivities;

  const filteredTables = keywordFilteredTables.filter((t) => {
    if (showAllActivities) return true;

    const reservationTime = t.reservationTime;
    if (!reservationTime) return false;

    const sessionDef = SESSIONS.find(s => s.value === activeSessionFilter);
    if (!sessionDef) return true;

    const resDate = new Date(reservationTime);
    const resMins = resDate.getHours() * 60 + resDate.getMinutes();
    const [sH, sM] = sessionDef.startTime.split(':').map(Number);
    const [eH, eM] = sessionDef.endTime.split(':').map(Number);
    return resMins >= sH * 60 + sM && resMins < eH * 60 + eM;
  });

  // Practical staff metrics
  const statsAvailable = filteredTables.filter((t) => t.status === 'available').length;
  const statsHasReservation = filteredTables.filter((t) => t.status === 'available' && !!(t.reservationCode || t.reservationContactName)).length;

  // Group by floor for "all" view, or just show flat
  const tableGroups: { label: string; id: string; tables: TableActivityData[] }[] =
    activeFloorId === 'all'
      ? [
        ...floors.map((floor) => ({
          label: floor.name,
          id: floor.id,
          tables: filteredTables.filter((t) => t.floorId === floor.id),
        })),
        {
          label: t('staff.floor_activity.no_floor'),
          id: '__no_floor__',
          tables: filteredTables.filter((t) => !t.floorId || !floors.some((f) => f.id === t.floorId)),
        },
      ].filter((g) => g.tables.length > 0)
      : [
        {
          label: floors.find((f) => f.id === activeFloorId)?.name || activeFloorId,
          id: activeFloorId,
          tables: filteredTables,
        },
      ];
  const hasSessionResults = tableGroups.length > 0;

  return (
    <div className="floor-activity-root">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="floor-activity-header"
      >
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
            {canShowFilters && (
              <Select
                value={sessionFilter}
                onChange={(value: string) => setSessionFilter(value)}
                style={{ width: isMobile ? 130 : 180 }}
                options={SESSIONS.map(s => ({ value: s.value, label: s.label }))}
              />
            )}
          </ConfigProvider>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
      >
        <Row gutter={[isMobile ? 10 : 16, isMobile ? 10 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
          {[
            { label: t('staff.floor_activity.stats.occupied'), value: filteredTables.filter((t) => t.status === 'occupied').length, color: 'var(--primary)', icon: <UserOutlined />, bg: 'rgba(255,56,11,0.08)' },
            { label: t('staff.floor_activity.stats.available'), value: statsAvailable, color: '#52c41a', icon: <CheckCircleOutlined />, bg: 'rgba(82,196,26,0.08)' },
            { label: t('staff.floor_activity.stats.has_reservation'), value: statsHasReservation, color: '#1890ff', icon: <ClockCircleOutlined />, bg: 'rgba(24,144,255,0.08)' },
          ].map((stat, i) => (
            <Col xs={12} sm={8} key={i}>
              <motion.div
                whileHover={!isMobile ? { y: -3 } : undefined}
                transition={{ duration: 0.2 }}
              >
                <Card
                  style={{
                    borderRadius: isMobile ? 12 : 16,
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    height: '100%',
                  }}
                  styles={{ body: { padding: isMobile ? '14px 16px' : '18px 20px' } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14 }}>
                    <div style={{
                      width: isMobile ? 36 : 44,
                      height: isMobile ? 36 : 44,
                      borderRadius: 10,
                      background: stat.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? 16 : 20,
                      color: stat.color,
                      flexShrink: 0,
                    }}>
                      {stat.icon}
                    </div>
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


      {/* Floor Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.18 }}
      >
        <div className="floor-activity-tabs-wrap">
          {[
            { id: 'all', name: t('staff.floor_activity.all_floors'), count: tables.length },
            ...floors.map((f) => ({
              id: f.id,
              name: f.name,
              count: tables.filter((t) => t.floorId === f.id).length,
            })),
          ].map((tab) => {
            const isActive = activeFloorId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFloorId(tab.id)}
                className={`floor-activity-tab ${isActive ? 'floor-activity-tab--active' : ''}`}
              >
                <span>{tab.name}</span>
                <span className={`floor-activity-tab-badge ${isActive ? 'floor-activity-tab-badge--active' : ''}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Table Groups */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFloorId + reservationKeywordNormalized}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {hasSessionResults ? tableGroups.map((group) => (
            <div key={group.id} style={{ marginBottom: isMobile ? 20 : 28 }}>
              {(activeFloorId === 'all' || tableGroups.length > 1) && (
                <div className="floor-activity-group-header">
                  <FireOutlined style={{ color: 'var(--primary)', fontSize: 14 }} />
                  <Text style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{group.label}</Text>
                  <div className="floor-activity-group-divider" />
                  <Text style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {group.tables.filter((t) => t.status === 'occupied').length}/{group.tables.length} {t('staff.floor_activity.occupied_suffix')}
                  </Text>
                </div>
              )}

              <Row gutter={[isMobile ? 10 : 14, isMobile ? 10 : 14]}>
                {group.tables.map((table, ti) => {
                  const cfg = statusConfig[table.status];
                  return (
                    <Col xs={12} sm={8} md={6} lg={4} xl={4} key={table.id}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25, delay: Math.min(ti * 0.03, 0.3) }}
                        whileHover={!isMobile ? { y: -4, transition: { duration: 0.18 } } : undefined}
                        style={{ height: '100%' }}
                      >
                        <div
                          className="floor-activity-table-card"
                          style={{
                            background: cfg.bg,
                            borderColor: cfg.border,
                            cursor: 'pointer',
                          }}
                          onClick={() => setSelectedTable(table)}
                        >
                          {/* Pulse ring for occupied */}
                          {table.status === 'occupied' && (
                            <span className="floor-activity-pulse-ring" />
                          )}

                          {/* Top spacer/status row — keep consistent card layout */}
                          <div className="floor-activity-table-top" style={{ justifyContent: 'flex-end' }}>
                            {table.status === 'occupied' && table.orderStatusName ? (
                              <span
                                className="floor-activity-order-status-badge"
                                style={{
                                  background: table.orderStatusColor ? tint(table.orderStatusColor, 13) : 'var(--surface)',
                                  color: table.orderStatusColor || 'var(--text-muted)',
                                  border: `1px solid ${table.orderStatusColor ? tint(table.orderStatusColor, 26) : 'var(--border)'}`,
                                }}
                              >
                                {table.orderStatusName}
                              </span>
                            ) : (
                              <span className="floor-activity-order-status-badge" style={{ visibility: 'hidden' }}>
                                Placeholder
                              </span>
                            )}
                          </div>

                          {/* Table number — focal point, POS-style */}
                          <div
                            className="table-card-number-badge"
                            style={{
                              background: table.status === 'occupied' ? 'rgba(255,255,255,0.72)' : tint(cfg.color, 15),
                              border: table.status === 'occupied' ? `2px solid ${tint(cfg.color, 40)}` : `2px solid ${tint(cfg.color, 28)}`,
                              boxShadow: table.status === 'occupied' ? `0 0 0 1px ${tint(cfg.color, 22)} inset` : undefined,
                            }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: 700, color: cfg.color, opacity: 0.65, letterSpacing: 1.5, textTransform: 'uppercase', lineHeight: 1 }}>
                              {t('staff.floor_activity.table_label')}
                            </Text>
                            <Text style={{ fontSize: isMobile ? 26 : 30, fontWeight: 900, color: cfg.color, lineHeight: 1.05 }}>
                              {table.name}
                            </Text>
                          </div>

                          {/* Capacity — clearly labeled */}
                          <div className="table-card-capacity-row">
                            <UserOutlined style={{ fontSize: 12, color: 'var(--text-muted)' }} />
                            <Text style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                              {table.capacity} {t('staff.floor_activity.seats_label')}
                            </Text>
                          </div>

                          {/* Status tag */}
                          <Tag
                            style={{
                              borderRadius: 20,
                              fontSize: 11,
                              padding: '2px 10px',
                              border: 'none',
                              background: tint(cfg.color, 20),
                              color: cfg.color,
                              marginTop: 4,
                              fontWeight: 700,
                            }}
                          >
                            {cfg.icon} {t(cfg.label)}
                          </Tag>

                          {/* Time/detail row — always reserve space for consistent card height */}
                          <div className="floor-activity-table-detail floor-activity-table-detail--fixed">
                            {table.reservationCode ? (
                              <div className="floor-activity-detail-row">
                                <CalendarOutlined style={{ fontSize: 10, color: '#1890ff' }} />
                                <Text style={{ fontSize: 11, color: '#1890ff', marginRight: 4 }}>
                                  {new Date(table.reservationTime!).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <Text style={{ fontSize: 11, color: '#1890ff', fontWeight: 600 }}>
                                  #{table.reservationCode}
                                </Text>
                              </div>
                            ) : table.status === 'occupied' && table.startAt ? (
                              <div className="floor-activity-detail-row">
                                <ClockCircleOutlined style={{ fontSize: 10, color: 'var(--text-muted)' }} />
                                <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  {new Date(table.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                              </div>
                            ) : table.status !== 'occupied' && table.reservationTime ? (
                              <div className="floor-activity-detail-row">
                                <CalendarOutlined style={{ fontSize: 10, color: '#1890ff' }} />
                                <Text style={{ fontSize: 11, color: '#1890ff' }}>
                                  {new Date(table.reservationTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
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
          ))
          : (
            <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-muted)' }}>
              <TableOutlined style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                {isSessionFiltered
                  ? t('staff.floor_activity.no_session_tables', { defaultValue: 'Không có bàn nào được đặt trong phiên này.' })
                  : t('staff.floor_activity.no_tables')}
              </div>
              {isSessionFiltered && (
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  {t('staff.floor_activity.session_filter_desc', {
                    defaultValue: 'Bạn có thể đổi phiên để xem các bàn khác.'
                  })}
                </div>
              )}
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
        styles={{
          body: { padding: 0 },
          mask: { backdropFilter: 'blur(2px)' },
        }}
      >
        {selectedTable && (() => {
          const cfg = statusConfig[selectedTable.status];
          const hasReservation = !!(selectedTable.reservationCode || selectedTable.reservationContactName || selectedTable.reservationTime);
          const hasOrder = !!(selectedTable.orderId && (selectedTable.orderStatusName || (selectedTable.orderItemCount ?? 0) > 0 || (selectedTable.orderTotal ?? 0) > 0));

          return (
            <div className="table-modal-root">
              {/* Hero Banner */}
              <div className="table-modal-hero" style={{ background: `linear-gradient(135deg, ${tint(cfg.color, 22)} 0%, ${tint(cfg.color, 8)} 100%)`, borderBottom: `1px solid ${tint(cfg.color, 25)}` }}>
                <div className="table-modal-hero-icon" style={{ background: tint(cfg.color, 18), border: `2px solid ${tint(cfg.color, 35)}` }}>
                  <TableOutlined style={{ fontSize: 32, color: cfg.color }} />
                </div>
                <div className="table-modal-hero-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Title level={4} style={{ margin: 0, color: 'var(--text)' }}>{selectedTable.name}</Title>
                    <Tag
                      style={{
                        borderRadius: 20,
                        padding: '3px 12px',
                        border: 'none',
                        background: `${cfg.color}20`,
                        color: cfg.color,
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {cfg.icon} {t(cfg.label)}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      <UserOutlined style={{ marginRight: 5 }} />{selectedTable.capacity} {t('staff.floor_activity.modal.seats')}
                    </Text>
                    {selectedTable.floorName && (
                      <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        <TableOutlined style={{ marginRight: 5 }} />{selectedTable.floorName}
                      </Text>
                    )}
                    {selectedTable.status === 'occupied' && (
                      <Text style={{ fontSize: 13, color: cfg.color, fontWeight: 600 }}>
                        {selectedTable.reservationCode ? (
                           <>
                             <CalendarOutlined style={{ marginRight: 5 }} />
                             {new Date(selectedTable.reservationTime!).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                             <span style={{ marginLeft: 8 }}>#{selectedTable.reservationCode}</span>
                           </>
                        ) : selectedTable.startAt ? (
                           <>
                             <ClockCircleOutlined style={{ marginRight: 5 }} />
                             {new Date(selectedTable.startAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                           </>
                        ) : null}
                      </Text>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="table-modal-body">

                {/* Reservation Section */}
                {hasReservation && (
                  <div className="table-modal-section">
                    <div className="table-modal-section-header">
                      <div className="table-modal-section-icon" style={{ background: 'rgba(24,144,255,0.12)', color: '#1890ff' }}>
                        <CalendarOutlined />
                      </div>
                      <Text strong style={{ fontSize: 14, color: 'var(--text)' }}>Reservation</Text>
                      {selectedTable.reservationCode && (
                        <span className="table-modal-code-badge">#{selectedTable.reservationCode}</span>
                      )}
                      {selectedTable.reservationStatusName && (
                        <Tag style={{ marginLeft: 'auto', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                          {selectedTable.reservationStatusName}
                        </Tag>
                      )}
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

                    {/* Check-in action */}
                    {selectedTable.reservationCode && selectedTable.status === 'available' && (
                      <Button
                        type="primary"
                        icon={<LoginOutlined />}
                        loading={isCheckingIn}
                        onClick={() => handleCheckIn(selectedTable.reservationCode!)}
                        block
                        size="large"
                        style={{
                          marginTop: 12,
                          borderRadius: 12,
                          height: 44,
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {t('staff.floor_activity.modal.checkin_btn')}
                      </Button>
                    )}
                  </div>
                )}

                {/* Order Section */}
                {hasOrder && (
                  <>
                    {hasReservation && <Divider style={{ margin: '0 0 16px' }} />}
                    <div className="table-modal-section">
                      <div className="table-modal-section-header">
                        <div className="table-modal-section-icon" style={{ background: 'rgba(255,56,11,0.1)', color: 'var(--primary)' }}>
                          <ShoppingCartOutlined />
                        </div>
                        <Text strong style={{ fontSize: 14, color: 'var(--text)' }}>Order</Text>
                        {selectedTable.orderReference && (
                          <span className="table-modal-code-badge" style={{ background: 'rgba(255,56,11,0.1)', color: 'var(--primary)', border: '1px solid rgba(255,56,11,0.2)' }}>
                            #{selectedTable.orderReference}
                          </span>
                        )}
                        {selectedTable.orderStatusName && (
                          <Tag
                            style={{
                              marginLeft: 'auto',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 600,
                              background: selectedTable.orderStatusColor ? `${selectedTable.orderStatusColor}20` : undefined,
                              color: selectedTable.orderStatusColor || undefined,
                              border: selectedTable.orderStatusColor ? `1px solid ${selectedTable.orderStatusColor}40` : undefined,
                            }}
                          >
                            {selectedTable.orderStatusName}
                          </Tag>
                        )}
                      </div>

                      <div className="table-modal-info-grid">
                        {selectedTable.customerName && (
                          <div className="table-modal-info-row">
                            <span className="table-modal-info-label"><UserOutlined /> {t('staff.floor_activity.modal.customer')}</span>
                            <span className="table-modal-info-value">{selectedTable.customerName}</span>
                          </div>
                        )}
                        {(selectedTable.orderItemCount ?? 0) > 0 && (
                          <div className="table-modal-info-row">
                            <span className="table-modal-info-label"><ShoppingCartOutlined /> {t('staff.floor_activity.items')}</span>
                            <span className="table-modal-info-value">{selectedTable.orderItemCount} {t('staff.floor_activity.items')}</span>
                          </div>
                        )}
                        {(selectedTable.orderTotal ?? 0) > 0 && (
                          <div className="table-modal-info-row">
                            <span className="table-modal-info-label"><DollarOutlined /> {t('staff.floor_activity.modal.total')}</span>
                            <span className="table-modal-info-value" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>{selectedTable.orderTotal!.toLocaleString('vi-VN')}d</span>
                          </div>
                        )}
                        {!hasReservation && selectedTable.startAt && (
                          <div className="table-modal-info-row">
                            <span className="table-modal-info-label"><ClockCircleOutlined /> {t('staff.floor_activity.modal.start_time')}</span>
                            <span className="table-modal-info-value">{new Date(selectedTable.startAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                          </div>
                        )}
                        {selectedTable.paymentStatusName && (
                          <div className="table-modal-info-row">
                            <span className="table-modal-info-label"><DollarOutlined /> {t('staff.floor_activity.modal.payment')}</span>
                            <span className="table-modal-info-value">{selectedTable.paymentStatusName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Empty state — no reservation, no order */}
                {!hasReservation && !hasOrder && (
                  <div style={{ textAlign: 'center', padding: '24px 0 8px', color: 'var(--text-muted)' }}>
                    {selectedTable.status === 'occupied' ? (
                      <>
                        <UserOutlined style={{ fontSize: 32, color: cfg.color, marginBottom: 8, display: 'block' }} />
                        <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t(cfg.label)}</Text>
                      </>
                    ) : (
                      <>
                        <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8, display: 'block' }} />
                        <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('staff.floor_activity.status.available')}</Text>
                      </>
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
