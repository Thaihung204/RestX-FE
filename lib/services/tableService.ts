import axiosInstance from './axiosInstance';

export enum TableStatus {
    Available = 0,
    Reserved = 1,
    Occupied = 2
}

export interface TableItem {
    id: string;
    code: string;        // Table number/code
    type: string;        // Area type (VIP, Indoor, Outdoor)
    seatingCapacity: number;
    shape: string;       // Circle, Square, Rectangle, Oval
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    rotation: number;
    isActive: boolean;
    tableStatusId: TableStatus;
    floorId?: string;
    floorName?: string;
    // Backend optional fields
    has3DView?: boolean;
    viewDescription?: string;
    defaultViewUrl?: string;
    tableStatusName?: string;
    qrCodeUrl?: string;
}

// ─── Table CRUD Service ────────────────────────────────────────────────────────
export const tableService = {
    /** GET /api/tables — AllowAnonymous */
    getAllTables: async (): Promise<TableItem[]> => {
        const response = await axiosInstance.get<TableItem[]>('/tables');
        return response.data;
    },

    /** GET /api/tables/{id} — AllowAnonymous */
    getTableById: async (id: string): Promise<TableItem> => {
        const response = await axiosInstance.get<TableItem>(`/tables/${id}`);
        return response.data;
    },

    /** POST /api/tables — Requires Admin role */
    createTable: async (table: Partial<TableItem>): Promise<TableItem> => {
        const response = await axiosInstance.post<TableItem>('/tables', table);
        return response.data;
    },

    /** PUT /api/tables/{id} — Requires Admin role */
    updateTable: async (id: string, table: Partial<TableItem>): Promise<TableItem> => {
        const response = await axiosInstance.put<TableItem>(`/tables/${id}`, table);
        return response.data;
    },

    /** DELETE /api/tables/{id} — Requires Admin role */
    deleteTable: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/tables/${id}`);
    },

    /** PUT /api/tables/{id}/status — Requires Auth */
    updateStatus: async (id: string, status: TableStatus): Promise<TableItem> => {
        const response = await axiosInstance.put<TableItem>(
            `/tables/${id}/status`,
            status,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    },
};

// ─── Floor API Types ───────────────────────────────────────────────────────────
// Matches BE DTO: RestX.BLL.DataTranferObjects.Floor

/** Summary DTO returned by GET /api/floors */
export interface FloorSummary {
    id: string;
    name: string;
    width: number;
    height: number;
    imageUrl?: string;   // BackgroundImageUrl
    tableCount?: number;
    isActive?: boolean;
}

/**
 * Full layout DTO returned by GET /api/floors/{id}/layout
 * Matches BE: FloorLayoutResponse
 */
export interface FloorLayoutResponse {
    floor: {
        id: string;
        name: string;
        width: number;
        height: number;
        backgroundImageUrl?: string;
    };
    tables: FloorLayoutTableItem[];
}

/** Matches BE: TableLayoutItem */
export interface FloorLayoutTableItem {
    id: string;
    code: string;
    seatingCapacity: number;
    /** Numeric enum as string: "0"=Available, "1"=Reserved, "2"=Occupied */
    status: string;
    layout: {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
        shape: string;
    };
}

/** Matches BE: SaveLayoutRequest */
export interface SaveLayoutRequest {
    tables: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
    }>;
}

// ─── Floor Service ─────────────────────────────────────────────────────────────
export const floorService = {
    /**
     * GET /api/floors — AllowAnonymous
     * Returns list of all active floors with table count.
     * Response: { success: true, data: FloorSummary[] }
     */
    getAllFloors: async (): Promise<FloorSummary[]> => {
        const response = await axiosInstance.get<{ success: boolean; data: FloorSummary[] }>('/floors');
        return response.data?.data ?? [];
    },

    /**
     * GET /api/floors/{id} — AllowAnonymous
     * Response: { success: true, data: FloorSummary }
     */
    getFloorById: async (id: string): Promise<FloorSummary | null> => {
        const response = await axiosInstance.get<{ success: boolean; data: FloorSummary }>(`/floors/${id}`);
        return response.data?.data ?? null;
    },

    /**
     * GET /api/floors/{floorId}/layout — AllowAnonymous
     * Returns full layout with table positions.
     * Response: { success: true, data: FloorLayoutResponse }
     */
    getFloorLayout: async (floorId: string): Promise<FloorLayoutResponse | null> => {
        const response = await axiosInstance.get<{ success: boolean; data: FloorLayoutResponse }>(`/floors/${floorId}/layout`);
        return response.data?.data ?? null;
    },

    /**
     * PUT /api/floors/{floorId}/layout — Requires Admin role
     * Saves table positions for a floor.
     */
    saveFloorLayout: async (floorId: string, request: SaveLayoutRequest): Promise<void> => {
        await axiosInstance.put(`/floors/${floorId}/layout`, request);
    },

    /**
     * POST /api/floors — Requires Admin role
     * Creates a new floor, optionally with a background image (uploaded to Cloudinary).
     * BE expects [FromForm] Floor DTO.
     */
    createFloor: async (data: { name: string; width?: number; height?: number; image?: File }): Promise<string> => {
        const formData = new FormData();
        formData.append('Name', data.name);
        formData.append('Width', String(data.width ?? 1400));
        formData.append('Height', String(data.height ?? 900));
        formData.append('IsActive', 'true');
        if (data.image) formData.append('Image', data.image);

        const response = await axiosInstance.post<{ success: boolean; data: { id: string } }>('/floors', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data?.data?.id ?? '';
    },

    /**
     * PUT /api/floors/{id} — Requires Admin role
     * Updates floor metadata and/or background image.
     * BE expects [FromForm] Floor DTO with optional IFormFile Image.
     */
    updateFloor: async (id: string, data: { name?: string; width?: number; height?: number; image?: File; isActive?: boolean }): Promise<void> => {
        const formData = new FormData();
        if (data.name !== undefined) formData.append('Name', data.name);
        if (data.width !== undefined) formData.append('Width', String(data.width));
        if (data.height !== undefined) formData.append('Height', String(data.height));
        if (data.isActive !== undefined) formData.append('IsActive', String(data.isActive));
        if (data.image) formData.append('Image', data.image);

        await axiosInstance.put(`/floors/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    /**
     * DELETE /api/floors/{id} — Requires Admin role
     */
    deleteFloor: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/floors/${id}`);
    },
};

export default tableService;
