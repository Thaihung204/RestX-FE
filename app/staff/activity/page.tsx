'use client';

import orderSignalRService from '@/lib/services/orderSignalRService';
import reservationService from '@/lib/services/reservationService';
import {
  floorService,
  FloorSummary,
  tableService,
  TableSessionInfo,
  TableSessionReservationInfo,
} from '@/lib/services/tableService';
import { useTenant } from '@/lib/contexts/TenantContext';
import {
  LinkOutlined,
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
import { App, Button, Card, Col, DatePicker, Input, Modal, Row, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PluginRegistry, TimepickerUI } from 'timepicker-ui';
import { WheelPlugin } from 'timepicker-ui/plugins/wheel';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../../theme/AntdProvider';

const { Title, Text } = Typography;

type TableStatus = 'available' | 'occupied';

const DEFAULT_SESSION_BUFFER_MINUTES = 120;
const TIME_FILTER_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function resolveSessionBufferMinutes(tenant: unknown): number {
  const tenantRecord = tenant as Record<string, unknown> | null;
  if (!tenantRecord) return DEFAULT_SESSION_BUFFER_MINUTES;

  const configuration = tenantRecord.configuration as Record<string, unknown> | undefined;
  const directConfig = parsePositiveInteger(
    configuration?.sessionBufferMinutes ?? configuration?.SessionBufferMinutes,
  );
  if (directConfig) return directConfig;

  const settingsRaw = tenantRecord.tenantSettings;
  const settings = Array.isArray(settingsRaw) ? settingsRaw : [];

  for (const entryRaw of settings) {
    const entry = entryRaw as Record<string, unknown> | null;
    if (!entry) continue;

    const rawKey = String(entry.key ?? entry.Key ?? '').trim().toLowerCase();
    if (!rawKey) continue;

    const compactKey = rawKey.replace(/[^a-z0-9]/g, '');
    const isSessionBufferKey =
      compactKey === 'sessionbufferminutes' ||
      compactKey === 'reservationbufferminutes' ||
      compactKey === 'reservationsessionbufferminutes';

    if (!isSessionBufferKey) continue;

    const resolvedValue = parsePositiveInteger(entry.value ?? entry.Value);
    if (resolvedValue) {
      return resolvedValue;
    }
  }

  return DEFAULT_SESSION_BUFFER_MINUTES;
}

function isPastReservationWithinLateWindow(
  reservationDate: Date,
  filterDateTime: Date,
  lateWindowMinutes: number,
): boolean {
  const minutesAfterReservation = (filterDateTime.getTime() - reservationDate.getTime()) / (60 * 1000);
  return minutesAfterReservation >= 0 && minutesAfterReservation <= lateWindowMinutes;
}

function toYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toHm(date: Date): string {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

function normalizeFilterTime(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(TIME_FILTER_PATTERN);
  if (!match) return null;

  return `${Number(match[1]).toString().padStart(2, '0')}:${match[2]}`;
}

function ensureWheelPluginRegistered(): void {
  if (!PluginRegistry.has('wheel')) {
    PluginRegistry.register(WheelPlugin);
  }
}

function normalizePickerTime(hourValue?: string, minuteValue?: string, periodValue?: string): string | null {
  const parsedHour = Number.parseInt(hourValue ?? '', 10);
  const parsedMinute = Number.parseInt(minuteValue ?? '', 10);

  if (
    Number.isNaN(parsedHour) ||
    Number.isNaN(parsedMinute) ||
    parsedHour < 0 ||
    parsedMinute < 0 ||
    parsedMinute > 59
  ) {
    return null;
  }

  let hour = parsedHour;
  const period = (periodValue || '').trim().toLowerCase();
  if (period === 'am' || period === 'pm') {
    const normalized12Hour = ((hour % 12) + 12) % 12;
    hour = period === 'pm' ? normalized12Hour + 12 : normalized12Hour;
  }

  if (hour > 23) return null;

  return `${hour.toString().padStart(2, '0')}:${parsedMinute.toString().padStart(2, '0')}`;
}

function parseFilterDateTime(dateValue: string, timeValue: string): Date | null {
  if (!dateValue) return null;
  const timePart = timeValue || '00:00';
  const parsed = new Date(`${dateValue}T${timePart}:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function toLocalDateTimeParam(date: Date): string {
  return `${toYmd(date)}T${toHm(date)}:00`;
}

function pickReservationForSlot(
  reservations: TableSessionReservationInfo[],
  filterDateTime: Date,
  lateWindowMinutes: number,
): TableSessionReservationInfo | undefined {
  if (!reservations.length) return undefined;

  const sorted = reservations
    .map((reservation) => ({
      reservation,
      date: new Date(reservation.reservationDateTime ?? ''),
    }))
    .filter((item) => !Number.isNaN(item.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (!sorted.length) return undefined;

  const targetTime = filterDateTime.getTime();
  const upcoming = sorted.find((item) => item.date.getTime() >= targetTime);
  if (upcoming) return upcoming.reservation;

  const pastCandidates = sorted.filter((item) => item.date.getTime() <= targetTime);
  const latestPast = pastCandidates[pastCandidates.length - 1];
  if (!latestPast) return undefined;

  if (isPastReservationWithinLateWindow(latestPast.date, filterDateTime, lateWindowMinutes)) {
    return latestPast.reservation;
  }

  return undefined;
}

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
  reservationStatusCode?: string;
  reservationCheckedInAt?: string | null;
  sessionId?: string;
  sessionStartedAt?: string;
  sessionEndedAt?: string | null;
  sessionIsActive?: boolean;
  positionX?: number;
  positionY?: number;
}

function isTablePendingCheckInForMerge(table: TableActivityData): boolean {
  const statusCode = (table.reservationStatusCode || '').toUpperCase();
  const isPendingReservation = statusCode === 'PENDING' || statusCode === 'CONFIRMED';
  const hasReservation = Boolean(table.reservationCode || table.reservationId);
  const hasActiveServiceSession = Boolean(table.sessionIsActive || table.orderId);

  return isPendingReservation && hasReservation && !hasActiveServiceSession;
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

export function TablesPageContent({ showAllActivities = false }: { showAllActivities?: boolean }) {
  const { t } = useTranslation();
  const { mode } = useThemeMode();
  const { tenant } = useTenant();
  const { message: messageApi } = App.useApp();

  const [tables, setTables] = useState<TableActivityData[]>([]);
  const [floors, setFloors] = useState<FloorSummary[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [reservationFilterDate, setReservationFilterDate] = useState(() =>
    toYmd(new Date()),
  );
  const [reservationFilterTime, setReservationFilterTime] = useState(() =>
    toHm(new Date()),
  );
  const [reservationKeyword, setReservationKeyword] = useState('');
  const [selectedTable, setSelectedTable] = useState<TableActivityData | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [manualMergeGroupsByTable, setManualMergeGroupsByTable] = useState<Record<string, string[]>>({});
  const inFlightRef = useRef(false);
  const timeInputRef = useRef<HTMLInputElement | null>(null);
  const timePickerRef = useRef<TimepickerUI | null>(null);

  const selectedFilterDateTime = useMemo(
    () => parseFilterDateTime(reservationFilterDate, reservationFilterTime),
    [reservationFilterDate, reservationFilterTime],
  );

  const sessionBufferMinutes = useMemo(
    () => resolveSessionBufferMinutes(tenant),
    [tenant],
  );

  useEffect(() => {
    const input = timeInputRef.current;

    if (timePickerRef.current) {
      timePickerRef.current.destroy({ keepInputValue: true });
      timePickerRef.current = null;
    }

    if (!input) return;

    ensureWheelPluginRegistered();

    const picker = new TimepickerUI(input, {
      clock: {
        type: '24h',
        incrementMinutes: 1,
        incrementHours: 1,
      },
      ui: {
        theme: 'basic',
        mode: 'compact-wheel',
        animation: false,
        backdrop: false,
        editable: false,
      },
      wheel: {
        placement: 'auto',
        commitOnScroll: false,
        hideDisabled: false,
      },
      labels: {
        ok: t('common.actions.confirm', { defaultValue: 'Xác nhận' }),
        cancel: t('common.actions.cancel', { defaultValue: 'Cancel' }),
        time: t('staff.floor_activity.time_filter_label', { defaultValue: 'Giờ' }),
      },
      callbacks: {
        onConfirm: ({ hour, minutes, type }) => {
          const normalized = normalizePickerTime(hour, minutes, type);
          if (!normalized) return;

          setReservationFilterTime((prev) => (prev === normalized ? prev : normalized));
        },
      },
    });

    picker.create();

    const normalizedCurrentTime = normalizeFilterTime(reservationFilterTime) || toHm(new Date());
    picker.setValue(normalizedCurrentTime, true);

    timePickerRef.current = picker;

    return () => {
      if (timePickerRef.current) {
        timePickerRef.current.destroy({ keepInputValue: true });
        timePickerRef.current = null;
      }
    };
  }, [t]);

  useEffect(() => {
    if (!timePickerRef.current) return;

    const normalized = normalizeFilterTime(reservationFilterTime);
    if (!normalized) return;

    timePickerRef.current.setValue(normalized, true);
  }, [reservationFilterTime]);

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

      const filterDateTime = selectedFilterDateTime ?? new Date();
      const filterAtParam = toLocalDateTimeParam(filterDateTime);

      const [tableData, floorData, sessionData] = await Promise.all([
        safe(tableService.getAllTables(), [], 'Tables'),
        safe(floorService.getAllFloors(), [], 'Floors'),
        safe(tableService.getTableSessions(filterAtParam), [], 'Sessions'),
      ]);

      setFloors(floorData);

      const sessionMap = new Map<string, TableSessionInfo>();
      for (const session of sessionData) {
        if (session.isActive) sessionMap.set(session.tableId, session);
      }

      const reservationsByTable = new Map<string, TableSessionReservationInfo[]>();

      for (const session of sessionData) {
        const reservation = session.reservation;
        if (!reservation) continue;

        const code = reservation.status?.code?.toUpperCase();
        if (['CANCELLED', 'NO_SHOW', 'NOSHOW', 'COMPLETED', 'CHECKED_IN'].includes(code || '')) {
          continue;
        }

        const list = reservationsByTable.get(session.tableId) || [];
        list.push(reservation);
        reservationsByTable.set(session.tableId, list);
      }

      const reservationMap = new Map<string, TableSessionReservationInfo>();
      for (const [tableId, reservations] of reservationsByTable) {
        const pickedReservation = pickReservationForSlot(
          reservations,
          filterDateTime,
          sessionBufferMinutes,
        );
        if (pickedReservation) reservationMap.set(tableId, pickedReservation);
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
          reservationContactName: reservation?.contact?.name,
          reservationContactPhone: reservation?.contact?.phone,
          reservationStatusName: reservation?.status?.name,
          reservationStatusCode: reservation?.status?.code,
          reservationCheckedInAt: (reservation as any)?.checkedInAt,
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
  }, [selectedFilterDateTime, sessionBufferMinutes]);

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
      orderSignalRService.invoke('LeaveTenantGroup', tenantId).catch(() => { });
    };
  }, [tenant?.id, fetchData]);

  const handleCheckIn = async (table: TableActivityData) => {
    if (!table.reservationCode) return;

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

  const handleMergeExecution = async () => {
    if (selectedTableIds.length < 2) return;
    const requestedTableIds = [...selectedTableIds];

    const hasSelectedTablesAlreadyInSameOrder =
      selectedTablesForMerge.length >= 2 &&
      selectedTablesForMerge.every((table) => !!table.orderId) &&
      selectedOrderIdsForMerge.size === 1;

    if (hasSelectedTablesAlreadyInSameOrder) {
      messageApi.warning(
        t('staff.floor_activity.merge.already_merged', {
          defaultValue: 'Các bàn đã thuộc cùng một đơn, không cần gộp lại.',
        }),
      );
      return;
    }

    const hasPendingCheckInReservationTable = selectedTablesForMerge.some((table) =>
      isTablePendingCheckInForMerge(table),
    );

    if (hasPendingCheckInReservationTable) {
      messageApi.warning(
        t('staff.floor_activity.merge.reservation_pending_checkin', {
          defaultValue: 'Không thể gộp bàn đã đặt nhưng chưa check-in.',
        }),
      );
      return;
    }

    const hasAtLeastOneActiveOrder = selectedTablesForMerge.some((table) => Boolean(table.orderId));
    if (!hasAtLeastOneActiveOrder) {
      messageApi.warning(
        t('staff.floor_activity.merge.no_order_selected', {
          defaultValue: 'Cần chọn ít nhất 1 bàn đang có order để gộp.',
        }),
      );
      return;
    }

    setIsMerging(true);
    try {
      const response = await tableService.mergeTables({
        tableIds: requestedTableIds,
      });

      if (response.requiresManualResolution) {
        messageApi.warning(t('staff.floor_activity.merge.manual_required', { defaultValue: 'Cần xử lý thủ công do có nhiều đơn hàng.' }));
        await fetchData();
        return;
      } else {
        messageApi.success(t('staff.floor_activity.merge.success', { defaultValue: 'Gộp bàn thành công!' }));
      }

      if (!response.orderId) {
        const mergedIdsFromResponse = (response.sessions ?? [])
          .map((session) => session.tableId)
          .filter((tableId): tableId is string => Boolean(tableId));

        const normalizedMergedIds = Array.from(
          new Set(mergedIdsFromResponse.length >= 2 ? mergedIdsFromResponse : requestedTableIds),
        ).sort((a, b) => a.localeCompare(b));

        if (normalizedMergedIds.length >= 2) {
          setManualMergeGroupsByTable((prev) => {
            const next = { ...prev };
            for (const tableId of normalizedMergedIds) {
              next[tableId] = normalizedMergedIds;
            }
            return next;
          });
        }
      }

      setIsMergeMode(false);
      setSelectedTableIds([]);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      messageApi.error(msg || t('staff.floor_activity.merge.error', { defaultValue: 'Gộp bàn thất bại' }));
    } finally {
      setIsMerging(false);
    }
  };

  const toggleTableSelection = (tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId],
    );
  };

  const getLocalizedFloorName = useCallback((floorName?: string) => {
    if (!floorName) return '';

    const normalizedFloorName = floorName.trim();
    const match = normalizedFloorName.match(/^(?:t[aầ]ng|floor)\s+(.+)$/i);
    if (!match) return normalizedFloorName;

    return t('staff.floor_activity.floor_name', { name: match[1] });
  }, [t]);

  const reservationKeywordNormalized = reservationKeyword.trim().toLowerCase();
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (!reservationKeywordNormalized) return true;
      return [t.reservationCode, t.reservationContactName, t.reservationContactPhone, t.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(reservationKeywordNormalized));
    });
  }, [reservationKeywordNormalized, tables]);

  const tableById = useMemo(() => {
    const map = new Map<string, TableActivityData>();
    for (const table of tables) {
      map.set(table.id, table);
    }
    return map;
  }, [tables]);

  useEffect(() => {
    const existingTableIds = new Set(tables.map((table) => table.id));

    setManualMergeGroupsByTable((prev) => {
      let changed = false;
      const next: Record<string, string[]> = {};

      for (const [tableId, groupIds] of Object.entries(prev)) {
        if (!existingTableIds.has(tableId)) {
          changed = true;
          continue;
        }

        const filteredGroupIds = Array.from(
          new Set(groupIds.filter((groupId) => existingTableIds.has(groupId))),
        ).sort((a, b) => a.localeCompare(b));

        if (filteredGroupIds.length < 2) {
          changed = true;
          continue;
        }

        if (groupIds.length !== filteredGroupIds.length || groupIds.some((id, idx) => id !== filteredGroupIds[idx])) {
          changed = true;
        }

        next[tableId] = filteredGroupIds;
      }

      return changed ? next : prev;
    });
  }, [tables]);

  const selectedTablesForMerge = useMemo(
    () =>
      selectedTableIds
        .map((tableId) => tableById.get(tableId))
        .filter((table): table is TableActivityData => Boolean(table)),
    [selectedTableIds, tableById],
  );

  const selectedOrderIdsForMerge = useMemo(
    () =>
      new Set(
        selectedTablesForMerge
          .map((table) => table.orderId)
          .filter((orderId): orderId is string => Boolean(orderId)),
      ),
    [selectedTablesForMerge],
  );

  const selectedHasActiveOrderForMerge = useMemo(
    () => selectedTablesForMerge.some((table) => Boolean(table.orderId)),
    [selectedTablesForMerge],
  );

  const orderTableIdsMap = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const table of tables) {
      if (!table.orderId) continue;
      const current = map.get(table.orderId) || [];
      current.push(table.id);
      map.set(table.orderId, current);
    }

    for (const [orderId, ids] of map.entries()) {
      const sortedIds = [...ids].sort((a, b) => a.localeCompare(b));
      map.set(orderId, sortedIds);
    }

    return map;
  }, [tables]);

  const getMergedTableIds = useCallback((table: TableActivityData) => {
    const orderMergedIds = table.orderId ? (orderTableIdsMap.get(table.orderId) || []) : [];
    const manualMergedIds = manualMergeGroupsByTable[table.id] || [];

    return Array.from(new Set([...orderMergedIds, ...manualMergedIds])).sort((a, b) => {
      const nameA = tableById.get(a)?.name || a;
      const nameB = tableById.get(b)?.name || b;
      return nameA.localeCompare(nameB, undefined, { numeric: true });
    });
  }, [manualMergeGroupsByTable, orderTableIdsMap, tableById]);

  const getMergedTableNames = useCallback((table: TableActivityData) => {
    return getMergedTableIds(table)
      .map((tableId) => tableById.get(tableId)?.name)
      .filter((name): name is string => Boolean(name));
  }, [getMergedTableIds, tableById]);

  const selectedKnownMergedTableIds = useMemo(() => {
    const set = new Set<string>();

    for (const selectedTable of selectedTablesForMerge) {
      const mergedIds = getMergedTableIds(selectedTable);
      if (mergedIds.length > 1) {
        for (const tableId of mergedIds) {
          set.add(tableId);
        }
      }
    }

    return set;
  }, [getMergedTableIds, selectedTablesForMerge]);

  const getMergeLockReason = (
    table: TableActivityData,
  ): 'same-order' | 'same-group' | 'reservation-pending-checkin' | 'requires-order-anchor' | null => {
    if (!isMergeMode) return null;
    if (selectedTableIds.includes(table.id)) return null;

    // Start merge from a table that already has an active order.
    if (!selectedHasActiveOrderForMerge && !table.orderId) {
      return 'requires-order-anchor';
    }

    if (isTablePendingCheckInForMerge(table)) {
      return 'reservation-pending-checkin';
    }

    if (table.orderId && selectedOrderIdsForMerge.has(table.orderId)) {
      return 'same-order';
    }

    if (selectedKnownMergedTableIds.has(table.id)) {
      return 'same-group';
    }

    return null;
  };

  const isTableLockedForMerge = (table: TableActivityData) => {
    return getMergeLockReason(table) !== null;
  };

  const handleMergeSelection = (table: TableActivityData) => {
    const lockReason = getMergeLockReason(table);

    if (lockReason) {
      const warningMessage =
        lockReason === 'same-order'
          ? t('staff.floor_activity.merge.same_order_selected', {
            defaultValue: 'Bàn này đã thuộc cùng đơn với bàn đã chọn. Vui lòng chọn bàn khác.',
          })
          : lockReason === 'same-group'
            ? t('staff.floor_activity.merge.same_group_selected', {
              defaultValue: 'Bàn này đã nằm trong cùng nhóm gộp với bàn đã chọn.',
            })
            : lockReason === 'requires-order-anchor'
              ? t('staff.floor_activity.merge.no_order_selected', {
                defaultValue: 'Cần chọn ít nhất 1 bàn đang có order để gộp.',
              })
              : t('staff.floor_activity.merge.reservation_pending_checkin', {
                defaultValue: 'Không thể gộp bàn đã đặt nhưng chưa check-in.',
              });

      messageApi.warning(
        warningMessage,
      );
      return;
    }

    toggleTableSelection(table.id);
  };

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
        ...floors.map((floor) => ({
          label: getLocalizedFloorName(floor.name),
          id: floor.id,
          tables: byFloor.get(floor.id) || [],
        })),
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
  }, [filteredTables, floors, getLocalizedFloorName, showAllActivities, t]);

  const hasResults = tableGroups.length > 0;

  return (
    <div className="floor-activity-root">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="floor-activity-header" style={{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 20, alignItems: isMobile ? 'stretch' : 'center' }}>
        <div className="floor-activity-header-left">
          <div className="floor-activity-title-row">
            <span className="floor-activity-live-dot" />
            <Title level={isMobile ? 5 : 4} style={{ margin: 0, color: 'var(--text)' }}>
              {t('staff.menu.activity', {
                defaultValue: t('staff.floor_activity.title', {
                  defaultValue: t('dashboard.staff.menu.tables', { defaultValue: 'Tables' }),
                }),
              })}
            </Title>
          </div>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {t('staff.floor_activity.last_updated')}: {lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
        </div>

        <div className="floor-activity-header-right">
          <div className="floor-activity-toolbar">
            <div className="floor-activity-filter-group floor-activity-filter-group--date">
              <Text className="floor-activity-filter-label">
                {t('staff.floor_activity.date_filter_label', { defaultValue: 'Ngày' })}
              </Text>
              <DatePicker
                className="floor-activity-filter-input floor-activity-filter-input--date-picker"
                classNames={{ popup: { root: 'floor-activity-date-popup' } }}
                getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                placement="bottomLeft"
                value={reservationFilterDate ? dayjs(reservationFilterDate, 'YYYY-MM-DD') : null}
                format="DD/MM/YYYY"
                allowClear={false}
                inputReadOnly
                suffixIcon={<span className="material-symbols-outlined text-[var(--text-muted)]">calendar_month</span>}
                onChange={(value) => {
                  if (!value) return;
                  setReservationFilterDate(value.format('YYYY-MM-DD'));
                }}
              />
            </div>

            <div className="floor-activity-filter-group floor-activity-filter-group--time">
              <Text className="floor-activity-filter-label">
                {t('staff.floor_activity.time_filter_label', { defaultValue: 'Giờ' })}
              </Text>
              <input
                ref={timeInputRef}
                type="text"
                className="floor-activity-filter-input floor-activity-filter-input--time-picker"
                value={normalizeFilterTime(reservationFilterTime) || ''}
                readOnly
                inputMode="numeric"
                autoComplete="off"
                aria-label={t('staff.floor_activity.time_filter_label', { defaultValue: 'Giờ' })}
                onClick={() => timePickerRef.current?.open()}
                onFocus={() => timePickerRef.current?.open()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    timePickerRef.current?.open();
                  }
                }}
              />
            </div>

            <Input
              className="floor-activity-filter-input floor-activity-filter-input--search"
              allowClear
              value={reservationKeyword}
              onChange={(e) => setReservationKeyword(e.target.value)}
            />

            <div className="floor-activity-action-row">
              <Button
                className="floor-activity-action-btn"
                icon={<TableOutlined />}
                onClick={() => {
                  const nextMode = !isMergeMode;
                  setIsMergeMode(nextMode);
                  setSelectedTableIds([]);

                  if (nextMode && !tables.some((table) => Boolean(table.orderId))) {
                    messageApi.info(
                      t('staff.floor_activity.merge.no_order_selected', {
                        defaultValue: 'Cần chọn ít nhất 1 bàn đang có order để gộp.',
                      }),
                    );
                  }
                }}
                type={isMergeMode ? 'primary' : 'default'}
                danger={isMergeMode}
              >
                {isMergeMode ? t('common.cancel') : t('staff.floor_activity.merge_mode')}
              </Button>

              {isMergeMode && selectedTableIds.length >= 2 && (
                <Button
                  className="floor-activity-action-btn floor-activity-action-btn--confirm"
                  type="primary"
                  loading={isMerging}
                  onClick={handleMergeExecution}
                >
                  {t('staff.floor_activity.execute_merge', { count: selectedTableIds.length })}
                </Button>
              )}
            </div>
          </div>
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
                  const hasBookedGuests = typeof table.reservationGuests === 'number' && table.reservationGuests > 0;
                  const cardPeopleCount = hasBookedGuests ? table.reservationGuests : table.capacity;
                  const cardPeopleLabel = hasBookedGuests
                    ? t('staff.floor_activity.modal.guests')
                    : t('staff.floor_activity.seats_label');
                  const mergedTableNames = getMergedTableNames(table);
                  const mergedTableCount = mergedTableNames.length;
                  const isMergedGroup = mergedTableCount > 1;
                  const mergedGroupTablesLabel = mergedTableNames
                    .map((name) =>
                      t('staff.floor_activity.modal.table_name', {
                        name,
                        defaultValue: `Bàn ${name}`,
                      }),
                    )
                    .join(', ');
                  const isSelectedForMerge = isMergeMode && selectedTableIds.includes(table.id);
                  const isLockedForMerge = isMergeMode && isTableLockedForMerge(table);
                  return (
                    <Col xs={12} sm={8} md={6} lg={4} xl={4} key={table.id}>
                      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25, delay: Math.min(ti * 0.03, 0.3) }} whileHover={!isMobile ? { y: -4, transition: { duration: 0.18 } } : undefined} style={{ height: '100%' }}>
                        <div
                          className={`floor-activity-table-card ${isSelectedForMerge ? 'selected' : ''}`}
                          style={{
                            background: cfg.bg,
                            borderColor: isSelectedForMerge ? 'var(--primary)' : cfg.border,
                            borderWidth: isSelectedForMerge ? 3 : 1,
                            cursor: isLockedForMerge ? 'not-allowed' : 'pointer',
                            opacity: isLockedForMerge ? 0.62 : 1,
                            position: 'relative'
                          }}
                          onClick={() => isMergeMode ? handleMergeSelection(table) : setSelectedTable(table)}
                        >
                          {isMergeMode && (
                            <div style={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              backgroundColor: isSelectedForMerge
                                ? 'var(--primary)'
                                : isLockedForMerge
                                  ? 'rgba(217,217,217,0.65)'
                                  : 'rgba(255,255,255,0.8)',
                              border: `2px solid ${isLockedForMerge ? 'rgba(140,140,140,0.6)' : 'var(--primary)'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyItems: 'center',
                              zIndex: 10
                            }}>
                              {isSelectedForMerge && <CheckCircleOutlined style={{ color: 'white', fontSize: 12, margin: 'auto' }} />}
                            </div>
                          )}
                          <div className="floor-activity-table-top" style={{ justifyContent: 'flex-end' }}>
                            {isMergedGroup ? (
                              <span
                                className="floor-activity-merge-badge"
                                title={t('staff.floor_activity.merge.with_tables', {
                                  tables: mergedGroupTablesLabel,
                                  defaultValue: `Gộp với bàn: ${mergedGroupTablesLabel}`,
                                })}
                              >
                                <LinkOutlined style={{ fontSize: 10 }} />
                                {t('staff.floor_activity.merge.merged_tables_badge', {
                                  count: mergedTableCount,
                                  defaultValue: `Gộp ${mergedTableCount} bàn`,
                                })}
                              </span>
                            ) : (
                              <span className="floor-activity-order-status-badge" style={{ visibility: 'hidden' }}>Placeholder</span>
                            )}
                          </div>

                          <div className="table-card-number-badge" style={{ background: table.status === 'occupied' ? 'rgba(255,255,255,0.72)' : tint(cfg.color, 15), border: table.status === 'occupied' ? `2px solid ${tint(cfg.color, 40)}` : `2px solid ${tint(cfg.color, 28)}`, boxShadow: table.status === 'occupied' ? `0 0 0 1px ${tint(cfg.color, 22)} inset` : undefined }}>
                            <Text style={{ fontSize: 9, fontWeight: 700, color: cfg.color, opacity: 0.65, letterSpacing: 1.5, textTransform: 'uppercase', lineHeight: 1 }}>
                              {t('staff.floor_activity.table_label')}
                            </Text>
                            <Text style={{ fontSize: isMobile ? 26 : 30, fontWeight: 900, color: cfg.color, lineHeight: 1.05 }}>{table.name}</Text>
                          </div>

                          <div className="table-card-capacity-row">
                            <UserOutlined style={{ fontSize: 12, color: 'var(--text-muted)' }} />
                            <Text style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                              {cardPeopleCount} {cardPeopleLabel}
                            </Text>
                          </div>

                          <Tag style={{ borderRadius: 20, fontSize: 11, padding: '2px 10px', border: 'none', background: tint(cfg.color, 20), color: cfg.color, marginTop: 4, fontWeight: 700, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cfg.icon} {table.reservationContactName || table.customerName || t(cfg.label)}
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
          const canShowCheckInButton =
            !!selectedTable.reservationCode &&
            (selectedTable.reservationStatusCode || '').toUpperCase() === 'CONFIRMED' &&
            !selectedTable.reservationCheckedInAt &&
            !selectedTable.orderId;
          const hasNamedGuest = selectedTable.status === 'occupied' && !!(selectedTable.reservationContactName || selectedTable.customerName);
          const selectedMergedTableNames = getMergedTableNames(selectedTable);
          const selectedMergedTableCount = selectedMergedTableNames.length;
          const isSelectedTableMerged = selectedMergedTableCount > 1;
          const hasSessionFootprint = Boolean(selectedTable.sessionId || selectedTable.sessionStartedAt || selectedTable.sessionEndedAt);
          const isSessionActive = selectedTable.sessionIsActive === true;
          const isSessionEnded = Boolean(selectedTable.sessionEndedAt) || (selectedTable.sessionIsActive === false && hasSessionFootprint);

          return (
            <div className="table-modal-root">
              <div className="table-modal-hero" style={{ background: `linear-gradient(135deg, ${tint(cfg.color, 22)} 0%, ${tint(cfg.color, 8)} 100%)`, borderBottom: `1px solid ${tint(cfg.color, 25)}` }}>
                <div className="table-modal-hero-icon" style={{ background: tint(cfg.color, 18), border: `2px solid ${tint(cfg.color, 35)}` }}>
                  <TableOutlined style={{ fontSize: 32, color: cfg.color }} />
                </div>
                <div className="table-modal-hero-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Title level={4} style={{ margin: 0, color: 'var(--text)' }}>
                      {t('staff.floor_activity.modal.table_name', {
                        name: selectedTable.name,
                        defaultValue: `Bàn ${selectedTable.name}`,
                      })}
                    </Title>
                    {!hasNamedGuest && (
                      <Tag style={{ borderRadius: 20, padding: '3px 12px', border: 'none', background: `${cfg.color}20`, color: cfg.color, fontWeight: 700, fontSize: 12 }}>
                        {cfg.icon} {t(cfg.label)}
                      </Tag>
                    )}
                  </div>
                  {selectedTable.status === 'occupied' && (selectedTable.reservationContactName || selectedTable.customerName) && (
                    <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                      {selectedTable.reservationContactName || selectedTable.customerName}
                    </div>
                  )}
                  {isSelectedTableMerged && (
                    <span className="table-modal-merge-chip">
                      <LinkOutlined />
                      {t('staff.floor_activity.merge.merged_tables_badge', {
                        count: selectedMergedTableCount,
                        defaultValue: `Gộp ${selectedMergedTableCount} bàn`,
                      })}
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}><UserOutlined style={{ marginRight: 5 }} />{selectedTable.capacity} {t('staff.floor_activity.seats_label')}</Text>
                    {selectedTable.floorName && (
                      <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        <TableOutlined style={{ marginRight: 5 }} />
                        {getLocalizedFloorName(selectedTable.floorName)}
                      </Text>
                    )}
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
                    {isSessionActive ? (
                      <Tag style={{ marginLeft: 'auto', borderRadius: 12, fontSize: 11, fontWeight: 600, border: 'none' }} color="green">
                        {t('staff.floor_activity.status.active', { defaultValue: 'Đang hoạt động' })}
                      </Tag>
                    ) : isSessionEnded ? (
                      <Tag style={{ marginLeft: 'auto', borderRadius: 12, fontSize: 11, fontWeight: 600, border: 'none' }}>
                        {t('staff.floor_activity.status.inactive', { defaultValue: 'Đã kết thúc' })}
                      </Tag>
                    ) : (
                      <Tag style={{ marginLeft: 'auto', borderRadius: 12, fontSize: 11, fontWeight: 600, border: 'none' }} color="blue">
                        {t('staff.floor_activity.status.not_started', { defaultValue: 'Chưa bắt đầu' })}
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
                    {isSelectedTableMerged && (
                      <div className="table-modal-info-row">
                        <span className="table-modal-info-label">
                          <LinkOutlined /> {t('staff.floor_activity.modal.merge_group', { defaultValue: 'Nhóm gộp' })}
                        </span>
                        <span className="table-modal-info-value">
                          {selectedMergedTableNames
                            .map((name) =>
                              t('staff.floor_activity.modal.table_name', {
                                name,
                                defaultValue: `Bàn ${name}`,
                              }),
                            )
                            .join(', ')}
                        </span>
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


                </div>

                {hasReservation && (
                  <div className="table-modal-section">
                    <div className="table-modal-section-header">
                      <div className="table-modal-section-icon" style={{ background: 'rgba(24,144,255,0.12)', color: '#1890ff' }}>
                        <CalendarOutlined />
                      </div>
                      <Text strong style={{ fontSize: 14, color: 'var(--text)' }}>{t('staff.floor_activity.modal.reservation', { defaultValue: 'Đặt bàn' })}</Text>
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

                    {canShowCheckInButton && (
                      <Button
                        type="primary"
                        icon={<LoginOutlined />}
                        loading={isCheckingIn}
                        onClick={() => handleCheckIn(selectedTable)}
                        block
                        size="large"
                        style={{ marginTop: 12, borderRadius: 12, height: 44, fontWeight: 700, fontSize: 14 }}
                      >
                        {t('staff.floor_activity.modal.checkin_btn')}
                      </Button>
                    )}

                    {!canShowCheckInButton && selectedTable.reservationCheckedInAt && (
                      <div style={{ marginTop: 12, padding: '10px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: 12, border: '1px solid rgba(34,197,94,0.2)', textAlign: 'center', fontWeight: 'bold' }}>
                        {t("admin.reservations.checked_in", { defaultValue: "Đã check-in" })} lúc {new Date(selectedTable.reservationCheckedInAt).toLocaleTimeString('vi-VN')}
                      </div>
                    )}
                  </div>
                )}

                {hasOrder && (
                  <div className="table-modal-section">
                    <div className="table-modal-section-header">
                      <div className="table-modal-section-icon" style={{ background: 'rgba(255,56,11,0.1)', color: 'var(--primary)' }}>
                        <ShoppingCartOutlined />
                      </div>
                      <Text strong style={{ fontSize: 14, color: 'var(--text)' }}>{t('staff.floor_activity.modal.order', { defaultValue: 'Order' })}</Text>
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

export default function StaffActivityPage() {
  return <TablesPageContent />;
}
