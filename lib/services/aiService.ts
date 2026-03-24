import {
    AIChatHistoryResponse,
    AIChatRequest,
    AIChatResponse,
    AIConfirmOrderRequest,
} from "@/lib/types/ai";
import axiosInstance from "./axiosInstance";

export const aiService = {
  getHistory: async (): Promise<AIChatHistoryResponse> => {
    const response = await axiosInstance.get<AIChatHistoryResponse>(
      "/ai/chat/history",
      { withCredentials: true }
    );
    return response.data ?? {};
  },

  chat: async (payload: AIChatRequest): Promise<AIChatResponse> => {
    const response = await axiosInstance.post<AIChatResponse>("/ai/chat", payload, {
      withCredentials: true,
    });
    return response.data;
  },

  confirmOrder: async (payload: AIConfirmOrderRequest): Promise<string> => {
    const response = await axiosInstance.post<string>(
      "/ai/chat/confirm-order",
      payload,
      { withCredentials: true }
    );
    return response.data;
  },
};

export default aiService;
