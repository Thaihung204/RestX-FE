import { motion, useMotionValue } from "framer-motion";
import React, { useEffect, useCallback } from "react";

type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "DISABLED";

export interface TableData {
  id: string;
  tenantId: string;
  name: string;
  seats: number;
  status: TableStatus;
  area: string;
  position: { x: number; y: number };
  shape?: "Square" | "Circle" | "Rectangle" | "Oval";
  width?: number;
  height?: number;
  rotation?: number;
  zoneId?: string;
}

interface DraggableTableProps {
  table: TableData;
  onDragEnd: (tableId: string, newPosition: { x: number; y: number }) => void;
  onClick: (table: TableData) => void;
  onResize?: (tableId: string, size: { width: number; height: number }) => void;
  draggable?: boolean;
  renderContent?: (table: TableData) => React.ReactNode;
}

const STATUS_CONFIG = {
  AVAILABLE: {
    stroke: "#52c41a",
    fill: "#f6ffed",
    text: "#52c41a",
  },
  OCCUPIED: {
    stroke: "#ff4d4f",
    fill: "#fff1f0",
    text: "#ff4d4f",
  },
  RESERVED: {
    stroke: "#1890ff",
    fill: "#e6f7ff",
    text: "#1890ff",
  },
  DISABLED: {
    stroke: "#d9d9d9",
    fill: "#f5f5f5",
    text: "#8c8c8c",
  },
};

export const DraggableTable: React.FC<DraggableTableProps> = ({
  table,
  onDragEnd,
  onClick,
  onResize,
  draggable = true,
  renderContent,
}) => {
  const statusStyle = STATUS_CONFIG[table.status];
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);

  // Default dimensions
  const width = table.width || 80;
  const height = table.height || 80;
  const shape = table.shape || "Square";
  const rotation = table.rotation || 0;

  // ─── FIX: Use motion values for drag offset instead of animate ───
  // Position via CSS left/top, drag offset via motion values.
  // When parent updates table.position, we reset the drag offset to 0.
  // This eliminates the conflict between framer-motion animate and drag.
  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);

  useEffect(() => {
    motionX.set(0);
    motionY.set(0);
  }, [table.position.x, table.position.y]);

  // ─── Resize: local size state for live preview during resize ───
  const [localSize, setLocalSize] = React.useState({ width, height });
  useEffect(() => {
    setLocalSize({ width, height });
  }, [width, height]);

  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    if (!draggable || !onResize) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = width;
    const startH = height;

    const handleMove = (ev: PointerEvent) => {
      const newW = Math.max(40, Math.round((startW + (ev.clientX - startX)) / 10) * 10);
      const newH = Math.max(40, Math.round((startH + (ev.clientY - startY)) / 10) * 10);
      setLocalSize({ width: newW, height: newH });
    };

    const handleUp = (ev: PointerEvent) => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      setIsResizing(false);
      const finalW = Math.max(40, Math.round((startW + (ev.clientX - startX)) / 10) * 10);
      const finalH = Math.max(40, Math.round((startH + (ev.clientY - startY)) / 10) * 10);
      onResize!(table.id, { width: finalW, height: finalH });
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
  }, [draggable, onResize, width, height, table.id]);

  const displayW = isResizing ? localSize.width : width;
  const displayH = isResizing ? localSize.height : height;



  const getShapeStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: "100%",
      height: "100%",
      border: `2px solid ${statusStyle.stroke}`,
      backgroundColor: statusStyle.fill,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      boxShadow: isDragging ? "0 8px 16px rgba(0,0,0,0.15)" : "0 2px 4px rgba(0,0,0,0.05)",
      transition: "box-shadow 0.2s",
    };

    if (shape === "Circle" || shape === "Oval") {
      base.borderRadius = "50%";
    } else {
      base.borderRadius = "4px";
    }

    return base;
  };

  return (
    <motion.div
      drag={draggable && !isResizing}
      dragElastic={0}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event, info) => {
        setIsDragging(false);
        const snap = 10;
        const newX = Math.round((table.position.x + info.offset.x) / snap) * snap;
        const newY = Math.round((table.position.y + info.offset.y) / snap) * snap;
        onDragEnd(table.id, { x: Math.max(0, newX), y: Math.max(0, newY) });
      }}
      onTap={() => {
        if (!isDragging && !isResizing) {
          onClick(table);
        }
      }}
      // ─── FIX: Position via left/top + motion offset (x, y) ───
      // No more animate={{ x, y }} which conflicts with drag
      style={{
        position: "absolute",
        left: table.position.x,
        top: table.position.y,
        x: motionX,
        y: motionY,
        rotate: rotation,
        width: displayW,
        height: displayH,
        zIndex: isDragging || isResizing ? 10 : 1,
      }}
      whileHover={{ scale: 1.02, cursor: draggable ? "grab" : "pointer" }}
      whileTap={{ scale: isDragging ? 0.98 : 1, cursor: "grabbing" }}
    >



      <div style={getShapeStyle()}>
        {/* Table Label */}
        <div
          style={{
            fontSize: Math.min(displayW, displayH) / 4,
            fontWeight: 600,
            color: statusStyle.text,
            textAlign: "center",
            lineHeight: 1,
          }}>
          {table.name}
        </div>

        {/* Seats Count Small */}
        <div style={{ fontSize: 9, color: statusStyle.text, marginTop: 2, opacity: 0.8 }}>
          {table.seats} seats
        </div>

        {/* Size indicator during resize */}
        {isResizing && (
          <div style={{ fontSize: 8, color: statusStyle.text, marginTop: 2, opacity: 0.6 }}>
            {displayW}×{displayH}
          </div>
        )}

        {renderContent?.(table)}
      </div>

      {/* ─── Resize Handle — bottom-right corner ─── */}
      {draggable && onResize && (
        <div
          onPointerDown={handleResizePointerDown}
          style={{
            position: "absolute",
            right: -5,
            bottom: -5,
            width: 14,
            height: 14,
            cursor: "nwse-resize",
            background: statusStyle.stroke,
            borderRadius: 3,
            border: "2px solid white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            zIndex: 10,
            touchAction: "none",
            opacity: 0.8,
          }}
        />
      )}
    </motion.div>
  );
};
