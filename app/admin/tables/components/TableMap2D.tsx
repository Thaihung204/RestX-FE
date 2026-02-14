"use client";

import React, { useState, useRef, useCallback } from "react";
import { DraggableTable, TableData } from "./DraggableTable";
import { useTranslation } from "react-i18next";

export interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface Floor {
  id: string;
  name: string;
  backgroundImage?: string;
  width: number;
  height: number;
  zones: Zone[];
  tables: TableData[];
}

export interface Layout {
  id: string;
  name: string;
  floors: Floor[];
  activeFloorId: string;
}

interface TableMap2DProps {
  layout: Layout;
  onLayoutChange: (layout: Layout) => void;
  onTableClick: (table: TableData) => void;
  onTablePositionChange: (
    tableId: string,
    position: { x: number; y: number; zoneId?: string },
  ) => void;
  onTableMerge?: (sourceTableId: string, targetTableId: string) => void;
  onTableResize?: (tableId: string, size: { width: number; height: number }) => void;
  onAddZone?: () => void;
  renderTableContent?: (table: TableData) => React.ReactNode;
  readOnly?: boolean;
  selectedTableId?: string;
}

/* ── Inline Editable Zone Name ── */
const ZoneName: React.FC<{
  name: string;
  readOnly: boolean;
  onChange: (name: string) => void;
}> = ({ name, readOnly, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  if (readOnly) {
    return (
      <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, color: "var(--text)", userSelect: "none" }}>
        {name}
      </span>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => { setEditing(false); onChange(value); }}
        onKeyDown={(e) => { if (e.key === "Enter") { setEditing(false); onChange(value); } if (e.key === "Escape") { setEditing(false); setValue(name); } }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          fontSize: 11,
          fontWeight: 600,
          background: "rgba(255,255,255,0.9)",
          border: "1px solid var(--primary)",
          borderRadius: 3,
          padding: "1px 4px",
          outline: "none",
          width: "100%",
          maxWidth: 120,
          color: "var(--text)",
        }}
      />
    );
  }

  return (
    <span
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title="Double-click to rename"
      style={{
        fontSize: 11,
        fontWeight: 600,
        opacity: 0.7,
        color: "var(--text)",
        userSelect: "none",
        cursor: "text",
      }}
    >
      {name}
    </span>
  );
};

/* ── Interactive Zone Component ── */
const InteractiveZone: React.FC<{
  zone: Zone;
  readOnly: boolean;
  floorWidth: number;
  floorHeight: number;
  onUpdate: (zoneId: string, updates: Partial<Zone>) => void;
  onDelete?: (zoneId: string) => void;
}> = ({ zone, readOnly, floorWidth, floorHeight, onUpdate, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [localPos, setLocalPos] = useState({ x: zone.x, y: zone.y });
  const [localSize, setLocalSize] = useState({ w: zone.width, h: zone.height });
  const [showActions, setShowActions] = useState(false);

  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });
  const resizeRef = useRef({ startX: 0, startY: 0, origW: 0, origH: 0, handle: "" });

  // Sync from props when not interacting
  React.useEffect(() => {
    if (!isDragging) setLocalPos({ x: zone.x, y: zone.y });
  }, [zone.x, zone.y, isDragging]);

  React.useEffect(() => {
    if (!isResizing) setLocalSize({ w: zone.width, h: zone.height });
  }, [zone.width, zone.height, isResizing]);

  /* ─── Drag ─── */
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    if (readOnly || isResizing) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: localPos.x, origY: localPos.y };

    const handleMove = (ev: PointerEvent) => {
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      const newX = Math.max(0, Math.min(floorWidth - localSize.w, dragRef.current.origX + dx));
      const newY = Math.max(0, Math.min(floorHeight - localSize.h, dragRef.current.origY + dy));
      setLocalPos({ x: newX, y: newY });
    };

    const handleUp = () => {
      setIsDragging(false);
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      // Commit
      setLocalPos(pos => {
        onUpdate(zone.id, { x: pos.x, y: pos.y });
        return pos;
      });
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
  }, [readOnly, isResizing, localPos, localSize, floorWidth, floorHeight, zone.id, onUpdate]);

  /* ─── Resize ─── */
  const handleResizeStart = useCallback((e: React.PointerEvent, handle: string) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: localSize.w, origH: localSize.h, handle };

    const handleMove = (ev: PointerEvent) => {
      const dx = ev.clientX - resizeRef.current.startX;
      const dy = ev.clientY - resizeRef.current.startY;
      const h = resizeRef.current.handle;
      let newW = resizeRef.current.origW;
      let newH = resizeRef.current.origH;

      if (h.includes("e")) newW = Math.max(60, resizeRef.current.origW + dx);
      if (h.includes("s")) newH = Math.max(40, resizeRef.current.origH + dy);
      if (h.includes("w")) newW = Math.max(60, resizeRef.current.origW - dx);
      if (h.includes("n")) newH = Math.max(40, resizeRef.current.origH - dy);

      // Clamp to floor bounds
      newW = Math.min(newW, floorWidth - localPos.x);
      newH = Math.min(newH, floorHeight - localPos.y);

      setLocalSize({ w: newW, h: newH });
    };

    const handleUp = () => {
      setIsResizing(false);
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      setLocalSize(size => {
        onUpdate(zone.id, { width: size.w, height: size.h });
        return size;
      });
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
  }, [readOnly, localSize, localPos, floorWidth, floorHeight, zone.id, onUpdate]);

  const MIN_HANDLE = 10;
  const handleStyle = (cursor: string): React.CSSProperties => ({
    position: "absolute",
    width: MIN_HANDLE,
    height: MIN_HANDLE,
    background: isDragging || isResizing ? "var(--primary)" : "transparent",
    border: "2px solid var(--primary)",
    borderRadius: 2,
    cursor,
    zIndex: 3,
    transition: "background 0.15s",
  });

  return (
    <div
      onPointerDown={handleDragStart}
      onMouseEnter={() => !readOnly && setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        position: "absolute",
        left: localPos.x,
        top: localPos.y,
        width: localSize.w,
        height: localSize.h,
        border: `2px dashed ${(isDragging || isResizing || showActions) ? "var(--primary)" : "rgba(100,100,100,0.25)"}`,
        background: zone.color || "rgba(0,0,0,0.03)",
        borderRadius: 6,
        cursor: readOnly ? "default" : (isDragging ? "grabbing" : "grab"),
        zIndex: isDragging || isResizing ? 5 : 0,
        transition: isDragging || isResizing ? "none" : "border-color 0.2s",
        userSelect: "none",
      }}
    >
      {/* Zone Name — top-left */}
      <div
        style={{ position: "absolute", top: 4, left: 6, zIndex: 2 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <ZoneName
          name={zone.name}
          readOnly={readOnly}
          onChange={(newName) => onUpdate(zone.id, { name: newName })}
        />
      </div>

      {/* Dimension label during drag/resize */}
      {(isDragging || isResizing) && (
        <div style={{
          position: "absolute",
          bottom: -22,
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--primary)",
          color: "white",
          fontSize: 10,
          padding: "2px 6px",
          borderRadius: 4,
          whiteSpace: "nowrap",
          zIndex: 10,
          fontWeight: 600,
        }}>
          {Math.round(localSize.w)} × {Math.round(localSize.h)}
          {isDragging && ` @ (${Math.round(localPos.x)}, ${Math.round(localPos.y)})`}
        </div>
      )}

      {/* Delete button — top-right */}
      {showActions && !readOnly && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(zone.id); }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#ef4444",
            color: "white",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: "bold",
            lineHeight: 1,
            zIndex: 3,
          }}
          title="Delete zone"
        >
          ×
        </button>
      )}

      {/* Resize Handles — only if not readOnly and hovering */}
      {!readOnly && showActions && (
        <>
          {/* Bottom-right */}
          <div onPointerDown={(e) => handleResizeStart(e, "se")} style={{ ...handleStyle("nwse-resize"), bottom: -5, right: -5 }} />
          {/* Bottom-left */}
          <div onPointerDown={(e) => handleResizeStart(e, "sw")} style={{ ...handleStyle("nesw-resize"), bottom: -5, left: -5 }} />
          {/* Top-right */}
          <div onPointerDown={(e) => handleResizeStart(e, "ne")} style={{ ...handleStyle("nesw-resize"), top: -5, right: -5 }} />
          {/* Top-left */}
          <div onPointerDown={(e) => handleResizeStart(e, "nw")} style={{ ...handleStyle("nwse-resize"), top: -5, left: -5 }} />
          {/* Right edge */}
          <div onPointerDown={(e) => handleResizeStart(e, "e")} style={{ position: "absolute", top: "20%", right: -4, width: 6, height: "60%", cursor: "ew-resize", zIndex: 3 }} />
          {/* Bottom edge */}
          <div onPointerDown={(e) => handleResizeStart(e, "s")} style={{ position: "absolute", left: "20%", bottom: -4, width: "60%", height: 6, cursor: "ns-resize", zIndex: 3 }} />
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════
   Main TableMap2D Component
   ══════════════════════════════════════════════ */
export const TableMap2D: React.FC<TableMap2DProps> = ({
  layout,
  onLayoutChange,
  onTableClick,
  onTablePositionChange,
  onTableMerge,
  onTableResize,
  onAddZone,
  renderTableContent,
  readOnly = false,
  selectedTableId,
}) => {
  const [showGrid, setShowGrid] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const activeFloor = layout.floors.find((f) => f.id === layout.activeFloorId);

  if (!activeFloor) {
    return <div>No active floor selected</div>;
  }

  const handleFloorSwitch = (floorId: string) => {
    onLayoutChange({
      ...layout,
      activeFloorId: floorId,
    });
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeFloor) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        const img = new window.Image();
        img.onload = () => {
          const updatedFloors = layout.floors.map(f => {
            if (f.id === activeFloor.id) {
              return {
                ...f,
                backgroundImage: base64Url,
                width: Math.max(f.width, img.width),
                height: Math.max(f.height, img.height)
              };
            }
            return f;
          });
          onLayoutChange({ ...layout, floors: updatedFloors });
        };
        img.src = base64Url;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTableDragEnd = (
    tableId: string,
    newPosition: { x: number; y: number },
  ) => {
    const table = activeFloor.tables.find(t => t.id === tableId);
    if (!table) return;

    const tableW = table.width || 80;
    const tableH = table.height || 80;

    let x = Math.max(0, newPosition.x);
    let y = Math.max(0, newPosition.y);

    let newWidth = activeFloor.width;
    let newHeight = activeFloor.height;
    let layoutChanged = false;

    if (x + tableW > activeFloor.width) {
      newWidth = x + tableW + 50;
      layoutChanged = true;
    }
    if (y + tableH > activeFloor.height) {
      newHeight = y + tableH + 50;
      layoutChanged = true;
    }

    if (layoutChanged) {
      const updatedFloors = layout.floors.map(f => {
        if (f.id === activeFloor.id) {
          return { ...f, width: newWidth, height: newHeight };
        }
        return f;
      });
      onLayoutChange({ ...layout, floors: updatedFloors });
    }

    // Collision detection (merge check)
    let merged = false;
    const sourceCenterX = x + tableW / 2;
    const sourceCenterY = y + tableH / 2;

    for (const targetTable of activeFloor.tables) {
      if (targetTable.id === tableId) continue;

      const targetW = targetTable.width || 80;
      const targetH = targetTable.height || 80;
      const targetCenterX = targetTable.position.x + targetW / 2;
      const targetCenterY = targetTable.position.y + targetH / 2;

      const dx = sourceCenterX - targetCenterX;
      const dy = sourceCenterY - targetCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const threshold = (Math.min(tableW, tableH) + Math.min(targetW, targetH)) / 5;

      if (distance < threshold && onTableMerge) {
        onTableMerge(tableId, targetTable.id);
        merged = true;
        break;
      }
    }

    if (!merged) {
      const centerX = x + tableW / 2;
      const centerY = y + tableH / 2;

      const matchedZone = activeFloor.zones?.find(zone =>
        centerX >= zone.x &&
        centerX <= zone.x + zone.width &&
        centerY >= zone.y &&
        centerY <= zone.y + zone.height
      );

      onTablePositionChange(tableId, {
        x,
        y,
        zoneId: matchedZone?.id
      });
    }
  };

  /* ─── Zone update handler ─── */
  const handleZoneUpdate = (zoneId: string, updates: Partial<Zone>) => {
    const updatedFloors = layout.floors.map(f => {
      if (f.id === activeFloor.id) {
        return {
          ...f,
          zones: f.zones.map(z => z.id === zoneId ? { ...z, ...updates } : z),
        };
      }
      return f;
    });
    onLayoutChange({ ...layout, floors: updatedFloors });
  };

  /* ─── Zone delete handler ─── */
  const handleZoneDelete = (zoneId: string) => {
    const updatedFloors = layout.floors.map(f => {
      if (f.id === activeFloor.id) {
        return {
          ...f,
          zones: f.zones.filter(z => z.id !== zoneId),
        };
      }
      return f;
    });
    onLayoutChange({ ...layout, floors: updatedFloors });
  };

  const floorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Floor Switcher & Toolbar */}
      <div className="flex items-center justify-between bg-[var(--card)] p-2 rounded-lg border border-[var(--border)]">
        <div className="flex items-center gap-2 overflow-x-auto">
          {layout.floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => handleFloorSwitch(floor.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${layout.activeFloorId === floor.id
                ? "bg-[var(--primary)] text-white shadow-md"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-base)] hover:text-[var(--text)]"
                }`}
            >
              {floor.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Upload Button */}
          {!readOnly && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg"
                onChange={handleBackgroundImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--primary)] bg-[var(--primary-soft)] rounded-md hover:opacity-80 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {t("dashboard.tables.map.upload_floorplan")}
              </button>
            </>
          )}

          {/* Add Zone Button */}
          {!readOnly && onAddZone && (
            <button
              onClick={onAddZone}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] bg-[var(--card)] border border-dashed border-[var(--border)] rounded-md hover:text-[var(--text)] hover:bg-[var(--bg-base)] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              {t("dashboard.tables.add_zone")}
            </button>
          )}

          {/* Grid Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            <span className="text-sm text-[var(--text-muted)]">{t("dashboard.tables.map.show_grid")}</span>
          </label>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 overflow-auto bg-[var(--bg-base)] border border-[var(--border)] rounded-xl relative p-8 flex justify-center items-start">
        {/* The Floor Canvas */}
        <div
          ref={floorRef}
          className="relative shadow-lg transition-all duration-300"
          style={{
            width: activeFloor.width,
            height: activeFloor.height,
            backgroundColor: "white",
            backgroundImage: activeFloor.backgroundImage ? `url(${activeFloor.backgroundImage})` : undefined,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            border: activeFloor.backgroundImage ? "none" : "1px solid var(--border)",
            borderRadius: 8,
          }}
        >
          {/* Grid Overlay */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundSize: "20px 20px",
                backgroundImage: `
                            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
                        `,
                zIndex: 0
              }}
            />
          )}

          {/* Zones Layer — Interactive */}
          {activeFloor.zones?.map(zone => (
            <InteractiveZone
              key={zone.id}
              zone={zone}
              readOnly={readOnly}
              floorWidth={activeFloor.width}
              floorHeight={activeFloor.height}
              onUpdate={handleZoneUpdate}
              onDelete={readOnly ? undefined : handleZoneDelete}
            />
          ))}

          {/* Tables */}
          {activeFloor.tables.map((table) => (
            <DraggableTable
              key={table.id}
              table={table}
              onDragEnd={handleTableDragEnd}
              onClick={onTableClick}
              onResize={!readOnly ? onTableResize : undefined}
              draggable={!readOnly}
              renderContent={renderTableContent}
            />
          ))}
        </div>
      </div>

      {/* Floor Info Footer */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
        <div>
          {t("dashboard.tables.map.floor_dimensions")}: {activeFloor.width}px × {activeFloor.height}px
        </div>
        <div className="flex items-center gap-3">
          {(activeFloor.zones?.length || 0) > 0 && (
            <span>{activeFloor.zones.length} {t("dashboard.tables.map.zones")}</span>
          )}
          <span>{activeFloor.tables.length} {t("dashboard.tables.map.tables_on_floor")}</span>
        </div>
      </div>
    </div>
  );
};
