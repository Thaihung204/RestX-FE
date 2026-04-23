import {
  DownloadableFile,
  getFileNameFromContentDisposition,
} from "@/lib/utils/fileDownload";
import axiosInstance from "./axiosInstance";

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
  tables: Pick<ReservationTableItem, "id" | "code" | "capacity" | "floorName">[];
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
  paymentStatus?: string | number | null;
  paymentStatusName?: string | null;
  orderId?: string | null;
}

export interface CheckAvailabilityParams {
  tableIds?: string[];
  reservationDateTime?: string;
  bufferMinutes?: number;
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

export interface LookupReservationParams {
  code?: string;
  confirmationCode?: string;
}

const unwrapApiEnvelope = <T>(payload: ApiEnvelope<T> | T): T => {
  const maybeEnvelope = payload as ApiEnvelope<T>;
  if (maybeEnvelope && typeof maybeEnvelope === "object" && "data" in maybeEnvelope) {
    return maybeEnvelope.data;
  }
  return payload as T;
};

export const reservationService = {
  createReservation: async (data: CreateReservationRequest): Promise<CreateReservationResponse> => {
    const response = await axiosInstance.post<ApiEnvelope<CreateReservationResponse>>("/reservations", data);
    return response.data.data;
  },

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

    const response = await axiosInstance.get<ApiEnvelope<PaginatedReservations>>("/reservations", {
      params: queryParams,
    });
    return response.data.data;
  },

  exportReservations: async (params: GetReservationsParams = {}): Promise<DownloadableFile> => {
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

    const response = await axiosInstance.get<Blob>("/reservations/export/csv", {
      params: queryParams,
      responseType: "blob",
    });

    const contentDisposition = response.headers?.["content-disposition"] as string | undefined;

    return {
      blob: response.data,
      fileName: getFileNameFromContentDisposition(contentDisposition, `reservations_${Date.now()}.xlsx`),
    };
  },

  getReservationById: async (id: string): Promise<ReservationDetail> => {
    const response = await axiosInstance.get<ApiEnvelope<ReservationDetail>>(`/reservations/${id}`);
    return response.data.data;
  },

  updateReservation: async (
    id: string,
    data: {
      tableIds?: string[];
      reservationDateTime?: string;
      numberOfGuests?: number;
      specialRequests?: string;
    },
  ): Promise<void> => {
    await axiosInstance.put(`/reservations/${id}`, data);
  },

  confirmReservation: async (id: string): Promise<void> => {
    await axiosInstance.post(`/reservations/${id}/confirm`);
  },

  checkInReservation: async (id: string): Promise<void> => {
    await axiosInstance.post(`/reservations/${id}/checkin`);
  },

  getDepositStatus: async (id: string): Promise<ReservationDepositStatus> => {
    const response = await axiosInstance.get<ApiEnvelope<ReservationDepositStatus> | ReservationDepositStatus>(
      `/reservations/${id}/deposit`,
    );
    return unwrapApiEnvelope(response.data);
  },

  createDepositPaymentLink: async (id: string): Promise<{ checkoutUrl: string | null }> => {
    const response = await axiosInstance.post<ApiEnvelope<{ checkoutUrl: string | null }> | { checkoutUrl: string | null }>(
      `/reservations/${id}/deposit/pay`,
    );
    return unwrapApiEnvelope(response.data);
  },

  completeReservation: async (id: string): Promise<void> => {
    await axiosInstance.post(`/reservations/${id}/complete`);
  },

  deleteReservation: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/reservations/${id}`);
  },

  getReservationStatuses: async (): Promise<ReservationStatus[]> => {
    const response = await axiosInstance.get<any>("/statuses/reservation");
    const raw = response.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  },

  updateReservationStatus: async (id: string, statusId: number): Promise<void> => {
    await axiosInstance.put(`/reservations/${id}/status`, { statusId });
  },

  getMyReservations: async (): Promise<ReservationListItem[]> => {
    const response = await axiosInstance.get<ApiEnvelope<PaginatedReservations | ReservationListItem[]>>(
      "/reservations/my",
    );
    const data = response.data.data as any;
    return Array.isArray(data) ? data : (data?.items ?? []);
  },

  lookupReservation: async (params: LookupReservationParams): Promise<ReservationDetail> => {
    const confirmationCode = (params.confirmationCode ?? params.code ?? "").trim();
    const response = await axiosInstance.get<ApiEnvelope<ReservationDetail>>(
      `/reservations/${encodeURIComponent(confirmationCode)}`,
    );
    return response.data.data;
  },

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
