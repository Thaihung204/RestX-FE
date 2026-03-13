import React, { useEffect, useCallback, useRef } from "react";

type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "DISABLED" | "SELECTED";

export interface TableData {
  id: string;
  tenantId: string;
  name: string;
  seats: number;
  status: TableStatus;
  area: string;
  position: { x: number; y: number };
  shape: "Circle" | "Rectangle" | "Square" | "Oval";
  width: number;
  height: number;
  rotation: number;
  zoneId?: string;
}

interface DraggableTableProps {
  table: TableData;
  onDragEnd: (tableId: string, newPosition: { x: number; y: number }) => void;
  onClick: (table: TableData) => void;
  onResize?: (tableId: string, size: { width: number; height: number }) => void;
  draggable?: boolean;
  renderContent?: (table: TableData) => React.ReactNode;
  scale?: number;
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
  SELECTED: {
    stroke: "var(--primary)",
    fill: "var(--primary-soft)",
    text: "var(--primary)",
  },
};

export const DraggableTable: React.FC<DraggableTableProps> = ({
  table,
  onDragEnd,
  onClick,
  onResize,
  draggable = true,
  renderContent,
  scale = 1,
}) => {
  const statusStyle = STATUS_CONFIG[table.status];
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const didDragRef = useRef(false);

  // STRICT DEFAULTS
  const width = table.width ?? 100;
  const height = table.height ?? 100;
  const shape = table.shape;
  const rotation = table.rotation ?? 0;

  // ── Live drag position (for smooth dragging without re-render) ──
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, tableX: 0, tableY: 0 });

  // ── Resize: local size state for live preview during resize ──
  const [localSize, setLocalSize] = React.useState({ width, height });
  useEffect(() => {
    setLocalSize({ width, height });
  }, [width, height]);

  // ── DRAG via pointer events — smooth, pixel-perfect ──
  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    if (!draggable || isResizing) return;
    // Only left mouse button
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();
    didDragRef.current = false;

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      tableX: table.position.x,
      tableY: table.position.y,
    };

    const s = scale || 1;
    const handleMove = (ev: PointerEvent) => {
      // Divide by scale: screen pixels → canvas pixels
      const dx = (ev.clientX - dragStartRef.current.mouseX) / s;
      const dy = (ev.clientY - dragStartRef.current.mouseY) / s;

      // Only start drag after 3px screen movement to allow clicks
      if (!didDragRef.current && (Math.abs(ev.clientX - dragStartRef.current.mouseX) + Math.abs(ev.clientY - dragStartRef.current.mouseY)) > 3) {
        didDragRef.current = true;
        setIsDragging(true);
      }

      if (didDragRef.current) {
        setDragOffset({ x: dx, y: dy });
      }
    };

    const handleUp = (ev: PointerEvent) => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      setIsDragging(false);

      if (didDragRef.current) {
        const s = scale || 1;
        const dx = (ev.clientX - dragStartRef.current.mouseX) / s;
        const dy = (ev.clientY - dragStartRef.current.mouseY) / s;
        const newX = Math.max(0, Math.round(dragStartRef.current.tableX + dx));
        const newY = Math.max(0, Math.round(dragStartRef.current.tableY + dy));
        onDragEnd(table.id, { x: newX, y: newY });
      }

      setDragOffset({ x: 0, y: 0 });
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
  }, [draggable, isResizing, table.position.x, table.position.y, table.id, onDragEnd, scale]);

  // ── RESIZE via pointer events ──
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    if (!draggable || !onResize) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = width;
    const startH = height;

    const s = scale || 1;
    const handleMove = (ev: PointerEvent) => {
      const newW = Math.max(40, Math.round(startW + (ev.clientX - startX) / s));
      const newH = Math.max(40, Math.round(startH + (ev.clientY - startY) / s));
      setLocalSize({ width: newW, height: newH });
    };

    const handleUp = (ev: PointerEvent) => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      setIsResizing(false);
      const finalW = Math.max(40, Math.round(startW + (ev.clientX - startX) / s));
      const finalH = Math.max(40, Math.round(startH + (ev.clientY - startY) / s));
      onResize!(table.id, { width: finalW, height: finalH });
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
  }, [draggable, onResize, width, height, table.id, scale]);

  const displayW = isResizing ? localSize.width : width;
  const displayH = isResizing ? localSize.height : height;

  // Live position: base + drag offset during drag
  const displayX = table.position.x + (isDragging ? dragOffset.x : 0);
  const displayY = table.position.y + (isDragging ? dragOffset.y : 0);

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
      transition: isDragging ? "none" : "box-shadow 0.2s",
    };

    if (shape === "Circle") base.borderRadius = "50%";
    else if (shape === "Oval") base.borderRadius = "50%";
    else if (shape === "Square") base.borderRadius = "4px";
    else if (shape === "Rectangle") base.borderRadius = "4px";
    else base.borderRadius = "4px";

    return base;
  };

  const handleClick = useCallback(() => {
    // Only fire click if we didn't drag
    if (!didDragRef.current && !isResizing) {
      onClick(table);
    }
  }, [onClick, table, isResizing]);

  return (
    <div
      onPointerDown={handleDragPointerDown}
      onClick={handleClick}
      style={{
        position: "absolute",
        left: displayX,
        top: displayY,
        width: displayW,
        height: displayH,
        transform: `rotate(${rotation}deg)`,
        zIndex: isDragging || isResizing ? 10 : 1,
        cursor: draggable
          ? isDragging ? "grabbing" : "grab"
          : "pointer",
        userSelect: "none",
        touchAction: "none",
        // Smooth position transition when NOT dragging (e.g. after drop)
        transition: isDragging ? "none" : "left 0.15s ease, top 0.15s ease",
        opacity: isDragging ? 0.9 : 1,
      }}
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
    </div>
  );
};
