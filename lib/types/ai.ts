export interface AISuggestionItem {
  dishId: string;
  dishName: string;
  price: number;
  quantity?: number;
  totalPrice?: number;
  category?: string;
  reason: string;
  imageUrl?: string;
}

export interface AIOrderDraftItem {
  dishId: string;
  dishName: string;
  quantity: number;
  price: number;
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

export interface AIContentGenerateRequest {
  dishId?: string | null;
  dishName?: string | null;
  comboId?: string | null;
  comboName?: string | null;
  comboDishes?: string[] | null;
  promotionId?: string | null;
  promotionName?: string | null;
  discountValue?: number | null;
  tone?: string;
  customContext?: string;
  variants?: number;
}

export interface AIContentVariant {
  content: string;
  headline?: string | null;
  score?: number | null;
  scoreNote?: string | null;
}

export interface AIContentGenerateResponse {
  variants: AIContentVariant[];
}
