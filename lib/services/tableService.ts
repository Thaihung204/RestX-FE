import axiosInstance from './axiosInstance';

export enum TableStatus {
    Available = 0,
    Reserved = 1,
    Occupied = 2
}

export interface TableItem {
    id: string;
    code: string; // Used for Table Number
    type: string; // Used for Area (VIP, Indoor, Outdoor)
    seatingCapacity: number;
    shape: string; // Circle, Square, Rectangle
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    rotation: number;
    isActive: boolean;
    tableStatusId: TableStatus;
    // Backend optional fields — preserved during updates
    has3DView?: boolean;
    viewDescription?: string;
    defaultViewUrl?: string;
    tableStatusName?: string;
    qrCodeUrl?: string;
}

export const tableService = {
    getAllTables: async (): Promise<TableItem[]> => {
        const response = await axiosInstance.get<TableItem[]>('/tables');
        return response.data;
    },

    getTableById: async (id: string): Promise<TableItem> => {
        const response = await axiosInstance.get<TableItem>(`/tables/${id}`);
        return response.data;
    },

    createTable: async (table: Partial<TableItem>): Promise<TableItem> => {
        const response = await axiosInstance.post<TableItem>('/tables', table);
        return response.data;
    },

    updateTable: async (id: string, table: Partial<TableItem>): Promise<TableItem> => {
        const response = await axiosInstance.put<TableItem>(`/tables/${id}`, table);
        return response.data;
    },

    deleteTable: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/tables/${id}`);
    },

    updateStatus: async (id: string, status: TableStatus): Promise<TableItem> => {
        // Backend expects [FromBody] TableStatus status
        // We send it as a JSON number
        const response = await axiosInstance.put<TableItem>(
            `/tables/${id}/status`,
            status,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    },

    getLayout: async (tenantId: string): Promise<LayoutResponse> => {
        const response = await axiosInstance.get<LayoutResponse>(`/public/layout/${tenantId}`);
        return response.data;
    },

    saveLayout: async (layout: LayoutResponse): Promise<void> => {
        await axiosInstance.put('/admin/layout', layout);
    }
};

export interface LayoutResponse {
    id: string;
    name: string;
    activeFloorId: string;
    floors: FloorResponse[];
}

export interface FloorResponse {
    id: string;
    name: string;
    width: number;
    height: number;
    backgroundImage?: string;
    zones: any[];
    tables: TableItem[];
}

export default tableService;
