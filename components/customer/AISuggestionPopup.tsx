"use client";

import axiosInstance from "@/lib/services/axiosInstance";
import { CloseOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Input, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

const popupBg = "var(--card)";
const headerBg = "var(--surface)";
const chatBodyBg = "var(--bg-base)";

interface SuggestionItem {
  dishId: string;
  dishName: string;
  price: number;
  reason: string;
  imageUrl?: string;
}

interface OrderDraftItem {
  dishId: string;
  dishName: string;
  quantity: number;
  price: number;
}

interface OrderDraft {
  tableId?: string | null;
  items: OrderDraftItem[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: SuggestionItem[];
  quickReplies?: string[];
  orderDraft?: OrderDraft | null;
}

interface AIChatRequest {
  message: string;
  tableId?: string;
}

interface AIChatResponse {
  sessionId: string;
  message: string;
  suggestions?: SuggestionItem[];
  quickReplies?: string[];
  orderDraft?: OrderDraft | null;
}

interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
  createdDate: string;
  parsed?: AIChatResponse;
}

interface ChatHistoryResponse {
  sessionId?: string;
  messages?: ChatHistoryItem[];
}

interface AISuggestionPopupProps {
  open?: boolean;
  onClose?: () => void;
  tableId?: string;
}

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

export default function AIFullScreenChat({
  open,
  onClose,
  tableId,
}: AISuggestionPopupProps) {
  const { t } = useTranslation("common");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const buildAssistantMessage = (response: AIChatResponse): Message => ({
    id: `${Date.now()}-${Math.random()}`,
    role: "assistant",
    content: response.message,
    timestamp: new Date(),
    suggestions: response.suggestions ?? [],
    quickReplies: response.quickReplies ?? [],
    orderDraft: response.orderDraft ?? null,
  });

  const hydrateHistory = (history: ChatHistoryResponse) => {
    const historyMessages =
      history.messages?.map((item, idx) => {
        const parsed = item.parsed;
        const content =
          item.role === "assistant" ? parsed?.message ?? item.content : item.content;

        return {
          id: `${item.createdDate}-${idx}`,
          role: item.role,
          content,
          timestamp: new Date(item.createdDate),
          suggestions: parsed?.suggestions ?? [],
          quickReplies: parsed?.quickReplies ?? [],
          orderDraft: parsed?.orderDraft ?? null,
        } as Message;
      }) ?? [];

    setMessages(historyMessages);

    const lastAssistant = [...historyMessages]
      .reverse()
      .find((msg) => msg.role === "assistant");
    setQuickReplies(lastAssistant?.quickReplies ?? []);
  };

  const fetchHistory = async () => {
    try {
      const response = await axiosInstance.get<ChatHistoryResponse>("/ai/chat/history", {
        withCredentials: true,
      });
      const data = response.data;
      hydrateHistory(data ?? {});
    } catch {
      setMessages([]);
      setQuickReplies([]);
    }
  };

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, open]);

  if (!open) return null;

  const sendMessage = async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const requestBody: AIChatRequest = {
        message: trimmedMessage,
        ...(tableId ? { tableId } : {}),
      };

      const response = await axiosInstance.post<AIChatResponse>(
        "/ai/chat",
        requestBody,
        { withCredentials: true }
      );

      const assistantMessage = buildAssistantMessage(response.data);
      setMessages((prev) => [...prev, assistantMessage]);
      setQuickReplies(response.data.quickReplies ?? []);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: "assistant",
          content: "Mình đang gặp lỗi kết nối, bạn thử lại giúp mình nhé.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    sendMessage(inputValue);
  };

  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: popupBg,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        animation: "slideUp 0.3s ease-out",
      }}>
      <header
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--border)",
          background: headerBg,
          gap: 12,
        }}>
        <div
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/images/ai/assistant.png"
            alt={t("customer_page.ai_popup.robot_alt")}
            style={{
              width: 42,
              height: 42,
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, textAlign: "center" }}>
            <Title
              level={5}
              style={{ margin: 0, fontSize: 16, color: "var(--text)" }}>
              {t("customer_page.ai_popup.title")}
            </Title>
          </div>
        </div>

        <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
      </header>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          background: chatBodyBg,
        }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: 12,
              alignItems: "flex-start",
            }}>
            {msg.role === "assistant" ? (
              <img
                src="/images/ai/assistant.png"
                alt={t("customer_page.ai_popup.robot_alt")}
                style={{
                  width: 34,
                  height: 34,
                  objectFit: "contain",
                  flexShrink: 0,
                }}
              />
            ) : null}

            <div
              style={{
                maxWidth: "80%",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}>
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius:
                    msg.role === "user"
                      ? "18px 2px 18px 18px"
                      : "2px 18px 18px 18px",
                  background:
                    msg.role === "user" ? "var(--primary)" : "var(--surface)",
                  color:
                    msg.role === "user" ? "var(--text-inverse)" : "var(--text)",
                  boxShadow: "var(--shadow-sm)",
                  fontSize: 15,
                  lineHeight: "1.5",
                  border: "1px solid var(--border)",
                }}>
                {msg.content}
              </div>

              {!!msg.suggestions?.length && (
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    overflowX: "auto",
                    paddingBottom: 8,
                    marginTop: 4,
                    width: "calc(100vw - 80px)",
                  }}>
                  {msg.suggestions.map((item) => (
                    <div
                      key={item.dishId}
                      style={{
                        minWidth: 200,
                        background: popupBg,
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        overflow: "hidden",
                      }}>
                      <div
                        style={{
                          height: 100,
                          background: "var(--surface-subtle)",
                        }}>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.dishName}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : null}
                      </div>
                      <div style={{ padding: 10 }}>
                        <Text
                          strong
                          style={{ display: "block", color: "var(--text)" }}>
                          {item.dishName}
                        </Text>
                        <Text style={{ color: "var(--danger)", fontSize: 12 }}>
                          {formatVND(item.price)}
                        </Text>
                        <Text
                          style={{
                            display: "block",
                            color: "var(--text-muted)",
                            fontSize: 12,
                            marginTop: 4,
                          }}>
                          {item.reason}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!!msg.orderDraft?.items?.length && (
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: 10,
                  }}>
                  <Text strong style={{ display: "block", marginBottom: 6 }}>
                    Bản nháp đơn hàng
                  </Text>
                  {msg.orderDraft.items.map((item) => (
                    <Text key={item.dishId} style={{ display: "block", fontSize: 13 }}>
                      {item.quantity} x {item.dishName} - {formatVND(item.price * item.quantity)}
                    </Text>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <img
              src="/images/ai/assistant.png"
              alt={t("customer_page.ai_popup.robot_alt")}
              style={{ width: 28, height: 28, objectFit: "contain" }}
            />
            <Text style={{ color: "var(--text-muted)" }}>Đang trả lời...</Text>
          </div>
        )}
      </div>

      <footer
        style={{
          padding: "16px",
          borderTop: "1px solid var(--border)",
          background: popupBg,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
        {!!quickReplies.length && (
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
            }}>
            {quickReplies.map((text) => (
              <Button
                key={text}
                size="small"
                shape="round"
                onClick={() => handleQuickReply(text)}
                disabled={isLoading}
                style={{ fontSize: 13 }}>
                {text}
              </Button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleSendMessage}
            placeholder={t("customer_page.ai_popup.input_placeholder")}
            disabled={isLoading}
            style={{
              borderRadius: 24,
              padding: "8px 16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
          <Button
            shape="circle"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          />
        </div>
      </footer>

      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
