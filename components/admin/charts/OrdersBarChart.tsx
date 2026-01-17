"use client";

const ordersData = [
  { label: "Mon", orders: 45 },
  { label: "Tue", orders: 62 },
  { label: "Wed", orders: 54 },
  { label: "Thu", orders: 78 },
  { label: "Fri", orders: 85 },
  { label: "Sat", orders: 92 },
  { label: "Sun", orders: 68 },
];

export default function OrdersBarChart() {
  const maxOrders = Math.max(...ordersData.map((d) => d.orders));

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
      }}>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          Orders Overview
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Daily order volume
        </p>
      </div>

      <div className="relative h-64">
        <div className="flex items-end justify-between h-full gap-4 px-2">
          {ordersData.map((item, index) => {
            const height = (item.orders / maxOrders) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-full flex items-end justify-center h-48">
                  <div
                    className="w-full rounded-t-lg transition-all duration-500 group relative"
                    style={{ 
                      background: 'linear-gradient(to top, #FF380B, #FF380B)',
                      height: `${height}%`
                    }}>
                    <div
                      className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded whitespace-nowrap"
                      style={{
                        background: 'var(--card)',
                        color: 'var(--text)',
                        border: '1px solid var(--border)',
                      }}>
                      {item.orders} orders
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div
        className="mt-4 pt-4 flex justify-center"
        style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: 'linear-gradient(to bottom right, #FF380B, #FF380B)' }}></div>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Total Orders
          </span>
        </div>
      </div>
    </div>
  );
}
