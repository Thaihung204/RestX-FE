import axiosInstance from './axiosInstance';
import adminAxiosInstance from './adminAxiosInstance';

// ─────────────────────────────────────────────
// Shared Types
// ─────────────────────────────────────────────

export interface ReservationStatus {
    id: number;
    code: string;     // "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED"
    name: string;     // "Chờ xác nhận" | ...
    colorCode: string;
}

export interface ReservationTableItem {
    id: string;
    code: string;
    capacity: number;
    floorName: string;
}

// ─────────────────────────────────────────────
// POST /api/reservations — Create
// ─────────────────────────────────────────────

export interface CreateReservationRequest {
    tableIds: string[];
    reservationDateTime: string;  // ISO: "2026-02-25T19:00:00"
    numberOfGuests: number;
    specialRequests?: string;
    // Guest (chưa đăng nhập) — required khi không có token
    guestName?: string;
    guestPhone?: string;
    guestEmail?: string;
}

export interface CreateReservationResponse {
    id: string;
    confirmationCode: string;
    tables: ReservationTableItem[];
    reservationDateTime: string;
    numberOfGuests: number;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    specialRequests?: string;
    status: ReservationStatus;
    depositAmount: number;
    depositPaid: boolean;
    createdAt: string;
}

// ─────────────────────────────────────────────
// GET /api/reservations — Admin List
// ─────────────────────────────────────────────

export interface GetReservationsParams {
    pageNumber?: number;
    pageSize?: number;
    search?: string;             // tìm theo contactName, contactPhone, confirmationCode
    sortBy?: string;             // e.g. "reservationDateTime"
    sortDescending?: boolean;
    statusId?: number;
    date?: string;               // "2026-02-25"
    tableId?: string;
}

export interface ReservationListItem {
    id: string;
    confirmationCode: string;
    tables: Pick<ReservationTableItem, 'code' | 'floorName'>[];
    reservationDateTime: string;
    numberOfGuests: number;
    contactName: string;
    contactPhone: string;
    isGuest: boolean;
    status: ReservationStatus;
    depositPaid: boolean;
    createdAt: string;
}

export interface PaginatedReservations {
    items: ReservationListItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

// ─────────────────────────────────────────────
// GET /api/reservations/{id} — Detail
// ─────────────────────────────────────────────

export interface ReservationContact {
    name: string;
    phone: string;
    email: string;
    isGuest: boolean;
    customerId: string | null;
    membershipLevel: string | null;
    loyaltyPoints: number | null;
}

export interface ReservationDetail {
    id: string;
    confirmationCode: string;
    tables: ReservationTableItem[];
    reservationDateTime: string;
    numberOfGuests: number;
    contact: ReservationContact;
    specialRequests?: string;
    status: ReservationStatus;
    depositAmount: number;
    depositPaid: boolean;
    checkedInAt: string | null;
    createdAt: string;
    updatedAt: string;
}

// ─────────────────────────────────────────────
// GET /api/reservations/check-availability
// ─────────────────────────────────────────────

export interface CheckAvailabilityParams {
    date: string;       // "2026-02-25"
    time: string;       // "19:00"
    numberOfGuests?: number;
}

export interface AvailableTableItem {
    id: string;
    code: string;
    capacity: number;
    floorName: string;
    isAvailable: boolean;
}

// ─────────────────────────────────────────────
// GET /api/reservations/lookup — Guest
// ─────────────────────────────────────────────

export interface LookupReservationParams {
    code: string;   // confirmationCode e.g. "RX-B17F1B"
    phone: string;
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

export const reservationService = {

    /** POST /api/reservations — Guest hoặc Customer tạo đặt bàn */
    createReservation: async (data: CreateReservationRequest): Promise<CreateReservationResponse> => {
        const response = await axiosInstance.post<{ success: boolean; data: CreateReservationResponse }>(
            '/reservations',
            data
        );
        return response.data.data;
    },

    /** GET /api/reservations — Admin xem toàn bộ danh sách (có filter/sort/paging) */
    getReservations: async (params: GetReservationsParams = {}): Promise<PaginatedReservations> => {
        const response = await adminAxiosInstance.get<{ success: boolean; data: PaginatedReservations }>(
            '/reservations',
            { params }
        );
        return response.data.data;
    },

    /** GET /api/reservations/{id} — Xem chi tiết 1 reservation (Admin hoặc Customer) */
    getReservationById: async (id: string): Promise<ReservationDetail> => {
        const response = await adminAxiosInstance.get<{ success: boolean; data: ReservationDetail }>(
            `/reservations/${id}`
        );
        return response.data.data;
    },

    /** PUT /api/reservations/{id}/status — Admin cập nhật trạng thái */
    updateReservationStatus: async (id: string, statusId: number): Promise<void> => {
        await adminAxiosInstance.put(`/reservations/${id}/status`, { statusId });
    },

    /** DELETE /api/reservations/{id} — Admin huỷ nhanh (soft cancel) */
    deleteReservation: async (id: string): Promise<void> => {
        await adminAxiosInstance.delete(`/reservations/${id}`);
    },

    /** GET /api/reservations/my — Customer xem đặt bàn của chính họ */
    getMyReservations: async (): Promise<ReservationListItem[]> => {
        const response = await axiosInstance.get<{ success: boolean; data: ReservationListItem[] }>(
            '/reservations/my'
        );
        return response.data.data;
    },

    /** GET /api/reservations/lookup — Guest tra cứu bằng confirmationCode + phone */
    lookupReservation: async (params: LookupReservationParams): Promise<ReservationDetail> => {
        const response = await axiosInstance.get<{ success: boolean; data: ReservationDetail }>(
            '/reservations/lookup',
            { params }
        );
        return response.data.data;
    },

    /** GET /api/reservations/check-availability — Kiểm tra bàn còn trống */
    checkAvailability: async (params: CheckAvailabilityParams): Promise<AvailableTableItem[]> => {
        const response = await axiosInstance.get<{ success: boolean; data: AvailableTableItem[] }>(
            '/reservations/check-availability',
            { params }
        );
        return response.data.data;
    },

    // ── Status ID Constants (theo BE StatusValue) ──────────────────────────
    STATUS_ID: {
        PENDING: 1,
        CONFIRMED: 2,
        CHECKED_IN: 3,
        COMPLETED: 4,
        CANCELLED: 5,
    } as const,
};

export default reservationService;
