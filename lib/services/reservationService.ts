import axiosInstance from './axiosInstance';

// ─────────────────────────────────────────────
// Shared Types
// ─────────────────────────────────────────────

export interface ReservationStatus {
    id: number;
    code: string;
    name: string;
    colorCode: string;
}

export interface ReservationTableItem {
    id: string;
    code: string;
    capacity: number;
    floorName: string;
}

export interface ApiEnvelope<T> {
    success: boolean;
    data: T;
    message?: string;
}

// ─────────────────────────────────────────────
// POST /api/reservations — Create (guest hoặc customer login)
// ─────────────────────────────────────────────

export interface CreateReservationRequest {
    tableIds: string[];
    reservationDateTime: string;
    numberOfGuests: number;
    specialRequests?: string;
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
    contact: {
        name: string;
        phone: string;
        email: string | null;
        isGuest: boolean;
        customerId: string | null;
        membershipLevel: string | null;
        loyaltyPoints: number | null;
    };
    specialRequests?: string;
    status: ReservationStatus;
    depositAmount: number;
    depositPaid: boolean;
    createdAt: string;
    updatedAt?: string;
}

// ─────────────────────────────────────────────
// GET /api/reservations — Manager/Admin list
// ─────────────────────────────────────────────

export interface GetReservationsParams {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortDescending?: boolean;
    statusId?: number;
    date?: string;
    tableId?: string;
}

export interface ReservationListItem {
    id: string;
    confirmationCode: string;
    tables: Pick<ReservationTableItem, 'id' | 'code' | 'capacity' | 'floorName'>[];
    reservationDateTime: string;
    numberOfGuests: number;
    contactName: string;
    contactPhone: string;
    isGuest: boolean;
    status: ReservationStatus;
    depositAmount?: number;
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
    email: string | null;
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
    tableIds?: string[];
    reservationDateTime?: string;
    bufferMinutes?: number;

    // backward-compatible input
    date?: string;
    time?: string;
    numberOfGuests?: number;
}

export interface CheckAvailabilityConflict {
    tableId: string;
    tableCode: string;
    conflictTime: string;
    conflictStatus: string;
}

export interface CheckAvailabilityResponse {
    available: boolean;
    conflictingSlots: CheckAvailabilityConflict[];
}

// ─────────────────────────────────────────────
// GET /api/reservations/lookup — Guest
// ─────────────────────────────────────────────

export interface LookupReservationParams {
    code?: string; // FE cũ
    confirmationCode?: string; // BE hiện tại
    phone: string;
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

export const reservationService = {
    /** POST /api/reservations — Guest hoặc Customer tạo đặt bàn */
    createReservation: async (data: CreateReservationRequest): Promise<CreateReservationResponse> => {
        const response = await axiosInstance.post<ApiEnvelope<CreateReservationResponse>>('/reservations', data);
        return response.data.data;
    },

    /** GET /api/reservations — Manager/Admin xem danh sách */
    getReservations: async (params: GetReservationsParams = {}): Promise<PaginatedReservations> => {
        const queryParams = {
            PageNumber: params.pageNumber,
            PageSize: params.pageSize,
            Search: params.search,
            SortBy: params.sortBy,
            SortDescending: params.sortDescending,
            StatusId: params.statusId,
            Date: params.date,
            TableId: params.tableId,
        };

        const response = await axiosInstance.get<ApiEnvelope<PaginatedReservations>>('/reservations', {
            params: queryParams,
        });

        return response.data.data;
    },

    /** GET /api/reservations/{id} — Xem chi tiết 1 reservation */
    getReservationById: async (id: string): Promise<ReservationDetail> => {
        const response = await axiosInstance.get<ApiEnvelope<ReservationDetail>>(`/reservations/${id}`);
        return response.data.data;
    },

    /** PUT /api/reservations/{id} — cập nhật reservation */
    updateReservationStatus: async (id: string, statusId: number): Promise<void> => {
        await axiosInstance.put(`/reservations/${id}`, { statusId });
    },

    /** DELETE /api/reservations/{id} — cancel reservation */
    deleteReservation: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/reservations/${id}`);
    },

    /** GET /api/reservations/my — Customer xem đặt bàn của chính họ */
    getMyReservations: async (): Promise<ReservationListItem[]> => {
        const response = await axiosInstance.get<ApiEnvelope<PaginatedReservations | ReservationListItem[]>>('/reservations/my');
        const data = response.data.data as any;
        return Array.isArray(data) ? data : (data?.items ?? []);
    },

    /** GET /api/reservations/lookup — Guest tra cứu bằng confirmationCode + phone */
    lookupReservation: async (params: LookupReservationParams): Promise<ReservationDetail> => {
        const response = await axiosInstance.get<ApiEnvelope<ReservationDetail>>('/reservations/lookup', {
            params: {
                confirmationCode: params.confirmationCode ?? params.code,
                phone: params.phone,
            },
        });
        return response.data.data;
    },

    /** GET /api/reservations/check-availability — Kiểm tra xung đột bàn */
    checkAvailability: async (params: CheckAvailabilityParams): Promise<CheckAvailabilityResponse> => {
        const reservationDateTime = params.reservationDateTime
            ?? ((params.date && params.time) ? `${params.date}T${params.time}:00` : undefined);

        const response = await axiosInstance.get<ApiEnvelope<CheckAvailabilityResponse>>('/reservations/check-availability', {
            params: {
                TableIds: params.tableIds,
                ReservationDateTime: reservationDateTime,
                BufferMinutes: params.bufferMinutes,
            },
            paramsSerializer: {
                indexes: null,
            },
        });

        return response.data.data;
    },

    STATUS_ID: {
        PENDING: 1,
        CONFIRMED: 2,
        CHECKED_IN: 3,
        COMPLETED: 4,
        CANCELLED: 5,
    } as const,
};

export default reservationService;
