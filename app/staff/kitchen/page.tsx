"use client";

import { useTenant } from "@/lib/contexts/TenantContext";
import orderService, { OrderDetailListItemDto } from "@/lib/services/orderService";
import orderSignalRService from "@/lib/services/orderSignalRService";
import { ClockCircleOutlined, InfoCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { HubConnectionState } from "@microsoft/signalr";
import { App, Button, Spin } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";

type KitchenItem = {
  key: string;
  orderId: string;
  dishId: string;
  dishName: string;
  quantity: number;
  note?: string;
  status?: string;
  createdDate?: string;
};

type WaitTimeInfo = {
  text: string;
  bg: string;
  textCol: string;
  border: string;
  isLate?: boolean;
};

export default function StaffKitchenPage() {
  const { message } = App.useApp();
  const { tenant } = useTenant();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  const [currentTime, setCurrentTime] = useState(new Date());
  const [doneItems, setDoneItems] = useState<Set<string>>(new Set());

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const mapOrderDetailsToKitchenItems = useCallback((details: OrderDetailListItemDto[]): KitchenItem[] => {
    return (details || []).map((detail, index) => ({
      key: detail.id || `${detail.orderId || "order"}-${detail.dishId || "dish"}-${index}`,
      orderId: detail.orderId || "",
      dishId: detail.dishId || "",
      dishName: detail.dishName || detail.dishId || "",
      quantity: detail.quantity ?? 0,
      note: detail.note || undefined,
      status: detail.status || undefined,
      createdDate: detail.createdDate || undefined,
    }));
  }, []);

  const loadData = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const details = await orderService.getOrderDetailsList();
        const mapped = mapOrderDetailsToKitchenItems(details).sort((a, b) => {
          if (!a.createdDate && !b.createdDate) return 0;
          if (!a.createdDate) return 1;
          if (!b.createdDate) return -1;
          return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
        });

        setItems(mapped);
        setUpdatedAt(
          new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
      } catch (error) {
        console.error("Failed to load kitchen items:", error);
        message.error("Không thể tải dữ liệu món ăn");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mapOrderDetailsToKitchenItems, message],
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

  const toggleDone = (key: string) => {
    setDoneItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const getWaitTimeInfo = (createdDateStr?: string): WaitTimeInfo => {
    if (!createdDateStr) {
      return { text: "Mới", bg: "bg-gray-100", textCol: "text-gray-600", border: "border-gray-200" };
    }

    const created = new Date(createdDateStr);
    const diffMs = currentTime.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) {
      return { text: "Mới", bg: "bg-blue-50", textCol: "text-blue-600", border: "border-blue-200" };
    }
    if (diffMins >= 15) {
      return { text: `${diffMins} phút`, bg: "bg-red-50", textCol: "text-red-600", border: "border-red-200", isLate: true };
    }
    if (diffMins >= 5) {
      return { text: `${diffMins} phút`, bg: "bg-orange-50", textCol: "text-orange-600", border: "border-orange-200" };
    }
    return { text: `${diffMins} phút`, bg: "bg-green-50", textCol: "text-green-600", border: "border-green-200" };
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[var(--bg-base)] transition-colors duration-300">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-base)] p-3 md:p-4 lg:p-6 space-y-4 md:space-y-6 transition-colors duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[var(--card)] p-4 md:p-5 rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--border)] gap-4 transition-colors duration-300">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--text)] m-0 leading-tight">Màn Hình Bếp</h1>
          {updatedAt ? <p className="text-xs md:text-sm text-[var(--text-muted)] m-0 mt-1">Cập nhật: {updatedAt}</p> : null}
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
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[var(--card)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--border)] min-h-[50vh] transition-colors duration-300">
          <div className="w-20 h-20 bg-[var(--surface)] rounded-full flex items-center justify-center mb-6 shadow-inner border border-[var(--border)]">
            <ClockCircleOutlined className="text-4xl text-[var(--text-muted)] opacity-50" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">Chưa có món ăn nào cần chuẩn bị</h2>
          <p className="text-[var(--text-muted)] text-base">Đang chờ các order mới...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {items.map((item) => {
            const isDone = doneItems.has(item.key);
            const waitInfo = getWaitTimeInfo(item.createdDate);

            return (
              <div
                key={item.key}
                onClick={() => toggleDone(item.key)}
                className={`flex flex-col p-3 md:p-4 rounded-xl border cursor-pointer select-none transition-all duration-200
                  ${
                    isDone
                      ? "opacity-50 bg-[var(--surface)] border-[var(--border)] grayscale-[50%]"
                      : "bg-[var(--card)] shadow-[var(--shadow-sm)] hover:shadow-md border-[var(--border)]"
                  }
                  ${waitInfo.isLate && !isDone ? "ring-2 ring-red-400 ring-offset-1" : ""}
                `}
              >
                <div className="flex justify-between items-start mb-2.5">
                  <span className={`text-xs font-mono font-bold ${isDone ? "text-gray-400" : "text-[var(--text-muted)]"}`}>
                    #{item.orderId.substring(0, 6).toUpperCase()}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap transition-colors
                    ${isDone ? "bg-gray-100 text-gray-400" : `${waitInfo.bg} ${waitInfo.textCol}`}
                  `}
                  >
                    {waitInfo.text}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 md:w-14 md:h-14 shrink-0 flex items-center justify-center rounded-lg font-black text-xl md:text-2xl transition-colors
                      ${
                        isDone
                          ? "bg-gray-200 text-gray-500"
                          : "bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-border)]"
                      }
                    `}
                  >
                    {item.quantity}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-base md:text-lg font-bold leading-tight m-0 line-clamp-2 transition-all
                      ${isDone ? "text-[var(--text-muted)] line-through" : "text-[var(--text)]"}
                    `}
                    >
                      {item.dishName}
                    </h3>
                  </div>
                </div>

                {item.note && (
                  <div
                    className={`mt-3 inline-flex items-start gap-1.5 px-2.5 py-1.5 rounded-md text-xs md:text-sm font-semibold w-fit
                    ${
                      isDone
                        ? "bg-gray-100 text-gray-500 line-through"
                        : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    }
                  `}
                  >
                    <InfoCircleOutlined className={`mt-0.5 shrink-0 ${isDone ? "" : "text-yellow-600"}`} />
                    <span className="leading-snug break-words line-clamp-3">{item.note}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
