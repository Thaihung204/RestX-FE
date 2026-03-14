import axiosInstance from "./axiosInstance";

export interface CashPaymentRequest {
  cashReceive: number;
}

export interface CashPaymentResponse {
  paymentId: string;
  amount: number;
  cashReceive: number;
  cashback: number;
}

export interface CreatePaymentLinkResponse {
  paymentId: string;
  orderCode: number;
  checkoutUrl: string;
}

export interface PaymentDetail {
  id: string;
  orderId?: string | null;
  paymentMethodId: string;
  amount: number;
  payOSOrderCode?: number | null;
  checkoutUrl?: string | null;
  transactionId?: string | null;
  cashReceive: number;
  cashback: number;
  paymentDate: string;
  paymentStatusId: number;
  paymentStatusName?: string | null;
  paymentStatusCode?: string | null;
}

class PaymentService {
  async getAllPayments(params?: {
    from?: string;
    to?: string;
    method?: string;
    status?: string;
  }): Promise<PaymentDetail[]> {
    const response = await axiosInstance.get<PaymentDetail[]>("/payments", {
      params,
    });
    return response.data;
  }

  async payByCash(orderId: string, cashReceive: number): Promise<CashPaymentResponse> {
    const response = await axiosInstance.post<CashPaymentResponse>(
      `/payments/orders/${orderId}/cash`,
      { cashReceive },
    );
    return response.data;
  }

  async createPaymentLink(orderId: string): Promise<CreatePaymentLinkResponse> {
    const response = await axiosInstance.post<CreatePaymentLinkResponse>(
      `/payments/orders/${orderId}`,
    );
    return response.data;
  }
}

const paymentService = new PaymentService();

export default paymentService;
