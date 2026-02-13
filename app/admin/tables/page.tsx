"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AddAreaModal } from "./components/AddAreaModal";
import { AddTableModal } from "./components/AddTableModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { TableData as Map2DTableData } from "./components/DraggableTable";
import { TableDetailsDrawer } from "./components/TableDetailsDrawer";
import { TableMap2D } from "./components/TableMap2D";

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  area: "VIP" | "Indoor" | "Outdoor";
  currentOrder?: string;
  reservationTime?: string;
}

type ViewMode = "grid" | "map";

export default function TablesPage() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tables, setTables] = useState<Table[]>([
    {
      id: "1",
      number: 1,
      capacity: 4,
      status: "occupied",
      area: "VIP",
      currentOrder: "#ORD-001",
    },
    {
      id: "2",
      number: 2,
      capacity: 6,
      status: "reserved",
      area: "VIP",
      reservationTime: "19:00",
    },
    { id: "3", number: 3, capacity: 4, status: "available", area: "VIP" },
    {
      id: "4",
      number: 4,
      capacity: 2,
      status: "occupied",
      area: "Indoor",
      currentOrder: "#ORD-002",
    },
    { id: "5", number: 5, capacity: 4, status: "available", area: "Indoor" },
    { id: "6", number: 6, capacity: 4, status: "cleaning", area: "Indoor" },
    {
      id: "7",
      number: 7,
      capacity: 6,
      status: "reserved",
      area: "Indoor",
      reservationTime: "20:00",
    },
    { id: "8", number: 8, capacity: 4, status: "available", area: "Outdoor" },
    {
      id: "9",
      number: 9,
      capacity: 2,
      status: "occupied",
      area: "Outdoor",
      currentOrder: "#ORD-003",
    },
  ]);

  const statusConfig = {
    available: {
      color: "bg-green-500",
      text: t("dashboard.tables.status.available"),
      badge: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    occupied: {
      color: "bg-[var(--primary)]",
      text: t("dashboard.tables.status.occupied"),
      badge:
        "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary-border)]",
    },
    reserved: {
      color: "bg-blue-500",
      text: t("dashboard.tables.status.reserved"),
      badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    cleaning: {
      color: "bg-red-500",
      text: t("dashboard.tables.status.cleaning"),
      badge: "bg-red-500/10 text-red-500 border-red-500/20",
    },
  };

  /* State for Map Layout - Added availableAreas */
  const [availableAreas, setAvailableAreas] = useState<string[]>([
    "VIP",
    "Indoor",
    "Outdoor",
  ]);
  /* Add Area Modal State */
  const [addAreaModalOpen, setAddAreaModalOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);

  // Convert tables to Map2D format
  // Calculate map layout (positions and markers) with useMemo
  const { map2DTables, mapMarkers, mapHeight, zones } = useMemo(() => {
    const markers: {
      id: string;
      label: string;
      position: { x: number; y: number };
      style?: React.CSSProperties;
    }[] = [];
    const mappedTables: Map2DTableData[] = [];
    const calculatedZones: {
      id: string;
      label: string;
      y: number;
      height: number;
    }[] = [];

    // Use availableAreas for order and completeness
    const areas = availableAreas;

    let currentY = 40;
    const itemsPerRow = 5;
    const itemWidth = 130;
    const itemHeight = 130;

    areas.forEach((area) => {
      // Find all tables in this area
      const areaTables = tables.filter((t) => t.area === area);

      const rows = Math.max(1, Math.ceil(areaTables.length / itemsPerRow));
      const sectionHeight = rows * itemHeight + 60; // 60px padding/header

      // Add Zone Boundary
      calculatedZones.push({
        id: area,
        label: t(`dashboard.table_status.areas.${area.toLowerCase()}`, {
          defaultValue: area,
        }),
        y: currentY - 20, // Start slightly above text
        height: sectionHeight + 20,
      });

      // Position tables for this area
      areaTables.forEach((table, index) => {
        mappedTables.push({
          id: table.id,
          tenantId: "tenant-1",
          name: t("dashboard.tables.card.table_name", { number: table.number }),
          seats: table.capacity,
          status:
            table.status === "available"
              ? "AVAILABLE"
              : table.status === "occupied"
                ? "OCCUPIED"
                : table.status === "reserved"
                  ? "RESERVED"
                  : "DISABLED",
          area: table.area,
          position: {
            x: 40 + (index % itemsPerRow) * itemWidth,
            y: currentY + 40 + Math.floor(index / itemsPerRow) * itemHeight,
          },
        });
      });

      // Update Y for next area
      currentY += sectionHeight + 40; // Gap between areas
    });

    return {
      map2DTables: mappedTables,
      mapMarkers: markers,
      mapHeight: Math.max(600, currentY + 50),
      zones: calculatedZones,
    };
  }, [tables, t, availableAreas]);

  // Map2D handlers
  const handleMap2DTableClick = (table: Map2DTableData) => {
    // Find the corresponding table from the tables array
    const foundTable = tables.find((t) => t.id === table.id);
    if (foundTable) {
      setSelectedTable(foundTable);
      setDrawerOpen(true);
    }
  };

  const handleMap2DTablePositionChange = (
    tableId: string,
    position: { x: number; y: number },
  ) => {
    // Calculate center of the table (assuming ~100px height)
    const yCenter = position.y + 50;

    // Check if dropped into a different zone using center point
    const droppedZone = zones.find(
      (z) => yCenter >= z.y && yCenter <= z.y + z.height,
    );

    if (droppedZone) {
      const table = tables.find((t) => t.id === tableId);
      if (table && table.area !== droppedZone.id) {
        // Update table area
        setTables((prev) =>
          prev.map((t) =>
            t.id === tableId ? { ...t, area: droppedZone.id as any } : t,
          ),
        );
        console.log(`Moved table ${tableId} to ${droppedZone.id}`);
      }
    }
  };

  const handleZoneReorder = (startIndex: number, endIndex: number) => {
    const newAreas = [...availableAreas];
    const [removed] = newAreas.splice(startIndex, 1);
    newAreas.splice(endIndex, 0, removed);
    setAvailableAreas(newAreas);
  };

  const handleZoneRename = (oldName: string, newName: string) => {
    if (oldName === newName) return;

    // Update availableAreas
    setAvailableAreas((prev) => prev.map((a) => (a === oldName ? newName : a)));

    // Update tables in that area
    setTables((prev) =>
      prev.map((t) =>
        t.area === oldName ? { ...t, area: newName as any } : t,
      ),
    );
  };

  const handleTableMerge = (sourceTableId: string, targetTableId: string) => {
    setTables((prev) => {
      const sourceTable = prev.find((t) => t.id === sourceTableId);
      const targetTable = prev.find((t) => t.id === targetTableId);

      if (!sourceTable || !targetTable) return prev;

      // Create merged table
      const newCapacity = sourceTable.capacity + targetTable.capacity;

      // Remove source table and update target table
      return prev
        .filter((t) => t.id !== sourceTableId)
        .map((t) =>
          t.id === targetTableId ? { ...t, capacity: newCapacity } : t,
        );
    });
  };

  const handleZoneDelete = (zoneId: string) => {
    if (availableAreas.length <= 1) {
      alert(t("dashboard.tables.errors.cannot_delete_last_area"));
      return;
    }
    setZoneToDelete(zoneId);
  };

  const confirmDeleteZone = () => {
    if (zoneToDelete) {
      // Remove area
      setAvailableAreas((prev) => prev.filter((area) => area !== zoneToDelete));

      // Move tables to the first available area (or default 'Indoor')
      const fallbackArea =
        availableAreas.find((a) => a !== zoneToDelete) || "Indoor";
      setTables((prev) =>
        prev.map((t) =>
          t.area === zoneToDelete ? { ...t, area: fallbackArea as any } : t,
        ),
      );

      setZoneToDelete(null);
    }
  };

  const handleAddArea = (name: string) => {
    if (!availableAreas.includes(name)) {
      setAvailableAreas([...availableAreas, name]);
      setAddAreaModalOpen(false);
    }
  };

  // CRUD Handlers
  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setDrawerOpen(true);
  };

  const handleAddTable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTable: Table = {
      id: `${Date.now()}`,
      number: parseInt(formData.get("number") as string),
      capacity: parseInt(formData.get("capacity") as string),
      area: formData.get("area") as "VIP" | "Indoor" | "Outdoor",
      status: "available",
    };
    setTables([...tables, newTable]);
    setAddModalOpen(false);
  };

  const handleUpdateTable = (values: Partial<Table>) => {
    if (selectedTable) {
      setTables(
        tables.map((t) =>
          t.id === selectedTable.id ? { ...t, ...values } : t,
        ),
      );
      setDrawerOpen(false);
    }
  };

  const handleDeleteTable = () => {
    if (selectedTable) {
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDelete = () => {
    if (selectedTable) {
      setTables(tables.filter((t) => t.id !== selectedTable.id));
      setDeleteConfirmOpen(false);
      setDrawerOpen(false);
      setSelectedTable(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-base)]">
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-3xl font-bold mb-2"
                style={{ color: "var(--text)" }}>
                {t("dashboard.tables.title")}
              </h2>
              <p style={{ color: "var(--text-muted)" }}>
                {t("dashboard.tables.subtitle")}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center bg-[var(--card)] p-1 rounded-lg border border-[var(--border)]">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === "grid"
                      ? "bg-[var(--bg-base)] shadow-sm text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === "map"
                      ? "bg-[var(--bg-base)] shadow-sm text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => setAddAreaModalOpen(true)}
                className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--text)] rounded-lg font-medium transition-all hover:bg-[var(--bg-base)]">
                + {t("dashboard.tables.add_area")}
              </button>
              <button
                onClick={() => setAddModalOpen(true)}
                className="px-4 py-2 text-white rounded-lg font-medium transition-all"
                style={{ background: "var(--primary)" }}
                suppressHydrationWarning>
                <svg
                  className="w-5 h-5 inline-block mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                {t("dashboard.tables.add_table")}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.tables.stats.total_tables")}
                  </p>
                  <p
                    className="text-3xl font-bold mt-1"
                    style={{ color: "var(--text)" }}>
                    {tables.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--card)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.tables.stats.available")}
                  </p>
                  <p className="text-3xl font-bold text-green-500 mt-1">
                    {tables.filter((t) => t.status === "available").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--card)",
                border: "1px solid rgba(255, 56, 11, 0.2)",
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.tables.stats.occupied")}
                  </p>
                  <p
                    className="text-3xl font-bold mt-1"
                    style={{ color: "var(--primary)" }}>
                    {tables.filter((t) => t.status === "occupied").length}
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "var(--primary-soft)" }}>
                  <svg
                    className="w-6 h-6"
                    style={{ color: "var(--primary)" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--card)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.tables.stats.reserved")}
                  </p>
                  <p className="text-3xl font-bold text-blue-500 mt-1">
                    {tables.filter((t) => t.status === "reserved").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 2D Map View */}
          {viewMode === "map" && (
            <div>
              <TableMap2D
                tables={map2DTables}
                onTableClick={handleMap2DTableClick}
                onTablePositionChange={handleMap2DTablePositionChange}
                height={mapHeight}
                showGrid={true}
                selectedTableId={selectedTable?.id}
                mapMarkers={mapMarkers}
                zones={zones}
                onZoneReorder={handleZoneReorder}
                onZoneRename={handleZoneRename}
                onTableMerge={handleTableMerge}
                onZoneDelete={handleZoneDelete}
                filter={{
                  floor: undefined,
                  status: "all",
                }}
                renderTableContent={(table) => {
                  const hasOrder =
                    table.status === "OCCUPIED" || table.status === "RESERVED";
                  return (
                    hasOrder && (
                      <div
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          background: "var(--primary)",
                          color: "white",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: "bold",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        }}>
                        !
                      </div>
                    )
                  );
                }}
              />
            </div>
          )}

          {/* Tables Grid */}
          {viewMode === "grid" && (
            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <h3
                className="text-xl font-bold mb-6"
                style={{ color: "var(--text)" }}>
                {t("dashboard.tables.title")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className="rounded-xl p-4 transition-all"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4
                          className="text-lg font-bold"
                          style={{ color: "var(--text)" }}>
                          {t("dashboard.tables.card.table_name", {
                            number: table.number,
                          })}
                        </h4>
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-muted)" }}>
                          {table.area} {t("dashboard.tables.card.area")}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          statusConfig[table.status].badge
                        }`}>
                        {statusConfig[table.status].text}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "var(--text-muted)" }}>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span>
                          {t("dashboard.tables.card.capacity", {
                            count: table.capacity,
                          })}
                        </span>
                      </div>
                      {table.currentOrder && (
                        <div
                          className="flex items-center gap-2 text-sm"
                          style={{ color: "var(--primary)" }}>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          <span>
                            {t("dashboard.tables.card.order")}:{" "}
                            {table.currentOrder}
                          </span>
                        </div>
                      )}
                      {table.reservationTime && (
                        <div className="flex items-center gap-2 text-sm text-blue-500">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            {t("dashboard.tables.card.reserved_at")}{" "}
                            {table.reservationTime}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          backgroundColor: "var(--primary-soft)",
                          color: "var(--primary)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(255, 56, 11, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(255, 56, 11, 0.1)";
                        }}
                        suppressHydrationWarning>
                        {t("dashboard.tables.card.view_details")}
                      </button>
                      <button
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: "var(--surface)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}
                        suppressHydrationWarning>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Table Details Drawer */}
      <TableDetailsDrawer
        open={drawerOpen}
        table={selectedTable}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTable(null);
        }}
        onSave={handleUpdateTable}
        onDelete={handleDeleteTable}
      />

      {/* Add Table Modal */}
      <AddTableModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddTable}
      />

      {/* Add Area Modal */}
      <AddAreaModal
        open={addAreaModalOpen}
        onClose={() => setAddAreaModalOpen(false)}
        onAdd={handleAddArea}
      />

      {/* Delete Confirmation Modal for Table */}
      <DeleteConfirmModal
        open={deleteConfirmOpen}
        itemName={selectedTable?.number || 0}
        itemType="Table"
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* Delete Confirmation Modal for Zone */}
      <DeleteConfirmModal
        open={!!zoneToDelete}
        itemName={zoneToDelete || ""}
        itemType="Area"
        onClose={() => setZoneToDelete(null)}
        onConfirm={confirmDeleteZone}
      />
    </div>
  );
}
