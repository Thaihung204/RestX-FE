"use client";

import type { CustomerResponseDto } from "@/lib/services/customerService";
import { CameraOutlined, StarOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Input, Progress, Space, Typography } from "antd";
import dayjs from "dayjs";
import type { ChangeEvent, RefObject } from "react";

const { Text, Title } = Typography;

interface CustomerDetailsProps {
  customerProfile: CustomerResponseDto | null;
  customerName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  tempName: string;
  tempPhone: string;
  tempAvatarUrl: string | null;
  isEditing: boolean;
  isSaving: boolean;
  membershipLevel: string;
  currentPoints: number;
  progress: number;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onEditProfile: () => void;
  onCancelEdit: () => void;
  onSaveProfile: () => void;
  onLogout: () => void;
  onTempNameChange: (value: string) => void;
  onTempPhoneChange: (value: string) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}

export default function CustomerDetails({
  customerProfile,
  customerName,
  phoneNumber,
  avatarUrl,
  tempName,
  tempPhone,
  tempAvatarUrl,
  isEditing,
  isSaving,
  membershipLevel,
  currentPoints,
  progress,
  fileInputRef,
  onFileChange,
  onEditProfile,
  onCancelEdit,
  onSaveProfile,
  onLogout,
  onTempNameChange,
  onTempPhoneChange,
  t,
}: CustomerDetailsProps) {
  return (
    <div>
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
            onChange={onFileChange}
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
              background:
                "linear-gradient(135deg, var(--primary) 0%, var(--primary-tint) 100%)",
              cursor: isEditing ? "pointer" : "default",
              boxShadow: "var(--shadow-md)",
            }}>
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: "var(--surface)",
                overflow: "hidden",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              {tempAvatarUrl || avatarUrl ? (
                <img
                  src={(isEditing ? tempAvatarUrl || avatarUrl : avatarUrl) || ""}
                  alt="Avatar"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <UserOutlined style={{ fontSize: 40, color: "var(--text-muted)" }} />
              )}
            </div>
          </div>

          {isEditing && (
            <div
              style={{
                position: "absolute",
                bottom: 2,
                right: 2,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--card)",
                boxShadow: "var(--shadow-sm)",
              }}>
              <CameraOutlined
                style={{ color: "var(--text-inverse)", fontSize: 14 }}
              />
            </div>
          )}
        </div>

        {!isEditing && (
          <div style={{ textAlign: "center" }}>
            <Title
              level={3}
              style={{
                color: "var(--text)",
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}>
              {customerName}
            </Title>
            <Text
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
                marginTop: 4,
                display: "block",
              }}>
              {t("customer_page.profile.loyal_member")}
            </Text>
          </div>
        )}
      </div>

      {!isEditing ? (
        <Space orientation="vertical" size={20} style={{ width: "100%" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1px 1fr",
              background: "var(--surface)",
              borderRadius: 12,
              padding: "16px 0",
              border: "1px solid var(--border)",
            }}>
            <div style={{ textAlign: "center" }}>
              <Text
                style={{
                  color: "var(--text-muted)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}>
                {t("customer_page.profile.phone")}
              </Text>
              <div
                style={{
                  color: "var(--text)",
                  fontWeight: 600,
                  marginTop: 4,
                  fontFamily: "monospace",
                  fontSize: 15,
                }}>
                {phoneNumber.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}
              </div>
            </div>
            <div style={{ background: "var(--border)" }}></div>
            <div style={{ textAlign: "center" }}>
              <Text
                style={{
                  color: "var(--text-muted)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}>
                {t("customer_page.profile.member_since")}
              </Text>
              <div
                style={{
                  color: "var(--text)",
                  fontWeight: 600,
                  marginTop: 4,
                  fontFamily: "monospace",
                  fontSize: 15,
                }}>
                {customerProfile?.createdDate
                  ? dayjs(customerProfile.createdDate).format("DD/MM/YYYY")
                  : "--"}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "var(--surface)",
              borderRadius: 16,
              padding: 20,
              position: "relative",
              overflow: "hidden",
              border: "1px solid var(--warning-border)",
            }}>
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                background:
                  "radial-gradient(circle, var(--warning-soft) 0%, transparent 70%)",
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
                    color: "var(--gold)",
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
                    color: "var(--text)",
                    margin: "4px 0 0",
                    fontSize: 28,
                  }}>
                  {currentPoints}{" "}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 400,
                      color: "var(--text-muted)",
                    }}>
                    pts
                  </span>
                </Title>
              </div>
              <StarOutlined
                style={{ fontSize: 24, color: "var(--gold)", opacity: 0.8 }}
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
                    color: "var(--text-muted)",
                    fontSize: 11,
                  }}>
                  {t("customer_page.profile.next_reward")}
                </Text>
                <Text style={{ color: "var(--text)", fontSize: 11 }}>
                  {progress.toFixed(0)}%
                </Text>
              </div>
              <Progress
                percent={progress}
                strokeColor={{ "0%": "var(--gold)", "100%": "var(--primary)" }}
                railColor="var(--border)"
                showInfo={false}
                size="small"
              />
              <Text
                style={{
                  color: "var(--text-muted)",
                  fontSize: 10,
                  marginTop: 8,
                  display: "block",
                  fontStyle: "italic",
                  opacity: 0.7,
                }}>
                {t("customer_page.profile.points_to_next", {
                  points: Math.max(0, 500 - currentPoints),
                })}
              </Text>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Button
              block
              onClick={onLogout}
              style={{
                flex: 0.9,
                height: 46,
                borderRadius: 12,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--danger, #ef4444)",
              }}>
              {t("logout", { defaultValue: "Đăng xuất" })}
            </Button>
            <Button
              type="primary"
              block
              onClick={onEditProfile}
              style={{
                flex: 1.3,
                height: 46,
                borderRadius: 12,
                background: "var(--primary)",
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-inverse)",
              }}>
              {t("customer_page.profile.edit_profile")}
            </Button>
          </div>
        </Space>
      ) : (
        <Space orientation="vertical" size={16} style={{ width: "100%" }}>
          <div>
            <Text
              style={{
                color: "var(--text-muted)",
                fontSize: 12,
                marginLeft: 4,
              }}>
              {t("customer_page.profile.name_label")}
            </Text>
            <Input
              value={tempName}
              onChange={(e) => onTempNameChange(e.target.value)}
              placeholder="Nhập tên của bạn"
              style={{
                height: 48,
                marginTop: 4,
                fontSize: 16,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
              styles={{
                input: {
                  background: "var(--surface)",
                  color: "var(--text)",
                },
              }}
            />
          </div>

          <div>
            <Text
              style={{
                color: "var(--text-muted)",
                fontSize: 12,
                marginLeft: 4,
              }}>
              {t("customer_page.profile.phone_label")}
            </Text>
            <Input
              value={tempPhone}
              onChange={(e) => onTempPhoneChange(e.target.value)}
              placeholder="090xxxxxxx"
              style={{
                height: 48,
                marginTop: 4,
                fontSize: 16,
                fontFamily: "monospace",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
              styles={{
                input: {
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontFamily: "monospace",
                },
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <Button
              onClick={onCancelEdit}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}>
              {t("customer_page.profile.cancel")}
            </Button>
            <Button
              type="primary"
              onClick={onSaveProfile}
              loading={isSaving}
              disabled={isSaving}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                background: "var(--primary)",
                fontWeight: 600,
                border: "none",
                color: "var(--text-inverse)",
                boxShadow: "var(--shadow-md)",
              }}>
              {t("customer_page.profile.save_changes")}
            </Button>
          </div>
        </Space>
      )}
    </div>
  );
}
