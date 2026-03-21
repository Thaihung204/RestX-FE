"use client";

import AIMessageBubble from "@/components/customer/AIMessageBubble";
import aiService from "@/lib/services/aiService";
import orderService, { OrderRequestDto } from "@/lib/services/orderService";
import {
  AIChatHistoryResponse,
  AIChatRequest,
  AIChatResponse,
  AIMessage,
  AIOrderDraft,
  AIOrderDraftItem,
} from "@/lib/types/ai";
import { CloseOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Input, Typography, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

const popupBg = "var(--card)";
const headerBg = "var(--surface)";
const chatBodyBg = "var(--bg-base)";

interface AISuggestionPopupProps {
  open?: boolean;
  onClose?: () => void;
  tableId?: string;
  customerId?: string;
}

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

export default function AIFullScreenChat({ open, onClose, tableId, customerId }: AISuggestionPopupProps) {
  const { t } = useTranslation("common");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [draftEdits, setDraftEdits] = useState<Record<string, AIOrderDraftItem[]>>({});
  const [messageApi, contextHolder] = message.useMessage();
  const scrollRef = useRef<HTMLDivElement>(null);

  const buildAssistantMessage = (response: AIChatResponse): AIMessage => ({
    id: `${Date.now()}-${Math.random()}`,
    role: "assistant",
    content: response.message,
    timestamp: new Date(),
    suggestions: response.suggestions ?? [],
    quickReplies: response.quickReplies ?? [],
    orderDraft: response.orderDraft
      ? {
          ...response.orderDraft,
          items: response.orderDraft.items.map((draftItem) => {
            const matchedSuggestion = response.suggestions?.find(
              (s) => s.dishId === draftItem.dishId
            );
            return {
              ...draftItem,
              imageUrl: matchedSuggestion?.imageUrl,
            };
          }),
        }
      : null,
  });

  const hydrateHistory = (history: AIChatHistoryResponse) => {
    const historyMessages =
      history.messages?.map((item, idx) => {
        const parsed = item.parsed;
        const content = item.role === "assistant" ? parsed?.message ?? item.content : item.content;
        return {
          id: `${item.createdDate}-${idx}`,
          role: item.role,
          content,
          timestamp: new Date(item.createdDate),
          suggestions: parsed?.suggestions ?? [],
          quickReplies: parsed?.quickReplies ?? [],
          orderDraft: parsed?.orderDraft
            ? {
                ...parsed.orderDraft,
                items: parsed.orderDraft.items.map((draftItem) => {
                  const matchedSuggestion = parsed.suggestions?.find(
                    (s) => s.dishId === draftItem.dishId
                  );
                  return {
                    ...draftItem,
                    imageUrl: matchedSuggestion?.imageUrl,
                  };
                }),
              }
            : null,
        } as AIMessage;
      }) ?? [];

    setMessages(historyMessages);
    setDraftEdits({});
    const lastAssistant = [...historyMessages].reverse().find((msg) => msg.role === "assistant");
    setQuickReplies(lastAssistant?.quickReplies ?? []);
  };

  const fetchHistory = async () => {
    try {
      const data = await aiService.getHistory();
      hydrateHistory(data ?? {});
    } catch {
      setMessages([]);
      setQuickReplies([]);
      setDraftEdits({});
    }
  };

  useEffect(() => {
    if (open) fetchHistory();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading, open]);

  if (!open) return null;

  const sendMessage = async (messageText: string) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isLoading) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: trimmedMessage, timestamp: new Date() },
    ]);
    setInputValue("");
    setIsLoading(true);

    try {
      const requestBody: AIChatRequest = { message: trimmedMessage, ...(tableId ? { tableId } : {}) };
      const data = await aiService.chat(requestBody);
      setMessages((prev) => [...prev, buildAssistantMessage(data)]);
      setQuickReplies(data.quickReplies ?? []);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: "assistant",
          content: t("customer_page.ai_popup.errors.connection"),
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDraftItemsChange = (messageId: string, items: AIOrderDraftItem[]) => {
    setDraftEdits((prev) => ({ ...prev, [messageId]: items }));
  };

  const handleConfirmOrder = async (messageId: string, draft: AIOrderDraft) => {
    if (isConfirming) return;

    const effectiveTableId = draft.tableId ?? tableId;
    const finalItems = draftEdits[messageId] ?? draft.items;

    if (!effectiveTableId || !finalItems?.length) {
      messageApi.error(t("customer_page.ai_popup.errors.missing_order_info"));
      return;
    }

    setIsConfirming(true);
    try {
      const payload: OrderRequestDto = {
        tableId: effectiveTableId,
        ...(customerId ? { customerId } : {}),
        orderDetails: finalItems.map((item) => ({
          dishId: item.dishId,
          quantity: item.quantity,
        })),
      };

      await orderService.createOrder(payload);
      messageApi.success(t("customer_page.ai_popup.order.success"));
    } catch {
      messageApi.error(t("customer_page.ai_popup.order.error"));
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: popupBg, zIndex: 2000, display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease-out" }}>
        <header style={{ padding: "12px 16px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)", background: headerBg, gap: 12 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
            <span aria-label={t("customer_page.ai_popup.robot_alt")} role="img" style={{ width: 42, height: 42, flexShrink: 0, backgroundColor: "var(--text)", WebkitMaskImage: 'url("/images/ai/assistant.png")', maskImage: 'url("/images/ai/assistant.png")', WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain", display: "inline-block" }} />
            <div style={{ flex: 1, textAlign: "center", }}>
              <Title level={5} style={{ margin: 0, fontSize: 16, color: "var(--text)",  display: "block" }}>{t("customer_page.ai_popup.title")}</Title>
            </div>
          </div>
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
        </header>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 24, background: chatBodyBg }}>
          {!messages.length && !isLoading ? (
            <div
              style={{
                flex: 1,
                minHeight: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                borderRadius: 14,
                padding: "24px 12px",
              }}>
              <span
                aria-label={t("customer_page.ai_popup.robot_alt")}
                role="img"
                style={{
                  width: 240,
                  height: 240,
                  flexShrink: 0,
                  backgroundColor: "var(--text-muted)",
                  WebkitMaskImage: 'url("/images/ai/assistant.png")',
                  maskImage: 'url("/images/ai/assistant.png")',
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  display: "inline-block",
                  opacity: 0.2,
                  filter: "blur(2px)",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />

              <div
                style={{
                  textAlign: "center",
                  maxWidth: 320,
                }}>
                <Title level={4} style={{ margin: 0, color: "var(--text)" }}>
                  {t("customer_page.ai_popup.empty_state.title")}
                </Title>
                <Text style={{ color: "var(--text-muted)", display: "block", marginTop: 8 }}>
                  {t("customer_page.ai_popup.empty_state.subtitle")}
                </Text>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <AIMessageBubble
                key={msg.id}
                msg={msg}
                popupBg={popupBg}
                robotAlt={t("customer_page.ai_popup.robot_alt")}
                formatVND={formatVND}
                editedDraftItems={draftEdits[msg.id]}
                onDraftItemsChange={handleDraftItemsChange}
                onConfirmOrder={handleConfirmOrder}
                isLoading={isLoading}
                isConfirming={isConfirming}
              />
            ))
          )}

          {isLoading && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span aria-label={t("customer_page.ai_popup.robot_alt")} role="img" style={{ width: 28, height: 28, backgroundColor: "var(--text)", WebkitMaskImage: 'url("/images/ai/assistant.png")', maskImage: 'url("/images/ai/assistant.png")', WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain", display: "inline-block" }} />
              <Text style={{ color: "var(--text-muted)" }}>{t("customer_page.ai_popup.loading_reply")}</Text>
            </div>
          )}
        </div>

        <footer style={{ padding: "16px", borderTop: "1px solid var(--border)", background: popupBg, display: "flex", flexDirection: "column", gap: 12 }}>
          {!!quickReplies.length && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {quickReplies.map((text) => (
                <Button key={text} size="small" shape="round" onClick={() => sendMessage(text)} disabled={isLoading} style={{ fontSize: 13 }}>{text}</Button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onPressEnter={() => sendMessage(inputValue)} placeholder={t("customer_page.ai_popup.input_placeholder")} disabled={isLoading} style={{ borderRadius: 24, padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
            <Button shape="circle" icon={<SendOutlined />} onClick={() => sendMessage(inputValue)} disabled={!inputValue.trim() || isLoading} />
          </div>
        </footer>

        <style jsx global>{`@keyframes slideUp { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
      </div>
    </>
  );
}
