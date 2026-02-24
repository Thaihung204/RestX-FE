import axiosInstance from './axiosInstance';

export interface CreateReservationRequest {
    tableId: string;
    reservationDate: string;
    startTime: string;
    partySize: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    note?: string;
}

export interface ReservationResponse {
    id: string;
    tableId: string;
    reservationDate: string;
    startTime: string;
    partySize: number;
    customerName: string;
    status: string;
    confirmationCode?: string;
}

export const reservationService = {
    createReservation: async (data: CreateReservationRequest): Promise<ReservationResponse> => {
        const response = await axiosInstance.post<ReservationResponse>('/reservations', data);
        return response.data;
    }
};

export default reservationService;
