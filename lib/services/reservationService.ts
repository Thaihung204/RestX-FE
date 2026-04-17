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
    name: string;
    phone: string;
    email: string;
    specialRequests?: string;
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
    paymentDeadline?: string | null;
    checkoutUrl?: string | null;
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
    paymentDeadline?: string | null;
    checkoutUrl?: string | null;
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
    paymentDeadline?: string | null;
    checkoutUrl?: string | null;
    checkedInAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ReservationDepositStatus {
    reservationId: string;
    depositAmount: number;
    paymentDeadline: string | null;
    isPaid: boolean;
    checkoutUrl: string | null;
    paymentStatus?: string | null;
    paymentStatusName?: string | null;
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
    code?: string;
    confirmationCode?: string;
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
    updateReservation: async (
        id: string,
        data: {
            tableIds?: string[];
            reservationDateTime?: string;
            numberOfGuests?: number;
            specialRequests?: string;
        }
    ): Promise<void> => {
        await axiosInstance.put(`/reservations/${id}`, data);
    },

    confirmReservation: async (id: string): Promise<void> => {
        await axiosInstance.post(`/reservations/${id}/confirm`);
    },

    checkInReservation: async (id: string): Promise<void> => {
        await axiosInstance.post(`/reservations/${id}/checkin`);
    },

    completeReservation: async (id: string): Promise<void> => {
        await axiosInstance.post(`/reservations/${id}/complete`);
    },

    /** DELETE /api/reservations/{id} — cancel reservation */
    deleteReservation: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/reservations/${id}`);
    },

    /** GET /api/statuses/reservation — all available reservation statuses */
    getReservationStatuses: async (): Promise<ReservationStatus[]> => {
        const response = await axiosInstance.get<any>('/statuses/reservation');
        const raw = response.data;
        // Handle both bare array and ApiEnvelope<ReservationStatus[]>
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        return [];
    },

    /** PUT /api/reservations/{id}/status — change status by statusId */
    updateReservationStatus: async (id: string, statusId: number): Promise<void> => {
        await axiosInstance.put(`/reservations/${id}/status`, { statusId });
    },

    /** GET /api/reservations/my — Customer xem đặt bàn của chính họ */
    getMyReservations: async (): Promise<ReservationListItem[]> => {
        const response = await axiosInstance.get<ApiEnvelope<PaginatedReservations | ReservationListItem[]>>('/reservations/my');
        const data = response.data.data as any;
        return Array.isArray(data) ? data : (data?.items ?? []);
    },

    /**
     * Lookup reservation by code.
      * Current BE exposes GET /reservations/{code} (AllowAnonymous).
     */
    lookupReservation: async (params: LookupReservationParams): Promise<ReservationDetail> => {
        const confirmationCode = (params.confirmationCode ?? params.code ?? '').trim();
        const response = await axiosInstance.get<ApiEnvelope<ReservationDetail>>(`/reservations/${encodeURIComponent(confirmationCode)}`);
        return response.data.data;
    },

    /** GET /api/reservations/{id}/deposit */
    getDepositStatus: async (id: string): Promise<ReservationDepositStatus> => {
        const response = await axiosInstance.get<ApiEnvelope<ReservationDepositStatus>>(`/reservations/${id}/deposit`);
        return response.data.data;
    },

    /** POST /api/reservations/{id}/deposit/pay */
    createDepositPaymentLink: async (id: string): Promise<{ checkoutUrl: string | null }> => {
        const response = await axiosInstance.post<ApiEnvelope<{ checkoutUrl: string | null }>>(`/reservations/${id}/deposit/pay`);
        return response.data.data;
    },

    /**
     * Check availability is currently not exposed by BE controller.
     * Keep API stable for UI callers by returning "available" fallback.
     */
    checkAvailability: async (_params: CheckAvailabilityParams): Promise<CheckAvailabilityResponse> => {
        return {
            available: true,
            conflictingSlots: [],
        };
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
