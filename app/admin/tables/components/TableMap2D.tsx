"use client";

import React, { useState, useRef, useCallback } from "react";
import { DraggableTable, TableData } from "./DraggableTable";
import { useTranslation } from "react-i18next";

export interface Floor {
  id: string;
  name: string;
  backgroundImage?: string;
  width: number;
  height: number;
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
  renderTableContent?: (table: TableData) => React.ReactNode;
  readOnly?: boolean;
  selectedTableId?: string;
}

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
  renderTableContent,
  readOnly = false,
  selectedTableId,
}) => {
  const [showGrid, setShowGrid] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const floorRef = useRef<HTMLDivElement>(null);

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
      onTablePositionChange(tableId, {
        x,
        y,
      });
    }
  };

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
          <span>{activeFloor.tables.length} {t("dashboard.tables.map.tables_on_floor")}</span>
        </div>
      </div>
    </div>
  );
};
