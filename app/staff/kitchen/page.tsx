"use client";

import menuService from "@/lib/services/menuService";
import orderService, { OrderDto } from "@/lib/services/orderService";
import { ClockCircleOutlined, InfoCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { App, Button, Spin, Tag } from "antd";
import { useCallback, useEffect, useState } from "react";

type KitchenItem = {
  key: string;
  orderId: string;
  dishId: string;
  dishName: string;
  quantity: number;
  note?: string;
  status?: string;
};

const POLLING_MS = 10000;

export default function StaffKitchenPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  const mapOrdersToKitchenItems = useCallback(
    (
      orders: OrderDto[],
      dishNameMap: Record<string, string>,
    ): KitchenItem[] => {
      const rows: KitchenItem[] = [];

      // Giữ nguyên thứ tự API trả về
      orders.forEach((order, orderIndex) => {
        const orderId = order.id || "";

        (order.orderDetails || []).forEach((detail, detailIndex) => {
          rows.push({
            key: detail.id || `${orderId || orderIndex}-${detailIndex}`,
            orderId: orderId,
            dishId: detail.dishId,
            dishName: dishNameMap[detail.dishId] || detail.dishId,
            quantity: detail.quantity ?? 0,
            note: detail.note || undefined,
            status: detail.status || undefined,
          });
        });
      });

      return rows;
    },
    [],
  );

  const loadData = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [orders, menu] = await Promise.all([
          orderService.getOrdersByFilter({ paymentStatusId: 0 }),
          menuService.getMenu(),
        ]);

        const dishNameMap = (menu || []).reduce<Record<string, string>>(
          (acc, category) => {
            category.items?.forEach((dish) => {
              acc[dish.id] = dish.name;
            });
            return acc;
          },
          {},
        );

        // Đảm bảo chỉ lấy order với paymentStatusId === 0 theo yêu cầu nghiệp vụ
        const unpaidOrders = (orders || []).filter(o => o.paymentStatusId === 0);

        const mapped = mapOrdersToKitchenItems(unpaidOrders, dishNameMap);

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
    [mapOrdersToKitchenItems, message],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadData(true);
    }, POLLING_MS);

    return () => clearInterval(timer);
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[var(--bg-base)] transition-colors duration-300">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-base)] p-4 md:p-6 lg:p-8 space-y-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[var(--card)] p-5 rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--border)] gap-4 transition-colors duration-300">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] m-0 leading-tight">Màn Hình Bếp</h1>
        </div>
        <div className="flex gap-3">
          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={() => loadData(true)}
            loading={refreshing}
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--on-primary)] border-none shadow-md font-semibold rounded-xl h-auto py-2.5 px-5"
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[var(--card)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--border)] min-h-[50vh] transition-colors duration-300">
          <div className="w-24 h-24 bg-[var(--surface)] rounded-full flex items-center justify-center mb-6 shadow-inner border border-[var(--border)]">
            <ClockCircleOutlined className="text-5xl text-[var(--text-muted)] opacity-50" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Chưa có món ăn nào cần chuẩn bị</h2>
          <p className="text-[var(--text-muted)] text-lg">Đang chờ các order mới...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {items.map((item, index) => (
            <div
              key={`${item.key}`}
              className="group flex flex-col bg-[var(--card)] rounded-2xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300 border border-[var(--border)] overflow-hidden transform hover:-translate-y-1 relative"
            >

              {/* Order index badge */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[var(--primary)] text-[var(--on-primary)] text-[10px] font-bold px-2 py-0.5 rounded-full z-10 hidden group-hover:block transition-all shadow-sm">
                STT: {index + 1}
              </div>

              {/* Card Body (Dish Info) */}
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="flex gap-4 justify-between items-start">
                  <h3 className="text-xl md:text-[22px] font-bold text-[var(--text)] leading-snug flex-1">
                    {item.dishName}
                  </h3>
                  <div className="bg-[var(--primary-soft)] text-[var(--primary)] border-2 border-[var(--primary-border)] font-black text-2xl h-14 min-w-[3.5rem] px-2 flex items-center justify-center rounded-xl shadow-sm shrink-0">
                    x{item.quantity}
                  </div>
                </div>

                {item.note && (
                  <div className="bg-[var(--warning-soft)] border border-[var(--warning-border)] text-[var(--text-on-warning)] p-3.5 rounded-xl text-sm font-semibold flex gap-2.5 items-start mt-auto">
                    <InfoCircleOutlined className="mt-0.5 text-[var(--warning)] text-base shrink-0" />
                    <span className="leading-relaxed">{item.note}</span>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              {item.status && (
                <div className="px-5 py-3.5 bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-end group-hover:bg-[var(--surface-subtle)] transition-colors">
                  <Tag className="font-bold text-sm px-3 py-1 border border-[var(--primary-border)] m-0 rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
                    {item.status}
                  </Tag>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
