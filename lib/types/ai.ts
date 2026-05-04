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

export interface AIComboItem {
  dishId: string;
  dishName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  imageUrl?: string | null;
  reason?: string;
  category?: string;
}

export interface AIComboSuggestion {
  comboId: string;
  comboName: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  reason?: string;
  items: AIComboItem[];
  totalPrice: number;
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
  combos?: AIComboSuggestion[];
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
  combos?: AIComboSuggestion[];
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
  prompt: string;
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
