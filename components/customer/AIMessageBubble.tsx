import { AIMessage, AIOrderDraft, AIOrderDraftItem } from "@/lib/types/ai";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface AIMessageBubbleProps {
  msg: AIMessage;
  popupBg: string;
  robotAlt: string;
  formatVND: (amount: number) => string;
  editedDraftItems?: AIOrderDraftItem[];
  onDraftItemsChange: (messageId: string, items: AIOrderDraftItem[]) => void;
  onConfirmOrder: (messageId: string, draft: AIOrderDraft) => void;
  isLoading: boolean;
  isConfirming: boolean;
}

const AssistantIcon = ({ size, robotAlt }: { size: number; robotAlt: string }) => (
  <span
    aria-label={robotAlt}
    role="img"
    style={{
      width: size,
      height: size,
      flexShrink: 0,
      backgroundColor: "var(--text)",
      WebkitMaskImage: 'url("/images/ai/assistant.png")',
      maskImage: 'url("/images/ai/assistant.png")',
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
      WebkitMaskSize: "contain",
      maskSize: "contain",
      display: "inline-block",
    }}
  />
);

export default function AIMessageBubble({
  msg,
  popupBg,
  robotAlt,
  formatVND,
  editedDraftItems,
  onDraftItemsChange,
  onConfirmOrder,
  isLoading,
  isConfirming,
}: AIMessageBubbleProps) {
  const { t } = useTranslation("common");
  const draftItems = editedDraftItems ?? msg.orderDraft?.items ?? [];

  const updateDraftItemQuantity = (dishId: string, nextQuantity: number) => {
    const sourceItems = editedDraftItems ?? msg.orderDraft?.items ?? [];

    const updated = sourceItems.map((item) =>
      item.dishId === dishId ? { ...item, quantity: Math.max(0, nextQuantity) } : item
    );

    onDraftItemsChange(msg.id, updated);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: msg.role === "user" ? "row-reverse" : "row",
        gap: 12,
        alignItems: "flex-start",
      }}>
      {msg.role === "assistant" ? <AssistantIcon size={34} robotAlt={robotAlt} /> : null}

      <div
        style={{
          maxWidth: "calc(100vw - 72px)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
        <div
          style={{
            padding: "12px 16px",
            borderRadius:
              msg.role === "user" ? "18px 2px 18px 18px" : "2px 18px 18px 18px",
            background: msg.role === "user" ? "var(--primary)" : "var(--surface)",
            color: msg.role === "user" ? "var(--text-inverse)" : "var(--text)",
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
                  minWidth: 150,
                  background: popupBg,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                }}>
                <div style={{ height: 100, background: "var(--surface-subtle)" }}>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.dishName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : null}
                </div>
                <div style={{ padding: 10 }}>
                  <Text strong style={{ display: "block", color: "var(--text)" }}>
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
              
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 8,
              }}>
              <Text strong style={{ margin: 0 }}>
                {t("customer_page.ai_popup.order_draft.title")}
              </Text>

              <Button
                type="primary"
                size="small"
                onClick={() => onConfirmOrder(msg.id, msg.orderDraft!)}
                loading={isConfirming}
                disabled={isLoading || isConfirming || draftItems.length === 0}>
                {t("customer_page.ai_popup.order_draft.confirm")}
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                gap: 7,
                overflowX: "auto",
                paddingBottom: 8,
              }}>
              {draftItems.map((item) => (
                <div
                  key={item.dishId}
                  style={{
                    minWidth: "min(260px, calc(100vw - 145px))",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    background: "var(--card)",
                    padding: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}>
                  {/* <div
                    style={{
                      position: "relative",
                      width: 72,
                      height: 72,
                      borderRadius: 10,
                      overflow: "hidden",
                      background: "#1a2336",
                      flexShrink: 0,
                    }}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.dishName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#9bb0d3",
                          fontSize: 11,
                        }}>
                        No image
                      </div>
                    )}
                  </div> */}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      strong
                      style={{
                        display: "block",
                        color: "var(--text)",
                        fontSize: 12,
                        lineHeight: 1.15,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                      {item.dishName}
                    </Text>

                    <Text
                      style={{
                        display: "block",
                        color: "var(--primary)",
                        fontSize: 12,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        marginTop: 1,
                      }}>
                      {formatVND(item.price)}
                    </Text>

                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 6px" }}>
                    {item.quantity > 0 ? (
                      <>
                        <Button
                          type="text"
                          size="small"
                          icon={<MinusOutlined style={{ color: "var(--text)", fontSize: 10 }} />}
                          onClick={() => updateDraftItemQuantity(item.dishId, item.quantity - 1)}
                          disabled={isLoading || isConfirming}
                          style={{
                            border: "1px solid var(--border)",
                            width: 25,
                            height: 25,
                            borderRadius: 7,
                            background: "var(--surface)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            lineHeight: 1,
                          }}
                        />

                        <Text
                          strong
                          style={{ minWidth: 14, textAlign: "center", color: "var(--text)", fontSize: 12 }}>
                          {item.quantity}
                        </Text>

                        <Button
                          type="text"
                          size="small"
                          icon={<PlusOutlined style={{ color: "var(--text)", fontSize: 10 }} />}
                          onClick={() => updateDraftItemQuantity(item.dishId, item.quantity + 1)}
                          disabled={isLoading || isConfirming}
                          style={{
                            border: "1px solid var(--border)",
                            width: 25,
                            height: 25,
                            borderRadius: 7,
                            background: "var(--surface)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            lineHeight: 1,
                          }}
                        />
                      </>
                    ) : (
                      <Button
                        type="primary"
                        shape="circle"
                        icon={<PlusOutlined style={{ fontSize: 12 }} />}
                        onClick={() => updateDraftItemQuantity(item.dishId, 1)}
                        disabled={isLoading || isConfirming}
                        style={{
                          color: "var(--text)",
                          border: "1px solid var(--border)",
                          width: 25,
                          minWidth: 25,
                          height: 25,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            
          </div>
        )}
      </div>
    </div>
  );
}
