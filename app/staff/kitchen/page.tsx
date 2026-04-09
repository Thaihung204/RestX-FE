"use client";

import { useTenant } from "@/lib/contexts/TenantContext";
import orderService, { OrderDetailListItemDto } from "@/lib/services/orderService";
import orderSignalRService from "@/lib/services/orderSignalRService";
import { ClockCircleOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { HubConnectionState } from "@microsoft/signalr";
import { App, Space, Spin, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

type KitchenItem = {
  key: string;
  id: string;
  orderId: string;
  tableName: string;
  dishName: string;
  quantity: number;
  note?: string;
  status?: string;
  createdDate?: string;
};

export default function StaffKitchenPage() {
  const { message } = App.useApp();
  const { t, i18n } = useTranslation();
  const { tenant } = useTenant();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageApiRef = useRef(message);

  useEffect(() => {
    messageApiRef.current = message;
  }, [message]);

  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";

  const formatTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatUpdatedAt = (timestamp?: number | null) => {
    if (!timestamp) return "--:--:--";
    return new Date(timestamp).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const statusTagStyle: CSSProperties = {
    margin: 0,
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 12,
    lineHeight: "20px",
    paddingInline: 10,
  };

  const getStatusTag = (status?: string) => {
    const normalized = (status || "").toLowerCase();

    if (normalized.includes("preparing")) {
      return (
        <Tag color="processing" style={statusTagStyle}>
          {t("staff.kitchen.status.preparing")}
        </Tag>
      );
    }
    if (normalized.includes("ready")) {
      return (
        <Tag color="success" style={statusTagStyle}>
          {t("staff.kitchen.status.ready")}
        </Tag>
      );
    }
    if (normalized.includes("served")) {
      return (
        <Tag color="blue" style={statusTagStyle}>
          {t("staff.kitchen.status.served")}
        </Tag>
      );
    }
    if (normalized.includes("cancel")) {
      return (
        <Tag color="error" style={statusTagStyle}>
          {t("staff.kitchen.status.cancelled")}
        </Tag>
      );
    }

    return <Tag style={statusTagStyle}>{status || "-"}</Tag>;
  };

  const mapOrderDetailsToKitchenItems = useCallback((details: OrderDetailListItemDto[], tableMap: Map<string, string>): KitchenItem[] => {
    return (details || []).map((detail, index) => ({
      key: detail.id || `${detail.orderId || "order"}-${detail.dishId || "dish"}-${index}`,
      id: detail.id || "",
      orderId: detail.orderId || "",
      tableName: (detail.orderId && tableMap.get(detail.orderId)) || "-",
      dishName: detail.dishName || detail.dishId || "",
      quantity: detail.quantity ?? 0,
      note: detail.note || undefined,
      status: detail.status || undefined,
      createdDate: detail.createdDate || undefined,
    }));
  }, []);

  const resolveOrderTableCodes = useCallback((order: { id?: string; tableId?: string; tableIds?: string[]; tableSessions?: Array<{ tableId?: string | null; tableCode?: string | null; table?: { code?: string | null } | null }> }) => {
    const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

    const sessionCodes = (order.tableSessions ?? [])
      .map((session) => session?.tableCode || session?.table?.code)
      .filter((code): code is string => !!code && code.trim().length > 0);

    if (sessionCodes.length > 0) {
      return Array.from(new Set(sessionCodes)).join(" - ");
    }

    const tableIdFromSession = (order.tableSessions ?? [])
      .map((session) => session?.tableId)
      .find((id): id is string => !!id && id !== EMPTY_GUID);
    const tableIdFromList = (order.tableIds ?? []).find((id): id is string => !!id && id !== EMPTY_GUID);
    const fallbackTableId =
      (order.tableId && order.tableId !== EMPTY_GUID ? order.tableId : undefined) ||
      tableIdFromSession ||
      tableIdFromList;

    return fallbackTableId ? fallbackTableId.slice(0, 6) : "-";
  }, []);

  const loadData = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [details, orders] = await Promise.all([orderService.getOrderDetailsList(), orderService.getAllOrders()]);

        const tableMap = new Map<string, string>();
        orders.forEach((order) => {
          if (order.id) {
            tableMap.set(order.id, resolveOrderTableCodes(order));
          }
        });

        const mapped = mapOrderDetailsToKitchenItems(details, tableMap).sort((a, b) => {
          if (!a.createdDate && !b.createdDate) return 0;
          if (!a.createdDate) return 1;
          if (!b.createdDate) return -1;
          return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
        });

        setItems(mapped);
        setUpdatedAt(Date.now());
      } catch (error) {
        console.error("Failed to load kitchen items:", error);
        messageApiRef.current.error(i18n.t("staff.kitchen.messages.load_error"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mapOrderDetailsToKitchenItems, resolveOrderTableCodes],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!tenant?.id) return;

    const tenantId = tenant.id;
    let isMounted = true;

    const events = ["orders.created", "orders.updated", "orders.deleted"];

    const handleOrderChanged = (payload: unknown) => {
      if (!isMounted) return;

      const payloadObj = payload as { tenantId?: string; order?: { tenantId?: string } };
      const changedTenantId = payloadObj?.tenantId || payloadObj?.order?.tenantId;
      if (changedTenantId && changedTenantId !== tenantId) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (!isMounted) return;
        loadData(true);
      }, 300);
    };

    const setupSignalR = async () => {
      try {
        await orderSignalRService.start();

        const conn = orderSignalRService.getConnection();
        if (conn.state === HubConnectionState.Connected) {
          await orderSignalRService.invoke("JoinTenantGroup", tenantId);
          events.forEach((event) => orderSignalRService.on(event, handleOrderChanged));
        }
      } catch (error) {
        console.error("SignalR: Setup kitchen failed", error);
      }
    };

    setupSignalR();

    return () => {
      isMounted = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      events.forEach((event) => orderSignalRService.off(event, handleOrderChanged));
      orderSignalRService.invoke("LeaveTenantGroup", tenantId).catch(() => {});
    };
  }, [tenant?.id, loadData]);

  const headerCellStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--text-muted)",
    letterSpacing: 0.2,
  };

  const columns: ColumnsType<KitchenItem> = useMemo(
    () => [
      {
        title: <span style={headerCellStyle}>{t("staff.kitchen.columns.table")}</span>,
        dataIndex: "tableName",
        key: "tableName",
        width: 130,
        render: (value: string) => (
          <Text style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{value || "-"}</Text>
        ),
      },
      {
        title: <span style={headerCellStyle}>{t("staff.kitchen.columns.dish_name")}</span>,
        key: "dish",
        dataIndex: "dishName",
        width: 260,
        render: (value: string) => (
          <Text style={{ color: "var(--primary)", fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
            {value || "-"}
          </Text>
        ),
      },
      {
        title: <span style={headerCellStyle}>{t("staff.kitchen.columns.note")}</span>,
        key: "note",
        dataIndex: "note",
        width: 240,
        render: (value?: string) =>
          value ? (
            <Tag
              style={{
                margin: 0,
                borderRadius: 999,
                paddingInline: 10,
                fontWeight: 600,
                fontSize: 12,
                lineHeight: "20px",
                borderColor: "#ffe58f",
                background: "#fffbe6",
                color: "#ad6800",
                maxWidth: "100%",
                whiteSpace: "normal",
              }}
            >
              {value}
            </Tag>
          ) : (
            <Text type="secondary" style={{ fontSize: 14 }}>
              -
            </Text>
          ),
      },
      {
        title: <span style={headerCellStyle}>{t("staff.kitchen.columns.quantity")}</span>,
        dataIndex: "quantity",
        key: "quantity",
        width: 120,
        align: "center",
        render: (value: number) => (
          <Tag
            color="blue"
            style={{
              margin: 0,
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 13,
              lineHeight: "20px",
              paddingInline: 10,
            }}
          >
            x{value}
          </Tag>
        ),
      },
      {
        title: <span style={headerCellStyle}>{t("staff.kitchen.columns.status")}</span>,
        dataIndex: "status",
        key: "status",
        width: 160,
        align: "center",
        render: (value?: string) => getStatusTag(value),
      },
      {
        title: <span style={headerCellStyle}>{t("staff.kitchen.columns.time")}</span>,
        dataIndex: "createdDate",
        key: "createdDate",
        width: 180,
        align: "center",
        render: (value?: string) => (
          <Text style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>{formatTime(value)}</Text>
        ),
      },
    ],
    [i18n.language, t],
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[var(--bg-base)] transition-colors duration-300">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-base)] p-0 transition-colors duration-300">
      {/* <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[var(--card)] p-4 md:p-5 rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--border)] gap-4 transition-colors duration-300">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--text)] m-0 leading-tight">Màn Hình Bếp</h1>
        </div>
        <div className="flex gap-3">
          <Button
            type="primary"
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={() => loadData(true)}
            loading={refreshing}
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--on-primary)] border-none shadow-md font-semibold rounded-xl h-auto py-2 px-4"
          >
            Làm mới
          </Button>
        </div>
      </div> */}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[var(--card)] rounded-none shadow-none border-0 min-h-[50vh] transition-colors duration-300">
          <div className="w-20 h-20 bg-[var(--surface)] rounded-full flex items-center justify-center mb-6 border border-[var(--border)]">
            <ClockCircleOutlined className="text-[34px] text-[var(--text-muted)] opacity-50" />
          </div>
          <h2 className="text-[22px] leading-[30px] font-semibold text-[var(--text)] mb-2">{t("staff.kitchen.empty.title")}</h2>
          <p className="text-[15px] leading-6 text-[var(--text-muted)]">{t("staff.kitchen.empty.description")}</p>
        </div>
      ) : (
        <div className="h-[calc(100vh-64px)] w-full">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              minHeight: 57,
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              background: "var(--card)",
            }}
          >
            <Space size={12} align="center">
              <ShoppingCartOutlined style={{ color: "var(--primary)", fontSize: 18 }} />
              <span style={{ fontSize: 18, lineHeight: "26px", fontWeight: 700, color: "var(--text)" }}>{t("staff.kitchen.title")}</span>
              <Tag
                color="orange"
                style={{
                  borderRadius: 999,
                  fontSize: 12,
                  lineHeight: "20px",
                  fontWeight: 600,
                  margin: 0,
                  paddingInline: 10,
                }}
              >
                {t("staff.kitchen.preparing_count", { count: items.filter((o) => (o.status || "").toLowerCase().includes("preparing")).length })}
              </Tag>
            </Space>
            <Text style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("staff.kitchen.updated_at", { time: formatUpdatedAt(updatedAt) })}</Text>
          </div>

          <Table
            columns={columns}
            dataSource={items}
            pagination={false}
            size="middle"
            rowKey="key"
            loading={refreshing}
            scroll={{ x: 1060, y: "calc(100vh - 64px - 57px - 16px)" }}
            tableLayout="fixed"
          />
        </div>
      )}
    </div>
  );
}
