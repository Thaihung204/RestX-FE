"use client";

import { CloseOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Input, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

const popupBg = "var(--card)";
const headerBg = "var(--surface)";
const chatBodyBg = "var(--bg-base)";

interface SuggestionItem {
  id: string;
  name: string;
  price: number;
  reason: string;
  imageUrl: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: SuggestionItem[];
}

interface AISuggestionPopupProps {
  open?: boolean;
  onClose?: () => void;
}

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

export default function AIFullScreenChat({
  open,
  onClose,
}: AISuggestionPopupProps) {
  const { t } = useTranslation("common");
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Xin chào! Mình là trợ lý AI. Hôm nay bạn muốn ăn gì ngon nào? Mình có vài gợi ý dựa trên thời tiết đang lạnh đây!",
      timestamp: new Date(),
      suggestions: [
        {
          id: "pho-bo",
          name: "Phở bò tái",
          price: 65000,
          reason: "Ấm bụng tức thì",
          imageUrl: "/images/menu/suggestion-pho.jpg",
        },
        {
          id: "lau-thai",
          name: "Lẩu Thái",
          price: 189000,
          reason: "Phù hợp ăn nhóm",
          imageUrl: "/images/menu/suggestion-lau.jpg",
        },
      ],
    },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  if (!open) return null;

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, newUserMsg]);
    setInputValue("");
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
      }}
    >
      <header
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--border)",
          background: headerBg,
          gap: 12,
        }}
      >
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/images/ai/icons8-robot-50.png"
            alt={t("customer_page.ai_popup.robot_alt")}
            style={{ width: 42, height: 42, objectFit: "contain", flexShrink: 0 }}
          />
          <div style={{ flex: 1, textAlign: "center" }}>
            <Title level={5} style={{ margin: 0, fontSize: 16, color: "var(--text)" }}>
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
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            {msg.role === "assistant" ? (
              <img
                src="/images/ai/icons8-robot-50.png"
                alt={t("customer_page.ai_popup.robot_alt")}
                style={{ width: 34, height: 34, objectFit: "contain", flexShrink: 0 }}
              />
            ) : null}

            <div
              style={{
                maxWidth: "80%",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius:
                    msg.role === "user"
                      ? "18px 2px 18px 18px"
                      : "2px 18px 18px 18px",
                  background:
                    msg.role === "user" ? "var(--primary)" : "var(--surface)",
                  color: msg.role === "user" ? "var(--text-inverse)" : "var(--text)",
                  boxShadow: "var(--shadow-sm)",
                  fontSize: 15,
                  lineHeight: "1.5",
                  border: "1px solid var(--border)",
                }}
              >
                {msg.content}
              </div>

              {msg.suggestions && (
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    overflowX: "auto",
                    paddingBottom: 8,
                    marginTop: 4,
                    width: "calc(100vw - 80px)",
                  }}
                >
                  {msg.suggestions.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        minWidth: 200,
                        background: popupBg,
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ height: 100, background: "var(--surface-subtle)" }}>
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <div style={{ padding: 10 }}>
                        <Text strong style={{ display: "block", color: "var(--text)" }}>
                          {item.name}
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
                          }}
                        >
                          {item.reason}
                        </Text>
                        <Button
                          type="primary"
                          size="small"
                          block
                          style={{ marginTop: 8, borderRadius: 6 }}
                        >
                          {t("customer_page.ai_popup.add_item")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <footer
        style={{
          padding: "16px",
          borderTop: "1px solid var(--border)",
          background: popupBg,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}
        >
          {[
            t("customer_page.ai_popup.quick_replies.spicy"),
            t("customer_page.ai_popup.quick_replies.combo_two"),
            t("customer_page.ai_popup.quick_replies.vegetarian"),
          ].map((text) => (
            <Button
              key={text}
              size="small"
              shape="round"
              onClick={() => {
                setInputValue(text);
              }}
              style={{ fontSize: 13 }}
            >
              {text}
            </Button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleSendMessage}
            placeholder={t("customer_page.ai_popup.input_placeholder")}
            style={{
              borderRadius: 24,
              padding: "8px 16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
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
