"use client";

import type { RevenueTrendPoint } from "@/lib/services/dashboardService";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatVND } from "@/lib/utils/currency";

interface RevenueChartProps {
  data?: RevenueTrendPoint[];
  totalRevenue?: number;
  subtitle?: string;
}

export default function RevenueChart({
  data = [],
  totalRevenue = 0,
  subtitle,
}: RevenueChartProps) {
  const { t } = useTranslation();
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    if (!chartRef.current) return;

    const element = chartRef.current;
    const updateWidth = () => {
      const width = Math.floor(element.getBoundingClientRect().width);
      if (width > 0) {
        setChartWidth(width);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const revenueData =
    data.length > 0 ? data : [{ label: "-", value: 0, date: "" }];
  const maxValue = Math.max(1, ...revenueData.map((d) => d.value));
  const measuredWidth = Math.max(chartWidth, 320);

  const maxLabelLength = Math.max(...revenueData.map((d) => d.label.length));
  const xAxisFontSize = maxLabelLength > 8 ? 10 : 12;
  const edgeLabelPadding = Math.min(
    measuredWidth * 0.18,
    Math.max(34, maxLabelLength * 3.2),
  );
  const leftPadding = Math.max(52, edgeLabelPadding);
  const rightPadding = Math.max(28, edgeLabelPadding);
  const topPadding = 25;
  const chartHeight = 170;
  const svgHeight = 230;
  const bottomY = topPadding + chartHeight;
  const steps = Math.max(revenueData.length - 1, 1);
  const viewWidth = measuredWidth;
  const plotWidth = Math.max(1, viewWidth - leftPadding - rightPadding);

  const minLabelGap = maxLabelLength > 8 ? 88 : 64;
  const maxLabelCount = Math.max(1, Math.floor(plotWidth / minLabelGap));
  const showLabelEvery = Math.max(
    1,
    Math.ceil(revenueData.length / maxLabelCount),
  );

  const getX = (index: number) => leftPadding + (index / steps) * plotWidth;
  const getY = (value: number) => bottomY - (value / maxValue) * chartHeight;

  const formatShort = (amount: number) => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + "tr";
    if (amount >= 1000) return (amount / 1000).toFixed(0) + "k";
    return amount.toString();
  };

  const formatPointValue = (amount: number) => {
    if (amount >= 1000000) {
      const value = amount / 1000000;
      return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}tr`;
    }

    if (amount >= 1000) {
      return `${Math.round(amount / 1000)}k`;
    }

    return amount.toLocaleString("vi-VN");
  };

  return (
    <div
      className="rounded-2xl p-5 h-full"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}>
      {/* Header with summary */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3
            className="text-base font-bold mb-0.5"
            style={{ color: "var(--text)" }}>
            {t("charts.revenue.title")}
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {subtitle ?? t("charts.revenue.subtitle")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
            {formatVND(totalRevenue)}
          </p>
          <p
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: "var(--text-muted)" }}>
            {t("charts.revenue.total_period", { defaultValue: "Tổng kỳ" })}
          </p>
        </div>
      </div>

      <div ref={chartRef} className="relative h-56 w-full">
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${viewWidth} ${svgHeight}`}
          preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1={leftPadding}
              y1={25 + i * 55}
              x2={viewWidth - rightPadding}
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
                const x = getX(i);
                const y = getY(d.value);
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(
                " ",
              )} L ${getX(revenueData.length - 1)} ${bottomY} L ${getX(0)} ${bottomY} Z`}
            fill="url(#revenueGradient2)"
          />

          {/* Line path */}
          <path
            d={revenueData
              .map((d, i) => {
                const x = getX(i);
                const y = getY(d.value);
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
            const x = getX(i);
            const y = getY(d.value);
            const valueY = Math.max(12, y - 10);
            return (
              <g key={i}>
                <text
                  x={x}
                  y={valueY}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="middle"
                  fontWeight="600">
                  {formatPointValue(d.value)}
                </text>
                <circle cx={x} cy={y} r="4" fill="#F97316" />
                <circle cx={x} cy={y} r="2" fill="#FFF" />
              </g>
            );
          })}

          {/* X-axis labels */}
          {revenueData.map((d, i) => (
            <text
              key={i}
              x={getX(i)}
              y="220"
              fill="var(--text-muted)"
              fontSize={xAxisFontSize}
              textAnchor={
                i === 0
                  ? "start"
                  : i === revenueData.length - 1
                    ? "end"
                    : "middle"
              }
              fontWeight="500">
              {i % showLabelEvery === 0 || i === revenueData.length - 1
                ? d.label
                : ""}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
