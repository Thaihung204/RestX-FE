"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
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
  onBackgroundImageUpload?: (floorId: string, file: File) => void;
  renderTableContent?: (table: TableData) => React.ReactNode;
  readOnly?: boolean;
  selectedTableIds?: string[];
  hideControls?: boolean;
  focusOnSelected?: boolean;
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
  onBackgroundImageUpload,
  renderTableContent,
  readOnly = false,
  selectedTableIds = [],
  hideControls = false,
  focusOnSelected = false,
}) => {
  const [showGrid, setShowGrid] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const floorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const activeFloor = layout.floors.find((f) => f.id === layout.activeFloorId);
  const selectedSet = React.useMemo(() => new Set(selectedTableIds), [selectedTableIds]);
  const [hasFocused, setHasFocused] = useState(false);

  useEffect(() => {
    setHasFocused(false);
  }, [activeFloor?.id, selectedTableIds.join(',')]);

  // ── Auto-fit: scale canvas to fit container ──
  useEffect(() => {
    if (!containerRef.current || !activeFloor) return;

    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;
      // Available space minus padding (p-4 = 16px each side)
      const availW = container.clientWidth - 32;
      const availH = container.clientHeight - 32;
      if (availW <= 0 || availH <= 0) return;
      const scaleX = availW / activeFloor.width;
      const scaleY = availH / activeFloor.height;
      // Fit within container; cap at 1 so we never upscale
      let finalScale = Math.min(scaleX, scaleY, 1);

      if (focusOnSelected && selectedSet.size > 0) {
        const selectedTables = activeFloor.tables.filter(t => selectedSet.has(t.id));
        if (selectedTables.length > 0) {
          const minX = Math.min(...selectedTables.map(t => t.position.x));
          const maxX = Math.max(...selectedTables.map(t => t.position.x + (t.width || 80)));
          const minY = Math.min(...selectedTables.map(t => t.position.y));
          const maxY = Math.max(...selectedTables.map(t => t.position.y + (t.height || 80)));
          
          const boxW = maxX - minX;
          const boxH = maxY - minY;
          // Add tight padding (e.g. 75px on each side)
          const paddedW = boxW + 150;
          const paddedH = boxH + 150;
          
          finalScale = Math.min(availW / paddedW, availH / paddedH, 3.0);
          setScale(finalScale);

          // Scroll to center the bounding box exactly once
          if (!hasFocused) {
            setHasFocused(true);
            setTimeout(() => {
              if (containerRef.current) {
                const cx = ((minX + maxX) / 2) * finalScale;
                const cy = ((minY + maxY) / 2) * finalScale;
                containerRef.current.scrollTo({
                  left: Math.max(0, cx - availW / 2),
                  top: Math.max(0, cy - availH / 2),
                  behavior: 'smooth'
                });
              }
            }, 100);
          }
          return;
        }
      }

      setScale(finalScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [activeFloor?.width, activeFloor?.height, activeFloor?.id]);

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
      // Notify parent about the file for BE upload
      if (onBackgroundImageUpload) {
        onBackgroundImageUpload(activeFloor.id, file);
      }

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
      {!hideControls && (
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
                  className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
                >
                  <span className="material-symbols-outlined text-base">cloud_upload</span>
                  {t("dashboard.tables.map.upload_floorplan")}
                </button>
              </>
            )}
            {/* Grid Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
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
      )}

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-[var(--bg-base)] border border-[var(--border)] rounded-xl relative p-4 block"
      >
        {/* Scaled wrapper — preserves canvas coordinate system */}
        <div
          style={{
            width: activeFloor.width * scale,
            height: activeFloor.height * scale,
            flexShrink: 0,
            margin: '0 auto',
          }}
        >
          {/* The Floor Canvas — always renders at native resolution via transform */}
          <div
            ref={floorRef}
            className="relative shadow-lg"
            style={{
              width: activeFloor.width,
              height: activeFloor.height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
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
                table={{ ...table, status: selectedSet.has(table.id) ? "SELECTED" : table.status }}
                onDragEnd={handleTableDragEnd}
                onClick={onTableClick}
                onResize={!readOnly ? onTableResize : undefined}
                draggable={!readOnly}
                renderContent={renderTableContent}
                scale={scale}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floor Info Footer */}
      {!hideControls && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
          <div>
            {t("dashboard.tables.map.floor_dimensions")}: {activeFloor.width}px × {activeFloor.height}px
          </div>
          <div className="flex items-center gap-3">
            <span>{activeFloor.tables.length} {t("dashboard.tables.map.tables_on_floor")}</span>
          </div>
        </div>
      )}
    </div>
  );
};
