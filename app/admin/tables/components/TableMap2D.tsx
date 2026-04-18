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
  const MIN_ZOOM_SCALE = 0.8;
  const MAX_ZOOM_SCALE = 2.8;
  const [showGrid, setShowGrid] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const floorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoomScale, setZoomScale] = useState(1);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(1);
  const isPinchingRef = useRef(false);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const lastDoubleTapZoomRef = useRef<{ from: number; to: number } | null>(null);
  const panStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const panStartScrollRef = useRef<{ left: number; top: number } | null>(null);
  const pointerLastSampleRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const panVelocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const inertiaFrameRef = useRef<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const activeFloor = layout.floors.find((f) => f.id === layout.activeFloorId);
  const selectedSet = React.useMemo(() => new Set(selectedTableIds), [selectedTableIds]);
  const [hasFocused, setHasFocused] = useState(false);
  const canDragPan = readOnly;
  const scale = fitScale * zoomScale;

  const clampZoomScale = useCallback((next: number) => {
    return Math.min(MAX_ZOOM_SCALE, Math.max(MIN_ZOOM_SCALE, next));
  }, [MAX_ZOOM_SCALE, MIN_ZOOM_SCALE]);

  const stopInertia = useCallback(() => {
    if (inertiaFrameRef.current !== null) {
      window.cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
  }, []);

  const applyZoomAtClientPoint = useCallback((nextZoom: number, clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const anchorX = clientX - rect.left;
    const anchorY = clientY - rect.top;

    const prevScale = scale;
    const nextScale = fitScale * nextZoom;

    if (prevScale <= 0 || nextScale <= 0) {
      setZoomScale(nextZoom);
      return;
    }

    const worldX = (container.scrollLeft + anchorX) / prevScale;
    const worldY = (container.scrollTop + anchorY) / prevScale;

    setZoomScale(nextZoom);

    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      containerRef.current.scrollLeft = worldX * nextScale - anchorX;
      containerRef.current.scrollTop = worldY * nextScale - anchorY;
    });
  }, [fitScale, scale]);

  const startInertia = useCallback(() => {
    if (!containerRef.current) return;

    const friction = 0.92;
    const stopThreshold = 0.1;

    const tick = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;

      container.scrollLeft -= panVelocityRef.current.x;
      container.scrollTop -= panVelocityRef.current.y;

      panVelocityRef.current.x *= friction;
      panVelocityRef.current.y *= friction;

      if (
        Math.abs(panVelocityRef.current.x) < stopThreshold &&
        Math.abs(panVelocityRef.current.y) < stopThreshold
      ) {
        stopInertia();
        return;
      }

      inertiaFrameRef.current = window.requestAnimationFrame(tick);
    };

    stopInertia();
    inertiaFrameRef.current = window.requestAnimationFrame(tick);
  }, [stopInertia]);

  useEffect(() => {
    setHasFocused(false);
  }, [activeFloor?.id, selectedTableIds.join(',')]);

  useEffect(() => {
    setZoomScale(1);
  }, [activeFloor?.id]);

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
      // Fit within container; cap at 1 so we never upscale.
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
          setFitScale(finalScale);

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

      setFitScale(finalScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [activeFloor?.width, activeFloor?.height, activeFloor?.id, focusOnSelected, selectedSet, hasFocused]);

  const handleZoomIn = () => {
    if (!containerRef.current) return;
    lastDoubleTapZoomRef.current = null;
    const rect = containerRef.current.getBoundingClientRect();
    const next = clampZoomScale(zoomScale + 0.2);
    applyZoomAtClientPoint(next, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  const handleZoomOut = () => {
    if (!containerRef.current) return;
    lastDoubleTapZoomRef.current = null;
    const rect = containerRef.current.getBoundingClientRect();
    const next = clampZoomScale(zoomScale - 0.2);
    applyZoomAtClientPoint(next, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  const handleZoomReset = () => {
    lastDoubleTapZoomRef.current = null;
    setZoomScale(1);
  };

  const handleCanvasWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    lastDoubleTapZoomRef.current = null;
    const next = zoomScale + (event.deltaY < 0 ? 0.08 : -0.08);
    applyZoomAtClientPoint(clampZoomScale(next), event.clientX, event.clientY);
  };

  const getTouchDistance = (touches: React.TouchList) => {
    const [first, second] = [touches[0], touches[1]];
    if (!first || !second) return null;
    const dx = first.clientX - second.clientX;
    const dy = first.clientY - second.clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!canDragPan) return;

    if (event.touches.length !== 2) return;
    lastDoubleTapZoomRef.current = null;
    const distance = getTouchDistance(event.touches);
    if (!distance) return;
    isPinchingRef.current = true;
    stopInertia();
    pinchStartDistanceRef.current = distance;
    pinchStartZoomRef.current = zoomScale;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!canDragPan) return;

    if (event.touches.length !== 2 || !pinchStartDistanceRef.current) return;
    const nextDistance = getTouchDistance(event.touches);
    if (!nextDistance) return;
    event.preventDefault();

    const ratio = nextDistance / pinchStartDistanceRef.current;
    const nextScale = clampZoomScale(pinchStartZoomRef.current * ratio);
    const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
    const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
    applyZoomAtClientPoint(nextScale, centerX, centerY);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!canDragPan) return;

    if (event.touches.length < 2) {
      pinchStartDistanceRef.current = null;
      isPinchingRef.current = false;
    }

    if (event.touches.length === 0 && event.changedTouches.length === 1 && !isPinchingRef.current) {
      const touch = event.changedTouches[0];
      const now = Date.now();
      const lastTap = lastTapRef.current;

      if (lastTap) {
        const dt = now - lastTap.time;
        const distance = Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y);
        if (dt < 280 && distance < 28) {
          const previousZoomState = lastDoubleTapZoomRef.current;
          const shouldToggleBack =
            !!previousZoomState &&
            Math.abs(zoomScale - previousZoomState.to) < 0.06;

          if (shouldToggleBack && previousZoomState) {
            const backToZoom = clampZoomScale(previousZoomState.from);
            applyZoomAtClientPoint(backToZoom, touch.clientX, touch.clientY);
            lastDoubleTapZoomRef.current = null;
          } else {
            const next = clampZoomScale(zoomScale + 0.35);
            applyZoomAtClientPoint(next, touch.clientX, touch.clientY);
            lastDoubleTapZoomRef.current = { from: zoomScale, to: next };
          }

          lastTapRef.current = null;
          return;
        }
      }

      lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canDragPan || !containerRef.current) return;
    if (isPinchingRef.current) return;

    if (event.pointerType === "mouse" && event.button !== 0) return;
    stopInertia();

    panStartPointRef.current = { x: event.clientX, y: event.clientY };
    panStartScrollRef.current = {
      left: containerRef.current.scrollLeft,
      top: containerRef.current.scrollTop,
    };
    pointerLastSampleRef.current = { x: event.clientX, y: event.clientY, time: performance.now() };
    panVelocityRef.current = { x: 0, y: 0 };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canDragPan || !isPanning || !containerRef.current) return;
    if (!panStartPointRef.current || !panStartScrollRef.current) return;
    if (isPinchingRef.current) return;

    const deltaX = event.clientX - panStartPointRef.current.x;
    const deltaY = event.clientY - panStartPointRef.current.y;

    containerRef.current.scrollLeft = panStartScrollRef.current.left - deltaX;
    containerRef.current.scrollTop = panStartScrollRef.current.top - deltaY;

    const now = performance.now();
    const last = pointerLastSampleRef.current;
    if (last) {
      const dt = Math.max(1, now - last.time);
      panVelocityRef.current = {
        x: (event.clientX - last.x) / dt * 16,
        y: (event.clientY - last.y) / dt * 16,
      };
    }
    pointerLastSampleRef.current = { x: event.clientX, y: event.clientY, time: now };
    event.preventDefault();
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canDragPan) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    panStartPointRef.current = null;
    panStartScrollRef.current = null;
    pointerLastSampleRef.current = null;
    setIsPanning(false);

    if (!isPinchingRef.current) {
      const speed = Math.hypot(panVelocityRef.current.x, panVelocityRef.current.y);
      if (speed > 0.8) {
        startInertia();
      }
    }
  };

  useEffect(() => {
    return () => {
      stopInertia();
    };
  }, [stopInertia]);

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
            <div className="flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] p-1">
              <button
                type="button"
                onClick={handleZoomOut}
                className="px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
                aria-label={t("dashboard.tables.map.zoom_out", { defaultValue: "Zoom out" })}
              >
                -
              </button>
              <span className="min-w-[48px] text-center text-xs tabular-nums text-[var(--text-muted)]">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
                aria-label={t("dashboard.tables.map.zoom_in", { defaultValue: "Zoom in" })}
              >
                +
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="px-2 py-1 text-xs font-semibold text-[var(--primary)]"
                aria-label={t("dashboard.tables.map.zoom_reset", { defaultValue: "Reset zoom" })}
              >
                {t("dashboard.tables.map.zoom_fit", { defaultValue: "Fit" })}
              </button>
            </div>

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
        style={{
          touchAction: canDragPan ? "none" : "pan-x pan-y",
          cursor: canDragPan ? (isPanning ? "grabbing" : "grab") : "default",
          userSelect: canDragPan && isPanning ? "none" : "auto",
        }}
        onWheel={handleCanvasWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
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
