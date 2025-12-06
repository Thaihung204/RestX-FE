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
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-1">Orders Overview</h3>
        <p className="text-gray-400 text-sm">Daily order volume</p>
      </div>

      <div className="relative h-64">
        <div className="flex items-end justify-between h-full gap-4 px-2">
          {ordersData.map((item, index) => {
            const height = (item.orders / maxOrders) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-full flex items-end justify-center h-48">
                  <div
                    className="w-full bg-gradient-to-t from-orange-600 to-orange-500 rounded-t-lg transition-all duration-500 hover:from-orange-500 hover:to-orange-400 group relative"
                    style={{ height: `${height}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {item.orders} orders
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-gray-400 text-sm font-medium">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-700 flex justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-br from-orange-600 to-orange-500 rounded"></div>
          <span className="text-sm text-gray-400">Total Orders</span>
        </div>
      </div>
    </div>
  );
}
