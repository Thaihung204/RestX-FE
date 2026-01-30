"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TableMap2D } from "./components/TableMap2D";
import { TableData as Map2DTableData } from "./components/DraggableTable";
import { TableDetailsDrawer } from "./components/TableDetailsDrawer";
import { AddTableModal } from "./components/AddTableModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";

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
  const { t } = useTranslation("common");
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
      color: "bg-[#FF380B]",
      text: t("dashboard.tables.status.occupied"),
      badge: "bg-[#FF380B]/10 text-[#FF380B] border-[#FF380B]/20",
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

  // Convert tables to Map2D format
  const map2DTables: Map2DTableData[] = tables.map((table, index) => ({
    id: table.id,
    tenantId: 'tenant-1',
    name: `Table ${table.number}`,
    seats: table.capacity,
    status: table.status === 'available' ? 'AVAILABLE' :
      table.status === 'occupied' ? 'OCCUPIED' :
        table.status === 'reserved' ? 'RESERVED' : 'DISABLED',
    area: table.area,
    position: {
      x: 40 + (index % 5) * 130,
      y: 40 + Math.floor(index / 5) * 130
    },
  }));


  // Map2D handlers
  const handleMap2DTableClick = (table: Map2DTableData) => {
    // Find the corresponding table from the tables array
    const foundTable = tables.find(t => t.id === table.id);
    if (foundTable) {
      setSelectedTable(foundTable);
      setDrawerOpen(true);
    }
  };

  const handleMap2DTablePositionChange = (tableId: string, position: { x: number; y: number }) => {
    console.log(`Table ${tableId} moved to`, position);
    // You can save the position to backend here
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
      number: parseInt(formData.get('number') as string),
      capacity: parseInt(formData.get('capacity') as string),
      area: formData.get('area') as "VIP" | "Indoor" | "Outdoor",
      status: 'available',
    };
    setTables([...tables, newTable]);
    setAddModalOpen(false);
  };

  const handleUpdateTable = (values: Partial<Table>) => {
    if (selectedTable) {
      setTables(tables.map(t =>
        t.id === selectedTable.id ? { ...t, ...values } : t
      ));
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
      setTables(tables.filter(t => t.id !== selectedTable.id));
      setDeleteConfirmOpen(false);
      setDrawerOpen(false);
      setSelectedTable(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-base)]">
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                {t("dashboard.tables.title")}
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>
                {t("dashboard.tables.subtitle")}
              </p>
            </div>
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2 text-white rounded-lg font-medium transition-all"
              style={{ background: '#FF380B' }}
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

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className="rounded-xl p-4"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.tables.stats.total_tables")}
                  </p>
                  <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text)' }}>
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
                background: 'var(--card)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
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
                background: 'var(--card)',
                border: '1px solid rgba(255, 56, 11, 0.2)',
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.tables.stats.occupied")}
                  </p>
                  <p className="text-3xl font-bold mt-1" style={{ color: '#FF380B' }}>
                    {tables.filter((t) => t.status === "occupied").length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 56, 11, 0.1)' }}>
                  <svg
                    className="w-6 h-6"
                    style={{ color: '#FF380B' }}
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
                background: 'var(--card)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
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

          {/* View Mode Toggle */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              View:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "grid" ? "shadow-sm" : ""
                  }`}
                style={{
                  background: viewMode === "grid" ? '#FF380B' : 'var(--card)',
                  color: viewMode === "grid" ? '#fff' : 'var(--text-muted)',
                  border: viewMode === "grid" ? 'none' : '1px solid var(--border)',
                }}
              >
                <svg
                  className="w-4 h-4 inline-block mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                Grid View
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "map" ? "shadow-sm" : ""
                  }`}
                style={{
                  background: viewMode === "map" ? '#FF380B' : 'var(--card)',
                  color: viewMode === "map" ? '#fff' : 'var(--text-muted)',
                  border: viewMode === "map" ? 'none' : '1px solid var(--border)',
                }}
              >
                <svg
                  className="w-4 h-4 inline-block mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                2D Map
              </button>
            </div>
          </div>

          {/* Tables Grid */}
          {viewMode === "grid" && (
            <div
              className="rounded-xl p-6"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>
                {t("dashboard.tables.title")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className="rounded-xl p-4 transition-all"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                          Table {table.number}
                        </h4>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {table.area} {t("dashboard.tables.card.area")}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[table.status].badge
                          }`}>
                        {statusConfig[table.status].text}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
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
                        <span>{t("dashboard.tables.card.capacity", { count: table.capacity })}</span>
                      </div>
                      {table.currentOrder && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: '#FF380B' }}>
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
                          <span>{t("dashboard.tables.card.order")}: {table.currentOrder}</span>
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
                          <span>{t("dashboard.tables.card.reserved_at")} {table.reservationTime}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{ backgroundColor: 'rgba(255, 56, 11, 0.1)', color: '#FF380B' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 56, 11, 0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 56, 11, 0.1)'; }}
                        suppressHydrationWarning>
                        {t("dashboard.tables.card.view_details")}
                      </button>
                      <button
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: 'var(--surface)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
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

          {/* 2D Map View */}
          {viewMode === "map" && (
            <div>
              <TableMap2D
                tables={map2DTables}
                onTableClick={handleMap2DTableClick}
                onTablePositionChange={handleMap2DTablePositionChange}
                height={600}
                showGrid={true}
              />
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteConfirmOpen}
        tableName={selectedTable?.number || 0}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </div >
  );
}
