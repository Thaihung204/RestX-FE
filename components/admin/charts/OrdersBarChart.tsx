"use client";

import { useTranslation } from "react-i18next";

const ordersData = [
  { label: "T2", orders: 45 },
  { label: "T3", orders: 52 },
  { label: "T4", orders: 48 },
  { label: "T5", orders: 63 },
  { label: "T6", orders: 78 },
  { label: "T7", orders: 92 },
  { label: "CN", orders: 67 },
];

export default function OrdersBarChart() {
  const { t } = useTranslation();
  const maxOrders = Math.max(...ordersData.map((d) => d.orders));
  const totalOrders = ordersData.reduce((s, d) => s + d.orders, 0);

  return (
    <div
      className="rounded-2xl p-5 h-full"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
      }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-bold mb-0.5" style={{ color: 'var(--text)' }}>
            {t('charts.orders.title')}
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('charts.orders.subtitle')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            {totalOrders.toLocaleString("vi-VN")}
          </p>
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
            {t('charts.orders.total_orders')}
          </p>
        </div>
      </div>

      <div className="relative h-52">
        <div className="flex items-end justify-between h-full gap-3 px-1">
          {ordersData.map((item, index) => {
            const height = (item.orders / maxOrders) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-full flex items-end justify-center h-40">
                  <div
                    className="w-full max-w-[42px] mx-auto rounded-lg transition-all duration-500 group relative hover:opacity-80"
                    style={{
                      background: 'linear-gradient(to top, var(--primary), #FB923C)',
                      height: `${height}%`,
                    }}>
                    <div
                      className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
                      style={{
                        background: 'var(--card)',
                        color: 'var(--text)',
                        border: '1px solid var(--border)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}>
                      {item.orders}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
