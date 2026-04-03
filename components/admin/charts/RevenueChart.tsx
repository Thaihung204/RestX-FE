"use client";

import { useTranslation } from "react-i18next";

const revenueData = [
  { day: "T2", value: 8200000 },
  { day: "T3", value: 9500000 },
  { day: "T4", value: 8800000 },
  { day: "T5", value: 11200000 },
  { day: "T6", value: 14500000 },
  { day: "T7", value: 18200000 },
  { day: "CN", value: 12450000 },
];

export default function RevenueChart() {
  const { t } = useTranslation();
  const maxValue = Math.max(...revenueData.map((d) => d.value));
  const totalRevenue = revenueData.reduce((s, d) => s + d.value, 0);

  const formatVND = (amount: number) =>
    new Intl.NumberFormat("vi-VN").format(amount) + "đ";

  const formatShort = (amount: number) => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + "tr";
    if (amount >= 1000) return (amount / 1000).toFixed(0) + "k";
    return amount.toString();
  };

  return (
    <div
      className="rounded-2xl p-5 h-full"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
      }}>
      {/* Header with summary */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-bold mb-0.5" style={{ color: 'var(--text)' }}>
            {t('charts.revenue.title')}
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('charts.revenue.subtitle')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            {formatVND(totalRevenue)}
          </p>
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
            Tổng 7 ngày
          </p>
        </div>
      </div>

      <div className="relative h-56">
        <svg className="w-full h-full" viewBox="0 0 700 230" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1="60"
              y1={25 + i * 55}
              x2="680"
              y2={25 + i * 55}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
          ))}

          {/* Y-axis labels */}
          {[0, 1, 2, 3].map((i) => (
            <text
              key={i}
              x="8"
              y={30 + i * 55}
              fill="var(--text-muted)"
              fontSize="10"
              textAnchor="start">
              {formatShort((maxValue * (3 - i)) / 3)}
            </text>
          ))}

          {/* Gradient fill */}
          <defs>
            <linearGradient id="revenueGradient2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path
            d={`${revenueData
              .map((d, i) => {
                const x = 90 + i * 90;
                const y = 195 - (d.value / maxValue) * 165;
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ")} L 630 195 L 90 195 Z`}
            fill="url(#revenueGradient2)"
          />

          {/* Line path */}
          <path
            d={revenueData
              .map((d, i) => {
                const x = 90 + i * 90;
                const y = 195 - (d.value / maxValue) * 165;
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="#F97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {revenueData.map((d, i) => {
            const x = 90 + i * 90;
            const y = 195 - (d.value / maxValue) * 165;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="4" fill="#F97316" />
                <circle cx={x} cy={y} r="2" fill="#FFF" />
              </g>
            );
          })}

          {/* X-axis labels */}
          {revenueData.map((d, i) => (
            <text
              key={i}
              x={90 + i * 90}
              y="220"
              fill="var(--text-muted)"
              fontSize="11"
              textAnchor="middle"
              fontWeight="500">
              {d.day}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
