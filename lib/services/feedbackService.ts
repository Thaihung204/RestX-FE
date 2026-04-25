import axiosInstance from "./axiosInstance";

export interface CreateFeedbackPayload {
  rating: number;
  comment: string | null;
}

const feedbackService = {
  createFeedback: async (orderId: string, payload: CreateFeedbackPayload): Promise<void> => {
    await axiosInstance.post(`/orders/${encodeURIComponent(orderId)}/feedbacks`, payload);
  },
};

export default feedbackService;
