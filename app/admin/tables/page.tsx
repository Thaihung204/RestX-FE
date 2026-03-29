"use client";


import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AddAreaModal } from "./components/AddAreaModal";
import { AddTableModal } from "./components/AddTableModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { TableData as Map2DTableData } from "./components/DraggableTable";
import { TableDetailsDrawer } from "./components/TableDetailsDrawer";
import { TableMap2D, Layout, Floor } from "./components/TableMap2D";
import { tableService, TableStatus, floorService, FloorSummary, CubemapImages } from "@/lib/services/tableService";
import { usePageLoading } from "@/components/PageTransitionLoader";
import { App } from "antd";

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  area: string; // floorName from BE
  floorId?: string; // BE floor GUID
  currentOrder?: string;
  reservationTime?: string;
  // Backend fields to preserve
  shape: "Square" | "Circle" | "Rectangle" | "Oval";
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  isActive: boolean;
  cubemap?: {
    px: string;
    nx: string;
    py: string;
    ny: string;
    pz: string;
    nz: string;
  };
  // Backend optional fields — preserved during updates
  has3DView?: boolean;
  viewDescription?: string;
  defaultViewUrl?: string;
  qrCodeUrl?: string;
  // Cubemap 360
  cubeFrontImageUrl?: string;
  cubeRightImageUrl?: string;
  cubeLeftImageUrl?: string;
  cubeTopImageUrl?: string;
  cubeBackImageUrl?: string;
  cubeBottomImageUrl?: string;
}

type ViewMode = "grid" | "map";

export default function TablesPage() {
  const { t } = useTranslation();

  const tDashboard = (key: string, options?: any) => String(t(`dashboard.${key}`, options));
  const { message } = App.useApp();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [qrModal, setQrModal] = useState<{ url: string; number: number; tableId: string } | null>(null);

  const statusConfig = {
    available: {
      color: "bg-green-500",
      text: tDashboard("tables.status.available"),
      badge: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    occupied: {
      color: "bg-[var(--primary)]",
      text: tDashboard("tables.status.occupied"),
      badge:
        "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary-border)]",
    },
    reserved: {
      color: "bg-blue-500",
      text: tDashboard("tables.status.reserved"),
      badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    cleaning: {
      color: "bg-red-500",
      text: tDashboard("tables.status.cleaning"),
      badge: "bg-red-500/10 text-red-500 border-red-500/20",
    },
  };

  /* BE floors state */
  const [beFloors, setBeFloors] = useState<FloorSummary[]>([]);
  /* Add Area Modal State */
  const [addAreaModalOpen, setAddAreaModalOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);
  const [loading] = useState(false);
  usePageLoading(loading);

  // Fetch tables + floors from BE API
  const fetchTables = async () => {
    try {
      const [items, floors] = await Promise.all([
        tableService.getAllTables(),
        floorService.getAllFloors(),
      ]);

      setBeFloors(floors);

      const cacheBust = Date.now();
      const withCacheBust = (url?: string) => {
        if (!url) return undefined;
        return `${url}${url.includes('?') ? '&' : '?'}v=${cacheBust}`;
      };

      const mappedTables: Table[] = items.map(item => {
        let status: Table['status'] = 'available';
        if (item.tableStatusId === TableStatus.Reserved) status = 'reserved';
        if (item.tableStatusId === TableStatus.Occupied) status = 'occupied';
        if (item.tableStatusName?.toLowerCase() === 'cleaning') status = 'cleaning';

        let cubemap: Table["cubemap"] | undefined;
        if (item.defaultViewUrl) {
          try {
            const parsed = JSON.parse(item.defaultViewUrl);
            if (parsed?.px && parsed?.nx && parsed?.py && parsed?.ny && parsed?.pz && parsed?.nz) {
              cubemap = parsed;
            }
          } catch {
            cubemap = undefined;
          }
        }

        return {
          id: item.id,
          number: parseInt(item.code) || 0,
          capacity: item.seatingCapacity,
          status: status,
          area: item.floorName || item.type || 'Indoor',
          floorId: item.floorId,
          shape: (item.shape as any) || 'Square',
          positionX: Number(item.positionX) || 0,
          positionY: Number(item.positionY) || 0,
          width: Number(item.width) || 80,
          height: Number(item.height) || 80,
          rotation: Number(item.rotation) || 0,
          isActive: item.isActive,
          cubemap,
          has3DView: item.has3DView,
          viewDescription: item.viewDescription,
          defaultViewUrl: item.defaultViewUrl,
          qrCodeUrl: item.qrCodeUrl,
          // Cubemap 360
          cubeFrontImageUrl: withCacheBust(item.cubeFrontImageUrl),
          cubeRightImageUrl: withCacheBust(item.cubeRightImageUrl),
          cubeLeftImageUrl: withCacheBust(item.cubeLeftImageUrl),
          cubeTopImageUrl: withCacheBust(item.cubeTopImageUrl),
          cubeBackImageUrl: withCacheBust(item.cubeBackImageUrl),
          cubeBottomImageUrl: withCacheBust(item.cubeBottomImageUrl),
        };
      });
      // DEBUG: show BE positions
      console.log('[Admin] Tables from BE:', mappedTables.map(t => ({ id: t.id, code: t.number, floorId: t.floorId, x: t.positionX, y: t.positionY })));
      setTables(mappedTables);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
    } finally {
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Layout State for Map Mode
  const [layout, setLayout] = useState<Layout | null>(null);

  // Upload floor background image directly to BE
  const handleFloorImageUpload = async (floorId: string, file: File) => {
    try {
      const floor = beFloors.find(f => f.id === floorId);
      await floorService.updateFloor(floorId, {
        name: floor?.name ?? 'Floor',
        width: floor?.width ?? 1400,
        height: floor?.height ?? 900,
        image: file,
      });
      // Refresh floors to get Cloudinary URL
      const updatedFloors = await floorService.getAllFloors();
      setBeFloors(updatedFloors);
    } catch (err) {
      console.error('Failed to upload floor background to BE:', err);
    }
  };

  // Sync Layout with Tables using real BE floors
  useEffect(() => {
    if (beFloors.length === 0 && tables.length === 0) return;

    // Build floors from BE floor data
    const floors: Floor[] = beFloors.map(bf => {
      const floorTables = tables
        .filter(table => table.floorId === bf.id && table.isActive)
        .map(table => ({
          id: table.id,
          tenantId: 'tenant-1',
          name: tDashboard('tables.card.table_name', { number: table.number }),
          seats: table.capacity,
          status: table.status === 'available' ? 'AVAILABLE' : table.status === 'occupied' ? 'OCCUPIED' : table.status === 'reserved' ? 'RESERVED' : 'DISABLED',
          area: table.area,
          position: { x: table.positionX, y: table.positionY },
          shape: table.shape as any,
          width: table.width || 80,
          height: table.height || 80,
          rotation: table.rotation,
        } as Map2DTableData));

      return {
        id: bf.id,
        name: bf.name,
        width: Number(bf.width) || 1400,
        height: Number(bf.height) || 900,
        backgroundImage: bf.imageUrl || undefined,
        tables: floorTables,
      };
    });

    // Also add tables that have no matching BE floor (orphaned — group by area name)
    const assignedTableIds = new Set(floors.flatMap(f => f.tables.map(t => t.id)));
    const orphanedTables = tables.filter(t => t.isActive && !assignedTableIds.has(t.id));
    if (orphanedTables.length > 0) {
      const orphanAreas = Array.from(new Set(orphanedTables.map(t => t.area)));
      for (const areaName of orphanAreas) {
        const areaTables = orphanedTables.filter(t => t.area === areaName);
        floors.push({
          id: `orphan-${areaName}`,
          name: areaName,
          width: 1400,
          height: 900,
          tables: areaTables.map(table => ({
            id: table.id,
            tenantId: 'tenant-1',
            name: tDashboard('tables.card.table_name', { number: table.number }),
            seats: table.capacity,
            status: table.status === 'available' ? 'AVAILABLE' : table.status === 'occupied' ? 'OCCUPIED' : table.status === 'reserved' ? 'RESERVED' : table.status === 'cleaning' ? 'CLEANING' : 'DISABLED',
            area: table.area,
            position: { x: table.positionX, y: table.positionY },
            shape: table.shape as any,
            width: table.width || 80,
            height: table.height || 80,
            rotation: table.rotation,
          } as Map2DTableData)),
        });
      }
    }

    if (floors.length === 0) return;

    setLayout(prev => ({
      id: 'be-layout',
      name: 'My Restaurant',
      activeFloorId: prev?.activeFloorId && floors.some(f => f.id === prev.activeFloorId) ? prev.activeFloorId : floors[0].id,
      floors,
    }));
  }, [tables, beFloors, t]);

  // When layout changes in TableMap2D (table dragged, etc.)
  const handleLayoutChange = async (newLayout: Layout) => {
    setLayout(newLayout);
  };

  const handleMap2DTablePositionChange = async (tableId: string, position: { x: number; y: number; zoneId?: string }) => {
    // Optimistic update in Layout state
    if (!layout) return;

    const updatedFloors = layout.floors.map(f => {
      if (f.id === layout.activeFloorId) {
        return {
          ...f,
          tables: f.tables.map(t => t.id === tableId ? { ...t, position: { x: position.x, y: position.y } } : t)
        };
      }
      return f;
    });

    setLayout({ ...layout, floors: updatedFloors });

    // Update Backend
    try {
      const tableToUpdate = tables.find(t => t.id === tableId);
      if (!tableToUpdate) return;

      // Use layout.activeFloorId as fallback if table has no floorId
      const effectiveFloorId = tableToUpdate.floorId || layout.activeFloorId;

      const apiData: any = {
        id: tableToUpdate.id,
        code: tableToUpdate.number.toString(),
        seatingCapacity: tableToUpdate.capacity,
        type: tableToUpdate.area,
        floorId: effectiveFloorId,
        shape: tableToUpdate.shape,
        positionX: position.x,
        positionY: position.y,
        width: tableToUpdate.width,
        height: tableToUpdate.height,
        rotation: tableToUpdate.rotation,
        isActive: tableToUpdate.isActive,
        tableStatusId: TableStatus.Available
      };

      if (tableToUpdate.status === 'occupied') apiData.tableStatusId = TableStatus.Occupied;
      else if (tableToUpdate.status === 'reserved') apiData.tableStatusId = TableStatus.Reserved;

      console.log('[Admin] Saving table position:', { tableId, x: position.x, y: position.y, floorId: effectiveFloorId });
      await tableService.updateTable(tableId, apiData);
      console.log('[Admin] Table position saved successfully');

      setTables(prev => prev.map(t =>
        t.id === tableId ? { ...t, positionX: position.x, positionY: position.y, floorId: effectiveFloorId } : t
      ));
    } catch (err) {
      console.error("Failed to move table:", err);
      fetchTables();
    }
  };



  // Resize table handler
  const handleMap2DTableResize = async (tableId: string, size: { width: number; height: number }) => {
    if (!layout) return;

    // Optimistic update in Layout state
    const updatedFloors = layout.floors.map(f => {
      if (f.id === layout.activeFloorId) {
        return {
          ...f,
          tables: f.tables.map(t => t.id === tableId ? { ...t, width: size.width, height: size.height } : t)
        };
      }
      return f;
    });
    setLayout({ ...layout, floors: updatedFloors });

    // Update Backend
    try {
      const tableToUpdate = tables.find(t => t.id === tableId);
      if (!tableToUpdate) return;

      const apiData: any = {
        id: tableToUpdate.id,
        code: tableToUpdate.number.toString(),
        seatingCapacity: tableToUpdate.capacity,
        type: tableToUpdate.area,
        floorId: tableToUpdate.floorId || layout.activeFloorId,
        shape: tableToUpdate.shape,
        positionX: tableToUpdate.positionX,
        positionY: tableToUpdate.positionY,
        width: size.width,
        height: size.height,
        rotation: tableToUpdate.rotation,
        isActive: tableToUpdate.isActive,
        tableStatusId: TableStatus.Available
      };

      if (tableToUpdate.status === 'occupied') apiData.tableStatusId = TableStatus.Occupied;
      else if (tableToUpdate.status === 'reserved') apiData.tableStatusId = TableStatus.Reserved;

      await tableService.updateTable(tableId, apiData);

      // Update local tables state
      setTables(prev => prev.map(t =>
        t.id === tableId ? { ...t, width: size.width, height: size.height } : t
      ));
    } catch (err) {
      console.error("Failed to resize table:", err);
      fetchTables();
    }
  };

  // Table Merge Handler
  const handleTableMerge = async (sourceTableId: string, targetTableId: string) => {
    const sourceTable = tables.find(t => t.id === sourceTableId);
    const targetTable = tables.find(t => t.id === targetTableId);

    if (!sourceTable || !targetTable) return;

    if (!confirm(tDashboard("tables.confirm_merge", { defaultValue: "Merge tables? This will combine capacity and hide the source table." }))) {
      return;
    }

    const newCapacity = sourceTable.capacity + targetTable.capacity;

    // Optimistic
    setTables(prev =>
      prev.map(t => {
        if (t.id === sourceTableId) return { ...t, isActive: false };
        if (t.id === targetTableId) return { ...t, capacity: newCapacity };
        return t;
      })
    );

    try {
      await tableService.updateTable(targetTableId, { seatingCapacity: newCapacity, floorId: targetTable.floorId });
      await tableService.updateTable(sourceTableId, { isActive: false, floorId: sourceTable.floorId });
    } catch (err) {
      console.error("Merge failed:", err);
      fetchTables();
    }
  };

  const handleMap2DTableMerge = (sourceTableId: string, targetTableId: string) => {
    handleTableMerge(sourceTableId, targetTableId);
  };

  // CRUD Handlers
  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setDrawerOpen(true);
  };

  const handleMap2DTableClick = (mapTable: Map2DTableData) => {
    const table = tables.find(t => t.id === mapTable.id);
    if (table) {
      handleTableClick(table);
    }
  };

  const handleAddTable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const selectedFloorId = formData.get('area') as string;
      // Find floor name from beFloors to set as type
      const selectedFloor = beFloors.find(f => f.id === selectedFloorId);
      const floorName = selectedFloor?.name || 'Indoor';

      const newTableData = {
        code: (formData.get('number') as string),
        seatingCapacity: parseInt(formData.get('capacity') as string),
        type: floorName,
        floorId: selectedFloorId,
        tableStatusId: TableStatus.Available,
        isActive: true,
        shape: 'Square',
        positionX: 0,
        positionY: 0,
        width: 80,
        height: 80,
        rotation: 0
      };

      await tableService.createTable(newTableData);
      await fetchTables();
      setAddModalOpen(false);
    } catch (err) {
      console.error("Failed to add table:", err);
      alert(
        tDashboard("tables.errors.add_failed"),
      );
    }
  };

  const handleUpdateTable = async (values: Partial<Table>) => {
    if (selectedTable) {
      // Optimistic
      setTables(tables.map(t =>
        t.id === selectedTable.id ? { ...t, ...values } : t
      ));

      try {
        // If ONLY status is being updated, use the optimized endpoint
        const keys = Object.keys(values);
        if (keys.length === 1 && keys[0] === 'status' && values.status) {
          let statusId = TableStatus.Available;
          if (values.status === 'occupied') statusId = TableStatus.Occupied;
          else if (values.status === 'reserved') statusId = TableStatus.Reserved;

          await tableService.updateStatus(selectedTable.id, statusId);
        } else {
          // Full update - preserve all fields
          const apiData: any = {
            id: selectedTable.id,
            code: selectedTable.number.toString(),
            seatingCapacity: selectedTable.capacity,
            type: selectedTable.area,
            floorId: selectedTable.floorId || layout?.activeFloorId,
            shape: selectedTable.shape,
            positionX: selectedTable.positionX,
            positionY: selectedTable.positionY,
            width: selectedTable.width,
            height: selectedTable.height,
            rotation: selectedTable.rotation,
            isActive: selectedTable.isActive,
            tableStatusId: TableStatus.Available,
            // Preserve backend fields
            has3DView: selectedTable.has3DView,
            viewDescription: selectedTable.viewDescription,
            defaultViewUrl: selectedTable.defaultViewUrl,
          };

          if (selectedTable.status === 'occupied') apiData.tableStatusId = TableStatus.Occupied;
          else if (selectedTable.status === 'reserved') apiData.tableStatusId = TableStatus.Reserved;

          if (values.number !== undefined) apiData.code = values.number.toString();
          if (values.capacity !== undefined) apiData.seatingCapacity = values.capacity;
          if (values.area !== undefined) apiData.type = values.area;
          if (values.shape !== undefined) apiData.shape = values.shape;
          if (values.width !== undefined) apiData.width = values.width;
          if (values.height !== undefined) apiData.height = values.height;
          if (values.rotation !== undefined) apiData.rotation = values.rotation;
          if (values.cubemap !== undefined) {
            apiData.defaultViewUrl = JSON.stringify(values.cubemap);
            apiData.has3DView = Boolean(
              values.cubemap?.px && values.cubemap?.nx && values.cubemap?.py && values.cubemap?.ny && values.cubemap?.pz && values.cubemap?.nz,
            );
            apiData.viewDescription = apiData.has3DView ? "Cubemap 360" : null;
          }

          if (values.status !== undefined) {
            if (values.status === 'available') apiData.tableStatusId = TableStatus.Available;
            else if (values.status === 'occupied') apiData.tableStatusId = TableStatus.Occupied;
            else if (values.status === 'reserved') apiData.tableStatusId = TableStatus.Reserved;
          }

          await tableService.updateTable(selectedTable.id, apiData);
        }
      } catch (err) {
        console.error("Update failed", err);
        fetchTables();
      }
      setDrawerOpen(false);
      setSelectedTable(null);
    }
  };

  const handleDeleteTable = () => {
    if (selectedTable) {
      setDeleteConfirmOpen(true);
    }
  };

  const handleSaveCubemap = async (tableId: string, cubemap: CubemapImages, clear: boolean) => {
    const tableToUpdate = tables.find(t => t.id === tableId);
    if (!tableToUpdate) return;

    try {
      const tableData = {
        id: tableToUpdate.id,
        code: String(tableToUpdate.number),
        seatingCapacity: tableToUpdate.capacity,
        type: tableToUpdate.area,
        floorId: tableToUpdate.floorId || layout?.activeFloorId,
        shape: tableToUpdate.shape,
        positionX: tableToUpdate.positionX,
        positionY: tableToUpdate.positionY,
        width: tableToUpdate.width,
        height: tableToUpdate.height,
        rotation: tableToUpdate.rotation,
        isActive: tableToUpdate.isActive,
        tableStatusId: tableToUpdate.status === 'occupied'
          ? TableStatus.Occupied
          : tableToUpdate.status === 'reserved'
            ? TableStatus.Reserved
            : TableStatus.Available,
        has3DView: clear ? false : (Object.values(cubemap).some(Boolean) || tableToUpdate.has3DView),
        viewDescription: tableToUpdate.viewDescription,
        defaultViewUrl: tableToUpdate.defaultViewUrl,
        qrCodeUrl: tableToUpdate.qrCodeUrl,
        // Pass existing cubemap URLs so BE doesn't clear ones we're not replacing
        cubeFrontImageUrl: tableToUpdate.cubeFrontImageUrl,
        cubeRightImageUrl: tableToUpdate.cubeRightImageUrl,
        cubeLeftImageUrl: tableToUpdate.cubeLeftImageUrl,
        cubeTopImageUrl: tableToUpdate.cubeTopImageUrl,
        cubeBackImageUrl: tableToUpdate.cubeBackImageUrl,
        cubeBottomImageUrl: tableToUpdate.cubeBottomImageUrl,
      };

      await tableService.updateTableWithCubemap(tableId, tableData, cubemap, clear);
      message.success(tDashboard('tables.cubemap_saved', { defaultValue: 'Da luu anh 360!' }));
      await fetchTables();
    } catch (err) {
      console.error('Failed to save cubemap:', err);
      message.error(tDashboard('tables.cubemap_save_failed', { defaultValue: 'Luu anh 360 that bai' }));
    }
  };

  const confirmDelete = async () => {
    if (selectedTable) {
      try {
        await tableService.deleteTable(selectedTable.id);
        setTables(tables.filter(t => t.id !== selectedTable.id));
        setDrawerOpen(false);
        setSelectedTable(null);
      } catch (err) {
        console.error("Delete failed", err);
        message.error(tDashboard("tables.errors.cannot_delete_due_to_booking"));
      }
      setDeleteConfirmOpen(false);
    }
  };

  const confirmDeleteZone = async () => {
    if (zoneToDelete) {
      try {
        // Delete floor from BE
        await floorService.deleteFloor(zoneToDelete);

        // Move tables in that floor to the first available floor
        const fallbackFloor = beFloors.find(f => f.id !== zoneToDelete);
        const fallbackArea = fallbackFloor?.name || 'Indoor';
        const tablesToUpdate = tables.filter(t => t.floorId === zoneToDelete);

        for (const t of tablesToUpdate) {
          try {
            if (fallbackFloor) {
              await tableService.updateTable(t.id, { type: fallbackArea, floorId: fallbackFloor.id } as any);
            }
          } catch (e) { console.error(e); }
        }

        // Refresh data from BE
        await fetchTables();
      } catch (err) {
        console.error('Failed to delete floor:', err);
      }

      setZoneToDelete(null);
    }
  };

  const handleAddArea = async (name: string) => {
    // Create a real floor on the BE
    try {
      await floorService.createFloor({ name, width: 1400, height: 900 });
      // Refresh floors from BE
      const updatedFloors = await floorService.getAllFloors();
      setBeFloors(updatedFloors);
      setAddAreaModalOpen(false);
    } catch (err) {
      console.error('Failed to create floor on BE:', err);
      // Fallback: show error
      alert(
        tDashboard("tables.errors.create_floor_failed"),
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-base)]">
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
                {tDashboard("tables.title")}
              </h2>
              <p style={{ color: "var(--text-muted)" }}>
                {tDashboard("tables.subtitle")}
              </p>
            </div>

            {/* View Mode & Actions */}
            <div className="flex gap-2">
              <div className="flex items-center bg-[var(--card)] p-1 rounded-lg border border-[var(--border)]">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-all ${viewMode === "grid"
                    ? "bg-[var(--bg-base)] shadow-sm text-[var(--text)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}>
                  {/* Grid Icon */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`p-2 rounded-md transition-all ${viewMode === "map"
                    ? "bg-[var(--bg-base)] shadow-sm text-[var(--text)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}>
                  {/* Map Icon */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => setAddAreaModalOpen(true)}
                className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--text)] rounded-lg font-medium transition-all hover:bg-[var(--bg-base)]">
                + {tDashboard("tables.add_floor")}
              </button>
              <button
                onClick={() => setAddModalOpen(true)}
                className="px-4 py-2 text-white rounded-lg font-medium transition-all"
                style={{ background: "var(--primary)" }}
                suppressHydrationWarning>
                + {tDashboard("tables.add_table")}
              </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl p-4 bg-[var(--card)] border border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mt-1 text-[var(--text-muted)]">{tDashboard("tables.stats.total_tables")}</p>
                  <p className="text-3xl font-bold mt-1 text-[var(--text)]">{tables.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-4 bg-[var(--card)] border border-green-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">{tDashboard("tables.stats.available")}</p>
                  <p className="text-3xl font-bold text-green-500 mt-1">{tables.filter(t => t.status === 'available').length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-4 bg-[var(--card)] border border-[var(--primary)]/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">{tDashboard("tables.stats.occupied")}</p>
                  <p className="text-3xl font-bold text-[var(--primary)] mt-1">{tables.filter(t => t.status === 'occupied').length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-4 bg-[var(--card)] border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">{tDashboard("tables.stats.reserved")}</p>
                  <p className="text-3xl font-bold text-blue-500 mt-1">{tables.filter(t => t.status === 'reserved').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2D Map View */}
          {viewMode === "map" && layout && (
            <div className="h-[calc(100vh-280px)]">
              <TableMap2D
                layout={layout}
                onLayoutChange={handleLayoutChange}
                onTableClick={handleMap2DTableClick}
                onTablePositionChange={handleMap2DTablePositionChange}
                onTableMerge={handleMap2DTableMerge}
                onTableResize={handleMap2DTableResize}
                onBackgroundImageUpload={handleFloorImageUpload}

                readOnly={false}
                selectedTableIds={selectedTable?.id ? [selectedTable.id] : []}
                renderTableContent={(table) => {
                  const hasOrder = table.status === "OCCUPIED" || table.status === "RESERVED";
                  return hasOrder && (
                    <div className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full" />
                  );
                }}
              />
            </div>
          )}


          <h3
            className="text-xl font-bold mb-6"
            style={{ color: "var(--text)" }}>
            {tDashboard("tables.title")}
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
                      {tDashboard("tables.card.table_name", {
                        number: table.number,
                      })}
                    </h4>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      {table.area}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[table.status].badge
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
                      {tDashboard("tables.card.capacity", {
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
                        {tDashboard("tables.card.order")}:{" "}
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
                        {tDashboard("tables.card.reserved_at")}{" "}
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
                    {tDashboard("tables.card.view_details")}
                  </button>

                  {/* QR Button — only show if qrCodeUrl exists */}
                  {table.qrCodeUrl && (
                    <button
                      title="Xem QR Code"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQrModal({ url: table.qrCodeUrl!, number: table.number, tableId: table.id });
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: "var(--surface)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--primary)";
                        e.currentTarget.style.borderColor = "var(--primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-muted)";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                      suppressHydrationWarning>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <path d="M14 14h2v2h-2zM18 14h3M14 18v3M18 18h3v3h-3z" />
                      </svg>
                    </button>
                  )}
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

        </div >
      </main >

      {/* Table Details Drawer */}
      < TableDetailsDrawer
        open={drawerOpen}
        table={selectedTable}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTable(null);
        }
        }
        onSave={handleUpdateTable}
        onSaveCubemap={handleSaveCubemap}
        onDelete={handleDeleteTable}
      />

      {/* Add Table Modal */}
      < AddTableModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddTable}
        floors={beFloors.map(f => ({ id: f.id, name: f.name }))}
      />

      {/* Add Area Modal */}
      < AddAreaModal
        open={addAreaModalOpen}
        onClose={() => setAddAreaModalOpen(false)}
        onAdd={handleAddArea}
      />

      {/* Delete Confirmation Modal for Table */}
      < DeleteConfirmModal
        open={deleteConfirmOpen}
        itemName={selectedTable?.number || 0}
        itemType="Table"
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* Delete Confirmation Modal for Zone */}
      < DeleteConfirmModal
        open={!!zoneToDelete}
        itemName={zoneToDelete || ""}
        itemType="Floor"
        onClose={() => setZoneToDelete(null)}
        onConfirm={confirmDeleteZone}
      />

      {/* ── QR Code Modal ── */}
      {qrModal && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setQrModal(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1100,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(6px)',
            }}
          />

          {/* Card */}
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1101,
            background: 'var(--card)',
            borderRadius: 20,
            border: '1px solid var(--border)',
            boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5)',
            width: 280,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 20px 14px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M14 14h2v2h-2zM18 14h3M14 18v3M18 18h3v3h-3z" />
                </svg>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                  QR — Bàn {qrModal.number}
                </span>
              </div>
              <button
                onClick={() => setQrModal(null)}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '4px 6px', cursor: 'pointer',
                  display: 'flex', color: 'var(--text-muted)',
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* QR Image */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 16, padding: '20px',
            }}>
              <div style={{
                padding: 12, background: '#fff',
                borderRadius: 14,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}>
                <img
                  src={qrModal.url}
                  alt={`QR Code bàn ${qrModal.number}`}
                  width={160} height={160}
                  style={{ display: 'block', borderRadius: 4 }}
                />
              </div>

              <p style={{
                margin: 0, fontSize: 11,
                color: 'var(--text-muted)',
                textAlign: 'center',
                letterSpacing: '0.04em',
              }}>
                Khách hàng quét để đặt món
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button
                  onClick={() => {
                    const tableLink = typeof window !== "undefined"
                      ? `${window.location.origin}/customer/${qrModal.tableId}`
                      : `/customer/${qrModal.tableId}`;
                    navigator.clipboard.writeText(tableLink).then(() => {
                      message.success("Đã copy link đặt món");
                    });
                  }}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 10,
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Copy link
                </button>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = qrModal.url;
                    a.download = `table-${qrModal.number}-qr.png`;
                    a.target = '_blank';
                    a.click();
                  }}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                    color: '#fff',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    boxShadow: '0 2px 10px var(--primary-glow)',
                  }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Tải QR
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div >
  );
}
