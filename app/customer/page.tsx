"use client";

import MenuCTA from "@/components/customer/MenuCTA";
import RestaurantHeader from "@/components/customer/RestaurantHeader";
import WelcomeCard from "@/components/customer/WelcomeCard";
import NotificationSystem from "@/components/notifications/NotificationSystem";
import {
  BellOutlined,
  CameraOutlined,
  CloseOutlined,
  DollarOutlined,
  EditOutlined,
  StarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  ConfigProvider,
  DatePicker,
  Input,
  Modal,
  Progress,
  Space,
  Typography,
  message,
  theme,
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const { Text, Title } = Typography;

export default function CustomerHomePage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [tableNumber] = useState("C1");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Customer info
  const [customerName, setCustomerName] = useState("Nguyễn Văn A");
  const [phoneNumber, setPhoneNumber] = useState("0901234567");
  const [birthDate, setBirthDate] = useState<dayjs.Dayjs | null>(
    dayjs("1995-03-15")
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Temp state for editing
  const [tempName, setTempName] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [tempBirthDate, setTempBirthDate] = useState<dayjs.Dayjs | null>(null);
  const [tempAvatarUrl, setTempAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPoints = 450;
  const pointsToNextReward = 50;
  const totalPointsNeeded = 500;
  const progress = (currentPoints / totalPointsNeeded) * 100;

  const handleRequestBill = () => {
    messageApi.success("Yêu cầu hóa đơn đã được gửi đến nhân viên!");
  };

  const handleAskService = () => {
    messageApi.success("Nhân viên sẽ đến bàn của bạn ngay!");
  };

  const handleGiveFeedback = () => {
    messageApi.info("Chức năng đánh giá đang được phát triển!");
  };

  const handleViewMenu = () => {
    router.push("/menu");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTempAvatarUrl(url);
    }
  };

  const handleEditProfile = () => {
    setTempName(customerName);
    setTempPhone(phoneNumber);
    setTempBirthDate(birthDate);
    setTempAvatarUrl(avatarUrl);
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    if (!tempName.trim()) {
      messageApi.error("Vui lòng nhập tên!");
      return;
    }
    if (!tempPhone.trim()) {
      messageApi.error("Vui lòng nhập số điện thoại!");
      return;
    }
    // Simple phone validation
    if (!/^[0-9]{10}$/.test(tempPhone.trim())) {
      messageApi.error("Số điện thoại không hợp lệ!");
      return;
    }

    setCustomerName(tempName);
    setPhoneNumber(tempPhone);
    setBirthDate(tempBirthDate);
    setAvatarUrl(tempAvatarUrl);
    setIsEditing(false);
    messageApi.success("Cập nhật thông tin thành công!");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTempAvatarUrl(null);
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#FF380B",
          fontFamily: "'Playfair Display', 'Inter', sans-serif",
          borderRadius: 8,
        },
        components: {
          Message: {
            contentBg: "#ffffff",
            colorText: "#1f1f1f",
            borderRadiusLG: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            fontSize: 13,
            contentPadding: "6px 12px",
          },
          Input: {
            colorBgContainer: "rgba(255,255,255,0.03)",
            colorBorder: "rgba(255,255,255,0.1)",
            activeBorderColor: "#FF380B",
            hoverBorderColor: "rgba(255, 56, 11, 0.5)",
          },
          DatePicker: {
            colorBgContainer: "rgba(255,255,255,0.03)",
            colorBorder: "rgba(255,255,255,0.1)",
          },
          Modal: {
            contentBg: "transparent",
            boxShadow: "none",
          },
        },
      }}>
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#050505",
          backgroundImage: `
            radial-gradient(circle at 0% 0%, rgba(255, 56, 11, 0.15), transparent 40%),
            radial-gradient(circle at 100% 100%, rgba(255, 56, 11, 0.05), transparent 40%)
          `,
          paddingBottom: 100,
        }}>
        {contextHolder}

        {/* Hero Section */}
        <section style={{ position: "relative", marginBottom: -60, zIndex: 1 }}>
          <div
            style={{
              height: 380,
              background:
                "url(/images/customer/customer.png) no-repeat center center / cover",
              position: "relative",
            }}>
            {/* Gradient Overlay for Text Readability */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, #050505 100%)",
              }}
            />
          </div>

          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "0 16px",
              position: "absolute",
              bottom: 80, // Lifted up
              left: 0,
              right: 0,
            }}>
            <RestaurantHeader
              restaurantName="RestX Premium Dining"
              phone="1900 6868"
              hours="08:00 - 23:00"
            />
          </div>
        </section>

        {/* Main Content */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 16px",
            position: "relative",
            zIndex: 2,
          }}>
          <Space orientation="vertical" size={24} style={{ width: "100%" }}>
            <WelcomeCard
              customerName={customerName}
              tableNumber={tableNumber}
            />

            <MenuCTA onViewMenu={handleViewMenu} />
          </Space>

          {/* Footer Branding */}
          <div style={{ textAlign: "center", marginTop: 48, opacity: 0.5 }}>
            <Text
              style={{
                color: "#888",
                fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}>
              Powered by RestX Experience
            </Text>
          </div>
        </div>

        {/* Fixed Footer with Actions */}
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
            padding: "10px 12px",
            zIndex: 100,
            boxShadow: "0 -4px 20px rgba(0,0,0,0.6)",
          }}>
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "flex",
              gap: 6,
            }}>
            <Button
              icon={<UserOutlined />}
              onClick={() => setProfileModalOpen(true)}
              style={{
                height: 44,
                width: 44,
                minWidth: 44,
                borderRadius: 10,
                background: "rgba(255,215,0,0.15)",
                border: "1px solid rgba(255,215,0,0.3)",
                color: "#ffd700",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                flexShrink: 0,
              }}
            />
            <Button
              type="default"
              icon={<BellOutlined />}
              onClick={handleAskService}
              style={{
                flex: 1,
                minWidth: 0,
                height: 44,
                borderRadius: 10,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "0 8px",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                Gọi phục vụ
              </span>
            </Button>
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={handleRequestBill}
              style={{
                flex: 1,
                minWidth: 0,
                height: 44,
                borderRadius: 10,
                background: "#FF380B",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "0 8px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(255,56,11,0.4)",
              }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                Thanh toán
              </span>
            </Button>
          </div>
        </div>

        {/* Profile Modal */}
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
            mask: {
              backdropFilter: "blur(12px)",
              background: "rgba(0,0,0,0.6)",
            },
            wrapper: {
              background: "transparent",
            },
            body: {
              background: "transparent",
              padding: 0,
            },
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
                    background:
                      "linear-gradient(135deg, #FF380B 0%, #333 100%)",
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
                          (isEditing
                            ? tempAvatarUrl || avatarUrl
                            : avatarUrl) || ""
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
                        <CameraOutlined
                          style={{ color: "#fff", fontSize: 24 }}
                        />
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
                    Thành viên thân thiết
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
                        Phone
                      </Text>
                      <div
                        style={{
                          color: "#ddd",
                          fontWeight: 600,
                          marginTop: 4,
                          fontFamily: "monospace",
                          fontSize: 15,
                        }}>
                        {phoneNumber.replace(
                          /(\d{4})(\d{3})(\d{3})/,
                          "$1 $2 $3"
                        )}
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
                        Birthday
                      </Text>
                      <div
                        style={{
                          color: "#ddd",
                          fontWeight: 600,
                          marginTop: 4,
                          fontFamily: "monospace",
                          fontSize: 15,
                        }}>
                        {birthDate ? birthDate.format("DD/MM/YYYY") : "--"}
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
                          Gold Member
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
                          Next Reward
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
                        *Tích thêm {pointsToNextReward} điểm để nhận Voucher
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
                    Chỉnh sửa hồ sơ
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
                      Họ tên
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
                      Số điện thoại
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

                  <div>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 12,
                        marginLeft: 4,
                      }}>
                      Ngày sinh
                    </Text>
                    <DatePicker
                      value={tempBirthDate}
                      onChange={(date) => setTempBirthDate(date)}
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày sinh"
                      style={{
                        width: "100%",
                        height: 48,
                        marginTop: 4,
                        fontSize: 16,
                      }}
                      suffixIcon={<EditOutlined style={{ color: "#666" }} />}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                    <Button
                      onClick={handleCancelEdit}
                      style={{
                        flex: 1,
                        height: 48,
                        borderRadius: 12,
                        background: "transparent",
                        border: "1px solid #444",
                        color: "#888",
                      }}>
                      Hủy
                    </Button>
                    <Button
                      type="primary"
                      onClick={handleSaveProfile}
                      style={{
                        flex: 1,
                        height: 48,
                        borderRadius: 12,
                        background: "#FF380B",
                        fontWeight: 600,
                        boxShadow: "0 4px 14px rgba(255, 56, 11, 0.4)",
                      }}>
                      Lưu thay đổi
                    </Button>
                  </div>
                </Space>
              )}
            </div>
          </div>
        </Modal>
        <NotificationSystem />
      </div>
    </ConfigProvider>
  );
}
