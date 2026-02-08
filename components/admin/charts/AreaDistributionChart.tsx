"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

const areaData = [
  { name: "VIP Area", value: 35, color: "#F97316" },
  { name: "Indoor", value: 45, color: "#FB923C" },
  { name: "Outdoor", value: 20, color: "#FDBA74" },
];

export default function AreaDistributionChart() {
  const { t } = useTranslation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = areaData.reduce((sum, item) => sum + item.value, 0);

  let currentAngle = 0;

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
      }}>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          {t('charts.area_distribution.title')}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('charts.area_distribution.subtitle')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* Pie Chart */}
        <div className="relative w-48 h-48">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 200 200">
            {areaData.map((item, index) => {
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
                    opacity:
                      hoveredIndex === null || hoveredIndex === index ? 1 : 0.5,
                    transform:
                      hoveredIndex === index ? "scale(1.05)" : "scale(1)",
                    transformOrigin: "center",
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
            {/* Center circle */}
            <circle cx="100" cy="100" r="50" fill="var(--surface)" />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              {total}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('charts.area_distribution.tables')}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {areaData.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div
                key={index}
                className="flex items-center gap-3 cursor-pointer transition-all hover:translate-x-1"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}>
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.color }}></div>
                <div className="flex-1">
                  <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                    {item.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {item.value} {t('charts.area_distribution.tables_suffix')} ({percentage}%)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
