"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CartModal from "@/components/customer/CartModal";
import CustomerFooter from "@/components/customer/CustomerFooter";
import MenuCTA from "@/components/customer/MenuCTA";
import RestaurantHeader from "@/components/customer/RestaurantHeader";
import WelcomeCard from "@/components/customer/WelcomeCard";
import NotificationSystem from "@/components/notifications/NotificationSystem";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useCart } from "@/lib/contexts/CartContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useTheme } from "@/lib/hooks/useTheme";
import customerService, {
  CustomerResponseDto,
} from "@/lib/services/customerService";
import { ConfigProvider, Space, Typography, message, theme } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const { Text } = Typography;

function isValidGuid(id: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    id,
  );
}

export default function CustomerHomePageByTable() {
  const router = useRouter();
  const params = useParams();
  const rawTableId = params?.tableId;
  const tableId = Array.isArray(rawTableId) ? rawTableId[0] : rawTableId || "";

  const { user } = useAuth();
  const { tenant } = useTenant();
  const { setOrderContext } = useCart();
  const { mode: themeMode } = useTheme();
  const [, contextHolder] = message.useMessage();

  const [customerProfile, setCustomerProfile] =
    useState<CustomerResponseDto | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidGuid(tableId)) {
      router.replace("/404");
    }
  }, [tableId, router]);

  useEffect(() => {
    if (!isValidGuid(tableId)) return;

    setOrderContext({
      tableId,
      customerId: customerProfile?.id || user?.customerId || undefined,
    });
  }, [tableId, customerProfile?.id, user?.customerId, setOrderContext]);

  const loadCustomerProfile = useCallback(async () => {
    if (!user) return;

    try {
      let profile = null;

      if (user.customerId) {
        profile = await customerService.getCustomerProfile(user.customerId);
      } else if (user.email) {
        profile = await customerService.getCustomerByEmail(user.email);
      }

      if (profile) {
        setCustomerProfile(profile);
        setCustomerName(profile.fullName);
        setPhoneNumber(profile.phoneNumber || "");
        setAvatarUrl(
          `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=4F46E5&color=fff`,
        );
      }
    } catch (error) {
      console.error("Failed to load customer profile:", error);
    }
  }, [user]);

  useEffect(() => {
    loadCustomerProfile();
  }, [loadCustomerProfile]);

  const tableLabel = useMemo(() => {
    if (!tableId) return "--";
    return tableId.slice(0, 2).toUpperCase();
  }, [tableId]);

  const handleViewMenu = () => {
    router.push(`/menu/${tableId}`);
  };

  return (
    <ProtectedRoute>
      <ConfigProvider
        theme={{
          algorithm:
            themeMode === "dark"
              ? theme.darkAlgorithm
              : theme.defaultAlgorithm,
          token: {
            colorPrimary: "var(--primary)",
            fontFamily: "'Playfair Display', 'Inter', sans-serif",
            borderRadius: 8,
          },
          components: {
            Message: {
              contentBg: "var(--surface)",
              colorText: "var(--text)",
              borderRadiusLG: 12,
              boxShadow: "var(--shadow-md)",
              fontSize: 13,
              contentPadding: "6px 12px",
            },
            Input: {
              colorBgContainer: "var(--surface)",
              colorBorder: "var(--border)",
              activeBorderColor: "var(--primary)",
              hoverBorderColor: "var(--primary)",
            },
            DatePicker: {
              colorBgContainer: "var(--surface)",
              colorBorder: "var(--border)",
            },
            Modal: {
              contentBg: "transparent",
              boxShadow: "none",
            },
          },
        }}
        form={{ requiredMark: false }}
      >
        <div
          style={{
            minHeight: "100vh",
            background: "var(--bg-base)",
            backgroundImage: `
              radial-gradient(circle at 0% 0%, var(--primary-soft), transparent 45%),
              radial-gradient(circle at 100% 100%, var(--primary-faint), transparent 45%)
            `,
            paddingBottom: -100,
          }}
        >
          {contextHolder}

          <section style={{ position: "relative", marginBottom: -60, zIndex: 1 }}>
            <div
              style={{
                height: 380,
                background:
                  "url(/images/customer/customer.png) no-repeat center center / cover",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, var(--modal-overlay) 0%, var(--bg-base) 100%)",
                }}
              />
            </div>

            <div
              style={{
                maxWidth: 1200,
                margin: "0 auto",
                padding: "0 16px",
                position: "absolute",
                bottom: 80,
                left: 0,
                right: 0,
              }}
            >
              <RestaurantHeader
                restaurantName={tenant?.businessName || tenant?.name || "Restaurant"}
                phone={tenant?.businessPrimaryPhone || "1900 6868"}
                hours={tenant?.businessOpeningHours || "08:00 - 23:00"}
              />
            </div>
          </section>

          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "0 16px",
              position: "relative",
              zIndex: 2,
            }}
          >
            <Space orientation="vertical" size={24} style={{ width: "100%" }}>
              <WelcomeCard
                customerName={customerName}
                tableNumber={tableLabel}
                rank={customerProfile?.membershipLevel}
              />

              <MenuCTA onViewMenu={handleViewMenu} />
            </Space>

            <div style={{ textAlign: "center", marginTop: 48, opacity: 0.5 }}>
              <Text
                style={{
                  color: "var(--text-muted)",
                  fontSize: 12,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Powered by RestX Experience
              </Text>
            </div>
          </div>

          <CustomerFooter
            customerProfile={customerProfile}
            customerName={customerName}
            phoneNumber={phoneNumber}
            avatarUrl={avatarUrl}
            onProfileUpdate={loadCustomerProfile}
            position="sticky"
          />
          <CartModal />
          <NotificationSystem />
        </div>
      </ConfigProvider>
    </ProtectedRoute>
  );
}
