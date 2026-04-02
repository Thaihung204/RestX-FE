"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

const categoryData = [
  { name: "Món chính", nameEn: "Main Dishes", value: 42, amount: 35280000, color: "#F97316" },
  { name: "Đồ uống", nameEn: "Beverages", value: 25, amount: 21000000, color: "#3b82f6" },
  { name: "Khai vị", nameEn: "Appetizers", value: 18, amount: 15120000, color: "#22c55e" },
  { name: "Tráng miệng", nameEn: "Desserts", value: 15, amount: 12600000, color: "#a855f7" },
];

export default function CategoryDistributionChart() {
  const { t, i18n } = useTranslation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = categoryData.reduce((sum, item) => sum + item.value, 0);
  const totalAmount = categoryData.reduce((sum, item) => sum + item.amount, 0);

  const formatVND = (amount: number) =>
    new Intl.NumberFormat("vi-VN").format(amount) + "đ";

  let currentAngle = 0;

  return (
    <div
      className="rounded-2xl p-5 h-full flex flex-col"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
      }}>
      <div className="mb-4">
        <h3 className="text-base font-bold mb-0.5" style={{ color: 'var(--text)' }}>
          {t('charts.category_distribution.title')}
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {t('charts.category_distribution.subtitle')}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        {/* Donut Chart */}
        <div className="relative w-40 h-40">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 200 200">
            {categoryData.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (percentage / 100) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;

              const x1 = 100 + 80 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 100 + 80 * Math.sin((Math.PI * startAngle) / 180);
              const x2 = 100 + 80 * Math.cos((Math.PI * endAngle) / 180);
              const y2 = 100 + 80 * Math.sin((Math.PI * endAngle) / 180);

              const largeArcFlag = angle > 180 ? 1 : 0;

              const pathData = [
                `M 100 100`,
                `L ${x1} ${y1}`,
                `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `Z`,
              ].join(" ");

              currentAngle += angle;

              return (
                <path
                  key={index}
                  d={pathData}
                  fill={item.color}
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.4,
                    transform: hoveredIndex === index ? "scale(1.04)" : "scale(1)",
                    transformOrigin: "center",
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
            <circle cx="100" cy="100" r="55" fill="var(--card)" />
          </svg>

          {/* Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {formatVND(totalAmount)}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full space-y-2">
          {categoryData.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(0);
            const displayName = i18n.language === 'vi' ? item.name : item.nameEn;
            return (
              <div
                key={index}
                className="flex items-center gap-2 cursor-pointer transition-all hover:translate-x-0.5 px-2 py-1.5 rounded-lg"
                style={{
                  background: hoveredIndex === index ? 'var(--surface)' : 'transparent',
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}>
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-xs font-medium flex-1" style={{ color: 'var(--text)' }}>
                  {displayName}
                </p>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {percentage}%
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
