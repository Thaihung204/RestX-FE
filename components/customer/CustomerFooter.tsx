"use client";

import { useThemeMode } from "@/app/theme/AutoDarkThemeProvider";
import { useCart } from "@/lib/contexts/CartContext";
import customerService, {
  CustomerResponseDto,
} from "@/lib/services/customerService";
import {
  BellOutlined,
  BulbOutlined,
  CameraOutlined,
  CloseOutlined,
  GlobalOutlined,
  MoonOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Input,
  Modal,
  Progress,
  Space,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;

interface CustomerFooterProps {
  customerProfile: CustomerResponseDto | null;
  customerName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  onProfileUpdate?: () => void;
}

export default function CustomerFooter({
  customerProfile,
  customerName,
  phoneNumber,
  avatarUrl,
  onProfileUpdate,
}: CustomerFooterProps) {
  const { cartItemCount, totalCartAmount, openCartModal } = useCart();
  const { t, i18n } = useTranslation();
  const { mode, toggleTheme } = useThemeMode();
  const [messageApi, contextHolder] = message.useMessage();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State tạm thời cho việc chỉnh sửa
  const [tempName, setTempName] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [tempAvatarUrl, setTempAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Các giá trị tính toán
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

  // Profile Handlers (Giữ nguyên logic của bạn)
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

  return (
    <>
      {contextHolder}

      {/* --- Footer bar: 2 dài, 1 ngắn --- */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background:
            "linear-gradient(180deg, rgba(5,5,5,0.9) 0%, rgba(5,5,5,0.98) 100%)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,56,11,0.25)",
          padding: "10px 12px 24px 12px", // Thêm padding bottom cho mobile
          zIndex: 1000,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.6)",
        }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}>
          {/* Nút Ngắn: Hồ sơ */}
          <Button
            icon={<UserOutlined />}
            onClick={() => setProfileModalOpen(true)}
            style={{
              height: 44,
              width: 44,
              borderRadius: 10,
              background: "rgba(255,215,0,0.15)",
              border: "1px solid rgba(255,215,0,0.3)",
              color: "#ffd700",
              fontSize: 18,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />

          {/* Nút Dài 1: Gọi phục vụ */}
          <Button
            icon={<BellOutlined />}
            onClick={handleAskService}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 10,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
            }}>
            {t("customer_page.footer.call_service")}
          </Button>

          {/* Nút Dài 2: Card Giỏ hàng (Thay thế Thanh toán) */}
          <div
            onClick={openCartModal}
            style={{
              flex: 1.2,
              height: 44,
              background: "#FF380B",
              borderRadius: 10,
              padding: "0 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 4px 12px rgba(255, 56, 11, 0.4)",
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
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 10,
                  fontWeight: 600,
                }}>
                {cartItemCount} món
              </Text>
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
                {formatVND(totalCartAmount)}
              </Text>
            </div>
            <ShoppingCartOutlined style={{ color: "#fff", fontSize: 18 }} />
          </div>
        </div>
      </div>

      {/* Profile Modal - Giữ nguyên thiết kế trang trí của bạn */}
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
        style={{ maxWidth: 360, padding: 0 }}
        styles={{
          mask: { backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.6)" },
          body: { background: "transparent", padding: 0 },
        }}>
        <div
          style={{
            position: "relative",
            background: "linear-gradient(160deg, #1f1f1f 0%, #0a0a0a 100%)",
            borderRadius: 24,
            padding: "30px 24px",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9)",
            overflow: "hidden",
          }}>
          {/* Decoration blob */}
          <div
            style={{
              position: "absolute",
              top: -50,
              left: -50,
              width: 150,
              height: 150,
              background: "#FF380B",
              borderRadius: "50%",
              filter: "blur(80px)",
              opacity: 0.15,
              zIndex: 0,
            }}
          />

          {/* Top action buttons */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              display: "flex",
              gap: 8,
              zIndex: 10,
            }}>
            {/* Language toggle */}
            <div
              onClick={handleToggleLanguage}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,56,11,0.15)";
                e.currentTarget.style.borderColor = "rgba(255,56,11,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              }}>
              <GlobalOutlined style={{ color: "#FF380B", fontSize: 14 }} />
            </div>

            {/* Theme toggle */}
            <div
              onClick={handleToggleTheme}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,215,0,0.15)";
                e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              }}>
              {mode === "dark" ? (
                <BulbOutlined style={{ color: "#FFD700", fontSize: 14 }} />
              ) : (
                <MoonOutlined style={{ color: "#888", fontSize: 14 }} />
              )}
            </div>
          </div>

          {/* Close button */}
          <div
            onClick={() => setProfileModalOpen(false)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
            }}>
            <CloseOutlined style={{ color: "#666", fontSize: 14 }} />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 24,
              position: "relative",
              zIndex: 1,
            }}>
            <div
              style={{
                position: "relative",
                width: 88,
                height: 88,
                marginBottom: 16,
              }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
                accept="image/*"
              />

              <div
                onClick={() => isEditing && fileInputRef.current?.click()}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  padding: 3,
                  background: "linear-gradient(135deg, #FF380B 0%, #333 100%)",
                  cursor: isEditing ? "pointer" : "default",
                  boxShadow: "0 10px 25px rgba(255, 56, 11, 0.25)",
                }}>
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: "#141414",
                    overflow: "hidden",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  {tempAvatarUrl || avatarUrl ? (
                    <img
                      src={
                        (isEditing ? tempAvatarUrl || avatarUrl : avatarUrl) ||
                        ""
                      }
                      alt="Avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <UserOutlined style={{ fontSize: 40, color: "#555" }} />
                  )}

                  {isEditing && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backdropFilter: "blur(2px)",
                      }}>
                      <CameraOutlined style={{ color: "#fff", fontSize: 24 }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!isEditing && (
              <div style={{ textAlign: "center" }}>
                <Title
                  level={3}
                  style={{
                    color: "#fff",
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}>
                  {customerName}
                </Title>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 13,
                    marginTop: 4,
                    display: "block",
                  }}>
                  {t("customer_page.profile.loyal_member")}
                </Text>
              </div>
            )}
          </div>

          <div>
            {!isEditing ? (
              <Space orientation="vertical" size={20} style={{ width: "100%" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1px 1fr",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 12,
                    padding: "16px 0",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                  <div style={{ textAlign: "center" }}>
                    <Text
                      style={{
                        color: "#666",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}>
                      {t("customer_page.profile.phone")}
                    </Text>
                    <div
                      style={{
                        color: "#ddd",
                        fontWeight: 600,
                        marginTop: 4,
                        fontFamily: "monospace",
                        fontSize: 15,
                      }}>
                      {phoneNumber.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.1)" }}></div>
                  <div style={{ textAlign: "center" }}>
                    <Text
                      style={{
                        color: "#666",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}>
                      {t("customer_page.profile.member_since")}
                    </Text>
                    <div
                      style={{
                        color: "#ddd",
                        fontWeight: 600,
                        marginTop: 4,
                        fontFamily: "monospace",
                        fontSize: 15,
                      }}>
                      {customerProfile?.createdDate
                        ? dayjs(customerProfile.createdDate).format(
                            "DD/MM/YYYY",
                          )
                        : "--"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)",
                    borderRadius: 16,
                    padding: 20,
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid rgba(255,215,0,0.15)",
                  }}>
                  <div
                    style={{
                      position: "absolute",
                      top: -20,
                      right: -20,
                      width: 80,
                      height: 80,
                      background:
                        "radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%)",
                      borderRadius: "50%",
                      filter: "blur(10px)",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 24,
                    }}>
                    <div>
                      <Text
                        style={{
                          color: "#ffd700",
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: 1,
                          textTransform: "uppercase",
                        }}>
                        {membershipLevel.charAt(0).toUpperCase() +
                          membershipLevel.slice(1)}{" "}
                        Member
                      </Text>
                      <Title
                        level={2}
                        style={{
                          color: "#fff",
                          margin: "4px 0 0",
                          fontSize: 28,
                        }}>
                        {currentPoints}{" "}
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 400,
                            color: "rgba(255,255,255,0.5)",
                          }}>
                          pts
                        </span>
                      </Title>
                    </div>
                    <StarOutlined
                      style={{ fontSize: 24, color: "#ffd700", opacity: 0.8 }}
                    />
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}>
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 11,
                        }}>
                        {t("customer_page.profile.next_reward")}
                      </Text>
                      <Text style={{ color: "#fff", fontSize: 11 }}>
                        {progress.toFixed(0)}%
                      </Text>
                    </div>
                    <Progress
                      percent={progress}
                      strokeColor={{ "0%": "#ffd700", "100%": "#FF380B" }}
                      railColor="rgba(255,255,255,0.1)"
                      showInfo={false}
                      size="small"
                    />
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.3)",
                        fontSize: 10,
                        marginTop: 8,
                        display: "block",
                        fontStyle: "italic",
                      }}>
                      {t("customer_page.profile.points_to_next", {
                        points: Math.max(0, 500 - currentPoints),
                      })}
                    </Text>
                  </div>
                </div>

                <Button
                  type="primary"
                  block
                  onClick={handleEditProfile}
                  style={{
                    height: 46,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: 14,
                    fontWeight: 500,
                  }}>
                  {t("customer_page.profile.edit_profile")}
                </Button>
              </Space>
            ) : (
              <Space orientation="vertical" size={16} style={{ width: "100%" }}>
                <div>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 12,
                      marginLeft: 4,
                    }}>
                    {t("customer_page.profile.name_label")}
                  </Text>
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    style={{ height: 48, marginTop: 4, fontSize: 16 }}
                  />
                </div>

                <div>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 12,
                      marginLeft: 4,
                    }}>
                    {t("customer_page.profile.phone_label")}
                  </Text>
                  <Input
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    placeholder="090xxxxxxx"
                    style={{
                      height: 48,
                      marginTop: 4,
                      fontSize: 16,
                      fontFamily: "monospace",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <Button
                    onClick={() => setIsEditing(false)}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 12,
                      background: "transparent",
                      border: "1px solid #444",
                      color: "#888",
                    }}>
                    {t("customer_page.profile.cancel")}
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleSaveProfile}
                    loading={isSaving}
                    disabled={isSaving}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 12,
                      background: "#FF380B",
                      fontWeight: 600,
                      boxShadow: "0 4px 14px rgba(255, 56, 11, 0.4)",
                    }}>
                    {t("customer_page.profile.save_changes")}
                  </Button>
                </div>
              </Space>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
