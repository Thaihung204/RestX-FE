"use client";

import React, { useState } from "react";
import { DraggableTable, TableData } from "./DraggableTable";

export interface MapMarker {
  id: string;
  label: string;
  position: { x: number; y: number };
  style?: React.CSSProperties;
}

export interface ZoneBoundary {
  id: string;
  label: string;
  y: number;
  height: number;
}

interface TableMap2DProps {
  tables: TableData[];
  onTableClick: (table: TableData) => void;
  onTablePositionChange: (
    tableId: string,
    position: { x: number; y: number },
  ) => void;
  height?: number;
  showGrid?: boolean;
  readOnly?: boolean;
  selectedTableId?: string;
  filter?: {
    floor?: string;
    status?: string;
  };
  renderTableContent?: (table: TableData) => React.ReactNode;
  mapMarkers?: MapMarker[];
  zones?: ZoneBoundary[];
  onZoneRename?: (oldName: string, newName: string) => void;
  onZoneReorder?: (startIndex: number, endIndex: number) => void;
  onTableMerge?: (sourceTableId: string, targetTableId: string) => void;
  onZoneDelete?: (zoneId: string) => void;
}

const TABLE_SIZE = 100; // Fixed size from DraggableTable

export const TableMap2D: React.FC<TableMap2DProps> = ({
  tables,
  onTableClick,
  onTablePositionChange,
  height = 600,
  showGrid: initialShowGrid = true,
  readOnly = false,
  selectedTableId,
  filter,
  renderTableContent,
  mapMarkers = [],
  zones = [],
  onZoneRename,
  onZoneReorder,
  onTableMerge,
  onZoneDelete,
}) => {
  const [showGrid, setShowGrid] = useState(initialShowGrid);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [draggingZoneId, setDraggingZoneId] = useState<string | null>(null);

  // Filter tables based on props
  const filteredTables = React.useMemo(() => {
    return tables.filter((table) => {
      if (
        filter?.floor &&
        filter.floor !== "all" &&
        table.area !== filter.floor
      )
        return false;
      return true;
    });
  }, [tables, filter]);

  const handleTableDragEnd = (
    tableId: string,
    newPosition: { x: number; y: number },
  ) => {
    const sourceTable = tables.find((t) => t.id === tableId);
    if (!sourceTable) return;

    let merged = false;

    for (const targetTable of tables) {
      if (targetTable.id === tableId) continue;

      // Calculate center distance
      const dx =
        newPosition.x +
        TABLE_SIZE / 2 -
        (targetTable.position.x + TABLE_SIZE / 2);
      const dy =
        newPosition.y +
        TABLE_SIZE / 2 -
        (targetTable.position.y + TABLE_SIZE / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Merge threshold: Overlap > 30% (distance < 70)
      if (distance < 70) {
        if (onTableMerge) {
          onTableMerge(tableId, targetTable.id);
          merged = true;
          break;
        }
      }
    }

    if (merged) {
      return;
    }

    // Always allow move if not merged (no collision blocking)
    // This solves "can't drag into zone" because it was likely hitting invisible collision barriers or logic bugs
    onTablePositionChange(tableId, newPosition);
  };

  const handleZoneDragStart = (
    e: React.DragEvent,
    index: number,
    zoneId: string,
  ) => {
    e.dataTransfer.setData("text/plain", index.toString());
    setDraggingZoneId(zoneId);
  };

  const handleZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleZoneDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    setDraggingZoneId(null);
    if (dragIndex !== dropIndex && onZoneReorder) {
      onZoneReorder(dragIndex, dropIndex);
    }
  };

  const startEditing = (zone: ZoneBoundary) => {
    if (readOnly) return;
    setEditingZoneId(zone.id);
    setEditValue(zone.label); // Assuming label is the display name
  };

  const saveZoneName = () => {
    if (editingZoneId && editValue.trim() && onZoneRename) {
      // Find the original name (id in this case is the area name)
      onZoneRename(editingZoneId, editValue.trim());
    }
    setEditingZoneId(null);
  };

  return (
    <div>
      {/* Grid Toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 12,
        }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}>
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Show Grid
          </span>
        </label>
      </div>

      {/* Canvas */}
      <div
        style={{
          borderRadius: 12,
          border: "1px solid var(--border)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          overflow: "hidden",
          position: "relative",
          height,
          background: showGrid
            ? `
                linear-gradient(90deg, var(--border) 1px, transparent 1px),
                linear-gradient(180deg, var(--border) 1px, transparent 1px),
                var(--card)
              `
            : "var(--card)",
          backgroundSize: showGrid ? "20px 20px" : "auto",
          backgroundPosition: "0 0",
        }}>
        {/* Zones (Backgrounds & Headers) */}
        {zones.map((zone, index) => (
          <div
            key={zone.id}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.stopPropagation();
              handleZoneDrop(e, index);
            }}
            style={{
              position: "absolute",
              top: zone.y,
              left: 0,
              right: 0,
              height: zone.height,
              border: "1px solid var(--border)", // Changed to solid border for card look
              borderRadius: 12, // Rounded corners
              backgroundColor:
                draggingZoneId === zone.id
                  ? "rgba(0,0,0,0.05)"
                  : "rgba(255,255,255,0.02)", // Subtle fill
              zIndex: 1,
              transition: "all 0.2s",
              userSelect: "none",
            }}>
            {/* Draggable Zone Header */}
            <div
              draggable={!readOnly && !editingZoneId}
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.effectAllowed = "move";
                handleZoneDragStart(e, index, zone.id);
              }}
              style={{
                height: 40,
                borderBottom: "1px solid var(--border)",
                background: "rgba(0,0,0,0.02)",
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                cursor: readOnly || editingZoneId ? "default" : "grab",
                borderTopLeftRadius: 11,
                borderTopRightRadius: 11,
                gap: 12,
              }}>
              {/* Drag Icon */}
              {!readOnly && (
                <div style={{ color: "var(--text-muted)", display: "flex" }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2">
                    <path d="M8 6h13" />
                    <path d="M8 12h13" />
                    <path d="M8 18h13" />
                    <path d="M3 6h.01" />
                    <path d="M3 12h.01" />
                    <path d="M3 18h.01" />
                  </svg>
                </div>
              )}

              {/* Zone Title (Editable) */}
              <div style={{ flex: 1 }}>
                {editingZoneId === zone.id ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveZoneName}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveZoneName();
                      if (e.key === "Escape") setEditingZoneId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onDragStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }} // Prevent drag when editing
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "var(--text)",
                      background: "var(--bg-base)",
                      border: "1px solid var(--primary)",
                      borderRadius: 4,
                      padding: "2px 8px",
                      outline: "none",
                      width: "100%",
                      maxWidth: 200,
                    }}
                  />
                ) : (
                  <div
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startEditing(zone);
                    }}
                    title={
                      readOnly
                        ? ""
                        : "Double click to rename, Drag header to reorder"
                    }
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "var(--text)",
                      opacity: 0.9,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      justifyContent: "space-between",
                      width: "100%",
                    }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {zone.label}
                      {!readOnly && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{ opacity: 0.2, cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(zone);
                          }}>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      )}
                    </div>

                    {/* Delete Button */}
                    {!readOnly && onZoneDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onZoneDelete(zone.id);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          padding: 4,
                          display: "flex",
                          alignItems: "center",
                          borderRadius: 4,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--primary)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--text-muted)")
                        }
                        title="Delete Zone">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2">
                          <path d="M18 6L6 18" />
                          <path d="M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Map Markers for non-area items */}
        {mapMarkers.map((marker) => (
          <div
            key={marker.id}
            style={{
              position: "absolute",
              left: marker.position.x,
              top: marker.position.y,
              pointerEvents: "none",
              zIndex: 0,
              ...marker.style,
            }}>
            {marker.label}
          </div>
        ))}

        {filteredTables.map((table) => (
          <DraggableTable
            key={table.id}
            table={table}
            onDragEnd={handleTableDragEnd}
            onClick={onTableClick}
            draggable={!readOnly}
            renderContent={renderTableContent}
          />
        ))}
      </div>

      {/* Instructions */}
      <div
        style={{
          marginTop: 12,
          padding: "8px 12px",
          background: "rgba(24, 144, 255, 0.1)",
          border: "1px solid rgba(24, 144, 255, 0.3)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1890ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M15 2a6 6 0 0 1 0 12H9a6 6 0 0 1 0-12h6z" />
        </svg>
        <p style={{ fontSize: 12, color: "#1890ff", margin: 0 }}>
          <strong>Tip:</strong> Drag tables to arrange your floor plan. Click on
          a table to view details.
        </p>
      </div>
    </div>
  );
};
