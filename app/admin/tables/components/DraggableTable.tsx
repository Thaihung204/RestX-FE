"use client";

import { motion } from "framer-motion";
import React from "react";

type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "DISABLED";

export interface TableData {
  id: string;
  tenantId: string;
  name: string;
  seats: number;
  status: TableStatus;
  area: string;
  position: { x: number; y: number };
}

interface DraggableTableProps {
  table: TableData;
  onDragEnd: (tableId: string, newPosition: { x: number; y: number }) => void;
  onClick: (table: TableData) => void;
  draggable?: boolean;
  renderContent?: (table: TableData) => React.ReactNode;
}

const STATUS_CONFIG = {
  AVAILABLE: {
    color: "#52c41a",
    bgColor: "#f6ffed",
    borderColor: "#b7eb8f",
    text: "Available",
  },
  OCCUPIED: {
    color: "var(--primary)",
    bgColor: "#fff1f0",
    borderColor: "#ffa39e",
    text: "Occupied",
  },
  RESERVED: {
    color: "#1890ff",
    bgColor: "#e6f7ff",
    borderColor: "#91d5ff",
    text: "Reserved",
  },
  DISABLED: {
    color: "#8c8c8c",
    bgColor: "#f5f5f5",
    borderColor: "#d9d9d9",
    text: "Disabled",
  },
};

export const DraggableTable: React.FC<DraggableTableProps> = ({
  table,
  onDragEnd,
  onClick,
  draggable = true,
  renderContent,
}) => {
  const statusStyle = STATUS_CONFIG[table.status];
  const [isDragging, setIsDragging] = React.useState(false);

  return (
    <motion.div
      drag={draggable}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event, info) => {
        setIsDragging(false);
        // Snap to 20px grid
        const newX = Math.round((table.position.x + info.offset.x) / 20) * 20;
        const newY = Math.round((table.position.y + info.offset.y) / 20) * 20;
        onDragEnd(table.id, { x: Math.max(0, newX), y: Math.max(0, newY) });
      }}
      onTap={() => {
        if (!isDragging) {
          onClick(table);
        }
      }}
      initial={{ x: table.position.x, y: table.position.y }}
      animate={{ x: table.position.x, y: table.position.y }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      style={{
        position: "absolute",
        width: 100,
        height: 100,
        cursor: draggable && table.status !== "DISABLED" ? "grab" : "pointer",
        userSelect: "none",
        touchAction: "none",
        zIndex: 1,
      }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 12,
          border: `3px solid ${statusStyle.borderColor}`,
          backgroundColor: statusStyle.bgColor,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 8,
          position: "relative",
        }}>
        {/* Table icon */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke={statusStyle.color}
          strokeWidth="2"
          style={{ marginBottom: 4 }}>
          <rect x="3" y="10" width="18" height="10" rx="2" />
          <path d="M7 10 V6 M17 10 V6" />
        </svg>

        {/* Table name */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: statusStyle.color,
            marginBottom: 2,
          }}>
          {table.name}
        </div>

        {/* Seats */}
        <div
          style={{
            fontSize: 11,
            color: "#666",
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#666">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          {table.seats}
        </div>
        {renderContent?.(table)}
      </div>
    </motion.div>
  );
};
