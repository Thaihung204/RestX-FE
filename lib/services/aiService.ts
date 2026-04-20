import {
    AIChatHistoryResponse,
    AIChatRequest,
    AIChatResponse,
  AIContentGenerateRequest,
  AIContentGenerateResponse,
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

  analyzeDashboard: async (payload: { filterType: string; analysisType?: string; fromDate?: string; toDate?: string }): Promise<any> => {
    const response = await axiosInstance.post<any>("/ai/analytics", payload, {
      withCredentials: true,
    });
    return response.data;
  },

  downloadAnalytics: async (payload: any, filterType: string): Promise<Blob> => {
    const response = await axiosInstance.post("/ai/analytics/download", payload, {
      withCredentials: true,
      responseType: "blob",
      params: { filterType },
    });
    return response.data;
  },

  generateContent: async (
    payload: AIContentGenerateRequest,
  ): Promise<AIContentGenerateResponse> => {
    const response = await axiosInstance.post<AIContentGenerateResponse>(
      "/ai/content/generate",
      payload,
    );
    return response.data ?? { variants: [] };
  },
};

export default aiService;
