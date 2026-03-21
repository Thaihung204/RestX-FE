export interface AISuggestionItem {
  dishId: string;
  dishName: string;
  price: number;
  reason: string;
  imageUrl?: string;
}

export interface AIOrderDraftItem {
  dishId: string;
  dishName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface AIOrderDraft {
  tableId?: string | null;
  items: AIOrderDraftItem[];
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: AISuggestionItem[];
  quickReplies?: string[];
  orderDraft?: AIOrderDraft | null;
}

export interface AIChatRequest {
  message: string;
  tableId?: string;
}

export interface AIChatResponse {
  sessionId: string;
  message: string;
  suggestions?: AISuggestionItem[];
  quickReplies?: string[];
  orderDraft?: AIOrderDraft | null;
}

export interface AIConfirmOrderRequest {
  tableId?: string | null;
  items: AIOrderDraftItem[];
}

export interface AIChatHistoryItem {
  role: "user" | "assistant";
  content: string;
  createdDate: string;
  parsed?: AIChatResponse;
}

export interface AIChatHistoryResponse {
  sessionId?: string;
  messages?: AIChatHistoryItem[];
}
