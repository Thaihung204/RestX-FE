import axiosInstance from "./axiosInstance";

export interface CashPaymentRequest {
  cashReceive: number;
  promotionCode?: string | null;
  applyMembership?: boolean;
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
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentDetail {
  id: string;
  orderId?: string | null;
  reservationId?: string | null;
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
  status?: number;
  statusName?: string | null;
  purpose?: number;
  purposeName?: string | null;
  customerName?: string | null;
  customer?: {
    id: string;
    fullName: string;
    phone?: string | null;
    email?: string | null;
    membershipLevel?: string | null;
    loyaltyPoints?: number;
  } | null;
  order?: {
    id: string;
    reference?: string | null;
    subTotal?: number;
    discountAmount?: number;
    taxAmount?: number;
    serviceCharge?: number;
    totalAmount?: number;
    items?: Array<{
      id: string;
      dishName: string;
      price: number;
      quantity: number;
      note?: string | null;
      itemStatus?: string | null;
    }>;
    promotions?: any[];
  } | null;
  reservation?: any | null;
  depositPaid?: any | null;
}

class PaymentService {
  async getAllPayments(params?: {
    from?: string;
    to?: string;
    method?: string;
    status?: string;
  }): Promise<PaymentDetail[]> {
    const response = await axiosInstance.get<PaymentDetail[]>("/payments", { params });
    return response.data;
  }

  async getPaymentById(id: string): Promise<PaymentDetail> {
    const response = await axiosInstance.get<PaymentDetail>(`/payments/${id}`);
    return response.data;
  }

  async getReceipt(id: string): Promise<{ blob: Blob; fileName: string }> {
    const response = await axiosInstance.get(`/payments/${id}/receipt`, {
      responseType: "blob",
    });
    const contentDisposition = response.headers["content-disposition"] || "";
    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    const fileName = match ? match[1].replace(/['"]/g, "") : `receipt-${id}.pdf`;
    return { blob: response.data, fileName };
  }

  async payByCash(
    orderId: string,
    cashReceive: number,
    options?: { promotionCode?: string | null; applyMembership?: boolean },
  ): Promise<CashPaymentResponse> {
    const response = await axiosInstance.post<CashPaymentResponse>(
      `/payments/orders/${orderId}/cash`,
      {
        cashReceive,
        promotionCode: options?.promotionCode ?? null,
        applyMembership: options?.applyMembership ?? false,
      },
    );
    return response.data;
  }

  async createPaymentLink(
    orderId: string,
    options?: { isCustomer?: boolean; promotionCode?: string | null; applyMembership?: boolean },
  ): Promise<CreatePaymentLinkResponse> {
    const body: Record<string, unknown> = {
      promotionCode: options?.promotionCode ?? null,
      applyMembership: options?.applyMembership ?? false,
    };
    if (options?.isCustomer) body.isCustomer = true;
    const response = await axiosInstance.post<CreatePaymentLinkResponse>(
      `/payments/orders/${orderId}`,
      body,
    );
    return response.data;
  }
}

const paymentService = new PaymentService();

export default paymentService;
