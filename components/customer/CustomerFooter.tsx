"use client";

import { useThemeMode } from "@/app/theme/AntdProvider";
import AISuggestionPopup from "@/components/customer/AISuggestionPopup";
import CustomerDetails from "@/components/customer/CustomerDetails";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useCart } from "@/lib/contexts/CartContext";
import customerService, {
  CustomerResponseDto,
} from "@/lib/services/customerService";
import reservationService, {
  ReservationListItem,
} from "@/lib/services/reservationService";
import {
  BellOutlined,
  BulbOutlined,
  CloseOutlined,
  GlobalOutlined,
  MoonOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { Button, Modal, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface CustomerFooterProps {
  customerProfile: CustomerResponseDto | null;
  customerName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  onProfileUpdate?: () => void;
  openProfileSignal?: number;
  position?: "sticky" | "fixed";
  bottomPadding?: number;
}

export default function CustomerFooter({
  customerProfile,
  customerName,
  phoneNumber,
  avatarUrl,
  onProfileUpdate,
  openProfileSignal,
  position = "sticky",
  bottomPadding = 12,
}: CustomerFooterProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { cartItemCount, totalCartAmount, openCartModal } = useCart();
  const { t, i18n } = useTranslation();
  const { mode, toggleTheme } = useThemeMode();
  const [messageApi, contextHolder] = message.useMessage();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "reservations">("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [reservations, setReservations] = useState<ReservationListItem[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadReservations = async () => {
    setResLoading(true);
    try {
      const data = await reservationService.getMyReservations();
      setReservations(data);
    } catch {
    } finally {
      setResLoading(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (!confirm(t("customer_page.reservations.cancel_confirm"))) return;
    setCancellingId(id);
    try {
      await reservationService.deleteReservation(id);
      await loadReservations();
      messageApi.success("Đã huỷ đặt bàn thành công");
    } catch {
      messageApi.error("Không thể huỷ. Vui lòng thử lại.");
    } finally {
      setCancellingId(null);
    }
  };

  const [tempName, setTempName] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [tempAvatarUrl, setTempAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPoints = customerProfile?.loyaltyPoints || 0;
  const totalPointsNeeded = 500;
  const progress = Math.min((currentPoints / totalPointsNeeded) * 100, 100);
  const membershipLevel =
    customerProfile?.membershipLevel?.toLowerCase() || "bronze";

  const handleAskService = () => {
    messageApi.success(t("customer_page.footer.service_called"));
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTempAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleEditProfile = () => {
    setTempName(customerName);
    setTempPhone(phoneNumber);
    setTempAvatarUrl(avatarUrl);
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!tempName.trim() || !tempPhone.trim()) {
      messageApi.error(t("customer_page.profile.validation.required_fields"));
      return;
    }
    if (!customerProfile?.id) return;

    setIsSaving(true);
    try {
      const updated = await customerService.updateCustomerProfile(
        customerProfile.id,
        {
          fullName: tempName.trim(),
          phoneNumber: tempPhone.trim(),
        },
      );
      if (updated) {
        setIsEditing(false);
        onProfileUpdate?.();
        messageApi.success(
          t("customer_page.profile.validation.update_success"),
        );
      }
    } catch (error) {
      messageApi.error(t("customer_page.profile.validation.update_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleLanguage = () => {
    const newLang = i18n.language === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
    messageApi.success(
      newLang === "vi"
        ? t("customer_page.footer.language_switched_vi")
        : t("customer_page.footer.language_switched_en"),
    );
  };

  const handleToggleTheme = () => {
    toggleTheme();
    messageApi.success(
      mode === "dark"
        ? t("customer_page.footer.theme_switched_light")
        : t("customer_page.footer.theme_switched_dark"),
    );
  };

  const handleLogout = () => {
    logout();
    setProfileModalOpen(false);
    messageApi.success(t("auth.login_button.logout"));
    router.push("/login");
  };

  const openProfileModal = () => {
    setActiveTab("profile");
    setProfileModalOpen(true);
  };

  useEffect(() => {
    if (!openProfileSignal) return;
    openProfileModal();
  }, [openProfileSignal]);

  const footerBar = (
    <div
      className="w-full"
      style={{
        position: position === "fixed" ? "fixed" : "sticky",
        bottom: 0,
        left: position === "fixed" ? 0 : undefined,
        right: position === "fixed" ? 0 : undefined,
        width: "100%",
        zIndex: position === "fixed" ? 9999 : 50,
        background: "var(--backdrop-blur)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--primary-border)",
        padding: `10px 12px ${bottomPadding}px 12px`,
        boxShadow: "var(--shadow-md)",
      }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}>
        <Button
          icon={
            <img
              src="/images/ai/icons8-robot-50.png"
              alt="AI"
              style={{ width: 20, height: 20, objectFit: "contain" }}
            />
          }
          onClick={() => setAiModalOpen(true)}
          style={{
            height: 44,
            width: 44,
            borderRadius: 10,
            background: "var(--primary-soft)",
            border: "1px solid var(--primary-border)",
            color: "var(--primary)",
            fontSize: 18,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />

        <Button
          icon={<BellOutlined />}
          onClick={handleAskService}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 10,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontWeight: 600,
            fontSize: 13,
          }}>
          {t("customer_page.footer.call_service")}
        </Button>

        <div
          onClick={openCartModal}
          style={{
            flex: 1.2,
            height: 44,
            background: "var(--primary)",
            borderRadius: 10,
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 12px var(--primary-glow)",
            cursor: "pointer",
          }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.1,
            }}>
            <Text
              style={{
                color: "color-mix(in srgb, var(--text-inverse), transparent 30%)",
                fontSize: 10,
                fontWeight: 600,
              }}>
              {cartItemCount} món
            </Text>
            <Text
              style={{
                color: "var(--text-inverse)",
                fontSize: 13,
                fontWeight: 700,
              }}>
              {formatVND(totalCartAmount)}
            </Text>
          </div>
          <ShoppingCartOutlined
            style={{ color: "var(--text-inverse)", fontSize: 18 }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {contextHolder}
      {footerBar}

      <AISuggestionPopup
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
      />

      <Modal
        open={profileModalOpen}
        onCancel={() => {
          setProfileModalOpen(false);
          setIsEditing(false);
        }}
        footer={null}
        centered
        closeIcon={null}
        width="100%"
        style={{ maxWidth: 400, padding: 0 }}
        styles={{
          mask: {
            backdropFilter: "blur(12px)",
            background: "var(--modal-overlay)",
          },
          body: { background: "transparent", padding: 0 },
        }}>
        <div
          style={{
            position: "relative",
            background: "var(--card)",
            borderRadius: 20,
            padding: "30px 24px",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
            overflow: "hidden",
          }}>
          <div
            style={{
              position: "absolute",
              top: -50,
              left: -50,
              width: 150,
              height: 150,
              background: "var(--decoration-glow)",
              borderRadius: "50%",
              filter: "blur(80px)",
              zIndex: 0,
            }}
          />

          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 20,
              background: "var(--surface)",
              borderRadius: 12,
              padding: 4,
              position: "relative",
              zIndex: 1,
            }}>
            {(["profile", "reservations"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "reservations") loadReservations();
                }}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 12,
                  transition: "all 0.2s",
                  background: activeTab === tab ? "var(--primary)" : "transparent",
                  color: activeTab === tab ? "white" : "var(--text-muted)",
                }}>
                {tab === "profile" ? "Hồ sơ" : "Đặt bàn"}
              </button>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              display: "flex",
              gap: 8,
              zIndex: 10,
            }}>
            <div
              onClick={handleToggleLanguage}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "1px solid var(--border)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--primary-soft)";
                e.currentTarget.style.borderColor = "var(--primary-border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}>
              <GlobalOutlined style={{ color: "var(--primary)", fontSize: 14 }} />
            </div>

            <div
              onClick={handleToggleTheme}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "1px solid var(--border)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--warning-soft)";
                e.currentTarget.style.borderColor = "var(--warning-border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}>
              {mode === "dark" ? (
                <BulbOutlined style={{ color: "var(--gold)", fontSize: 14 }} />
              ) : (
                <MoonOutlined style={{ color: "var(--text-muted)", fontSize: 14 }} />
              )}
            </div>
          </div>

          <div
            onClick={() => setProfileModalOpen(false)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
            }}>
            <CloseOutlined style={{ color: "var(--text-muted)", fontSize: 14 }} />
          </div>

          {activeTab === "profile" ? (
            <CustomerDetails
              customerProfile={customerProfile}
              customerName={customerName}
              phoneNumber={phoneNumber}
              avatarUrl={avatarUrl}
              tempName={tempName}
              tempPhone={tempPhone}
              tempAvatarUrl={tempAvatarUrl}
              isEditing={isEditing}
              isSaving={isSaving}
              membershipLevel={membershipLevel}
              currentPoints={currentPoints}
              progress={progress}
              fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
              onFileChange={handleFileChange}
              onEditProfile={handleEditProfile}
              onCancelEdit={() => setIsEditing(false)}
              onSaveProfile={handleSaveProfile}
              onLogout={handleLogout}
              onTempNameChange={setTempName}
              onTempPhoneChange={setTempPhone}
              t={t}
            />
          ) : (
            <div
              style={{
                maxHeight: 420,
                overflowY: "auto",
                position: "relative",
                zIndex: 1,
              }}>
              {resLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "40px 0",
                  }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "2px solid var(--primary)",
                      borderTopColor: "transparent",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                </div>
              ) : reservations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>📅</p>
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    Bạn chưa có đặt bàn nào
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {reservations.map((res) => {
                    const canCancel =
                      res.status.code === "PENDING" || res.status.code === "CONFIRMED";
                    const statusColors: Record<string, string> = {
                      PENDING: "#FFA500",
                      CONFIRMED: "#3b82f6",
                      CHECKED_IN: "#8b5cf6",
                      COMPLETED: "#22c55e",
                      CANCELLED: "#ef4444",
                    };
                    const color = statusColors[res.status.code] ?? "var(--text-muted)";
                    return (
                      <div
                        key={res.id}
                        style={{
                          borderRadius: 12,
                          padding: "12px 14px",
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 700,
                              fontSize: 13,
                              color: "var(--primary)",
                            }}>
                            #{res.confirmationCode}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 20,
                              background: `${color}18`,
                              color,
                              border: `1px solid ${color}33`,
                            }}>
                            {res.status.name}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-muted)",
                            lineHeight: 1.8,
                          }}>
                          <span>
                            📅{" "}
                            {new Date(res.reservationDateTime).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <br />
                          <span>🪑 {res.tables.map((t) => t.code).join(", ")}</span>
                          <span style={{ marginLeft: 12 }}>
                            👥 {res.numberOfGuests} khách
                          </span>
                        </div>

                        {canCancel && (
                          <button
                            onClick={() => handleCancelReservation(res.id)}
                            disabled={cancellingId === res.id}
                            style={{
                              marginTop: 10,
                              width: "100%",
                              padding: "6px 0",
                              borderRadius: 8,
                              border: "1px solid rgba(239,68,68,0.3)",
                              background: "rgba(239,68,68,0.06)",
                              color: "#ef4444",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              opacity: cancellingId === res.id ? 0.5 : 1,
                            }}>
                            {cancellingId === res.id ? "Đang huỷ..." : "Huỷ đặt bàn"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
