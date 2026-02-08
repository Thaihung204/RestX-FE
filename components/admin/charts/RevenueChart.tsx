"use client";

import { useTranslation } from "react-i18next";

const revenueData = [
  { day: "Mon", value: 3200 },
  { day: "Tue", value: 4100 },
  { day: "Wed", value: 3800 },
  { day: "Thu", value: 5200 },
  { day: "Fri", value: 6100 },
  { day: "Sat", value: 7800 },
  { day: "Sun", value: 4850 },
];

export default function RevenueChart() {
  const { t } = useTranslation();
  const maxValue = Math.max(...revenueData.map((d) => d.value));

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
      }}>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          {t('charts.revenue.title')}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('charts.revenue.subtitle')}
        </p>
      </div>

      <div className="relative h-64">
        <svg className="w-full h-full" viewBox="0 0 700 256">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="50"
              y1={40 + i * 50}
              x2="680"
              y2={40 + i * 50}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map((i) => (
            <text
              key={i}
              x="10"
              y={45 + i * 50}
              fill="var(--text-muted)"
              fontSize="12"
              textAnchor="start">
              ${((maxValue * (4 - i)) / 4 / 1000).toFixed(1)}k
            </text>
          ))}

          {/* Line path */}
          <path
            d={revenueData
              .map((d, i) => {
                const x = 80 + i * 90;
                const y = 240 - (d.value / maxValue) * 190;
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="#F97316"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gradient fill */}
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${revenueData
              .map((d, i) => {
                const x = 80 + i * 90;
                const y = 240 - (d.value / maxValue) * 190;
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ")} L 620 240 L 80 240 Z`}
            fill="url(#revenueGradient)"
          />

          {/* Data points */}
          {revenueData.map((d, i) => {
            const x = 80 + i * 90;
            const y = 240 - (d.value / maxValue) * 190;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="5" fill="#F97316" />
                <circle cx={x} cy={y} r="3" fill="#FFF" />
              </g>
            );
          })}

          {/* X-axis labels */}
          {revenueData.map((d, i) => (
            <text
              key={i}
              x={80 + i * 90}
              y="256"
              fill="var(--text-muted)"
              fontSize="12"
              textAnchor="middle">
              {d.day}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
